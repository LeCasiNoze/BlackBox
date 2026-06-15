const { db, nowUnix } = require("./index");
const {
  createVehicleForClient,
  ensurePrimaryVehicle,
  listVehiclesByClient,
  syncClientPrimaryVehicleSnapshot,
} = require("./vehicles");
const { rollReviewBoxGoodie } = require("../config/reviewBox");
const { recordGoodieWin } = require("./goodieWins");

function sanitizeString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function sanitizeSlug(value) {
  const source = sanitizeString(value);
  if (!source) {
    return null;
  }

  return source
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function toNonNegativeInteger(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return fallback;
  }
  return Math.floor(numeric);
}

function toInteger(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function parseDateInputToUnix(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return null;
  }

  const timestamp = Date.parse(`${normalized}T12:00:00Z`);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return Math.floor(timestamp / 1000);
}

function formulaNameFromTotal(total) {
  const count = toNonNegativeInteger(total, 0);
  if (count <= 0) {
    return "Formule libre";
  }

  return `Formule ${count} nettoyage${count > 1 ? "s" : ""}`;
}

function getClientBySlugOrCardCode(slugOrCode) {
  return (
    db
      .prepare(
        `
        SELECT *
        FROM clients
        WHERE slug = ? OR card_code = ?
        LIMIT 1
      `,
      )
      .get(slugOrCode, slugOrCode) || null
  );
}

function getClientById(id) {
  return db.prepare(`SELECT * FROM clients WHERE id = ? LIMIT 1`).get(id) || null;
}

function getClientByEmail(email) {
  const normalized = sanitizeString(email);
  if (!normalized) {
    return null;
  }

  return (
    db
      .prepare(
        `
        SELECT *
        FROM clients
        WHERE lower(email) = lower(?)
        LIMIT 1
      `,
      )
      .get(normalized) || null
  );
}

function listClients(filter = "all") {
  if (filter === "bbx") {
    return db
      .prepare(
        `
        SELECT *
        FROM clients
        WHERE client_type = 'bbx'
        ORDER BY created_at DESC, id DESC
      `,
      )
      .all();
  }

  if (filter === "data") {
    return db
      .prepare(
        `
        SELECT *
        FROM clients
        WHERE client_type = 'data'
        ORDER BY created_at DESC, id DESC
      `,
      )
      .all();
  }

  if (filter === "founder") {
    return db
      .prepare(
        `
        SELECT *
        FROM clients
        WHERE is_founder = 1
        ORDER BY created_at DESC, id DESC
      `,
      )
      .all();
  }

  if (filter === "pro") {
    return db
      .prepare(
        `
        SELECT *
        FROM clients
        WHERE client_type = 'pro'
        ORDER BY created_at DESC, id DESC
      `,
      )
      .all();
  }

  return db
    .prepare(
      `
      SELECT *
      FROM clients
      ORDER BY created_at DESC, id DESC
    `,
    )
    .all();
}

function listFounderClients() {
  return db
    .prepare(
      `
      SELECT *
      FROM clients
      WHERE is_founder = 1
      ORDER BY created_at DESC, id DESC
    `,
    )
    .all();
}

function generateNextCardCode() {
  // On prend le plus grand numero deja utilise, que ce soit en card_code
  // (BBX-NNN) OU en slug (bbx-NNN). Les comptes pro/historiques gardent des
  // slugs bbx-NNN sans card_code: ignorer ces slugs provoquerait une collision
  // de slug a la creation d'un nouveau compte.
  const rows = db
    .prepare(
      `
      SELECT card_code AS value FROM clients WHERE card_code LIKE 'BBX-%'
      UNION ALL
      SELECT slug AS value FROM clients WHERE slug LIKE 'bbx-%'
    `,
    )
    .all();

  let maxNum = 0;
  for (const row of rows) {
    const match = String(row.value || "").match(/(\d+)\s*$/);
    if (match) {
      maxNum = Math.max(maxNum, Number.parseInt(match[1], 10));
    }
  }

  return `BBX-${String(maxNum + 1).padStart(3, "0")}`;
}

