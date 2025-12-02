// src/routes/card.js
const express = require("express");
const router = express.Router();

const { getClientBySlugOrCardCode } = require("../db/clients");
const {
  getAppointmentsForMonth,
  createRequestedAppointment,
  cancelAppointmentForClientOnDate,
} = require("../db/appointments");

// Helper pour extraire "01" de "card01"
function shortCode(value) {
  if (!value) return "";
  const digits = String(value).replace(/\D/g, "");
  return digits || String(value);
}

// Parse m=YYYY-MM
function parseMonthParam(m) {
  if (!m || typeof m !== "string") return null;
  const mMatch = m.match(/^(\d{4})-(\d{2})$/);
  if (!mMatch) return null;
  const year = Number(mMatch[1]);
  const monthIndex = Number(mMatch[2]) - 1; // 0–11
  if (Number.isNaN(year) || Number.isNaN(monthIndex)) return null;
  return { year, monthIndex };
}

// GET /card/:idOrSlug
router.get("/:idOrSlug", (req, res) => {
  const idOrSlug = req.params.idOrSlug;

  const client = getClientBySlugOrCardCode(idOrSlug);
  if (!client) {
    return res.status(404).send(`
      <h1>Carte / client introuvable</h1>
      <p>Aucun client trouvé pour l'identifiant : <strong>${idOrSlug}</strong></p>
    `);
  }

  // Mois à afficher
  const monthParam = parseMonthParam(req.query.m);
  const baseDate = monthParam
    ? new Date(monthParam.year, monthParam.monthIndex, 1)
    : new Date();

  const year = baseDate.getFullYear();
  const monthIndex = baseDate.getMonth();
  const monthLabel = baseDate.toLocaleString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const firstDay = new Date(year, monthIndex, 1);
  const nextMonth = new Date(year, monthIndex + 1, 1);

  // RDV pour ce mois (tous clients)
  const monthAppointments = getAppointmentsForMonth(year, monthIndex);
  const byDate = Object.create(null);
  for (const a of monthAppointments) {
    byDate[a.date] = a; // 1 RDV max / jour
  }

  // Liens prev / next
  const prev = new Date(year, monthIndex - 1, 1);
  const next = new Date(year, monthIndex + 1, 1);
  const prevStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
  const nextStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;

  // Grille de jours
  const daysCells = [];
  for (let d = new Date(firstDay); d < nextMonth; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    const dayNum = d.getDate();
    const ap = byDate[dateStr];

    // libre
    if (!ap) {
      daysCells.push(`
        <form method="POST" action="/card/${encodeURIComponent(
          idOrSlug
        )}/book" style="margin:0;">
          <input type="hidden" name="date" value="${dateStr}" />
          <button class="day day-free" type="submit">
            <div class="day-num">${dayNum}</div>
          </button>
        </form>
      `);
      continue;
    }

    const isMine = ap.client_id === client.id && ap.status !== "cancelled";
    const isActive =
      ap.status === "requested" || ap.status === "confirmed" || ap.status === "done";

    if (isMine && isActive) {
      // RDV de ce client → vert, annulation possible
      daysCells.push(`
        <form method="POST" action="/card/${encodeURIComponent(
          idOrSlug
        )}/cancel" style="margin:0;">
          <input type="hidden" name="date" value="${dateStr}" />
          <button class="day day-self" type="submit">
            <div class="day-num">${dayNum}</div>
            <div class="day-dot day-dot-self"></div>
          </button>
        </form>
      `);
    } else if (isActive) {
      // Pris par quelqu'un d'autre → rouge, non cliquable
      daysCells.push(`
        <div class="day day-busy" title="Créneau indisponible">
          <div class="day-num">${dayNum}</div>
          <div class="day-dot day-dot-busy"></div>
        </div>
      `);
    } else {
      // annulé ou autre → on re-considère comme libre
      daysCells.push(`
        <form method="POST" action="/card/${encodeURIComponent(
          idOrSlug
        )}/book" style="margin:0;">
          <input type="hidden" name="date" value="${dateStr}" />
          <button class="day day-free" type="submit">
            <div class="day-num">${dayNum}</div>
          </button>
        </form>
      `);
    }
  }

  const daysCellsHtml = daysCells.join("");

  const displayName = client.first_name
    ? client.first_name
    : client.full_name || "Client";
  const codeShort = shortCode(client.card_code || client.slug || client.id);

  const hasFormula = client.formula_total > 0;
  const remainingLabel = hasFormula
    ? `${client.formula_remaining} / ${client.formula_total}`
    : `${client.formula_remaining}`;

  res.send(`
    <html>
      <head>
        <meta charset="utf-8" />
        <title>BlackBox — Espace client</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          :root { color-scheme: dark; }
          * { box-sizing: border-box; }

          body {
            margin: 0;
            padding: 16px;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
            background: radial-gradient(circle at top, #020617 0, #020617 40%, #000 100%);
            color: #f9fafb;
            display: flex;
            justify-content: center;
          }

          .page {
            width: 100%;
            max-width: 480px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .section {
            background: rgba(15,23,42,0.98);
            border-radius: 18px;
            padding: 14px 14px 12px;
            border: 1px solid rgba(148,163,184,0.28);
            box-shadow: 0 18px 46px rgba(15,23,42,0.8);
          }

          /* Header / accueil */
          .header-block {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 3px 10px;
            border-radius: 999px;
            border: 1px solid rgba(148,163,184,0.45);
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            color: #9ca3af;
          }
          .welcome-title {
            font-size: 18px;
            margin: 0;
          }
          .welcome-sub {
            font-size: 13px;
            color: #9ca3af;
            margin: 2px 0 0;
          }

          /* Infos client */
          .info-grid {
            display: grid;
            grid-template-columns: 1fr;
            row-gap: 8px;
            font-size: 13px;
            color: #e5e7eb;
          }
          .info-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #6b7280;
            margin-bottom: 2px;
          }
          .info-value {
            font-size: 13px;
          }

          /* Crédits */
          .credits-block {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .credits-main {
            font-size: 16px;
            font-weight: 600;
          }
          .credits-sub {
            font-size: 12px;
            color: #9ca3af;
          }

          /* Agenda */
          .cal-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }
          .cal-head-left {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .cal-title {
            margin: 0;
            font-size: 14px;
          }
          .cal-month {
            font-size: 12px;
            color: #9ca3af;
          }
          .cal-nav {
            display: inline-flex;
            gap: 6px;
          }
          .cal-nav a {
            text-decoration: none;
            font-size: 11px;
            padding: 4px 8px;
            border-radius: 999px;
            border: 1px solid rgba(148,163,184,0.45);
            color: #9ca3af;
            background: rgba(15,23,42,0.9);
          }

          .legend {
            display: flex;
            gap: 10px;
            font-size: 11px;
            color: #9ca3af;
            margin-bottom: 8px;
            flex-wrap: wrap;
          }
          .legend-item {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .legend-color {
            width: 10px;
            height: 10px;
            border-radius: 999px;
          }

          .days-grid {
            display: grid;
            grid-template-columns: repeat(7, minmax(0, 1fr));
            gap: 4px;
          }

          @media (max-width: 420px) {
            .days-grid {
              gap: 3px;
            }
          }

          form { margin: 0; }

          .day {
            width: 100%;
            border-radius: 10px;
            min-height: 42px;
            padding: 4px 2px 6px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(31,41,55,0.9);
            background: #020617;
            transition: border-color 0.15s ease, background 0.15s ease, transform 0.08s ease;
          }
          .day-num {
            font-size: 13px;
            font-weight: 500;
          }

          .day-dot {
            margin-top: 4px;
            width: 6px;
            height: 6px;
            border-radius: 999px;
          }

          .day-free {
            border-color: rgba(75,85,99,0.9);
          }
          .day-free:hover {
            cursor: pointer;
            border-color: #22c55e;
            background: radial-gradient(circle at top, rgba(34,197,94,0.12), #020617 60%);
            transform: translateY(-0.5px);
          }

          .day-self {
            border-color: #22c55e;
            background: radial-gradient(circle at top, rgba(34,197,94,0.18), #022c22 55%, #020617 100%);
          }
          .day-dot-self {
            background: #22c55e;
          }

          .day-busy {
            border-color: #ef4444;
            background: radial-gradient(circle at top, rgba(248,113,113,0.18), #111827 60%, #020617 100%);
          }
          .day-dot-busy {
            background: #ef4444;
          }
          .day-busy .day-num {
            opacity: 0.8;
          }

          .note {
            margin-top: 8px;
            font-size: 11px;
            color: #6b7280;
            line-height: 1.4;
          }
        </style>
      </head>
      <body>
        <main class="page">
          <!-- Accueil -->
          <section class="section">
            <div class="header-block">
              <div class="pill">BlackBox NFC</div>
              <div>
                <h1 class="welcome-title">Bonjour ${displayName},</h1>
                <p class="welcome-sub">
                  Bienvenue dans votre espace privé de suivi detailing.
                </p>
              </div>
            </div>
          </section>

          <!-- Infos client -->
          <section class="section">
            <div class="info-grid">
              <div>
                <div class="info-label">Client</div>
                <div class="info-value">${client.full_name || displayName}</div>
              </div>
              <div>
                <div class="info-label">Carte / code</div>
                <div class="info-value">${client.card_code || client.slug} (${codeShort})</div>
              </div>
              <div>
                <div class="info-label">Véhicule</div>
                <div class="info-value">
                  ${client.vehicle_model || "—"}
                  ${client.vehicle_plate ? " · " + client.vehicle_plate : ""}
                </div>
              </div>
              <div>
                <div class="info-label">Formule</div>
                <div class="info-value">${client.formula_name || "—"}</div>
              </div>
            </div>
          </section>

          <!-- Crédits -->
          <section class="section">
            <div class="credits-block">
              <div class="credits-main">
                Nettoyages restants : ${remainingLabel}
              </div>
              <div class="credits-sub">
                Chaque rendez-vous validé déduira 1 nettoyage de votre forfait.
              </div>
            </div>
          </section>

          <!-- Agenda -->
          <section class="section">
            <div class="cal-head">
              <div class="cal-head-left">
                <p class="cal-title">Agenda</p>
                <p class="cal-month">${monthLabel}</p>
              </div>
              <div class="cal-nav">
                <a href="/card/${encodeURIComponent(idOrSlug)}?m=${prevStr}">&lt; Préc.</a>
                <a href="/card/${encodeURIComponent(idOrSlug)}?m=${nextStr}">Suiv. &gt;</a>
              </div>
            </div>

            <div class="legend">
              <div class="legend-item">
                <span class="legend-color" style="background:#020617;border:1px solid #4b5563;"></span>
                <span>Disponible</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background:#22c55e;"></span>
                <span>Vos rendez-vous</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background:#ef4444;"></span>
                <span>Indisponible</span>
              </div>
            </div>

            <div class="days-grid">
              ${daysCellsHtml}
            </div>

            <div class="note">
              Touchez un jour disponible pour demander un rendez-vous. <br />
              Vos rendez-vous apparaissent en vert. Les jours déjà pris par d'autres clients sont en rouge.
            </div>
          </section>
        </main>
      </body>
    </html>
  `);
});

