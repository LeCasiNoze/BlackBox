const { db, nowUnix } = require("./index");

function serializePayload(payload) {
  try {
    return payload ? JSON.stringify(payload) : null;
  } catch (_error) {
    return null;
  }
}

function parsePayload(payload) {
  try {
    return payload ? JSON.parse(payload) : null;
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

function mapPaymentStatus(status) {
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

function mapQuoteRow(row) {
  if (!row) return null;
  let serviceItems = [];
  try {
    const parsed = JSON.parse(row.service_items_json || "[]");
    serviceItems = Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    serviceItems = [];
  }
  return {
    id: row.id,
    clientId: row.client_id,
    description: row.description || null,
    status: row.status,
    estimatedPriceCents: row.estimated_price_cents ?? null,
    discountPercent: row.discount_percent ?? 0,
    discountCents: row.discount_cents ?? 0,
    amountDueCents: row.amount_due_cents ?? row.estimated_price_cents ?? null,
    discountSource: row.discount_source || null,
    referralId: row.referral_id ?? null,
    referralRewardId: row.referral_reward_id ?? null,
    // Conserve uniquement la valeur historique pour les anciens devis.
    estimatedCredits: row.estimated_credits ?? null,
    adminComment: row.admin_comment || null,
    serviceItems,
    vehicleId: row.vehicle_id ?? null,
    vehicle: {
      id: row.vehicle_id ?? null,
      label: row.vehicle_label || row.vehicle_model || null,
      model: row.vehicle_model || row.vehicle_label || null,
      plate: row.vehicle_plate || null,
    },
    vehicleConditionScore: Number.isInteger(row.vehicle_condition_score)
      ? row.vehicle_condition_score
      : null,
    paymentStatus: row.payment_status || (row.paid_at ? "paid" : "unpaid"),
    checkoutReference: row.checkout_reference || null,
    checkoutId: row.checkout_id || null,
    hostedCheckoutUrl: row.hosted_checkout_url || null,
    sumupStatus: row.sumup_status || null,
    sumupPayload: parsePayload(row.sumup_payload),
    paidAt: row.paid_at ?? null,
    appointmentId: row.appointment_id ?? null,
    convertedAt: row.converted_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    answeredAt: row.answered_at ?? null,
    acceptedAt: row.accepted_at ?? null,
    refusedAt: row.refused_at ?? null,
    refusalReason: row.refusal_reason || null,
    refusalComment: row.refusal_comment || null,
    reminderSentAt: row.reminder_sent_at ?? null,
  };
}

function createQuoteRequest({
  clientId,
  description = null,
  serviceItems = [],
  vehicleId = null,
  vehicleLabel = null,
  vehicleModel = null,
  vehiclePlate = null,
  vehicleConditionScore = null,
}) {
  const now = nowUnix();
  const info = db
    .prepare(
      `INSERT INTO quote_requests (
         client_id, description, service_items_json,
         vehicle_id, vehicle_label, vehicle_model, vehicle_plate, vehicle_condition_score,
         status, payment_status, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', ?, ?)`,
    )
    .run(
      clientId,
      description || null,
      Array.isArray(serviceItems) && serviceItems.length > 0 ? JSON.stringify(serviceItems) : null,
      vehicleId || null,
      vehicleLabel || vehicleModel || null,
      vehicleModel || vehicleLabel || null,
      vehiclePlate || null,
      Number.isInteger(vehicleConditionScore) ? vehicleConditionScore : null,
      now,
      now,
    );
  return info.lastInsertRowid;
}

function insertQuoteRequestPhoto(quoteRequestId, url) {
  if (!quoteRequestId || !url) return null;
  const info = db
    .prepare(
      `INSERT INTO quote_request_photos (quote_request_id, url, created_at)
       VALUES (?, ?, ?)`,
    )
    .run(quoteRequestId, url, nowUnix());
  return info.lastInsertRowid;
}

function getQuoteRequestPhotos(quoteRequestId) {
  return db
    .prepare(
      `SELECT url FROM quote_request_photos WHERE quote_request_id = ? ORDER BY id ASC`,
    )
    .all(quoteRequestId)
    .map((row) => row.url);
}

function getQuoteRequestById(id) {
  return mapQuoteRow(
    db.prepare(`SELECT * FROM quote_requests WHERE id = ?`).get(id),
  );
}

function getQuoteRequestByCheckoutId(checkoutId) {
  if (!checkoutId) return null;
  return mapQuoteRow(
    db.prepare(`SELECT * FROM quote_requests WHERE checkout_id = ? LIMIT 1`).get(checkoutId),
  );
}

// Une demande convertie/archivée ne bloque jamais la création d'un nouveau devis.
function getActiveQuoteRequestForClient(clientId) {
  return mapQuoteRow(
    db
      .prepare(
        `SELECT * FROM quote_requests
         WHERE client_id = ? AND status IN ('pending', 'answered', 'accepted', 'paid')
         ORDER BY id DESC LIMIT 1`,
      )
      .get(clientId),
  );
}

function markQuoteRequestConverted(id, appointmentId) {
  const now = nowUnix();
  db.prepare(
    `UPDATE quote_requests
     SET status = 'archived', appointment_id = ?, converted_at = ?, updated_at = ?
     WHERE id = ?`,
  ).run(appointmentId || null, now, now, id);
  return getQuoteRequestById(id);
}

function answerQuoteRequest(id, { estimatedPriceCents, adminComment = null }) {
  const now = nowUnix();
  db.prepare(
    `UPDATE quote_requests
       SET status = 'answered', estimated_price_cents = ?, admin_comment = ?,
           amount_due_cents = ?,
           payment_status = 'unpaid', checkout_reference = NULL, checkout_id = NULL,
           hosted_checkout_url = NULL, sumup_status = NULL, sumup_payload = NULL,
           paid_at = NULL, accepted_at = NULL,
           answered_at = ?, updated_at = ?
     WHERE id = ?`,
  ).run(
    Math.max(1, Math.round(Number(estimatedPriceCents) || 0)),
    adminComment || null,
    Math.max(1, Math.round(Number(estimatedPriceCents) || 0)),
    now,
    now,
    id,
  );
  return getQuoteRequestById(id);
}

function attachQuoteCheckout(id, checkoutReference, checkout) {
  db.prepare(
    `UPDATE quote_requests
     SET checkout_reference = ?, checkout_id = ?, hosted_checkout_url = ?,
         sumup_status = ?, sumup_payload = ?, payment_status = 'pending', updated_at = ?
     WHERE id = ?`,
  ).run(
    checkoutReference,
    checkout?.id || null,
    checkout?.hosted_checkout_url || null,
    checkout?.status || "PENDING",
    serializePayload(checkout),
    nowUnix(),
    id,
  );
  return getQuoteRequestById(id);
}

function syncQuotePaymentFromCheckout(id, checkout) {
  return db.transaction((quoteId) => {
    const before = getQuoteRequestById(quoteId);
    if (!before) return { quote: null, becamePaid: false };

    const providerAmountCents =
      checkout?.amount == null || !Number.isFinite(Number(checkout.amount))
        ? null
        : Math.round(Number(checkout.amount) * 100);
    const amountMismatch =
      String(checkout?.status || "").toUpperCase() === "PAID" &&
      providerAmountCents != null &&
      providerAmountCents !== Number(before.amountDueCents || before.estimatedPriceCents || 0);
    const paymentStatus = amountMismatch ? "failed" : mapPaymentStatus(checkout?.status);
    const becamePaid = paymentStatus === "paid" && before.paymentStatus !== "paid";
    const paidAt = paymentStatus === "paid" ? resolvePaidAt(checkout) : null;

    db.prepare(
      `UPDATE quote_requests
       SET checkout_id = COALESCE(?, checkout_id), hosted_checkout_url = COALESCE(?, hosted_checkout_url),
           sumup_status = ?, sumup_payload = ?,
           payment_status = CASE WHEN payment_status = 'paid' THEN 'paid' ELSE ? END,
           status = CASE WHEN status = 'archived' THEN status WHEN ? = 'paid' THEN 'paid' ELSE status END,
           paid_at = COALESCE(paid_at, ?), accepted_at = COALESCE(accepted_at, ?), updated_at = ?
       WHERE id = ?`,
    ).run(
      checkout?.id || null,
      checkout?.hosted_checkout_url || null,
      checkout?.status || null,
      serializePayload(checkout),
      paymentStatus,
      paymentStatus,
      paidAt,
      paidAt,
      nowUnix(),
      quoteId,
    );

    return { quote: getQuoteRequestById(quoteId), becamePaid, amountMismatch };
  })(id);
}

function acceptQuoteRequest(id) {
  const now = nowUnix();
  db.prepare(
    `UPDATE quote_requests
       SET status = 'accepted', accepted_at = ?, updated_at = ?
     WHERE id = ?`,
  ).run(now, now, id);
  return getQuoteRequestById(id);
}

function refuseQuoteRequest(id, { refusalReason = null, refusalComment = null }) {
  const now = nowUnix();
  db.prepare(
    `UPDATE quote_requests
       SET status = 'refused', payment_status = 'unpaid',
           checkout_reference = NULL, checkout_id = NULL, hosted_checkout_url = NULL,
           sumup_status = NULL, sumup_payload = NULL,
           refusal_reason = ?, refusal_comment = ?,
           refused_at = ?, updated_at = ?
     WHERE id = ?`,
  ).run(refusalReason || null, refusalComment || null, now, now, id);
  return getQuoteRequestById(id);
}

function markQuoteReminderSent(id) {
  const now = nowUnix();
  db.prepare(
    `UPDATE quote_requests
       SET reminder_sent_at = ?, updated_at = ?
     WHERE id = ?`,
  ).run(now, now, id);
}

function getAnsweredQuotesPendingReminder(minAgeSeconds = 172800) {
  const cutoff = nowUnix() - minAgeSeconds; // e.g. 48 hours ago
  const rows = db
    .prepare(
      `SELECT q.*, c.full_name, c.first_name, c.email, c.vehicle_model
         FROM quote_requests q
         JOIN clients c ON c.id = q.client_id
        WHERE q.status = 'answered'
          AND q.answered_at IS NOT NULL
          AND q.answered_at <= ?
          AND q.reminder_sent_at IS NULL`,
    )
    .all(cutoff);

  return rows.map((row) => ({
    ...mapQuoteRow(row),
    client: {
      id: row.client_id,
      fullName: row.full_name || row.first_name,
      email: row.email,
      vehicleModel: row.vehicle_model,
    },
  }));
}

function getAnsweredQuotesPendingSecondReminder(minAgeSeconds = 604800) {
  const cutoff = nowUnix() - minAgeSeconds; // e.g. 7 days (604800s) ago
  const rows = db
    .prepare(
      `SELECT q.*, c.full_name, c.first_name, c.email, c.vehicle_model
         FROM quote_requests q
         JOIN clients c ON c.id = q.client_id
        WHERE q.status = 'answered'
          AND q.answered_at IS NOT NULL
          AND q.answered_at <= ?
          AND q.reminder_sent_at IS NOT NULL
          AND q.second_reminder_sent_at IS NULL`,
    )
    .all(cutoff);

  return rows.map((row) => ({
    ...mapQuoteRow(row),
    client: {
      id: row.client_id,
      fullName: row.full_name || row.first_name,
      email: row.email,
      vehicleModel: row.vehicle_model,
    },
  }));
}

function markQuoteSecondReminderSent(id) {
  return db
    .prepare(
      `UPDATE quote_requests
          SET second_reminder_sent_at = ?
        WHERE id = ?`,
    )
    .run(nowUnix(), id).changes;
}

function deleteQuoteRequest(id) {
  return db.prepare(`DELETE FROM quote_requests WHERE id = ?`).run(id).changes;
}

function archiveQuoteRequest(id) {
  const now = nowUnix();
  return db
    .prepare(
      `UPDATE quote_requests
          SET status = 'archived',
              updated_at = ?
        WHERE id = ?`,
    )
    .run(now, id).changes;
}

function unarchiveQuoteRequest(id) {
  const now = nowUnix();
  const quote = getQuoteRequestById(id);
  const newStatus = quote?.paymentStatus === "paid"
    ? "paid"
    : quote && (quote.estimatedPriceCents || quote.estimatedCredits)
      ? "answered"
      : "pending";
  return db
    .prepare(
      `UPDATE quote_requests
          SET status = ?,
              updated_at = ?
        WHERE id = ?`,
    )
    .run(newStatus, now, id).changes;
}

function listQuoteRequestsForAdmin() {
  const rows = db
    .prepare(
      `SELECT q.*, c.full_name, c.first_name, c.last_name, c.slug, c.card_code,
              c.client_type, c.is_founder, c.phone, c.email,
              c.vehicle_model AS client_vehicle_model,
              c.vehicle_plate AS client_vehicle_plate,
              c.formula_remaining
         FROM quote_requests q
         JOIN clients c ON c.id = q.client_id
        ORDER BY (q.status = 'pending') DESC, q.id DESC`,
    )
    .all();

  return rows.map((row) => ({
    ...mapQuoteRow(row),
    photos: getQuoteRequestPhotos(row.id),
    client: {
      id: row.client_id,
      fullName: row.full_name || [row.first_name, row.last_name].filter(Boolean).join(" "),
      slug: row.slug,
      cardCode: row.card_code,
      clientType: row.client_type || "bbx",
      isFounder: !!row.is_founder,
      phone: row.phone || null,
      email: row.email || null,
      vehicleModel: row.client_vehicle_model || null,
      vehiclePlate: row.client_vehicle_plate || null,
      formulaRemaining: row.formula_remaining ?? 0,
    },
  }));
}

function countPendingQuoteRequests() {
  return (
    db
      .prepare(`SELECT COUNT(*) AS n FROM quote_requests WHERE status = 'pending'`)
      .get().n || 0
  );
}

module.exports = {
  mapQuoteRow,
  createQuoteRequest,
  insertQuoteRequestPhoto,
  getQuoteRequestPhotos,
  getQuoteRequestById,
  getQuoteRequestByCheckoutId,
  getActiveQuoteRequestForClient,
  answerQuoteRequest,
  attachQuoteCheckout,
  syncQuotePaymentFromCheckout,
  acceptQuoteRequest,
  markQuoteRequestConverted,
  refuseQuoteRequest,
  markQuoteReminderSent,
  getAnsweredQuotesPendingReminder,
  markQuoteSecondReminderSent,
  getAnsweredQuotesPendingSecondReminder,
  deleteQuoteRequest,
  archiveQuoteRequest,
  unarchiveQuoteRequest,
  listQuoteRequestsForAdmin,
  countPendingQuoteRequests,
};
