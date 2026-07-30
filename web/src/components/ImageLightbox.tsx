import * as React from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "../lib/portal";

export type LightboxImage = {
  id: string | number;
  url: string;
  label?: string | null;
};

type ImageLightboxProps = {
  images: LightboxImage[];
  currentUrl: string | null;
  onClose: () => void;
  onChange: (url: string) => void;
};

export function ImageLightbox({
  images,
  currentUrl,
  onClose,
  onChange,
}: ImageLightboxProps) {
  const touchStartX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);
  const currentIndex = Math.max(
    0,
    images.findIndex((image) => image.url === currentUrl),
  );
  const currentImage = images[currentIndex] ?? (currentUrl ? { id: currentUrl, url: currentUrl } : null);
  const canNavigate = images.length > 1;

  const goTo = React.useCallback(
    (direction: -1 | 1) => {
      if (!canNavigate) return;
      const nextIndex = (currentIndex + direction + images.length) % images.length;
      onChange(images[nextIndex].url);
    },
    [canNavigate, currentIndex, images, onChange],
  );

  React.useEffect(() => {
    if (!currentUrl) return undefined;

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowLeft") {
        goTo(-1);
      } else if (event.key === "ArrowRight") {
        goTo(1);
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [currentUrl, goTo, onClose]);

  if (!currentUrl || !currentImage) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-between bg-black/95 px-3 py-4 backdrop-blur-xl select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* ── BARRE DE NAVIGATION SUPÉRIEURE AVEC BOUTON RETOUR ── */}
      <div
        className="relative z-20 flex items-center justify-between gap-3 border-b border-white/10 pb-3 max-w-7xl w-full mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label="Retour à l'écran"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 bg-white/10 text-white font-bold text-xs uppercase tracking-wider hover:bg-white/20 hover:border-white transition-all cursor-pointer shadow-lg"
          onClick={onClose}
          type="button"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>RETOUR À L&apos;ÉCRAN</span>
        </button>

        <div className="text-center min-w-0 flex-1 px-2">
          {currentImage.label && (
            <p className="text-xs sm:text-sm font-bold text-white truncate">
              {currentImage.label}
            </p>
          )}
          {canNavigate && (
            <span className="text-[11px] font-mono text-[#e8c98a] font-semibold">
              Photo {currentIndex + 1} sur {images.length}
            </span>
          )}
        </div>

        <button
          aria-label="Fermer"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20 cursor-pointer"
          onClick={onClose}
          type="button"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* ── ZONE DE L'IMAGE PRINCIPALE ET SWIPE ── */}
      <div className="relative flex-1 flex items-center justify-center py-2 max-w-6xl w-full mx-auto overflow-hidden">
        {canNavigate && (
          <button
            aria-label="Photo précédente"
            className="absolute left-2 sm:left-4 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white transition hover:bg-[#e8c98a] hover:text-black hover:scale-110 shadow-2xl cursor-pointer"
            onClick={(event) => {
              event.stopPropagation();
              goTo(-1);
            }}
            type="button"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
        )}

        <div
          className="relative flex h-full w-full items-center justify-center p-2"
          onClick={(event) => event.stopPropagation()}
          onTouchEnd={(event) => {
            if (touchStartX.current == null || touchStartY.current == null) return;
            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - touchStartX.current;
            const deltaY = touch.clientY - touchStartY.current;
            touchStartX.current = null;
            touchStartY.current = null;

            if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.1) {
              goTo(deltaX > 0 ? -1 : 1);
            }
          }}
          onTouchStart={(event) => {
            const touch = event.touches[0];
            touchStartX.current = touch.clientX;
            touchStartY.current = touch.clientY;
          }}
        >
          <img
            alt={currentImage.label || "Photo grand format"}
            className="max-h-[75vh] sm:max-h-[78vh] max-w-full select-none rounded-2xl border border-white/15 object-contain shadow-[0_20px_80px_rgba(0,0,0,0.8)] transition-all duration-200"
            draggable={false}
            src={currentImage.url}
          />
        </div>

        {canNavigate && (
          <button
            aria-label="Photo suivante"
            className="absolute right-2 sm:right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white transition hover:bg-[#e8c98a] hover:text-black hover:scale-110 shadow-2xl cursor-pointer"
            onClick={(event) => {
              event.stopPropagation();
              goTo(1);
            }}
            type="button"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        )}
      </div>

      {/* ── BARRE DE MINIATURES EN BAS DE L'ÉCRAN (CARROUSEL) ── */}
      {canNavigate && (
        <div
          className="relative z-20 max-w-4xl w-full mx-auto flex items-center justify-center gap-2 overflow-x-auto py-2 px-4 border-t border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={img.id || idx}
                onClick={() => onChange(img.url)}
                className={cn(
                  "relative h-14 w-14 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer",
                  isActive
                    ? "border-[#e8c98a] scale-110 shadow-[0_0_12px_rgba(232,201,138,0.5)]"
                    : "border-white/20 opacity-50 hover:opacity-100 hover:border-white/50"
                )}
                type="button"
              >
                <img alt="" className="h-full w-full object-cover" src={img.url} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
