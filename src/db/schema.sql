-- ============================
-- TABLE clients
-- ============================
CREATE TABLE IF NOT EXISTS clients (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  slug              TEXT NOT NULL UNIQUE,          -- pour l'URL: /c/:slug
  card_code         TEXT UNIQUE,                   -- code carte NFC/QR (optionnel, unique si renseigné)

  first_name        TEXT,
  last_name         TEXT,
  full_name         TEXT,                          -- affichage principal "Bonjour Bryan Dupont"

  email             TEXT,
  phone             TEXT,
  company           TEXT,                          -- nom de la société le cas échéant

  address_line1     TEXT,
  address_line2     TEXT,
  postal_code       TEXT,
  city              TEXT,

  vehicle_model     TEXT,                          -- ex: "BMW M3"
  vehicle_plate     TEXT,                          -- ex: "AB-123-CD"

  formula_name      TEXT,                          -- ex: "Pack 10 nettoyages"
  formula_total     INTEGER NOT NULL DEFAULT 0,    -- nombre initial de nettoyages inclus
  formula_remaining INTEGER NOT NULL DEFAULT 0,    -- nombre restant

  notes             TEXT,                          -- remarques internes

  created_at        INTEGER NOT NULL,              -- UNIX timestamp (seconds)
  updated_at        INTEGER NOT NULL               -- UNIX timestamp (seconds)
);

CREATE INDEX IF NOT EXISTS idx_clients_card_code ON clients(card_code);

-- ============================
-- TABLE appointments (rdv)
-- ============================
CREATE TABLE IF NOT EXISTS appointments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id   INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  date        TEXT NOT NULL,  -- format ISO "YYYY-MM-DD"

  status      TEXT NOT NULL DEFAULT 'requested'
              CHECK (status IN ('requested', 'confirmed', 'done', 'cancelled')),

  client_note TEXT,           -- message saisi par le client
  admin_note  TEXT,           -- notes internes

  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,

  -- un seul rendez-vous par jour pour tout le garage
  UNIQUE(date)
);

CREATE INDEX IF NOT EXISTS idx_appointments_client_date
  ON appointments(client_id, date);

-- ============================
-- TABLE appointment_photos
-- ============================
CREATE TABLE IF NOT EXISTS appointment_photos (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,

  url            TEXT NOT NULL,   -- URL/chemin de l'image
  is_cover       INTEGER NOT NULL DEFAULT 0
                  CHECK (is_cover IN (0, 1)),  -- 1 = photo principale dans le carousel

  caption        TEXT,            -- ex: "Après nettoyage complet extérieur"
  created_at     INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_photos_appointment
  ON appointment_photos(appointment_id);
