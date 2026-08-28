const crypto = require("crypto");
const { db, nowUnix } = require("./index");

const REFERRAL_DISCOUNT_PERCENT = 10;

function normalizeReferralCode(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 32);
  return normalized || null;
}

function normalizeIdentity(value) {
  return typeof value === "string"
    ? value.trim().toLowerCase().replace(/[\s+().-]/g, "")
    : "";
}

function getReferralOwnerByCode(code) {
  const normalized = normalizeReferralCode(code);
  if (!normalized) return null;
  return (
    db
      .prepare(
        `SELECT id, first_name, last_name, full_name, email, phone, client_type, referral_code
           FROM clients
          WHERE referral_code = ?
          LIMIT 1`,
      )
      .get(normalized) || null
  );
}

function getOrCreateReferralCode(clientId) {
  const client = db.prepare(`SELECT id, referral_code FROM clients WHERE id = ? LIMIT 1`).get(clientId);
  if (!client) return null;
  if (client.referral_code) return client.referral_code;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = `BC-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    try {
      const changed = db
        .prepare(
          `UPDATE clients
              SET referral_code = ?, updated_at = ?
            WHERE id = ? AND referral_code IS NULL`,
        )
        .run(code, nowUnix(), clientId).changes;
      if (changed) return code;
      return db.prepare(`SELECT referral_code FROM clients WHERE id = ?`).get(clientId)?.referral_code || null;
    } catch (error) {
      if (error?.code !== "SQLITE_CONSTRAINT_UNIQUE") throw error;
    }
  }
  throw new Error("cannot_generate_referral_code");
}

function referralPublicView(code) {
  const owner = getReferralOwnerByCode(code);
  if (!owner || owner.client_type === "pro") return null;
  return {
    code: owner.referral_code,
    referrerFirstName: owner.first_name || String(owner.full_name || "").split(/\s+/)[0] || "Un client Bryan Cars",
    discountPercent: REFERRAL_DISCOUNT_PERCENT,
  };
}

function createReferralForNewClient(code, referredClientId) {
  const owner = getReferralOwnerByCode(code);
  const referred = db.prepare(`SELECT * FROM clients WHERE id = ? LIMIT 1`).get(referredClientId);
  if (!owner || !referred || owner.client_type === "pro" || owner.id === referred.id) return null;

  const sameEmail =
    normalizeIdentity(owner.email) && normalizeIdentity(owner.email) === normalizeIdentity(referred.email);
  const samePhone =
    normalizeIdentity(owner.phone) && normalizeIdentity(owner.phone) === normalizeIdentity(referred.phone);
  if (sameEmail || samePhone) return null;

  const alreadyAttributed = db
    .prepare(`SELECT * FROM referrals WHERE referred_client_id = ? LIMIT 1`)
    .get(referred.id);
  if (alreadyAttributed) return alreadyAttributed;

  const previousActivity = db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM quote_requests WHERE client_id = ?) +
         (SELECT COUNT(*) FROM appointments WHERE client_id = ?) AS total`,
    )
    .get(referred.id, referred.id)?.total;
  if (Number(previousActivity || 0) > 0) return null;

  const now = nowUnix();
  const info = db
    .prepare(
      `INSERT INTO referrals (
         referrer_client_id, referred_client_id, referral_code, status,
         referred_discount_percent, created_at, updated_at
       ) VALUES (?, ?, ?, 'pending', ?, ?, ?)`,
    )
    .run(owner.id, referred.id, owner.referral_code, REFERRAL_DISCOUNT_PERCENT, now, now);
  return db.prepare(`SELECT * FROM referrals WHERE id = ?`).get(info.lastInsertRowid) || null;
}

function calculateDiscount(basePriceCents, percent = REFERRAL_DISCOUNT_PERCENT) {
  const base = Math.max(1, Math.round(Number(basePriceCents) || 0));
  const normalizedPercent = Math.min(100, Math.max(0, Math.round(Number(percent) || 0)));
  const discountCents = Math.min(base - 1, Math.round((base * normalizedPercent) / 100));
  return {
    discountPercent: normalizedPercent,
    discountCents: Math.max(0, discountCents),
    amountDueCents: Math.max(1, base - discountCents),
  };
}

