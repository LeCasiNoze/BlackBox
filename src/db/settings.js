const { db, nowUnix } = require("./index");

function getSetting(key) {
  const row = db.prepare(`SELECT value FROM app_settings WHERE key = ? LIMIT 1`).get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  db.prepare(
    `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run(key, value == null ? null : String(value), nowUnix());
}

const COMPANY_KEY = "company_info";
// Champs de la societe utilises sur les factures.
const COMPANY_FIELDS = [
  "name",
  "legalForm",
  "address",
  "city",
  "siret",
  "vatNote",
  "email",
  "phone",
];

function getCompanyInfo() {
  const raw = getSetting(COMPANY_KEY);
  let parsed = {};
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch (_error) {
      parsed = {};
    }
  }
  const out = {};
  for (const field of COMPANY_FIELDS) {
    out[field] = typeof parsed[field] === "string" ? parsed[field] : "";
  }
  return out;
}

function setCompanyInfo(input = {}) {
  const next = getCompanyInfo();
  for (const field of COMPANY_FIELDS) {
    if (typeof input[field] === "string") {
      next[field] = input[field].trim();
    }
  }
  setSetting(COMPANY_KEY, JSON.stringify(next));
  return next;
}

module.exports = {
  COMPANY_FIELDS,
  getCompanyInfo,
  getSetting,
  setCompanyInfo,
  setSetting,
};