// Renumerote TOUS les comptes BBX en BBX-001, BBX-002, ... dans l'ordre de
// creation (le plus ancien = 001). Deterministe et idempotent: ne met a jour
// que les codes qui different deja de leur valeur canonique, donc apres la
// premiere passe c'est un no-op. Les comptes Data/Pro ne sont pas concernes.
// Ouvre la box "avis Google" (1 fois par compte). Tire un lot, l'enregistre,
// applique le credit si gagne; les lots physiques + mois fondateur restent
// "a honorer" cote admin.
function openReviewBox(clientId) {
  const client = getClientById(clientId);
  if (!client) {
    return { ok: false, error: "client_not_found" };
  }
  if (client.review_box_opened_at) {
    return { ok: false, error: "already_opened", rewardKey: client.review_box_reward || null };
  }

  const goodie = rollReviewBoxGoodie();
  const now = nowUnix();

  const apply = db.transaction(() => {
    db.prepare(
      `UPDATE clients SET review_box_opened_at = ?, review_box_reward = ?, updated_at = ? WHERE id = ?`,
    ).run(now, goodie.key, now, clientId);

    if (goodie.kind === "credit") {
      db.prepare(
        `UPDATE clients
         SET formula_total = COALESCE(formula_total, 0) + 1,
             formula_remaining = COALESCE(formula_remaining, 0) + 1,
             updated_at = ?
         WHERE id = ?`,
      ).run(now, clientId);
    } else if (goodie.kind === "founder_month") {
      grantTemporaryFounder(clientId, 30);
    } else {
      // Lot physique -> a remettre au prochain passage.
      recordGoodieWin(clientId, "review_box", goodie.key, goodie.label);
    }
  });
  apply();

  return { ok: true, reward: goodie };
}

// Passe le compte fondateur pour `days` jours (expiration auto ensuite).
function grantTemporaryFounder(clientId, days = 30) {
  const until = nowUnix() + days * 24 * 60 * 60;
  db.prepare(
    `UPDATE clients SET is_founder = 1, founder_until = ?, updated_at = ? WHERE id = ?`,
  ).run(until, nowUnix(), clientId);
  return until;
}

// Repasse en BBX les comptes dont l'acces fondateur temporaire a expire.
function expireTemporaryFounders() {
  const now = nowUnix();
  const info = db
    .prepare(
      `UPDATE clients SET is_founder = 0, founder_until = NULL, updated_at = ?
       WHERE founder_until IS NOT NULL AND founder_until < ?`,
    )
    .run(now, now);
  return info.changes;
}

function renumberCardCodes() {
  const rows = db
    .prepare(
      `
      SELECT id, card_code
      FROM clients
      WHERE client_type = 'bbx'
      ORDER BY created_at ASC, id ASC
    `,
    )
    .all();

  const update = db.prepare(`UPDATE clients SET card_code = ? WHERE id = ?`);
  const apply = db.transaction(() => {
    let changed = 0;
    rows.forEach((row, index) => {
      const code = `BBX-${String(index + 1).padStart(3, "0")}`;
      if (row.card_code !== code) {
        update.run(code, row.id);
        changed += 1;
      }
    });
    return changed;
  });

  return apply();
}

function generateNextDataSlug() {
  const row = db
    .prepare(
      `
      SELECT slug
      FROM clients
      WHERE slug LIKE 'data-%'
      ORDER BY LENGTH(slug) DESC, slug DESC
      LIMIT 1
    `,
    )
    .get();

  let nextNum = 1;
  if (row?.slug) {
    const match = String(row.slug).match(/^data-(\d+)$/);
    if (match) {
      nextNum = Number.parseInt(match[1], 10) + 1;
    }
  }

  return `data-${String(nextNum).padStart(3, "0")}`;
}

function buildClientIdentity(input = {}, existing = null) {
  const nextFirstName =
    input.firstName !== undefined
      ? sanitizeString(input.firstName)
      : existing?.first_name ?? null;
  const nextLastName =
    input.lastName !== undefined
      ? sanitizeString(input.lastName)
      : existing?.last_name ?? null;
  const nextFullName =
    input.fullName !== undefined
      ? sanitizeString(input.fullName)
      : [nextFirstName, nextLastName].filter(Boolean).join(" ") ||
        existing?.full_name ||
        null;

  return {
    firstName: nextFirstName,
    lastName: nextLastName,
    fullName: nextFullName,
  };
}

