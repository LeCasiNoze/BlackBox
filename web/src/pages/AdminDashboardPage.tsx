import * as React from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BellRing,
  CalendarClock,
  CalendarPlus,
  Camera,
  CarFront,
  CheckCircle2,
  Clock3,
  Coins,
  Copy,
  Crown,
  Download,
  ExternalLink,
  Gift,
  Inbox,
  Loader2,
  LogOut,
  Mail,
  PencilLine,
  Phone,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trophy,
  Truck,
  Users,
  XCircle,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { ImageLightbox, type LightboxImage } from "../components/ImageLightbox";
import { InstallAppButton } from "../components/InstallAppButton";
import { APP_VERSION, PATCH_NOTES } from "../lib/patchNotes";
import { downloadIcs, googleCalendarUrl, type CalendarEvent } from "../lib/calendar";
import {
  adminPushPermission,
  adminPushSupported,
  enableAdminPush,
} from "../lib/adminPush";
import {
  appointmentDateTime,
  appointmentStatusClasses,
  appointmentStatusLabel,
  clampNumber,
  cn,
  formatDateFR,
  formatTimeHHMM,
  formatUnixDateTimeFR,
  locationClasses,
  locationLabel,
  normalizeAppointmentSlot,
  normalizePhoneForTel,
  slotLabel,
  slotWindowLabel,
  unixToDateInputValue,
  type AppointmentLocation,
  type AppointmentSlot,
  type AppointmentStatus,
} from "../lib/portal";

type AdminClient = {
  id: number;
  slug: string;
  cardCode: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  clientType: "bbx" | "data" | "pro";
  isFounder: boolean;
  founderMediaUrl: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
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
  founderUntil: number | null;
  reviewBoxRewardLabel: string | null;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
};

type AdminEvent = {
  id: number;
  title: string;
  description: string | null;
  audience: string;
  startsAt: number | null;
  endsAt: number | null;
  isActive: boolean;
  requireInstagram: boolean;
  requireTiktok: boolean;
  requireFacebook: boolean;
  requireReview: boolean;
  conditionsText: string | null;
  conditionsLink: string | null;
  prizeKind: string;
  prizeText: string | null;
  prizeInappType: string | null;
  prizeInappAmount: number | null;
  consolationEnabled: boolean;
  winnerClientId: number | null;
  winnerName: string | null;
  drawnAt: number | null;
  participants: number;
};

type AdminStats = {
  year: number;
  monthIndex: number;
  revenueCents: number;
  payments: number;
  appointments: { requested: number; confirmed: number; done: number; cancelled: number };
  appointmentsTotal: number;
  creditsConsumed: number;
  bcDistributed: number;
  newClients: number;
  totalClients: number;
  totalFounders: number;
  activeEvents: number;
};

type AdminRetentionCohort = {
  total: number;
  withVisit: number;
  active90: number;
  repeat: number;
};

type AdminAnalytics = {
  funnel: { requested: number; used: number; rate: number };
  retention: { bbx: AdminRetentionCohort; founders: AdminRetentionCohort };
  heatmap: Record<string, number>;
};

type AdminEventParticipant = {
  clientId: number;
  clientName: string | null;
  cardCode: string | null;
  isFounder: boolean;
  tickets: number;
  consolationReward: string | null;
  consolationLabel: string | null;
  createdAt: number;
};

type EventDraft = {
  id: number | null;
  title: string;
  description: string;
  audience: string;
  startsAt: string;
  endsAt: string;
  conditionsText: string;
  conditionsLink: string;
  prizeKind: string;
  prizeText: string;
  prizeInappType: string;
  prizeInappAmount: string;
  isActive: boolean;
  consolationEnabled: boolean;
};

type AdminGoodie = {
  id: number;
  clientId: number;
  clientName: string | null;
  clientSlug: string | null;
  source: string;
  rewardKey: string;
  rewardLabel: string;
  status: string;
  createdAt: number;
  honoredAt: number | null;
};

function emptyEventDraft(): EventDraft {
  return {
    id: null,
    title: "",
    description: "",
    audience: "global",
    startsAt: "",
    endsAt: "",
    conditionsText: "",
    conditionsLink: "",
    prizeKind: "text",
    prizeText: "",
    prizeInappType: "credit",
    prizeInappAmount: "1",
    isActive: true,
    consolationEnabled: true,
  };
}

type AdminAppointment = {
  id: number;
  clientId: number;
  vehicleId: number | null;
  date: string;
  slot: AppointmentSlot | null;
  time: string | null;
  status: AppointmentStatus;
  clientNote: string | null;
  adminNote: string | null;
  userRating: number | null;
  userReview: string | null;
  cleanlinessRating: CleanlinessRating | null;
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
  priceComment: string | null;
  photosRequestedAt: number | null;
  photosRequestMessage: string | null;
  bcPointsAwarded: boolean;
  createdAt: number;
  updatedAt: number;
  clientName: string | null;
  vehicleLabel: string | null;
  vehicleModel: string | null;
  vehiclePlate: string | null;
  location: AppointmentLocation | null;
  goodies?: string[];
};

type CleanlinessRating =
  | "very_clean"
  | "correct"
  | "dirty"
  | "very_dirty"
  | "reset_recommended";

type CanonicalCleanlinessRating = "very_clean" | "correct" | "dirty";
type ServiceLevel = "clean" | "correct" | "dirty";

type AdminAppointmentPhoto = {
  id: number;
  url: string;
  caption: string | null;
  isCover: boolean;
  isPublic: boolean;
  category?: "before" | "after" | null;
};

type AdminAppointmentPhotosResponse = {
  ok: boolean;
  photos: AdminAppointmentPhoto[];
};

type AdminAppointmentPhotoCreateResponse = {
  ok: boolean;
  photo: AdminAppointmentPhoto | null;
};

