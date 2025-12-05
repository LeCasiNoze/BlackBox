// src/routes/adminApi.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const { db, nowUnix } = require("../db");

const {
  listClients,
  getClientById,
  incrementFormulaRemaining,
} = require("../db/clients");
const {
  getAppointmentsForClient,
  getAllAppointmentsWithClient,
  getAppointmentById,
  updateAppointmentStatus,
  updateAppointmentAdminNote,
  cancelAppointmentForClientOnDate,
  getAppointmentPhotos,       // 👈 NEW
  insertAppointmentPhoto,     // 👈 NEW
} = require("../db/appointments");

// Dossier de stockage des photos de rendez-vous
const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "appointments");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const base = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, base + ext.toLowerCase());
  },
});

const upload = multer({ storage });

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const ALLOWED_STATUSES = ["requested", "confirmed", "done", "cancelled"];

// Génère le prochain code carte du style "BBX-001", "BBX-002", ...
function generateNextCardCode() {
  const row = db
    .prepare(`
      SELECT card_code
      FROM clients
      WHERE card_code LIKE 'BBX-%'
      ORDER BY LENGTH(card_code) DESC, card_code DESC
      LIMIT 1
    `)
    .get();

  let nextNum = 1;

  if (row && row.card_code) {
    const m = String(row.card_code).match(/^BBX-(\d+)$/);
    if (m) {
      nextNum = parseInt(m[1], 10) + 1;
    }
  }

  const suffix = String(nextNum).padStart(3, "0"); // 001, 002, ..., 010, 011...
  return `BBX-${suffix}`;
}

// Transforme une ligne client DB -> objet JSON camelCase
function mapClientRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    cardCode: row.card_code,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    company: row.company || null,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    postalCode: row.postal_code,
    city: row.city,
    vehicleModel: row.vehicle_model,
    vehiclePlate: row.vehicle_plate,
    formulaName: row.formula_name,
    formulaTotal: row.formula_total,
    formulaRemaining: row.formula_remaining,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Transforme une ligne appointment DB (+ éventuels champs client_) -> objet JSON
function mapAppointmentRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    clientId: row.client_id,
    date: row.date,
    time: row.time,
    status: row.status,
    clientNote: row.client_note,
    adminNote: row.admin_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clientName: row.full_name || row.client_full_name || null,
    vehicleModel: row.vehicle_model || null,
    vehiclePlate: row.vehicle_plate || null,
  };
}

function mapPhotoRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    url: row.url,
    caption: row.caption || null,
    isCover: !!row.is_cover,
  };
}

// ─────────────────────────────────────────────
// Clients
// ─────────────────────────────────────────────

