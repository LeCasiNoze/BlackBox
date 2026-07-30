const {
  getAnsweredQuotesPendingReminder,
  markQuoteReminderSent,
} = require("../db/quoteRequests");
const { sendClientQuoteReminderEmail } = require("../email");

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // Vérification toutes les heures
const REMINDER_AGE_SECONDS = 48 * 60 * 60; // 48 heures sans réponse

async function checkAndSendQuoteReminders() {
  try {
    const pendingQuotes = getAnsweredQuotesPendingReminder(REMINDER_AGE_SECONDS);
    if (!pendingQuotes || pendingQuotes.length === 0) return;

    console.log(`[SCHEDULER] ${pendingQuotes.length} devis en attente de relance.`);

    for (const quote of pendingQuotes) {
      try {
        if (quote.client) {
          await sendClientQuoteReminderEmail({ client: quote.client, quote });
          markQuoteReminderSent(quote.id);
          console.log(`[SCHEDULER] Relance devis #${quote.id} envoyée à ${quote.client.email}`);
        }
      } catch (err) {
        console.error(`[SCHEDULER] Erreur relance devis #${quote.id}:`, err);
      }
    }
  } catch (error) {
    console.error("[SCHEDULER] checkAndSendQuoteReminders failed:", error);
  }
}

function startQuoteReminderScheduler() {
  // Exécution initiale puis récurrente
  void checkAndSendQuoteReminders();
  setInterval(() => {
    void checkAndSendQuoteReminders();
  }, CHECK_INTERVAL_MS);
}

module.exports = {
  startQuoteReminderScheduler,
  checkAndSendQuoteReminders,
};
