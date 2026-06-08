const express = require("express");
const router = express.Router();

const {
  getClientBySlugOrCardCode,
  getClientById,
  decrementFormulaRemaining,
  incrementFormulaRemaining,
} = require("../db/clients");

const {
  APPOINTMENT_SLOTS,
  createRequestedAppointmentForSlot,
  defaultTimeForSlot,
  getAppointmentByDateAndSlot,
  getAppointmentById,
  getAppointmentPhotos,
  getAppointmentsByDate,
  getAppointmentsForClient,
  getAppointmentsForMonth,
  hasAppointmentPhotos,
  normalizeAppointmentSlot,
  updateAppointmentForClientSlot,
  updateAppointmentUserReview,
  cancelAppointmentForClientOnDate,
} = require("../db/appointments");

const { sendAdminNotification } = require("../email");

const SLOT_START_TIMES = {
  morning: "09:00",
  afternoon: "14:00",
};

const SLOT_END_TIMES = {
  morning: "12:00",
  afternoon: "18:00",
};

function parseMonthParam(value) {
  if (!value || typeof value !== "string") return null;
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (Number.isNaN(year) || Number.isNaN(monthIndex)) return null;

  return { year, monthIndex };
}

function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidSlot(slot) {
  return slot === "morning" || slot === "afternoon";
}

function slotHasPassed(dateStr, slot) {
  const normalizedSlot = normalizeAppointmentSlot(slot);
  const endTime = SLOT_END_TIMES[normalizedSlot];
  return Date.now() > new Date(`${dateStr}T${endTime}:00`).getTime();
}

function isTimeAllowedForSlot(time, slot) {
  if (typeof time !== "string" || !/^\d{2}:\d{2}$/.test(time)) {
    return false;
  }

  const [hourRaw, minuteRaw] = time.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return false;
  }
  if (![0, 30].includes(minute)) {
    return false;
  }

  const normalizedSlot = normalizeAppointmentSlot(slot, time);

  if (normalizedSlot === "morning") {
    return hour >= 9 && hour <= 12 && !(hour === 12 && minute > 0);
  }

  return hour >= 14 && hour <= 18 && !(hour === 18 && minute > 0);
}

function mapClientAppointment(client, appointment) {
  return {
    id: appointment.id,
    date: appointment.date,
    slot: normalizeAppointmentSlot(appointment.slot, appointment.time),
    time: appointment.time,
    status: appointment.status,
    adminNote: appointment.admin_note || null,
    userRating: appointment.user_rating ?? null,
    userReview: appointment.user_review ?? null,
    vehicleModel: client.vehicle_model,
    vehiclePlate: client.vehicle_plate,
    hasPhotos: hasAppointmentPhotos(appointment.id),
    location: appointment.location || null,
  };
}

function buildMonthPayload(client, monthParam) {
  const baseDate = monthParam
    ? new Date(monthParam.year, monthParam.monthIndex, 1)
    : new Date();

  const year = baseDate.getFullYear();
  const monthIndex = baseDate.getMonth();

  const label = baseDate.toLocaleString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const firstDay = new Date(year, monthIndex, 1);
  const nextMonth = new Date(year, monthIndex + 1, 1);

  const appointments = getAppointmentsForMonth(year, monthIndex);
  const byDate = new Map();

  appointments.forEach((appointment) => {
    const slot = normalizeAppointmentSlot(appointment.slot, appointment.time);
    if (!byDate.has(appointment.date)) {
      byDate.set(appointment.date, {});
    }
    byDate.get(appointment.date)[slot] = appointment;
  });

  const days = [];

  for (let date = new Date(firstDay); date < nextMonth; date.setDate(date.getDate() + 1)) {
    const dateStr = formatDateLocal(date);
    const daySlots = {};
    const appointmentsForDate = byDate.get(dateStr) || {};

    APPOINTMENT_SLOTS.forEach((slot) => {
      const appointment = appointmentsForDate[slot] || null;
      const isPast = slotHasPassed(dateStr, slot);
      const isMine = appointment?.client_id === client.id;
      const isActive =
        appointment &&
        (appointment.status === "requested" || appointment.status === "confirmed");

      let status = isPast ? "done" : "free";

      if (appointment) {
        if (appointment.status === "done" || isPast) {
          status = "done";
        } else if (isMine && isActive) {
          status = "mine";
        } else if (isActive) {
          status = "busy";
        }
      }

      daySlots[slot] = {
        slot,
        status,
        time: appointment?.time || null,
        location: appointment?.location || null,
        appointmentId: isMine ? appointment.id : null,
      };
    });

    days.push({
      date: dateStr,
      day: date.getDate(),
      slots: daySlots,
    });
  }

  return {
    year,
    monthIndex,
    label,
    iso: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
    days,
  };
}

