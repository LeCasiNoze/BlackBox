const express = require("express");
const multer = require("multer");
const { optimizeUploadedImage } = require("../services/imageProcessing");
const path = require("path");
const router = express.Router();

const {
  APPOINTMENTS_UPLOAD_DIR,
  PARTNER_ORDERS_UPLOAD_DIR,
  QUOTES_UPLOAD_DIR,
  VEHICLES_UPLOAD_DIR,
  ensureDir,
} = require("../config/storage");
const {
  createQuoteRequest,
  insertQuoteRequestPhoto,
  getQuoteRequestPhotos,
  getActiveQuoteRequestForClient,
  attachQuoteCheckout,
  syncQuotePaymentFromCheckout,
  getQuoteRequestById,
  markQuoteRequestConverted,
  refuseQuoteRequest,
  deleteQuoteRequest,
} = require("../db/quoteRequests");
const { isSumupTopupReady } = require("../config/topupOffers");
const {
  countFounders,
  createClient,
  expireTemporaryFounders,
  getClientById,
  getClientBySlugOrCardCode,
  getClientByPartnerPublicToken,
  getOrCreatePartnerPublicToken,
  getFounderLeaderboardRank,
  getFoundersLeaderboard,
  markWelcomeEmailSent,
  openReviewBox,
  setLeaderboardOptIn,
  updateClientProfile,
  updateClientTermsAcceptance,
} = require("../db/clients");

const { recordLandingEvent } = require("../db/landingStats");

// ── Analytics Landing Page (visites & clics) ──────────────────────────────────
router.post("/landing/track", (req, res) => {
  try {
    const { eventType, visitorId, referrer } = req.body || {};
    const userAgent = req.headers["user-agent"] || null;
    if (!eventType || !visitorId) {
      return res.status(400).json({ ok: false, error: "invalid_payload" });
    }
    recordLandingEvent({ eventType, visitorId, userAgent, referrer });
    return res.json({ ok: true });
  } catch (error) {
    console.error("[clientApi] POST /landing/track:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

// Nombre maximum de fondateurs (places limitees).
const FOUNDER_CAP = 50;
const { REVIEW_BOX_GOODIES } = require("../config/reviewBox");
const {
  attachPendingGoodieWinsToNextAppointment,
  listPendingGoodieWinsForAppointment,
} = require("../db/goodieWins");
const { joinWaitlist, getClientWaitlist, leaveWaitlist } = require("../db/waitlist");
const { notifyWaitlistForFreedSlot } = require("../services/waitlistNotifier");
const {
  getActiveEventForClient,
  getParticipation,
  mapEventRow,
  participate,
} = require("../db/events");
const { CONSOLATION_GOODIES } = require("../config/eventRewards");
const {
  APPOINTMENT_SLOTS,
  acceptAppointmentPriceForClient,
  cancelAppointmentAndRefund,
  createRequestedAppointmentForSlot,
  defaultTimeForSlot,
  expireUnpaidAppointmentQuotes,
  finalizeAppointmentFromPaidQuote,
  getAppointmentByDateAndSlot,
  getAppointmentById,
  getAppointmentPhotos,
  getAppointmentsByDate,
  getAppointmentsForClient,
  getAppointmentsForMonth,
  getPublicAppointmentsFeed,
  hasAppointmentPhotos,
  insertAppointmentPhoto,
  markAppointmentClientPhotosAdded,
  normalizeAppointmentSlot,
  reviewAppointmentPrice,
  updateAppointmentForClientSlot,
  updateAppointmentUserReview,
  cancelAppointmentForClientOnDate,
} = require("../db/appointments");
const { createSignupCode, consumeSignupCode } = require("../db/signup_codes");
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
const {
  createTopupOrder,
  attachTopupCheckoutSession,
  getPaidTopupOrderForClient,
  getTopupOrderByCheckoutReference,
  listPaidTopupOrdersByClient,
  mapTopupOrderRow,
  processPaidTopupOrder,
  syncTopupOrderFromCheckout,
} = require("../db/topup_orders");
const { getCompanyInfo } = require("../db/settings");
const { getClientYearRecap } = require("../db/recap");
const { getPartnerForfait, listPartnerForfaits } = require("../config/partnerForfaits");
const {
  createPartnerOrder,
  deletePartnerOrder,
  getPartnerOrderById,
  listPartnerOrders,
  listPendingPartnerOrdersWithCheckout,
  mapPartnerOrderRow,
  insertPartnerOrderPhoto,
  syncPartnerOrderFromCheckout,
} = require("../db/partner_orders");
const {
  sendAdminNotification,
  sendAdminPartnerOrderEmail,
  sendAdminQuoteRequestEmail,
  sendAdminRewardRedemption,
  sendClientAppointmentStatusEmail,
  sendAdminQuoteRefusedEmail,
  sendQuotePaidNotifications,
  sendClientWelcomeEmail,
  sendSignupVerificationCode,
} = require("../email");
const { createHostedCheckout, retrieveCheckout, sumupConfigured } = require("../services/sumup");
const { getVapidPublicKey, isPushConfigured } = require("../services/webPush");
const {
  saveSubscription,
  deleteSubscriptionByEndpoint,
  listSubscriptionsByClient,
} = require("../db/pushSubscriptions");
const { listPendingCaseOpenings, openCaseOpening } = require("../db/caseOpenings");
const { caseTiersForCredits } = require("../config/bcoins");
const { SERVICE_CATALOG, SERVICE_CATEGORIES, getServicesByKeys } = require("../config/services");
const {
  attachAppointmentCheckout,
  createAppointmentPaymentOrder,
  createProcessedAppointmentPaymentOrderFromQuote,
  getPaidAppointmentOrderForClient,
  getLatestAppointmentPaymentOrder,
  listPaidAppointmentOrdersByClient,
} = require("../db/appointment_payment_orders");
const { db } = require("../db");

const SLOT_END_TIMES = {
  morning: "12:00",
  afternoon: "18:00",
};
const MAX_BOOKING_IMAGES = 8;
const PORTAL_LOOKUP_LIMIT = 8;
const PORTAL_LOOKUP_WINDOW_MS = 15 * 60 * 1000;
const portalLookupAttempts = new Map();
const publicOrderAttempts = new Map();

function consumePortalLookupAttempt(req) {
  const forwardedFor = req.get("x-forwarded-for");
  const forwardedAddresses =
    typeof forwardedFor === "string"
      ? forwardedFor.split(",").map((value) => value.trim()).filter(Boolean)
      : [];
  const key =
    forwardedAddresses[forwardedAddresses.length - 1] ||
    req.ip ||
    req.socket?.remoteAddress ||
    "unknown";
  const now = Date.now();
  if (portalLookupAttempts.size > 500) {
    for (const [storedKey, value] of portalLookupAttempts) {
      if (value.resetAt <= now) portalLookupAttempts.delete(storedKey);
    }
  }
  const current = portalLookupAttempts.get(key);

  if (!current || current.resetAt <= now) {
    portalLookupAttempts.set(key, { count: 1, resetAt: now + PORTAL_LOOKUP_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= PORTAL_LOOKUP_LIMIT) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

function consumePublicOrderAttempt(req) {
  const key = req.ip || req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  const current = publicOrderAttempts.get(key);
  if (!current || current.resetAt <= now) {
    publicOrderAttempts.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (current.count >= 12) return false;
  current.count += 1;
  return true;
}

ensureDir(VEHICLES_UPLOAD_DIR);

const clientVehicleUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, VEHICLES_UPLOAD_DIR),
    filename: (_req, file, callback) => {
      const ext = path.extname(file.originalname) || ".jpg";
      callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext.toLowerCase()}`);
    },
  }),
  limits: { files: 1, fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    callback(null, typeof file.mimetype === "string" && file.mimetype.startsWith("image/"));
  },
});

function handleVehicleUpload(req, res, next) {
  clientVehicleUpload.single("image")(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ ok: false, error: "image_too_large" });
    }
    return res.status(400).json({ ok: false, error: "image_upload_failed" });
  });
}

ensureDir(APPOINTMENTS_UPLOAD_DIR);
ensureDir(PARTNER_ORDERS_UPLOAD_DIR);

const clientAppointmentUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, APPOINTMENTS_UPLOAD_DIR);
    },
    filename: (_req, file, callback) => {
      const ext = path.extname(file.originalname) || ".jpg";
      const base = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      callback(null, `${base}${ext.toLowerCase()}`);
    },
  }),
  limits: {
    files: MAX_BOOKING_IMAGES,
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (typeof file.mimetype === "string" && file.mimetype.startsWith("image/")) {
      callback(null, true);
      return;
    }

    callback(new Error("invalid_file_type"));
  },
});

function handleBookingUpload(req, res, next) {
  clientAppointmentUpload.array("images", MAX_BOOKING_IMAGES)(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ ok: false, error: "image_too_large" });
      }

      if (error.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({ ok: false, error: "too_many_images" });
      }
    }

    if (error?.message === "invalid_file_type") {
      return res.status(400).json({ ok: false, error: "invalid_image_type" });
    }

    return res.status(400).json({ ok: false, error: "image_upload_failed" });
  });
}

async function attachClientBookingImages(appointmentId, files = []) {
  if (!appointmentId || !Array.isArray(files) || files.length === 0) {
    return 0;
  }

  let insertedCount = 0;

  for (const file of files) {
    try {
      const finalName = await optimizeUploadedImage(APPOINTMENTS_UPLOAD_DIR, file.filename);
      insertAppointmentPhoto(
        appointmentId,
        `/uploads/appointments/${finalName}`,
        "Photo envoyee par le client",
        0,
        0,
        // Photo envoyee par le client -> "avant" (etat du vehicule).
        "before",
      );
      insertedCount += 1;
    } catch (error) {
      console.error("[BOOK] attachClientBookingImages:", error);
    }
  }

  return insertedCount;
}

// ── Devis : upload des photos (meme principe que la reservation) ────────────
ensureDir(QUOTES_UPLOAD_DIR);

const clientQuoteUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, QUOTES_UPLOAD_DIR);
    },
    filename: (_req, file, callback) => {
      const ext = path.extname(file.originalname) || ".jpg";
      const base = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      callback(null, `${base}${ext.toLowerCase()}`);
    },
  }),
  limits: { files: MAX_BOOKING_IMAGES, fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (typeof file.mimetype === "string" && file.mimetype.startsWith("image/")) {
      callback(null, true);
      return;
    }
    callback(new Error("invalid_file_type"));
  },
});

function handleQuoteUpload(req, res, next) {
  clientQuoteUpload.array("images", MAX_BOOKING_IMAGES)(req, res, (error) => {
    if (!error) {
      next();
      return;
    }
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ ok: false, error: "image_too_large" });
      }
      if (error.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({ ok: false, error: "too_many_images" });
      }
    }
    if (error?.message === "invalid_file_type") {
      return res.status(400).json({ ok: false, error: "invalid_image_type" });
    }
    return res.status(400).json({ ok: false, error: "image_upload_failed" });
  });
}

const partnerOrderUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, PARTNER_ORDERS_UPLOAD_DIR),
    filename: (_req, file, callback) => {
      const ext = path.extname(file.originalname) || ".jpg";
      callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext.toLowerCase()}`);
    },
  }),
  limits: { files: MAX_BOOKING_IMAGES, fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) =>
    callback(null, typeof file.mimetype === "string" && file.mimetype.startsWith("image/")),
});

function handlePartnerOrderUpload(req, res, next) {
  partnerOrderUpload.array("images", MAX_BOOKING_IMAGES)(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ ok: false, error: "image_too_large" });
    }
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ ok: false, error: "too_many_images" });
    }
    return res.status(400).json({ ok: false, error: "image_upload_failed" });
  });
}

