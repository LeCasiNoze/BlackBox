# BlackBox — Roadmap

Suivi des évolutions demandées. Statuts : ✅ fait · 🚧 en cours · ⏳ planifié.

La version applicative et le détail des livraisons sont dans
[`web/src/data/patchNotes.ts`](web/src/data/patchNotes.ts) (consultable dans
l'admin → Hall → « Notes de version »).

---

## Fait récemment

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

- ⏳ **6.3 Galerie avant/après** : taguer les photos « avant » / « après » +
  slider comparatif sur la fiche RDV. *(Photos déjà présentes, tag à ajouter.)*
- ⏳ **Chatbot d'assistance (assistant guidé / scripté)** : aide à réserver et à
  retrouver le bon RDV, envoie des boutons de redirection (ex. ouvrir la popup
  RDV du 17 juin si libre ; retrouver un RDV dont le tarif est à valider).

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

- ⏳ **10.1 Funnel d'inscription** (où ça décroche).
- ⏳ **10.2 Cohortes de rétention** (fondateurs vs BBX).
- ⏳ **10.4 Heatmap des créneaux** les plus demandés.

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

- ⏳ **15.1 Classement BC'Coins** (leaderboard opt-in entre fondateurs).
- ⏳ **15.4 Mascotte / personnalité de marque** — *à travailler ensemble plus tard*.

---

## Décisions actées

- Chatbot : **assistant guidé (scripté)**, pas d'IA.
- Google Agenda : **bouton « Ajouter à l'agenda » (.ics / lien)**.
- Emails groupés : **ciblage par segments flexibles** (events = jamais Pro).
- Priorité : libre (au choix de l'implémentation), roadmap tenue à jour ici.
