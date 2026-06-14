# Bryan Cars - Mise En Prod

## Verdict clair

Aujourd'hui, le site n'est **pas encore "100% prod"** pour une raison simple:

- la base actuelle est en **SQLite locale** via `better-sqlite3`
- les photos sont stockees dans `data/uploads`
- les mails sont codes pour **Brevo**, mais **aucune cle / domaine / expéditeur n'est configure**

Donc:

1. **Le chemin le plus rapide pour etre en prod maintenant**
   - garder SQLite
   - ajouter un **persistent disk Render**
   - brancher **Brevo**

2. **Le chemin le plus propre a long terme**
   - migrer la DB vers **Supabase Postgres**
   - migrer les fichiers vers **Supabase Storage**
   - garder **Brevo** pour les emails transactionnels

## Important

Supabase n'est **pas un simple bouton a activer** ici.
Le code backend actuel est construit autour de SQLite (`better-sqlite3`), donc passer sur Supabase veut dire:

- rework de la couche DB
- migration des tables
- migration des photos
- tests complets du booking, de l'admin, des BC'Coins, des exports et des mails

## Option A - La plus rapide pour finir le site maintenant

### 1. Render

- Dashboard Render: https://dashboard.render.com/
- Variables d'environnement / secrets: https://render.com/docs/configure-environment-variables
- Persistent disk: https://render.com/docs/disks
- Web services: https://render.com/docs/web-services
- Custom domains: https://render.com/docs/custom-domains

### 2. Ce qu'il faut faire sur Render

- creer ou ouvrir ton service web
- ajouter un **persistent disk**
- mount path recommande pour ce projet:
  - `/opt/render/project/src/data`
- ajouter les variables d'environnement du fichier `src/.env.example`
- verifier que le service ecoute bien `PORT`

### 3. Variables Render a renseigner

Copie-colle celles-ci dans Render:

```env
PORT=10000
ADMIN_PASSWORD=Azerty01@
ADMIN_SESSION_SECRET=mettre-une-grosse-cle-secrete-aleatoire
CLIENT_PORTAL_BASE_URL=https://ton-domaine.fr
ADMIN_DASHBOARD_URL=https://ton-domaine.fr/admin
BREVO_API_KEY=ta-cle-brevo
MAIL_FROM_NAME=Bryan Cars Detailing
MAIL_FROM_EMAIL=contact@ton-domaine.fr
MAIL_ADMIN_TO=ton-mail-admin@ton-domaine.fr
```

### 4. Pourquoi cette option est la plus rapide

Le code actuel fonctionne deja avec:

- SQLite locale
- fichiers locaux
- mails Brevo

Donc avec un persistent disk, la DB et les uploads ne seront plus perdus a chaque redeploy.

Source Render:
- les fichiers sont ephemeres par defaut sans disk: https://render.com/docs/disks

## Option B - Supabase pour une vraie archi long terme

## 1. Supabase

- Dashboard Supabase: https://supabase.com/dashboard/projects
- Docs Supabase: https://supabase.com/docs
- Cree un projet: https://supabase.com/docs/guides/getting-started
- Recuperer la connection string Postgres: https://supabase.com/docs/guides/database/connecting-to-postgres
- Storage Supabase: https://supabase.com/docs/guides/storage
- Creer un bucket Storage: https://supabase.com/docs/guides/storage/quickstart

## 2. Ce qu'il faudra migrer

### DB

Il faudra migrer ces blocs:

- `clients`
- `vehicles`
- `appointments`
- `appointment_photos`
- `reward_redemptions`
- `export_jobs`

### Fichiers

Il faudra migrer les uploads locaux vers Supabase Storage:

- images fondateur
- photos de rendez-vous
- potentiellement exports si on veut tout centraliser ailleurs

## 3. Ce que je te recommande si tu choisis Supabase

Ne pas faire juste:

- "je cree un projet Supabase"
- "je colle une URL"

Il faut faire dans cet ordre:

1. creation du projet Supabase
2. creation du schema Postgres
3. migration des donnees SQLite
4. migration des photos vers Supabase Storage
5. adaptation du backend
6. tests end-to-end
7. deploy

## 4. Point d'honnetete

Si l'objectif est:

- **"etre en ligne tres vite"**

alors **Render persistent disk + Brevo** est le meilleur choix immediat.

Si l'objectif est:

- **"archi plus propre / scalable / portable"**

alors **Supabase** est meilleur, mais c'est un vrai chantier de migration.

## Mails - ce qu'il faut brancher

## 1. Brevo

- Site Brevo: https://www.brevo.com/
- Cree un compte: https://onboarding.brevo.com/
- API key auth: https://developers.brevo.com/docs/api-key-authentication
- API docs: https://developers.brevo.com/
- Senders and domains: https://developers.brevo.com/docs/getting-started-with-senders-and-domains
- Authentifier ton domaine: https://help.brevo.com/hc/en-us/articles/12163873383186-Authenticate-your-domain-with-Brevo-Brevo-code-DKIM-DMARC
- Email transactionnel API: https://developers.brevo.com/reference/send-transac-email

## 2. Ce qu'il faut faire sur Brevo

1. creer le compte
2. generer une API key
3. ajouter l'adresse expéditeur
4. authentifier le domaine DNS
5. renseigner les variables Render

## 3. Variables mail a brancher

```env
BREVO_API_KEY=ta-cle-api
MAIL_FROM_NAME=Bryan Cars Detailing
MAIL_FROM_EMAIL=contact@ton-domaine.fr
MAIL_ADMIN_TO=ton-mail-admin@ton-domaine.fr
CLIENT_PORTAL_BASE_URL=https://ton-domaine.fr
ADMIN_DASHBOARD_URL=https://ton-domaine.fr/admin
```

## 4. A quoi servent ces variables dans le projet

- `BREVO_API_KEY`
  - authorise l'envoi des mails
- `MAIL_FROM_EMAIL`
  - adresse expéditeur visible
- `MAIL_ADMIN_TO`
  - recoit:
    - notif de reservation
    - demandes BC'Coins
    - export hebdo
- `CLIENT_PORTAL_BASE_URL`
  - construit les liens clients dans les mails
- `ADMIN_DASHBOARD_URL`
  - construit les liens admin dans les mails

## Checklist pour etre "pret a 100%"

### Obligatoire

- Render web service deploye
- domaine branche
- HTTPS actif
- persistent disk ajoute
- variables d'env renseignees
- Brevo configure
- tests mails OK
- tests reservation OK
- tests validation admin OK
- tests upload photo OK
- tests BC'Coins OK
- test export manuel OK
- test export hebdo OK

### Recommande

- sauvegarde reguliere de la DB
- vrai compte admin secondaire
- monitoring des erreurs
- politique de reset mot de passe admin
- migration future vers Supabase si tu veux sortir du stockage local

## Ma reco finale

Si tu veux finir vite et propre:

1. **on branche Render + persistent disk**
2. **on branche Brevo**
3. **on teste tous les mails**
4. **on met le domaine**
5. **on fait le check final prod**

Si tu veux, juste apres, je peux te faire le **plan exact de migration vers Supabase** pour la V3 backend.
