const { db, nowUnix } = require("./index");

function mapQuoteRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    clientId: row.client_id,
    description: row.description || null,
    status: row.status,
    estimatedCredits: row.estimated_credits ?? null,
    adminComment: row.admin_comment || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    answeredAt: row.answered_at ?? null,
  };
}

function createQuoteRequest({ clientId, description = null }) {
  const now = nowUnix();
  const info = db
    .prepare(
      `INSERT INTO quote_requests (client_id, description, status, created_at, updated_at)
       VALUES (?, ?, 'pending', ?, ?)`,
    )
    .run(clientId, description || null, now, now);
  return info.lastInsertRowid;
}

function insertQuoteRequestPhoto(quoteRequestId, url) {
  if (!quoteRequestId || !url) return null;
  const info = db
    .prepare(
      `INSERT INTO quote_request_photos (quote_request_id, url, created_at)
       VALUES (?, ?, ?)`,
    )
    .run(quoteRequestId, url, nowUnix());
  return info.lastInsertRowid;
}

function getQuoteRequestPhotos(quoteRequestId) {
  return db
    .prepare(
      `SELECT url FROM quote_request_photos WHERE quote_request_id = ? ORDER BY id ASC`,
    )
    .all(quoteRequestId)
    .map((row) => row.url);
}

function getQuoteRequestById(id) {
  return mapQuoteRow(
    db.prepare(`SELECT * FROM quote_requests WHERE id = ?`).get(id),
  );
}

// La demande "active" d'un client = la plus recente (pending ou answered).
// Le client n'en a qu'une a la fois ; il la ferme pour en relancer une.
function getActiveQuoteRequestForClient(clientId) {
  return mapQuoteRow(
    db
      .prepare(
        `SELECT * FROM quote_requests WHERE client_id = ? ORDER BY id DESC LIMIT 1`,
      )
      .get(clientId),
  );
}

function answerQuoteRequest(id, { estimatedCredits, adminComment = null }) {
  const now = nowUnix();
  db.prepare(
    `UPDATE quote_requests
       SET status = 'answered', estimated_credits = ?, admin_comment = ?,
           answered_at = ?, updated_at = ?
     WHERE id = ?`,
  ).run(Number(estimatedCredits) || 0, adminComment || null, now, now, id);
  return getQuoteRequestById(id);
}

function deleteQuoteRequest(id) {
  return db.prepare(`DELETE FROM quote_requests WHERE id = ?`).run(id).changes;
}

// Liste admin : toutes les demandes, avec infos client + photos, recentes d'abord.
function listQuoteRequestsForAdmin() {
  const rows = db
    .prepare(
      `SELECT q.*, c.full_name, c.first_name, c.last_name, c.slug, c.card_code,
              c.client_type, c.is_founder, c.phone, c.email,
              c.vehicle_model, c.vehicle_plate, c.formula_remaining
         FROM quote_requests q
         JOIN clients c ON c.id = q.client_id
        ORDER BY (q.status = 'pending') DESC, q.id DESC`,
    )
    .all();

  return rows.map((row) => ({
    ...mapQuoteRow(row),
    photos: getQuoteRequestPhotos(row.id),
    client: {
      id: row.client_id,
      fullName: row.full_name || [row.first_name, row.last_name].filter(Boolean).join(" "),
      slug: row.slug,
      cardCode: row.card_code,
      clientType: row.client_type || "bbx",
      isFounder: !!row.is_founder,
      phone: row.phone || null,
      email: row.email || null,
      vehicleModel: row.vehicle_model || null,
      vehiclePlate: row.vehicle_plate || null,
      formulaRemaining: row.formula_remaining ?? 0,
    },
  }));
}

function countPendingQuoteRequests() {
  return (
    db
      .prepare(`SELECT COUNT(*) AS n FROM quote_requests WHERE status = 'pending'`)
      .get().n || 0
  );
}

module.exports = {
  mapQuoteRow,
  createQuoteRequest,
  insertQuoteRequestPhoto,
  getQuoteRequestPhotos,
  getQuoteRequestById,
  getActiveQuoteRequestForClient,
  answerQuoteRequest,
  deleteQuoteRequest,
  listQuoteRequestsForAdmin,
  countPendingQuoteRequests,
};
