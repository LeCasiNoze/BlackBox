# BlackBox — Roadmap

Suivi des évolutions demandées. Statuts : ✅ fait · 🚧 en cours · ⏳ planifié.

La version applicative et le détail des livraisons sont dans
[`web/src/data/patchNotes.ts`](web/src/data/patchNotes.ts) (consultable dans
l'admin → Hall → « Notes de version »).

---

## Fait récemment

- ✅ **« À l'atelier » + adresse domicile (v1.39.0)** : libellé « Au studio »
  remplacé par « À l'atelier » partout ; pour les RDV à domicile, l'adresse du
  client est affichée dans la push admin, l'email de réservation (ligne
  Adresse) et le Résumé de la fiche RDV admin avec lien Google Maps.
- ✅ **Fiabilisation notifications push admin (v1.38.1)** : le statut affiché
  (bouton menu + bandeau accueil) reflète l'état réel côté serveur, pas
  seulement la permission navigateur — un abonnement supprimé en base
  (endpoint expiré) est maintenant détecté même si le navigateur pense encore
  être autorisé. Resynchronisation à chaque retour au premier plan (pas
  seulement à l'ouverture). Log serveur explicite quand une notif ne peut
  atteindre aucun appareil admin abonné. Suite à l'incident RDV Chantal Sieuw
  (10/08 après-midi) sans notif admin — cause : 0 abonnement `role='admin'`
  en base malgré la permission navigateur affichée comme accordée.
- ✅ **Clients admin + landing (v1.38.0)** : page Clients en wizard mobile
  (liste ⇄ fiche, précédent/suivant avec compteur, identité en cadre doré) ;
  landing avec inscription en tête sur mobile, carte membre animée, paliers
  aux couleurs de leur univers, bandeau « Comment ça marche ». Étape véhicule
  sautée quand le compte n'a qu'un véhicule (v1.37.1).
- ✅ **Réservation 100 % séquentielle + admin étape par étape (v1.37.0)** :
  calendrier direct (sans textes d'aide ni étape demi-journée), déroulé un
  clic = un bloc (heure → véhicule → lieu → estimation+note → photos →
  envoi), historique véhicule replié en lignes compactes, admin
  Agenda/Livraison en une étape à la fois sur mobile (liste ⇄ panneau,
  flèches précédent/suivant avec compteur), pastilles date + numéros
  d'étape côté admin, helper `dateBlockParts` (fix pastilles).
- ✅ **Étape par étape + ergonomie (v1.36.0)** : réservation verrouillée clic
  par clic (heure à confirmer avant les détails, étape validée = résumé +
  Modifier), scroll remis en haut à chaque changement d'onglet (client +
  admin), véhicules aérés (actions sur la sélection uniquement), image perso
  fondateur/pro en fond de carte membre, admin désencombré (liste complète
  agenda + historique client repliés par défaut).
- ✅ **Réservation progressive + suivi timeline (v1.35.0)** : le flow de
  réservation se déroule inline sous le calendrier (demi-journée → heure en
  stepper 30 min → détails → récap), la modale ne sert plus qu'à
  gérer/annuler ; liste d'attente en un tap sur créneau complet ; suivi en
  timeline (fil + points) ; en-têtes de pages allégés.
- ✅ **Design v2 étendu à tout le portail + admin (v1.34.0)** : boutique crédits
  BBX en cartes d'offres (1/3/5/10, badge Populaire, prix réels SumUp),
  « Recharger » → boutique, badge « Meilleur tarif » auto sur les packs
  fondateur, portefeuille BC'Coins, véhicules avec vignettes + ajout en
  pointillés, suivi avec pastilles date + chips photos/avis, stepper de
  réservation, assistant thémé (plus de brun fixe), poignée bottom-sheet sur
  toutes les modales mobiles, bandeau admin façon carte membre.
- ✅ **Design v2 — carte membre & accueil repensé (v1.33.0)** : carte membre
  BlackBox sur l'accueil (palier BBX/Fondateur/Pro, jauge de lavages, Recharger,
  BC'Coins fondateur, reflet animé), carte « Prochain rendez-vous » avec pastille
  date (ouvre la fiche RDV), navs pilule 100 % tokenisées (halo actif par univers),
  récompenses BC affichées sur les packs fondateur, halo événement thémé,
  admin tokenisé (`#ffe8a8` → accentSoft) + menu actif lumineux.
- ✅ **Admin — navigation repensée (v1.20.0)** : Hall allégé (aperçu + lanceur),
  pages dédiées Statistiques / Événements / Communication / Réglages, barre
  d'onglets (toutes les sections) + barre du bas mobile (sections principales).
- ✅ **Refonte visuelle « Nocturne Raffiné » (portail client)** : typographie Inter,
  base sombre affinée, **un univers par type de compte** (Fondateur or rose/onyx,
  BBX violet néon, Pro bleu blueprint) piloté par tokens CSS ; accueil mobile-first
  (CTA « Prendre rendez-vous » dominant et guidé, statut clair, accès rapides en
  grille), landing + en-tête + agenda guidé refondus, micro-animations. Système
  documenté dans [`web/DESIGN_SYSTEM.md`](web/DESIGN_SYSTEM.md).
- ✅ **Optimisation mobile** : scroll fluide (suppression du fond fixe, des
  `backdrop-filter` sur mobile, du blend-mode, pause des animations décoratives).
- ✅ **Numéro de version + panneau « Notes de version » admin** (v courante dans
  [`web/src/lib/patchNotes.ts`](web/src/lib/patchNotes.ts)).
- ✅ **Compteurs de notif admin** : badges (N) sur les onglets (Agenda = RDV non
  traités, Livraison = RDV à effectuer, Hall = lots à remettre).
- ✅ **3.1 Rappels d'inactivité** : relance e-mail (+ push) après ~8 semaines
  sans RDV, max 1/mois (`src/services/inactivityReminderScheduler.js`).
- ✅ **3.5 Bannière d'activation des notifications** sur l'accueil client.
- ✅ **4.4 Bouton « Ajouter à mon agenda »** (.ics + Google) sur les RDV
  (client + admin).

---

## 3. Engagement & rétention (validé : tout)

- ✅ **3.1 Rappels intelligents** — relance à 8 semaines sans RDV effectué,
  max 1 / 30 j, push + mail. *(Seuils ajustables dans le scheduler.)*
- ⏳ **3.2 Relances saisonnières** par véhicule (pollen, sel d'hiver…).
- ✅ **3.3 Récap annuel** « Mon année Bryan Cars » : modale client (prestations,
  crédits, BC, véhicules, avis, photos) + envoi e-mail déclenchable par l'admin
  (`src/db/recap.js`).
- ⏳ **3.4 Notif météo** (« beau temps ce week-end, créneau libre ? »).
  *(Bloqué : nécessite une clé d'API météo.)*
- ✅ **3.5 Activation des notifs plus visible** (bandeau si désactivées).

## 4. Réservation & planning

- ✅ **4.3 Liste d'attente** : sur un créneau pris, le client s'inscrit ; à
  l'annulation (client OU admin), **tous** les inscrits sont prévenus (mail +
  push). La liste n'est **pas** vidée : à chaque re-libération on re-prévient les
  mêmes + les nouveaux ; l'inscription part quand le client réserve, et les dates
  passées sont purgées. `src/db/waitlist.js` + `src/services/waitlistNotifier.js`.
- ✅ **4.4 Bouton « Ajouter à mon agenda »** (client + admin) — `.ics` + lien
  Google Calendar par RDV (`web/src/lib/calendar.ts`). *(Sync OAuth = plus tard.)*

## 5. Paiement & monétisation

- ✅ **5.1 Apple Pay / Google Pay** — géré par la page hébergée SumUp (à activer
  dans le dashboard SumUp, pas de dev). *Vérifié.*
- ✅ **5.5 Factures** : le client retrouve ses factures (paiements réglés) dans
  Suivi → facture imprimable / PDF (`web/src/pages/InvoicePage.tsx`). Mentions
  société éditables dans l'admin (`src/db/settings.js`). *(N° = `BC-AAAA-NNNNN` ;
  numérotation strictement séquentielle = à durcir si besoin légal.)*

## 6. Communication client

- ✅ **6.3 Photos avant/après** : tag optionnel « Avant »/« Après » par photo côté
  admin (Livraison) ; affichage groupé en sections Avant/Après côté client (sinon
  galerie normale). Pas de slider (angles non garantis) — dégrade proprement.
- ✅ **Chatbot d'assistance (guidé / scripté)** : bulle portail client, menus +
  boutons d'action (ouvrir un RDV, valider un tarif, prendre un RDV, box, FAQ,
  contact). `renderAssistant()` dans ClientCardPage. *(FAQ par défaut à valider.)*

