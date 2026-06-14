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

console.log("[DB] SQLite initialisee:", DB_PATH);

function nowUnix() {
  return Math.floor(Date.now() / 1000);
}

function getTableColumns(tableName) {
  return db.prepare(`PRAGMA table_info('${tableName}')`).all();
}

function getAppointmentsColumns() {
  return getTableColumns("appointments");
}

function getAppointmentPhotosColumns() {
  return getTableColumns("appointment_photos");
}

function getClientsColumns() {
  return getTableColumns("clients");
}

function getVehiclesColumns() {
  return getTableColumns("vehicles");
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
    if (cols.length === 0) return;
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
      "cleanliness_rating",
      "cleanliness_rating TEXT CHECK (cleanliness_rating IN ('very_clean','correct','dirty','very_dirty','reset_recommended'))"
    );
    addColumnIfMissing(
      "cleanliness_penalty_applied",
      "cleanliness_penalty_applied INTEGER NOT NULL DEFAULT 0"
    );
    addColumnIfMissing(
      "client_cleanliness_estimate",
      "client_cleanliness_estimate TEXT CHECK (client_cleanliness_estimate IN ('clean','correct','dirty'))"
    );
    addColumnIfMissing(
      "admin_cleanliness_estimate",
      "admin_cleanliness_estimate TEXT CHECK (admin_cleanliness_estimate IN ('clean','correct','dirty'))"
    );
    addColumnIfMissing(
      "requested_credits",
      "requested_credits INTEGER NOT NULL DEFAULT 1"
    );
    addColumnIfMissing("approved_credits", "approved_credits INTEGER");
    addColumnIfMissing(
      "credits_charged",
      "credits_charged INTEGER NOT NULL DEFAULT 0"
    );
    addColumnIfMissing("credits_charged_at", "credits_charged_at INTEGER");
    addColumnIfMissing(
      "price_status",
      "price_status TEXT NOT NULL DEFAULT 'pending_admin' CHECK (price_status IN ('pending_admin','waiting_photos','waiting_client_approval','waiting_payment','approved','not_required','declined'))"
    );
    addColumnIfMissing("photos_requested_at", "photos_requested_at INTEGER");
    addColumnIfMissing("photos_request_message", "photos_request_message TEXT");
    addColumnIfMissing("price_comment", "price_comment TEXT");
    addColumnIfMissing("bc_points_granted", "bc_points_granted INTEGER NOT NULL DEFAULT 0");
    addColumnIfMissing("client_price_approved_at", "client_price_approved_at INTEGER");
    addColumnIfMissing(
      "bc_points_awarded",
      "bc_points_awarded INTEGER NOT NULL DEFAULT 0 CHECK (bc_points_awarded IN (0, 1))"
    );
    addColumnIfMissing("admin_reminder_24h_sent_at", "admin_reminder_24h_sent_at INTEGER");
    addColumnIfMissing("client_reminder_24h_sent_at", "client_reminder_24h_sent_at INTEGER");
    addColumnIfMissing(
      "is_public",
      "is_public INTEGER NOT NULL DEFAULT 0 CHECK (is_public IN (0, 1))"
    );
    addColumnIfMissing(
      "location",
      "location TEXT CHECK(location IN ('atelier','domicile')) DEFAULT 'atelier'"
    );
    addColumnIfMissing(
      "vehicle_id",
      "vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL"
    );
  } catch (error) {
    console.error("[DB] Erreur ensureAppointmentsExtraColumns:", error);
  }
}

function ensureAppointmentPhotosExtraColumns() {
  try {
    const cols = getAppointmentPhotosColumns();
    if (cols.length === 0) return;

    const colNames = cols.map((column) => column.name);

    if (!colNames.includes("is_public")) {
      console.log("[DB] Ajout de la colonne appointment_photos.is_public");
      db.exec(`
        ALTER TABLE appointment_photos
        ADD COLUMN is_public INTEGER NOT NULL DEFAULT 0
        CHECK (is_public IN (0, 1));
      `);
    }
  } catch (error) {
    console.error("[DB] Erreur ensureAppointmentPhotosExtraColumns:", error);
  }
}

function ensureClientsExtraColumns() {
  try {
    const cols = getClientsColumns();
    if (cols.length === 0) return;

    const colNames = cols.map((column) => column.name);

    const addColumnIfMissing = (name, ddl) => {
      if (!colNames.includes(name)) {
        console.log(`[DB] Ajout de la colonne clients.${name}`);
        db.exec(`ALTER TABLE clients ADD COLUMN ${ddl};`);
      }
    };

    addColumnIfMissing("formula_purchased_at", "formula_purchased_at INTEGER");
    addColumnIfMissing("formula_expires_at", "formula_expires_at INTEGER");
    addColumnIfMissing("terms_accepted_at", "terms_accepted_at INTEGER");
    addColumnIfMissing("formula_recap_sent_at", "formula_recap_sent_at INTEGER");
    addColumnIfMissing(
      "client_type",
      "client_type TEXT NOT NULL DEFAULT 'bbx' CHECK (client_type IN ('bbx', 'data', 'pro'))"
    );
    addColumnIfMissing(
      "is_founder",
      "is_founder INTEGER NOT NULL DEFAULT 0 CHECK (is_founder IN (0, 1))"
    );
    addColumnIfMissing("founder_media_url", "founder_media_url TEXT");
    addColumnIfMissing("welcome_email_sent_at", "welcome_email_sent_at INTEGER");
    addColumnIfMissing("bc_points", "bc_points INTEGER NOT NULL DEFAULT 0");
    addColumnIfMissing("bc_pending", "bc_pending INTEGER NOT NULL DEFAULT 0");
  } catch (error) {
    console.error("[DB] Erreur ensureClientsExtraColumns:", error);
  }
}

