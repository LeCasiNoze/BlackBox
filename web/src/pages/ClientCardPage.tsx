import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarClock,
  CalendarPlus,
  Camera,
  CarFront,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  Crown,
  ExternalLink,
  Gift,
  House,
  Link2,
  Loader2,
  MapPin,
  MessageCircle,
  PencilLine,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { ImageLightbox, type LightboxImage } from "../components/ImageLightbox";
import { InstallAppButton } from "../components/InstallAppButton";
import {
  appointmentDateTime,
  appointmentStatusClasses,
  appointmentStatusLabel,
  canChangeDay,
  clampNumber,
  cn,
  defaultTimeForSlot,
  dayStatusClasses,
  formatDateFR,
  formatTimeHHMM,
  formatUnixDateTimeFR,
  locationClasses,
  locationLabel,
  normalizeAppointmentSlot,
  slotIsPast,
  slotLabel,
  slotWindowLabel,
  type AppointmentLocation,
  type AppointmentSlot,
  type AppointmentStatus,
  type DayStatus,
} from "../lib/portal";
import {
  TERMS_ACCEPTANCE_LABEL,
  TERMS_HIGHLIGHTS,
  TERMS_SECTIONS,
  TERMS_UPDATED_LABEL,
} from "../lib/terms";
import {
  clientPushPermission,
  clientPushSupported,
  enableClientPush,
} from "../lib/clientPush";
import { downloadIcs, googleCalendarUrl, type CalendarEvent } from "../lib/calendar";

const SUMUP_TOPUP_URL =
  import.meta.env.VITE_SUMUP_TOPUP_URL || "https://www.sumupbookings.com/bryan-cars";
const GOOGLE_REVIEWS_URL = "https://maps.app.goo.gl/SNXz7PaTRSWWMxLa8";
const INSTAGRAM_URL =
  "https://www.instagram.com/bryancarsdetailing?igsh=M3hpZGc4bTY2eHJs&utm_source=qr";
const TIKTOK_URL = "https://www.tiktok.com/@bryan.cars2";
const FACEBOOK_URL = "https://www.facebook.com/share/19DTYdaMvJ/?mibextid=wwXIfr";
const WHATSAPP_URL = "https://wa.me/message/FSJMNKNGPVTTK1";
const PHONE_URL = "tel:0603125186";

type ApiDaySlot = {
  slot: AppointmentSlot;
  status: DayStatus;
  time: string | null;
  location: AppointmentLocation | null;
  appointmentId: number | null;
};

type ApiDay = {
  date: string;
  day: number;
  slots: Record<AppointmentSlot, ApiDaySlot>;
};

type ApiMonth = {
  year: number;
  monthIndex: number;
  label: string;
  iso: string;
  days: ApiDay[];
};

type PendingCase = {
  id: number;
  credits: number;
  status: string;
  rewardTier: string | null;
  rewardBc: number | null;
  createdAt: number;
  openedAt: number | null;
};

type CaseOpenResult = {
  reward: { tier: string; label: string; bc: number };
  tiers: Array<{ key: string; label: string; proba: number; bc: number }>;
};