async function attachPartnerOrderImages(orderId, files = []) {
  let count = 0;
  for (const file of Array.isArray(files) ? files : []) {
    try {
      const finalName = await optimizeUploadedImage(PARTNER_ORDERS_UPLOAD_DIR, file.filename);
      insertPartnerOrderPhoto(orderId, `/uploads/partner-orders/${finalName}`);
      count += 1;
    } catch (error) {
      console.error("[PARTNER ORDER] attach images:", error);
    }
  }
  return count;
}

async function attachQuoteImages(quoteId, files = []) {
  if (!quoteId || !Array.isArray(files) || files.length === 0) return 0;
  let count = 0;
  for (const file of files) {
    try {
      const finalName = await optimizeUploadedImage(QUOTES_UPLOAD_DIR, file.filename);
      insertQuoteRequestPhoto(quoteId, `/uploads/quotes/${finalName}`);
      count += 1;
    } catch (error) {
      console.error("[QUOTE] attachQuoteImages:", error);
    }
  }
  return count;
}

function quotePayload(quote) {
  if (!quote) return null;
  return { ...quote, photos: getQuoteRequestPhotos(quote.id) };
}

function parseServiceKeys(value) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch (_error) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
}

function serviceSnapshot(services) {
  return services.map(({ key, category, label, founderOnly }) => ({
    key,
    category,
    label,
    founderOnly,
  }));
}

function parseMonthParam(value) {
  if (!value || typeof value !== "string") return null;
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (Number.isNaN(year) || Number.isNaN(monthIndex)) return null;

  return { year, monthIndex };
}

function publicBaseUrl(req) {
  const explicit = process.env.CLIENT_PORTAL_BASE_URL;
  if (typeof explicit === "string" && explicit.trim() !== "") {
    return explicit.trim().replace(/\/+$/, "");
  }

  const forwardedProto = req.get("x-forwarded-proto");
  const proto = forwardedProto ? forwardedProto.split(",")[0].trim() : req.protocol || "https";
  return `${proto}://${req.get("host")}`;
}

// Reference courte et lisible servant a la fois de jeton public du lien
// (`/forfait/<reference>`) et de reference SumUp. Le forfait apparait dans
// l'URL ("en fonction du tarif").
function buildForfaitCheckoutReference(forfait) {
  return `f-${forfait.key}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`.slice(
    0,
    90,
  );
}

function isBbxClient(client) {
  return (client.client_type || client.clientType || "bbx") === "bbx";
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
    imageUrl: row.image_url || null,
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
    clientCleanlinessEstimate: appointment.client_cleanliness_estimate || null,
    adminCleanlinessEstimate: appointment.admin_cleanliness_estimate || null,
    requestedCredits: appointment.requested_credits ?? 1,
    approvedCredits: appointment.approved_credits ?? null,
    creditsCharged: appointment.credits_charged ?? 0,
    priceStatus: appointment.price_status || "pending_admin",
    photosRequestedAt: appointment.photos_requested_at ?? null,
    photosRequestMessage: appointment.photos_request_message || null,
    priceComment: appointment.price_comment || null,
    serviceKey: appointment.service_key || null,
    serviceLabel: appointment.service_label || null,
    serviceItems: (() => {
      try {
        return appointment.service_items_json ? JSON.parse(appointment.service_items_json) : [];
      } catch (_error) {
        return [];
      }
    })(),
    standardPriceCents: appointment.standard_price_cents ?? null,
    approvedPriceCents: appointment.approved_price_cents ?? null,
    amountPaidCents: appointment.amount_paid_cents ?? 0,
    paidAt: appointment.paid_at ?? null,
    quoteExpiresAt: appointment.quote_expires_at ?? null,
    hasPhotos: hasAppointmentPhotos(appointment.id),
    location: appointment.location || null,
    goodies: listPendingGoodieWinsForAppointment(appointment.id).map((win) => win.rewardLabel),
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
    bcPending: client.bc_pending ?? 0,
    reviewBoxOpenedAt: client.review_box_opened_at ?? null,
    reviewBoxReward: client.review_box_reward ?? null,
    founderUntil: client.founder_until ?? null,
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

  return true;
}

function ensureProClient(client, res) {
  if (!ensurePortalEligible(client, res)) {
    return false;
  }
  if ((client.client_type || "bbx") !== "pro") {
    res.status(403).json({ ok: false, error: "not_a_pro_account" });
    return false;
  }
  return true;
}

router.get("/public/services", (_req, res) => {
  return res.json({
    ok: true,
    services: SERVICE_CATALOG.filter((service) => !service.founderOnly),
    categories: SERVICE_CATEGORIES.filter((category) => category.key !== "founder"),
  });
});

router.get(["/public/partner-sales", "/public/partner-sales/:token"], (req, res) => {
  const token = String(req.params.token || "").trim();
  const partner = token ? getClientByPartnerPublicToken(token) : null;
  if (token && !partner) {
    return res.status(404).json({ ok: false, error: "partner_not_found" });
  }
  return res.json({
    ok: true,
    paymentsReady: sumupConfigured(),
    partner: partner
      ? { label: partner.company || partner.full_name || "Partenaire Bryan Cars" }
      : null,
    forfaits: listPartnerForfaits(),
  });
});

router.post(
  ["/public/partner-sales/orders", "/public/partner-sales/:token/orders"],
  handlePartnerOrderUpload,
  async (req, res) => {
    if (!consumePublicOrderAttempt(req)) {
      return res.status(429).json({ ok: false, error: "too_many_requests" });
    }
    const token = String(req.params.token || "").trim();
    const partner = token ? getClientByPartnerPublicToken(token) : null;
    if (token && !partner) {
      return res.status(404).json({ ok: false, error: "partner_not_found" });
    }
    const forfait = getPartnerForfait(req.body?.forfaitKey);
    if (!forfait || !listPartnerForfaits().some((item) => item.key === forfait.key)) {
      return res.status(400).json({ ok: false, error: "invalid_forfait" });
    }

    const customerName = String(req.body?.customerName || "").trim().slice(0, 140);
    const customerEmail = String(req.body?.customerEmail || "").trim().toLowerCase().slice(0, 180);
    const customerPhone = String(req.body?.customerPhone || "").trim().slice(0, 40);
    const vehicleModel = String(req.body?.vehicleModel || "").trim().slice(0, 160);
    const vehiclePlate = String(req.body?.vehiclePlate || "").trim().slice(0, 40);
    const vehicleDetails = String(req.body?.vehicleDetails || "").trim().slice(0, 600);
    const files = Array.isArray(req.files) ? req.files : [];

    if (
      !customerName ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) ||
      customerPhone.replace(/\D/g, "").length < 8 ||
      !vehicleModel ||
      files.length === 0 ||
      String(req.body?.acceptedTerms || "") !== "true"
    ) {
      return res.status(400).json({ ok: false, error: "invalid_customer_details" });
    }

    const baseUrl = publicBaseUrl(req);
    const checkoutReference = buildForfaitCheckoutReference(forfait);
    const order = createPartnerOrder({
      partnerClientId: partner?.id || null,
      partnerLabel: partner?.company || partner?.full_name || partner?.card_code || null,
      forfait,
      checkoutReference,
      redirectUrl: `${baseUrl}/forfait/${encodeURIComponent(checkoutReference)}?paid=1`,
      returnUrl: `${baseUrl}/api/payments/sumup/webhook`,
      customerName,
      customerEmail,
      customerPhone,
      vehicleModel,
      vehiclePlate,
      vehicleDetails,
    });
    const photoCount = await attachPartnerOrderImages(order.id, files);
    if (photoCount === 0) {
      deletePartnerOrder(order.id, partner?.id || null);
      return res.status(500).json({ ok: false, error: "image_processing_failed" });
    }
    const mappedOrder = mapPartnerOrderRow(order);
    try {
      await sendAdminPartnerOrderEmail({ order: mappedOrder, photoCount });
    } catch (error) {
      console.error("[MAIL] partner order admin notification:", error);
    }

    return res.status(201).json({
      ok: true,
      paymentsReady: sumupConfigured(),
      paymentPath: `/forfait/${encodeURIComponent(checkoutReference)}`,
      checkoutPath: `/api/payments/forfait/${encodeURIComponent(checkoutReference)}/checkout`,
      order: { ...mappedOrder, photoCount },
    });
  },
);

