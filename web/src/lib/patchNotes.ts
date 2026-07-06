// Version applicative + notes de version (changelog) affichees dans l'admin.
// A tenir a jour a chaque livraison. La plus recente en premier.

export const APP_VERSION = "1.41.1";

export type PatchNote = {
  version: string;
  date: string; // AAAA-MM-JJ
  title: string;
  changes: string[];
};

export const PATCH_NOTES: PatchNote[] = [
  {
    version: "1.41.1",
    date: "2026-07-06",
    title: "Fix : le filtre clients ne rafraichissait pas la liste",
    changes: [
      "Admin Clients : changer de filtre (BBX/Fondateur/Pro/Tout) revient desormais directement a la liste a jour, au lieu de laisser affichee la fiche du client precedent jusqu'a un tap manuel sur \"Liste\".",
    ],
  },
  {
    version: "1.41.0",
    date: "2026-07-05",
    title: "Filtre clients toujours visible + preuve d'etat des notifications",
    changes: [
      "Admin Clients : le filtre BBX / Fondateur / Pro / Tout est desormais toujours visible (avant, il disparaissait des qu'une fiche client etait ouverte sur telephone, le rendant quasi introuvable).",
      "Le bandeau notifications de l'accueil admin ne disparait plus une fois actif : il affiche desormais clairement \"Notifications activees\" en vert, avec un bouton \"Envoyer une notification test\" pour verifier soi-meme la reception sans attendre une vraie reservation.",
    ],
  },
  {
    version: "1.40.1",
    date: "2026-07-05",
    title: "Nouveau logo",
    changes: [
      "Nouveau logo BC dore (cercle brosse) : favicon, icone d'app et avatars remplaces, rogne serre et centre.",
    ],
  },
  {
    version: "1.40.0",
    date: "2026-07-05",
    title: "Bandeau accueil pour les photos demandees",
    changes: [
      "Quand l'admin demande des photos du vehicule pour valider un tarif, un bandeau bien visible apparait desormais tout en haut de l'accueil client (avant le bandeau de validation tarif) — un tap ouvre directement la fiche du rendez-vous concerne avec le message de l'admin et l'upload de photos.",
    ],
  },
  {
    version: "1.39.2",
    date: "2026-07-05",
    title: "Meme fiabilisation cote notifications client",
    changes: [
      "Le meme correctif que cote admin est applique cote client : le bandeau/icone notifications reflete l'etat reel du serveur (pas seulement la permission navigateur), et se resynchronise a chaque retour au premier plan de l'app.",
      "Protege aussi les clients contre le meme cas de figure que l'admin (abonnement reassigne si le meme appareil sert plusieurs comptes).",
    ],
  },
  {
    version: "1.39.1",
    date: "2026-07-05",
    title: "Notifications admin et client desormais independantes",
    changes: [
      "Correction de la vraie cause des notifications admin qui se desactivaient : sur un meme telephone, activer les notifications sur une fiche client et sur le tableau de bord admin partageaient le meme abonnement technique — la derniere activation ecrasait silencieusement l'autre. Chaque espace a maintenant son propre abonnement, ils ne s'ecrasent plus mutuellement.",
      "Une reactivation ponctuelle des notifications admin peut etre necessaire une derniere fois apres cette mise a jour.",
    ],
  },
  {
    version: "1.39.0",
    date: "2026-07-06",
    title: "A l'atelier & adresse client pour les RDV a domicile",
    changes: [
      "Le lieu « Au studio » devient « A l'atelier » partout (reservation, fiches, emails).",
      "RDV a domicile : l'adresse du client apparait desormais dans la notification push admin, dans l'email de nouvelle reservation (ligne Adresse dediee), et dans le Resume de la fiche RDV admin — avec lien direct vers Google Maps pour s'y rendre en un clic.",
      "Si l'adresse n'est pas renseignee sur la fiche client, l'admin en est averti clairement.",
    ],
  },
  {
    version: "1.38.1",
    date: "2026-07-05",
    title: "Fiabilisation des notifications push admin",
    changes: [
      "Le bandeau/bouton notifications reflete desormais l'etat reel cote serveur (et pas seulement la permission du navigateur) : si l'abonnement a ete supprime en base (endpoint expire), l'app le detecte et propose de reactiver, meme si le navigateur affichait deja \"autorise\".",
      "La resynchronisation de l'abonnement se relance a chaque retour au premier plan de l'app (pas seulement a l'ouverture), pour limiter les periodes silencieuses sans notification.",
      "Ajout d'un log serveur explicite quand un evenement (nouvelle reservation, etc.) ne peut declencher aucune notification push admin faute d'appareil abonne, pour diagnostiquer plus vite.",
    ],
  },
  {
    version: "1.38.0",
    date: "2026-07-03",
    title: "Page Clients admin + landing repensee",
    changes: [
      "Admin Clients : sur telephone, la liste laisse place a la fiche des qu'un client est choisi (bouton retour Liste) ; fleches precedent/suivant avec compteur pour enchainer les fiches ; bloc identite avec cadre dore signature.",
      "Landing : sur mobile, la carte d'inscription s'affiche directement en haut de page (plus besoin de scroller).",
      "Landing : carte d'inscription habillee comme la carte membre du portail (bord degrade + reflet anime), paliers Fondateur/BBX/Pro avec cadre aux couleurs de leur univers, nouveau bandeau « Comment ca marche » en 3 etapes.",
    ],
  },
  {
    version: "1.37.1",
    date: "2026-07-03",
    title: "Reservation : etape vehicule sautee si un seul vehicule",
    changes: [
      "Quand le compte n'a qu'un vehicule, il est selectionne automatiquement et la reservation passe directement au choix du lieu — une etape de moins.",
    ],
  },
  {
    version: "1.37.0",
    date: "2026-07-03",
    title: "Reservation 100% sequentielle & admin etape par etape",
    changes: [
      "Reservation : plus de textes d'aide ni d'etape demi-journee redondante — le calendrier suffit. Ensuite chaque clic devoile UNIQUEMENT le bloc suivant : heure -> vehicule -> lieu -> etat estime + demande particuliere -> photos -> envoi.",
      "Choisir le vehicule ou le lieu fait avancer automatiquement ; l'en-tete de l'etape Heure rappelle le jour et la demi-journee choisis (croix pour changer de jour).",
      "Vehicules : l'historique du vehicule est desormais replie (lignes compactes date + statut, la fiche s'ouvre au tap) — fini le foutoir sous la fiche.",
      "Admin Agenda/Livraison sur telephone : une etape a la fois — la liste laisse place au panneau de traitement des qu'un rendez-vous est choisi (bouton retour Liste).",
      "Admin : fleches precedent/suivant (avec compteur 2/7) pour passer d'un rendez-vous a l'autre sans revenir a la liste.",
      "Admin : demandes en attente avec pastille date (comme cote client), numeros d'etape 1/2, panneau accentue quand un dossier est ouvert.",
      "Correction : les pastilles date affichaient la date complete au lieu de jour + mois.",
    ],
  },
  {
    version: "1.36.0",
    date: "2026-07-03",
    title: "Etape par etape, scroll corrige & ecrans desencombres",
    changes: [
      "Reservation : chaque clic debloque la suite. L'heure doit etre confirmee (« Continuer avec 9 h 30 ») avant que les details n'apparaissent ; l'etape validee se replie en resume avec un bouton Modifier.",
      "Changer d'onglet ramene toujours en haut de la page (client et admin) — fini d'arriver au milieu d'un ecran.",
      "Vehicules : les boutons (Principal, Modifier, Supprimer) n'apparaissent que sur le vehicule selectionne — la liste reste aeree.",
      "Suivi : en-tete unique, filtres et compteur sur une seule ligne.",
      "Carte membre : l'image personnalisee du compte (fondateur/pro, definie par l'admin) s'affiche en fond de carte, fondue dans le theme.",
      "Admin — Agenda : la « Liste complete par jour » est repliee par defaut, un clic la deplie (le raccourci « en attente » l'ouvre automatiquement).",
      "Admin — Clients : l'historique rapide du client se deplie a la demande.",
    ],
  },
  {
    version: "1.35.0",
    date: "2026-07-03",
    title: "Reservation progressive & suivi en timeline",
    changes: [
      "La reservation se fait desormais directement sous le calendrier, etape par etape : le jour choisi devoile la demi-journee, puis l'heure d'arrivee (molette -/+ par pas de 30 min dans la fenetre 9h-12h ou 14h-18h), puis les details (vehicule en un tap, lieu, etat estime, note, photos) et le recapitulatif avant envoi.",
      "Plus de grande fenetre qui recouvre tout pour reserver : la modale ne sert plus qu'a modifier ou annuler un rendez-vous existant.",
      "Creneau complet : bouton « Me prevenir si ca se libere » directement sur la demi-journee.",
      "Suivi : les fiches s'affichent sur une timeline (fil + points), en-tete allege « Suivi & factures ».",
      "En-tetes de pages allegees (Reserver, Suivi) : titre clair au lieu d'un gros bloc.",
    ],
  },
  {
    version: "1.34.0",
    date: "2026-07-03",
    title: "Design v2 partout : boutique, vehicules, suivi, admin",
    changes: [
      "Boutique credits (BBX) : vraies cartes d'offres (1 / 3 / 5 / 10 credits) avec badge « Populaire », prix calcules depuis l'offre SumUp — fini l'achat a l'unite austere.",
      "Le bouton « Recharger » (carte membre + raccourci accueil) ouvre desormais la boutique au lieu du paiement direct.",
      "Boutique fondateur : badge « Meilleur tarif » automatique sur le pack le plus avantageux, portefeuille BC'Coins avec piece et differes, recompenses avec vignettes.",
      "Vehicules : vignette voiture sur chaque carte, bouton « Ajouter un vehicule » en pointilles.",
      "Suivi : cartes de rendez-vous avec pastille date, chips photos/avis, factures avec icone document.",
      "Reservation : etapes 1-2 visuelles avec fenetres horaires (9h-12h / 14h-18h), heures/minutes en boutons pleins.",
      "Assistant : panneau accorde au theme du compte (fini le brun fixe), bulle et reponses rapides restylees.",
      "Modales mobiles : poignee de bottom-sheet sur tous les paneaux.",
      "Admin : bandeau de section facon carte membre avec badge Admin.",
    ],
  },
  {
    version: "1.33.0",
    date: "2026-07-03",
    title: "Design : carte membre & accueil repense (3 univers)",
    changes: [
      "Nouvel accueil client : carte membre BlackBox (palier BBX / Fondateur / Pro, solde de lavages avec jauge, bouton Recharger, BC'Coins pour les fondateurs) avec reflet anime.",
      "Nouvelle carte « Prochain rendez-vous » avec pastille date : ouvre directement la fiche du RDV ; sinon propose la prochaine dispo.",
      "Navigation (mobile et desktop) : barre pilule tokenisee par univers, onglet actif avec halo — plus aucun hex code en dur.",
      "Boutique fondateur : chaque pack affiche ses recompenses (+80 BC/credit immediat, +20 differes, 1 case a ouvrir).",
      "Le halo de la carte evenement s'accorde desormais au theme du compte (violet / rose / bleu).",
      "Admin : teintes champagne figees remplacees par les tokens du theme, menu avec etat actif lumineux.",
      "Reflet de la carte membre en pause sur mobile (performances preservees).",
    ],
  },
  {
    version: "1.32.0",
    date: "2026-07-02",
    title: "Conformite : mentions legales, confidentialite & cookies",
    changes: [
      "Nouvelles pages legales publiques : Mentions legales, Politique de confidentialite (RGPD) et Politique de cookies, accessibles depuis le pied de page de l'accueil et le formulaire d'inscription.",
      "Les mentions legales se remplissent automatiquement depuis les Reglages (Societe) : deux nouveaux champs (Directeur de la publication, Immatriculation) a completer. Au passage en SARL, il suffira de mettre a jour ces champs.",
      "La case d'inscription renvoie desormais reellement vers les conditions et la politique de confidentialite.",
      "Aucune banniere cookies n'est requise : le site n'utilise que des cookies techniques essentiels (aucun traceur), ce qui est precise dans la politique de cookies.",
    ],
  },
  {
    version: "1.31.0",
    date: "2026-06-26",
    title: "Factures : societe du client + designation service",
    changes: [
      "Quand le client a une societe renseignee, son nom de societe s'affiche au-dessus de son nom sur la facture.",
      "La designation est desormais « Nettoyage véhicule » sur toutes les factures (au lieu de l'intitule des credits). Les factures deja passees s'adaptent automatiquement (elles sont generees a la demande).",
    ],
  },
  {
    version: "1.30.2",
    date: "2026-06-24",
    title: "Photos : jusqu'a 8 (devis & reservation)",
    changes: [
      "La limite passe de 4 a 8 photos pour les demandes de devis et les reservations. Les photos restent automatiquement allegees (rotation + redimension + WebP) avant stockage.",
    ],
  },
  {
    version: "1.30.1",
    date: "2026-06-24",
    title: "Devis : bouton visible sur tous les accueils",
    changes: [
      "Le bouton « Obtenir un devis » s'affiche desormais aussi sur l'accueil des comptes BBX standard (il manquait sur cette variante).",
    ],
  },
  {
    version: "1.30.0",
    date: "2026-06-22",
    title: "Devis : estimation en credits (BBX & fondateurs)",
    changes: [
      "Nouveau bouton « Obtenir un devis » sur l'accueil (BBX & fondateurs) : le client envoie des photos + une description, exactement comme pour une reservation.",
      "L'admin recoit la demande (e-mail + notification) dans une nouvelle rubrique « Devis », chiffre l'estimation en credits en un geste (1/2/3… ou personnalise) et peut ajouter un commentaire.",
      "Le client est notifie de la reponse : l'estimation « X credits » s'affiche en haut de sa demande, avec un bouton « Recharger X credits » qui mene a la recharge adaptee (packs pour les fondateurs, a l'unite pour les BBX).",
    ],
  },
  {
    version: "1.29.0",
    date: "2026-06-22",
    title: "Notifications admin (push) + annulation plus souple",
    changes: [
      "Notifications admin : une banniere d'activation s'affiche sur l'accueil admin tant que les notifications push ne sont pas actives sur l'appareil, avec la marche a suivre iPhone (ajouter l'app a l'ecran d'accueil puis activer). C'etait la cause des alertes de RDV manquantes : aucun appareil admin n'etait reellement abonne aux notifications.",
      "Annulation : les fondateurs et les pros peuvent annuler un rendez-vous a tout moment, tant qu'il n'est pas marque effectue (les autres comptes : jusqu'a 24h avant le creneau).",
      "Annulation : une confirmation est desormais demandee avant d'annuler, pour eviter les annulations accidentelles.",
    ],
  },
  {
    version: "1.28.0",
    date: "2026-06-18",
    title: "Admin plus rapide : accueil actionnable, RDV en 1 geste, acces mobile",
    changes: [
      "Accueil admin : nouveau bloc « Ce qui m'attend » — les demandes a valider et les livraisons a preparer sont cliquables directement, avec des alertes (clients a court de credits, lots a remettre).",
      "RDV plus rapides : boutons « Fixer le tarif » et « Marquer effectue » directement sur les cartes de l'agenda, sans ouvrir le detail.",
      "Validation de tarif : recap « le client sera facture de X credits » avec confirmation avant de valider, pour eviter les erreurs.",
      "Mobile : bouton d'acces rapide flottant (Demandes / Livraisons / Clients) avec compteurs, accessible en 1 tap depuis n'importe quelle vue.",
    ],
  },
  {
    version: "1.27.0",
    date: "2026-06-18",
    title: "Reservation : notification admin fiabilisee (Pro inclus)",
    changes: [
      "La notification admin (e-mail + push) d'une nouvelle reservation part desormais en priorite, avant les traitements secondaires (lots gagnes, liste d'attente) : plus aucun effet de bord ne peut l'empecher d'etre envoyee — y compris pour les comptes Pro, dont le RDV est confirme directement.",
      "Ajout d'une trace serveur si la notification admin n'a pas pu partir, pour diagnostiquer immediatement un souci d'envoi (cle Brevo / adresse admin).",
    ],
  },
  {
    version: "1.26.0",
    date: "2026-06-17",
    title: "Inscription : remontee auto vers la saisie du code",
    changes: [
      "Apres l'envoi du code (et a la creation du compte), la page d'inscription remonte automatiquement sur la carte pour voir directement la saisie du code.",
    ],
  },
  {
    version: "1.25.0",
    date: "2026-06-17",
    title: "Tirage au sort immersif (jeux concours)",
    changes: [
      "Nouveau tirage filmable : « Tirer au sort » ouvre une page noir & or plein ecran. Les noms defilent (animation de la box) puis ralentissent jusqu'au gagnant, affiche en grand avec confettis et son.",
      "Re-tirage en excluant les gagnants precedents (2e, 3e gagnant), bouton « Terminer l'evenement », et bouton plein ecran pour filmer le tirage comme preuve.",
      "Participants editables avant le tirage (participants de l'app + noms colles / ajoutes a la main) dans le panneau Evenements.",
      "Historique des tirages (date, nombre de participants, gagnants) consultable dans le menu Evenements.",
    ],
  },
  {
    version: "1.24.0",
    date: "2026-06-16",
    title: "Accueil client : carte evenement cliquable + bulle assistant deplaçable",
    changes: [
      "La carte « Evenement » de l'accueil s'ouvre en cliquant n'importe ou dessus (plus seulement sur le bouton).",
      "La bulle de l'assistant (chat) est deplaçable par glisser-deposer pour ne plus gener la lecture.",
    ],
  },
  {
    version: "1.23.0",
    date: "2026-06-16",
    title: "Photos prestation : Avant/Apres auto + images allegees + logo facture",
    changes: [
      "Les photos d'un rendez-vous sont separees automatiquement : « Avant » (envoyees par le client) et « Apres » (postees par l'admin). (Les photos deja en ligne restent a tagger a la main cote admin.)",
      "Chaque photo uploadee est automatiquement allegee (rotation, redimension max 1600px, WebP) : chargement bien plus rapide, fini les bugs d'affichage des grosses photos iPhone (~ -75% de poids).",
      "Logo Bryan Cars ajoute en haut des factures.",
    ],
  },
  {
    version: "1.22.0",
    date: "2026-06-16",
    title: "Admin — menu unique (sidebar desktop / tiroir mobile)",
    changes: [
      "Toute la navigation admin est regroupee dans un seul menu : sections (Hall, Agenda, Livraison, Clients, Stats, Evenements, Emails, Reglages) + activation des notifications + deconnexion.",
      "Desktop : rail lateral fixe. Mobile : bouton menu (hamburger) qui ouvre un tiroir lateral. Fini la barre du bas et les boutons disperses.",
    ],
  },
  {
    version: "1.21.0",
    date: "2026-06-16",
    title: "Admin : menu en sidebar + accueil client (ajustement)",
    changes: [
      "Admin : la barre d'onglets devient un menu lateral (sidebar) sur desktop, plus lisible ; barre du bas conservee sur mobile.",
      "Accueil client (BBX) : « Devenir fondateur » remonte dans la carte principale, juste sous « Prendre rendez-vous ».",
    ],
  },
  {
    version: "1.20.0",
    date: "2026-06-16",
    title: "Admin — navigation repensee (moins de scroll)",
    changes: [
      "Le Hall n'empile plus tous les panneaux : il devient un apercu rapide + un lanceur de sections.",
      "Nouvelles pages dediees : Statistiques (stats + analytics), Evenements (events + goodies), Communication (e-mails groupes), Reglages (entreprise + notes de version).",
      "Nouvelle barre d'onglets (toutes les sections) + barre du bas mobile (sections principales) pour passer d'une page a l'autre facilement.",
    ],
  },
  {
    version: "1.19.0",
    date: "2026-06-16",
    title: "Ouverture de case — animations (Framer Motion)",
    changes: [
      "L'ouverture de case (box BC'Coins) gagne des animations plus fluides : apparition en ressort de la fenetre et de la carte de gain, « pop » du montant gagne — en plus des confettis et du reel.",
      "Les animations Framer Motion respectent le reglage systeme « animations reduites » (accessibilite).",
    ],
  },
  {
    version: "1.18.0",
    date: "2026-06-16",
    title: "Admin — coherence visuelle (tokens d'accent)",
    changes: [
      "Le tableau de bord admin passe entierement au systeme d'accents par tokens : couleurs alignees sur la nouvelle direction artistique et plus faciles a faire evoluer.",
    ],
  },
  {
    version: "1.17.0",
    date: "2026-06-16",
    title: "Refonte visuelle — Nocturne Raffine (portail client)",
    changes: [
      "Nouvelle direction artistique : typographie Inter, base sombre « Nocturne » affinee, systeme d'accents pilote par tokens CSS.",
      "Un univers visuel par type de compte : Fondateur (or rose / onyx), BBX (violet neon), Pro (bleu blueprint) — fond, surfaces et accents distincts.",
      "Accueil repense (mobile-first) : action « Prendre rendez-vous » dominante et guidee, statut en clair, acces rapides en grille, micro-animations.",
      "Landing, en-tete et prise de rendez-vous (etapes guidees) refondus.",
    ],
  },
  {
    version: "1.16.0",
    date: "2026-06-16",
    title: "Analytics admin (donnees & retention)",
    changes: [
      "Nouveau panneau Analytics dans le Hall : taux de conversion des inscriptions, cohortes de retention (BBX vs Fondateurs : deja venus / actifs 90j / fideles), et heatmap des creneaux demandes (180 jours).",
    ],
  },
  {
    version: "1.15.0",
    date: "2026-06-16",
    title: "Photos avant / apres",
    changes: [
      "Cote admin (Livraison) : possibilite de taguer chaque photo « Avant » ou « Apres » (optionnel).",
      "Cote client : les photos taguees s'affichent regroupees en sections Avant / Apres sur la fiche du rendez-vous (sinon, galerie normale).",
    ],
  },
  {
    version: "1.14.0",
    date: "2026-06-16",
    title: "Assistant Bryan Cars",
    changes: [
      "Assistant guide (bulle en bas a droite du portail client) : ouvrir un rendez-vous, valider un tarif, prendre un RDV, box & recompenses, questions frequentes, contact — avec des boutons qui ouvrent directement le bon ecran.",
    ],
  },
  {
    version: "1.13.0",
    date: "2026-06-16",
    title: "Classement BC'Coins (fondateurs)",
    changes: [
      "Les fondateurs peuvent rejoindre (opt-in) un classement BC'Coins et se comparer aux autres (prenom + initiale). Accessible depuis l'accueil fondateur.",
    ],
  },
  {
    version: "1.12.0",
    date: "2026-06-16",
    title: "E-mails groupes & annonces d'evenement",
    changes: [
      "Admin : composer d'e-mail groupe (titre, message, bouton) avec ciblage par segment (tous / BBX / fondateurs / pro / actifs recents).",
      "Annonce automatique par e-mail au lancement et a la fin d'un evenement, envoyee a l'audience concernee (jamais aux Pro).",
    ],
  },
  {
    version: "1.11.0",
    date: "2026-06-16",
    title: "Accents (1re passe)",
    changes: [
      "Les textes affiches sont desormais accentues (evenement -> événement, reserve -> réservé, credits -> crédits...). 1re passe automatique : quelques formes ambigues seront affinees ensuite.",
    ],
  },
  {
    version: "1.10.0",
    date: "2026-06-16",
    title: "Tableau de bord statistiques (admin)",
    changes: [
      "Nouveau panneau Statistiques par mois dans le Hall admin : CA encaisse, RDV par statut, credits consommes, BC'Coins distribues, nouveaux clients, totaux. Navigation mois precedent / suivant.",
    ],
  },
  {
    version: "1.9.0",
    date: "2026-06-16",
    title: "Demande d'avis automatique & mur d'avis",
    changes: [
      "72h apres une prestation effectuee (sans avis), le client recoit une demande d'avis (e-mail + notification) qui ouvre directement la fiche du RDV sur la section avis. Un seul rappel.",
      "Mur d'avis clients (notes 4-5 etoiles avec commentaire) affiche sur la page d'accueil publique.",
    ],
  },
  {
    version: "1.8.0",
    date: "2026-06-16",
    title: "Recap annuel 'Mon annee Bryan Cars'",
    changes: [
      "Le client decouvre son recap de l'annee (prestations, credits, BC'Coins, vehicules, avis, photos) dans Suivi.",
      "Admin : bouton 'Envoyer le recap annuel' qui envoie le recap par e-mail a tous les clients BBX ayant au moins une prestation dans l'annee.",
    ],
  },
  {
    version: "1.7.0",
    date: "2026-06-16",
    title: "Factures clients",
    changes: [
      "Le client retrouve ses factures (paiements regles) dans Suivi, avec une facture imprimable / enregistrable en PDF.",
      "Admin : panneau 'Mentions des factures' (raison sociale, SIRET, TVA, adresse...) editable, repris automatiquement sur les factures.",
    ],
  },
  {
    version: "1.6.0",
    date: "2026-06-16",
    title: "Liste d'attente & notifications iPhone",
    changes: [
      "Liste d'attente : sur un creneau deja pris, le client peut s'inscrire. Quand le creneau se libere (annulation client ou admin), tous les inscrits sont prevenus (e-mail + notification).",
      "Banniere notifications adaptee a l'iPhone : invite a installer l'app sur l'ecran d'accueil (prealable au push sur iOS) quand ce n'est pas fait.",
    ],
  },
  {
    version: "1.5.0",
    date: "2026-06-16",
    title: "Rappels, notifications & ajout a l'agenda",
    changes: [
      "Rappels d'inactivite automatiques : relance par e-mail (+ push) apres environ 8 semaines sans rendez-vous, au plus une fois par mois.",
      "Banniere d'accueil pour activer les notifications quand elles ne le sont pas (pour ne plus rater les notifs de RDV / validation de tarif).",
      "Bouton 'Ajouter a mon agenda' sur les rendez-vous (fichier .ics + lien Google Calendar), cote client et cote admin.",
    ],
  },
  {
    version: "1.4.0",
    date: "2026-06-16",
    title: "Performance mobile, versioning & compteurs admin",
    changes: [
      "Scroll mobile nettement plus fluide (suppression du fond fixe, des effets de flou et du blend-mode couteux, pause des animations decoratives sur mobile).",
      "Numero de version de l'application + onglet Notes de version dans l'admin.",
      "Compteurs de notification sur les onglets admin (RDV a traiter, a effectuer, lots a remettre).",
    ],
  },
  {
    version: "1.3.0",
    date: "2026-06-15",
    title: "Evenements, validation de tarif & programme fondateur",
    changes: [
      "Evenements : liste des participants avec leur nombre de tickets (admin), tickets desormais persistes.",
      "Validation de tarif : correction du plafond de recharge (un tarif eleve credite bien le bon nombre) + bandeau d'accueil 'Valider le tarif' qui ouvre directement le RDV.",
      "Programme fondateur : acces a vie a 29,99 EUR, places limitees a 50, compteur de places restantes affiche.",
      "Les e-mails (tarif, photos, statut, rappel) renvoient directement sur le bon RDV dans l'application.",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-06-15",
    title: "Recompenses, box & avis",
    changes: [
      "Les lots gagnes (box avis / consolation) sont rattaches au prochain RDV a venir, visibles cote client (suivi) et cote admin (agenda + livraison).",
      "Box avis Google : ouverture uniquement via le bouton 'Ouvrir ma box' (elle reste disponible tant qu'elle n'est pas ouverte).",
      "Evenement : participation automatique des la 1re action, on peut continuer a gagner des tickets.",
      "Section avis : uniquement notes et commentaires (photos retirees).",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-06-15",
    title: "Evenements, fondateur & installation",
    changes: [
      "Systeme d'evenements / concours (tickets, box de consolation fondateurs, tirage au sort).",
      "Box 'avis Google' avec recompenses, programme fondateur, suppression de compte cote admin.",
      "Acceptation des conditions a l'inscription, popup d'installation de l'app + activation des notifications.",
    ],
  },
];
