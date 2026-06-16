const { listWaitlistForSlot, clearWaitlistForSlot } = require("../db/waitlist");
const { sendWaitlistSlotFreedEmail } = require("../email");

// Un creneau (date + slot) s'est libere: on previent TOUS les inscrits en
// liste d'attente (premier arrive, premier servi) puis on vide la liste.
async function notifyWaitlistForFreedSlot(date, slot) {
  if (!date || !slot) return 0;

  const entries = listWaitlistForSlot(date, slot);
  if (entries.length === 0) return 0;

  for (const client of entries) {
    try {
      await sendWaitlistSlotFreedEmail({ client, date, slot });
    } catch (error) {
      console.error("[waitlistNotifier] notify:", error);
    }
  }

  clearWaitlistForSlot(date, slot);
  return entries.length;
}

module.exports = { notifyWaitlistForFreedSlot };
