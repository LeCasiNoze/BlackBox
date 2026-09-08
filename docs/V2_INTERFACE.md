# Interface V2 — 6 septembre 2026

## Périmètre

La V2 conserve les routes et les traitements métier existants. Le travail porte sur les interfaces publiques, les trois types de comptes, les sections de l'administration et la connexion admin.

- Surfaces graphite, accents distincts BBX / fondateur / pro, boutons et champs harmonisés, rayons réduits, animations décoratives allégées.
- Accueil client compact, actions accessibles plus haut, navigation basse compatible avec les zones de sécurité mobiles.
- Menu admin défilable et fixe dans la fenêtre sur ordinateur ; menu modal au clavier sur mobile ; titres et indicateurs plus compacts.
- Correction du retour « Liste » sur mobile : la sélection automatique du premier client intervient seulement au chargement initial, sans remasquer la liste après un retour volontaire, un filtre ou un rafraîchissement.
- Les raccourcis flottants restent derrière les fenêtres de gestion pour ne plus recouvrir les commandes d'enregistrement.
- Galerie filtrable par intérieur / extérieur, sélection par véhicule, comparateur avant/après tactile et clavier, miniatures, accès au devis et trois vidéos avec son, commandes et boucle.
- Fenêtres photo communes : navigation, gestes tactiles, fermeture par Échap, verrouillage du défilement et restitution du focus.
- Finitions des pages de préparation à la vente, paiement, conditions, informations légales et facture imprimable.
- Chargement différé des pages : environ 137 Ko de JavaScript initial compressé contre 607 Ko avant modification. La page expérimentale 3D conserve son propre module volumineux.

## Organisation du code

`web/src/refinement.css` constitue la couche de présentation V2, chargée après le style historique. Elle réutilise les variables de thème et les classes partagées. Les styles de facture destinés à l'impression restent clairs.

`ShowcaseGallery`, `BeforeAfter` et `MediaDialog` isolent la galerie et ses interactions. `ImageLightbox` reste compatible avec ses appels existants. Les listes de médias d'origine restent dans la landing.

Les traitements de réservation, tarification, récompenses, paiement, envoi de messages et persistance n'ont pas été réécrits. Les changements de `src/routes/auth.js` concernent uniquement la présentation de la connexion.

## Vérification locale

Compilation : `npm run build --prefix web` (TypeScript et Vite).

ESLint ciblé sur les composants de galerie, fenêtres et sélection de prestations : aucune erreur.

Recette navigateur : 11 sections admin, 6 vues pour chacun des 3 profils et 10 routes publiques / utilitaires, aux largeurs 320, 390, 768 et 1440 px. Contrôle des erreurs JavaScript et du débordement horizontal. Interactions de galerie et menu mobile testées séparément.

Résultat : 156 combinaisons de rendu sans erreur JavaScript ni débordement horizontal. La correction de sélection client est vérifiée séparément après retour à la liste, rafraîchissement et changement de filtre ; la fenêtre reste dans le viewport et le bouton d'enregistrement est atteignable sans être recouvert.

Les six états de paiement sont présentés avec des réponses simulées ; la facture utilise également un exemple fictif. Aucun paiement réel, envoi de notification ou d'e-mail n'est exécuté par la recette. Les données de démonstration se trouvent dans `.tmp/v2-preview`, indépendamment de la base client.

Les scripts locaux `.tmp/v2-preview.cjs` et `.tmp/v2-visual.cjs` servent à la prévisualisation et à la recette. Le rapport machine est `.tmp/v2-audit.json`. Les captures sont enregistrées sous `.tmp/v2-*.png`.

Cette recette vérifie le rendu et les interactions ciblées sous Edge/Chromium. Elle ne constitue pas une certification de tous les parcours métier ni un test sur des appareils iOS physiques. Aucun déploiement n'a été effectué.

## Finitions des parcours clients

Accents renforcés et dégradés à deux teintes pour BBX, Fondateur et Pro. Apparition progressive des blocs, indicateur de navigation animé, réactions lumineuses au survol et transitions directionnelles des quatre étapes du devis. Les préférences de réduction du mouvement sont respectées.

Dernière vérification : compilation TypeScript/Vite et lint ciblé validés ; parcours devis contrôlé sur mobile jusqu’au récapitulatif, avec retour entre étapes et conservation du texte saisi. Aucune demande de test envoyée.

## Passe de finition du 8 septembre 2026

- Prestations : accordéons et sous-catégories à hauteur animée, contenu replié inerte au clavier, état annoncé aux lecteurs d’écran et sélection conservée. En-têtes resserrés sur mobile ; dégradé adapté au thème du compte.
- Réservation après devis payé et réservation Pro : transitions directionnelles communes, focus sur le titre de chaque étape et états d’heures sélectionnées explicites.
- Garage et avantages : états des sous-onglets explicites, nuances actives harmonisées ; compte personnel légèrement teinté.
- Administration : survol des lignes avec actions et focus des champs harmonisés.
- Assistance : commande utilisable au clavier ; sur mobile dans la réservation, la bulle est placée après le contenu et derrière la navigation fixe pour préserver les actions.

Validation : TypeScript/Vite et ESLint ciblé. Recette locale des accordéons BBX et Fondateur, conservation d’une prestation après repli, passage à l’état du véhicule, quatre étapes de réservation Pro jusqu’au récapitulatif à 390 px, changement d’onglet des récompenses. Aucune demande ni réservation envoyée. Cette passe ne constitue pas une nouvelle recette exhaustive de tous les états métier.

Finitions avant intégration : remise au point de lecture lors des étapes longues de réservation ; restitution du focus sans saut de page à la fermeture des fenêtres ; fermeture sur le fond uniquement si le geste commence sur le fond ; recommandation de photos harmonisée avec le thème du compte.