// GET /api/admin/clients -> liste de tous les clients
router.get("/clients", (req, res) => {
  try {
    const rows = listClients();
    const clients = rows.map(mapClientRow);
    res.json({ ok: true, clients });
  } catch (err) {
    console.error("[adminApi] GET /clients error:", err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

// GET /api/admin/clients/:id -> détails + rendez-vous
router.get("/clients/:id", (req, res) => {
  const id = Number(req.params.id || 0);
  if (!id) {
    return res.status(400).json({ ok: false, error: "invalid_id" });
  }

  try {
    const clientRow = getClientById(id);
    if (!clientRow) {
      return res.status(404).json({ ok: false, error: "client_not_found" });
    }

    const apptsRows = getAppointmentsForClient(id);
    const appointments = apptsRows.map(mapAppointmentRow);

    res.json({
      ok: true,
      client: mapClientRow(clientRow),
      appointments,
    });
  } catch (err) {
    console.error("[adminApi] GET /clients/:id error:", err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

// POST /api/admin/clients/:id/profile
// Met à jour les infos du client (hors card_code & slug)
router.post("/clients/:id/profile", (req, res) => {
  const id = Number(req.params.id || 0);
  if (!id) {
    return res.status(400).json({ ok: false, error: "invalid_id" });
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    company,
    addressLine1,
    addressLine2,
    postalCode,
    city,
    vehicleModel,
    vehiclePlate,
    formulaName,
    formulaTotal,
    formulaRemaining,
    notes,
  } = req.body || {};

  try {
    const existing = getClientById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ ok: false, error: "client_not_found" });
    }

    const now = nowUnix();

    const fn =
      typeof firstName === "string"
        ? firstName.trim()
        : existing.first_name;
    const ln =
      typeof lastName === "string"
        ? lastName.trim()
        : existing.last_name;

    let fullName = existing.full_name;
    if (firstName !== undefined || lastName !== undefined) {
      const tmpFull =
        (fn || ln) ? [fn, ln].filter(Boolean).join(" ") : null;
      fullName = tmpFull || existing.full_name;
    }

    const ftRaw = formulaTotal !== undefined ? Number(formulaTotal) : existing.formula_total;
    const frRaw = formulaRemaining !== undefined ? Number(formulaRemaining) : existing.formula_remaining;

    const ft =
      Number.isFinite(ftRaw) && ftRaw >= 0 ? Math.floor(ftRaw) : existing.formula_total;
    let fr =
      Number.isFinite(frRaw) && frRaw >= 0 ? Math.floor(frRaw) : existing.formula_remaining;

    // On évite d'avoir "restants > total"
    fr = Math.min(fr, ft);

    db.prepare(
      `
      UPDATE clients
      SET
        first_name        = ?,
        last_name         = ?,
        full_name         = ?,
        email             = ?,
        phone             = ?,
        company           = ?,
        address_line1     = ?,
        address_line2     = ?,
        postal_code       = ?,
        city              = ?,
        vehicle_model     = ?,
        vehicle_plate     = ?,
        formula_name      = ?,
        formula_total     = ?,
        formula_remaining = ?,
        notes             = ?,
        updated_at        = ?
      WHERE id = ?
    `
    ).run(
      fn,
      ln,
      fullName,
      email !== undefined ? email || null : existing.email,
      phone !== undefined ? phone || null : existing.phone,
      company !== undefined ? company || null : existing.company,
      addressLine1 !== undefined
        ? addressLine1 || null
        : existing.address_line1,
      addressLine2 !== undefined
        ? addressLine2 || null
        : existing.address_line2,
      postalCode !== undefined
        ? postalCode || null
        : existing.postal_code,
      city !== undefined ? city || null : existing.city,
      vehicleModel !== undefined
        ? vehicleModel || null
        : existing.vehicle_model,
      vehiclePlate !== undefined
        ? vehiclePlate || null
        : existing.vehicle_plate,
      formulaName !== undefined
        ? formulaName || null
        : existing.formula_name,
      ft,
      fr,
      notes !== undefined ? notes || null : existing.notes,
      now,
      id
    );

    const updated = getClientById(id);
    return res.json({
      ok: true,
      client: mapClientRow(updated),
    });
  } catch (err) {
    console.error("[adminApi] POST /clients/:id/profile error:", err);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

// POST /api/admin/clients
// Crée un nouveau client avec un card_code auto "BBX-00X"
router.post("/clients", (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    company,
    addressLine1,
    addressLine2,
    postalCode,
    city,
    vehicleModel,
    vehiclePlate,
    formulaName,
    formulaTotal,
    formulaRemaining,
    notes,
  } = req.body || {};

  try {
    const now = nowUnix();
    const cardCode = generateNextCardCode();
    const slug = cardCode.toLowerCase(); // ex: "bbx-001"

    const fn = typeof firstName === "string" ? firstName.trim() : null;
    const ln = typeof lastName === "string" ? lastName.trim() : null;
    const fullName =
      fn || ln ? [fn, ln].filter(Boolean).join(" ") : null;

    const ftRaw = Number(formulaTotal);
    const frRaw = Number(formulaRemaining);

    const ft =
      Number.isFinite(ftRaw) && ftRaw >= 0 ? Math.floor(ftRaw) : 0;
    const fr =
      Number.isFinite(frRaw) && frRaw >= 0 ? Math.floor(frRaw) : 0;

    const stmt = db.prepare(`
      INSERT INTO clients (
        slug,
        card_code,
        first_name,
        last_name,
        full_name,
        email,
        phone,
        company,
        address_line1,
        address_line2,
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
        @company,
        @address_line1,
        @address_line2,
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

    const info = stmt.run({
      slug,
      card_code: cardCode,
      first_name: fn,
      last_name: ln,
      full_name: fullName,
      email: email || null,
      phone: phone || null,
      company: company || null,
      address_line1: addressLine1 || null,
      address_line2: addressLine2 || null,
      postal_code: postalCode || null,
      city: city || null,
      vehicle_model: vehicleModel || null,
      vehicle_plate: vehiclePlate || null,
      formula_name: formulaName || null,
      formula_total: ft,
      formula_remaining: fr,
      notes: notes || null,
      created_at: now,
      updated_at: now,
    });

    const created = getClientById(info.lastInsertRowid);
    return res.json({
      ok: true,
      client: mapClientRow(created),
    });
  } catch (err) {
    console.error("[adminApi] POST /clients error:", err);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});


// ─────────────────────────────────────────────
// Rendez-vous (vue globale)
// ─────────────────────────────────────────────

// GET /api/admin/appointments?limit=100
router.get("/appointments", (req, res) => {
  const limit = Math.max(
    1,
    Math.min(500, Number(req.query.limit || 100))
  );

  try {
    const rows = getAllAppointmentsWithClient(limit);
    const appointments = rows.map(mapAppointmentRow);

    res.json({
      ok: true,
      appointments,
    });
  } catch (err) {
    console.error("[adminApi] GET /appointments error:", err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

// ─────────────────────────────────────────────
// Actions sur un rendez-vous
// ─────────────────────────────────────────────

// POST /api/admin/clients/:id/formula
// body: { mode: "reset" | "empty" | "custom", total?: number, remaining?: number }
router.post("/clients/:id/formula", (req, res) => {
  const id = Number(req.params.id || 0);
  const { mode, total, remaining } = req.body || {};

  if (!id) {
    return res.status(400).json({ ok: false, error: "invalid_id" });
  }

  try {
    const client = getClientById(id);
    if (!client) {
      return res.status(404).json({ ok: false, error: "not_found" });
    }

    let newTotal = client.formula_total ?? 0;
    let newRemaining = client.formula_remaining ?? 0;

    if (mode === "reset") {
      // remet le nombre restant au max actuel
      newRemaining = newTotal;
    } else if (mode === "empty") {
      // vide le forfait
      newRemaining = 0;
    } else if (mode === "custom") {
      const t =
        typeof total === "number" && Number.isFinite(total) && total >= 0
          ? Math.floor(total)
          : newTotal;

      const r =
        typeof remaining === "number" && Number.isFinite(remaining) && remaining >= 0
          ? Math.floor(remaining)
          : newRemaining;

      newTotal = t;
      newRemaining = Math.min(r, t); // on ne laisse pas restants > total
    } else {
      return res.status(400).json({ ok: false, error: "invalid_mode" });
    }

    db.prepare(
      `
      UPDATE clients
      SET
        formula_total = ?,
        formula_remaining = ?,
        updated_at = ?
      WHERE id = ?
    `
    ).run(newTotal, newRemaining, nowUnix(), id);

    const updated = getClientById(id);

    return res.json({
      ok: true,
      client: mapClientRow(updated),
    });
  } catch (err) {
    console.error("[adminApi] formula update error:", err);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});
// --------------------------------------------------
// TEST EMAIL (Brevo) : /api/admin/test-email
// --------------------------------------------------
const { sendAdminNotification } = require("../email");

router.get("/test-email", async (req, res) => {
  try {
    await sendAdminNotification({
      type: "test",
      client: {
        id: 999,
        first_name: "Test",
        last_name: "Email",
        email: "test@example.com",
        phone: "+33 600000000",
        vehicle_model: "TestCar",
        vehicle_plate: "TEST-001",
        card_code: "TEST-CARD",
      },
      date: "2025-12-19",
      time: "14:00",
    });

    res.json({ ok: true, message: "Email envoyé via Brevo !" });
  } catch (err) {
    console.error("[MAIL TEST] Error:", err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// POST /api/admin/appointments/:id/status  { status }
router.post("/appointments/:id/status", (req, res) => {
  const id = Number(req.params.id || 0);
  const { status } = req.body || {};

  if (!id) {
    return res.status(400).json({ ok: false, error: "invalid_id" });
  }
  if (!ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ ok: false, error: "invalid_status" });
  }

  try {
    const appt = getAppointmentById(id);
    if (!appt) {
      return res.status(404).json({ ok: false, error: "appointment_not_found" });
    }

    // Cas spécial : annulation admin => libère le jour + recrédite le client
    if (status === "cancelled") {
      if (!["requested", "confirmed"].includes(appt.status)) {
        return res.status(400).json({
          ok: false,
          error: "cannot_cancel",
          message: "Seuls les rendez-vous en attente ou confirmés peuvent être annulés.",
        });
      }

      // 1) passe le RDV en cancelled (via la fonction existante)
      cancelAppointmentForClientOnDate(appt.client_id, appt.date);
      // 2) recrédite 1 nettoyage
      incrementFormulaRemaining(appt.client_id);

      const updated = getAppointmentById(id);
      return res.json({
        ok: true,
        appointment: mapAppointmentRow(updated),
      });
    }

    // Autres status (requested, confirmed, done) → simple update
    const changes = updateAppointmentStatus(id, status);
    if (!changes) {
      return res.status(400).json({ ok: false, error: "no_change" });
    }

    const updated = getAppointmentById(id);
    res.json({
      ok: true,
      appointment: mapAppointmentRow(updated),
    });
  } catch (err) {
    console.error("[adminApi] POST /appointments/:id/status error:", err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

// POST /api/admin/appointments/:id/admin-note  { adminNote }
router.post("/appointments/:id/admin-note", (req, res) => {
  const id = Number(req.params.id || 0);
  const { adminNote } = req.body || {};

  if (!id) {
    return res.status(400).json({ ok: false, error: "invalid_id" });
  }

  try {
    const appt = getAppointmentById(id);
    if (!appt) {
      return res.status(404).json({ ok: false, error: "appointment_not_found" });
    }

    updateAppointmentAdminNote(id, adminNote || null);
    const updated = getAppointmentById(id);

    res.json({
      ok: true,
      appointment: mapAppointmentRow(updated),
    });
  } catch (err) {
    console.error("[adminApi] POST /appointments/:id/admin-note error:", err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

// POST /api/admin/appointments/:id/photos/upload
// FormData: file, caption?
router.post(
  "/appointments/:id/photos/upload",
  upload.single("file"),
  (req, res) => {
    const id = Number(req.params.id || 0);
    if (!id) {
      return res.status(400).json({ ok: false, error: "invalid_id" });
    }

    if (!req.file) {
      return res.status(400).json({ ok: false, error: "no_file" });
    }

    try {
      const appt = getAppointmentById(id);
      if (!appt) {
        return res
          .status(404)
          .json({ ok: false, error: "appointment_not_found" });
      }

      const caption =
        typeof req.body.caption === "string" && req.body.caption.trim() !== ""
          ? req.body.caption.trim()
          : null;

      // URL publique de la photo
      const url = `/uploads/appointments/${req.file.filename}`;

      const row = insertAppointmentPhoto(id, url, caption, 0);

      return res.json({ ok: true, photo: mapPhotoRow(row) });
    } catch (err) {
      console.error(
        "[adminApi] POST /appointments/:id/photos/upload error:",
        err
      );
      return res.status(500).json({ ok: false, error: "server_error" });
    }
  }
);

// GET /api/admin/appointments/:id/photos
router.get("/appointments/:id/photos", (req, res) => {
  const id = Number(req.params.id || 0);
  if (!id) {
    return res.status(400).json({ ok: false, error: "invalid_id" });
  }

  try {
    const appt = getAppointmentById(id);
    if (!appt) {
      return res
        .status(404)
        .json({ ok: false, error: "appointment_not_found" });
    }

    const rows = getAppointmentPhotos(id);
    const photos = rows.map(mapPhotoRow);
    return res.json({ ok: true, photos });
  } catch (err) {
    console.error("[adminApi] GET /appointments/:id/photos error:", err);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

// POST /api/admin/appointments/:id/photos
// body: { url: string, caption?: string }
router.post("/appointments/:id/photos", (req, res) => {
  const id = Number(req.params.id || 0);
  if (!id) {
    return res.status(400).json({ ok: false, error: "invalid_id" });
  }

  const { url, caption } = req.body || {};
  if (!url || typeof url !== "string" || !url.trim()) {
    return res.status(400).json({ ok: false, error: "invalid_url" });
  }

  try {
    const appt = getAppointmentById(id);
    if (!appt) {
      return res
        .status(404)
        .json({ ok: false, error: "appointment_not_found" });
    }

    const row = insertAppointmentPhoto(
      id,
      url.trim(),
      typeof caption === "string" && caption.trim() !== ""
        ? caption.trim()
        : null,
      0
    );

    return res.json({ ok: true, photo: mapPhotoRow(row) });
  } catch (err) {
    console.error("[adminApi] POST /appointments/:id/photos error:", err);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

module.exports = router;
