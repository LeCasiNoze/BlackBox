const {
  getAnsweredQuotesPendingReminder,
  markQuoteReminderSent,
  getAnsweredQuotesPendingSecondReminder,
  markQuoteSecondReminderSent,
} = require("../db/quoteRequests");
const { sendClientQuoteReminderEmail } = require("../email");

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // Vérification toutes les heures
const FIRST_REMINDER_AGE_SECONDS = 48 * 60 * 60; // Relance 1 : 48 heures (2 jours)
const SECOND_REMINDER_AGE_SECONDS = 7 * 24 * 60 * 60; // Relance 2 : 1 semaine (7 jours)

async function checkAndSendQuoteReminders() {
  try {
    // ── 1ère Relance : 48h après réponse admin ──
    const firstPendingQuotes = getAnsweredQuotesPendingReminder(FIRST_REMINDER_AGE_SECONDS);
    if (firstPendingQuotes && firstPendingQuotes.length > 0) {
      console.log(`[SCHEDULER] 1ère relance (48h) : ${firstPendingQuotes.length} devis.`);
      for (const quote of firstPendingQuotes) {
        try {
          if (quote.client) {
            await sendClientQuoteReminderEmail({ client: quote.client, quote, isSecondReminder: false });
            markQuoteReminderSent(quote.id);
            console.log(`[SCHEDULER] 1ère relance devis #${quote.id} envoyée à ${quote.client.email}`);
          }
        } catch (err) {
          console.error(`[SCHEDULER] Erreur 1ère relance devis #${quote.id}:`, err);
        }
      }
    }

    // ── 2ème Relance : 1 semaine (7 jours) après réponse admin ──
    const secondPendingQuotes = getAnsweredQuotesPendingSecondReminder(SECOND_REMINDER_AGE_SECONDS);
    if (secondPendingQuotes && secondPendingQuotes.length > 0) {
      console.log(`[SCHEDULER] 2ème relance (1 semaine) : ${secondPendingQuotes.length} devis.`);
      for (const quote of secondPendingQuotes) {
        try {
          if (quote.client) {
            await sendClientQuoteReminderEmail({ client: quote.client, quote, isSecondReminder: true });
            markQuoteSecondReminderSent(quote.id);
            console.log(`[SCHEDULER] 2ème relance devis #${quote.id} (1 semaine) envoyée à ${quote.client.email}`);
          }
        } catch (err) {
          console.error(`[SCHEDULER] Erreur 2ème relance devis #${quote.id}:`, err);
        }
      }
    }
  } catch (error) {
    console.error("[SCHEDULER] checkAndSendQuoteReminders failed:", error);
  }
}

function startQuoteReminderScheduler() {
  // Exécution uniquement sur l'intervalle horaire (ne déclenche pas au reboot du serveur)
  setInterval(() => {
    void checkAndSendQuoteReminders();
  }, CHECK_INTERVAL_MS);
}

module.exports = {
  startQuoteReminderScheduler,
  checkAndSendQuoteReminders,
};
