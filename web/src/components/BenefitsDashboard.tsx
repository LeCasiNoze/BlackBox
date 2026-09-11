import { useState } from "react";
import { ArrowRight, Check, Crown, Gift, History, LockKeyhole, Sparkles } from "lucide-react";

type Reward = { key: string; label: string; pointsCost: number };
type Redemption = { id: number; rewardLabel: string; pointsCost: number; status: "requested" | "processed" | "cancelled"; createdAt: number };

export function FounderAccessCard({ founder, remaining, onJoin }: { founder: boolean; remaining?: number; onJoin: () => void }) {
  return <article className="benefits-membership" data-member={founder}>
    <div className="benefits-membership-mark" aria-hidden="true"><Crown /></div>
    <div className="benefits-membership-copy">
      <p className="bc-kicker">{founder ? "Votre accès Fondateur" : "Le programme Fondateur"}</p>
      <h2>{founder ? "Vous faites partie des premiers." : "Passez au statut Fondateur."}</h2>
      <div className="benefits-perks"><span><Check size={14} /> Entretien réservé</span><span><Check size={14} /> BC’Coins ×2</span><span><Check size={14} /> Annulation flexible</span></div>
    </div>
    <div className="benefits-membership-action">{founder ? <span className="benefits-member-active"><Check size={16} /> Accès actif</span> : <>
      <div className="benefits-price">49,90 € <span>à vie</span></div>
      <button type="button" className="bb-button-brand" onClick={onJoin} disabled={remaining === 0}>{remaining === 0 ? "Programme complet" : "Devenir Fondateur"}<ArrowRight size={16} /></button>
      {typeof remaining === "number" && remaining > 0 && <span className="benefits-remaining">{remaining} place{remaining > 1 ? "s" : ""} disponible{remaining > 1 ? "s" : ""}</span>}
    </>}</div>
  </article>;
}