type AdminVehicle = {
  id: number;
  clientId: number;
  label: string | null;
  model: string | null;
  plate: string | null;
  isPrimary: boolean;
  createdAt: number;
  updatedAt: number;
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

type CleanlinessSummary = {
  total: number;
  averageScore: number | null;
};

type ClientDetailResponse = {
  ok: boolean;
  client: AdminClient;
  vehicles: AdminVehicle[];
  appointments: AdminAppointment[];
  rewardRedemptions: RewardRedemption[];
  cleanliness: CleanlinessSummary;
};

type ListClientsResponse = {
  ok: boolean;
  clients: AdminClient[];
};

type ListAppointmentsResponse = {
  ok: boolean;
  appointments: AdminAppointment[];
};

type ProfileDraft = {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  clientType: "bbx" | "data" | "pro";
  isFounder: boolean;
  sendWelcomeEmail: boolean;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  vehicleModel: string;
  vehiclePlate: string;
  formulaName: string;
  formulaTotal: string;
  formulaRemaining: string;
  formulaPurchasedAt: string;
  formulaExpiresAt: string;
  notes: string;
};

type AdminSection =
  | "home"
  | "appointments"
  | "delivery"
  | "clients"
  | "stats"
  | "events"
  | "comms"
  | "settings";

const ADMIN_NAV_ITEMS: Array<{
  key: AdminSection;
  label: string;
  shortLabel: string;
  icon: typeof Sparkles;
}> = [
  { key: "home", label: "Hall", shortLabel: "Hall", icon: Sparkles },
  { key: "appointments", label: "Agenda", shortLabel: "Agenda", icon: CalendarClock },
  { key: "delivery", label: "Livraison", shortLabel: "Livraison", icon: Truck },
  { key: "clients", label: "Clients", shortLabel: "Clients", icon: Users },
  { key: "stats", label: "Stats", shortLabel: "Stats", icon: BarChart3 },
  { key: "events", label: "Événements", shortLabel: "Events", icon: Trophy },
  { key: "comms", label: "Emails", shortLabel: "Emails", icon: Mail },
  { key: "settings", label: "Réglages", shortLabel: "Réglages", icon: Settings },
];

// Nav du bas (mobile) : sections principales uniquement; les secondaires
// (stats / events / emails / reglages) passent par la barre d'onglets + le Hall.
const PRIMARY_ADMIN_KEYS: AdminSection[] = ["home", "appointments", "delivery", "clients"];

const CLEANLINESS_OPTIONS: Array<{
  value: CanonicalCleanlinessRating;
  label: string;
  tone: string;
}> = [
  { value: "very_clean", label: "Propre", tone: "border-emerald-400/35 bg-emerald-300/10 text-emerald-100" },
  { value: "correct", label: "Correct", tone: "border-lime-400/30 bg-lime-300/10 text-lime-100" },
  { value: "dirty", label: "Sale", tone: "border-amber-400/35 bg-amber-300/10 text-amber-100" },
];

function normalizeCleanlinessRating(
  rating: CleanlinessRating | null | undefined,
): CanonicalCleanlinessRating | null {
  if (!rating) return null;
  if (rating === "very_dirty" || rating === "reset_recommended") {
    return "dirty";
  }
  if (rating === "very_clean" || rating === "correct" || rating === "dirty") {
    return rating;
  }
  return null;
}

function defaultProfileDraft(): ProfileDraft {
  return {
    firstName: "",
    lastName: "",
    company: "",
    email: "",
    phone: "",
    clientType: "bbx",
    isFounder: false,
    sendWelcomeEmail: true,
    addressLine1: "",
    addressLine2: "",
    postalCode: "",
    city: "",
    vehicleModel: "",
    vehiclePlate: "",
    formulaName: "",
    formulaTotal: "",
    formulaRemaining: "",
    formulaPurchasedAt: "",
    formulaExpiresAt: "",
    notes: "",
  };
}

function profileDraftFromClient(client: AdminClient): ProfileDraft {
  return {
    firstName: client.firstName ?? "",
    lastName: client.lastName ?? "",
    company: client.company ?? "",
    email: client.email ?? "",
    phone: client.phone ?? "",
    clientType: client.clientType ?? "bbx",
    isFounder: !!client.isFounder,
    sendWelcomeEmail: false,
    addressLine1: client.addressLine1 ?? "",
    addressLine2: client.addressLine2 ?? "",
    postalCode: client.postalCode ?? "",
    city: client.city ?? "",
    vehicleModel: client.vehicleModel ?? "",
    vehiclePlate: client.vehiclePlate ?? "",
    formulaName: client.formulaName ?? "",
    formulaTotal: String(client.formulaTotal ?? 0),
    formulaRemaining: String(client.formulaRemaining ?? 0),
    formulaPurchasedAt: unixToDateInputValue(client.formulaPurchasedAt),
    formulaExpiresAt: unixToDateInputValue(client.formulaExpiresAt),
    notes: client.notes ?? "",
  };
}

function cleanlinessLabel(rating: CleanlinessRating | null | undefined) {
  return (
    CLEANLINESS_OPTIONS.find(
      (option) => option.value === normalizeCleanlinessRating(rating),
    )?.label || "Non note"
  );
}

function cleanlinessTone(rating: CleanlinessRating | null | undefined) {
  return (
    CLEANLINESS_OPTIONS.find(
      (option) => option.value === normalizeCleanlinessRating(rating),
    )?.tone ||
    "border-white/12 bg-white/[0.04] text-white/70"
  );
}

function cleanlinessAverageRating(
  averageScore: number | null | undefined,
): CanonicalCleanlinessRating | null {
  if (averageScore == null) return null;
  if (averageScore >= 2.5) return "very_clean";
  if (averageScore >= 1.5) return "correct";
  return "dirty";
}

function fullClientName(client: AdminClient | null) {
  if (!client) return "Client non sélectionné";
  return (
    client.fullName ||
    `${client.firstName || ""} ${client.lastName || ""}`.trim() ||
    "Client"
  );
}

function previewText(value: string | null, fallback: string) {
  if (!value) return fallback;
  return value.length > 140 ? `${value.slice(0, 140)}...` : value;
}

function sortAppointments(
  appointments: AdminAppointment[],
  direction: "asc" | "desc" = "desc",
) {
  const next = [...appointments];
  next.sort((left, right) => {
    const diff =
      appointmentDateTime(left).getTime() - appointmentDateTime(right).getTime();
    return direction === "asc" ? diff : -diff;
  });
  return next;
}

function appointmentNeedsTreatment(appointment: AdminAppointment) {
  return appointment.status === "requested" || appointment.status === "confirmed";
}

function pickDefaultAdminAppointment(appointments: AdminAppointment[]) {
  const sortedAsc = sortAppointments(appointments, "asc");
  const sortedDesc = sortAppointments(appointments, "desc");
  const now = Date.now();

  const nearestUpcomingUntreated =
    sortedAsc.find(
      (appointment) =>
        appointmentNeedsTreatment(appointment) &&
        appointmentDateTime(appointment).getTime() >= now,
    ) ?? null;

  if (nearestUpcomingUntreated) {
    return nearestUpcomingUntreated;
  }

  const nearestUpcomingActive =
    sortedAsc.find(
      (appointment) =>
        appointment.status !== "cancelled" &&
        appointment.status !== "done" &&
        appointmentDateTime(appointment).getTime() >= now,
    ) ?? null;

  if (nearestUpcomingActive) {
    return nearestUpcomingActive;
  }

  const latestUntreated = sortedDesc.find((appointment) => appointmentNeedsTreatment(appointment)) ?? null;
  if (latestUntreated) {
    return latestUntreated;
  }

  return sortedDesc[0] ?? null;
}

function appointmentSearchText(appointment: AdminAppointment) {
  return [
    appointment.clientName,
    appointment.vehicleModel,
    appointment.vehiclePlate,
    appointment.date,
    appointment.slot ? slotLabel(normalizeAppointmentSlot(appointment.slot, appointment.time)) : null,
    appointment.time,
    appointment.location,
    appointment.adminNote,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function appointmentSlot(appointment: AdminAppointment) {
  return normalizeAppointmentSlot(appointment.slot, appointment.time);
}

function appointmentPrimaryAction(status: AppointmentStatus) {
  switch (status) {
    case "requested":
      return "Confirmer le créneau";
    case "confirmed":
      return "Marquer comme effectué";
    case "done":
      return "Prestation terminee";
    case "cancelled":
      return "Rendez-vous annulé";
    default:
      return "Mettre a jour";
  }
}

function appointmentWorkflowActions(status: AppointmentStatus) {
  if (status === "requested") {
    return {
      primary: {
        label: "Confirmer",
        nextStatus: "confirmed" as AppointmentStatus,
        icon: CheckCircle2,
        className: "bb-button-brand justify-center",
        disabled: false,
      },
      secondary: {
        label: "Refuser",
        nextStatus: "cancelled" as AppointmentStatus,
        icon: XCircle,
        className: "bb-button-danger justify-center",
        disabled: false,
      },
    };
  }

  if (status === "confirmed") {
    return {
      primary: {
        label: "Marquer effectué",
        nextStatus: "done" as AppointmentStatus,
        icon: CheckCircle2,
        className: "bb-button-brand justify-center",
        disabled: false,
      },
      secondary: {
        label: "Deconfirmer",
        nextStatus: "requested" as AppointmentStatus,
        icon: Clock3,
        className: "bb-button-ghost justify-center",
        disabled: false,
      },
    };
  }

  if (status === "done") {
    return {
      primary: {
        label: "Effectue",
        nextStatus: "done" as AppointmentStatus,
        icon: CheckCircle2,
        className: "bb-button-brand justify-center opacity-70",
        disabled: true,
      },
      secondary: {
        label: "Repasser en attente",
        nextStatus: "requested" as AppointmentStatus,
        icon: Clock3,
        className: "bb-button-ghost justify-center",
        disabled: false,
      },
    };
  }

  return {
    primary: {
      label: "Repasser en attente",
      nextStatus: "requested" as AppointmentStatus,
      icon: Clock3,
      className: "bb-button-brand justify-center",
      disabled: false,
    },
    secondary: {
      label: "Confirmer",
      nextStatus: "confirmed" as AppointmentStatus,
      icon: CheckCircle2,
      className: "bb-button-ghost justify-center",
      disabled: false,
    },
  };
}

function groupAppointmentsByDate(appointments: AdminAppointment[]) {
  const groups = new Map<string, AdminAppointment[]>();

  appointments.forEach((appointment) => {
    const current = groups.get(appointment.date);
    if (current) {
      current.push(appointment);
    } else {
      groups.set(appointment.date, [appointment]);
    }
  });

  return Array.from(groups.entries()).map(([date, items]) => ({
    date,
    items: sortAppointments(items, "asc"),
  }));
}

export function AdminDashboardPage() {
  const location = useLocation();
  const [clients, setClients] = React.useState<AdminClient[]>([]);
  const [clientsLoading, setClientsLoading] = React.useState(true);
  const [clientsError, setClientsError] = React.useState<string | null>(null);

  const [selectedClientId, setSelectedClientId] = React.useState<number | null>(null);
  const [selectedClient, setSelectedClient] =
    React.useState<ClientDetailResponse | null>(null);
  const [clientLoading, setClientLoading] = React.useState(false);

  const [globalAppointments, setGlobalAppointments] = React.useState<AdminAppointment[]>(
    [],
  );
  const [globalAppointmentsLoading, setGlobalAppointmentsLoading] = React.useState(true);

  const [busyAction, setBusyAction] = React.useState(false);
  const [busyFormula, setBusyFormula] = React.useState(false);
  const [busyFormulaRecap, setBusyFormulaRecap] = React.useState(false);
  const [busyPoints, setBusyPoints] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const [refreshToken, setRefreshToken] = React.useState(0);
  const [clientTypeFilter, setClientTypeFilter] = React.useState<
    "bbx" | "founder" | "pro" | "all"
  >("bbx");
  const [exportingData, setExportingData] = React.useState(false);
  const [pointsDeltaDraft, setPointsDeltaDraft] = React.useState("100");
  const [pushPermission, setPushPermission] = React.useState<
    NotificationPermission | "unsupported"
  >(() => adminPushPermission());
  const [pushBusy, setPushBusy] = React.useState(false);

  const [filterClientQuery, setFilterClientQuery] = React.useState("");
  const deferredClientQuery = React.useDeferredValue(filterClientQuery);

  const [appointmentQuery, setAppointmentQuery] = React.useState("");
  const deferredAppointmentQuery = React.useDeferredValue(appointmentQuery);

  // L'onglet agenda/livraison est pilote par la section de navigation (URL).
  const boardTab: "agenda" | "livraison" = location.pathname.startsWith("/admin/delivery")
    ? "livraison"
    : "agenda";
  // Sous-filtre de la Livraison: a faire (confirmes) / effectues / tous.
  const [livraisonFilter, setLivraisonFilter] = React.useState<"all" | "confirmed" | "done">(
    "all",
  );

  const [selectedAppointmentId, setSelectedAppointmentId] =
    React.useState<number | null>(null);
  const [highlightAppointmentId, setHighlightAppointmentId] =
    React.useState<number | null>(null);
  const [noteDrafts, setNoteDrafts] = React.useState<Record<number, string>>({});
  const [cleanlinessDrafts, setCleanlinessDrafts] = React.useState<
    Record<number, CleanlinessRating | null>
  >({});
  const [customCreditDrafts, setCustomCreditDrafts] = React.useState<Record<number, string>>({});
  const [photoRequestDrafts, setPhotoRequestDrafts] = React.useState<Record<number, string>>({});
  const [priceCommentDrafts, setPriceCommentDrafts] = React.useState<Record<number, string>>({});

  const [stagedPhotos, setStagedPhotos] = React.useState<Array<{ file: File; url: string }>>([]);
  const [currentPhotos, setCurrentPhotos] = React.useState<AdminAppointmentPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = React.useState(false);
  const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null);
  const [lightboxImages, setLightboxImages] = React.useState<LightboxImage[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const appointmentWorkspaceRef = React.useRef<HTMLElement | null>(null);
  const appointmentListRef = React.useRef<HTMLElement | null>(null);
  const pendingRef = React.useRef<HTMLDivElement | null>(null);
  const isFirstLoad = React.useRef(true);

  const [profileModalOpen, setProfileModalOpen] = React.useState(false);
  const [profileMode, setProfileMode] = React.useState<"edit" | "new">("edit");
  const [profileSubmitting, setProfileSubmitting] = React.useState(false);
  const [profileDraft, setProfileDraft] = React.useState<ProfileDraft | null>(null);
  const [founderMediaFile, setFounderMediaFile] = React.useState<File | null>(null);

  const [events, setEvents] = React.useState<AdminEvent[]>([]);
  const [eventDraft, setEventDraft] = React.useState<EventDraft | null>(null);
  const [eventBusy, setEventBusy] = React.useState(false);
  const [participantsByEvent, setParticipantsByEvent] = React.useState<
    Record<number, AdminEventParticipant[]>
  >({});
  const [openParticipantsEventId, setOpenParticipantsEventId] = React.useState<number | null>(null);
  const [participantsBusy, setParticipantsBusy] = React.useState(false);
  const [goodies, setGoodies] = React.useState<AdminGoodie[]>([]);
  const [goodieFilter, setGoodieFilter] = React.useState<"pending" | "honored">("pending");
  const [goodiePending, setGoodiePending] = React.useState(0);
  const [companySettings, setCompanySettings] = React.useState<Record<string, string>>({
    name: "",
    legalForm: "",
    address: "",
    city: "",
    siret: "",
    vatNote: "",
    email: "",
    phone: "",
  });
  const [companySaving, setCompanySaving] = React.useState(false);
  const [recapSending, setRecapSending] = React.useState(false);
  const [statsYear, setStatsYear] = React.useState(() => new Date().getFullYear());
  const [statsMonth, setStatsMonth] = React.useState(() => new Date().getMonth());
  const [statsData, setStatsData] = React.useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = React.useState<AdminAnalytics | null>(null);
  const [broadcast, setBroadcast] = React.useState({
    segment: "bbx",
    subject: "",
    title: "",
    body: "",
    buttonLabel: "",
    buttonUrl: "",
  });
  const [broadcastSending, setBroadcastSending] = React.useState(false);

  const [formulaEditOpen, setFormulaEditOpen] = React.useState(false);
  const [formulaDraftTotal, setFormulaDraftTotal] = React.useState<number | null>(
    null,
  );
  const [formulaDraftRemaining, setFormulaDraftRemaining] =
    React.useState<number | null>(null);

  const [deepLink, setDeepLink] = React.useState<{
    appointmentId: number | null;
    date: string | null;
  }>({ appointmentId: null, date: null });

  const [isNavigatingSelection, startSelectingClient] = React.useTransition();

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const clientIdParam = params.get("clientId");
    const dateParam = params.get("date");
    const appointmentIdParam = params.get("appointmentId");

    if (clientIdParam) {
      const numericId = Number(clientIdParam);
      if (!Number.isNaN(numericId)) {
        setSelectedClientId(numericId);
      }
    }

    setDeepLink({
      appointmentId: appointmentIdParam ? Number(appointmentIdParam) || null : null,
      date: dateParam || null,
    });
  }, [location.search]);

  React.useEffect(() => {
    let active = true;

    async function loadClients() {
      try {
        if (isFirstLoad.current) setClientsLoading(true);
        setClientsError(null);

        const response = await fetch(`/api/admin/clients?filter=${clientTypeFilter}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const json = (await response.json()) as ListClientsResponse;
        if (!json.ok) throw new Error("invalid_payload");
        if (!active) return;

        setClients(json.clients ?? []);

        if ((json.clients?.length ?? 0) > 0 && selectedClientId == null) {
          setSelectedClientId(json.clients[0].id);
        }
      } catch (error) {
        if (active) {
          setClientsError("Impossible de charger la liste client.");
        }
      } finally {
        if (active) {
          setClientsLoading(false);
          isFirstLoad.current = false;
        }
      }
    }

    void loadClients();

    return () => {
      active = false;
    };
  }, [clientTypeFilter, refreshToken, selectedClientId]);

  React.useEffect(() => {
    let active = true;

    async function loadAppointments() {
      try {
        if (isFirstLoad.current) setGlobalAppointmentsLoading(true);

        const response = await fetch("/api/admin/appointments?limit=300");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const json = (await response.json()) as ListAppointmentsResponse;
        if (!json.ok) throw new Error("invalid_payload");
        if (!active) return;

        setGlobalAppointments(json.appointments ?? []);
      } catch (error) {
        if (active) {
          setGlobalAppointments([]);
        }
      } finally {
        if (active) {
          setGlobalAppointmentsLoading(false);
        }
      }
    }

    void loadAppointments();

    return () => {
      active = false;
    };
  }, [refreshToken]);

  React.useEffect(() => {
    if (!selectedClientId) return;

    let active = true;

    async function loadClientDetail() {
      try {
        setClientLoading(true);

        const response = await fetch(`/api/admin/clients/${selectedClientId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const json = (await response.json()) as ClientDetailResponse;
        if (!json.ok) throw new Error("invalid_payload");
        if (!active) return;

        setSelectedClient(json);
        setNoteDrafts((current) => {
          const next = { ...current };
          json.appointments.forEach((appointment) => {
            if (next[appointment.id] === undefined) {
              next[appointment.id] = appointment.adminNote ?? "";
            }
          });
          return next;
        });
        setCleanlinessDrafts((current) => {
          const next = { ...current };
          json.appointments.forEach((appointment) => {
            if (next[appointment.id] === undefined) {
              next[appointment.id] = normalizeCleanlinessRating(appointment.cleanlinessRating);
            }
          });
          return next;
        });
      } catch (error) {
        if (active) {
          setSelectedClient(null);
        }
      } finally {
        if (active) {
          setClientLoading(false);
        }
      }
    }

    void loadClientDetail();

    return () => {
      active = false;
    };
  }, [refreshToken, selectedClientId]);

  React.useEffect(() => {
    if (!selectedClientId) return;
    const params = new URLSearchParams(window.location.search);
    params.set("clientId", String(selectedClientId));
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  }, [selectedClientId]);

  const selectedAppointment = React.useMemo(() => {
    if (!selectedAppointmentId) return null;

    const fromSelectedClient =
      selectedClient?.appointments.find(
        (appointment) => appointment.id === selectedAppointmentId,
      ) ?? null;
    if (fromSelectedClient) return fromSelectedClient;

    return (
      globalAppointments.find((appointment) => appointment.id === selectedAppointmentId) ??
      null
    );
  }, [globalAppointments, selectedAppointmentId, selectedClient]);

  // Le rendez-vous selectionne appartient-il a l'onglet courant (agenda/livraison)?
  const selectedOnBoard =
    !!selectedAppointment &&
    (boardTab === "agenda"
      ? selectedAppointment.status === "requested"
      : selectedAppointment.status === "confirmed" || selectedAppointment.status === "done");

  const clientRequestPhotos = React.useMemo(
    () => currentPhotos.filter((photo) => !photo.isPublic),
    [currentPhotos],
  );

  const publicAppointmentPhotos = React.useMemo(
    () => currentPhotos.filter((photo) => photo.isPublic),
    [currentPhotos],
  );

  function syncManagedClient(updatedClient: AdminClient) {
    setClients((current) =>
      current.map((client) => (client.id === updatedClient.id ? updatedClient : client)),
    );
    setSelectedClient((current) =>
      current
        ? {
            ...current,
            client: updatedClient,
          }
        : current,
    );
  }

  const adminSectionHrefs = React.useMemo(() => {
    const clientQuery = selectedClientId ? `?clientId=${selectedClientId}` : "";
    const appointmentQuery = selectedAppointment
      ? `?clientId=${selectedAppointment.clientId}&appointmentId=${selectedAppointment.id}`
      : clientQuery;

    return {
      home: "/admin",
      appointments: `/admin/appointments${appointmentQuery}`,
      delivery: `/admin/delivery${appointmentQuery}`,
      clients: `/admin/clients${clientQuery}`,
      stats: "/admin/stats",
      events: "/admin/events",
      comms: "/admin/comms",
      settings: "/admin/settings",
    };
  }, [selectedAppointment, selectedClientId]);

  React.useEffect(() => {
    if (!selectedClient?.appointments?.length) return;
    if (!deepLink.appointmentId && !deepLink.date) return;

    const match =
      selectedClient.appointments.find((appointment) => {
        if (deepLink.appointmentId && appointment.id === deepLink.appointmentId) {
          return true;
        }
        if (deepLink.date && appointment.date === deepLink.date) {
          return true;
        }
        return false;
      }) ?? null;

    if (!match) return;

    setSelectedAppointmentId(match.id);
    setHighlightAppointmentId(match.id);
  }, [deepLink, selectedClient]);

  React.useEffect(() => {
    if (!selectedAppointment?.id) {
      setCurrentPhotos([]);
      return;
    }

    void loadAppointmentPhotosAdmin(selectedAppointment.id);
    clearStagedPhotos();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [selectedAppointment?.id, selectedAppointment?.updatedAt]);

  React.useEffect(() => {
    if (!highlightAppointmentId) return undefined;
    const timeout = window.setTimeout(() => setHighlightAppointmentId(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [highlightAppointmentId]);

  React.useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  // Silent periodic auto-refresh — does not trigger loading skeletons after first load.
  // Also refreshes immediately when the tab regains focus, so a change made on
  // another device (client cancellation, etc.) shows up right away.
  React.useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") {
        setRefreshToken((v) => v + 1);
      }
    };
    const interval = window.setInterval(refresh, 25000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);


  // Si l'admin a deja autorise les notifications, on re-synchronise silencieusement
  // l'abonnement push cote serveur (utile apres un nouveau deploiement).
  React.useEffect(() => {
    if (adminPushPermission() === "granted") {
      void enableAdminPush().then((result) => {
        if (result.ok) {
          setPushPermission("granted");
        }
      });
    }
  }, []);

  function showToast(message: string) {
    setToast(message);
  }

  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/admin/events");
        const json = await response.json();
        if (active && response.ok && json.ok) {
          setEvents(json.events as AdminEvent[]);
        }
      } catch (_error) {
        // silencieux
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshToken]);

  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/admin/settings/company");
        const json = await response.json();
        if (active && response.ok && json.ok && json.company) {
          setCompanySettings((prev) => ({ ...prev, ...json.company }));
        }
      } catch (_error) {
        // silencieux
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch(`/api/admin/stats?year=${statsYear}&month=${statsMonth}`);
        const json = await response.json();
        if (active && response.ok && json.ok) setStatsData(json.stats as AdminStats);
      } catch (_error) {
        // silencieux
      }
    })();
    return () => {
      active = false;
    };
  }, [statsYear, statsMonth, refreshToken]);

  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/admin/analytics");
        const json = await response.json();
        if (active && response.ok && json.ok) setAnalytics(json.analytics as AdminAnalytics);
      } catch (_error) {
        // silencieux
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshToken]);

  function shiftStatsMonth(delta: number) {
    setStatsData(null);
    setStatsMonth((prev) => {
      const total = statsYear * 12 + prev + delta;
      const nextYear = Math.floor(total / 12);
      const nextMonth = ((total % 12) + 12) % 12;
      setStatsYear(nextYear);
      return nextMonth;
    });
  }

  const BROADCAST_SEGMENTS: Array<{ value: string; label: string }> = [
    { value: "all", label: "Tous les clients" },
    { value: "bbx", label: "BBX (+ fondateurs)" },
    { value: "founders", label: "Fondateurs" },
    { value: "pro", label: "Pro" },
    { value: "recent", label: "Actifs recents (90j)" },
  ];

  async function sendBroadcast() {
    if (!broadcast.body.trim() && !broadcast.title.trim()) {
      showToast("Ajoute un titre ou un message.");
      return;
    }
    const segLabel =
      BROADCAST_SEGMENTS.find((s) => s.value === broadcast.segment)?.label || broadcast.segment;
    if (!window.confirm(`Envoyer cet e-mail au segment « ${segLabel} » ?`)) return;
    setBroadcastSending(true);
    try {
      const response = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(broadcast),
      });
      const json = await response.json().catch(() => ({}));
      if (response.ok && json.ok) {
        showToast(`E-mail envoye a ${json.sent}/${json.total} client(s).`);
        setBroadcast((prev) => ({ ...prev, subject: "", title: "", body: "", buttonLabel: "", buttonUrl: "" }));
      } else {
        showToast("Echec de l'envoi groupe.");
      }
    } catch (_error) {
      showToast("Erreur reseau.");
    } finally {
      setBroadcastSending(false);
    }
  }

  async function sendYearRecap() {
    if (
      !window.confirm(
        "Envoyer le récap annuel par e-mail a tous les clients BBX ayant au moins une prestation cette année ?",
      )
    ) {
      return;
    }
    setRecapSending(true);
    try {
      const response = await fetch("/api/admin/recap/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await response.json().catch(() => ({}));
      if (response.ok && json.ok) {
        showToast(`Recap annuel envoye a ${json.sent}/${json.eligible} client(s).`);
      } else {
        showToast("Échec de l'envoi du récap.");
      }
    } catch (_error) {
      showToast("Erreur reseau.");
    } finally {
      setRecapSending(false);
    }
  }

  async function saveCompanySettings() {
    setCompanySaving(true);
    try {
      const response = await fetch("/api/admin/settings/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companySettings),
      });
      const json = await response.json().catch(() => ({}));
      if (response.ok && json.ok) {
        if (json.company) setCompanySettings((prev) => ({ ...prev, ...json.company }));
        showToast("Infos société enregistrees.");
      } else {
        showToast("Échec de l'enregistrement.");
      }
    } catch (_error) {
      showToast("Erreur reseau.");
    } finally {
      setCompanySaving(false);
    }
  }

  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch(`/api/admin/goodies?status=${goodieFilter}`);
        const json = await response.json();
        if (active && response.ok && json.ok) {
          setGoodies(json.goodies as AdminGoodie[]);
          setGoodiePending(json.pendingCount ?? 0);
        }
      } catch (_error) {
        // silencieux
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshToken, goodieFilter]);

  async function honorGoodie(id: number, honored: boolean) {
    try {
      await fetch(`/api/admin/goodies/${id}/honor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ honored }),
      });
      setRefreshToken((value) => value + 1);
    } catch (_error) {
      showToast("Erreur reseau.");
    }
  }

  function openCreateEvent() {
    setEventDraft(emptyEventDraft());
  }

  function openEditEvent(event: AdminEvent) {
    setEventDraft({
      id: event.id,
      title: event.title,
      description: event.description ?? "",
      audience: event.audience,
      startsAt: unixToDateInputValue(event.startsAt),
      endsAt: unixToDateInputValue(event.endsAt),
      conditionsText: event.conditionsText ?? "",
      conditionsLink: event.conditionsLink ?? "",
      prizeKind: event.prizeKind,
      prizeText: event.prizeText ?? "",
      prizeInappType: event.prizeInappType ?? "credit",
      prizeInappAmount: String(event.prizeInappAmount ?? 1),
      isActive: event.isActive,
      consolationEnabled: event.consolationEnabled,
    });
  }

  function dateInputToUnix(value: string) {
    if (!value) return null;
    const ms = new Date(`${value}T00:00:00`).getTime();
    return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
  }

  async function saveEvent() {
    if (!eventDraft) return;
    setEventBusy(true);
    try {
      const payload = {
        title: eventDraft.title,
        description: eventDraft.description,
        audience: eventDraft.audience,
        startsAt: dateInputToUnix(eventDraft.startsAt),
        endsAt: dateInputToUnix(eventDraft.endsAt),
        conditionsText: eventDraft.conditionsText,
        conditionsLink: eventDraft.conditionsLink,
        prizeKind: eventDraft.prizeKind,
        prizeText: eventDraft.prizeText,
        prizeInappType: eventDraft.prizeInappType,
        prizeInappAmount: Number(eventDraft.prizeInappAmount || 0),
        isActive: eventDraft.isActive,
        consolationEnabled: eventDraft.consolationEnabled,
      };
      const url = eventDraft.id ? `/api/admin/events/${eventDraft.id}` : "/api/admin/events";
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        showToast("Impossible d'enregistrer l'événement.");
        return;
      }
      showToast("Événement enregistré.");
      setEventDraft(null);
      setRefreshToken((value) => value + 1);
    } catch (_error) {
      showToast("Erreur reseau pendant l'enregistrement.");
    } finally {
      setEventBusy(false);
    }
  }

  async function eventAction(id: number, path: string, body?: unknown) {
    setEventBusy(true);
    try {
      const response = await fetch(`/api/admin/events/${id}${path}`, {
        method: path === "" ? "POST" : "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.ok === false) {
        showToast(json.error === "no_participants" ? "Aucun participant a tirer." : "Action impossible.");
        return;
      }
      if (json.winnerName) {
        showToast(`Gagnant tire : ${json.winnerName}`);
      }
      setRefreshToken((value) => value + 1);
    } catch (_error) {
      showToast("Erreur reseau.");
    } finally {
      setEventBusy(false);
    }
  }

  async function deleteEvent(id: number) {
    setEventBusy(true);
    try {
      await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
      showToast("Événement supprime.");
      setRefreshToken((value) => value + 1);
    } catch (_error) {
      showToast("Erreur reseau.");
    } finally {
      setEventBusy(false);
    }
  }

  // Ouvre/ferme et (re)charge la liste des participants d'un evenement.
  async function toggleEventParticipants(id: number) {
    if (openParticipantsEventId === id) {
      setOpenParticipantsEventId(null);
      return;
    }
    setOpenParticipantsEventId(id);
    setParticipantsBusy(true);
    try {
      const response = await fetch(`/api/admin/events/${id}/participants`);
      const json = await response.json().catch(() => ({}));
      if (response.ok && json.ok) {
        setParticipantsByEvent((prev) => ({
          ...prev,
          [id]: json.participants as AdminEventParticipant[],
        }));
      } else {
        showToast("Impossible de charger les participants.");
      }
    } catch (_error) {
      showToast("Erreur reseau.");
    } finally {
      setParticipantsBusy(false);
    }
  }

  async function handleEnablePush() {
    if (!adminPushSupported()) {
      showToast("Notifications non supportees sur cet appareil/navigateur.");
      return;
    }
    setPushBusy(true);
    try {
      const result = await enableAdminPush();
      setPushPermission(adminPushPermission());
      if (result.ok) {
        showToast("Notifications activees sur cet appareil.");
      } else if (result.reason === "denied") {
        showToast("Notifications refusees. Autorisez-les dans les réglages du navigateur.");
      } else if (result.reason === "not_configured") {
        showToast("Notifications pas encore configurees cote serveur.");
      } else if (result.reason === "unsupported") {
        showToast("Notifications non supportees sur cet appareil.");
      } else {
        showToast("Impossible d'activer les notifications.");
      }
    } finally {
      setPushBusy(false);
    }
  }

  function openLightbox(images: LightboxImage[], url: string) {
    setLightboxImages(images);
    setLightboxUrl(url);
  }

  async function copyClientCardLink(client: AdminClient) {
    if ((client.clientType !== "bbx" && client.clientType !== "pro") || !client.slug) {
      showToast("Aucun lien de carte disponible pour ce client.");
      return;
    }

    const cardUrl = `${window.location.origin}/card/${client.slug}`;

    try {
      await navigator.clipboard.writeText(cardUrl);
      showToast("Lien de la carte client copie.");
    } catch (error) {
      showToast("Impossible de copier le lien client.");
    }
  }

  function applyAppointmentUpdate(updated: AdminAppointment) {
    setGlobalAppointments((current) =>
      current.map((appointment) =>
        appointment.id === updated.id ? updated : appointment,
      ),
    );

    setSelectedClient((current) => {
      if (!current) return current;
      return {
        ...current,
        appointments: current.appointments.map((appointment) =>
          appointment.id === updated.id ? updated : appointment,
        ),
      };
    });

    setCleanlinessDrafts((current) => ({
      ...current,
      [updated.id]: normalizeCleanlinessRating(updated.cleanlinessRating),
    }));
  }

  function focusAppointment(appointment: AdminAppointment) {
    setSelectedAppointmentId(appointment.id);
    setHighlightAppointmentId(appointment.id);
    startSelectingClient(() => setSelectedClientId(appointment.clientId));

    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      window.setTimeout(() => {
        appointmentWorkspaceRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 80);
    }
  }

  function focusClient(client: AdminClient) {
    const firstClientAppointment =
      sortAppointments(
        globalAppointments.filter((appointment) => appointment.clientId === client.id),
        "asc",
      )[0] ?? null;

    setSelectedAppointmentId(firstClientAppointment?.id ?? null);
    startSelectingClient(() => setSelectedClientId(client.id));
  }

  async function loadAppointmentPhotosAdmin(appointmentId: number) {
    setPhotosLoading(true);

    try {
      const response = await fetch(`/api/admin/appointments/${appointmentId}/photos`);
      const json = (await response.json()) as AdminAppointmentPhotosResponse;

      if (!response.ok || !json.ok) {
        setCurrentPhotos([]);
        return;
      }

      setCurrentPhotos(json.photos ?? []);
    } catch (error) {
      setCurrentPhotos([]);
    } finally {
      setPhotosLoading(false);
    }
  }

  async function changeStatus(appointmentId: number, status: AppointmentStatus) {
    setBusyAction(true);

    // Passage en "Effectue": on enregistre d'abord le compte-rendu + les photos
    // en attente (pas de bouton de sauvegarde separe), puis on applique le statut.
    if (status === "done") {
      await commitAppointmentWorkspace(appointmentId);
    }

    const previousGlobal = globalAppointments;
    const previousSelectedClient = selectedClient;

    setGlobalAppointments((current) =>
      current.map((appointment) =>
        appointment.id === appointmentId ? { ...appointment, status } : appointment,
      ),
    );

    setSelectedClient((current) => {
      if (!current) return current;
      return {
        ...current,
        appointments: current.appointments.map((appointment) =>
          appointment.id === appointmentId ? { ...appointment, status } : appointment,
        ),
      };
    });

    try {
      const response = await fetch(`/api/admin/appointments/${appointmentId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          customCredits:
            customCreditDrafts[appointmentId] && Number(customCreditDrafts[appointmentId]) > 0
              ? Number(customCreditDrafts[appointmentId])
              : undefined,
          adminCleanlinessEstimate: cleanlinessDrafts[appointmentId] === "dirty"
            ? "dirty"
            : cleanlinessDrafts[appointmentId] === "correct"
              ? "correct"
              : "clean",
          priceComment: priceCommentDrafts[appointmentId]?.trim()
            ? priceCommentDrafts[appointmentId].trim()
            : undefined,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.ok || !json.appointment) {
        setGlobalAppointments(previousGlobal);
        setSelectedClient(previousSelectedClient);
        showToast("Impossible de mettre a jour ce rendez-vous.");
        setRefreshToken((value) => value + 1);
        return;
      }

      const updated = json.appointment as AdminAppointment;
      applyAppointmentUpdate(updated);

      if (updated.priceStatus === "waiting_payment" || json.warning === "not_enough_credits") {
        showToast("Tarif enregistré. Le client doit recharger pour confirmer.");
      } else if (updated.priceStatus === "waiting_client_approval") {
        showToast("Tarif envoye au client pour validation.");
      } else {
        showToast("Statut mis a jour.");
      }
      setRefreshToken((value) => value + 1);
    } catch (error) {
      setGlobalAppointments(previousGlobal);
      setSelectedClient(previousSelectedClient);
      showToast("Erreur reseau pendant la mise a jour.");
      setRefreshToken((value) => value + 1);
    } finally {
      setBusyAction(false);
    }
  }

  async function requestClientPhotos(appointmentId: number) {
    setBusyAction(true);
    try {
      const response = await fetch(`/api/admin/appointments/${appointmentId}/request-photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: photoRequestDrafts[appointmentId] || "Merci d'ajouter quelques photos du véhicule.",
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok || !json.appointment) {
        showToast("Impossible de demander les photos.");
        return;
      }

      applyAppointmentUpdate(json.appointment as AdminAppointment);
      showToast("Demande de photos envoyee au client.");
      setRefreshToken((value) => value + 1);
    } catch (error) {
      showToast("Erreur reseau pendant la demande de photos.");
    } finally {
      setBusyAction(false);
    }
  }

  function clearStagedPhotos() {
    setStagedPhotos((current) => {
      current.forEach((entry) => URL.revokeObjectURL(entry.url));
      return [];
    });
  }

  function addStagedPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    const additions = Array.from(files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setStagedPhotos((current) => [...current, ...additions]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeStagedPhoto(url: string) {
    setStagedPhotos((current) => {
      const entry = current.find((item) => item.url === url);
      if (entry) URL.revokeObjectURL(entry.url);
      return current.filter((item) => item.url !== url);
    });
  }

  // Enregistre le compte-rendu (note) + televerse les photos en attente.
  // Appele au passage en "Effectue" (pas de bouton de sauvegarde dedie).
  async function commitAppointmentWorkspace(appointmentId: number) {
    const note = noteDrafts[appointmentId] ?? "";

    try {
      await fetch(`/api/admin/appointments/${appointmentId}/workspace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote: note, cleanlinessRating: null }),
      });
    } catch (error) {
      console.error("[admin] save compte-rendu:", error);
    }

    for (const entry of stagedPhotos) {
      try {
        const formData = new FormData();
        formData.append("file", entry.file);
        formData.append("caption", "");
        const response = await fetch(
          `/api/admin/appointments/${appointmentId}/photos/upload`,
          { method: "POST", body: formData },
        );
        const json = (await response.json()) as AdminAppointmentPhotoCreateResponse;
        if (response.ok && json.ok && json.photo) {
          setCurrentPhotos((current) => [...current, json.photo as AdminAppointmentPhoto]);
        }
      } catch (error) {
        console.error("[admin] upload photo:", error);
      }
    }

    clearStagedPhotos();
  }

  // Tag avant/apres d'une photo (toggle: re-cliquer retire le tag).
  async function setPhotoCategory(photoId: number, category: "before" | "after") {
    const appointmentId = selectedAppointment?.id;
    if (!appointmentId) return;
    const current = currentPhotos.find((p) => p.id === photoId)?.category ?? null;
    const next = current === category ? null : category;
    setCurrentPhotos((list) =>
      list.map((p) => (p.id === photoId ? { ...p, category: next } : p)),
    );
    try {
      await fetch(`/api/admin/appointments/${appointmentId}/photos/${photoId}/category`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: next }),
      });
    } catch (_error) {
      showToast("Echec du tag photo.");
    }
  }

  async function updateFormula(mode: "reset" | "empty" | "custom") {
    const client = selectedClient?.client;
    if (!client) return;

    let nextTotal = client.formulaTotal;
    let nextRemaining = client.formulaRemaining;

    if (mode === "reset") {
      nextRemaining = client.formulaTotal;
    } else if (mode === "empty") {
      nextRemaining = 0;
    } else {
      nextTotal = clampNumber(Math.floor(formulaDraftTotal ?? client.formulaTotal), 0);
      nextRemaining = clampNumber(
        Math.floor(formulaDraftRemaining ?? client.formulaRemaining),
        0,
        nextTotal,
      );
    }

    setBusyFormula(true);

    try {
      const response = await fetch(`/api/admin/clients/${client.id}/formula`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          total: nextTotal,
          remaining: nextRemaining,
        }),
      });

      const json = await response.json();
      if (!response.ok || json.ok === false) {
        showToast("Impossible de mettre a jour la formule.");
        return;
      }

      setSelectedClient((current) => {
        if (!current) return current;
        return {
          ...current,
          client: {
            ...current.client,
            formulaTotal: nextTotal,
            formulaRemaining: nextRemaining,
          },
        };
      });

      setClients((current) =>
        current.map((entry) =>
          entry.id === client.id
            ? {
                ...entry,
                formulaTotal: nextTotal,
                formulaRemaining: nextRemaining,
              }
            : entry,
        ),
      );

      showToast("Formule mise a jour.");
      setFormulaEditOpen(false);
    } catch (error) {
      showToast("Erreur reseau pendant la mise a jour formule.");
    } finally {
      setBusyFormula(false);
    }
  }

  async function sendFormulaRecap() {
    const client = selectedClient?.client;
    if (!client) return;

    if (!client.email) {
      showToast("Ajoutez un email client avant l'envoi du recapitulatif.");
      return;
    }

    setBusyFormulaRecap(true);

    try {
      const response = await fetch(`/api/admin/clients/${client.id}/formula-recap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const json = await response.json();
      if (!response.ok || !json.ok || !json.client) {
        showToast("Impossible d'envoyer le recapitulatif client.");
        return;
      }

      const updated = json.client as AdminClient;
      setClients((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
      setSelectedClient((current) =>
        current ? { ...current, client: updated } : current,
      );
      showToast("Recapitulatif formule envoye au client.");
    } catch (error) {
      showToast("Erreur reseau pendant l'envoi du recapitulatif.");
    } finally {
      setBusyFormulaRecap(false);
    }
  }

  async function updateClientPoints(deltaOverride?: number) {
    const client = selectedClient?.client;
    if (!client) return;

    const delta = Math.trunc(Number(deltaOverride ?? pointsDeltaDraft));
    if (!Number.isFinite(delta) || delta === 0) {
      showToast("Entrez un montant positif ou negatif pour les BC'Coins.");
      return;
    }

    setBusyPoints(true);

    try {
      const response = await fetch(`/api/admin/clients/${client.id}/bc-points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      });

      const json = await response.json();
      if (!response.ok || !json.ok || !json.client) {
        showToast(
          json?.error === "not_enough_points"
            ? "Impossible de retirer plus de BC'Coins que le solde disponible."
            : "La mise a jour des BC'Coins a échoué.",
        );
        return;
      }

      syncManagedClient(json.client as AdminClient);
      showToast(
        delta > 0
          ? `${Math.abs(delta)} BC'Coins ajoutes.`
          : `${Math.abs(delta)} BC'Coins retires.`,
      );
    } catch (error) {
      showToast("Erreur reseau pendant la mise a jour des BC'Coins.");
    } finally {
      setBusyPoints(false);
    }
  }

  async function exportFullData() {
    setExportingData(true);

    try {
      const response = await fetch("/api/admin/exports", {
        method: "POST",
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        showToast("Impossible d'exporter les données.");
        return;
      }

      showToast(
        json.emailSent
          ? "Export complet créé et envoye a l'admin."
          : "Export créé. Verifiez la configuration email admin.",
      );
    } catch (error) {
      showToast("Erreur reseau pendant l'export des données.");
    } finally {
      setExportingData(false);
    }
  }

  function openFormulaEdit() {
    const client = selectedClient?.client;
    if (!client) return;

    setFormulaDraftTotal(client.formulaRemaining);
    setFormulaDraftRemaining(client.formulaRemaining);
    setFormulaEditOpen(true);
  }

  function openCreateProfile() {
    setProfileMode("new");
    setProfileDraft(defaultProfileDraft());
    setFounderMediaFile(null);
    setProfileModalOpen(true);
  }

  function openEditProfile() {
    const client = selectedClient?.client;
    if (!client) return;

    setProfileMode("edit");
    setProfileDraft(profileDraftFromClient(client));
    setFounderMediaFile(null);
    setProfileModalOpen(true);
  }

  function updateProfileDraft(field: keyof ProfileDraft, value: string) {
    setProfileDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  async function removeClientAccount(client: AdminClient) {
    if (
      !window.confirm(
        `Supprimer definitivement le compte de ${fullClientName(client)} et toutes ses donnees (RDV, photos, avis...) ? Action irreversible.`,
      )
    ) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/clients/${client.id}`, { method: "DELETE" });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.ok === false) {
        showToast("Suppression impossible.");
        return;
      }
      setClients((current) => current.filter((entry) => entry.id !== client.id));
      setSelectedClientId(null);
      setSelectedClient(null);
      showToast("Compte supprime.");
      setRefreshToken((value) => value + 1);
    } catch (_error) {
      showToast("Erreur reseau pendant la suppression.");
    }
  }

  async function submitProfile() {
    if (!profileDraft) return;

    setProfileSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("firstName", profileDraft.firstName);
      payload.append("lastName", profileDraft.lastName);
      payload.append("company", profileDraft.company);
      payload.append("email", profileDraft.email);
      payload.append("phone", profileDraft.phone);
      payload.append("clientType", profileDraft.clientType);
      payload.append("isFounder", String(profileDraft.isFounder));
      payload.append("sendWelcomeEmail", String(profileDraft.sendWelcomeEmail));
      payload.append("addressLine1", profileDraft.addressLine1);
      payload.append("addressLine2", profileDraft.addressLine2);
      payload.append("postalCode", profileDraft.postalCode);
      payload.append("city", profileDraft.city);
      payload.append("vehicleModel", profileDraft.vehicleModel);
      payload.append("vehiclePlate", profileDraft.vehiclePlate);
      // Credit unique: total et restant suivent la meme valeur.
      const creditsValue = String(Number(profileDraft.formulaRemaining || 0));
      payload.append("formulaName", profileDraft.formulaName);
      payload.append("formulaTotal", creditsValue);
      payload.append("formulaRemaining", creditsValue);
      payload.append("formulaPurchasedAt", profileDraft.formulaPurchasedAt);
      payload.append("formulaExpiresAt", profileDraft.formulaExpiresAt);
      payload.append("notes", profileDraft.notes);
      if (founderMediaFile) {
        payload.append("founderImage", founderMediaFile);
      }

      const creating = profileMode === "new";
      const url = creating
        ? "/api/admin/clients"
        : `/api/admin/clients/${selectedClient?.client.id}/profile`;

      const response = await fetch(url, {
        method: "POST",
        body: payload,
      });

      const json = await response.json();
      if (!response.ok || !json.ok || !json.client) {
        showToast("Impossible d'enregistrer la fiche client.");
        return;
      }

      const updated = json.client as AdminClient;

      if (creating) {
        setClients((current) => [updated, ...current]);
        setSelectedClientId(updated.id);
        showToast("Nouveau client créé.");
      } else {
        setClients((current) =>
          current.map((entry) => (entry.id === updated.id ? updated : entry)),
        );
        setSelectedClient((current) =>
          current ? { ...current, client: updated } : current,
        );
        showToast("Profil client enregistré.");
      }

      setProfileModalOpen(false);
      setProfileDraft(null);
      setFounderMediaFile(null);
      setRefreshToken((value) => value + 1);
    } catch (error) {
      showToast("Erreur reseau pendant l'enregistrement du profil.");
    } finally {
      setProfileSubmitting(false);
    }
  }

  const sortedGlobalAsc = React.useMemo(
    () => sortAppointments(globalAppointments, "asc"),
    [globalAppointments],
  );
  const sortedGlobalDesc = React.useMemo(
    () => sortAppointments(globalAppointments, "desc"),
    [globalAppointments],
  );

  const pendingRequests = React.useMemo(
    () =>
      sortedGlobalAsc.filter((appointment) => appointment.status === "requested"),
    [sortedGlobalAsc],
  );

  const boardAppointments = React.useMemo(
    () =>
      sortedGlobalDesc.filter((appointment) => {
        if (boardTab === "agenda") {
          return appointment.status === "requested";
        }
        // Livraison: confirmes (a faire) et/ou effectues selon le sous-filtre.
        if (livraisonFilter === "confirmed") return appointment.status === "confirmed";
        if (livraisonFilter === "done") return appointment.status === "done";
        return appointment.status === "confirmed" || appointment.status === "done";
      }),
    [boardTab, livraisonFilter, sortedGlobalDesc],
  );

  const upcomingAppointments = React.useMemo(
    () =>
      sortedGlobalAsc.filter((appointment) => {
        if (appointment.status === "cancelled" || appointment.status === "done") {
          return false;
        }
        return appointmentDateTime(appointment).getTime() >= Date.now();
      }),
    [sortedGlobalAsc],
  );

  // RDV confirmes restant a effectuer (badge "Livraison").
  const deliveryPendingCount = React.useMemo(
    () => sortedGlobalAsc.filter((appointment) => appointment.status === "confirmed").length,
    [sortedGlobalAsc],
  );

  function adminCalendarEvent(appt: AdminAppointment): CalendarEvent {
    return {
      title: `Bryan Cars - ${appt.clientName || "Client"}`,
      date: appt.date,
      time: appt.time,
      slot: appointmentSlot(appt),
      location: appt.location === "domicile" ? "A domicile" : "Atelier Bryan Cars",
      details: `Detailing ${appt.vehicleModel || ""}`.trim(),
    };
  }

  // Compteurs de notification par onglet de navigation admin.
  const adminNavBadges: Record<string, number> = {
    home: goodiePending,
    appointments: pendingRequests.length,
    delivery: deliveryPendingCount,
    clients: 0,
  };

  const filteredClients = React.useMemo(() => {
    const query = deferredClientQuery.trim().toLowerCase();
    if (!query) return clients;

    return clients.filter((client) => {
      const haystack = [
        client.fullName,
        client.firstName,
        client.lastName,
        client.vehicleModel,
        client.vehiclePlate,
        client.slug,
        client.cardCode,
        client.city,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [clients, deferredClientQuery]);

  const selectedClientData = selectedClient?.client ?? null;

  const filteredAgendaAppointments = React.useMemo(() => {
    const query = deferredAppointmentQuery.trim().toLowerCase();

    return boardAppointments.filter((appointment) => {
      if (!query) return true;
      return appointmentSearchText(appointment).includes(query);
    });
  }, [boardAppointments, deferredAppointmentQuery]);

  const agendaSections = React.useMemo(
    () => groupAppointmentsByDate(filteredAgendaAppointments),
    [filteredAgendaAppointments],
  );

  const activeClientContext =
    (selectedAppointment &&
      (selectedClientData?.id === selectedAppointment.clientId
        ? selectedClientData
        : clients.find((client) => client.id === selectedAppointment.clientId) ?? null)) ||
    selectedClientData;

  const contextualClientAppointments = React.useMemo(() => {
    if (!activeClientContext) return [];

    if (selectedClient?.client.id === activeClientContext.id) {
      return sortAppointments(selectedClient.appointments ?? [], "desc");
    }

    return sortAppointments(
      globalAppointments.filter(
        (appointment) => appointment.clientId === activeClientContext.id,
      ),
      "desc",
    );
  }, [activeClientContext, globalAppointments, selectedClient]);
  const selectedClientAppointments = React.useMemo(
    () => sortAppointments(selectedClient?.appointments ?? [], "desc"),
    [selectedClient],
  );

  const totalCreditsRemaining = clients.reduce(
    (sum, client) => sum + (client.formulaRemaining ?? 0),
    0,
  );
  const clientsLowOnCredits = clients.filter((client) => client.formulaRemaining <= 1).length;
  const doneThisMonth = globalAppointments.filter(
    (appointment) =>
      appointment.status === "done" &&
      appointment.date.startsWith(new Date().toISOString().slice(0, 7)),
  ).length;
  const firstPendingRequest = pendingRequests[0] ?? null;
  const firstUpcomingAppointment = upcomingAppointments[0] ?? null;
  const adminSection: AdminSection = location.pathname.startsWith("/admin/appointments")
    ? "appointments"
    : location.pathname.startsWith("/admin/delivery")
      ? "delivery"
      : location.pathname.startsWith("/admin/clients")
        ? "clients"
        : location.pathname.startsWith("/admin/stats")
          ? "stats"
          : location.pathname.startsWith("/admin/events")
            ? "events"
            : location.pathname.startsWith("/admin/comms")
              ? "comms"
              : location.pathname.startsWith("/admin/settings")
                ? "settings"
                : "home";
  const selectedAppointmentActions = selectedAppointment
    ? appointmentWorkflowActions(selectedAppointment.status)
    : null;
  const managedClient = selectedClientData;
  const managedClientTermsAccepted = !!managedClient?.termsAcceptedAt;
  const sectionTitle =
    adminSection === "appointments"
      ? "Agenda"
      : adminSection === "delivery"
        ? "Livraison"
        : adminSection === "clients"
          ? "Clients"
          : adminSection === "stats"
            ? "Statistiques"
            : adminSection === "events"
              ? "Événements"
              : adminSection === "comms"
                ? "Communication"
                : adminSection === "settings"
                  ? "Réglages"
                  : "Hall principal";
  const sectionSubtitle =
    adminSection === "appointments"
      ? "Demandes en attente: validez le tarif et planifiez."
      : adminSection === "delivery"
        ? "Rendez-vous confirmés: compte-rendu, photos et passage en effectué."
        : adminSection === "clients"
          ? "Fiches, formules, BC'Coins et historique client."
          : adminSection === "stats"
            ? "Statistiques par mois et analytics (conversion, rétention, créneaux)."
            : adminSection === "events"
              ? "Événements, tirages et goodies à remettre."
              : adminSection === "comms"
                ? "E-mails groupés et annonces aux clients."
                : adminSection === "settings"
                  ? "Coordonnées de l'entreprise et notes de version."
                  : "Aperçu rapide — ouvrez une section pour travailler.";

  // Garde le rendez-vous selectionne coherent avec l'onglet agenda/livraison:
  // un RDV confirme quitte l'agenda, un RDV en attente quitte la livraison.
  React.useEffect(() => {
    if (adminSection !== "appointments" && adminSection !== "delivery") return;
    if (boardAppointments.length === 0) {
      if (selectedAppointmentId !== null) setSelectedAppointmentId(null);
      return;
    }
    if (!boardAppointments.some((appointment) => appointment.id === selectedAppointmentId)) {
      const fallback = pickDefaultAdminAppointment(boardAppointments) ?? boardAppointments[0];
      setSelectedAppointmentId(fallback.id);
      if (selectedClientId == null) {
        setSelectedClientId(fallback.clientId);
      }
    }
  }, [adminSection, boardAppointments, selectedAppointmentId, selectedClientId]);

  function appointmentAdminLink(appointment: AdminAppointment) {
    return `/admin/appointments?clientId=${appointment.clientId}&appointmentId=${appointment.id}`;
  }

  function clientAdminLink(client: AdminClient) {
    return `/admin/clients?clientId=${client.id}`;
  }

  function renderGoodiesPanel() {
    const sourceLabel: Record<string, string> = {
      review_box: "Box avis",
      event_consolation: "Consolation event",
    };
    return (
      <article className="bb-surface p-6">
        <div className="bb-section-head">
          <div>
            <p className="bb-eyebrow">Lots a remettre</p>
            <h2 className="bb-display mt-2 text-2xl font-semibold text-white">Cadeaux gagnes</h2>
          </div>
          {goodiePending > 0 && (
            <span className="bb-pill border-amber-300/25 bg-amber-300/10 text-amber-200">
              {goodiePending} a remettre
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["pending", "honored"] as const).map((filter) => (
            <button
              className={cn(
                "bb-button-ghost px-4 py-2",
                goodieFilter === filter && "border-accent/40 bg-accent/10 text-white",
              )}
              key={filter}
              onClick={() => setGoodieFilter(filter)}
              type="button"
            >
              {filter === "pending" ? "A remettre" : "Remis"}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-2">
          {goodies.length === 0 ? (
            <p className="text-sm text-white/45">
              {goodieFilter === "pending" ? "Aucun lot a remettre." : "Aucun lot remis."}
            </p>
          ) : (
            goodies.map((goodie) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-white/[0.03] p-4"
                key={goodie.id}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">
                    {goodie.clientName ?? "Client"} —{" "}
                    <span className="text-accentSoft">{goodie.rewardLabel}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-white/45">
                    {sourceLabel[goodie.source] ?? goodie.source} ·{" "}
                    {formatUnixDateTimeFR(goodie.createdAt)}
                  </p>
                </div>
                {goodie.status === "pending" ? (
                  <button
                    className="bb-button-brand px-4 py-2"
                    onClick={() => {
                      void honorGoodie(goodie.id, true);
                    }}
                    type="button"
                  >
                    Marquer remis
                  </button>
                ) : (
                  <button
                    className="bb-button-ghost px-4 py-2"
                    onClick={() => {
                      void honorGoodie(goodie.id, false);
                    }}
                    type="button"
                  >
                    Annuler
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </article>
    );
  }

  function renderEventsPanel() {
    const audienceLabel: Record<string, string> = {
      global: "Global",
      founder: "Fondateurs",
      bbx: "BBX",
    };
    return (
      <article className="bb-surface p-6">
        <div className="bb-section-head">
          <div>
            <p className="bb-eyebrow">Événements</p>
            <h2 className="bb-display mt-2 text-2xl font-semibold text-white">Jeux concours</h2>
          </div>
          <button className="bb-button-brand" onClick={openCreateEvent} type="button">
            <Plus className="mr-2 h-4 w-4" />
            Nouvel événement
          </button>
        </div>

        {eventDraft && (
          <div className="mt-5 rounded-[24px] border border-accent/25 bg-accent/[0.05] p-5">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">Titre</span>
                <input
                  className="bb-input"
                  onChange={(e) => setEventDraft((d) => (d ? { ...d, title: e.target.value } : d))}
                  value={eventDraft.title}
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">Description</span>
                <textarea
                  className="bb-textarea"
                  onChange={(e) =>
                    setEventDraft((d) => (d ? { ...d, description: e.target.value } : d))
                  }
                  value={eventDraft.description}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">Audience</span>
                <select
                  className="bb-select"
                  onChange={(e) => setEventDraft((d) => (d ? { ...d, audience: e.target.value } : d))}
                  value={eventDraft.audience}
                >
                  <option value="global">Global (tous)</option>
                  <option value="founder">Fondateurs</option>
                  <option value="bbx">BBX (non-fondateurs)</option>
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.16em] text-white/40">Debut</span>
                  <input
                    className="bb-input"
                    onChange={(e) => setEventDraft((d) => (d ? { ...d, startsAt: e.target.value } : d))}
                    type="date"
                    value={eventDraft.startsAt}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.16em] text-white/40">Fin</span>
                  <input
                    className="bb-input"
                    onChange={(e) => setEventDraft((d) => (d ? { ...d, endsAt: e.target.value } : d))}
                    type="date"
                    value={eventDraft.endsAt}
                  />
                </label>
              </div>
              <label className="space-y-2 md:col-span-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Condition de participation
                </span>
                <input
                  className="bb-input"
                  onChange={(e) =>
                    setEventDraft((d) => (d ? { ...d, conditionsText: e.target.value } : d))
                  }
                  placeholder="Ex: Liker et commenter ce post"
                  value={eventDraft.conditionsText}
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">Lien condition</span>
                <input
                  className="bb-input"
                  onChange={(e) =>
                    setEventDraft((d) => (d ? { ...d, conditionsLink: e.target.value } : d))
                  }
                  placeholder="https://..."
                  value={eventDraft.conditionsLink}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">Type de lot</span>
                <select
                  className="bb-select"
                  onChange={(e) => setEventDraft((d) => (d ? { ...d, prizeKind: e.target.value } : d))}
                  value={eventDraft.prizeKind}
                >
                  <option value="text">Texte libre (honore manuellement)</option>
                  <option value="inapp">In-app automatique</option>
                </select>
              </label>
              {eventDraft.prizeKind === "text" ? (
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.16em] text-white/40">Lot</span>
                  <input
                    className="bb-input"
                    onChange={(e) =>
                      setEventDraft((d) => (d ? { ...d, prizeText: e.target.value } : d))
                    }
                    placeholder="Ex: 1 detailing complet"
                    value={eventDraft.prizeText}
                  />
                </label>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-white/40">Récompense</span>
                    <select
                      className="bb-select"
                      onChange={(e) =>
                        setEventDraft((d) => (d ? { ...d, prizeInappType: e.target.value } : d))
                      }
                      value={eventDraft.prizeInappType}
                    >
                      <option value="credit">Crédits</option>
                      <option value="bc">BC'Coins</option>
                      <option value="founder_month">Mois fondateur</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-white/40">Quantite</span>
                    <input
                      className="bb-input"
                      min={0}
                      onChange={(e) =>
                        setEventDraft((d) => (d ? { ...d, prizeInappAmount: e.target.value } : d))
                      }
                      type="number"
                      value={eventDraft.prizeInappAmount}
                    />
                  </label>
                </div>
              )}
              <label className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
                <input
                  checked={eventDraft.isActive}
                  onChange={(e) => setEventDraft((d) => (d ? { ...d, isActive: e.target.checked } : d))}
                  type="checkbox"
                />
                <span>Actif (1 seul a la fois)</span>
              </label>
              <label className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
                <input
                  checked={eventDraft.consolationEnabled}
                  onChange={(e) =>
                    setEventDraft((d) => (d ? { ...d, consolationEnabled: e.target.checked } : d))
                  }
                  type="checkbox"
                />
                <span>Box de consolation</span>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="bb-button-brand"
                disabled={eventBusy}
                onClick={() => {
                  void saveEvent();
                }}
                type="button"
              >
                {eventBusy ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button className="bb-button-ghost" onClick={() => setEventDraft(null)} type="button">
                Annuler
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-3">
          {events.length === 0 ? (
            <p className="text-sm text-white/45">Aucun événement pour le moment.</p>
          ) : (
            events.map((event) => (
              <div
                className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4"
                key={event.id}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold text-white">{event.title}</span>
                  <span className="bb-pill border-white/10 bg-white/[0.04] text-white/60">
                    {audienceLabel[event.audience] ?? event.audience}
                  </span>
                  {event.isActive ? (
                    <span className="bb-pill border-emerald-300/30 bg-emerald-300/10 text-emerald-100">
                      Actif
                    </span>
                  ) : (
                    <span className="bb-pill border-white/10 bg-white/[0.04] text-white/45">Inactif</span>
                  )}
                  <span className="bb-pill border-white/10 bg-white/[0.04] text-white/60">
                    {event.participants} participant(s)
                  </span>
                  {event.winnerName && (
                    <span className="bb-pill border-accent/30 bg-accent/10 text-accentSoft">
                      Gagnant : {event.winnerName}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="bb-button-ghost px-3 py-2"
                    disabled={eventBusy}
                    onClick={() => {
                      void eventAction(event.id, "/active", { active: !event.isActive });
                    }}
                    type="button"
                  >
                    {event.isActive ? "Desactiver" : "Activer"}
                  </button>
                  <button
                    className="bb-button-ghost px-3 py-2"
                    disabled={eventBusy || !!event.drawnAt}
                    onClick={() => {
                      void eventAction(event.id, "/draw");
                    }}
                    type="button"
                  >
                    {event.drawnAt ? "Tirage fait" : "Tirer au sort"}
                  </button>
                  <button
                    className="bb-button-ghost px-3 py-2"
                    onClick={() => openEditEvent(event)}
                    type="button"
                  >
                    Modifier
                  </button>
                  <button
                    className="bb-button-ghost px-3 py-2"
                    disabled={participantsBusy && openParticipantsEventId === event.id}
                    onClick={() => {
                      void toggleEventParticipants(event.id);
                    }}
                    type="button"
                  >
                    <Users className="mr-1.5 h-4 w-4" />
                    {openParticipantsEventId === event.id ? "Masquer" : "Participants"}
                  </button>
                  <button
                    className="bb-button-ghost px-3 py-2 text-rose-100"
                    disabled={eventBusy}
                    onClick={() => {
                      void deleteEvent(event.id);
                    }}
                    type="button"
                  >
                    Supprimer
                  </button>
                </div>

                {openParticipantsEventId === event.id && (
                  <div className="mt-3 rounded-[18px] border border-white/10 bg-black/20 p-3">
                    {participantsBusy ? (
                      <p className="text-sm text-white/55">Chargement des participants...</p>
                    ) : (participantsByEvent[event.id]?.length ?? 0) === 0 ? (
                      <p className="text-sm text-white/55">Aucun participant pour le moment.</p>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-1 text-[11px] uppercase tracking-[0.14em] text-white/40">
                          <span>Participant</span>
                          <span>Tickets</span>
                        </div>
                        {participantsByEvent[event.id]?.map((p) => (
                          <div
                            className="flex items-center justify-between gap-3 rounded-[12px] border border-white/8 bg-white/[0.03] px-3 py-2"
                            key={p.clientId}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">
                                {p.clientName || "Client"}
                                {p.cardCode ? (
                                  <span className="ml-2 text-xs font-normal text-white/40">
                                    {p.cardCode}
                                  </span>
                                ) : null}
                                {p.isFounder ? (
                                  <span className="ml-2 text-xs font-normal text-accentSoft">
                                    Fondateur
                                  </span>
                                ) : null}
                              </p>
                              {p.consolationLabel ? (
                                <p className="truncate text-xs text-white/45">
                                  Lot : {p.consolationLabel}
                                </p>
                              ) : null}
                            </div>
                            <span className="shrink-0 text-sm font-bold text-accentSoft">
                              🎟️ {p.tickets}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </article>
    );
  }

  function renderStatsPage() {
    return (
      <>
        {renderStatsPanel()}
        {renderAnalyticsPanel()}
      </>
    );
  }

  function renderEventsPage() {
    return (
      <>
        {renderEventsPanel()}
        {renderGoodiesPanel()}
      </>
    );
  }

  function renderCommsPage() {
    return renderBroadcastPanel();
  }

  function renderSettingsPage() {
    return (
      <>
        {renderCompanySettingsPanel()}
        {renderPatchNotesPanel()}
      </>
    );
  }

  function renderHomePage() {
    return (
      <>
        <section className="bb-surface p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="bb-eyebrow">Tableau de bord</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Vue rapide</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="bb-pill border-white/10 bg-white/[0.04] text-white/55">
                v{APP_VERSION}
              </span>
              <span className="bb-pill border-emerald-300/25 bg-emerald-300/10 text-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {doneThisMonth} effectue{doneThisMonth > 1 ? "s" : ""} ce mois
              </span>
              <span
                className={cn(
                  "bb-pill",
                  clientsLowOnCredits > 0
                    ? "border-amber-300/25 bg-amber-300/10 text-amber-200"
                    : "border-white/10 bg-white/[0.04] text-white/60",
                )}
              >
                <Coins className="h-3.5 w-3.5" />
                {totalCreditsRemaining} credits
                {clientsLowOnCredits > 0 ? ` · ${clientsLowOnCredits} en tension` : ""}
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {firstPendingRequest && (
              <Link className="bb-button-brand" to={appointmentAdminLink(firstPendingRequest)}>
                <CalendarClock className="mr-2 h-4 w-4" />
                Prochaine demande
              </Link>
            )}
            {firstUpcomingAppointment && (
              <Link className="bb-button-ghost" to={appointmentAdminLink(firstUpcomingAppointment)}>
                <Clock3 className="mr-2 h-4 w-4" />
                Prochain passage
              </Link>
            )}
            <button className="bb-button-ghost" onClick={openCreateProfile} type="button">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau client
            </button>
            <button
              className="bb-button-ghost"
              disabled={exportingData}
              onClick={() => {
                void exportFullData();
              }}
              type="button"
            >
              <Download className="mr-2 h-4 w-4" />
              {exportingData ? "Export..." : "Exporter"}
            </button>
            <button
              className="bb-button-ghost"
              disabled={recapSending}
              onClick={() => {
                void sendYearRecap();
              }}
              type="button"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {recapSending ? "Envoi..." : "Envoyer le récap annuel"}
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { icon: CalendarClock, title: "Agenda", value: pendingRequests.length, sub: "en attente", to: "/admin/appointments" },
              { icon: Truck, title: "Livraison", value: upcomingAppointments.length, sub: "a preparer", to: "/admin/delivery" },
              { icon: Users, title: "Clients", value: clients.length, sub: "fiches", to: "/admin/clients" },
            ].map((tile) => {
              const TileIcon = tile.icon;
              return (
                <Link
                  className="bb-hover-lift group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-accent/40 hover:bg-accent/[0.06]"
                  key={tile.title}
                  to={tile.to}
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-accent/20 bg-accent/[0.08] text-accent">
                    <TileIcon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="text-2xl font-semibold tabular-nums text-white">{tile.value}</span>
                      <span className="text-sm font-medium text-white/80">{tile.title}</span>
                    </span>
                    <span className="mt-0.5 block text-xs text-white/45">{tile.sub}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-white/30 transition group-hover:translate-x-1 group-hover:text-accent" />
                </Link>
              );
            })}
          </div>
        </section>

        {/* Lanceur : acces direct a chaque section (fini le scroll infini) */}
        <section className="bb-surface p-5 md:p-6">
          <p className="bb-eyebrow">Sections</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Ou aller ?</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { to: adminSectionHrefs.stats, icon: BarChart3, title: "Statistiques", copy: "CA, RDV, rétention, créneaux." },
              { to: adminSectionHrefs.events, icon: Trophy, title: "Événements", copy: "Jeux, tirages et goodies." },
              { to: adminSectionHrefs.comms, icon: Mail, title: "Communication", copy: "E-mails groupés & annonces." },
              { to: adminSectionHrefs.settings, icon: Settings, title: "Réglages", copy: "Entreprise & notes de version." },
            ].map((tile) => {
              const TileIcon = tile.icon;
              return (
                <Link
                  className="bb-hover-lift group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-accent/40 hover:bg-accent/[0.06]"
                  key={tile.title}
                  to={tile.to}
                >
                  <span className="inline-flex rounded-xl border border-accent/20 bg-accent/[0.08] p-2.5 text-accent transition group-hover:scale-110">
                    <TileIcon className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-white">{tile.title}</p>
                  <p className="mt-1 text-xs leading-5 text-white/55">{tile.copy}</p>
                </Link>
              );
            })}
          </div>
        </section>
      </>
    );
  }

  // Composer d'e-mails groupes (segments + texte libre mis en forme).
  function renderBroadcastPanel() {
    return (
      <article className="bb-surface p-5 md:p-6">
        <div className="bb-section-head">
          <div>
            <p className="bb-eyebrow">Communication</p>
            <h2 className="mt-1 text-xl font-semibold text-white">E-mail groupe</h2>
            <p className="mt-1 text-sm text-white/55">
              Envoie un message mis en forme a un segment de clients.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs uppercase tracking-[0.16em] text-white/40">Destinataires</span>
              <select
                className="bb-select"
                onChange={(event) => setBroadcast((p) => ({ ...p, segment: event.target.value }))}
                value={broadcast.segment}
              >
                {BROADCAST_SEGMENTS.map((seg) => (
                  <option key={seg.value} value={seg.value}>
                    {seg.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                Objet (optionnel)
              </span>
              <input
                className="bb-input"
                onChange={(event) => setBroadcast((p) => ({ ...p, subject: event.target.value }))}
                placeholder="[Bryan Cars] ..."
                value={broadcast.subject}
              />
            </label>
          </div>
          <label className="space-y-1.5">
            <span className="text-xs uppercase tracking-[0.16em] text-white/40">Titre</span>
            <input
              className="bb-input"
              onChange={(event) => setBroadcast((p) => ({ ...p, title: event.target.value }))}
              placeholder="Le titre affiche dans l'e-mail"
              value={broadcast.title}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs uppercase tracking-[0.16em] text-white/40">Message</span>
            <textarea
              className="bb-textarea"
              onChange={(event) => setBroadcast((p) => ({ ...p, body: event.target.value }))}
              placeholder="Ton message... (sauts de ligne conserves)"
              rows={5}
              value={broadcast.body}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                Bouton — texte (optionnel)
              </span>
              <input
                className="bb-input"
                onChange={(event) => setBroadcast((p) => ({ ...p, buttonLabel: event.target.value }))}
                placeholder="Ex: Reserver"
                value={broadcast.buttonLabel}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                Bouton — lien
              </span>
              <input
                className="bb-input"
                onChange={(event) => setBroadcast((p) => ({ ...p, buttonUrl: event.target.value }))}
                placeholder="https://..."
                value={broadcast.buttonUrl}
              />
            </label>
          </div>
          <div>
            <button
              className="bb-button-brand"
              disabled={broadcastSending}
              onClick={() => {
                void sendBroadcast();
              }}
              type="button"
            >
              <Mail className="mr-2 h-4 w-4" />
              {broadcastSending ? "Envoi..." : "Envoyer l'e-mail groupe"}
            </button>
          </div>
        </div>
      </article>
    );
  }

  // Reglages societe (mentions sur les factures clients).
  function renderCompanySettingsPanel() {
    const fields: Array<{ key: string; label: string; placeholder: string; full?: boolean }> = [
      { key: "name", label: "Raison sociale", placeholder: "Bryan Cars" },
      { key: "legalForm", label: "Forme / statut", placeholder: "Auto-entrepreneur" },
      { key: "address", label: "Adresse", placeholder: "12 rue ...", full: true },
      { key: "city", label: "Code postal + ville", placeholder: "71500 Louhans" },
      { key: "siret", label: "SIRET", placeholder: "123 456 789 00012" },
      { key: "email", label: "E-mail", placeholder: "contact@..." },
      { key: "phone", label: "Telephone", placeholder: "06 ..." },
      {
        key: "vatNote",
        label: "Mention TVA",
        placeholder: "TVA non applicable, art. 293 B du CGI",
        full: true,
      },
    ];
    return (
      <article className="bb-surface p-5 md:p-6">
        <div className="bb-section-head">
          <div>
            <p className="bb-eyebrow">Société</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Mentions des factures</h2>
            <p className="mt-1 text-sm text-white/55">
              Ces informations apparaissent sur les factures clients.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {fields.map((field) => (
            <label className={cn("space-y-1.5", field.full && "sm:col-span-2")} key={field.key}>
              <span className="text-xs uppercase tracking-[0.16em] text-white/40">{field.label}</span>
              <input
                className="bb-input"
                onChange={(event) =>
                  setCompanySettings((prev) => ({ ...prev, [field.key]: event.target.value }))
                }
                placeholder={field.placeholder}
                value={companySettings[field.key] ?? ""}
              />
            </label>
          ))}
        </div>
        <div className="mt-4">
          <button
            className="bb-button-brand"
            disabled={companySaving}
            onClick={() => {
              void saveCompanySettings();
            }}
            type="button"
          >
            {companySaving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </article>
    );
  }

  // Tableau de bord statistiques (par mois).
  function renderStatsPanel() {
    const MONTHS = [
      "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
    ];
    const s = statsData;
    const euro = (cents: number) => `${(cents / 100).toFixed(2).replace(".", ",")} €`;
    const tiles = s
      ? [
          { label: "CA encaisse", value: euro(s.revenueCents), sub: `${s.payments} paiement(s)` },
          { label: "RDV effectués", value: String(s.appointments.done), sub: `sur ${s.appointmentsTotal} RDV` },
          { label: "En attente", value: String(s.appointments.requested), sub: "a traiter" },
          { label: "Confirmes", value: String(s.appointments.confirmed), sub: "a faire" },
          { label: "Annules", value: String(s.appointments.cancelled), sub: "ce mois" },
          { label: "Crédits consommés", value: String(s.creditsConsumed), sub: "sur RDV effectués" },
          { label: "BC'Coins distribues", value: String(s.bcDistributed), sub: "ce mois" },
          { label: "Nouveaux clients", value: String(s.newClients), sub: "ce mois" },
        ]
      : [];
    return (
      <section className="bb-surface p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="bb-eyebrow">Statistiques</p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              {MONTHS[statsMonth]} {statsYear}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="bb-button-ghost h-10 w-10 rounded-full px-0"
              onClick={() => shiftStatsMonth(-1)}
              type="button"
              aria-label="Mois précédent"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
            </button>
            <button
              className="bb-button-ghost h-10 w-10 rounded-full px-0"
              onClick={() => shiftStatsMonth(1)}
              type="button"
              aria-label="Mois suivant"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((tile) => (
            <div
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              key={tile.label}
            >
              <p className="text-2xl font-semibold tabular-nums text-white">{tile.value}</p>
              <p className="mt-1 text-sm font-medium text-white/80">{tile.label}</p>
              <p className="mt-0.5 text-xs text-white/45">{tile.sub}</p>
            </div>
          ))}
        </div>

        {s && (
          <p className="mt-4 text-xs text-white/45">
            Total : {s.totalClients} client(s) · {s.totalFounders} fondateur(s) · {s.activeEvents}{" "}
            evenement(s) actif(s)
          </p>
        )}
      </section>
    );
  }

  // Analytics: funnel inscription, cohortes de retention, heatmap creneaux.
  function renderAnalyticsPanel() {
    if (!analytics) return null;
    const a = analytics;
    const cohort = (label: string, c: AdminRetentionCohort) => (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm font-semibold text-white">{label}</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-white/60">
          <span>Total : <b className="text-white/85">{c.total}</b></span>
          <span>Deja venus : <b className="text-white/85">{c.withVisit}</b></span>
          <span>Actifs 90j : <b className="text-white/85">{c.active90}</b></span>
          <span>Fideles (2+) : <b className="text-white/85">{c.repeat}</b></span>
        </div>
      </div>
    );
    const WD = [
      { i: 1, l: "Lun" }, { i: 2, l: "Mar" }, { i: 3, l: "Mer" }, { i: 4, l: "Jeu" },
      { i: 5, l: "Ven" }, { i: 6, l: "Sam" }, { i: 0, l: "Dim" },
    ];
    const maxHeat = Math.max(1, ...Object.values(a.heatmap));
    const cell = (wd: number, slot: "morning" | "afternoon") => {
      const n = a.heatmap[`${wd}-${slot}`] || 0;
      const alpha = n === 0 ? 0 : 0.12 + 0.6 * (n / maxHeat);
      return (
        <div
          className="grid h-9 place-items-center rounded-lg border border-white/8 text-xs font-semibold text-white/85"
          key={`${wd}-${slot}`}
          style={{ background: `rgb(var(--bb-accent-rgb)/${alpha})` }}
          title={`${n} RDV`}
        >
          {n || ""}
        </div>
      );
    };
    return (
      <article className="bb-surface p-5 md:p-6">
        <div className="bb-section-head">
          <div>
            <p className="bb-eyebrow">Analytics</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Donnees & retention</h2>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-white/40">Inscriptions</p>
            <p className="mt-2 text-2xl font-semibold text-white">{a.funnel.rate}%</p>
            <p className="mt-0.5 text-xs text-white/45">
              {a.funnel.used}/{a.funnel.requested} codes utilises -&gt; comptes crees
            </p>
          </div>
          {cohort("BBX", a.retention.bbx)}
          {cohort("Fondateurs", a.retention.founders)}
        </div>

        <p className="mt-5 text-xs uppercase tracking-[0.16em] text-white/40">
          Creneaux demandes (180 j)
        </p>
        <div className="mt-3 grid grid-cols-[auto_1fr_1fr] items-center gap-2">
          <span />
          <span className="text-center text-xs text-white/45">Matin</span>
          <span className="text-center text-xs text-white/45">Apres-midi</span>
          {WD.map((d) => (
            <React.Fragment key={d.i}>
              <span className="text-xs text-white/55">{d.l}</span>
              {cell(d.i, "morning")}
              {cell(d.i, "afternoon")}
            </React.Fragment>
          ))}
        </div>
      </article>
    );
  }

  // Notes de version (changelog) consultables par l'admin.
  function renderPatchNotesPanel() {
    return (
      <article className="bb-surface p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="bb-eyebrow">Notes de version</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Ou en est l&apos;appli</h2>
          </div>
          <span className="bb-pill border-accent/30 bg-accent/10 text-accentSoft">
            Version actuelle v{APP_VERSION}
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {PATCH_NOTES.map((note, index) => (
            <div
              className={cn(
                "rounded-[20px] border p-4",
                index === 0
                  ? "border-accent/30 bg-accent/[0.06]"
                  : "border-white/10 bg-white/[0.03]",
              )}
              key={note.version}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-semibold text-white">v{note.version}</span>
                {index === 0 && (
                  <span className="bb-pill border-emerald-300/25 bg-emerald-300/10 text-emerald-200">
                    Dernière
                  </span>
                )}
                <span className="text-xs text-white/40">{note.date}</span>
              </div>
              <p className="mt-1 text-sm font-medium text-white/85">{note.title}</p>
              <ul className="mt-2 space-y-1.5">
                {note.changes.map((change, i) => (
                  <li className="flex gap-2 text-sm leading-6 text-white/65" key={i}>
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/70" />
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </article>
    );
  }

  function renderAppointmentsPage() {
    const visiblePendingRequests = pendingRequests.slice(0, 4);
    const remainingPendingRequests = Math.max(
      pendingRequests.length - visiblePendingRequests.length,
      0,
    );
    return (
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
          <div className="order-2 space-y-4 xl:order-none">
            {/* ── Inbox prioritaire ── */}
            <article className="bb-surface p-6">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="bb-eyebrow">Étape 1</p>
                    <h2 className="bb-display mt-2 text-2xl font-semibold text-white">
                      Choisir un rendez-vous
                    </h2>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      className="bb-metric text-left transition duration-200 hover:border-amber-300/30"
                      onClick={() => {
                        (pendingRef.current ?? appointmentListRef.current)?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                      type="button"
                    >
                      <span className="mb-3 inline-grid h-9 w-9 place-items-center rounded-xl border border-amber-300/25 bg-amber-300/10 text-amber-200">
                        <Inbox className="h-4 w-4" />
                      </span>
                      <p className="text-xs uppercase tracking-[0.16em] text-white/35">
                        En attente
                      </p>
                      <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                        {pendingRequests.length}
                      </p>
                    </button>
                    <div className="bb-metric">
                      <span className="mb-3 inline-grid h-9 w-9 place-items-center rounded-xl border border-sky-300/25 bg-sky-300/10 text-sky-200">
                        <CalendarClock className="h-4 w-4" />
                      </span>
                      <p className="text-xs uppercase tracking-[0.16em] text-white/35">
                        Visibles
                      </p>
                      <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                        {filteredAgendaAppointments.length}
                      </p>
                    </div>
                  </div>
                </div>

                {globalAppointmentsLoading ? (
                  <div className="bb-surface flex items-center gap-3 px-5 py-4 text-sm text-white/65">
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                    Chargement des rendez-vous...
                  </div>
                ) : boardTab === "agenda" && pendingRequests.length > 0 ? (
                  <div ref={pendingRef} className="scroll-mt-4 rounded-[28px] border border-amber-300/20 bg-amber-300/[0.06] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-grid h-10 w-10 place-items-center rounded-xl border border-amber-300/25 bg-amber-300/10 text-amber-200">
                          <Inbox className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="bb-eyebrow">Priorite</p>
                          <h3 className="bb-display mt-1 text-xl font-semibold text-white">
                            Demandes en attente
                          </h3>
                        </div>
                      </div>
                      <div className="bb-pill border-amber-300/25 bg-amber-300/10 text-amber-100">
                        {pendingRequests.length} a traiter
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-white/55">
                      Ouvrez un dossier pour le traiter dans la colonne de droite.
                    </p>

                    <div className="mt-5 space-y-3">
                      {visiblePendingRequests.map((appointment, idx) => {
                        const active = appointment.id === selectedAppointmentId;
                        return (
                          <button
                            className={cn(
                              "bb-hover-lift group w-full rounded-[24px] border p-4 text-left transition duration-200",
                              active
                                ? "border-accent/45 bg-accent/10 shadow-[0_18px_48px_rgb(var(--bb-accent-rgb)/0.12)]"
                                : "border-white/10 bg-black/20 hover:border-amber-300/20",
                              `bb-rise bb-rise-${Math.min(idx + 2, 4)}`,
                            )}
                            key={appointment.id}
                            onClick={() => focusAppointment(appointment)}
                            type="button"
                          >
                            <div className="flex items-start gap-3">
                              <span className={cn(
                                "mt-0.5 inline-grid h-9 w-9 shrink-0 place-items-center rounded-xl border",
                                active
                                  ? "border-amber-300/35 bg-amber-300/15 text-amber-200"
                                  : "border-amber-300/20 bg-amber-300/[0.08] text-amber-300",
                              )}>
                                <Clock3 className="h-4 w-4" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-base font-semibold text-white">
                                    {appointment.clientName || "Client"}
                                  </h4>
                                  <div className="bb-pill border-amber-300/25 bg-amber-300/10 text-amber-100">
                                    {slotLabel(appointmentSlot(appointment))}
                                  </div>
                                  <div
                                    className={cn(
                                      "bb-pill",
                                      locationClasses(appointment.location),
                                    )}
                                  >
                                    {locationLabel(appointment.location)}
                                  </div>
                                </div>
                                <p className="mt-1 text-sm text-white/55">
                                  {formatDateFR(appointment.date)} &middot;{" "}
                                  {slotWindowLabel(appointmentSlot(appointment))} &middot;{" "}
                                  {formatTimeHHMM(appointment.time)}
                                </p>
                                <p className="mt-1 text-sm text-white/45">
                                  {appointment.vehicleModel || "Véhicule non renseigne"}
                                </p>
                                {appointment.goodies && appointment.goodies.length > 0 && (
                                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/12 px-3 py-1 text-xs font-semibold text-accent">
                                    <Gift className="h-3.5 w-3.5" />
                                    Lot a remettre : {appointment.goodies.join(", ")}
                                  </p>
                                )}
                              </div>
                              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-white/30 transition group-hover:translate-x-1 group-hover:text-accent" />
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {remainingPendingRequests > 0 && (
                      <p className="mt-4 text-sm text-white/55">
                        {remainingPendingRequests} autre(s) demande(s) restent visibles dans la liste complete ci-dessous.
                      </p>
                    )}
                  </div>
                ) : boardTab === "agenda" ? (
                  <div className="flex flex-col items-center gap-3 rounded-[28px] border border-emerald-300/20 bg-emerald-300/[0.05] p-8 text-center">
                    <span className="inline-grid h-12 w-12 place-items-center rounded-2xl border border-emerald-300/25 bg-emerald-300/10 text-emerald-200">
                      <CheckCircle2 className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-base font-semibold text-white">
                        Rien en attente pour le moment
                      </p>
                      <p className="mt-1 text-sm leading-6 text-white/55">
                        La liste ci-dessous contient maintenant uniquement le planning a suivre.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </article>

            {/* ── Liste complete par jour ── */}
            <section className="bb-surface p-6" ref={appointmentListRef}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="bb-eyebrow">Liste complete</p>
                  <h3 className="bb-display mt-2 text-xl font-semibold text-white">
                    {boardTab === "agenda" ? "Rendez-vous en attente" : "Rendez-vous confirmés"}
                  </h3>
                </div>
                <div className="bb-pill border-white/12 bg-white/[0.04] text-white/70">
                  {filteredAgendaAppointments.length} resultat(s)
                </div>
              </div>

              <div className="mt-5">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <input
                    className="bb-input pl-11"
                    onChange={(event) => setAppointmentQuery(event.target.value)}
                    placeholder="Client, véhicule, note, date..."
                    value={appointmentQuery}
                  />
                </div>

                {boardTab === "livraison" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(
                      [
                        { key: "all", label: "Tous" },
                        { key: "confirmed", label: "A faire" },
                        { key: "done", label: "Effectues" },
                      ] as const
                    ).map((option) => (
                      <button
                        className={cn(
                          "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition duration-200",
                          livraisonFilter === option.key
                            ? "border-accent/45 bg-accent/10 text-white"
                            : "border-white/10 bg-white/[0.03] text-white/65 hover:bg-white/[0.05]",
                        )}
                        key={option.key}
                        onClick={() => setLivraisonFilter(option.key)}
                        type="button"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-6">
                {globalAppointmentsLoading ? (
                  <div className="bb-surface flex items-center gap-3 px-5 py-4 text-sm text-white/65">
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                    Chargement de l'agenda...
                  </div>
                ) : agendaSections.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-[24px] border border-white/10 bg-black/20 p-8 text-center">
                    <span className="inline-grid h-12 w-12 place-items-center rounded-2xl border border-white/12 bg-white/[0.04] text-white/40">
                      <CalendarClock className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-base font-semibold text-white">
                        {boardTab === "agenda" ? "Aucune demande en attente" : "Aucun rendez-vous confirmé"}
                      </p>
                      <p className="mt-1 max-w-xs text-sm leading-6 text-white/55">
                        {boardTab === "agenda"
                          ? "Toutes les demandes ont ete traitees ou annulees."
                          : "Confirmez un rendez-vous depuis l'onglet Agenda pour le retrouver ici."}
                      </p>
                    </div>
                  </div>
                ) : (
                  agendaSections.map((section) => (
                    <div key={section.date}>
                      <div className="mb-3 flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="bb-eyebrow">Jour</p>
                          <h4 className="bb-display mt-1 text-lg font-semibold capitalize text-white">
                            {formatDateFR(section.date, { weekday: "long" })}
                          </h4>
                        </div>
                        <div className="bb-pill border-white/12 bg-white/[0.04] text-white/55">
                          {section.items.length} rdv
                        </div>
                      </div>

                      <div className="space-y-3">
                        {section.items.map((appointment, idx) => {
                          const active = appointment.id === selectedAppointmentId;
                          const highlighted = appointment.id === highlightAppointmentId;
                          const statusTints: Record<string, string> = {
                            requested: "border-amber-300/25 bg-amber-300/10 text-amber-200",
                            confirmed: "border-sky-300/25 bg-sky-300/10 text-sky-200",
                            done: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
                            cancelled: "border-rose-300/25 bg-rose-300/10 text-rose-200",
                          };
                          const iconTint = statusTints[appointment.status] ?? "border-white/12 bg-white/[0.04] text-white/50";

                          return (
                            <button
                              className={cn(
                                "bb-hover-lift group w-full rounded-[22px] border p-4 text-left transition duration-200",
                                active
                                  ? "border-accent/45 bg-accent/10 shadow-[0_18px_48px_rgb(var(--bb-accent-rgb)/0.12)]"
                                  : "border-white/10 bg-black/20 hover:border-white/20",
                                highlighted && "ring-1 ring-accent/40",
                                `bb-rise bb-rise-${Math.min(idx + 2, 4)}`,
                              )}
                              key={appointment.id}
                              onClick={() => focusAppointment(appointment)}
                              type="button"
                            >
                              <div className="flex items-start gap-3">
                                <span className={cn("mt-0.5 inline-grid h-9 w-9 shrink-0 place-items-center rounded-xl border", iconTint)}>
                                  <CalendarClock className="h-4 w-4" />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="text-base font-semibold text-white">
                                      {appointment.clientName || "Client"}
                                    </h4>
                                    <div
                                      className={cn(
                                        "bb-pill",
                                        appointmentStatusClasses(appointment.status),
                                      )}
                                    >
                                      {appointmentStatusLabel(appointment.status)}
                                    </div>
                                    <div
                                      className={cn(
                                        "bb-pill",
                                        locationClasses(appointment.location),
                                      )}
                                    >
                                      {locationLabel(appointment.location)}
                                    </div>
                                    <div className="bb-pill border-white/12 bg-white/[0.04] text-white/60">
                                      {slotLabel(appointmentSlot(appointment))}
                                    </div>
                                  </div>
                                  <p className="mt-1 text-sm text-white/55">
                                    {slotWindowLabel(appointmentSlot(appointment))} &middot;{" "}
                                    {formatTimeHHMM(appointment.time)}
                                  </p>
                                  <p className="mt-1 text-sm text-white/40">
                                    {appointment.vehicleModel || "Vehicule"}
                                  </p>
                                  {(appointment.adminNote || appointment.clientNote) && (
                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                                      {previewText(
                                        appointment.adminNote || appointment.clientNote,
                                        "",
                                      )}
                                    </p>
                                  )}
                                  {appointment.goodies && appointment.goodies.length > 0 && (
                                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/12 px-3 py-1 text-xs font-semibold text-accent">
                                      <Gift className="h-3.5 w-3.5" />
                                      Lot a remettre : {appointment.goodies.join(", ")}
                                    </p>
                                  )}
                                </div>
                                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-white/30 transition group-hover:translate-x-1 group-hover:text-accent" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* ── Panneau de traitement ── */}
          <aside className="order-1 xl:sticky xl:top-6 xl:order-none xl:self-start">
            <article className="bb-surface self-start p-6" ref={appointmentWorkspaceRef}>
              <div className="bb-section-head">
                <div>
                  <p className="bb-eyebrow">Étape 2</p>
                  <h2 className="bb-display mt-2 text-2xl font-semibold text-white">
                    {selectedAppointment ? "Traiter ce rendez-vous" : "Traiter ce rendez-vous"}
                  </h2>
                </div>
                {selectedAppointment && (
                  <div
                    className={cn(
                      "bb-pill",
                      appointmentStatusClasses(selectedAppointment.status),
                    )}
                  >
                    {appointmentStatusLabel(selectedAppointment.status)}
                  </div>
                )}
              </div>

              {selectedAppointment &&
                selectedOnBoard &&
                selectedAppointment.goodies &&
                selectedAppointment.goodies.length > 0 && (
                  <div className="mt-5 flex items-start gap-3 rounded-[24px] border border-accent/45 bg-accent/12 p-4 shadow-[0_0_36px_rgb(var(--bb-accent-rgb)/0.15)]">
                    <span className="mt-0.5 inline-grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-accent/45 bg-accent/15 text-accent">
                      <Gift className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-accent">
                        Lot(s) a remettre sur ce rendez-vous
                      </p>
                      <p className="mt-1 text-sm leading-6 text-white/80">
                        {selectedAppointment.goodies.join(", ")}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-white/45">
                        A donner au client lors de ce passage. Le passage en « Effectué » validé la remise.
                      </p>
                    </div>
                  </div>
                )}

              {!selectedAppointment || !selectedOnBoard ? (
                <div className="mt-6 flex flex-col items-center gap-3 rounded-[28px] border border-white/10 bg-white/[0.03] p-8 text-center">
                  <span className="inline-grid h-12 w-12 place-items-center rounded-2xl border border-white/12 bg-white/[0.04] text-white/35">
                    <CalendarClock className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-white">Aucun rendez-vous sélectionné</p>
                    <p className="mt-1 text-sm leading-6 text-white/55">
                      {boardTab === "agenda"
                        ? "Choisissez une demande en attente a gauche."
                        : "Choisissez un rendez-vous confirmé a gauche pour le traiter."}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Resume + actions rapides */}
                  <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="bb-eyebrow">Resume</p>
                        <h3 className="bb-display mt-2 text-2xl font-semibold text-white">
                          {selectedAppointment.clientName || "Client"}
                        </h3>
                        <p className="mt-2 text-sm text-white/55">
                          {formatDateFR(selectedAppointment.date)} &middot; {slotLabel(
                            appointmentSlot(selectedAppointment),
                          )}{" "}
                          {slotWindowLabel(appointmentSlot(selectedAppointment))} &middot;{" "}
                          {formatTimeHHMM(selectedAppointment.time)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <div className="bb-pill border-white/12 bg-white/[0.04] text-white/70">
                          {slotLabel(appointmentSlot(selectedAppointment))}
                        </div>
                        <div
                          className={cn(
                            "bb-pill",
                            locationClasses(selectedAppointment.location),
                          )}
                        >
                          {locationLabel(selectedAppointment.location)}
                        </div>
                      </div>
                    </div>

                    {(selectedAppointment.status === "requested" ||
                      selectedAppointment.status === "confirmed") && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          className="bb-button-ghost px-3 py-2"
                          onClick={() => downloadIcs(adminCalendarEvent(selectedAppointment))}
                          type="button"
                        >
                          <CalendarPlus className="mr-2 h-4 w-4" />
                          Ajouter a l&apos;agenda
                        </button>
                        <a
                          className="bb-button-ghost px-3 py-2"
                          href={googleCalendarUrl(adminCalendarEvent(selectedAppointment))}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Google
                        </a>
                      </div>
                    )}

                    {selectedAppointmentActions && (
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <button
                          className={selectedAppointmentActions.primary.className}
                          disabled={
                            busyAction || selectedAppointmentActions.primary.disabled
                          }
                          onClick={() => {
                            if (selectedAppointmentActions.primary.disabled) return;
                            void changeStatus(
                              selectedAppointment.id,
                              selectedAppointmentActions.primary.nextStatus,
                            );
                          }}
                          type="button"
                        >
                          <selectedAppointmentActions.primary.icon className="mr-2 h-4 w-4" />
                          {selectedAppointmentActions.primary.label}
                        </button>
                        <button
                          className={selectedAppointmentActions.secondary.className}
                          disabled={
                            busyAction || selectedAppointmentActions.secondary.disabled
                          }
                          onClick={() => {
                            if (selectedAppointmentActions.secondary.disabled) return;
                            void changeStatus(
                              selectedAppointment.id,
                              selectedAppointmentActions.secondary.nextStatus,
                            );
                          }}
                          type="button"
                        >
                          <selectedAppointmentActions.secondary.icon className="mr-2 h-4 w-4" />
                          {selectedAppointmentActions.secondary.label}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Demande client */}
                  <div className="mt-4 rounded-[28px] border border-accent/18 bg-[linear-gradient(180deg,rgb(var(--bb-accent-rgb)/0.08),rgba(255,255,255,0.02))] p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="inline-grid h-9 w-9 place-items-center rounded-xl border border-accent/25 bg-accent/10 text-[#ffe8a8]">
                          <Inbox className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="bb-eyebrow">Demande client</p>
                          <h3 className="bb-display mt-1 text-lg font-semibold text-white">
                            A lire avant validation
                          </h3>
                        </div>
                      </div>
                      <div className="bb-pill border-white/12 bg-white/[0.04] text-white/70">
                        {clientRequestPhotos.length} photo
                        {clientRequestPhotos.length > 1 ? "s" : ""} client
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3">
                      <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                        <p className="bb-eyebrow mb-2">Commentaire client</p>
                        <p className="text-sm leading-6 text-white/70">
                          {selectedAppointment.clientNote || "Aucun commentaire client."}
                        </p>
                      </div>

                      <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="bb-eyebrow">Photos envoyees a la demande</p>
                          {photosLoading && (
                            <Loader2 className="h-4 w-4 animate-spin text-accent" />
                          )}
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          {!photosLoading && clientRequestPhotos.length === 0 && (
                            <div className="sm:col-span-3 flex flex-col items-center gap-2 rounded-[20px] border border-dashed border-white/10 bg-black/15 px-4 py-6 text-center">
                              <Camera className="h-5 w-5 text-white/25" />
                              <p className="text-sm text-white/40">Aucune photo client jointe a cette demande.</p>
                            </div>
                          )}

                          {clientRequestPhotos.map((photo) => (
                            <div className="space-y-2" key={photo.id}>
                              <button
                                className="block overflow-hidden rounded-[22px] border border-white/10 bg-black/30"
                                onClick={() =>
                                  openLightbox(
                                    clientRequestPhotos.map((entry) => ({
                                      id: `request-${entry.id}`,
                                      url: entry.url,
                                      label: entry.caption,
                                    })),
                                    photo.url,
                                  )
                                }
                                type="button"
                              >
                                <img
                                  alt={photo.caption || "Photo client"}
                                  className="h-28 w-full object-cover transition duration-300 hover:scale-[1.04]"
                                  src={photo.url}
                                />
                              </button>
                              <p className="min-w-0 text-xs text-white/45">
                                {photo.caption || "Photo envoyee par le client"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedAppointment.status === "requested" && (
                  <div className="mt-4 rounded-[28px] border border-accent/20 bg-[linear-gradient(180deg,rgb(var(--bb-accent-rgb)/0.08),rgba(255,255,255,0.02))] p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="bb-eyebrow">Tarif a valider</p>
                        <h3 className="bb-display mt-2 text-xl font-semibold text-white">
                          {selectedAppointment.priceStatus === "waiting_photos"
                            ? "Photos demandées"
                            : selectedAppointment.priceStatus === "waiting_client_approval"
                              ? "En attente accord client"
                              : selectedAppointment.priceStatus === "waiting_payment"
                                ? "Le client doit recharger"
                                : selectedAppointment.priceStatus === "approved"
                                  ? "Tarif validé et crédits consommés"
                                  : "Controle admin requis"}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-white/62">
                          Estimation client: {selectedAppointment.requestedCredits || 1} credit
                          {(selectedAppointment.requestedCredits || 1) > 1 ? "s" : ""}.
                          {selectedAppointment.approvedCredits
                            ? ` Tarif admin: ${selectedAppointment.approvedCredits} credit${
                                selectedAppointment.approvedCredits > 1 ? "s" : ""
                              }.`
                            : " Vous pouvez confirmer, modifier ou demander des photos."}
                        </p>
                      </div>
                      <div className="bb-pill border-white/12 bg-white/[0.04] text-white/75">
                        {selectedAppointment.creditsCharged || 0} credit
                        {(selectedAppointment.creditsCharged || 0) > 1 ? "s" : ""} consomme
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      {[
                        { value: "very_clean" as const, label: "Propre", credits: 1 },
                        { value: "correct" as const, label: "Correct", credits: 2 },
                        { value: "dirty" as const, label: "Sale", credits: 3 },
                      ].map((option) => (
                        <button
                          className={cn(
                            "rounded-[22px] border p-4 text-left transition duration-200",
                            cleanlinessDrafts[selectedAppointment.id] === option.value
                              ? "border-accent/45 bg-accent/10 text-white"
                              : "border-white/10 bg-black/20 text-white/65 hover:bg-white/[0.04]",
                          )}
                          key={option.value}
                          onClick={() =>
                            setCleanlinessDrafts((current) => ({
                              ...current,
                              [selectedAppointment.id]: option.value,
                            }))
                          }
                          type="button"
                        >
                          <p className="text-base font-semibold text-white">{option.label}</p>
                          <p className="mt-2 text-sm text-white/58">
                            {option.credits} credit{option.credits > 1 ? "s" : ""}
                          </p>
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-[0.8fr_1.2fr]">
                      <label className="space-y-2">
                        <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                          Prix personnalise
                        </span>
                        <input
                          className="bb-input"
                          min={1}
                          onChange={(event) =>
                            setCustomCreditDrafts((current) => ({
                              ...current,
                              [selectedAppointment.id]: event.target.value,
                            }))
                          }
                          placeholder="Ex: 6 crédits"
                          type="number"
                          value={customCreditDrafts[selectedAppointment.id] ?? ""}
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                          Message demande photos
                        </span>
                        <input
                          className="bb-input"
                          onChange={(event) =>
                            setPhotoRequestDrafts((current) => ({
                              ...current,
                              [selectedAppointment.id]: event.target.value,
                            }))
                          }
                          placeholder="Merci d'ajouter des photos de l'interieur et de l'exterieur."
                          value={photoRequestDrafts[selectedAppointment.id] ?? ""}
                        />
                      </label>
                    </div>

                    <label className="mt-4 block space-y-2">
                      <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                        Commentaire / justification du tarif
                      </span>
                      <textarea
                        className="bb-textarea"
                        onChange={(event) =>
                          setPriceCommentDrafts((current) => ({
                            ...current,
                            [selectedAppointment.id]: event.target.value,
                          }))
                        }
                        placeholder="Explique au client pourquoi ce tarif (etat du véhicule, prestation...)"
                        value={priceCommentDrafts[selectedAppointment.id] ?? ""}
                      />
                    </label>
                    {selectedAppointment.priceComment && (
                      <p className="mt-2 text-xs text-white/45">
                        Note enregistree: {selectedAppointment.priceComment}
                      </p>
                    )}

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <button
                        className="bb-button-brand justify-center"
                        disabled={busyAction}
                        onClick={() => {
                          void changeStatus(selectedAppointment.id, "confirmed");
                        }}
                        type="button"
                      >
                        Valider ce tarif
                      </button>
                      <button
                        className="bb-button-ghost justify-center"
                        disabled={busyAction}
                        onClick={() => {
                          void requestClientPhotos(selectedAppointment.id);
                        }}
                        type="button"
                      >
                        Demander des photos
                      </button>
                    </div>
                  </div>
                  )}

                  {/* Infos utiles */}
                  <div className="mt-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                    <p className="bb-eyebrow mb-4">Infos utiles</p>
                    <div className="grid gap-3">
                      <div className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-black/20 p-4">
                        <span className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-sky-300/25 bg-sky-300/10 text-sky-200">
                          <CarFront className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-white/35">Véhicule</p>
                          <p className="mt-1 text-sm font-semibold text-white">
                            {selectedAppointment.vehicleModel || "Véhicule non renseigne"}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-white/35">
                          Avis client
                        </p>
                        <p className="mt-2 text-sm leading-6 text-white/50">
                          La note etoilee et le commentaire client sont visibles par tous.
                        </p>
                        {selectedAppointment.userRating ? (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="bb-pill border-amber-300/25 bg-amber-300/10 text-amber-100">
                                {selectedAppointment.userRating}/5
                              </div>
                              <p className="text-sm text-white/70">Évaluation client</p>
                            </div>
                            <p className="text-sm leading-6 text-white/60">
                              {selectedAppointment.userReview || "Aucun commentaire ecrit."}
                            </p>
                          </div>
                        ) : (
                          <p className="mt-2 text-sm leading-6 text-white/60">
                            Aucun avis client enregistré pour le moment.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedAppointment.status === "confirmed" && (
                  <>
                  {/* Compte-rendu (pas de bouton: applique au passage en Effectue) */}
                  <div className="mt-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                    <p className="bb-eyebrow">Compte-rendu (visible par le client)</p>
                    <p className="mt-3 text-sm leading-6 text-white/55">
                      Commentaire + photos sont enregistres automatiquement au passage en{" "}
                      <strong className="text-white">Effectué</strong>.
                    </p>
                    <textarea
                      className="bb-textarea mt-4"
                      onChange={(event) =>
                        setNoteDrafts((current) => ({
                          ...current,
                          [selectedAppointment.id]: event.target.value,
                        }))
                      }
                      placeholder="Compte-rendu, préparation, particularites du véhicule..."
                      value={noteDrafts[selectedAppointment.id] ?? ""}
                    />
                  </div>

                  {/* Photos a ajouter (plusieurs, sans bouton d'upload) */}
                  <div className="mt-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-center gap-3">
                      <span className="inline-grid h-9 w-9 place-items-center rounded-xl border border-accent/25 bg-accent/10 text-[#ffe8a8]">
                        <Camera className="h-4 w-4" />
                      </span>
                      <div className="flex-1">
                        <p className="bb-eyebrow">Photos</p>
                        <p className="mt-0.5 text-sm text-white/55">
                          Ajoute plusieurs photos: elles partent au passage en Effectué.
                        </p>
                      </div>
                      {photosLoading && (
                        <Loader2 className="h-4 w-4 animate-spin text-accent" />
                      )}
                    </div>

                    <label className="mt-4 block rounded-[22px] border border-dashed border-white/15 bg-white/[0.03] p-4 text-sm text-white/65">
                      <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4 text-accent" />
                        Ajouter des photos
                      </div>
                      <input
                        accept="image/*"
                        className="sr-only"
                        multiple
                        onChange={(event) => addStagedPhotos(event.target.files)}
                        ref={fileInputRef}
                        type="file"
                      />
                    </label>

                    {stagedPhotos.length > 0 && (
                      <>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          {stagedPhotos.map((entry) => (
                            <div
                              className="relative overflow-hidden rounded-[22px] border border-accent/30 bg-black/30"
                              key={entry.url}
                            >
                              <img alt="" className="h-24 w-full object-cover" src={entry.url} />
                              <span className="bb-pill absolute left-2 top-2 border-accent/25 bg-accent/15 text-[10px] text-[#ffe8a8]">
                                A envoyer
                              </span>
                              <button
                                className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white"
                                onClick={() => removeStagedPhoto(entry.url)}
                                type="button"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <p className="mt-3 text-xs text-white/45">
                          {stagedPhotos.length} photo(s) prete(s) — envoyees au passage en Effectue.
                        </p>
                      </>
                    )}

                    {publicAppointmentPhotos.length > 0 && (
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        {publicAppointmentPhotos.map((photo) => (
                          <div className="space-y-1.5" key={photo.id}>
                            <button
                              className="block w-full overflow-hidden rounded-[22px] border border-white/10 bg-black/30"
                              onClick={() =>
                                openLightbox(
                                  publicAppointmentPhotos.map((entry) => ({
                                    id: `public-${entry.id}`,
                                    url: entry.url,
                                    label: entry.caption,
                                  })),
                                  photo.url,
                                )
                              }
                              type="button"
                            >
                              <img
                                alt={photo.caption || "Photo rendez-vous"}
                                className="h-24 w-full object-cover transition duration-300 hover:scale-[1.04]"
                                src={photo.url}
                              />
                            </button>
                            <div className="flex gap-1.5">
                              {(["before", "after"] as const).map((cat) => (
                                <button
                                  className={cn(
                                    "flex-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] transition",
                                    photo.category === cat
                                      ? "border-accent/45 bg-accent/15 text-[#ffe8a8]"
                                      : "border-white/10 bg-white/[0.03] text-white/55 hover:bg-white/[0.07]",
                                  )}
                                  key={cat}
                                  onClick={() => {
                                    void setPhotoCategory(photo.id, cat);
                                  }}
                                  type="button"
                                >
                                  {cat === "before" ? "Avant" : "Apres"}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  </>
                  )}

                  {selectedAppointment.status === "done" && (
                  <>
                    {selectedAppointment.adminNote && (
                      <div className="mt-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                        <p className="bb-eyebrow">Compte-rendu</p>
                        <p className="mt-3 text-sm leading-6 text-white/72">
                          {selectedAppointment.adminNote}
                        </p>
                      </div>
                    )}
                    {publicAppointmentPhotos.length > 0 && (
                      <div className="mt-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                        <p className="bb-eyebrow">Photos</p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          {publicAppointmentPhotos.map((photo) => (
                            <button
                              className="block overflow-hidden rounded-[22px] border border-white/10 bg-black/30"
                              key={photo.id}
                              onClick={() =>
                                openLightbox(
                                  publicAppointmentPhotos.map((entry) => ({
                                    id: `public-${entry.id}`,
                                    url: entry.url,
                                    label: entry.caption,
                                  })),
                                  photo.url,
                                )
                              }
                              type="button"
                            >
                              <img
                                alt={photo.caption || "Photo rendez-vous"}
                                className="h-24 w-full object-cover transition duration-300 hover:scale-[1.04]"
                                src={photo.url}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                  )}
                </>
              )}
            </article>

            <article className="hidden">
              <div className="bb-section-head">
                <div>
                  <p className="bb-eyebrow">Client contextuel</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {activeClientContext
                      ? fullClientName(activeClientContext)
                      : "Aucun client"}
                  </h2>
                </div>
                {activeClientContext && (
                  <Link className="bb-button-ghost" to={clientAdminLink(activeClientContext)}>
                    Ouvrir la fiche
                  </Link>
                )}
              </div>

              {clientLoading || isNavigatingSelection ? (
                <div className="mt-6 bb-surface flex items-center gap-3 px-5 py-4 text-sm text-white/65">
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  Chargement du contexte client...
                </div>
              ) : activeClientContext ? (
                <>
                  <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="bb-pill border-white/12 bg-white/[0.04] text-white/70">
                          {activeClientContext.cardCode || "Sans code"}
                        </div>
                        <h3 className="mt-4 text-2xl font-semibold text-white">
                          {fullClientName(activeClientContext)}
                        </h3>
                        <p className="mt-2 text-sm text-white/58">
                          {activeClientContext.vehicleModel || "Véhicule non renseigne"}
                        </p>
                      </div>
                      <div className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 sm:w-auto sm:text-right">
                        <p className="text-xs uppercase tracking-[0.16em] text-white/35">
                          Crédits
                        </p>
                        <p className="mt-2 text-xl font-semibold text-white">
                          {activeClientContext.formulaRemaining}
                          <span className="ml-1 text-sm text-white/35">
                            / {activeClientContext.formulaTotal}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3 text-sm text-white/65">
                      <p>{activeClientContext.phone || "Téléphone non renseigne"}</p>
                      <p>{activeClientContext.email || "Email non renseigne"}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                      Historique rapide
                    </p>
                    <div className="mt-4 space-y-3">
                      {contextualClientAppointments.length === 0 ? (
                        <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                          <p className="text-sm text-white/60">
                            Aucun rendez-vous encore rattache a ce client.
                          </p>
                        </div>
                      ) : (
                        contextualClientAppointments.map((appointment) => (
                          <Link
                            className={cn(
                              "block w-full rounded-[22px] border p-4 text-left transition duration-200",
                              appointment.id === selectedAppointmentId
                                ? "border-accent/45 bg-accent/10"
                                : "border-white/10 bg-black/20 hover:bg-white/[0.05]",
                            )}
                            key={appointment.id}
                            to={appointmentAdminLink(appointment)}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">
                                  {formatDateFR(appointment.date)} - {slotLabel(
                                    appointmentSlot(appointment),
                                  )} · {formatTimeHHMM(appointment.time)}
                                </p>
                                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/45">
                                  {appointmentPrimaryAction(appointment.status)}
                                </p>
                                {appointment.cleanlinessRating && (
                                  <div
                                    className={cn(
                                      "mt-2 inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                                      cleanlinessTone(appointment.cleanlinessRating),
                                    )}
                                  >
                                    {cleanlinessLabel(appointment.cleanlinessRating)}
                                  </div>
                                )}
                              </div>
                              <div
                                className={cn(
                                  "bb-pill",
                                  appointmentStatusClasses(appointment.status),
                                )}
                              >
                                {appointmentStatusLabel(appointment.status)}
                              </div>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
                  <p className="text-sm leading-6 text-white/62">
                    Aucun client contextuel disponible sur le panneau pour le moment.
                  </p>
                </div>
              )}
            </article>
          </aside>
        </section>
    );
  }

  function renderClientsPage() {
    return (
      <>
        {/* ── Metriques rapides ── */}
        <section className="hidden gap-3 md:grid md:grid-cols-3">
          <article className="bb-metric bb-rise">
            <span className="mb-4 inline-grid h-10 w-10 place-items-center rounded-xl border border-accent/25 bg-accent/10 text-[#ffe8a8]">
              <Users className="h-5 w-5" />
            </span>
            <p className="text-xs uppercase tracking-[0.16em] text-white/40">
              Fiches visibles
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-white">
              {filteredClients.length}
            </p>
            <p className="mt-2 text-sm text-white/55">Clients filtres</p>
          </article>
          <article className="bb-metric bb-rise bb-rise-2">
            <span className="mb-4 inline-grid h-10 w-10 place-items-center rounded-xl border border-rose-300/25 bg-rose-300/10 text-rose-200">
              <Sparkles className="h-5 w-5" />
            </span>
            <p className="text-xs uppercase tracking-[0.16em] text-white/40">
              En tension
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-white">
              {clientsLowOnCredits}
            </p>
            <p className="mt-2 text-sm text-white/55">Crédits bas</p>
          </article>
          <article className="bb-metric bb-rise bb-rise-3">
            <span className="mb-4 inline-grid h-10 w-10 place-items-center rounded-xl border border-emerald-300/25 bg-emerald-300/10 text-emerald-200">
              <Coins className="h-5 w-5" />
            </span>
            <p className="text-xs uppercase tracking-[0.16em] text-white/40">
              Crédits cumules
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-white">
              {totalCreditsRemaining}
            </p>
            <p className="mt-2 text-sm text-white/55">Base client</p>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
          {/* ── Liste clients ── */}
          <aside className="order-2 bb-surface p-5 xl:order-none">
            <div className="bb-section-head">
              <div>
                <p className="bb-eyebrow">Clients</p>
                <h2 className="bb-display mt-2 text-2xl font-semibold text-white">
                  Bibliotheque rapide
                </h2>
              </div>
              <div className="bb-pill border-white/12 bg-white/[0.04] text-white/70">
                <Users className="h-3.5 w-3.5 text-accent" />
                {filteredClients.length}
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <button className="bb-button-brand justify-center" onClick={openCreateProfile} type="button">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau client
              </button>
              <button
                className="bb-button-ghost justify-center"
                disabled={exportingData}
                onClick={() => {
                  void exportFullData();
                }}
                type="button"
              >
                <Download className="mr-2 h-4 w-4" />
                {exportingData ? "Export..." : "Exporter les infos"}
              </button>
              <p className="text-sm leading-6 text-white/50">
                Export hebdomadaire automatique le dimanche a 10h, plus export manuel ici.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "bbx" as const, label: "BBX" },
                  { key: "founder" as const, label: "Fondateur" },
                  { key: "pro" as const, label: "Pro" },
                  { key: "all" as const, label: "Tout" },
                ].map((filter) => (
                  <button
                    className={cn(
                      "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition duration-200",
                      clientTypeFilter === filter.key
                        ? "border-accent/45 bg-accent/10 text-white"
                        : "border-white/10 bg-white/[0.03] text-white/65 hover:bg-white/[0.05]",
                    )}
                    key={filter.key}
                    onClick={() => setClientTypeFilter(filter.key)}
                    type="button"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  className="bb-input pl-11"
                  onChange={(event) => setFilterClientQuery(event.target.value)}
                  placeholder="Nom, slug, ville..."
                  value={filterClientQuery}
                />
              </div>
            </div>

            <div className="mt-5 space-y-3 xl:max-h-[920px] xl:overflow-y-auto xl:pr-1">
              {clientsLoading ? (
                <div className="bb-surface flex items-center gap-3 px-4 py-3 text-sm text-white/65">
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  Chargement des clients...
                </div>
              ) : clientsError ? (
                <div className="flex flex-col items-center gap-3 rounded-[24px] border border-rose-300/20 bg-rose-300/10 p-6 text-center">
                  <span className="inline-grid h-10 w-10 place-items-center rounded-xl border border-rose-300/25 bg-rose-300/10 text-rose-200">
                    <XCircle className="h-5 w-5" />
                  </span>
                  <p className="text-sm text-rose-100">{clientsError}</p>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.03] p-6 text-center">
                  <span className="inline-grid h-10 w-10 place-items-center rounded-xl border border-white/12 bg-white/[0.04] text-white/35">
                    <Users className="h-5 w-5" />
                  </span>
                  <p className="text-sm text-white/55">Aucun client correspond a cette recherche.</p>
                </div>
              ) : (
                filteredClients.map((client) => {
                  const active = client.id === selectedClientId;
                  const creditsRatio =
                    client.formulaTotal > 0
                      ? clampNumber(client.formulaRemaining / client.formulaTotal, 0, 1)
                      : 0;
                  const initials = [client.firstName, client.lastName]
                    .filter(Boolean)
                    .map((n) => (n as string)[0])
                    .join("")
                    .toUpperCase() || "?";
                  const creditsTint =
                    creditsRatio > 0.5
                      ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
                      : creditsRatio > 0
                        ? "border-amber-300/25 bg-amber-300/10 text-amber-200"
                        : "border-rose-300/25 bg-rose-300/10 text-rose-200";

                  return (
                    <button
                      className={cn(
                        "bb-hover-lift group w-full rounded-[26px] border p-4 text-left transition duration-200",
                        active
                          ? "border-accent/45 bg-accent/10 shadow-[0_18px_48px_rgb(var(--bb-accent-rgb)/0.12)]"
                          : "border-white/10 bg-white/[0.03] hover:border-white/20",
                      )}
                      key={client.id}
                      onClick={() => focusClient(client)}
                      type="button"
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar chip */}
                        <span className={cn(
                          "inline-grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-[13px] font-bold",
                          active
                            ? "border-accent/35 bg-accent/15 text-[#ffe8a8]"
                            : "border-white/12 bg-white/[0.06] text-white/60",
                        )}>
                          {initials}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-semibold text-white">
                              {fullClientName(client)}
                            </p>
                            {client.isFounder && (
                              <span className="bb-pill border-accent/35 bg-accent/10 text-[#ffe8a8]">
                                <Crown className="h-3 w-3" />
                              </span>
                            )}
                            <span className={cn("bb-pill", creditsTint)}>
                              {client.formulaRemaining}/{client.formulaTotal}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-white/50">
                            {client.vehicleModel || "Véhicule non renseigne"}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="bb-pill border-white/10 bg-white/[0.03] text-white/40">
                              {client.clientType === "data"
                                ? "Data"
                                : client.clientType === "pro"
                                  ? client.cardCode || "Pro"
                                  : client.cardCode || "BBX"}
                            </span>
                            {client.city && (
                              <span className="bb-pill border-white/10 bg-white/[0.03] text-white/40">
                                {client.city}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-white/25 transition group-hover:translate-x-1 group-hover:text-accent" />
                      </div>

                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-accent to-accent"
                          style={{ width: `${creditsRatio * 100}%` }}
                        />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* ── Fiche client detaillee ── */}
          <section className="order-1 space-y-4 xl:order-none">
            <article className="bb-surface p-6">
              <div className="bb-section-head">
                <div>
                  <p className="bb-eyebrow">Client actif</p>
                  <h2 className="bb-display mt-2 text-2xl font-semibold text-white">
                    {managedClient ? fullClientName(managedClient) : "Aucun client"}
                  </h2>
                </div>
                {managedClient && (
                  <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2">
                    <button className="bb-button-ghost w-full" onClick={openFormulaEdit} type="button">
                      Editer formule
                    </button>
                    <button
                      className="bb-button-ghost w-full"
                      disabled={busyFormulaRecap}
                      onClick={() => {
                        void sendFormulaRecap();
                      }}
                      type="button"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      {busyFormulaRecap ? "Envoi..." : "Envoyer récap"}
                    </button>
                  </div>
                )}
              </div>

              {clientLoading || isNavigatingSelection ? (
                <div className="mt-6 bb-surface flex items-center gap-3 px-5 py-4 text-sm text-white/65">
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  Chargement de la fiche client...
                </div>
              ) : managedClient ? (
                <>
                  {/* Identite + credits */}
                  <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-start gap-4">
                      {/* Avatar large */}
                      <div className={cn(
                        "inline-grid h-14 w-14 shrink-0 place-items-center rounded-2xl border text-lg font-bold",
                        managedClient.isFounder
                          ? "border-accent/35 bg-accent/[0.12] text-[#ffe8a8]"
                          : "border-white/12 bg-white/[0.06] text-white/60",
                      )}>
                        {([managedClient.firstName, managedClient.lastName]
                          .filter(Boolean)
                          .map((n) => (n as string)[0])
                          .join("")
                          .toUpperCase()) || "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-2">
                          <div className="bb-pill border-white/12 bg-white/[0.04] text-white/70">
                            {managedClient.clientType === "data"
                              ? "Data"
                              : managedClient.clientType === "pro"
                                ? "Pro"
                                : managedClient.cardCode || "Sans code"}
                          </div>
                          {managedClient.isFounder && (
                            <div className="bb-pill border-accent/35 bg-accent/10 text-[#ffe8a8]">
                              <Crown className="h-3.5 w-3.5" />
                              Fondateur
                            </div>
                          )}
                        </div>
                        <h3 className="bb-display mt-3 text-2xl font-semibold text-white">
                          {fullClientName(managedClient)}
                        </h3>
                        <p className="mt-1 text-sm text-white/55">
                          {managedClient.vehicleModel || "Véhicule non renseigne"}
                        </p>
                      </div>
                      <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-right">
                        <p className="text-xs uppercase tracking-[0.16em] text-white/35">
                          Credits / BC&apos;Coins
                        </p>
                        <p className="mt-2 text-xl font-semibold tabular-nums text-white">
                          {managedClient.formulaRemaining}
                          <span className="ml-1 text-sm text-white/35">
                            / {managedClient.formulaTotal}
                          </span>
                        </p>
                        <p className="mt-2 text-sm text-white/55">{managedClient.bcPoints} points</p>
                      </div>
                    </div>

                    {/* Coordonnees */}
                    <div className="mt-5 grid gap-2 rounded-[22px] border border-white/10 bg-black/15 p-4">
                      {managedClient.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 shrink-0 text-white/30" />
                          <p className="text-sm text-white/65">{managedClient.phone}</p>
                        </div>
                      )}
                      {!managedClient.phone && (
                        <p className="text-sm text-white/35">Téléphone non renseigne</p>
                      )}
                      {managedClient.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 shrink-0 text-white/30" />
                          <p className="text-sm text-white/65">{managedClient.email}</p>
                        </div>
                      )}
                      {!managedClient.email && (
                        <p className="text-sm text-white/35">Email non renseigne</p>
                      )}
                      <p className="text-sm text-white/45">
                        {[
                          managedClient.addressLine1,
                          managedClient.addressLine2,
                          managedClient.postalCode,
                          managedClient.city,
                        ]
                          .filter(Boolean)
                          .join(", ") || "Adresse non renseignee"}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button className="bb-button-ghost" onClick={openEditProfile} type="button">
                        <PencilLine className="mr-2 h-4 w-4" />
                        Modifier le profil
                      </button>
                      {managedClient.clientType === "bbx" || managedClient.clientType === "pro" ? (
                        <>
                          <Link className="bb-button-ghost" to={`/card/${managedClient.slug}`}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Voir carte client
                          </Link>
                          <button
                            aria-label="Copier le lien de la carte client"
                            className="bb-button-ghost px-4"
                            onClick={() => {
                              void copyClientCardLink(managedClient);
                            }}
                            title="Copier le lien de la carte client"
                            type="button"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <div className="bb-pill border-white/12 bg-white/[0.04] text-white/65">
                          Client Data sans carte
                        </div>
                      )}
                      {managedClient.phone && (
                        <a
                          className="bb-button-ghost"
                          href={`tel:${normalizePhoneForTel(managedClient.phone)}`}
                        >
                          <Phone className="mr-2 h-4 w-4" />
                          Appeler
                        </a>
                      )}
                      {managedClient.email && (
                        <a
                          className="bb-button-ghost"
                          href={`mailto:${managedClient.email}`}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Email
                        </a>
                      )}
                      <button
                        className="bb-button-danger"
                        onClick={() => {
                          void removeClientAccount(managedClient);
                        }}
                        type="button"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Supprimer le compte
                      </button>
                    </div>
                  </div>

                  {/* Formule + Conditions */}
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="bb-eyebrow">Crédits</p>
                          <p className="mt-2 text-3xl font-semibold tabular-nums text-white">
                            {managedClient.formulaRemaining}
                          </p>
                        </div>
                        <button className="bb-button-ghost" onClick={openFormulaEdit} type="button">
                          <PencilLine className="mr-2 h-4 w-4" />
                          Modifier
                        </button>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-white/55">
                        Credits disponibles sur le compte
                        {managedClient.isFounder
                          ? ` · ${managedClient.bcPoints} BC'Coins`
                          : ""}
                        .
                      </p>
                      {managedClient.reviewBoxRewardLabel && (
                        <p className="mt-3 rounded-[16px] border border-accent/25 bg-accent/[0.06] px-3 py-2 text-sm text-white/75">
                          <span className="font-semibold text-accentSoft">Box avis gagnee :</span>{" "}
                          {managedClient.reviewBoxRewardLabel} — a remettre au prochain passage.
                        </p>
                      )}
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="bb-eyebrow">Conditions & récap</p>
                          <p className="mt-2 text-lg font-semibold text-white">
                            {managedClientTermsAccepted
                              ? "Conditions acceptees"
                              : "Conditions non acceptees"}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "bb-pill",
                            managedClientTermsAccepted
                              ? "border-emerald-400/35 bg-emerald-300/10 text-emerald-100"
                              : "border-amber-400/35 bg-amber-300/10 text-amber-100",
                          )}
                        >
                          {managedClientTermsAccepted ? "Conforme" : "A valider"}
                        </div>
                      </div>

                      <div className="mt-4 space-y-3 text-sm text-white/55">
                        <p>
                          Conditions acceptees le: {formatUnixDateTimeFR(managedClient.termsAcceptedAt)}
                        </p>
                        <p>
                          Dernier recap envoye: {formatUnixDateTimeFR(managedClient.formulaRecapSentAt)}
                        </p>
                        <p>
                          {managedClient.email
                            ? "Le recapitulatif client peut être renvoye depuis cette fiche."
                            : "Ajoutez un email client pour envoyer le recapitulatif formule."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Qualite vehicule + BC'Coins */}
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                      <p className="bb-eyebrow mb-3">Qualite véhicule moyenne</p>
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "bb-pill",
                            cleanlinessTone(
                              cleanlinessAverageRating(selectedClient?.cleanliness.averageScore),
                            ),
                          )}
                        >
                          {selectedClient?.cleanliness.averageScore == null
                            ? "Aucune note"
                            : cleanlinessLabel(
                                cleanlinessAverageRating(selectedClient.cleanliness.averageScore),
                              )}
                        </div>
                        <p className="text-sm text-white/55">
                          {selectedClient?.cleanliness.averageScore == null
                            ? `${selectedClient?.cleanliness.total || 0} rendez-vous notes`
                            : `Moyenne ${selectedClient.cleanliness.averageScore}/3 sur ${selectedClient.cleanliness.total} rendez-vous`}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="bb-eyebrow">BC&apos;Coins</p>
                          <p className="mt-2 text-base font-semibold text-white">
                            Ajuster le solde ou suivre les demandes
                          </p>
                        </div>
                        <div className="bb-pill border-accent/25 bg-accent/10 text-[#ffe8a8]">
                          {managedClient.bcPoints} points
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        <label className="space-y-2">
                          <span className="text-xs uppercase tracking-[0.16em] text-white/35">
                            Ajustement manuel
                          </span>
                          <input
                            className="bb-input"
                            inputMode="numeric"
                            onChange={(event) => setPointsDeltaDraft(event.target.value)}
                            placeholder="Ex: 100 ou -100"
                            value={pointsDeltaDraft}
                          />
                        </label>

                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: "+100", value: 100 },
                            { label: "+300", value: 300 },
                            { label: "-100", value: -100 },
                            { label: "-300", value: -300 },
                          ].map((preset) => (
                            <button
                              className="bb-button-ghost px-4 py-2"
                              disabled={busyPoints}
                              key={preset.label}
                              onClick={() => {
                                void updateClientPoints(preset.value);
                              }}
                              type="button"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>

                        <button
                          className="bb-button-brand w-full"
                          disabled={busyPoints}
                          onClick={() => {
                            void updateClientPoints();
                          }}
                          type="button"
                        >
                          {busyPoints ? "Mise a jour..." : "Appliquer l'ajustement"}
                        </button>
                      </div>

                      <div className="mt-5 border-t border-white/10 pt-4">
                        <p className="bb-eyebrow mb-3">Dernieres demandes BC&apos;Coins</p>
                        <div className="space-y-2">
                          {selectedClient?.rewardRedemptions.length ? (
                            selectedClient.rewardRedemptions.slice(0, 3).map((redemption) => (
                              <div className="flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-black/20 px-3 py-2.5" key={redemption.id}>
                                <div>
                                  <p className="text-sm font-semibold text-white">
                                    {redemption.rewardLabel}
                                  </p>
                                  <p className="text-xs text-white/40">
                                    {formatUnixDateTimeFR(redemption.createdAt)}
                                  </p>
                                </div>
                                <div className="bb-pill border-white/12 bg-white/[0.04] text-white/70">
                                  {redemption.status}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-white/50">Aucune demande enregistrée.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Historique rendez-vous */}
                  <div className="mt-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                    <p className="bb-eyebrow mb-4">Historique rapide du client</p>
                    <div className="space-y-3">
                      {selectedClientAppointments.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 rounded-[22px] border border-white/10 bg-black/20 p-6 text-center">
                          <span className="inline-grid h-10 w-10 place-items-center rounded-xl border border-white/12 bg-white/[0.04] text-white/30">
                            <CalendarClock className="h-5 w-5" />
                          </span>
                          <p className="text-sm text-white/50">
                            Aucun rendez-vous encore rattache a ce client.
                          </p>
                        </div>
                      ) : (
                        selectedClientAppointments.map((appointment) => {
                          const statusTints: Record<string, string> = {
                            requested: "border-amber-300/25 bg-amber-300/10 text-amber-200",
                            confirmed: "border-sky-300/25 bg-sky-300/10 text-sky-200",
                            done: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
                            cancelled: "border-rose-300/25 bg-rose-300/10 text-rose-200",
                          };
                          const iconTint = statusTints[appointment.status] ?? "border-white/12 bg-white/[0.04] text-white/40";
                          return (
                            <Link
                              className="bb-hover-lift group block w-full rounded-[22px] border border-white/10 bg-black/20 p-4 text-left transition duration-200 hover:border-white/20"
                              key={appointment.id}
                              to={appointmentAdminLink(appointment)}
                            >
                              <div className="flex items-center gap-3">
                                <span className={cn("inline-grid h-8 w-8 shrink-0 place-items-center rounded-xl border", iconTint)}>
                                  <CalendarClock className="h-4 w-4" />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-white">
                                    {formatDateFR(appointment.date)} &middot; {slotLabel(
                                      appointmentSlot(appointment),
                                    )} &middot; {formatTimeHHMM(appointment.time)}
                                  </p>
                                  <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-white/40">
                                    {appointmentPrimaryAction(appointment.status)}
                                  </p>
                                </div>
                                <div
                                  className={cn(
                                    "bb-pill shrink-0",
                                    appointmentStatusClasses(appointment.status),
                                  )}
                                >
                                  {appointmentStatusLabel(appointment.status)}
                                </div>
                                <ArrowRight className="h-4 w-4 shrink-0 text-white/25 transition group-hover:translate-x-1 group-hover:text-accent" />
                              </div>
                            </Link>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Notes internes */}
                  <div className="mt-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-start gap-3">
                      <span className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-accent/25 bg-accent/10 text-[#ffe8a8]">
                        <PencilLine className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="bb-eyebrow">Notes internes</p>
                        <p className="mt-2 text-sm leading-6 text-white/55">
                          {managedClient.notes || "Aucune note interne pour ce client."}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-3 rounded-[22px] border border-white/10 bg-black/20 p-3">
                      <div className="rounded-xl border border-sky-300/25 bg-sky-300/10 p-2 text-sky-200">
                        <CarFront className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {managedClient.formulaName || "Formule libre"}
                        </p>
                        <p className="mt-0.5 text-sm text-white/45">
                          {managedClient.city || "Ville non renseignee"}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-6 flex flex-col items-center gap-3 rounded-[28px] border border-white/10 bg-white/[0.03] p-8 text-center">
                  <span className="inline-grid h-12 w-12 place-items-center rounded-2xl border border-white/12 bg-white/[0.04] text-white/30">
                    <Users className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-white">Aucun client sélectionné</p>
                    <p className="mt-1 text-sm leading-6 text-white/50">
                      Choisissez un client dans la liste pour ouvrir sa fiche détaillée.
                    </p>
                  </div>
                </div>
              )}
            </article>
          </section>
        </section>
      </>
    );
  }

  return (
    <div className="bb-shell pb-28 md:pb-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-6rem] top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute right-[-7rem] top-12 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <main className="bb-content">
        <div className="md:flex md:items-start md:gap-6">
          {/* Sidebar (rail lateral) — desktop uniquement */}
          <aside className="hidden md:block md:w-56 md:shrink-0 lg:w-60">
            <div className="sticky top-6 space-y-3">
              <div className="bb-surface-strong flex items-center gap-2.5 p-4">
                <img
                  alt=""
                  className="h-9 w-9 rounded-xl object-cover ring-1 ring-white/10"
                  src="/app-icon-192.png"
                />
                <div className="leading-none">
                  <p className="bb-display text-sm font-bold text-white">Bryan Cars</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/40">Admin</p>
                </div>
              </div>
              <nav className="bb-surface space-y-1 p-2">
                {ADMIN_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = adminSection === item.key;
                  const badge = adminNavBadges[item.key] ?? 0;
                  return (
                    <Link
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition duration-200",
                        active
                          ? "bg-accent/12 text-white shadow-[0_10px_24px_rgb(var(--bb-accent-rgb)/0.1)]"
                          : "text-white/60 hover:bg-white/[0.05] hover:text-white",
                      )}
                      key={item.key}
                      to={adminSectionHrefs[item.key]}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-accent" : "text-white/45")} />
                      <span className="flex-1">{item.label}</span>
                      {badge > 0 && (
                        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
                          {badge > 9 ? "9+" : badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Colonne contenu */}
          <div className="min-w-0 flex-1 space-y-6 md:space-y-8">
            <section className="bb-surface-strong overflow-hidden p-6 md:p-8">
              <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="bb-pill border-white/12 bg-white/[0.04] text-white/75">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Admin cockpit
              </div>
              <InstallAppButton
                appName="Bryan Cars Admin"
                className="bb-button-ghost px-4 py-2 text-xs uppercase tracking-[0.16em]"
                startUrl="/admin"
              />
              {pushPermission !== "unsupported" && (
                <button
                  className={cn(
                    "bb-button-ghost px-4 py-2 text-xs uppercase tracking-[0.16em]",
                    pushPermission === "granted" && "border-emerald-300/35 text-emerald-100",
                  )}
                  disabled={pushBusy || pushPermission === "granted"}
                  onClick={() => {
                    void handleEnablePush();
                  }}
                  type="button"
                >
                  {pushPermission === "granted" ? (
                    <BellRing className="mr-2 h-4 w-4" />
                  ) : (
                    <Bell className="mr-2 h-4 w-4" />
                  )}
                  {pushBusy
                    ? "Activation..."
                    : pushPermission === "granted"
                      ? "Notifications ON"
                      : "Activer notifications"}
                </button>
              )}
              <a className="bb-button-ghost px-4 py-2 text-xs uppercase tracking-[0.16em]" href="/logout">
                <LogOut className="mr-2 h-4 w-4" />
                Sortir
              </a>
            </div>

            <div className="max-w-4xl">
              <p className="bb-eyebrow">Operations Bryan Cars</p>
              <h1 className="bb-title mt-3">{sectionTitle}</h1>
              <p className="bb-subtitle mt-3 max-w-3xl">{sectionSubtitle}</p>
            </div>

          </div>
            </section>

            {adminSection === "appointments" || adminSection === "delivery"
              ? renderAppointmentsPage()
              : adminSection === "clients"
                ? renderClientsPage()
                : adminSection === "stats"
                  ? renderStatsPage()
                  : adminSection === "events"
                    ? renderEventsPage()
                    : adminSection === "comms"
                      ? renderCommsPage()
                      : adminSection === "settings"
                        ? renderSettingsPage()
                        : renderHomePage()}
          </div>
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-3 z-30 px-3 md:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-4 rounded-[28px] border border-white/12 bg-[var(--bb-glass-solid-2)] p-1.5 shadow-[0_24px_80px_rgba(0,0,0,0.46)] backdrop-blur-2xl">
          {ADMIN_NAV_ITEMS.filter((item) => PRIMARY_ADMIN_KEYS.includes(item.key)).map((item) => {
            const Icon = item.icon;
            const active = adminSection === item.key;
            const badge = adminNavBadges[item.key] ?? 0;
            return (
              <Link
                className={cn(
                  "relative flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-[20px] px-1.5 py-2 text-[10px] font-semibold transition duration-200",
                  active
                    ? "bg-gradient-to-b from-accent/18 to-accent/12 text-white shadow-[0_10px_24px_rgb(var(--bb-accent-rgb)/0.12)]"
                    : "text-white/54",
                )}
                key={item.key}
                to={adminSectionHrefs[item.key]}
              >
                <span className="relative">
                  <Icon className={cn("h-4 w-4", active && "text-accent")} />
                  {badge > 0 && (
                    <span className="absolute -right-2.5 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white shadow-[0_2px_6px_rgba(0,0,0,0.4)]">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </span>
                <span>{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {profileModalOpen && profileDraft && (
        <div className="bb-backdrop-in fixed inset-0 z-50 flex items-end justify-center bg-black/80 px-3 pb-3 pt-8 backdrop-blur-md md:items-center">
          <div className="bb-modal-panel bb-surface-strong w-full max-w-3xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="bb-eyebrow">
                  {profileMode === "new" ? "Création client" : "Edition client"}
                </p>
                <h3 className="bb-display mt-3 text-2xl font-semibold text-white">
                  {profileMode === "new"
                    ? "Nouveau client Bryan Cars"
                    : "Mettre a jour la fiche"}
                </h3>
              </div>
              <button
                className="bb-button-ghost"
                disabled={profileSubmitting}
                onClick={() => {
                  setProfileModalOpen(false);
                  setProfileDraft(null);
                  setFounderMediaFile(null);
                }}
                type="button"
              >
                Fermer
              </button>
            </div>

            <div className="mt-6 grid max-h-[70vh] gap-4 overflow-y-auto pr-1 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Prenom
                </span>
                <input
                  className="bb-input"
                  onChange={(event) => updateProfileDraft("firstName", event.target.value)}
                  value={profileDraft.firstName}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Nom
                </span>
                <input
                  className="bb-input"
                  onChange={(event) => updateProfileDraft("lastName", event.target.value)}
                  value={profileDraft.lastName}
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Société
                </span>
                <input
                  className="bb-input"
                  onChange={(event) => updateProfileDraft("company", event.target.value)}
                  value={profileDraft.company}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Téléphone
                </span>
                <input
                  className="bb-input"
                  onChange={(event) => updateProfileDraft("phone", event.target.value)}
                  value={profileDraft.phone}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Email
                </span>
                <input
                  className="bb-input"
                  onChange={(event) => updateProfileDraft("email", event.target.value)}
                  value={profileDraft.email}
                />
              </label>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 md:col-span-2">
                <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Type de compte
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { value: "bbx" as const, label: "BBX", clientType: "bbx" as const, isFounder: false },
                    { value: "founder" as const, label: "Fondateur", clientType: "bbx" as const, isFounder: true },
                    { value: "pro" as const, label: "Pro", clientType: "pro" as const, isFounder: false },
                  ].map((option) => {
                    const selected =
                      option.value === "founder"
                        ? profileDraft.clientType === "bbx" && profileDraft.isFounder
                        : option.value === "pro"
                          ? profileDraft.clientType === "pro"
                          : profileDraft.clientType === "bbx" && !profileDraft.isFounder;
                    return (
                      <button
                        className={cn(
                          "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition duration-200",
                          selected
                            ? "border-accent/45 bg-accent/10 text-white"
                            : "border-white/10 bg-black/20 text-white/60 hover:bg-white/[0.04]",
                        )}
                        key={option.value}
                        onClick={() =>
                          setProfileDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  clientType: option.clientType,
                                  isFounder: option.isFounder,
                                }
                              : current,
                          )
                        }
                        type="button"
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                {((profileDraft.clientType === "bbx" && profileDraft.isFounder) || profileDraft.clientType === "pro") && (
                  <label className="mt-4 block space-y-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                      Image personnalisee
                    </span>
                    <input
                      className="bb-input"
                      onChange={(event) => setFounderMediaFile(event.target.files?.[0] ?? null)}
                      type="file"
                    />
                    <p className="text-sm text-white/50">
                      {founderMediaFile
                        ? founderMediaFile.name
                        : "Ajoutez un visuel premium affiche sur la carte du client."}
                    </p>
                  </label>
                )}
              </div>
              <label className="space-y-2 md:col-span-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Adresse
                </span>
                <input
                  className="bb-input"
                  onChange={(event) =>
                    updateProfileDraft("addressLine1", event.target.value)
                  }
                  value={profileDraft.addressLine1}
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Complement
                </span>
                <input
                  className="bb-input"
                  onChange={(event) =>
                    updateProfileDraft("addressLine2", event.target.value)
                  }
                  value={profileDraft.addressLine2}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Code postal
                </span>
                <input
                  className="bb-input"
                  onChange={(event) =>
                    updateProfileDraft("postalCode", event.target.value)
                  }
                  value={profileDraft.postalCode}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Ville
                </span>
                <input
                  className="bb-input"
                  onChange={(event) => updateProfileDraft("city", event.target.value)}
                  value={profileDraft.city}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Véhicule
                </span>
                <input
                  className="bb-input"
                  onChange={(event) =>
                    updateProfileDraft("vehicleModel", event.target.value)
                  }
                  value={profileDraft.vehicleModel}
                />
              </label>
              {profileDraft.clientType !== "pro" && (
                <label className="space-y-2 md:col-span-2">
                  <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                    Crédits
                  </span>
                  <input
                    className="bb-input"
                    min={0}
                    onChange={(event) =>
                      updateProfileDraft("formulaRemaining", event.target.value)
                    }
                    type="number"
                    value={profileDraft.formulaRemaining}
                  />
                  <p className="text-sm text-white/50">
                    Nombre de crédits disponibles sur le compte.
                  </p>
                </label>
              )}
              {profileMode === "edit" && selectedClientData && (
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 md:col-span-2">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                    Conditions & récap
                  </p>
                  <div className="mt-3 grid gap-3 text-sm text-white/65 md:grid-cols-2">
                    <p>
                      Conditions acceptees le:{" "}
                      {formatUnixDateTimeFR(selectedClientData.termsAcceptedAt)}
                    </p>
                    <p>
                      Dernier recap envoye:{" "}
                      {formatUnixDateTimeFR(selectedClientData.formulaRecapSentAt)}
                    </p>
                  </div>
                </div>
              )}
              <label className="space-y-2 md:col-span-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Notes internes
                </span>
                <textarea
                  className="bb-textarea"
                  onChange={(event) => updateProfileDraft("notes", event.target.value)}
                  value={profileDraft.notes}
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                className="bb-button-ghost"
                disabled={profileSubmitting}
                onClick={() => {
                  setProfileModalOpen(false);
                  setProfileDraft(null);
                }}
                type="button"
              >
                Annuler
              </button>
              <button
                className="bb-button-brand"
                disabled={profileSubmitting}
                onClick={() => {
                  void submitProfile();
                }}
                type="button"
              >
                {profileSubmitting ? "Enregistrement..." : "Enregistrer la fiche"}
              </button>
            </div>
          </div>
        </div>
      )}

      {formulaEditOpen && selectedClientData && (
        <div className="bb-backdrop-in fixed inset-0 z-50 flex items-end justify-center bg-black/80 px-3 pb-3 pt-8 backdrop-blur-md md:items-center">
          <div className="bb-modal-panel bb-surface-strong w-full max-w-lg p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="bb-eyebrow">Crédits</p>
                <h3 className="bb-display mt-3 text-2xl font-semibold text-white">
                  Ajuster {fullClientName(selectedClientData)}
                </h3>
              </div>
              <button
                className="bb-button-ghost"
                disabled={busyFormula}
                onClick={() => setFormulaEditOpen(false)}
                type="button"
              >
                Fermer
              </button>
            </div>

            <div className="mt-6">
              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Crédits du compte
                </span>
                <input
                  className="bb-input"
                  min={0}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setFormulaDraftTotal(value);
                    setFormulaDraftRemaining(value);
                  }}
                  type="number"
                  value={formulaDraftRemaining ?? 0}
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                className="bb-button-ghost"
                disabled={busyFormula}
                onClick={() => setFormulaEditOpen(false)}
                type="button"
              >
                Annuler
              </button>
              <button
                className="bb-button-brand"
                disabled={busyFormula}
                onClick={() => {
                  void updateFormula("custom");
                }}
                type="button"
              >
                {busyFormula ? "Sauvegarde..." : "Appliquer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed inset-x-0 bottom-5 z-[70] flex justify-center px-4">
          <div className="rounded-full border border-white/10 bg-black/80 px-4 py-3 text-sm text-white shadow-2xl backdrop-blur-md">
            {toast}
          </div>
        </div>
      )}

      <ImageLightbox
        currentUrl={lightboxUrl}
        images={lightboxImages}
        onChange={setLightboxUrl}
        onClose={() => setLightboxUrl(null)}
      />
    </div>
  );
}
