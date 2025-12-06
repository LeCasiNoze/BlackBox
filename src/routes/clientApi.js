// src/routes/clientApi.js
const express = require("express");
const router = express.Router();

const {
  getClientBySlugOrCardCode,
  decrementFormulaRemaining,
  incrementFormulaRemaining,
} = require("../db/clients");

const {
  getAppointmentsForMonth,
  createRequestedAppointment,
  cancelAppointmentForClientOnDate,
  getAppointmentByDate,
  updateAppointmentTimeForClient,
  getAppointmentsForClient,
  getAppointmentById,
  updateAppointmentUserReview,
  getAppointmentPhotos,
  hasAppointmentPhotos,
} = require("../db/appointments");

const { sendAdminNotification } = require("../email");

// Helpers month / date
function parseMonthParam(m) {
  if (!m || typeof m !== "string") return null;
  const mMatch = m.match(/^(\d{4})-(\d{2})$/);
  if (!mMatch) return null;
  const year = Number(mMatch[1]);
  const monthIndex = Number(mMatch[2]) - 1;
  if (Number.isNaN(year) || Number.isNaN(monthIndex)) return null;
  return { year, monthIndex };
}

function formatDateLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------------
// 🔵 buildMonthPayload — version corrigée avec statut DONE
// ---------------------------------------------------------------------------
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
  const byDate = Object.create(null);

  for (const a of appointments) {
    byDate[a.date] = a;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];

  for (let d = new Date(firstDay); d < nextMonth; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDateLocal(d);
    const ap = byDate[dateStr];

    let status = "free";

    if (ap) {
      const isMine = ap.client_id === client.id;
      const isPast = d < today;

      if (ap.status === "done") {
        status = "done";
      } else if (isPast) {
        status = "done";
      } else if (
        isMine &&
        (ap.status === "requested" || ap.status === "confirmed")
      ) {
        status = "mine";
      } else if (ap.status === "requested" || ap.status === "confirmed") {
        status = "busy";
      }
    }

    days.push({
      date: dateStr,
      day: d.getDate(),
      status,
    });
  }

  const iso = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

  return { year, monthIndex, label, iso, days };
}

// ---------------------------------------------------------------------------
// GET /api/client/:idOrSlug
// ---------------------------------------------------------------------------
router.get("/:idOrSlug", (req, res) => {
  const idOrSlug = req.params.idOrSlug;
  const client = getClientBySlugOrCardCode(idOrSlug);

  if (!client) {
    return res.status(404).json({ ok: false, error: "client_not_found" });
  }

  const monthParam = parseMonthParam(req.query.m);
  const month = buildMonthPayload(client, monthParam);

  const payload = {
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
  };

  res.json(payload);
});

