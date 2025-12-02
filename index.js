const express = require("express");
const app = express();

// Pour lire les données de formulaires
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ─────────────────────────────────────────────
// "Pseudo base de données" en mémoire
// (on migrera plus tard vers une vraie DB)
// ─────────────────────────────────────────────

// Cartes connues (25 au max plus tard)
const CARDS = [
  { id: "card01", ownerName: "Non assignée", notes: "" },
  { id: "card02", ownerName: "Non assignée", notes: "" },
  { id: "card03", ownerName: "Non assignée", notes: "" },
  { id: "card04", ownerName: "Non assignée", notes: "" },
  { id: "card05", ownerName: "Non assignée", notes: "" },
  // tu pourras compléter jusqu'à card25
];

// Slots d’agenda pour le mois courant
const SLOTS = generateMonthSlots(new Date()); // { date, reservedBy? }

// Admin user (squelette futur login, non branché à /admin pour l’instant)
const ADMIN_USER = {
  username: "admin",
  password: "admin",
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function generateMonthSlots(baseDate) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth(); // 0-11

  const firstDay = new Date(year, month, 1);
  const nextMonth = new Date(year, month + 1, 1);

  const slots = [];
  for (let d = new Date(firstDay); d < nextMonth; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
    slots.push({ date: dateStr, reservedBy: undefined });
  }

  // Exemple de démo : 2 jours déjà pris
  if (slots[2]) slots[2].reservedBy = "card02";
  if (slots[5]) slots[5].reservedBy = "card01";

  return slots;
}

function findCardById(cardId) {
  return CARDS.find((c) => c.id === cardId);
}

function getSlotByDate(dateStr) {
  return SLOTS.find((s) => s.date === dateStr);
}

// pour afficher "Nom (01)" au lieu de "card01"
function shortId(cardId) {
  const digits = cardId.replace(/\D/g, "");
  if (!digits) return cardId;
  return digits; // ex: "01"
}

// ─────────────────────────────────────────────
// Page d’accueil (juste pour debug)
// ─────────────────────────────────────────────