function ensureClientsTypeAllowsPro() {
  try {
    const table = db
      .prepare(
        `
        SELECT sql
        FROM sqlite_master
        WHERE type = 'table' AND name = 'clients'
      `
      )
      .get();

    const createSql = table?.sql || "";
    if (!createSql || createSql.includes("'pro'")) {
      return;
    }

    console.log("[DB] Migration clients.client_type -> bbx/data/pro");

    db.exec("PRAGMA foreign_keys = OFF");
    db.exec("BEGIN");

    try {
      db.exec(`
        DROP TABLE IF EXISTS clients_new;

        CREATE TABLE clients_new (
          id                INTEGER PRIMARY KEY AUTOINCREMENT,
          slug              TEXT NOT NULL UNIQUE,
          card_code         TEXT UNIQUE,
          first_name        TEXT,
          last_name         TEXT,
          full_name         TEXT,
          email             TEXT,
          phone             TEXT,
          company           TEXT,
          client_type       TEXT NOT NULL DEFAULT 'bbx'
                            CHECK (client_type IN ('bbx', 'data', 'pro')),
          is_founder        INTEGER NOT NULL DEFAULT 0
                            CHECK (is_founder IN (0, 1)),
          founder_media_url TEXT,
          address_line1     TEXT,
          address_line2     TEXT,
          postal_code       TEXT,
          city              TEXT,
          vehicle_model     TEXT,
          vehicle_plate     TEXT,
          formula_name      TEXT,
          formula_total     INTEGER NOT NULL DEFAULT 0,
          formula_remaining INTEGER NOT NULL DEFAULT 0,
          formula_purchased_at INTEGER,
          formula_expires_at INTEGER,
          terms_accepted_at INTEGER,
          formula_recap_sent_at INTEGER,
          welcome_email_sent_at INTEGER,
          bc_points         INTEGER NOT NULL DEFAULT 0,
          notes             TEXT,
          created_at        INTEGER NOT NULL,
          updated_at        INTEGER NOT NULL
        );

        INSERT INTO clients_new (
          id, slug, card_code, first_name, last_name, full_name, email, phone,
          company, client_type, is_founder, founder_media_url, address_line1,
          address_line2, postal_code, city, vehicle_model, vehicle_plate,
          formula_name, formula_total, formula_remaining, formula_purchased_at,
          formula_expires_at, terms_accepted_at, formula_recap_sent_at,
          welcome_email_sent_at, bc_points, notes, created_at, updated_at
        )
        SELECT
          id, slug, card_code, first_name, last_name, full_name, email, phone,
          company, client_type, is_founder, founder_media_url, address_line1,
          address_line2, postal_code, city, vehicle_model, vehicle_plate,
          formula_name, formula_total, formula_remaining, formula_purchased_at,
          formula_expires_at, terms_accepted_at, formula_recap_sent_at,
          welcome_email_sent_at, bc_points, notes, created_at, updated_at
        FROM clients;

        DROP TABLE clients;
        ALTER TABLE clients_new RENAME TO clients;

        CREATE INDEX IF NOT EXISTS idx_clients_card_code ON clients(card_code);
        CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(client_type);
      `);

      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    } finally {
      db.exec("PRAGMA foreign_keys = ON");
    }
  } catch (error) {
    console.error("[DB] Erreur ensureClientsTypeAllowsPro:", error);
  }
}

