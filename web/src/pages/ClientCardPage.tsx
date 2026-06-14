import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CarFront,
  CheckCircle2,
  Clock3,
  Crown,
  ExternalLink,
  Gift,
  House,
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
  appointmentIsPast,
  appointmentStatusClasses,
  appointmentStatusLabel,
  canChangeDay,
  clampNumber,
  cn,
  defaultTimeForSlot,
  dayStatusClasses,
  formatDateFR,
  formatTimeHHMM,
  formatUnixDateFR,
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

const SUMUP_TOPUP_URL =
  import.meta.env.VITE_SUMUP_TOPUP_URL || "https://www.sumupbookings.com/bryan-cars";
const GOOGLE_REVIEWS_URL = "https://maps.app.goo.gl/SNXz7PaTRSWWMxLa8";
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

type ApiResponse = {
  ok: boolean;
  client: ApiClient;
  vehicles: ClientVehicle[];
  rewardCatalog: RewardCatalogItem[];
  rewardRedemptions: RewardRedemption[];
  topupOffers: TopupOffer[];
  paymentsReady: boolean;
  month: ApiMonth;
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
  hasPhotos: boolean;
  location: AppointmentLocation | null;
};

type ServiceLevel = "clean" | "correct" | "dirty";

const SERVICE_LEVEL_OPTIONS: Array<{
  value: ServiceLevel;
  label: string;
  credits: number;
  copy: string;
}> = [
  { value: "clean", label: "Propre", credits: 1, copy: "Entretien simple, vehicule deja suivi." },
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
      "La zone Google Reviews sert a prolonger l'experience apres prestation et a guider les nouveaux clients.",
  },
  {
    author: "Bryan Cars",
    rating: 5,
    copy:
      "Invitez vos clients a noter le resultat, l'accueil et la finition pour renforcer la preuve sociale de la marque.",
  },
];

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

function weekRangeLabel(days: Array<ApiDay | null>) {
  const first = days.find(Boolean);
  const last = [...days].reverse().find(Boolean);

  if (!first || !last) return "Semaine en cours";

  return `${formatDateFR(first.date, { day: "numeric", month: "short" })} - ${formatDateFR(
    last.date,
    { day: "numeric", month: "short" },
  )}`;
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
  const parts = [vehicle.model, vehicle.plate].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : "Aucun detail vehicule";
}

function vehicleSearchText(vehicle: ClientVehicle) {
  return [vehicle.label, vehicle.model, vehicle.plate].filter(Boolean).join(" ").toLowerCase();
}

