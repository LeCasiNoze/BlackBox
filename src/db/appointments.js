// src/db/appointments.js
const { db, nowUnix } = require("./index");

// Retourne tous les rendez-vous de n'importe quel client sur un mois donné
function getAppointmentsForMonth(year, monthIndex) {
  // monthIndex: 0–11
  const start = new Date(year, monthIndex, 1);
  const nextMonth = new Date(year, monthIndex + 1, 1);

  const startStr = start.toISOString().slice(0, 10); // YYYY-MM-DD
  const endStr = nextMonth.toISOString().slice(0, 10);

  const stmt = db.prepare(`
    SELECT *
    FROM appointments
    WHERE date >= ? AND date < ?
  `);

  return stmt.all(startStr, endStr);
}

// Rendez-vous d'un client (tout, passé/futur)
function getAppointmentsForClient(clientId) {
  const stmt = db.prepare(`
    SELECT *
    FROM appointments
    WHERE client_id = ?
    ORDER BY date ASC
  `);
  return stmt.all(clientId);
}

// RDV d'une date précise (n'importe quel client)
function getAppointmentByDate(dateStr) {
  const stmt = db.prepare(`
    SELECT *
    FROM appointments
    WHERE date = ?
    LIMIT 1
  `);
  return stmt.get(dateStr) || null;
}

// Crée un rendez-vous "requested" pour un client à une date donnée
function createRequestedAppointment(clientId, dateStr, clientNote) {
  const now = nowUnix();
  const stmt = db.prepare(`
    INSERT INTO appointments (client_id, date, status, client_note, created_at, updated_at)
    VALUES (?, ?, 'requested', ?, ?, ?)
  `);
  const info = stmt.run(clientId, dateStr, clientNote || null, now, now);
  return info.lastInsertRowid;
}

// Annule le rendez-vous d'un client à une date donnée (si c'est bien le sien)
function cancelAppointmentForClientOnDate(clientId, dateStr) {
  const now = nowUnix();
  const stmt = db.prepare(`
    UPDATE appointments
    SET status = 'cancelled', updated_at = ?
    WHERE client_id = ? AND date = ? AND status IN ('requested', 'confirmed')
  `);
  const info = stmt.run(now, clientId, dateStr);
  return info.changes; // 0 = rien, 1 = ok
}

module.exports = {
  getAppointmentsForMonth,
  getAppointmentsForClient,
  getAppointmentByDate,
  createRequestedAppointment,
  cancelAppointmentForClientOnDate,
};
