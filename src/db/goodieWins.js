const { db, nowUnix } = require("./index");

function mapGoodieWinRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name || null,
    clientSlug: row.client_slug || null,
    source: row.source,
    rewardKey: row.reward_key,
    rewardLabel: row.reward_label,
    status: row.status,
    createdAt: row.created_at,
    honoredAt: row.honored_at ?? null,
  };
}

function recordGoodieWin(clientId, source, rewardKey, rewardLabel) {
  db.prepare(
    `INSERT INTO goodie_wins (client_id, source, reward_key, reward_label, status, created_at)
     VALUES (?, ?, ?, ?, 'pending', ?)`,
  ).run(clientId, source, rewardKey, rewardLabel, nowUnix());
}

function listGoodieWins(status) {
  const where = status === "honored" || status === "pending" ? `WHERE g.status = ?` : "";
  const stmt = db.prepare(
    `
    SELECT g.*, c.full_name AS client_name, c.slug AS client_slug
    FROM goodie_wins g
    LEFT JOIN clients c ON c.id = g.client_id
    ${where}
    ORDER BY g.status = 'pending' DESC, g.created_at DESC
  `,
  );
  const rows = where ? stmt.all(status) : stmt.all();
  return rows.map(mapGoodieWinRow);
}

function countPendingGoodieWins() {
  const row = db.prepare(`SELECT COUNT(*) AS n FROM goodie_wins WHERE status = 'pending'`).get();
  return row?.n ?? 0;
}

function markGoodieWinHonored(id, honored = true) {
  db.prepare(`UPDATE goodie_wins SET status = ?, honored_at = ? WHERE id = ?`).run(
    honored ? "honored" : "pending",
    honored ? nowUnix() : null,
    id,
  );
}

module.exports = {
  countPendingGoodieWins,
  listGoodieWins,
  mapGoodieWinRow,
  markGoodieWinHonored,
  recordGoodieWin,
};
