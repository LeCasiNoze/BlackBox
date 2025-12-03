// src/app.js
const express = require("express");
const adminRoutes = require("./routes/admin");
const cardRoutes = require("./routes/card");
const authRoutes = require("./routes/auth");
const clientApiRoutes = require("./routes/clientApi");
const adminApiRoutes = require("./routes/adminApi"); // ⬅ nouvelle API admin

const { db } = require("./db");
const { ensureDemoClient } = require("./db/clients");
ensureDemoClient();

const app = express();

// Middlewares globaux
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Page d’accueil (debug / lien rapide)
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

// Montage des sous-routes
app.use("/admin", adminRoutes);
app.use("/card", cardRoutes);
app.use("/api/client", clientApiRoutes); // API JSON client
app.use("/api/admin", adminApiRoutes);   // API JSON admin
app.use("/", authRoutes);

module.exports = app;
