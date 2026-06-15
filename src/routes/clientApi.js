const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

const { APPOINTMENTS_UPLOAD_DIR, ensureDir } = require("../config/storage");
const {
  getTopupOfferForClient,
  getUnitTopupOfferForClient,
  isSumupTopupReady,
  listPublicTopupOffersForClient,
} = require("../config/topupOffers");
const {
  countFounders,
  createClient,
  expireTemporaryFounders,
  getClientById,
  getClientBySlugOrCardCode,
  markWelcomeEmailSent,
  openReviewBox,
  updateClientTermsAcceptance,
} = require("../db/clients");

// Nombre maximum de fondateurs (places limitees).
const FOUNDER_CAP = 50;
const { REVIEW_BOX_GOODIES } = require("../config/reviewBox");
const {
  attachPendingGoodieWinsToNextAppointment,
  listPendingGoodieWinsForAppointment,
} = require("../db/goodieWins");
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
  getTopupOrderByCheckoutReference,
  mapTopupOrderRow,
  processPaidTopupOrder,
  syncTopupOrderFromCheckout,
} = require("../db/topup_orders");
const { getPartnerForfait, listPartnerForfaits } = require("../config/partnerForfaits");
const {
  createPartnerOrder,
  getPartnerOrderById,
  listPartnerOrders,
  listPendingPartnerOrdersWithCheckout,
  mapPartnerOrderRow,
  syncPartnerOrderFromCheckout,
} = require("../db/partner_orders");
const {
  sendAdminNotification,
  sendAdminRewardRedemption,
  sendClientAppointmentStatusEmail,
  sendClientFormulaRecap,
  sendClientWelcomeEmail,
  sendSignupVerificationCode,
} = require("../email");
const { createHostedCheckout, retrieveCheckout, sumupConfigured } = require("../services/sumup");
const { getVapidPublicKey, isPushConfigured } = require("../services/webPush");
const {
  saveSubscription,
  deleteSubscriptionByEndpoint,
} = require("../db/pushSubscriptions");
const { listPendingCaseOpenings, openCaseOpening } = require("../db/caseOpenings");
const { caseTiersForCredits } = require("../config/bcoins");

const SLOT_END_TIMES = {
  morning: "12:00",
  afternoon: "18:00",
};
const MAX_BOOKING_IMAGES = 4;

ensureDir(APPOINTMENTS_UPLOAD_DIR);

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

