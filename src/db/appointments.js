const { db, nowUnix } = require("./index");

const APPOINTMENT_SLOTS = ["morning", "afternoon"];

function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeAppointmentSlot(slot, fallbackTime = null) {
  if (slot === "morning" || slot === "afternoon") {
    return slot;
  }

  if (typeof fallbackTime === "string") {
    const hour = Number(fallbackTime.slice(0, 2));
    if (Number.isFinite(hour) && hour >= 14) {
      return "afternoon";
    }
  }

  return "morning";
}

function defaultTimeForSlot(slot) {
  return normalizeAppointmentSlot(slot) === "afternoon" ? "14:00" : "09:00";
}

function sanitizeLocation(location) {
  if (location === "domicile") return "domicile";
  if (location === "atelier") return "atelier";
  return null;
}

function slotOrderSql(column = "slot") {
  return `CASE ${column} WHEN 'morning' THEN 0 ELSE 1 END`;
}

function getAppointmentsForMonth(year, monthIndex) {
  const start = new Date(year, monthIndex, 1);
  const nextMonth = new Date(year, monthIndex + 1, 1);

  const startStr = formatDateLocal(start);
  const endStr = formatDateLocal(nextMonth);

  return db
    .prepare(
      `
      SELECT *
      FROM appointments
      WHERE date >= ?
        AND date < ?
        AND status != 'cancelled'
      ORDER BY date ASC, ${slotOrderSql("slot")} ASC, time ASC, id ASC
    `
    )
    .all(startStr, endStr);
}

function getAppointmentsForClient(clientId) {
  return db
    .prepare(
      `
      SELECT *
      FROM appointments
      WHERE client_id = ?
      ORDER BY date ASC, ${slotOrderSql("slot")} ASC, time ASC, id ASC
    `
    )
    .all(clientId);
}

function getAppointmentsByDate(dateStr) {
  return db
    .prepare(
      `
      SELECT *
      FROM appointments
      WHERE date = ?
      ORDER BY ${slotOrderSql("slot")} ASC, time ASC, id ASC
    `
    )
    .all(dateStr);
}

function getAppointmentByDate(dateStr) {
  return (
    db
      .prepare(
        `
        SELECT *
        FROM appointments
        WHERE date = ?
        ORDER BY ${slotOrderSql("slot")} ASC, time ASC, id ASC
        LIMIT 1
      `
      )
      .get(dateStr) || null
  );
}

function getAppointmentByDateAndSlot(dateStr, slot) {
  return (
    db
      .prepare(
        `
        SELECT *
        FROM appointments
        WHERE date = ?
          AND slot = ?
        ORDER BY id DESC
        LIMIT 1
      `
      )
      .get(dateStr, normalizeAppointmentSlot(slot)) || null
  );
}

function getAppointmentById(id) {
  return (
    db
      .prepare(
        `
        SELECT *
        FROM appointments
        WHERE id = ?
        LIMIT 1
      `
      )
      .get(id) || null
  );
}

function createRequestedAppointmentForSlot({
  clientId,
  dateStr,
  slot,
  time,
  clientNote,
  location,
}) {
  const now = nowUnix();
  const normalizedSlot = normalizeAppointmentSlot(slot, time);
  const normalizedTime = time || defaultTimeForSlot(normalizedSlot);
  const normalizedLocation = sanitizeLocation(location);

  const info = db
    .prepare(
      `
      INSERT INTO appointments (
        client_id,
        date,
        slot,
        time,
        status,
        client_note,
        location,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, 'requested', ?, ?, ?, ?)
    `
    )
    .run(
      clientId,
      dateStr,
      normalizedSlot,
      normalizedTime,
      clientNote || null,
      normalizedLocation,
      now,
      now
    );

  return info.lastInsertRowid;
}

function createRequestedAppointment(
  clientId,
  dateStr,
  time,
  clientNote,
  location,
  slot
) {
  return createRequestedAppointmentForSlot({
    clientId,
    dateStr,
    slot: normalizeAppointmentSlot(slot, time),
    time,
    clientNote,
    location,
  });
}