function applyReferralDiscountToAnsweredQuote(quoteId) {
  return db.transaction((id) => {
    const quote = db.prepare(`SELECT * FROM quote_requests WHERE id = ? LIMIT 1`).get(id);
    if (!quote || !quote.estimated_price_cents || quote.payment_status === "paid") return null;

    let referral = quote.referral_id
      ? db.prepare(`SELECT * FROM referrals WHERE id = ? LIMIT 1`).get(quote.referral_id)
      : null;
    let reward = quote.referral_reward_id
      ? db.prepare(`SELECT * FROM referral_rewards WHERE id = ? LIMIT 1`).get(quote.referral_reward_id)
      : null;

    if (!referral && !reward) {
      referral = db
        .prepare(
          `SELECT * FROM referrals
            WHERE referred_client_id = ?
              AND status = 'pending'
              AND qualifying_quote_id IS NULL
            ORDER BY id ASC LIMIT 1`,
        )
        .get(quote.client_id);

      if (!referral) {
        reward = db
          .prepare(
            `SELECT * FROM referral_rewards
              WHERE client_id = ? AND status = 'available'
              ORDER BY created_at ASC, id ASC LIMIT 1`,
          )
          .get(quote.client_id);
      }
    }

    const benefit = referral || reward;
    if (!benefit) {
      db.prepare(
        `UPDATE quote_requests
            SET discount_percent = 0, discount_cents = 0,
                amount_due_cents = estimated_price_cents,
                discount_source = NULL, referral_id = NULL, referral_reward_id = NULL
          WHERE id = ?`,
      ).run(id);
      return db.prepare(`SELECT * FROM quote_requests WHERE id = ?`).get(id);
    }

    const calculation = calculateDiscount(
      quote.estimated_price_cents,
      benefit.referred_discount_percent || benefit.discount_percent || REFERRAL_DISCOUNT_PERCENT,
    );
    const now = nowUnix();

    if (referral) {
      const reserved = db
        .prepare(
          `UPDATE referrals
              SET qualifying_quote_id = ?, referred_discount_cents = ?, updated_at = ?
            WHERE id = ? AND status = 'pending'
              AND (qualifying_quote_id IS NULL OR qualifying_quote_id = ?)`,
        )
        .run(id, calculation.discountCents, now, referral.id, id).changes;
      if (!reserved) return null;
    } else {
      const reserved = db
        .prepare(
          `UPDATE referral_rewards
              SET status = 'reserved', applied_quote_id = ?, updated_at = ?
            WHERE id = ? AND client_id = ? AND status IN ('available', 'reserved')
              AND (applied_quote_id IS NULL OR applied_quote_id = ?)`,
        )
        .run(id, now, reward.id, quote.client_id, id).changes;
      if (!reserved) return null;
    }

    db.prepare(
      `UPDATE quote_requests
          SET discount_percent = ?, discount_cents = ?, amount_due_cents = ?,
              discount_source = ?, referral_id = ?, referral_reward_id = ?
        WHERE id = ?`,
    ).run(
      calculation.discountPercent,
      calculation.discountCents,
      calculation.amountDueCents,
      referral ? "referred_client" : "referrer_reward",
      referral?.id || null,
      reward?.id || null,
      id,
    );
    return db.prepare(`SELECT * FROM quote_requests WHERE id = ?`).get(id);
  })(quoteId);
}

function releaseReferralDiscountForQuote(quoteId) {
  return db.transaction((id) => {
    const quote = db.prepare(`SELECT * FROM quote_requests WHERE id = ? LIMIT 1`).get(id);
    if (!quote || quote.payment_status === "paid") return false;
    const now = nowUnix();

    if (quote.referral_id) {
      db.prepare(
        `UPDATE referrals SET qualifying_quote_id = NULL, referred_discount_cents = 0, updated_at = ?
          WHERE id = ? AND status = 'pending' AND qualifying_quote_id = ?`,
      ).run(now, quote.referral_id, id);
    }
    if (quote.referral_reward_id) {
      db.prepare(
        `UPDATE referral_rewards SET status = 'available', applied_quote_id = NULL, updated_at = ?
          WHERE id = ? AND status = 'reserved' AND applied_quote_id = ?`,
      ).run(now, quote.referral_reward_id, id);
    }
    db.prepare(
      `UPDATE quote_requests
          SET discount_percent = 0, discount_cents = 0,
              amount_due_cents = estimated_price_cents,
              discount_source = NULL, referral_id = NULL, referral_reward_id = NULL
        WHERE id = ?`,
    ).run(id);
    return true;
  })(quoteId);
}

