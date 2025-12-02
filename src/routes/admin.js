// src/routes/admin.js
const express = require("express");
const router = express.Router();

const { CARDS, shortId, assignCard } = require("../data/cards");
const { SLOTS, setSlotReservation, describeSlot } = require("../data/slots");

// GET /admin -> panneau admin
router.get("/", (req, res) => {
  const cardsRows = CARDS.map((c) => {
    return `
      <tr>
        <td>${c.id}</td>
        <td>${c.ownerName}</td>
        <td>${c.notes || ""}</td>
        <td>${shortId(c.id)}</td>
      </tr>
    `;
  }).join("");

  const slotsRows = SLOTS.map((s) => {
    const label = describeSlot(s);
    return `
      <tr>
        <td>${s.date}</td>
        <td>${label}</td>
      </tr>
    `;
  }).join("");

  res.send(`
    <html>
      <head>
        <meta charset="utf-8" />
        <title>BlackBox — Admin</title>
        <style>
          :root { color-scheme: dark; }
          body {
            margin: 0;
            padding: 32px;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
            background: #020617;
            color: #e5e7eb;
          }
          .layout {
            max-width: 1120px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 24px;
          }
          .header {
            max-width: 1120px;
            margin: 0 auto 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .title-block h1 {
            margin: 0 0 4px;
            font-size: 24px;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }
          .title-block p {
            margin: 0;
            font-size: 13px;
            color: #9ca3af;
          }
          .tag {
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            border: 1px solid rgba(148,163,184,0.4);
            color: #9ca3af;
          }
          .card {
            background: rgba(15,23,42,0.95);
            border-radius: 16px;
            padding: 18px 18px 14px;
            border: 1px solid rgba(148,163,184,0.25);
            box-shadow: 0 20px 60px rgba(15,23,42,0.9);
          }
          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }
          .card-header h2 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
          }
          .card-header p {
            margin: 0;
            font-size: 12px;
            color: #9ca3af;
          }
          form {
            margin-bottom: 12px;
            display: grid;
            grid-template-columns: 1fr;
            gap: 8px;
            font-size: 13px;
          }
          label span {
            display: block;
            margin-bottom: 2px;
            font-size: 12px;
            color: #9ca3af;
          }
          input, select {
            width: 100%;
            padding: 6px 8px;
            border-radius: 8px;
            border: 1px solid rgba(148,163,184,0.6);
            background: #020617;
            color: #e5e7eb;
            font-size: 13px;
            outline: none;
          }
          input:focus, select:focus {
            border-color: #38bdf8;
            box-shadow: 0 0 0 1px rgba(56,189,248,0.25);
          }
          button {
            padding: 7px 10px;
            border-radius: 999px;
            border: none;
            font-size: 13px;
            font-weight: 500;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            background: linear-gradient(135deg, #0ea5e9, #22c55e);
            color: #0b1120;
            cursor: pointer;
          }
          button:hover { filter: brightness(1.1); }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            font-size: 12px;
          }
          th, td {
            border-bottom: 1px solid rgba(31,41,55,0.8);
            padding: 4px 6px;
            text-align: left;
          }
          th {
            font-weight: 500;
            color: #9ca3af;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          tr:last-child td { border-bottom: none; }
          .subtext {
            font-size: 11px;
            color: #6b7280;
            margin-top: 2px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title-block">
            <h1>BlackBox — Admin</h1>
            <p>Pilotage des cartes NFC et de l’agenda.</p>
          </div>
          <div class="tag">Admin Panel</div>
        </div>
        <div class="layout">
          <div class="card">
            <div class="card-header">
              <div>
                <h2>Cartes</h2>
                <p>Associer une carte à un propriétaire.</p>
              </div>
            </div>
            <form method="POST" action="/admin/assign-card">
              <div>
                <label>
                  <span>Carte</span>
                  <select name="cardId" required>
                    ${CARDS.map(c => `<option value="${c.id}">${c.id} — ${c.ownerName}</option>`).join("")}
                  </select>
                </label>
              </div>
              <div>
                <label>
                  <span>Nom complet</span>
                  <input type="text" name="ownerName" placeholder="Prénom Nom" required />
                </label>
              </div>
              <div>
                <label>
                  <span>Notes</span>
                  <input type="text" name="notes" placeholder="Infos complémentaires" />
                </label>
              </div>
              <div>
                <button type="submit">Enregistrer</button>
              </div>
            </form>
            <div class="subtext">
              Le code court entre parenthèses (ex: 01) est ce qui sera affiché dans l’agenda.
            </div>
            <table>
              <thead>
                <tr>
                  <th>ID carte</th>
                  <th>Propriétaire</th>
                  <th>Notes</th>
                  <th>Code court</th>
                </tr>
              </thead>
              <tbody>
                ${cardsRows}
              </tbody>
            </table>
          </div>

          <div class="card">
            <div class="card-header">
              <div>
                <h2>Agenda</h2>
                <p>Un slot par jour, réservé pour une carte.</p>
              </div>
            </div>
            <form method="POST" action="/admin/update-slot">
              <div>
                <label>
                  <span>Date</span>
                  <input type="date" name="date" required />
                </label>
              </div>
              <div>
                <label>
                  <span>Réservée par</span>
                  <select name="cardId">
                    <option value="">Libre (neutre)</option>
                    ${CARDS.map(c => `<option value="${c.id}">${c.ownerName} (${shortId(c.id)})</option>`).join("")}
                  </select>
                </label>
              </div>
              <div>
                <button type="submit">Mettre à jour le jour</button>
              </div>
            </form>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>État</th>
                </tr>
              </thead>
              <tbody>
                ${slotsRows}
              </tbody>
            </table>
          </div>
        </div>
      </body>
    </html>
  `);
});

// POST /admin/assign-card
router.post("/assign-card", (req, res) => {
  const { cardId, ownerName, notes } = req.body || {};
  if (cardId && ownerName) {
    assignCard(cardId, ownerName, notes);
  }
  res.redirect("/admin");
});

// POST /admin/update-slot
router.post("/update-slot", (req, res) => {
  const { date, cardId } = req.body || {};
  if (date) {
    setSlotReservation(date, cardId || null);
  }
  res.redirect("/admin");
});

module.exports = router;
