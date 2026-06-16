const express = require("express");
const multer = require("multer");
const { optimizeUploadedImage } = require("../services/imageProcessing");
const path = require("path");

const router = express.Router();

const {
  APPOINTMENTS_UPLOAD_DIR,
  FOUNDERS_UPLOAD_DIR,
  ensureDir,
} = require("../config/storage");
const { nowUnix } = require("../db");
const {
  createClient,
  deleteClient,
  formulaNameFromTotal,
  getClientById,
  incrementFormulaRemaining,
  listClients,
  listClientsForSegment,
  markFormulaRecapSent,
  markWelcomeEmailSent,
  parseDateInputToUnix,
  sanitizeString,
  updateClientFormulaBalance,
  updateClientProfile,
} = require("../db/clients");
const { getReviewBoxGoodie } = require("../config/reviewBox");
const { getConsolationGoodie } = require("../config/eventRewards");
const { notifyWaitlistForFreedSlot } = require("../services/waitlistNotifier");
const { getCompanyInfo, setCompanyInfo } = require("../db/settings");
const {
  countParticipants,
  createEvent,
  deleteEvent,
  drawWinner,
  getEventById,
  listEvents,
  listParticipants,
  mapEventRow,
  setActive,
  updateEvent,
} = require("../db/events");
const {
  cancelAppointmentForClientOnDate,
  cancelAppointmentAndRefund,
  getAllAppointmentsWithClient,
  getAppointmentById,
  getAppointmentPhotos,
  getAppointmentsForClient,
  getClientCleanlinessAverage,
  insertAppointmentPhoto,
  normalizeCleanlinessRating,
  normalizeAppointmentSlot,
  reviewAppointmentPrice,
  revertAppointmentToRequested,
  syncAppointmentCleanlinessPenalty,
  updateAppointmentAdminWorkspace,
  updateAppointmentPhotoCategory,
  updateAppointmentStatus,
} = require("../db/appointments");
const {
  awardPointsForAppointment,
  changeClientPoints,
  listRewardRedemptionsByClient,
  revokePointsForAppointment,
} = require("../db/rewards");
const {
  createVehicleForClient,
  deleteVehicleForClient,
  listVehiclesByClient,
  setPrimaryVehicle,
  updateVehicleForClient,
} = require("../db/vehicles");
const {
  sendAdminDataExportEmail,
  sendAdminNotification,
  sendClientAppointmentStatusEmail,
  sendClientPhotosRequestedEmail,
  sendBroadcastEmail,
  sendClientPriceApprovalEmail,
  sendClientFormulaRecap,
  sendClientWelcomeEmail,
  sendClientYearRecapEmail,
  sendEventAnnouncementEmail,
  sendEventWinnerEmail,
} = require("../email");
const { getClientYearRecap } = require("../db/recap");
const { getAdminMonthlyStats, getAdminAnalytics } = require("../db/stats");
const {
  attachPendingGoodieWinsToNextAppointment,
  countPendingGoodieWins,
  honorGoodieWinsForAppointment,
  listGoodieWins,
  listPendingGoodieWinsForAppointment,
  markGoodieWinHonored,
} = require("../db/goodieWins");
const {
  createDataExportFile,
  markExportJobEmailSent,
} = require("../services/dataExport");
const { getVapidPublicKey, isPushConfigured } = require("../services/webPush");
const {
  saveSubscription,
  deleteSubscriptionByEndpoint,
} = require("../db/pushSubscriptions");

ensureDir(APPOINTMENTS_UPLOAD_DIR);
ensureDir(FOUNDERS_UPLOAD_DIR);

function diskStorageFor(uploadDir) {
  return multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, uploadDir);
    },
    filename: (_req, file, callback) => {
      const ext = path.extname(file.originalname) || ".png";
      const base = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      callback(null, `${base}${ext.toLowerCase()}`);
    },
  });
}

const founderUpload = multer({ storage: diskStorageFor(FOUNDERS_UPLOAD_DIR) });
const appointmentPhotoUpload = multer({
  storage: diskStorageFor(APPOINTMENTS_UPLOAD_DIR),
});

const ALLOWED_STATUSES = ["requested", "confirmed", "done", "cancelled"];

function parseBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }

  return fallback;
}

function parseInteger(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}

function parseClientType(value) {
  return ["bbx", "data", "pro"].includes(value) ? value : "bbx";
}

