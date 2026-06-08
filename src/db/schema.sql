-- ============================
-- TABLE clients
-- ============================
CREATE TABLE IF NOT EXISTS clients (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  slug              TEXT NOT NULL UNIQUE,
  card_code         TEXT UNIQUE,

  first_name        TEXT,
  last_name         TEXT,
  full_name         TEXT,

  email             TEXT,
  phone             TEXT,
  company           TEXT,

  address_line1     TEXT,
  address_line2     TEXT,
  postal_code       TEXT,
  city              TEXT,

  vehicle_model     TEXT,
  vehicle_plate     TEXT,

  formula_name      TEXT,
  formula_total     INTEGER NOT NULL DEFAULT 0,
  formula_remaining INTEGER NOT NULL DEFAULT 0,

  notes             TEXT,

  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clients_card_code ON clients(card_code);

-- ============================
-- TABLE appointments
-- ============================
CREATE TABLE IF NOT EXISTS appointments (
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

CREATE INDEX IF NOT EXISTS idx_appointments_client_date_slot
  ON appointments(client_id, date, slot);

CREATE INDEX IF NOT EXISTS idx_appointments_date_slot
  ON appointments(date, slot);

CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_active_slot
  ON appointments(date, slot)
  WHERE status IN ('requested', 'confirmed', 'done');

-- ============================
-- TABLE appointment_photos
-- ============================
CREATE TABLE IF NOT EXISTS appointment_photos (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,

  url            TEXT NOT NULL,
  is_cover       INTEGER NOT NULL DEFAULT 0
                  CHECK (is_cover IN (0, 1)),

  caption        TEXT,
  created_at     INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_photos_appointment
  ON appointment_photos(appointment_id);
