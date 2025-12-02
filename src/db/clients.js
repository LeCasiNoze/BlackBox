// src/db/clients.js
const { db, nowUnix } = require("./index");

// Récupère un client soit par slug, soit par card_code
function getClientBySlugOrCardCode(slugOrCode) {
  const stmt = db.prepare(`
    SELECT *
    FROM clients
    WHERE slug = ? OR card_code = ?
    LIMIT 1
  `);

  const row = stmt.get(slugOrCode, slugOrCode);
  return row || null;
}

// Pour plus tard : récupérer par ID
function getClientById(id) {
  const stmt = db.prepare(`SELECT * FROM clients WHERE id = ? LIMIT 1`);
  const row = stmt.get(id);
  return row || null;
}

// Petit seed d'un client de démo si aucun client en base
function ensureDemoClient() {
  const row = db.prepare(`SELECT COUNT(*) AS c FROM clients`).get();
  const count = row ? row.c : 0;
  if (count > 0) {
    return;
  }

  const now = nowUnix();
  const insert = db.prepare(`
    INSERT INTO clients (
      slug,
      card_code,
      first_name,
      last_name,
      full_name,
      email,
      phone,
      address_line1,
      postal_code,
      city,
      vehicle_model,
      vehicle_plate,
      formula_name,
      formula_total,
      formula_remaining,
      notes,
      created_at,
      updated_at
    ) VALUES (
      @slug,
      @card_code,
      @first_name,
      @last_name,
      @full_name,
      @email,
      @phone,
      @address_line1,
      @postal_code,
      @city,
      @vehicle_model,
      @vehicle_plate,
      @formula_name,
      @formula_total,
      @formula_remaining,
      @notes,
      @created_at,
      @updated_at
    )
  `);

  insert.run({
    slug: "card01",                // accessible via /card/card01
    card_code: "card01",
    first_name: "Client",
    last_name: "Démo",
    full_name: "Client Démo",
    email: "demo@example.com",
    phone: "+33 6 00 00 00 00",
    address_line1: "12 Rue du Detailing",
    postal_code: "75000",
    city: "Paris",
    vehicle_model: "BMW M3",
    vehicle_plate: "AB-123-CD",
    formula_name: "Pack 10 nettoyages",
    formula_total: 10,
    formula_remaining: 7,          // il reste 7 nettoyages
    notes: "Client de démonstration pour BlackBox.",
    created_at: now,
    updated_at: now,
  });

  console.log("[DB] Client de démo créé (slug=card01, card_code=card01)");
}

module.exports = {
  getClientBySlugOrCardCode,
  getClientById,
  ensureDemoClient,
};
