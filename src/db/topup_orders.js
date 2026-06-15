const { db, nowUnix } = require("./index");
const { formulaNameFromTotal, getClientById } = require("./clients");
const { immediateBcForCredits, deferredBcForCredits } = require("../config/bcoins");

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

function mapTopupOrderRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    clientId: row.client_id,
    provider: row.provider,
    offerKey: row.offer_key,
    offerLabel: row.offer_label,
    formulaName: row.formula_name || null,
    applyMode: row.apply_mode,
    credits: row.credits,
    durationDays: row.duration_days ?? null,
    amountCents: row.amount_cents,
    currency: row.currency,
    checkoutReference: row.checkout_reference,
    checkoutId: row.checkout_id || null,
    hostedCheckoutUrl: row.hosted_checkout_url || null,
    redirectUrl: row.redirect_url || null,
    returnUrl: row.return_url || null,
    status: row.status,
    sumupStatus: row.sumup_status || null,
    paidAt: row.paid_at ?? null,
    processedAt: row.processed_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getTopupOrderById(id) {
  return (
    db
      .prepare(
        `
        SELECT *
        FROM topup_orders
        WHERE id = ?
        LIMIT 1
      `,
      )
      .get(id) || null
  );
}

function getTopupOrderByCheckoutReference(reference) {
  return (
    db
      .prepare(
        `
        SELECT *
        FROM topup_orders
        WHERE checkout_reference = ?
        LIMIT 1
      `,
      )
      .get(reference) || null
  );
}

function getTopupOrderByCheckoutId(checkoutId) {
  return (
    db
      .prepare(
        `
        SELECT *
        FROM topup_orders
        WHERE checkout_id = ?
        LIMIT 1
      `,
      )
      .get(checkoutId) || null
  );
}

function createTopupOrder({ clientId, offer, checkoutReference, redirectUrl, returnUrl }) {
  const now = nowUnix();
  const info = db
    .prepare(
      `
      INSERT INTO topup_orders (
        client_id,
        provider,
        offer_key,
        offer_label,
        formula_name,
        apply_mode,
        credits,
        duration_days,
        amount_cents,
        currency,
        checkout_reference,
        redirect_url,
        return_url,
        status,
        created_at,
        updated_at
      )
      VALUES (?, 'sumup', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `,
    )
    .run(
      clientId,
      offer.key,
      offer.label,
      offer.formulaName || null,
      offer.applyMode || "add",
      offer.credits,
      offer.durationDays || null,
      offer.priceCents,
      offer.currency || "EUR",
      checkoutReference,
      redirectUrl || null,
      returnUrl || null,
      now,
      now,
    );

  return getTopupOrderById(info.lastInsertRowid);
}

function attachTopupCheckoutSession(orderId, { checkoutId, hostedCheckoutUrl, sumupStatus, payload }) {
  db.prepare(
    `
    UPDATE topup_orders
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

  return getTopupOrderById(orderId);
}

function syncTopupOrderFromCheckout(orderId, checkout) {
  if (!orderId || !checkout) {
    return null;
  }

  const localStatus = mapSumupStatusToLocal(checkout.status);
  const paidAt = localStatus === "paid" ? resolvePaidAt(checkout) : null;

  db.prepare(
    `
    UPDATE topup_orders
    SET checkout_id = COALESCE(?, checkout_id),
        sumup_status = ?,
        status = CASE
          WHEN processed_at IS NOT NULL THEN status
          ELSE ?
        END,
        paid_at = COALESCE(paid_at, ?),
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
    checkout.hosted_checkout_url || null,
    serializePayload(checkout),
    nowUnix(),
    orderId,
  );

  return getTopupOrderById(orderId);
}

function nextFormulaExpiry(currentExpiresAt, durationDays, paidAt) {
  if (!durationDays) {
    return currentExpiresAt ?? null;
  }

  const extensionSeconds = Number(durationDays) * 24 * 60 * 60;
  const base =
    typeof currentExpiresAt === "number" && currentExpiresAt > paidAt ? currentExpiresAt : paidAt;
  return base + extensionSeconds;
}

