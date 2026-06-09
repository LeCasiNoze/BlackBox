const { db, nowUnix } = require("./index");

const APPOINTMENT_SLOTS = ["morning", "afternoon"];
const CLEANLINESS_LEVELS = [
  "very_clean",
  "correct",
  "dirty",
  "very_dirty",
  "reset_recommended",
];

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

function sanitizeCleanlinessRating(value) {
  if (!value) return null;
  return CLEANLINESS_LEVELS.includes(value) ? value : null;
}

function slotOrderSql(column = "slot") {
  return `CASE ${column} WHEN 'morning' THEN 0 ELSE 1 END`;
}

function getAppointmentsForMonth(year, monthIndex) {
  const start = new Date(year, monthIndex, 1);
  const nextMonth = new Date(year, monthIndex + 1, 1);

  return db
    .prepare(
      `
      SELECT *
      FROM appointments
      WHERE date >= ?
        AND date < ?
        AND status != 'cancelled'
      ORDER BY date ASC, ${slotOrderSql("slot")} ASC, time ASC, id ASC
    `,
    )
    .all(formatDateLocal(start), formatDateLocal(nextMonth));
}

function getAppointmentsForClient(clientId, options = {}) {
  const clauses = ["a.client_id = ?"];
  const params = [clientId];

  if (options.vehicleId) {
    clauses.push("a.vehicle_id = ?");
    params.push(options.vehicleId);
  }

  if (options.includeCancelled !== true) {
    clauses.push("a.status != 'cancelled'");
  }

  return db
    .prepare(
      `
      SELECT
        a.*,
        c.full_name,
        c.card_code,
        COALESCE(v.label, '') AS vehicle_label,
        COALESCE(v.model, c.vehicle_model) AS vehicle_model,
        COALESCE(v.plate, c.vehicle_plate) AS vehicle_plate
      FROM appointments a
      JOIN clients c ON c.id = a.client_id
      LEFT JOIN vehicles v ON v.id = a.vehicle_id
      WHERE ${clauses.join(" AND ")}
      ORDER BY a.date DESC, ${slotOrderSql("a.slot")} DESC, a.time DESC, a.id DESC
    `,
    )
    .all(...params);
}

function getAppointmentsByDate(dateStr) {
  return db
    .prepare(
      `
      SELECT *
      FROM appointments
      WHERE date = ?
      ORDER BY ${slotOrderSql("slot")} ASC, time ASC, id ASC
    `,
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
      `,
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
      `,
      )
      .get(dateStr, normalizeAppointmentSlot(slot)) || null
  );
}

function getAppointmentById(id) {
  return (
    db
      .prepare(
        `
        SELECT
          a.*,
          c.full_name,
          c.card_code,
          COALESCE(v.label, '') AS vehicle_label,
          COALESCE(v.model, c.vehicle_model) AS vehicle_model,
          COALESCE(v.plate, c.vehicle_plate) AS vehicle_plate
        FROM appointments a
        JOIN clients c ON c.id = a.client_id
        LEFT JOIN vehicles v ON v.id = a.vehicle_id
        WHERE a.id = ?
        LIMIT 1
      `,
      )
      .get(id) || null
  );
}

function createRequestedAppointmentForSlot({
  clientId,
  vehicleId = null,
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
        vehicle_id,
        date,
        slot,
        time,
        status,
        client_note,
        location,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, 'requested', ?, ?, ?, ?)
    `,
    )
    .run(
      clientId,
      vehicleId || null,
      dateStr,
      normalizedSlot,
      normalizedTime,
      clientNote || null,
      normalizedLocation,
      now,
      now,
    );

  return info.lastInsertRowid;
}

function createRequestedAppointment(clientId, dateStr, time, clientNote, location, slot, vehicleId) {
  return createRequestedAppointmentForSlot({
    clientId,
    vehicleId,
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
  vehicleId,
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
          vehicle_id = COALESCE(?, vehicle_id),
          updated_at = ?
      WHERE client_id = ?
        AND date = ?
        AND slot = ?
        AND status IN ('requested', 'confirmed')
    `,
    )
    .run(
      normalizedTime,
      clientNote || null,
      normalizedLocation,
      vehicleId || null,
      now,
      clientId,
      dateStr,
      normalizedSlot,
    );

  return info.changes;
}

