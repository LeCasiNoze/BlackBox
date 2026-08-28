const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const express = require("express");
const {
  EXPORTS_DIR,
  FOUNDERS_UPLOAD_DIR,
  QUOTES_UPLOAD_DIR,
  UPLOADS_DIR,
  ensureDir,
} = require("./config/storage");
const {
  requireAdminApiAuth,
  requireAdminPageAuth,
} = require("./auth/adminSession");

const authRoutes = require("./routes/auth");
const clientApiRoutes = require("./routes/clientApi");
const adminApiRoutes = require("./routes/adminApi");
const paymentRoutes = require("./routes/payments");
const { ensureDemoClient, renumberCardCodes, expireTemporaryFounders } = require("./db/clients");
const { getCompanyInfo } = require("./db/settings");
const { startAppointmentReminderScheduler } = require("./services/appointmentReminderScheduler");
const { startWeeklyExportScheduler } = require("./services/weeklyExportScheduler");
const { startInactivityReminderScheduler } = require("./services/inactivityReminderScheduler");
const { startReviewRequestScheduler } = require("./services/reviewRequestScheduler");
const { startQuoteReminderScheduler } = require("./services/quoteReminderScheduler");
const { startAppointmentQuoteExpiryScheduler } = require("./services/appointmentQuoteExpiryScheduler");
const { sendSeoHtml } = require("./services/seoRenderer");

if (process.env.SEED_DEMO_CLIENT === "true") {
  ensureDemoClient();
}

// Renumerote les codes carte BBX dans l'ordre de creation (canonique).
try {
  const changed = renumberCardCodes();
  if (changed > 0) {
    console.log(`[DB] Codes carte renumerotes pour ${changed} compte(s) BBX.`);
  }
} catch (error) {
  console.warn("[DB] Renumerotation codes carte ignoree:", error.message);
}

// Evenement de test (visible) si aucun evenement n'existe encore.
try {
  require("./db/events").ensureTestEvent();
} catch (error) {
  console.warn("[DB] ensureTestEvent ignore:", error.message);
}

// Expire les acces fondateur temporaires arrives a terme.
try {
  expireTemporaryFounders();
} catch (error) {
  console.warn("[DB] expireTemporaryFounders ignore:", error.message);
}

const app = express();
const distDir = path.join(__dirname, "../web/dist");
ensureDir(UPLOADS_DIR);
ensureDir(FOUNDERS_UPLOAD_DIR);
ensureDir(QUOTES_UPLOAD_DIR);
ensureDir(EXPORTS_DIR);
startAppointmentReminderScheduler();
startWeeklyExportScheduler();
startInactivityReminderScheduler();
startReviewRequestScheduler();
startQuoteReminderScheduler();
startAppointmentQuoteExpiryScheduler();

// Protections HTTP sans impact sur le parcours de connexion existant.
app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Consolide les signaux d'indexation sur le domaine canonique sans perturber
// les appels API non-GET ou le développement local.
app.use((req, res, next) => {
  const hostname = String(req.hostname || "").toLowerCase();
  const legacyHost = hostname === "www.blackboxbc.com" || hostname === "blackbox-vs7c.onrender.com";
  if (legacyHost && (req.method === "GET" || req.method === "HEAD")) {
    return res.redirect(301, `https://blackboxbc.com${req.originalUrl || "/"}`);
  }
  return next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/uploads", express.static(UPLOADS_DIR));

app.use("/api/client", clientApiRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", requireAdminApiAuth, adminApiRoutes);
app.use("/", authRoutes);

// Infos legales publiques (mentions legales / editeur) — donnees destinees a etre
// publiees, alimentees par les Reglages admin (Societe).
app.get("/api/legal-info", (_req, res) => {
  try {
    return res.json({ ok: true, company: getCompanyInfo() });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

function pwaManifest(req, res) {
  const rawStartUrl = typeof req.query.startUrl === "string" ? req.query.startUrl : "/";
  const startUrl = rawStartUrl.startsWith("/") && !rawStartUrl.startsWith("//")
    ? rawStartUrl
    : "/";
  const rawName = typeof req.query.name === "string" ? req.query.name.trim() : "";
  const rawShortName =
    typeof req.query.shortName === "string" ? req.query.shortName.trim() : rawName;
  const name = rawName || "Bryan Cars";
  const shortName = rawShortName || "Bryan Cars";

  res.type("application/manifest+json");
  res.json({
    name,
    short_name: shortName,
    start_url: startUrl,
    scope: "/",
    display: "standalone",
    background_color: "#05070b",
    theme_color: "#05070b",
    icons: [
      {
        src: "/app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  });
}

app.get("/api/pwa/manifest", pwaManifest);
app.get("/manifest.webmanifest", pwaManifest);

// L'index HTML est servi explicitement plus bas afin d'envoyer les bonnes
// métadonnées dès la réponse serveur. Les robots n'ont ainsi pas besoin
// d'exécuter React pour distinguer une page publique d'un espace privé.
app.use(express.static(distDir, { index: false }));

app.get("/", (_req, res) => {
  sendSeoHtml(res, distDir, "/");
});

app.get(/^\/admin(\/.*)?$/, requireAdminPageAuth, (req, res) => {
  sendSeoHtml(res, distDir, req.path);
});

app.get(/^\/card(\/.*)?$/, (req, res) => {
  sendSeoHtml(res, distDir, req.path);
});

app.get(/^\/forfait(\/.*)?$/, (req, res) => {
  sendSeoHtml(res, distDir, req.path);
});

app.get(/^\/preparation-vente(\/.*)?$/, (req, res) => {
  sendSeoHtml(res, distDir, req.path);
});

app.get("/nettoyage-voiture-louhans", (req, res) => {
  sendSeoHtml(res, distDir, req.path);
});

app.get(/^\/demo(\/.*)?$/, (req, res) => {
  sendSeoHtml(res, distDir, req.path);
});

app.get("/landing-test", (req, res) => {
  sendSeoHtml(res, distDir, req.path);
});

// Pages legales publiques (mentions legales, confidentialite, cookies, CGU).
app.get(
  /^\/(mentions-legales|confidentialite|cookies|conditions)$/,
  (req, res) => {
    sendSeoHtml(res, distDir, req.path);
  },
);

module.exports = app;
