// Economie BC'Coins (fondateurs uniquement).
// Achat (paiement SumUp): +80 BC/credit immediat, +20 BC/credit differe (debloque
// a la consommation), et 1 ouverture de "case" (style CS:GO) par achat dont les
// lots scalent lineairement avec le nombre de credits (fractionnement neutre).

const IMMEDIATE_BC_PER_CREDIT = 80;
const DEFERRED_BC_PER_CREDIT = 20;

// Lots de la case, valeur de base pour 1 credit (multipliee par le nb de credits).
const CASE_TIERS = [
  { key: "commun", label: "Commun", proba: 0.6, bcPerCredit: 20 },
  { key: "peu_commun", label: "Peu commun", proba: 0.25, bcPerCredit: 50 },
  { key: "rare", label: "Rare", proba: 0.1, bcPerCredit: 120 },
  { key: "epique", label: "Epique", proba: 0.04, bcPerCredit: 350 },
  { key: "legendaire", label: "Legendaire", proba: 0.01, bcPerCredit: 1000 },
];

function normalizeCredits(credits) {
  const value = Math.floor(Number(credits) || 0);
  return value > 0 ? value : 1;
}

// Tirage pondere d'un lot pour un nombre de credits donne.
function rollCaseReward(credits) {
  const n = normalizeCredits(credits);
  const roll = Math.random();
  let cumulative = 0;
  for (const tier of CASE_TIERS) {
    cumulative += tier.proba;
    if (roll < cumulative) {
      return { tier: tier.key, label: tier.label, bc: tier.bcPerCredit * n };
    }
  }
  const last = CASE_TIERS[CASE_TIERS.length - 1];
  return { tier: last.key, label: last.label, bc: last.bcPerCredit * n };
}

// Exposition des lots pour l'animation (valeurs pour N credits).
function caseTiersForCredits(credits) {
  const n = normalizeCredits(credits);
  return CASE_TIERS.map((tier) => ({
    key: tier.key,
    label: tier.label,
    proba: tier.proba,
    bc: tier.bcPerCredit * n,
  }));
}

function immediateBcForCredits(credits) {
  return IMMEDIATE_BC_PER_CREDIT * normalizeCredits(credits);
}

function deferredBcForCredits(credits) {
  return DEFERRED_BC_PER_CREDIT * normalizeCredits(credits);
}

module.exports = {
  IMMEDIATE_BC_PER_CREDIT,
  DEFERRED_BC_PER_CREDIT,
  CASE_TIERS,
  rollCaseReward,
  caseTiersForCredits,
  immediateBcForCredits,
  deferredBcForCredits,
};
