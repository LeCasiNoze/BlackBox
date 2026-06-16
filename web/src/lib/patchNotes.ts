// Version applicative + notes de version (changelog) affichees dans l'admin.
// A tenir a jour a chaque livraison. La plus recente en premier.

export const APP_VERSION = "1.13.0";

export type PatchNote = {
  version: string;
  date: string; // AAAA-MM-JJ
  title: string;
  changes: string[];
};

export const PATCH_NOTES: PatchNote[] = [
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
