# CLAUDE.md — BlackBox (Bryan Cars)

Guide de dev pour ce dépôt. Lis aussi [`ROADMAP.md`](ROADMAP.md) (ce qui est
fait / à faire, tenu à jour en temps réel) et
[`web/src/lib/patchNotes.ts`](web/src/lib/patchNotes.ts) (version + changelog admin).

## Produit
PWA premium de detailing automobile (Bryan Cars). Trois profils client : **BBX**
(standard), **Fondateur** (or, BC'Coins, accès limité à 50), **Pro** (B2B, thème
acier, pas de crédits consommés). Identité visuelle : « champagne nocturne ».

## Stack & structure
- **Backend** : Node/Express + `better-sqlite3`. Code dans `src/`. Entrée
  `index.js` → `src/app.js` (exporte `app`, démarre les schedulers).
- **Frontend** : React 19 + TypeScript + Vite + Tailwind dans `web/`. Build vers
  `web/dist`, servi en statique par Express. SPA (routes `/card/*`, `/admin/*`,
  `/forfait/*`, `/demo/*` renvoient `index.html`).
- **Hébergement** : Render (web service `srv-d4nlqd63jp1c73cvfkbg`,
  https://blackbox-vs7c.onrender.com). SQLite sur disque monté
  `/opt/render/project/src/data/blackbox.db`. **Auto-deploy au push sur `main`**.
- **Intégrations** : SumUp (checkout hébergé + webhook + `/topup/sync`), Brevo
  (email), Web Push (VAPID). Secrets uniquement dans les env Render.

## Commandes
```bash
# Build front (à faire avant chaque commit touchant web/) :
cd web && npx tsc -b && npm run build     # tsc -b a noUnusedLocals → retire tout import/var inutilisé
# Vérifier un fichier backend :
node --check src/<fichier>.js
# Lancer le serveur : npm start  (node index.js)
```

## Workflow de livraison (RÈGLE PERMANENTE)
1. Implémenter, **builder** (front) / `node --check` (back).
2. `git add <chemins explicites>` — **jamais `git add -A`**. Ne **jamais** committer
   `data/blackbox.db` ni `node_modules/.package-lock.json`.
3. Push sur `main`, puis **vérifier que le deploy Render atteint `live`** (MCP
   `mcp__render__get_deploy` / `list_deploys`). Si échec → corriger et re-push.
4. Bump `APP_VERSION` (`web/src/lib/patchNotes.ts` + les deux `package.json`) et
   ajouter une entrée de patch note à chaque livraison notable.
5. Mettre **`ROADMAP.md`** à jour (statut ✅/🚧/⏳) en temps réel.
6. Footer de commit : `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

Pas d'outil MCP pour déclencher un deploy : c'est le webhook GitHub→Render. S'il
ne se déclenche pas (rare), un commit vide relance.

## Carte du code
- `web/src/pages/ClientCardPage.tsx` — portail client (~6700 l). Vues via `?view=`
  (`home`/`booking`/`vehicles`/`shop`/`history`). Modale RDV, box (CaseOpeningModal),
  events, BC'Coins, fondateur. Deep-link RDV via `?appointmentId=N`.
- `web/src/pages/AdminDashboardPage.tsx` — admin (~4900 l). Sections
  `home`/`appointments`/`delivery`/`clients` (`ADMIN_NAV_ITEMS`), badges de notif,
  panneau events + participants, goodies, notes de version.
- `web/src/pages/LandingPage.tsx` — inscription (code par mail, conditions).
- `web/src/index.css` — tokens + identité ; **overrides perf mobile en bas**
  (≤767px : pas de `backdrop-filter`, fond non fixe, animations en pause).
- `web/src/lib/` — `clientPush`, `adminPush`, `calendar` (.ics/Google),
  `patchNotes`, `terms`. (⚠️ ne PAS créer dans `web/src/data/`, voir Pièges.)
- `src/routes/` — `clientApi.js`, `adminApi.js`, `payments.js`, `auth.js`.
- `src/db/` — couche données : `clients`, `appointments`, `events`, `goodieWins`,
  `rewards`, `topup_orders`, `vehicles`, etc. + `schema.sql` + `index.js` (migrations).
- `src/email.js` — Brevo + push (`src/services/webPush.js`). Helpers de mise en
  forme : `brandEmailShell`, `panelCard`, `actionButtons`, `metricRows`, `infoRows`,
  `clientPortalUrl`, `clientAppointmentUrl`.
- `src/config/` — `bcoins`, `topupOffers` (lit l'env `SUMUP_TOPUP_OFFERS`),
  `reviewBox`, `eventRewards`, `partnerForfaits`, `storage`.
- `src/services/*Scheduler.js` — `setInterval` lancés dans `app.js`
  (rappels RDV J-1, export hebdo, **rappels d'inactivité**).

## Base de données & migrations
- `schema.sql` = `CREATE TABLE IF NOT EXISTS` (DB neuve).
- `src/db/index.js` exécute des `ensure*ExtraColumns()` (`PRAGMA table_info` +
  `ALTER TABLE ADD COLUMN`) : **c'est par là que les nouvelles colonnes arrivent en
  prod** (la DB prod persiste, donc le `ALTER` s'applique). Pour ajouter une colonne :
  l'ajouter à `schema.sql` **et** dans le `ensure*` correspondant.
- Inspection prod : SSH `ssh -i ~/.ssh/oracle_lunaclip -o BatchMode=yes -o
  StrictHostKeyChecking=no srv-d4nlqd63jp1c73cvfkbg@ssh.oregon.render.com` puis
  `sqlite3 /opt/render/project/src/data/blackbox.db`. La lecture des **env de prod
  est restreinte** (demander avant).

## Règles métier (mémo)
- Argent en **centimes** (`priceCents`/`amount_cents`). Crédits = entiers.
- **BC'Coins** (fondateurs only) : +80 immédiat / +20 différé par crédit acheté ;
  le différé se débloque (crédits consommés × 20) au passage **effectué** ;
  1 BC ≈ 0,05 € (2000 BC = bon 100 €). Cases CS:GO : 1 par achat.
- **Fondateur** : 29,99 € à vie, **plafond 50** (`FOUNDER_CAP` dans `clientApi.js`),
  `foundersRemaining` exposé dans le GET client.
- **Validation tarif** : l'admin fixe un tarif (`approved_credits`) ; le client
  accepte / recharge. Recharge à l'unité plafonnée (`MAX_UNIT_TOPUP_QUANTITY`).
- **Events** : 1 actif ; tickets cosmétiques **persistés**
  (`event_participations.tickets`) ; tirage = 1 entrée/participant ; box de
  consolation = fondateurs only ; **Pro exclu** des events.
- **Goodies gagnés** rattachés au prochain RDV à venir (`goodie_wins.appointment_id`),
  marqués remis quand le RDV passe `done`.
- **Deep links** mail/push → `/card/:slug?appointmentId=N` (ouvre la fiche RDV).
- **Apple/Google Pay** : géré par la page SumUp (réglage dashboard, pas de code).

## Pièges connus
- **Accents** : presque tout l'UI est en texte **non accentué** (héritage). Pass
  prévu (roadmap §13). En attendant, rester cohérent.
- **`.gitignore`** contient `src/data/` qui matche **aussi** `web/src/data/` →
  ne pas y mettre de fichiers à committer (utiliser `web/src/lib/`).
- Le sandbox du tool **Workflow** interdit `Date.now()`/`Math.random()`/`new Date()` ;
  le code app/React normal peut les utiliser.
- `tsc -b` casse le build sur tout import/variable inutilisé (`noUnusedLocals`).
