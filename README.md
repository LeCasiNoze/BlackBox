# BlackBox

Plateforme web (PWA) de **fidélité et de réservation** conçue pour une entreprise
de detailing automobile (Bryan Cars), du portail client jusqu'au tableau de bord
administrateur.

## Le besoin

Une entreprise de detailing automobile devait gérer, au même endroit :

- la **fidélisation** de ses clients (crédits prépayés, récompenses, statuts) ;
- la **prise de rendez-vous** et le suivi des prestations ;
- les **demandes de devis** et leur validation tarifaire ;
- les **paiements** (achat de crédits / prestations) ;
- l'**administration** au quotidien (agenda, clients, notifications).

Les outils existants (agenda générique, tableur, paiement isolé) ne couvraient pas
ce parcours de bout en bout ni l'aspect fidélité. BlackBox répond à ce besoin dans
une seule application.

## La solution

Une **Progressive Web App** installable sur mobile, avec deux espaces :

- un **portail client** (carte personnelle) pour réserver, suivre ses crédits et
  ses récompenses, demander un devis et payer ;
- un **tableau de bord administrateur** pour piloter l'agenda, les clients, les
  devis, les livraisons et les notifications.

Le backend (Node/Express + SQLite) expose l'API, gère les paiements via un
prestataire hébergé (SumUp), envoie les emails transactionnels (Brevo) et les
notifications Web Push, et sert le front React en statique.

## Fonctionnalités principales

- **Réservation en ligne** avec créneaux et rappels automatiques (J-1).
- **Crédits prépayés** : validation d'un tarif par l'admin, acceptation/recharge
  par le client, paiement via checkout hébergé SumUp + webhook.
- **Devis** : demande côté client (avec photos), estimation et validation admin.
- **Programme de fidélité** avec profils différenciés (standard, fondateur, pro)
  et récompenses.
- **Notifications** email (Brevo) et Web Push, côté client et côté admin.
- **Tableau de bord admin** : agenda hebdomadaire, gestion des clients, suivi des
  RDV et des livraisons.
- **PWA installable** (mobile/desktop) avec service worker.
- **Emails transactionnels** mis en forme (confirmation, rappels, factures).

## Utilisation réelle

- Produit **déployé en production** (hébergé sur Render, auto-déploiement continu).
- **Utilisé par une entreprise réelle** de detailing automobile.
- Des **comptes clients**, des **réservations** et des **paiements** ont déjà été
  réalisés via la plateforme.

*(Aucune donnée client, aucun montant ni statistique ne sont publiés dans ce dépôt.)*

## Rôle de Lucas

Ce projet a été mené par **Lucas** en tant que porteur du produit :

- recueil et compréhension du besoin métier auprès de l'entreprise ;
- conception du produit, des parcours client/admin et de l'identité visuelle ;
- pilotage de l'implémentation à l'aide d'**agents IA** ;
- **tests fonctionnels** de bout en bout et remontée des anomalies ;
- **itérations** successives à partir des retours d'usage ;
- **déploiement** et suivi de la mise en production.

## Aperçu du produit

> Les captures ci-dessous **restent à ajouter** par Lucas dans `docs/screenshots/`.
> Les chemins sont réservés ; les images ne sont pas encore présentes dans le dépôt.

| Vue | Fichier attendu |
|---|---|
| Portail client — accueil | `docs/screenshots/client-home.png` |
| Réservation / prise de RDV | `docs/screenshots/booking.png` |
| Crédits & récompenses | `docs/screenshots/rewards.png` |
| Demande de devis | `docs/screenshots/quote.png` |
| Tableau de bord admin | `docs/screenshots/admin-dashboard.png` |
| Agenda admin | `docs/screenshots/admin-agenda.png` |

## Architecture générale

```
Client (PWA React) ──HTTP──► API Express ──► SQLite (better-sqlite3)
        │                        │
        │                        ├─► SumUp   (paiements : checkout hébergé + webhook)
        │                        ├─► Brevo   (emails transactionnels)
        │                        └─► Web Push (notifications, VAPID)
        └── service worker (installation PWA, notifications)
```

- **Frontend** : React 19 + TypeScript + Vite, compilé vers `web/dist`.
- **Backend** : Node/Express, base **SQLite** sur disque, tâches planifiées
  (`setInterval`) pour les rappels et exports.
- **Livraison** : le serveur Express sert le front en statique (SPA) et l'API.
- Le front est **compilé puis servi** par le backend ; il n'y a pas de serveur
  front séparé en production.

*(Description à haut niveau. Le détail interne de certains modules relève de
l'implémentation assistée par IA et n'est pas revendiqué comme maîtrisé en
profondeur.)*

## Technologies présentes dans le projet

> Technologies **utilisées dans le projet**, pas nécessairement maîtrisées
> individuellement par l'auteur.

- **Frontend** : React 19, TypeScript, Vite, Tailwind CSS, React Router,
  Framer Motion.
- **Backend** : Node.js 20, Express 5, better-sqlite3 (SQLite).
- **Intégrations** : SumUp (paiements), Brevo (emails), Web Push (VAPID),
  Multer (upload), Sharp (traitement d'images).
- **Déploiement** : Render (auto-deploy sur `main`), PWA / service worker.

## Lancer le projet

Prérequis : **Node.js 20.x**.

```bash
# 1. Dépendances backend (à la racine)
npm install

# 2. Dépendances + build du front
cd web
npm install
npm run build          # tsc -b && vite build  → génère web/dist
cd ..

# 3. Configuration : copier l'exemple et remplir vos propres valeurs
cp src/.env.example src/.env
#   → renseigner ADMIN_PASSWORD, ADMIN_SESSION_SECRET, Brevo, SumUp, VAPID…

# 4. Démarrer le serveur (sert l'API + le front compilé)
npm start              # node index.js  (port 3001 par défaut)
```

Développement front avec rechargement à chaud (optionnel) :

```bash
cd web && npm run dev  # serveur Vite de dev
```

Notes de vérification :

- Les commandes ci-dessus proviennent directement des `package.json`
  (racine et `web/`) et de `index.js`.
- **Vérifié** : le build front (`npm run build` dans `web/`) s'exécute avec succès,
  et les fichiers backend passent le contrôle de syntaxe (`node --check`).
- **Non vérifié dans cet environnement** : l'installation depuis zéro
  (`npm install`) et le démarrage complet avec intégrations réelles
  (SumUp/Brevo/Web Push nécessitent des clés valides). La liste exhaustive des
  variables attendues est dans [`src/.env.example`](src/.env.example).
- Sans clés d'intégration, l'application démarre mais les emails, paiements et
  notifications sont désactivés/ignorés (comportement de repli côté code).

## État du projet

Produit **en production** et **en évolution continue**. Le suivi des
fonctionnalités (fait / en cours / à venir) est tenu dans `ROADMAP.md`, et le
journal des versions dans `web/src/lib/patchNotes.ts`.
