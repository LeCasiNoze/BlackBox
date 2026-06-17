import * as React from "react";
import { Loader2, Maximize2, Minimize2, Trophy, X } from "lucide-react";

type DrawModalProps = {
  eventId: number;
  eventTitle: string;
  onClose: () => void;
  onFinished: () => void;
};

const CONFETTI_COLORS = ["#e8c98a", "#ffd87a", "#d99a4e", "#fff6df", "#43d79d", "#ffffff"];
const CARD_W = 190;
const GAP = 12;
const STEP = CARD_W + GAP;
const SPIN_MS = 5200;
const WINNER_INDEX = 38;
const REEL_TOTAL = 44;

// Petit jingle de victoire (Web Audio, sans fichier).
function playWinChime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.32, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  } catch {
    /* audio indisponible: on ignore */
  }
}

function pickRandom<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

export function DrawModal({ eventId, eventTitle, onClose, onFinished }: DrawModalProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const reelRef = React.useRef<HTMLDivElement | null>(null);
  const spinTimer = React.useRef<number | null>(null);

  const [participants, setParticipants] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [winners, setWinners] = React.useState<string[]>([]);
  const [reel, setReel] = React.useState<string[]>([]);
  const [spinning, setSpinning] = React.useState(false);
  const [revealed, setRevealed] = React.useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [finishing, setFinishing] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch(`/api/admin/events/${eventId}/draw`);
        const json = await response.json().catch(() => ({}));
        if (active && json.ok) setParticipants(Array.isArray(json.participants) ? json.participants : []);
      } catch {
        /* best-effort */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [eventId]);

  React.useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  React.useEffect(() => {
    return () => {
      if (spinTimer.current) window.clearTimeout(spinTimer.current);
    };
  }, []);

  // Animation du reel : on positionne a 0 sans transition, puis on lance la
  // transition ralentie jusqu'a centrer la carte gagnante (meme effet que la box).
  React.useEffect(() => {
    if (!spinning || reel.length === 0) return;
    const strip = reelRef.current;
    if (!strip) return;
    const containerWidth = strip.parentElement?.clientWidth ?? 600;
    const center = (WINNER_INDEX + 1) * STEP + CARD_W / 2;
    const target = -(center - containerWidth / 2);
    strip.style.transition = "none";
    strip.style.transform = "translateX(0px)";
    void strip.offsetWidth; // reflow
    strip.style.transition = `transform ${SPIN_MS}ms cubic-bezier(0.08, 0.72, 0.12, 1)`;
    strip.style.transform = `translateX(${target}px)`;
  }, [spinning, reel]);

  const eligible = participants.filter((name) => !winners.includes(name));

  function startDraw() {
    if (spinning || eligible.length === 0) return;
    const winner = pickRandom(eligible);
    const pool = participants.length > 0 ? participants : [winner];
    const items: string[] = [];
    for (let i = 0; i < REEL_TOTAL; i += 1) {
      items.push(i === WINNER_INDEX ? winner : pickRandom(pool));
    }
    setRevealed(null);
    setReel(items);
    setSpinning(true);
    spinTimer.current = window.setTimeout(() => {
      setSpinning(false);
      setRevealed(winner);
      setWinners((current) => [...current, winner]);
      playWinChime();
    }, SPIN_MS + 80);
  }

  async function finishEvent() {
    setFinishing(true);
    try {
      await fetch(`/api/admin/events/${eventId}/draw-finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winners }),
      });
      onFinished();
      onClose();
    } catch {
      setFinishing(false);
    }
  }

  function toggleFullscreen() {
    const element = rootRef.current;
    if (!element) return;
    if (!document.fullscreenElement) {
      void element.requestFullscreen?.().catch(() => undefined);
    } else {
      void document.exitFullscreen?.().catch(() => undefined);
    }
  }

  const idlePreview = participants.length > 0 ? participants.slice(0, 12) : [];

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col overflow-hidden bg-[#08060a] text-white"
      ref={rootRef}
    >
      {/* Fond immersif noir / or */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(232,201,138,0.16), transparent 70%), radial-gradient(70% 60% at 50% 120%, rgba(217,154,78,0.12), transparent 72%)",
        }}
      />
      <div className="bb-grid-motif pointer-events-none absolute inset-0 opacity-40" />

      {/* Barre du haut */}
      <div className="relative z-10 flex items-center justify-between gap-3 px-5 py-4 md:px-8">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.24em] text-accent">Tirage au sort</p>
          <h2 className="bb-display truncate text-lg font-bold text-white md:text-2xl">{eventTitle}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="bb-pill border-accent/30 bg-accent/10 text-accentSoft">
            {participants.length} participant{participants.length > 1 ? "s" : ""}
          </span>
          <button aria-label="Plein ecran" className="bb-icon-btn" onClick={toggleFullscreen} type="button">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button aria-label="Fermer" className="bb-icon-btn" onClick={onClose} type="button">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Centre */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4">
        {/* Confettis a la revelation */}
        {revealed && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {Array.from({ length: 70 }).map((_, index) => (
              <span
                className="bb-confetti-piece"
                key={index}
                style={{
                  left: `${(index / 70) * 100}%`,
                  background: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
                  animationDelay: `${(index % 12) * 0.06}s`,
                  animationDuration: `${1.7 + (index % 5) * 0.35}s`,
                }}
              />
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-3 text-white/60">
            <Loader2 className="h-5 w-5 animate-spin text-accent" /> Chargement des participants...
          </div>
        ) : (
          <>
            {/* Reveal gagnant */}
            {revealed && (
              <div className="relative z-20 mb-8 text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-accent">Gagnant</p>
                <p
                  className="bb-display mt-3 text-5xl font-extrabold md:text-7xl"
                  style={{
                    background: "linear-gradient(120deg, #ffe7ab 6%, var(--bb-accent) 44%, var(--bb-accent-strong) 96%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    textShadow: "0 0 40px rgba(232,201,138,0.35)",
                  }}
                >
                  {revealed}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-accentSoft">
                  <Trophy className="h-5 w-5" />
                  <span className="text-sm font-semibold">
                    Tirage {winners.length} / participants {participants.length}
                  </span>
                </div>
              </div>
            )}

            {/* Reel */}
            <div className="relative w-full max-w-4xl overflow-hidden rounded-[24px] border border-accent/25 bg-black/50">
              <div
                className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-1 -translate-x-1/2"
                style={{ background: "var(--bb-accent)", boxShadow: "0 0 18px 4px rgba(232,201,138,0.6)" }}
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-black/85 to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-black/85 to-transparent" />
              <div className="overflow-hidden py-6">
                {reel.length > 0 ? (
                  <div ref={reelRef} style={{ display: "flex", gap: GAP, paddingLeft: STEP, willChange: "transform" }}>
                    {reel.map((name, index) => (
                      <div
                        className="flex shrink-0 items-center justify-center rounded-[16px] border border-accent/25 bg-[linear-gradient(180deg,rgba(232,201,138,0.10),rgba(232,201,138,0.02))] px-3 text-center"
                        key={index}
                        style={{ width: CARD_W, height: 92 }}
                      >
                        <span className="line-clamp-2 text-sm font-bold text-white">{name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Aperçu statique (filmable) avant le 1er tirage
                  <div style={{ display: "flex", gap: GAP, paddingLeft: STEP }}>
                    {(idlePreview.length > 0 ? idlePreview : ["—"]).map((name, index) => (
                      <div
                        className="flex shrink-0 items-center justify-center rounded-[16px] border border-white/12 bg-white/[0.03] px-3 text-center opacity-70"
                        key={index}
                        style={{ width: CARD_W, height: 92 }}
                      >
                        <span className="line-clamp-2 text-sm font-semibold text-white/80">{name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {eligible.length === 0 && participants.length > 0 && (
              <p className="mt-5 text-sm text-white/55">Tous les participants ont ete tires.</p>
            )}
            {participants.length === 0 && (
              <p className="mt-5 text-sm text-amber-200/80">
                Aucun participant. Ajoute des noms avant le tirage (panneau Evenements).
              </p>
            )}
          </>
        )}
      </div>

      {/* Gagnants deja tires */}
      {winners.length > 0 && (
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 px-5 pb-2">
          {winners.map((name, index) => (
            <span
              className="bb-pill border-accent/30 bg-accent/10 text-accentSoft"
              key={`${name}-${index}`}
            >
              {index + 1}. {name}
            </span>
          ))}
        </div>
      )}

      {/* Commandes */}
      <div className="relative z-10 flex items-center justify-center gap-3 px-5 py-6">
        <button
          className="bb-button-brand px-8 py-4 text-base"
          disabled={spinning || eligible.length === 0 || loading}
          onClick={startDraw}
          type="button"
        >
          {spinning ? "Tirage en cours..." : winners.length === 0 ? "Tirer" : "Tirer un autre gagnant"}
        </button>
        {revealed && !spinning && (
          <button
            className="bb-button-ghost px-6 py-4 text-base"
            disabled={finishing}
            onClick={() => {
              void finishEvent();
            }}
            type="button"
          >
            {finishing ? "..." : "Terminer l'evenement"}
          </button>
        )}
      </div>
    </div>
  );
}
