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
} = require("../db/appointments");

function parseMonthParam(m) {
  if (!m || typeof m !== "string") return null;
  const mMatch = m.match(/^(\d{4})-(\d{2})$/);
  if (!mMatch) return null;
  const year = Number(mMatch[1]);
  const monthIndex = Number(mMatch[2]) - 1; // 0–11
  if (Number.isNaN(year) || Number.isNaN(monthIndex)) return null;
  return { year, monthIndex };
}

function formatDateLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
  const byDate = Object.create(null);
  for (const a of appointments) {
    byDate[a.date] = a;
  }

  const days = [];
    for (let d = new Date(firstDay); d < nextMonth; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDateLocal(d);
    const ap = byDate[dateStr];
    let status = "free"; // free | mine | busy

    if (ap) {
      const isMine = ap.client_id === client.id && ap.status !== "cancelled";
      const isActive =
        ap.status === "requested" || ap.status === "confirmed" || ap.status === "done";

      if (isMine && isActive) status = "mine";
      else if (isActive) status = "busy";
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

// GET /api/client/:idOrSlug?m=YYYY-MM
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

// POST /api/client/:idOrSlug/book { date: "YYYY-MM-DD", time: "HH:MM" }
router.post("/:idOrSlug/book", (req, res) => {
  const idOrSlug = req.params.idOrSlug;
  const client = getClientBySlugOrCardCode(idOrSlug);
  if (!client) {
    return res.status(404).json({ ok: false, error: "client_not_found" });
  }

  const { date, time } = req.body || {};
  if (!date) {
    return res.status(400).json({ ok: false, error: "missing_date" });
  }

  // On regarde s'il y a déjà un rendez-vous ce jour-là
  const existing = getAppointmentByDate(date);
  const isMineActive =
    existing &&
    existing.client_id === client.id &&
    (existing.status === "requested" || existing.status === "confirmed");

  // ─────────────────────────────────────────────
  // 1) Cas "modification d'horaire" (même client, même jour)
  //    → pas de décrémentation de crédits, on bouge juste l'heure.
  // ─────────────────────────────────────────────
  if (isMineActive) {
    try {
      const changed = updateAppointmentTimeForClient(
        client.id,
        date,
        time || existing.time || null,
        null
      );

      if (!changed) {
        return res
          .status(400)
          .json({ ok: false, error: "cannot_update_appointment" });
      }

      return res.json({ ok: true, updated: true });
    } catch (e) {
      console.warn("[API BOOK] error (update time):", e.message);
      return res.status(500).json({ ok: false, error: "server_error" });
    }
  }

  // ─────────────────────────────────────────────
  // 2) Cas "nouveau rendez-vous" (date libre pour ce client)
  //    → on consomme 1 crédit et on crée l'entrée.
  // ─────────────────────────────────────────────

  // Check rapide avec la valeur actuelle
  if (client.formula_remaining <= 0) {
    return res.status(400).json({ ok: false, error: "no_credits_left" });
  }

  try {
    // 1) Décrémenter les crédits (verrou "soft")
    const changed = decrementFormulaRemaining(client.id);
    if (!changed) {
      return res.status(400).json({ ok: false, error: "no_credits_left" });
    }

    try {
      // 2) INSERT : si quelqu'un avait déjà pris ce jour (autre client),
      //    on aura une erreur UNIQUE(date) → on rollback le crédit.
      createRequestedAppointment(client.id, date, time || null, null);
    } catch (e) {
      // Conflit (date déjà occupée) → on rend le crédit
      incrementFormulaRemaining(client.id);
      console.warn("[API BOOK] error (insert, rollback):", e.message);
      return res
        .status(409)
        .json({ ok: false, error: "slot_taken", detail: e.message });
    }

    return res.json({ ok: true, created: true });
  } catch (e) {
    console.warn("[API BOOK] error:", e.message);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

// POST /api/client/:idOrSlug/cancel { date: "YYYY-MM-DD" }
router.post("/:idOrSlug/cancel", (req, res) => {
  const idOrSlug = req.params.idOrSlug;
  const client = getClientBySlugOrCardCode(idOrSlug);
  if (!client) {
    return res.status(404).json({ ok: false, error: "client_not_found" });
  }

  const { date } = req.body || {};
  if (!date) {
    return res.status(400).json({ ok: false, error: "missing_date" });
  }

  // 1) On récupère le rendez-vous pour cette date
  const ap = getAppointmentByDate(date);
  if (
    !ap ||
    ap.client_id !== client.id ||
    !["requested", "confirmed"].includes(ap.status)
  ) {
    return res
      .status(404)
      .json({ ok: false, error: "appointment_not_found_or_not_cancellable" });
  }

  // 2) Vérif règle des 24h (la veille à minuit)
  const dayStart = new Date(ap.date + "T00:00:00");
  const limit = new Date(dayStart.getTime() - 24 * 60 * 60 * 1000); // veille 00:00
  const now = new Date();

  if (now >= limit) {
    // Trop tard pour annuler
    return res.status(400).json({ ok: false, error: "too_late_to_cancel" });
  }

  // 3) On annule le rendez-vous
  cancelAppointmentForClientOnDate(client.id, date);

  // 4) On recrédite 1 nettoyage (sans dépasser le total)
  incrementFormulaRemaining(client.id);

  return res.json({ ok: true });
});

module.exports = router;
