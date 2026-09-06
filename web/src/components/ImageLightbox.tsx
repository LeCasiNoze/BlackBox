import * as React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { MediaDialog } from "./MediaDialog";

export type LightboxImage = { id: string | number; url: string; label?: string | null };
type ImageLightboxProps = { images: LightboxImage[]; currentUrl: string | null; onClose: () => void; onChange: (url: string) => void };

export function ImageLightbox({ images, currentUrl, onClose, onChange }: ImageLightboxProps) {
  const touch = React.useRef<{ x: number; y: number } | null>(null);
  const thumbnails = React.useRef<HTMLDivElement>(null);
  const index = images.findIndex((image) => image.url === currentUrl);
  const current = index >= 0 ? images[index] : currentUrl ? { id: currentUrl, url: currentUrl } : null;
  const navigate = (direction: number) => {
    if (images.length > 1) onChange(images[(Math.max(0, index) + direction + images.length) % images.length].url);
  };
  React.useEffect(() => {
    thumbnails.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [currentUrl]);
  if (!currentUrl || !current) return null;
  return <MediaDialog onClose={onClose} label={current.label || "Photos"}>
    <div className="photo-viewer" onKeyDown={(event) => {
      if (event.key === "ArrowLeft") { event.preventDefault(); navigate(-1); }
      if (event.key === "ArrowRight") { event.preventDefault(); navigate(1); }
    }}>
      <div className="media-toolbar">
        <div><h3>{current.label}</h3>{images.length > 1 && <p aria-live="polite">{index >= 0 ? index + 1 : "—"} / {images.length}</p>}</div>
        <button type="button" className="bb-icon-btn" aria-label="Fermer" onClick={onClose}><X size={20} /></button>
      </div>
      <div className="photo-stage" onTouchStart={(event) => {
        touch.current = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
      }} onTouchCancel={() => { touch.current = null; }} onTouchEnd={(event) => {
        if (!touch.current) return;
        const dx = event.changedTouches[0].clientX - touch.current.x;
        const dy = event.changedTouches[0].clientY - touch.current.y;
        touch.current = null;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.3) navigate(dx > 0 ? -1 : 1);
      }}>
        {images.length > 1 && <button type="button" className="bb-icon-btn" aria-label="Photo précédente" onClick={() => navigate(-1)}><ChevronLeft size={22} /></button>}
        <img src={current.url} alt={current.label || "Photo grand format"} draggable={false} />
        {images.length > 1 && <button type="button" className="bb-icon-btn" aria-label="Photo suivante" onClick={() => navigate(1)}><ChevronRight size={22} /></button>}
      </div>
      {images.length > 1 && <div className="media-thumbnails" ref={thumbnails}>{images.map((image, i) =>
        <button key={image.id} type="button" aria-label={image.label || `Photo ${i + 1}`} aria-current={image.url === currentUrl ? "true" : undefined} onClick={() => onChange(image.url)}>
          <img src={image.url} alt="" loading="lazy" />
        </button>)}</div>}
    </div>
  </MediaDialog>;
}
