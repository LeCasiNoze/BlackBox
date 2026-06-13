const DEFAULT_CURRENCY = "EUR";

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
  const priceCents = positiveInteger(rawOffer.priceCents, 0);

  if (!label || credits <= 0 || priceCents <= 0) {
    return null;
  }

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
  const founderOnly = rawOffer.founderOnly === true;
  const clientTypes = Array.isArray(rawOffer.clientTypes)
    ? rawOffer.clientTypes
        .map((value) => (typeof value === "string" ? value.trim().toLowerCase() : ""))
        .filter((value) => value === "bbx" || value === "data")
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
  if (source === cachedSource) {
    return cachedOffers;
  }

  cachedSource = source;

  if (!source.trim()) {
    cachedOffers = [];
    return cachedOffers;
  }

  try {
    const parsed = JSON.parse(source);
    if (!Array.isArray(parsed)) {
      console.warn("[TOPUP] SUMUP_TOPUP_OFFERS doit etre un tableau JSON.");
      cachedOffers = [];
      return cachedOffers;
    }

    const seenKeys = new Set();
    cachedOffers = parsed
      .map((offer, index) => normalizeOffer(offer, index))
      .filter(Boolean)
      .filter((offer) => {
        if (seenKeys.has(offer.key)) {
          console.warn(`[TOPUP] Offre ignoree, cle dupliquee: ${offer.key}`);
          return false;
        }
        seenKeys.add(offer.key);
        return true;
      });
    return cachedOffers;
  } catch (error) {
    console.error("[TOPUP] Impossible de parser SUMUP_TOPUP_OFFERS:", error.message);
    cachedOffers = [];
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

  return offers.filter((offer) => {
    if (!offer.clientTypes.includes(clientType)) {
      return false;
    }
    if (offer.founderOnly && !isFounder) {
      return false;
    }
    return true;
  });
}

function getTopupOfferForClient(client, offerKey) {
  if (!offerKey) return null;
  return (
    listTopupOffersForClient(client).find((offer) => offer.key === String(offerKey).trim()) || null
  );
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
      process.env.SUMUP_MERCHANT_CODE &&
      loadConfiguredTopupOffers().length > 0,
  );
}

module.exports = {
  getTopupOfferForClient,
  isSumupTopupReady,
  listPublicTopupOffersForClient,
  listTopupOffersForClient,
  loadConfiguredTopupOffers,
};
