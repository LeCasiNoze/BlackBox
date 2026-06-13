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
const { ensureDemoClient } = require("./db/clients");
const { startAppointmentReminderScheduler } = require("./services/appointmentReminderScheduler");
const { startWeeklyExportScheduler } = require("./services/weeklyExportScheduler");

if (process.env.SEED_DEMO_CLIENT === "true") {
  ensureDemoClient();
}

const app = express();
const distDir = path.join(__dirname, "../web/dist");
ensureDir(UPLOADS_DIR);
ensureDir(FOUNDERS_UPLOAD_DIR);
ensureDir(EXPORTS_DIR);
startAppointmentReminderScheduler();
startWeeklyExportScheduler();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/uploads", express.static(UPLOADS_DIR));

app.use("/api/client", clientApiRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", requireAdminApiAuth, adminApiRoutes);
app.use("/", authRoutes);

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

module.exports = app;
