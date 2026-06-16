const { db } = require("./index");

// Recap annuel d'un client (annee civile): visites effectuees, credits
// consommes, BC'Coins gagnes, vehicules, avis, photos.
function getClientYearRecap(clientId, year) {
  const y = Number(year) || new Date().getFullYear();
  const start = `${y}-01-01`;
  const end = `${y}-12-31`;

  const agg = db
    .prepare(
      `
      SELECT
        COUNT(*) AS visits,
        COALESCE(SUM(credits_charged), 0) AS credits,
        COALESCE(SUM(bc_points_granted), 0) AS bc,
        COUNT(DISTINCT vehicle_id) AS vehicles,
        MIN(date) AS first_date,
        MAX(date) AS last_date,
        SUM(CASE WHEN user_rating IS NOT NULL THEN 1 ELSE 0 END) AS reviews
      FROM appointments
      WHERE client_id = ? AND status = 'done' AND date >= ? AND date <= ?
    `,
    )
    .get(clientId, start, end);

  const photos = db
    .prepare(
      `
      SELECT COUNT(*) AS n
      FROM appointment_photos p
      JOIN appointments a ON a.id = p.appointment_id
      WHERE a.client_id = ? AND a.status = 'done' AND a.date >= ? AND a.date <= ?
    `,
    )
    .get(clientId, start, end);

  return {
    year: y,
    visits: agg?.visits || 0,
    creditsUsed: agg?.credits || 0,
    bcEarned: agg?.bc || 0,
    vehicles: agg?.vehicles || 0,
    reviews: agg?.reviews || 0,
    photos: photos?.n || 0,
    firstDate: agg?.first_date || null,
    lastDate: agg?.last_date || null,
  };
}

module.exports = { getClientYearRecap };
