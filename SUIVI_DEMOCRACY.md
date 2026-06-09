# Suivi BlackBox / Bryan Cars Detailing

Derniere mise a jour: 2026-06-09

## Contexte

Ce fichier sert de memo vivant pour :

- les demandes remontees par le proprietaire
- les decisions produit prises ensemble
- l'avancement reel du projet
- les prochains objectifs a traiter

## Demandes nettoyees

### Produit / UX

- Mettre un bouton "Reserver maintenant" visible des l'arrivee sur l'espace client.
- Permettre des fonds personnalises pour certaines fiches client VIP.
- Integrer les avis Google dans l'experience.
- Afficher le dernier passage, la date du jour et une alerte quand un vehicule reste trop longtemps sans entretien.
- Gerer les formules avec date d'achat, date d'expiration et validite.
- Ajouter une page "Conditions & reglement" cote client.
- Forcer l'acceptation des conditions avant validation d'une formule.
- Enregistrer date et heure d'acceptation des conditions.
- Envoyer un mail recapitulatif apres achat de formule.
- Rendre le parcours rendez-vous admin plus propre et plus logique.
- Repenser l'agenda mobile, aujourd'hui trop long et trop gourmand en scroll.
- Clarifier / supprimer les cadres qui n'apportent pas de valeur dans l'UI.

### Metier / data

- Evoluer de "1 client = 1 vehicule" vers "1 client = plusieurs vehicules".
- Faire fonctionner le systeme pour les particuliers et pour les comptes agence.
- Garder les credits au niveau du compte client / agence, jamais au niveau d'un vehicule.
- Creer un vrai dossier par vehicule avec historique, notes, photos et prestations.
- Interdire tout remplacement destructif d'un vehicule existant.
- Ajouter un statut "Data" pour enregistrer des contacts sans carte BlackBox.
- Ajouter un filtre admin `Tout / BBX / Data` avec `BBX` par defaut.

### Fidelisation / marketing

- Ajouter les Bryan Points cote client et admin.
- Prevoir une boutique Bryan Points.
- Ajouter les "Membres fondateurs" limites a 10 places.
- Proposer un bouton d'avis Google apres cloture d'une prestation.
- Ajouter un etat de proprete du vehicule dans chaque prestation.
- Permettre le telechargement d'un certificat Bryan Cars.

### Technique / exploitation

- Mettre en place une sauvegarde quotidienne de la base.
- Sauvegarder aussi les photos.
- Prevoir une restauration simple.
- Vider la base de demonstration avant le vrai lancement.

## Demandes ajoutees pendant nos echanges

- Le planning doit autoriser 2 passages max par jour :
  un le matin `9h-12h`, un l'apres-midi `14h-18h`.
- Un creneau reserve ou confirme bloque toute la demi-journee pour les autres clients.
- Le clic sur une date doit ouvrir directement le detail du jour / popup.
- L'admin doit etre cloisonne en plusieurs zones plus lisibles.
- Le logo / univers Bryan Cars doit etre plus present visuellement.

## Decision produit importante

### Visibilite des avis / notes / photos entre clients

Decision actuelle :

- Les autres clients peuvent voir les photos ajoutees par l'admin.
- Les autres clients peuvent voir la note etoilee et le commentaire du client.
- La note admin reste strictement privee au dossier du client concerne.
- On ne diffuse pas publiquement le contact, le nom complet ou les donnees sensibles du client.

## Workflow cible rendez-vous

Flux recommande :

1. Le client demande un rendez-vous.
2. L'admin confirme ou refuse.
3. Le rendez-vous passe en `confirme`.
4. Une fois la prestation faite, l'admin passe en `effectue`.
5. L'admin ajoute note privee, photos et etat du vehicule.
6. Le client consulte son dossier et note la prestation.
7. Les photos admin + la note etoilee + le commentaire client remontent dans la galerie commune.

## Roadmap

### P0 - Blocants lancement

- [x] Corriger le stockage Render pour la base et les uploads
- [x] Importer le logo Bryan Cars officiel dans le projet
- [x] Desactiver le seed automatique de demo
- [x] Vider la base clients / rendez-vous / photos
- [x] Corriger le bug visuel des listes horaires blanches
- [x] Remplacer les anciens logos visibles par le logo officiel Bryan Cars
- [x] Ajouter une galerie publique client automatique pour photos admin + avis client
- [ ] Nettoyer le workflow admin rendez-vous
- [ ] Simplifier encore l'ecran admin rendez-vous
- [ ] Reduire radicalement la hauteur du planning mobile

