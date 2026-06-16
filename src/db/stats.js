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

module.exports = { getAdminMonthlyStats };