app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <meta charset="utf-8" />
        <title>BlackBox — Accueil</title>
        <style>
          body {
            margin: 0;
            padding: 40px;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
            background: #050509;
            color: #f9fafb;
          }
          .card {
            max-width: 480px;
            margin: 0 auto;
            background: radial-gradient(circle at top, #111827, #020617);
            border-radius: 16px;
            padding: 24px 24px 20px;
            box-shadow: 0 24px 80px rgba(0,0,0,0.6);
            border: 1px solid rgba(148,163,184,0.25);
          }
          h1 {
            font-size: 22px;
            margin: 0 0 8px;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: #e5e7eb;
          }
          p {
            margin: 4px 0;
            color: #9ca3af;
            font-size: 14px;
          }
          a {
            color: #38bdf8;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          .links {
            margin-top: 16px;
            border-top: 1px solid rgba(148,163,184,0.2);
            padding-top: 12px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>BlackBox NFC</h1>
          <p>Serveur en ligne.</p>
          <div class="links">
            <p><strong>Admin :</strong> <a href="/admin">/admin</a></p>
            <p><strong>Exemple carte :</strong> <a href="/card/card01">/card/card01</a></p>
          </div>
        </div>
      </body>
    </html>
  `);
});

// ─────────────────────────────────────────────
// PAGE ADMIN — /admin
// ─────────────────────────────────────────────

app.get("/admin", (req, res) => {
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
    const card = s.reservedBy ? findCardById(s.reservedBy) : null;
    const label = card ? `${card.ownerName} (${shortId(card.id)})` : "Libre";
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
          :root {
            color-scheme: dark;
          }
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
          button:hover {
            filter: brightness(1.1);
          }
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
          tr:last-child td {
            border-bottom: none;
          }
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
            <p>Pilotage des cartes NFC et de l’agenda depuis un seul panneau.</p>
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
            <div class="subtext">Astuce : le code court entre parenthèses est ce qui sera affiché sur l’agenda (ex: Lucas (01)).</div>
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

// Associer carte -> personne
app.post("/admin/assign-card", (req, res) => {
  const { cardId, ownerName, notes } = req.body || {};
  const card = findCardById(cardId);
  if (card) {
    card.ownerName = ownerName || card.ownerName;
    card.notes = notes || "";
  }
  res.redirect("/admin");
});

// Modifier un slot (libre / réservé pour carte X)
app.post("/admin/update-slot", (req, res) => {
  const { date, cardId } = req.body || {};
  const slot = getSlotByDate(date);
  if (!slot) {
    return res.redirect("/admin");
  }
  slot.reservedBy = cardId || undefined;
  res.redirect("/admin");
});

// ─────────────────────────────────────────────
// PAGE UTILISATEUR — /card/:cardId
// ─────────────────────────────────────────────

app.get("/card/:cardId", (req, res) => {
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

    // Jour réservé
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
          :root {
            color-scheme: dark;
          }
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
          .card-top main-title {
            display: block;
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
          form {
            margin: 0;
          }
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

// POST : l’utilisateur réserve un jour donné s’il est dispo
app.post("/card/:cardId/book", (req, res) => {
  const cardId = req.params.cardId;
  const { date } = req.body || {};
  const card = findCardById(cardId);
  const slot = getSlotByDate(date);

  if (!card || !slot) {
    return res.redirect(`/card/${cardId}`);
  }

  // Si déjà réservé par quelqu’un, on ne touche pas (premier arrivé, premier servi)
  if (slot.reservedBy && slot.reservedBy !== cardId) {
    return res.redirect(`/card/${cardId}`);
  }

  // Libre ou déjà à cette carte → on pose / garde la réservation pour cette carte
  slot.reservedBy = cardId;
  res.redirect(`/card/${cardId}`);
});

// ─────────────────────────────────────────────
// SQUELETTE LOGIN ADMIN (non relié à /admin)
// ─────────────────────────────────────────────

app.get("/login", (req, res) => {
  res.send(`
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Connexion admin</title>
        <style>
          body {
            margin: 0;
            padding: 40px;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
            background: #020617;
            color: #e5e7eb;
          }
          .card {
            max-width: 360px;
            margin: 0 auto;
            background: rgba(15,23,42,0.96);
            border-radius: 16px;
            padding: 20px;
            border: 1px solid rgba(148,163,184,0.4);
          }
          h1 {
            margin: 0 0 12px;
            font-size: 18px;
          }
          label span {
            display: block;
            margin-bottom: 2px;
            font-size: 12px;
            color: #9ca3af;
          }
          input {
            width: 100%;
            padding: 6px 8px;
            border-radius: 8px;
            border: 1px solid rgba(148,163,184,0.6);
            background: #020617;
            color: #e5e7eb;
            font-size: 13px;
            outline: none;
          }
          input:focus {
            border-color: #38bdf8;
            box-shadow: 0 0 0 1px rgba(56,189,248,0.25);
          }
          button {
            margin-top: 10px;
            padding: 7px 10px;
            border-radius: 999px;
            border: none;
            font-size: 13px;
            font-weight: 500;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            background: linear-gradient(135deg, #0ea5e9, #6366f1);
            color: #0b1120;
            cursor: pointer;
          }
          p {
            margin-top: 10px;
            font-size: 11px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Connexion admin</h1>
          <form method="POST" action="/login">
            <label>
              <span>Nom d'utilisateur</span>
              <input name="username" type="text" value="admin" />
            </label>
            <br/>
            <label>
              <span>Mot de passe</span>
              <input name="password" type="password" value="admin" />
            </label>
            <button type="submit">Se connecter</button>
          </form>
          <p>Pour l’instant, cette connexion n’est pas encore reliée techniquement à /admin. On branchera une vraie session plus tard.</p>
        </div>
      </body>
    </html>
  `);
});

app.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER.username && password === ADMIN_USER.password) {
    // Plus tard : on mettra ici une vraie session + redirection vers /admin
    return res.send(`
      <p>Connexion réussie pour <strong>${username}</strong> (squelette, non encore relié à /admin).</p>
      <p><a href="/admin">Aller au panneau admin</a></p>
    `);
  }
  res.send(`
    <p>Identifiants invalides.</p>
    <p><a href="/login">Réessayer</a></p>
  `);
});

// ─────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server listening on port " + PORT);
});
