const { db, nowUnix } = require("./index");

function recordLandingEvent({ eventType, visitorId, userAgent = null, referrer = null }) {
  if (!eventType || !visitorId) return null;
  const now = nowUnix();
  const info = db
    .prepare(
      `INSERT INTO landing_events (event_type, visitor_id, user_agent, referrer, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      eventType.slice(0, 50),
      visitorId.slice(0, 100),
      userAgent ? String(userAgent).slice(0, 300) : null,
      referrer ? String(referrer).slice(0, 300) : null,
      now,
    );
  return info.lastInsertRowid;
}

function getLandingStats(year, monthIndex) {
  const y = Number(year) || new Date().getFullYear();
  const m = Number(monthIndex) ?? new Date().getMonth();

  const startUnix = Math.floor(new Date(y, m, 1).getTime() / 1000);
  const endUnix = Math.floor(new Date(y, m + 1, 1).getTime() / 1000);
  const last24hUnix = nowUnix() - 86400;

  // Globales (tous temps)
  const totalPageviews =
    db.prepare(`SELECT COUNT(*) AS n FROM landing_events WHERE event_type = 'pageview'`).get().n || 0;
  const totalUniqueVisitors =
    db
      .prepare(`SELECT COUNT(DISTINCT visitor_id) AS n FROM landing_events WHERE event_type = 'pageview'`)
      .get().n || 0;

  // Mensuelles
  const monthPageviews =
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM landing_events
         WHERE event_type = 'pageview' AND created_at >= ? AND created_at < ?`,
      )
      .get(startUnix, endUnix).n || 0;

  const monthUniqueVisitors =
    db
      .prepare(
        `SELECT COUNT(DISTINCT visitor_id) AS n FROM landing_events
         WHERE event_type = 'pageview' AND created_at >= ? AND created_at < ?`,
      )
      .get(startUnix, endUnix).n || 0;

  // 24h
  const pageviews24h =
    db
      .prepare(`SELECT COUNT(*) AS n FROM landing_events WHERE event_type = 'pageview' AND created_at >= ?`)
      .get(last24hUnix).n || 0;
  const uniqueVisitors24h =
    db
      .prepare(
        `SELECT COUNT(DISTINCT visitor_id) AS n FROM landing_events WHERE event_type = 'pageview' AND created_at >= ?`,
      )
      .get(last24hUnix).n || 0;

  // Répartition des événements du mois
  const eventRows = db
    .prepare(
      `SELECT event_type, COUNT(*) AS total, COUNT(DISTINCT visitor_id) AS uniques
       FROM landing_events
       WHERE created_at >= ? AND created_at < ?
       GROUP BY event_type
       ORDER BY total DESC`,
    )
    .all(startUnix, endUnix);

  const eventBreakdown = {};
  for (const r of eventRows) {
    eventBreakdown[r.event_type] = {
      total: r.total,
      uniques: r.uniques,
    };
  }

  const devisClicksUniques = eventBreakdown.click_devis?.uniques || 0;
  const loginClicksUniques = eventBreakdown.click_login?.uniques || 0;

  return {
    year: y,
    monthIndex: m,
    totalPageviews,
    totalUniqueVisitors,
    monthPageviews,
    monthUniqueVisitors,
    pageviews24h,
    uniqueVisitors24h,
    eventBreakdown,
    devisClicksUniques,
    loginClicksUniques,
  };
}

module.exports = {
  recordLandingEvent,
  getLandingStats,
};
