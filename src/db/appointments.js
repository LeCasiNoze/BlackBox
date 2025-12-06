// src/db/appointments.js
const { db, nowUnix } = require("./index");

// Helper : format date locale YYYY-MM-DD sans souci de fuseau
function formatDateLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Retourne tous les rendez-vous de n'importe quel client sur un mois donné
function getAppointmentsForMonth(year, monthIndex) {
  // monthIndex: 0–11
  const start = new Date(year, monthIndex, 1);
  const nextMonth = new Date(year, monthIndex + 1, 1);

  const startStr = formatDateLocal(start);      // YYYY-MM-DD
  const endStr = formatDateLocal(nextMonth);    // YYYY-MM-DD

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
    ORDER BY date ASC, time ASC, id ASC
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

// RDV par id (utile pour l'admin)
function getAppointmentById(id) {
  const stmt = db.prepare(`
    SELECT *
    FROM appointments
    WHERE id = ?
    LIMIT 1
  `);
  const row = stmt.get(id);
  return row || null;
}

/**
 * Crée un rendez-vous "requested" pour un client à une date donnée.
 * Utilisé uniquement pour un NOUVEAU jour (date libre).
 *
 * @param {number} clientId
 * @param {string} dateStr YYYY-MM-DD
 * @param {string|null} time HH:MM ou null
 * @param {string|null} clientNote
 * @param {"atelier"|"domicile"|null} location
 */
function createRequestedAppointment(clientId, dateStr, time, clientNote, location) {
  const now = nowUnix();

  const loc =
    location === "domicile"
      ? "domicile"
      : location === "atelier"
      ? "atelier"
      : null;

  const stmt = db.prepare(`
    INSERT INTO appointments (client_id, date, time, status, client_note, location, created_at, updated_at)
    VALUES (?, ?, ?, 'requested', ?, ?, ?, ?)
  `);
  const info = stmt.run(
    clientId,
    dateStr,
    time || null,
    clientNote || null,
    loc,
    now,
    now
  );
  return info.lastInsertRowid;
}


/**
 * Met à jour uniquement l'heure (et éventuellement la note client)
 * pour un rendez-vous EXISTANT de ce client à cette date.
 *
 * Ne touche pas aux crédits, ne change pas le jour.
 */
function updateAppointmentTimeForClient(clientId, dateStr, time, clientNote) {
  const now = nowUnix();
  const stmt = db.prepare(`
    UPDATE appointments
    SET time = ?,
        client_note = COALESCE(?, client_note),
        updated_at = ?
    WHERE client_id = ?
      AND date = ?
      AND status IN ('requested', 'confirmed')
  `);
  const info = stmt.run(time || null, clientNote || null, now, clientId, dateStr);
  return info.changes; // 0 = rien mis à jour, 1 = ok
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

// ─────────────────────────────────────────────
// Fonctions dédiées à l'admin
// ─────────────────────────────────────────────

// Liste globale des rendez-vous, joints avec les infos client
function getAllAppointmentsWithClient(limit) {
  const stmt = db.prepare(`
    SELECT
      a.*,
      c.full_name,
      c.vehicle_model,
      c.vehicle_plate
    FROM appointments a
    JOIN clients c ON c.id = a.client_id
    ORDER BY a.date DESC, a.time ASC, a.id DESC
    LIMIT ?
  `);
  return stmt.all(limit);
}

// Met à jour la note et l'avis client
function updateAppointmentUserReview(id, rating, review) {
  const now = nowUnix();
  const stmt = db.prepare(`
    UPDATE appointments
    SET user_rating = ?,
        user_review = ?,
        updated_at = ?
    WHERE id = ?
  `);
  const info = stmt.run(
    rating != null ? rating : null,
    review || null,
    now,
    id
  );
  return info.changes; // 0 = rien, 1 = ok
}

// Change le statut d'un rendez-vous (requested / confirmed / done / cancelled)
function updateAppointmentStatus(id, newStatus) {
  const now = nowUnix();
  const stmt = db.prepare(`
    UPDATE appointments
    SET status = ?, updated_at = ?
    WHERE id = ?
  `);
  const info = stmt.run(newStatus, now, id);
  return info.changes; // 0 = pas trouvé / inchangé, 1 = ok
}

// Met à jour la note admin
function updateAppointmentAdminNote(id, adminNote) {
  const now = nowUnix();
  const stmt = db.prepare(`
    UPDATE appointments
    SET admin_note = ?, updated_at = ?
    WHERE id = ?
  `);
  const info = stmt.run(adminNote, now, id);
  return info.changes;
}

// ─────────────────────────────────────────────
// PHOTOS DE RENDEZ-VOUS
// ─────────────────────────────────────────────

function getAppointmentPhotos(appointmentId) {
  return db
    .prepare(
      `
      SELECT id, appointment_id, url, is_cover, caption, created_at
      FROM appointment_photos
      WHERE appointment_id = ?
      ORDER BY is_cover DESC, created_at ASC, id ASC
    `
    )
    .all(appointmentId);
}

function insertAppointmentPhoto(appointmentId, url, caption = null, isCover = 0) {
  const now = nowUnix();
  const info = db
    .prepare(
      `
      INSERT INTO appointment_photos (appointment_id, url, is_cover, caption, created_at)
      VALUES (?, ?, ?, ?, ?)
    `
    )
    .run(appointmentId, url, isCover ? 1 : 0, caption || null, now);

  return db
    .prepare(
      `
      SELECT id, appointment_id, url, is_cover, caption, created_at
      FROM appointment_photos
      WHERE id = ?
    `
    )
    .get(info.lastInsertRowid);
}

function hasAppointmentPhotos(appointmentId) {
  const row = db
    .prepare(
      `
      SELECT 1 AS has_photos
      FROM appointment_photos
      WHERE appointment_id = ?
      LIMIT 1
    `
    )
    .get(appointmentId);

  return !!row;
}

module.exports = {
  formatDateLocal,
  getAppointmentsForMonth,
  getAppointmentsForClient,
  getAppointmentByDate,
  getAppointmentById,
  createRequestedAppointment,
  updateAppointmentTimeForClient,
  cancelAppointmentForClientOnDate,
  getAllAppointmentsWithClient,
  updateAppointmentStatus,
  updateAppointmentAdminNote,
  updateAppointmentUserReview,

  // photos
  getAppointmentPhotos,
  insertAppointmentPhoto,
  hasAppointmentPhotos,
};