function updateAppointmentTimeForClient(clientId, dateStr, time, clientNote, slot, location, vehicleId) {
  return updateAppointmentForClientSlot({
    clientId,
    dateStr,
    slot: normalizeAppointmentSlot(slot, time),
    time,
    clientNote,
    location,
    vehicleId,
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
      `,
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
    `,
    )
    .run(now, clientId, dateStr).changes;
}

function getAllAppointmentsWithClient(limit = 300) {
  return db
    .prepare(
      `
      SELECT
        a.*,
        c.full_name,
        c.card_code,
        COALESCE(v.label, '') AS vehicle_label,
        COALESCE(v.model, c.vehicle_model) AS vehicle_model,
        COALESCE(v.plate, c.vehicle_plate) AS vehicle_plate
      FROM appointments a
      JOIN clients c ON c.id = a.client_id
      LEFT JOIN vehicles v ON v.id = a.vehicle_id
      ORDER BY a.date DESC, ${slotOrderSql("a.slot")} ASC, a.time ASC, a.id DESC
      LIMIT ?
    `,
    )
    .all(limit);
}

function updateAppointmentUserReview(id, rating, review) {
  return db
    .prepare(
      `
      UPDATE appointments
      SET user_rating = ?,
          user_review = ?,
          updated_at = ?
      WHERE id = ?
    `,
    )
    .run(rating != null ? rating : null, review || null, nowUnix(), id).changes;
}

function updateAppointmentStatus(id, newStatus) {
  return db
    .prepare(
      `
      UPDATE appointments
      SET status = ?,
          updated_at = ?
      WHERE id = ?
    `,
    )
    .run(newStatus, nowUnix(), id).changes;
}

function updateAppointmentAdminWorkspace(id, { adminNote, cleanlinessRating } = {}) {
  return db
    .prepare(
      `
      UPDATE appointments
      SET admin_note = ?,
          cleanliness_rating = ?,
          updated_at = ?
      WHERE id = ?
    `,
    )
    .run(adminNote || null, sanitizeCleanlinessRating(cleanlinessRating), nowUnix(), id).changes;
}

function updateAppointmentAdminNote(id, adminNote) {
  return updateAppointmentAdminWorkspace(id, { adminNote });
}

function updateAppointmentCleanlinessRating(id, cleanlinessRating) {
  return updateAppointmentAdminWorkspace(id, { cleanlinessRating });
}

function updateAppointmentPublicVisibility(id, isPublic) {
  return db
    .prepare(
      `
      UPDATE appointments
      SET is_public = ?,
          updated_at = ?
      WHERE id = ?
    `,
    )
    .run(isPublic ? 1 : 0, nowUnix(), id).changes;
}

function getAppointmentPhotos(appointmentId, options = {}) {
  const onlyPublic = options.onlyPublic === true;
  return db
    .prepare(
      `
      SELECT id, appointment_id, url, is_cover, is_public, caption, created_at
      FROM appointment_photos
      WHERE appointment_id = ?
      ${onlyPublic ? "AND is_public = 1" : ""}
      ORDER BY is_cover DESC, created_at ASC, id ASC
    `,
    )
    .all(appointmentId);
}

function insertAppointmentPhoto(
  appointmentId,
  url,
  caption = null,
  isCover = 0,
  isPublic = 1,
) {
  const info = db
    .prepare(
      `
      INSERT INTO appointment_photos (
        appointment_id,
        url,
        is_cover,
        is_public,
        caption,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    )
    .run(
      appointmentId,
      url,
      isCover ? 1 : 0,
      isPublic ? 1 : 0,
      caption || null,
      nowUnix(),
    );

  return db
    .prepare(
      `
      SELECT id, appointment_id, url, is_cover, is_public, caption, created_at
      FROM appointment_photos
      WHERE id = ?
    `,
    )
    .get(info.lastInsertRowid);
}

function updateAppointmentPhotoPublicVisibility(photoId, appointmentId, isPublic) {
  return db
    .prepare(
      `
      UPDATE appointment_photos
      SET is_public = ?,
          created_at = created_at
      WHERE id = ?
        AND appointment_id = ?
    `,
    )
    .run(isPublic ? 1 : 0, photoId, appointmentId).changes;
}

function hasAppointmentPhotos(appointmentId, onlyPublic = false) {
  const row = db
    .prepare(
      `
      SELECT 1 AS has_photos
      FROM appointment_photos
      WHERE appointment_id = ?
        ${onlyPublic ? "AND is_public = 1" : ""}
      LIMIT 1
    `,
    )
    .get(appointmentId);

  return !!row;
}

function getPublicAppointmentsFeed(limit = 18) {
  return db
    .prepare(
      `
      SELECT
        a.*,
        c.full_name,
        COALESCE(v.label, '') AS vehicle_label,
        COALESCE(v.model, c.vehicle_model) AS vehicle_model,
        COALESCE(v.plate, c.vehicle_plate) AS vehicle_plate
      FROM appointments a
      JOIN clients c ON c.id = a.client_id
      LEFT JOIN vehicles v ON v.id = a.vehicle_id
      WHERE a.status = 'done'
        AND (
          a.user_rating IS NOT NULL
          OR COALESCE(a.user_review, '') != ''
          OR EXISTS (
            SELECT 1
            FROM appointment_photos p
            WHERE p.appointment_id = a.id
          )
        )
      ORDER BY a.date DESC, ${slotOrderSql("a.slot")} DESC, a.time DESC, a.id DESC
      LIMIT ?
    `,
    )
    .all(limit);
}

function getClientCleanlinessAverage(clientId) {
  const row = db
    .prepare(
      `
      SELECT
        COUNT(*) AS total,
        AVG(
          CASE cleanliness_rating
            WHEN 'very_clean' THEN 5
            WHEN 'correct' THEN 4
            WHEN 'dirty' THEN 3
            WHEN 'very_dirty' THEN 2
            WHEN 'reset_recommended' THEN 1
            ELSE NULL
          END
        ) AS average_score
      FROM appointments
      WHERE client_id = ?
        AND cleanliness_rating IS NOT NULL
    `,
    )
    .get(clientId);

  return {
    total: Number(row?.total || 0),
    averageScore:
      row?.average_score == null ? null : Number(Number(row.average_score).toFixed(2)),
  };
}

module.exports = {
  APPOINTMENT_SLOTS,
  CLEANLINESS_LEVELS,
  cancelAppointmentForClientOnDate,
  createRequestedAppointment,
  createRequestedAppointmentForSlot,
  defaultTimeForSlot,
  formatDateLocal,
  getAllAppointmentsWithClient,
  getAppointmentByDate,
  getAppointmentByDateAndSlot,
  getAppointmentById,
  getAppointmentPhotos,
  getAppointmentsByDate,
  getAppointmentsForClient,
  getAppointmentsForMonth,
  getClientCleanlinessAverage,
  getPublicAppointmentsFeed,
  hasAppointmentPhotos,
  insertAppointmentPhoto,
  normalizeAppointmentSlot,
  sanitizeCleanlinessRating,
  updateAppointmentAdminNote,
  updateAppointmentAdminWorkspace,
  updateAppointmentCleanlinessRating,
  updateAppointmentForClientSlot,
  updateAppointmentPhotoPublicVisibility,
  updateAppointmentPublicVisibility,
  updateAppointmentStatus,
  updateAppointmentTimeForClient,
  updateAppointmentUserReview,
};