function founderMediaUrlFromFile(file) {
  if (!file) return null;
  return `/uploads/founders/${file.filename}`;
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

function mapClientRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    cardCode: row.card_code,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    company: row.company || null,
    clientType: row.client_type || "bbx",
    isFounder: !!row.is_founder,
    founderMediaUrl: row.founder_media_url || null,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    postalCode: row.postal_code,
    city: row.city,
    vehicleModel: row.vehicle_model,
    vehiclePlate: row.vehicle_plate,
    formulaName:
      row.formula_name || formulaNameFromTotal(row.formula_total ?? row.formulaTotal ?? 0),
    formulaTotal: row.formula_total,
    formulaRemaining: row.formula_remaining,
    formulaPurchasedAt: row.formula_purchased_at ?? null,
    formulaExpiresAt: row.formula_expires_at ?? null,
    termsAcceptedAt: row.terms_accepted_at ?? null,
    formulaRecapSentAt: row.formula_recap_sent_at ?? null,
    welcomeEmailSentAt: row.welcome_email_sent_at ?? null,
    bcPoints: row.bc_points ?? 0,
    founderUntil: row.founder_until ?? null,
    reviewBoxOpenedAt: row.review_box_opened_at ?? null,
    reviewBoxReward: row.review_box_reward || null,
    reviewBoxRewardLabel: row.review_box_reward
      ? getReviewBoxGoodie(row.review_box_reward)?.label ?? row.review_box_reward
      : null,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAppointmentRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    clientId: row.client_id,
    vehicleId: row.vehicle_id ?? null,
    date: row.date,
    slot: row.slot || null,
    time: row.time,
    status: row.status,
    clientNote: row.client_note,
    adminNote: row.admin_note,
    userRating: row.user_rating ?? null,
    userReview: row.user_review ?? null,
    cleanlinessRating: normalizeCleanlinessRating(row.cleanliness_rating),
    clientCleanlinessEstimate: row.client_cleanliness_estimate || null,
    adminCleanlinessEstimate: row.admin_cleanliness_estimate || null,
    requestedCredits: row.requested_credits ?? 1,
    approvedCredits: row.approved_credits ?? null,
    creditsCharged: row.credits_charged ?? 0,
    priceStatus: row.price_status || "pending_admin",
    photosRequestedAt: row.photos_requested_at ?? null,
    photosRequestMessage: row.photos_request_message || null,
    priceComment: row.price_comment || null,
    bcPointsAwarded: !!row.bc_points_awarded,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clientName: row.full_name || row.client_full_name || null,
    vehicleLabel: row.vehicle_label || null,
    vehicleModel: row.vehicle_model || null,
    vehiclePlate: row.vehicle_plate || null,
    location: row.location || null,
    goodies: listPendingGoodieWinsForAppointment(row.id).map((win) => win.rewardLabel),
  };
}

function mapPhotoRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    url: row.url,
    caption: row.caption || null,
    isCover: !!row.is_cover,
    isPublic: !!row.is_public,
    category: row.category || null,
  };
}

