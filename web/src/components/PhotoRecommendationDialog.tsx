import { MediaDialog } from "./MediaDialog";
import { ArrowRight, Camera, X } from "lucide-react";

type PhotoRecommendationDialogProps = {
  open: boolean;
  onClose: () => void;
  onAddPhotos: () => void;
  onContinue: () => void;
};

export function PhotoRecommendationDialog({
  open,
  onClose,
  onAddPhotos,
  onContinue,
}: PhotoRecommendationDialogProps) {
  if (!open) return null;

  return (
    <MediaDialog onClose={onClose} label="Photos recommandées">

      <section className="bb-surface-strong relative w-full max-w-md rounded-[18px] border border-amber-200/25 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.7)] sm:p-6">
        <button
          aria-label="Fermer"
          className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/50"
          onClick={onClose}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-amber-200/25 bg-amber-200/10 text-amber-100">
          <Camera className="h-6 w-6" />
        </span>
        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-100/65">
          Photos recommandées
        </p>
        <h2 className="mt-2 text-xl font-black text-white">Vous n&apos;avez ajouté aucune photo</h2>
        <p className="mt-3 text-sm leading-6 text-white/62">
          Elles nous sont très utiles pour évaluer précisément l&apos;état du véhicule et fixer un prix juste pour la ou les prestations choisies. Vous pouvez néanmoins continuer sans photo.
        </p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <button
            className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-xs font-black text-white"
            onClick={onAddPhotos}
            type="button"
          >
            <Camera className="h-4 w-4" /> Ajouter des photos
          </button>
          <button
            className="flex items-center justify-center gap-2 rounded-xl bg-[#e8c98a] px-4 py-3 text-xs font-black text-black"
            onClick={onContinue}
            type="button"
          >
            Continuer sans photo <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </MediaDialog>
  );
}