function updateAppointmentForClientSlot({
  clientId,
  dateStr,
  slot,
  time,
  clientNote,
  location,
}) {
  const now = nowUnix();
  const normalizedSlot = normalizeAppointmentSlot(slot, time);
  const normalizedTime = time || defaultTimeForSlot(normalizedSlot);
  const normalizedLocation = sanitizeLocation(location);

  const info = db
    .prepare(
      `
      UPDATE appointments
      SET time = ?,
          client_note = COALESCE(?, client_note),
          location = COALESCE(?, location),
          updated_at = ?
      WHERE client_id = ?
        AND date = ?
        AND slot = ?
        AND status IN ('requested', 'confirmed')
    `
    )
    .run(
      normalizedTime,
      clientNote || null,
      normalizedLocation,
      now,
      clientId,
      dateStr,
      normalizedSlot
    );

  return info.changes;
}

function updateAppointmentTimeForClient(
  clientId,
  dateStr,
  time,
  clientNote,
  slot,
  location
) {
  return updateAppointmentForClientSlot({
    clientId,
    dateStr,
    slot: normalizeAppointmentSlot(slot, time),
    time,
    clientNote,
    location,
  });
}

function cancelAppointmentForClientOnDate(clientId, dateStr, slot = null) {
  const now = nowUnix();

  if (slot) {
    return db
      .prepare(
        `
        UPDATE appointments
        SET status = 'cancelled',
            updated_at = ?
        WHERE client_id = ?
          AND date = ?
          AND slot = ?
          AND status IN ('requested', 'confirmed')
      `
      )
      .run(now, clientId, dateStr, normalizeAppointmentSlot(slot)).changes;
  }

  return db
    .prepare(
      `
      UPDATE appointments
      SET status = 'cancelled',
          updated_at = ?
      WHERE client_id = ?
        AND date = ?
        AND status IN ('requested', 'confirmed')
    `
    )
    .run(now, clientId, dateStr).changes;
}

function getAllAppointmentsWithClient(limit) {
  return db
    .prepare(
      `
      SELECT
        a.*,
        c.full_name,
        c.vehicle_model,
        c.vehicle_plate
      FROM appointments a
      JOIN clients c ON c.id = a.client_id
      ORDER BY a.date DESC, ${slotOrderSql("a.slot")} ASC, a.time ASC, a.id DESC
      LIMIT ?
    `
    )
    .all(limit);
}

function updateAppointmentUserReview(id, rating, review) {
  const now = nowUnix();
  return db
    .prepare(
      `
      UPDATE appointments
      SET user_rating = ?,
          user_review = ?,
          updated_at = ?
      WHERE id = ?
    `
    )
    .run(rating != null ? rating : null, review || null, now, id).changes;
}

function updateAppointmentStatus(id, newStatus) {
  const now = nowUnix();
  return db
    .prepare(
      `
      UPDATE appointments
      SET status = ?,
          updated_at = ?
      WHERE id = ?
    `
    )
    .run(newStatus, now, id).changes;
}

function updateAppointmentAdminNote(id, adminNote) {
  const now = nowUnix();
  return db
    .prepare(
      `
      UPDATE appointments
      SET admin_note = ?,
          updated_at = ?
      WHERE id = ?
    `
    )
    .run(adminNote, now, id).changes;
}

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
  APPOINTMENT_SLOTS,
  defaultTimeForSlot,
  formatDateLocal,
  getAppointmentsForMonth,
  getAppointmentsForClient,
  getAppointmentsByDate,
  getAppointmentByDate,
  getAppointmentByDateAndSlot,
  getAppointmentById,
  createRequestedAppointment,
  createRequestedAppointmentForSlot,
  updateAppointmentForClientSlot,
  updateAppointmentTimeForClient,
  cancelAppointmentForClientOnDate,
  getAllAppointmentsWithClient,
  normalizeAppointmentSlot,
  updateAppointmentStatus,
  updateAppointmentAdminNote,
  updateAppointmentUserReview,
  getAppointmentPhotos,
  insertAppointmentPhoto,
  hasAppointmentPhotos,
};