function finalizeReferralBenefitsForPaidQuote(quoteId) {
  return db.transaction((id) => {
    const quote = db.prepare(`SELECT * FROM quote_requests WHERE id = ? LIMIT 1`).get(id);
    if (!quote || quote.payment_status !== "paid") return null;
    const now = nowUnix();
    let rewardCreated = false;
    let referrerClientId = null;

    if (quote.referral_id) {
      const referral = db.prepare(`SELECT * FROM referrals WHERE id = ? LIMIT 1`).get(quote.referral_id);
      if (referral && referral.status === "pending" && referral.qualifying_quote_id === id) {
        db.prepare(
          `UPDATE referrals SET status = 'qualified', qualified_at = ?, updated_at = ? WHERE id = ?`,
        ).run(now, now, referral.id);
        const inserted = db.prepare(
          `INSERT OR IGNORE INTO referral_rewards (
             client_id, referral_id, discount_percent, status, created_at, updated_at
           ) VALUES (?, ?, ?, 'available', ?, ?)`,
        ).run(referral.referrer_client_id, referral.id, REFERRAL_DISCOUNT_PERCENT, now, now);
        rewardCreated = inserted.changes > 0;
        referrerClientId = referral.referrer_client_id;
      }
    }

    if (quote.referral_reward_id) {
      db.prepare(
        `UPDATE referral_rewards
            SET status = 'redeemed', redeemed_at = COALESCE(redeemed_at, ?), updated_at = ?
          WHERE id = ? AND applied_quote_id = ? AND status IN ('reserved', 'redeemed')`,
      ).run(now, now, quote.referral_reward_id, id);
    }

    return { rewardCreated, referrerClientId };
  })(quoteId);
}

function getReferralSummary(clientId, baseUrl) {
  const code = getOrCreateReferralCode(clientId);
  if (!code) return null;
  const counts = db
    .prepare(
      `SELECT
         SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) AS qualified,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending
       FROM referrals WHERE referrer_client_id = ?`,
    )
    .get(clientId);
  const rewards = db
    .prepare(
      `SELECT
         SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available,
         SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) AS reserved,
         SUM(CASE WHEN status = 'redeemed' THEN 1 ELSE 0 END) AS redeemed
       FROM referral_rewards WHERE client_id = ?`,
    )
    .get(clientId);
  const referredBy = db
    .prepare(
      `SELECT r.status, c.first_name, c.full_name
         FROM referrals r
         JOIN clients c ON c.id = r.referrer_client_id
        WHERE r.referred_client_id = ? LIMIT 1`,
    )
    .get(clientId);
  const cleanBaseUrl = String(baseUrl || "https://blackboxbc.com").replace(/\/+$/, "");
  return {
    code,
    shareUrl: `${cleanBaseUrl}/?parrain=${encodeURIComponent(code)}#devis`,
    discountPercent: REFERRAL_DISCOUNT_PERCENT,
    qualifiedReferrals: Number(counts?.qualified || 0),
    pendingReferrals: Number(counts?.pending || 0),
    availableRewards: Number(rewards?.available || 0),
    reservedRewards: Number(rewards?.reserved || 0),
    redeemedRewards: Number(rewards?.redeemed || 0),
    referredBy: referredBy
      ? {
          firstName: referredBy.first_name || String(referredBy.full_name || "").split(/\s+/)[0] || null,
          status: referredBy.status,
        }
      : null,
  };
}

module.exports = {
  REFERRAL_DISCOUNT_PERCENT,
  normalizeReferralCode,
  referralPublicView,
  createReferralForNewClient,
  getOrCreateReferralCode,
  getReferralSummary,
  applyReferralDiscountToAnsweredQuote,
  releaseReferralDiscountForQuote,
  finalizeReferralBenefitsForPaidQuote,
};
