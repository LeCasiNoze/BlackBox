// Forfaits esthetiques proposes par les agences partenaires
// (ex: Agence Automobiliere Louhans x Bryan Cars).
//
// Tarifs fixes, sans lien avec les credits/formules ni les BC'Coins: ce sont
// des prestations ponctuelles payees a l'unite par le client final via un lien
// SumUp genere par l'agence (compte pro).
const DEFAULT_CURRENCY = "EUR";

const PARTNER_FORFAITS = [
  {
    key: "photo-express",
    label: "Photo Express",
    priceCents: 5900,
    tagline: "Mise au propre rapide pour shooting et annonce",
    features: [
      "Lavage exterieur",
      "Aspiration rapide",
      "Depoussierage interieur",
    ],
  },
  {
    key: "preparation-vente",
    label: "Preparation Vente",
    priceCents: 9900,
    tagline: "Nettoyage interieur et exterieur de presentation",
    features: [
      "Nettoyage interieur & exterieur",
      "Plastiques",
      "Vitres",
      "Jantes & pneus",
      "Finitions",
    ],
  },
  {
    key: "nettoyage-approfondi",
    label: "Nettoyage Approfondi",
    priceCents: 19900,
    tagline: "Travail plus pousse interieur et exterieur",
    features: [
      "Interieur approfondi",
      "Exterieur soigne",
      "Jantes & pneus",
      "Decontamination adaptee",
      "Finitions",
    ],
  },
  {
    key: "renovation-carrosserie",
    label: "Renovation Carrosserie",
    priceCents: 34900,
    startingAt: true,
    tagline: "Decontamination, polissage et correction legere",
    features: [
      "Decontamination carrosserie",
      "Polissage",
      "Attenuation des defauts legers",
      "Protection",
    ],
  },
  {
    key: "prestige-complet",
    label: "Prestige Complet",
    priceCents: 59900,
    startingAt: true,
    tagline: "La preparation totale pour sublimer votre vehicule",
    features: [
      "Interieur approfondi",
      "Exterieur complet",
      "Decontamination carrosserie",
      "Polissage",
      "Protection",
      "Finitions detaillees",
    ],
  },
];

// Les commandes deja envoyees conservent leur libelle et leur montant en base.
// Ces definitions servent seulement a remettre leurs anciennes prestations en
// contexte lorsqu'un client rouvre un lien historique.
const LEGACY_PARTNER_FORFAITS = [
  { key: "bc-essential", label: "BC Essential", priceCents: 5900, tagline: "Entretien exterieur", features: [] },
  { key: "bc-express", label: "BC Express", priceCents: 9900, tagline: "Interieur & exterieur", features: [] },
  { key: "bc-signature", label: "BC Signature", priceCents: 34900, tagline: "Preparation esthetique avancee", features: [] },
  { key: "bc-black", label: "BC Black", priceCents: 44900, tagline: "Preparation premium", features: [] },
];

function withCurrency(forfait) {
  return { ...forfait, currency: DEFAULT_CURRENCY };
}

function listPartnerForfaits() {
  return PARTNER_FORFAITS.map(withCurrency);
}

function getPartnerForfait(key) {
  if (!key) return null;
  const normalized = String(key).trim();
  const found = [...PARTNER_FORFAITS, ...LEGACY_PARTNER_FORFAITS].find(
    (forfait) => forfait.key === normalized,
  );
  return found ? withCurrency(found) : null;
}

module.exports = {
  DEFAULT_CURRENCY,
  getPartnerForfait,
  listPartnerForfaits,
};