function mapRewardRow(row) {
  if (!row) return null;
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

function buildClientPayloadFromRequest(req, options = {}) {
  const body = req.body || {};
  const clientType = parseClientType(body.clientType);
  const founderMediaUrl = founderMediaUrlFromFile(req.file);
  const founderRequested = parseBoolean(body.isFounder, false);

  return {
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone,
    company: body.company,
    addressLine1: body.addressLine1,
    addressLine2: body.addressLine2,
    postalCode: body.postalCode,
    city: body.city,
    vehicleLabel: body.vehicleLabel,
    vehicleModel: body.vehicleModel,
    vehiclePlate: body.vehiclePlate,
    formulaName: body.formulaName,
    formulaTotal: parseInteger(body.formulaTotal, 0),
    formulaRemaining: parseInteger(body.formulaRemaining, parseInteger(body.formulaTotal, 0)),
    formulaPurchasedAt: body.formulaPurchasedAt,
    formulaExpiresAt: body.formulaExpiresAt,
    notes: body.notes,
    clientType,
    isFounder: clientType === "bbx" ? founderRequested : false,
    founderMediaUrl:
      founderMediaUrl ??
      (options.allowExistingFounderMedia ? body.founderMediaUrl : null) ??
      null,
    clearFounderMedia: parseBoolean(body.clearFounderMedia, false),
    bcPoints: parseInteger(body.bcPoints, 0),
  };
}

async function maybeSendWelcomeEmail(client, enabled) {
  if (!enabled || !client || client.client_type !== "bbx" || !client.email) {
    return false;
  }

  const sent = await sendClientWelcomeEmail(client);
  if (sent) {
    markWelcomeEmailSent(client.id);
  }
  return sent;
}

router.get("/clients", (req, res) => {
  try {
    const filter =
      req.query.filter === "all"
        ? "all"
        : req.query.filter === "founder"
          ? "founder"
          : req.query.filter === "data"
            ? "data"
            : req.query.filter === "pro"
              ? "pro"
              : "bbx";
    const clients = listClients(filter).map(mapClientRow);
    return res.json({ ok: true, clients });
  } catch (error) {
    console.error("[adminApi] GET /clients:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.get("/clients/:id", (req, res) => {
  const id = Number(req.params.id || 0);
  if (!id) {
    return res.status(400).json({ ok: false, error: "invalid_id" });
  }

  try {
    const client = getClientById(id);
    if (!client) {
      return res.status(404).json({ ok: false, error: "client_not_found" });
    }

    const appointments = getAppointmentsForClient(id, {
      includeCancelled: true,
    }).map(mapAppointmentRow);
    const vehicles = listVehiclesByClient(id).map(mapVehicleRow);
    const rewardRedemptions = listRewardRedemptionsByClient(id).map(mapRewardRow);
    const cleanliness = getClientCleanlinessAverage(id);

    return res.json({
      ok: true,
      client: mapClientRow(client),
      vehicles,
      appointments,
      rewardRedemptions,
      cleanliness,
    });
  } catch (error) {
    console.error("[adminApi] GET /clients/:id:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.delete("/clients/:id", (req, res) => {
  const id = Number(req.params.id || 0);
  if (!id) {
    return res.status(400).json({ ok: false, error: "invalid_id" });
  }
  try {
    const ok = deleteClient(id);
    if (!ok) {
      return res.status(404).json({ ok: false, error: "client_not_found" });
    }
    return res.json({ ok: true });
  } catch (error) {
    console.error("[adminApi] DELETE /clients/:id:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post("/clients", founderUpload.single("founderImage"), async (req, res) => {
  try {
    const payload = buildClientPayloadFromRequest(req);
    const client = createClient(payload);
    const sendWelcomeEmail = parseBoolean(
      req.body?.sendWelcomeEmail,
      payload.clientType === "bbx",
    );
    const welcomeEmailSent = await maybeSendWelcomeEmail(client, sendWelcomeEmail);

    return res.json({
      ok: true,
      client: mapClientRow(getClientById(client.id)),
      vehicles: listVehiclesByClient(client.id).map(mapVehicleRow),
      welcomeEmailSent,
    });
  } catch (error) {
    console.error("[adminApi] POST /clients:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post("/clients/:id/profile", founderUpload.single("founderImage"), (req, res) => {
  const id = Number(req.params.id || 0);
  if (!id) {
    return res.status(400).json({ ok: false, error: "invalid_id" });
  }

  try {
    const client = getClientById(id);
    if (!client) {
      return res.status(404).json({ ok: false, error: "client_not_found" });
    }

    const payload = buildClientPayloadFromRequest(req, {
      allowExistingFounderMedia: true,
    });
    const updated = updateClientProfile(id, payload);

    return res.json({
      ok: true,
      client: mapClientRow(updated),
      vehicles: listVehiclesByClient(id).map(mapVehicleRow),
    });
  } catch (error) {
    console.error("[adminApi] POST /clients/:id/profile:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post("/clients/:id/vehicles", (req, res) => {
  const clientId = Number(req.params.id || 0);
  if (!clientId) {
    return res.status(400).json({ ok: false, error: "invalid_client_id" });
  }

  try {
    const client = getClientById(clientId);
    if (!client) {
      return res.status(404).json({ ok: false, error: "client_not_found" });
    }

    const vehicle = createVehicleForClient(clientId, {
      label: req.body?.label,
      model: req.body?.model,
      plate: req.body?.plate,
      isPrimary: parseBoolean(req.body?.isPrimary, false),
    });

    return res.json({
      ok: true,
      vehicle: mapVehicleRow(vehicle),
      vehicles: listVehiclesByClient(clientId).map(mapVehicleRow),
    });
  } catch (error) {
    console.error("[adminApi] POST /clients/:id/vehicles:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post("/clients/:id/vehicles/:vehicleId", (req, res) => {
  const clientId = Number(req.params.id || 0);
  const vehicleId = Number(req.params.vehicleId || 0);

  if (!clientId || !vehicleId) {
    return res.status(400).json({ ok: false, error: "invalid_identifiers" });
  }

  try {
    const vehicle = updateVehicleForClient(clientId, vehicleId, {
      label: req.body?.label,
      model: req.body?.model,
      plate: req.body?.plate,
      isPrimary: parseBoolean(req.body?.isPrimary, false),
    });

    if (!vehicle) {
      return res.status(404).json({ ok: false, error: "vehicle_not_found" });
    }

    return res.json({
      ok: true,
      vehicle: mapVehicleRow(vehicle),
      vehicles: listVehiclesByClient(clientId).map(mapVehicleRow),
    });
  } catch (error) {
    console.error("[adminApi] POST /clients/:id/vehicles/:vehicleId:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post("/clients/:id/vehicles/:vehicleId/primary", (req, res) => {
  const clientId = Number(req.params.id || 0);
  const vehicleId = Number(req.params.vehicleId || 0);

  if (!clientId || !vehicleId) {
    return res.status(400).json({ ok: false, error: "invalid_identifiers" });
  }

  try {
    const primary = setPrimaryVehicle(clientId, vehicleId);
    return res.json({
      ok: true,
      primaryVehicle: mapVehicleRow(primary),
      vehicles: listVehiclesByClient(clientId).map(mapVehicleRow),
    });
  } catch (error) {
    console.error("[adminApi] POST /clients/:id/vehicles/:vehicleId/primary:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.delete("/clients/:id/vehicles/:vehicleId", (req, res) => {
  const clientId = Number(req.params.id || 0);
  const vehicleId = Number(req.params.vehicleId || 0);

  if (!clientId || !vehicleId) {
    return res.status(400).json({ ok: false, error: "invalid_identifiers" });
  }

  try {
    const deleted = deleteVehicleForClient(clientId, vehicleId);
    if (!deleted) {
      return res.status(400).json({ ok: false, error: "cannot_delete_vehicle" });
    }

    return res.json({
      ok: true,
      vehicles: listVehiclesByClient(clientId).map(mapVehicleRow),
    });
  } catch (error) {
    console.error("[adminApi] DELETE /clients/:id/vehicles/:vehicleId:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.get("/appointments", (req, res) => {
  const limit = Math.max(1, Math.min(500, Number(req.query.limit || 300)));

  try {
    const appointments = getAllAppointmentsWithClient(limit).map(mapAppointmentRow);
    return res.json({ ok: true, appointments });
  } catch (error) {
    console.error("[adminApi] GET /appointments:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post("/clients/:id/formula", (req, res) => {
  const id = Number(req.params.id || 0);
  const { mode, total, remaining } = req.body || {};

  if (!id) {
    return res.status(400).json({ ok: false, error: "invalid_id" });
  }

  try {
    const client = getClientById(id);
    if (!client) {
      return res.status(404).json({ ok: false, error: "not_found" });
    }

    let nextTotal = client.formula_total ?? 0;
    let nextRemaining = client.formula_remaining ?? 0;

    if (mode === "reset") {
      nextRemaining = nextTotal;
    } else if (mode === "empty") {
      nextRemaining = 0;
    } else if (mode === "custom") {
      nextTotal = Math.max(0, parseInteger(total, nextTotal));
      nextRemaining = Math.min(Math.max(0, parseInteger(remaining, nextRemaining)), nextTotal);
    } else {
      return res.status(400).json({ ok: false, error: "invalid_mode" });
    }

    const updated = updateClientFormulaBalance(id, {
      total: nextTotal,
      remaining: nextRemaining,
    });

    return res.json({
      ok: true,
      client: mapClientRow(updated),
    });
  } catch (error) {
    console.error("[adminApi] POST /clients/:id/formula:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post("/clients/:id/formula-recap", async (req, res) => {
  const id = Number(req.params.id || 0);
  if (!id) {
    return res.status(400).json({ ok: false, error: "invalid_id" });
  }

  try {
    const client = getClientById(id);
    if (!client) {
      return res.status(404).json({ ok: false, error: "not_found" });
    }

    if (!client.email) {
      return res.status(400).json({ ok: false, error: "missing_email" });
    }

    const sent = await sendClientFormulaRecap(client);
    if (!sent) {
      return res.status(500).json({ ok: false, error: "formula_recap_not_sent" });
    }

    markFormulaRecapSent(id);

    return res.json({
      ok: true,
      client: mapClientRow(getClientById(id)),
    });
  } catch (error) {
    console.error("[adminApi] POST /clients/:id/formula-recap:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post("/clients/:id/bc-points", (req, res) => {
  const id = Number(req.params.id || 0);
  const delta = parseInteger(req.body?.delta, 0);

  if (!id) {
    return res.status(400).json({ ok: false, error: "invalid_id" });
  }

  if (!delta) {
    return res.status(400).json({ ok: false, error: "invalid_delta" });
  }

  try {
    const client = getClientById(id);
    if (!client) {
      return res.status(404).json({ ok: false, error: "not_found" });
    }

    const nextPoints = changeClientPoints(id, delta);
    if (nextPoints == null) {
      return res.status(400).json({ ok: false, error: "not_enough_points" });
    }

    return res.json({
      ok: true,
      client: mapClientRow(getClientById(id)),
      bcPoints: nextPoints,
    });
  } catch (error) {
    console.error("[adminApi] POST /clients/:id/bc-points:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.get("/test-email", async (_req, res) => {
  try {
    await sendAdminNotification({
      type: "test",
      client: {
        id: 999,
        first_name: "Test",
        last_name: "Email",
        email: "test@example.com",
        phone: "+33 600000000",
        vehicle_model: "TestCar",
        vehicle_plate: "TEST-001",
        card_code: "TEST-CARD",
      },
      date: "2026-06-10",
      time: "14:00",
      location: "atelier",
    });

    return res.json({ ok: true, message: "Email de test tente." });
  } catch (error) {
    console.error("[adminApi] GET /test-email:", error);
    return res.status(500).json({ ok: false, error: String(error) });
  }
});

router.post("/appointments/:id/status", async (req, res) => {
  const id = Number(req.params.id || 0);
  const { status } = req.body || {};

  if (!id) {
    return res.status(400).json({ ok: false, error: "invalid_id" });
  }
  if (!ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ ok: false, error: "invalid_status" });
  }

  try {
    const appointment = getAppointmentById(id);
    if (!appointment) {
      return res.status(404).json({ ok: false, error: "appointment_not_found" });
    }

    if (appointment.status === status) {
      return res.json({
        ok: true,
        appointment: mapAppointmentRow(appointment),
      });
    }

    if (status === "cancelled") {
      cancelAppointmentAndRefund(id);

      if (appointment.status === "done") {
        revokePointsForAppointment(appointment.client_id, appointment.id);
      }

      // Les lots a remettre rattaches a ce RDV repartent vers le prochain a venir.
      attachPendingGoodieWinsToNextAppointment(appointment.client_id);

      // Creneau libere -> on previent les inscrits en liste d'attente.
      void notifyWaitlistForFreedSlot(appointment.date, appointment.slot);

      return res.json({
        ok: true,
        appointment: mapAppointmentRow(getAppointmentById(id)),
      });
    }

    if (status === "confirmed") {
      const result = reviewAppointmentPrice(id, {
        adminLevel: req.body?.adminCleanlinessEstimate || req.body?.cleanlinessEstimate,
        customCredits: req.body?.customCredits,
        priceComment: sanitizeString(req.body?.priceComment),
      });
      const updatedAppointment = getAppointmentById(id);
      const client = getClientById(appointment.client_id);

      if (client && updatedAppointment) {
        try {
          if (result.requiresClientApproval || updatedAppointment.price_status === "waiting_payment") {
            await sendClientPriceApprovalEmail({ client, appointment: updatedAppointment });
          } else if (updatedAppointment.status === "confirmed") {
            await sendClientAppointmentStatusEmail({
              client,
              appointment: updatedAppointment,
              eventType: "confirmed",
            });
          }
        } catch (mailError) {
          console.error("[MAIL] client price/confirmed:", mailError);
        }
      }

      // "not_enough_credits" n'est PAS un echec: le tarif est bien enregistre et
      // le rendez-vous passe en attente de recharge cote client (waiting_payment).
      const softWarning = result.error === "not_enough_credits";

      return res.json({
        ok: result.ok !== false || softWarning,
        appointment: mapAppointmentRow(updatedAppointment),
        warning: result.error || null,
      });
    }

    if (appointment.status === "done" && status !== "done") {
      revokePointsForAppointment(appointment.client_id, appointment.id);
    }

    // Deconfirmation: repasser un RDV "en attente" rembourse les credits
    // consommes, remet le tarif a revalider, et previent le client.
    if (status === "requested") {
      revertAppointmentToRequested(id);
    } else {
      updateAppointmentStatus(id, status);
    }

    if (status === "done") {
      awardPointsForAppointment(appointment.client_id, appointment.id);
      // Le passage est effectue: les lots rattaches a ce RDV sont remis.
      honorGoodieWinsForAppointment(appointment.id);
    }

    const updatedAppointment = getAppointmentById(id);
    const client = getClientById(appointment.client_id);

    if (client && updatedAppointment) {
      try {
        if (["confirmed", "done"].includes(status)) {
          await sendClientAppointmentStatusEmail({
            client,
            appointment: updatedAppointment,
            eventType: status === "done" ? "done" : "confirmed",
          });
        } else if (status === "requested" && appointment.status !== "requested") {
          await sendClientAppointmentStatusEmail({
            client,
            appointment: updatedAppointment,
            eventType: "reverted",
          });
        }
      } catch (mailError) {
        console.error("[MAIL] client appointment status:", mailError);
      }
    }

    return res.json({
      ok: true,
      appointment: mapAppointmentRow(updatedAppointment),
    });
  } catch (error) {
    console.error("[adminApi] POST /appointments/:id/status:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post("/appointments/:id/request-photos", async (req, res) => {
  const id = Number(req.params.id || 0);
  if (!id) {
    return res.status(400).json({ ok: false, error: "invalid_id" });
  }

  try {
    const appointment = getAppointmentById(id);
    if (!appointment) {
      return res.status(404).json({ ok: false, error: "appointment_not_found" });
    }

    const result = reviewAppointmentPrice(id, {
      requestPhotos: true,
      photosMessage: sanitizeString(req.body?.message),
    });
    const updatedAppointment = getAppointmentById(id);
    const client = getClientById(appointment.client_id);

    try {
      await sendClientPhotosRequestedEmail({
        client,
        appointment: updatedAppointment,
        message: updatedAppointment.photos_request_message,
      });
    } catch (mailError) {
      console.error("[MAIL] client photos requested:", mailError);
    }

    return res.json({
      ok: result.ok !== false,
      appointment: mapAppointmentRow(updatedAppointment),
    });
  } catch (error) {
    console.error("[adminApi] POST /appointments/:id/request-photos:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post("/appointments/:id/workspace", (req, res) => {
  const id = Number(req.params.id || 0);
  if (!id) {
    return res.status(400).json({ ok: false, error: "invalid_id" });
  }

  try {
    const appointment = getAppointmentById(id);
    if (!appointment) {
      return res.status(404).json({ ok: false, error: "appointment_not_found" });
    }

    updateAppointmentAdminWorkspace(id, {
      adminNote: sanitizeString(req.body?.adminNote),
      cleanlinessRating: req.body?.cleanlinessRating || null,
    });

    return res.json({
      ok: true,
      appointment: mapAppointmentRow(getAppointmentById(id)),
    });
  } catch (error) {
    console.error("[adminApi] POST /appointments/:id/workspace:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post("/appointments/:id/admin-note", (req, res) => {
  const id = Number(req.params.id || 0);
  if (!id) {
    return res.status(400).json({ ok: false, error: "invalid_id" });
  }

  try {
    const appointment = getAppointmentById(id);
    if (!appointment) {
      return res.status(404).json({ ok: false, error: "appointment_not_found" });
    }

    updateAppointmentAdminWorkspace(id, {
      adminNote: sanitizeString(req.body?.adminNote),
      cleanlinessRating: req.body?.cleanlinessRating || null,
    });

    return res.json({
      ok: true,
      appointment: mapAppointmentRow(getAppointmentById(id)),
    });
  } catch (error) {
    console.error("[adminApi] POST /appointments/:id/admin-note:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post(
  "/appointments/:id/photos/upload",
  appointmentPhotoUpload.single("file"),
  async (req, res) => {
    const id = Number(req.params.id || 0);
    if (!id) {
      return res.status(400).json({ ok: false, error: "invalid_id" });
    }
    if (!req.file) {
      return res.status(400).json({ ok: false, error: "no_file" });
    }

    try {
      const appointment = getAppointmentById(id);
      if (!appointment) {
        return res.status(404).json({ ok: false, error: "appointment_not_found" });
      }

      const caption =
        typeof req.body.caption === "string" && req.body.caption.trim() !== ""
          ? req.body.caption.trim()
          : null;
      const finalName = await optimizeUploadedImage(APPOINTMENTS_UPLOAD_DIR, req.file.filename);
      const url = `/uploads/appointments/${finalName}`;
      // Photo postee par l'admin -> "apres" (resultat de la prestation).
      const row = insertAppointmentPhoto(id, url, caption, 0, 1, "after");

      return res.json({ ok: true, photo: mapPhotoRow(row) });
    } catch (error) {
      console.error("[adminApi] POST /appointments/:id/photos/upload:", error);
      return res.status(500).json({ ok: false, error: "server_error" });
    }
  },
);

router.get("/appointments/:id/photos", (req, res) => {
  const id = Number(req.params.id || 0);
  if (!id) {
    return res.status(400).json({ ok: false, error: "invalid_id" });
  }

  try {
    const appointment = getAppointmentById(id);
    if (!appointment) {
      return res.status(404).json({ ok: false, error: "appointment_not_found" });
    }

    return res.json({
      ok: true,
      photos: getAppointmentPhotos(id).map(mapPhotoRow),
    });
  } catch (error) {
    console.error("[adminApi] GET /appointments/:id/photos:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

// Tag avant/apres d'une photo (optionnel).
router.post("/appointments/:id/photos/:photoId/category", (req, res) => {
  const id = Number(req.params.id || 0);
  const photoId = Number(req.params.photoId || 0);
  if (!id || !photoId) {
    return res.status(400).json({ ok: false, error: "invalid_id" });
  }
  const category =
    req.body?.category === "before" || req.body?.category === "after"
      ? req.body.category
      : null;
  try {
    updateAppointmentPhotoCategory(photoId, id, category);
    return res.json({ ok: true, category });
  } catch (error) {
    console.error("[adminApi] POST photo category:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post("/appointments/:id/photos", (req, res) => {
  const id = Number(req.params.id || 0);
  if (!id) {
    return res.status(400).json({ ok: false, error: "invalid_id" });
  }

  const { url, caption } = req.body || {};
  if (!url || typeof url !== "string" || !url.trim()) {
    return res.status(400).json({ ok: false, error: "invalid_url" });
  }

  try {
    const appointment = getAppointmentById(id);
    if (!appointment) {
      return res.status(404).json({ ok: false, error: "appointment_not_found" });
    }

    const row = insertAppointmentPhoto(
      id,
      url.trim(),
      typeof caption === "string" && caption.trim() !== "" ? caption.trim() : null,
      0,
      1,
    );

    return res.json({ ok: true, photo: mapPhotoRow(row) });
  } catch (error) {
    console.error("[adminApi] POST /appointments/:id/photos:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post("/exports", async (_req, res) => {
  try {
    const exportFile = createDataExportFile("manual");
    const emailSent = await sendAdminDataExportEmail({
      fileName: exportFile.fileName,
      buffer: exportFile.buffer,
      triggerType: "manual",
    });

    if (emailSent) {
      markExportJobEmailSent(exportFile.filePath);
    }

    return res.json({
      ok: true,
      fileName: exportFile.fileName,
      filePath: exportFile.filePath,
      emailSent,
      createdAt: nowUnix(),
    });
  } catch (error) {
    console.error("[adminApi] POST /exports:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

// ============================
// Web Push (notifications admin)
// ============================
router.get("/push/public-key", (req, res) => {
  return res.json({
    ok: true,
    configured: isPushConfigured(),
    publicKey: getVapidPublicKey(),
  });
});

router.post("/push/subscribe", (req, res) => {
  const subscription = req.body?.subscription || req.body || {};
  const endpoint = subscription.endpoint;
  const keys = subscription.keys || {};

  if (!endpoint || !keys.p256dh || !keys.auth) {
    return res.status(400).json({ ok: false, error: "invalid_subscription" });
  }

  try {
    const saved = saveSubscription({
      role: "admin",
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: req.headers["user-agent"] || null,
    });

    if (!saved) {
      return res.status(400).json({ ok: false, error: "invalid_subscription" });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error("[adminApi] POST /push/subscribe:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post("/push/unsubscribe", (req, res) => {
  const endpoint = req.body?.endpoint || req.body?.subscription?.endpoint;
  if (!endpoint) {
    return res.status(400).json({ ok: false, error: "missing_endpoint" });
  }

  try {
    deleteSubscriptionByEndpoint(endpoint);
    return res.json({ ok: true });
  } catch (error) {
    console.error("[adminApi] POST /push/unsubscribe:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

// --- Evenements (jeux concours) ---------------------------------------------
function parseEventBody(body) {
  const out = {};
  if (typeof body?.title === "string") out.title = body.title.trim();
  if (typeof body?.description === "string") out.description = body.description;
  if (["global", "founder", "bbx"].includes(body?.audience)) out.audience = body.audience;
  if (body?.startsAt !== undefined) out.startsAt = body.startsAt ? Number(body.startsAt) : null;
  if (body?.endsAt !== undefined) out.endsAt = body.endsAt ? Number(body.endsAt) : null;
  if (typeof body?.isActive === "boolean") out.isActive = body.isActive;
  if (typeof body?.requireInstagram === "boolean") out.requireInstagram = body.requireInstagram;
  if (typeof body?.requireTiktok === "boolean") out.requireTiktok = body.requireTiktok;
  if (typeof body?.requireFacebook === "boolean") out.requireFacebook = body.requireFacebook;
  if (typeof body?.requireReview === "boolean") out.requireReview = body.requireReview;
  if (typeof body?.conditionsText === "string") out.conditionsText = body.conditionsText;
  if (typeof body?.conditionsLink === "string") out.conditionsLink = body.conditionsLink;
  if (["text", "inapp"].includes(body?.prizeKind)) out.prizeKind = body.prizeKind;
  if (typeof body?.prizeText === "string") out.prizeText = body.prizeText;
  if (typeof body?.prizeInappType === "string") out.prizeInappType = body.prizeInappType;
  if (body?.prizeInappAmount !== undefined)
    out.prizeInappAmount = body.prizeInappAmount ? Number(body.prizeInappAmount) : 0;
  if (typeof body?.consolationEnabled === "boolean") out.consolationEnabled = body.consolationEnabled;
  return out;
}

function clientDisplayName(client) {
  if (!client) return null;
  return client.full_name || `${client.first_name || ""} ${client.last_name || ""}`.trim() || null;
}

function eventView(row) {
  const event = mapEventRow(row);
  if (!event) return null;
  event.participants = countParticipants(event.id);
  event.winnerName = event.winnerClientId
    ? clientDisplayName(getClientById(event.winnerClientId))
    : null;
  return event;
}

router.get("/events", (_req, res) => {
  try {
    return res.json({ ok: true, events: listEvents().map(eventView) });
  } catch (error) {
    console.error("[adminApi] GET /events:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

// Liste des participants d'un evenement (avec leur nombre de tickets).
router.get("/events/:id/participants", (req, res) => {
  try {
    const id = Number(req.params.id || 0);
    const participants = listParticipants(id).map((p) => ({
      ...p,
      consolationLabel: p.consolationReward
        ? getConsolationGoodie(p.consolationReward)?.label || p.consolationReward
        : null,
    }));
    return res.json({ ok: true, participants });
  } catch (error) {
    console.error("[adminApi] GET /events/:id/participants:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post("/events", (req, res) => {
  try {
    const event = createEvent(parseEventBody(req.body));
    return res.json({ ok: true, event: eventView(event) });
  } catch (error) {
    console.error("[adminApi] POST /events:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post("/events/:id", (req, res) => {
  try {
    const event = updateEvent(Number(req.params.id || 0), parseEventBody(req.body));
    if (!event) return res.status(404).json({ ok: false, error: "event_not_found" });
    return res.json({ ok: true, event: eventView(event) });
  } catch (error) {
    console.error("[adminApi] POST /events/:id:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post("/events/:id/active", (req, res) => {
  try {
    const activate = req.body?.active === true;
    const event = setActive(Number(req.params.id || 0), activate);
    if (!event) return res.status(404).json({ ok: false, error: "event_not_found" });

    // Lancement: on annonce l'evenement a l'audience (best-effort, jamais Pro).
    if (activate) {
      void (async () => {
        for (const client of eventAudienceClients(event)) {
          try {
            await sendEventAnnouncementEmail({ client, event, kind: "launch" });
          } catch (error) {
            console.error("[adminApi] event launch announce:", error);
          }
        }
      })();
    }

    return res.json({ ok: true, event: eventView(event) });
  } catch (error) {
    console.error("[adminApi] POST /events/:id/active:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post("/events/:id/draw", (req, res) => {
  try {
    const id = Number(req.params.id || 0);
    const result = drawWinner(id);
    if (!result.ok) {
      return res.status(400).json({ ok: false, error: result.error });
    }
    // Notifie le gagnant (push + email), best-effort.
    const eventRow = getEventById(id);
    if (result.winner && eventRow) {
      void sendEventWinnerEmail({ client: result.winner, event: eventRow }).catch((error) => {
        console.error("[adminApi] sendEventWinnerEmail:", error);
      });
    }

    // Annonce de fin d'evenement a l'audience (best-effort, jamais Pro).
    if (eventRow) {
      const winnerId = result.winnerClientId ?? null;
      void (async () => {
        for (const client of eventAudienceClients(eventRow)) {
          if (client.id === winnerId) continue; // le gagnant a deja son e-mail dedie
          try {
            await sendEventAnnouncementEmail({ client, event: eventRow, kind: "end" });
          } catch (error) {
            console.error("[adminApi] event end announce:", error);
          }
        }
      })();
    }
    return res.json({
      ok: true,
      event: eventView(eventRow),
      winnerName: clientDisplayName(result.winner),
    });
  } catch (error) {
    console.error("[adminApi] POST /events/:id/draw:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

// Clients d'un evenement selon son audience (jamais les Pro).
function eventAudienceClients(event) {
  return listClientsForSegment("bbx").filter((client) => {
    if (event.audience === "founder") return !!client.is_founder;
    if (event.audience === "bbx") return !client.is_founder;
    return true; // global
  });
}

// Email groupe libre (composer admin) vers un segment.
router.post("/broadcast", async (req, res) => {
  try {
    const { subject, title, body, buttonLabel, buttonUrl, segment } = req.body || {};
    if (!body && !title) {
      return res.status(400).json({ ok: false, error: "empty" });
    }
    const clients = listClientsForSegment(segment || "all");
    let sent = 0;
    for (const client of clients) {
      try {
        const ok = await sendBroadcastEmail({ client, subject, title, body, buttonLabel, buttonUrl });
        if (ok) sent += 1;
      } catch (error) {
        console.error("[adminApi] broadcast:", error);
      }
    }
    return res.json({ ok: true, sent, total: clients.length });
  } catch (error) {
    console.error("[adminApi] POST /broadcast:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

// Analytics (funnel, retention, heatmap).
router.get("/analytics", (_req, res) => {
  try {
    return res.json({ ok: true, analytics: getAdminAnalytics() });
  } catch (error) {
    console.error("[adminApi] GET /analytics:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

// Statistiques mensuelles (tableau de bord admin).
router.get("/stats", (req, res) => {
  try {
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const monthIndex =
      req.query.month !== undefined ? Number(req.query.month) : now.getMonth();
    return res.json({ ok: true, stats: getAdminMonthlyStats(year, monthIndex) });
  } catch (error) {
    console.error("[adminApi] GET /stats:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

// Envoi du recap annuel a tous les clients BBX ayant au moins 1 prestation
// dans l'annee (best-effort, sequentiel).
router.post("/recap/send", async (req, res) => {
  try {
    const year = Number(req.body?.year) || new Date().getFullYear();
    const clients = listClients().filter(
      (client) => (client.client_type || "bbx") === "bbx" && client.email,
    );
    let sent = 0;
    let eligible = 0;
    for (const client of clients) {
      const recap = getClientYearRecap(client.id, year);
      if (recap.visits <= 0) continue;
      eligible += 1;
      try {
        const ok = await sendClientYearRecapEmail({ client, recap });
        if (ok) sent += 1;
      } catch (error) {
        console.error("[adminApi] recap send:", error);
      }
    }
    return res.json({ ok: true, year, eligible, sent });
  } catch (error) {
    console.error("[adminApi] POST /recap/send:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

// Reglages societe (mentions sur les factures).
router.get("/settings/company", (_req, res) => {
  try {
    return res.json({ ok: true, company: getCompanyInfo() });
  } catch (error) {
    console.error("[adminApi] GET /settings/company:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post("/settings/company", (req, res) => {
  try {
    return res.json({ ok: true, company: setCompanyInfo(req.body || {}) });
  } catch (error) {
    console.error("[adminApi] POST /settings/company:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.get("/goodies", (req, res) => {
  try {
    const status = req.query.status === "honored" ? "honored" : "pending";
    return res.json({
      ok: true,
      goodies: listGoodieWins(status),
      pendingCount: countPendingGoodieWins(),
    });
  } catch (error) {
    console.error("[adminApi] GET /goodies:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post("/goodies/:id/honor", (req, res) => {
  try {
    markGoodieWinHonored(Number(req.params.id || 0), req.body?.honored !== false);
    return res.json({ ok: true, pendingCount: countPendingGoodieWins() });
  } catch (error) {
    console.error("[adminApi] POST /goodies/:id/honor:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.delete("/events/:id", (req, res) => {
  try {
    deleteEvent(Number(req.params.id || 0));
    return res.json({ ok: true });
  } catch (error) {
    console.error("[adminApi] DELETE /events/:id:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

module.exports = router;
