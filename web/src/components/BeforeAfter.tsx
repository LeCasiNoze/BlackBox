import { useState } from "react";
import { ChevronsLeftRight } from "lucide-react";

export function BeforeAfter({ before, after, label }: { before: string; after: string; label: string }) {
  const [position, setPosition] = useState(50);
  return <div className="comparison">
    <img src={after} alt={`${label} — après`} draggable={false} />
    <img src={before} alt={`${label} — avant`} draggable={false}
      style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }} />
    <span className="comparison-label comparison-before">Avant</span>
    <span className="comparison-label comparison-after">Après</span>
    <div className="comparison-divider" style={{ left: `${position}%` }}>
      <span><ChevronsLeftRight size={20} /></span>
    </div>
    <input type="range" min="0" max="100" value={position}
      aria-label={`Comparer avant et après : ${label}`} aria-valuetext={`${position} % avant`}
      onChange={(event) => setPosition(Number(event.target.value))} />
  </div>;
}
