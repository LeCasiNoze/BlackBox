const { expireUnpaidAppointmentQuotes } = require("../db/appointments");

const CHECK_INTERVAL_MS = 60 * 1000;
let schedulerStarted = false;

function processAppointmentQuoteExpirationsOnce() {
  try {
    const expired = expireUnpaidAppointmentQuotes();
    if (expired > 0) {
      console.log(`[RDV] ${expired} devis expire(s), creneau(x) libere(s).`);
    }
    return expired;
  } catch (error) {
    console.error("[appointmentQuoteExpiryScheduler] expiration:", error);
    return 0;
  }
}

function startAppointmentQuoteExpiryScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;
  processAppointmentQuoteExpirationsOnce();
  setInterval(processAppointmentQuoteExpirationsOnce, CHECK_INTERVAL_MS);
}

module.exports = {
  processAppointmentQuoteExpirationsOnce,
  startAppointmentQuoteExpiryScheduler,
};
