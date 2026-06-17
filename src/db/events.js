const { db, nowUnix } = require("./index");
const { getClientById, grantTemporaryFounder } = require("./clients");
const { recordGoodieWin } = require("./goodieWins");
const { rollConsolationGoodie } = require("../config/eventRewards");

function safeParseArray(raw) {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function mapEventRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description || null,
    audience: row.audience || "global",
    startsAt: row.starts_at ?? null,
    endsAt: row.ends_at ?? null,
    isActive: !!row.is_active,
    requireInstagram: !!row.require_instagram,
    requireTiktok: !!row.require_tiktok,
    requireFacebook: !!row.require_facebook,
    requireReview: !!row.require_review,
    conditionsText: row.conditions_text || null,
    conditionsLink: row.conditions_link || null,
    prizeKind: row.prize_kind || "text",
    prizeText: row.prize_text || null,
    prizeInappType: row.prize_inapp_type || null,
    prizeInappAmount: row.prize_inapp_amount ?? null,
    consolationEnabled: !!row.consolation_enabled,
    winnerClientId: row.winner_client_id ?? null,
    drawnAt: row.drawn_at ?? null,
    drawNames: safeParseArray(row.draw_names),
    drawHistory: safeParseArray(row.draw_history),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getEventById(id) {
  return db.prepare(`SELECT * FROM events WHERE id = ? LIMIT 1`).get(id) || null;
}

function listEvents() {
  return db.prepare(`SELECT * FROM events ORDER BY created_at DESC, id DESC`).all();
}

function countParticipants(eventId) {
  const row = db
    .prepare(`SELECT COUNT(*) AS n FROM event_participations WHERE event_id = ?`)
    .get(eventId);
  return row?.n ?? 0;
}

function getActiveEvent() {
  const now = nowUnix();
  return (
    db
      .prepare(
        `
        SELECT * FROM events
        WHERE is_active = 1
          AND (starts_at IS NULL OR starts_at <= ?)
          AND (ends_at IS NULL OR ends_at >= ?)
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      `,
      )
      .get(now, now) || null
  );
}

function clientMatchesAudience(audience, client) {
  if (!client) return false;
  // Les comptes Pro (et Data) n'ont jamais acces aux evenements.
  if (client.client_type !== "bbx") return false;
  if (audience === "global") return true; // tous les bbx (fondateurs inclus)
  if (audience === "founder") return !!client.is_founder;
  if (audience === "bbx") return !client.is_founder;
  return false;
}

function getActiveEventForClient(client) {
  const event = getActiveEvent();
  if (!event) return null;
  if (!clientMatchesAudience(event.audience, client)) return null;
  return event;
}

function getParticipation(eventId, clientId) {
  return (
    db
      .prepare(`SELECT * FROM event_participations WHERE event_id = ? AND client_id = ? LIMIT 1`)
      .get(eventId, clientId) || null
  );
}

function participate(eventId, client, tickets = 1) {
  const event = getEventById(eventId);
  if (!event || !event.is_active) {
    return { ok: false, error: "event_inactive" };
  }
  if (!clientMatchesAudience(event.audience, client)) {
    return { ok: false, error: "not_eligible" };
  }

  const ticketCount = Math.max(1, Math.min(50, Math.floor(Number(tickets) || 1)));
  const existing = getParticipation(eventId, client.id);

  // Deja participe: on met simplement a jour le compteur de tickets (on garde
  // le plus eleve). Pas de nouvelle box de consolation.
  if (existing) {
    const nextTickets = Math.max(Number(existing.tickets || 1), ticketCount);
    if (nextTickets !== Number(existing.tickets || 1)) {
      db.prepare(`UPDATE event_participations SET tickets = ? WHERE id = ?`).run(
        nextTickets,
        existing.id,
      );
    }
    return {
      ok: true,
      created: false,
      tickets: nextTickets,
      consolationKey: existing.consolation_reward,
    };
  }

  // Box de consolation reservee aux fondateurs (les BBX n'en ont pas).
  const goodie =
    event.consolation_enabled && client.is_founder ? rollConsolationGoodie() : null;
  const now = nowUnix();
  db.prepare(
    `INSERT INTO event_participations (event_id, client_id, consolation_reward, tickets, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(eventId, client.id, goodie ? goodie.key : null, ticketCount, now);

  // Lot de consolation physique -> a remettre au prochain RDV a venir.
  let deliveryAppointment = null;
  if (goodie) {
    deliveryAppointment = recordGoodieWin(client.id, "event_consolation", goodie.key, goodie.label);
  }

  return { ok: true, created: true, tickets: ticketCount, consolation: goodie, deliveryAppointment };
}

// Liste des participants d'un evenement (avec leur nombre de tickets), pour l'admin.
function listParticipants(eventId) {
  return db
    .prepare(
      `
      SELECT p.client_id, p.tickets, p.consolation_reward, p.created_at,
             c.full_name, c.card_code, c.is_founder
      FROM event_participations p
      LEFT JOIN clients c ON c.id = p.client_id
      WHERE p.event_id = ?
      ORDER BY p.tickets DESC, p.created_at ASC
    `,
    )
    .all(eventId)
    .map((row) => ({
      clientId: row.client_id,
      clientName: row.full_name || null,
      cardCode: row.card_code || null,
      isFounder: !!row.is_founder,
      tickets: row.tickets ?? 1,
      consolationReward: row.consolation_reward || null,
      createdAt: row.created_at,
    }));
}

function createEvent(input = {}) {
  const now = nowUnix();
  const info = db
    .prepare(
      `
      INSERT INTO events (
        title, description, audience, starts_at, ends_at, is_active,
        require_instagram, require_tiktok, require_facebook, require_review,
        conditions_text, conditions_link, prize_kind, prize_text,
        prize_inapp_type, prize_inapp_amount, consolation_enabled,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    )
    .run(
      input.title || "Evenement",
      input.description || null,
      input.audience || "global",
      input.startsAt ?? null,
      input.endsAt ?? null,
      input.isActive ? 1 : 0,
      input.requireInstagram === false ? 0 : 1,
      input.requireTiktok === false ? 0 : 1,
      input.requireFacebook === false ? 0 : 1,
      input.requireReview === false ? 0 : 1,
      input.conditionsText || null,
      input.conditionsLink || null,
      input.prizeKind === "inapp" ? "inapp" : "text",
      input.prizeText || null,
      input.prizeInappType || null,
      input.prizeInappAmount ?? null,
      input.consolationEnabled === false ? 0 : 1,
      now,
      now,
    );
  if (input.isActive) {
    deactivateOthers(info.lastInsertRowid);
  }
  return getEventById(info.lastInsertRowid);
}

function updateEvent(id, input = {}) {
  const event = getEventById(id);
  if (!event) return null;
  const now = nowUnix();
  db.prepare(
    `
    UPDATE events SET
      title = ?, description = ?, audience = ?, starts_at = ?, ends_at = ?, is_active = ?,
      require_instagram = ?, require_tiktok = ?, require_facebook = ?, require_review = ?,
      conditions_text = ?, conditions_link = ?, prize_kind = ?, prize_text = ?,
      prize_inapp_type = ?, prize_inapp_amount = ?, consolation_enabled = ?, updated_at = ?
    WHERE id = ?
  `,
  ).run(
    input.title ?? event.title,
    input.description ?? event.description,
    input.audience ?? event.audience,
    input.startsAt !== undefined ? input.startsAt : event.starts_at,
    input.endsAt !== undefined ? input.endsAt : event.ends_at,
    input.isActive !== undefined ? (input.isActive ? 1 : 0) : event.is_active,
    input.requireInstagram !== undefined ? (input.requireInstagram ? 1 : 0) : event.require_instagram,
    input.requireTiktok !== undefined ? (input.requireTiktok ? 1 : 0) : event.require_tiktok,
    input.requireFacebook !== undefined ? (input.requireFacebook ? 1 : 0) : event.require_facebook,
    input.requireReview !== undefined ? (input.requireReview ? 1 : 0) : event.require_review,
    input.conditionsText ?? event.conditions_text,
    input.conditionsLink ?? event.conditions_link,
    input.prizeKind ?? event.prize_kind,
    input.prizeText ?? event.prize_text,
    input.prizeInappType ?? event.prize_inapp_type,
    input.prizeInappAmount !== undefined ? input.prizeInappAmount : event.prize_inapp_amount,
    input.consolationEnabled !== undefined ? (input.consolationEnabled ? 1 : 0) : event.consolation_enabled,
    now,
    id,
  );
  if (input.isActive) {
    deactivateOthers(id);
  }
  return getEventById(id);
}

// Un seul evenement actif a la fois.
function deactivateOthers(keepId) {
  db.prepare(`UPDATE events SET is_active = 0, updated_at = ? WHERE id != ?`).run(nowUnix(), keepId);
}

function setActive(id, active) {
  db.prepare(`UPDATE events SET is_active = ?, updated_at = ? WHERE id = ?`).run(
    active ? 1 : 0,
    nowUnix(),
    id,
  );
  if (active) deactivateOthers(id);
  return getEventById(id);
}

function deleteEvent(id) {
  db.prepare(`DELETE FROM events WHERE id = ?`).run(id);
}

function applyInappPrize(client, event) {
  const now = nowUnix();
  const amount = Math.max(0, Number(event.prize_inapp_amount || 0));
  if (event.prize_inapp_type === "bc") {
    db.prepare(`UPDATE clients SET bc_points = COALESCE(bc_points,0) + ?, updated_at = ? WHERE id = ?`).run(
      amount,
      now,
      client.id,
    );
  } else if (event.prize_inapp_type === "credit") {
    db.prepare(
      `UPDATE clients SET formula_total = COALESCE(formula_total,0) + ?, formula_remaining = COALESCE(formula_remaining,0) + ?, updated_at = ? WHERE id = ?`,
    ).run(amount, amount, now, client.id);
  } else if (event.prize_inapp_type === "founder_month") {
    grantTemporaryFounder(client.id, 30);
  }
}

function drawWinner(eventId) {
  const event = getEventById(eventId);
  if (!event) return { ok: false, error: "event_not_found" };

  const participants = db
    .prepare(`SELECT client_id FROM event_participations WHERE event_id = ?`)
    .all(eventId);
  if (participants.length === 0) {
    return { ok: false, error: "no_participants" };
  }

  const winnerId = participants[Math.floor(Math.random() * participants.length)].client_id;
  const now = nowUnix();
  db.prepare(`UPDATE events SET winner_client_id = ?, drawn_at = ?, is_active = 0, updated_at = ? WHERE id = ?`).run(
    winnerId,
    now,
    now,
    eventId,
  );

  if (event.prize_kind === "inapp") {
    const winner = getClientById(winnerId);
    if (winner) applyInappPrize(winner, event);
  }

  return { ok: true, winnerClientId: winnerId, winner: getClientById(winnerId) };
}

// Cree un evenement de test (actif) si la table est vide, pour visualiser
// le rendu. Supprimable/desactivable depuis l'admin.
function ensureTestEvent() {
  const row = db.prepare(`SELECT COUNT(*) AS n FROM events`).get();
  if ((row?.n ?? 0) > 0) return;
  createEvent({
    title: "Grand jeu BlackBox",
    description:
      "Tente de gagner un detailing complet offert ! Suis-nous sur les reseaux, laisse un avis et participe.",
    audience: "global",
    isActive: true,
    conditionsText: "Like et commente notre dernier post Instagram.",
    conditionsLink: "https://www.instagram.com/bryancarsdetailing",
    prizeKind: "text",
    prizeText: "1 detailing complet offert",
    consolationEnabled: true,
  });
}

function getEventDrawNames(eventId) {
  const row = db.prepare(`SELECT draw_names FROM events WHERE id = ? LIMIT 1`).get(eventId);
  return safeParseArray(row?.draw_names);
}

function setEventDrawNames(eventId, names) {
  const clean = (Array.isArray(names) ? names : [])
    .map((name) => String(name || "").trim())
    .filter((name) => name.length > 0)
    .slice(0, 2000);
  db.prepare(`UPDATE events SET draw_names = ?, updated_at = ? WHERE id = ?`).run(
    JSON.stringify(clean),
    nowUnix(),
    eventId,
  );
  return clean;
}

// Liste combinee des noms pour le tirage : participants app + noms ajoutes a la
// main (collage/saisie admin), dedupliquee (insensible a la casse).
function getEventDrawParticipants(eventId) {
  const registered = listParticipants(eventId)
    .map((participant) => (participant.clientName || "").trim())
    .filter((name) => name.length > 0);
  const manual = getEventDrawNames(eventId);
  const seen = new Set();
  const out = [];
  for (const name of [...registered, ...manual]) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

function getEventDrawHistory(eventId) {
  const row = db.prepare(`SELECT draw_history FROM events WHERE id = ? LIMIT 1`).get(eventId);
  return safeParseArray(row?.draw_history);
}

function recordEventDraw(eventId, winners) {
  const event = getEventById(eventId);
  if (!event) return { ok: false, error: "event_not_found" };
  const cleanWinners = (Array.isArray(winners) ? winners : [])
    .map((winner) => String(winner || "").trim())
    .filter((winner) => winner.length > 0);
  const history = safeParseArray(event.draw_history);
  const participantCount = getEventDrawParticipants(eventId).length;
  const now = nowUnix();
  history.unshift({ drawnAt: now, participantCount, winners: cleanWinners });
  db.prepare(
    `UPDATE events SET draw_history = ?, drawn_at = ?, is_active = 0, updated_at = ? WHERE id = ?`,
  ).run(JSON.stringify(history.slice(0, 100)), now, now, eventId);
  return { ok: true, history };
}

module.exports = {
  clientMatchesAudience,
  ensureTestEvent,
  countParticipants,
  createEvent,
  deleteEvent,
  drawWinner,
  getActiveEvent,
  getActiveEventForClient,
  getEventById,
  getParticipation,
  getEventDrawHistory,
  getEventDrawNames,
  getEventDrawParticipants,
  listEvents,
  listParticipants,
  mapEventRow,
  participate,
  recordEventDraw,
  setEventDrawNames,
  setActive,
  updateEvent,
};
