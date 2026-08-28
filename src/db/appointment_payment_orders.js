const { db, nowUnix } = require("./index");
const { getAppointmentById } = require("./appointments");

function mapSumupStatusToLocal(status) {
  switch (String(status || "").toUpperCase()) {
    case "PAID":
      return "paid";
    case "FAILED":
      return "failed";
    case "EXPIRED":
      return "expired";
    default:
      return "pending";
  }
}

function serializePayload(payload) {
  try {
    return payload ? JSON.stringify(payload) : null;
  } catch (_error) {
    return null;
  }
}

function resolvePaidAt(checkout) {
  const transaction = Array.isArray(checkout?.transactions)
    ? checkout.transactions.find((item) => item?.status === "SUCCESSFUL")
    : null;
  const parsed = Date.parse(transaction?.timestamp || transaction?.date || checkout?.date || "");
  return Number.isNaN(parsed) ? nowUnix() : Math.floor(parsed / 1000);
}

function getAppointmentPaymentOrderById(id) {
  return db.prepare(`SELECT * FROM appointment_payment_orders WHERE id = ? LIMIT 1`).get(id) || null;
}

function getAppointmentPaymentOrderByCheckoutId(checkoutId) {
  return (
    db
      .prepare(`SELECT * FROM appointment_payment_orders WHERE checkout_id = ? LIMIT 1`)
      .get(checkoutId) || null
  );
}

function getLatestAppointmentPaymentOrder(appointmentId) {
  return (
    db
      .prepare(
        `SELECT * FROM appointment_payment_orders
         WHERE appointment_id = ?
         ORDER BY id DESC LIMIT 1`,
      )
      .get(appointmentId) || null
  );
}

function createAppointmentPaymentOrder({ appointmentId, clientId, amountCents, checkoutReference }) {
  const now = nowUnix();
  const result = db
    .prepare(
      `INSERT INTO appointment_payment_orders (
        appointment_id, client_id, amount_cents, currency, checkout_reference,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, 'EUR', ?, 'pending', ?, ?)`,
    )
    .run(appointmentId, clientId, amountCents, checkoutReference, now, now);
  return getAppointmentPaymentOrderById(result.lastInsertRowid);
}

function createProcessedAppointmentPaymentOrderFromQuote({ appointmentId, clientId, quote }) {
  if (!appointmentId || !clientId || !quote?.checkoutReference || !quote?.paidAt) {
    throw new Error("invalid_paid_quote_order");
  }
  const existing = db
    .prepare(`SELECT * FROM appointment_payment_orders WHERE checkout_reference = ? LIMIT 1`)
    .get(quote.checkoutReference);
  if (existing) return existing;

  const now = nowUnix();
  const result = db
    .prepare(
      `INSERT INTO appointment_payment_orders (
         appointment_id, client_id, amount_cents, currency, checkout_reference,
         checkout_id, hosted_checkout_url, status, sumup_status, paid_at,
         processed_at, sumup_payload, created_at, updated_at
       ) VALUES (?, ?, ?, 'EUR', ?, ?, ?, 'processed', 'PAID', ?, ?, ?, ?, ?)`,
    )
    .run(
      appointmentId,
      clientId,
      Math.max(1, Math.round(Number(quote.amountDueCents || quote.estimatedPriceCents) || 0)),
      quote.checkoutReference,
      quote.checkoutId || null,
      quote.hostedCheckoutUrl || null,
      quote.paidAt,
      quote.paidAt,
      serializePayload(quote.sumupPayload),
      now,
      now,
    );
  return getAppointmentPaymentOrderById(result.lastInsertRowid);
}

function attachAppointmentCheckout(orderId, checkout) {
  db.prepare(
    `UPDATE appointment_payment_orders
     SET checkout_id = ?, hosted_checkout_url = ?, sumup_status = ?,
         sumup_payload = ?, updated_at = ?
     WHERE id = ?`,
  ).run(
    checkout?.id || null,
    checkout?.hosted_checkout_url || null,
    checkout?.status || "PENDING",
    serializePayload(checkout),
    nowUnix(),
    orderId,
  );
  return getAppointmentPaymentOrderById(orderId);
}

