// src/db/appointment_photos.js
const { db } = require("./index");

/**
 * Retourne les photos d'un rendez-vous, en vérifiant que
 * ce rendez-vous appartient bien au client (via le slug).
 */
function getAppointmentPhotosForClientSlug(clientSlug, appointmentId) {
  return db
    .prepare(
      `
      SELECT
        p.id,
        p.url,
        p.is_cover AS isCover,
        p.caption,
        p.created_at AS createdAt
      FROM appointment_photos p
      JOIN appointments a ON a.id = p.appointment_id
      JOIN clients c ON c.id = a.client_id
      WHERE c.slug = ? AND a.id = ?
      ORDER BY p.is_cover DESC, p.created_at DESC
    `
    )
    .all(clientSlug, appointmentId);
}

module.exports = {
  getAppointmentPhotosForClientSlug,
};