router.post("/signup/request-code", handleQuoteUpload, async (req, res) => {
  const body = req.body || {};
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: "invalid_email" });
  }

  const uploadedImages = Array.isArray(req.files) ? req.files.map((f) => f.filename) : [];
  const requestedQuoteServiceKeys = parseServiceKeys(body.quoteServiceKeys || body.serviceKeys);
  const quoteServices = getServicesByKeys(requestedQuoteServiceKeys);
  const quoteIntent =
    requestedQuoteServiceKeys.length > 0 ||
    uploadedImages.length > 0 ||
    Boolean(String(body.quoteDescription || "").trim());
  if (
    requestedQuoteServiceKeys.length > 0 &&
    (quoteServices.length !== new Set(requestedQuoteServiceKeys).size ||
      quoteServices.some((service) => service.founderOnly))
  ) {
    return res.status(400).json({ ok: false, error: "invalid_services" });
  }
  if (
    quoteIntent &&
    (quoteServices.length === 0 || uploadedImages.length === 0 || !String(body.vehicleModel || "").trim())
  ) {
    return res.status(400).json({ ok: false, error: "invalid_quote_details" });
  }

  const payload = {
    firstName: body.firstName,
    lastName: body.lastName,
    email,
    phone: body.phone,
    company: body.company,
    addressLine1: body.addressLine1,
    postalCode: body.postalCode,
    city: body.city,
    vehicleModel: body.vehicleModel,
    vehiclePlate: body.vehiclePlate,
    quoteDescription: typeof body.quoteDescription === "string" ? body.quoteDescription.trim().slice(0, 600) : null,
    quoteImageFilenames: uploadedImages,
    quoteServiceItems: serviceSnapshot(quoteServices),
    clientType: "bbx",
    formulaTotal: 0,
    formulaRemaining: 0,
  };

  const signup = createSignupCode({ email, payload });
  if (!signup) {
    return res.status(500).json({ ok: false, error: "cannot_create_code" });
  }

  const fullName = [body.firstName, body.lastName].filter(Boolean).join(" ");
  await sendSignupVerificationCode({ email, code: signup.code, fullName });
  return res.json({ ok: true, expiresAt: signup.expiresAt });
});

router.post("/signup/verify", async (req, res) => {
  const { email, code } = req.body || {};
  const payload = consumeSignupCode(email, code);
  if (!payload) {
    return res.status(400).json({ ok: false, error: "invalid_or_expired_code" });
  }

  try {
    const client = createClient(payload);
    // Les conditions sont acceptees a l'inscription (avant le code), on
    // enregistre l'acceptation des la creation du compte.
    try {
      updateClientTermsAcceptance(client.id);
    } catch (termsError) {
      console.error("[API] signup terms:", termsError);
    }
    // L'email de bienvenue ne doit jamais faire echouer la creation du compte.
    let welcomeSent = false;
    try {
      welcomeSent = await sendClientWelcomeEmail(client);
      if (welcomeSent) {
        markWelcomeEmailSent(client.id);
      }
    } catch (mailError) {
      console.error("[API] signup welcome email:", mailError);
    }

    // Auto-creation de la demande de devis si une description ou des images ont ete fournies
    if (
      payload.quoteDescription ||
      (payload.quoteImageFilenames && payload.quoteImageFilenames.length > 0) ||
      (payload.quoteServiceItems && payload.quoteServiceItems.length > 0)
    ) {
      try {
        const signupVehicle = getPrimaryVehicleByClientId(client.id);
        const quoteId = createQuoteRequest({
          clientId: client.id,
          description: payload.quoteDescription || null,
          serviceItems: payload.quoteServiceItems || [],
          vehicleId: signupVehicle?.id || null,
          vehicleLabel: signupVehicle?.label || payload.vehicleModel || null,
          vehicleModel: signupVehicle?.model || payload.vehicleModel || null,
          vehiclePlate: signupVehicle?.plate || payload.vehiclePlate || null,
        });
        let photoCount = 0;
        if (Array.isArray(payload.quoteImageFilenames) && payload.quoteImageFilenames.length > 0) {
          photoCount = await attachQuoteImages(
            quoteId,
            payload.quoteImageFilenames.map((filename) => ({ filename }))
          );
        }
        await sendAdminQuoteRequestEmail({
          client,
          description: payload.quoteDescription || null,
          photoCount,
          quoteId,
          vehicle: [signupVehicle?.model || payload.vehicleModel, signupVehicle?.plate || payload.vehiclePlate].filter(Boolean).join(" · "),
          serviceItems: payload.quoteServiceItems || [],
        });
      } catch (quoteError) {
        console.error("[API] auto quote request error:", quoteError);
      }
    }

    return res.json({
      ok: true,
      client: mapClientPayload(getClientById(client.id)),
      portalUrl: `/card/${encodeURIComponent(client.slug || client.card_code)}`,
      welcomeSent,
    });
  } catch (error) {
    console.error("[API] signup verify:", error);
    return res.status(500).json({ ok: false, error: "cannot_create_client" });
  }
});

router.get("/:idOrSlug", (req, res) => {
  // Expire les acces fondateur temporaires arrives a terme avant de repondre.
  try {
    expireTemporaryFounders();
    expireUnpaidAppointmentQuotes();
  } catch (_error) {
    // best-effort
  }
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }

  const monthParam = parseMonthParam(req.query.m);
  const month = buildMonthPayload(client, monthParam);
  // Les comptes pro utilisent un libelle libre propre a chaque rendez-vous :
  // leur ancien garage n'est plus expose dans le portail.
  const vehicles =
    (client.client_type || "bbx") === "pro"
      ? []
      : listVehiclesByClient(client.id).map(mapVehicleRow);
  const rewardRedemptions = listRewardRedemptionsByClient(client.id).map(mapRewardRow);

  const activeEventRow = getActiveEventForClient(client);
  let eventPayload = null;
  if (activeEventRow) {
    const participation = getParticipation(activeEventRow.id, client.id);
    eventPayload = {
      ...mapEventRow(activeEventRow),
      participated: !!participation,
      consolationReward: participation?.consolation_reward ?? null,
      // Pre-validation de l'avis si la box avis a deja ete ouverte.
      reviewDone: !!client.review_box_opened_at,
    };
  }

  const foundersCount = countFounders();

  return res.json({
    ok: true,
    client: mapClientPayload(client),
    vehicles,
    rewardCatalog: isBbxClient(client) ? BC_REWARDS : [],
    rewardRedemptions: isBbxClient(client) ? rewardRedemptions : [],
    // Les achats de credits sont desactives. Le paiement d'un rendez-vous et
    // l'acces Fondateur continuent d'utiliser SumUp independamment.
    topupOffers: [],
    paymentsReady: isSumupTopupReady(),
    serviceCatalog: SERVICE_CATALOG,
    serviceCategories: SERVICE_CATEGORIES,
    pendingCases: client.is_founder ? listPendingCaseOpenings(client.id) : [],
    event: eventPayload,
    founderCap: FOUNDER_CAP,
    foundersRemaining: Math.max(0, FOUNDER_CAP - foundersCount),
    waitlist: getClientWaitlist(client.id),
    month,
    // Devis (BBX & fondateurs uniquement ; les pros passent par les forfaits).
    quoteRequest:
      (client.client_type || "bbx") === "pro"
        ? null
        : quotePayload(getActiveQuoteRequestForClient(client.id)),
  });
});

