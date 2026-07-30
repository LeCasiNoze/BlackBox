# Audit de publication — BlackBox

> Document **interne**. Ne pas publier tel quel dans le dépôt public.
> Aucune valeur secrète n'est reproduite ici : seuls les emplacements et la
> nature des risques sont décrits.
>
> Date de l'audit : 2026-07-02 — État analysé : branche `main`, HEAD `f490569`.

Ce rapport liste ce qui **empêche une publication en l'état**, les fichiers
concernés, les corrections à réaliser, et ce qui ne doit jamais être publié.
Aucune réécriture d'historique Git n'a été effectuée. Aucune donnée n'a été
supprimée. Les commandes proposées sont à exécuter par Lucas après validation.

---

## 1. Synthèse — verdict

**Le dépôt ne peut PAS être rendu public en l'état.**

Deux problèmes bloquants concernent l'**historique Git**, pas seulement l'état
actuel des fichiers :

1. Un fichier d'environnement `src/.env` (identifiants SMTP réels) a été
   committé puis « retiré » — mais les commits d'ajout sont **toujours présents
   dans l'historique de `main`**. Le nettoyage précédent a échoué.
2. La base SQLite `data/blackbox.db` est versionnée, et des versions
   historiques contiennent des **données personnelles de clients réels**
   (10 fiches clients : email, téléphone, adresse, plaque).

Rendre le dépôt public exposerait ces éléments à quiconque parcourt l'historique
(`git log`, `git show <commit>`), même si les fichiers actuels semblent propres.

**Conclusion pratique :** avant publication, il faut soit **repartir d'un
historique neuf** (recommandé, le plus sûr), soit **purger l'historique** avec
`git filter-repo`. Voir §7.

---

## 2. Risques CRITIQUES (bloquants)

### C1 — `src/.env` présent dans l'historique Git (identifiants réels)

- **Nature :** un `.env` contenant des identifiants SMTP réels (`SMTP_USER`,
  `SMTP_PASS`, hôte, expéditeur) a été committé à plusieurs reprises.
- **Preuve :** `git log --all --oneline -- src/.env` renvoie notamment les
  commits d'ajout `7f88aa5`, `d771a6f`, `2158d55` **et** ces commits sont
  atteignables depuis `main` (`git log HEAD -- src/.env` les liste toujours).
- **Aggravant :** plusieurs commits nommés « Remove .env from git history »,
  « Remove env from repository history », « Recommit sans clé API dans
  l'historique » montrent des tentatives de nettoyage **qui n'ont pas abouti** —
  les blobs sont toujours là. La présence de `refs/original/refs/heads/main`
  confirme un ancien `git filter-branch` incomplet.
- **Impact :** tout identifiant ayant figuré dans ce fichier doit être considéré
  comme **compromis**.
- **Correction :**
  1. **Faire tourner (rotate) tous les secrets concernés** côté fournisseurs :
     mot de passe/API SMTP, clé Brevo, clé SumUp, secrets VAPID, mot de passe
     admin, `ADMIN_SESSION_SECRET`. C'est prioritaire et indépendant du dépôt.
  2. Purger l'historique (§7) **ou** repartir d'un historique neuf.

### C2 — Base de données clients versionnée (`data/blackbox.db`)

- **Nature :** SQLite versionnée. Le schéma `clients` contient `first_name`,
  `last_name`, `email`, `phone`, `address_line1/2`, `postal_code`, `city`,
  `vehicle_plate`, `notes` → **données personnelles**.
- **Preuve :** l'état actuel (HEAD) ne contient qu'**1 fiche de seed**, mais des
  versions historiques du blob contiennent **10 fiches clients réelles**
  (vérifié sur les révisions `f1e04f0`, `a89dedf`, `bca02ff`, etc. :
  `clients = 10`).
- **Impact :** fuite de données personnelles (RGPD) si publié — présent et
  historique.
