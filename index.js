const express = require("express");
const path = require("path");

const app = express();

// Pour pouvoir lire les données des formulaires POST
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ─────────────────────────────────────────────
// "Pseudo base de données" en mémoire
// (plus tard => vraie DB)
// ─────────────────────────────────────────────

// 25 cartes au max (on en met quelques unes pour la maquette)
const CARDS = [
  { id: "card01", ownerName: "Non assignée", notes: "" },
  { id: "card02", ownerName: "Non assignée", notes: "" },
  { id: "card03", ownerName: "Non assignée", notes: "" },
  { id: "card04", ownerName: "Non assignée", notes: "" },
  { id: "card05", ownerName: "Non assignée", notes: "" },
  // … tu pourras compléter jusqu'à 25
];

// Slots d’agenda en mémoire
// Pour la démo : on génère les jours du mois courant
const SLOTS = generateMonthSlots(new Date()); // tableau de { date, reservedBy? }

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
  // exemple de démo : une journée déjà prise par card02
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

// ─────────────────────────────────────────────
// Page d’accueil (optionnelle)
// ─────────────────────────────────────────────

app.get("/", (req, res) => {
  res.send(`
    <h1>BlackBox — NFC</h1>
    <p>Serveur en ligne.</p>
    <ul>
      <li><a href="/admin">Accès admin</a></li>
      <li>Exemple carte : <a href="/card/card01">/card/card01</a></li>
    </ul>
  `);
});

// ─────────────────────────────────────────────
// 1) PAGE ADMIN — gestion cartes + agenda
// URL: /admin
// ─────────────────────────────────────────────