function syncAppointmentPaymentOrder(orderId, checkout) {
  const localStatus = mapSumupStatusToLocal(checkout?.status);
  const paidAt = localStatus === "paid" ? resolvePaidAt(checkout) : null;
  db.prepare(
    `UPDATE appointment_payment_orders
     SET checkout_id = COALESCE(?, checkout_id), sumup_status = ?,
         status = CASE WHEN processed_at IS NOT NULL THEN status ELSE ? END,
         paid_at = COALESCE(paid_at, ?),
         hosted_checkout_url = COALESCE(?, hosted_checkout_url),
         sumup_payload = ?, updated_at = ?
     WHERE id = ?`,
  ).run(
    checkout?.id || null,
    checkout?.status || null,
    localStatus,
    paidAt,
    checkout?.hosted_checkout_url || null,
    serializePayload(checkout),
    nowUnix(),
    orderId,
  );
  return getAppointmentPaymentOrderById(orderId);
}

function processPaidAppointmentOrder(orderId, checkout) {
  return db.transaction(() => {
    const order = getAppointmentPaymentOrderById(orderId);
    if (!order) return null;
    if (order.processed_at) {
      return { applied: false, order, appointment: getAppointmentById(order.appointment_id) };
    }

    const appointment = getAppointmentById(order.appointment_id);
    if (!appointment) throw new Error("appointment_not_found");
    const approvedAmount = Number(appointment.approved_price_cents || 0);
    if (approvedAmount <= 0 || approvedAmount !== Number(order.amount_cents)) {
      throw new Error("appointment_amount_mismatch");
    }

    const paidAt = resolvePaidAt(checkout);
    db.prepare(
      `UPDATE appointments
       SET amount_paid_cents = ?, paid_at = ?, price_status = 'approved',
           status = 'confirmed', client_price_approved_at = COALESCE(client_price_approved_at, ?),
           updated_at = ?
       WHERE id = ?`,
    ).run(order.amount_cents, paidAt, paidAt, nowUnix(), appointment.id);

    db.prepare(
      `UPDATE appointment_payment_orders
       SET status = 'processed', sumup_status = 'PAID', paid_at = COALESCE(paid_at, ?),
           processed_at = ?, checkout_id = COALESCE(?, checkout_id),
           hosted_checkout_url = COALESCE(?, hosted_checkout_url),
           sumup_payload = ?, updated_at = ?
       WHERE id = ?`,
    ).run(
      paidAt,
      paidAt,
      checkout?.id || null,
      checkout?.hosted_checkout_url || null,
      serializePayload(checkout),
      nowUnix(),
      orderId,
    );

    return {
      applied: true,
      order: getAppointmentPaymentOrderById(orderId),
      appointment: getAppointmentById(appointment.id),
    };
  })();
}

function listPaidAppointmentOrdersByClient(clientId) {
  return db
    .prepare(
      `SELECT o.*, a.service_label, a.date AS appointment_date
       FROM appointment_payment_orders o
       JOIN appointments a ON a.id = o.appointment_id
       WHERE o.client_id = ? AND o.paid_at IS NOT NULL
       ORDER BY o.paid_at DESC, o.id DESC`,
    )
    .all(clientId);
}

function getPaidAppointmentOrderForClient(clientId, orderId) {
  return (
    db
      .prepare(
        `SELECT o.*, a.service_label, a.date AS appointment_date
         FROM appointment_payment_orders o
         JOIN appointments a ON a.id = o.appointment_id
         WHERE o.id = ? AND o.client_id = ? AND o.paid_at IS NOT NULL
         LIMIT 1`,
      )
      .get(orderId, clientId) || null
  );
}

module.exports = {
  attachAppointmentCheckout,
  createAppointmentPaymentOrder,
  createProcessedAppointmentPaymentOrderFromQuote,
  getAppointmentPaymentOrderByCheckoutId,
  getPaidAppointmentOrderForClient,
  getLatestAppointmentPaymentOrder,
  listPaidAppointmentOrdersByClient,
  processPaidAppointmentOrder,
  syncAppointmentPaymentOrder,
};