// "YYYY-MM-DD" -> "JJ/MM"
function formatShortDateFR(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}`;
}

// Message indiquant ou/quand le client recupere son lot physique.
function buildGoodieDeliveryNote(
  appt: { date: string; slot?: string | null } | null | undefined,
): string {
  if (!appt || !appt.date) {
    return "Tu le recevras a ton prochain rendez-vous.";
  }
  return `Tu le recevras a ton rendez-vous du ${formatShortDateFR(appt.date)}.`;
}

type ApiClient = {
  id: number;
  slug: string;
  cardCode: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  clientType: "bbx" | "data" | "pro";
  isFounder: boolean;
  founderMediaUrl: string | null;
  addressLine1: string | null;
  postalCode: string | null;
  city: string | null;
  vehicleModel: string | null;
  vehiclePlate: string | null;
  formulaName: string | null;
  formulaTotal: number;
  formulaRemaining: number;
  formulaPurchasedAt: number | null;
  formulaExpiresAt: number | null;
  termsAcceptedAt: number | null;
  formulaRecapSentAt: number | null;
  welcomeEmailSentAt: number | null;
  bcPoints: number;
  bcPending: number;
  reviewBoxOpenedAt: number | null;
  reviewBoxReward: string | null;
  founderUntil: number | null;
};

type ClientVehicle = {
  id: number;
  clientId: number;
  label: string | null;
  model: string | null;
  plate: string | null;
  isPrimary: boolean;
  createdAt: number;
  updatedAt: number;
};

type RewardCatalogItem = {
  key: string;
  label: string;
  pointsCost: number;
};

type RewardRedemption = {
  id: number;
  clientId: number;
  rewardKey: string;
  rewardLabel: string;
  pointsCost: number;
  status: "requested" | "processed" | "cancelled";
  createdAt: number;
  updatedAt: number;
};

type TopupOffer = {
  key: string;
  label: string;
  description: string | null;
  credits: number;
  priceCents: number;
  currency: string;
  applyMode: "add" | "replace";
  durationDays: number | null;
};

type TopupOrder = {
  id: number;
  offerKey: string;
  offerLabel: string;
  status: string;
  checkoutReference: string;
};

type PartnerForfait = {
  key: string;
  label: string;
  priceCents: number;
  currency: string;
  tagline: string;
  features: string[];
};

type PartnerOrder = {
  id: number;
  forfaitKey: string;
  forfaitLabel: string;
  amountCents: number;
  currency: string;
  checkoutReference: string;
  status: "pending" | "paid" | "failed" | "expired" | "cancelled" | "refunded";
  customerName: string | null;
  customerEmail: string | null;
  paidAt: number | null;
  createdAt: number;
};

type ForfaitApiResponse = {
  ok: boolean;
  paymentsReady: boolean;
  forfaits: PartnerForfait[];
  orders: PartnerOrder[];
};

type ApiEvent = {
  id: number;
  title: string;
  description: string | null;
  audience: string;
  endsAt: number | null;
  requireInstagram: boolean;
  requireTiktok: boolean;
  requireFacebook: boolean;
  requireReview: boolean;
  conditionsText: string | null;
  conditionsLink: string | null;
  prizeKind: string;
  prizeText: string | null;
  participated: boolean;
  consolationReward: string | null;
  reviewDone: boolean;
};

type ApiResponse = {
  ok: boolean;
  client: ApiClient;
  vehicles: ClientVehicle[];
  rewardCatalog: RewardCatalogItem[];
  rewardRedemptions: RewardRedemption[];
  topupOffers: TopupOffer[];
  paymentsReady: boolean;
  month: ApiMonth;
  pendingCases: PendingCase[];
  event: ApiEvent | null;
  founderCap?: number;
  foundersRemaining?: number;
  waitlist?: Array<{ date: string; slot: AppointmentSlot; createdAt: number }>;
};

type ModalMode = "book" | "manage" | "past";
type PortalView = "home" | "booking" | "vehicles" | "shop" | "history";
type HistoryTab = "mine" | "community";

type ClientAppointment = {
  id: number;
  date: string;
  slot: AppointmentSlot;
  time: string | null;
  status: AppointmentStatus;
  adminNote: string | null;
  userRating: number | null;
  userReview: string | null;
  vehicleId: number | null;
  vehicleLabel: string | null;
  vehicleModel: string | null;
  vehiclePlate: string | null;
  clientCleanlinessEstimate: ServiceLevel | null;
  adminCleanlinessEstimate: ServiceLevel | null;
  requestedCredits: number;
  approvedCredits: number | null;
  creditsCharged: number;
  priceStatus:
    | "pending_admin"
    | "waiting_photos"
    | "waiting_client_approval"
    | "waiting_payment"
    | "approved"
    | "not_required"
    | "declined";
  photosRequestedAt: number | null;
  photosRequestMessage: string | null;
  priceComment: string | null;
  hasPhotos: boolean;
  location: AppointmentLocation | null;
  goodies?: string[];
};

type ServiceLevel = "clean" | "correct" | "dirty";

const SERVICE_LEVEL_OPTIONS: Array<{
  value: ServiceLevel;
  label: string;
  credits: number;
  copy: string;
}> = [
  { value: "clean", label: "Propre", credits: 1, copy: "Entretien simple, véhicule déjà suivi." },
  { value: "correct", label: "Correct", credits: 2, copy: "Traces visibles, nettoyage plus complet." },
  { value: "dirty", label: "Sale", credits: 3, copy: "Remise a niveau plus exigeante." },
];

type ListClientAppointmentsResponse = {
  ok: boolean;
  appointments: ClientAppointment[];
};

type AppointmentPhoto = {
  id: number;
  url: string;
  label: string | null;
  category?: "before" | "after" | null;
};

type BookingImageDraft = {
  id: string;
  file: File;
  previewUrl: string;
};

type PublicShowcaseItem = {
  id: number;
  date: string;
  slot: AppointmentSlot;
  time: string | null;
  location: AppointmentLocation | null;
  vehicleId: number | null;
  vehicleLabel: string | null;
  vehicleModel: string | null;
  vehiclePlate: string | null;
  userRating: number | null;
  userReview: string | null;
  photos: AppointmentPhoto[];
};

type AppointmentPhotosResponse = {
  ok: boolean;
  photos: AppointmentPhoto[];
};

type PublicShowcaseResponse = {
  ok: boolean;
  items: PublicShowcaseItem[];
};

type SaveReviewResponse = {
  ok: boolean;
  appointment?: ClientAppointment;
};

type AcceptTermsResponse = {
  ok: boolean;
  client?: ApiClient;
};

type VehiclesResponse = {
  ok: boolean;
  vehicles: ClientVehicle[];
  vehicle?: ClientVehicle;
  primaryVehicle?: ClientVehicle;
};

type RewardRedeemResponse = {
  ok: boolean;
  bcPoints: number;
  rewardRedemptions: RewardRedemption[];
};

type TopupCheckoutResponse = {
  ok: boolean;
  hostedCheckoutUrl?: string;
  checkoutReference?: string;
  topupOrder?: TopupOrder;
  error?: string;
};

type TopupSyncResponse = {
  ok: boolean;
  client?: ApiClient;
  topupOrder?: TopupOrder;
  error?: string;
};

type VehicleDraft = {
  label: string;
  model: string;
  plate: string;
};

type NavItem = {
  view: PortalView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const SLOT_ORDER: AppointmentSlot[] = ["morning", "afternoon"];
const MINUTES = ["00", "30"];
const SLOT_HOURS: Record<AppointmentSlot, number[]> = {
  morning: [9, 10, 11, 12],
  afternoon: [14, 15, 16, 17, 18],
};

const PORTAL_NAV_ITEMS: NavItem[] = [
  { view: "home", label: "Accueil", icon: House },
  { view: "booking", label: "Agenda", icon: CalendarClock },
  { view: "vehicles", label: "Vehicules", icon: CarFront },
  { view: "shop", label: "Boutique", icon: Gift },
  { view: "history", label: "Suivi", icon: Clock3 },
];

const GOOGLE_REVIEWS_FALLBACK = [
  {
    author: "Avis Google",
    rating: 5,
    copy:
      "La zone Google Reviews sert a prolonger l'experience après prestation et a guider les nouveaux clients.",
  },
  {
    author: "Bryan Cars",
    rating: 5,
    copy:
      "Invitez vos clients a noter le resultat, l'accueil et la finition pour renforcer la preuve sociale de la marque.",
  },
];

const FOUNDER_PERKS: Array<{
  title: string;
  copy: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    title: "BC'Coins",
    copy: "Cumulez des BC'Coins sur vos passages et echangez-les contre des récompenses dans la boutique fidélité.",
    icon: Gift,
  },
  {
    title: "Carte premium signature",
    copy: "Une carte fondateur personnalisee avec votre univers visuel Bryan Cars.",
    icon: Crown,
  },
  {
    title: "Avantages tarifaires",
    copy: "Accès a des formules et recharges réservées aux membres fondateurs.",
    icon: Sparkles,
  },
  {
    title: "Annulation le jour même",
    copy: "Plus de souplesse: annulez ou deplacez un rendez-vous le jour même.",
    icon: ShieldCheck,
  },
];

// Tier colors pour le reel CS:GO.
const TIER_COLORS: Record<string, string> = {
  commun: "#9ca3af",
  peu_commun: "#38bdf8",
  rare: "#a855f7",
  epique: "#ec4899",
  legendaire: "#e8c98a",
  // Lots de la box avis Google
  desodorisant: "#9ca3af",
  microfibre: "#38bdf8",
  tapis: "#a855f7",
  founder_1m: "#e8c98a",
  credit_1: "#ec4899",
  pack3: "#e8c98a",
};

// Largeur d'une carte du reel + gap en px (doit matcher le CSS).
const REEL_CARD_WIDTH = 180;
const REEL_GAP = 12;
const REEL_STEP = REEL_CARD_WIDTH + REEL_GAP;
// Reel long pour plus de suspens; la carte gagnante est tout pres de la fin.
const REEL_LENGTH = 90;
const WINNER_INDEX = 82;
const REEL_SPIN_MS = 6800;

type CaseTier = { key: string; label: string; proba: number; bc: number };

const FALLBACK_TIER: CaseTier = { key: "commun", label: "Commun", proba: 1, bc: 0 };

// --- Sons synthetises (Web Audio, aucun fichier) pour l'ouverture de box ----
let sharedAudioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!sharedAudioCtx) sharedAudioCtx = new Ctor();
    if (sharedAudioCtx.state === "suspended") void sharedAudioCtx.resume();
    return sharedAudioCtx;
  } catch (_error) {
    return null;
  }
}

// A appeler dans le gestionnaire de clic d'ouverture pour debloquer l'audio.
function unlockAudio() {
  getAudioCtx();
}

function playReelTick() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = 1050 + Math.random() * 160;
  const t = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.07, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.06);
}

// Son d'ouverture: balayage montant qui installe le suspens.
function playOpenSound() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  const t = ctx.currentTime;
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(780, t + 0.5);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.09, t + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.65);
}

const WIN_SEQUENCES: Record<string, number[]> = {
  commun: [523.25, 659.25],
  peu_commun: [523.25, 659.25, 783.99],
  rare: [523.25, 659.25, 783.99, 1046.5],
  epique: [523.25, 659.25, 783.99, 1046.5, 1318.5],
  legendaire: [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98],
  // Lots de la box avis (par rarete croissante)
  desodorisant: [523.25, 659.25],
  microfibre: [523.25, 659.25, 783.99],
  tapis: [523.25, 659.25, 783.99, 1046.5],
  founder_1m: [523.25, 659.25, 783.99, 1046.5, 1318.5],
  credit_1: [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98],
  pack3: [523.25, 659.25, 783.99, 1046.5, 1318.5],
};

function playWinSound(tier: string) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const notes = WIN_SEQUENCES[tier] ?? WIN_SEQUENCES.commun;
  const now = ctx.currentTime;
  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    const start = now + index * 0.09;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.14, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.5);
  });
}

const CONFETTI_BY_TIER: Record<string, number> = {
  commun: 22,
  peu_commun: 34,
  rare: 50,
  epique: 72,
  legendaire: 110,
  desodorisant: 22,
  microfibre: 34,
  tapis: 55,
  founder_1m: 85,
  credit_1: 110,
  pack3: 95,
};

const CONFETTI_COLORS = ["#e8c98a", "#4cc6ff", "#ffffff", "#43d79d", "#ff7d89", "#a855f7"];

function buildReelItems(
  tiers: CaseTier[],
  wonTier: string,
): Array<{ tier: CaseTier; isWinner: boolean }> {
  if (tiers.length === 0) return [];
  const totalProba = tiers.reduce((acc, t) => acc + t.proba, 0) || 1;

  function pickTier(): CaseTier {
    let rand = Math.random() * totalProba;
    for (const t of tiers) {
      rand -= t.proba;
      if (rand <= 0) return t;
    }
    return tiers[tiers.length - 1] ?? FALLBACK_TIER;
  }

  // Tiers les plus rares en premier, pour faire "passer" de gros lots.
  const rarest = [...tiers].sort((a, b) => a.proba - b.proba);
  const bigSpots = new Set([
    WINNER_INDEX - 2,
    WINNER_INDEX - 5,
    WINNER_INDEX - 9,
    WINNER_INDEX - 15,
    WINNER_INDEX - 24,
    20,
    44,
  ]);

  return Array.from({ length: REEL_LENGTH }, (_, index) => {
    if (index === WINNER_INDEX) {
      const winnerTier = tiers.find((t) => t.key === wonTier) ?? tiers[0] ?? FALLBACK_TIER;
      return { tier: winnerTier, isWinner: true };
    }
    if (bigSpots.has(index) && rarest.length > 0) {
      const tier = rarest[index % Math.min(2, rarest.length)] ?? rarest[0];
      return { tier, isWinner: false };
    }
    return { tier: pickTier(), isWinner: false };
  });
}

type CaseOpeningModalProps = {
  caseItem: PendingCase;
  result: CaseOpenResult | null;
  reelRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onSpinEnd: () => void;
  rewardUnit?: "bc" | "goodie";
  title?: string;
  eyebrow?: string;
  deliveryNote?: string | null;
};

function CaseOpeningModal({
  caseItem,
  result,
  reelRef,
  onClose,
  onSpinEnd,
  rewardUnit = "bc",
  title,
  eyebrow,
  deliveryNote,
}: CaseOpeningModalProps) {
  const isGoodie = rewardUnit === "goodie";
  const [reelItems, setReelItems] = React.useState<
    Array<{ tier: CaseTier; isWinner: boolean }>
  >([]);
  const [translateX, setTranslateX] = React.useState(0);
  const [revealed, setRevealed] = React.useState(false);
  const hasAnimated = React.useRef(false);

  // Construire le reel des qu'on a le resultat.
  React.useEffect(() => {
    if (!result) return;
    setReelItems(buildReelItems(result.tiers, result.reward.tier));
  }, [result]);

  // Declencher l'animation une seule fois apres que les items sont places.
  React.useEffect(() => {
    if (reelItems.length === 0 || hasAnimated.current) return;
    hasAnimated.current = true;

    let revealTimeout: ReturnType<typeof window.setTimeout> | null = null;
    let tickTimeout: ReturnType<typeof window.setTimeout> | null = null;
    let tickStopped = false;
    let tickDelay = 45;

    // Son d'ouverture (balayage) au lancement.
    playOpenSound();

    // Tic-tac du reel qui ralentit progressivement (effet CS:GO).
    function scheduleTick() {
      if (tickStopped) return;
      playReelTick();
      tickDelay = Math.min(tickDelay * 1.1, 320);
      tickTimeout = window.setTimeout(scheduleTick, tickDelay);
    }

    // Un tick pour que le DOM peuple les cartes avant de changer le transform.
    const raf = window.requestAnimationFrame(() => {
      // Centrer la carte gagnante sous le pointeur (milieu du conteneur visible).
      // Le reel a un paddingLeft = REEL_STEP, donc la carte i est centree a
      // (i + 1) * REEL_STEP + REEL_CARD_WIDTH / 2 dans le repere du reel.
      const containerWidth = reelRef.current?.parentElement?.clientWidth ?? 600;
      const target =
        containerWidth / 2 - (WINNER_INDEX + 1) * REEL_STEP - REEL_CARD_WIDTH / 2;
      setTranslateX(target);
      scheduleTick();

      // Apres la duree de la transition, on revele le resultat.
      revealTimeout = window.setTimeout(() => {
        tickStopped = true;
        if (tickTimeout !== null) window.clearTimeout(tickTimeout);
        setRevealed(true);
        if (result) playWinSound(result.reward.tier);
        onSpinEnd();
      }, REEL_SPIN_MS + 250);
    });

    return () => {
      tickStopped = true;
      window.cancelAnimationFrame(raf);
      if (revealTimeout !== null) window.clearTimeout(revealTimeout);
      if (tickTimeout !== null) window.clearTimeout(tickTimeout);
    };
  // onSpinEnd/reelRef/result sont stables au moment du declenchement.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reelItems]);

  const wonTierColor = result ? (TIER_COLORS[result.reward.tier] ?? "#e8c98a") : "#e8c98a";
  const highlightWin =
    result?.reward.tier === "legendaire" ||
    result?.reward.tier === "founder_1m" ||
    result?.reward.tier === "credit_1";

  return (
    <motion.div
      className="fixed inset-0 z-[57] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22 }}
      onClick={revealed ? onClose : undefined}
    >
      <motion.div
        className="bb-surface-strong relative flex w-full max-w-3xl flex-col gap-6 overflow-hidden p-6 md:p-8"
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Confettis a la revelation (densite selon la rarete) */}
        {revealed && result && (
          <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden="true">
            {Array.from({ length: CONFETTI_BY_TIER[result.reward.tier] ?? 30 }).map((_, index) => {
              const total = CONFETTI_BY_TIER[result.reward.tier] ?? 30;
              return (
                <span
                  className="bb-confetti-piece"
                  key={index}
                  style={{
                    left: `${(index / total) * 100}%`,
                    background: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
                    animationDelay: `${(index % 12) * 0.06}s`,
                    animationDuration: `${1.7 + (index % 5) * 0.35}s`,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* En-tete */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="bb-eyebrow">{eyebrow ?? "BC'Coins"}</p>
            <h3 className="bb-display mt-2 text-2xl font-semibold text-white">
              {title ??
                `Ouverture de case · ${caseItem.credits} credit${caseItem.credits > 1 ? "s" : ""}`}
            </h3>
          </div>
          {revealed && (
            <button className="bb-button-ghost" onClick={onClose} type="button">
              Fermer
            </button>
          )}
        </div>

        {/* Zone du reel */}
        <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-black/40">
          {/* Marqueur central */}
          <div
            className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-0.5 -translate-x-1/2"
            style={{ background: wonTierColor, boxShadow: `0 0 12px 3px ${wonTierColor}66` }}
          />
          {/* Degradees masquants sur les cotes */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-black/80 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-black/80 to-transparent" />

          {/* Reel scrollable */}
          <div className="overflow-hidden py-4">
            <div
              ref={reelRef}
              style={{
                display: "flex",
                gap: REEL_GAP,
                transform: `translateX(${translateX}px)`,
                transition:
                  reelItems.length > 0
                    ? `transform ${REEL_SPIN_MS}ms cubic-bezier(0.08, 0.72, 0.12, 1)`
                    : "none",
                willChange: "transform",
                paddingLeft: REEL_STEP,
              }}
            >
              {reelItems.length === 0 ? (
                // Placeholder pendant le chargement de la reponse serveur.
                Array.from({ length: 7 }).map((_, i) => (
                  <div
                    className="flex-shrink-0 animate-pulse rounded-[16px] border border-white/10 bg-white/[0.04]"
                    key={i}
                    style={{ width: REEL_CARD_WIDTH, height: 100 }}
                  />
                ))
              ) : (
                reelItems.map((item, index) => {
                  const color = TIER_COLORS[item.tier.key] ?? "#9ca3af";
                  return (
                    <div
                      className="flex-shrink-0 flex flex-col items-center justify-center rounded-[16px] border px-3 py-4 text-center"
                      key={index}
                      style={{
                        width: REEL_CARD_WIDTH,
                        borderColor: `${color}44`,
                        background: `linear-gradient(180deg, ${color}14, ${color}06)`,
                      }}
                    >
                      <Gift className="h-6 w-6" style={{ color }} />
                      <p className="mt-2 text-xs font-semibold text-white">{item.tier.label}</p>
                      {!isGoodie && (
                        <p className="mt-1 text-[11px]" style={{ color }}>
                          +{item.tier.bc} BC
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Etat : en cours */}
        {!revealed && (
          <div className="flex items-center justify-center gap-3 py-2 text-sm text-white/60">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            {result ? "Ouverture en cours..." : "Connexion au serveur..."}
          </div>
        )}

        {/* Resultat revele */}
        {revealed && result && (
          <motion.div
            className={cn(
              "flex flex-col items-center gap-4 rounded-[24px] border p-6 text-center",
              highlightWin
                ? "border-accent/50 bg-accent/10 shadow-[0_0_48px_rgb(var(--bb-accent-rgb)/0.25)]"
                : "border-white/10 bg-white/[0.04]",
            )}
            initial={{ opacity: 0, scale: 0.85, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.05 }}
          >
            {isGoodie ? (
              <>
                <motion.div
                  className="text-3xl font-bold md:text-4xl"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 13, delay: 0.18 }}
                  style={{
                    color: wonTierColor,
                    textShadow: highlightWin ? `0 0 24px ${wonTierColor}` : undefined,
                  }}
                >
                  {result.reward.label}
                </motion.div>
                <p className="text-sm text-white/60">
                  {result.reward.tier === "credit_1"
                    ? "1 crédit ajoute a ton compte !"
                    : result.reward.tier === "founder_1m"
                      ? "1 mois Fondateur offert — on l'active pour toi."
                      : (deliveryNote ?? "A recuperer a ton prochain rendez-vous.")}
                </p>
              </>
            ) : (
              <>
                <motion.div
                  className="text-5xl font-bold"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 13, delay: 0.18 }}
                  style={{
                    color: wonTierColor,
                    textShadow: highlightWin ? `0 0 24px ${wonTierColor}` : undefined,
                  }}
                >
                  +{result.reward.bc} BC
                </motion.div>
                <div>
                  <p className="text-lg font-semibold" style={{ color: wonTierColor }}>
                    {result.reward.label}
                  </p>
                  <p className="mt-1 text-sm text-white/55">
                    BC&apos;Coins credites sur votre compte fondateur
                  </p>
                </div>
              </>
            )}
            <button
              className="bb-button-brand mt-2 px-8 py-3"
              onClick={onClose}
              type="button"
            >
              {highlightWin ? "Incroyable !" : "Genial !"}
            </button>
          </motion.div>
        )}

      </motion.div>
    </motion.div>
  );
}

// --- URL cachee de demonstration: rejoue l'animation d'ouverture de box ---
const DEMO_CASE_TIERS: CaseTier[] = [
  { key: "commun", label: "Commun", proba: 0.6, bc: 20 },
  { key: "peu_commun", label: "Peu commun", proba: 0.25, bc: 50 },
  { key: "rare", label: "Rare", proba: 0.1, bc: 120 },
  { key: "epique", label: "Epique", proba: 0.04, bc: 350 },
  { key: "legendaire", label: "Legendaire", proba: 0.01, bc: 1000 },
];

function rollDemoCaseResult(): CaseOpenResult {
  let rand = Math.random();
  let picked = DEMO_CASE_TIERS[0];
  for (const tier of DEMO_CASE_TIERS) {
    if (rand < tier.proba) {
      picked = tier;
      break;
    }
    rand -= tier.proba;
  }
  return {
    reward: { tier: picked.key, label: picked.label, bc: picked.bc },
    tiers: DEMO_CASE_TIERS,
  };
}

export function CaseDemoPage() {
  const [round, setRound] = React.useState(0);
  const [result, setResult] = React.useState<CaseOpenResult | null>(null);
  const reelRef = React.useRef<HTMLDivElement | null>(null);

  const demoCase: PendingCase = {
    id: -1,
    credits: 1,
    status: "pending",
    rewardTier: null,
    rewardBc: null,
    createdAt: 0,
    openedAt: null,
  };

  // Simule la reponse serveur puis lance l'animation; "Fermer/Genial" rejoue.
  React.useEffect(() => {
    setResult(null);
    const timeout = window.setTimeout(() => setResult(rollDemoCaseResult()), 500);
    return () => window.clearTimeout(timeout);
  }, [round]);

  return (
    <CaseOpeningModal
      caseItem={demoCase}
      key={round}
      onClose={() => setRound((value) => value + 1)}
      onSpinEnd={() => undefined}
      reelRef={reelRef}
      result={result}
    />
  );
}

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

function normalizePortalView(value: string | null): PortalView {
  if (value === "booking") return "booking";
  if (value === "vehicles") return "vehicles";
  if (value === "shop") return "shop";
  if (value === "history") return "history";
  return "home";
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMoneyCents(amountCents: number, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(amountCents / 100);
}

function forfaitStatusLabel(status: string) {
  switch (status) {
    case "paid":
      return "Paye";
    case "pending":
      return "En attente";
    case "failed":
      return "Echoue";
    case "expired":
      return "Expire";
    case "cancelled":
      return "Annule";
    case "refunded":
      return "Rembourse";
    default:
      return status;
  }
}

function forfaitStatusClasses(status: string) {
  switch (status) {
    case "paid":
      return "border-[#43d79d]/30 bg-[#43d79d]/10 text-[#7ce7c0]";
    case "failed":
    case "expired":
    case "cancelled":
      return "border-[#ff7d89]/30 bg-[#ff7d89]/10 text-[#ffb3ba]";
    default:
      return "border-white/15 bg-white/[0.05] text-white/70";
  }
}

function addDaysIso(dateStr: string, delta: number) {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  date.setDate(date.getDate() + delta);
  return toIsoDate(date);
}

function startOfWeekIso(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  const diff = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - diff);
  return toIsoDate(date);
}

function weekdayShort(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("fr-FR", {
    weekday: "short",
  });
}

function splitTime(value: string, slot: AppointmentSlot) {
  const fallback = defaultTimeForSlot(slot);
  const [hour, minute] = value.split(":");
  return {
    hour: hour ?? fallback.slice(0, 2),
    minute: minute ?? "00",
  };
}

function previewNote(note: string | null) {
  if (!note) return "Aucun compte-rendu admin pour cette prestation.";
  return note.length > 120 ? `${note.slice(0, 120)}...` : note;
}

function vehicleTitle(vehicle: {
  label?: string | null;
  model?: string | null;
  plate?: string | null;
}) {
  const rawLabel = vehicle.label?.trim().toLowerCase();
  // Compare a la valeur stockee (non accentuee) — ne pas accentuer ici.
  if (rawLabel === "vehicule fondateur") {
    return "Vehicule";
  }
  return vehicle.label || vehicle.model || vehicle.plate || "Vehicule";
}

function vehicleSubtitle(vehicle: {
  label?: string | null;
  model?: string | null;
  plate?: string | null;
}) {
  const parts = [vehicle.model].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : "Aucun detail véhicule";
}

function vehicleSearchText(vehicle: ClientVehicle) {
  return [vehicle.label, vehicle.model, vehicle.plate].filter(Boolean).join(" ").toLowerCase();
}

function rewardStatusLabel(status: RewardRedemption["status"]) {
  if (status === "processed") return "Traitee";
  if (status === "cancelled") return "Annulee";
  return "Demandee";
}

function nextFreeSlot(days: ApiDay[]) {
  for (const day of days) {
    for (const slot of SLOT_ORDER) {
      if (day.slots[slot].status === "free" && !slotIsPast(day.date, slot)) {
        return { date: day.date, slot };
      }
    }
  }

  return null;
}

function pickFocusedDay(days: ApiDay[]) {
  if (days.length === 0) return null;

  const mine = days.find((day) => SLOT_ORDER.some((slot) => day.slots[slot].status === "mine"));
  if (mine) return mine.date;

  const free = days.find((day) => SLOT_ORDER.some((slot) => day.slots[slot].status === "free"));
  if (free) return free.date;

  const busy = days.find((day) => SLOT_ORDER.some((slot) => day.slots[slot].status === "busy"));
  if (busy) return busy.date;

  return days[0].date;
}

function pickDefaultSlot(day: ApiDay) {
  for (const slot of SLOT_ORDER) {
    if (day.slots[slot].status === "mine") return slot;
  }
  for (const slot of SLOT_ORDER) {
    if (day.slots[slot].status === "free") return slot;
  }
  for (const slot of SLOT_ORDER) {
    if (day.slots[slot].status === "busy") return slot;
  }
  return "morning";
}

function dayOverviewStatus(day: ApiDay): DayStatus {
  if (day.slots.morning.status === "mine" || day.slots.afternoon.status === "mine") {
    return "mine";
  }

  if (day.slots.morning.status === "free" || day.slots.afternoon.status === "free") {
    return "free";
  }

  if (day.slots.morning.status === "busy" || day.slots.afternoon.status === "busy") {
    return "busy";
  }

  return "done";
}

function slotNavigatorStatusLabel(status: DayStatus) {
  if (status === "free") return "Libre";
  if (status === "mine") return "A vous";
  if (status === "busy") return "Pris";
  return "Passe";
}

function buildWeekDays(days: ApiDay[], anchorDate: string | null) {
  if (!anchorDate) return [];

  const byDate = new Map(days.map((day) => [day.date, day]));
  const start = startOfWeekIso(anchorDate);

  return Array.from({ length: 7 }, (_, index) => byDate.get(addDaysIso(start, index)) ?? null);
}

function nextAppointment(appointments: ClientAppointment[]) {
  return (
    [...appointments]
      .filter((appointment) => {
        if (appointment.status === "cancelled") return false;
        return appointmentDateTime(appointment).getTime() >= Date.now();
      })
      .sort(
        (left, right) =>
          appointmentDateTime(left).getTime() - appointmentDateTime(right).getTime(),
      )[0] ?? null
  );
}

function AppointmentsEmpty({ copy }: { copy: string }) {
  return (
    <div className="bb-surface flex flex-col items-start gap-3 p-6">
      <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-accent">
        <CalendarClock className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white">Aucune fiche pour le moment</h3>
        <p className="mt-2 max-w-lg text-sm leading-6 text-white/65">{copy}</p>
      </div>
    </div>
  );
}

type ChoiceFieldProps = {
  label: string;
  options: Array<{
    value: string;
    label: string;
  }>;
  value: string;
  onChange: (value: string) => void;
  columnsClassName?: string;
};

function ChoiceField({
  label,
  options,
  value,
  onChange,
  columnsClassName = "grid-cols-2",
}: ChoiceFieldProps) {
  return (
    <div className="space-y-2">
      <span className="text-xs uppercase tracking-[0.16em] text-white/40">{label}</span>
      <div className={cn("grid gap-2", columnsClassName)}>
        {options.map((option) => (
          <button
            className={cn(
              "rounded-[18px] border px-3 py-3 text-sm font-semibold transition duration-200",
              option.value === value
                ? "border-accent/45 bg-accent/10 text-white shadow-[0_12px_28px_rgb(var(--bb-accent-rgb)/0.12)]"
                : "border-white/10 bg-black/20 text-white/70 hover:bg-white/[0.05]",
            )}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: 5 }).map((_, index) => {
        const active = index < rating;
        return (
          <Star
            className={cn(
              "h-4 w-4",
              active ? "fill-accent text-accent" : "text-white/20",
            )}
            key={index}
          />
        );
      })}
    </div>
  );
}

export function ClientCardPage() {
  const params = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const query = useQuery();

  const slug = params.slug || "card01";
  const monthParam = query.get("m");
  const requestedView = normalizePortalView(query.get("view"));
  const requestedDayParam = query.get("d");
  const launchTopupParam = query.get("launchTopup") === "1";
  const topupRefParam = query.get("topupRef");
  const founderRefParam = query.get("founderRef");
  const appointmentIdParam = query.get("appointmentId");
  const reviewParam = query.get("review");

  const [data, setData] = React.useState<ApiResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [appointments, setAppointments] = React.useState<ClientAppointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = React.useState(true);
  const [communityItems, setCommunityItems] = React.useState<PublicShowcaseItem[]>([]);
  const [communityLoading, setCommunityLoading] = React.useState(true);
  const [invoices, setInvoices] = React.useState<
    Array<{
      id: number;
      number: string;
      label: string;
      credits: number;
      amountCents: number;
      currency: string;
      paidAt: number | null;
    }>
  >([]);
  // Section avis: uniquement les retours avec une note etoilee et/ou un
  // commentaire ecrit (on n'affiche plus les photos).
  const communityReviews = React.useMemo(
    () =>
      communityItems.filter(
        (item) => item.userRating || (item.userReview && item.userReview.trim() !== ""),
      ),
    [communityItems],
  );
  const [busyAction, setBusyAction] = React.useState(false);
  const [reloadToken, setReloadToken] = React.useState(0);
  const [focusedDayDate, setFocusedDayDate] = React.useState<string | null>(null);

  const [selectedDay, setSelectedDay] = React.useState<ApiDay | null>(null);
  const [selectedSlot, setSelectedSlot] = React.useState<AppointmentSlot>("morning");
  const [selectedMode, setSelectedMode] = React.useState<ModalMode>("book");
  const [selectedTime, setSelectedTime] = React.useState(defaultTimeForSlot("morning"));
  const [appointmentLocation, setAppointmentLocation] =
    React.useState<AppointmentLocation>("atelier");
  const [serviceLevel, setServiceLevel] = React.useState<ServiceLevel>("clean");
  const [clientBookingNote, setClientBookingNote] = React.useState("");
  const [bookingImageDrafts, setBookingImageDrafts] = React.useState<BookingImageDraft[]>([]);

  const [selectedAppointment, setSelectedAppointment] =
    React.useState<ClientAppointment | null>(null);
  const [appointmentPhotos, setAppointmentPhotos] = React.useState<AppointmentPhoto[]>([]);
  const [appointmentPhotosLoading, setAppointmentPhotosLoading] = React.useState(false);
  const [reviewRating, setReviewRating] = React.useState(0);
  const [reviewText, setReviewText] = React.useState("");
  const [savingReview, setSavingReview] = React.useState(false);
  const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null);
  const [lightboxImages, setLightboxImages] = React.useState<LightboxImage[]>([]);
  const [toast, setToast] = React.useState<string | null>(null);
  const [termsModalOpen, setTermsModalOpen] = React.useState(false);
  const [termsChecked, setTermsChecked] = React.useState(false);
  const [termsSubmitting, setTermsSubmitting] = React.useState(false);
  const [termsPanelAttention, setTermsPanelAttention] = React.useState(false);
  const [termsCheckboxAttention, setTermsCheckboxAttention] = React.useState(false);
  const [contactModalOpen, setContactModalOpen] = React.useState(false);
  const [founderModalOpen, setFounderModalOpen] = React.useState(false);
  const [pushPermission, setPushPermission] = React.useState<NotificationPermission | "unsupported">(
    () => clientPushPermission(),
  );
  const [pushBusy, setPushBusy] = React.useState(false);
  const [notifPromptOpen, setNotifPromptOpen] = React.useState(false);
  const [notifBannerDismissed, setNotifBannerDismissed] = React.useState<boolean>(() => {
    try {
      return !!window.sessionStorage.getItem(`bb-notif-banner:${slug}`);
    } catch {
      return false;
    }
  });
  const lastOpenedAppointmentIdRef = React.useRef<number | null>(null);
  const reviewSectionRef = React.useRef<HTMLElement | null>(null);
  const appointmentsEverLoadedRef = React.useRef(false);
  const [historyTab, setHistoryTab] = React.useState<HistoryTab>("mine");
  const [historyFilter, setHistoryFilter] = React.useState<
    "all" | "requested" | "confirmed" | "done"
  >("requested");
  const [vehicleQuery, setVehicleQuery] = React.useState("");
  const [bookingVehicleQuery, setBookingVehicleQuery] = React.useState("");
  const [activeVehicleId, setActiveVehicleId] = React.useState<number | null>(null);
  const [vehicleModalOpen, setVehicleModalOpen] = React.useState(false);
  const [vehicleModalMode, setVehicleModalMode] = React.useState<"create" | "edit">("create");
  const [vehicleEditingId, setVehicleEditingId] = React.useState<number | null>(null);
  const [vehicleDraft, setVehicleDraft] = React.useState<VehicleDraft>({
    label: "",
    model: "",
    plate: "",
  });
  const [savingVehicle, setSavingVehicle] = React.useState(false);
  const [deletingVehicleId, setDeletingVehicleId] = React.useState<number | null>(null);
  const [redeemingRewardKey, setRedeemingRewardKey] = React.useState<string | null>(null);
  const [busyTopupKey, setBusyTopupKey] = React.useState<string | null>(null);
  const [customTopupQuantity, setCustomTopupQuantity] = React.useState("6");
  const [forfaitData, setForfaitData] = React.useState<ForfaitApiResponse | null>(null);
  const [forfaitBusyKey, setForfaitBusyKey] = React.useState<string | null>(null);
  const [generatedLinks, setGeneratedLinks] = React.useState<Record<string, string>>({});
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const bookingImagesRef = React.useRef<BookingImageDraft[]>([]);
  const bookingImageInputRef = React.useRef<HTMLInputElement | null>(null);
  const handledTopupRef = React.useRef<string | null>(null);
  const handledFounderRef = React.useRef<string | null>(null);
  const [founderCheckoutBusy, setFounderCheckoutBusy] = React.useState(false);
  const handledLaunchTopupRef = React.useRef<string | null>(null);
  const [openingCase, setOpeningCase] = React.useState<PendingCase | null>(null);
  const [caseResult, setCaseResult] = React.useState<CaseOpenResult | null>(null);
  const [caseSpinning, setCaseSpinning] = React.useState(false);
  const caseReelRef = React.useRef<HTMLDivElement>(null);
  const [reviewBoxResult, setReviewBoxResult] = React.useState<CaseOpenResult | null>(null);
  const [reviewBoxOpen, setReviewBoxOpen] = React.useState(false);
  const [reviewBoxBusy, setReviewBoxBusy] = React.useState(false);
  const [reviewBoxDeliveryNote, setReviewBoxDeliveryNote] = React.useState<string | null>(null);
  const reviewReelRef = React.useRef<HTMLDivElement>(null);
  const [eventBoxResult, setEventBoxResult] = React.useState<CaseOpenResult | null>(null);
  const [eventBoxOpen, setEventBoxOpen] = React.useState(false);
  const [eventBoxDeliveryNote, setEventBoxDeliveryNote] = React.useState<string | null>(null);
  const [eventModalOpen, setEventModalOpen] = React.useState(false);
  const [participateBusy, setParticipateBusy] = React.useState(false);
  const [waitlistBusy, setWaitlistBusy] = React.useState(false);
  const [recapOpen, setRecapOpen] = React.useState(false);
  const [recapLoading, setRecapLoading] = React.useState(false);
  const [recapData, setRecapData] = React.useState<{
    year: number;
    visits: number;
    creditsUsed: number;
    bcEarned: number;
    vehicles: number;
    reviews: number;
    photos: number;
  } | null>(null);
  const [leaderboardOpen, setLeaderboardOpen] = React.useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = React.useState(false);
  const [leaderboardOptBusy, setLeaderboardOptBusy] = React.useState(false);
  const [leaderboardData, setLeaderboardData] = React.useState<{
    optIn: boolean;
    yourBc: number;
    yourRank: number | null;
    entries: Array<{ rank: number; name: string; bc: number; isYou: boolean }>;
  } | null>(null);
  const [assistantOpen, setAssistantOpen] = React.useState(false);
  const [assistantScreen, setAssistantScreen] = React.useState("root");
  const eventReelRef = React.useRef<HTMLDivElement>(null);
  const [eventPrereqs, setEventPrereqs] = React.useState({
    instagram: false,
    tiktok: false,
    facebook: false,
    review: false,
    condition: false,
  });
  const [pendingTermsAction, setPendingTermsAction] = React.useState<
    | { type: "topup" }
    | {
        type: "book";
        date: string;
        slot: AppointmentSlot;
        time: string;
      }
    | null
  >(null);

  React.useEffect(() => {
    let active = true;

    async function loadClient() {
      try {
        setLoading(true);
        setError(null);

        const url = new URL(`/api/client/${encodeURIComponent(slug)}`, window.location.origin);
        if (monthParam) {
          url.searchParams.set("m", monthParam);
        }

        const response = await fetch(url.toString());
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const json = (await response.json()) as ApiResponse;
        if (!json.ok) throw new Error("invalid_payload");
        if (!active) return;

        setData(json);
      } catch (loadError) {
        if (active) {
          setError("Impossible de charger votre espace client.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadClient();

    return () => {
      active = false;
    };
  }, [slug, monthParam, reloadToken]);

  // Forfaits partenaire (comptes pro): charge la grille + le suivi des
  // paiements et rafraichit toutes les 15s tant que la vue est ouverte.
  React.useEffect(() => {
    if (!data || data.client.clientType !== "pro" || requestedView !== "shop") {
      return;
    }

    let active = true;

    async function loadForfaits() {
      try {
        const response = await fetch(`/api/client/${encodeURIComponent(slug)}/forfaits`);
        if (!response.ok) return;
        const json = (await response.json()) as ForfaitApiResponse;
        if (active && json.ok) {
          setForfaitData(json);
        }
      } catch {
        // suivi best-effort: on garde les donnees precedentes
      }
    }

    void loadForfaits();
    const interval = window.setInterval(() => void loadForfaits(), 15000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [data, requestedView, slug]);

  React.useEffect(() => {
    let active = true;

    async function loadAppointments() {
      try {
        // N'affiche le loader qu'au premier chargement; les rafraichissements
        // en arriere-plan (polling, focus) restent silencieux.
        if (!appointmentsEverLoadedRef.current) {
          setAppointmentsLoading(true);
        }

        const response = await fetch(`/api/client/${encodeURIComponent(slug)}/appointments`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const json = (await response.json()) as ListClientAppointmentsResponse;
        if (!json.ok) throw new Error("invalid_payload");
        if (!active) return;

        setAppointments(json.appointments ?? []);
        appointmentsEverLoadedRef.current = true;
      } catch (loadError) {
        if (active && !appointmentsEverLoadedRef.current) {
          setAppointments([]);
        }
      } finally {
        if (active) {
          setAppointmentsLoading(false);
        }
      }
    }

    void loadAppointments();

    return () => {
      active = false;
    };
  }, [slug, reloadToken]);

  // Rafraichissement temps reel: re-synchronise l'espace client periodiquement
  // et quand l'onglet reprend le focus, pour refleter les changements admin
  // (tarif valide, RDV confirme/annule, compte-rendu) sans action manuelle.
  React.useEffect(() => {
    if (!slug) return undefined;

    const refresh = () => {
      if (document.visibilityState === "visible") {
        setReloadToken((value) => value + 1);
      }
    };

    const interval = window.setInterval(refresh, 20000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [slug]);

  // Garde la modale de RDV ouverte synchronisee avec la derniere version
  // recue (statut, tarif, compte-rendu admin) -> mise a jour en direct.
  React.useEffect(() => {
    setSelectedAppointment((current) => {
      if (!current) return current;
      const fresh = appointments.find((item) => item.id === current.id);
      if (!fresh) return current;
      if (
        fresh.status === current.status &&
        fresh.adminNote === current.adminNote &&
        fresh.priceStatus === current.priceStatus &&
        fresh.approvedCredits === current.approvedCredits &&
        fresh.userRating === current.userRating
      ) {
        return current;
      }
      return fresh;
    });
  }, [appointments]);

  React.useEffect(() => {
    bookingImagesRef.current = bookingImageDrafts;
  }, [bookingImageDrafts]);

  React.useEffect(() => {
    return () => {
      bookingImagesRef.current.forEach((draft) => {
        URL.revokeObjectURL(draft.previewUrl);
      });
    };
  }, []);

  React.useEffect(() => {
    let active = true;

    async function loadCommunity() {
      try {
        setCommunityLoading(true);

        const response = await fetch(`/api/client/${encodeURIComponent(slug)}/community?limit=8`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const json = (await response.json()) as PublicShowcaseResponse;
        if (!json.ok) throw new Error("invalid_payload");
        if (!active) return;

        setCommunityItems(json.items ?? []);
      } catch (loadError) {
        if (active) {
          setCommunityItems([]);
        }
      } finally {
        if (active) {
          setCommunityLoading(false);
        }
      }
    }

    void loadCommunity();

    return () => {
      active = false;
    };
  }, [slug, reloadToken]);

  // Factures (paiements regles) du client.
  React.useEffect(() => {
    let active = true;
    async function loadInvoices() {
      try {
        const response = await fetch(`/api/client/${encodeURIComponent(slug)}/invoices`);
        if (!response.ok) return;
        const json = (await response.json()) as {
          ok?: boolean;
          invoices?: Array<{
            id: number;
            number: string;
            label: string;
            credits: number;
            amountCents: number;
            currency: string;
            paidAt: number | null;
          }>;
        };
        if (active && json.ok && json.invoices) setInvoices(json.invoices);
      } catch {
        /* best-effort */
      }
    }
    void loadInvoices();
    return () => {
      active = false;
    };
  }, [slug, reloadToken]);

  React.useEffect(() => {
    if (!toast) return undefined;

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 2800);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  React.useEffect(() => {
    if (!termsPanelAttention) return undefined;

    const timeout = window.setTimeout(() => {
      setTermsPanelAttention(false);
    }, 1500);

    return () => window.clearTimeout(timeout);
  }, [termsPanelAttention]);

  React.useEffect(() => {
    if (!termsCheckboxAttention) return undefined;

    const timeout = window.setTimeout(() => {
      setTermsCheckboxAttention(false);
    }, 1300);

    return () => window.clearTimeout(timeout);
  }, [termsCheckboxAttention]);

  function showToast(message: string) {
    setToast(message);
  }

  function dismissNotifPrompt() {
    if (slug) {
      try {
        window.sessionStorage.setItem(`bb-notif-prompt:${slug}`, "1");
      } catch {
        /* sessionStorage indisponible */
      }
    }
    setNotifPromptOpen(false);
  }

  async function handleEnablePush() {
    if (pushBusy) return;
    setPushBusy(true);
    try {
      const result = await enableClientPush(slug);
      setPushPermission(clientPushPermission());
      if (result.ok) {
        showToast("Notifications activees.");
      } else if (result.reason === "denied") {
        showToast("Notifications refusees. Autorisez-les dans les réglages.");
      } else if (result.reason === "not_configured") {
        showToast("Notifications indisponibles pour le moment.");
      } else if (result.reason === "unsupported") {
        showToast("Notifications non supportees sur cet appareil.");
      } else {
        showToast("Impossible d'activer les notifications.");
      }
    } finally {
      setPushBusy(false);
    }
  }

  function clearBookingImages() {
    bookingImagesRef.current.forEach((draft) => {
      URL.revokeObjectURL(draft.previewUrl);
    });
    bookingImagesRef.current = [];
    setBookingImageDrafts([]);
    if (bookingImageInputRef.current) {
      bookingImageInputRef.current.value = "";
    }
  }

  function removeBookingImage(imageId: string) {
    const target = bookingImagesRef.current.find((draft) => draft.id === imageId);
    if (target) {
      URL.revokeObjectURL(target.previewUrl);
    }

    setBookingImageDrafts((current) => current.filter((draft) => draft.id !== imageId));
  }

  function handleBookingImageSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) {
      return;
    }

    const currentCount = bookingImagesRef.current.length;
    const remainingSlots = Math.max(0, 4 - currentCount);

    if (remainingSlots <= 0) {
      showToast("Maximum 4 images par demande.");
      event.target.value = "";
      return;
    }

    const imageFiles = selectedFiles.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length !== selectedFiles.length) {
      showToast("Seules les images sont acceptees.");
    }

    const allowedFiles = imageFiles.slice(0, remainingSlots);
    if (allowedFiles.length < imageFiles.length) {
      showToast("Maximum 4 images par demande.");
    }

    if (allowedFiles.length > 0) {
      const drafts = allowedFiles.map((file, index) => ({
        id: `${Date.now()}-${currentCount + index}-${file.name}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      setBookingImageDrafts((current) => [...current, ...drafts]);
    }

    event.target.value = "";
  }

  const client = data?.client ?? null;
  const vehicles = data?.vehicles ?? [];
  const rewardCatalog = data?.rewardCatalog ?? [];
  const rewardRedemptions = data?.rewardRedemptions ?? [];
  const topupOffers = data?.topupOffers ?? [];
  const paymentsReady = data?.paymentsReady ?? false;
  const pendingCases = data?.pendingCases ?? [];

  // Univers visuel par type de compte (fond + surfaces + accents), applique
  // sur <html> pour un theming complet de la page (Fondateur / BBX / Pro).
  const accountTheme: "founder" | "bbx" | "pro" | null = client
    ? client.clientType === "pro"
      ? "pro"
      : client.isFounder
        ? "founder"
        : "bbx"
    : null;
  React.useEffect(() => {
    const root = document.documentElement;
    if (accountTheme) root.setAttribute("data-theme", accountTheme);
    return () => root.removeAttribute("data-theme");
  }, [accountTheme]);

  React.useEffect(() => {
    if (!topupRefParam || handledTopupRef.current === topupRefParam) {
      return;
    }

    handledTopupRef.current = topupRefParam;
    let active = true;

    async function syncTopupReturn() {
      try {
        const response = await fetch(`/api/client/${encodeURIComponent(slug)}/topup/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: topupRefParam }),
        });

        const json = (await response.json()) as TopupSyncResponse;
        if (!active || !response.ok || !json.ok) {
          return;
        }

        if (json.client) {
          setData((current) =>
            current
              ? {
                  ...current,
                  client: json.client as ApiClient,
                }
              : current,
          );
        }

        if (json.topupOrder?.status === "processed") {
          showToast("Paiement confirmé. Vos crédits viennent d'être ajoutes.");
          setReloadToken((value) => value + 1);
        } else if (json.topupOrder?.status === "pending" || json.topupOrder?.status === "paid") {
          showToast("Paiement reçu, confirmation encore en cours.");
        } else if (json.topupOrder?.status === "failed" || json.topupOrder?.status === "expired") {
          showToast("La recharge n'a pas ete finalisee.");
        }
      } catch (_error) {
        if (active) {
          showToast("Impossible de vérifier la recharge pour le moment.");
        }
      } finally {
        if (active) {
          const nextQuery = new URLSearchParams(query.toString());
          nextQuery.delete("topupRef");
          nextQuery.delete("launchTopup");
          const search = nextQuery.toString();
          navigate(`/card/${encodeURIComponent(slug)}${search ? `?${search}` : ""}`, {
            replace: true,
          });
        }
      }
    }

    void syncTopupReturn();

    return () => {
      active = false;
    };
  }, [navigate, query, slug, topupRefParam]);

  React.useEffect(() => {
    if (!founderRefParam || handledFounderRef.current === founderRefParam) {
      return;
    }

    handledFounderRef.current = founderRefParam;
    let active = true;

    async function syncFounderReturn() {
      try {
        const response = await fetch(`/api/client/${encodeURIComponent(slug)}/topup/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: founderRefParam }),
        });

        const json = (await response.json()) as TopupSyncResponse;
        if (!active || !response.ok || !json.ok) {
          return;
        }

        if (json.client) {
          setData((current) =>
            current ? { ...current, client: json.client as ApiClient } : current,
          );
        }

        if (json.topupOrder?.status === "processed") {
          showToast("Paiement confirmé. Bienvenue parmi les fondateurs !");
          setReloadToken((value) => value + 1);
        } else if (json.topupOrder?.status === "pending" || json.topupOrder?.status === "paid") {
          showToast("Paiement reçu, activation du statut fondateur en cours.");
        } else if (json.topupOrder?.status === "failed" || json.topupOrder?.status === "expired") {
          showToast("Le paiement fondateur n'a pas ete finalise.");
        }
      } catch (_error) {
        if (active) {
          showToast("Impossible de vérifier le paiement fondateur pour le moment.");
        }
      } finally {
        if (active) {
          const nextQuery = new URLSearchParams(query.toString());
          nextQuery.delete("founderRef");
          const search = nextQuery.toString();
          navigate(`/card/${encodeURIComponent(slug)}${search ? `?${search}` : ""}`, {
            replace: true,
          });
        }
      }
    }

    void syncFounderReturn();

    return () => {
      active = false;
    };
  }, [navigate, query, slug, founderRefParam]);

  React.useEffect(() => {
    if (!launchTopupParam || !client || !client.termsAcceptedAt) {
      return;
    }

    const launchKey = `${slug}:${launchTopupParam}:${topupOffers.length}:${paymentsReady ? "1" : "0"}`;
    if (handledLaunchTopupRef.current === launchKey) {
      return;
    }
    handledLaunchTopupRef.current = launchKey;

    const nextQuery = new URLSearchParams(query.toString());
    nextQuery.delete("launchTopup");
    const search = nextQuery.toString();
    navigate(`/card/${encodeURIComponent(slug)}${search ? `?${search}` : ""}`, {
      replace: true,
    });

    window.setTimeout(() => {
      openTopupFlow();
    }, 0);
  }, [client, launchTopupParam, navigate, paymentsReady, query, slug, topupOffers]);

  // Re-synchronise l'abonnement push si la permission a deja ete accordee.
  React.useEffect(() => {
    if (!slug || clientPushPermission() !== "granted") return;
    void enableClientPush(slug);
  }, [slug]);

  // Une fois l'application installee et lancee (mode standalone), propose une
  // seule fois d'activer les notifications (tant que l'utilisateur n'a pas choisi).
  React.useEffect(() => {
    if (!slug || !clientPushSupported() || clientPushPermission() !== "default") return;
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (!standalone) return;
    try {
      if (window.sessionStorage.getItem(`bb-notif-prompt:${slug}`)) return;
    } catch {
      /* sessionStorage indisponible */
    }
    setNotifPromptOpen(true);
  }, [slug]);

  // Ouvre automatiquement la modale d'un rendez-vous transmis via ?appointmentId=N.
  React.useEffect(() => {
    if (!appointmentIdParam || appointmentsLoading || selectedAppointment) return;
    const targetId = Number(appointmentIdParam);
    if (lastOpenedAppointmentIdRef.current === targetId) return;
    const found = appointments.find((a) => a.id === targetId);
    if (!found) return;
    lastOpenedAppointmentIdRef.current = targetId;
    void openAppointmentModal(found);
  // openAppointmentModal est stable (definie dans le meme composant, pas de deps changeantes)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentIdParam, appointments, appointmentsLoading, selectedAppointment]);

  // Lien "?review=1" (mail/notif de demande d'avis): defile jusqu'a la section avis.
  React.useEffect(() => {
    if (!reviewParam || !selectedAppointment) return;
    const timer = window.setTimeout(() => {
      reviewSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [reviewParam, selectedAppointment]);

  const month = data?.month ?? null;
  const monthDays = month?.days ?? [];
  // Les conditions sont acceptees a l'inscription (avant le code). On ne
  // redemande plus rien sur le reste du site (RDV, recharge...).
  const termsAccepted = true;

  const deferredVehicleQuery = React.useDeferredValue(vehicleQuery);
  const deferredBookingVehicleQuery = React.useDeferredValue(bookingVehicleQuery);

  React.useEffect(() => {
    const currentVehicles = data?.vehicles ?? [];

    if (currentVehicles.length === 0) {
      setActiveVehicleId(null);
      return;
    }

    const stillExists = currentVehicles.some((vehicle) => vehicle.id === activeVehicleId);
    if (stillExists) return;

    const primary = currentVehicles.find((vehicle) => vehicle.isPrimary) ?? currentVehicles[0];
    setActiveVehicleId(primary.id);
  }, [activeVehicleId, data?.vehicles]);

  function drawTermsPanelAttention() {
    setTermsPanelAttention(false);
    window.requestAnimationFrame(() => {
      setTermsPanelAttention(true);
    });
  }

  function drawTermsCheckboxAttention() {
    setTermsCheckboxAttention(false);
    window.requestAnimationFrame(() => {
      setTermsCheckboxAttention(true);
    });
  }

  const creditsRatio = client
    ? clampNumber(
        client.formulaTotal > 0 ? client.formulaRemaining / client.formulaTotal : 0,
        0,
        1,
      )
    : 0;

  const upcomingAppointment = React.useMemo(() => nextAppointment(appointments), [appointments]);
  const freeSlot = React.useMemo(() => nextFreeSlot(monthDays), [monthDays]);

  // Rendez-vous en attente d'une action tarif du client (accepter / recharger).
  const pricePendingAppointment = React.useMemo(
    () =>
      appointments.find(
        (a) =>
          a.priceStatus === "waiting_client_approval" || a.priceStatus === "waiting_payment",
      ) ?? null,
    [appointments],
  );

  const sortedAppointments = React.useMemo(() => {
    const next = [...appointments];
    next.sort(
      (left, right) => appointmentDateTime(right).getTime() - appointmentDateTime(left).getTime(),
    );
    return next;
  }, [appointments]);

  const filteredHistoryAppointments = React.useMemo(() => {
    const visible = sortedAppointments.filter(
      (appointment) => appointment.status !== "cancelled",
    );
    if (historyFilter === "all") return visible;
    return visible.filter((appointment) => appointment.status === historyFilter);
  }, [sortedAppointments, historyFilter]);

  const visibleVehicles = React.useMemo(() => {
    const queryValue = deferredVehicleQuery.trim().toLowerCase();
    if (!queryValue) return vehicles;
    return vehicles.filter((vehicle) => vehicleSearchText(vehicle).includes(queryValue));
  }, [deferredVehicleQuery, vehicles]);

  const bookingVisibleVehicles = React.useMemo(() => {
    const queryValue = deferredBookingVehicleQuery.trim().toLowerCase();
    if (!queryValue) return vehicles;
    return vehicles.filter((vehicle) => vehicleSearchText(vehicle).includes(queryValue));
  }, [deferredBookingVehicleQuery, vehicles]);

  const activeVehicle = React.useMemo(
    () =>
      vehicles.find((vehicle) => vehicle.id === activeVehicleId) ??
      vehicles.find((vehicle) => vehicle.isPrimary) ??
      vehicles[0] ??
      null,
    [activeVehicleId, vehicles],
  );

  const activeVehicleAppointments = React.useMemo(() => {
    if (!activeVehicle?.id) return sortedAppointments;
    return sortedAppointments.filter((appointment) => appointment.vehicleId === activeVehicle.id);
  }, [activeVehicle?.id, sortedAppointments]);

  React.useEffect(() => {
    if (monthDays.length === 0) return;

    if (requestedDayParam && monthDays.some((day) => day.date === requestedDayParam)) {
      if (focusedDayDate !== requestedDayParam) {
        setFocusedDayDate(requestedDayParam);
      }
      return;
    }

    if (focusedDayDate && monthDays.some((day) => day.date === focusedDayDate)) {
      return;
    }

    setFocusedDayDate(pickFocusedDay(monthDays));
  }, [focusedDayDate, monthDays, requestedDayParam]);

  const focusedDay = React.useMemo(
    () => monthDays.find((day) => day.date === focusedDayDate) ?? monthDays[0] ?? null,
    [focusedDayDate, monthDays],
  );

  const weekDays = React.useMemo(
    () => buildWeekDays(monthDays, focusedDay?.date ?? null),
    [focusedDay?.date, monthDays],
  );

  React.useEffect(() => {
    if (
      !selectedDay &&
      !selectedAppointment &&
      !lightboxUrl &&
      !termsModalOpen &&
      !vehicleModalOpen &&
      !contactModalOpen
    ) {
      return undefined;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      if (lightboxUrl) {
        setLightboxUrl(null);
        return;
      }

      if (selectedAppointment) {
        closeAppointmentModal();
        return;
      }

      if (termsModalOpen) {
        closeTermsModal();
        return;
      }

      if (vehicleModalOpen) {
        closeVehicleModal();
        return;
      }

      if (contactModalOpen) {
        setContactModalOpen(false);
        return;
      }

      if (selectedDay) {
        closeDayModal();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [contactModalOpen, lightboxUrl, selectedAppointment, selectedDay, termsModalOpen, vehicleModalOpen]);

  function openLightbox(images: LightboxImage[], url: string) {
    setLightboxImages(images);
    setLightboxUrl(url);
  }

  const currentDayAppointment = React.useMemo(() => {
    if (!selectedDay) return null;
    return (
      appointments.find(
        (appointment) =>
          appointment.date === selectedDay.date &&
          appointment.slot === selectedSlot &&
          appointment.status !== "cancelled",
      ) ?? null
    );
  }, [appointments, selectedDay, selectedSlot]);

  const currentDaySlot = selectedDay ? selectedDay.slots[selectedSlot] : null;
  const timeParts = splitTime(selectedTime, selectedSlot);
  const availableHours = SLOT_HOURS[selectedSlot];

  function portalHref(
    view: PortalView,
    overrides: { month?: string | null; date?: string | null } = {},
  ) {
    const params = new URLSearchParams();

    if (view !== "home") {
      params.set("view", view);
    }

    if (view === "booking") {
      const nextMonth =
        overrides.month ??
        month?.iso ??
        monthParam ??
        toIsoDate(new Date()).slice(0, 7);
      const nextDate =
        overrides.date ??
        focusedDayDate ??
        requestedDayParam ??
        pickFocusedDay(monthDays) ??
        null;

      if (nextMonth) params.set("m", nextMonth);
      if (nextDate) params.set("d", nextDate);
    }

    const search = params.toString();
    return `/card/${encodeURIComponent(slug)}${search ? `?${search}` : ""}`;
  }

  function navigateView(view: PortalView) {
    navigate(portalHref(view));
  }

  function syncDaySelection(day: ApiDay, slot: AppointmentSlot) {
    const normalizedSlot = normalizeAppointmentSlot(slot);
    const appointmentForSlot =
      appointments.find(
        (appointment) =>
          appointment.date === day.date &&
          appointment.slot === normalizedSlot &&
          appointment.status !== "cancelled",
      ) ?? null;
    const slotInfo = day.slots[normalizedSlot];
    const slotPast = slotIsPast(day.date, normalizedSlot);

    setFocusedDayDate(day.date);
    setSelectedDay(day);
    setSelectedSlot(normalizedSlot);
    setSelectedTime(
      appointmentForSlot?.time ?? slotInfo.time ?? defaultTimeForSlot(normalizedSlot),
    );
    setAppointmentLocation(appointmentForSlot?.location ?? slotInfo.location ?? "atelier");

    if (slotInfo.status === "mine" && !slotPast) {
      setSelectedMode("manage");
      return;
    }

    if (slotInfo.status === "free" && !slotPast) {
      setSelectedMode("book");
      return;
    }

    setSelectedMode("past");
  }

  function closeDayModal() {
    setSelectedDay(null);
    setSelectedSlot("morning");
    setClientBookingNote("");
    clearBookingImages();
  }

  async function openDayModal(day: ApiDay, preferredSlot?: AppointmentSlot) {
    if (!client) return;
    const slot = preferredSlot ?? pickDefaultSlot(day);

    syncDaySelection(day, slot);
    setClientBookingNote("");
    clearBookingImages();
  }

  function selectDaySlot(slot: AppointmentSlot) {
    if (!selectedDay) return;
    syncDaySelection(selectedDay, slot);
  }

  async function openAppointmentModal(appointment: ClientAppointment) {
    setSelectedAppointment(appointment);
    setReviewRating(appointment.userRating ?? 0);
    setReviewText(appointment.userReview ?? "");
    setAppointmentPhotosLoading(true);

    try {
      const response = await fetch(
        `/api/client/${encodeURIComponent(slug)}/appointments/${appointment.id}/photos`,
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const json = (await response.json()) as AppointmentPhotosResponse;
      if (!json.ok) throw new Error("invalid_payload");

      setAppointmentPhotos(json.photos ?? []);
    } catch (loadError) {
      setAppointmentPhotos([]);
    } finally {
      setAppointmentPhotosLoading(false);
    }
  }

  function closeAppointmentModal() {
    setSelectedAppointment(null);
    setAppointmentPhotos([]);
    setLightboxUrl(null);
  }

  function openTermsModal(
    action:
      | { type: "topup" }
      | {
          type: "book";
          date: string;
          slot: AppointmentSlot;
          time: string;
        }
      | null = null,
  ) {
    drawTermsPanelAttention();
    setPendingTermsAction(action);
    setTermsChecked(false);
    setTermsCheckboxAttention(false);
    setTermsModalOpen(true);
    window.setTimeout(() => {
      drawTermsCheckboxAttention();
    }, 120);
  }

  function closeTermsModal() {
    if (termsSubmitting) return;
    setTermsModalOpen(false);
    setTermsChecked(false);
    setPendingTermsAction(null);
  }

  function openVehicleCreate() {
    setVehicleModalMode("create");
    setVehicleEditingId(null);
    setVehicleDraft({ label: "", model: "", plate: "" });
    setVehicleModalOpen(true);
  }

  function openVehicleEdit(vehicle: ClientVehicle) {
    setVehicleModalMode("edit");
    setVehicleEditingId(vehicle.id);
    setVehicleDraft({
      label: vehicle.label ?? "",
      model: vehicle.model ?? "",
      plate: vehicle.plate ?? "",
    });
    setVehicleModalOpen(true);
  }

  function closeVehicleModal() {
    if (savingVehicle) return;
    setVehicleModalOpen(false);
    setVehicleEditingId(null);
    setVehicleDraft({ label: "", model: "", plate: "" });
  }

  async function saveVehicle() {
    setSavingVehicle(true);

    try {
      const creating = vehicleModalMode === "create";
      const targetId = vehicleEditingId;
      const response = await fetch(
        creating
          ? `/api/client/${encodeURIComponent(slug)}/vehicles`
          : `/api/client/${encodeURIComponent(slug)}/vehicles/${targetId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: vehicleDraft.label,
            model: vehicleDraft.model,
            plate: vehicleDraft.plate,
            isPrimary: creating ? vehicles.length === 0 : undefined,
          }),
        },
      );

      const json = (await response.json()) as VehiclesResponse;
      if (!response.ok || !json.ok || !json.vehicles) {
        showToast("Impossible d'enregistrer ce véhicule.");
        return;
      }

      setData((current) =>
        current
          ? {
              ...current,
              vehicles: json.vehicles,
            }
          : current,
      );

      const focusVehicle =
        json.vehicle?.id ??
        (targetId ? json.vehicles.find((vehicle) => vehicle.id === targetId)?.id : null) ??
        json.vehicles[0]?.id ??
        null;

      setActiveVehicleId(focusVehicle);
      closeVehicleModal();
      showToast(creating ? "Véhicule ajoute." : "Véhicule mis a jour.");
      setReloadToken((value) => value + 1);
    } catch (saveError) {
      showToast("Erreur reseau pendant la sauvegarde du véhicule.");
    } finally {
      setSavingVehicle(false);
    }
  }

  async function deleteVehicle(vehicleId: number) {
    setDeletingVehicleId(vehicleId);

    try {
      const response = await fetch(`/api/client/${encodeURIComponent(slug)}/vehicles/${vehicleId}`, {
        method: "DELETE",
      });
      const json = (await response.json()) as VehiclesResponse;
      if (!response.ok || !json.ok || !json.vehicles) {
        showToast("Impossible de supprimer ce véhicule.");
        return;
      }

      setData((current) =>
        current
          ? {
              ...current,
              vehicles: json.vehicles,
            }
          : current,
      );
      if (activeVehicleId === vehicleId) {
        setActiveVehicleId(json.vehicles[0]?.id ?? null);
      }
      showToast("Véhicule supprime.");
      setReloadToken((value) => value + 1);
    } catch (saveError) {
      showToast("Erreur reseau pendant la suppression du véhicule.");
    } finally {
      setDeletingVehicleId(null);
    }
  }

  async function makeVehiclePrimary(vehicleId: number) {
    try {
      const response = await fetch(
        `/api/client/${encodeURIComponent(slug)}/vehicles/${vehicleId}/primary`,
        { method: "POST" },
      );
      const json = (await response.json()) as VehiclesResponse;
      if (!response.ok || !json.ok || !json.vehicles) {
        showToast("Impossible de changer le véhicule principal.");
        return;
      }

      setData((current) =>
        current
          ? {
              ...current,
              vehicles: json.vehicles,
            }
          : current,
      );
      setActiveVehicleId(vehicleId);
      showToast("Véhicule principal mis a jour.");
    } catch (saveError) {
      showToast("Erreur reseau pendant la mise a jour du véhicule principal.");
    }
  }

  async function redeemReward(reward: RewardCatalogItem) {
    setRedeemingRewardKey(reward.key);

    try {
      const response = await fetch(`/api/client/${encodeURIComponent(slug)}/rewards/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardKey: reward.key }),
      });

      const json = (await response.json()) as RewardRedeemResponse;
      if (!response.ok || !json.ok) {
        showToast("Impossible d'utiliser vos BC'Coins pour le moment.");
        return;
      }

      setData((current) =>
        current && current.client
          ? {
              ...current,
              client: {
                ...current.client,
                bcPoints: json.bcPoints,
              },
              rewardRedemptions: json.rewardRedemptions,
            }
          : current,
      );
      showToast("Demande envoyee a Bryan Cars. L'equipe reprend contact avec vous.");
    } catch (saveError) {
      showToast("Erreur reseau pendant l'utilisation des BC'Coins.");
    } finally {
      setRedeemingRewardKey(null);
    }
  }

  async function openCase(pendingCase: PendingCase) {
    if (caseSpinning) return;
    unlockAudio();
    setCaseSpinning(true);
    setCaseResult(null);

    try {
      const response = await fetch(
        `/api/client/${encodeURIComponent(slug)}/cases/${pendingCase.id}/open`,
        { method: "POST", headers: { "Content-Type": "application/json" } },
      );

      const json = await response.json();
      if (!response.ok || !json.ok) {
        showToast("Impossible d'ouvrir cette case pour le moment.");
        setCaseSpinning(false);
        return;
      }

      // Mettre a jour les cases et le solde BC depuis la reponse serveur.
      setData((current) =>
        current && current.client
          ? {
              ...current,
              client: { ...current.client, bcPoints: json.bcPoints },
              pendingCases: json.pendingCases ?? [],
            }
          : current,
      );

      setCaseResult({ reward: json.reward, tiers: json.tiers });
      // caseSpinning reste true pendant l'animation; on le desactive apres le timeout dans le composant reel.
    } catch (_err) {
      showToast("Erreur reseau pendant l'ouverture de la case.");
      setCaseSpinning(false);
    }
  }

  async function startTopupCheckout(offer: TopupOffer, quantity = 1) {
    const busyKey = quantity > 1 ? `${offer.key}-x${quantity}` : offer.key;
    setBusyTopupKey(busyKey);

    try {
      const response = await fetch(`/api/client/${encodeURIComponent(slug)}/topup/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerKey: offer.key,
          quantity,
          unitPurchase: quantity > 1 || client?.clientType !== "bbx",
        }),
      });

      const json = (await response.json()) as TopupCheckoutResponse;
      if (!response.ok || !json.ok || !json.hostedCheckoutUrl) {
        if (json?.error === "terms_not_accepted") {
          openTermsModal({ type: "topup" });
          return;
        }
        if (json?.error === "sumup_not_ready") {
          if (SUMUP_TOPUP_URL) {
            window.open(SUMUP_TOPUP_URL, "_blank", "noopener,noreferrer");
            return;
          }
          showToast("La recharge en ligne n'est pas encore disponible.");
          return;
        }
        showToast("Impossible d'ouvrir la recharge pour le moment.");
        return;
      }

      window.location.href = json.hostedCheckoutUrl;
    } catch (saveError) {
      showToast("Erreur reseau pendant l'ouverture de la recharge.");
    } finally {
      setBusyTopupKey(null);
    }
  }

  async function startFounderCheckout() {
    setFounderCheckoutBusy(true);
    try {
      const response = await fetch(`/api/client/${encodeURIComponent(slug)}/founder/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = (await response.json()) as {
        ok?: boolean;
        hostedCheckoutUrl?: string;
        error?: string;
      };
      if (!response.ok || !json.ok || !json.hostedCheckoutUrl) {
        if (json?.error === "sumup_not_ready") {
          showToast("Le paiement en ligne n'est pas encore disponible.");
          return;
        }
        if (json?.error === "not_eligible_for_founder") {
          showToast("Ce compte ne peut pas passer fondateur.");
          return;
        }
        if (json?.error === "founder_cap_reached") {
          showToast("Les 50 places fondateur sont toutes prises.");
          return;
        }
        showToast("Impossible d'ouvrir le paiement fondateur pour le moment.");
        return;
      }
      window.location.href = json.hostedCheckoutUrl;
    } catch (_error) {
      showToast("Erreur reseau pendant l'ouverture du paiement.");
    } finally {
      setFounderCheckoutBusy(false);
    }
  }

  async function openReviewBoxFlow() {
    // Consommation explicite de la box: uniquement quand le client clique sur
    // "Ouvrir ma box". Tant qu'elle n'est pas ouverte, elle reste disponible.
    if (clientData.reviewBoxOpenedAt) {
      return;
    }
    unlockAudio();

    setReviewBoxBusy(true);
    try {
      const response = await fetch(`/api/client/${encodeURIComponent(slug)}/review-box/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = (await response.json()) as {
        ok?: boolean;
        error?: string;
        reward?: { key: string; label: string };
        tiers?: Array<{ key: string; label: string; proba: number }>;
        deliveryAppointment?: { date: string; slot: string } | null;
        client?: ApiClient;
      };
      if (response.status === 409) {
        showToast("Tu as déjà ouvert ta box.");
        return;
      }
      if (!response.ok || !json.ok || !json.reward || !json.tiers) {
        showToast("Impossible d'ouvrir la box pour le moment.");
        return;
      }
      if (json.client) {
        setData((current) => (current ? { ...current, client: json.client as ApiClient } : current));
      }
      setReviewBoxDeliveryNote(buildGoodieDeliveryNote(json.deliveryAppointment));
      setReviewBoxResult({
        reward: { tier: json.reward.key, label: json.reward.label, bc: 0 },
        tiers: json.tiers.map((tier) => ({
          key: tier.key,
          label: tier.label,
          proba: tier.proba,
          bc: 0,
        })),
      });
      setReviewBoxOpen(true);
    } catch (_error) {
      showToast("Erreur reseau pendant l'ouverture de la box.");
    } finally {
      setReviewBoxBusy(false);
    }
  }

  function renderSocialSection() {
    const socials = [
      { label: "Instagram", href: INSTAGRAM_URL },
      { label: "TikTok", href: TIKTOK_URL },
      { label: "Facebook", href: FACEBOOK_URL },
    ];
    const boxDone = !!clientData.reviewBoxOpenedAt;
    return (
      <article className="bb-surface bb-rise p-5 md:p-6">
        <div className="bb-section-head">
          <div>
            <p className="bb-eyebrow">Reseaux &amp; avis</p>
            <h2 className="bb-display mt-2 text-2xl font-semibold text-white">Suivez Bryan Cars</h2>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {socials.map((social) => (
            <a
              className="bb-hairline bb-hover-lift flex items-center justify-between p-4"
              href={social.href}
              key={social.label}
              rel="noreferrer"
              target="_blank"
            >
              <span className="text-sm font-semibold text-white">{social.label}</span>
              <ArrowRight className="h-4 w-4 text-accent" />
            </a>
          ))}
        </div>

        <div className="mt-4 rounded-[24px] border border-accent/30 bg-accent/[0.06] p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-accent/35 bg-accent/12 text-accent">
              <Gift className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-white">
                {boxDone
                  ? "Merci pour votre avis !"
                  : "Laissez un avis Google, puis ouvrez votre box"}
              </p>
              <p className="mt-1 text-sm leading-6 text-white/65">
                {boxDone
                  ? "Votre box a déjà ete ouverte (une seule par compte)."
                  : "Laissez votre avis, puis ouvrez votre box surprise. Elle vous attend ici tant que vous ne l'avez pas ouverte — une seule par compte."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  className="bb-button-ghost"
                  href={GOOGLE_REVIEWS_URL}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Star className="mr-2 h-4 w-4" />
                  Laisser un avis Google
                </a>
                {!boxDone && (
                  <button
                    className="bb-button-brand"
                    disabled={reviewBoxBusy}
                    onClick={() => {
                      void openReviewBoxFlow();
                    }}
                    type="button"
                  >
                    <Gift className="mr-2 h-4 w-4" />
                    {reviewBoxBusy ? "Ouverture..." : "Ouvrir ma box"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Envoie le nombre de tickets au serveur. La 1re fois cree la participation
  // (et ouvre la box de consolation); ensuite, ca ne fait que mettre a jour le
  // compteur de tickets (cosmetique). Les boutons d'action sont desactives
  // pendant l'appel, ce qui evite les appels concurrents.
  async function participateEvent(ticketCount: number) {
    const activeEvent = data?.event;
    if (!activeEvent) return;
    unlockAudio();
    setParticipateBusy(true);
    try {
      const response = await fetch(
        `/api/client/${encodeURIComponent(slug)}/event/${activeEvent.id}/participate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tickets: ticketCount }),
        },
      );
      const json = (await response.json()) as {
        ok?: boolean;
        created?: boolean;
        tickets?: number;
        consolation?: { key: string; label: string } | null;
        tiers?: Array<{ key: string; label: string; proba: number }>;
        deliveryAppointment?: { date: string; slot: string } | null;
      };
      if (!response.ok || !json.ok) {
        showToast("Participation impossible pour le moment.");
        return;
      }
      // Mises a jour suivantes (tickets en plus): rien a afficher.
      if (!json.created) {
        return;
      }
      showToast("Participation confirmée. Bonne chance !");
      if (json.consolation && json.tiers) {
        setEventBoxDeliveryNote(buildGoodieDeliveryNote(json.deliveryAppointment));
        setEventBoxResult({
          reward: { tier: json.consolation.key, label: json.consolation.label, bc: 0 },
          tiers: json.tiers.map((tier) => ({
            key: tier.key,
            label: tier.label,
            proba: tier.proba,
            bc: 0,
          })),
        });
        setEventBoxOpen(true);
      }
      setReloadToken((value) => value + 1);
    } catch (_error) {
      showToast("Erreur reseau pendant la participation.");
    } finally {
      setParticipateBusy(false);
    }
  }

  function renderEventTeaser() {
    const activeEvent = data?.event;
    if (!activeEvent) return null;

    return (
      <div className="bb-event-glow bb-rise rounded-[26px]">
        <div className="relative z-[2] flex flex-wrap items-center justify-between gap-4 p-4 md:p-5">
          <div className="min-w-0">
            <p className="bb-eyebrow flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Événement
            </p>
            <h3 className="bb-display mt-1 text-xl font-bold leading-tight text-white md:text-2xl">
              {activeEvent.title}
            </h3>
            {activeEvent.prizeKind === "text" && activeEvent.prizeText && (
              <p className="mt-1 text-sm text-white/70">
                A gagner :{" "}
                <span className="font-semibold text-accentSoft">{activeEvent.prizeText}</span>
              </p>
            )}
          </div>
          {activeEvent.participated ? (
            <button
              className="bb-button-ghost shrink-0"
              onClick={() => setEventModalOpen(true)}
              type="button"
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-200" />
              Gagner plus de tickets
            </button>
          ) : (
            <button
              className="bb-button-brand shrink-0"
              onClick={() => setEventModalOpen(true)}
              type="button"
            >
              Ouvrir l'événement
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderEventModal() {
    const activeEvent = data?.event;
    if (!activeEvent || !eventModalOpen) return null;

    const ticketActions = [
      activeEvent.requireFacebook && {
        key: "facebook" as const,
        label: "Suivre sur Facebook",
        href: FACEBOOK_URL,
        done: eventPrereqs.facebook,
      },
      activeEvent.requireInstagram && {
        key: "instagram" as const,
        label: "Suivre sur Instagram",
        href: INSTAGRAM_URL,
        done: eventPrereqs.instagram,
      },
      activeEvent.requireTiktok && {
        key: "tiktok" as const,
        label: "Suivre sur TikTok",
        href: TIKTOK_URL,
        done: eventPrereqs.tiktok,
      },
      activeEvent.requireReview && {
        key: "review" as const,
        label: "Laisser un avis Google",
        href: GOOGLE_REVIEWS_URL,
        done: activeEvent.reviewDone || eventPrereqs.review,
      },
      activeEvent.conditionsText && {
        key: "condition" as const,
        label: activeEvent.conditionsText,
        href: activeEvent.conditionsLink || "",
        done: eventPrereqs.condition,
      },
    ].filter(Boolean) as Array<{
      key: "facebook" | "instagram" | "tiktok" | "review" | "condition";
      label: string;
      href: string;
      done: boolean;
    }>;

    const ticketCount = ticketActions.filter((action) => action.done).length;

    return (
      <div
        className="fixed inset-0 z-[55] flex items-end justify-center bg-black/80 px-3 pb-3 pt-8 backdrop-blur-md md:items-center bb-backdrop-in"
        onClick={() => setEventModalOpen(false)}
      >
        <div
          className="bb-surface-strong bb-modal-panel max-h-[calc(100vh-1rem)] w-full max-w-2xl overflow-y-auto p-6 overscroll-contain md:p-7"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="bb-eyebrow flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Événement
              </p>
              <h3 className="bb-display mt-2 text-2xl font-semibold text-white">
                {activeEvent.title}
              </h3>
            </div>
            <button
              className="bb-button-ghost h-11 w-11 rounded-full px-0"
              onClick={() => setEventModalOpen(false)}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {activeEvent.prizeKind === "text" && activeEvent.prizeText && (
            <div className="mt-3">
              <span className="bb-pill border-accent/30 bg-accent/10 text-accentSoft">
                A gagner : {activeEvent.prizeText}
              </span>
            </div>
          )}
          {activeEvent.description && (
            <p className="bb-subtitle mt-3">{activeEvent.description}</p>
          )}

          <p className="mt-5 text-sm leading-6 text-white/65">
            Gagne des tickets : chaque action te donne <strong className="text-accentSoft">+1 ticket</strong>.
            Tu participes automatiquement des ta première action — continue ensuite pour gagner plus de tickets !
          </p>

          {activeEvent.participated && (
            <div className="mt-3 flex items-center gap-3 rounded-[18px] border border-emerald-300/25 bg-emerald-300/10 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-200" />
              <p className="text-sm leading-6 text-white/80">
                <span className="font-semibold text-white">Participation confirmée !</span> Bonne chance —
                le tirage aura lieu a la fin de l'événement. Tu peux continuer a gagner des tickets ci-dessous.
              </p>
            </div>
          )}

          <div className="mt-3 grid gap-2">
            {ticketActions.map((action) => (
              <button
                className={cn(
                  "flex items-center justify-between gap-3 rounded-[18px] border px-4 py-3 text-left transition duration-200",
                  action.done
                    ? "border-emerald-300/30 bg-emerald-300/[0.07]"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
                )}
                disabled={action.done || participateBusy}
                key={action.key}
                onClick={() => {
                  if (action.done) return;
                  if (action.href) {
                    window.open(action.href, "_blank", "noopener,noreferrer");
                  }
                  setEventPrereqs((prev) => ({ ...prev, [action.key]: true }));
                  // Cette action ajoute 1 ticket: on synchronise le total avec le
                  // serveur (la 1re fois cree la participation + la box).
                  void participateEvent(ticketCount + 1);
                }}
                type="button"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="text-lg">🎟️</span>
                  <span className="truncate text-sm font-semibold text-white">{action.label}</span>
                </span>
                <span
                  className={cn(
                    "shrink-0 text-xs font-bold uppercase tracking-[0.12em]",
                    action.done ? "text-emerald-200" : "text-accent",
                  )}
                >
                  {action.done ? "+1 ✓" : "+1 🎟️"}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-[18px] border border-accent/25 bg-accent/[0.06] px-4 py-3">
            <span className="text-sm text-white/70">Tes tickets</span>
            <span className="text-lg font-bold text-accentSoft">🎟️ {ticketCount}</span>
          </div>
        </div>
      </div>
    );
  }

  function openTopupFlow() {
    if (!client) return;

    if (!termsAccepted) {
      openTermsModal({ type: "topup" });
      return;
    }

    if (paymentsReady && topupOffers.length === 1) {
      void startTopupCheckout(topupOffers[0]);
      return;
    }

    if (paymentsReady && topupOffers.length > 1) {
      navigateView("shop");
      showToast("Choisissez la recharge qui vous convient.");
      return;
    }

    window.open(SUMUP_TOPUP_URL, "_blank", "noopener,noreferrer");
  }

  // Nombre exact de credits manquants pour valider le tarif d'un rendez-vous.
  function creditsNeededForAppointment(appointment: ClientAppointment) {
    const price = Number(appointment.approvedCredits ?? appointment.requestedCredits ?? 1);
    const owned = Number(client?.formulaRemaining ?? 0);
    return Math.max(1, price - owned);
  }

  // Recharge ciblee depuis la validation de tarif: on ferme la modale puis on
  // propose directement l'achat du nombre exact de credits manquants.
  function startCreditPurchaseForAppointment(appointment: ClientAppointment) {
    const needed = creditsNeededForAppointment(appointment);
    closeAppointmentModal();

    if (!termsAccepted) {
      openTermsModal({ type: "topup" });
      return;
    }

    // Fondateur: pas d'achat a l'unite, on l'oriente vers sa boutique/formule.
    if (client?.isFounder) {
      navigateView("shop");
      showToast(
        `Il manque ${needed} credit${needed > 1 ? "s" : ""} pour ce tarif. Rechargez votre formule.`,
      );
      return;
    }

    // BBX / Data / Pro: achat direct du nombre exact de credits a l'unite.
    if (paymentsReady && topupOffers[0]) {
      showToast(`Achat de ${needed} credit${needed > 1 ? "s" : ""} pour valider ce tarif.`);
      void startTopupCheckout(topupOffers[0], needed);
      return;
    }

    // Paiement en ligne indisponible: repli sur la recharge classique.
    openTopupFlow();
  }

  async function submitBooking(
    date: string,
    slot: AppointmentSlot,
    time: string,
    skipTermsCheck = false,
  ) {
    if (!data) return;
    if (vehicles.length > 0 && !activeVehicleId) {
      showToast("Selectionnez d'abord le véhicule concerne.");
      return;
    }

    if (!skipTermsCheck && !termsAccepted) {
      openTermsModal({ type: "book", date, slot, time });
      return;
    }

    setBusyAction(true);

    try {
      const formData = new FormData();
      formData.set("date", date);
      formData.set("slot", slot);
      formData.set("time", time);
      formData.set("location", appointmentLocation);
      formData.set("serviceLevel", serviceLevel);
      if (activeVehicleId) {
        formData.set("vehicleId", String(activeVehicleId));
      }
      if (clientBookingNote.trim()) {
        formData.set("clientNote", clientBookingNote.trim());
      }
      bookingImageDrafts.forEach((draft) => {
        formData.append("images", draft.file);
      });

      const response = await fetch(`/api/client/${encodeURIComponent(slug)}/book`, {
        method: "POST",
        body: formData,
      });

      const json = await response.json();
      if (!response.ok || !json.ok) {
        if (json?.error === "terms_not_accepted") {
          openTermsModal({ type: "book", date, slot, time });
          return;
        }
        if (json?.error === "too_many_images") {
          showToast("Maximum 4 images par demande.");
          return;
        }
        if (json?.error === "image_too_large") {
          showToast("Une image depasse la taille autorisee.");
          return;
        }
        if (json?.error === "invalid_image_type") {
          showToast("Seules les images sont acceptees.");
          return;
        }
        showToast("Impossible de réserver ce créneau.");
        return;
      }

      showToast(
        json?.clientImageCount > 0
          ? `Demande envoyee avec ${json.clientImageCount} image${
              json.clientImageCount > 1 ? "s" : ""
            }.`
          : "Demande de rendez-vous envoyee.",
      );
      setClientBookingNote("");
      clearBookingImages();
      setSelectedDay(null);
      setReloadToken((value) => value + 1);
    } catch (saveError) {
      showToast("Erreur reseau pendant la réservation.");
    } finally {
      setBusyAction(false);
    }
  }

  async function acceptTermsAndContinue() {
    if (!client) return;
    if (!termsChecked) {
      drawTermsCheckboxAttention();
      return;
    }

    setTermsSubmitting(true);

    try {
      const response = await fetch(`/api/client/${encodeURIComponent(slug)}/terms/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const json = (await response.json()) as AcceptTermsResponse;
      if (!response.ok || !json.ok || !json.client) {
        showToast("Impossible d'enregistrer votre acceptation.");
        return;
      }

      setData((current) =>
        current
          ? {
              ...current,
              client: json.client as ApiClient,
            }
          : current,
      );

      const action = pendingTermsAction;
      setTermsModalOpen(false);
      setTermsChecked(false);
      setPendingTermsAction(null);
      showToast("Conditions acceptees. Vous pouvez continuer.");

      if (action?.type === "topup") {
        window.open(SUMUP_TOPUP_URL, "_blank", "noopener,noreferrer");
        return;
      }

      if (action?.type === "book") {
        await submitBooking(action.date, action.slot, action.time, true);
      }
    } catch (saveError) {
      showToast("Erreur reseau pendant l'acceptation des conditions.");
    } finally {
      setTermsSubmitting(false);
    }
  }

  async function cancel(date: string, slot: AppointmentSlot) {
    if (!client?.isFounder && !canChangeDay(date)) {
      showToast("Annulation fermee a partir de la veille a minuit.");
      return;
    }
    if (client?.isFounder && slotIsPast(date, slot)) {
      showToast("Le créneau est déjà passe.");
      return;
    }

    setBusyAction(true);

    try {
      const response = await fetch(`/api/client/${encodeURIComponent(slug)}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, slot }),
      });

      const json = await response.json();
      if (!response.ok || !json.ok) {
        showToast("Impossible d'annuler ce rendez-vous.");
        return;
      }

      showToast("Rendez-vous annulé.");
      setSelectedDay(null);
      setReloadToken((value) => value + 1);
    } catch (saveError) {
      showToast("Erreur reseau pendant l'annulation.");
    } finally {
      setBusyAction(false);
    }
  }

  async function acceptSelectedAppointmentPrice() {
    if (!selectedAppointment) return;
    setBusyAction(true);
    try {
      const response = await fetch(
        `/api/client/${encodeURIComponent(slug)}/appointments/${selectedAppointment.id}/accept-price`,
        { method: "POST", headers: { "Content-Type": "application/json" } },
      );
      const json = await response.json().catch(() => ({}));

      if (!response.ok || !json.ok) {
        if (json?.error === "not_enough_credits") {
          startCreditPurchaseForAppointment(selectedAppointment);
          return;
        }
        showToast("Impossible de valider le tarif.");
        return;
      }

      setSelectedAppointment(json.appointment ?? null);
      if (json.client) {
        setData((current) => (current ? { ...current, client: json.client } : current));
      }
      setReloadToken((value) => value + 1);
      showToast("Tarif validé. Le rendez-vous est confirmé.");
    } catch (error) {
      showToast("Erreur reseau pendant la validation.");
    } finally {
      setBusyAction(false);
    }
  }

  async function uploadSelectedAppointmentPhotos() {
    if (!selectedAppointment) return;
    if (bookingImageDrafts.length === 0) {
      showToast("Ajoutez au moins une photo.");
      return;
    }

    setBusyAction(true);
    try {
      const formData = new FormData();
      bookingImageDrafts.forEach((draft) => {
        formData.append("images", draft.file);
      });

      const response = await fetch(
        `/api/client/${encodeURIComponent(slug)}/appointments/${selectedAppointment.id}/photos`,
        { method: "POST", body: formData },
      );
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json.ok) {
        showToast("Impossible d'envoyer les photos.");
        return;
      }

      clearBookingImages();
      setSelectedAppointment(json.appointment ?? selectedAppointment);
      setReloadToken((value) => value + 1);
      showToast("Photos envoyees a l'admin.");
    } catch (error) {
      showToast("Erreur reseau pendant l'envoi des photos.");
    } finally {
      setBusyAction(false);
    }
  }

  async function updateTime(date: string, slot: AppointmentSlot, newTime: string) {
    setBusyAction(true);

    try {
      const response = await fetch(`/api/client/${encodeURIComponent(slug)}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          slot,
          time: newTime,
          location: appointmentLocation,
          vehicleId: currentDayAppointment?.vehicleId ?? activeVehicleId,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.ok) {
        showToast("Impossible de mettre a jour l'heure.");
        return;
      }

      showToast("Horaire mis a jour.");
      setSelectedDay(null);
      setReloadToken((value) => value + 1);
    } catch (saveError) {
      showToast("Erreur reseau pendant la mise a jour.");
    } finally {
      setBusyAction(false);
    }
  }

  async function saveReview() {
    if (!selectedAppointment) return;
    if (reviewRating < 1 || reviewRating > 5) {
      showToast("Choisissez une note entre 1 et 5.");
      return;
    }

    setSavingReview(true);

    try {
      const response = await fetch(
        `/api/client/${encodeURIComponent(slug)}/appointments/${selectedAppointment.id}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating: reviewRating,
            review: reviewText.trim(),
          }),
        },
      );

      const json = (await response.json()) as SaveReviewResponse;
      if (!response.ok || !json.ok || !json.appointment) {
        showToast("Impossible d'enregistrer votre avis.");
        return;
      }

      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === json.appointment?.id ? json.appointment : appointment,
        ),
      );
      setSelectedAppointment((current) =>
        current && current.id === json.appointment?.id ? json.appointment : current,
      );
      showToast("Merci, votre avis a bien ete enregistré.");
    } catch (saveError) {
      showToast("Erreur reseau pendant l'enregistrement.");
    } finally {
      setSavingReview(false);
    }
  }

  function goFocusedDay(delta: number) {
    const base = focusedDay?.date ?? requestedDayParam ?? pickFocusedDay(monthDays);
    if (!base) return;
    const target = addDaysIso(base, delta);
    const existsInMonth = monthDays.some((day) => day.date === target);

    if (existsInMonth) {
      setFocusedDayDate(target);
      navigate(portalHref("booking", { month: target.slice(0, 7), date: target }));
      return;
    }

    navigate(portalHref("booking", { month: target.slice(0, 7), date: target }));
  }

  const canReviewSelected =
    !!selectedAppointment &&
    selectedAppointment.status === "done" &&
    appointments.some((appointment) => appointment.id === selectedAppointment.id);
  const bookingLocked = !termsAccepted;

  // N'affiche le plein-ecran de chargement qu'au tout premier chargement
  // (quand aucune donnee n'est encore disponible). Les rechargements en
  // arriere-plan (changement de mois, refresh) gardent la page affichee
  // pour eviter le flash de chargement entre les pages.
  if (loading && !client) {
    return (
      <div className="bb-shell">
        <div className="bb-content flex min-h-[70vh] items-center justify-center">
          <div className="bb-surface flex items-center gap-3 px-6 py-4 text-sm text-white/70">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            Chargement de votre espace client...
          </div>
        </div>
      </div>
    );
  }

  if (error || !client || !month) {
    return (
      <div className="bb-shell">
        <div className="bb-content max-w-3xl">
          <div className="bb-surface-strong p-8 text-center">
            <p className="bb-eyebrow">Carte introuvable</p>
            <h1 className="bb-display mt-4 text-3xl font-semibold text-white">
              Impossible d&apos;ouvrir cet espace.
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/65">
              Verifiez le lien NFC ou rouvrez votre carte depuis le lien fourni par Bryan Cars.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const clientData = client;

  const quickCards = [
    {
      view: "booking" as const,
      title: "Prendre rendez-vous",
      copy: freeSlot
        ? `${formatDateFR(freeSlot.date, { day: "numeric", month: "short" })} · ${slotLabel(
            freeSlot.slot,
          )}`
        : "Planning a consulter",
      icon: CalendarClock,
    },
    {
      view: "vehicles" as const,
      title: "Mes véhicules",
      copy:
        vehicles.length <= 1
          ? vehicleTitle(activeVehicle ?? { model: clientData.vehicleModel })
          : `${vehicles.length} vehicules enregistres`,
      icon: CarFront,
    },
    {
      view: "shop" as const,
      title: "Boutique BC'Coins",
      copy: `${clientData.bcPoints} point${clientData.bcPoints > 1 ? "s" : ""} disponibles`,
      icon: Gift,
    },
    {
      view: "history" as const,
      title: "Historique et suivi",
      copy: upcomingAppointment
        ? `Prochain passage: ${formatDateFR(upcomingAppointment.date, {
            day: "numeric",
            month: "short",
          })}`
        : "Photos, avis et dossiers",
      icon: Clock3,
    },
  ];

  // L'accueil non-fondateur n'expose pas la boutique BC'Coins (reservee aux fondateurs).
  const homeQuickCards = quickCards.filter((card) => card.view !== "shop");

  // Pour les pros (dispenses de credits), la "Boutique" devient l'espace
  // Forfaits partenaire: generation de liens de paiement + suivi.
  // Pour les non-fondateurs standard, la "Boutique" devient une simple recharge de credits.
  const navItems: NavItem[] = PORTAL_NAV_ITEMS.map((item) => {
    if (item.view !== "shop") {
      return item;
    }
    if (clientData.clientType === "pro") {
      return { ...item, label: "Forfaits", icon: Sparkles };
    }
    if (!clientData.isFounder) {
      return { ...item, label: "Credits", icon: CreditCard };
    }
    return item;
  });

  function renderHeader() {
    return (
      <>
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img
              alt="Bryan Cars"
              className="h-9 w-9 rounded-xl object-cover ring-1 ring-white/10"
              src="/app-icon-192.png"
            />
            <div className="leading-none">
              <p className="bb-display text-sm font-bold text-white">Bryan Cars</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/40">Mon espace</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {clientPushSupported() && pushPermission !== "granted" && (
              <button
                aria-label="Activer les notifications"
                className="bb-icon-btn"
                disabled={pushBusy}
                onClick={() => {
                  void handleEnablePush();
                }}
                type="button"
              >
                <Bell className="h-4 w-4" />
              </button>
            )}
            <button
              aria-label="Contacter Bryan Cars"
              className="bb-icon-btn"
              onClick={() => setContactModalOpen(true)}
              type="button"
            >
              <Phone className="h-4 w-4" />
            </button>
            <InstallAppButton
              appName="Bryan Cars"
              className="bb-button-ghost h-11 rounded-2xl px-3 text-xs"
              startUrl={`/card/${encodeURIComponent(slug)}`}
            />
          </div>
        </header>

        <nav className={cn("hidden gap-2 rounded-[28px] border border-white/10 bg-white/[0.03] p-2 backdrop-blur-xl md:grid", navItems.length === 4 ? "grid-cols-4" : "grid-cols-5")}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = requestedView === item.view;
            return (
              <Link
                className={cn(
                  "flex items-center justify-center gap-2 rounded-[22px] px-4 py-3 text-sm font-semibold transition duration-200",
                  active
                    ? "bg-accent/12 text-white shadow-[0_12px_28px_rgb(var(--bb-accent-rgb)/0.12)]"
                    : "text-white/68 hover:bg-white/[0.05]",
                )}
                key={item.view}
                to={portalHref(item.view)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </>
    );
  }

  function renderAppointmentCard(appointment: ClientAppointment) {
    return (
      <button
        className="bb-surface w-full p-5 text-left transition duration-200 hover:-translate-y-1"
        key={appointment.id}
        onClick={() => {
          void openAppointmentModal(appointment);
        }}
        type="button"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className={cn("bb-pill", appointmentStatusClasses(appointment.status))}>
                {appointmentStatusLabel(appointment.status)}
              </div>
              <div
                className={cn(
                  "bb-pill border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                  locationClasses(appointment.location),
                )}
              >
                {locationLabel(appointment.location)}
              </div>
              <div className="bb-pill border-white/12 bg-white/[0.04] text-white/65">
                {slotLabel(appointment.slot)}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white">{formatDateFR(appointment.date)}</h3>
              <p className="mt-2 text-sm text-white/60">
                {slotWindowLabel(appointment.slot)} · {formatTimeHHMM(appointment.time)} -{" "}
                {appointment.vehicleModel || clientData.vehicleModel || "Vehicule"}
              </p>
            </div>

            <p className="max-w-2xl text-sm leading-6 text-white/58">
              {previewNote(appointment.adminNote)}
            </p>

            {appointment.goodies && appointment.goodies.length > 0 && (
              <div className="flex items-center gap-2 rounded-2xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm font-semibold text-accentSoft">
                <Gift className="h-4 w-4 shrink-0" />
                <span>Cadeau a recuperer : {appointment.goodies.join(", ")}</span>
              </div>
            )}
          </div>

          <div className="min-w-[150px] space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.16em] text-white/35">Photos</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {appointment.hasPhotos ? "Oui" : "Non"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.16em] text-white/35">Avis</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {appointment.userRating ? `${appointment.userRating}/5` : "--"}
              </p>
            </div>
          </div>
        </div>
      </button>
    );
  }

  function appointmentCalendarEvent(appt: ClientAppointment): CalendarEvent {
    return {
      title: "Bryan Cars - Detailing",
      date: appt.date,
      time: appt.time,
      slot: appt.slot,
      location: appt.location === "domicile" ? "A domicile" : "Atelier Bryan Cars",
      details: `Detailing ${appt.vehicleModel || clientData.vehicleModel || ""}`.trim(),
    };
  }

  async function joinWaitlist(date: string, slot: AppointmentSlot) {
    if (waitlistBusy) return;
    setWaitlistBusy(true);
    try {
      const response = await fetch(`/api/client/${encodeURIComponent(slug)}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, slot }),
      });
      const json = (await response.json().catch(() => ({}))) as { ok?: boolean };
      if (response.ok && json.ok) {
        showToast("Tu es sur la liste d'attente. On te previent si ce créneau se libere.");
        setReloadToken((value) => value + 1);
      } else {
        showToast("Impossible de rejoindre la liste d'attente pour le moment.");
      }
    } catch (_error) {
      showToast("Erreur reseau pendant l'inscription en liste d'attente.");
    } finally {
      setWaitlistBusy(false);
    }
  }

  async function openRecap() {
    setRecapOpen(true);
    if (recapData) return;
    setRecapLoading(true);
    try {
      const response = await fetch(`/api/client/${encodeURIComponent(slug)}/recap`);
      const json = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        recap?: {
          year: number;
          visits: number;
          creditsUsed: number;
          bcEarned: number;
          vehicles: number;
          reviews: number;
          photos: number;
        };
      };
      if (json.ok && json.recap) setRecapData(json.recap);
    } catch {
      /* best-effort */
    } finally {
      setRecapLoading(false);
    }
  }

  async function openLeaderboard() {
    setLeaderboardOpen(true);
    setLeaderboardLoading(true);
    try {
      const response = await fetch(`/api/client/${encodeURIComponent(slug)}/leaderboard`);
      const json = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        optIn?: boolean;
        yourBc?: number;
        yourRank?: number | null;
        entries?: Array<{ rank: number; name: string; bc: number; isYou: boolean }>;
      };
      if (json.ok) {
        setLeaderboardData({
          optIn: !!json.optIn,
          yourBc: json.yourBc ?? 0,
          yourRank: json.yourRank ?? null,
          entries: json.entries ?? [],
        });
      }
    } catch {
      /* best-effort */
    } finally {
      setLeaderboardLoading(false);
    }
  }

  async function toggleLeaderboardOptIn(optIn: boolean) {
    setLeaderboardOptBusy(true);
    try {
      const response = await fetch(`/api/client/${encodeURIComponent(slug)}/leaderboard/opt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optIn }),
      });
      if (response.ok) await openLeaderboard();
    } catch {
      /* best-effort */
    } finally {
      setLeaderboardOptBusy(false);
    }
  }

  function renderLeaderboardTeaser() {
    if (!clientData.isFounder) return null;
    return (
      <button
        className="bb-rise bb-hover-lift group flex w-full items-center justify-between gap-4 rounded-[26px] border border-accent/25 bg-accent/[0.06] p-5 text-left"
        onClick={() => {
          void openLeaderboard();
        }}
        type="button"
      >
        <div className="min-w-0">
          <p className="bb-eyebrow flex items-center gap-1.5">
            <Crown className="h-3.5 w-3.5" />
            Classement
          </p>
          <p className="mt-1 text-lg font-bold text-white">Classement BC&apos;Coins</p>
          <p className="mt-0.5 text-sm text-white/60">Compare-toi aux autres fondateurs.</p>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-accent transition group-hover:translate-x-1" />
      </button>
    );
  }

  // Assistant guide (scripte): menus + boutons qui declenchent les actions.
  function renderAssistant() {
    const act = (fn: () => void) => {
      setAssistantOpen(false);
      setAssistantScreen("root");
      fn();
    };
    const goTo = (screen: string) => setAssistantScreen(screen);

    const upcoming = appointments
      .filter((a) => a.status === "requested" || a.status === "confirmed")
      .slice(0, 6);
    const tarifs = appointments.filter(
      (a) => a.priceStatus === "waiting_client_approval" || a.priceStatus === "waiting_payment",
    );

    // --- FAQ de l'assistant ---
    // Pour AJOUTER/MODIFIER une reponse : edite ce tableau. Mise en forme :
    // les sauts de ligne sont conserves (whitespace-pre-line), et une ligne qui
    // commence par "• " s'affiche comme une puce. Mets `founderOnly: true` pour
    // n'afficher la question qu'aux fondateurs. (Voir aussi CLAUDE.md.)
    const faq: Array<{ q: string; a: string; founderOnly?: boolean }> = [
      {
        q: "Comment marchent les credits ?",
        a:
          "Chaque prestation coute des credits selon l'etat du vehicule :\n" +
          "• Propre (entretien) : 1 credit\n" +
          "• Correct (traces, nettoyage plus pousse) : 2 credits\n" +
          "• Sale (remise a niveau exigeante) : 3 credits\n\n" +
          "Pour une demande specifique, l'atelier peut fixer un tarif personnalise. " +
          "Tu vois toujours le tarif propose et tu l'acceptes (ou recharges) avant la " +
          "confirmation du rendez-vous. Les credits ne sont debites qu'a ce moment-la.",
      },
      {
        q: "Comment annuler ou deplacer un RDV ?",
        a:
          "Va dans Suivi, ouvre la fiche du rendez-vous, puis « Annuler le RDV ».\n" +
          "• Fondateur : annulation / deplacement possible le jour meme.\n" +
          "• Autres comptes : jusqu'a 24h avant le creneau.\n\n" +
          "Si des credits avaient ete debites, ils te sont automatiquement recredites.",
      },
      {
        q: "Comment se passe un rendez-vous ?",
        a:
          "1. Tu reserves un creneau (matin 9h-12h ou apres-midi 14h-18h), a l'atelier ou a domicile.\n" +
          "2. L'atelier estime l'etat du vehicule et valide le tarif (en credits).\n" +
          "3. Tu acceptes le tarif (ou recharges si besoin) -> le RDV est confirme.\n" +
          "4. Le jour J, la prestation est realisee.\n" +
          "5. Ensuite : photos et ton avis dans Suivi.",
      },
      {
        q: "Comment payer / recharger ?",
        a:
          "Le paiement se fait par carte bancaire via SumUp (page securisee), Apple Pay / " +
          "Google Pay inclus.\n" +
          "• Recharge de credits depuis la boutique / le bouton Recharger.\n" +
          "• A la validation d'un tarif, tu peux recharger juste ce qu'il manque.\n\n" +
          "Une facture est disponible dans Suivi -> Mes factures apres chaque paiement.",
      },
      {
        q: "C'est quoi le statut Fondateur ?",
        a:
          "Acces a vie pour 29,99 € (places limitees a 50). Avantages :\n" +
          "• BC'Coins sur tes achats et passages, echangeables en boutique fidelite\n" +
          "• Box surprises et box de consolation lors des evenements\n" +
          "• Carte premium personnalisee\n" +
          "• Annulation / deplacement le jour meme\n" +
          "• Offres et recharges reservees\n\n" +
          "Le nombre de places restantes s'affiche sur la page « Devenir fondateur ».",
      },
      {
        q: "Comment marchent les BC'Coins ?",
        a:
          "Les BC'Coins sont la monnaie fidelite des fondateurs :\n" +
          "• +80 BC par credit achete (immediat) et +20 BC par credit, debloques quand le RDV est effectue\n" +
          "• Echange en boutique fidelite (ex. 2000 BC = bon de 100 €)\n" +
          "• 1 BC vaut environ 0,05 €\n\n" +
          "Tu peux aussi figurer au classement BC'Coins (option a activer).",
        founderOnly: true,
      },
    ];
    const faqList = faq.filter((f) => !f.founderOnly || clientData.isFounder);

    let botText = "";
    let chips: Array<{ label: string; onClick: () => void; brand?: boolean }> = [];

    if (assistantScreen === "rdv") {
      if (upcoming.length === 0) {
        botText = "Tu n'as pas de rendez-vous a venir.";
        chips = [
          { label: "➕ Prendre un RDV", onClick: () => act(() => navigateView("booking")), brand: true },
          { label: "← Menu", onClick: () => goTo("root") },
        ];
      } else {
        botText = "Voici tes rendez-vous a venir. Lequel veux-tu ouvrir ?";
        chips = upcoming.map((a) => ({
          label: `${formatDateFR(a.date)} · ${slotLabel(a.slot)}`,
          onClick: () => act(() => void openAppointmentModal(a)),
        }));
        chips.push({ label: "← Menu", onClick: () => goTo("root") });
      }
    } else if (assistantScreen === "tarif") {
      if (tarifs.length === 0) {
        botText = "Aucun tarif a valider pour le moment 🎉";
        chips = [{ label: "← Menu", onClick: () => goTo("root") }];
      } else {
        botText = "Ces rendez-vous attendent ta validation de tarif :";
        chips = tarifs.map((a) => ({
          label: `${formatDateFR(a.date)} — valider`,
          onClick: () => act(() => void openAppointmentModal(a)),
          brand: true,
        }));
        chips.push({ label: "← Menu", onClick: () => goTo("root") });
      }
    } else if (assistantScreen === "box") {
      if (clientData.isFounder) {
        botText = "Tes BC'Coins et tes box sont dans ta boutique fidelite.";
        chips = [
          { label: "Ouvrir la boutique", onClick: () => act(() => navigateView("shop")), brand: true },
          { label: "← Menu", onClick: () => goTo("root") },
        ];
      } else {
        botText = clientData.reviewBoxOpenedAt
          ? "Tu as deja ouvert ta box avis. Merci !"
          : "Laisse un avis Google et ouvre ta box surprise (1 par compte) !";
        chips = [
          ...(clientData.reviewBoxOpenedAt
            ? []
            : [
                {
                  label: "Ouvrir ma box",
                  onClick: () => act(() => void openReviewBoxFlow()),
                  brand: true,
                },
              ]),
          { label: "← Menu", onClick: () => goTo("root") },
        ];
      }
    } else if (assistantScreen === "faq") {
      botText = "Choisis une question :";
      chips = faqList.map((f, i) => ({ label: f.q, onClick: () => goTo(`faq:${i}`) }));
      chips.push({ label: "← Menu", onClick: () => goTo("root") });
    } else if (assistantScreen.startsWith("faq:")) {
      const item = faqList[Number(assistantScreen.split(":")[1])];
      botText = item ? item.a : "Question introuvable.";
      chips = [
        { label: "← Autres questions", onClick: () => goTo("faq") },
        { label: "Menu", onClick: () => goTo("root") },
      ];
    } else if (assistantScreen === "contact") {
      botText = "Comment veux-tu nous joindre ?";
      chips = [
        {
          label: "WhatsApp",
          onClick: () => act(() => window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer")),
          brand: true,
        },
        { label: "Appeler", onClick: () => act(() => { window.location.href = PHONE_URL; }) },
        { label: "← Menu", onClick: () => goTo("root") },
      ];
    } else {
      botText = `Salut ${clientData.firstName || ""} 👋 Je peux t'aider a quoi ?`;
      chips = [
        { label: "📅 Mes rendez-vous", onClick: () => goTo("rdv") },
        { label: "💶 Valider un tarif", onClick: () => goTo("tarif") },
        { label: "➕ Prendre un RDV", onClick: () => act(() => navigateView("booking")) },
        { label: "🎁 Box & recompenses", onClick: () => goTo("box") },
        { label: "❓ Questions frequentes", onClick: () => goTo("faq") },
        { label: "📞 Contacter", onClick: () => goTo("contact") },
      ];
    }

    return (
      <>
        {!assistantOpen && (
          <button
            aria-label="Assistant"
            className="bb-button-brand fixed bottom-20 right-4 z-[58] grid h-14 w-14 place-items-center rounded-full p-0 shadow-[0_12px_30px_rgba(0,0,0,0.45)] md:bottom-6"
            onClick={() => setAssistantOpen(true)}
            type="button"
          >
            <MessageCircle className="h-6 w-6" />
          </button>
        )}
        {assistantOpen && (
          <div
            className="fixed bottom-20 right-4 z-[58] flex w-[min(92vw,360px)] flex-col overflow-hidden rounded-[24px] border border-white/12 shadow-[0_24px_70px_rgba(0,0,0,0.6)] md:bottom-6"
            style={{ backgroundColor: "#16120c" }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent/15 text-accentSoft">
                  <Sparkles className="h-4 w-4" />
                </span>
                <p className="text-sm font-semibold text-white">Assistant Bryan Cars</p>
              </div>
              <button
                className="bb-button-ghost h-8 w-8 rounded-full px-0"
                onClick={() => setAssistantOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              <div className="whitespace-pre-line rounded-[16px] rounded-tl-sm border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-white/85">
                {botText}
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {chips.map((chip, index) => (
                  <button
                    className={cn(
                      "rounded-full px-4 py-2 text-left text-sm font-semibold transition",
                      chip.brand
                        ? "bb-button-brand justify-start"
                        : "border border-white/12 bg-white/[0.04] text-white hover:bg-white/[0.08]",
                    )}
                    key={index}
                    onClick={chip.onClick}
                    type="button"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  function renderRecapTeaser() {
    const year = new Date().getFullYear();
    return (
      <button
        className="bb-rise bb-gold-frame bb-hover-lift group flex w-full items-center justify-between gap-4 overflow-hidden rounded-[26px] bg-[#16120c]/80 p-5 text-left"
        onClick={() => {
          void openRecap();
        }}
        type="button"
      >
        <div className="min-w-0">
          <p className="bb-eyebrow flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Mon annee {year}
          </p>
          <p className="mt-1 text-lg font-bold text-white">Decouvre ton année Bryan Cars</p>
          <p className="mt-0.5 text-sm text-white/60">Prestations, credits, BC&apos;Coins...</p>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-accent transition group-hover:translate-x-1" />
      </button>
    );
  }

  function dismissNotifBanner() {
    if (slug) {
      try {
        window.sessionStorage.setItem(`bb-notif-banner:${slug}`, "1");
      } catch {
        /* sessionStorage indisponible */
      }
    }
    setNotifBannerDismissed(true);
  }

  // Bandeau d'accueil: inciter a activer les notifications (sinon les clients
  // ratent les notifs de rendez-vous / validation de tarif).
  // Cas Apple: sur iPhone/iPad, le push web n'existe QUE si l'app est installee
  // sur l'ecran d'accueil -> on invite d'abord a installer.
  function renderNotifBanner() {
    if (notifBannerDismissed) return null;
    if (pushPermission === "granted") return null;

    const nav = window.navigator as Navigator & { standalone?: boolean };
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches || nav.standalone === true;
    const ua = nav.userAgent || "";
    const isIOS =
      /iphone|ipad|ipod/i.test(ua) ||
      (nav.platform === "MacIntel" && (nav.maxTouchPoints || 0) > 1);
    const pushSupported = clientPushSupported();

    // iPhone/iPad hors application installee: push indisponible -> installer d'abord.
    if (!pushSupported && isIOS && !isStandalone) {
      return (
        <div className="bb-rise flex items-start justify-between gap-3 rounded-[24px] border border-accent/30 bg-accent/[0.08] p-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-accent/40 bg-accent/15 text-accentSoft">
              <Bell className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Active les notifications (iPhone)</p>
              <p className="text-sm leading-6 text-white/65">
                Sur iPhone, installe d&apos;abord l&apos;app : bouton <span className="font-semibold text-white">Partager</span> puis
                <span className="font-semibold text-white"> « Sur l&apos;ecran d&apos;accueil »</span>. Rouvre ensuite l&apos;app pour activer les notifs.
              </p>
            </div>
          </div>
          <button
            className="bb-button-ghost h-9 w-9 shrink-0 rounded-full px-0"
            onClick={dismissNotifBanner}
            type="button"
            aria-label="Masquer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      );
    }

    if (!pushSupported) return null;

    return (
      <div className="bb-rise flex items-center justify-between gap-3 rounded-[24px] border border-accent/30 bg-accent/[0.08] p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-accent/40 bg-accent/15 text-accentSoft">
            <Bell className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Active les notifications</p>
            <p className="text-sm leading-6 text-white/65">
              Sois prevenu pour tes rendez-vous, la validation des tarifs et tes récompenses.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            className="bb-button-brand px-4 py-2"
            disabled={pushBusy}
            onClick={() => {
              void handleEnablePush();
            }}
            type="button"
          >
            {pushBusy ? "..." : "Activer"}
          </button>
          <button
            className="bb-button-ghost h-9 w-9 rounded-full px-0"
            onClick={dismissNotifBanner}
            type="button"
            aria-label="Masquer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Bandeau d'accueil: tarif a valider sur un RDV (ouvre directement la fiche).
  function renderPriceValidationBanner() {
    const appt = pricePendingAppointment;
    if (!appt) return null;
    const price = Number(appt.approvedCredits ?? appt.requestedCredits ?? 1);
    return (
      <button
        className="bb-rise group flex w-full items-center justify-between gap-4 rounded-[26px] border border-amber-300/40 bg-amber-300/[0.10] p-4 text-left transition duration-200 hover:bg-amber-300/[0.16] md:p-5"
        onClick={() => {
          void openAppointmentModal(appt);
        }}
        type="button"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-amber-300/40 bg-amber-300/15 text-amber-200">
            <CreditCard className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.16em] text-amber-200/80">Action requise</p>
            <p className="mt-1 text-base font-semibold text-white">
              Valider le tarif — RDV du{" "}
              {formatDateFR(appt.date, { day: "numeric", month: "long" })}
            </p>
            <p className="mt-0.5 text-sm text-white/65">
              Tarif propose : {price} credit{price > 1 ? "s" : ""}. Accepte ou recharge pour confirmer.
            </p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-amber-200 transition group-hover:translate-x-1" />
      </button>
    );
  }

  function renderProHomeView() {
    return (
      <section className="space-y-4">
        {renderPriceValidationBanner()}
        {renderNotifBanner()}
        {renderEventTeaser()}

        {/* HERO PRO — Blueprint (grille technique) */}
        <article className="bb-rise bb-gold-frame bb-pro-hero bb-surface-strong relative overflow-hidden p-5 md:p-7">
          <div className="bb-grid-motif pointer-events-none absolute inset-0" />
          <div className="bb-pro-orb bb-pro-orb-steel" />
          <div className="bb-pro-orb bb-pro-orb-cyan" />

          <div className="relative z-10 space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="bb-pill border-accent/30 bg-accent/10 text-accentSoft">
                  <Sparkles className="h-3.5 w-3.5" />
                  Acces pro
                </div>
                {activeVehicle && (
                  <div className="bb-pill border-white/10 bg-white/[0.04] text-white/65">
                    <CarFront className="h-3.5 w-3.5 text-accent" />
                    {vehicleTitle(activeVehicle)}
                  </div>
                )}
              </div>
              <h1 className="bb-title-xl mt-3">
                Bonjour <span className="bb-text-gold">{clientData.firstName || clientData.fullName || "client"}</span>,
              </h1>
              <p className="bb-subtitle mt-2">
                Compte pro : vos rendez-vous sont directs, sans consommation de credits.
              </p>
            </div>

            {/* Action principale — dominante et guidee */}
            <div>
              <button
                className="bb-button-brand bb-cta-pulse w-full justify-center py-4 text-base"
                onClick={() => navigateView("booking")}
                type="button"
              >
                <CalendarClock className="mr-2 h-5 w-5" />
                Prendre rendez-vous
              </button>
              <p className="mt-2 text-center text-xs text-white/45">
                Choisissez un jour et une demi-journee — c&apos;est tout.
              </p>
            </div>

            {/* Statut — 2 tuiles */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[22px] border border-accent/20 bg-black/25 p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">Prochain passage</p>
                <p className="mt-1.5 text-lg font-bold text-white">
                  {upcomingAppointment
                    ? formatDateFR(upcomingAppointment.date, { day: "numeric", month: "short" })
                    : "Aucun"}
                </p>
                <p className="mt-1 text-xs text-white/45">
                  {upcomingAppointment
                    ? `${slotLabel(upcomingAppointment.slot)} · ${formatTimeHHMM(upcomingAppointment.time)}`
                    : "Rien de prevu"}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/25 p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">Compte Pro</p>
                <p className="mt-1.5 text-lg font-bold text-white">Sans credits</p>
                <p className="mt-1 text-xs text-white/45">Rendez-vous directs</p>
              </div>
            </div>
          </div>
        </article>

        {/* Actions rapides — grille 2x2 */}
        <section className="bb-rise bb-rise-2 grid grid-cols-2 gap-3">
          {[
            { view: "shop" as const, title: "Forfaits partenaire", copy: "Generer un lien de paiement", icon: Sparkles },
            ...homeQuickCards.filter((card) => card.view !== "booking"),
          ].map((card) => {
            const Icon = card.icon;
            return (
              <button
                className="bb-hover-lift group rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-left transition duration-200 hover:border-accent/40 hover:bg-accent/[0.07] active:scale-[0.98]"
                key={card.view}
                onClick={() => navigateView(card.view)}
                type="button"
              >
                <span className="inline-flex rounded-xl border border-white/10 bg-white/[0.05] p-2.5 text-accent transition duration-200 group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold text-white">{card.title}</p>
                <p className="mt-1 text-xs leading-5 text-white/55">{card.copy}</p>
              </button>
            );
          })}
          <button
            className="bb-hover-lift group rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-left transition duration-200 hover:border-accent/40 hover:bg-accent/[0.07] active:scale-[0.98]"
            onClick={() => setContactModalOpen(true)}
            type="button"
          >
            <span className="inline-flex rounded-xl border border-white/10 bg-white/[0.05] p-2.5 text-accent transition duration-200 group-hover:scale-110">
              <Phone className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-semibold text-white">Besoin d&apos;aide ?</p>
            <p className="mt-1 text-xs leading-5 text-white/55">Contacter Bryan Cars</p>
          </button>
        </section>

        {/* Vehicule actif */}
        <div className="bb-rise bb-rise-3 bb-surface p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">Vehicule actif</p>
          <p className="mt-1.5 text-lg font-semibold text-white">
            {vehicleTitle(activeVehicle ?? { model: clientData.vehicleModel })}
          </p>
          <p className="mt-1 text-sm text-white/55">
            {activeVehicle ? vehicleSubtitle(activeVehicle) : "Aucun detail vehicule"}
          </p>
        </div>

        {renderSocialSection()}
      </section>
    );
  }

  function renderHomeView() {
    if (clientData.isFounder) {
      return (
        <section className="space-y-4">
          {renderPriceValidationBanner()}
          {renderNotifBanner()}
          {renderEventTeaser()}
          {renderLeaderboardTeaser()}

          {/* HERO — identite + statut + action principale dominante */}
          <article className="bb-rise bb-gold-frame bb-founder-hero bb-surface-strong relative overflow-hidden p-5 md:p-7">
            <div className="bb-founder-orb bb-founder-orb-gold" />
            <div className="bb-founder-orb bb-founder-orb-blue" />
            <div className="bb-founder-orb bb-founder-orb-ember" />

            <div className="relative z-10 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="bb-pill border-accent/30 bg-accent/10 text-accentSoft">
                      <Crown className="h-3.5 w-3.5" />
                      Acces fondateur
                    </div>
                    <div className="bb-pill border-white/10 bg-white/[0.04] text-white/70">
                      <span className="font-bold text-accent">{clientData.bcPoints}</span> BC&apos;Coins
                    </div>
                  </div>
                  <h1 className="bb-title-xl mt-3">
                    Bonjour <span className="bb-text-gold">{clientData.firstName || clientData.fullName || "fondateur"}</span>,
                  </h1>
                  <p className="bb-subtitle mt-2">
                    Bienvenue dans votre espace. Tout commence par un rendez-vous.
                  </p>
                </div>
                <img
                  alt=""
                  aria-hidden="true"
                  className="hidden h-16 w-16 shrink-0 rounded-2xl border border-accent/25 object-cover sm:block"
                  src={clientData.founderMediaUrl || "/bryan-cars-logo.png"}
                />
              </div>

              {/* Action principale — dominante et guidee */}
              <div>
                <button
                  className="bb-button-brand bb-cta-pulse w-full justify-center py-4 text-base"
                  onClick={() => navigateView("booking")}
                  type="button"
                >
                  <CalendarClock className="mr-2 h-5 w-5" />
                  Prendre rendez-vous
                </button>
                <p className="mt-2 text-center text-xs text-white/45">
                  Choisissez un jour et une demi-journee — c&apos;est tout.
                </p>
              </div>

              {/* Statut — 2 tuiles claires */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[22px] border border-accent/20 bg-black/25 p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">Lavages restants</p>
                  <p className="mt-1.5 text-2xl font-bold text-white">{clientData.formulaRemaining}</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent to-accentSoft"
                      style={{ width: `${Math.max(6, creditsRatio * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-black/25 p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">Prochain passage</p>
                  <p className="mt-1.5 text-lg font-bold text-white">
                    {upcomingAppointment
                      ? formatDateFR(upcomingAppointment.date, { day: "numeric", month: "short" })
                      : "Aucun"}
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    {upcomingAppointment
                      ? `${slotLabel(upcomingAppointment.slot)} · ${formatTimeHHMM(upcomingAppointment.time)}`
                      : "Rien de prevu"}
                  </p>
                </div>
              </div>
            </div>
          </article>

          {/* Actions rapides — grille 2x2 mobile, claire et tappable.
              "Prendre rendez-vous" est deja l'action principale ci-dessus. */}
          <section className="bb-rise bb-rise-2 grid grid-cols-2 gap-3">
            {quickCards
              .filter((card) => card.view !== "booking")
              .map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    className="bb-hover-lift group rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-left transition duration-200 hover:border-accent/40 hover:bg-accent/[0.07] active:scale-[0.98]"
                    key={card.view}
                    onClick={() => navigateView(card.view)}
                    type="button"
                  >
                    <span className="inline-flex rounded-xl border border-white/10 bg-white/[0.05] p-2.5 text-accent transition duration-200 group-hover:scale-110">
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-white">{card.title}</p>
                    <p className="mt-1 text-xs leading-5 text-white/55">{card.copy}</p>
                  </button>
                );
              })}
            <button
              className="bb-hover-lift group rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-left transition duration-200 hover:border-accent/40 hover:bg-accent/[0.07] active:scale-[0.98]"
              onClick={() => setContactModalOpen(true)}
              type="button"
            >
              <span className="inline-flex rounded-xl border border-white/10 bg-white/[0.05] p-2.5 text-accent transition duration-200 group-hover:scale-110">
                <Phone className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-semibold text-white">Besoin d&apos;aide ?</p>
              <p className="mt-1 text-xs leading-5 text-white/55">Contacter Bryan Cars</p>
            </button>
          </section>

          {/* Vehicule actif + showcase fondateur (non bloquant) */}
          <div className="bb-rise bb-rise-3 grid gap-3 md:grid-cols-2">
            <div className="bb-surface p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">Vehicule actif</p>
              <p className="mt-1.5 text-lg font-semibold text-white">
                {vehicleTitle(activeVehicle ?? { model: clientData.vehicleModel })}
              </p>
              <p className="mt-1 text-sm text-white/55">
                {activeVehicle ? vehicleSubtitle(activeVehicle) : "Aucun detail vehicule"}
              </p>
            </div>
            <div className="bb-founder-media relative overflow-hidden rounded-[22px] border border-accent/22 bg-black/35">
              <div className="bb-founder-shimmer" />
              <img
                alt="Univers fondateur Bryan Cars"
                className="h-32 w-full object-cover md:h-full"
                src={clientData.founderMediaUrl || "/bryan-cars-logo.png"}
              />
            </div>
          </div>

          {renderSocialSection()}
        </section>
      );
    }

    if (clientData.clientType === "pro") {
      return renderProHomeView();
    }

    return (
      <section className="space-y-4">
        {renderPriceValidationBanner()}
        {renderNotifBanner()}
        {renderEventTeaser()}

        {/* HERO BBX — identite + action principale (caractere Neon Violet) */}
        <article className="bb-rise bb-gold-frame bb-surface-strong relative overflow-hidden p-5 md:p-7">
          <div className="pointer-events-none absolute left-[-4rem] top-[-3rem] h-56 w-56 rounded-full bg-accent/14 blur-3xl" />
          <div
            className="pointer-events-none absolute right-[-4rem] top-8 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "rgb(var(--bb-accent2-rgb) / 0.16)" }}
          />

          <div className="relative z-10 space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="bb-pill border-accent/30 bg-accent/10 text-accentSoft">
                  <Sparkles className="h-3.5 w-3.5" />
                  Espace client
                </div>
                {activeVehicle && (
                  <div className="bb-pill border-white/10 bg-white/[0.04] text-white/65">
                    <CarFront className="h-3.5 w-3.5 text-accent" />
                    {vehicleTitle(activeVehicle)}
                  </div>
                )}
              </div>
              <h1 className="bb-title-xl mt-3">
                Bonjour <span className="bb-text-gold">{clientData.firstName || clientData.fullName || "client"}</span>,
              </h1>
              <p className="bb-subtitle mt-2">
                Bienvenue dans votre espace. Tout commence par un rendez-vous.
              </p>
            </div>

            {/* Action principale — dominante et guidee */}
            <div>
              <button
                className="bb-button-brand bb-cta-pulse w-full justify-center py-4 text-base"
                onClick={() => navigateView("booking")}
                type="button"
              >
                <CalendarClock className="mr-2 h-5 w-5" />
                Prendre rendez-vous
              </button>
              <p className="mt-2 text-center text-xs text-white/45">
                Choisissez un jour et une demi-journee — c&apos;est tout.
              </p>
            </div>

            {/* Statut — 2 tuiles claires */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[22px] border border-accent/20 bg-black/25 p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">Lavages restants</p>
                <p
                  className={cn(
                    "mt-1.5 text-2xl font-bold",
                    clientData.formulaRemaining > 0 ? "text-white" : "text-amber-300",
                  )}
                >
                  {clientData.formulaRemaining}
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-accentSoft"
                    style={{ width: `${Math.max(6, creditsRatio * 100)}%` }}
                  />
                </div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/25 p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">Prochain passage</p>
                <p className="mt-1.5 text-lg font-bold text-white">
                  {upcomingAppointment
                    ? formatDateFR(upcomingAppointment.date, { day: "numeric", month: "short" })
                    : "Aucun"}
                </p>
                <p className="mt-1 text-xs text-white/45">
                  {upcomingAppointment
                    ? `${slotLabel(upcomingAppointment.slot)} · ${formatTimeHHMM(upcomingAppointment.time)}`
                    : freeSlot
                      ? `Libre des le ${formatDateFR(freeSlot.date, { day: "numeric", month: "short" })}`
                      : "Rien de prevu"}
                </p>
              </div>
            </div>
          </div>
        </article>

        {/* Actions rapides — grille 2x2 mobile (booking est deja l'action principale) */}
        <section className="bb-rise bb-rise-2 grid grid-cols-2 gap-3">
          {homeQuickCards
            .filter((card) => card.view !== "booking")
            .map((card) => {
              const Icon = card.icon;
              return (
                <button
                  className="bb-hover-lift group rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-left transition duration-200 hover:border-accent/40 hover:bg-accent/[0.07] active:scale-[0.98]"
                  key={card.view}
                  onClick={() => navigateView(card.view)}
                  type="button"
                >
                  <span className="inline-flex rounded-xl border border-white/10 bg-white/[0.05] p-2.5 text-accent transition duration-200 group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-white">{card.title}</p>
                  <p className="mt-1 text-xs leading-5 text-white/55">{card.copy}</p>
                </button>
              );
            })}
          <button
            className="bb-hover-lift group rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-left transition duration-200 hover:border-accent/40 hover:bg-accent/[0.07] active:scale-[0.98]"
            onClick={openTopupFlow}
            type="button"
          >
            <span className="inline-flex rounded-xl border border-white/10 bg-white/[0.05] p-2.5 text-accent transition duration-200 group-hover:scale-110">
              <CreditCard className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-semibold text-white">Recharger</p>
            <p className="mt-1 text-xs leading-5 text-white/55">Ajouter des lavages</p>
          </button>
          <button
            className="bb-hover-lift group rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-left transition duration-200 hover:border-accent/40 hover:bg-accent/[0.07] active:scale-[0.98]"
            onClick={() => setContactModalOpen(true)}
            type="button"
          >
            <span className="inline-flex rounded-xl border border-white/10 bg-white/[0.05] p-2.5 text-accent transition duration-200 group-hover:scale-110">
              <Phone className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-semibold text-white">Besoin d&apos;aide ?</p>
            <p className="mt-1 text-xs leading-5 text-white/55">Contacter Bryan Cars</p>
          </button>
        </section>

        {/* Upsell fondateur — demote sous l'action */}
        <button
          className="bb-rise bb-rise-3 group flex w-full items-center justify-between gap-4 rounded-[24px] border border-accent/25 bg-[linear-gradient(180deg,rgb(var(--bb-accent-rgb)/0.10),rgba(255,255,255,0.02))] p-5 text-left transition duration-200 hover:border-accent/45"
          onClick={() => setFounderModalOpen(true)}
          type="button"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-accent/35 bg-accent/12 p-3 text-accentSoft">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold text-white">Devenir fondateur</p>
              <p className="mt-1 text-sm leading-6 text-white/62">
                Carte premium, BC&apos;Coins et avantages exclusifs.
              </p>
              {typeof data?.foundersRemaining === "number" && (
                <span className="mt-1.5 inline-block text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                  {data.foundersRemaining > 0
                    ? `${data.foundersRemaining} place${
                        data.foundersRemaining > 1 ? "s" : ""
                      } restante${data.foundersRemaining > 1 ? "s" : ""} sur ${data.founderCap ?? 50}`
                    : "Complet — plus de places"}
                </span>
              )}
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-accent transition group-hover:translate-x-1" />
        </button>

        {renderSocialSection()}
      </section>
    );
  }

  function renderBookingView() {
    return (
      <section className="space-y-4">
        <article className="bb-surface-strong p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <div className="bb-pill border-white/12 bg-white/[0.04] text-white">
              Agenda
            </div>
            {clientData.clientType !== "pro" && (
              <div className="bb-pill border-accent/30 bg-accent/10 text-white">
                {clientData.formulaRemaining} credit
                {Math.abs(clientData.formulaRemaining) > 1 ? "s" : ""}
              </div>
            )}
            {activeVehicle && (
              <div className="bb-pill border-white/12 bg-white/[0.04] text-white/75">
                <CarFront className="h-3.5 w-3.5 text-accent" />
                {vehicleTitle(activeVehicle)}
              </div>
            )}
          </div>
        </article>

        <article className="bb-surface p-5 md:p-6">
          <div>
            <p className="bb-eyebrow">Prendre rendez-vous</p>
            <h2 className="bb-display mt-2 text-2xl font-semibold text-white">Choisissez votre creneau</h2>
            <div className="mt-3 space-y-1.5 text-sm leading-6 text-white/65">
              <p>
                <span className="mr-1.5 font-bold text-accent">1.</span>
                Choisissez le jour (fleches ou calendrier).
              </p>
              <p>
                <span className="mr-1.5 font-bold text-accent">2.</span>
                Touchez une demi-journee <span className="font-semibold text-emerald-200">libre</span>.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { label: "Libre", status: "free" as const },
              { label: "Votre créneau", status: "mine" as const },
              { label: "Pris", status: "busy" as const },
              { label: "Passe", status: "done" as const },
            ].map((item) => (
              <div className={cn("bb-pill", dayStatusClasses(item.status))} key={item.label}>
                {item.label}
              </div>
            ))}
          </div>

          <div className="mt-5 md:hidden">
            {focusedDay ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <button
                    className="bb-button-ghost h-11 w-11 rounded-full px-0"
                    onClick={() => goFocusedDay(-1)}
                    type="button"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/42">
                      {weekdayShort(focusedDay.date)}
                    </p>
                    <h3 className="bb-display mt-2 text-2xl font-semibold text-white">
                      {formatDateFR(focusedDay.date, { day: "numeric", month: "long" })}
                    </h3>
                  </div>
                  <button
                    className="bb-button-ghost h-11 w-11 rounded-full px-0"
                    onClick={() => goFocusedDay(1)}
                    type="button"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="w-full rounded-[28px] border border-accent/45 bg-accent/10 p-4 shadow-[0_18px_48px_rgb(var(--bb-accent-rgb)/0.12)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                        {focusedDay.day}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "bb-pill px-2.5 py-1",
                        dayStatusClasses(dayOverviewStatus(focusedDay)),
                      )}
                    >
                      {slotNavigatorStatusLabel(dayOverviewStatus(focusedDay))}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2">
                    {SLOT_ORDER.map((slot) => (
                      <button
                        className={cn(
                          "w-full rounded-[18px] border px-3 py-3 text-left transition duration-200 hover:brightness-110",
                          dayStatusClasses(focusedDay.slots[slot].status),
                        )}
                        key={`${focusedDay.date}-${slot}`}
                        onClick={() => {
                          void openDayModal(focusedDay, slot);
                        }}
                        type="button"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                              {slotLabel(slot)}
                            </p>
                            <p className="mt-1 text-[11px] opacity-75">{slotWindowLabel(slot)}</p>
                          </div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                            {slotNavigatorStatusLabel(focusedDay.slots[slot].status)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-5 hidden md:block">
            <div className="grid grid-cols-7 gap-3">
              {weekDays.map((day, index) =>
                day ? (
                  <div
                    className={cn(
                      "rounded-[26px] border p-4 transition duration-200",
                      focusedDay?.date === day.date
                        ? "border-accent/45 bg-accent/10 shadow-[0_18px_48px_rgb(var(--bb-accent-rgb)/0.12)]"
                        : "border-white/10 bg-white/[0.03]",
                    )}
                    key={day.date}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                          {weekdayShort(day.date)}
                        </p>
                        <h3 className="bb-display mt-2 text-2xl font-semibold text-white">{day.day}</h3>
                        <p className="mt-1 text-xs text-white/45">
                          {formatDateFR(day.date, { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <div className={cn("bb-pill px-2.5 py-1", dayStatusClasses(dayOverviewStatus(day)))}>
                        {slotNavigatorStatusLabel(dayOverviewStatus(day))}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {SLOT_ORDER.map((slot) => (
                        <button
                          className={cn(
                            "w-full rounded-[18px] border px-3 py-3 text-left transition duration-200 hover:brightness-110",
                            dayStatusClasses(day.slots[slot].status),
                          )}
                          key={`${day.date}-${slot}`}
                          onClick={() => {
                            void openDayModal(day, slot);
                          }}
                          type="button"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                                {slotLabel(slot)}
                              </p>
                              <p className="mt-1 text-[11px] opacity-75">{slotWindowLabel(slot)}</p>
                            </div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                              {slotNavigatorStatusLabel(day.slots[slot].status)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    className="rounded-[26px] border border-dashed border-white/8 bg-black/10 p-4 text-sm text-white/28"
                    key={`empty-${index}`}
                  >
                    Hors mois
                  </div>
                ),
              )}
            </div>
          </div>
        </article>
      </section>
    );
  }

  function renderVehiclesView() {
    return (
      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="bb-surface p-6">
          <div className="bb-section-head">
            <div>
              <p className="bb-eyebrow">Véhicules</p>
              <h1 className="bb-display mt-2 text-2xl font-semibold text-white">Votre garage Bryan Cars</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62">
                Ajoutez, modifiez ou retrouvez un véhicule en quelques secondes.
              </p>
            </div>
            <button className="bb-button-brand" onClick={openVehicleCreate} type="button">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </button>
          </div>

          {vehicles.length > 1 && (
            <div className="relative mt-5">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                className="bb-input pl-11"
                onChange={(event) => setVehicleQuery(event.target.value)}
                placeholder="Rechercher par modèle"
                value={vehicleQuery}
              />
            </div>
          )}

          <div className="mt-5 grid gap-3">
            {(visibleVehicles.length > 0 ? visibleVehicles : vehicles).map((vehicle) => {
              const active = activeVehicle?.id === vehicle.id;
              return (
                <div
                  className={cn(
                    "rounded-[24px] border p-4 transition duration-200",
                    active
                      ? "border-accent/45 bg-accent/10 shadow-[0_18px_48px_rgb(var(--bb-accent-rgb)/0.1)]"
                      : "border-white/10 bg-white/[0.03]",
                  )}
                  key={vehicle.id}
                >
                  <button
                    className="w-full text-left"
                    onClick={() => setActiveVehicleId(vehicle.id)}
                    type="button"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold text-white">{vehicleTitle(vehicle)}</p>
                          {vehicle.isPrimary && (
                            <div className="bb-pill border-emerald-400/35 bg-emerald-300/10 text-emerald-100">
                              Principal
                            </div>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-white/58">{vehicleSubtitle(vehicle)}</p>
                      </div>
                      <div className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
                        {
                          sortedAppointments.filter((appointment) => appointment.vehicleId === vehicle.id).length
                        }{" "}
                        dossier(s)
                      </div>
                    </div>
                  </button>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {!vehicle.isPrimary && (
                      <button
                        className="bb-button-ghost px-4 py-2"
                        onClick={() => {
                          void makeVehiclePrimary(vehicle.id);
                        }}
                        type="button"
                      >
                        Principal
                      </button>
                    )}
                    <button
                      className="bb-button-ghost px-4 py-2"
                      onClick={() => openVehicleEdit(vehicle)}
                      type="button"
                    >
                      <PencilLine className="mr-2 h-4 w-4" />
                      Modifier
                    </button>
                    {vehicles.length > 1 && (
                      <button
                        className="bb-button-ghost px-4 py-2 text-rose-100"
                        disabled={deletingVehicleId === vehicle.id}
                        onClick={() => {
                          void deleteVehicle(vehicle.id);
                        }}
                        type="button"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {deletingVehicleId === vehicle.id ? "Suppression..." : "Supprimer"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {vehicles.length === 0 && (
              <div className="rounded-[24px] border border-dashed border-white/12 bg-black/15 p-5 text-sm leading-6 text-white/62">
                Aucun vehicule n&apos;est encore enregistre sur ce compte. Ajoutez-en un pour relier
                les rendez-vous au bon vehicule.
              </div>
            )}
          </div>
        </article>

        <article className="bb-surface p-6">
          <div className="bb-section-head">
            <div>
              <p className="bb-eyebrow">Véhicule actif</p>
              <h2 className="bb-display mt-2 text-2xl font-semibold text-white">
                {activeVehicle ? vehicleTitle(activeVehicle) : "Aucun véhicule sélectionné"}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62">
                Depuis cette fiche, vous retrouvez les prestations realisees sur le véhicule
                sélectionné.
              </p>
            </div>
            {activeVehicle && (
              <button
                className="bb-button-ghost"
                onClick={() => navigateView("booking")}
                type="button"
              >
                Prendre rendez-vous
              </button>
            )}
          </div>

          {activeVehicle ? (
            <div className="mt-6 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/40">Modèle</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {activeVehicle.model || "Non renseigne"}
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/40">Dossiers</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {activeVehicleAppointments.length} fiche{activeVehicleAppointments.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {activeVehicleAppointments.length === 0 ? (
                <AppointmentsEmpty copy="Aucune prestation n'est encore reliee a ce véhicule." />
              ) : (
                <div className="grid gap-3">
                  {activeVehicleAppointments.map((appointment) => renderAppointmentCard(appointment))}
                </div>
              )}
            </div>
          ) : (
            <AppointmentsEmpty copy="Selectionnez ou ajoutez d'abord un véhicule pour consulter ses dossiers." />
          )}
        </article>
      </section>
    );
  }

  async function copyForfaitLink(link: string, key: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
      }, 2000);
    } catch {
      // presse-papiers indisponible: le lien reste affiche pour copie manuelle
    }
  }

  async function handleGenerateForfaitLink(forfait: PartnerForfait) {
    if (forfaitBusyKey) return;
    setForfaitBusyKey(forfait.key);
    try {
      const response = await fetch(`/api/client/${encodeURIComponent(slug)}/forfaits/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forfaitKey: forfait.key }),
      });
      const json = await response.json();
      if (json.ok && json.link) {
        setGeneratedLinks((current) => ({ ...current, [forfait.key]: json.link as string }));
        setForfaitData((current) =>
          current
            ? { ...current, orders: [json.order as PartnerOrder, ...current.orders] }
            : current,
        );
        await copyForfaitLink(json.link as string, forfait.key);
        showToast("Lien de paiement genere et copie.");
      } else if (json.error === "sumup_not_ready") {
        showToast("Le paiement en ligne n'est pas encore configure.");
      } else {
        showToast("Impossible de generer le lien pour le moment.");
      }
    } catch {
      showToast("Erreur reseau pendant la generation du lien.");
    } finally {
      setForfaitBusyKey(null);
    }
  }

  function renderForfaitsView() {
    const forfaits = forfaitData?.forfaits ?? [];
    const orders = forfaitData?.orders ?? [];
    const paymentsReady = forfaitData ? forfaitData.paymentsReady : data?.paymentsReady ?? false;
    const paidCount = orders.filter((order) => order.status === "paid").length;

    return (
      <section className="space-y-4">
        <article className="bb-surface-strong bb-steel-frame relative overflow-hidden p-5 md:p-7">
          <div className="bb-pro-orb bb-pro-orb-steel" />
          <div className="relative z-10 space-y-3">
            <span className="bb-pill border-sky-400/30 bg-sky-400/10 text-sky-200">
              <Sparkles className="h-3.5 w-3.5" />
              Forfaits partenaire
            </span>
            <h2 className="bb-display text-2xl font-semibold text-white">
              Generez un lien de paiement pour vos clients
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-white/68">
              Choisissez un forfait, generez le lien de paiement et envoyez-le a votre client. Le
              suivi se met a jour automatiquement des que le client a payé.
            </p>
            {!paymentsReady && (
              <p className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-3 text-sm text-amber-100">
                Le paiement en ligne n'est pas encore configure cote Bryan Cars.
              </p>
            )}
          </div>
        </article>

        <div className="grid gap-3 md:grid-cols-2">
          {forfaits.map((forfait) => {
            const link = generatedLinks[forfait.key];
            const busy = forfaitBusyKey === forfait.key;
            return (
              <article className="bb-surface flex flex-col p-5" key={forfait.key}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{forfait.label}</h3>
                    <p className="mt-1 text-sm text-white/55">{forfait.tagline}</p>
                  </div>
                  <p className="bb-text-gold shrink-0 text-2xl font-semibold">
                    {formatMoneyCents(forfait.priceCents, forfait.currency)}
                  </p>
                </div>

                <ul className="mt-4 space-y-1.5">
                  {forfait.features.map((feature) => (
                    <li className="flex items-start gap-2 text-sm text-white/72" key={feature}>
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-5">
                  <button
                    className="bb-button-steel w-full justify-center disabled:opacity-60"
                    disabled={busy || !paymentsReady}
                    onClick={() => void handleGenerateForfaitLink(forfait)}
                    type="button"
                  >
                    {busy ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generation...
                      </>
                    ) : (
                      <>
                        <Link2 className="mr-2 h-4 w-4" />
                        Generer le lien de paiement
                      </>
                    )}
                  </button>

                  {link && (
                    <div className="mt-3 rounded-2xl border border-white/12 bg-black/30 p-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                        Lien a envoyer au client
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          className="min-w-0 flex-1 truncate rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/80 outline-none"
                          onFocus={(event) => event.currentTarget.select()}
                          readOnly
                          value={link}
                        />
                        <button
                          className="bb-button-ghost shrink-0 px-3 py-2"
                          onClick={() => void copyForfaitLink(link, forfait.key)}
                          type="button"
                        >
                          {copiedKey === forfait.key ? (
                            <>
                              <CheckCircle2 className="mr-1.5 h-4 w-4 text-[#43d79d]" />
                              Copie
                            </>
                          ) : (
                            <>
                              <Copy className="mr-1.5 h-4 w-4" />
                              Copier
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <article className="bb-surface p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="bb-eyebrow">Suivi des paiements</p>
              <h3 className="bb-display mt-1 text-xl font-semibold text-white">Forfaits regles</h3>
            </div>
            <span className="bb-pill border-white/12 bg-white/[0.04] text-white/70">
              {paidCount} paye{paidCount > 1 ? "s" : ""} / {orders.length} lien
              {orders.length > 1 ? "s" : ""}
            </span>
          </div>

          {orders.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/55">
              Aucun lien genere pour l'instant. Generez un lien ci-dessus pour demarrer le suivi.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {orders.map((order) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  key={order.id}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{order.forfaitLabel}</p>
                    <p className="mt-0.5 text-xs text-white/50">
                      {order.status === "paid"
                        ? `${order.customerName || "Client"} a paye le ${formatUnixDateTimeFR(
                            order.paidAt,
                          )}`
                        : `Lien genere le ${formatUnixDateTimeFR(order.createdAt)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white">
                      {formatMoneyCents(order.amountCents, order.currency)}
                    </span>
                    <span className={cn("bb-pill", forfaitStatusClasses(order.status))}>
                      {forfaitStatusLabel(order.status)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    );
  }

  function renderShopView() {
    return (
      <section className="grid gap-4 xl:grid-cols-[1.06fr_0.94fr]">
        <article className="bb-surface p-6">
          <div className="bb-section-head">
            <div>
              <p className="bb-eyebrow">{clientData.isFounder ? "BC'Coins" : "Credits"}</p>
              <h1 className="bb-display mt-2 text-2xl font-semibold text-white">
                {clientData.isFounder ? "Boutique fondateur" : "Recharger des crédits"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62">
                {clientData.isFounder
                  ? "Recharges Bryan Cars et BC'Coins sont regroupes ici pour garder un parcours simple et direct."
                  : "Achetez vos crédits Bryan Cars en quelques secondes pour réserver vos prochains passages."}
              </p>
            </div>
            <div className="bb-pill border-white/12 bg-white/[0.04] text-white/75">
              {paymentsReady ? "Paiement en ligne actif" : "Recharge externe"}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {/* Fondateur uniquement: packs de credits (remises). */}
            {clientData.isFounder &&
              paymentsReady &&
              topupOffers.length > 0 &&
              topupOffers.map((offer) => (
                <div
                  className="rounded-[24px] border border-accent/20 bg-[linear-gradient(180deg,rgb(var(--bb-accent-rgb)/0.10),rgba(255,255,255,0.03))] p-4"
                  key={offer.key}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">{offer.label}</p>
                      <p className="mt-2 text-sm text-white/58">
                        {offer.description ||
                          `${offer.credits} credit${offer.credits > 1 ? "s" : ""} detailing`}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <div className="bb-pill border-white/12 bg-white/[0.04] text-white/70">
                          {offer.credits} credit{offer.credits > 1 ? "s" : ""}
                        </div>
                        {offer.durationDays && (
                          <div className="bb-pill border-white/12 bg-white/[0.04] text-white/70">
                            {offer.durationDays} jours
                          </div>
                        )}
                        <div className="bb-pill border-white/12 bg-white/[0.04] text-white/70">
                          Ajout de crédits
                        </div>
                      </div>
                    </div>
                    <button
                      className="bb-button-brand px-4 py-2"
                      disabled={busyTopupKey === offer.key}
                      onClick={() => {
                        void startTopupCheckout(offer);
                      }}
                      type="button"
                    >
                      {busyTopupKey === offer.key
                        ? "Ouverture..."
                        : formatMoneyCents(offer.priceCents, offer.currency)}
                    </button>
                  </div>
                </div>
              ))}

            {/* Non-fondateur: achat de credits a l'unite (bbx, data, pro). */}
            {!clientData.isFounder && paymentsReady && topupOffers[0] && (
              <div className="rounded-[24px] border border-accent/20 bg-[linear-gradient(180deg,rgb(var(--bb-accent-rgb)/0.10),rgba(255,255,255,0.03))] p-4">
                <p className="text-lg font-semibold text-white">Achat de credits a l&apos;unite</p>
                <p className="mt-2 text-sm leading-6 text-white/58">
                  Choisissez le nombre de crédits a acheter au tarif unitaire.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {[1, 2, 3, 5, 10].map((quantity) => {
                    const key = `${topupOffers[0].key}-x${quantity}`;
                    return (
                      <button
                        className="bb-button-ghost justify-center px-3 py-2"
                        disabled={busyTopupKey === key}
                        key={quantity}
                        onClick={() => {
                          void startTopupCheckout(topupOffers[0], quantity);
                        }}
                        type="button"
                      >
                        {quantity} credit{quantity > 1 ? "s" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Repli si le paiement en ligne n'est pas encore configure. */}
            {!paymentsReady && (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-lg font-semibold text-white">Recharge a finaliser</p>
                <p className="mt-2 text-sm leading-6 text-white/58">
                  Le paiement en ligne n&apos;est pas encore disponible. Contactez Bryan Cars pour
                  recharger vos credits.
                </p>
                <div className="mt-4">
                  <button className="bb-button-ghost" onClick={openTopupFlow} type="button">
                    Voir la recharge
                  </button>
                </div>
              </div>
            )}

            {!clientData.isFounder && paymentsReady && topupOffers[0] && (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-lg font-semibold text-white">Completer un devis personnalise</p>
                <p className="mt-2 text-sm leading-6 text-white/58">
                  Si l'admin validé un tarif special, indiquez exactement le nombre de crédits a acheter.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    className="bb-input"
                    min={1}
                    onChange={(event) => setCustomTopupQuantity(event.target.value)}
                    placeholder="Nombre de crédits"
                    type="number"
                    value={customTopupQuantity}
                  />
                  <button
                    className="bb-button-brand justify-center"
                    disabled={
                      busyTopupKey === `${topupOffers[0].key}-x${Number(customTopupQuantity || 1)}` ||
                      Number(customTopupQuantity || 0) <= 0
                    }
                    onClick={() => {
                      void startTopupCheckout(topupOffers[0], Number(customTopupQuantity || 1));
                    }}
                    type="button"
                  >
                    Acheter
                  </button>
                </div>
              </div>
            )}

            {clientData.isFounder && (
            <div className="mt-8 border-t border-white/10 pt-6">
              <div className="bb-section-head">
                <div>
                  <p className="bb-eyebrow">BC&apos;Coins</p>
                  <h2 className="bb-display mt-2 text-2xl font-semibold text-white">Boutique fidélité</h2>
                </div>
                <div className="bb-pill border-white/12 bg-white/[0.04] text-white/75">
                  <Gift className="h-3.5 w-3.5 text-accent" />
                  {clientData.bcPoints} points
                </div>
              </div>

              <div className="mt-4 flex items-start gap-3 rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                <div className="mt-0.5 shrink-0">
                  <Gift className="h-4 w-4 text-white/40" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    BC en attente :{" "}
                    <span className="text-accent">{clientData.bcPending} BC</span>
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/48">
                    Debloques au fur et a mesure de vos passages.
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.16em] text-white/40">Cases a ouvrir</p>
                {pendingCases.length === 0 ? (
                  <p className="mt-3 text-sm leading-6 text-white/48">
                    Aucune case a ouvrir. Achetez des crédits pour en gagner.
                  </p>
                ) : (
                  <div className="mt-3 grid gap-3">
                    {pendingCases.map((pc) => (
                      <div
                        className="flex items-center justify-between gap-3 rounded-[20px] border border-accent/20 bg-[linear-gradient(180deg,rgb(var(--bb-accent-rgb)/0.08),rgba(255,255,255,0.02))] p-4"
                        key={pc.id}
                      >
                        <div className="flex items-center gap-3">
                          <div className="shrink-0 rounded-xl border border-accent/50 bg-accent/18 p-2 text-accentSoft">
                            <Gift className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">
                              Case &middot; {pc.credits} credit{pc.credits > 1 ? "s" : ""}
                            </p>
                            <p className="mt-0.5 text-xs text-white/48">A ouvrir</p>
                          </div>
                        </div>
                        <button
                          className="bb-button-brand px-4 py-2"
                          disabled={caseSpinning}
                          onClick={() => {
                            setOpeningCase(pc);
                            void openCase(pc);
                          }}
                          type="button"
                        >
                          Ouvrir
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
            {rewardCatalog.map((reward) => {
              const affordable = clientData.bcPoints >= reward.pointsCost;
              return (
                <div
                  className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"
                  key={reward.key}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">{reward.label}</p>
                      <p className="mt-2 text-sm text-white/58">{reward.pointsCost} BC&apos;Coins</p>
                    </div>
                    <button
                      className={affordable ? "bb-button-brand px-4 py-2" : "bb-button-ghost px-4 py-2"}
                      disabled={!affordable || redeemingRewardKey === reward.key}
                      onClick={() => {
                        void redeemReward(reward);
                      }}
                      type="button"
                    >
                      {redeemingRewardKey === reward.key
                        ? "Envoi..."
                        : affordable
                          ? "Utiliser"
                          : "Plus tard"}
                    </button>
                  </div>
                </div>
              );
            })}
              </div>
            </div>
            )}
          </div>
        </article>

        <article className="bb-surface p-6">
          <div className="bb-section-head">
            <div>
              <p className="bb-eyebrow">Historique boutique</p>
              <h2 className="bb-display mt-2 text-2xl font-semibold text-white">Dernières demandes</h2>
            </div>
            <button className="bb-button-ghost" onClick={() => setContactModalOpen(true)} type="button">
              Besoin d&apos;aide
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {rewardRedemptions.length === 0 ? (
              <AppointmentsEmpty copy="Aucune demande BC'Coins pour le moment." />
            ) : (
              rewardRedemptions.map((redemption) => (
                <div
                  className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"
                  key={redemption.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-white">{redemption.rewardLabel}</p>
                      <p className="mt-2 text-sm text-white/58">
                        {formatUnixDateTimeFR(redemption.createdAt)}
                      </p>
                    </div>
                    <div className="bb-pill border-white/12 bg-white/[0.04] text-white/70">
                      {rewardStatusLabel(redemption.status)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    );
  }

  function renderHistoryView() {
    return (
      <section className="space-y-4">
        {renderRecapTeaser()}
        <article className="bb-surface-strong p-6 md:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="bb-eyebrow">Historique et suivi</p>
              <h1 className="bb-display mt-2 text-3xl font-semibold text-white">
                Vos fiches et les retours visibles
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/62">
                Retrouvez ici vos rendez-vous a venir, vos archives, puis les photos et avis
                partages par les autres clients.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                className={cn(
                  "bb-button-ghost px-4 py-2",
                  historyTab === "mine" && "border-accent/35 bg-accent/10 text-white",
                )}
                onClick={() => setHistoryTab("mine")}
                type="button"
              >
                Mes rendez-vous
              </button>
              <button
                className={cn(
                  "bb-button-ghost px-4 py-2",
                  historyTab === "community" && "border-accent/35 bg-accent/10 text-white",
                )}
                onClick={() => setHistoryTab("community")}
                type="button"
              >
                Retours clients
              </button>
            </div>
          </div>
        </article>

        {historyTab === "mine" ? (
          <article className="bb-surface p-6">
            <div className="bb-section-head">
              <div>
                <p className="bb-eyebrow">Mes rendez-vous</p>
                <h2 className="bb-display mt-2 text-2xl font-semibold text-white">
                  Suivi de vos prestations
                </h2>
              </div>
              <div className="bb-pill border-white/12 bg-white/[0.04] text-white/75">
                {filteredHistoryAppointments.length} fiche
                {filteredHistoryAppointments.length > 1 ? "s" : ""}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {(
                [
                  { key: "all", label: "Tous" },
                  { key: "requested", label: "En attente" },
                  { key: "confirmed", label: "Confirmes" },
                  { key: "done", label: "Effectues" },
                ] as const
              ).map((filter) => (
                <button
                  className={cn(
                    "bb-button-ghost px-4 py-2",
                    historyFilter === filter.key &&
                      "border-accent/40 bg-accent/10 text-white",
                  )}
                  key={filter.key}
                  onClick={() => setHistoryFilter(filter.key)}
                  type="button"
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-3">
              {appointmentsLoading ? (
                <div className="bb-surface flex items-center gap-3 px-5 py-4 text-sm text-white/70">
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  Chargement des rendez-vous...
                </div>
              ) : filteredHistoryAppointments.length === 0 ? (
                <AppointmentsEmpty copy="Aucun rendez-vous pour ce filtre." />
              ) : (
                filteredHistoryAppointments.map((appointment) =>
                  renderAppointmentCard(appointment),
                )
              )}
            </div>
          </article>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
            <article className="bb-surface p-6">
              <div className="bb-section-head">
                <div>
                  <p className="bb-eyebrow">Avis clients</p>
                  <h2 className="bb-display mt-2 text-2xl font-semibold text-white">Avis partages</h2>
                </div>
                <div className="bb-pill border-white/12 bg-white/[0.04] text-white/75">
                  {communityReviews.length} avis
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {communityLoading ? (
                  <div className="bb-surface flex items-center gap-3 px-5 py-4 text-sm text-white/70">
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                    Chargement des avis clients...
                  </div>
                ) : communityReviews.length === 0 ? (
                  <AppointmentsEmpty copy="Des qu'une prestation terminee contient une note ou un avis client, elle apparait ici." />
                ) : (
                  communityReviews.map((item) => (
                    <article
                      className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5"
                      key={item.id}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="bb-pill border-white/12 bg-white/[0.04] text-white/65">
                          {slotLabel(item.slot)}
                        </div>
                        <div
                          className={cn(
                            "bb-pill border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                            locationClasses(item.location),
                          )}
                        >
                          {locationLabel(item.location)}
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <h3 className="text-xl font-semibold text-white">
                          {item.vehicleModel || "Véhicule détaillé"}
                        </h3>
                        <p className="text-sm text-white/55">
                          {formatDateFR(item.date)} · {slotWindowLabel(item.slot)} · {formatTimeHHMM(item.time)}
                        </p>
                      </div>

                      {item.userRating ? (
                        <div className="mt-4 flex items-center gap-3">
                          <RatingStars rating={item.userRating} />
                          <span className="text-sm font-semibold text-white">{item.userRating}/5</span>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/55">
                          Prestation partagee sans note etoilee
                        </div>
                      )}

                      {item.userReview && item.userReview.trim() !== "" && (
                        <p className="mt-4 text-sm leading-6 text-white/68">
                          &laquo; {item.userReview} &raquo;
                        </p>
                      )}
                    </article>
                  ))
                )}
              </div>
            </article>

            <article className="bb-surface p-6">
              <div className="bb-section-head">
                <div>
                  <p className="bb-eyebrow">Google reviews</p>
                  <h2 className="bb-display mt-2 text-2xl font-semibold text-white">Donner une note publique</h2>
                </div>
                <a
                  className="bb-button-brand"
                  href={GOOGLE_REVIEWS_URL}
                  rel="noreferrer"
                  target="_blank"
                >
                  Noter Bryan Cars
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </div>

              <div className="mt-6 space-y-3">
                {GOOGLE_REVIEWS_FALLBACK.map((review) => (
                  <div
                    className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"
                    key={review.author}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{review.author}</p>
                      <div className="flex items-center gap-1 text-accent">
                        {Array.from({ length: review.rating }).map((_, index) => (
                          <Star className="h-4 w-4 fill-current" key={index} />
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-white/62">{review.copy}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        )}

        {invoices.length > 0 && (
          <article className="bb-surface p-6">
            <div className="bb-section-head">
              <div>
                <p className="bb-eyebrow">Factures</p>
                <h2 className="bb-display mt-2 text-2xl font-semibold text-white">Mes factures</h2>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              {invoices.map((inv) => (
                <Link
                  className="bb-hairline bb-hover-lift flex items-center justify-between gap-3 p-4"
                  key={inv.id}
                  to={`/card/${encodeURIComponent(slug)}/facture/${inv.id}`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{inv.label}</p>
                    <p className="text-xs text-white/45">
                      {inv.number}
                      {inv.paidAt
                        ? ` · ${new Date(inv.paidAt * 1000).toLocaleDateString("fr-FR")}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold text-accentSoft">
                      {(inv.amountCents / 100).toFixed(2).replace(".", ",")} €
                    </span>
                    <ArrowRight className="h-4 w-4 text-accent" />
                  </div>
                </Link>
              ))}
            </div>
          </article>
        )}
      </section>
    );
  }

  return (
    <div
      className="bb-shell pb-24 md:pb-16"
      data-theme={accountTheme ?? undefined}
    >
      <input
        accept="image/*"
        className="hidden"
        multiple
        onChange={handleBookingImageSelection}
        ref={bookingImageInputRef}
        type="file"
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-7rem] top-28 h-72 w-72 rounded-full bg-accent/12 blur-3xl" />
        <div className="absolute right-[-7rem] top-0 h-80 w-80 rounded-full bg-sky-400/12 blur-3xl" />
        <div className="absolute bottom-10 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#d99a4e]/10 blur-3xl" />
      </div>

      <main className="bb-content relative z-10 space-y-5 md:space-y-6">
        {renderHeader()}

        {requestedView === "home" && renderHomeView()}
        {requestedView === "booking" && renderBookingView()}
        {requestedView === "vehicles" && renderVehiclesView()}
        {requestedView === "shop" &&
          (clientData.clientType === "pro" ? renderForfaitsView() : renderShopView())}
        {requestedView === "history" && renderHistoryView()}
      </main>

      <nav className="fixed inset-x-0 bottom-3 z-30 px-3 md:hidden">
        <div className={cn("mx-auto grid max-w-xl rounded-[28px] border border-white/12 bg-[#14110d]/94 p-1.5 shadow-[0_24px_80px_rgba(0,0,0,0.46)] backdrop-blur-2xl", navItems.length === 4 ? "grid-cols-4" : "grid-cols-5")}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = requestedView === item.view;
            return (
              <Link
                className={cn(
                  "flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-[20px] px-1.5 py-2 text-[10px] font-semibold transition duration-200",
                  active
                    ? "bg-gradient-to-b from-accent/18 to-[#d99a4e]/12 text-white shadow-[0_10px_24px_rgb(var(--bb-accent-rgb)/0.12)]"
                    : "text-white/54",
                )}
                key={item.view}
                to={portalHref(item.view)}
              >
                <Icon className={cn("h-4 w-4", active && "text-accent")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {selectedDay && currentDaySlot && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/75 px-3 pb-3 pt-8 backdrop-blur-md md:items-center bb-backdrop-in"
          onClick={closeDayModal}
        >
          <div
            className="bb-surface-strong max-h-[calc(100vh-1rem)] w-full max-w-lg overflow-y-auto p-6 overscroll-contain bb-modal-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="bb-eyebrow">
                  {selectedMode === "book"
                    ? "Reservation"
                    : selectedMode === "manage"
                      ? "Gestion du rendez-vous"
                      : "Archive"}
                </p>
                <h3 className="bb-display mt-3 text-2xl font-semibold text-white">
                  {formatDateFR(selectedDay.date)}
                </h3>
                <p className="mt-2 text-sm text-white/60">
                  {selectedMode === "book" &&
                    "Choisissez votre demi-journee, l'heure et le véhicule pour envoyer la demande."}
                  {selectedMode === "manage" &&
                    "Votre demande existe déjà sur ce jour. Vous pouvez l'ajuster ou l'annuler."}
                  {selectedMode === "past" &&
                    "Ce jour n'est plus réservable depuis l'agenda. Ouvrez la fiche si elle existe déjà."}
                </p>
              </div>

              <button
                className="bb-button-ghost h-11 w-11 rounded-full px-0"
                onClick={closeDayModal}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {SLOT_ORDER.map((slot) => {
                  const slotInfo = selectedDay.slots[slot];
                  const slotAppointment =
                    appointments.find(
                      (appointment) =>
                        appointment.date === selectedDay.date &&
                        appointment.slot === slot &&
                        appointment.status !== "cancelled",
                    ) ?? null;

                  return (
                    <button
                      className={cn(
                        "rounded-[24px] border p-4 text-left transition duration-200",
                        dayStatusClasses(slotInfo.status),
                        selectedSlot === slot && "shadow-[0_0_0_1px_rgb(var(--bb-accent-rgb)/0.45)]",
                      )}
                      key={slot}
                      onClick={() => selectDaySlot(slot)}
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                            {slotLabel(slot)}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-white">
                            {slotWindowLabel(slot)}
                          </p>
                        </div>
                        <div className="bb-pill border-white/12 bg-black/20 text-white/70">
                          {slotInfo.status === "free" && "Libre"}
                          {slotInfo.status === "mine" && "A vous"}
                          {slotInfo.status === "busy" && "Pris"}
                          {slotInfo.status === "done" && "Passe"}
                        </div>
                      </div>

                      <p className="mt-3 text-sm text-white/60">
                        {slotAppointment
                          ? `${formatTimeHHMM(slotAppointment.time)} · ${locationLabel(
                              slotAppointment.location,
                            )}`
                          : slotInfo.status === "free"
                            ? "Cette demi-journee est réservable."
                            : slotInfo.status === "busy"
                              ? "Une autre réservation existe déjà sur cette demi-journee."
                              : "Créneau consulte a titre d'historique."}
                      </p>
                    </button>
                  );
                })}
              </div>

              {currentDaySlot?.status === "busy" &&
                (() => {
                  const alreadyWaiting = (data?.waitlist ?? []).some(
                    (w) => w.date === selectedDay.date && w.slot === selectedSlot,
                  );
                  return (
                    <div className="rounded-[24px] border border-accent/25 bg-accent/[0.06] p-4">
                      <p className="text-sm font-semibold text-white">Ce créneau est déjà pris</p>
                      <p className="mt-1 text-sm leading-6 text-white/65">
                        Rejoins la liste d&apos;attente : si ce creneau se libere, tu seras prevenu
                        (e-mail + notification). Premier arrive, premier servi.
                      </p>
                      {alreadyWaiting ? (
                        <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-accentSoft">
                          <CheckCircle2 className="h-4 w-4" />
                          Tu es sur la liste d&apos;attente pour ce creneau.
                        </p>
                      ) : (
                        <button
                          className="bb-button-brand mt-3"
                          disabled={waitlistBusy}
                          onClick={() => {
                            void joinWaitlist(selectedDay.date, selectedSlot);
                          }}
                          type="button"
                        >
                          <Bell className="mr-2 h-4 w-4" />
                          {waitlistBusy ? "..." : "Rejoindre la liste d'attente"}
                        </button>
                      )}
                    </div>
                  );
                })()}

              {selectedMode === "book" && (
                <>
                  {!termsAccepted && (
                    <div className="rounded-[24px] border border-amber-300/25 bg-amber-300/10 p-4">
                      <p className="text-sm font-semibold text-white">Conditions a accepter</p>
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        Le reglement n&apos;est plus affiche en permanence. Il vous sera demande ici,
                        uniquement au moment de reserver.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          className="bb-button-brand justify-center"
                          onClick={() => openTermsModal()}
                          type="button"
                        >
                          Lire et accepter
                        </button>
                        <Link
                          className="bb-button-ghost justify-center"
                          to={`/card/${encodeURIComponent(slug)}/conditions?intent=terms`}
                        >
                          Ouvrir la page complete
                        </Link>
                      </div>
                    </div>
                  )}

                  {vehicles.length > 0 && (
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                        Véhicule concerne
                      </p>

                      {vehicles.length > 1 && (
                        <div className="relative mt-4">
                          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                          <input
                            className="bb-input pl-11"
                            onChange={(event) => setBookingVehicleQuery(event.target.value)}
                            placeholder="Rechercher par modèle"
                            value={bookingVehicleQuery}
                          />
                        </div>
                      )}

                      <div className="mt-4 grid gap-3">
                        {bookingVisibleVehicles.map((vehicle) => (
                          <button
                            className={cn(
                              "rounded-[20px] border px-4 py-4 text-left transition duration-200",
                              activeVehicleId === vehicle.id
                                ? "border-accent/45 bg-accent/10 text-white"
                                : "border-white/10 bg-black/20 text-white/65 hover:bg-white/[0.04]",
                            )}
                            key={vehicle.id}
                            onClick={() => setActiveVehicleId(vehicle.id)}
                            type="button"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-base font-semibold text-white">
                                {vehicleTitle(vehicle)}
                              </span>
                              {vehicle.isPrimary && (
                                <div className="bb-pill border-white/12 bg-white/[0.04] text-white/70">
                                  Principal
                                </div>
                              )}
                            </div>
                            <p className="mt-2 text-sm leading-6 text-white/60">
                              {vehicleSubtitle(vehicle)}
                            </p>
                          </button>
                        ))}
                      </div>

                      <button
                        className="bb-button-ghost mt-4 w-full justify-center"
                        onClick={openVehicleCreate}
                        type="button"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter un véhicule
                      </button>
                    </div>
                  )}

                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/40">Lieu souhaite</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        {
                          value: "atelier" as const,
                          label: "Au studio",
                          copy: "Deposez le véhicule au centre detailing.",
                        },
                        {
                          value: "domicile" as const,
                          label: "A domicile",
                          copy: "Intervention sur site si le planning le permet.",
                        },
                      ].map((option) => (
                        <button
                          className={cn(
                            "rounded-[22px] border px-4 py-4 text-left transition duration-200",
                            appointmentLocation === option.value
                              ? "border-accent/45 bg-accent/10 text-white"
                              : "border-white/10 bg-black/20 text-white/65 hover:bg-white/[0.04]",
                          )}
                          key={option.value}
                          onClick={() => setAppointmentLocation(option.value)}
                          type="button"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-base font-semibold text-white">{option.label}</span>
                            {appointmentLocation === option.value && (
                              <CheckCircle2 className="h-4 w-4 text-accent" />
                            )}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-white/60">{option.copy}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {clientData.clientType !== "pro" && (
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                        Etat estime du véhicule
                      </p>
                      <p className="mt-2 text-sm leading-6 text-white/60">
                        Cette estimation aide l&apos;admin a valider plus vite. Aucun credit n&apos;est
                        consomme tant que le tarif n&apos;est pas confirme.
                      </p>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        {SERVICE_LEVEL_OPTIONS.map((option) => (
                          <button
                            className={cn(
                              "rounded-[22px] border px-4 py-4 text-left transition duration-200",
                              serviceLevel === option.value
                                ? "border-accent/45 bg-accent/10 text-white"
                                : "border-white/10 bg-black/20 text-white/65 hover:bg-white/[0.04]",
                            )}
                            key={option.value}
                            onClick={() => setServiceLevel(option.value)}
                            type="button"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-base font-semibold text-white">{option.label}</span>
                              <span className="bb-pill border-white/12 bg-white/[0.04] text-white/75">
                                {option.credits} credit{option.credits > 1 ? "s" : ""}
                              </span>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-white/58">{option.copy}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4">
                    <ChoiceField
                      columnsClassName="grid-cols-4 sm:grid-cols-5"
                      label="Heure"
                      onChange={(value) => setSelectedTime(`${value}:${timeParts.minute}`)}
                      options={availableHours.map((hour) => ({
                        value: String(hour).padStart(2, "0"),
                        label: `${String(hour).padStart(2, "0")}h`,
                      }))}
                      value={timeParts.hour}
                    />
                    <ChoiceField
                      columnsClassName="grid-cols-2"
                      label="Minutes"
                      onChange={(value) => setSelectedTime(`${timeParts.hour}:${value}`)}
                      options={MINUTES.map((minute) => ({
                        value: minute,
                        label: minute,
                      }))}
                      value={timeParts.minute}
                    />
                  </div>

                  <div className="rounded-[24px] border border-accent/30 bg-[linear-gradient(180deg,rgb(var(--bb-accent-rgb)/0.09),rgba(255,255,255,0.02))] p-4">
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-accent/35 bg-accent/12 text-accent">
                        <MessageCircle className="h-5 w-5" />
                      </span>
                      <label className="block min-w-0 flex-1">
                        <span className="text-base font-semibold text-white">
                          Une demande particuliere ?
                        </span>
                        <p className="mt-1 text-sm leading-6 text-white/70">
                          Indiquez un accès (portail, etage, code...) ou demandez un
                          <span className="font-semibold text-accentSoft"> extra</span> : ceramique,
                          siege a nettoyer en priorite, traitement cuir, taches tenaces...
                        </p>
                        <textarea
                          className="bb-textarea mt-4"
                          maxLength={300}
                          onChange={(event) => setClientBookingNote(event.target.value)}
                          placeholder="Ex: ceramique sur le capot + siege bebe a nettoyer en priorite"
                          value={clientBookingNote}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-accent/30 bg-[linear-gradient(180deg,rgb(var(--bb-accent-rgb)/0.09),rgba(255,255,255,0.02))] p-4">
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-accent/35 bg-accent/12 text-accent">
                        <Camera className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-white">Ajoutez des photos</p>
                            <p className="mt-1 text-sm leading-6 text-white/70">
                              Montrez une tache, une rayure ou la zone a traiter — ça aide a chiffrer
                              juste (jusqu'a 4 photos).
                            </p>
                          </div>
                          <div className="bb-pill shrink-0 border-accent/25 bg-accent/12 text-accentSoft">
                            {bookingImageDrafts.length}/4
                          </div>
                        </div>
                      </div>
                    </div>

                    <input
                      accept="image/*"
                      className="hidden"
                      multiple
                      onChange={handleBookingImageSelection}
                      ref={bookingImageInputRef}
                      type="file"
                    />

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        className="bb-button-ghost"
                        onClick={() => bookingImageInputRef.current?.click()}
                        type="button"
                      >
                        <Plus className="h-4 w-4" />
                        Ajouter des photos
                      </button>
                      {bookingImageDrafts.length > 0 && (
                        <button
                          className="bb-button-ghost"
                          onClick={clearBookingImages}
                          type="button"
                        >
                          Tout retirer
                        </button>
                      )}
                    </div>

                    {bookingImageDrafts.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {bookingImageDrafts.map((draft) => (
                          <div
                            className="relative overflow-hidden rounded-[20px] border border-white/10 bg-black/30"
                            key={draft.id}
                          >
                            <img
                              alt={draft.file.name}
                              className="h-28 w-full object-cover"
                              src={draft.previewUrl}
                            />
                            <button
                              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white transition hover:bg-black/75"
                              onClick={() => removeBookingImage(draft.id)}
                              type="button"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      className="bb-button-brand justify-center"
                      disabled={busyAction || bookingLocked}
                      onClick={() => {
                        void submitBooking(selectedDay.date, selectedSlot, selectedTime);
                      }}
                      type="button"
                    >
                      {busyAction
                        ? "Envoi..."
                          : !termsAccepted
                            ? "Conditions requises"
                            : "Demander ce rendez-vous"}
                    </button>
                    <button
                      className="bb-button-ghost justify-center"
                      disabled={busyAction}
                      onClick={closeDayModal}
                      type="button"
                    >
                      Fermer
                    </button>
                  </div>
                </>
              )}

              {selectedMode === "manage" && currentDayAppointment && (
                <>
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/40">Lieu de prestation</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        { value: "atelier" as const, label: "Au studio" },
                        { value: "domicile" as const, label: "A domicile" },
                      ].map((option) => (
                        <button
                          className={cn(
                            "rounded-[20px] border px-4 py-3 text-sm font-semibold transition duration-200",
                            appointmentLocation === option.value
                              ? "border-accent/45 bg-accent/10 text-white"
                              : "border-white/10 bg-black/20 text-white/65 hover:bg-white/[0.04]",
                          )}
                          key={option.value}
                          onClick={() => setAppointmentLocation(option.value)}
                          type="button"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <ChoiceField
                      columnsClassName="grid-cols-4 sm:grid-cols-5"
                      label="Heure"
                      onChange={(value) => setSelectedTime(`${value}:${timeParts.minute}`)}
                      options={availableHours.map((hour) => ({
                        value: String(hour).padStart(2, "0"),
                        label: `${String(hour).padStart(2, "0")}h`,
                      }))}
                      value={timeParts.hour}
                    />
                    <ChoiceField
                      columnsClassName="grid-cols-2"
                      label="Minutes"
                      onChange={(value) => setSelectedTime(`${timeParts.hour}:${value}`)}
                      options={MINUTES.map((minute) => ({
                        value: minute,
                        label: minute,
                      }))}
                      value={timeParts.minute}
                    />
                  </div>

                  <div className="grid gap-3">
                    <button
                      className="bb-button-brand justify-center"
                      disabled={busyAction}
                      onClick={() => {
                        void updateTime(selectedDay.date, selectedSlot, selectedTime);
                      }}
                      type="button"
                    >
                      {busyAction ? "Mise a jour..." : "Modifier l'horaire"}
                    </button>
                    <button
                      className="bb-button-danger justify-center"
                      disabled={busyAction}
                      onClick={() => {
                        void cancel(selectedDay.date, selectedSlot);
                      }}
                      type="button"
                    >
                      Annuler ce rendez-vous
                    </button>
                    <button
                      className="bb-button-ghost justify-center"
                      disabled={busyAction}
                      onClick={closeDayModal}
                      type="button"
                    >
                      Fermer
                    </button>
                  </div>
                </>
              )}

              {selectedMode === "past" && (
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-sm leading-6 text-white/65">
                    {currentDayAppointment
                      ? "Ce passage fait déjà partie de votre historique. Ouvrez la fiche pour revoir le compte-rendu, les photos et votre évaluation client."
                      : currentDaySlot.status === "busy"
                        ? "Ce créneau est déjà réservé par un autre client sur cette demi-journee."
                        : currentDaySlot.status === "free"
                          ? "Cette demi-journee est déjà passee et ne peut plus être réservée."
                          : "Ce créneau est archive dans le planning."}
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {currentDayAppointment && (
                      <button
                        className="bb-button-brand justify-center"
                        onClick={() => {
                          closeDayModal();
                          void openAppointmentModal(currentDayAppointment);
                        }}
                        type="button"
                      >
                        Ouvrir la fiche
                      </button>
                    )}
                    <button
                      className="bb-button-ghost justify-center"
                      onClick={closeDayModal}
                      type="button"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedAppointment && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 px-3 pb-3 pt-8 backdrop-blur-md md:items-center bb-backdrop-in"
          onClick={closeAppointmentModal}
        >
          <div
            className="bb-surface-strong max-h-[calc(100vh-1rem)] w-full max-w-4xl overflow-y-auto p-6 overscroll-contain md:p-7 bb-modal-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className={cn("bb-pill", appointmentStatusClasses(selectedAppointment.status))}>
                    {appointmentStatusLabel(selectedAppointment.status)}
                  </div>
                  <div
                    className={cn(
                      "bb-pill border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                      locationClasses(selectedAppointment.location),
                    )}
                  >
                    {locationLabel(selectedAppointment.location)}
                  </div>
                  <div className="bb-pill border-white/12 bg-white/[0.04] text-white/65">
                    {slotLabel(selectedAppointment.slot)}
                  </div>
                </div>

                <h3 className="bb-display mt-4 text-3xl font-semibold text-white">
                  {formatDateFR(selectedAppointment.date)}
                </h3>
                <p className="mt-2 text-sm text-white/60">
                  {slotWindowLabel(selectedAppointment.slot)} · {formatTimeHHMM(
                    selectedAppointment.time,
                  )} -{" "}
                  {selectedAppointment.vehicleModel || clientData.vehicleModel || "Vehicule"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start">
                {(selectedAppointment.status === "requested" ||
                  selectedAppointment.status === "confirmed") && (
                  <>
                    <button
                      className="bb-button-ghost"
                      onClick={() => downloadIcs(appointmentCalendarEvent(selectedAppointment))}
                      type="button"
                    >
                      <CalendarPlus className="mr-2 h-4 w-4" />
                      Ajouter a mon agenda
                    </button>
                    <a
                      className="bb-button-ghost"
                      href={googleCalendarUrl(appointmentCalendarEvent(selectedAppointment))}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Google
                    </a>
                    <button
                      className="bb-button-danger"
                      disabled={busyAction}
                      onClick={() => {
                        void cancel(selectedAppointment.date, selectedAppointment.slot);
                        closeAppointmentModal();
                      }}
                      type="button"
                    >
                      Annuler le RDV
                    </button>
                  </>
                )}
                <button className="bb-button-ghost" onClick={closeAppointmentModal} type="button">
                  Fermer
                </button>
              </div>
            </div>

            {clientData.clientType !== "pro" && (
              <div className="mt-6 rounded-[26px] border border-accent/25 bg-accent/10 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-accentSoft">
                      Validation tarif
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {selectedAppointment.priceStatus === "waiting_photos"
                        ? "L'admin demande des photos"
                        : selectedAppointment.priceStatus === "waiting_client_approval"
                          ? "Tarif a accepter"
                          : selectedAppointment.priceStatus === "waiting_payment"
                            ? "Recharge nécessaire"
                            : selectedAppointment.priceStatus === "approved"
                              ? "Crédits consommés"
                              : "Analyse admin en cours"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/68">
                      Estimation: {selectedAppointment.requestedCredits || 1} credit
                      {(selectedAppointment.requestedCredits || 1) > 1 ? "s" : ""}
                      {selectedAppointment.approvedCredits != null
                        ? ` · Tarif admin: ${selectedAppointment.approvedCredits} credit${
                            selectedAppointment.approvedCredits > 1 ? "s" : ""
                          }`
                        : ""}
                      {selectedAppointment.photosRequestMessage
                        ? ` · ${selectedAppointment.photosRequestMessage}`
                        : ""}
                    </p>
                    {selectedAppointment.priceComment && (
                      <div className="mt-3 rounded-[18px] border border-white/12 bg-black/25 p-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-accentSoft">
                          Note de l&apos;admin
                        </p>
                        <p className="mt-1 text-sm leading-6 text-white/72">
                          {selectedAppointment.priceComment}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[320px]">
                    {(selectedAppointment.priceStatus === "waiting_client_approval" ||
                      selectedAppointment.priceStatus === "waiting_payment") && (() => {
                        const approvedNeeded =
                          selectedAppointment.approvedCredits ??
                          selectedAppointment.requestedCredits ??
                          1;
                        const lacksCredits =
                          (clientData.formulaRemaining ?? 0) < approvedNeeded;
                        return lacksCredits ? (
                          <>
                            <button
                              className="bb-button-brand justify-center"
                              onClick={() =>
                                startCreditPurchaseForAppointment(selectedAppointment)
                              }
                              type="button"
                            >
                              Recharger {creditsNeededForAppointment(selectedAppointment)} credit(s)
                            </button>
                            <button
                              className="bb-button-ghost justify-center"
                              disabled={busyAction}
                              onClick={() => {
                                void acceptSelectedAppointmentPrice();
                              }}
                              type="button"
                            >
                              Accepter le tarif
                            </button>
                          </>
                        ) : (
                          <button
                            className="bb-button-brand justify-center"
                            disabled={busyAction}
                            onClick={() => {
                              void acceptSelectedAppointmentPrice();
                            }}
                            type="button"
                          >
                            Accepter le tarif
                          </button>
                        );
                      })()}
                    {selectedAppointment.priceStatus === "waiting_photos" && (
                      <>
                        <button
                          className="bb-button-ghost justify-center"
                          onClick={() => bookingImageInputRef.current?.click()}
                          type="button"
                        >
                          Ajouter photos
                        </button>
                        <button
                          className="bb-button-brand justify-center"
                          disabled={busyAction || bookingImageDrafts.length === 0}
                          onClick={() => {
                            void uploadSelectedAppointmentPhotos();
                          }}
                          type="button"
                        >
                          Envoyer
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {selectedAppointment.priceStatus === "waiting_photos" && bookingImageDrafts.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {bookingImageDrafts.map((draft) => (
                      <div className="overflow-hidden rounded-[18px] border border-white/10 bg-black/30" key={draft.id}>
                        <img alt={draft.file.name} className="h-24 w-full object-cover" src={draft.previewUrl} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <section className="space-y-4">
                <article className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-accent">
                      <Clock3 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Commentaire de Bryan Cars</p>
                      <p
                        className={cn(
                          "mt-1 text-sm",
                          selectedAppointment.adminNote ? "leading-6 text-white/80" : "text-white/55",
                        )}
                      >
                        {selectedAppointment.adminNote
                          ? selectedAppointment.adminNote
                          : "Aucun commentaire laisse par le centre pour cette prestation."}
                      </p>
                    </div>
                  </div>
                </article>

                <article className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-sky-200">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Lieu de prestation</p>
                      <p className="mt-1 text-sm text-white/55">
                        {locationLabel(selectedAppointment.location)}
                      </p>
                    </div>
                  </div>
                </article>
              </section>

              <section className="space-y-4">
                {(appointmentPhotosLoading || appointmentPhotos.length > 0) && (
                <article className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Photos du véhicule</p>
                      <p className="mt-1 text-sm text-white/55">
                        Cliquez sur une image pour l'ouvrir en grand.
                      </p>
                    </div>
                    {appointmentPhotosLoading && (
                      <Loader2 className="h-4 w-4 animate-spin text-accent" />
                    )}
                  </div>

                  {(() => {
                    const openAll = (url: string) =>
                      openLightbox(
                        appointmentPhotos.map((entry) => ({
                          id: entry.id,
                          url: entry.url,
                          label: entry.label,
                        })),
                        url,
                      );
                    const tile = (photo: AppointmentPhoto) => (
                      <button
                        className="overflow-hidden rounded-[22px] border border-white/10 bg-black/30"
                        key={photo.id}
                        onClick={() => openAll(photo.url)}
                        type="button"
                      >
                        <img
                          alt={photo.label || "Photo rendez-vous"}
                          className="h-28 w-full object-cover transition duration-300 hover:scale-[1.04]"
                          src={photo.url}
                        />
                      </button>
                    );
                    const before = appointmentPhotos.filter((p) => p.category === "before");
                    const after = appointmentPhotos.filter((p) => p.category === "after");
                    const others = appointmentPhotos.filter(
                      (p) => p.category !== "before" && p.category !== "after",
                    );
                    const tagged = before.length > 0 || after.length > 0;
                    if (!tagged) {
                      return (
                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                          {appointmentPhotos.map(tile)}
                        </div>
                      );
                    }
                    const group = (label: string, list: AppointmentPhoto[]) =>
                      list.length === 0 ? null : (
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-accentSoft">
                            {label}
                          </p>
                          <div className="grid gap-3 sm:grid-cols-3">{list.map(tile)}</div>
                        </div>
                      );
                    return (
                      <div className="mt-5 space-y-4">
                        {group("Avant", before)}
                        {group("Apres", after)}
                        {group("Autres", others)}
                      </div>
                    );
                  })()}
                </article>
                )}

                {selectedAppointment.status === "done" && (
                <article
                  className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5"
                  ref={reviewSectionRef}
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-accent">
                      <Star className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Votre avis</p>
                      <p className="mt-1 text-sm text-white/55">
                        {canReviewSelected
                          ? "Notez la prestation et laissez un commentaire si vous le souhaitez."
                          : "L'avis est disponible une fois la prestation terminee."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const value = index + 1;
                      const active = reviewRating >= value;
                      return (
                        <button
                          className={cn(
                            "rounded-full p-1.5 transition duration-200",
                            canReviewSelected ? "hover:scale-110" : "cursor-default",
                          )}
                          disabled={!canReviewSelected}
                          key={value}
                          onClick={() => setReviewRating(value)}
                          type="button"
                        >
                          <Star
                            className={cn(
                              "h-5 w-5",
                              active ? "fill-accent text-accent" : "text-white/20",
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <textarea
                    className="bb-textarea mt-4"
                    disabled={!canReviewSelected}
                    onChange={(event) => setReviewText(event.target.value)}
                    placeholder="Votre ressenti sur l'accueil, la finition, le resultat..."
                    value={reviewText}
                  />

                  <div className="mt-4 flex flex-wrap gap-3">
                    {canReviewSelected ? (
                      <button
                        className="bb-button-brand"
                        disabled={savingReview}
                        onClick={() => {
                          void saveReview();
                        }}
                        type="button"
                      >
                        {savingReview ? "Enregistrement..." : "Enregistrer mon avis"}
                      </button>
                    ) : (
                      <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/55">
                        Avis en lecture seule
                      </div>
                    )}

                    {selectedAppointment.userRating && !canReviewSelected && (
                      <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/65">
                        Note actuelle: {selectedAppointment.userRating}/5
                      </div>
                    )}
                  </div>
                </article>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      {vehicleModalOpen && (
        <div
          className="fixed inset-0 z-[54] flex items-end justify-center bg-black/80 px-3 pb-3 pt-8 backdrop-blur-md md:items-center bb-backdrop-in"
          onClick={closeVehicleModal}
        >
          <div
            className="bb-surface-strong max-h-[calc(100vh-1rem)] w-full max-w-2xl overflow-y-auto p-6 overscroll-contain md:p-7 bb-modal-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="bb-eyebrow">
                  {vehicleModalMode === "create" ? "Nouveau véhicule" : "Modifier véhicule"}
                </p>
                <h3 className="bb-display mt-3 text-2xl font-semibold text-white">
                  {vehicleModalMode === "create"
                    ? "Ajouter un véhicule a votre compte"
                    : "Mettre a jour ce véhicule"}
                </h3>
              </div>
              <button
                className="bb-button-ghost"
                disabled={savingVehicle}
                onClick={closeVehicleModal}
                type="button"
              >
                Fermer
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">Nom affiche</span>
                <input
                  className="bb-input"
                  onChange={(event) =>
                    setVehicleDraft((current) => ({ ...current, label: event.target.value }))
                  }
                  placeholder="Ex: BMW familiale / Véhicule societaire"
                  value={vehicleDraft.label}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">Modèle</span>
                <input
                  className="bb-input"
                  onChange={(event) =>
                    setVehicleDraft((current) => ({ ...current, model: event.target.value }))
                  }
                  placeholder="Ex: BMW M3"
                  value={vehicleDraft.model}
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="bb-button-brand"
                disabled={savingVehicle}
                onClick={() => {
                  void saveVehicle();
                }}
                type="button"
              >
                {savingVehicle ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                className="bb-button-ghost"
                disabled={savingVehicle}
                onClick={closeVehicleModal}
                type="button"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {termsModalOpen && (
        <div
          className="fixed inset-0 z-[55] flex items-end justify-center bg-black/80 px-3 pb-3 pt-8 backdrop-blur-md md:items-center bb-backdrop-in"
          onClick={closeTermsModal}
        >
          <div
            className="bb-surface-strong max-h-[calc(100vh-1rem)] w-full max-w-4xl overflow-y-auto p-6 overscroll-contain md:p-7 bb-modal-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <div
                  className={cn(
                    "bb-pill",
                    termsAccepted
                      ? "border-emerald-400/35 bg-emerald-300/10 text-emerald-100"
                      : "border-amber-400/35 bg-amber-300/10 text-amber-100",
                  )}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {termsAccepted ? "Conditions acceptees" : "Acceptation requise"}
                </div>
                <h3 className="bb-display mt-4 text-3xl font-semibold text-white">Conditions & règlement</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
                  Version du {TERMS_UPDATED_LABEL}. Le reglement n'est plus bloque sur la page
                  d'accueil: il apparait ici uniquement quand c'est utile.
                </p>
              </div>

              <button
                className="bb-button-ghost self-start"
                disabled={termsSubmitting}
                onClick={closeTermsModal}
                type="button"
              >
                Fermer
              </button>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <section className="space-y-4">
                <div
                  className={cn(
                    "rounded-[24px] border p-4",
                    termsAccepted
                      ? "border-emerald-300/25 bg-emerald-300/10"
                      : "border-amber-300/25 bg-amber-300/10",
                    termsPanelAttention &&
                      !termsAccepted &&
                      "bb-attention-ring bb-attention-nudge border-accent/60 bg-accent/12",
                  )}
                >
                  <p className="text-sm font-semibold text-white">
                    {termsAccepted
                      ? `Acceptation enregistree le ${formatUnixDateTimeFR(clientData.termsAcceptedAt)}`
                      : "Avant de poursuivre, vous devez accepter le règlement."}
                  </p>
                </div>

                {TERMS_HIGHLIGHTS.map((item) => (
                  <article
                    className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-white/68"
                    key={item}
                  >
                    {item}
                  </article>
                ))}
              </section>

              <section className="space-y-4">
                {TERMS_SECTIONS.slice(0, 3).map((section) => (
                  <article
                    className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5"
                    key={section.title}
                  >
                    <h4 className="text-base font-semibold text-white">{section.title}</h4>
                    <div className="mt-3 space-y-3 text-sm leading-6 text-white/65">
                      {section.body.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  </article>
                ))}
              </section>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="bb-button-ghost justify-center"
                to={`/card/${encodeURIComponent(slug)}/conditions?intent=terms`}
              >
                Lire la version complete
              </Link>

              {!termsAccepted && (
                <>
                  <label
                    className={cn(
                      "flex min-w-[280px] flex-1 items-start gap-3 rounded-[22px] border border-white/10 bg-black/20 p-4 text-sm text-white/72 transition duration-200",
                      termsCheckboxAttention &&
                        "bb-attention-ring bb-attention-nudge border-accent/55 bg-accent/10 text-white",
                    )}
                  >
                    <input
                      checked={termsChecked}
                      className="mt-1 h-4 w-4 rounded border-white/20 bg-black/30 text-accent accent-[rgb(var(--bb-accent-rgb))]"
                      onChange={(event) => setTermsChecked(event.target.checked)}
                      type="checkbox"
                    />
                    <span>{TERMS_ACCEPTANCE_LABEL}</span>
                  </label>

                  <button
                    className="bb-button-brand justify-center"
                    disabled={termsSubmitting}
                    onClick={() => {
                      void acceptTermsAndContinue();
                    }}
                    type="button"
                  >
                    {termsSubmitting ? "Validation..." : "Accepter et continuer"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {contactModalOpen && (
        <div
          className="fixed inset-0 z-[56] flex items-end justify-center bg-black/80 px-3 pb-3 pt-8 backdrop-blur-md md:items-center bb-backdrop-in"
          onClick={() => setContactModalOpen(false)}
        >
          <div
            className="bb-surface-strong max-h-[calc(100vh-1rem)] w-full max-w-xl overflow-y-auto p-6 overscroll-contain md:p-7 bb-modal-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="bb-eyebrow">Contact</p>
                <h3 className="bb-display mt-3 text-2xl font-semibold text-white">Joindre Bryan Cars rapidement</h3>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  Le contact et les accès utiles sont regroupes ici pour ne plus surcharger la carte client.
                </p>
              </div>
              <button
                className="bb-button-ghost h-11 w-11 rounded-full px-0"
                onClick={() => setContactModalOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-3">
              <a className="bb-button-brand justify-center" href={PHONE_URL}>
                <Phone className="mr-2 h-4 w-4" />
                Appeler Bryan Cars
              </a>
              <a className="bb-button-ghost justify-center" href={WHATSAPP_URL} rel="noreferrer" target="_blank">
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp direct
              </a>
              <a
                className="bb-button-ghost justify-center"
                href={GOOGLE_REVIEWS_URL}
                rel="noreferrer"
                target="_blank"
              >
                <Star className="mr-2 h-4 w-4" />
                Laisser un avis Google
              </a>
              <Link
                className="bb-button-ghost justify-center"
                to={`/card/${encodeURIComponent(slug)}/conditions`}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Voir le règlement
              </Link>
            </div>
          </div>
        </div>
      )}

      {leaderboardOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/85 px-3 pb-3 pt-8 backdrop-blur-md md:items-center bb-backdrop-in"
          onClick={() => setLeaderboardOpen(false)}
        >
          <div
            className="bb-surface-strong bb-gold-frame bb-modal-panel w-full max-w-md overflow-y-auto p-6 md:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="bb-eyebrow flex items-center gap-1.5">
                  <Crown className="h-3.5 w-3.5" />
                  Classement
                </p>
                <h3 className="bb-display mt-2 text-2xl font-semibold text-white">
                  Classement BC&apos;Coins
                </h3>
              </div>
              <button
                className="bb-button-ghost h-10 w-10 rounded-full px-0"
                onClick={() => setLeaderboardOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mt-4 flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3">
              <span className="text-sm leading-6 text-white/75">
                Apparaitre dans le classement (prenom + initiale)
              </span>
              <input
                checked={!!leaderboardData?.optIn}
                className="h-5 w-5 shrink-0 rounded border-white/20 bg-black/30 accent-[#e8c98a]"
                disabled={leaderboardOptBusy}
                onChange={(event) => {
                  void toggleLeaderboardOptIn(event.target.checked);
                }}
                type="checkbox"
              />
            </label>

            {leaderboardLoading ? (
              <div className="mt-5 flex items-center gap-3 text-sm text-white/70">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                Chargement...
              </div>
            ) : leaderboardData && leaderboardData.entries.length > 0 ? (
              <div className="mt-5 space-y-1.5">
                {leaderboardData.entries.map((entry) => (
                  <div
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-[14px] border px-4 py-2.5",
                      entry.isYou
                        ? "border-accent/40 bg-accent/10"
                        : "border-white/8 bg-white/[0.03]",
                    )}
                    key={entry.rank}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="w-6 text-center text-sm font-bold text-accentSoft">
                        {entry.rank}
                      </span>
                      <span className="truncate text-sm font-semibold text-white">
                        {entry.name}
                        {entry.isYou ? " (toi)" : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-accentSoft">
                      {entry.bc} BC
                    </span>
                  </div>
                ))}
                {leaderboardData.optIn && leaderboardData.yourRank && (
                  <p className="mt-3 text-center text-sm text-white/60">
                    Ta position : {leaderboardData.yourRank}e · {leaderboardData.yourBc} BC
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-5 text-sm leading-6 text-white/70">
                {leaderboardData && !leaderboardData.optIn
                  ? "Active l'option ci-dessus pour rejoindre le classement."
                  : "Aucun fondateur dans le classement pour le moment."}
              </p>
            )}
          </div>
        </div>
      )}

      {recapOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/85 px-3 pb-3 pt-8 backdrop-blur-md md:items-center bb-backdrop-in"
          onClick={() => setRecapOpen(false)}
        >
          <div
            className="bb-surface-strong bb-gold-frame bb-modal-panel w-full max-w-lg overflow-y-auto p-6 md:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="bb-eyebrow flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Mon annee {recapData?.year ?? new Date().getFullYear()}
                </p>
                <h3 className="bb-display mt-2 text-2xl font-semibold text-white">
                  Ton année Bryan Cars
                </h3>
              </div>
              <button
                className="bb-button-ghost h-10 w-10 rounded-full px-0"
                onClick={() => setRecapOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {recapLoading ? (
              <div className="mt-6 flex items-center gap-3 text-sm text-white/70">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                Calcul de ton année...
              </div>
            ) : recapData && recapData.visits > 0 ? (
              <>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {[
                    { label: "Prestations", value: recapData.visits },
                    { label: "Crédits utilises", value: recapData.creditsUsed },
                    { label: "BC'Coins gagnes", value: recapData.bcEarned },
                    { label: "Véhicules choyes", value: recapData.vehicles },
                    { label: "Avis laisses", value: recapData.reviews },
                    { label: "Photos", value: recapData.photos },
                  ].map((stat) => (
                    <div
                      className="rounded-[20px] border border-accent/20 bg-accent/[0.06] p-4 text-center"
                      key={stat.label}
                    >
                      <p className="text-3xl font-extrabold tabular-nums text-accentSoft">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/50">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-center text-sm leading-6 text-white/65">
                  Merci pour ta confiance. On garde ta voiture impeccable !
                </p>
              </>
            ) : (
              <p className="mt-6 text-sm leading-6 text-white/70">
                Pas encore de prestation cette année. Réservé ton premier detailing et reviens
                admirer ton récap !
              </p>
            )}
          </div>
        </div>
      )}

      {notifPromptOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 px-3 pb-3 pt-8 backdrop-blur-md md:items-center bb-backdrop-in"
          onClick={dismissNotifPrompt}
        >
          <div
            className="bb-surface-strong w-full max-w-md overflow-y-auto p-6 overscroll-contain md:p-7 bb-modal-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-accent/50 bg-accent/18 text-accentSoft">
              <Bell className="h-6 w-6" />
            </div>
            <h3 className="bb-display mt-4 text-2xl font-semibold text-white">
              Active les notifications
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Sois prevenu en temps reel : confirmation de rendez-vous, prestation terminee, avis a
              laisser et événements. Tu peux les désactiver a tout moment.
            </p>
            <div className="mt-6 grid gap-3">
              <button
                className="bb-button-brand justify-center"
                disabled={pushBusy}
                onClick={() => {
                  void (async () => {
                    await handleEnablePush();
                    dismissNotifPrompt();
                  })();
                }}
                type="button"
              >
                <Bell className="mr-2 h-4 w-4" />
                {pushBusy ? "Activation..." : "Activer les notifications"}
              </button>
              <button className="bb-button-ghost justify-center" onClick={dismissNotifPrompt} type="button">
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}

      {founderModalOpen && (
        <div
          className="fixed inset-0 z-[56] flex items-end justify-center bg-black/80 px-3 pb-3 pt-8 backdrop-blur-md md:items-center bb-backdrop-in"
          onClick={() => setFounderModalOpen(false)}
        >
          <div
            className="bb-surface-strong max-h-[calc(100vh-1rem)] w-full max-w-xl overflow-y-auto p-6 overscroll-contain md:p-7 bb-modal-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="bb-eyebrow">Programme fondateur</p>
                <h3 className="bb-display mt-3 text-2xl font-semibold text-white">
                  Devenir fondateur Bryan Cars
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  Le statut fondateur debloque une carte premium et des avantages réservés.
                  Accès a vie pour <span className="font-semibold text-accentSoft">29,99 €</span>.
                  <span className="mt-1 block text-xs uppercase tracking-[0.14em] text-accent">
                    {typeof data?.foundersRemaining === "number"
                      ? data.foundersRemaining > 0
                        ? `Plus que ${data.foundersRemaining} place${
                            data.foundersRemaining > 1 ? "s" : ""
                          } sur ${data.founderCap ?? 50}`
                        : "Complet — plus de places disponibles"
                      : `Places limitees a ${data?.founderCap ?? 50} fondateurs`}
                  </span>
                </p>
              </div>
              <button
                className="bb-button-ghost h-11 w-11 rounded-full px-0"
                onClick={() => setFounderModalOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-3">
              {FOUNDER_PERKS.map((perk) => {
                const PerkIcon = perk.icon;
                return (
                  <div
                    className="flex items-start gap-3 rounded-[20px] border border-white/10 bg-white/[0.03] p-4"
                    key={perk.title}
                  >
                    <div className="shrink-0 rounded-xl border border-accent/50 bg-accent/18 p-2 text-accentSoft">
                      <PerkIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{perk.title}</p>
                      <p className="mt-1 text-sm leading-6 text-white/62">{perk.copy}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6">
              <button
                className="bb-button-brand w-full justify-center"
                disabled={founderCheckoutBusy || data?.foundersRemaining === 0}
                onClick={() => {
                  void startFounderCheckout();
                }}
                type="button"
              >
                <Crown className="mr-2 h-4 w-4" />
                {data?.foundersRemaining === 0
                  ? "Complet - plus de places"
                  : founderCheckoutBusy
                    ? "Ouverture du paiement..."
                    : "Devenir fondateur - 29,99 €"}
              </button>
              <p className="mt-3 text-center text-xs leading-5 text-white/45">
                Paiement securise SumUp. Le statut est active des la confirmation du paiement.
              </p>
            </div>
          </div>
        </div>
      )}

      {openingCase && (
        <CaseOpeningModal
          caseItem={openingCase}
          onClose={() => {
            setOpeningCase(null);
            setCaseResult(null);
            setCaseSpinning(false);
          }}
          onSpinEnd={() => setCaseSpinning(false)}
          reelRef={caseReelRef}
          result={caseResult}
        />
      )}

      {reviewBoxOpen && reviewBoxResult && (
        <CaseOpeningModal
          caseItem={{
            id: -2,
            credits: 1,
            status: "pending",
            rewardTier: null,
            rewardBc: null,
            createdAt: 0,
            openedAt: null,
          }}
          eyebrow="Avis Google"
          onClose={() => {
            setReviewBoxOpen(false);
            setReviewBoxResult(null);
          }}
          onSpinEnd={() => undefined}
          reelRef={reviewReelRef}
          result={reviewBoxResult}
          rewardUnit="goodie"
          deliveryNote={reviewBoxDeliveryNote}
          title="Box merci"
        />
      )}

      {renderEventModal()}

      {eventBoxOpen && eventBoxResult && (
        <CaseOpeningModal
          caseItem={{
            id: -3,
            credits: 1,
            status: "pending",
            rewardTier: null,
            rewardBc: null,
            createdAt: 0,
            openedAt: null,
          }}
          eyebrow="Participation"
          onClose={() => {
            setEventBoxOpen(false);
            setEventBoxResult(null);
          }}
          onSpinEnd={() => undefined}
          reelRef={eventReelRef}
          result={eventBoxResult}
          rewardUnit="goodie"
          deliveryNote={eventBoxDeliveryNote}
          title="Box de consolation"
        />
      )}

      <ImageLightbox
        currentUrl={lightboxUrl}
        images={lightboxImages}
        onChange={setLightboxUrl}
        onClose={() => setLightboxUrl(null)}
      />

      {renderAssistant()}

      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-[70] flex justify-center px-4 md:bottom-5">
          <div className="rounded-full border border-white/10 bg-black/80 px-4 py-3 text-sm text-white shadow-2xl backdrop-blur-md">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