function ensureVehiclesFromClients() {
  try {
    const vehicleCols = getVehiclesColumns();
    if (vehicleCols.length === 0) return;

    const clients = db
      .prepare(
        `
        SELECT id, vehicle_model, vehicle_plate
        FROM clients
      `
      )
      .all();

    const countVehiclesForClient = db.prepare(
      `
      SELECT COUNT(*) AS count
      FROM vehicles
      WHERE client_id = ?
    `
    );

    const insertVehicle = db.prepare(
      `
      INSERT INTO vehicles (
        client_id,
        label,
        model,
        plate,
        is_primary,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, 1, ?, ?)
    `
    );

    const primaryVehicleForClient = db.prepare(
      `
      SELECT id
      FROM vehicles
      WHERE client_id = ?
      ORDER BY is_primary DESC, created_at ASC, id ASC
      LIMIT 1
    `
    );

    const updateAppointmentVehicle = db.prepare(
      `
      UPDATE appointments
      SET vehicle_id = ?
      WHERE id = ?
    `
    );

    const appointmentsMissingVehicle = db.prepare(
      `
      SELECT id, client_id
      FROM appointments
      WHERE vehicle_id IS NULL
    `
    ).all();

    const syncClientVehicleSnapshot = db.prepare(
      `
      UPDATE clients
      SET vehicle_model = ?,
          vehicle_plate = ?,
          updated_at = ?
      WHERE id = ?
    `
    );

    for (const client of clients) {
      const vehicleCount = countVehiclesForClient.get(client.id)?.count || 0;
      if (
        vehicleCount === 0 &&
        ((client.vehicle_model && client.vehicle_model.trim()) ||
          (client.vehicle_plate && client.vehicle_plate.trim()))
      ) {
        const label =
          client.vehicle_model && client.vehicle_plate
            ? `${client.vehicle_model} · ${client.vehicle_plate}`
            : client.vehicle_model || client.vehicle_plate || "Vehicule principal";
        insertVehicle.run(
          client.id,
          label,
          client.vehicle_model || null,
          client.vehicle_plate || null,
          nowUnix(),
          nowUnix()
        );
      }

      const primaryVehicle = primaryVehicleForClient.get(client.id);
      if (primaryVehicle) {
        const vehicle = db
          .prepare(
            `
            SELECT model, plate
            FROM vehicles
            WHERE id = ?
          `
          )
          .get(primaryVehicle.id);

        if (vehicle) {
          syncClientVehicleSnapshot.run(
            vehicle.model || null,
            vehicle.plate || null,
            nowUnix(),
            client.id
          );
        }
      }
    }

    for (const appointment of appointmentsMissingVehicle) {
      const primaryVehicle = primaryVehicleForClient.get(appointment.client_id);
      if (primaryVehicle?.id) {
        updateAppointmentVehicle.run(primaryVehicle.id, appointment.id);
      }
    }
  } catch (error) {
    console.error("[DB] Erreur ensureVehiclesFromClients:", error);
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
          cleanliness_rating TEXT
                      CHECK (cleanliness_rating IN ('very_clean', 'correct', 'dirty', 'very_dirty', 'reset_recommended')),
          cleanliness_penalty_applied INTEGER NOT NULL DEFAULT 0,
          admin_reminder_24h_sent_at INTEGER,
          client_reminder_24h_sent_at INTEGER,
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
          cleanliness_rating,
          cleanliness_penalty_applied,
          admin_reminder_24h_sent_at,
          client_reminder_24h_sent_at,
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
          cleanliness_rating,
          COALESCE(cleanliness_penalty_applied, 0),
          admin_reminder_24h_sent_at,
          client_reminder_24h_sent_at,
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

// Migre la table push_subscriptions (creee avec un role limite a 'admin') vers
// le support des notifications client: ajoute client_id et autorise role 'client'.
function ensurePushSubscriptionsSchema() {
  try {
    const info = db
      .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='push_subscriptions'")
      .get();
    if (!info) {
      return;
    }
    const needsMigration =
      !/client_id/.test(info.sql) || /IN\s*\(\s*'admin'\s*\)/.test(info.sql);
    if (!needsMigration) {
      return;
    }

    console.log("[DB] Migration push_subscriptions -> client + client_id");
    db.exec("PRAGMA foreign_keys = OFF");
    try {
      db.exec("ALTER TABLE push_subscriptions RENAME TO push_subscriptions_old");
      db.exec(`
        CREATE TABLE push_subscriptions (
          id                INTEGER PRIMARY KEY AUTOINCREMENT,
          role              TEXT NOT NULL DEFAULT 'admin'
                            CHECK (role IN ('admin', 'client')),
          client_id         INTEGER REFERENCES clients(id) ON DELETE CASCADE,
          endpoint          TEXT NOT NULL UNIQUE,
          p256dh            TEXT NOT NULL,
          auth              TEXT NOT NULL,
          user_agent        TEXT,
          created_at        INTEGER NOT NULL,
          updated_at        INTEGER NOT NULL
        )
      `);
      db.exec(`
        INSERT INTO push_subscriptions
          (id, role, client_id, endpoint, p256dh, auth, user_agent, created_at, updated_at)
        SELECT id, role, NULL, endpoint, p256dh, auth, user_agent, created_at, updated_at
        FROM push_subscriptions_old
      `);
      db.exec("DROP TABLE push_subscriptions_old");
      db.exec(
        "CREATE INDEX IF NOT EXISTS idx_push_subscriptions_role ON push_subscriptions(role, created_at DESC)",
      );
      db.exec(
        "CREATE INDEX IF NOT EXISTS idx_push_subscriptions_client ON push_subscriptions(client_id)",
      );
    } finally {
      db.exec("PRAGMA foreign_keys = ON");
    }
  } catch (error) {
    console.error("[DB] Erreur ensurePushSubscriptionsSchema:", error);
  }
}

ensureAppointmentsTimeColumn();
ensureAppointmentsExtraColumns();
ensureAppointmentsSlotModel();
ensureAppointmentPhotosExtraColumns();
ensureClientsExtraColumns();
ensureClientsTypeAllowsPro();
applySchema();
ensurePushSubscriptionsSchema();
ensureVehiclesFromClients();

module.exports = {
  db,
  nowUnix,
};
