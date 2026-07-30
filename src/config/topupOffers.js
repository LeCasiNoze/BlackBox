const DEFAULT_CURRENCY = "EUR";

const DEFAULT_TOPUP_OFFERS = [
  {
    key: "credit-1",
    label: "1 crédit",
    description: "Pour un passage ponctuel",
    credits: 1,
    priceCents: 5000, // 50,00 €
    currency: "EUR",
    applyMode: "add",
    founderOnly: false,
    clientTypes: ["bbx", "pro", "data"],
  },
  {
    key: "credit-2",
    label: "Pack 2 crédits",
    description: "2 passages véhicule",
    credits: 2,
    priceCents: 10000, // 100,00 €
    currency: "EUR",
    applyMode: "add",
    founderOnly: false,
    clientTypes: ["bbx", "pro", "data"],
  },
  {
    key: "credit-6",
    label: "Pack 6 crédits",
    description: "Formule intermédiaire",
    credits: 6,
    priceCents: 30000, // 300,00 €
    currency: "EUR",
    applyMode: "add",
    founderOnly: false,
    clientTypes: ["bbx", "pro", "data"],
  },
  {
    key: "credit-10",
    label: "Pack 10 crédits",
    description: "La tranquillité pour l'année",
    credits: 10,
    priceCents: 50000, // 500,00 €
    currency: "EUR",
    applyMode: "add",
    founderOnly: false,
    clientTypes: ["bbx", "pro", "data"],
  },
  {
    key: "credit-20",
    label: "Pack 20 crédits",
    description: "Pack Premium complet",
    credits: 20,
    priceCents: 100000, // 1000,00 €
    currency: "EUR",
    applyMode: "add",
    founderOnly: false,
    clientTypes: ["bbx", "pro", "data"],
  },

  // ── OFFRES MEMBRE FONDATEUR (-20% : 40€ / crédit) ──
  {
    key: "founder-credit-1",
    label: "1 crédit Fondateur",
    description: "Tarif membre fondateur (-20%)",
    credits: 1,
    priceCents: 4000, // 40,00 €
    currency: "EUR",
    applyMode: "add",
    founderOnly: true,
    clientTypes: ["bbx"],
  },
  {
    key: "founder-credit-2",
    label: "Pack 2 crédits Fondateur",
    description: "Tarif membre fondateur (-20%)",
    credits: 2,
    priceCents: 8000, // 80,00 €
    currency: "EUR",
    applyMode: "add",
    founderOnly: true,
    clientTypes: ["bbx"],
  },
  {
    key: "founder-credit-6",
    label: "Pack 6 crédits Fondateur",
    description: "Tarif membre fondateur (-20%)",
    credits: 6,
    priceCents: 24000, // 240,00 €
    currency: "EUR",
    applyMode: "add",
    founderOnly: true,
    clientTypes: ["bbx"],
  },
  {
    key: "founder-credit-10",
    label: "Pack 10 crédits Fondateur",
    description: "Tarif membre fondateur (-20%)",
    credits: 10,
    priceCents: 40000, // 400,00 €
    currency: "EUR",
    applyMode: "add",
    founderOnly: true,
    clientTypes: ["bbx"],
  },
  {
    key: "founder-credit-20",
    label: "Pack 20 crédits Fondateur",
    description: "Tarif membre fondateur (-20%)",
    credits: 20,
    priceCents: 80000, // 800,00 €
    currency: "EUR",
    applyMode: "add",
    founderOnly: true,
    clientTypes: ["bbx"],
  },
];

function positiveInteger(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return fallback;
  }
  return Math.floor(numeric);
}

function normalizeOffer(rawOffer, index) {
  if (!rawOffer || typeof rawOffer !== "object") {
    return null;
  }

  const key =
    typeof rawOffer.key === "string" && rawOffer.key.trim() !== ""
      ? rawOffer.key.trim()
      : `offer-${index + 1}`;
  const label =
    typeof rawOffer.label === "string" && rawOffer.label.trim() !== ""
      ? rawOffer.label.trim()
      : null;
  const credits = positiveInteger(rawOffer.credits, 0);

  if (!label || credits <= 0) {
    return null;
  }

  const founderOnly = rawOffer.founderOnly === true;
  // Ajustement automatique à 50€/crédit (ou 40€ pour fondateur)
  const unitRateCents = founderOnly ? 4000 : 5000;
  const priceCents = credits * unitRateCents;

  const currency =
    typeof rawOffer.currency === "string" && rawOffer.currency.trim() !== ""
      ? rawOffer.currency.trim().toUpperCase()
      : DEFAULT_CURRENCY;
  const applyMode = rawOffer.applyMode === "replace" ? "replace" : "add";
  const durationDays = positiveInteger(rawOffer.durationDays, 0) || null;
  const formulaName =
    typeof rawOffer.formulaName === "string" && rawOffer.formulaName.trim() !== ""
      ? rawOffer.formulaName.trim()
      : null;
  const description =
    typeof rawOffer.description === "string" && rawOffer.description.trim() !== ""
      ? rawOffer.description.trim()
      : null;
  const clientTypes = Array.isArray(rawOffer.clientTypes)
    ? rawOffer.clientTypes
        .map((value) => (typeof value === "string" ? value.trim().toLowerCase() : ""))
        .filter((value) => value === "bbx" || value === "data" || value === "pro")
    : ["bbx"];

  return {
    key,
    label,
    description,
    credits,
    priceCents,
    currency,
    applyMode,
    durationDays,
    formulaName,
    founderOnly,
    clientTypes: clientTypes.length > 0 ? clientTypes : ["bbx"],
  };
}

