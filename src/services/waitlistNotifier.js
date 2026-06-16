const { listWaitlistForSlot, purgePastWaitlist } = require("../db/waitlist");
const { sendWaitlistSlotFreedEmail } = require("../email");

// Un creneau (date + slot) s'est libere: on previent TOUS les inscrits en
// liste d'attente (premier arrive, premier servi). On NE vide PAS la liste :
// si le creneau se relibere, on re-previent les memes + les nouveaux inscrits.
// Les inscriptions d'un client sont retirees quand il reserve, et les dates
// passees sont purgees automatiquement.
async function notifyWaitlistForFreedSlot(date, slot) {
  if (!date || !slot) return 0;

  try {
    purgePastWaitlist();
  } catch (_error) {
    // best-effort
  }

  const entries = listWaitlistForSlot(date, slot);
  if (entries.length === 0) return 0;

  for (const client of entries) {
    try {
      await sendWaitlistSlotFreedEmail({ client, date, slot });
    } catch (error) {
      console.error("[waitlistNotifier] notify:", error);
    }
  }

  return entries.length;
}

module.exports = { notifyWaitlistForFreedSlot };
