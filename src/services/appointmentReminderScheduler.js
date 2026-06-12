const { db, nowUnix } = require("../db");
const {
  sendAdminAppointmentReminderEmail,
  sendClientAppointmentReminderEmail,
} = require("../email");

const PARIS_TIMEZONE = "Europe/Paris";
const CHECK_INTERVAL_MS = 60 * 1000;
const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

let schedulerStarted = false;
let running = false;

function parisDateTimeKey(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: PARIS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function appointmentDateTimeKey(appointment) {
  const fallbackTime = appointment.slot === "afternoon" ? "14:00" : "09:00";
  const time = typeof appointment.time === "string" && appointment.time ? appointment.time : fallbackTime;
  return `${appointment.date}T${time}`;
}

function appointmentIsWithinReminderWindow(appointment, now = new Date()) {
  const appointmentKey = appointmentDateTimeKey(appointment);
  const nowKey = parisDateTimeKey(now);
  const horizonKey = parisDateTimeKey(new Date(now.getTime() + REMINDER_WINDOW_MS));

  return appointmentKey > nowKey && appointmentKey <= horizonKey;
}

function listPending24hReminderAppointments() {
  return db
    .prepare(
      `
      SELECT
        a.*,
        c.slug,
        c.card_code,
        c.first_name,
        c.last_name,
        c.full_name,
        c.email,
        c.phone,
        c.client_type,
        COALESCE(v.label, '') AS vehicle_label,
        COALESCE(v.model, c.vehicle_model) AS vehicle_model,
        COALESCE(v.plate, c.vehicle_plate) AS vehicle_plate
      FROM appointments a
      JOIN clients c ON c.id = a.client_id
      LEFT JOIN vehicles v ON v.id = a.vehicle_id
      WHERE a.status = 'confirmed'
        AND (
          a.admin_reminder_24h_sent_at IS NULL
          OR a.client_reminder_24h_sent_at IS NULL
        )
      ORDER BY a.date ASC, COALESCE(a.time, '09:00') ASC, a.id ASC
    `,
    )
    .all();
}

function markReminderSent(appointmentId, columnName) {
  if (!["admin_reminder_24h_sent_at", "client_reminder_24h_sent_at"].includes(columnName)) {
    throw new Error(`Invalid reminder column: ${columnName}`);
  }

  db.prepare(
    `
    UPDATE appointments
    SET ${columnName} = ?
    WHERE id = ?
  `,
  ).run(nowUnix(), appointmentId);
}

async function processAppointmentRemindersOnce() {
  if (running) {
    return;
  }

  running = true;

  try {
    const appointments = listPending24hReminderAppointments().filter((appointment) =>
      appointmentIsWithinReminderWindow(appointment),
    );

    for (const appointment of appointments) {
      if (appointment.admin_reminder_24h_sent_at == null) {
        try {
          const sent = await sendAdminAppointmentReminderEmail({
            appointment,
            client: appointment,
          });
          if (sent) {
            markReminderSent(appointment.id, "admin_reminder_24h_sent_at");
          }
        } catch (error) {
          console.error("[appointmentReminderScheduler] admin reminder:", error);
        }
      }

      if (appointment.client_reminder_24h_sent_at == null) {
        if (!appointment.email || appointment.client_type === "data") {
          markReminderSent(appointment.id, "client_reminder_24h_sent_at");
          continue;
        }

        try {
          const sent = await sendClientAppointmentReminderEmail({
            appointment,
            client: appointment,
          });
          if (sent) {
            markReminderSent(appointment.id, "client_reminder_24h_sent_at");
          }
        } catch (error) {
          console.error("[appointmentReminderScheduler] client reminder:", error);
        }
      }
    }
  } finally {
    running = false;
  }
}

function startAppointmentReminderScheduler() {
  if (schedulerStarted) {
    return;
  }

  schedulerStarted = true;
  void processAppointmentRemindersOnce();
  setInterval(() => {
    void processAppointmentRemindersOnce();
  }, CHECK_INTERVAL_MS);
}

module.exports = {
  appointmentDateTimeKey,
  appointmentIsWithinReminderWindow,
  processAppointmentRemindersOnce,
  startAppointmentReminderScheduler,
};
