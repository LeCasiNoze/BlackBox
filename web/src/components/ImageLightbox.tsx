import * as React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/[0.92] px-3 py-6 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        aria-label="Fermer"
        className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white transition hover:bg-white/10"
        onClick={onClose}
        type="button"
      >
        <X className="h-5 w-5" />
      </button>

      {canNavigate && (
        <button
          aria-label="Photo précédente"
          className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white transition hover:bg-white/10 md:left-6"
          onClick={(event) => {
            event.stopPropagation();
            goTo(-1);
          }}
          type="button"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      <div
        className="relative flex max-h-[92vh] w-full max-w-6xl items-center justify-center"
        onClick={(event) => event.stopPropagation()}
        onTouchEnd={(event) => {
          if (touchStartX.current == null || touchStartY.current == null) return;
          const touch = event.changedTouches[0];
          const deltaX = touch.clientX - touchStartX.current;
          const deltaY = touch.clientY - touchStartY.current;
          touchStartX.current = null;
          touchStartY.current = null;

          if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
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
          alt={currentImage.label || "Photo prestation"}
          className="max-h-[88vh] max-w-full select-none rounded-[22px] border border-white/10 object-contain shadow-[0_30px_120px_rgba(0,0,0,0.65)]"
          draggable={false}
          src={currentImage.url}
        />

        {canNavigate && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-xs font-semibold text-white/75">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {canNavigate && (
        <button
          aria-label="Photo suivante"
          className={cn(
            "absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white transition hover:bg-white/10 md:right-6",
          )}
          onClick={(event) => {
            event.stopPropagation();
            goTo(1);
          }}
          type="button"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
