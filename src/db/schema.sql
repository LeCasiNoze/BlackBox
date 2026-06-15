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
  bc_pending        INTEGER NOT NULL DEFAULT 0,

  notes             TEXT,

  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clients_card_code ON clients(card_code);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(client_type);

-- ============================
-- TABLE vehicles
-- ============================
CREATE TABLE IF NOT EXISTS vehicles (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id         INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  label             TEXT,
  model             TEXT,
  plate             TEXT,
  is_primary        INTEGER NOT NULL DEFAULT 0
                    CHECK (is_primary IN (0, 1)),
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vehicles_client ON vehicles(client_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_model ON vehicles(model);

-- ============================
-- TABLE appointments
-- ============================
CREATE TABLE IF NOT EXISTS appointments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id   INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  vehicle_id  INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,

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
                    CHECK (cleanliness_rating IN (
                      'very_clean',
                      'correct',
                      'dirty',
                      'very_dirty',
                      'reset_recommended'
                    )),
  cleanliness_penalty_applied INTEGER NOT NULL DEFAULT 0,
  client_cleanliness_estimate TEXT
                    CHECK (client_cleanliness_estimate IN ('clean', 'correct', 'dirty')),
  admin_cleanliness_estimate TEXT
                    CHECK (admin_cleanliness_estimate IN ('clean', 'correct', 'dirty')),
  requested_credits INTEGER NOT NULL DEFAULT 1,
  approved_credits INTEGER,
  credits_charged INTEGER NOT NULL DEFAULT 0,
  credits_charged_at INTEGER,
  price_status TEXT NOT NULL DEFAULT 'pending_admin'
                    CHECK (price_status IN (
                      'pending_admin',
                      'waiting_photos',
                      'waiting_client_approval',
                      'waiting_payment',
                      'approved',
                      'not_required',
                      'declined'
                    )),
  photos_requested_at INTEGER,
  photos_request_message TEXT,
  price_comment TEXT,
  client_price_approved_at INTEGER,
  bc_points_awarded INTEGER NOT NULL DEFAULT 0
                    CHECK (bc_points_awarded IN (0, 1)),
  bc_points_granted INTEGER NOT NULL DEFAULT 0,
  admin_reminder_24h_sent_at INTEGER,
  client_reminder_24h_sent_at INTEGER,
  is_public   INTEGER NOT NULL DEFAULT 0
              CHECK (is_public IN (0, 1)),
  location    TEXT
              CHECK(location IN ('atelier', 'domicile')) DEFAULT 'atelier',

  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_appointments_client_date_slot
  ON appointments(client_id, date, slot);

CREATE INDEX IF NOT EXISTS idx_appointments_date_slot
  ON appointments(date, slot);

CREATE INDEX IF NOT EXISTS idx_appointments_vehicle
  ON appointments(vehicle_id);

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
  is_public      INTEGER NOT NULL DEFAULT 0
                  CHECK (is_public IN (0, 1)),

  caption        TEXT,
  created_at     INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_photos_appointment
  ON appointment_photos(appointment_id);

-- ============================
-- TABLE reward_redemptions
-- ============================
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id         INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  reward_key        TEXT NOT NULL,
  reward_label      TEXT NOT NULL,
  points_cost       INTEGER NOT NULL,
  status            TEXT NOT NULL DEFAULT 'requested'
                    CHECK (status IN ('requested', 'processed', 'cancelled')),
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reward_redemptions_client
  ON reward_redemptions(client_id, created_at DESC);

-- ============================
-- TABLE topup_orders
-- ============================
CREATE TABLE IF NOT EXISTS topup_orders (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id         INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL DEFAULT 'sumup'
                    CHECK (provider IN ('sumup')),
  offer_key         TEXT NOT NULL,
  offer_label       TEXT NOT NULL,
  formula_name      TEXT,
  apply_mode        TEXT NOT NULL DEFAULT 'add'
                    CHECK (apply_mode IN ('add', 'replace')),
  credits           INTEGER NOT NULL DEFAULT 0,
  duration_days     INTEGER,
  amount_cents      INTEGER NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'EUR',
  checkout_reference TEXT NOT NULL UNIQUE,
  checkout_id       TEXT UNIQUE,
  hosted_checkout_url TEXT,
  redirect_url      TEXT,
  return_url        TEXT,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded', 'processed')),
  sumup_status      TEXT,
  paid_at           INTEGER,
  processed_at      INTEGER,
  sumup_payload     TEXT,
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_topup_orders_client
  ON topup_orders(client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_topup_orders_checkout_id
  ON topup_orders(checkout_id);

-- ============================
-- TABLE partner_orders (forfaits esthetiques des agences partenaires)
-- ============================
-- Prestations ponctuelles payees par le client final via un lien SumUp genere
-- par un compte pro. Aucun lien avec les credits/formules ni les BC'Coins.
CREATE TABLE IF NOT EXISTS partner_orders (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_client_id   INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  partner_label       TEXT,
  forfait_key         TEXT NOT NULL,
  forfait_label       TEXT NOT NULL,
  amount_cents        INTEGER NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'EUR',
  checkout_reference  TEXT NOT NULL UNIQUE,
  checkout_id         TEXT UNIQUE,
  hosted_checkout_url TEXT,
  redirect_url        TEXT,
  return_url          TEXT,
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded')),
  sumup_status        TEXT,
  customer_name       TEXT,
  customer_email      TEXT,
  paid_at             INTEGER,
  sumup_payload       TEXT,
  created_at          INTEGER NOT NULL,
  updated_at          INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_partner_orders_partner
  ON partner_orders(partner_client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_partner_orders_checkout_id
  ON partner_orders(checkout_id);

CREATE INDEX IF NOT EXISTS idx_partner_orders_reference
  ON partner_orders(checkout_reference);

-- ============================
-- TABLE signup_codes
-- ============================
CREATE TABLE IF NOT EXISTS signup_codes (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  email             TEXT NOT NULL,
  code              TEXT NOT NULL,
  payload_json      TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'used', 'expired')),
  expires_at        INTEGER NOT NULL,
  created_at        INTEGER NOT NULL,
  used_at           INTEGER
);

CREATE INDEX IF NOT EXISTS idx_signup_codes_email_status
  ON signup_codes(email, status, created_at DESC);

-- ============================
-- TABLE push_subscriptions (Web Push)
-- ============================
CREATE TABLE IF NOT EXISTS push_subscriptions (
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
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_role
  ON push_subscriptions(role, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_client
  ON push_subscriptions(client_id);

-- ============================
-- TABLE case_openings (BC'Coins - cases style CS:GO, fondateurs)
-- ============================
CREATE TABLE IF NOT EXISTS case_openings (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id         INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  credits           INTEGER NOT NULL DEFAULT 1,
  source            TEXT NOT NULL DEFAULT 'credit_purchase',
  order_id          INTEGER,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'opened')),
  reward_tier       TEXT,
  reward_bc         INTEGER,
  created_at        INTEGER NOT NULL,
  opened_at         INTEGER
);

CREATE INDEX IF NOT EXISTS idx_case_openings_client
  ON case_openings(client_id, status, created_at DESC);

-- ============================
-- TABLE events (jeux concours)
-- ============================
CREATE TABLE IF NOT EXISTS events (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  title               TEXT NOT NULL,
  description         TEXT,
  audience            TEXT NOT NULL DEFAULT 'global'
                      CHECK (audience IN ('global', 'founder', 'bbx')),
  starts_at           INTEGER,
  ends_at             INTEGER,
  is_active           INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0, 1)),
  require_instagram   INTEGER NOT NULL DEFAULT 1,
  require_tiktok      INTEGER NOT NULL DEFAULT 1,
  require_facebook    INTEGER NOT NULL DEFAULT 1,
  require_review      INTEGER NOT NULL DEFAULT 1,
  conditions_text     TEXT,
  conditions_link     TEXT,
  prize_kind          TEXT NOT NULL DEFAULT 'text'
                      CHECK (prize_kind IN ('text', 'inapp')),
  prize_text          TEXT,
  prize_inapp_type    TEXT,
  prize_inapp_amount  INTEGER,
  consolation_enabled INTEGER NOT NULL DEFAULT 1 CHECK (consolation_enabled IN (0, 1)),
  winner_client_id    INTEGER,
  drawn_at            INTEGER,
  created_at          INTEGER NOT NULL,
  updated_at          INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS event_participations (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id            INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  client_id           INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  consolation_reward  TEXT,
  created_at          INTEGER NOT NULL,
  UNIQUE (event_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_event_participations_event
  ON event_participations(event_id, created_at DESC);

-- ============================
-- TABLE goodie_wins (lots a remettre)
-- ============================
CREATE TABLE IF NOT EXISTS goodie_wins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id     INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  source        TEXT NOT NULL DEFAULT 'review_box',
  reward_key    TEXT NOT NULL,
  reward_label  TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'honored')),
  created_at    INTEGER NOT NULL,
  honored_at    INTEGER
);

CREATE INDEX IF NOT EXISTS idx_goodie_wins_status
  ON goodie_wins(status, created_at DESC);

-- ============================
-- TABLE export_jobs
-- ============================
CREATE TABLE IF NOT EXISTS export_jobs (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  trigger_type      TEXT NOT NULL DEFAULT 'manual'
                    CHECK (trigger_type IN ('manual', 'weekly')),
  file_name         TEXT NOT NULL,
  file_path         TEXT NOT NULL,
  email_sent        INTEGER NOT NULL DEFAULT 0
                    CHECK (email_sent IN (0, 1)),
  created_at        INTEGER NOT NULL
);