function processPaidTopupOrder(orderId, checkout) {
  const transaction = db.transaction(() => {
    const order = getTopupOrderById(orderId);
    if (!order) {
      return null;
    }

    if (order.processed_at) {
      return {
        applied: false,
        order,
        client: getClientById(order.client_id),
      };
    }

    const client = getClientById(order.client_id);
    if (!client) {
      throw new Error("topup_client_not_found");
    }

    const paidAt = resolvePaidAt(checkout);
    const credits = Math.max(0, Number(order.credits || 0));
    const currentTotal = Math.max(0, Number(client.formula_total || 0));
    const currentRemaining = Number.isFinite(Number(client.formula_remaining))
      ? Number(client.formula_remaining)
      : 0;

    const nextTotal =
      order.apply_mode === "replace" ? credits : Math.max(0, currentTotal + credits);
    const nextRemaining =
      order.apply_mode === "replace" ? credits : currentRemaining + credits;
    const nextFormulaName =
      order.formula_name || client.formula_name || formulaNameFromTotal(nextTotal);
    const nextExpiresAt = nextFormulaExpiry(client.formula_expires_at, order.duration_days, paidAt);

    db.prepare(
      `
      UPDATE clients
      SET formula_name = ?,
          formula_total = ?,
          formula_remaining = ?,
          formula_purchased_at = ?,
          formula_expires_at = ?,
          updated_at = ?
      WHERE id = ?
    `,
    ).run(
      nextFormulaName,
      nextTotal,
      nextRemaining,
      paidAt,
      nextExpiresAt,
      nowUnix(),
      client.id,
    );

    // Acces fondateur: le paiement (19,99 EUR, 0 credit) fait passer le
    // compte bbx en fondateur.
    if (order.offer_key === "founder-access" && !client.is_founder) {
      db.prepare(`UPDATE clients SET is_founder = 1, updated_at = ? WHERE id = ?`).run(
        nowUnix(),
        client.id,
      );
    }

    // BC'Coins (fondateurs uniquement): +80 BC/credit immediat, +20 BC/credit
    // en pool differe, et 1 ouverture de case par achat.
    if (client.is_founder && credits > 0) {
      const immediateBc = immediateBcForCredits(credits);
      const deferredBc = deferredBcForCredits(credits);
      db.prepare(
        `
        UPDATE clients
        SET bc_points = COALESCE(bc_points, 0) + ?,
            bc_pending = COALESCE(bc_pending, 0) + ?,
            updated_at = ?
        WHERE id = ?
      `,
      ).run(immediateBc, deferredBc, nowUnix(), client.id);

      db.prepare(
        `
        INSERT INTO case_openings (client_id, credits, source, order_id, status, created_at)
        VALUES (?, ?, 'credit_purchase', ?, 'pending', ?)
      `,
      ).run(client.id, credits, order.id, nowUnix());
    }

    db.prepare(
      `
      UPDATE topup_orders
      SET status = 'processed',
          sumup_status = 'PAID',
          paid_at = COALESCE(paid_at, ?),
          processed_at = ?,
          checkout_id = COALESCE(?, checkout_id),
          hosted_checkout_url = COALESCE(?, hosted_checkout_url),
          sumup_payload = ?,
          updated_at = ?
      WHERE id = ?
    `,
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
      order: getTopupOrderById(orderId),
      client: getClientById(client.id),
    };
  });

  return transaction();
}

module.exports = {
  attachTopupCheckoutSession,
  createTopupOrder,
  getTopupOrderByCheckoutId,
  getTopupOrderByCheckoutReference,
  getTopupOrderById,
  mapTopupOrderRow,
  processPaidTopupOrder,
  syncTopupOrderFromCheckout,
};