## 7. Avis & réputation

- ✅ **7.1 Demande d'avis automatisée** : **72h** après une presta effectuée
  (sans avis), e-mail + push qui ouvrent la fiche RDV sur la section avis
  (`?review=1`). 1 seul rappel. `src/services/reviewRequestScheduler.js`.
- ✅ **7.2 Mur d'avis** : avis publics 4-5★ avec commentaire sur la landing
  (`GET /api/client/public/reviews`).

## 8. Admin & opérations

- ✅ **8.1 Dashboard stats** : panneau Statistiques par mois (CA encaissé, RDV
  par statut, crédits consommés, BC distribués, nouveaux clients, totaux) avec
  navigation mois. `src/db/stats.js`. *(taux de remplissage/no-show = à affiner.)*

## 10. Data & analytics

- ✅ **10.1 Funnel d'inscription** (codes utilisés / demandés → taux de conversion).
- ✅ **10.2 Cohortes de rétention** (BBX vs Fondateurs : déjà venus / actifs 90j / fidèles 2+).
- ✅ **10.4 Heatmap des créneaux** (jour × matin/après-midi, 180 j). `src/db/stats.js` → `getAdminAnalytics`.

## 11. Contenu & marketing

- ✅ **11.2 Emails groupés** : composer admin (titre + message + bouton) avec
  ciblage par segment (tous / BBX / fondateurs / pro / actifs récents) + annonce
  auto au lancement/fin d'événement (audience, **jamais Pro**). `POST /broadcast`.
