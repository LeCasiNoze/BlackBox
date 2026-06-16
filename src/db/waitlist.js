const { db, nowUnix } = require("./index");

// Inscrit un client en liste d'attente sur un creneau (date + slot).
function joinWaitlist(clientId, date, slot) {
  db.prepare(
    `INSERT OR IGNORE INTO appointment_waitlist (client_id, date, slot, created_at)
     VALUES (?, ?, ?, ?)`,
  ).run(clientId, date, slot, nowUnix());
}

function leaveWaitlist(clientId, date, slot) {
  db.prepare(
    `DELETE FROM appointment_waitlist WHERE client_id = ? AND date = ? AND slot = ?`,
  ).run(clientId, date, slot);
}

// Inscrits a prevenir quand un creneau se libere.
function listWaitlistForSlot(date, slot) {
  return db
    .prepare(
      `
      SELECT c.id AS id, c.slug, c.card_code, c.full_name, c.first_name, c.last_name,
             c.email, c.client_type
      FROM appointment_waitlist w
      JOIN clients c ON c.id = w.client_id
      WHERE w.date = ? AND w.slot = ?
    `,
    )
    .all(date, slot);
}

function clearWaitlistForSlot(date, slot) {
  db.prepare(`DELETE FROM appointment_waitlist WHERE date = ? AND slot = ?`).run(date, slot);
}

// Nettoyage des inscriptions dont la date est passee.
function purgePastWaitlist() {
  db.prepare(`DELETE FROM appointment_waitlist WHERE date < date('now')`).run();
}

// Entrees d'un client (pour afficher "tu es en attente" cote portail).
function getClientWaitlist(clientId) {
  return db
    .prepare(
      `SELECT date, slot, created_at FROM appointment_waitlist WHERE client_id = ? ORDER BY date ASC`,
    )
    .all(clientId)
    .map((row) => ({ date: row.date, slot: row.slot, createdAt: row.created_at }));
}

module.exports = {
  joinWaitlist,
  leaveWaitlist,
  listWaitlistForSlot,
  clearWaitlistForSlot,
  purgePastWaitlist,
  getClientWaitlist,
};