function buildFormulaState(input = {}, existing = null) {
  const total =
    input.formulaTotal !== undefined
      ? toNonNegativeInteger(input.formulaTotal, 0)
      : toNonNegativeInteger(existing?.formula_total, 0);
  const remainingRaw =
    input.formulaRemaining !== undefined
      ? toInteger(input.formulaRemaining, total)
      : toInteger(existing?.formula_remaining, total);
  const remaining = remainingRaw;
  const explicitFormulaName =
    input.formulaName !== undefined
      ? sanitizeString(input.formulaName)
      : sanitizeString(existing?.formula_name);
  const formulaName = explicitFormulaName || formulaNameFromTotal(total);
  const purchasedAt =
    input.formulaPurchasedAt !== undefined
      ? parseDateInputToUnix(input.formulaPurchasedAt)
      : existing?.formula_purchased_at ?? null;
  const expiresAt =
    input.formulaExpiresAt !== undefined
      ? parseDateInputToUnix(input.formulaExpiresAt)
      : existing?.formula_expires_at ?? null;

  return {
    formulaName,
    formulaTotal: total,
    formulaRemaining: remaining,
    formulaPurchasedAt: purchasedAt,
    formulaExpiresAt: expiresAt,
  };
}

function insertVehiclesForClient(clientId, input = {}) {
  const queue = [];

  if (Array.isArray(input.vehicles) && input.vehicles.length > 0) {
    input.vehicles.forEach((vehicle, index) => {
      if (!vehicle || typeof vehicle !== "object") {
        return;
      }

      queue.push({
        label: vehicle.label,
        model: vehicle.model,
        plate: vehicle.plate,
        isPrimary: vehicle.isPrimary === true || index === 0,
      });
    });
  } else if (input.vehicleModel || input.vehiclePlate || input.vehicleLabel) {
    queue.push({
      label: input.vehicleLabel,
      model: input.vehicleModel,
      plate: input.vehiclePlate,
      isPrimary: true,
    });
  }

  queue.forEach((vehicle) => {
    createVehicleForClient(clientId, vehicle);
  });

  ensurePrimaryVehicle(clientId);
}

function createClient(input = {}) {
  const now = nowUnix();
  const clientType = ["bbx", "data", "pro"].includes(input.clientType)
    ? input.clientType
    : "bbx";
  const isFounder = clientType === "bbx" && input.isFounder === true ? 1 : 0;
  const identity = buildClientIdentity(input);
  const formula = buildFormulaState(input);

  const cardCode =
    clientType === "bbx"
      ? sanitizeString(input.cardCode) || generateNextCardCode()
      : null;
  const slug =
    clientType === "bbx"
      ? sanitizeSlug(input.slug) || sanitizeSlug(cardCode) || generateNextDataSlug()
      : sanitizeSlug(input.slug) || generateNextDataSlug();

  const info = db
    .prepare(
      `
      INSERT INTO clients (
        slug,
        card_code,
        first_name,
        last_name,
        full_name,
        email,
        phone,
        company,
        client_type,
        is_founder,
        founder_media_url,
        address_line1,
        address_line2,
        postal_code,
        city,
        formula_name,
        formula_total,
        formula_remaining,
        formula_purchased_at,
        formula_expires_at,
        bc_points,
        notes,
        created_at,
        updated_at
      ) VALUES (
        @slug,
        @cardCode,
        @firstName,
        @lastName,
        @fullName,
        @email,
        @phone,
        @company,
        @clientType,
        @isFounder,
        @founderMediaUrl,
        @addressLine1,
        @addressLine2,
        @postalCode,
        @city,
        @formulaName,
        @formulaTotal,
        @formulaRemaining,
        @formulaPurchasedAt,
        @formulaExpiresAt,
        @bcPoints,
        @notes,
        @createdAt,
        @updatedAt
      )
    `,
    )
    .run({
      slug,
      cardCode,
      firstName: identity.firstName,
      lastName: identity.lastName,
      fullName: identity.fullName,
      email: sanitizeString(input.email),
      phone: sanitizeString(input.phone),
      company: sanitizeString(input.company),
      clientType,
      isFounder,
      founderMediaUrl: sanitizeString(input.founderMediaUrl),
      addressLine1: sanitizeString(input.addressLine1),
      addressLine2: sanitizeString(input.addressLine2),
      postalCode: sanitizeString(input.postalCode),
      city: sanitizeString(input.city),
      formulaName: formula.formulaName,
      formulaTotal: formula.formulaTotal,
      formulaRemaining: formula.formulaRemaining,
      formulaPurchasedAt: formula.formulaPurchasedAt,
      formulaExpiresAt: formula.formulaExpiresAt,
      bcPoints: toNonNegativeInteger(input.bcPoints, 0),
      notes: sanitizeString(input.notes),
      createdAt: now,
      updatedAt: now,
    });

  insertVehiclesForClient(info.lastInsertRowid, input);
  return getClientById(info.lastInsertRowid);
}

