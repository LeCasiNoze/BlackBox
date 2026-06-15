// Forfaits esthetiques proposes par les agences partenaires
// (ex: Agence Automobiliere Louhans x Bryan Cars).
//
// Tarifs fixes, sans lien avec les credits/formules ni les BC'Coins: ce sont
// des prestations ponctuelles payees a l'unite par le client final via un lien
// SumUp genere par l'agence (compte pro).
const DEFAULT_CURRENCY = "EUR";

const PARTNER_FORFAITS = [
  {
    key: "bc-essential",
    label: "BC Essential",
    priceCents: 5900,
    tagline: "Entretien exterieur",
    features: [
      "Lavage exterieur",
      "Jantes et pneus",
      "Depoussierage rapide",
      "Finition soignee",
    ],
  },
  {
    key: "bc-express",
    label: "BC Express",
    priceCents: 9900,
    tagline: "Interieur & exterieur",
    features: [
      "Interieur et exterieur complet",
      "Aspiration habitacle",
      "Vitres et plastiques",
      "Finition soignee",
    ],
  },
  {
    key: "bc-signature",
    label: "BC Signature",
    priceCents: 34900,
    tagline: "Preparation esthetique avancee",
    features: [
      "Interieur approfondi",
      "Decontamination carrosserie",
      "Lustrage de finition",
      "Valorisation avant vente",
    ],
  },
  {
    key: "bc-black",
    label: "BC Black",
    priceCents: 44900,
    tagline: "Preparation premium",
    features: [
      "Traitement approfondi",
      "Vehicules tres encrasses",
      "Decontamination complete",
      "Lustrage renforce",
      "Finition haut de gamme",
    ],
  },
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
  const found = PARTNER_FORFAITS.find((forfait) => forfait.key === normalized);
  return found ? withCurrency(found) : null;
}

module.exports = {
  DEFAULT_CURRENCY,
  getPartnerForfait,
  listPartnerForfaits,
};