- **Correction :**
  - Retirer le fichier du suivi : `git rm --cached data/blackbox.db`.
  - Le purger de l'historique (§7).
  - `data/` est déjà dans `.gitignore` (le fichier reste suivi car ajouté
    **avant** la règle : `.gitignore` n'exclut pas les fichiers déjà suivis).

### C3 — Mot de passe admin en dur dans le code source (fallback)

- **Emplacement :** `src/auth/adminSession.js:4`
  `const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "<valeur en dur>";`
  La **même valeur** est reprise comme « exemple » dans `src/.env.example:4`.
- **Impact :** cette valeur par défaut sert de mot de passe admin si la variable
  d'environnement n'est pas définie. Publier cette valeur (et le pattern de
  dérivation du secret de session juste en dessous, ligne 9) revient à publier
  le mot de passe admin de secours et à affaiblir la sécurité de la session.
- **Correction (à faire par Lucas, hors périmètre de cet agent car touche la
  logique d'auth) :**
  - Supprimer la valeur par défaut : exiger `ADMIN_PASSWORD` via l'environnement
    et faire échouer le démarrage si absente (fail-closed).
  - Idem pour le fallback de `VAPID_SUBJECT` (`src/services/webPush.js:10`,
    moins sensible mais à neutraliser).
  - **Changer** ce mot de passe en production (il est à considérer comme éventé).
  - Le `.env.example` a été corrigé dans cet audit pour ne plus exposer la vraie
    valeur (placeholder générique).

---

## 3. Risques ÉLEVÉS

### H1 — Fichiers parasites issus de commandes Git ratées

- **Fichiers suivis (vides, 0 octet) :**
  - `ans clé API dans l'historique` (le nom complet commence par un guillemet)
  - `et --soft HEAD~1`
  - `h --force`
- **Origine :** commit `600e282` « WIP ». Ce sont des fragments de commandes
  shell transformés par erreur en fichiers (probablement un copier-coller de
  `git reset --soft HEAD~1` / `git push --force` mal échappé).
- **Impact :** aucun contenu secret (fichiers vides), mais **très mauvais signal**
  pour un recruteur/CTO, et le nom évoque explicitement une clé API dans
  l'historique.
- **Correction :** `git rm --cached "ans clé API dans l'historique" "et --soft HEAD~1" "h --force"`
  puis suppression des fichiers, et purge de l'historique (§7).

### H2 — `node_modules/` entièrement versionné

- **Nature :** ~4 335 fichiers de `node_modules/` sont suivis, alors que
  `node_modules/` est dans `.gitignore` (ajoutés avant la règle).
- **Impact :** pas un secret, mais alourdit le dépôt, brouille le diff, et fait
  très amateur pour une vitrine.
- **Correction :** `git rm -r --cached node_modules web/node_modules` puis purge
  historique (§7) pour vraiment alléger le dépôt.

### H3 — Logs serveur versionnés

- **Fichiers :** `server-3001.out.log`, `server-3001.err.log`,
  `server-3001-port.out.log`, `server-3001-port.err.log`.
- **Contenu inspecté :** chemins locaux + « Server listening… ». Aucun secret
  détecté, mais ne doit pas être public.
- **Correction :** `git rm --cached server-*.log` (déjà couvert par `*.log` dans
  `.gitignore` pour l'avenir).

---

## 4. Risques MOYENS / à faire valider par Lucas

### M1 — Photo d'un fondateur réel

- **Fichiers :** `data/uploads/founders/founder-seed.png` (1,4 Mo) et sa copie
  `web/public/founder-seed.png`.
- **Question :** s'agit-il d'une **personne réelle** (client/fondateur) ? Si oui,
  publier son image sans consentement pose un problème de droit à l'image / RGPD.
- **Correction :** à confirmer par Lucas. Si personne réelle → remplacer par un
  visuel neutre/anonyme avant publication et retirer `data/uploads/` du suivi.

### M2 — Dossier `data/uploads/` versionné

- `data/uploads/` peut recevoir des **photos de véhicules / prestations** de
  clients (schéma `appointment_photos`, `quote_request_photos`). Rien d'autre
  n'est suivi aujourd'hui, mais le dossier ne doit jamais l'être.
- **Correction :** s'assurer que `data/` (déjà ignoré) couvre bien les uploads,
  et retirer du suivi ce qui s'y trouve.

### M3 — `src/.env.example` incomplet et exposant une vraie valeur

- **Corrigé dans cet audit** : placeholder générique pour le mot de passe admin,
  et ajout des variables réellement lues par le code (SumUp, VAPID, Brevo,
  chemins). Voir §6.

---

## 5. Points VÉRIFIÉS — non bloquants

- **Aucun secret en clair détecté dans les fichiers `.env` / logs actuels** du
  working tree hors des fallbacks en dur signalés en C3.
- **`src/.env` actuel n'est plus suivi** (ignoré) — le problème est
  exclusivement dans l'**historique**.
- Les logs actuels ne contiennent pas de token/clé (recherche par motif : 0 hit).
- Assets de marque (`bryan-cars-logo.png`, `BCD.jpg`, `content.png`, icônes PWA) :
  visuels d'entreprise, publiables (sous réserve M1 pour la photo fondateur).
  Note : `content.png` est un doublon exact de `bryan-cars-logo.png`.

---

## 6. Ce qui NE DOIT JAMAIS être publié

| Élément | Raison |
|---|---|
| `src/.env` (et tout `.env`) | Secrets réels |
| `data/blackbox.db` et toute `*.db/*.sqlite` | Données clients (PII) |
| `data/uploads/**` | Photos clients / fondateurs |
| `server-*.log` et tout `*.log` | Traces d'exécution |
| Valeurs réelles de : Brevo, SumUp, VAPID, SMTP, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` | Secrets |
| Infos client identifiables (nom du gérant, coordonnées privées) | Confidentialité client |

---

## 7. Plan de remédiation avant publication (à exécuter par Lucas, après validation)

> ⚠️ Ces opérations réécrivent l'historique : **irréversibles**. À ne lancer
> qu'après une **sauvegarde** du dépôt (`git clone --mirror` de côté) et après
> avoir **fait tourner tous les secrets** (§2 C1).

**Option A — Historique neuf (recommandé, le plus simple et le plus sûr).**
Le passé n'a pas de valeur de démonstration ici ; repartir propre :

```bash
# 1. Sauvegarder l'existant
git clone --mirror . ../blackbox-backup.git

# 2. Retirer du suivi tout ce qui ne doit pas être public
git rm -r --cached node_modules web/node_modules data server-*.log \
  "ans clé API dans l'historique" "et --soft HEAD~1" "h --force"

# 3. Repartir d'un commit unique et propre
rm -rf .git
git init
git add .                 # .gitignore filtre déjà node_modules/, data/, *.log, .env
git commit -m "Initial public release — BlackBox"
```

**Option B — Purger l'historique en le conservant** (si l'historique de commits
doit être gardé) avec `git filter-repo` (https://github.com/newren/git-filter-repo) :

```bash
git clone --mirror . ../blackbox-backup.git   # sauvegarde
git filter-repo \
  --path src/.env --path data --path node_modules --path web/node_modules \
  --path 'ans clé API dans l'\''historique' --path 'et --soft HEAD~1' --path 'h --force' \
  --path-glob 'server-*.log' \
  --invert-paths
```

**Dans les deux cas, ensuite :**
- Vérifier : `git log --all -- src/.env` et `git log --all -- data/blackbox.db`
  doivent renvoyer **vide**.
- Recréer `node_modules` localement (`npm install`) — il ne doit pas être suivi.
- Ne pousser vers le dépôt public **qu'après** ces vérifications.

---

## 8. Corrections déjà appliquées par cet audit (sans toucher au métier ni à l'historique)

- `README.md` : réécrit en présentation publique honnête (voir fichier).
- `.gitignore` : durci (uploads, `*.db`, logs, dossiers de sortie).
- `src/.env.example` : placeholder générique (plus de vraie valeur) + variables
  manquantes ajoutées.
- **Aucun** `git rm`, **aucune** réécriture d'historique, **aucune** suppression
  de donnée n'a été exécutée — tout est laissé à la décision de Lucas ci-dessus.
