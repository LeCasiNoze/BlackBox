import { MediaDialog } from "./MediaDialog";
import { Camera, X } from "lucide-react";

type PhotoRecommendationDialogProps = {
  open: boolean;
  onClose: () => void;
  onAddPhotos: () => void;
};

export function PhotoRecommendationDialog({
  open,
  onClose,
  onAddPhotos,
}: PhotoRecommendationDialogProps) {
  if (!open) return null;

  return (
    <MediaDialog onClose={onClose} label="Photo obligatoire pour le devis">

      <section className="bb-surface-strong relative w-full max-w-md rounded-[18px] border border-accent/25 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.7)] sm:p-6">
        <button
          aria-label="Fermer"
          className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/50"
          onClick={onClose}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-accent/25 bg-accent/10 text-accentSoft">
          <Camera className="h-6 w-6" />
        </span>
        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-accentSoft/75">
          Photo obligatoire
        </p>
        <h2 className="mt-2 text-xl font-black text-white">Vous n&apos;avez ajouté aucune photo</h2>
        <p className="mt-3 text-sm leading-6 text-white/62">
          Ajoutez au moins une photo nette du véhicule pour envoyer votre demande. Montrez les zones à traiter : habitacle, carrosserie ou détails des salissures. Elles permettent à l&apos;atelier d&apos;établir un devis adapté.
        </p>
        <div className="mt-6 grid gap-2">
          <button
            className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-xs font-black text-white"
            onClick={onAddPhotos}
            type="button"
          >
            <Camera className="h-4 w-4" /> Ajouter des photos
          </button>
        </div>
      </section>
    </MediaDialog>
  );
}