function updateClientProfile(clientId, input = {}) {
  const existing = getClientById(clientId);
  if (!existing) {
    return null;
  }

  const now = nowUnix();
  const identity = buildClientIdentity(input, existing);
  const formula = buildFormulaState(input, existing);
  const requestedType =
    input.clientType !== undefined && ["bbx", "data", "pro"].includes(input.clientType)
      ? input.clientType
      : existing.client_type;
  const shouldBeFounder =
    requestedType === "bbx" && input.isFounder !== undefined
      ? input.isFounder
        ? 1
        : 0
      : requestedType === "bbx"
        ? existing.is_founder
        : 0;

  let nextCardCode = existing.card_code;
  if (requestedType !== "bbx") {
    nextCardCode = null;
  } else if (!nextCardCode) {
    nextCardCode = generateNextCardCode();
  }

  const nextSlug =
    input.slug !== undefined
      ? sanitizeSlug(input.slug) || existing.slug
      : existing.slug || sanitizeSlug(nextCardCode) || generateNextDataSlug();

  db.prepare(
    `
    UPDATE clients
    SET
      slug = ?,
      card_code = ?,
      first_name = ?,
      last_name = ?,
      full_name = ?,
      email = ?,
      phone = ?,
      company = ?,
      client_type = ?,
      is_founder = ?,
      founder_media_url = ?,
      address_line1 = ?,
      address_line2 = ?,
      postal_code = ?,
      city = ?,
      formula_name = ?,
      formula_total = ?,
      formula_remaining = ?,
      formula_purchased_at = ?,
      formula_expires_at = ?,
      notes = ?,
      updated_at = ?
    WHERE id = ?
  `,
  ).run(
    nextSlug,
    nextCardCode,
    identity.firstName,
    identity.lastName,
    identity.fullName,
    input.email !== undefined ? sanitizeString(input.email) : existing.email,
    input.phone !== undefined ? sanitizeString(input.phone) : existing.phone,
    input.company !== undefined ? sanitizeString(input.company) : existing.company,
    requestedType,
    shouldBeFounder,
    input.clearFounderMedia === true
      ? null
      : input.founderMediaUrl !== undefined
        ? sanitizeString(input.founderMediaUrl)
        : existing.founder_media_url,
    input.addressLine1 !== undefined
      ? sanitizeString(input.addressLine1)
      : existing.address_line1,
    input.addressLine2 !== undefined
      ? sanitizeString(input.addressLine2)
      : existing.address_line2,
    input.postalCode !== undefined
      ? sanitizeString(input.postalCode)
      : existing.postal_code,
    input.city !== undefined ? sanitizeString(input.city) : existing.city,
    formula.formulaName,
    formula.formulaTotal,
    formula.formulaRemaining,
    formula.formulaPurchasedAt,
    formula.formulaExpiresAt,
    input.notes !== undefined ? sanitizeString(input.notes) : existing.notes,
    now,
    clientId,
  );

  if (Array.isArray(input.vehicles)) {
    const existingVehicles = listVehiclesByClient(clientId);
    existingVehicles.forEach((vehicle) => {
      db.prepare(`DELETE FROM vehicles WHERE id = ? AND client_id = ?`).run(vehicle.id, clientId);
    });
    insertVehiclesForClient(clientId, input);
  } else {
    syncClientPrimaryVehicleSnapshot(clientId);
  }

  return getClientById(clientId);
}

function decrementFormulaRemaining(clientId) {
  return db
    .prepare(
      `
      UPDATE clients
      SET formula_remaining = CASE
            WHEN formula_remaining > 0 THEN formula_remaining - 1
            ELSE formula_remaining
          END,
          updated_at = ?
      WHERE id = ?
    `,
    )
    .run(nowUnix(), clientId).changes;
}

function incrementFormulaRemaining(clientId) {
  return db
    .prepare(
      `
      UPDATE clients
      SET formula_remaining = CASE
            WHEN formula_remaining < formula_total THEN formula_remaining + 1
            ELSE formula_remaining
          END,
          updated_at = ?
      WHERE id = ?
    `,
    )
    .run(nowUnix(), clientId).changes;
}

