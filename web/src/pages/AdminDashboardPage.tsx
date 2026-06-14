import * as React from "react";
import {
  ArrowRight,
  Bell,
  BellRing,
  CalendarClock,
  Camera,
  CarFront,
  CheckCircle2,
  Clock3,
  Coins,
  Copy,
  Crown,
  Download,
  ExternalLink,
  Inbox,
  Loader2,
  LogOut,
  Mail,
  PencilLine,
  Phone,
  Plus,
  Save,
  Search,
  Sparkles,
  Truck,
  Users,
  XCircle,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { ImageLightbox, type LightboxImage } from "../components/ImageLightbox";
import { InstallAppButton } from "../components/InstallAppButton";
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
  formatUnixDateFR,
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
  notes: string | null;
  createdAt: number;
  updatedAt: number;
};

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

type AdminSection = "home" | "appointments" | "delivery" | "clients";

const ADMIN_NAV_ITEMS: Array<{
  key: AdminSection;
  label: string;
  shortLabel: string;
  icon: typeof Sparkles;
}> = [
  { key: "home", label: "Hall principal", shortLabel: "Hall", icon: Sparkles },
  { key: "appointments", label: "Agenda admin", shortLabel: "Agenda", icon: CalendarClock },
  { key: "delivery", label: "Livraison", shortLabel: "Livraison", icon: Truck },
  { key: "clients", label: "Clients", shortLabel: "Clients", icon: Users },
];

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
  if (!client) return "Client non selectionne";
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

