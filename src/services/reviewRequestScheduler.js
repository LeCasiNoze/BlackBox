const { db, nowUnix } = require("../db");
const { sendClientReviewRequestEmail } = require("../email");

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // toutes les heures
const DELAY_SECONDS = 72 * 60 * 60; // 72h apres le passage
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // au-dela de 30j, on ne sollicite plus

let started = false;
let running = false;

// RDV effectues il y a >= 72h, sans avis et sans demande deja envoyee.
function listAppointmentsNeedingReviewRequest() {
  const now = nowUnix();
  return db
    .prepare(
      `
      SELECT
        a.id, a.client_id, a.date, a.slot, a.time,
        c.slug, c.card_code, c.first_name, c.last_name, c.full_name, c.email, c.client_type
      FROM appointments a
      JOIN clients c ON c.id = a.client_id
      WHERE a.status = 'done'
        AND a.review_request_sent_at IS NULL
        AND a.user_rating IS NULL
        AND a.done_at IS NOT NULL
        AND a.done_at <= ?
        AND a.done_at >= ?
        AND c.email IS NOT NULL
        AND c.email != ''
        AND c.client_type != 'data'
    `,
    )
    .all(now - DELAY_SECONDS, now - MAX_AGE_SECONDS);
}

function markReviewRequestSent(appointmentId) {
  db.prepare(`UPDATE appointments SET review_request_sent_at = ? WHERE id = ?`).run(
    nowUnix(),
    appointmentId,
  );
}

async function processReviewRequestsOnce() {
  if (running) return;
  running = true;
  try {
    for (const row of listAppointmentsNeedingReviewRequest()) {
      const client = {
        id: row.client_id,
        slug: row.slug,
        card_code: row.card_code,
        first_name: row.first_name,
        last_name: row.last_name,
        full_name: row.full_name,
        email: row.email,
        client_type: row.client_type,
      };
      const appointment = { id: row.id, date: row.date, slot: row.slot, time: row.time };
      try {
        const sent = await sendClientReviewRequestEmail({ client, appointment });
        // On marque dans tous les cas pour ne pas re-tenter en boucle.
        markReviewRequestSent(row.id);
        if (!sent) {
          // email non configure ou echec: marque quand meme (push a pu partir).
        }
      } catch (error) {
        console.error("[reviewRequestScheduler]", error);
      }
    }
  } finally {
    running = false;
  }
}

function startReviewRequestScheduler() {
  if (started) return;
  started = true;
  void processReviewRequestsOnce();
  setInterval(() => {
    void processReviewRequestsOnce();
  }, CHECK_INTERVAL_MS);
}

module.exports = {
  processReviewRequestsOnce,
  startReviewRequestScheduler,
};
