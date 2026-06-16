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
- ⏳ **3.3 Récap annuel** « ton année Bryan Cars » (nb prestas, BC, avant/après).
- ⏳ **3.4 Notif météo** (« beau temps ce week-end, créneau libre ? »).
  *(Bloqué : nécessite une clé d'API météo.)*
- ✅ **3.5 Activation des notifs plus visible** (bandeau si désactivées).

## 4. Réservation & planning

- ✅ **4.3 Liste d'attente** : sur un créneau pris, le client s'inscrit ; à
  l'annulation (client OU admin), **tous** les inscrits sont prévenus (mail +
  push). `src/db/waitlist.js` + `src/services/waitlistNotifier.js`.
- ✅ **4.4 Bouton « Ajouter à mon agenda »** (client + admin) — `.ics` + lien
  Google Calendar par RDV (`web/src/lib/calendar.ts`). *(Sync OAuth = plus tard.)*

## 5. Paiement & monétisation

- ✅ **5.1 Apple Pay / Google Pay** — géré par la page hébergée SumUp (à activer
  dans le dashboard SumUp, pas de dev). *Vérifié.*
- ⏳ **5.5 Factures** : le client demande sa facture → génération + envoi PDF par
  mail. *(Besoin des infos légales : raison sociale, adresse, SIRET, statut TVA,
  numérotation.)*

## 6. Communication client

- ⏳ **6.3 Galerie avant/après** : taguer les photos « avant » / « après » +
  slider comparatif sur la fiche RDV. *(Photos déjà présentes, tag à ajouter.)*
- ⏳ **Chatbot d'assistance (assistant guidé / scripté)** : aide à réserver et à
  retrouver le bon RDV, envoie des boutons de redirection (ex. ouvrir la popup
  RDV du 17 juin si libre ; retrouver un RDV dont le tarif est à valider).

## 7. Avis & réputation

- ⏳ **7.1 Demande d'avis automatisée** X h après une presta effectuée.
- ⏳ **7.2 Mur d'avis** : améliorer + repositionner la section avis.

## 8. Admin & opérations

- ⏳ **8.1 Dashboard stats** : CA, nb RDV, taux de remplissage, no-show, BC
  distribués.

## 10. Data & analytics

- ⏳ **10.1 Funnel d'inscription** (où ça décroche).
- ⏳ **10.2 Cohortes de rétention** (fondateurs vs BBX).
- ⏳ **10.4 Heatmap des créneaux** les plus demandés.

## 11. Contenu & marketing

- ⏳ **11.2 Emails groupés** : envoi en masse mis en forme (lancement / fin
  d'event auto) + composer texte libre mis en forme, **ciblage par segments
  flexibles** (tous / BBX / Fondateurs / Pro / actifs récents).
  ⚠️ Les mails **d'event** restent BBX/Fondateurs, **jamais Pro**.
- ⏳ **11.4 Events saisonniers** automatiques (préparation hiver/été…).

## 12. Technique / qualité

- ⏳ **12.1 Mode hors-ligne PWA** (cache fiche client/RDV) — *priorité basse*.
- ⏳ **12.2 Skeletons** au chargement (perçu plus rapide) — *priorité basse*.
- ⏳ **12.3 Virtualisation** des longues listes — *priorité basse*.
- ⏳ **12.6 Sauvegarde base** : snapshot du fichier `.db` vers stockage externe.
  *(Un export de données hebdo par mail existe déjà ; ceci est un vrai backup.)*

## 13. Accessibilité & i18n

- ⏳ **13 Pass accents** : remettre les accents (é/è/à/ê…) sur tous les textes
  visibles du site (actuellement tout est en non-accentué).

## 15. Communauté

- ⏳ **15.1 Classement BC'Coins** (leaderboard opt-in entre fondateurs).
- ⏳ **15.4 Mascotte / personnalité de marque** — *à travailler ensemble plus tard*.

---

## Décisions actées

- Chatbot : **assistant guidé (scripté)**, pas d'IA.
- Google Agenda : **bouton « Ajouter à l'agenda » (.ics / lien)**.
- Emails groupés : **ciblage par segments flexibles** (events = jamais Pro).
- Priorité : libre (au choix de l'implémentation), roadmap tenue à jour ici.