function updateClientFormulaBalance(clientId, { total, remaining }) {
  const client = getClientById(clientId);
  if (!client) {
    return null;
  }

  const nextTotal = toNonNegativeInteger(total, client.formula_total);
  const nextRemaining = clamp(
    toInteger(remaining, client.formula_remaining),
    -9999,
    99999,
  );
  const formulaName = sanitizeString(client.formula_name) || formulaNameFromTotal(nextTotal);

  db.prepare(
    `
    UPDATE clients
    SET formula_name = ?,
        formula_total = ?,
        formula_remaining = ?,
        updated_at = ?
    WHERE id = ?
  `,
  ).run(formulaName, nextTotal, nextRemaining, nowUnix(), clientId);

  return getClientById(clientId);
}

function updateClientTermsAcceptance(clientId, acceptedAt = nowUnix()) {
  return db
    .prepare(
      `
      UPDATE clients
      SET terms_accepted_at = ?,
          updated_at = ?
      WHERE id = ?
    `,
    )
    .run(acceptedAt, nowUnix(), clientId).changes;
}

function markFormulaRecapSent(clientId, sentAt = nowUnix()) {
  return db
    .prepare(
      `
      UPDATE clients
      SET formula_recap_sent_at = ?,
          updated_at = ?
      WHERE id = ?
    `,
    )
    .run(sentAt, nowUnix(), clientId).changes;
}

function markWelcomeEmailSent(clientId, sentAt = nowUnix()) {
  return db
    .prepare(
      `
      UPDATE clients
      SET welcome_email_sent_at = ?,
          updated_at = ?
      WHERE id = ?
    `,
    )
    .run(sentAt, nowUnix(), clientId).changes;
}

function updateFounderMediaUrl(clientId, founderMediaUrl) {
  return db
    .prepare(
      `
      UPDATE clients
      SET founder_media_url = ?,
          updated_at = ?
      WHERE id = ?
    `,
    )
    .run(sanitizeString(founderMediaUrl), nowUnix(), clientId).changes;
}

function resetAllClientsAndRelatedData() {
  db.exec("PRAGMA foreign_keys = OFF");
  try {
    db.exec("BEGIN");
    db.exec(`DELETE FROM appointment_photos;`);
    db.exec(`DELETE FROM appointments;`);
    db.exec(`DELETE FROM reward_redemptions;`);
    db.exec(`DELETE FROM vehicles;`);
    db.exec(`DELETE FROM export_jobs;`);
    db.exec(`DELETE FROM clients;`);
    db.exec(
      `DELETE FROM sqlite_sequence WHERE name IN ('clients','vehicles','appointments','appointment_photos','reward_redemptions','export_jobs');`,
    );
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  } finally {
    db.exec("PRAGMA foreign_keys = ON");
  }
}

function ensureDemoClient() {
  const count = db.prepare(`SELECT COUNT(*) AS count FROM clients`).get()?.count || 0;
  if (count > 0) {
    return;
  }

  createClient({
    firstName: "Client",
    lastName: "Demo",
    email: "demo@example.com",
    phone: "+33 6 00 00 00 00",
    addressLine1: "12 Rue du Detailing",
    postalCode: "75000",
    city: "Paris",
    vehicleModel: "BMW M3",
    vehiclePlate: "AB-123-CD",
    formulaName: "Formule 10 nettoyages",
    formulaTotal: 10,
    formulaRemaining: 7,
    notes: "Client de demonstration Bryan Cars.",
  });
}

module.exports = {
  createClient,
  decrementFormulaRemaining,
  expireTemporaryFounders,
  grantTemporaryFounder,
  openReviewBox,
  renumberCardCodes,
  ensureDemoClient,
  formulaNameFromTotal,
  generateNextCardCode,
  generateNextDataSlug,
  getClientByEmail,
  getClientById,
  getClientBySlugOrCardCode,
  incrementFormulaRemaining,
  listClients,
  listFounderClients,
  markFormulaRecapSent,
  markWelcomeEmailSent,
  parseDateInputToUnix,
  resetAllClientsAndRelatedData,
  sanitizeString,
  updateClientFormulaBalance,
  updateClientProfile,
  updateClientTermsAcceptance,
  updateFounderMediaUrl,
};