function formulaHasExpired(timestamp: number | null | undefined) {
  if (!timestamp) return false;

  const date = new Date(timestamp * 1000);
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
      return "Confirmer le creneau";
    case "confirmed":
      return "Marquer comme effectue";
    case "done":
      return "Prestation terminee";
    case "cancelled":
      return "Rendez-vous annule";
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
        label: "Marquer effectue",
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
  const [clientTypeFilter, setClientTypeFilter] = React.useState<"bbx" | "data" | "pro" | "all">("bbx");
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

  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [photoFormCaption, setPhotoFormCaption] = React.useState("");
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
    setPhotoFile(null);
    setPhotoFormCaption("");
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

  // Silent periodic auto-refresh — does not trigger loading skeletons after first load
  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setRefreshToken((v) => v + 1);
    }, 45000);
    return () => window.clearInterval(interval);
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
        showToast("Notifications refusees. Autorisez-les dans les reglages du navigateur.");
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
        showToast("Tarif enregistre. Le client doit recharger pour confirmer.");
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
          message: photoRequestDrafts[appointmentId] || "Merci d'ajouter quelques photos du vehicule.",
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

  async function saveAppointmentWorkspace(appointmentId: number) {
    const note = noteDrafts[appointmentId] ?? "";
    const hasFile = !!photoFile;
    const captionTrim = photoFormCaption.trim();

    let noteSaved = false;
    let photoSaved = !hasFile;

    setBusyAction(true);

    try {
      try {
        const response = await fetch(`/api/admin/appointments/${appointmentId}/workspace`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminNote: note, cleanlinessRating: null }),
        });

        const json = await response.json();
        if (!response.ok || !json.ok || !json.appointment) {
          showToast("La note admin n'a pas ete enregistree.");
        } else {
          noteSaved = true;
          applyAppointmentUpdate(json.appointment as AdminAppointment);
        }
      } catch (error) {
        showToast("Erreur reseau pendant la sauvegarde de la note.");
      }

      if (hasFile) {
        try {
          const formData = new FormData();
          formData.append("file", photoFile as File);
          formData.append("caption", captionTrim);

          const response = await fetch(
            `/api/admin/appointments/${appointmentId}/photos/upload`,
            {
              method: "POST",
              body: formData,
            },
          );

          const json =
            (await response.json()) as AdminAppointmentPhotoCreateResponse;

          if (!response.ok || !json.ok || !json.photo) {
            showToast("La photo n'a pas pu etre ajoutee.");
          } else {
            photoSaved = true;
            setCurrentPhotos((current) => [
              ...current,
              json.photo as AdminAppointmentPhoto,
            ]);
            setPhotoFile(null);
            setPhotoFormCaption("");
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }
        } catch (error) {
          showToast("Erreur reseau pendant l'upload photo.");
        }
      }

      if (noteSaved && photoSaved) {
        showToast("Panneau rendez-vous mis a jour.");
      }
    } finally {
      setBusyAction(false);
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
            : "La mise a jour des BC'Coins a echoue.",
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
        showToast("Impossible d'exporter les donnees.");
        return;
      }

      showToast(
        json.emailSent
          ? "Export complet cree et envoye a l'admin."
          : "Export cree. Verifiez la configuration email admin.",
      );
    } catch (error) {
      showToast("Erreur reseau pendant l'export des donnees.");
    } finally {
      setExportingData(false);
    }
  }

  function openFormulaEdit() {
    const client = selectedClient?.client;
    if (!client) return;

    setFormulaDraftTotal(client.formulaTotal);
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
      payload.append("formulaName", profileDraft.formulaName);
      payload.append("formulaTotal", String(Number(profileDraft.formulaTotal || 0)));
      payload.append(
        "formulaRemaining",
        String(Number(profileDraft.formulaRemaining || 0)),
      );
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
        showToast("Nouveau client cree.");
      } else {
        setClients((current) =>
          current.map((entry) => (entry.id === updated.id ? updated : entry)),
        );
        setSelectedClient((current) =>
          current ? { ...current, client: updated } : current,
        );
        showToast("Profil client enregistre.");
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
        : "home";
  const selectedAppointmentActions = selectedAppointment
    ? appointmentWorkflowActions(selectedAppointment.status)
    : null;
  const managedClient = selectedClientData;
  const managedClientFormulaExpired = formulaHasExpired(managedClient?.formulaExpiresAt);
  const managedClientTermsAccepted = !!managedClient?.termsAcceptedAt;
  const sectionTitle =
    adminSection === "appointments"
      ? "Agenda"
      : adminSection === "delivery"
        ? "Livraison"
        : adminSection === "clients"
          ? "Clients"
          : "Hall principal";
  const sectionSubtitle =
    adminSection === "appointments"
      ? "Demandes en attente: validez le tarif et planifiez."
      : adminSection === "delivery"
        ? "Rendez-vous confirmes: compte-rendu, photos et passage en effectue."
        : adminSection === "clients"
          ? "Fiches, formules, BC'Coins et historique client."
          : "Hall, agenda, livraison et clients.";

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

  function renderHomePage() {
    return (
      <>
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="bb-surface p-6">
            <div className="bb-section-head">
              <div>
                <p className="bb-eyebrow">Vue rapide</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Les chiffres utiles du jour
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                { icon: Inbox, tint: "amber", label: "En attente", value: pendingRequests.length, copy: "Demandes a traiter" },
                { icon: CalendarClock, tint: "sky", label: "Prochains passages", value: upcomingAppointments.length, copy: "Agenda actif" },
                { icon: Coins, tint: "gold", label: "Credits restants", value: totalCreditsRemaining, copy: `${clientsLowOnCredits} client(s) en tension` },
                { icon: CheckCircle2, tint: "emerald", label: "Effectues ce mois", value: doneThisMonth, copy: "Prestations cloturees" },
              ].map((metric, index) => {
                const MetricIcon = metric.icon;
                const tints: Record<string, string> = {
                  amber: "border-amber-300/25 bg-amber-300/10 text-amber-200",
                  sky: "border-sky-300/25 bg-sky-300/10 text-sky-200",
                  gold: "border-[#f7b955]/25 bg-[#f7b955]/10 text-[#ffe8a8]",
                  emerald: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
                };
                return (
                  <article className={`bb-metric bb-rise bb-rise-${Math.min(index + 1, 4)}`} key={metric.label}>
                    <span className={`mb-4 inline-grid h-10 w-10 place-items-center rounded-xl border ${tints[metric.tint]}`}>
                      <MetricIcon className="h-5 w-5" />
                    </span>
                    <p className="text-xs uppercase tracking-[0.16em] text-white/40">{metric.label}</p>
                    <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{metric.value}</p>
                    <p className="mt-2 text-sm text-white/55">{metric.copy}</p>
                  </article>
                );
              })}
            </div>
          </article>

          <article className="bb-surface p-6">
            <div className="bb-section-head">
              <div>
                <p className="bb-eyebrow">Raccourcis</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Demarrage rapide
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {firstPendingRequest && (
                <Link className="bb-button-brand justify-center" to={appointmentAdminLink(firstPendingRequest)}>
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Ouvrir la prochaine demande
                </Link>
              )}
              {firstUpcomingAppointment && (
                <Link className="bb-button-ghost justify-center" to={appointmentAdminLink(firstUpcomingAppointment)}>
                  <Clock3 className="mr-2 h-4 w-4" />
                  Ouvrir le prochain passage
                </Link>
              )}
              <button className="bb-button-ghost justify-center" onClick={openCreateProfile} type="button">
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
                {exportingData ? "Export..." : "Exporter les donnees"}
              </button>
            </div>
          </article>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { icon: CalendarClock, title: "Agenda", copy: "Demandes, planning et validations.", badge: `${pendingRequests.length} attente`, to: "/admin/appointments" },
            { icon: Truck, title: "Livraison", copy: "Rendez-vous confirmes a preparer.", badge: `${upcomingAppointments.length} actifs`, to: "/admin/delivery" },
            { icon: Users, title: "Clients", copy: "Fiches, credits et historique.", badge: `${clients.length} fiche(s)`, to: "/admin/clients" },
          ].map((tile) => {
            const TileIcon = tile.icon;
            return (
              <Link
                className="bb-surface bb-hover-lift group flex items-center gap-4 p-5"
                key={tile.title}
                to={tile.to}
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#f7b955]/20 bg-[#f7b955]/[0.08] text-[#f7b955]">
                  <TileIcon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-white">{tile.title}</span>
                    <span className="bb-pill border-white/10 bg-white/[0.04] text-[10px] text-white/60">{tile.badge}</span>
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-white/55">{tile.copy}</span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-white/35 transition group-hover:translate-x-1 group-hover:text-[#f7b955]" />
              </Link>
            );
          })}
        </section>
      </>
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
                    <p className="bb-eyebrow">Etape 1</p>
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
                    <Loader2 className="h-4 w-4 animate-spin text-[#f7b955]" />
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
                                ? "border-[#f7b955]/45 bg-[#f7b955]/10 shadow-[0_18px_48px_rgba(247,185,85,0.12)]"
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
                                  {appointment.vehicleModel || "Vehicule non renseigne"}
                                </p>
                              </div>
                              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-white/30 transition group-hover:translate-x-1 group-hover:text-[#f7b955]" />
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
                    {boardTab === "agenda" ? "Rendez-vous en attente" : "Rendez-vous confirmes"}
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
                    placeholder="Client, vehicule, note, date..."
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
                            ? "border-[#f7b955]/45 bg-[#f7b955]/10 text-white"
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
                    <Loader2 className="h-4 w-4 animate-spin text-[#f7b955]" />
                    Chargement de l'agenda...
                  </div>
                ) : agendaSections.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-[24px] border border-white/10 bg-black/20 p-8 text-center">
                    <span className="inline-grid h-12 w-12 place-items-center rounded-2xl border border-white/12 bg-white/[0.04] text-white/40">
                      <CalendarClock className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-base font-semibold text-white">
                        {boardTab === "agenda" ? "Aucune demande en attente" : "Aucun rendez-vous confirme"}
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
                                  ? "border-[#f7b955]/45 bg-[#f7b955]/10 shadow-[0_18px_48px_rgba(247,185,85,0.12)]"
                                  : "border-white/10 bg-black/20 hover:border-white/20",
                                highlighted && "ring-1 ring-[#f7b955]/40",
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
                                </div>
                                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-white/30 transition group-hover:translate-x-1 group-hover:text-[#f7b955]" />
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
                  <p className="bb-eyebrow">Etape 2</p>
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

              {!selectedAppointment || !selectedOnBoard ? (
                <div className="mt-6 flex flex-col items-center gap-3 rounded-[28px] border border-white/10 bg-white/[0.03] p-8 text-center">
                  <span className="inline-grid h-12 w-12 place-items-center rounded-2xl border border-white/12 bg-white/[0.04] text-white/35">
                    <CalendarClock className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-white">Aucun rendez-vous selectionne</p>
                    <p className="mt-1 text-sm leading-6 text-white/55">
                      {boardTab === "agenda"
                        ? "Choisissez une demande en attente a gauche."
                        : "Choisissez un rendez-vous confirme a gauche pour le traiter."}
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
                  <div className="mt-4 rounded-[28px] border border-[#f7b955]/18 bg-[linear-gradient(180deg,rgba(247,185,85,0.08),rgba(255,255,255,0.02))] p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="inline-grid h-9 w-9 place-items-center rounded-xl border border-[#f7b955]/25 bg-[#f7b955]/10 text-[#ffe8a8]">
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
                            <Loader2 className="h-4 w-4 animate-spin text-[#f7b955]" />
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
                  <div className="mt-4 rounded-[28px] border border-[#f7b955]/20 bg-[linear-gradient(180deg,rgba(247,185,85,0.08),rgba(255,255,255,0.02))] p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="bb-eyebrow">Tarif a valider</p>
                        <h3 className="bb-display mt-2 text-xl font-semibold text-white">
                          {selectedAppointment.priceStatus === "waiting_photos"
                            ? "Photos demandees"
                            : selectedAppointment.priceStatus === "waiting_client_approval"
                              ? "En attente accord client"
                              : selectedAppointment.priceStatus === "waiting_payment"
                                ? "Le client doit recharger"
                                : selectedAppointment.priceStatus === "approved"
                                  ? "Tarif valide et credits consommes"
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
                              ? "border-[#f7b955]/45 bg-[#f7b955]/10 text-white"
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
                          placeholder="Ex: 6 credits"
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
                        placeholder="Explique au client pourquoi ce tarif (etat du vehicule, prestation...)"
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
                          <p className="text-xs uppercase tracking-[0.16em] text-white/35">Vehicule</p>
                          <p className="mt-1 text-sm font-semibold text-white">
                            {selectedAppointment.vehicleModel || "Vehicule non renseigne"}
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
                              <p className="text-sm text-white/70">Evaluation client</p>
                            </div>
                            <p className="text-sm leading-6 text-white/60">
                              {selectedAppointment.userReview || "Aucun commentaire ecrit."}
                            </p>
                          </div>
                        ) : (
                          <p className="mt-2 text-sm leading-6 text-white/60">
                            Aucun avis client enregistre pour le moment.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {(selectedAppointment.status === "confirmed" || selectedAppointment.status === "done") && (
                  <>
                  {/* Compte-rendu */}
                  <div className="mt-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                    <p className="bb-eyebrow">
                      Compte-rendu (visible par le client)
                    </p>
                    <p className="mt-3 text-sm leading-6 text-white/55">
                      Ce commentaire est affiche au client sur son rendez-vous (compte-rendu, conseils, particularites).
                    </p>
                    <textarea
                      className="bb-textarea mt-4"
                      onChange={(event) =>
                        setNoteDrafts((current) => ({
                          ...current,
                          [selectedAppointment.id]: event.target.value,
                        }))
                      }
                      placeholder="Compte-rendu, preparation, particularites du vehicule..."
                      value={noteDrafts[selectedAppointment.id] ?? ""}
                    />
                    <button
                      className="bb-button-brand mt-4"
                      disabled={busyAction}
                      onClick={() => {
                        void saveAppointmentWorkspace(selectedAppointment.id);
                      }}
                      type="button"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {photoFile ? "Enregistrer la note et la photo" : "Enregistrer"}
                    </button>
                  </div>

                  {/* Photos */}
                  <div className="mt-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-center gap-3">
                      <span className="inline-grid h-9 w-9 place-items-center rounded-xl border border-[#f7b955]/25 bg-[#f7b955]/10 text-[#ffe8a8]">
                        <Camera className="h-4 w-4" />
                      </span>
                      <div className="flex-1">
                        <p className="bb-eyebrow">Photos</p>
                        <p className="mt-0.5 text-sm text-white/55">
                          Ajoute tes visuels directement sur le dossier actif.
                        </p>
                      </div>
                      {photosLoading && (
                        <Loader2 className="h-4 w-4 animate-spin text-[#f7b955]" />
                      )}
                    </div>

                    <div className="mt-4 grid gap-3">
                      <label className="rounded-[22px] border border-dashed border-white/15 bg-white/[0.03] p-4 text-sm text-white/65">
                        <div className="flex items-center gap-2">
                          <Camera className="h-4 w-4 text-[#f7b955]" />
                          {photoFile ? photoFile.name : "Choisir une photo"}
                        </div>
                        <input
                          className="sr-only"
                          onChange={(event) => {
                            setPhotoFile(event.target.files?.[0] ?? null);
                          }}
                          ref={fileInputRef}
                          type="file"
                        />
                      </label>
                      <input
                        className="bb-input"
                        onChange={(event) => setPhotoFormCaption(event.target.value)}
                        placeholder="Legende optionnelle"
                        value={photoFormCaption}
                      />
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      {!photosLoading && publicAppointmentPhotos.length === 0 && (
                        <>
                          {Array.from({ length: 3 }).map((_, index) => (
                            <div
                              className="flex h-24 items-center justify-center rounded-[22px] border border-dashed border-white/10 bg-black/15 text-center text-xs uppercase tracking-[0.16em] text-white/30"
                              key={index}
                            >
                              Aucune photo
                            </div>
                          ))}
                        </>
                      )}

                      {publicAppointmentPhotos.map((photo) => (
                        <div className="space-y-2" key={photo.id}>
                          <button
                            className="block overflow-hidden rounded-[22px] border border-white/10 bg-black/30"
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
                          <p className="min-w-0 text-xs text-white/45">
                            {photo.caption || "Sans legende"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
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
                  <Loader2 className="h-4 w-4 animate-spin text-[#f7b955]" />
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
                          {activeClientContext.vehicleModel || "Vehicule non renseigne"}
                        </p>
                      </div>
                      <div className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 sm:w-auto sm:text-right">
                        <p className="text-xs uppercase tracking-[0.16em] text-white/35">
                          Credits
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
                      <p>{activeClientContext.phone || "Telephone non renseigne"}</p>
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
                                ? "border-[#f7b955]/45 bg-[#f7b955]/10"
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
            <span className="mb-4 inline-grid h-10 w-10 place-items-center rounded-xl border border-[#f7b955]/25 bg-[#f7b955]/10 text-[#ffe8a8]">
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
            <p className="mt-2 text-sm text-white/55">Credits bas</p>
          </article>
          <article className="bb-metric bb-rise bb-rise-3">
            <span className="mb-4 inline-grid h-10 w-10 place-items-center rounded-xl border border-emerald-300/25 bg-emerald-300/10 text-emerald-200">
              <Coins className="h-5 w-5" />
            </span>
            <p className="text-xs uppercase tracking-[0.16em] text-white/40">
              Credits cumules
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
                <Users className="h-3.5 w-3.5 text-[#f7b955]" />
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
                  { key: "data" as const, label: "Data" },
                  { key: "pro" as const, label: "Pro" },
                  { key: "all" as const, label: "Tout" },
                ].map((filter) => (
                  <button
                    className={cn(
                      "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition duration-200",
                      clientTypeFilter === filter.key
                        ? "border-[#f7b955]/45 bg-[#f7b955]/10 text-white"
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
                  <Loader2 className="h-4 w-4 animate-spin text-[#f7b955]" />
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
                          ? "border-[#f7b955]/45 bg-[#f7b955]/10 shadow-[0_18px_48px_rgba(247,185,85,0.12)]"
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
                            ? "border-[#f7b955]/35 bg-[#f7b955]/15 text-[#ffe8a8]"
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
                              <span className="bb-pill border-[#f7b955]/35 bg-[#f7b955]/10 text-[#ffe8a8]">
                                <Crown className="h-3 w-3" />
                              </span>
                            )}
                            <span className={cn("bb-pill", creditsTint)}>
                              {client.formulaRemaining}/{client.formulaTotal}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-white/50">
                            {client.vehicleModel || "Vehicule non renseigne"}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="bb-pill border-white/10 bg-white/[0.03] text-white/40">
                              {client.clientType === "data" ? "Data" : client.cardCode || "BBX"}
                            </span>
                            {client.city && (
                              <span className="bb-pill border-white/10 bg-white/[0.03] text-white/40">
                                {client.city}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-white/25 transition group-hover:translate-x-1 group-hover:text-[#f7b955]" />
                      </div>

                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#f7b955] to-[#ff7a18]"
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
                      {busyFormulaRecap ? "Envoi..." : "Envoyer recap"}
                    </button>
                  </div>
                )}
              </div>

              {clientLoading || isNavigatingSelection ? (
                <div className="mt-6 bb-surface flex items-center gap-3 px-5 py-4 text-sm text-white/65">
                  <Loader2 className="h-4 w-4 animate-spin text-[#f7b955]" />
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
                          ? "border-[#f7b955]/35 bg-[#f7b955]/[0.12] text-[#ffe8a8]"
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
                            <div className="bb-pill border-[#f7b955]/35 bg-[#f7b955]/10 text-[#ffe8a8]">
                              <Crown className="h-3.5 w-3.5" />
                              Fondateur
                            </div>
                          )}
                        </div>
                        <h3 className="bb-display mt-3 text-2xl font-semibold text-white">
                          {fullClientName(managedClient)}
                        </h3>
                        <p className="mt-1 text-sm text-white/55">
                          {managedClient.vehicleModel || "Vehicule non renseigne"}
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
                        <p className="text-sm text-white/35">Telephone non renseigne</p>
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
                    </div>
                  </div>

                  {/* Formule + Conditions */}
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="bb-eyebrow">Formule & validite</p>
                          <p className="mt-2 text-lg font-semibold text-white">
                            {managedClient.formulaName || "Formule libre"}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "bb-pill",
                            managedClientFormulaExpired
                              ? "border-rose-400/35 bg-rose-300/10 text-rose-100"
                              : "border-emerald-400/35 bg-emerald-300/10 text-emerald-100",
                          )}
                        >
                          {managedClientFormulaExpired ? "Expiree" : "Active"}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-white/35">
                            Date d&apos;achat
                          </p>
                          <p className="mt-2 text-sm font-semibold text-white">
                            {formatUnixDateFR(managedClient.formulaPurchasedAt)}
                          </p>
                        </div>
                        <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-white/35">
                            Date d&apos;expiration
                          </p>
                          <p className="mt-2 text-sm font-semibold text-white">
                            {formatUnixDateFR(managedClient.formulaExpiresAt)}
                          </p>
                        </div>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-white/55">
                        Credits disponibles: {managedClient.formulaRemaining} / {managedClient.formulaTotal}
                      </p>
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="bb-eyebrow">Conditions & recap</p>
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
                            ? "Le recapitulatif client peut etre renvoye depuis cette fiche."
                            : "Ajoutez un email client pour envoyer le recapitulatif formule."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Qualite vehicule + BC'Coins */}
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                      <p className="bb-eyebrow mb-3">Qualite vehicule moyenne</p>
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
                        <div className="bb-pill border-[#f7b955]/25 bg-[#f7b955]/10 text-[#ffe8a8]">
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
                            <p className="text-sm text-white/50">Aucune demande enregistree.</p>
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
                                <ArrowRight className="h-4 w-4 shrink-0 text-white/25 transition group-hover:translate-x-1 group-hover:text-[#f7b955]" />
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
                      <span className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#f7b955]/25 bg-[#f7b955]/10 text-[#ffe8a8]">
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
                    <p className="text-base font-semibold text-white">Aucun client selectionne</p>
                    <p className="mt-1 text-sm leading-6 text-white/50">
                      Choisissez un client dans la liste pour ouvrir sa fiche detaillee.
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
        <div className="absolute left-[-6rem] top-24 h-72 w-72 rounded-full bg-[#f7b955]/10 blur-3xl" />
        <div className="absolute right-[-7rem] top-12 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#ff7a18]/10 blur-3xl" />
      </div>

      <main className="bb-content space-y-6 md:space-y-8">
        <section className="bb-surface-strong overflow-hidden p-6 md:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="bb-pill border-white/12 bg-white/[0.04] text-white/75">
                <Sparkles className="h-3.5 w-3.5 text-[#f7b955]" />
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

            <div className="grid grid-cols-2 gap-2 md:hidden">
              {ADMIN_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = adminSection === item.key;
                return (
                  <Link
                    className={cn(
                      "flex min-h-[78px] flex-col items-center justify-center gap-2 rounded-[22px] border px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] transition duration-200",
                      active
                        ? "border-[#f7b955]/45 bg-[#f7b955]/10 text-white shadow-[0_18px_48px_rgba(247,185,85,0.12)]"
                        : "border-white/10 bg-white/[0.03] text-white/60",
                    )}
                    key={item.key}
                    to={adminSectionHrefs[item.key]}
                  >
                    <Icon className={cn("h-4 w-4", active && "text-[#f7b955]")} />
                    <span>{item.shortLabel}</span>
                  </Link>
                );
              })}
            </div>

            <div className="hidden gap-3 md:grid md:grid-cols-4">
              <Link
                className={cn(
                  "rounded-[28px] border p-5 transition duration-200",
                  adminSection === "home"
                    ? "border-[#f7b955]/45 bg-[#f7b955]/10 shadow-[0_18px_48px_rgba(247,185,85,0.12)]"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]",
                )}
                to={adminSectionHrefs.home}
              >
                <p className="text-xs uppercase tracking-[0.16em] text-white/40">Hall</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Vue d'ensemble</h2>
                <p className="mt-3 text-sm leading-6 text-white/62">
                  Entrez par une page simple puis ouvrez la bonne zone de travail.
                </p>
              </Link>

              <Link
                className={cn(
                  "rounded-[28px] border p-5 transition duration-200",
                  adminSection === "appointments"
                    ? "border-[#f7b955]/45 bg-[#f7b955]/10 shadow-[0_18px_48px_rgba(247,185,85,0.12)]"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]",
                )}
                to={adminSectionHrefs.appointments}
              >
                <p className="text-xs uppercase tracking-[0.16em] text-white/40">Section</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Agenda</h2>
                <p className="mt-3 text-sm leading-6 text-white/62">
                  Demandes en attente: validez le tarif et planifiez.
                </p>
              </Link>

              <Link
                className={cn(
                  "rounded-[28px] border p-5 transition duration-200",
                  adminSection === "delivery"
                    ? "border-[#f7b955]/45 bg-[#f7b955]/10 shadow-[0_18px_48px_rgba(247,185,85,0.12)]"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]",
                )}
                to={adminSectionHrefs.delivery}
              >
                <p className="text-xs uppercase tracking-[0.16em] text-white/40">Section</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Livraison</h2>
                <p className="mt-3 text-sm leading-6 text-white/62">
                  Rendez-vous confirmes: compte-rendu, photos et passage en effectue.
                </p>
              </Link>

              <Link
                className={cn(
                  "rounded-[28px] border p-5 transition duration-200",
                  adminSection === "clients"
                    ? "border-[#f7b955]/45 bg-[#f7b955]/10 shadow-[0_18px_48px_rgba(247,185,85,0.12)]"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]",
                )}
                to={adminSectionHrefs.clients}
              >
                <p className="text-xs uppercase tracking-[0.16em] text-white/40">Section</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Clients</h2>
                <p className="mt-3 text-sm leading-6 text-white/62">
                  Fiches, credits, contact, formules et historique client.
                </p>
              </Link>
            </div>
          </div>
        </section>

        {adminSection === "appointments" || adminSection === "delivery"
          ? renderAppointmentsPage()
          : adminSection === "clients"
            ? renderClientsPage()
            : renderHomePage()}
      </main>

      <nav className="fixed inset-x-0 bottom-3 z-30 px-3 md:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-4 rounded-[28px] border border-white/12 bg-[#090d12]/94 p-1.5 shadow-[0_24px_80px_rgba(0,0,0,0.46)] backdrop-blur-2xl">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = adminSection === item.key;
            return (
              <Link
                className={cn(
                  "flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-[20px] px-1.5 py-2 text-[10px] font-semibold transition duration-200",
                  active
                    ? "bg-gradient-to-b from-[#f7b955]/18 to-[#ff7a18]/12 text-white shadow-[0_10px_24px_rgba(247,185,85,0.12)]"
                    : "text-white/54",
                )}
                key={item.key}
                to={adminSectionHrefs[item.key]}
              >
                <Icon className={cn("h-4 w-4", active && "text-[#f7b955]")} />
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
                  {profileMode === "new" ? "Creation client" : "Edition client"}
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
                  Societe
                </span>
                <input
                  className="bb-input"
                  onChange={(event) => updateProfileDraft("company", event.target.value)}
                  value={profileDraft.company}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Telephone
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
                  Type de client
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { value: "bbx" as const, label: "BBX" },
                    { value: "data" as const, label: "Data" },
                    { value: "pro" as const, label: "Pro" },
                  ].map((option) => (
                    <button
                      className={cn(
                        "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition duration-200",
                        profileDraft.clientType === option.value
                          ? "border-[#f7b955]/45 bg-[#f7b955]/10 text-white"
                          : "border-white/10 bg-black/20 text-white/60 hover:bg-white/[0.04]",
                      )}
                      key={option.value}
                      onClick={() =>
                        setProfileDraft((current) =>
                          current
                            ? {
                                ...current,
                                clientType: option.value,
                                isFounder:
                                  option.value === "bbx" ? current.isFounder : false,
                              }
                            : current,
                        )
                      }
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
                    <input
                      checked={profileDraft.isFounder}
                      disabled={profileDraft.clientType !== "bbx"}
                      onChange={(event) =>
                        setProfileDraft((current) =>
                          current
                            ? {
                                ...current,
                                isFounder: event.target.checked,
                              }
                            : current,
                        )
                      }
                      type="checkbox"
                    />
                    <span>Compte fondateur</span>
                  </label>

                  <label className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
                    <input
                      checked={profileDraft.sendWelcomeEmail}
                      onChange={(event) =>
                        setProfileDraft((current) =>
                          current
                            ? {
                                ...current,
                                sendWelcomeEmail: event.target.checked,
                              }
                            : current,
                        )
                      }
                      type="checkbox"
                    />
                    <span>Envoyer le mail de bienvenue</span>
                  </label>
                </div>

                {profileDraft.clientType === "data" && (
                  <p className="mt-3 text-sm leading-6 text-white/55">
                    Un client Data n'a pas de carte BBX publique. Il reste uniquement dans la base admin pour le suivi et la relance.
                  </p>
                )}

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
                  Vehicule
                </span>
                <input
                  className="bb-input"
                  onChange={(event) =>
                    updateProfileDraft("vehicleModel", event.target.value)
                  }
                  value={profileDraft.vehicleModel}
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Formule
                </span>
                <input
                  className="bb-input"
                  onChange={(event) =>
                    updateProfileDraft("formulaName", event.target.value)
                  }
                  value={profileDraft.formulaName}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Total credits
                </span>
                <input
                  className="bb-input"
                  min={0}
                  onChange={(event) =>
                    updateProfileDraft("formulaTotal", event.target.value)
                  }
                  type="number"
                  value={profileDraft.formulaTotal}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Credits restants
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
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Date d'achat
                </span>
                <input
                  className="bb-input"
                  onChange={(event) =>
                    updateProfileDraft("formulaPurchasedAt", event.target.value)
                  }
                  type="date"
                  value={profileDraft.formulaPurchasedAt}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Date d'expiration
                </span>
                <input
                  className="bb-input"
                  onChange={(event) =>
                    updateProfileDraft("formulaExpiresAt", event.target.value)
                  }
                  type="date"
                  value={profileDraft.formulaExpiresAt}
                />
              </label>
              {profileMode === "edit" && selectedClientData && (
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 md:col-span-2">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                    Conditions & recap
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
                <p className="bb-eyebrow">Formule sur mesure</p>
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

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Credits max
                </span>
                <input
                  className="bb-input"
                  min={0}
                  onChange={(event) => setFormulaDraftTotal(Number(event.target.value))}
                  type="number"
                  value={formulaDraftTotal ?? 0}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Credits restants
                </span>
                <input
                  className="bb-input"
                  max={formulaDraftTotal ?? undefined}
                  min={0}
                  onChange={(event) =>
                    setFormulaDraftRemaining(Number(event.target.value))
                  }
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
