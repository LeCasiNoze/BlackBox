const { db, nowUnix } = require("./index");

function sanitize(value) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

// Enregistre (ou met a jour) un abonnement Web Push pour un role donne (admin).
function saveSubscription({ role = "admin", endpoint, p256dh, auth, userAgent = null }) {
  const safeEndpoint = sanitize(endpoint);
  const safeP256dh = sanitize(p256dh);
  const safeAuth = sanitize(auth);

  if (!safeEndpoint || !safeP256dh || !safeAuth) {
    return null;
  }

  const now = nowUnix();

  db.prepare(
    `
    INSERT INTO push_subscriptions (role, endpoint, p256dh, auth, user_agent, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET
      role = excluded.role,
      p256dh = excluded.p256dh,
      auth = excluded.auth,
      user_agent = excluded.user_agent,
      updated_at = excluded.updated_at
  `,
  ).run("admin", safeEndpoint, safeP256dh, safeAuth, sanitize(userAgent), now, now);

  return getSubscriptionByEndpoint(safeEndpoint);
}

function getSubscriptionByEndpoint(endpoint) {
  const safeEndpoint = sanitize(endpoint);
  if (!safeEndpoint) return null;
  return db.prepare(`SELECT * FROM push_subscriptions WHERE endpoint = ?`).get(safeEndpoint) || null;
}

function listSubscriptions(role = "admin") {
  return db
    .prepare(`SELECT * FROM push_subscriptions WHERE role = ? ORDER BY created_at DESC`)
    .all(role);
}

function deleteSubscriptionByEndpoint(endpoint) {
  const safeEndpoint = sanitize(endpoint);
  if (!safeEndpoint) return 0;
  return db.prepare(`DELETE FROM push_subscriptions WHERE endpoint = ?`).run(safeEndpoint).changes;
}

module.exports = {
  saveSubscription,
  getSubscriptionByEndpoint,
  listSubscriptions,
  deleteSubscriptionByEndpoint,
};