router.get("/:idOrSlug", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);

  if (!client) {
    return res.status(404).json({ ok: false, error: "client_not_found" });
  }

  const monthParam = parseMonthParam(req.query.m);
  const month = buildMonthPayload(client, monthParam);

  return res.json({
    ok: true,
    client: {
      id: client.id,
      slug: client.slug,
      cardCode: client.card_code,
      firstName: client.first_name,
      lastName: client.last_name,
      fullName: client.full_name,
      phone: client.phone,
      email: client.email,
      addressLine1: client.address_line1,
      postalCode: client.postal_code,
      city: client.city,
      vehicleModel: client.vehicle_model,
      vehiclePlate: client.vehicle_plate,
      formulaName: client.formula_name,
      formulaTotal: client.formula_total,
      formulaRemaining: client.formula_remaining,
    },
    month,
  });
});

router.get("/:idOrSlug/appointments/:appointmentId/photos", (req, res) => {
  const appointmentId = Number(req.params.appointmentId) || 0;

  if (!appointmentId) {
    return res.status(400).json({ ok: false, error: "invalid_appointment_id" });
  }

  try {
    const rows = getAppointmentPhotos(appointmentId);
    return res.json({
      ok: true,
      photos: rows.map((photo) => ({
        id: photo.id,
        url: photo.url,
        label: photo.caption || null,
      })),
    });
  } catch (error) {
    console.error("[API] getAppointmentPhotos client:", error);
    return res.status(500).json({
      ok: false,
      error: "server_error_loading_photos",
    });
  }
});

router.get("/:idOrSlug/appointments", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);

  if (!client) {
    return res.status(404).json({ ok: false, error: "client_not_found" });
  }

  try {
    const appointments = getAppointmentsForClient(client.id).map((appointment) =>
      mapClientAppointment(client, appointment)
    );

    return res.json({ ok: true, appointments });
  } catch (error) {
    console.error("[API] client appointments:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post("/:idOrSlug/appointments/:appointmentId/review", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!client) {
    return res.status(404).json({ ok: false, error: "client_not_found" });
  }

  const appointmentId = Number(req.params.appointmentId) || 0;
  if (!appointmentId) {
    return res.status(400).json({ ok: false, error: "invalid_appointment_id" });
  }

  const { rating, review } = req.body || {};
  const numericRating = Number(rating);

  if (!numericRating || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ ok: false, error: "invalid_rating" });
  }

  const appointment = getAppointmentById(appointmentId);
  if (!appointment || appointment.client_id !== client.id) {
    return res.status(404).json({ ok: false, error: "appointment_not_found" });
  }

  if (appointment.status !== "done") {
    return res.status(400).json({ ok: false, error: "appointment_not_done" });
  }

  const changes = updateAppointmentUserReview(
    appointmentId,
    numericRating,
    typeof review === "string" && review.trim() !== "" ? review.trim() : null
  );

  if (!changes) {
    return res.status(500).json({ ok: false, error: "cannot_update_review" });
  }

  const updated = getAppointmentById(appointmentId);
  return res.json({
    ok: true,
    appointment: mapClientAppointment(client, updated),
  });
});

router.get("/appointments/:date", (req, res) => {
  const date = req.params.date;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ ok: false, error: "invalid_date" });
  }

  const slotParam = req.query.slot;
  const slot =
    typeof slotParam === "string" && isValidSlot(slotParam)
      ? slotParam
      : slotParam == null
        ? null
        : "__invalid__";

  if (slot === "__invalid__") {
    return res.status(400).json({ ok: false, error: "invalid_slot" });
  }

  const appointment = slot
    ? getAppointmentByDateAndSlot(date, slot)
    : getAppointmentsByDate(date).find((item) => item.status === "done") || null;

  if (!appointment || appointment.status !== "done") {
    return res.status(404).json({
      ok: false,
      error: "appointment_not_found_or_not_done",
    });
  }

  const client = getClientById(appointment.client_id);
  return res.json({
    ok: true,
    appointment: {
      id: appointment.id,
      date: appointment.date,
      slot: normalizeAppointmentSlot(appointment.slot, appointment.time),
      time: appointment.time,
      status: appointment.status,
      adminNote: appointment.admin_note || null,
      userRating: appointment.user_rating ?? null,
      userReview: appointment.user_review ?? null,
      vehicleModel: client?.vehicle_model || null,
      vehiclePlate: client?.vehicle_plate || null,
      clientName: client?.full_name || "Client",
      location: appointment.location || null,
      hasPhotos: hasAppointmentPhotos(appointment.id),
    },
  });
});