- ⏳ **11.4 Events saisonniers** automatiques (préparation hiver/été…).

## 12. Technique / qualité

- ⏳ **12.1 Mode hors-ligne PWA** (cache fiche client/RDV) — *priorité basse*.
- ⏳ **12.2 Skeletons** au chargement (perçu plus rapide) — *priorité basse*.
- ⏳ **12.3 Virtualisation** des longues listes — *priorité basse*.
- ⏳ **12.6 Sauvegarde base** : snapshot du fichier `.db` vers stockage externe.
  *(Un export de données hebdo par mail existe déjà ; ceci est un vrai backup.)*

## 13. Accessibilité & i18n

- ✅ **13 Pass accents (1re passe)** : accents auto sur le texte affiché (JSX +
  chaînes avec espace ; identifiants/clés jamais touchés). Quelques formes
  ambiguës (réserve/réservé, « a »→« à », participes hors dictionnaire) à
  affiner dans une 2e passe.

## 15. Communauté

- ✅ **15.1 Classement BC'Coins** : opt-in fondateurs, top 10 + ta position
  (prénom + initiale), accessible depuis l'accueil fondateur.
- ⏳ **15.4 Mascotte / personnalité de marque** — *à travailler ensemble plus tard*.

---

## Décisions actées

- Chatbot : **assistant guidé (scripté)**, pas d'IA.
- Google Agenda : **bouton « Ajouter à l'agenda » (.ics / lien)**.
- Emails groupés : **ciblage par segments flexibles** (events = jamais Pro).
- Priorité : libre (au choix de l'implémentation), roadmap tenue à jour ici.