// ── Devis : creation d'une demande d'estimation (photos + description) ───────
router.post("/:idOrSlug/quote", handleQuoteUpload, async (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }
  if ((client.client_type || "bbx") === "pro") {
    return res.status(403).json({ ok: false, error: "not_available_for_pro" });
  }

  // Une seule demande de devis active a la fois.
  if (getActiveQuoteRequestForClient(client.id)) {
    return res.status(409).json({ ok: false, error: "quote_already_exists" });
  }

  const description =
    (req.body?.description || "").toString().trim().slice(0, 600) || null;
  const uploadedImages = Array.isArray(req.files) ? req.files : [];
  const requestedServiceKeys = parseServiceKeys(req.body?.serviceKeys);
  const services = getServicesByKeys(requestedServiceKeys);
  if (services.length === 0 || services.length !== new Set(requestedServiceKeys).size) {
    return res.status(400).json({ ok: false, error: "invalid_services" });
  }
  if (!client.is_founder && services.some((service) => service.founderOnly)) {
    return res.status(403).json({ ok: false, error: "founder_service_required" });
  }
  if (uploadedImages.length === 0) {
    return res.status(400).json({ ok: false, error: "photos_required" });
  }
  const vehicleId = Number(req.body?.vehicleId || 0) || null;
  const vehicle = vehicleId ? getVehicleById(vehicleId) : null;
  if (!vehicle || vehicle.client_id !== client.id) {
    return res.status(400).json({ ok: false, error: "vehicle_required" });
  }

  let quoteId;
  try {
    quoteId = createQuoteRequest({
      clientId: client.id,
      description,
      serviceItems: serviceSnapshot(services),
      vehicleId: vehicle.id,
      vehicleLabel: vehicle.label || vehicle.model || null,
      vehicleModel: vehicle.model || vehicle.label || null,
      vehiclePlate: vehicle.plate || null,
    });
  } catch (error) {
    console.error("[QUOTE] createQuoteRequest:", error);
    return res.status(500).json({ ok: false, error: "db_error" });
  }

  const photoCount = await attachQuoteImages(quoteId, uploadedImages);
  if (photoCount === 0) {
    deleteQuoteRequest(quoteId);
    return res.status(500).json({ ok: false, error: "image_processing_failed" });
  }

  try {
    await sendAdminQuoteRequestEmail({
      client,
      description,
      photoCount,
      quoteId,
      vehicle: [vehicle.model || vehicle.label, vehicle.plate].filter(Boolean).join(" · "),
      serviceItems: serviceSnapshot(services),
    });
  } catch (error) {
    console.error("[MAIL] notif devis admin:", error);
  }

  return res.json({
    ok: true,
    quoteRequest: quotePayload(getActiveQuoteRequestForClient(client.id)),
  });
});

// ── Devis : fermeture de la demande par le client (pour en relancer une) ────
router.delete("/:idOrSlug/quote", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }
  const existing = getActiveQuoteRequestForClient(client.id);
  if (existing?.status === "pending") {
    deleteQuoteRequest(existing.id);
  }
  return res.json({ ok: true });
});

// ── Devis : paiement du montant exact avant toute planification ─────────────
router.post("/:idOrSlug/quote/checkout", async (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }
  if ((client.client_type || "bbx") === "pro") {
    return res.status(403).json({ ok: false, error: "not_available_for_pro" });
  }
  if (!sumupConfigured()) {
    return res.status(503).json({ ok: false, error: "sumup_not_ready" });
  }
  const existing = getActiveQuoteRequestForClient(client.id);
  if (!existing || !["answered", "accepted", "paid"].includes(existing.status)) {
    return res.status(404).json({ ok: false, error: "no_answered_quote" });
  }
  if (!Number.isFinite(Number(existing.estimatedPriceCents)) || Number(existing.estimatedPriceCents) <= 0) {
    return res.status(409).json({ ok: false, error: "quote_not_priced" });
  }
  if (existing.paymentStatus === "paid" || existing.status === "paid") {
    return res.json({ ok: true, alreadyPaid: true, quoteRequest: quotePayload(existing) });
  }

  if (existing.checkoutId && existing.hostedCheckoutUrl) {
    try {
      const checkout = await retrieveCheckout(existing.checkoutId);
      const result = syncQuotePaymentFromCheckout(existing.id, checkout);
      if (result.amountMismatch) {
        console.error(`[SUMUP] quote amount mismatch (quoteId=${existing.id})`);
        return res.status(409).json({ ok: false, error: "payment_amount_mismatch" });
      }
      if (result.becamePaid) {
        await sendQuotePaidNotifications({ client, quote: result.quote });
      }
      if (result.quote?.paymentStatus === "paid") {
        return res.json({ ok: true, alreadyPaid: true, quoteRequest: quotePayload(result.quote) });
      }
      if (String(checkout?.status || "").toUpperCase() === "PENDING" && checkout.hosted_checkout_url) {
        return res.json({ ok: true, hostedCheckoutUrl: checkout.hosted_checkout_url });
      }
    } catch (_error) {
      // Le checkout n'est plus réutilisable : une nouvelle tentative est créée.
    }
  }

  const baseUrl = publicBaseUrl(req);
  const checkoutReference = `bbx-devis-${existing.id}-${Date.now().toString(36)}`.slice(0, 90);
  const redirectUrl = `${baseUrl}/card/${encodeURIComponent(
    client.slug || client.card_code,
  )}?view=booking&devis=1&quoteId=${existing.id}&quotePaid=1`;

  try {
    const checkout = await createHostedCheckout({
      checkoutReference,
      amountCents: existing.estimatedPriceCents,
      currency: "EUR",
      description: `Devis Bryan Cars #${existing.id}`,
      redirectUrl,
      returnUrl: `${baseUrl}/api/payments/sumup/webhook`,
    });
    const updated = attachQuoteCheckout(existing.id, checkoutReference, checkout);
    return res.json({
      ok: true,
      hostedCheckoutUrl: checkout.hosted_checkout_url,
      quoteRequest: quotePayload(updated),
    });
  } catch (error) {
    console.error("[SUMUP] quote checkout:", error);
    return res.status(502).json({ ok: false, error: "sumup_checkout_failed" });
  }
});

router.post("/:idOrSlug/quote/sync-payment", async (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) return;
  const existing = getActiveQuoteRequestForClient(client.id);
  if (!existing) {
    return res.status(404).json({ ok: false, error: "quote_not_found" });
  }
  if (existing.paymentStatus === "paid") {
    return res.json({ ok: true, quoteRequest: quotePayload(existing) });
  }
  if (!existing.checkoutId || !sumupConfigured()) {
    return res.status(400).json({ ok: false, error: "payment_not_started" });
  }
  try {
    const checkout = await retrieveCheckout(existing.checkoutId);
    const result = syncQuotePaymentFromCheckout(existing.id, checkout);
    if (result.amountMismatch) {
      console.error(`[SUMUP] quote amount mismatch (quoteId=${existing.id})`);
      return res.status(409).json({ ok: false, error: "payment_amount_mismatch" });
    }
    if (result.becamePaid) {
      await sendQuotePaidNotifications({ client, quote: result.quote });
    }
    return res.json({ ok: true, quoteRequest: quotePayload(result.quote) });
  } catch (error) {
    console.error("[SUMUP] quote sync:", error);
    return res.status(502).json({ ok: false, error: "sumup_sync_failed" });
  }
});

// ── Devis : refus du devis par le client avec motif ─────────────────────────
router.post("/:idOrSlug/quote/refuse", async (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }
  const existing = getActiveQuoteRequestForClient(client.id);
  if (!existing || !["answered", "accepted"].includes(existing.status) || existing.paymentStatus === "paid") {
    return res.status(404).json({ ok: false, error: "no_answered_quote" });
  }
  if (existing.paymentStatus === "pending") {
    return res.status(409).json({ ok: false, error: "payment_started" });
  }
  const refusalReason = (req.body?.refusalReason || "").toString().trim().slice(0, 80) || null;
  const refusalComment = (req.body?.refusalComment || "").toString().trim().slice(0, 600) || null;
  if (!refusalReason) {
    return res.status(400).json({ ok: false, error: "refusal_reason_required" });
  }

  const updated = refuseQuoteRequest(existing.id, { refusalReason, refusalComment });
  try {
    await sendAdminQuoteRefusedEmail({ client, quote: updated });
  } catch (error) {
    console.error("[MAIL] quote refused:", error);
  }
  return res.json({ ok: true, quoteRequest: quotePayload(updated) });
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

router.patch("/:idOrSlug/profile", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }

  const fields = {
    firstName: 80,
    lastName: 80,
    phone: 40,
    addressLine1: 180,
    postalCode: 20,
    city: 100,
  };
  const payload = {};

  for (const [field, maxLength] of Object.entries(fields)) {
    if (!Object.prototype.hasOwnProperty.call(req.body || {}, field)) continue;
    if (typeof req.body[field] !== "string") {
      return res.status(400).json({ ok: false, error: "invalid_profile" });
    }
    payload[field] = req.body[field].trim().slice(0, maxLength);
  }

  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ ok: false, error: "empty_profile" });
  }

  try {
    const updated = updateClientProfile(client.id, payload);
    return res.json({ ok: true, client: mapClientPayload(updated) });
  } catch (error) {
    console.error("[API] client profile update:", error);
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
    vehicles:
      (client.client_type || "bbx") === "pro"
        ? []
        : listVehiclesByClient(client.id).map(mapVehicleRow),
  });
});