export function BenefitsDashboard({ founder, points, pending, remaining, rewards, redemptions, busyKey, onJoin, onRedeem, onHistory, formatDate, statusLabel }: {
  founder: boolean; points: number; pending: number; remaining?: number; rewards: Reward[]; redemptions: Redemption[]; busyKey: string | null;
  onJoin: () => void; onRedeem: (reward: Reward) => void; onHistory: () => void; formatDate: (date: number) => string; statusLabel: (status: Redemption["status"]) => string;
}) {
  const [tab, setTab] = useState<"catalog" | "mine">("catalog");
  const [availableOnly, setAvailableOnly] = useState(false);
  const sorted = [...rewards].sort((a,b) => a.pointsCost - b.pointsCost);
  const next = sorted.find(reward => reward.pointsCost > points);
  const available = sorted.filter(reward => reward.pointsCost <= points);
  const shown = availableOnly ? available : sorted;
  const progress = next ? Math.min(100, Math.max(0, points / next.pointsCost * 100)) : 100;
  return <section className="client-rewards benefits-dashboard">
    <header className="benefits-heading"><div><p className="bc-kicker"><Gift size={15} /> Votre fidélité</p><h1>Mes <span>avantages</span></h1></div><button className="bb-button-ghost" onClick={onHistory} type="button"><History size={16} /> Historique</button></header>
    <div className="benefits-overview">
      <article className="benefits-balance"><div className="benefits-balance-top"><span>BC’Coins disponibles</span><span className="bb-pill">{founder ? "Fondateur · ×2" : "Membre BBX"}</span></div><strong>{points.toLocaleString("fr-FR")}</strong><p>{pending > 0 ? `+ ${pending.toLocaleString("fr-FR")} en attente de validation` : "Votre solde fidélité"}</p><div className="benefits-balance-bottom"><Gift size={18} /><span>{available.length} récompense{available.length > 1 ? "s" : ""} accessible{available.length > 1 ? "s" : ""}</span></div></article>
      <article className="benefits-next"><span className="bc-kicker">{next ? "Votre prochain palier" : "Votre fidélité récompensée"}</span><h2>{next?.label ?? (sorted.length ? "Toutes les récompenses sont à votre portée." : "Le catalogue arrive bientôt.")}</h2>{next && <><div className="benefits-progress" role="progressbar" aria-label="Progression vers la prochaine récompense" aria-valuemin={0} aria-valuemax={next.pointsCost} aria-valuenow={Math.max(0, points)}><span style={{ width: `${progress}%` }} /></div><div className="benefits-progress-caption"><span>Encore <b>{next.pointsCost - points}</b> BC’Coins</span><span>{next.pointsCost.toLocaleString("fr-FR")}</span></div></>}</article>
    </div>
    <FounderAccessCard founder={founder} remaining={remaining} onJoin={onJoin} />
    <div className="benefits-catalog-bar"><div className="bc-segmented"><button type="button" className={`bc-segment ${tab === "catalog" ? "bc-segment-active" : ""}`} aria-pressed={tab === "catalog"} onClick={() => setTab("catalog")}>Le catalogue <span>{rewards.length}</span></button><button type="button" className={`bc-segment ${tab === "mine" ? "bc-segment-active" : ""}`} aria-pressed={tab === "mine"} onClick={() => setTab("mine")}>Mes récompenses <span>{redemptions.length}</span></button></div>{tab === "catalog" && <button type="button" className="benefits-filter" aria-pressed={availableOnly} onClick={() => setAvailableOnly(value => !value)}><span aria-hidden="true">{availableOnly && <Check size={12} />}</span> À ma portée</button>}</div>
    {tab === "catalog" ? <div className="benefits-grid" key="catalog">{shown.length ? shown.map((reward,index) => {
      const unlocked = reward.pointsCost <= points;
      return <article className="benefits-reward" data-unlocked={unlocked} key={reward.key} style={{ animationDelay: `${Math.min(index,5)*35}ms` }}>
        <div className="benefits-reward-art" aria-hidden="true"><span>{unlocked ? <Gift size={32} /> : <Sparkles size={32} />}</span><i /><i /></div>
        <div className="benefits-reward-content"><div className="benefits-reward-cost"><span>{reward.pointsCost.toLocaleString("fr-FR")} BC’Coins</span>{unlocked ? <Check size={16} /> : <LockKeyhole size={14} />}</div><h3>{reward.label}</h3><button className={unlocked ? "bb-button-brand" : "bb-button-ghost"} type="button" disabled={!unlocked || !!busyKey} onClick={() => onRedeem(reward)}>{busyKey === reward.key ? "Envoi…" : unlocked ? "Échanger" : `Encore ${reward.pointsCost - points} BC’Coins`}{unlocked && <ArrowRight size={15} />}</button></div>
      </article>;
    }) : <div className="benefits-empty"><Gift size={30} /><h2>{availableOnly ? "Votre prochaine récompense se rapproche." : "Le catalogue se prépare."}</h2>{availableOnly && <button className="bb-button-ghost" onClick={() => setAvailableOnly(false)} type="button">Voir tout le catalogue</button>}</div>}</div> : <div className="benefits-owned" key="mine">{redemptions.length ? redemptions.map(redemption => <article className="benefits-redemption" key={redemption.id}><span className="bc-icon-tile"><Gift size={20} /></span><div><h3>{redemption.rewardLabel}</h3><p>{formatDate(redemption.createdAt)} · {redemption.pointsCost} BC’Coins</p></div><span className="benefits-status" data-status={redemption.status}>{statusLabel(redemption.status)}</span></article>) : <div className="benefits-empty"><Gift size={30} /><h2>Vos récompenses vous attendent.</h2><button type="button" className="bb-button-brand" onClick={() => setTab("catalog")}>Explorer le catalogue <ArrowRight size={16} /></button></div>}</div>}
  </section>;
}
