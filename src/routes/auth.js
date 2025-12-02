// src/routes/auth.js
const express = require("express");
const router = express.Router();

const ADMIN_USER = {
  username: "admin",
  password: "admin",
};

// GET /login
router.get("/login", (req, res) => {
  res.send(`
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Connexion admin</title>
        <style>
          :root { color-scheme: dark; }
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
          <p>
            Pour l’instant, cette connexion n’est pas encore reliée techniquement à /admin
            (pas de session, pas de protection). On branchera une vraie auth plus tard.
          </p>
        </div>
      </body>
    </html>
  `);
});

// POST /login
router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER.username && password === ADMIN_USER.password) {
    // plus tard: on mettra une vraie session + redirection vers /admin
    return res.send(`
      <p>Connexion réussie pour <strong>${username}</strong> (squelette, pas encore relié à /admin).</p>
      <p><a href="/admin">Aller au panneau admin</a></p>
    `);
  }
  res.send(`
    <p>Identifiants invalides.</p>
    <p><a href="/login">Réessayer</a></p>
  `);
});

module.exports = router;
