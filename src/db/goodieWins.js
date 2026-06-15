const { db, nowUnix } = require("./index");

function mapGoodieWinRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name || null,
    clientSlug: row.client_slug || null,
    appointmentId: row.appointment_id ?? null,
    appointmentDate: row.appointment_date ?? null,
    appointmentSlot: row.appointment_slot ?? null,
    source: row.source,
    rewardKey: row.reward_key,
    rewardLabel: row.reward_label,
    status: row.status,
    createdAt: row.created_at,
    honoredAt: row.honored_at ?? null,
  };
}

// Prochain rendez-vous "a venir" (pas encore effectue ni annule) sur lequel
// remettre les lots gagnes. On prend le plus proche dans le temps.
function getNextDeliverableAppointment(clientId) {
  return (
    db
      .prepare(
        `
        SELECT id, date, slot, time
        FROM appointments
        WHERE client_id = ?
          AND status IN ('requested', 'confirmed')
        ORDER BY date ASC,
                 CASE slot WHEN 'morning' THEN 0 ELSE 1 END ASC,
                 time ASC,
                 id ASC
        LIMIT 1
      `,
      )
      .get(clientId) || null
  );
}

// (Re)rattache tous les lots en attente du client au prochain rendez-vous a
// venir (ou les detache si plus aucun RDV). Renvoie le RDV cible (ou null).
function attachPendingGoodieWinsToNextAppointment(clientId) {
  const next = getNextDeliverableAppointment(clientId);
  db.prepare(
    `UPDATE goodie_wins SET appointment_id = ? WHERE client_id = ? AND status = 'pending'`,
  ).run(next ? next.id : null, clientId);
  return next;
}

function recordGoodieWin(clientId, source, rewardKey, rewardLabel) {
  db.prepare(
    `INSERT INTO goodie_wins (client_id, source, reward_key, reward_label, status, created_at)
     VALUES (?, ?, ?, ?, 'pending', ?)`,
  ).run(clientId, source, rewardKey, rewardLabel, nowUnix());
  // Rattache au prochain RDV a venir et renvoie ce RDV (pour le message client).
  return attachPendingGoodieWinsToNextAppointment(clientId);
}

// Lots en attente rattaches a un rendez-vous donne (cote client suivi + admin).
function listPendingGoodieWinsForAppointment(appointmentId) {
  if (!appointmentId) return [];
  return db
    .prepare(
      `SELECT id, source, reward_key, reward_label
       FROM goodie_wins
       WHERE appointment_id = ? AND status = 'pending'
       ORDER BY created_at ASC, id ASC`,
    )
    .all(appointmentId)
    .map((row) => ({
      id: row.id,
      source: row.source,
      rewardKey: row.reward_key,
      rewardLabel: row.reward_label,
    }));
}

// Marque comme remis tous les lots en attente d'un rendez-vous (passage effectue).
function honorGoodieWinsForAppointment(appointmentId) {
  if (!appointmentId) return 0;
  return db
    .prepare(
      `UPDATE goodie_wins SET status = 'honored', honored_at = ?
       WHERE appointment_id = ? AND status = 'pending'`,
    )
    .run(nowUnix(), appointmentId).changes;
}

function listGoodieWins(status) {
  const where = status === "honored" || status === "pending" ? `WHERE g.status = ?` : "";
  const stmt = db.prepare(
    `
    SELECT g.*, c.full_name AS client_name, c.slug AS client_slug,
           a.date AS appointment_date, a.slot AS appointment_slot
    FROM goodie_wins g
    LEFT JOIN clients c ON c.id = g.client_id
    LEFT JOIN appointments a ON a.id = g.appointment_id
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
  attachPendingGoodieWinsToNextAppointment,
  countPendingGoodieWins,
  getNextDeliverableAppointment,
  honorGoodieWinsForAppointment,
  listGoodieWins,
  listPendingGoodieWinsForAppointment,
  mapGoodieWinRow,
  markGoodieWinHonored,
  recordGoodieWin,
};