// POST /card/:idOrSlug/book — demande de RDV
router.post("/:idOrSlug/book", (req, res) => {
  const idOrSlug = req.params.idOrSlug;
  const client = getClientBySlugOrCardCode(idOrSlug);
  if (!client) {
    return res.redirect(`/card/${encodeURIComponent(idOrSlug)}`);
  }

  const date = (req.body && req.body.date) || null;
  if (!date) {
    return res.redirect(`/card/${encodeURIComponent(idOrSlug)}`);
  }

  // Si plus de nettoyages restants → à raffiner (message utilisateur, etc.)
  if (client.formula_remaining <= 0) {
    return res.redirect(`/card/${encodeURIComponent(idOrSlug)}?m=${date.slice(0, 7)}`);
  }

  try {
    createRequestedAppointment(client.id, date, null);
  } catch (e) {
    console.warn("[BOOK] Erreur createRequestedAppointment:", e.message);
  }

  res.redirect(`/card/${encodeURIComponent(idOrSlug)}?m=${date.slice(0, 7)}`);
});

// POST /card/:idOrSlug/cancel — annulation de RDV par le client
router.post("/:idOrSlug/cancel", (req, res) => {
  const idOrSlug = req.params.idOrSlug;
  const client = getClientBySlugOrCardCode(idOrSlug);
  if (!client) {
    return res.redirect(`/card/${encodeURIComponent(idOrSlug)}`);
  }

  const date = (req.body && req.body.date) || null;
  if (!date) {
    return res.redirect(`/card/${encodeURIComponent(idOrSlug)}`);
  }

  cancelAppointmentForClientOnDate(client.id, date);
  res.redirect(`/card/${encodeURIComponent(idOrSlug)}?m=${date.slice(0, 7)}`);
});

module.exports = router;