// ---------------------------------------------------------------------------
// GET /api/client/:idOrSlug/appointments/:appointmentId/photos
// -> charge simplement les photos du rendez-vous (on ne check pas le client)
// ---------------------------------------------------------------------------
router.get("/:idOrSlug/appointments/:appointmentId/photos", (req, res) => {
  const appointmentId = Number(req.params.appointmentId) || 0;

  if (!appointmentId) {
    return res
      .status(400)
      .json({ ok: false, error: "invalid_appointment_id" });
  }

  try {
    const rows = getAppointmentPhotos(appointmentId);

    const photos = rows.map((p) => ({
      id: p.id,
      url: p.url,          // ex: "/uploads/appointments/xxxx.jpg"
      label: p.caption || null,
    }));

    return res.json({ ok: true, photos });
  } catch (err) {
    console.error("[API] Erreur getAppointmentPhotos client:", err);
    return res
      .status(500)
      .json({ ok: false, error: "server_error_loading_photos" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/client/:idOrSlug/appointments
// ---------------------------------------------------------------------------
router.get("/:idOrSlug/appointments", (req, res) => {
  const idOrSlug = req.params.idOrSlug;
  const client = getClientBySlugOrCardCode(idOrSlug);

  if (!client) {
    return res.status(404).json({ ok: false, error: "client_not_found" });
  }

  try {
    const rows = getAppointmentsForClient(client.id);

    const appointments = rows.map((ap) => ({
      id: ap.id,
      date: ap.date,
      time: ap.time,
      status: ap.status,
      adminNote: ap.admin_note || null,
      userRating: ap.user_rating ?? null,
      userReview: ap.user_review ?? null,
      vehicleModel: client.vehicle_model,
      vehiclePlate: client.vehicle_plate,
      hasPhotos: hasAppointmentPhotos(ap.id),
      location: ap.location || null,          // 👈 AJOUT
    }));

    res.json({ ok: true, appointments });
  } catch (e) {
    console.error("Error get client appointments", e);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/client/:idOrSlug/appointments/:appointmentId/review
// ---------------------------------------------------------------------------
router.post("/:idOrSlug/appointments/:appointmentId/review", (req, res) => {
  const idOrSlug = req.params.idOrSlug;
  const client = getClientBySlugOrCardCode(idOrSlug);
  if (!client) {
    return res.status(404).json({ ok: false, error: "client_not_found" });
  }

  const appointmentId = Number(req.params.appointmentId) || 0;
  if (!appointmentId) {
    return res
      .status(400)
      .json({ ok: false, error: "invalid_appointment_id" });
  }

  const { rating, review } = req.body || {};
  const numericRating = Number(rating);

  if (!numericRating || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ ok: false, error: "invalid_rating" });
  }

  const ap = getAppointmentById(appointmentId);
  if (!ap || ap.client_id !== client.id) {
    return res
      .status(404)
      .json({ ok: false, error: "appointment_not_found" });
  }

  if (ap.status !== "done") {
    return res
      .status(400)
      .json({ ok: false, error: "appointment_not_done" });
  }

  const changes = updateAppointmentUserReview(
    appointmentId,
    numericRating,
    typeof review === "string" && review.trim() !== ""
      ? review.trim()
      : null
  );

  if (!changes) {
    return res
      .status(500)
      .json({ ok: false, error: "cannot_update_review" });
  }

  const updated = getAppointmentById(appointmentId);

  const appointment = {
    id: updated.id,
    date: updated.date,
    time: updated.time,
    status: updated.status,
    adminNote: updated.admin_note || null,
    userRating: updated.user_rating ?? null,
    userReview: updated.user_review ?? null,
    vehicleModel: client.vehicle_model,
    vehiclePlate: client.vehicle_plate,
    hasPhotos: hasAppointmentPhotos(updated.id),
  };

  return res.json({ ok: true, appointment });
});

// ---------------------------------------------------------------------------
// GET /api/client/appointments/:date
// ---------------------------------------------------------------------------
router.get("/appointments/:date", (req, res) => {
  const date = req.params.date;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ ok: false, error: "invalid_date" });
  }

  const ap = getAppointmentByDate(date);
  if (!ap || ap.status !== "done") {
    return res.status(404).json({
      ok: false,
      error: "appointment_not_found_or_not_done",
    });
  }

  const client = require("../db/clients").getClientById
    ? require("../db/clients").getClientById(ap.client_id)
    : null;

  const hasPhotos = hasAppointmentPhotos(ap.id);

  res.json({
    ok: true,
    appointment: {
      id: ap.id,
      date: ap.date,
      time: ap.time,
      status: ap.status,
      adminNote: ap.admin_note || null,
      userRating: ap.user_rating ?? null,
      userReview: ap.user_review ?? null,
      vehicleModel: client?.vehicle_model || null,
      vehiclePlate: client?.vehicle_plate || null,
      clientName: client?.full_name || "Client",
      location: ap.location || null,   // 👈 AJOUT
      hasPhotos,
    },
  });
});

// ---------------------------------------------------------------------------
// POST /api/client/:idOrSlug/book
// ---------------------------------------------------------------------------
router.post("/:idOrSlug/book", async (req, res) => {
  const idOrSlug = req.params.idOrSlug;
  const client = getClientBySlugOrCardCode(idOrSlug);
  if (!client) {
    return res.status(404).json({ ok: false, error: "client_not_found" });
  }

  const { date, time, location } = req.body || {};
  if (!date) {
    return res.status(400).json({ ok: false, error: "missing_date" });
  }

  const rawLocation =
    typeof location === "string" ? location.toLowerCase() : "";
  const loc =
    rawLocation === "domicile"
      ? "domicile"
      : rawLocation === "atelier"
      ? "atelier"
      : null; // 👈 fallback si rien / invalide

  const existing = getAppointmentByDate(date);
  const isMineActive =
    existing &&
    existing.client_id === client.id &&
    (existing.status === "requested" || existing.status === "confirmed");

  if (isMineActive) {
    try {
      const newTime = time || existing.time || null;

      const changed = updateAppointmentTimeForClient(
        client.id,
        date,
        newTime,
        null
      );
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
          time: newTime,
          location: existing.location || null, // 👈
        });
      } catch (err) {
        console.error("[MAIL] Erreur notif update:", err);
      }

      return res.json({ ok: true, updated: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "server_error" });
    }
  }

  if (client.formula_remaining <= 0) {
    return res
      .status(400)
      .json({ ok: false, error: "no_credits_left" });
  }

  try {
    const changed = decrementFormulaRemaining(client.id);
    if (!changed) {
      return res
        .status(400)
        .json({ ok: false, error: "no_credits_left" });
    }

    let created = false;
    try {
      createRequestedAppointment(
        client.id,
        date,
        time || null,
        null,
        loc // 👈 on enregistre atelier / domicile
      );
      created = true;
    } catch (e) {
      incrementFormulaRemaining(client.id);
      return res
        .status(409)
        .json({ ok: false, error: "slot_taken" });
    }

    if (created) {
      try {
        await sendAdminNotification({
          type: "cancel",
          client,
          date,
          time: ap.time || null,
          location: ap.location || null, // 👈
        });
      } catch (err) {
        console.error("[MAIL] Erreur notif cancel:", err);
      }
    }

    return res.json({ ok: true, created: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/client/:idOrSlug/cancel
// ---------------------------------------------------------------------------
router.post("/:idOrSlug/cancel", async (req, res) => {
  const idOrSlug = req.params.idOrSlug;
  const client = getClientBySlugOrCardCode(idOrSlug);
  if (!client) {
    return res.status(404).json({ ok: false, error: "client_not_found" });
  }

  const { date } = req.body || {};
  if (!date) {
    return res
      .status(400)
      .json({ ok: false, error: "missing_date" });
  }

  const ap = getAppointmentByDate(date);
  if (
    !ap ||
    ap.client_id !== client.id ||
    !["requested", "confirmed"].includes(ap.status)
  ) {
    return res.status(404).json({
      ok: false,
      error: "appointment_not_found_or_not_cancellable",
    });
  }

  const dayStart = new Date(ap.date + "T00:00:00");
  const limit = new Date(dayStart.getTime() - 24 * 60 * 60 * 1000);
  const now = new Date();

  if (now >= limit) {
    return res
      .status(400)
      .json({ ok: false, error: "too_late_to_cancel" });
  }

  cancelAppointmentForClientOnDate(client.id, date);
  incrementFormulaRemaining(client.id);

  try {
    await sendAdminNotification({
      type: "cancel",
      client,
      date,
      time: ap.time || null,
    });
  } catch (err) {
    console.error("[MAIL] Erreur notif cancel:", err);
  }

  return res.json({ ok: true });
});

module.exports = router;