function daysUntilExpiry(timestamp: number | null | undefined) {
  if (!timestamp) return null;

  const expiry = new Date(timestamp * 1000);
  if (Number.isNaN(expiry.getTime())) return null;

  const endOfDay = new Date(
    expiry.getFullYear(),
    expiry.getMonth(),
    expiry.getDate(),
    23,
    59,
    59,
    999,
  );
  const diffMs = endOfDay.getTime() - Date.now();
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

function creditsNeededToBook(remaining: number) {
  return remaining >= 1 ? 0 : 1 - remaining;
}

function creditAvailabilityCopy(remaining: number) {
  if (remaining > 1) {
    return `${remaining} passages disponibles.`;
  }

  if (remaining === 1) {
    return "1 passage disponible.";
  }

  if (remaining === 0) {
    return "Aucun credit disponible. Rechargez 1 credit pour reprendre les reservations.";
  }

  const needed = creditsNeededToBook(remaining);
  return `Solde negatif de ${Math.abs(remaining)} credit${
    Math.abs(remaining) > 1 ? "s" : ""
  }. Rechargez au moins ${needed} credit${needed > 1 ? "s" : ""} pour reprendre les reservations.`;
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

function formulaHasExpired(expiresAt: number | null | undefined) {
  if (!expiresAt) return false;

  const date = new Date(expiresAt * 1000);
  if (Number.isNaN(date.getTime())) return false;

  const endOfDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );

  return Date.now() > endOfDay.getTime();
}

function AppointmentsEmpty({ copy }: { copy: string }) {
  return (
    <div className="bb-surface flex flex-col items-start gap-3 p-6">
      <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-[#f7b955]">
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
                ? "border-[#f7b955]/45 bg-[#f7b955]/10 text-white shadow-[0_12px_28px_rgba(247,185,85,0.12)]"
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
              active ? "fill-[#f7b955] text-[#f7b955]" : "text-white/20",
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

  const [data, setData] = React.useState<ApiResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [appointments, setAppointments] = React.useState<ClientAppointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = React.useState(true);
  const [communityItems, setCommunityItems] = React.useState<PublicShowcaseItem[]>([]);
  const [communityLoading, setCommunityLoading] = React.useState(true);
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
  const [historyTab, setHistoryTab] = React.useState<HistoryTab>("mine");
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
  const bookingImagesRef = React.useRef<BookingImageDraft[]>([]);
  const bookingImageInputRef = React.useRef<HTMLInputElement | null>(null);
  const handledTopupRef = React.useRef<string | null>(null);
  const handledLaunchTopupRef = React.useRef<string | null>(null);
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

  React.useEffect(() => {
    let active = true;

    async function loadAppointments() {
      try {
        setAppointmentsLoading(true);

        const response = await fetch(`/api/client/${encodeURIComponent(slug)}/appointments`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const json = (await response.json()) as ListClientAppointmentsResponse;
        if (!json.ok) throw new Error("invalid_payload");
        if (!active) return;

        setAppointments(json.appointments ?? []);
      } catch (loadError) {
        if (active) {
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
          showToast("Paiement confirme. Vos credits viennent d'etre ajoutes.");
          setReloadToken((value) => value + 1);
        } else if (json.topupOrder?.status === "pending" || json.topupOrder?.status === "paid") {
          showToast("Paiement recu, confirmation encore en cours.");
        } else if (json.topupOrder?.status === "failed" || json.topupOrder?.status === "expired") {
          showToast("La recharge n'a pas ete finalisee.");
        }
      } catch (_error) {
        if (active) {
          showToast("Impossible de verifier la recharge pour le moment.");
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
  const month = data?.month ?? null;
  const monthDays = month?.days ?? [];
  const termsAccepted = !!client?.termsAcceptedAt;
  const formulaExpired = false;
  const formulaDaysRemaining = null;

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

  const sortedAppointments = React.useMemo(() => {
    const next = [...appointments];
    next.sort(
      (left, right) => appointmentDateTime(right).getTime() - appointmentDateTime(left).getTime(),
    );
    return next;
  }, [appointments]);

  const upcomingAppointments = React.useMemo(() => {
    const next = [...appointments].filter((appointment) => {
      if (appointment.status === "cancelled") return false;
      return appointmentDateTime(appointment).getTime() >= Date.now();
    });
    next.sort(
      (left, right) => appointmentDateTime(left).getTime() - appointmentDateTime(right).getTime(),
    );
    return next;
  }, [appointments]);

  const archivedAppointments = React.useMemo(
    () =>
      sortedAppointments.filter(
        (appointment) =>
          appointment.status === "cancelled" ||
          appointment.status === "done" ||
          appointmentIsPast(appointment),
      ),
    [sortedAppointments],
  );

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
        showToast("Impossible d'enregistrer ce vehicule.");
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
      showToast(creating ? "Vehicule ajoute." : "Vehicule mis a jour.");
      setReloadToken((value) => value + 1);
    } catch (saveError) {
      showToast("Erreur reseau pendant la sauvegarde du vehicule.");
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
        showToast("Impossible de supprimer ce vehicule.");
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
      showToast("Vehicule supprime.");
      setReloadToken((value) => value + 1);
    } catch (saveError) {
      showToast("Erreur reseau pendant la suppression du vehicule.");
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
        showToast("Impossible de changer le vehicule principal.");
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
      showToast("Vehicule principal mis a jour.");
    } catch (saveError) {
      showToast("Erreur reseau pendant la mise a jour du vehicule principal.");
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
        showToast("Impossible d'utiliser vos 🪙 BC'Coins pour le moment.");
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
      showToast("Erreur reseau pendant l'utilisation des 🪙 BC'Coins.");
    } finally {
      setRedeemingRewardKey(null);
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

  function redirectToTopupView(remainingCredits: number) {
    closeDayModal();
    navigateView("shop");
    showToast(creditAvailabilityCopy(remainingCredits));
  }

  async function submitBooking(
    date: string,
    slot: AppointmentSlot,
    time: string,
    skipTermsCheck = false,
  ) {
    if (!data) return;
    if (vehicles.length > 0 && !activeVehicleId) {
      showToast("Selectionnez d'abord le vehicule concerne.");
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
        showToast("Impossible de reserver ce creneau.");
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
      showToast("Erreur reseau pendant la reservation.");
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
      showToast("Le creneau est deja passe.");
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

      showToast("Rendez-vous annule.");
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
          showToast("Credits insuffisants. Rechargez puis validez le tarif.");
          navigateView("shop");
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
      showToast("Tarif valide. Le rendez-vous est confirme.");
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
      showToast("Merci, votre avis a bien ete enregistre.");
    } catch (saveError) {
      showToast("Erreur reseau pendant l'enregistrement.");
    } finally {
      setSavingReview(false);
    }
  }

  function goWeek(delta: number) {
    const base = focusedDay?.date ?? requestedDayParam ?? pickFocusedDay(monthDays);
    if (!base) return;
    const target = addDaysIso(base, delta * 7);
    navigate(portalHref("booking", { month: target.slice(0, 7), date: target }));
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
  const creditsExhausted = (client?.formulaRemaining ?? 0) <= 0;
  const creditsTopupNeed = creditsNeededToBook(client?.formulaRemaining ?? 0);
  const bookingLocked = !termsAccepted;

  if (loading) {
    return (
      <div className="bb-shell">
        <div className="bb-content flex min-h-[70vh] items-center justify-center">
          <div className="bb-surface flex items-center gap-3 px-6 py-4 text-sm text-white/70">
            <Loader2 className="h-4 w-4 animate-spin text-[#f7b955]" />
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
            <h1 className="mt-4 text-3xl font-semibold text-white">
              Impossible d&apos;ouvrir cet espace.
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/65">
              Verifiez le lien NFC ou retournez a l&apos;accueil pour relancer la navigation.
            </p>
            <Link className="bb-button-brand mt-6 inline-flex" to="/">
              Retour a l&apos;accueil
            </Link>
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
      title: "Mes vehicules",
      copy:
        vehicles.length <= 1
          ? vehicleTitle(activeVehicle ?? { model: clientData.vehicleModel })
          : `${vehicles.length} vehicules enregistres`,
      icon: CarFront,
    },
    {
      view: "shop" as const,
      title: "Boutique 🪙 BC'Coins",
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

  function renderHeader() {
    return (
      <>
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link
            className="bb-button-ghost px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/80"
            to="/"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <InstallAppButton
              appName="Bryan Cars"
              className="bb-button-ghost px-4 py-2"
              startUrl={`/card/${encodeURIComponent(slug)}`}
            />
            <button
              className="bb-button-ghost px-4 py-2"
              onClick={() => setContactModalOpen(true)}
              type="button"
            >
              <Phone className="mr-2 h-4 w-4" />
              Contact
            </button>
            <button className="bb-button-brand px-4 py-2" onClick={openTopupFlow} type="button">
              Recharger
              <ExternalLink className="ml-2 h-4 w-4" />
            </button>
          </div>
        </header>

        <nav className="hidden grid-cols-5 gap-2 rounded-[28px] border border-white/10 bg-white/[0.03] p-2 backdrop-blur-xl md:grid">
          {PORTAL_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = requestedView === item.view;
            return (
              <Link
                className={cn(
                  "flex items-center justify-center gap-2 rounded-[22px] px-4 py-3 text-sm font-semibold transition duration-200",
                  active
                    ? "bg-[#f7b955]/12 text-white shadow-[0_12px_28px_rgba(247,185,85,0.12)]"
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

  function renderMetricCard(title: string, value: string, copy: string, tone?: string) {
    return (
      <article
        className={cn(
          "bb-metric min-h-[150px]",
          tone === "warning" && "border-amber-300/25 bg-amber-300/10",
          tone === "danger" && "border-rose-300/25 bg-rose-300/10",
        )}
      >
        <p className="text-xs uppercase tracking-[0.16em] text-white/45">{title}</p>
        <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
        <p className="mt-3 text-sm leading-6 text-white/58">{copy}</p>
      </article>
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
                {appointment.vehiclePlate ? ` / ${appointment.vehiclePlate}` : ""}
              </p>
            </div>

            <p className="max-w-2xl text-sm leading-6 text-white/58">
              {previewNote(appointment.adminNote)}
            </p>
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

  function renderHomeView() {
    if (clientData.isFounder) {
      return (
        <section className="space-y-4">
          <article className="bb-founder-hero bb-surface-strong relative overflow-hidden p-5 md:p-7">
            <div className="bb-founder-orb bb-founder-orb-gold" />
            <div className="bb-founder-orb bb-founder-orb-blue" />
            <div className="bb-founder-orb bb-founder-orb-ember" />

            <div className="relative z-10 grid gap-5 xl:grid-cols-[1.04fr_0.96fr]">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="bb-pill border-[#f7b955]/30 bg-[#f7b955]/10 text-[#ffe8a8]">
                    <Crown className="h-3.5 w-3.5" />
                    Acces fondateur
                  </div>
                  <div className="bb-pill border-white/12 bg-white/[0.04] text-white/72">
                    {clientData.formulaName || "Formule detailing"}
                  </div>
                </div>

                <div className="max-w-3xl">
                  <p className="bb-eyebrow">Bryan Cars founder portal</p>
                  <h1 className="bb-title mt-3">
                    Bonjour {clientData.firstName || clientData.fullName || "fondateur"},
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68 md:text-base">
                    Votre espace fondateur rassemble la formule, les credits, l&apos;echeance
                    et l&apos;univers visuel Bryan Cars dans une seule carte signature.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[24px] border border-[#f7b955]/20 bg-black/22 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/38">Credits</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {clientData.formulaRemaining}
                      <span className="ml-2 text-base text-white/35">/ {clientData.formulaTotal}</span>
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-black/22 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/38">Jours restants</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {formulaDaysRemaining == null
                        ? "--"
                        : formulaDaysRemaining < 0
                          ? "Expiree"
                          : formulaDaysRemaining}
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-black/22 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/38">🪙 BC&apos;Coins</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{clientData.bcPoints}</p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-black/22 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/38">Prochain passage</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {upcomingAppointment
                        ? formatDateFR(upcomingAppointment.date, { day: "numeric", month: "short" })
                        : "Aucun"}
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-[#f7b955] via-[#ffd06b] to-[#ff7a18]"
                    style={{ width: `${creditsRatio * 100}%` }}
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    className="bb-button-brand"
                    onClick={() => navigateView("booking")}
                    type="button"
                  >
                    Ouvrir l&apos;agenda
                  </button>
                  <button
                    className="bb-button-ghost"
                    onClick={() => setContactModalOpen(true)}
                    type="button"
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Contact
                  </button>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="bb-founder-media relative overflow-hidden rounded-[30px] border border-[#f7b955]/22 bg-[radial-gradient(circle_at_top,rgba(247,185,85,0.18),transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-3">
                  <div className="bb-founder-shimmer" />
                  <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-black/35">
                    <img
                      alt="Univers fondateur Bryan Cars"
                      className="h-[260px] w-full object-cover md:h-[320px]"
                      src={clientData.founderMediaUrl || "/bryan-cars-logo.png"}
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/38">Vehicule actif</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {vehicleTitle(activeVehicle ?? { model: clientData.vehicleModel })}
                    </p>
                    <p className="mt-2 text-sm text-white/56">
                      {activeVehicle ? vehicleSubtitle(activeVehicle) : clientData.vehiclePlate || "Aucun detail"}
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/38">Statut formule</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formulaExpired ? "A renouveler" : "Active"}
                    </p>
                    <p className="mt-2 text-sm text-white/56">
                      {formulaExpired
                        ? "La formule doit etre rechargee."
                        : creditAvailabilityCopy(clientData.formulaRemaining)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {quickCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-left transition duration-200 hover:border-[#f7b955]/40 hover:bg-[#f7b955]/[0.08]"
                  key={card.view}
                  onClick={() => navigateView(card.view)}
                  type="button"
                >
                  <div className="mb-4 inline-flex rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-[#f7b955]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">{card.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/62">{card.copy}</p>
                </button>
              );
            })}
          </section>
        </section>
      );
    }

    return (
      <section className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
        <article className="bb-surface-strong relative overflow-hidden p-6 md:p-8">
          <div className="pointer-events-none absolute left-[-5rem] top-8 h-56 w-56 rounded-full bg-[#f7b955]/12 blur-3xl" />
          <div className="pointer-events-none absolute right-[-4rem] top-[-2rem] h-60 w-60 rounded-full bg-sky-400/10 blur-3xl" />
          <img
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 right-0 hidden w-[26rem] opacity-[0.12] mix-blend-screen md:block"
            src="/bryan-cars-logo.png"
          />

          <div className="relative z-10 space-y-6">
            <div className="max-w-3xl">
              <p className="bb-eyebrow">Bryan Cars client portal</p>
              <h1 className="bb-title mt-3">
                Bonjour {clientData.firstName || clientData.fullName || "client"},
              </h1>
              <p className="bb-subtitle mt-3 max-w-2xl">
                {clientData.isFounder
                  ? "Votre espace fondateur va droit au but: formule, vehicules, rendez-vous et historique premium sans surcharge."
                  : "Votre espace client est maintenant separe par usages pour aller plus vite sur mobile comme sur ordinateur."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {clientData.isFounder && (
                <div className="bb-pill border-[#f7b955]/30 bg-[#f7b955]/10 text-[#ffe8a8]">
                  <Crown className="h-3.5 w-3.5" />
                  Membre fondateur
                </div>
              )}
              <div className="bb-pill border-white/12 bg-white/[0.04] text-white/70">
                🪙 BC&apos;Coins: {clientData.bcPoints}
              </div>
              {upcomingAppointment && (
                <div className="bb-pill border-sky-400/35 bg-sky-300/10 text-sky-100">
                  Prochain rendez-vous le {formatDateFR(upcomingAppointment.date, {
                    day: "numeric",
                    month: "short",
                  })}
                </div>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {renderMetricCard(
                "Credits restants",
                `${clientData.formulaRemaining} / ${clientData.formulaTotal}`,
                clientData.formulaRemaining > 0
                  ? "La jauge descend automatiquement a chaque demande de rendez-vous validee."
                  : creditAvailabilityCopy(clientData.formulaRemaining),
                clientData.formulaRemaining > 0 ? undefined : "warning",
              )}
              {renderMetricCard(
                "Formule restante",
                formulaDaysRemaining == null
                  ? "Non definie"
                  : formulaDaysRemaining < 0
                    ? "Expiree"
                    : `${formulaDaysRemaining} jour${formulaDaysRemaining > 1 ? "s" : ""}`,
                formulaExpired
                  ? "La formule est arrivee a expiration."
                  : `Expiration le ${formatUnixDateFR(clientData.formulaExpiresAt)}.`,
                formulaExpired ? "danger" : undefined,
              )}
              {renderMetricCard(
                "Prochain passage",
                upcomingAppointment
                  ? formatDateFR(upcomingAppointment.date, { day: "numeric", month: "long" })
                  : "Rien de prevu",
                upcomingAppointment
                  ? `${slotLabel(upcomingAppointment.slot)} · ${formatTimeHHMM(
                      upcomingAppointment.time,
                    )} · ${locationLabel(upcomingAppointment.location)}`
                  : freeSlot
                    ? `Prochain libre: ${formatDateFR(freeSlot.date, {
                        day: "numeric",
                        month: "short",
                      })} · ${slotLabel(freeSlot.slot)}`
                    : "Le planning ne propose pas encore de disponibilite visible.",
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {quickCards.map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-left transition duration-200 hover:border-[#f7b955]/40 hover:bg-[#f7b955]/[0.08]"
                    key={card.view}
                    onClick={() => navigateView(card.view)}
                    type="button"
                  >
                    <div className="mb-4 inline-flex rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-[#f7b955]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">{card.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-white/62">{card.copy}</p>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="bb-button-brand" onClick={() => navigateView("booking")} type="button">
                Prendre rendez-vous
              </button>
              <button
                className="bb-button-ghost"
                onClick={() => setContactModalOpen(true)}
                type="button"
              >
                <Phone className="mr-2 h-4 w-4" />
                Contact
              </button>
            </div>
          </div>
        </article>

        <aside
          className={cn(
            "bb-surface relative overflow-hidden p-5 md:p-6",
            clientData.isFounder &&
              "border-[#f7b955]/28 bg-[radial-gradient(circle_at_top,rgba(247,185,85,0.16),transparent_42%),linear-gradient(180deg,rgba(255,227,160,0.06),rgba(255,255,255,0.02))]",
          )}
        >
          <div className="pointer-events-none absolute -right-10 top-2 h-28 w-28 rounded-full bg-sky-400/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 hidden md:block">
            <div className="ml-5 mt-auto overflow-hidden rounded-[26px] border border-white/10 bg-black/30 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
              {clientData.isFounder && clientData.founderMediaUrl ? (
                <img
                  alt="Visuel fondateur"
                  className="h-36 w-44 object-cover"
                  src={clientData.founderMediaUrl}
                />
              ) : (
                <img
                  alt="Bryan Cars Detailing"
                  className="h-36 w-44 object-contain px-4 py-3"
                  src="/bryan-cars-logo.png"
                />
              )}
            </div>
          </div>

          <div className="relative z-10 space-y-5 md:pl-52">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "rounded-2xl border p-3",
                    clientData.isFounder
                      ? "border-[#f7b955]/35 bg-[#f7b955]/12 text-[#ffe8a8]"
                      : "border-white/10 bg-white/[0.05] text-[#f7b955]",
                  )}
                >
                  {clientData.isFounder ? (
                    <Crown className="h-5 w-5" />
                  ) : (
                    <Sparkles className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                    {clientData.isFounder ? "Acces fondateur" : "Formule active"}
                  </p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {clientData.formulaName || "Formule detailing"}
                  </p>
                </div>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-2 md:hidden">
                <img
                  alt="Bryan Cars Detailing"
                  className="h-16 w-24 object-contain"
                  src={
                    clientData.isFounder && clientData.founderMediaUrl
                      ? clientData.founderMediaUrl
                      : "/bryan-cars-logo.png"
                  }
                />
              </div>
            </div>

            <p className="text-sm leading-6 text-white/62">
              {clientData.isFounder
                ? "Le visuel fondateur est maintenant integre plus bas dans la carte premium, avec la formule et l'echeance au premier plan."
                : "Cette carte resume l'essentiel: credits, echeance, points et acces rapide vers les bonnes sections."}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-white/10 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-white/40">Date d'achat</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {formatUnixDateFR(clientData.formulaPurchasedAt)}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-[22px] border p-4",
                  formulaExpired ? "border-rose-300/25 bg-rose-300/10" : "border-white/10 bg-black/25",
                )}
              >
                <p className="text-xs uppercase tracking-[0.16em] text-white/40">Expiration</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {formatUnixDateFR(clientData.formulaExpiresAt)}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-white/40">Credits</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {clientData.formulaRemaining} / {clientData.formulaTotal}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-white/40">🪙 BC&apos;Coins</p>
                <p className="mt-2 text-sm font-semibold text-white">{clientData.bcPoints} points</p>
              </div>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#f7b955] to-[#ff7a18]"
                style={{ width: `${creditsRatio * 100}%` }}
              />
            </div>
          </div>
        </aside>
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
            <div className="bb-pill border-[#f7b955]/30 bg-[#f7b955]/10 text-white">
              {clientData.formulaRemaining} credit
              {Math.abs(clientData.formulaRemaining) > 1 ? "s" : ""}
            </div>
            {activeVehicle && (
              <div className="bb-pill border-white/12 bg-white/[0.04] text-white/75">
                <CarFront className="h-3.5 w-3.5 text-[#f7b955]" />
                {vehicleTitle(activeVehicle)}
              </div>
            )}
          </div>
        </article>

        <article className="bb-surface p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="bb-eyebrow">Agenda</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{weekRangeLabel(weekDays)}</h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="bb-button-ghost h-11 w-11 rounded-full px-0"
                onClick={() => goWeek(-1)}
                type="button"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                className="bb-button-ghost h-11 w-11 rounded-full px-0"
                onClick={() => goWeek(1)}
                type="button"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { label: "Libre", status: "free" as const },
              { label: "Votre creneau", status: "mine" as const },
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
                    <h3 className="mt-2 text-2xl font-semibold text-white">
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

                <button
                  className="w-full rounded-[28px] border border-[#f7b955]/45 bg-[#f7b955]/10 p-4 text-left shadow-[0_18px_48px_rgba(247,185,85,0.12)] transition duration-200"
                  onClick={() => {
                    void openDayModal(focusedDay);
                  }}
                  type="button"
                >
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
                      <div
                        className={cn(
                          "rounded-[18px] border px-3 py-3",
                          dayStatusClasses(focusedDay.slots[slot].status),
                        )}
                        key={`${focusedDay.date}-${slot}`}
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
                      </div>
                    ))}
                  </div>
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-5 hidden md:block">
            <div className="grid grid-cols-7 gap-3">
              {weekDays.map((day, index) =>
                day ? (
                  <button
                    className={cn(
                      "rounded-[26px] border p-4 text-left transition duration-200",
                      focusedDay?.date === day.date
                        ? "border-[#f7b955]/45 bg-[#f7b955]/10 shadow-[0_18px_48px_rgba(247,185,85,0.12)]"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]",
                    )}
                    key={day.date}
                    onClick={() => {
                      void openDayModal(day);
                    }}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                          {weekdayShort(day.date)}
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold text-white">{day.day}</h3>
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
                        <div
                          className={cn("rounded-[18px] border px-3 py-3", dayStatusClasses(day.slots[slot].status))}
                          key={`${day.date}-${slot}`}
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
                        </div>
                      ))}
                    </div>
                  </button>
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
              <p className="bb-eyebrow">Vehicules</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">Votre garage Bryan Cars</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62">
                Ajoutez, modifiez ou retrouvez un vehicule en quelques secondes.
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
                placeholder="Rechercher par modele ou plaque"
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
                      ? "border-[#f7b955]/45 bg-[#f7b955]/10 shadow-[0_18px_48px_rgba(247,185,85,0.1)]"
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
              <p className="bb-eyebrow">Vehicule actif</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {activeVehicle ? vehicleTitle(activeVehicle) : "Aucun vehicule selectionne"}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62">
                Depuis cette fiche, vous retrouvez les prestations realisees sur le vehicule
                selectionne.
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
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/40">Modele</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {activeVehicle.model || "Non renseigne"}
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/40">Plaque</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {activeVehicle.plate || "Non renseignee"}
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
                <AppointmentsEmpty copy="Aucune prestation n'est encore reliee a ce vehicule." />
              ) : (
                <div className="grid gap-3">
                  {activeVehicleAppointments.map((appointment) => renderAppointmentCard(appointment))}
                </div>
              )}
            </div>
          ) : (
            <AppointmentsEmpty copy="Selectionnez ou ajoutez d'abord un vehicule pour consulter ses dossiers." />
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
              <p className="bb-eyebrow">🪙 BC&apos;Coins</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">Boutique client</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62">
                Recharges Bryan Cars et BC&apos;Coins sont regroupes ici pour garder un parcours
                simple et direct.
              </p>
            </div>
            <div className="bb-pill border-white/12 bg-white/[0.04] text-white/75">
              {paymentsReady ? "Paiement en ligne actif" : "Recharge externe"}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {paymentsReady && topupOffers.length > 0 ? (
              topupOffers.map((offer) => (
                <div
                  className="rounded-[24px] border border-[#f7b955]/20 bg-[linear-gradient(180deg,rgba(247,185,85,0.10),rgba(255,255,255,0.03))] p-4"
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
                          Ajout de credits
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
              ))
            ) : (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-lg font-semibold text-white">Recharge a finaliser</p>
                <p className="mt-2 text-sm leading-6 text-white/58">
                  Le parcours automatique SumUp est pret a etre branche. En attendant, la recharge
                  externe reste accessible.
                </p>
                <div className="mt-4">
                  <button className="bb-button-ghost" onClick={openTopupFlow} type="button">
                    Voir la recharge
                  </button>
                </div>
              </div>
            )}

            {clientData.clientType !== "bbx" && topupOffers[0] && (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-lg font-semibold text-white">Achat a l'unite</p>
                <p className="mt-2 text-sm leading-6 text-white/58">
                  Votre compte {clientData.clientType === "pro" ? "Pro" : "Data"} achete les credits
                  au tarif unitaire, sans BC&apos;Coins ni packs remises.
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

            {clientData.clientType === "bbx" && (
            <div className="mt-8 border-t border-white/10 pt-6">
              <div className="bb-section-head">
                <div>
                  <p className="bb-eyebrow">BC&apos;Coins</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Boutique fidelite</h2>
                </div>
                <div className="bb-pill border-white/12 bg-white/[0.04] text-white/75">
                  <Gift className="h-3.5 w-3.5 text-[#f7b955]" />
                  {clientData.bcPoints} points
                </div>
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
                      <p className="mt-2 text-sm text-white/58">{reward.pointsCost} 🪙 BC&apos;Coins</p>
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
              <h2 className="mt-2 text-2xl font-semibold text-white">Dernieres demandes</h2>
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
        <article className="bb-surface-strong p-6 md:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="bb-eyebrow">Historique et suivi</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">
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
                  historyTab === "mine" && "border-[#f7b955]/35 bg-[#f7b955]/10 text-white",
                )}
                onClick={() => setHistoryTab("mine")}
                type="button"
              >
                Mes rendez-vous
              </button>
              <button
                className={cn(
                  "bb-button-ghost px-4 py-2",
                  historyTab === "community" && "border-[#f7b955]/35 bg-[#f7b955]/10 text-white",
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
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <article className="bb-surface p-6">
              <div className="bb-section-head">
                <div>
                  <p className="bb-eyebrow">A venir</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Rendez-vous deja pris</h2>
                </div>
                <div className="bb-pill border-white/12 bg-white/[0.04] text-white/75">
                  {upcomingAppointments.length} fiche{upcomingAppointments.length > 1 ? "s" : ""}
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {appointmentsLoading ? (
                  <div className="bb-surface flex items-center gap-3 px-5 py-4 text-sm text-white/70">
                    <Loader2 className="h-4 w-4 animate-spin text-[#f7b955]" />
                    Chargement des rendez-vous...
                  </div>
                ) : upcomingAppointments.length === 0 ? (
                  <AppointmentsEmpty copy="Aucune prestation planifiee pour le moment." />
                ) : (
                  upcomingAppointments.map((appointment) => renderAppointmentCard(appointment))
                )}
              </div>
            </article>

            <article className="bb-surface p-6">
              <div className="bb-section-head">
                <div>
                  <p className="bb-eyebrow">Archives</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Historique detaille</h2>
                </div>
                <div className="bb-pill border-white/12 bg-white/[0.04] text-white/75">
                  {archivedAppointments.length} fiche{archivedAppointments.length > 1 ? "s" : ""}
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {appointmentsLoading ? (
                  <div className="bb-surface flex items-center gap-3 px-5 py-4 text-sm text-white/70">
                    <Loader2 className="h-4 w-4 animate-spin text-[#f7b955]" />
                    Chargement des rendez-vous...
                  </div>
                ) : archivedAppointments.length === 0 ? (
                  <AppointmentsEmpty copy="Aucune archive disponible pour le moment." />
                ) : (
                  archivedAppointments.map((appointment) => renderAppointmentCard(appointment))
                )}
              </div>
            </article>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
            <article className="bb-surface p-6">
              <div className="bb-section-head">
                <div>
                  <p className="bb-eyebrow">Galerie publique</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Photos et avis partages</h2>
                </div>
                <div className="bb-pill border-white/12 bg-white/[0.04] text-white/75">
                  {communityItems.length} retour{communityItems.length > 1 ? "s" : ""}
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {communityLoading ? (
                  <div className="bb-surface flex items-center gap-3 px-5 py-4 text-sm text-white/70">
                    <Loader2 className="h-4 w-4 animate-spin text-[#f7b955]" />
                    Chargement des retours clients...
                  </div>
                ) : communityItems.length === 0 ? (
                  <AppointmentsEmpty copy="Des qu'une prestation terminee contient des photos ou un avis client, elle apparait ici." />
                ) : (
                  communityItems.map((item) => (
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
                          {item.vehicleModel || "Vehicule detaille"}
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

                      <p className="mt-4 text-sm leading-6 text-white/68">
                        {item.userReview ||
                          "Le client n'a pas laisse de commentaire ecrit, mais des photos sont disponibles."}
                      </p>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        {item.photos.length === 0 ? (
                          <div className="flex h-24 items-center justify-center rounded-[22px] border border-dashed border-white/10 bg-black/15 text-center text-xs uppercase tracking-[0.16em] text-white/30 sm:col-span-3">
                            Aucune photo visible
                          </div>
                        ) : (
                          item.photos.map((photo) => (
                            <button
                              className="overflow-hidden rounded-[22px] border border-white/10 bg-black/30"
                              key={photo.id}
                              onClick={() =>
                                openLightbox(
                                  item.photos.map((entry) => ({
                                    id: `community-${item.id}-${entry.id}`,
                                    url: entry.url,
                                    label: entry.label,
                                  })),
                                  photo.url,
                                )
                              }
                              type="button"
                            >
                              <img
                                alt={photo.label || "Photo client"}
                                className="h-24 w-full object-cover transition duration-300 hover:scale-[1.04]"
                                src={photo.url}
                              />
                            </button>
                          ))
                        )}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </article>

            <article className="bb-surface p-6">
              <div className="bb-section-head">
                <div>
                  <p className="bb-eyebrow">Google reviews</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Donner une note publique</h2>
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
                      <div className="flex items-center gap-1 text-[#f7b955]">
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
      </section>
    );
  }

  return (
    <div className="bb-shell pb-24 md:pb-16">
      <input
        accept="image/*"
        className="hidden"
        multiple
        onChange={handleBookingImageSelection}
        ref={bookingImageInputRef}
        type="file"
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-7rem] top-28 h-72 w-72 rounded-full bg-[#f7b955]/12 blur-3xl" />
        <div className="absolute right-[-7rem] top-0 h-80 w-80 rounded-full bg-sky-400/12 blur-3xl" />
        <div className="absolute bottom-10 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#ff7a18]/10 blur-3xl" />
      </div>

      <main className="bb-content relative z-10 space-y-5 md:space-y-6">
        {renderHeader()}

        {requestedView === "home" && renderHomeView()}
        {requestedView === "booking" && renderBookingView()}
        {requestedView === "vehicles" && renderVehiclesView()}
        {requestedView === "shop" && renderShopView()}
        {requestedView === "history" && renderHistoryView()}
      </main>

      <nav className="fixed inset-x-0 bottom-3 z-30 px-3 md:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5 rounded-[28px] border border-white/12 bg-[#090d12]/94 p-1.5 shadow-[0_24px_80px_rgba(0,0,0,0.46)] backdrop-blur-2xl">
          {PORTAL_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = requestedView === item.view;
            return (
              <Link
                className={cn(
                  "flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-[20px] px-1.5 py-2 text-[10px] font-semibold transition duration-200",
                  active
                    ? "bg-gradient-to-b from-[#f7b955]/18 to-[#ff7a18]/12 text-white shadow-[0_10px_24px_rgba(247,185,85,0.12)]"
                    : "text-white/54",
                )}
                key={item.view}
                to={portalHref(item.view)}
              >
                <Icon className={cn("h-4 w-4", active && "text-[#f7b955]")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {selectedDay && currentDaySlot && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/75 px-3 pb-3 pt-8 backdrop-blur-md md:items-center"
          onClick={closeDayModal}
        >
          <div
            className="bb-surface-strong max-h-[calc(100vh-1rem)] w-full max-w-lg overflow-y-auto p-6 overscroll-contain"
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
                <h3 className="mt-3 text-2xl font-semibold text-white">
                  {formatDateFR(selectedDay.date)}
                </h3>
                <p className="mt-2 text-sm text-white/60">
                  {selectedMode === "book" &&
                    "Choisissez votre demi-journee, l'heure et le vehicule pour envoyer la demande."}
                  {selectedMode === "manage" &&
                    "Votre demande existe deja sur ce jour. Vous pouvez l'ajuster ou l'annuler."}
                  {selectedMode === "past" &&
                    "Ce jour n'est plus reservable depuis l'agenda. Ouvrez la fiche si elle existe deja."}
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
                        selectedSlot === slot && "shadow-[0_0_0_1px_rgba(247,185,85,0.45)]",
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
                            ? "Cette demi-journee est reservable."
                            : slotInfo.status === "busy"
                              ? "Une autre reservation existe deja sur cette demi-journee."
                              : "Creneau consulte a titre d'historique."}
                      </p>
                    </button>
                  );
                })}
              </div>

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

                  {termsAccepted && formulaExpired && (
                    <div className="rounded-[24px] border border-rose-300/25 bg-rose-300/10 p-4">
                      <p className="text-sm font-semibold text-white">Formule expiree</p>
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        Rechargez la formule avant d&apos;envoyer une nouvelle demande.
                      </p>
                      <button
                        className="bb-button-ghost mt-4 justify-center"
                        onClick={openTopupFlow}
                        type="button"
                      >
                        Voir la recharge
                      </button>
                    </div>
                  )}

                  {termsAccepted && !formulaExpired && creditsExhausted && (
                    <div className="rounded-[24px] border border-amber-300/25 bg-amber-300/10 p-4">
                      <p className="text-sm font-semibold text-white">
                        {clientData.formulaRemaining < 0
                          ? `Solde negatif (${creditsTopupNeed} credit${creditsTopupNeed > 1 ? "s" : ""} minimum)`
                          : "Aucun credit disponible"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        {creditAvailabilityCopy(clientData.formulaRemaining)}
                      </p>
                      <button
                        className="bb-button-ghost mt-4 justify-center"
                        onClick={openTopupFlow}
                        type="button"
                      >
                        Voir la recharge
                      </button>
                    </div>
                  )}

                  {vehicles.length > 0 && (
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                        Vehicule concerne
                      </p>

                      {vehicles.length > 1 && (
                        <div className="relative mt-4">
                          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                          <input
                            className="bb-input pl-11"
                            onChange={(event) => setBookingVehicleQuery(event.target.value)}
                            placeholder="Rechercher par modele ou plaque"
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
                                ? "border-[#f7b955]/45 bg-[#f7b955]/10 text-white"
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
                    </div>
                  )}

                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/40">Lieu souhaite</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        {
                          value: "atelier" as const,
                          label: "Au studio",
                          copy: "Deposez le vehicule au centre detailing.",
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
                              ? "border-[#f7b955]/45 bg-[#f7b955]/10 text-white"
                              : "border-white/10 bg-black/20 text-white/65 hover:bg-white/[0.04]",
                          )}
                          key={option.value}
                          onClick={() => setAppointmentLocation(option.value)}
                          type="button"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-base font-semibold text-white">{option.label}</span>
                            {appointmentLocation === option.value && (
                              <CheckCircle2 className="h-4 w-4 text-[#f7b955]" />
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
                        Etat estime du vehicule
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
                                ? "border-[#f7b955]/45 bg-[#f7b955]/10 text-white"
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

                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                    <label className="block">
                      <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                        Commentaire optionnel
                      </span>
                      <p className="mt-2 text-sm leading-6 text-white/60">
                        Une indication utile, un acces particulier ou toute precision a transmettre a l'equipe.
                      </p>
                      <textarea
                        className="bb-textarea mt-4"
                        maxLength={300}
                        onChange={(event) => setClientBookingNote(event.target.value)}
                        placeholder="Ex: portail a gauche, chien dans le jardin, siege bebe a nettoyer en priorite..."
                        value={clientBookingNote}
                      />
                    </label>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                          Images optionnelles
                        </p>
                        <p className="mt-2 text-sm leading-6 text-white/60">
                          Ajoutez jusqu'a 4 photos si vous souhaitez montrer un acces, une tache
                          ou un point a surveiller.
                        </p>
                      </div>
                      <div className="bb-pill border-white/10 bg-black/20 text-white/65">
                        {bookingImageDrafts.length}/4
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
                          : formulaExpired
                            ? "Formule expiree"
                            : creditsExhausted
                              ? "Credits epuises"
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
                              ? "border-[#f7b955]/45 bg-[#f7b955]/10 text-white"
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
                      ? "Ce passage fait deja partie de votre historique. Ouvrez la fiche pour revoir le compte-rendu, les photos et votre evaluation client."
                      : currentDaySlot.status === "busy"
                        ? "Ce creneau est deja reserve par un autre client sur cette demi-journee."
                        : currentDaySlot.status === "free"
                          ? "Cette demi-journee est deja passee et ne peut plus etre reservee."
                          : "Ce creneau est archive dans le planning."}
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 px-3 pb-3 pt-8 backdrop-blur-md md:items-center"
          onClick={closeAppointmentModal}
        >
          <div
            className="bb-surface-strong max-h-[calc(100vh-1rem)] w-full max-w-4xl overflow-y-auto p-6 overscroll-contain md:p-7"
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

                <h3 className="mt-4 text-3xl font-semibold text-white">
                  {formatDateFR(selectedAppointment.date)}
                </h3>
                <p className="mt-2 text-sm text-white/60">
                  {slotWindowLabel(selectedAppointment.slot)} · {formatTimeHHMM(
                    selectedAppointment.time,
                  )} -{" "}
                  {selectedAppointment.vehicleModel || clientData.vehicleModel || "Vehicule"}
                  {selectedAppointment.vehiclePlate ? ` / ${selectedAppointment.vehiclePlate}` : ""}
                </p>
              </div>

              <button className="bb-button-ghost self-start" onClick={closeAppointmentModal} type="button">
                Fermer
              </button>
            </div>

            {clientData.clientType !== "pro" && (
              <div className="mt-6 rounded-[26px] border border-[#f7b955]/25 bg-[#f7b955]/10 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-[#ffe8a8]">
                      Validation tarif
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {selectedAppointment.priceStatus === "waiting_photos"
                        ? "L'admin demande des photos"
                        : selectedAppointment.priceStatus === "waiting_client_approval"
                          ? "Tarif a accepter"
                          : selectedAppointment.priceStatus === "waiting_payment"
                            ? "Recharge necessaire"
                            : selectedAppointment.priceStatus === "approved"
                              ? "Credits consommes"
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
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[320px]">
                    {(selectedAppointment.priceStatus === "waiting_client_approval" ||
                      selectedAppointment.priceStatus === "waiting_payment") && (
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
                    )}
                    {selectedAppointment.priceStatus === "waiting_payment" && (
                      <button className="bb-button-ghost justify-center" onClick={() => navigateView("shop")} type="button">
                        Recharger
                      </button>
                    )}
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
                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-[#f7b955]">
                      <Clock3 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Resume prestation</p>
                      <p className="mt-1 text-sm text-white/55">
                        {selectedAppointment.adminNote
                          ? selectedAppointment.adminNote
                          : "Le centre n'a pas encore laisse de note detaillee pour cette fiche."}
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
                <article className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Photos du vehicule</p>
                      <p className="mt-1 text-sm text-white/55">
                        Cliquez sur une image pour l'ouvrir en grand.
                      </p>
                    </div>
                    {appointmentPhotosLoading && (
                      <Loader2 className="h-4 w-4 animate-spin text-[#f7b955]" />
                    )}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {!appointmentPhotosLoading && appointmentPhotos.length === 0 && (
                      <>
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div
                            className="flex h-28 items-center justify-center rounded-[22px] border border-dashed border-white/10 bg-black/20 text-center text-xs uppercase tracking-[0.16em] text-white/30"
                            key={index}
                          >
                            Photo a venir
                          </div>
                        ))}
                      </>
                    )}

                    {appointmentPhotos.map((photo) => (
                      <button
                        className="overflow-hidden rounded-[22px] border border-white/10 bg-black/30"
                        key={photo.id}
                        onClick={() =>
                          openLightbox(
                            appointmentPhotos.map((entry) => ({
                              id: entry.id,
                              url: entry.url,
                              label: entry.label,
                            })),
                            photo.url,
                          )
                        }
                        type="button"
                      >
                        <img
                          alt={photo.label || "Photo rendez-vous"}
                          className="h-28 w-full object-cover transition duration-300 hover:scale-[1.04]"
                          src={photo.url}
                        />
                      </button>
                    ))}
                  </div>
                </article>

                <article className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-[#f7b955]">
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
                              active ? "fill-[#f7b955] text-[#f7b955]" : "text-white/20",
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
              </section>
            </div>
          </div>
        </div>
      )}

      {vehicleModalOpen && (
        <div
          className="fixed inset-0 z-[54] flex items-end justify-center bg-black/80 px-3 pb-3 pt-8 backdrop-blur-md md:items-center"
          onClick={closeVehicleModal}
        >
          <div
            className="bb-surface-strong max-h-[calc(100vh-1rem)] w-full max-w-2xl overflow-y-auto p-6 overscroll-contain md:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="bb-eyebrow">
                  {vehicleModalMode === "create" ? "Nouveau vehicule" : "Modifier vehicule"}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-white">
                  {vehicleModalMode === "create"
                    ? "Ajouter un vehicule a votre compte"
                    : "Mettre a jour ce vehicule"}
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
                  placeholder="Ex: BMW familiale / Vehicule societaire"
                  value={vehicleDraft.label}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">Modele</span>
                <input
                  className="bb-input"
                  onChange={(event) =>
                    setVehicleDraft((current) => ({ ...current, model: event.target.value }))
                  }
                  placeholder="Ex: BMW M3"
                  value={vehicleDraft.model}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">Plaque</span>
                <input
                  className="bb-input"
                  onChange={(event) =>
                    setVehicleDraft((current) => ({ ...current, plate: event.target.value }))
                  }
                  placeholder="AB-123-CD"
                  value={vehicleDraft.plate}
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
          className="fixed inset-0 z-[55] flex items-end justify-center bg-black/80 px-3 pb-3 pt-8 backdrop-blur-md md:items-center"
          onClick={closeTermsModal}
        >
          <div
            className="bb-surface-strong max-h-[calc(100vh-1rem)] w-full max-w-4xl overflow-y-auto p-6 overscroll-contain md:p-7"
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
                <h3 className="mt-4 text-3xl font-semibold text-white">Conditions & reglement</h3>
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
                      "bb-attention-ring bb-attention-nudge border-[#f7b955]/60 bg-[#f7b955]/12",
                  )}
                >
                  <p className="text-sm font-semibold text-white">
                    {termsAccepted
                      ? `Acceptation enregistree le ${formatUnixDateTimeFR(clientData.termsAcceptedAt)}`
                      : "Avant de poursuivre, vous devez accepter le reglement."}
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
                        "bb-attention-ring bb-attention-nudge border-[#f7b955]/55 bg-[#f7b955]/10 text-white",
                    )}
                  >
                    <input
                      checked={termsChecked}
                      className="mt-1 h-4 w-4 rounded border-white/20 bg-black/30 text-[#f7b955] accent-[#f7b955]"
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
          className="fixed inset-0 z-[56] flex items-end justify-center bg-black/80 px-3 pb-3 pt-8 backdrop-blur-md md:items-center"
          onClick={() => setContactModalOpen(false)}
        >
          <div
            className="bb-surface-strong max-h-[calc(100vh-1rem)] w-full max-w-xl overflow-y-auto p-6 overscroll-contain md:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="bb-eyebrow">Contact</p>
                <h3 className="mt-3 text-2xl font-semibold text-white">Joindre Bryan Cars rapidement</h3>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  Le contact et les acces utiles sont regroupes ici pour ne plus surcharger la carte client.
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
                Voir le reglement
              </Link>
            </div>
          </div>
        </div>
      )}

      <ImageLightbox
        currentUrl={lightboxUrl}
        images={lightboxImages}
        onChange={setLightboxUrl}
        onClose={() => setLightboxUrl(null)}
      />

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