app.get("/admin", (req, res) => {
  const cardsRows = CARDS.map((c) => {
    return `
      <tr>
        <td>${c.id}</td>
        <td>${c.ownerName || ""}</td>
        <td>${c.notes || ""}</td>
      </tr>
    `;
  }).join("");

  const slotsRows = SLOTS.map((s) => {
    const card = s.reservedBy ? findCardById(s.reservedBy) : null;
    const label = card ? `${card.ownerName} (${card.id})` : "Libre";
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
          body { font-family: sans-serif; margin: 20px; background:#f5f5f5; }
          h1, h2 { margin-bottom: 0.5rem; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 2rem; background:white; }
          th, td { border: 1px solid #ccc; padding: 4px 8px; font-size: 14px; }
          th { background: #eee; }
          form { margin-bottom: 2rem; padding: 10px; background:white; border:1px solid #ddd; }
          input, select { padding: 4px 6px; margin: 2px 0; }
          button { padding: 4px 8px; cursor:pointer; }
        </style>
      </head>
      <body>
        <h1>BlackBox — Admin</h1>

        <h2>Associer une carte à une personne</h2>
        <form method="POST" action="/admin/assign-card">
          <label>
            Carte :
            <select name="cardId">
              ${CARDS.map(c => `<option value="${c.id}">${c.id} (${c.ownerName})</option>`).join("")}
            </select>
          </label>
          <br/>
          <label>
            Nom complet :
            <input type="text" name="ownerName" placeholder="Prénom Nom" required />
          </label>
          <br/>
          <label>
            Notes :
            <input type="text" name="notes" placeholder="Infos libres" />
          </label>
          <br/>
          <button type="submit">Enregistrer</button>
        </form>

        <h2>Cartes enregistrées</h2>
        <table>
          <thead>
            <tr>
              <th>ID carte</th>
              <th>Propriétaire</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${cardsRows}
          </tbody>
        </table>

        <h2>Agenda (mois courant)</h2>
        <form method="POST" action="/admin/update-slot">
          <label>
            Date (YYYY-MM-DD) :
            <input type="date" name="date" required />
          </label>
          <br/>
          <label>
            Réservée par :
            <select name="cardId">
              <option value="">-- Personne (libre) --</option>
              ${CARDS.map(c => `<option value="${c.id}">${c.id} (${c.ownerName})</option>`).join("")}
            </select>
          </label>
          <br/>
          <button type="submit">Mettre à jour le jour</button>
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
      </body>
    </html>
  `);
});

// POST: assigner une carte à une personne
app.post("/admin/assign-card", (req, res) => {
  const { cardId, ownerName, notes } = req.body || {};
  const card = findCardById(cardId);
  if (card) {
    card.ownerName = ownerName || card.ownerName;
    card.notes = notes || "";
  }
  // simple redirect
  res.redirect("/admin");
});

// POST: mettre à jour un jour (libre / réservé par X)
app.post("/admin/update-slot", (req, res) => {
  const { date, cardId } = req.body || {};
  const slot = getSlotByDate(date);
  if (!slot) {
    // si la date n'existe pas dans le mois courant, on ignore
    return res.redirect("/admin");
  }
  slot.reservedBy = cardId || undefined; // vide => libre (neutre)
  res.redirect("/admin");
});

// ─────────────────────────────────────────────
// 2) PAGE UTILISATEUR — vue carte + agenda
// URL: /card/:cardId
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

  // Construire la grille de jours avec les couleurs
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthName = today.toLocaleString("fr-FR", { month: "long", year: "numeric" });

  const monthSlots = SLOTS; // pour l'instant : mois courant uniquement

  const daysCells = monthSlots.map((slot) => {
    const dateStr = slot.date;
    const dayNum = Number(dateStr.split("-")[2]);
    let color = "#000000"; // neutre noir
    let label = "Disponible";

    if (slot.reservedBy) {
      if (slot.reservedBy === cardId) {
        color = "green";
        label = "Votre rendez-vous";
      } else {
        color = "red";
        label = "Déjà réservé";
      }
    }

    return `
      <div class="day" style="border-color:${color}">
        <div class="day-num">${dayNum}</div>
        <div class="day-label" style="color:${color}">${label}</div>
      </div>
    `;
  }).join("");

  res.send(`
    <html>
      <head>
        <meta charset="utf-8" />
        <title>BlackBox — Carte ${card.id}</title>
        <style>
          body { font-family: sans-serif; margin: 20px; background:#111; color:white; }
          .card-header {
            padding: 12px 16px;
            background:#222;
            border-radius:8px;
            margin-bottom:16px;
          }
          .card-header h1 { margin:0 0 4px 0; }
          .card-header p { margin:2px 0; }
          .info-block {
            background:#222;
            border-radius:8px;
            padding:10px 16px;
            margin-bottom:16px;
          }
          .calendar {
            background:#222;
            border-radius:8px;
            padding:16px;
          }
          .days-grid {
            display:grid;
            grid-template-columns: repeat(7, minmax(0, 1fr));
            gap:8px;
            margin-top:10px;
          }
          .day {
            border:2px solid #444;
            border-radius:6px;
            min-height:60px;
            padding:4px;
            display:flex;
            flex-direction:column;
            justify-content:center;
            align-items:center;
            background:#000;
          }
          .day-num {
            font-size:16px;
            font-weight:bold;
          }
          .day-label {
            font-size:10px;
          }
          .legend {
            display:flex;
            gap:12px;
            margin-top:8px;
            font-size:12px;
          }
          .legend-item {
            display:flex;
            align-items:center;
            gap:4px;
          }
          .legend-color {
            width:12px;
            height:12px;
            border-radius:3px;
            display:inline-block;
          }
        </style>
      </head>
      <body>
        <div class="card-header">
          <h1>Bienvenue ${card.ownerName}</h1>
          <p>Carte : <strong>${card.id}</strong></p>
          ${card.notes ? `<p>Infos : ${card.notes}</p>` : ""}
        </div>

        <div class="info-block">
          <h2>Vos informations</h2>
          <p>(Ici on mettra plus tard : téléphone, e-mail, type de carte, etc.)</p>
        </div>

        <div class="calendar">
          <h2>Agenda — ${monthName}</h2>
          <div class="legend">
            <div class="legend-item">
              <span class="legend-color" style="background:#000;border:2px solid #000;"></span> Disponible (neutre)
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background:red;"></span> Réservé par quelqu'un d'autre
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background:green;"></span> Vos rendez-vous
            </div>
          </div>
          <div class="days-grid">
            ${daysCells}
          </div>
        </div>
      </body>
    </html>
  `);
});

// ─────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server listening on port " + PORT);
});
