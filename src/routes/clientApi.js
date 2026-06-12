const express = require("express");
const router = express.Router();

const {
  createClient,
  decrementFormulaRemaining,
  getClientById,
  getClientBySlugOrCardCode,
  incrementFormulaRemaining,
  updateClientTermsAcceptance,
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
  getPublicAppointmentsFeed,
  hasAppointmentPhotos,
  normalizeAppointmentSlot,
  updateAppointmentForClientSlot,
  updateAppointmentUserReview,
  cancelAppointmentForClientOnDate,
} = require("../db/appointments");
const {
  BC_REWARDS,
  createRewardRedemption,
  getRewardDefinition,
  listRewardRedemptionsByClient,
  changeClientPoints,
} = require("../db/rewards");
const {
  createVehicleForClient,
  deleteVehicleForClient,
  getPrimaryVehicleByClientId,
  getVehicleById,
  listVehiclesByClient,
  setPrimaryVehicle,
  updateVehicleForClient,
} = require("../db/vehicles");
const { sendAdminNotification, sendAdminRewardRedemption } = require("../email");

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

function formulaNameFromClient(client) {
  if (client.formula_name) return client.formula_name;
  const total = Number(client.formula_total || 0);
  if (total <= 0) return "Formule libre";
  return `Formule ${total} nettoyage${total > 1 ? "s" : ""}`;
}

function mapVehicleRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    clientId: row.client_id,
    label: row.label || null,
    model: row.model || null,
    plate: row.plate || null,
    isPrimary: !!row.is_primary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapClientAppointment(appointment) {
  return {
    id: appointment.id,
    date: appointment.date,
    slot: normalizeAppointmentSlot(appointment.slot, appointment.time),
    time: appointment.time,
    status: appointment.status,
    adminNote: appointment.admin_note || null,
    userRating: appointment.user_rating ?? null,
    userReview: appointment.user_review ?? null,
    vehicleId: appointment.vehicle_id ?? null,
    vehicleLabel: appointment.vehicle_label || null,
    vehicleModel: appointment.vehicle_model || null,
    vehiclePlate: appointment.vehicle_plate || null,
    cleanlinessRating: null,
    hasPhotos: hasAppointmentPhotos(appointment.id),
    location: appointment.location || null,
  };
}

function mapClientPayload(client) {
  return {
    id: client.id,
    slug: client.slug,
    cardCode: client.card_code,
    firstName: client.first_name,
    lastName: client.last_name,
    fullName: client.full_name,
    phone: client.phone,
    email: client.email,
    clientType: client.client_type || "bbx",
    isFounder: !!client.is_founder,
    founderMediaUrl: client.founder_media_url || null,
    addressLine1: client.address_line1,
    postalCode: client.postal_code,
    city: client.city,
    vehicleModel: client.vehicle_model,
    vehiclePlate: client.vehicle_plate,
    formulaName: formulaNameFromClient(client),
    formulaTotal: client.formula_total,
    formulaRemaining: client.formula_remaining,
    formulaPurchasedAt: client.formula_purchased_at ?? null,
    formulaExpiresAt: client.formula_expires_at ?? null,
    termsAcceptedAt: client.terms_accepted_at ?? null,
    formulaRecapSentAt: client.formula_recap_sent_at ?? null,
    welcomeEmailSentAt: client.welcome_email_sent_at ?? null,
    bcPoints: client.bc_points ?? 0,
  };
}

