const express = require("express");

const {
  ADMIN_PASSWORD,
  ADMIN_USERNAME,
  clearAdminSession,
  isAdminAuthenticated,
  resolveNextUrl,
  setAdminSession,
} = require("../auth/adminSession");

const router = express.Router();

function renderLoginPage({ error = null, next = "/admin" } = {}) {
  const safeNext = typeof next === "string" ? next : "/admin";

  return `
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Bryan Cars - Connexion admin</title>
        <style>
          @import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Syne:wght@500;700;800&display=swap");

          :root {
            color-scheme: dark;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 24px;
            font-family: "Manrope", "Segoe UI", sans-serif;
            color: #edf2ff;
            background:
              radial-gradient(circle at 18% 20%, rgba(247, 185, 85, 0.16), transparent 32%),
              radial-gradient(circle at 82% 0%, rgba(73, 188, 255, 0.14), transparent 34%),
              linear-gradient(180deg, #05070b 0%, #090d12 100%);
          }

          .card {
            width: min(100%, 460px);
            padding: 28px;
            border-radius: 28px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background:
              linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02)),
              rgba(11, 13, 18, 0.82);
            box-shadow:
              0 24px 80px rgba(0, 0, 0, 0.45),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(18px);
          }

          .eyebrow {
            color: rgba(247, 185, 85, 0.92);
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
          }

          h1 {
            margin: 14px 0 0;
            font-family: "Syne", "Segoe UI", sans-serif;
            font-size: 36px;
            line-height: 1.02;
            letter-spacing: -0.04em;
          }

          p {
            margin: 14px 0 0;
            color: rgba(237, 242, 255, 0.65);
            font-size: 14px;
            line-height: 1.65;
          }

          form {
            margin-top: 22px;
            display: grid;
            gap: 16px;
          }

          label {
            display: grid;
            gap: 8px;
          }

          label span {
            color: rgba(237, 242, 255, 0.42);
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.16em;
            text-transform: uppercase;
          }

          input {
            width: 100%;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 18px;
            background: rgba(255, 255, 255, 0.04);
            color: #edf2ff;
            padding: 14px 16px;
            font-size: 14px;
            outline: none;
            transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
          }

          input:focus {
            border-color: rgba(247, 185, 85, 0.5);
            background: rgba(255, 255, 255, 0.06);
            box-shadow: 0 0 0 4px rgba(247, 185, 85, 0.12);
          }

          button {
            border: none;
            border-radius: 999px;
            padding: 14px 18px;
            font-size: 14px;
            font-weight: 800;
            color: #120b02;
            background: linear-gradient(135deg, rgba(247, 185, 85, 0.98), rgba(255, 122, 24, 0.98));
            box-shadow: 0 18px 40px rgba(255, 122, 24, 0.22);
            cursor: pointer;
          }

          .error {
            margin-top: 18px;
            padding: 14px 16px;
            border-radius: 18px;
            border: 1px solid rgba(255, 125, 137, 0.25);
            background: rgba(255, 125, 137, 0.12);
            color: #ffd4da;
            font-size: 13px;
            line-height: 1.6;
          }

          .footer {
            margin-top: 18px;
            padding-top: 18px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }

          .footer a {
            color: #f7b955;
            text-decoration: none;
          }

          .hint {
            margin-top: 18px;
            padding: 14px 16px;
            border-radius: 18px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(255, 255, 255, 0.03);
            font-size: 13px;
            line-height: 1.6;
            color: rgba(237, 242, 255, 0.62);
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="eyebrow">Bryan Cars admin</div>
          <h1>Connexion securisee</h1>
          <p>
            Le cockpit admin est maintenant protege. Entrez les identifiants
            pour ouvrir les dossiers clients, l'agenda et les actions de gestion.
          </p>
          ${
            error
              ? `<div class="error">${error}</div>`
              : ""
          }
          <form method="POST" action="/login">
            <input name="next" type="hidden" value="${safeNext}" />
            <label>
              <span>Nom d'utilisateur</span>
              <input name="username" type="text" value="${ADMIN_USERNAME}" autocomplete="username" />
            </label>
            <label>
              <span>Mot de passe</span>
              <input name="password" type="password" placeholder="Mot de passe admin" autocomplete="current-password" />
            </label>
            <button type="submit">Entrer dans l'espace admin</button>
          </form>
          <div class="hint">
            Redirection apres connexion: <strong>${safeNext}</strong>
          </div>
          <div class="footer">
            <a href="/">Retour au site</a>
            <a href="/admin">Ouvrir le cockpit</a>
          </div>
        </div>
      </body>
    </html>
  `;
}

router.get("/login", (req, res) => {
  const next = resolveNextUrl(req);

  if (isAdminAuthenticated(req)) {
    return res.redirect(next);
  }

  return res.send(renderLoginPage({ next }));
});

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  const next = resolveNextUrl(req);

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    setAdminSession(res);
    return res.redirect(next);
  }

  return res.status(401).send(
    renderLoginPage({
      error: "Les identifiants fournis ne correspondent pas.",
      next,
    }),
  );
});

router.get("/logout", (req, res) => {
  clearAdminSession(res);
  return res.redirect("/login");
});

module.exports = router;
