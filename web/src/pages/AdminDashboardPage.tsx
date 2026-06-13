import * as React from "react";
import {
  ArrowLeft,
  CalendarClock,
  Camera,
  CarFront,
  CheckCircle2,
  Clock3,
  Copy,
  Crown,
  Download,
  ExternalLink,
  Loader2,
  LogOut,
  Mail,
  PencilLine,
  Phone,
  Plus,
  Save,
  Search,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

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
  clientType: "bbx" | "data";
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
  clientType: "bbx" | "data";
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

type AppointmentFilterKey = "all" | AppointmentStatus | "client";
type AdminSection = "home" | "appointments" | "clients";

const APPOINTMENT_FILTERS: Array<{
  key: AppointmentFilterKey;
  label: string;
}> = [
  { key: "all", label: "Tout" },
  { key: "requested", label: "En attente" },
  { key: "confirmed", label: "Confirmes" },
  { key: "done", label: "Effectues" },
  { key: "cancelled", label: "Annules" },
  { key: "client", label: "Client actif" },
];

const ADMIN_NAV_ITEMS: Array<{
  key: AdminSection;
  label: string;
  shortLabel: string;
  icon: typeof Sparkles;
}> = [
  { key: "home", label: "Hall principal", shortLabel: "Hall", icon: Sparkles },
  { key: "appointments", label: "Agenda admin", shortLabel: "Agenda", icon: CalendarClock },
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
  const [clientTypeFilter, setClientTypeFilter] = React.useState<"bbx" | "data" | "all">("bbx");
  const [exportingData, setExportingData] = React.useState(false);
  const [pointsDeltaDraft, setPointsDeltaDraft] = React.useState("100");

  const [filterClientQuery, setFilterClientQuery] = React.useState("");
  const deferredClientQuery = React.useDeferredValue(filterClientQuery);

  const [appointmentQuery, setAppointmentQuery] = React.useState("");
  const deferredAppointmentQuery = React.useDeferredValue(appointmentQuery);
  const [appointmentFilter, setAppointmentFilter] =
    React.useState<AppointmentFilterKey>("all");

  const [selectedAppointmentId, setSelectedAppointmentId] =
    React.useState<number | null>(null);
  const [highlightAppointmentId, setHighlightAppointmentId] =
    React.useState<number | null>(null);
  const [noteDrafts, setNoteDrafts] = React.useState<Record<number, string>>({});
  const [cleanlinessDrafts, setCleanlinessDrafts] = React.useState<
    Record<number, CleanlinessRating | null>
  >({});

  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [photoFormCaption, setPhotoFormCaption] = React.useState("");
  const [currentPhotos, setCurrentPhotos] = React.useState<AdminAppointmentPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const appointmentWorkspaceRef = React.useRef<HTMLElement | null>(null);

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
        setClientsLoading(true);
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
        setGlobalAppointmentsLoading(true);

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
      clients: `/admin/clients${clientQuery}`,
    };
  }, [selectedAppointment, selectedClientId]);

  React.useEffect(() => {
    const fallback = pickDefaultAdminAppointment(globalAppointments);

    if (selectedAppointmentId == null && fallback) {
      setSelectedAppointmentId(fallback.id);
      if (selectedClientId == null) {
        setSelectedClientId(fallback.clientId);
      }
    }
  }, [globalAppointments, selectedAppointmentId, selectedClientId]);

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

  function showToast(message: string) {
    setToast(message);
  }

  async function copyClientCardLink(client: AdminClient) {
    if (client.clientType !== "bbx" || !client.slug) {
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
        body: JSON.stringify({ status }),
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

      showToast("Statut mis a jour.");
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

  async function saveAppointmentWorkspace(appointmentId: number) {
    const note = noteDrafts[appointmentId] ?? "";
    const cleanlinessRating = cleanlinessDrafts[appointmentId] ?? null;
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
          body: JSON.stringify({ adminNote: note, cleanlinessRating }),
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
      showToast("Entrez un montant positif ou negatif pour les 🪙 BC'Coins.");
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
            ? "Impossible de retirer plus de 🪙 BC'Coins que le solde disponible."
            : "La mise a jour des 🪙 BC'Coins a echoue.",
        );
        return;
      }

      syncManagedClient(json.client as AdminClient);
      showToast(
        delta > 0
          ? `${Math.abs(delta)} 🪙 BC'Coins ajoutes.`
          : `${Math.abs(delta)} 🪙 BC'Coins retires.`,
      );
    } catch (error) {
      showToast("Erreur reseau pendant la mise a jour des 🪙 BC'Coins.");
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

  const pendingRequests = React.useMemo(
    () =>
      sortedGlobalAsc.filter((appointment) => appointment.status === "requested"),
    [sortedGlobalAsc],
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

    return sortedGlobalAsc.filter((appointment) => {
      if (
        appointmentFilter === "client" &&
        selectedClientData &&
        appointment.clientId !== selectedClientData.id
      ) {
        return false;
      }

      if (
        appointmentFilter !== "all" &&
        appointmentFilter !== "client" &&
        appointment.status !== appointmentFilter
      ) {
        return false;
      }

      if (!query) return true;
      return appointmentSearchText(appointment).includes(query);
    });
  }, [appointmentFilter, deferredAppointmentQuery, selectedClientData, sortedGlobalAsc]);

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
      : adminSection === "clients"
        ? "Clients"
        : "Hall principal";
  const sectionSubtitle =
    adminSection === "appointments"
      ? "Demandes, planning et actions de validation sur un seul flux."
      : adminSection === "clients"
        ? "Fiches, formules, 🪙 BC'Coins et historique client."
        : "Trois zones claires: hall, agenda et clients.";

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
              <article className="bb-metric">
                <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                  En attente
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {pendingRequests.length}
                </p>
                <p className="mt-2 text-sm text-white/55">Demandes a traiter</p>
              </article>
              <article className="bb-metric">
                <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Prochains passages
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {upcomingAppointments.length}
                </p>
                <p className="mt-2 text-sm text-white/55">Agenda actif</p>
              </article>
              <article className="bb-metric">
                <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Credits restants
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {totalCreditsRemaining}
                </p>
                <p className="mt-2 text-sm text-white/55">
                  {clientsLowOnCredits} client(s) en tension
                </p>
              </article>
              <article className="bb-metric">
                <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Effectues ce mois
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {doneThisMonth}
                </p>
                <p className="mt-2 text-sm text-white/55">Prestations cloturees</p>
              </article>
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

        <section className="grid gap-4 xl:grid-cols-2">
          <article className="bb-surface p-6">
            <div className="bb-section-head">
              <div>
                <p className="bb-eyebrow">Section</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Agenda
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62">
                  Toute la gestion du planning, des demandes en attente et des
                  validations est isolee sur une page dediee.
                </p>
              </div>
              <div className="bb-pill border-white/12 bg-white/[0.04] text-white/70">
                {pendingRequests.length} attente
              </div>
            </div>

            <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm leading-6 text-white/62">
                Vous y retrouvez uniquement l&apos;inbox des demandes, l&apos;agenda
                filtre et le panneau d&apos;action. Le reste disparait pour garder
                un ecran plus lisible, surtout sur mobile.
              </p>
              <div className="mt-5">
                <Link className="bb-button-brand" to="/admin/appointments">
                  Ouvrir l'agenda admin
                </Link>
              </div>
            </div>
          </article>

          <article className="bb-surface p-6">
            <div className="bb-section-head">
              <div>
                <p className="bb-eyebrow">Section</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Clients
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62">
                  Les fiches client, les credits, la formule, le contact et
                  l&apos;historique sont rassembles sur une page dediee.
                </p>
              </div>
              <div className="bb-pill border-white/12 bg-white/[0.04] text-white/70">
                {clients.length} fiche(s)
              </div>
            </div>

            <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm leading-6 text-white/62">
                Cette zone sert a retrouver un client, modifier son profil,
                ajuster ses credits et ouvrir facilement son historique.
              </p>
              <div className="mt-5">
                <Link className="bb-button-brand" to="/admin/clients">
                  Ouvrir la gestion client
                </Link>
              </div>
            </div>
          </article>
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
            <article className="bb-surface p-6">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="bb-eyebrow">Etape 1</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                      Choisir un rendez-vous
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-white/62">
                      Commencez par ouvrir un dossier. Les demandes en attente sont
                      affichees en premier, puis la liste complete juste en dessous.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-white/35">
                        En attente
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {pendingRequests.length}
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-white/35">
                        Visibles
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-white">
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
                ) : pendingRequests.length > 0 ? (
                  <div className="rounded-[28px] border border-amber-300/20 bg-[#f7b955]/8 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-[#f7b955]">
                          Priorite
                        </p>
                        <h3 className="mt-2 text-xl font-semibold text-white">
                          Demandes en attente
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-white/62">
                          Ouvrez un dossier pour le traiter dans la colonne de droite.
                        </p>
                      </div>
                      <div className="bb-pill border-amber-300/25 bg-amber-300/10 text-amber-100">
                        {pendingRequests.length} a traiter
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      {visiblePendingRequests.map((appointment) => {
                        const active = appointment.id === selectedAppointmentId;
                        return (
                          <button
                            className={cn(
                              "w-full rounded-[24px] border p-4 text-left transition duration-200",
                              active
                                ? "border-[#f7b955]/45 bg-[#f7b955]/10 shadow-[0_18px_48px_rgba(247,185,85,0.12)]"
                                : "border-white/10 bg-black/20 hover:bg-white/[0.05]",
                            )}
                            key={appointment.id}
                            onClick={() => focusAppointment(appointment)}
                            type="button"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="bb-pill border-amber-300/25 bg-amber-300/10 text-amber-100">
                                    {slotLabel(appointmentSlot(appointment))}
                                  </div>
                                  <div
                                    className={cn(
                                      "bb-pill border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                                      locationClasses(appointment.location),
                                    )}
                                  >
                                    {locationLabel(appointment.location)}
                                  </div>
                                </div>

                                <h4 className="mt-3 text-lg font-semibold text-white">
                                  {appointment.clientName || "Client"}
                                </h4>
                                <p className="mt-1 text-sm text-white/58">
                                  {formatDateFR(appointment.date)} -{" "}
                                  {slotWindowLabel(appointmentSlot(appointment))} -{" "}
                                  {formatTimeHHMM(appointment.time)}
                                </p>
                                <p className="mt-2 text-sm text-white/58">
                                  {appointment.vehicleModel || "Vehicule non renseigne"}
                                  {appointment.vehiclePlate
                                    ? ` / ${appointment.vehiclePlate}`
                                    : ""}
                                </p>
                              </div>

                              <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/65">
                                Ouvrir le dossier
                              </div>
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
                ) : (
                  <div className="rounded-[28px] border border-emerald-300/20 bg-emerald-300/10 p-5">
                    <p className="text-lg font-semibold text-white">
                      Rien en attente pour le moment
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/65">
                      La liste ci-dessous contient maintenant uniquement le planning a suivre.
                    </p>
                  </div>
                )}
              </div>
            </article>

            <section className="bb-surface p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-white/35">
                    Liste complete
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    Tous les rendez-vous
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
                    Recherchez un client ou filtrez un statut pour retrouver rapidement le bon dossier.
                  </p>
                </div>
                <div className="bb-pill border-white/12 bg-white/[0.04] text-white/70">
                  {filteredAgendaAppointments.length} resultat(s)
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <input
                    className="bb-input pl-11"
                    onChange={(event) => setAppointmentQuery(event.target.value)}
                    placeholder="Client, vehicule, plaque, note, date..."
                    value={appointmentQuery}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {APPOINTMENT_FILTERS.map((filter) => (
                    <button
                      className={cn(
                        "rounded-full border px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] transition duration-200",
                        appointmentFilter === filter.key
                          ? "border-[#f7b955]/45 bg-[#f7b955]/10 text-white"
                          : "border-white/10 bg-white/[0.03] text-white/65 hover:bg-white/[0.05]",
                      )}
                      key={filter.key}
                      onClick={() => setAppointmentFilter(filter.key)}
                      type="button"
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 space-y-5">
                {globalAppointmentsLoading ? (
                  <div className="bb-surface flex items-center gap-3 px-5 py-4 text-sm text-white/65">
                    <Loader2 className="h-4 w-4 animate-spin text-[#f7b955]" />
                    Chargement de l'agenda...
                  </div>
                ) : agendaSections.length === 0 ? (
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                    <p className="text-lg font-semibold text-white">
                      Aucun rendez-vous sur ce filtre
                    </p>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
                      Elargissez le filtre ou la recherche pour retrouver un autre dossier.
                    </p>
                  </div>
                ) : (
                  agendaSections.map((section) => (
                    <div key={section.date}>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-white/35">
                            Jour
                          </p>
                          <h4 className="mt-1 text-lg font-semibold capitalize text-white">
                            {formatDateFR(section.date, { weekday: "long" })}
                          </h4>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
                          {section.items.length} rdv
                        </div>
                      </div>

                      <div className="space-y-3">
                        {section.items.map((appointment) => {
                          const active = appointment.id === selectedAppointmentId;
                          const highlighted = appointment.id === highlightAppointmentId;

                          return (
                            <button
                              className={cn(
                                "w-full rounded-[22px] border p-4 text-left transition duration-200",
                                active
                                  ? "border-[#f7b955]/45 bg-[#f7b955]/10 shadow-[0_18px_48px_rgba(247,185,85,0.12)]"
                                  : "border-white/10 bg-black/20 hover:bg-white/[0.05]",
                                highlighted && "ring-1 ring-[#f7b955]/40",
                              )}
                              key={appointment.id}
                              onClick={() => focusAppointment(appointment)}
                              type="button"
                            >
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
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
                                        "bb-pill border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                                        locationClasses(appointment.location),
                                      )}
                                    >
                                      {locationLabel(appointment.location)}
                                    </div>
                                    <div className="bb-pill border-white/12 bg-white/[0.04] text-white/65">
                                      {slotLabel(appointmentSlot(appointment))}
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="text-lg font-semibold text-white">
                                      {slotWindowLabel(appointmentSlot(appointment))} ·{" "}
                                      {formatTimeHHMM(appointment.time)} -{" "}
                                      {appointment.clientName || "Client"}
                                    </h4>
                                    <p className="mt-1 text-sm text-white/58">
                                      {appointment.vehicleModel || "Vehicule"}
                                      {appointment.vehiclePlate
                                        ? ` / ${appointment.vehiclePlate}`
                                        : ""}
                                    </p>
                                  </div>

                                  <p className="max-w-2xl text-sm leading-6 text-white/58">
                                    {previewText(
                                      appointment.adminNote || appointment.clientNote,
                                      "Aucune note enregistree sur ce rendez-vous.",
                                    )}
                                  </p>
                                </div>

                                <p className="text-sm leading-6 text-white/55 md:max-w-xs md:text-right">
                                  {previewText(
                                    appointment.adminNote || appointment.clientNote,
                                    "Aucune note sur ce rendez-vous.",
                                  )}
                                </p>
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

          <aside className="order-1 xl:sticky xl:top-6 xl:order-none xl:self-start">
            <article className="bb-surface self-start p-6" ref={appointmentWorkspaceRef}>
              <div className="bb-section-head">
                <div>
                  <p className="bb-eyebrow">Etape 2</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {selectedAppointment ? "Traiter ce rendez-vous" : "Traiter ce rendez-vous"}
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-white/62">
                    Toute l'action se fait ici: changer le statut, garder une note interne et ajouter des photos.
                  </p>
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

              {!selectedAppointment ? (
                <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
                  <p className="text-lg font-semibold text-white">Aucun rendez-vous selectionne</p>
                  <p className="mt-2 text-sm leading-6 text-white/62">
                    Choisissez une ligne a gauche. La fiche de traitement s'ouvre ici automatiquement.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                          Resume
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold text-white">
                          {selectedAppointment.clientName || "Client"}
                        </h3>
                        <p className="mt-2 text-sm text-white/58">
                          {formatDateFR(selectedAppointment.date)} - {slotLabel(
                            appointmentSlot(selectedAppointment),
                          )}{" "}
                          {slotWindowLabel(appointmentSlot(selectedAppointment))} ·{" "}
                          {formatTimeHHMM(selectedAppointment.time)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <div className="bb-pill border-white/12 bg-white/[0.04] text-white/70">
                          {slotLabel(appointmentSlot(selectedAppointment))}
                        </div>
                        <div
                          className={cn(
                            "bb-pill border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
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

                  <div className="mt-4 rounded-[28px] border border-[#f7b955]/18 bg-[linear-gradient(180deg,rgba(247,185,85,0.10),rgba(255,255,255,0.03))] p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-[#f7b955]">
                          Demande client
                        </p>
                        <h3 className="mt-2 text-xl font-semibold text-white">
                          A lire avant validation
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-white/58">
                          Retrouvez ici le message laisse par le client et les photos jointes au moment
                          de la reservation.
                        </p>
                      </div>
                      <div className="bb-pill border-white/12 bg-white/[0.04] text-white/70">
                        {clientRequestPhotos.length} photo
                        {clientRequestPhotos.length > 1 ? "s" : ""} client
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3">
                      <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-white/35">
                          Commentaire client
                        </p>
                        <p className="mt-2 text-sm leading-6 text-white/70">
                          {selectedAppointment.clientNote || "Aucun commentaire client."}
                        </p>
                      </div>

                      <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-white/35">
                            Photos envoyees a la demande
                          </p>
                          {photosLoading && (
                            <Loader2 className="h-4 w-4 animate-spin text-[#f7b955]" />
                          )}
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          {!photosLoading && clientRequestPhotos.length === 0 && (
                            <div className="sm:col-span-3 rounded-[20px] border border-dashed border-white/10 bg-black/15 px-4 py-6 text-sm text-white/45">
                              Aucune photo client jointe a cette demande.
                            </div>
                          )}

                          {clientRequestPhotos.map((photo) => (
                            <div className="space-y-2" key={photo.id}>
                              <a
                                className="block overflow-hidden rounded-[22px] border border-white/10 bg-black/30"
                                href={photo.url}
                                rel="noreferrer"
                                target="_blank"
                              >
                                <img
                                  alt={photo.caption || "Photo client"}
                                  className="h-28 w-full object-cover transition duration-300 hover:scale-[1.04]"
                                  src={photo.url}
                                />
                              </a>
                              <p className="min-w-0 text-xs text-white/45">
                                {photo.caption || "Photo envoyee par le client"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                      Infos utiles
                    </p>
                    <div className="mt-4 grid gap-3">
                      <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-white/35">
                          Vehicule
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white">
                          {selectedAppointment.vehicleModel || "Vehicule non renseigne"}
                          {selectedAppointment.vehiclePlate
                            ? ` / ${selectedAppointment.vehiclePlate}`
                            : ""}
                        </p>
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

                  <div className="mt-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                      Suivi interne
                    </p>
                    <p className="mt-3 text-sm leading-6 text-white/58">
                      Propre ne change rien. Correct retire 1 credit supplementaire. Sale retire
                      2 credits supplementaires.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {CLEANLINESS_OPTIONS.map((option) => (
                        <button
                          className={cn(
                            "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition duration-200",
                            cleanlinessDrafts[selectedAppointment.id] === option.value
                              ? option.tone
                              : "border-white/10 bg-black/20 text-white/60 hover:bg-white/[0.04]",
                          )}
                          key={option.value}
                          onClick={() =>
                            setCleanlinessDrafts((current) => ({
                              ...current,
                              [selectedAppointment.id]:
                                current[selectedAppointment.id] === option.value
                                  ? null
                                  : option.value,
                            }))
                          }
                          type="button"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
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

                  <div className="mt-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                          Photos
                        </p>
                        <p className="mt-2 text-sm text-white/58">
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
                      <div className="rounded-[22px] border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100/85">
                        Les photos ajoutees ici seront visibles par tous les clients. Les photos
                        envoyees par le client apparaissent plus haut dans la demande.
                      </div>
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
                          <a
                            className="block overflow-hidden rounded-[22px] border border-white/10 bg-black/30"
                            href={photo.url}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <img
                              alt={photo.caption || "Photo rendez-vous"}
                              className="h-24 w-full object-cover transition duration-300 hover:scale-[1.04]"
                              src={photo.url}
                            />
                          </a>
                          <p className="min-w-0 text-xs text-white/45">
                            {photo.caption || "Sans legende"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
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
                          {activeClientContext.vehiclePlate
                            ? ` / ${activeClientContext.vehiclePlate}`
                            : ""}
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
        <section className="hidden gap-3 md:grid md:grid-cols-3">
          <article className="bb-metric">
            <p className="text-xs uppercase tracking-[0.16em] text-white/40">
              Fiches visibles
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {filteredClients.length}
            </p>
            <p className="mt-2 text-sm text-white/55">Clients filtres</p>
          </article>
          <article className="bb-metric">
            <p className="text-xs uppercase tracking-[0.16em] text-white/40">
              En tension
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {clientsLowOnCredits}
            </p>
            <p className="mt-2 text-sm text-white/55">Credits bas</p>
          </article>
          <article className="bb-metric">
            <p className="text-xs uppercase tracking-[0.16em] text-white/40">
              Credits cumules
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {totalCreditsRemaining}
            </p>
            <p className="mt-2 text-sm text-white/55">Base client</p>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
          <aside className="order-2 bb-surface p-5 xl:order-none">
            <div className="bb-section-head">
              <div>
                <p className="bb-eyebrow">Clients</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
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
                  placeholder="Nom, slug, plaque, ville..."
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
                <div className="rounded-[24px] border border-rose-300/20 bg-rose-300/10 p-4 text-sm text-rose-100">
                  {clientsError}
                </div>
              ) : (
                filteredClients.map((client) => {
                  const active = client.id === selectedClientId;
                  const creditsRatio =
                    client.formulaTotal > 0
                      ? clampNumber(client.formulaRemaining / client.formulaTotal, 0, 1)
                      : 0;

                  return (
                    <button
                      className={cn(
                        "w-full rounded-[26px] border p-4 text-left transition duration-200",
                        active
                          ? "border-[#f7b955]/45 bg-[#f7b955]/10 shadow-[0_18px_48px_rgba(247,185,85,0.12)]"
                          : "border-white/10 bg-white/[0.03] hover:-translate-y-1 hover:bg-white/[0.05]",
                      )}
                      key={client.id}
                      onClick={() => focusClient(client)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-white">
                            {fullClientName(client)}
                          </p>
                          <p className="mt-1 text-sm text-white/55">
                            {client.vehicleModel || "Vehicule non renseigne"}
                            {client.vehiclePlate ? ` / ${client.vehiclePlate}` : ""}
                          </p>
                        </div>
                        <div className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/65">
                          {client.formulaRemaining}/{client.formulaTotal}
                        </div>
                      </div>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#f7b955] to-[#ff7a18]"
                          style={{ width: `${creditsRatio * 100}%` }}
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em] text-white/45">
                        <span>{client.slug}</span>
                        <span>{client.clientType === "data" ? "Data" : client.cardCode || "BBX"}</span>
                        {client.isFounder && <span>Fondateur</span>}
                        {client.city && <span>{client.city}</span>}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="order-1 space-y-4 xl:order-none">
            <article className="bb-surface p-6">
              <div className="bb-section-head">
                <div>
                  <p className="bb-eyebrow">Client actif</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
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
                  <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <div className="bb-pill border-white/12 bg-white/[0.04] text-white/70">
                            {managedClient.clientType === "data"
                              ? "Data"
                              : managedClient.cardCode || "Sans code"}
                          </div>
                          {managedClient.isFounder && (
                            <div className="bb-pill border-[#f7b955]/35 bg-[#f7b955]/10 text-[#ffe8a8]">
                              <Crown className="h-3.5 w-3.5" />
                              Fondateur
                            </div>
                          )}
                        </div>
                        <h3 className="mt-4 text-2xl font-semibold text-white">
                          {fullClientName(managedClient)}
                        </h3>
                        <p className="mt-2 text-sm text-white/58">
                          {managedClient.vehicleModel || "Vehicule non renseigne"}
                          {managedClient.vehiclePlate
                            ? ` / ${managedClient.vehiclePlate}`
                            : ""}
                        </p>
                      </div>
                      <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-right">
                        <p className="text-xs uppercase tracking-[0.16em] text-white/35">
                          Credits / 🪙 BC'Coins
                        </p>
                        <p className="mt-2 text-xl font-semibold text-white">
                          {managedClient.formulaRemaining}
                          <span className="ml-1 text-sm text-white/35">
                            / {managedClient.formulaTotal}
                          </span>
                        </p>
                        <p className="mt-2 text-sm text-white/55">{managedClient.bcPoints} points</p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3 text-sm text-white/65">
                      <p>{managedClient.phone || "Telephone non renseigne"}</p>
                      <p>{managedClient.email || "Email non renseigne"}</p>
                      <p>
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

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button className="bb-button-ghost" onClick={openEditProfile} type="button">
                        <PencilLine className="mr-2 h-4 w-4" />
                        Modifier le profil
                      </button>
                      {managedClient.clientType === "bbx" ? (
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

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                            Formule & validite
                          </p>
                          <p className="mt-2 text-lg font-semibold text-white">
                            {managedClient.formulaName || "Formule libre"}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "bb-pill",
                            managedClientFormulaExpired
                              ? "border-rose-400/35 bg-rose-300/10 text-rose-100"
                              : "border-white/12 bg-white/[0.04] text-white/75",
                          )}
                        >
                          {managedClientFormulaExpired ? "Expiree" : "Active"}
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-white/35">
                            Date d'achat
                          </p>
                          <p className="mt-2 text-sm font-semibold text-white">
                            {formatUnixDateFR(managedClient.formulaPurchasedAt)}
                          </p>
                        </div>
                        <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-white/35">
                            Date d'expiration
                          </p>
                          <p className="mt-2 text-sm font-semibold text-white">
                            {formatUnixDateFR(managedClient.formulaExpiresAt)}
                          </p>
                        </div>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-white/62">
                        Credits disponibles: {managedClient.formulaRemaining} / {managedClient.formulaTotal}
                      </p>
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                            Conditions & recap
                          </p>
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

                      <div className="mt-5 space-y-3 text-sm text-white/62">
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

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                      <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                        Qualite vehicule moyenne
                      </p>
                      <div className="mt-3 flex items-center gap-3">
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
                        <p className="text-sm text-white/62">
                          {selectedClient?.cleanliness.averageScore == null
                            ? `${selectedClient?.cleanliness.total || 0} rendez-vous notes`
                            : `Moyenne ${selectedClient.cleanliness.averageScore}/3 sur ${selectedClient.cleanliness.total} rendez-vous`}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                            🪙 BC&apos;Coins
                          </p>
                          <p className="mt-2 text-lg font-semibold text-white">
                            Ajuster le solde ou suivre les demandes
                          </p>
                        </div>
                        <div className="bb-pill border-[#f7b955]/25 bg-[#f7b955]/10 text-[#ffe8a8]">
                          {managedClient.bcPoints} points
                        </div>
                      </div>

                      <div className="mt-5 space-y-3">
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

                      <div className="mt-6 border-t border-white/10 pt-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-white/35">
                          Dernieres demandes 🪙 BC&apos;Coins
                        </p>
                        <div className="mt-3 space-y-2">
                          {selectedClient?.rewardRedemptions.length ? (
                            selectedClient.rewardRedemptions.slice(0, 3).map((redemption) => (
                              <div className="flex items-center justify-between gap-3" key={redemption.id}>
                                <div>
                                  <p className="text-sm font-semibold text-white">
                                    {redemption.rewardLabel}
                                  </p>
                                  <p className="text-xs text-white/45">
                                    {formatUnixDateTimeFR(redemption.createdAt)}
                                  </p>
                                </div>
                                <div className="bb-pill border-white/12 bg-white/[0.04] text-white/70">
                                  {redemption.status}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-white/58">Aucune demande enregistree.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                      Historique rapide du client
                    </p>
                    <div className="mt-4 space-y-3">
                      {selectedClientAppointments.length === 0 ? (
                        <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                          <p className="text-sm text-white/60">
                            Aucun rendez-vous encore rattache a ce client.
                          </p>
                        </div>
                      ) : (
                        selectedClientAppointments.map((appointment) => (
                          <Link
                            className="block w-full rounded-[22px] border border-white/10 bg-black/20 p-4 text-left transition duration-200 hover:bg-white/[0.05]"
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

                  <div className="mt-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                      Notes internes
                    </p>
                    <p className="mt-3 text-sm leading-6 text-white/62">
                      {managedClient.notes || "Aucune note interne pour ce client."}
                    </p>
                    <div className="mt-5 flex items-center gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-[#f7b955]">
                        <CarFront className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {managedClient.formulaName || "Formule libre"}
                        </p>
                        <p className="mt-1 text-sm text-white/55">
                          {managedClient.city || "Ville non renseignee"}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
                  <p className="text-sm leading-6 text-white/62">
                    Choisissez un client dans la liste pour ouvrir sa fiche detaillee.
                  </p>
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
              <Link className="bb-button-ghost px-4 py-2 text-xs uppercase tracking-[0.16em]" to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Link>
              <div className="bb-pill border-white/12 bg-white/[0.04] text-white/75">
                <Sparkles className="h-3.5 w-3.5 text-[#f7b955]" />
                Admin cockpit
              </div>
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

            <div className="grid grid-cols-3 gap-2 md:hidden">
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

            <div className="hidden gap-3 md:grid md:grid-cols-3">
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
                  Inbox, planning, validation et suivi des dossiers actifs.
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

        {adminSection === "appointments"
          ? renderAppointmentsPage()
          : adminSection === "clients"
            ? renderClientsPage()
            : renderHomePage()}
      </main>

      <nav className="fixed inset-x-0 bottom-3 z-30 px-3 md:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-3 rounded-[28px] border border-white/12 bg-[#090d12]/94 p-1.5 shadow-[0_24px_80px_rgba(0,0,0,0.46)] backdrop-blur-2xl">
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 px-3 pb-3 pt-8 backdrop-blur-md md:items-center">
          <div className="bb-surface-strong w-full max-w-3xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="bb-eyebrow">
                  {profileMode === "new" ? "Creation client" : "Edition client"}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-white">
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

                {profileDraft.clientType === "bbx" && profileDraft.isFounder && (
                  <label className="mt-4 block space-y-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                      Image fondateur
                    </span>
                    <input
                      className="bb-input"
                      onChange={(event) => setFounderMediaFile(event.target.files?.[0] ?? null)}
                      type="file"
                    />
                    <p className="text-sm text-white/50">
                      {founderMediaFile
                        ? founderMediaFile.name
                        : "Ajoutez un visuel premium pour la carte fondateur."}
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
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Plaque
                </span>
                <input
                  className="bb-input"
                  onChange={(event) =>
                    updateProfileDraft("vehiclePlate", event.target.value)
                  }
                  value={profileDraft.vehiclePlate}
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 px-3 pb-3 pt-8 backdrop-blur-md md:items-center">
          <div className="bb-surface-strong w-full max-w-lg p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="bb-eyebrow">Formule sur mesure</p>
                <h3 className="mt-3 text-2xl font-semibold text-white">
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
    </div>
  );
}
