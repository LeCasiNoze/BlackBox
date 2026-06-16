const { db } = require("./index");

function pad(n) {
  return String(n).padStart(2, "0");
}

// Statistiques admin pour un mois donne (monthIndex 0-11).
function getAdminMonthlyStats(year, monthIndex) {
  const y = Number(year);
  const m = Number(monthIndex);
  const monthLike = `${y}-${pad(m + 1)}-%`; // 'YYYY-MM-%'
  const startUnix = Math.floor(new Date(y, m, 1).getTime() / 1000);
  const endUnix = Math.floor(new Date(y, m + 1, 1).getTime() / 1000);

  const revenue = db
    .prepare(
      `SELECT COALESCE(SUM(amount_cents), 0) AS cents, COUNT(*) AS n
       FROM topup_orders WHERE paid_at >= ? AND paid_at < ?`,
    )
    .get(startUnix, endUnix);

  const byStatus = { requested: 0, confirmed: 0, done: 0, cancelled: 0 };
  for (const row of db
    .prepare(`SELECT status, COUNT(*) AS n FROM appointments WHERE date LIKE ? GROUP BY status`)
    .all(monthLike)) {
    if (byStatus[row.status] !== undefined) byStatus[row.status] = row.n;
  }

  const doneAgg = db
    .prepare(
      `SELECT COALESCE(SUM(credits_charged), 0) AS credits,
              COALESCE(SUM(bc_points_granted), 0) AS bc
       FROM appointments WHERE status = 'done' AND date LIKE ?`,
    )
    .get(monthLike);

  const newClients = db
    .prepare(`SELECT COUNT(*) AS n FROM clients WHERE created_at >= ? AND created_at < ?`)
    .get(startUnix, endUnix);

  const totals = db
    .prepare(`SELECT COUNT(*) AS clients, COALESCE(SUM(is_founder), 0) AS founders FROM clients`)
    .get();

  const activeEvents = db
    .prepare(`SELECT COUNT(*) AS n FROM events WHERE is_active = 1`)
    .get();

  return {
    year: y,
    monthIndex: m,
    revenueCents: revenue?.cents || 0,
    payments: revenue?.n || 0,
    appointments: byStatus,
    appointmentsTotal:
      byStatus.requested + byStatus.confirmed + byStatus.done + byStatus.cancelled,
    creditsConsumed: doneAgg?.credits || 0,
    bcDistributed: doneAgg?.bc || 0,
    newClients: newClients?.n || 0,
    totalClients: totals?.clients || 0,
    totalFounders: totals?.founders || 0,
    activeEvents: activeEvents?.n || 0,
  };
}

// Analytics admin: funnel d'inscription, cohortes de retention, heatmap creneaux.
function getAdminAnalytics() {
  // --- Funnel inscription (codes demandes -> comptes crees) ---
  let requested = 0;
  let used = 0;
  for (const row of db.prepare(`SELECT status, COUNT(*) AS n FROM signup_codes GROUP BY status`).all()) {
    requested += row.n;
    if (row.status === "used") used += row.n;
  }

  // --- Cohortes de retention (BBX vs Fondateurs) ---
  const cutoff90 = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  function retentionFor(founder) {
    const where = founder
      ? "c.client_type = 'bbx' AND c.is_founder = 1"
      : "c.client_type = 'bbx' AND c.is_founder = 0";
    const total = db.prepare(`SELECT COUNT(*) AS n FROM clients c WHERE ${where}`).get().n;
    const withVisit = db
      .prepare(
        `SELECT COUNT(DISTINCT c.id) AS n FROM clients c
         JOIN appointments a ON a.client_id = c.id
         WHERE ${where} AND a.status = 'done'`,
      )
      .get().n;
    const active90 = db
      .prepare(
        `SELECT COUNT(DISTINCT c.id) AS n FROM clients c
         JOIN appointments a ON a.client_id = c.id
         WHERE ${where} AND a.status = 'done' AND a.date >= ?`,
      )
      .get(cutoff90).n;
    const repeat = db
      .prepare(
        `SELECT COUNT(*) AS n FROM (
           SELECT c.id FROM clients c
           JOIN appointments a ON a.client_id = c.id
           WHERE ${where} AND a.status = 'done'
           GROUP BY c.id HAVING COUNT(*) >= 2
         )`,
      )
      .get().n;
    return { total, withVisit, active90, repeat };
  }

  // --- Heatmap creneaux (180 derniers jours, hors annules) ---
  const cutoff180 = new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10);
  const heatmap = {};
  for (const row of db
    .prepare(`SELECT date, slot FROM appointments WHERE status != 'cancelled' AND date >= ?`)
    .all(cutoff180)) {
    const weekday = new Date(`${row.date}T00:00:00`).getDay(); // 0 = dimanche
    const slot = row.slot === "afternoon" ? "afternoon" : "morning";
    const key = `${weekday}-${slot}`;
    heatmap[key] = (heatmap[key] || 0) + 1;
  }

  return {
    funnel: { requested, used, rate: requested ? Math.round((used / requested) * 100) : 0 },
    retention: { bbx: retentionFor(false), founders: retentionFor(true) },
    heatmap,
  };
}

module.exports = { getAdminMonthlyStats, getAdminAnalytics };
