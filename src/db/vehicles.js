const { db, nowUnix } = require("./index");

function sanitizeString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function listVehiclesByClient(clientId) {
  return db
    .prepare(
      `
      SELECT *
      FROM vehicles
      WHERE client_id = ?
      ORDER BY is_primary DESC, updated_at DESC, id DESC
    `
    )
    .all(clientId);
}

function getVehicleById(id) {
  return (
    db
      .prepare(
        `
        SELECT *
        FROM vehicles
        WHERE id = ?
        LIMIT 1
      `
      )
      .get(id) || null
  );
}

function getPrimaryVehicleByClientId(clientId) {
  return (
    db
      .prepare(
        `
        SELECT *
        FROM vehicles
        WHERE client_id = ?
        ORDER BY is_primary DESC, created_at ASC, id ASC
        LIMIT 1
      `
      )
      .get(clientId) || null
  );
}

function syncClientPrimaryVehicleSnapshot(clientId) {
  const primary = getPrimaryVehicleByClientId(clientId);

  db.prepare(
    `
    UPDATE clients
    SET vehicle_model = ?,
        vehicle_plate = ?,
        updated_at = ?
    WHERE id = ?
  `
  ).run(primary?.model || null, primary?.plate || null, nowUnix(), clientId);

  return primary;
}

function setPrimaryVehicle(clientId, vehicleId) {
  db.prepare(
    `
    UPDATE vehicles
    SET is_primary = CASE WHEN id = ? THEN 1 ELSE 0 END,
        updated_at = ?
    WHERE client_id = ?
  `
  ).run(vehicleId, nowUnix(), clientId);

  return syncClientPrimaryVehicleSnapshot(clientId);
}

function ensurePrimaryVehicle(clientId) {
  const currentPrimary = db
    .prepare(
      `
      SELECT id
      FROM vehicles
      WHERE client_id = ?
        AND is_primary = 1
      LIMIT 1
    `
    )
    .get(clientId);

  if (currentPrimary?.id) {
    return getVehicleById(currentPrimary.id);
  }

  const firstVehicle = db
    .prepare(
      `
      SELECT id
      FROM vehicles
      WHERE client_id = ?
      ORDER BY created_at ASC, id ASC
      LIMIT 1
    `
    )
    .get(clientId);

  if (!firstVehicle?.id) {
    syncClientPrimaryVehicleSnapshot(clientId);
    return null;
  }

  return setPrimaryVehicle(clientId, firstVehicle.id);
}

function createVehicleForClient(clientId, input = {}) {
  const now = nowUnix();
  const model = sanitizeString(input.model);
  const plate = sanitizeString(input.plate);
  const label =
    sanitizeString(input.label) ||
    [model, plate].filter(Boolean).join(" · ") ||
    "Vehicule";

  const info = db
    .prepare(
      `
      INSERT INTO vehicles (
        client_id,
        label,
        model,
        plate,
        is_primary,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, 0, ?, ?)
    `
    )
    .run(clientId, label, model, plate, now, now);

  const created = getVehicleById(info.lastInsertRowid);
  const existingCount = listVehiclesByClient(clientId).length;

  if (existingCount === 1 || input.isPrimary === true) {
    setPrimaryVehicle(clientId, created.id);
    return getVehicleById(created.id);
  }

  syncClientPrimaryVehicleSnapshot(clientId);
  return created;
}

function updateVehicleForClient(clientId, vehicleId, input = {}) {
  const existing = getVehicleById(vehicleId);
  if (!existing || existing.client_id !== clientId) {
    return null;
  }

  const nextModel =
    input.model !== undefined ? sanitizeString(input.model) : existing.model;
  const nextPlate =
    input.plate !== undefined ? sanitizeString(input.plate) : existing.plate;
  const nextLabel =
    input.label !== undefined
      ? sanitizeString(input.label) ||
        [nextModel, nextPlate].filter(Boolean).join(" · ") ||
        existing.label ||
        "Vehicule"
      : existing.label || [nextModel, nextPlate].filter(Boolean).join(" · ") || "Vehicule";

  db.prepare(
    `
    UPDATE vehicles
    SET label = ?,
        model = ?,
        plate = ?,
        updated_at = ?
    WHERE id = ?
      AND client_id = ?
  `
  ).run(nextLabel, nextModel, nextPlate, nowUnix(), vehicleId, clientId);

  if (input.isPrimary === true) {
    setPrimaryVehicle(clientId, vehicleId);
  } else {
    syncClientPrimaryVehicleSnapshot(clientId);
  }

  return getVehicleById(vehicleId);
}

function deleteVehicleForClient(clientId, vehicleId) {
  const existing = getVehicleById(vehicleId);
  if (!existing || existing.client_id !== clientId) {
    return false;
  }

  const vehicleCount = listVehiclesByClient(clientId).length;
  if (vehicleCount <= 1) {
    return false;
  }

  db.prepare(
    `
    DELETE FROM vehicles
    WHERE id = ?
      AND client_id = ?
  `
  ).run(vehicleId, clientId);

  ensurePrimaryVehicle(clientId);
  return true;
}

module.exports = {
  createVehicleForClient,
  deleteVehicleForClient,
  ensurePrimaryVehicle,
  getPrimaryVehicleByClientId,
  getVehicleById,
  listVehiclesByClient,
  setPrimaryVehicle,
  syncClientPrimaryVehicleSnapshot,
  updateVehicleForClient,
};
