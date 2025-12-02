// src/routes/card.js
const express = require("express");
const router = express.Router();

const { findCardById, shortId } = require("../data/cards");
const { SLOTS, isSlotFreeOrMine, setSlotReservation } = require("../data/slots");

// GET /card/:cardId
router.get("/:cardId", (req, res) => {
  const cardId = req.params.cardId;
  const card = findCardById(cardId);

  if (!card) {
    return res.status(404).send(`
      <h1>Carte inconnue</h1>
      <p>Aucune carte trouvée pour l'ID : <strong>${cardId}</strong></p>
    `);
  }

  const today = new Date();
  const monthName = today.toLocaleString("fr-FR", { month: "long", year: "numeric" });

  const daysCells = SLOTS.map((slot) => {
    const dateStr = slot.date;
    const dayNum = Number(dateStr.split("-")[2]);

    if (!slot.reservedBy) {
      // Jour libre → case clickable pour réserver
      return `
        <form method="POST" action="/card/${card.id}/book" style="margin:0;">
          <input type="hidden" name="date" value="${dateStr}" />
          <button class="day day-free" type="submit">
            <div class="day-num">${dayNum}</div>
            <div class="day-label">Disponible</div>
          </button>
        </form>
      `;
    }

    const isMine = slot.reservedBy === card.id;
    const colorClass = isMine ? "day-self" : "day-busy";
    const label = isMine ? "Votre rendez-vous" : "Indisponible";

    return `
      <div class="day ${colorClass}">
        <div class="day-num">${dayNum}</div>
        <div class="day-label">${label}</div>
      </div>
    `;
  }).join("");

  res.send(`
    <html>
      <head>
        <meta charset="utf-8" />
        <title>BlackBox — Carte ${card.id}</title>
        <style>
          :root { color-scheme: dark; }
          body {
            margin: 0;
            padding: 24px;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
            background: radial-gradient(circle at top, #020617 0, #020617 40%, #000 100%);
            color: #f9fafb;
          }
          .shell {
            max-width: 960px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
            gap: 20px;
          }
          .header {
            max-width: 960px;
            margin: 0 auto 20px;
          }
          .header-title {
            font-size: 22px;
            text-transform: uppercase;
            letter-spacing: 0.18em;
            color: #9ca3af;
            margin-bottom: 4px;
          }
          .header-sub {
            font-size: 13px;
            color: #6b7280;
          }
          .pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            border-radius: 999px;
            border: 1px solid rgba(148,163,184,0.35);
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            color: #9ca3af;
          }
          .card-panel {
            background: rgba(15,23,42,0.96);
            border-radius: 18px;
            padding: 18px 18px 14px;
            border: 1px solid rgba(148,163,184,0.4);
            box-shadow: 0 20px 70px rgba(15,23,42,1);
          }
          .card-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
          }
          .card-top h1 {
            margin: 0;
            font-size: 20px;
          }
          .card-top p {
            margin: 2px 0 0;
            font-size: 13px;
            color: #9ca3af;
          }
          .chip {
            padding: 6px 10px;
            border-radius: 999px;
            background: rgba(15,23,42,0.9);
            border: 1px solid rgba(55,65,81,0.9);
            font-size: 11px;
          }
          .info-block {
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px dashed rgba(55,65,81,0.8);
            font-size: 13px;
            color: #9ca3af;
          }
          .info-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #6b7280;
          }
          .info-main {
            font-size: 14px;
            color: #e5e7eb;
          }
          .calendar-panel {
            background: rgba(15,23,42,0.94);
            border-radius: 18px;
            padding: 18px 18px 14px;
            border: 1px solid rgba(148,163,184,0.35);
            box-shadow: 0 20px 60px rgba(15,23,42,0.9);
          }
          .cal-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }
          .cal-head h2 {
            margin: 0;
            font-size: 16px;
          }
          .cal-head span {
            font-size: 12px;
            color: #9ca3af;
          }
          .legend {
            display: flex;
            gap: 10px;
            font-size: 11px;
            color: #9ca3af;
            margin-bottom: 10px;
          }
          .legend-item {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .legend-color {
            width: 12px;
            height: 12px;
            border-radius: 4px;
          }
          .days-grid {
            display: grid;
            grid-template-columns: repeat(7, minmax(0, 1fr));
            gap: 6px;
          }
          form { margin: 0; }
          .day {
            width: 100%;
            border-radius: 10px;
            min-height: 56px;
            padding: 4px 4px 6px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(31,41,55,0.9);
            background: radial-gradient(circle at top, #020617, #020617 45%, #000 100%);
          }
          .day-num {
            font-size: 15px;
            font-weight: 600;
            margin-bottom: 2px;
          }
          .day-label {
            font-size: 10px;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          .day-free {
            border-color: #22c55e;
            background: radial-gradient(circle at top, rgba(34,197,94,0.16), #020617 55%, #000 100%);
          }
          .day-free .day-label {
            color: #a7f3d0;
          }
          .day-free:hover {
            cursor: pointer;
            filter: brightness(1.08);
            box-shadow: 0 0 0 1px rgba(34,197,94,0.4);
          }
          .day-self {
            border-color: #22c55e;
            background: radial-gradient(circle at top, rgba(34,197,94,0.25), #022c22 55%, #000 100%);
          }
          .day-self .day-label {
            color: #bbf7d0;
          }
          .day-busy {
            border-color: #ef4444;
            background: radial-gradient(circle at top, rgba(248,113,113,0.18), #020617 55%, #000 100%);
          }
          .day-busy .day-label {
            color: #fecaca;
          }
          .day-busy .day-num {
            opacity: 0.75;
          }
          .note {
            margin-top: 8px;
            font-size: 11px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="pill">BlackBox NFC</div>
          <div class="header-title">Votre carte</div>
          <div class="header-sub">Vue personnalisée de votre carte et des disponibilités.</div>
        </div>

        <div class="shell">
          <div class="card-panel">
            <div class="card-top">
              <div>
                <h1>Bienvenue ${card.ownerName}</h1>
                <p>Carte <strong>${card.id}</strong> · Code <strong>${shortId(card.id)}</strong></p>
              </div>
              <div class="chip">Accès carte NFC</div>
            </div>
            <div class="info-block">
              <div class="info-label">Informations</div>
              <div class="info-main">
                ${card.notes ? card.notes : "Aucune information supplémentaire enregistrée pour le moment."}
              </div>
            </div>
            <div class="info-block">
              <div class="info-label">Fonctionnement des réservations</div>
              <div class="info-main">
                Touchez un jour disponible pour demander ce créneau.
              </div>
            </div>
          </div>

          <div class="calendar-panel">
            <div class="cal-head">
              <div>
                <h2>Agenda</h2>
                <span>${monthName}</span>
              </div>
            </div>
            <div class="legend">
              <div class="legend-item">
                <span class="legend-color" style="background:#020617;border:1px solid #4b5563;"></span> Disponible
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background:#22c55e;"></span> Vos rendez-vous
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background:#ef4444;"></span> Déjà réservé
              </div>
            </div>
            <div class="days-grid">
              ${daysCells}
            </div>
            <div class="note">
              Une fois un jour réservé, il apparaît en rouge pour les autres cartes, et en vert pour vous.
            </div>
          </div>
        </div>
      </body>
    </html>
  `);
});

// POST /card/:cardId/book — réservation côté utilisateur
router.post("/:cardId/book", (req, res) => {
  const cardId = req.params.cardId;
  const { date } = req.body || {};

  if (!date) {
    return res.redirect(`/card/${cardId}`);
  }

  if (!isSlotFreeOrMine(date, cardId)) {
    // déjà réservé par quelqu'un d'autre → on ne touche pas
    return res.redirect(`/card/${cardId}`);
  }

  setSlotReservation(date, cardId);
  res.redirect(`/card/${cardId}`);
});

module.exports = router;