function attachClientBookingImages(appointmentId, files = []) {
  if (!appointmentId || !Array.isArray(files) || files.length === 0) {
    return 0;
  }

  let insertedCount = 0;

  files.forEach((file) => {
    try {
      insertAppointmentPhoto(
        appointmentId,
        `/uploads/appointments/${file.filename}`,
        "Photo envoyee par le client",
        0,
        0,
      );
      insertedCount += 1;
    } catch (error) {
      console.error("[BOOK] attachClientBookingImages:", error);
    }
  });

  return insertedCount;
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

function buildTopupCheckoutReference(client, offer) {
  return `bbx-topup-${client.id}-${offer.key}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`.slice(
    0,
    90,
  );
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

async function maybeSendTopupRecap(client, applied) {
  if (!applied || !client?.email) {
    return;
  }

  try {
    await sendClientFormulaRecap(client);
  } catch (error) {
    console.error("[TOPUP] recap client:", error);
  }
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
    clientCleanlinessEstimate: appointment.client_cleanliness_estimate || null,
    adminCleanlinessEstimate: appointment.admin_cleanliness_estimate || null,
    requestedCredits: appointment.requested_credits ?? 1,
    approvedCredits: appointment.approved_credits ?? null,
    creditsCharged: appointment.credits_charged ?? 0,
    priceStatus: appointment.price_status || "pending_admin",
    photosRequestedAt: appointment.photos_requested_at ?? null,
    photosRequestMessage: appointment.photos_request_message || null,
    priceComment: appointment.price_comment || null,
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

router.post("/signup/request-code", async (req, res) => {
  const body = req.body || {};
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: "invalid_email" });
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
  } catch (_error) {
    // best-effort
  }
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }

  const monthParam = parseMonthParam(req.query.m);
  const month = buildMonthPayload(client, monthParam);
  const vehicles = listVehiclesByClient(client.id).map(mapVehicleRow);
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
    topupOffers: listPublicTopupOffersForClient(client),
    paymentsReady: isSumupTopupReady(),
    pendingCases: client.is_founder ? listPendingCaseOpenings(client.id) : [],
    event: eventPayload,
    founderCap: FOUNDER_CAP,
    foundersRemaining: Math.max(0, FOUNDER_CAP - foundersCount),
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

  return res.json({
    ok: true,
    paymentsReady: sumupConfigured(),
    forfaits: listPartnerForfaits(),
    orders: listPartnerOrders({ partnerClientId: client.id, limit: 100 }),
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

router.post("/:idOrSlug/topup/checkout", async (req, res) => {
  const client = getClientBySlugOrCardCode(req.params.idOrSlug);
  if (!ensurePortalEligible(client, res)) {
    return;
  }

  if (!isSumupTopupReady()) {
    return res.status(503).json({ ok: false, error: "sumup_not_ready" });
  }

  const requestedQuantity = Number(req.body?.quantity || 1);
  const offer =
    req.body?.unitPurchase === true || requestedQuantity > 1
      ? getUnitTopupOfferForClient(client, requestedQuantity)
      : getTopupOfferForClient(client, req.body?.offerKey);
  if (!offer) {
    return res.status(400).json({ ok: false, error: "invalid_topup_offer" });
  }

  const baseUrl = publicBaseUrl(req);
  const checkoutReference = buildTopupCheckoutReference(client, offer);
  const redirectUrl = `${baseUrl}/card/${encodeURIComponent(
    client.slug || client.card_code || req.params.idOrSlug,
  )}?view=shop&topupRef=${encodeURIComponent(checkoutReference)}`;
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
      description: `${offer.label} - ${client.full_name || client.card_code || client.slug}`,
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
    console.error("[SUMUP] create checkout:", error);
    return res.status(502).json({ ok: false, error: "sumup_checkout_failed" });
  }
});

// Acces fondateur: paiement SumUp unique (29,99 EUR, places limitees a 50).
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
    priceCents: 2999,
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
        await maybeSendTopupRecap(result?.client, result?.applied);
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

    if (!result.ok && result.error === "not_enough_credits") {
      return res.status(402).json({
        ok: false,
        error: "not_enough_credits",
        appointment: mapClientAppointment(updated),
        client: mapClientPayload(getClientById(client.id)),
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
  const vehicleId = Number(req.body?.vehicleId || 0) || null;
  const normalizedClientNote =
    typeof clientNote === "string" && clientNote.trim() !== "" ? clientNote.trim() : null;
  const uploadedImages = Array.isArray(req.files) ? req.files : [];

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
        serviceLevel,
      });

      if (!changed) {
        return res.status(400).json({
          ok: false,
          error: "cannot_update_appointment",
        });
      }

      const appointmentId = existing?.id || null;
      const clientImageCount = attachClientBookingImages(appointmentId, uploadedImages);

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
          clientImageCount,
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
    const isPro = (client.client_type || "bbx") === "pro";

    try {
      appointmentId = createRequestedAppointmentForSlot({
        clientId: client.id,
        vehicleId: vehicle?.id || null,
        dateStr: date,
        slot,
        time: normalizedTime,
        clientNote: normalizedClientNote,
        location: loc,
        serviceLevel,
        status: isPro ? "confirmed" : "requested",
        priceStatus: isPro ? "not_required" : "pending_admin",
        approvedCredits: isPro ? 0 : null,
        creditsCharged: 0,
      });
    } catch (error) {
      console.error("[BOOK] createRequestedAppointmentForSlot:", error);

      if (error && error.code === "SQLITE_CONSTRAINT") {
        return res.status(409).json({ ok: false, error: "slot_taken" });
      }

      return res.status(500).json({ ok: false, error: "db_error" });
    }

    const clientImageCount = attachClientBookingImages(appointmentId, uploadedImages);

    // Rattache au nouveau RDV les lots gagnes en attente de remise.
    attachPendingGoodieWinsToNextAppointment(client.id);

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
        clientImageCount,
        appointmentId,
      });
    } catch (error) {
      console.error("[MAIL] notif book:", error);
    }

    if (isPro) {
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

  const isFounder = !!client.is_founder;
  const dayStart = new Date(`${appointment.date}T00:00:00`);
  const limit = new Date(dayStart.getTime() - 24 * 60 * 60 * 1000);
  if (!isFounder && Date.now() >= limit.getTime()) {
    return res.status(400).json({ ok: false, error: "too_late_to_cancel" });
  }
  if (isFounder && slotHasPassed(appointment.date, slot)) {
    return res.status(400).json({ ok: false, error: "slot_already_passed" });
  }

  cancelAppointmentAndRefund(appointment.id);

  // Le RDV annule peut avoir porte des lots a remettre: on les rebascule
  // sur le prochain RDV a venir (ou on les detache si plus aucun).
  attachPendingGoodieWinsToNextAppointment(client.id);

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
