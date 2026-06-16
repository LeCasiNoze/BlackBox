const { db, nowUnix } = require("../db");
const { sendClientInactivityReminderEmail } = require("../email");

const PARIS_TIMEZONE = "Europe/Paris";
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // toutes les 6h
const INACTIVITY_DAYS = 56; // ~8 semaines sans passage
const COOLDOWN_DAYS = 30; // pas plus d'une relance / 30 jours
const DAY_MS = 24 * 60 * 60 * 1000;

let started = false;
let running = false;

function parisDateKey(date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: PARIS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(
    fmt
      .formatToParts(date)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function shiftDateKey(days) {
  return parisDateKey(new Date(Date.now() + days * DAY_MS));
}

// Clients BBX avec un email, leur dernier RDV effectue et le nombre de RDV a venir.
function listClientsForInactivityCheck(todayKey) {
  return db
    .prepare(
      `
      SELECT
        c.id, c.slug, c.card_code, c.first_name, c.last_name, c.full_name,
        c.email, c.client_type, c.is_founder, c.last_inactivity_reminder_at,
        (SELECT MAX(a.date) FROM appointments a
           WHERE a.client_id = c.id AND a.status = 'done') AS last_done_date,
        (SELECT COUNT(*) FROM appointments a
           WHERE a.client_id = c.id
             AND a.status IN ('requested', 'confirmed')
             AND a.date >= ?) AS upcoming_count
      FROM clients c
      WHERE c.client_type = 'bbx'
        AND c.email IS NOT NULL
        AND c.email != ''
    `,
    )
    .all(todayKey);
}

async function processInactivityRemindersOnce() {
  if (running) return;
  running = true;

  try {
    const todayKey = parisDateKey();
    const thresholdKey = shiftDateKey(-INACTIVITY_DAYS); // date il y a 8 semaines
    const cooldownCutoff = nowUnix() - COOLDOWN_DAYS * 24 * 60 * 60;

    for (const client of listClientsForInactivityCheck(todayKey)) {
      // Un RDV est deja prevu: pas de relance.
      if (Number(client.upcoming_count || 0) > 0) continue;
      // Jamais venu (aucun passage effectue): pas de "dernier detailing" a relancer.
      if (!client.last_done_date) continue;
      // Dernier passage trop recent (< 8 semaines).
      if (client.last_done_date >= thresholdKey) continue;
      // Deja relance dans les 30 derniers jours.
      if (
        client.last_inactivity_reminder_at &&
        Number(client.last_inactivity_reminder_at) > cooldownCutoff
      ) {
        continue;
      }

      const weeksSince = Math.max(
        8,
        Math.round((Date.parse(todayKey) - Date.parse(client.last_done_date)) / (7 * DAY_MS)),
      );

      try {
        const sent = await sendClientInactivityReminderEmail({ client, weeksSince });
        if (sent) {
          db.prepare(`UPDATE clients SET last_inactivity_reminder_at = ? WHERE id = ?`).run(
            nowUnix(),
            client.id,
          );
        }
      } catch (error) {
        console.error("[inactivityReminderScheduler] reminder:", error);
      }
    }
  } finally {
    running = false;
  }
}

function startInactivityReminderScheduler() {
  if (started) return;
  started = true;
  void processInactivityRemindersOnce();
  setInterval(() => {
    void processInactivityRemindersOnce();
  }, CHECK_INTERVAL_MS);
}

module.exports = {
  processInactivityRemindersOnce,
  startInactivityReminderScheduler,
};
