const { db, nowUnix } = require("./index");

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
  if (!payload) return null;

  try {
    return JSON.stringify(payload);
  } catch (error) {
    return null;
  }
}

function parseUnixMaybe(value) {
  if (!value) return null;
  const timestamp = Date.parse(String(value));
  if (Number.isNaN(timestamp)) {
    return null;
  }
  return Math.floor(timestamp / 1000);
}

function resolvePaidAt(checkout) {
  const successfulTransaction = Array.isArray(checkout?.transactions)
    ? checkout.transactions.find((transaction) => transaction?.status === "SUCCESSFUL")
    : null;

  return (
    parseUnixMaybe(successfulTransaction?.timestamp) ||
    parseUnixMaybe(successfulTransaction?.date) ||
    parseUnixMaybe(checkout?.date) ||
    nowUnix()
  );
}

function pick(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }
  return null;
}

// SumUp ne renvoie pas systematiquement l'identite du payeur. On recupere au
// mieux ce qui est disponible (profil client, titulaire de carte, email),
// sinon null. Le payload brut est conserve dans tous les cas.
function extractCustomerFromCheckout(checkout) {
  if (!checkout || typeof checkout !== "object") {
    return { name: null, email: null };
  }

  const personal = checkout.customer?.personal_details || {};
  const fullName = [personal.first_name, personal.last_name].filter(Boolean).join(" ").trim();

  const transaction = Array.isArray(checkout.transactions)
    ? checkout.transactions.find((entry) => entry?.status === "SUCCESSFUL") ||
      checkout.transactions[0]
    : null;
  const last4 = transaction?.card?.last_4_digits ? `Carte ****${transaction.card.last_4_digits}` : null;

  return {
    name: pick(checkout.customer?.name, fullName || null, last4),
    email: pick(personal.email, checkout.customer?.email),
  };
}

function mapPartnerOrderRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    partnerClientId: row.partner_client_id ?? null,
    partnerLabel: row.partner_label || null,
    forfaitKey: row.forfait_key,
    forfaitLabel: row.forfait_label,
    amountCents: row.amount_cents,
    currency: row.currency,
    checkoutReference: row.checkout_reference,
    checkoutId: row.checkout_id || null,
    hostedCheckoutUrl: row.hosted_checkout_url || null,
    redirectUrl: row.redirect_url || null,
    returnUrl: row.return_url || null,
    status: row.status,
    sumupStatus: row.sumup_status || null,
    customerName: row.customer_name || null,
    customerEmail: row.customer_email || null,
    paidAt: row.paid_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getPartnerOrderById(id) {
  return (
    db.prepare(`SELECT * FROM partner_orders WHERE id = ? LIMIT 1`).get(id) || null
  );
}

function getPartnerOrderByCheckoutReference(reference) {
  return (
    db
      .prepare(`SELECT * FROM partner_orders WHERE checkout_reference = ? LIMIT 1`)
      .get(reference) || null
  );
}

function getPartnerOrderByCheckoutId(checkoutId) {
  return (
    db.prepare(`SELECT * FROM partner_orders WHERE checkout_id = ? LIMIT 1`).get(checkoutId) ||
    null
  );
}

function createPartnerOrder({
  partnerClientId,
  partnerLabel,
  forfait,
  checkoutReference,
  redirectUrl,
  returnUrl,
}) {
  const now = nowUnix();
  const info = db
    .prepare(
      `
      INSERT INTO partner_orders (
        partner_client_id,
        partner_label,
        forfait_key,
        forfait_label,
        amount_cents,
        currency,
        checkout_reference,
        redirect_url,
        return_url,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `,
    )
    .run(
      partnerClientId || null,
      partnerLabel || null,
      forfait.key,
      forfait.label,
      forfait.priceCents,
      forfait.currency || "EUR",
      checkoutReference,
      redirectUrl || null,
      returnUrl || null,
      now,
      now,
    );

  return getPartnerOrderById(info.lastInsertRowid);
}

function attachPartnerCheckoutSession(orderId, { checkoutId, hostedCheckoutUrl, sumupStatus, payload }) {
  db.prepare(
    `
    UPDATE partner_orders
    SET checkout_id = ?,
        hosted_checkout_url = ?,
        sumup_status = ?,
        sumup_payload = ?,
        updated_at = ?
    WHERE id = ?
  `,
  ).run(
    checkoutId || null,
    hostedCheckoutUrl || null,
    sumupStatus || null,
    serializePayload(payload),
    nowUnix(),
    orderId,
  );

  return getPartnerOrderById(orderId);
}

function syncPartnerOrderFromCheckout(orderId, checkout) {
  if (!orderId || !checkout) {
    return null;
  }

  const localStatus = mapSumupStatusToLocal(checkout.status);
  const paidAt = localStatus === "paid" ? resolvePaidAt(checkout) : null;
  const customer = extractCustomerFromCheckout(checkout);

  db.prepare(
    `
    UPDATE partner_orders
    SET checkout_id = COALESCE(?, checkout_id),
        sumup_status = ?,
        status = CASE WHEN status = 'paid' THEN 'paid' ELSE ? END,
        paid_at = COALESCE(paid_at, ?),
        customer_name = COALESCE(?, customer_name),
        customer_email = COALESCE(?, customer_email),
        hosted_checkout_url = COALESCE(?, hosted_checkout_url),
        sumup_payload = ?,
        updated_at = ?
    WHERE id = ?
  `,
  ).run(
    checkout.id || null,
    checkout.status || null,
    localStatus,
    paidAt,
    customer.name,
    customer.email,
    checkout.hosted_checkout_url || null,
    serializePayload(checkout),
    nowUnix(),
    orderId,
  );

  return getPartnerOrderById(orderId);
}

function listPartnerOrders({ partnerClientId, limit = 100 } = {}) {
  const rows = partnerClientId
    ? db
        .prepare(
          `SELECT * FROM partner_orders WHERE partner_client_id = ? ORDER BY created_at DESC LIMIT ?`,
        )
        .all(partnerClientId, limit)
    : db.prepare(`SELECT * FROM partner_orders ORDER BY created_at DESC LIMIT ?`).all(limit);

  return rows.map(mapPartnerOrderRow);
}

// Commandes encore en attente mais disposant d'un checkout SumUp: utilisees
// pour rafraichir le suivi cote pro sans dependre uniquement du webhook.
function listPendingPartnerOrdersWithCheckout({ partnerClientId, limit = 15 } = {}) {
  const rows = partnerClientId
    ? db
        .prepare(
          `SELECT * FROM partner_orders
           WHERE partner_client_id = ? AND status = 'pending' AND checkout_id IS NOT NULL
           ORDER BY created_at DESC LIMIT ?`,
        )
        .all(partnerClientId, limit)
    : db
        .prepare(
          `SELECT * FROM partner_orders
           WHERE status = 'pending' AND checkout_id IS NOT NULL
           ORDER BY created_at DESC LIMIT ?`,
        )
        .all(limit);

  return rows.map(mapPartnerOrderRow);
}

module.exports = {
  attachPartnerCheckoutSession,
  createPartnerOrder,
  getPartnerOrderByCheckoutId,
  getPartnerOrderByCheckoutReference,
  getPartnerOrderById,
  listPartnerOrders,
  listPendingPartnerOrdersWithCheckout,
  mapPartnerOrderRow,
  syncPartnerOrderFromCheckout,
};
