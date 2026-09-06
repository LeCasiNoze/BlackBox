import { useId, useState, type PointerEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Expand, Play, X } from "lucide-react";
import { BeforeAfter } from "./BeforeAfter";
import { MediaDialog } from "./MediaDialog";

type Pair = { id: string; vehicleId: string; vehicleName: string; title: string; category: string; before: string; after: string };
type Model = { id: string; name: string; subtitle: string; coverImage: string; pairs: Pair[] };
type Reel = { id: string; title: string; src: string; poster: string; badge: string };

function moveLight(event: PointerEvent<HTMLButtonElement>) {
  if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const card = event.currentTarget;
  const bounds = card.getBoundingClientRect();
  card.style.setProperty("--light-x", `${event.clientX - bounds.left}px`);
  card.style.setProperty("--light-y", `${event.clientY - bounds.top}px`);
}

export function ShowcaseGallery({ models, pairs, reels, onQuote }: {
  models: Model[]; pairs: Pair[]; reels: Reel[]; onQuote: () => void;
}) {
  const [filter, setFilter] = useState("tout");
  const [selection, setSelection] = useState<{ pairs: Pair[]; index: number } | null>(null);
  const [reel, setReel] = useState<Reel | null>(null);
  const filterId = useId();
  const reducedMotion = useReducedMotion();
  const cardMotion = {
    layout: !reducedMotion,
    initial: reducedMotion ? false as const : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: reducedMotion ? 1 : 0 },
    transition: { duration: reducedMotion ? 0 : 0.3, layout: { duration: 0.4 } },
  };
  const current = selection?.pairs[selection.index];
  const move = (direction: number) => setSelection((value) => value && ({ ...value, index: (value.index + direction + value.pairs.length) % value.pairs.length }));
  return <section id="realisations" className="showcase-section">
    <div className="showcase-heading">
      <h2>Les réalisations</h2>
      <div className="showcase-filters" aria-label="Filtrer les réalisations">
        {[['tout', 'Tout'], ['interieur', 'Intérieur'], ['exterieur', 'Extérieur']].map(([id, label]) =>
          <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>
            {filter === id && <motion.span className="showcase-filter-indicator" layoutId={reducedMotion ? undefined : filterId}
              transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
            <span className="showcase-filter-label">{label}</span>
          </button>)}
      </div>
    </div>
    <div className="showcase-grid">
      <AnimatePresence initial={false} mode="popLayout">
      {filter === "tout" ? models.map((model) => <motion.button {...cardMotion} onPointerMove={moveLight} type="button" className="showcase-card" key={model.id}
        onClick={() => setSelection({ pairs: model.pairs, index: 0 })}>
        <div className="showcase-cover"><img src={model.coverImage} alt={model.name} loading="lazy" />
          <span className="showcase-count">{model.pairs.length} avant / après</span><span className="showcase-expand"><Expand size={18} /></span>
        </div>
        <div className="showcase-caption"><div><p>{model.subtitle}</p><h3>{model.name}</h3></div><ArrowRight size={20} /></div>
      </motion.button>) : pairs.filter((pair) => pair.category === filter).map((pair, index, list) =>
        <motion.button {...cardMotion} onPointerMove={moveLight} type="button" className="showcase-card" key={pair.id} onClick={() => setSelection({ pairs: list, index })}>
          <div className="showcase-cover"><img src={pair.after} alt={pair.title} loading="lazy" /><span className="showcase-count">Avant / après</span><span className="showcase-expand"><Expand size={18} /></span></div>
          <div className="showcase-caption"><div><p>{pair.vehicleName}</p><h3>{pair.title}</h3></div><ArrowRight size={20} /></div>
        </motion.button>)}
      </AnimatePresence>
    </div>
    <div className="showcase-reels">
      {reels.map((video) => <button type="button" key={video.id} onClick={() => setReel(video)}>
        <img src={video.poster} alt="" loading="lazy" /><span className="showcase-play"><Play size={16} fill="currentColor" /></span><span>{video.title}</span><ArrowRight size={16} />
      </button>)}
    </div>
    {current && selection && <MediaDialog onClose={() => setSelection(null)} label={current.vehicleName}>
      <div className="showcase-viewer" onKeyDown={(event) => {
        if ((event.target as HTMLElement).tagName === 'INPUT') return;
        if (event.key === 'ArrowLeft') move(-1);
        if (event.key === 'ArrowRight') move(1);
      }}>
        <div className="media-toolbar"><div><p>{current.vehicleName}</p><h3>{current.title}</h3></div>
          <button type="button" className="bb-icon-btn" aria-label="Fermer" onClick={() => setSelection(null)}><X size={20} /></button></div>
        <BeforeAfter key={current.id} before={current.before} after={current.after} label={current.title} />
        <div className="showcase-controls">
          <button type="button" className="bb-icon-btn" disabled={selection.pairs.length < 2} aria-label="Photo précédente" onClick={() => move(-1)}><ChevronLeft size={20} /></button>
          <span aria-live="polite">{selection.index + 1} / {selection.pairs.length}</span>
          <button type="button" className="bb-icon-btn" disabled={selection.pairs.length < 2} aria-label="Photo suivante" onClick={() => move(1)}><ChevronRight size={20} /></button>
          <button type="button" className="bb-button-brand" onClick={() => { setSelection(null); onQuote(); }}>Obtenir un devis <ArrowRight size={16} /></button>
        </div>
        {selection.pairs.length > 1 && <div className="media-thumbnails">{selection.pairs.map((pair, index) =>
          <button key={pair.id} type="button" aria-label={pair.title} aria-current={index === selection.index ? "true" : undefined}
            onClick={() => setSelection({ ...selection, index })}><img src={pair.after} alt="" loading="lazy" /></button>)}</div>}
      </div>
    </MediaDialog>}
    {reel && <MediaDialog onClose={() => setReel(null)} label={reel.title}>
      <div className="showcase-video"><div className="media-toolbar"><h3>{reel.title}</h3><button type="button" className="bb-icon-btn" aria-label="Fermer" onClick={() => setReel(null)}><X size={20} /></button></div>
        <video key={reel.id} loop src={reel.src} poster={reel.poster} controls playsInline autoPlay preload="metadata" />
        <div className="showcase-filters">{reels.map((video) => <button key={video.id} type="button" aria-pressed={video.id === reel.id} onClick={() => setReel(video)}>{video.title}</button>)}</div>
      </div>
    </MediaDialog>}
  </section>;
}
