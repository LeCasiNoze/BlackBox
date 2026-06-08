const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const express = require("express");

const authRoutes = require("./routes/auth");
const clientApiRoutes = require("./routes/clientApi");
const adminApiRoutes = require("./routes/adminApi");
const { ensureDemoClient } = require("./db/clients");

ensureDemoClient();

const app = express();
const distDir = path.join(__dirname, "../web/dist");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/client", clientApiRoutes);
app.use("/api/admin", adminApiRoutes);
app.use("/", authRoutes);

app.use(express.static(distDir));

app.get("/", (req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.get(/^\/admin(\/.*)?$/, (req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.get(/^\/card(\/.*)?$/, (req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

module.exports = app;
