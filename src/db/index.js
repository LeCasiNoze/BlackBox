const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");
const { DB_FILE, ensureDir } = require("../config/storage");

const DB_PATH = DB_FILE;
const DB_DIR = path.dirname(DB_PATH);
ensureDir(DB_DIR);

const db = new Database(DB_PATH);

const schemaPath = path.join(__dirname, "schema.sql");
const schemaSql = fs.readFileSync(schemaPath, "utf8");

function applySchema() {
  try {
    db.exec(schemaSql);
  } catch (error) {
    console.warn("[DB] Schema applique partiellement, migration requise:", error.message);
  }
}

applySchema();

console.log("[DB] SQLite initialisee:", DB_PATH);

function nowUnix() {
  return Math.floor(Date.now() / 1000);
}

function getAppointmentsColumns() {
  return db.prepare(`PRAGMA table_info('appointments')`).all();
}

function ensureAppointmentsTimeColumn() {
  const cols = getAppointmentsColumns();
  if (cols.length === 0) return;

  const hasTime = cols.some((column) => column.name === "time");
  if (!hasTime) {
    db.exec(`ALTER TABLE appointments ADD COLUMN time TEXT;`);
    console.log("[DB] Colonne appointments.time ajoutee");
  }
}

function ensureAppointmentsExtraColumns() {
  try {
    const cols = getAppointmentsColumns();
    const colNames = cols.map((column) => column.name);

    const addColumnIfMissing = (name, ddl) => {
      if (!colNames.includes(name)) {
        console.log(`[DB] Ajout de la colonne appointments.${name}`);
        db.exec(`ALTER TABLE appointments ADD COLUMN ${ddl};`);
      }
    };

    addColumnIfMissing("admin_note", "admin_note TEXT");
    addColumnIfMissing("user_rating", "user_rating INTEGER");
    addColumnIfMissing("user_review", "user_review TEXT");
    addColumnIfMissing(
      "location",
      "location TEXT CHECK(location IN ('atelier','domicile')) DEFAULT 'atelier'"
    );
  } catch (error) {
    console.error("[DB] Erreur ensureAppointmentsExtraColumns:", error);
  }
}

function ensureAppointmentsSlotModel() {
  try {
    const table = db
      .prepare(
        `
        SELECT sql
        FROM sqlite_master
        WHERE type = 'table' AND name = 'appointments'
      `
      )
      .get();

    const createSql = table?.sql || "";
    const cols = getAppointmentsColumns();
    const colNames = cols.map((column) => column.name);
    const hasSlot = colNames.includes("slot");
    const usesLegacyUniqueDate = /UNIQUE\s*\(\s*date\s*\)/i.test(createSql);

    if (hasSlot && !usesLegacyUniqueDate) {
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_appointments_client_date_slot
          ON appointments(client_id, date, slot);

        CREATE INDEX IF NOT EXISTS idx_appointments_date_slot
          ON appointments(date, slot);

        CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_active_slot
          ON appointments(date, slot)
          WHERE status IN ('requested', 'confirmed', 'done');
      `);
      return;
    }

    console.log("[DB] Migration appointments -> slots matin/apres-midi");

    db.exec("PRAGMA foreign_keys = OFF");
    db.exec("BEGIN");

    try {
      db.exec(`
        DROP TABLE IF EXISTS appointments_new;

        CREATE TABLE appointments_new (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id   INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          date        TEXT NOT NULL,
          slot        TEXT NOT NULL DEFAULT 'morning'
                      CHECK (slot IN ('morning', 'afternoon')),
          time        TEXT,
          status      TEXT NOT NULL DEFAULT 'requested'
                      CHECK (status IN ('requested', 'confirmed', 'done', 'cancelled')),
          client_note TEXT,
          admin_note  TEXT,
          user_rating INTEGER,
          user_review TEXT,
          location    TEXT
                      CHECK(location IN ('atelier', 'domicile')) DEFAULT 'atelier',
          created_at  INTEGER NOT NULL,
          updated_at  INTEGER NOT NULL
        );
      `);

      db.exec(`
        INSERT INTO appointments_new (
          id,
          client_id,
          date,
          slot,
          time,
          status,
          client_note,
          admin_note,
          user_rating,
          user_review,
          location,
          created_at,
          updated_at
        )
        SELECT
          id,
          client_id,
          date,
          CASE
            WHEN CAST(substr(COALESCE(time, '09:00'), 1, 2) AS INTEGER) >= 14
              THEN 'afternoon'
            ELSE 'morning'
          END AS slot,
          time,
          status,
          client_note,
          admin_note,
          user_rating,
          user_review,
          location,
          created_at,
          updated_at
        FROM appointments;
      `);

      db.exec(`
        DROP TABLE appointments;
        ALTER TABLE appointments_new RENAME TO appointments;

        CREATE INDEX idx_appointments_client_date_slot
          ON appointments(client_id, date, slot);

        CREATE INDEX idx_appointments_date_slot
          ON appointments(date, slot);

        CREATE UNIQUE INDEX idx_appointments_active_slot
          ON appointments(date, slot)
          WHERE status IN ('requested', 'confirmed', 'done');
      `);

      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    } finally {
      db.exec("PRAGMA foreign_keys = ON");
    }
  } catch (error) {
    console.error("[DB] Erreur ensureAppointmentsSlotModel:", error);
  }
}

ensureAppointmentsTimeColumn();
ensureAppointmentsExtraColumns();
ensureAppointmentsSlotModel();
applySchema();

module.exports = {
  db,
  nowUnix,
};
