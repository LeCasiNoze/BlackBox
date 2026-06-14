const { db, nowUnix } = require("./index");
const { rollCaseReward } = require("../config/bcoins");

function mapCaseOpeningRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    credits: row.credits,
    status: row.status,
    rewardTier: row.reward_tier || null,
    rewardBc: row.reward_bc ?? null,
    createdAt: row.created_at,
    openedAt: row.opened_at ?? null,
  };
}

function createCaseOpening({ clientId, credits, source = "credit_purchase", orderId = null }) {
  const info = db
    .prepare(
      `
      INSERT INTO case_openings (client_id, credits, source, order_id, status, created_at)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `,
    )
    .run(clientId, Math.max(1, Math.floor(Number(credits) || 1)), source, orderId, nowUnix());
  return info.lastInsertRowid;
}

function listPendingCaseOpenings(clientId) {
  return db
    .prepare(
      `SELECT * FROM case_openings WHERE client_id = ? AND status = 'pending' ORDER BY created_at ASC`,
    )
    .all(clientId)
    .map(mapCaseOpeningRow);
}

function listRecentCaseOpenings(clientId, limit = 20) {
  return db
    .prepare(`SELECT * FROM case_openings WHERE client_id = ? ORDER BY created_at DESC LIMIT ?`)
    .all(clientId, limit)
    .map(mapCaseOpeningRow);
}

// Ouvre une case en attente: tire le lot, crédite les BC, marque ouverte.
function openCaseOpening(caseId, clientId) {
  return db.transaction((id, ownerId) => {
    const row = db.prepare(`SELECT * FROM case_openings WHERE id = ? LIMIT 1`).get(id);
    if (!row || row.client_id !== ownerId) {
      return { ok: false, error: "not_found" };
    }
    if (row.status !== "pending") {
      return { ok: false, error: "already_opened" };
    }

    const reward = rollCaseReward(row.credits);

    db.prepare(
      `UPDATE case_openings SET status = 'opened', reward_tier = ?, reward_bc = ?, opened_at = ? WHERE id = ?`,
    ).run(reward.tier, reward.bc, nowUnix(), id);

    const client = db.prepare(`SELECT bc_points FROM clients WHERE id = ? LIMIT 1`).get(ownerId);
    const nextPoints = Math.max(0, Number(client?.bc_points || 0) + reward.bc);
    db.prepare(`UPDATE clients SET bc_points = ?, updated_at = ? WHERE id = ?`).run(
      nextPoints,
      nowUnix(),
      ownerId,
    );

    return { ok: true, reward, bcPoints: nextPoints };
  })(caseId, clientId);
}

module.exports = {
  createCaseOpening,
  listPendingCaseOpenings,
  listRecentCaseOpenings,
  openCaseOpening,
  mapCaseOpeningRow,
};
