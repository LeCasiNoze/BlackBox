// Version applicative + notes de version (changelog) affichees dans l'admin.
// A tenir a jour a chaque livraison. La plus recente en premier.

export const APP_VERSION = "1.4.0";

export type PatchNote = {
  version: string;
  date: string; // AAAA-MM-JJ
  title: string;
  changes: string[];
};

export const PATCH_NOTES: PatchNote[] = [
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