### P1 - Solidifier le coeur produit

- [x] Ajouter le type de client `BBX` / `Data`
- [x] Ajouter filtre admin `Tout / BBX / Data`
- [x] Creer des clients `Data` sans carte
- [x] Ajouter date d'achat / date d'expiration des formules
- [x] Ajouter page / menu "Conditions & reglement"
- [x] Enregistrer l'acceptation des conditions
- [x] Ajouter un recapitulatif formule envoyable par email
- [ ] Ajouter bouton Google review apres cloture

### P2 - Refonte metier agence / multi-vehicules

- [x] Mode multi-vehicules par compte
- [x] Ajout de vehicule lors de la reservation
- [x] Dossier individuel par vehicule
- [ ] Credits portes par le compte et non par le vehicule
- [x] Historique prestations / photos / notes par vehicule

### P3 - Fidelisation / image de marque

- [x] Bryan Points
- [x] Boutique de recompenses
- [x] Membres fondateurs
- [ ] Certificat Bryan Cars
- [ ] Fonds personnalises VIP
- [x] Export complet manuel + envoi hebdomadaire admin

## Avancement du jour

- Le texte du proprietaire a ete relu et structure.
- La roadmap a ete formalisee.
- Le logo officiel a ete identifie sur le disque `D:`.
- Le logo a ete copie dans `web/public/bryan-cars-logo.png`.
- Le seed automatique de demo a ete desactive.
- La base a ete videe : `0 client / 0 rendez-vous / 0 photo de rendez-vous`.
- Les listes horaires natives ont ete remplacees par des boutons integres a l'UI.
- Les anciens logos visibles de l'accueil et de l'espace client ont ete remplaces.
- Une galerie publique "photos admin + avis client" a ete ajoutee cote client.
- Les photos ajoutees par l'admin sont maintenant visibles par tous les clients.
- La note admin reste privee au dossier du client concerne.
- Les clients peuvent maintenant consulter puis accepter les conditions depuis leur carte ou une page dediee.
- La date et l'heure d'acceptation des conditions sont enregistrees.
- Les nouvelles reservations sont bloquees tant que les conditions ne sont pas acceptees.
- Les fiches client affichent maintenant la date d'achat et la date d'expiration de la formule.
- L'admin peut envoyer un recapitulatif formule par email depuis la fiche client.
- Les clients peuvent maintenant etre crees en `BBX` ou `Data` depuis l'admin.
- Les comptes `Data` n'ont pas de carte client publique.
- Les comptes `Fondateur` disposent d'un habillage premium et d'un visuel personnalise.
- Le client peut ajouter, modifier, supprimer et choisir son vehicule principal.
- La reservation rattache desormais explicitement le rendez-vous au vehicule choisi.
- L'historique client peut etre lu par vehicule.
- Les `BC'Coins` sont calcules a 100 points par prestation effectuee.
- Une boutique BC'Coins client permet de demander les recompenses.
- Une demande BC'Coins declenche une notification email admin des que la config mail sera en place.
- L'admin peut noter la proprete / qualite du vehicule sur chaque rendez-vous.
- Une moyenne de proprete remonte maintenant sur la fiche client admin.
- Un export JSON complet du site peut etre lance depuis l'admin.
- Un export hebdomadaire le dimanche a 10h est prepare cote serveur.
- Un script `npm run seed:founder` reset la base et recree un compte fondateur propre.
- La base a ete reset et reseedee avec `1 client fondateur / 1 vehicule / 0 rendez-vous`.
- La configuration mail n'est pas encore active dans `src/.env` : aucune variable Brevo / admin n'est renseignee.
- La prochaine etape immediate est la finition UX mobile et le branchement reel des emails.

## Points a verifier ensuite

- Est-ce qu'un client `Data` doit pouvoir recevoir plus tard une carte BBX sans recreer une nouvelle fiche ?
- Est-ce qu'on veut moderer le commentaire client avant affichage public ou l'assumer tel quel ?
- Est-ce qu'on veut afficher un consentement client explicite avant mise en ligne de son avis ?