let cachedSource = null;
let cachedOffers = [];

function loadConfiguredTopupOffers() {
  const source = process.env.SUMUP_TOPUP_OFFERS || "";
  if (source === cachedSource && cachedOffers.length > 0) {
    return cachedOffers;
  }

  cachedSource = source;

  if (!source.trim()) {
    cachedOffers = DEFAULT_TOPUP_OFFERS;
    return cachedOffers;
  }

  try {
    const parsed = JSON.parse(source);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      cachedOffers = DEFAULT_TOPUP_OFFERS;
      return cachedOffers;
    }

    const seenKeys = new Set();
    const loaded = parsed
      .map((offer, index) => normalizeOffer(offer, index))
      .filter(Boolean)
      .filter((offer) => {
        if (seenKeys.has(offer.key)) {
          return false;
        }
        seenKeys.add(offer.key);
        return true;
      });

    cachedOffers = loaded.length > 0 ? loaded : DEFAULT_TOPUP_OFFERS;
    return cachedOffers;
  } catch (error) {
    console.error("[TOPUP] Impossible de parser SUMUP_TOPUP_OFFERS:", error.message);
    cachedOffers = DEFAULT_TOPUP_OFFERS;
    return cachedOffers;
  }
}

function listTopupOffersForClient(client) {
  const offers = loadConfiguredTopupOffers();
  if (!client) {
    return [];
  }

  const clientType = (client.client_type || client.clientType || "bbx").toLowerCase();
  const isFounder = !!(client.is_founder || client.isFounder);

  // Si le client n'est pas fondateur, on ne lui montre que les offres standards
  // Si le client est fondateur, on lui montre ses offres réservées à 40€/crédit
  return offers.filter((offer) => {
    if (!offer.clientTypes.includes(clientType)) {
      return false;
    }
    if (isFounder) {
      return offer.founderOnly === true;
    }
    return offer.founderOnly === false;
  });
}

function getTopupOfferForClient(client, offerKey) {
  if (!offerKey) return null;
  return (
    listTopupOffersForClient(client).find((offer) => offer.key === String(offerKey).trim()) || null
  );
}

const MAX_UNIT_TOPUP_QUANTITY = 99;

function getUnitTopupOfferForClient(client, quantity = 1) {
  const qty = Math.max(1, Math.min(MAX_UNIT_TOPUP_QUANTITY, Math.floor(Number(quantity) || 1)));
  const isFounder = !!(client?.is_founder || client?.isFounder);
  const unitRateCents = isFounder ? 4000 : 5000;

  return {
    key: `unit-x${qty}`,
    label: qty === 1 ? "1 crédit" : `${qty} crédits à l'unité`,
    description: `Achat de ${qty} crédit${qty > 1 ? "s" : ""} (${isFounder ? "40" : "50"} € / crédit).`,
    credits: qty,
    priceCents: unitRateCents * qty,
    currency: "EUR",
    applyMode: "add",
    durationDays: null,
  };
}

function listPublicTopupOffersForClient(client) {
  return listTopupOffersForClient(client).map((offer) => ({
    key: offer.key,
    label: offer.label,
    description: offer.description,
    credits: offer.credits,
    priceCents: offer.priceCents,
    currency: offer.currency,
    applyMode: offer.applyMode,
    durationDays: offer.durationDays,
  }));
}

function isSumupTopupReady() {
  return Boolean(
    process.env.SUMUP_API_KEY &&
      process.env.SUMUP_MERCHANT_CODE,
  );
}

module.exports = {
  getTopupOfferForClient,
  getUnitTopupOfferForClient,
  isSumupTopupReady,
  listPublicTopupOffersForClient,
  listTopupOffersForClient,
  loadConfiguredTopupOffers,
};