// --- Forfaits partenaire (comptes pro) ---------------------------------------
// L'agence (compte pro) consulte la grille de forfaits et son suivi de
// paiements, puis genere un lien a transmettre au client final.
router.get("/:idOrSlug/forfaits", async (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensureProClient(client, res)) {
    return;
  }

  // Rafraichit au mieux les commandes encore en attente (best-effort: on ne
  // bloque pas le suivi si SumUp est indisponible). Le webhook reste le
  // mecanisme principal de mise a jour.
  if (sumupConfigured()) {
    const pending = listPendingPartnerOrdersWithCheckout({
      partnerClientId: client.id,
      limit: 15,
    });
    await Promise.all(
      pending.map(async (order) => {
        try {
          const checkout = await retrieveCheckout(order.checkoutId);
          syncPartnerOrderFromCheckout(order.id, checkout);
        } catch (error) {
          // silencieux: simple rafraichissement opportuniste
        }
      }),
    );
  }

  const publicToken = getOrCreatePartnerPublicToken(client.id);
  if (!publicToken) {
    return res.status(500).json({ ok: false, error: "partner_link_unavailable" });
  }

  return res.json({
    ok: true,
    paymentsReady: sumupConfigured(),
    forfaits: listPartnerForfaits(),
    orders: listPartnerOrders({ partnerClientId: client.id, limit: 100 }),
    publicLink: `${publicBaseUrl(req)}/preparation-vente/${encodeURIComponent(publicToken)}`,
  });
});

router.post("/:idOrSlug/forfaits/link", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensureProClient(client, res)) {
    return;
  }

  if (!sumupConfigured()) {
    return res.status(503).json({ ok: false, error: "sumup_not_ready" });
  }

  const forfait = getPartnerForfait(req.body?.forfaitKey);
  if (!forfait) {
    return res.status(400).json({ ok: false, error: "invalid_forfait" });
  }

  const baseUrl = publicBaseUrl(req);
  const checkoutReference = buildForfaitCheckoutReference(forfait);
  const partnerLabel =
    client.company || client.full_name || client.card_code || client.slug || null;

  const order = createPartnerOrder({
    partnerClientId: client.id,
    partnerLabel,
    forfait,
    checkoutReference,
    redirectUrl: `${baseUrl}/forfait/${encodeURIComponent(checkoutReference)}?paid=1`,
    returnUrl: `${baseUrl}/api/payments/sumup/webhook`,
  });

  return res.json({
    ok: true,
    link: `${baseUrl}/forfait/${encodeURIComponent(checkoutReference)}`,
    order: mapPartnerOrderRow(order),
  });
});

router.delete("/:idOrSlug/forfaits/orders/:orderId", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensureProClient(client, res)) {
    return;
  }

  const orderId = Number(req.params.orderId);
  if (!orderId || !Number.isInteger(orderId)) {
    return res.status(400).json({ ok: false, error: "invalid_order_id" });
  }

  const { deletePartnerOrder } = require("../db/partner_orders");
  const deleted = deletePartnerOrder(orderId, client.id);

  return res.json({ ok: true, deleted: Boolean(deleted) });
});

router.post("/:idOrSlug/topup/checkout", async (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }
  return res.status(410).json({ ok: false, error: "credits_disabled" });
});

// Acces fondateur: paiement SumUp unique (49,90 EUR, places limitees a 50).
// A la confirmation (webhook ou /topup/sync au retour), le compte bbx passe fondateur.
router.post("/:idOrSlug/founder/checkout", async (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }

  if (client.client_type !== "bbx" || client.is_founder) {
    return res.status(400).json({ ok: false, error: "not_eligible_for_founder" });
  }

  // Places limitees: pas de nouveau fondateur au-dela du plafond.
  if (countFounders() >= FOUNDER_CAP) {
    return res.status(409).json({ ok: false, error: "founder_cap_reached" });
  }

  if (!isSumupTopupReady()) {
    return res.status(503).json({ ok: false, error: "sumup_not_ready" });
  }

  const offer = {
    key: "founder-access",
    label: "Acces fondateur Bryan Cars",
    formulaName: null,
    applyMode: "add",
    credits: 0,
    durationDays: null,
    priceCents: 4990,
    currency: "EUR",
  };

  const baseUrl = publicBaseUrl(req);
  const slugOrCode = client.slug || client.card_code || req.params.idOrSlug;
  const checkoutReference = `bbx-founder-${client.id}-${Date.now()}-${Math.floor(
    Math.random() * 1e6,
  )}`.slice(0, 90);
  const redirectUrl = `${baseUrl}/card/${encodeURIComponent(
    slugOrCode,
  )}?view=home&founderRef=${encodeURIComponent(checkoutReference)}`;
  const returnUrl = `${baseUrl}/api/payments/sumup/webhook`;

  const order = createTopupOrder({
    clientId: client.id,
    offer,
    checkoutReference,
    redirectUrl,
    returnUrl,
  });

  try {
    const checkout = await createHostedCheckout({
      checkoutReference,
      amountCents: offer.priceCents,
      currency: offer.currency,
      description: `Acces fondateur - ${client.full_name || client.card_code || client.slug}`,
      redirectUrl,
      returnUrl,
    });

    const updatedOrder = attachTopupCheckoutSession(order.id, {
      checkoutId: checkout.id,
      hostedCheckoutUrl: checkout.hosted_checkout_url,
      sumupStatus: checkout.status || "PENDING",
      payload: checkout,
    });

    return res.json({
      ok: true,
      hostedCheckoutUrl: checkout.hosted_checkout_url,
      checkoutReference,
      topupOrder: mapTopupOrderRow(updatedOrder),
    });
  } catch (error) {
    console.error("[SUMUP] create founder checkout:", error);
    return res.status(502).json({ ok: false, error: "sumup_checkout_failed" });
  }
});

// Box "avis Google": 1 ouverture par compte. Le clic se fait apres avoir
// envoye le client vers l'avis (confiance). Tire un lot et l'enregistre.
router.post("/:idOrSlug/review-box/open", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }

  const result = openReviewBox(client.id);
  if (!result.ok && result.error === "already_opened") {
    return res.status(409).json({ ok: false, error: "already_opened" });
  }
  if (!result.ok) {
    return res.status(400).json({ ok: false, error: result.error || "review_box_failed" });
  }

  const updated = getClientById(client.id);
  const deliver = result.deliveryAppointment;
  return res.json({
    ok: true,
    reward: { key: result.reward.key, label: result.reward.label, kind: result.reward.kind },
    deliveryAppointment: deliver ? { date: deliver.date, slot: deliver.slot } : null,
    tiers: REVIEW_BOX_GOODIES.map((goodie) => ({
      key: goodie.key,
      label: goodie.label,
      proba: goodie.proba,
    })),
    client: mapClientPayload(updated),
  });
});

// Participation a un evenement: prerequis valides cote client (confiance).
// La 1re action cree la participation (et tire la box de consolation); les
// actions suivantes ne font que mettre a jour le nombre de tickets.
router.post("/:idOrSlug/event/:eventId/participate", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }

  const eventId = Number(req.params.eventId || 0);
  const tickets = Number(req.body?.tickets || 1);
  const result = participate(eventId, client, tickets);
  if (!result.ok) {
    return res.status(400).json({ ok: false, error: result.error || "participate_failed" });
  }

  const deliver = result.deliveryAppointment;
  return res.json({
    ok: true,
    created: result.created === true,
    tickets: result.tickets ?? tickets,
    // La box n'est renvoyee qu'a la creation (1re participation).
    consolation:
      result.created && result.consolation
        ? { key: result.consolation.key, label: result.consolation.label }
        : null,
    deliveryAppointment: result.created && deliver ? { date: deliver.date, slot: deliver.slot } : null,
    tiers: CONSOLATION_GOODIES.map((goodie) => ({
      key: goodie.key,
      label: goodie.label,
      proba: goodie.proba,
    })),
  });
});

// Liste d'attente: s'inscrire sur un creneau pris (date + slot).
router.post("/:idOrSlug/waitlist", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }

  const date = typeof req.body?.date === "string" ? req.body.date.trim() : "";
  const slot = normalizeAppointmentSlot(req.body?.slot);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ ok: false, error: "invalid_date" });
  }

  try {
    joinWaitlist(client.id, date, slot);
    return res.json({ ok: true, waitlist: getClientWaitlist(client.id) });
  } catch (error) {
    console.error("[API] waitlist join:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

function invoiceNumberFor(order) {
  const ts = Number(order.paid_at || order.created_at || 0);
  const year = ts ? new Date(ts * 1000).getFullYear() : new Date().getFullYear();
  return `BC-${year}-${String(order.id).padStart(5, "0")}`;
}

function leaderboardName(c) {
  const first = (c.first_name || (c.full_name || "").split(" ")[0] || "Fondateur").trim();
  const lastInitial = (c.last_name || (c.full_name || "").split(" ")[1] || "").trim().charAt(0);
  return lastInitial ? `${first} ${lastInitial.toUpperCase()}.` : first;
}

// Classement BC'Coins (fondateurs, opt-in).
router.get("/:idOrSlug/leaderboard", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }
  if (!client.is_founder) {
    return res.json({ ok: true, eligible: false, optIn: false, entries: [], yourRank: null });
  }
  const top = getFoundersLeaderboard(10).map((c, index) => ({
    rank: index + 1,
    name: leaderboardName(c),
    bc: c.bc_points || 0,
    isYou: c.id === client.id,
  }));
  const optIn = !!client.leaderboard_opt_in;
  return res.json({
    ok: true,
    eligible: true,
    optIn,
    yourBc: client.bc_points || 0,
    yourRank: optIn ? getFounderLeaderboardRank(client.id, client.bc_points || 0) : null,
    entries: top,
  });
});

