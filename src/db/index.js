// src/db/index.js
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

// Dossier où sera stocké le fichier .db
const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DB_PATH = path.join(DATA_DIR, "blackbox.db");

// On s'assure que le dossier data/ existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// On ouvre / crée la base
const db = new Database(DB_PATH);

// On charge le schéma SQL
const schemaPath = path.join(__dirname, "schema.sql");
const schemaSql = fs.readFileSync(schemaPath, "utf8");

// On applique le schéma (CREATE TABLE IF NOT EXISTS ...)
db.exec(schemaSql);

console.log("[DB] SQLite initialisée :", DB_PATH);

// Petit helper pratique pour avoir un timestamp (en secondes)
function nowUnix() {
  return Math.floor(Date.now() / 1000);
}

// ───────────────────────────────────────────
// Migration simple : s'assure que "time" existe
// ───────────────────────────────────────────

function ensureAppointmentsTimeColumn() {
  // Si la table n'existe pas encore, on la crée avec "time" directement
  db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      date TEXT NOT NULL UNIQUE,
      time TEXT,
      status TEXT NOT NULL,
      client_note TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // On vérifie si la colonne "time" existe déjà
  const cols = db.prepare(`PRAGMA table_info(appointments)`).all();
  const hasTime = cols.some((c) => c.name === "time");

  // Si elle n'existe pas → ALTER TABLE
  if (!hasTime) {
    db.exec(`ALTER TABLE appointments ADD COLUMN time TEXT;`);
    console.log("[DB] Colonne appointments.time ajoutée");
  }
}

// Appel au démarrage
ensureAppointmentsTimeColumn();

module.exports = {
  db,
  nowUnix,
};