function mapRewardRow(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    rewardKey: row.reward_key,
    rewardLabel: row.reward_label,
    pointsCost: row.points_cost,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function clientFormulaHasExpired(client) {
  const expiresAt = Number(client?.formula_expires_at || 0);
  if (!expiresAt) return false;

  const expiryDate = new Date(expiresAt * 1000);
  const endOfDay = new Date(
    expiryDate.getFullYear(),
    expiryDate.getMonth(),
    expiryDate.getDate(),
    23,
    59,
    59,
    999,
  );

  return Date.now() > endOfDay.getTime();
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

function getBookingVehicleForClient(client, requestedVehicleId) {
  const vehicles = listVehiclesByClient(client.id);
  if (vehicles.length === 0) {
    return { vehicle: null, error: null };
  }

  if (requestedVehicleId) {
    const vehicle = getVehicleById(requestedVehicleId);
    if (!vehicle || vehicle.client_id !== client.id) {
      return { vehicle: null, error: "invalid_vehicle" };
    }
    return { vehicle, error: null };
  }

  if (vehicles.length === 1) {
    return { vehicle: vehicles[0], error: null };
  }

  const primary = getPrimaryVehicleByClientId(client.id);
  if (primary) {
    return { vehicle: primary, error: null };
  }

  return { vehicle: null, error: "vehicle_required" };
}

function ensurePortalEligible(client, res) {
  if (!client) {
    res.status(404).json({ ok: false, error: "client_not_found" });
    return false;
  }

  if ((client.client_type || "bbx") !== "bbx") {
    res.status(403).json({ ok: false, error: "portal_disabled_for_data_client" });
    return false;
  }

  return true;
}

router.get("/:idOrSlug", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }

  const monthParam = parseMonthParam(req.query.m);
  const month = buildMonthPayload(client, monthParam);
  const vehicles = listVehiclesByClient(client.id).map(mapVehicleRow);
  const rewardRedemptions = listRewardRedemptionsByClient(client.id).map(mapRewardRow);

  return res.json({
    ok: true,
    client: mapClientPayload(client),
    vehicles,
    rewardCatalog: BC_REWARDS,
    rewardRedemptions,
    month,
  });
});

router.post("/:idOrSlug/terms/accept", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }

  try {
    if (!client.terms_accepted_at) {
      updateClientTermsAcceptance(client.id);
    }

    return res.json({
      ok: true,
      client: mapClientPayload(getClientById(client.id)),
    });
  } catch (error) {
    console.error("[API] client terms accept:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.get("/:idOrSlug/vehicles", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }

  return res.json({
    ok: true,
    vehicles: listVehiclesByClient(client.id).map(mapVehicleRow),
  });
});

