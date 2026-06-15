// Box "avis Google" : 1 ouverture par compte (BBX, Pro et Fondateur).
// Lots majoritairement physiques (a remettre au prochain passage), plus deux
// lots in-app (credit auto, mois fondateur a honorer). Probas = 100%.
const REVIEW_BOX_GOODIES = [
  { key: "desodorisant", label: "Desodorisant offert", proba: 0.5, kind: "goodie" },
  { key: "microfibre", label: "Microfibre premium", proba: 0.4, kind: "goodie" },
  { key: "tapis", label: "Tapis de voiture", proba: 0.07, kind: "goodie" },
  { key: "founder_1m", label: "1 mois Fondateur offert", proba: 0.02, kind: "founder_month" },
  { key: "credit_1", label: "1 credit offert", proba: 0.01, kind: "credit" },
];

function rollReviewBoxGoodie() {
  let rand = Math.random();
  for (const goodie of REVIEW_BOX_GOODIES) {
    if (rand < goodie.proba) return goodie;
    rand -= goodie.proba;
  }
  return REVIEW_BOX_GOODIES[0];
}

function getReviewBoxGoodie(key) {
  return REVIEW_BOX_GOODIES.find((goodie) => goodie.key === key) || null;
}

module.exports = { REVIEW_BOX_GOODIES, rollReviewBoxGoodie, getReviewBoxGoodie };
