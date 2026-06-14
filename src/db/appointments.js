const { db, nowUnix } = require("./index");

const APPOINTMENT_SLOTS = ["morning", "afternoon"];
const CLEANLINESS_LEVELS = [
  "very_clean",
  "correct",
  "dirty",
  "very_dirty",
  "reset_recommended",
];

const SERVICE_LEVELS = ["clean", "correct", "dirty"];

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

function normalizeCleanlinessRating(value) {
  if (!value) return null;

  if (value === "very_dirty" || value === "reset_recommended") {
    return "dirty";
  }

  return CLEANLINESS_LEVELS.includes(value) ? value : null;
}

function normalizeServiceLevel(value) {
  if (value === "very_clean") return "clean";
  if (value === "clean" || value === "correct" || value === "dirty") return value;
  return null;
}

function serviceLevelCredits(value) {
  const normalized = normalizeServiceLevel(value);
  if (normalized === "dirty") return 3;
  if (normalized === "correct") return 2;
  return 1;
}

function sanitizeCleanlinessRating(value) {
  return normalizeCleanlinessRating(value);
}

function cleanlinessPenaltyCredits(value) {
  const normalized = normalizeCleanlinessRating(value);
  if (normalized === "correct") return 1;
  if (normalized === "dirty") return 2;
  return 0;
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
  serviceLevel,
  status = "requested",
  priceStatus = "pending_admin",
  approvedCredits = null,
  creditsCharged = 0,
}) {
  const now = nowUnix();
  const normalizedSlot = normalizeAppointmentSlot(slot, time);
  const normalizedTime = time || defaultTimeForSlot(normalizedSlot);
  const normalizedLocation = sanitizeLocation(location);
  const normalizedServiceLevel = normalizeServiceLevel(serviceLevel) || "clean";
  const requestedCredits = serviceLevelCredits(normalizedServiceLevel);

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
        client_cleanliness_estimate,
        requested_credits,
        approved_credits,
        credits_charged,
        price_status,
        credits_charged_at,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    )
    .run(
      clientId,
      vehicleId || null,
      dateStr,
      normalizedSlot,
      normalizedTime,
      status,
      clientNote || null,
      normalizedLocation,
      normalizedServiceLevel,
      requestedCredits,
      approvedCredits,
      creditsCharged,
      priceStatus,
      creditsCharged > 0 ? now : null,
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
  serviceLevel,
}) {
  const now = nowUnix();
  const normalizedSlot = normalizeAppointmentSlot(slot, time);
  const normalizedTime = time || defaultTimeForSlot(normalizedSlot);
  const normalizedLocation = sanitizeLocation(location);
  const normalizedServiceLevel = normalizeServiceLevel(serviceLevel);

  const info = db
    .prepare(
      `
      UPDATE appointments
      SET time = ?,
          client_note = COALESCE(?, client_note),
          location = COALESCE(?, location),
          vehicle_id = COALESCE(?, vehicle_id),
          client_cleanliness_estimate = COALESCE(?, client_cleanliness_estimate),
          requested_credits = CASE
            WHEN ? IS NOT NULL THEN ?
            ELSE requested_credits
          END,
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
      normalizedServiceLevel,
      normalizedServiceLevel,
      normalizedServiceLevel ? serviceLevelCredits(normalizedServiceLevel) : null,
      now,
      clientId,
      dateStr,
      normalizedSlot,
    );

  return info.changes;
}

function refundChargedCreditsInTransaction(appointment) {
  const charged = Math.max(0, Number(appointment?.credits_charged || 0));
  if (!charged || !appointment?.client_id) {
    return false;
  }

  db.prepare(
    `
    UPDATE clients
    SET formula_remaining = COALESCE(formula_remaining, 0) + ?,
        updated_at = ?
    WHERE id = ?
  `,
  ).run(charged, nowUnix(), appointment.client_id);

  db.prepare(
    `
    UPDATE appointments
    SET credits_charged = 0,
        credits_charged_at = NULL,
        updated_at = ?
    WHERE id = ?
  `,
  ).run(nowUnix(), appointment.id);

  return true;
}

function chargeAppointmentCreditsInTransaction(appointmentId, credits) {
  const appointment = db
    .prepare(
      `
      SELECT *
      FROM appointments
      WHERE id = ?
      LIMIT 1
    `,
    )
    .get(appointmentId);

  if (!appointment) return { ok: false, error: "appointment_not_found" };
  if (Number(appointment.credits_charged || 0) > 0) {
    return { ok: true, alreadyCharged: true, appointment };
  }

  const needed = Math.max(0, Number(credits || 0));
  if (needed <= 0) {
    db.prepare(
      `
      UPDATE appointments
      SET approved_credits = 0,
          credits_charged = 0,
          price_status = 'not_required',
          status = 'confirmed',
          updated_at = ?
      WHERE id = ?
    `,
    ).run(nowUnix(), appointmentId);

    return { ok: true, appointment: getAppointmentById(appointmentId) };
  }

  const client = db
    .prepare(`SELECT id, formula_remaining FROM clients WHERE id = ? LIMIT 1`)
    .get(appointment.client_id);
  if (!client) return { ok: false, error: "client_not_found" };
  if (Number(client.formula_remaining || 0) < needed) {
    db.prepare(
      `
      UPDATE appointments
      SET approved_credits = ?,
          price_status = 'waiting_payment',
          updated_at = ?
      WHERE id = ?
    `,
    ).run(needed, nowUnix(), appointmentId);

    return { ok: false, error: "not_enough_credits", appointment: getAppointmentById(appointmentId) };
  }

  db.prepare(
    `
    UPDATE clients
    SET formula_remaining = COALESCE(formula_remaining, 0) - ?,
        updated_at = ?
    WHERE id = ?
  `,
  ).run(needed, nowUnix(), appointment.client_id);

  db.prepare(
    `
    UPDATE appointments
    SET approved_credits = ?,
        credits_charged = ?,
        credits_charged_at = ?,
        price_status = 'approved',
        status = 'confirmed',
        updated_at = ?
    WHERE id = ?
  `,
  ).run(needed, needed, nowUnix(), nowUnix(), appointmentId);

  return { ok: true, appointment: getAppointmentById(appointmentId) };
}

function reviewAppointmentPrice(
  id,
  { adminLevel, customCredits = null, requestPhotos = false, photosMessage = null } = {},
) {
  return db.transaction((appointmentId) => {
    const appointment = getAppointmentById(appointmentId);
    if (!appointment) return { ok: false, error: "appointment_not_found" };
    if (appointment.status === "cancelled" || appointment.status === "done") {
      return { ok: false, error: "appointment_not_editable" };
    }

    if (requestPhotos) {
      db.prepare(
        `
        UPDATE appointments
        SET price_status = 'waiting_photos',
            photos_requested_at = ?,
            photos_request_message = ?,
            updated_at = ?
        WHERE id = ?
      `,
      ).run(nowUnix(), photosMessage || null, nowUnix(), appointmentId);

      return { ok: true, appointment: getAppointmentById(appointmentId), needsPhotos: true };
    }

    const normalizedAdminLevel =
      normalizeServiceLevel(adminLevel) || normalizeServiceLevel(appointment.client_cleanliness_estimate) || "clean";
    const requestedCredits = Math.max(
      serviceLevelCredits(appointment.client_cleanliness_estimate),
      Number(appointment.requested_credits || 1),
    );
    const adminCredits = serviceLevelCredits(normalizedAdminLevel);
    const customCreditValue = Number(customCredits);
    const approvedCredits = Number.isFinite(customCreditValue) && customCreditValue > 0
      ? Math.floor(customCreditValue)
      : Math.max(requestedCredits, adminCredits);

    db.prepare(
      `
      UPDATE appointments
      SET admin_cleanliness_estimate = ?,
          approved_credits = ?,
          updated_at = ?
      WHERE id = ?
    `,
    ).run(normalizedAdminLevel, approvedCredits, nowUnix(), appointmentId);

    if (approvedCredits > requestedCredits) {
      db.prepare(
        `
        UPDATE appointments
        SET price_status = 'waiting_client_approval',
            updated_at = ?
        WHERE id = ?
      `,
      ).run(nowUnix(), appointmentId);

      return { ok: true, appointment: getAppointmentById(appointmentId), requiresClientApproval: true };
    }

    return chargeAppointmentCreditsInTransaction(appointmentId, approvedCredits);
  })(id);
}

function acceptAppointmentPriceForClient(appointmentId, clientId) {
  return db.transaction((id, ownerId) => {
    const appointment = getAppointmentById(id);
    if (!appointment || appointment.client_id !== ownerId) {
      return { ok: false, error: "appointment_not_found" };
    }
    if (!["waiting_client_approval", "waiting_payment"].includes(appointment.price_status)) {
      return { ok: false, error: "price_not_waiting" };
    }

    db.prepare(
      `
      UPDATE appointments
      SET client_price_approved_at = COALESCE(client_price_approved_at, ?),
          updated_at = ?
      WHERE id = ?
    `,
    ).run(nowUnix(), nowUnix(), id);

    const credits = Number(appointment.approved_credits || appointment.requested_credits || 1);
    return chargeAppointmentCreditsInTransaction(id, credits);
  })(appointmentId, clientId);
}

function markAppointmentClientPhotosAdded(appointmentId) {
  return db
    .prepare(
      `
      UPDATE appointments
      SET price_status = CASE
            WHEN price_status = 'waiting_photos' THEN 'pending_admin'
            ELSE price_status
          END,
          updated_at = ?
      WHERE id = ?
    `,
    )
    .run(nowUnix(), appointmentId).changes;
}

function cancelAppointmentAndRefund(id) {
  return db.transaction((appointmentId) => {
    const appointment = getAppointmentById(appointmentId);
    if (!appointment) return 0;
    refundChargedCreditsInTransaction(appointment);
    return db
      .prepare(
        `
        UPDATE appointments
        SET status = 'cancelled',
            price_status = 'declined',
            updated_at = ?
        WHERE id = ?
      `,
      )
      .run(nowUnix(), appointmentId).changes;
  })(id);
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

function syncAppointmentCleanlinessPenaltyInTransaction(appointmentId) {
  const appointment = db
    .prepare(
      `
      SELECT
        id,
        client_id,
        status,
        cleanliness_rating,
        COALESCE(cleanliness_penalty_applied, 0) AS cleanliness_penalty_applied
      FROM appointments
      WHERE id = ?
      LIMIT 1
    `,
    )
    .get(appointmentId);

  if (!appointment) {
    return null;
  }

  const currentPenalty = Number(appointment.cleanliness_penalty_applied || 0);
  const targetPenalty =
    appointment.status === "done"
      ? cleanlinessPenaltyCredits(appointment.cleanliness_rating)
      : 0;
  const delta = targetPenalty - currentPenalty;

  if (delta !== 0) {
    db.prepare(
      `
      UPDATE clients
      SET formula_remaining = COALESCE(formula_remaining, 0) - ?,
          updated_at = ?
      WHERE id = ?
    `,
    ).run(delta, nowUnix(), appointment.client_id);
  }

  if (delta !== 0 || currentPenalty !== targetPenalty) {
    db.prepare(
      `
      UPDATE appointments
      SET cleanliness_penalty_applied = ?
      WHERE id = ?
    `,
    ).run(targetPenalty, appointmentId);
  }

  return {
    appointmentId,
    currentPenalty,
    targetPenalty,
    delta,
  };
}

function syncAppointmentCleanlinessPenalty(id) {
  return db.transaction((appointmentId) =>
    syncAppointmentCleanlinessPenaltyInTransaction(appointmentId),
  )(id);
}

function updateAppointmentAdminWorkspace(id, { adminNote, cleanlinessRating } = {}) {
  return db.transaction((appointmentId) => {
    const changes = db
      .prepare(
        `
        UPDATE appointments
        SET admin_note = ?,
            cleanliness_rating = ?,
            updated_at = ?
        WHERE id = ?
      `,
      )
      .run(
        adminNote || null,
        sanitizeCleanlinessRating(cleanlinessRating),
        nowUnix(),
        appointmentId,
      ).changes;

    if (changes) {
      syncAppointmentCleanlinessPenaltyInTransaction(appointmentId);
    }

    return changes;
  })(id);
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
            WHEN 'very_clean' THEN 3
            WHEN 'correct' THEN 2
            WHEN 'dirty' THEN 1
            WHEN 'very_dirty' THEN 1
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
  SERVICE_LEVELS,
  acceptAppointmentPriceForClient,
  cancelAppointmentForClientOnDate,
  cancelAppointmentAndRefund,
  cleanlinessPenaltyCredits,
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
  markAppointmentClientPhotosAdded,
  normalizeCleanlinessRating,
  normalizeAppointmentSlot,
  normalizeServiceLevel,
  reviewAppointmentPrice,
  sanitizeCleanlinessRating,
  serviceLevelCredits,
  syncAppointmentCleanlinessPenalty,
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