router.post("/:idOrSlug/vehicles", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }

  try {
    const vehicle = createVehicleForClient(client.id, {
      label: req.body?.label,
      model: req.body?.model,
      plate: req.body?.plate,
      isPrimary: req.body?.isPrimary === true,
    });

    return res.json({
      ok: true,
      vehicle: mapVehicleRow(vehicle),
      vehicles: listVehiclesByClient(client.id).map(mapVehicleRow),
    });
  } catch (error) {
    console.error("[API] client create vehicle:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post("/:idOrSlug/vehicles/:vehicleId", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }

  const vehicleId = Number(req.params.vehicleId || 0);
  if (!vehicleId) {
    return res.status(400).json({ ok: false, error: "invalid_vehicle_id" });
  }

  try {
    const vehicle = updateVehicleForClient(client.id, vehicleId, {
      label: req.body?.label,
      model: req.body?.model,
      plate: req.body?.plate,
      isPrimary: req.body?.isPrimary === true,
    });

    if (!vehicle) {
      return res.status(404).json({ ok: false, error: "vehicle_not_found" });
    }

    return res.json({
      ok: true,
      vehicle: mapVehicleRow(vehicle),
      vehicles: listVehiclesByClient(client.id).map(mapVehicleRow),
    });
  } catch (error) {
    console.error("[API] client update vehicle:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post("/:idOrSlug/vehicles/:vehicleId/primary", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }

  const vehicleId = Number(req.params.vehicleId || 0);
  if (!vehicleId) {
    return res.status(400).json({ ok: false, error: "invalid_vehicle_id" });
  }

  try {
    const primary = setPrimaryVehicle(client.id, vehicleId);
    return res.json({
      ok: true,
      primaryVehicle: mapVehicleRow(primary),
      vehicles: listVehiclesByClient(client.id).map(mapVehicleRow),
    });
  } catch (error) {
    console.error("[API] client primary vehicle:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.delete("/:idOrSlug/vehicles/:vehicleId", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }

  const vehicleId = Number(req.params.vehicleId || 0);
  if (!vehicleId) {
    return res.status(400).json({ ok: false, error: "invalid_vehicle_id" });
  }

  try {
    const deleted = deleteVehicleForClient(client.id, vehicleId);
    if (!deleted) {
      return res.status(400).json({ ok: false, error: "cannot_delete_vehicle" });
    }

    return res.json({
      ok: true,
      vehicles: listVehiclesByClient(client.id).map(mapVehicleRow),
    });
  } catch (error) {
    console.error("[API] client delete vehicle:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.get("/:idOrSlug/appointments/:appointmentId/photos", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }

  const appointmentId = Number(req.params.appointmentId) || 0;

  if (!appointmentId) {
    return res.status(400).json({ ok: false, error: "invalid_appointment_id" });
  }

  try {
    const appointment = getAppointmentById(appointmentId);
    if (!appointment || appointment.client_id !== client.id) {
      return res.status(404).json({
        ok: false,
        error: "appointment_not_found",
      });
    }

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

router.get("/:idOrSlug/community", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }

  const limit = Math.max(1, Math.min(40, Number(req.query.limit || 18)));

  try {
    const items = getPublicAppointmentsFeed(limit).map((appointment) => ({
      id: appointment.id,
      date: appointment.date,
      slot: normalizeAppointmentSlot(appointment.slot, appointment.time),
      time: appointment.time,
      location: appointment.location || null,
      vehicleId: appointment.vehicle_id ?? null,
      vehicleLabel: appointment.vehicle_label || null,
      vehicleModel: appointment.vehicle_model || null,
      vehiclePlate: appointment.vehicle_plate || null,
      userRating: appointment.user_rating ?? null,
      userReview: appointment.user_review ?? null,
      photos: getAppointmentPhotos(appointment.id).map((photo) => ({
        id: photo.id,
        url: photo.url,
        label: photo.caption || null,
      })),
    }));

    return res.json({ ok: true, items });
  } catch (error) {
    console.error("[API] client community:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.get("/:idOrSlug/appointments", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }

  const vehicleId = Number(req.query.vehicleId || 0) || null;

  try {
    const appointments = getAppointmentsForClient(client.id, {
      vehicleId,
      includeCancelled: true,
    }).map(mapClientAppointment);

    return res.json({ ok: true, appointments });
  } catch (error) {
    console.error("[API] client appointments:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post("/:idOrSlug/appointments/:appointmentId/review", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
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
    typeof review === "string" && review.trim() !== "" ? review.trim() : null,
  );

  if (!changes) {
    return res.status(500).json({ ok: false, error: "cannot_update_review" });
  }

  const updated = getAppointmentById(appointmentId);
  return res.json({
    ok: true,
    appointment: mapClientAppointment(updated),
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
      vehicleModel: appointment.vehicle_model || null,
      vehiclePlate: appointment.vehicle_plate || null,
      clientName: appointment.full_name || "Client",
      location: appointment.location || null,
      hasPhotos: hasAppointmentPhotos(appointment.id),
    },
  });
});

router.post("/:idOrSlug/book", async (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }

  const { date, time, location, slot: rawSlot, clientNote } = req.body || {};
  const vehicleId = Number(req.body?.vehicleId || 0) || null;
  const normalizedClientNote =
    typeof clientNote === "string" && clientNote.trim() !== "" ? clientNote.trim() : null;

  if (!date) {
    return res.status(400).json({ ok: false, error: "missing_date" });
  }
  if (!isValidSlot(rawSlot)) {
    return res.status(400).json({ ok: false, error: "missing_or_invalid_slot" });
  }

  const { vehicle, error: vehicleError } = getBookingVehicleForClient(client, vehicleId);
  if (vehicleError) {
    return res.status(400).json({ ok: false, error: vehicleError });
  }

  const slot = normalizeAppointmentSlot(rawSlot, time);
  const normalizedTime = typeof time === "string" && time ? time : defaultTimeForSlot(slot);

  if (!isTimeAllowedForSlot(normalizedTime, slot)) {
    return res.status(400).json({ ok: false, error: "invalid_time_for_slot" });
  }
  if (slotHasPassed(date, slot)) {
    return res.status(400).json({ ok: false, error: "slot_already_passed" });
  }

  const normalizedLocation = typeof location === "string" ? location.toLowerCase() : "";
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
        vehicleId: vehicle?.id || null,
        dateStr: date,
        slot,
        time: normalizedTime,
        clientNote: normalizedClientNote,
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
          client: {
            ...client,
            vehicle_model: vehicle?.model || client.vehicle_model,
            vehicle_plate: vehicle?.plate || client.vehicle_plate,
          },
          date,
          time: normalizedTime,
          location: loc || existing.location || null,
          clientNote: normalizedClientNote || existing.client_note || null,
        });
      } catch (error) {
        console.error("[MAIL] notif update:", error);
      }

      return res.json({ ok: true, updated: true });
    } catch (error) {
      return res.status(500).json({ ok: false, error: "server_error" });
    }
  }

  if (!client.terms_accepted_at) {
    return res.status(412).json({ ok: false, error: "terms_not_accepted" });
  }

  if (clientFormulaHasExpired(client)) {
    return res.status(400).json({ ok: false, error: "formula_expired" });
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
        vehicleId: vehicle?.id || null,
        dateStr: date,
        slot,
        time: normalizedTime,
        clientNote: normalizedClientNote,
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
        client: {
          ...client,
          vehicle_model: vehicle?.model || client.vehicle_model,
          vehicle_plate: vehicle?.plate || client.vehicle_plate,
        },
        date,
        time: normalizedTime,
        location: loc,
        clientNote: normalizedClientNote,
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
  if (!ensurePortalEligible(client, res)) {
    return;
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
      time: appointment.time || defaultTimeForSlot(slot),
      location: appointment.location || null,
      clientNote: appointment.client_note || null,
    });
  } catch (error) {
    console.error("[MAIL] notif cancel:", error);
  }

  return res.json({ ok: true });
});

router.get("/:idOrSlug/rewards", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }

  return res.json({
    ok: true,
    bcPoints: client.bc_points ?? 0,
    rewardCatalog: BC_REWARDS,
    rewardRedemptions: listRewardRedemptionsByClient(client.id).map(mapRewardRow),
  });
});

router.post("/:idOrSlug/rewards/redeem", async (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }

  const rewardKey = req.body?.rewardKey;
  const reward = getRewardDefinition(rewardKey);
  if (!reward) {
    return res.status(400).json({ ok: false, error: "reward_not_found" });
  }

  const currentPoints = Number(client.bc_points || 0);
  if (currentPoints < reward.pointsCost) {
    return res.status(400).json({ ok: false, error: "not_enough_points" });
  }

  try {
    const nextPoints = changeClientPoints(client.id, -reward.pointsCost);
    if (nextPoints == null) {
      return res.status(400).json({ ok: false, error: "not_enough_points" });
    }

    const redemption = createRewardRedemption(client.id, reward);

    try {
      await sendAdminRewardRedemption({ client: getClientById(client.id), reward });
    } catch (error) {
      console.error("[MAIL] reward redemption:", error);
    }

    return res.json({
      ok: true,
      bcPoints: nextPoints,
      redemption: mapRewardRow(redemption),
      rewardRedemptions: listRewardRedemptionsByClient(client.id).map(mapRewardRow),
    });
  } catch (error) {
    console.error("[API] redeem reward:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

module.exports = router;
