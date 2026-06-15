// Box de consolation des evenements: que des goodies (pour fondateurs ET
// non-fondateurs), avec le "Pack des 3" en lot rare. A honorer au prochain RDV.
const CONSOLATION_GOODIES = [
  { key: "desodorisant", label: "Desodorisant offert", proba: 0.45, kind: "goodie" },
  { key: "microfibre", label: "Microfibre premium", proba: 0.4, kind: "goodie" },
  { key: "tapis", label: "Tapis de voiture", proba: 0.1, kind: "goodie" },
  { key: "pack3", label: "Pack des 3 (desodo + microfibre + tapis)", proba: 0.05, kind: "goodie" },
];

function rollConsolationGoodie() {
  let rand = Math.random();
  for (const goodie of CONSOLATION_GOODIES) {
    if (rand < goodie.proba) return goodie;
    rand -= goodie.proba;
  }
  return CONSOLATION_GOODIES[0];
}

function getConsolationGoodie(key) {
  return CONSOLATION_GOODIES.find((goodie) => goodie.key === key) || null;
}

module.exports = { CONSOLATION_GOODIES, rollConsolationGoodie, getConsolationGoodie };