router.post("/:idOrSlug/leaderboard/opt", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }
  if (!client.is_founder) {
    return res.status(400).json({ ok: false, error: "not_founder" });
  }
  const optIn = req.body?.optIn === true;
  setLeaderboardOptIn(client.id, optIn);
  return res.json({ ok: true, optIn });
});

// Recap annuel "Ton annee Bryan Cars".
router.get("/:idOrSlug/recap", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }
  const year = Number(req.query.year) || new Date().getFullYear();
  return res.json({ ok: true, recap: getClientYearRecap(client.id, year) });
});

// Liste des factures (paiements regles) du client.
router.get("/:idOrSlug/invoices", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }
  try {
    const legacyInvoices = listPaidTopupOrdersByClient(client.id).map((order) => ({
      id: order.id,
      number: invoiceNumberFor(order),
      label: order.offer_label || "Paiement",
      credits: order.credits ?? 0,
      amountCents: order.amount_cents ?? 0,
      currency: order.currency || "EUR",
      paidAt: order.paid_at ?? order.created_at ?? null,
    }));
    const appointmentInvoices = listPaidAppointmentOrdersByClient(client.id).map((order) => ({
      id: `appointment-${order.id}`,
      number: `RDV-${String(order.id).padStart(6, "0")}`,
      label: order.service_label || "Prestation detailing",
      credits: 0,
      amountCents: order.amount_cents ?? 0,
      currency: order.currency || "EUR",
      paidAt: order.paid_at ?? order.created_at ?? null,
    }));
    const invoices = [...appointmentInvoices, ...legacyInvoices].sort(
      (left, right) => Number(right.paidAt || 0) - Number(left.paidAt || 0),
    );
    return res.json({ ok: true, invoices });
  } catch (error) {
    console.error("[API] invoices:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

// Detail d'une facture (pour la page imprimable).
router.get("/:idOrSlug/invoices/:orderId", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }
  const appointmentInvoiceMatch = /^appointment-(\d+)$/.exec(req.params.orderId || "");
  const order = appointmentInvoiceMatch
    ? getPaidAppointmentOrderForClient(client.id, Number(appointmentInvoiceMatch[1]))
    : getPaidTopupOrderForClient(client.id, Number(req.params.orderId || 0));
  if (!order) {
    return res.status(404).json({ ok: false, error: "invoice_not_found" });
  }

  return res.json({
    ok: true,
    invoice: {
      number: appointmentInvoiceMatch
        ? `RDV-${String(order.id).padStart(6, "0")}`
        : invoiceNumberFor(order),
      issuedAt: order.paid_at ?? order.created_at ?? null,
      // Designation generique "service" pour toutes les factures (au lieu de
      // l'intitule de l'offre de credits) : s'applique aussi aux factures deja
      // passees (la facture est generee a la demande, rien n'est fige).
      label: appointmentInvoiceMatch ? order.service_label || "Prestation detailing" : "Nettoyage véhicule",
      credits: order.credits ?? 0,
      amountCents: order.amount_cents ?? 0,
      currency: order.currency || "EUR",
      paymentMethod: "Carte (SumUp)",
      company: getCompanyInfo(),
      client: {
        company: client.company || null,
        name:
          client.full_name ||
          `${client.first_name || ""} ${client.last_name || ""}`.trim() ||
          "Client",
        email: client.email || "",
        address: client.address_line1 || "",
        city: [client.postal_code, client.city].filter(Boolean).join(" "),
        cardCode: client.card_code || client.slug || "",
      },
    },
  });
});

