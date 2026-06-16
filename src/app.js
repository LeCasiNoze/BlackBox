const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const express = require("express");
const {
  EXPORTS_DIR,
  FOUNDERS_UPLOAD_DIR,
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
const { startAppointmentReminderScheduler } = require("./services/appointmentReminderScheduler");
const { startWeeklyExportScheduler } = require("./services/weeklyExportScheduler");
const { startInactivityReminderScheduler } = require("./services/inactivityReminderScheduler");
const { startReviewRequestScheduler } = require("./services/reviewRequestScheduler");

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
ensureDir(EXPORTS_DIR);
startAppointmentReminderScheduler();
startWeeklyExportScheduler();
startInactivityReminderScheduler();
startReviewRequestScheduler();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/uploads", express.static(UPLOADS_DIR));

app.use("/api/client", clientApiRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", requireAdminApiAuth, adminApiRoutes);
app.use("/", authRoutes);

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

app.use(express.static(distDir));

app.get("/", (req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.get(/^\/admin(\/.*)?$/, requireAdminPageAuth, (req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.get(/^\/card(\/.*)?$/, (req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.get(/^\/forfait(\/.*)?$/, (req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.get(/^\/demo(\/.*)?$/, (req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

module.exports = app;