router.post("/:idOrSlug/book", async (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!client) {
    return res.status(404).json({ ok: false, error: "client_not_found" });
  }

  const { date, time, location, slot: rawSlot } = req.body || {};
  if (!date) {
    return res.status(400).json({ ok: false, error: "missing_date" });
  }
  if (!isValidSlot(rawSlot)) {
    return res.status(400).json({ ok: false, error: "missing_or_invalid_slot" });
  }

  const slot = normalizeAppointmentSlot(rawSlot, time);
  const normalizedTime = typeof time === "string" && time ? time : defaultTimeForSlot(slot);

  if (!isTimeAllowedForSlot(normalizedTime, slot)) {
    return res.status(400).json({ ok: false, error: "invalid_time_for_slot" });
  }
  if (slotHasPassed(date, slot)) {
    return res.status(400).json({ ok: false, error: "slot_already_passed" });
  }

  const normalizedLocation =
    typeof location === "string" ? location.toLowerCase() : "";
  const loc =
    normalizedLocation === "domicile"
      ? "domicile"
      : normalizedLocation === "atelier"
        ? "atelier"
        : null;

  const existing = getAppointmentByDateAndSlot(date, slot);
  const isMineActive =
    existing &&
    existing.client_id === client.id &&
    (existing.status === "requested" || existing.status === "confirmed");

  if (existing && !isMineActive && existing.status !== "cancelled") {
    return res.status(409).json({ ok: false, error: "slot_taken" });
  }

  if (isMineActive) {
    try {
      const changed = updateAppointmentForClientSlot({
        clientId: client.id,
        dateStr: date,
        slot,
        time: normalizedTime,
        clientNote: null,
        location: loc,
      });

      if (!changed) {
        return res.status(400).json({
          ok: false,
          error: "cannot_update_appointment",
        });
      }

      try {
        await sendAdminNotification({
          type: "update",
          client,
          date,
          time: normalizedTime,
          location: loc || existing.location || null,
        });
      } catch (error) {
        console.error("[MAIL] notif update:", error);
      }

      return res.json({ ok: true, updated: true });
    } catch (error) {
      return res.status(500).json({ ok: false, error: "server_error" });
    }
  }

  if (client.formula_remaining <= 0) {
    return res.status(400).json({ ok: false, error: "no_credits_left" });
  }

  try {
    const changed = decrementFormulaRemaining(client.id);
    if (!changed) {
      return res.status(400).json({ ok: false, error: "no_credits_left" });
    }

    try {
      createRequestedAppointmentForSlot({
        clientId: client.id,
        dateStr: date,
        slot,
        time: normalizedTime,
        clientNote: null,
        location: loc,
      });
    } catch (error) {
      console.error("[BOOK] createRequestedAppointmentForSlot:", error);
      incrementFormulaRemaining(client.id);

      if (error && error.code === "SQLITE_CONSTRAINT") {
        return res.status(409).json({ ok: false, error: "slot_taken" });
      }

      return res.status(500).json({ ok: false, error: "db_error" });
    }

    try {
      await sendAdminNotification({
        type: "book",
        client,
        date,
        time: normalizedTime,
        location: loc,
      });
    } catch (error) {
      console.error("[MAIL] notif book:", error);
    }

    return res.json({ ok: true, created: true });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post("/:idOrSlug/cancel", async (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!client) {
    return res.status(404).json({ ok: false, error: "client_not_found" });
  }

  const { date, slot: rawSlot } = req.body || {};
  if (!date) {
    return res.status(400).json({ ok: false, error: "missing_date" });
  }
  if (!isValidSlot(rawSlot)) {
    return res.status(400).json({ ok: false, error: "missing_or_invalid_slot" });
  }

  const slot = normalizeAppointmentSlot(rawSlot);
  const appointment = getAppointmentByDateAndSlot(date, slot);

  if (
    !appointment ||
    appointment.client_id !== client.id ||
    !["requested", "confirmed"].includes(appointment.status)
  ) {
    return res.status(404).json({
      ok: false,
      error: "appointment_not_found_or_not_cancellable",
    });
  }

  const dayStart = new Date(`${appointment.date}T00:00:00`);
  const limit = new Date(dayStart.getTime() - 24 * 60 * 60 * 1000);
  if (Date.now() >= limit.getTime()) {
    return res.status(400).json({ ok: false, error: "too_late_to_cancel" });
  }

  cancelAppointmentForClientOnDate(client.id, date, slot);
  incrementFormulaRemaining(client.id);

  try {
    await sendAdminNotification({
      type: "cancel",
      client,
      date,
      time: appointment.time || SLOT_START_TIMES[slot],
      location: appointment.location || null,
    });
  } catch (error) {
    console.error("[MAIL] notif cancel:", error);
  }

  return res.json({ ok: true });
});

module.exports = router;