router.post("/:idOrSlug/topup/sync", async (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }

  const reference =
    typeof req.body?.reference === "string" && req.body.reference.trim() !== ""
      ? req.body.reference.trim()
      : null;

  if (!reference) {
    return res.status(400).json({ ok: false, error: "missing_reference" });
  }

  const order = getTopupOrderByCheckoutReference(reference);
  if (!order || order.client_id !== client.id) {
    return res.status(404).json({ ok: false, error: "topup_order_not_found" });
  }
  if (order.offer_key !== "founder-access") {
    return res.status(410).json({ ok: false, error: "credits_disabled" });
  }

  let nextOrder = order;
  let nextClient = getClientById(client.id);

  if (order.checkout_id) {
    try {
      const checkout = await retrieveCheckout(order.checkout_id);
      nextOrder = syncTopupOrderFromCheckout(order.id, checkout) || nextOrder;

      if (checkout.status === "PAID") {
        const result = processPaidTopupOrder(order.id, checkout);
        if (result?.client) {
          nextClient = result.client;
        }
        if (result?.order) {
          nextOrder = result.order;
        }
      }
    } catch (error) {
      console.error("[SUMUP] sync checkout:", error);
    }
  }

  return res.json({
    ok: true,
    client: mapClientPayload(nextClient),
    topupOrder: mapTopupOrderRow(nextOrder),
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

router.post("/:idOrSlug/vehicles/:vehicleId/photo", handleVehicleUpload, async (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) return;

  const vehicleId = Number(req.params.vehicleId || 0);
  const existing = getVehicleById(vehicleId);
  if (!vehicleId || !existing || existing.client_id !== client.id) {
    return res.status(404).json({ ok: false, error: "vehicle_not_found" });
  }
  if (!req.file) {
    return res.status(400).json({ ok: false, error: "image_required" });
  }

  try {
    const finalName = await optimizeUploadedImage(VEHICLES_UPLOAD_DIR, req.file.filename);
    const vehicle = updateVehicleForClient(client.id, vehicleId, {
      imageUrl: `/uploads/vehicles/${finalName}`,
    });
    return res.json({
      ok: true,
      vehicle: mapVehicleRow(vehicle),
      vehicles: listVehiclesByClient(client.id).map(mapVehicleRow),
    });
  } catch (error) {
    console.error("[API] client vehicle photo:", error);
    return res.status(500).json({ ok: false, error: "image_processing_failed" });
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
        category: photo.category || null,
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

// Mur d'avis public (landing): prestations effectuees notees >= 4 avec un
// commentaire. Anonymise (prenom seulement).
router.get("/public/reviews", (_req, res) => {
  try {
    const reviews = getPublicAppointmentsFeed(40)
      .filter(
        (a) =>
          a.user_review &&
          String(a.user_review).trim() !== "" &&
          Number(a.user_rating || 0) >= 4,
      )
      .slice(0, 12)
      .map((a) => ({
        id: a.id,
        author: String(a.full_name || "").trim().split(/\s+/)[0] || "Client",
        rating: a.user_rating,
        comment: a.user_review,
        vehicleModel: a.vehicle_model || null,
        date: a.date,
      }));
    return res.json({ ok: true, reviews });
  } catch (error) {
    console.error("[API] public reviews:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

// ── Espace membre : recherche par email (Landing page) ─────────────────────
router.post("/public/find-portal", (req, res) => {
  try {
    const attempt = consumePortalLookupAttempt(req);
    if (!attempt.allowed) {
      res.set("Retry-After", String(attempt.retryAfterSeconds));
      return res.status(429).json({ ok: false, error: "too_many_attempts" });
    }

    const email = (req.body?.email || "").toString().trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ ok: false, error: "email_required" });
    }

    const { getClientByEmail } = require("../db/clients");
    const client = getClientByEmail(email);

    if (!client) {
      return res.status(404).json({ ok: false, error: "client_not_found" });
    }

    const portalUrl = client.card_code ? `/card/${client.card_code}` : `/c/${client.slug}`;
    return res.json({ ok: true, portalUrl });
  } catch (error) {
    console.error("[API] find-portal error:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
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

  // Prevenir l'admin qu'un avis client vient d'etre laisse.
  void sendAdminNotification({
    type: "review",
    client,
    date: updated.date,
    time: updated.time,
    location: updated.location,
    clientNote: `Note ${numericRating}/5${updated.user_review ? ` - ${updated.user_review}` : ""}`,
    appointmentId,
  }).catch((error) => console.error("[MAIL] admin review notif:", error));

  return res.json({
    ok: true,
    appointment: mapClientAppointment(updated),
  });
});

router.post("/:idOrSlug/appointments/:appointmentId/accept-price", async (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }

  const appointmentId = Number(req.params.appointmentId) || 0;
  if (!appointmentId) {
    return res.status(400).json({ ok: false, error: "invalid_appointment_id" });
  }

  try {
    const result = acceptAppointmentPriceForClient(appointmentId, client.id);
    const updated = getAppointmentById(appointmentId);

    if (!result.ok && result.error === "credits_disabled") {
      return res.status(410).json({ ok: false, error: "credits_disabled" });
    }
    if (!result.ok && result.error === "payment_required") {
      return res.status(409).json({
        ok: false,
        error: "payment_required",
        appointment: mapClientAppointment(updated),
      });
    }

    if (!result.ok) {
      return res.status(400).json({ ok: false, error: result.error || "cannot_accept_price" });
    }

    try {
      await sendClientAppointmentStatusEmail({
        client: getClientById(client.id),
        appointment: updated,
        eventType: "confirmed",
      });
    } catch (error) {
      console.error("[MAIL] client confirmed after price:", error);
    }

    // Prevenir l'admin que le client a accepte le tarif et que le RDV est valide.
    try {
      await sendAdminNotification({
        type: "validated",
        client: getClientById(client.id),
        date: updated.date,
        time: updated.time,
        location: updated.location,
        clientNote: updated.client_note,
        appointmentId,
      });
    } catch (error) {
      console.error("[MAIL] admin price accepted:", error);
    }

    return res.json({
      ok: true,
      appointment: mapClientAppointment(getAppointmentById(appointmentId)),
      client: mapClientPayload(getClientById(client.id)),
    });
  } catch (error) {
    console.error("[API] accept price:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

// Le client finalise un rendez-vous valide par l'admin. Le montant du checkout
// vient exclusivement de la base (jamais du navigateur) afin d'eviter toute
// modification du prix cote client.
router.post("/:idOrSlug/appointments/:appointmentId/checkout", async (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) return;
  if (!sumupConfigured()) {
    return res.status(503).json({ ok: false, error: "sumup_not_ready" });
  }

  const appointmentId = Number(req.params.appointmentId) || 0;
  expireUnpaidAppointmentQuotes();
  const appointment = getAppointmentById(appointmentId);
  if (!appointment || appointment.client_id !== client.id) {
    return res.status(404).json({ ok: false, error: "appointment_not_found" });
  }
  if (appointment.status === "confirmed" && Number(appointment.amount_paid_cents || 0) > 0) {
    return res.json({ ok: true, alreadyPaid: true, appointment: mapClientAppointment(appointment) });
  }
  if (appointment.status === "cancelled" && Number(appointment.quote_expires_at || 0) > 0) {
    return res.status(410).json({ ok: false, error: "quote_expired" });
  }

  const amountCents = Number(appointment.approved_price_cents || 0);
  if (appointment.price_status !== "waiting_payment" || amountCents <= 0) {
    return res.status(400).json({ ok: false, error: "price_not_ready" });
  }

  const existing = getLatestAppointmentPaymentOrder(appointmentId);
  if (
    existing &&
    existing.status === "pending" &&
    Number(existing.amount_cents) === amountCents &&
    existing.hosted_checkout_url
  ) {
    try {
      const checkout = existing.checkout_id ? await retrieveCheckout(existing.checkout_id) : null;
      if (!checkout || checkout.status === "PENDING") {
        return res.json({ ok: true, hostedCheckoutUrl: existing.hosted_checkout_url });
      }
    } catch (_error) {
      // Le checkout n'est plus reutilisable : une nouvelle tentative est creee.
    }
  }

  const baseUrl = publicBaseUrl(req);
  const checkoutReference = `bbx-rdv-${appointmentId}-${Date.now().toString(36)}`;
  const redirectUrl = `${baseUrl}/card/${encodeURIComponent(client.slug)}?view=history&appointmentId=${appointmentId}&appointmentPaid=1`;
  const returnUrl = `${baseUrl}/api/payments/sumup/webhook`;
  const order = createAppointmentPaymentOrder({
    appointmentId,
    clientId: client.id,
    amountCents,
    checkoutReference,
  });

  try {
    const checkout = await createHostedCheckout({
      checkoutReference,
      amountCents,
      currency: "EUR",
      description: `${appointment.service_label || "Prestation detailing"} - ${appointment.date}`,
      redirectUrl,
      returnUrl,
    });
    attachAppointmentCheckout(order.id, checkout);
    return res.json({ ok: true, hostedCheckoutUrl: checkout.hosted_checkout_url });
  } catch (error) {
    console.error("[SUMUP] appointment checkout:", error);
    return res.status(502).json({ ok: false, error: "sumup_checkout_failed" });
  }
});

router.post(
  "/:idOrSlug/appointments/:appointmentId/photos",
  handleBookingUpload,
  async (req, res) => {
    const client = getClientBySlugOrCardCode(req.params.idOrSlug);
    if (!ensurePortalEligible(client, res)) {
      return;
    }

    const appointmentId = Number(req.params.appointmentId) || 0;
    if (!appointmentId) {
      return res.status(400).json({ ok: false, error: "invalid_appointment_id" });
    }

    const appointment = getAppointmentById(appointmentId);
    if (!appointment || appointment.client_id !== client.id) {
      return res.status(404).json({ ok: false, error: "appointment_not_found" });
    }

    const files = Array.isArray(req.files) ? req.files : [];
    const count = attachClientBookingImages(appointmentId, files);
    if (count > 0) {
      markAppointmentClientPhotosAdded(appointmentId);
    }

    try {
      await sendAdminNotification({
        type: "update",
        client,
        date: appointment.date,
        time: appointment.time || defaultTimeForSlot(appointment.slot),
        location: appointment.location || null,
        clientNote: appointment.client_note || null,
        clientImageCount: count,
      });
    } catch (error) {
      console.error("[MAIL] notif photos added:", error);
    }

    return res.json({
      ok: true,
      clientImageCount: count,
      appointment: mapClientAppointment(getAppointmentById(appointmentId)),
    });
  },
);

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

router.post("/:idOrSlug/book", handleBookingUpload, async (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }

  const { date, time, location, slot: rawSlot, clientNote } = req.body || {};
  const serviceLevel = req.body?.serviceLevel || req.body?.cleanlinessEstimate || "clean";
  let requestedServiceKeys = parseServiceKeys(req.body?.serviceKeys);
  const quoteId = Number(req.body?.quoteId || 0) || null;
  let acceptedQuote = null;
  if (quoteId) {
    const candidate = getQuoteRequestById(quoteId);
    if (
      !candidate ||
      candidate.clientId !== client.id ||
      candidate.status !== "paid" ||
      candidate.paymentStatus !== "paid" ||
      !candidate.estimatedPriceCents ||
      !candidate.paidAt
    ) {
      return res.status(400).json({ ok: false, error: "invalid_quote" });
    }
    acceptedQuote = candidate;
    requestedServiceKeys = candidate.serviceItems.map((service) => service.key);
  }
  const services = getServicesByKeys(requestedServiceKeys);
  const vehicleId = Number(req.body?.vehicleId || 0) || null;
  const isPro = (client.client_type || "bbx") === "pro";
  if (!isPro && !acceptedQuote) {
    return res.status(403).json({ ok: false, error: "paid_quote_required" });
  }
  const vehicleText =
    typeof req.body?.vehicleText === "string" ? req.body.vehicleText.trim().slice(0, 120) : "";
  const normalizedClientNote =
    typeof clientNote === "string" && clientNote.trim() !== "" ? clientNote.trim() : null;
  const uploadedImages = Array.isArray(req.files) ? req.files : [];
  const acceptedQuotePhotoUrls = acceptedQuote ? getQuoteRequestPhotos(acceptedQuote.id) : [];

  if (!date) {
    return res.status(400).json({ ok: false, error: "missing_date" });
  }
  if (!isValidSlot(rawSlot)) {
    return res.status(400).json({ ok: false, error: "missing_or_invalid_slot" });
  }
  if (isPro && !vehicleText) {
    return res.status(400).json({ ok: false, error: "vehicle_text_required" });
  }
  if (!isPro && (services.length === 0 || services.length !== new Set(requestedServiceKeys).size)) {
    return res.status(400).json({ ok: false, error: "invalid_services" });
  }
  if (!isPro && !client.is_founder && services.some((service) => service.founderOnly)) {
    return res.status(403).json({ ok: false, error: "founder_service_required" });
  }
  const serviceSummary = isPro
    ? null
    : services.length === 1
      ? services[0].label
      : `${services.length} prestations`;

  const quoteVehicleRow = acceptedQuote?.vehicleId
    ? getVehicleById(acceptedQuote.vehicleId)
    : null;
  const { vehicle, error: vehicleError } = isPro
    ? { vehicle: null, error: null }
    : acceptedQuote
      ? {
          vehicle:
            quoteVehicleRow?.client_id === client.id
              ? quoteVehicleRow
              : {
                  id: null,
                  model: acceptedQuote.vehicle?.model || acceptedQuote.vehicle?.label || null,
                  label: acceptedQuote.vehicle?.label || acceptedQuote.vehicle?.model || null,
                  plate: acceptedQuote.vehicle?.plate || null,
                },
          error: null,
        }
      : getBookingVehicleForClient(client, vehicleId);
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
  const loc = isPro
    ? "atelier"
    : normalizedLocation === "domicile"
      ? "domicile"
      : normalizedLocation === "atelier"
        ? "atelier"
        : null;
  if (!isPro && !loc) {
    return res.status(400).json({ ok: false, error: "location_required" });
  }

  const existing = getAppointmentByDateAndSlot(date, slot);
  const isMineActive =
    existing &&
    existing.client_id === client.id &&
    (existing.status === "requested" || existing.status === "confirmed");
  const canUpdateExisting = isPro && isMineActive;

  if (
    !isPro && acceptedQuotePhotoUrls.length === 0
  ) {
    return res.status(400).json({ ok: false, error: "photos_required" });
  }

  if (existing && !canUpdateExisting && existing.status !== "cancelled") {
    return res.status(409).json({ ok: false, error: "slot_taken" });
  }

  if (canUpdateExisting) {
    try {
      const changed = updateAppointmentForClientSlot({
        clientId: client.id,
        vehicleId: vehicle?.id || null,
        vehicleText: vehicleText,
        dateStr: date,
        slot,
        time: normalizedTime,
        clientNote: normalizedClientNote,
        location: loc,
        serviceLevel,
        serviceKey: isPro ? null : services[0].key,
        serviceLabel: serviceSummary,
        serviceItems: isPro ? [] : services.map(({ key, category, label, founderOnly }) => ({
          key,
          category,
          label,
          founderOnly,
        })),
      });

      if (!changed) {
        return res.status(400).json({
          ok: false,
          error: "cannot_update_appointment",
        });
      }

      const appointmentId = existing?.id || null;
      let clientImageCount = await attachClientBookingImages(appointmentId, uploadedImages);
      try {
        await sendAdminNotification({
          type: "update",
          client: {
            ...client,
            vehicle_model: isPro ? vehicleText : vehicle?.model || client.vehicle_model,
            vehicle_plate: isPro ? null : vehicle?.plate || client.vehicle_plate,
          },
          date,
          time: normalizedTime,
          location: loc || existing.location || null,
          clientNote: normalizedClientNote || existing.client_note || null,
          clientImageCount,
          serviceItems: services,
        });
      } catch (error) {
        console.error("[MAIL] notif update:", error);
      }

      return res.json({ ok: true, updated: true, clientImageCount });
    } catch (error) {
      return res.status(500).json({ ok: false, error: "server_error" });
    }
  }

  try {
    let appointmentId = null;

    try {
      appointmentId = db.transaction(() => {
        const createdId = createRequestedAppointmentForSlot({
          clientId: client.id,
          vehicleId: vehicle?.id || null,
          vehicleText:
            isPro
              ? vehicleText
              : vehicle?.id
                ? null
                : [vehicle?.model || vehicle?.label, vehicle?.plate].filter(Boolean).join(" · ") || null,
          dateStr: date,
          slot,
          time: normalizedTime,
          clientNote: normalizedClientNote,
          location: loc,
          serviceLevel,
          serviceKey: isPro ? null : services[0].key,
          serviceLabel: serviceSummary,
          serviceItems: isPro ? [] : services.map(({ key, category, label, founderOnly }) => ({
            key,
            category,
            label,
            founderOnly,
          })),
          status: "confirmed",
          priceStatus: isPro ? "not_required" : "approved",
          approvedCredits: isPro ? 0 : null,
          creditsCharged: 0,
        });
        if (acceptedQuote) {
          finalizeAppointmentFromPaidQuote(createdId, {
            amountCents: acceptedQuote.estimatedPriceCents,
            paidAt: acceptedQuote.paidAt,
          });
          createProcessedAppointmentPaymentOrderFromQuote({
            appointmentId: createdId,
            clientId: client.id,
            quote: acceptedQuote,
          });
          markQuoteRequestConverted(acceptedQuote.id, createdId);
        }
        return createdId;
      })();
    } catch (error) {
      console.error("[BOOK] createRequestedAppointmentForSlot:", error);

      if (error && error.code === "SQLITE_CONSTRAINT") {
        return res.status(409).json({ ok: false, error: "slot_taken" });
      }

      return res.status(500).json({ ok: false, error: "db_error" });
    }

    let clientImageCount = await attachClientBookingImages(appointmentId, uploadedImages);
    if (acceptedQuote && appointmentId) {
      for (const url of acceptedQuotePhotoUrls) {
        insertAppointmentPhoto(appointmentId, url, "Photo du devis accepte", 0, 0, "before");
        clientImageCount += 1;
      }
    }

    // Notifications d'abord : aucun effet de bord (lots, liste d'attente) ne doit
    // pouvoir empecher l'e-mail + push admin de partir (notamment pour les pros,
    // dont le RDV est confirme directement).
    try {
      const adminNotified = await sendAdminNotification({
        type: "book",
        client: {
          ...client,
          vehicle_model: isPro ? vehicleText : vehicle?.model || client.vehicle_model,
          vehicle_plate: isPro ? null : vehicle?.plate || client.vehicle_plate,
        },
        date,
        time: normalizedTime,
        location: loc,
        clientNote: normalizedClientNote,
        clientImageCount,
        serviceItems: services,
        appointmentId,
      });
      if (!adminNotified) {
        console.warn(
          `[BOOK] Notif admin NON envoyee (clientId=${client.id}, pro=${isPro}). Verifier MAIL_ADMIN_TO / cle Brevo.`,
        );
      }
    } catch (error) {
      console.error("[MAIL] notif book:", error);
    }

    if (isPro || acceptedQuote) {
      try {
        await sendClientAppointmentStatusEmail({
          client,
          appointment: getAppointmentById(appointmentId),
          eventType: "confirmed",
        });
      } catch (error) {
        console.error("[MAIL] notif pro confirmed:", error);
      }
    }

    // Effets de bord ensuite, isoles pour ne jamais casser la reponse ni les notifs.
    try {
      // Rattache au nouveau RDV les lots gagnes en attente de remise.
      attachPendingGoodieWinsToNextAppointment(client.id);
    } catch (error) {
      console.error("[BOOK] attachPendingGoodieWins:", error);
    }
    try {
      // Le client a reserve ce creneau: on le retire de la liste d'attente.
      leaveWaitlist(client.id, date, slot);
    } catch (error) {
      console.error("[BOOK] leaveWaitlist:", error);
    }

    return res.json({ ok: true, created: true, clientImageCount });
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

  // Fondateurs et pros : annulables a tout moment tant que le RDV n'est pas
  // marque effectue (statut deja filtre sur requested/confirmed plus haut).
  // Clients standard : annulation jusqu'a 24h avant le jour du rendez-vous.
  const isFounder = !!client.is_founder;
  const isPro = (client.client_type || "bbx") === "pro";
  if (!isFounder && !isPro) {
    const dayStart = new Date(`${appointment.date}T00:00:00`);
    const limit = new Date(dayStart.getTime() - 24 * 60 * 60 * 1000);
    if (Date.now() >= limit.getTime()) {
      return res.status(400).json({ ok: false, error: "too_late_to_cancel" });
    }
  }

  cancelAppointmentAndRefund(appointment.id);

  // Le RDV annule peut avoir porte des lots a remettre: on les rebascule
  // sur le prochain RDV a venir (ou on les detache si plus aucun).
  attachPendingGoodieWinsToNextAppointment(client.id);

  // Creneau libere -> on previent les inscrits en liste d'attente.
  void notifyWaitlistForFreedSlot(appointment.date, appointment.slot);

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

  if (!isBbxClient(client)) {
    return res.json({
      ok: true,
      bcPoints: 0,
      rewardCatalog: [],
      rewardRedemptions: [],
    });
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

  if (!isBbxClient(client)) {
    return res.status(403).json({ ok: false, error: "bc_disabled_for_client_type" });
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

// ============================
// Web Push (notifications client)
// ============================
router.get("/:idOrSlug/push/public-key", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }
  return res.json({
    ok: true,
    configured: isPushConfigured(),
    publicKey: getVapidPublicKey(),
  });
});

// Etat reel cote serveur : le navigateur peut rester "granted" alors que
// l'abonnement a ete supprime en base (endpoint expire nettoye apres 404/410),
// ou reassigne a un autre role si le meme appareil sert aussi l'admin.
router.get("/:idOrSlug/push/status", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }
  return res.json({
    ok: true,
    subscribed: listSubscriptionsByClient(client.id).length > 0,
  });
});

router.post("/:idOrSlug/push/subscribe", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }

  const subscription = req.body?.subscription || req.body || {};
  const endpoint = subscription.endpoint;
  const keys = subscription.keys || {};

  if (!endpoint || !keys.p256dh || !keys.auth) {
    return res.status(400).json({ ok: false, error: "invalid_subscription" });
  }

  try {
    const saved = saveSubscription({
      role: "client",
      clientId: client.id,
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
    console.error("[API] client push subscribe:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

router.post("/:idOrSlug/push/unsubscribe", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }
  const endpoint = req.body?.endpoint || req.body?.subscription?.endpoint;
  if (!endpoint) {
    return res.status(400).json({ ok: false, error: "missing_endpoint" });
  }
  try {
    deleteSubscriptionByEndpoint(endpoint);
    return res.json({ ok: true });
  } catch (error) {
    console.error("[API] client push unsubscribe:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

// ============================
// BC'Coins - cases (fondateurs)
// ============================
router.get("/:idOrSlug/cases", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }
  if (!client.is_founder) {
    return res.json({ ok: true, pendingCases: [], bcPoints: client.bc_points ?? 0 });
  }
  return res.json({
    ok: true,
    pendingCases: listPendingCaseOpenings(client.id),
    bcPoints: client.bc_points ?? 0,
  });
});

router.post("/:idOrSlug/cases/:caseId/open", (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }
  if (!client.is_founder) {
    return res.status(403).json({ ok: false, error: "not_founder" });
  }
  const caseId = Number(req.params.caseId) || 0;
  if (!caseId) {
    return res.status(400).json({ ok: false, error: "invalid_case_id" });
  }

  try {
    // Le contenu (lots possibles) pour l'animation, avant le tirage serveur.
    const pendingCase = listPendingCaseOpenings(client.id).find((c) => c.id === caseId);
    const tiers = pendingCase ? caseTiersForCredits(pendingCase.credits) : [];

    const result = openCaseOpening(caseId, client.id);
    if (!result.ok) {
      return res.status(409).json({ ok: false, error: result.error || "cannot_open" });
    }

    return res.json({
      ok: true,
      reward: result.reward,
      tiers,
      bcPoints: result.bcPoints,
      pendingCases: listPendingCaseOpenings(client.id),
    });
  } catch (error) {
    console.error("[API] open case:", error);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

module.exports = router;
