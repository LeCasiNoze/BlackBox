// src/routes/client.js
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
  getAppointmentById,             // ⬅️
  updateAppointmentUserReview,    // ⬅️
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

      // 1. Si DONE → toujours bleu (global)
      if (ap.status === "done") {
        status = "done";
      }
      // 2. Si jour passé → bleu
      else if (isPast) {
        status = "done";
      }
      // 3. RDV futur du client → vert
      else if (
        isMine &&
        (ap.status === "requested" || ap.status === "confirmed")
      ) {
        status = "mine";
      }
      // 4. RDV futur d’un autre client → rouge
      else if (ap.status === "requested" || ap.status === "confirmed") {
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
// ✅ NEW — GET /api/client/:idOrSlug/appointments
// Liste tous les rendez-vous de ce client (passés + futurs)
// ---------------------------------------------------------------------------
router.get("/:idOrSlug/appointments", (req, res) => {
  const idOrSlug = req.params.idOrSlug;
  const client = getClientBySlugOrCardCode(idOrSlug);

  if (!client) {
    return res
      .status(404)
      .json({ ok: false, error: "client_not_found" });
  }

  try {
    const rows = getAppointmentsForClient(client.id);

    const appointments = rows.map((ap) => ({
      id: ap.id,
      date: ap.date,              // "YYYY-MM-DD"
      time: ap.time,              // "HH:MM" ou null
      status: ap.status,          // "requested" | "confirmed" | "done" | "cancelled"
      adminNote: ap.admin_note || null,
      userRating: ap.user_rating ?? null,
      userReview: ap.user_review ?? null,
      // un véhicule par client → on reprend les infos du client
      vehicleModel: client.vehicle_model,
      vehiclePlate: client.vehicle_plate,
      // Pour l'instant on ne branche pas encore le système de photos
      hasPhotos: false,
    }));

    res.json({ ok: true, appointments });
  } catch (e) {
    console.error("Error get client appointments", e);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/client/:idOrSlug/appointments/:appointmentId/review
// Enregistre la note (1–5) + commentaire du client
// ---------------------------------------------------------------------------
router.post("/:idOrSlug/appointments/:appointmentId/review", (req, res) => {
  const idOrSlug = req.params.idOrSlug;
  const client = getClientBySlugOrCardCode(idOrSlug);
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

  const ap = getAppointmentById(appointmentId);
  if (!ap || ap.client_id !== client.id) {
    return res
      .status(404)
      .json({ ok: false, error: "appointment_not_found" });
  }

  // On impose que le RDV soit "done", comme sur le front
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
    hasPhotos: false, // on branchera plus tard
  };

  return res.json({ ok: true, appointment });
});

// ---------------------------------------------------------------------------
// GET /api/client/appointments/:date
// Permet à n'importe qui de consulter le compte-rendu d'un jour "done"
// ---------------------------------------------------------------------------
router.get("/appointments/:date", (req, res) => {
  const date = req.params.date;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ ok: false, error: "invalid_date" });
  }

  const ap = getAppointmentByDate(date);
  if (!ap || ap.status !== "done") {
    return res.status(404).json({ ok: false, error: "appointment_not_found_or_not_done" });
  }

  // On récupère le client pour afficher véhicule, nom, etc.
  const client = require("../db/clients").getClientById
    ? require("../db/clients").getClientById(ap.client_id)
    : null;

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
      hasPhotos: false, // on branchera plus tard
    },
  });
});

// ---------------------------------------------------------------------------
// POST /api/client/:slug/book
// ---------------------------------------------------------------------------
router.post("/:idOrSlug/book", async (req, res) => {
  const idOrSlug = req.params.idOrSlug;
  const client = getClientBySlugOrCardCode(idOrSlug);
  if (!client) {
    return res.status(404).json({ ok: false, error: "client_not_found" });
  }

  const { date, time } = req.body || {};
  if (!date) {
    return res.status(400).json({ ok: false, error: "missing_date" });
  }

  const existing = getAppointmentByDate(date);
  const isMineActive =
    existing &&
    existing.client_id === client.id &&
    (existing.status === "requested" || existing.status === "confirmed");

  // 🔁 Cas modification d'heure d'un RDV déjà à moi
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

      // 📧 Notif admin — modification
      try {
        await sendAdminNotification({
          type: "update",
          client,
          date,
          time: newTime,
        });
      } catch (err) {
        console.error("[MAIL] Erreur notif update:", err);
      }

      return res.json({ ok: true, updated: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "server_error" });
    }
  }

  // ✨ Nouveau rendez-vous
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
      createRequestedAppointment(client.id, date, time || null, null);
      created = true;
    } catch (e) {
      incrementFormulaRemaining(client.id);
      return res
        .status(409)
        .json({ ok: false, error: "slot_taken" });
    }

    // 📧 Notif admin — nouveau RDV
    if (created) {
      try {
        await sendAdminNotification({
          type: "book",
          client,
          date,
          time: time || null,
        });
      } catch (err) {
        console.error("[MAIL] Erreur notif book:", err);
      }
    }

    return res.json({ ok: true, created: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/client/:slug/cancel
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

  // 📧 Notif admin — annulation
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
