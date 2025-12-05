// web/src/pages/ClientCardPage.tsx
import * as React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Loader2, Star, CalendarDays, Phone } from "lucide-react";

type DayStatus = "free" | "mine" | "busy" | "done";

type ApiDay = {
  date: string; // "YYYY-MM-DD"
  day: number;
  status: DayStatus;
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
  addressLine1: string | null;
  postalCode: string | null;
  city: string | null;
  vehicleModel: string | null;
  vehiclePlate: string | null;
  formulaName: string | null;
  formulaTotal: number;
  formulaRemaining: number;
};

type ApiResponse = {
  ok: boolean;
  client: ApiClient;
  month: ApiMonth;
};

type ModalMode = "book" | "manage" | "past";

// ──────────────────────────────────────
// Types pour la section "Vos rendez-vous"
// ──────────────────────────────────────

type ClientAppointmentStatus = "requested" | "confirmed" | "done" | "cancelled";

type ClientAppointment = {
  id: number;
  date: string; // YYYY-MM-DD
  time: string | null; // "HH:MM"
  status: ClientAppointmentStatus;
  adminNote: string | null;
  userRating: number | null;
  userReview: string | null;
  vehicleModel: string | null;
  vehiclePlate: string | null;
  hasPhotos: boolean;
};

type ListClientAppointmentsResponse = {
  ok: boolean;
  appointments: ClientAppointment[];
};

type AppointmentPhoto = {
  id: number;
  url: string;
  label: string | null;
};

type AppointmentPhotosResponse = {
  ok: boolean;
  photos: AppointmentPhoto[];
};

type SaveReviewResponse = {
  ok: boolean;
  appointment?: ClientAppointment;
};

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

function addMonths(iso: string, delta: number): string {
  const [y, m] = iso.split("-").map(Number);
  if (!y || !m) return iso;
  const d = new Date(y, m - 1 + delta, 1);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}

function isPastDay(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T00:00:00");
  return d < today;
}

// Règle d'annulation / modif : autorisé tant qu'on est strictement
// avant minuit la veille du jour de rendez-vous.
function canChangeDay(dateStr: string): boolean {
  const dayStart = new Date(dateStr + "T00:00:00");
  const limit = new Date(dayStart.getTime() - 24 * 60 * 60 * 1000); // veille à 00:00
  const now = new Date();
  return now < limit;
}

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16];
const MINUTES = ["00", "30"];

function defaultTime() {
  return "10:00";
}

function splitTime(t: string): { h: string; m: string } {
  const [h, m] = t.split(":");
  return { h: h ?? "10", m: m ?? "00" };
}

function formatDateFR(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTimeHHMM(time: string | null) {
  if (!time) return "—";
  return time.slice(0, 5);
}

function appointmentDateTime(a: ClientAppointment): Date {
  const time = a.time ?? "00:00";
  return new Date(`${a.date}T${time}:00`);
}

function appointmentIsPast(a: ClientAppointment): boolean {
  const dt = appointmentDateTime(a);
  return dt.getTime() < Date.now();
}

function appointmentStatusLabel(status: ClientAppointmentStatus) {
  switch (status) {
    case "requested":
      return "En attente";
    case "confirmed":
      return "Confirmé";
    case "done":
      return "Effectué";
    case "cancelled":
      return "Annulé";
    default:
      return status;
  }
}

function appointmentStatusClasses(status: ClientAppointmentStatus) {
  switch (status) {
    case "requested":
      return "bg-amber-500/10 text-amber-300 border border-amber-500/40";
    case "confirmed":
      return "bg-sky-500/10 text-sky-300 border border-sky-500/40";
    case "done":
      return "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40";
    case "cancelled":
      return "bg-rose-500/10 text-rose-300 border border-rose-500/40 line-through";
    default:
      return "";
  }
}

// 🔠 Libellé de jour : LU, MA, ME, JE, VE, SA, D
function weekdayLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const d = date.getDay(); // 0 = dimanche
  const MAP = ["D", "LU", "MA", "ME", "JE", "VE", "SA"];
  return MAP[d] ?? "";
}

export function ClientCardPage() {
  const params = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const query = useQuery();

  const slug = params.slug || "card01";
  const [data, setData] = React.useState<ApiResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busyAction, setBusyAction] = React.useState(false);

  // pour recharger (si un jour on veut le faire via API) :
  const [reloadToken, setReloadToken] = React.useState(0);

  // Heure mémorisée par jour (local pour l'instant)
  const [localTimes, setLocalTimes] = React.useState<Record<string, string>>(
    {}
  );

  // Modale calendrier (book / manage / past)
  const [modalDay, setModalDay] = React.useState<ApiDay | null>(null);
  const [modalMode, setModalMode] = React.useState<ModalMode>("book");
  const [selectedTime, setSelectedTime] = React.useState<string>(defaultTime());

  // Petit message en bas
  const [toast, setToast] = React.useState<string | null>(null);

  const monthParam = query.get("m");

  // ──────────────────────────────────────
  // État "Vos rendez-vous"
  // ──────────────────────────────────────
  const [appointments, setAppointments] = React.useState<ClientAppointment[]>(
    []
  );
  const [appointmentsLoading, setAppointmentsLoading] = React.useState(true);

  const [selectedAppointment, setSelectedAppointment] =
    React.useState<ClientAppointment | null>(null);
  const [appointmentPhotos, setAppointmentPhotos] = React.useState<
    AppointmentPhoto[]
  >([]);
  const [appointmentPhotosLoading, setAppointmentPhotosLoading] =
    React.useState(false);
  const [reviewRating, setReviewRating] = React.useState(0);
  const [reviewText, setReviewText] = React.useState("");
  const [savingReview, setSavingReview] = React.useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = React.useState(false);

  const carouselRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const url = new URL(
          `/api/client/${encodeURIComponent(slug)}`,
          window.location.origin
        );
        if (monthParam) url.searchParams.set("m", monthParam);

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as ApiResponse;
        if (!active) return;
        if (!json.ok) throw new Error("Réponse API invalide");

        setData(json);
      } catch (e) {
        if (active) setError("Impossible de charger vos informations.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [slug, monthParam, reloadToken]);

  const client = data?.client;
  const month = data?.month;

  // Chargement de la liste des rendez-vous pour le carrousel
  React.useEffect(() => {
    if (!client) return;
    let active = true;

    async function loadAppointments() {
      try {
        setAppointmentsLoading(true);
        const res = await fetch(
          `/api/client/${encodeURIComponent(slug)}/appointments`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as ListClientAppointmentsResponse;
        if (!active) return;
        if (!json.ok) throw new Error("API appointments not ok");
        setAppointments(json.appointments || []);
      } catch (err) {
        if (active) {
          console.error("Impossible de charger les rendez-vous client.");
          setAppointments([]);
        }
      } finally {
        if (active) setAppointmentsLoading(false);
      }
    }

    void loadAppointments();
    return () => {
      active = false;
    };
  }, [slug, client?.id, reloadToken]);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  }

  function openDayModal(day: ApiDay) {
    if (!client) return;
    const past = isPastDay(day.date);

    // 🔵 Jour "done" → toujours cliquable (public)
    if (day.status === "done") {
      // On cherche un RDV du client pour ce jour
      const apt = appointments.find(
        (a) => a.date === day.date && a.status !== "cancelled"
      );

      if (apt) {
        openAppointmentModal(apt);
        return;
      }

      // ➜ Pas dans la liste du client => on va chercher le rendez-vous public
      fetch(`/api/client/appointments/${day.date}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => {
          if (json?.ok && json.appointment) {
            openAppointmentModal(json.appointment);
          } else {
            setModalDay(day);
            setModalMode("past");
          }
        })
        .catch(() => {
          setModalDay(day);
          setModalMode("past");
        });
      return;
    }

    // ⚫ Jour libre → réservation
    if (day.status === "free") {
      if (client.formulaRemaining <= 0) {
        showToast("Vous n'avez plus de nettoyages restants.");
        return;
      }
      if (past) {
        showToast("Vous ne pouvez pas réserver un jour déjà passé.");
        return;
      }
      setModalDay(day);
      setModalMode("book");
      const existing = localTimes[day.date] ?? defaultTime();
      setSelectedTime(existing);
      return;
    }

    // 🟢 Jour "mine"
    if (day.status === "mine") {
      setModalDay(day);
      const existing = localTimes[day.date] ?? defaultTime();
      setSelectedTime(existing);
      if (past) setModalMode("past");
      else setModalMode("manage");
      return;
    }

    // 🔴 Jour "busy"
    if (day.status === "busy") {
      // ➜ Futur : juste message
      if (!past) {
        showToast("Ce jour est déjà réservé.");
        return;
      }

      // ➜ Passé : petite modale "past"
      setModalDay(day);
      const existing = localTimes[day.date] ?? defaultTime();
      setSelectedTime(existing);
      setModalMode("past");
      return;
    }
  }

  async function book(date: string, time: string) {
    if (!data) return;
    if (data.client.formulaRemaining <= 0) {
      showToast("Vous n'avez plus de nettoyages restants.");
      return;
    }

    setBusyAction(true);

    // Update instantané côté UI
    setData((prev) => {
      if (!prev) return prev;

      const alreadyMine = prev.month.days.some(
        (d) => d.date === date && d.status === "mine"
      );
      if (alreadyMine) return prev;

      const nextRemaining = Math.max(prev.client.formulaRemaining - 1, 0);

      const next: ApiResponse = {
        ...prev,
        client: {
          ...prev.client,
          formulaRemaining: nextRemaining,
        },
        month: {
          ...prev.month,
          days: prev.month.days.map((d) =>
            d.date === date ? { ...d, status: "mine" } : d
          ),
        },
      };
      return next;
    });

    setLocalTimes((prev) => ({
      ...prev,
      [date]: time,
    }));

    try {
      await fetch(`/api/client/${encodeURIComponent(slug)}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time }),
      }).catch(() => null);
    } finally {
      setBusyAction(false);
      setModalDay(null);
      // re-sync stricte avec DB
      setReloadToken((x) => x + 1);
    }
  }

  async function cancel(date: string) {
    if (!data) return;

    const allowed = canChangeDay(date);
    if (!allowed) {
      showToast("Trop tard pour annuler ce rendez-vous.");
      return;
    }

    setBusyAction(true);

    setData((prev) => {
      if (!prev) return prev;

      const wasMine = prev.month.days.some(
        (d) => d.date === date && d.status === "mine"
      );
      if (!wasMine) return prev;

      const nextRemaining = Math.min(
        prev.client.formulaTotal,
        prev.client.formulaRemaining + 1
      );

      const next: ApiResponse = {
        ...prev,
        client: {
          ...prev.client,
          formulaRemaining: nextRemaining,
        },
        month: {
          ...prev.month,
          days: prev.month.days.map((d) =>
            d.date === date ? { ...d, status: "free" } : d
          ),
        },
      };
      return next;
    });

    setLocalTimes((prev) => {
      const clone = { ...prev };
      delete clone[date];
      return clone;
    });

    try {
      await fetch(`/api/client/${encodeURIComponent(slug)}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      }).catch(() => null);
    } finally {
      setBusyAction(false);
      setModalDay(null);
      setReloadToken((x) => x + 1);
    }
  }

  async function updateTime(date: string, newTime: string) {
    if (!data) return;

    setBusyAction(true);

    setLocalTimes((prev) => ({
      ...prev,
      [date]: newTime,
    }));

    try {
      await fetch(`/api/client/${encodeURIComponent(slug)}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time: newTime }),
      }).catch(() => null);
    } finally {
      setBusyAction(false);
      setModalDay(null);
      setReloadToken((x) => x + 1);
    }
  }

  function goMonth(delta: number) {
    if (!month) return;
    const nextIso = addMonths(month.iso, delta);
    navigate(`/card/${encodeURIComponent(slug)}?m=${nextIso}`);
  }

  // ──────────────────────────────────────
  // Gestion du carrousel "Vos rendez-vous"
  // ──────────────────────────────────────

  const sortedAppointments = React.useMemo(() => {
    const copy = [...appointments];
    // Plus récent (date/heure la plus grande) en premier
    copy.sort(
      (a, b) =>
        appointmentDateTime(b).getTime() - appointmentDateTime(a).getTime()
    );
    return copy;
  }, [appointments]);

  const upcomingIndex = React.useMemo(() => {
    if (sortedAppointments.length === 0) return -1;
    const now = new Date();
    const idx = sortedAppointments.findIndex((a) => {
      if (a.status === "cancelled") return false;
      return appointmentDateTime(a).getTime() >= now.getTime();
    });
    if (idx === -1) {
      // Tous passés → on centre sur le dernier
      return sortedAppointments.length - 1;
    }
    return idx;
  }, [sortedAppointments]);

  React.useEffect(() => {
    if (!carouselRef.current) return;
    if (sortedAppointments.length === 0) return;
    if (upcomingIndex < 0) return;

    const container = carouselRef.current;
    const items = container.querySelectorAll<HTMLElement>(
      "[data-appointment-index]"
    );
    if (!items.length) return;

    const target = Array.from(items).find(
      (el) => Number(el.dataset.appointmentIndex) === upcomingIndex
    );
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [sortedAppointments, upcomingIndex]);

  async function loadAppointmentPhotos(appointmentId: number) {
    setAppointmentPhotosLoading(true);
    try {
      const res = await fetch(
        `/api/client/${encodeURIComponent(
          slug
        )}/appointments/${appointmentId}/photos`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as AppointmentPhotosResponse;
      if (!json.ok) throw new Error("Photos API not ok");
      setAppointmentPhotos(json.photos || []);
    } catch (err) {
      console.error("Impossible de charger les photos du rendez-vous.");
      setAppointmentPhotos([]);
    } finally {
      setAppointmentPhotosLoading(false);
    }
  }

  function openAppointmentModal(apt: ClientAppointment) {
    setSelectedAppointment(apt);
    setAppointmentPhotos([]);
    setReviewRating(apt.userRating ?? 0);
    setReviewText(apt.userReview ?? "");
    setAppointmentModalOpen(true);

    if (apt.hasPhotos) {
      void loadAppointmentPhotos(apt.id);
    }
  }

  function closeAppointmentModal() {
    setAppointmentModalOpen(false);
    setSelectedAppointment(null);
    setAppointmentPhotos([]);
    setAppointmentPhotosLoading(false);
    setReviewRating(0);
    setReviewText("");
    setSavingReview(false);
  }

  async function saveReview() {
    if (!selectedAppointment) return;
    if (reviewRating <= 0 || reviewRating > 5) {
      showToast("Merci de choisir une note entre 1 et 5 étoiles.");
      return;
    }

    setSavingReview(true);
    try {
      const res = await fetch(
        `/api/client/${encodeURIComponent(
          slug
        )}/appointments/${selectedAppointment.id}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating: reviewRating,
            review: reviewText.trim() === "" ? null : reviewText.trim(),
          }),
        }
      );
      const json = (await res.json().catch(() => null)) as
        | SaveReviewResponse
        | null;

      if (!res.ok || !json || json.ok === false) {
        showToast("Erreur lors de l'enregistrement de votre avis.");
        return;
      }

      const updated = json.appointment;
      if (updated) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === updated.id ? updated : a))
        );
        setSelectedAppointment(updated);
      } else {
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === selectedAppointment.id
              ? {
                  ...a,
                  userRating: reviewRating,
                  userReview:
                    reviewText.trim() === "" ? null : reviewText.trim(),
                }
              : a
          )
        );
      }

      showToast("Merci pour votre avis !");
    } catch (err) {
      showToast("Erreur réseau lors de l'enregistrement de votre avis.");
    } finally {
      setSavingReview(false);
    }
  }

  // ──────────────────────────────────────

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="flex items-center gap-3 text-sm text-neutral-200">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Chargement de votre espace…</span>
        </div>
      </div>
    );
  }

  if (error || !client || !month) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="max-w-xs text-center space-y-2">
          <p className="text-sm font-medium">Une erreur est survenue.</p>
          <p className="text-xs text-neutral-400">
            {error ?? "Client introuvable."}
          </p>
        </div>
      </div>
    );
  }

  const displayName = client.firstName || client.fullName || "Client";
  const remainingLabel =
    client.formulaTotal > 0
      ? `${client.formulaRemaining} / ${client.formulaTotal}`
      : `${client.formulaRemaining}`;

  const { h: timeHour, m: timeMinute } = splitTime(selectedTime);
  const currentModalDay = modalDay;

  const totalAppointments = sortedAppointments.length;

  const hasFuture = appointments.some(
    (a) =>
      a.status !== "cancelled" &&
      appointmentDateTime(a).getTime() > Date.now()
  );

  const hasCredits = client.formulaRemaining > 0;

  let ambientColor = "transparent";

  // RDV à venir
  if (hasFuture) ambientColor = "rgba(0,255,150,0.05)";

  // Tous passés → bleu doux
  else ambientColor = "rgba(80,150,255,0.05)";

  // Plus de crédits → rouge léger
  if (!hasCredits) ambientColor = "rgba(255,80,80,0.07)";

  return (
    <div className="min-h-screen relative overflow-hidden text-white flex justify-center px-3 py-6">
      {/* Reflet vertical premium */}
      <div className="absolute inset-0 pointer-events-none animate-verticalShine opacity-[0.10]">
        <div
          className="absolute left-1/2 top-[-200%] w-[40%] h-[400%] 
      bg-gradient-to-b from-transparent via-white/20 to-transparent 
      blur-3xl -translate-x-1/2"
        />
      </div>

      {/* Couleur ambiante dynamique */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: ambientColor }}
      />

      {/* Vignette luxe */}
      <div
        className="absolute inset-0 pointer-events-none 
    bg-[radial-gradient(circle_at_center,transparent_0%,transparent_45%,black_100%)] opacity-30"
      />

      {/* Halo dynamique autour des cartes */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.12] blur-3xl animate-luxHalo bg-gradient-to-b from-white/5 via-transparent to-white/5" />

      {/* Gradient premium fixe */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-neutral-950 to-black" />

      {/* Lumière animée */}
      <div className="absolute -top-1/3 left-0 w-[200%] h-[200%] opacity-[0.12] animate-luxLight bg-gradient-to-r from-transparent via-white/30 to-transparent blur-3xl" />

      {/* Texture premium */}
      <div className="absolute inset-0 opacity-[0.05] bg-[url('/textures/noise.png')] pointer-events-none" />

      <main className="relative w-full max-w-3xl space-y-4">
        {/* Header */}
        <Card className="rounded-3xl border border-white/10 bg-neutral-950/95 shadow-[0_20px_60px_rgba(0,0,0,0.85)]">
          <div className="p-5 space-y-3">
            <div className="inline-flex items-center rounded-full border border-white/15 bg-black/80 px-3 py-1 text-[11px] font-medium tracking-[0.22em] text-neutral-300 uppercase relative overflow-hidden shineBadge">
              BlackBox · NFC Client
            </div>

            <div>
              <h1 className="text-xl font-semibold leading-tight tracking-tight text-white">
                Bonjour {displayName},
              </h1>
              <p className="text-[13px] text-neutral-400 mt-1">
                Vous pouvez suivre vos rendez-vous, vos nettoyages restants et
                consulter l&apos;historique de vos prestations.
              </p>
            </div>
          </div>
        </Card>

        {/* Infos client & formule */}
        <Card className="rounded-3xl border border-white/10 bg-neutral-950/95 shadow-[0_18px_50px_rgba(0,0,0,0.75)]">
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12px]">
            <div className="rounded-2xl border border-white/10 bg-black/70 p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2 pb-1 mb-1 border-b border-white/10">
                <span className="text-[12px] font-semibold text-white">
                  Client
                </span>
              </div>
              <div className="text-[14px] font-semibold text-white">
                {client.fullName ?? displayName}
              </div>
              <div className="text-[12px] text-neutral-300">
                Code carte :{" "}
                <span className="text-neutral-100">
                  {client.cardCode ?? client.slug}
                </span>
              </div>
              {client.phone && (
                <div className="text-[12px] text-neutral-300">
                  Téléphone :{" "}
                  <span className="text-neutral-100">{client.phone}</span>
                </div>
              )}
              {client.email && (
                <div className="text-[12px] text-neutral-300">
                  Email :{" "}
                  <span className="text-neutral-100">{client.email}</span>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/70 p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2 pb-1 mb-1 border-b border-white/10">
                <span className="text-[12px] font-semibold text-white">
                  Véhicule & formule
                </span>
              </div>
              <div className="text-[13px] text-white">
                {client.vehicleModel ?? "Véhicule non renseigné"}
                {client.vehiclePlate
                  ? ` · ${client.vehiclePlate}`
                  : client.vehicleModel
                  ? ""
                  : ""}
              </div>
              <div className="text-[12px] text-neutral-300">
                Formule :{" "}
                <span className="text-neutral-100">
                  {client.formulaName ?? "Aucune formule active"}
                </span>
              </div>
              <div className="text-[12px] text-neutral-300">
                Nettoyages restants :{" "}
                <span
                  className={
                    client.formulaRemaining > 0
                      ? "text-emerald-300"
                      : "text-rose-300"
                  }
                >
                  {remainingLabel}
                </span>
              </div>
              {client.addressLine1 && (
                <div className="text-[11px] text-neutral-400 pt-1">
                  Adresse : {client.addressLine1}
                  {client.postalCode || client.city ? ", " : ""}
                  {client.postalCode} {client.city}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Contact */}
        <Card className="card-shine rounded-3xl border border-white/10 bg-neutral-950/95 shadow-[0_18px_50px_rgba(0,0,0,0.8)]">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">
                Contacter Bryan Cars Detailing
              </p>
              <p className="text-[12px] text-neutral-400">
                Une question, besoin de modifier un rendez-vous ou de conseils
                d&apos;entretien ? Appelez directement le centre.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="tel:0603125186"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[12px] font-medium bg-white text-black hover:bg-neutral-200 transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Appeler le centre</span>
              </a>
            </div>
          </div>
        </Card>

        {/* Agenda */}
        <Card className="card-shine rounded-3xl border border-white/10 bg-neutral-950/95 shadow-[0_18px_50px_rgba(0,0,0,0.75)]">
          <div className="p-4 space-y-3">
            {/* Header agenda avec mois centré entre les flèches */}
            <div className="flex items-center justify-between gap-2">
              {/* Colonne gauche */}
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-black border border-white/10">
                  <CalendarDays className="h-4 w-4 text-neutral-200" />
                </div>
                <p className="text-sm font-semibold text-white">Agenda</p>
              </div>

              {/* Centre : mois */}
              <div className="flex-1 text-center">
                <p className="text-base font-semibold text-white">
                  {month.label}
                </p>
              </div>

              {/* Flèches */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-full border-white/20 bg-black/80 hover:bg-white hover:text-black"
                  onClick={() => goMonth(-1)}
                >
                  ‹
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-full border-white/20 bg-black/80 hover:bg-white hover:text-black"
                  onClick={() => goMonth(1)}
                >
                  ›
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-[10px] text-neutral-400">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-black border border-white/25" />
                <span>Disponible</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>Votre rendez-vous à venir</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                <span>Rendez-vous passé</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span>Indisponible</span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 mt-1">
              {month.days.map((d) => {
                const mine = d.status === "mine";
                const free = d.status === "free";
                const busy = d.status === "busy";
                const past = isPastDay(d.date);

                const base =
                  "w-full aspect-square rounded-xl border flex items-center justify-center text-[11px] transition focus-visible:outline-none";

                // 🔵 DONE → bleu (TOUJOURS cliquable)
                if (d.status === "done") {
                  return (
                    <button
                      key={d.date}
                      className={`${base} border-sky-500 bg-sky-500/15`}
                      disabled={busyAction}
                      onClick={() => openDayModal(d)}
                    >
                      <div className="flex flex-col items-center justify-center gap-1 leading-none">
                        <span className="text-2xl font-semibold text-white">{d.day}</span>
                        <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-300">
                          {weekdayLabel(d.date)}
                        </span>
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-400" />
                      </div>
                    </button>
                  );
                }

                // ⚫ Jour libre → noir cliquable
                if (free) {
                  return (
                    <button
                      key={d.date}
                      className={`${base} border-white/15 bg-black hover:border-emerald-400 hover:bg-emerald-500/10`}
                      disabled={busyAction}
                      onClick={() => openDayModal(d)}
                    >
                      <div className="flex flex-col items-center justify-center gap-1 leading-none">
                        <span className="text-2xl font-semibold text-white">{d.day}</span>
                        <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
                          {weekdayLabel(d.date)}
                        </span>
                      </div>
                    </button>
                  );
                }

                // 🔵 RDV passé (mine ou busy)
                if (past && (mine || busy)) {
                  return (
                    <button
                      key={d.date}
                      className={`${base} border-sky-500 bg-sky-500/15`}
                      disabled={busyAction}
                      onClick={() => openDayModal(d)}
                    >
                      <div className="flex flex-col items-center justify-center gap-1 leading-none">
                        <span className="text-2xl font-semibold text-white">{d.day}</span>
                        <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-300">
                          {weekdayLabel(d.date)}
                        </span>
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-400" />
                      </div>
                    </button>
                  );
                }

                // 🟢 RDV futur du client
                if (mine && !past) {
                  return (
                    <button
                      key={d.date}
                      className={`${base} border-emerald-500 bg-emerald-500/15`}
                      disabled={busyAction}
                      onClick={() => openDayModal(d)}
                    >
                      <div className="flex flex-col items-center justify-center gap-1 leading-none">
                        <span className="text-2xl font-semibold text-white">{d.day}</span>
                        <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-300">
                          {weekdayLabel(d.date)}
                        </span>
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      </div>
                    </button>
                  );
                }

                // 🔴 RDV futur d’un autre client → NON cliquable
                if (busy && !past) {
                  return (
                    <div
                      key={d.date}
                      className={`${base} border-rose-500/80 bg-rose-500/10 text-neutral-100`}
                    >
                      <div className="flex flex-col items-center justify-center gap-1 leading-none">
                        <span className="text-2xl font-semibold">{d.day}</span>
                        <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-300">
                          {weekdayLabel(d.date)}
                        </span>
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
                      </div>
                    </div>
                  );
                }

                // Autre / fallback
                return (
                  <div
                    key={d.date}
                    className={`${base} border-white/10 bg-black/50 text-neutral-100`}
                  >
                    <div className="flex flex-col items-center justify-center gap-1 leading-none">
                      <span className="text-2xl font-semibold">{d.day}</span>
                      <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
                        {weekdayLabel(d.date)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Touchez un jour disponible pour demander un rendez-vous. Vos
              rendez-vous à venir sont en vert. Une fois la date passée, ils
              apparaîtront en bleu. Les jours déjà pris par d&apos;autres
              clients sont en rouge.
            </p>
          </div>
        </Card>

        {/* Vos rendez-vous (liste verticale) */}
        <Card className="rounded-3xl border border-white/10 bg-neutral-950/95 shadow-[0_18px_50px_rgba(0,0,0,0.75)]">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-black border border-white/10">
                  <CalendarDays className="h-4 w-4 text-neutral-200" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Vos rendez-vous
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Historique de vos nettoyages, passés et à venir.
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-neutral-400">
                {totalAppointments} rendez-vous
              </span>
            </div>

            {appointmentsLoading && (
              <div className="flex justify-center py-4">
                <div className="flex items-center gap-2 text-[12px] text-neutral-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Chargement de vos rendez-vous…</span>
                </div>
              </div>
            )}

            {!appointmentsLoading && totalAppointments === 0 && (
              <p className="text-[12px] text-neutral-500">
                Aucun rendez-vous enregistré pour le moment. Lorsque vous aurez
                effectué des prestations, elles apparaîtront ici.
              </p>
            )}

            {!appointmentsLoading && totalAppointments > 0 && (
              <div className="space-y-2 pt-1">
                {sortedAppointments.map((a) => {
                  const isPast = appointmentIsPast(a);
                  const rating = a.userRating ?? 0;

                  let cardStyle =
                    "w-full rounded-2xl border px-3 py-2.5 text-[12px] text-left transition-colors flex items-stretch gap-3";
                  if (a.status === "cancelled") {
                    cardStyle +=
                      " border-rose-500/70 bg-rose-500/10 text-rose-100";
                  } else if (isPast) {
                    cardStyle +=
                      " border-sky-500/70 bg-sky-500/10 text-neutral-100";
                  } else {
                    cardStyle +=
                      " border-emerald-500/70 bg-emerald-500/10 text-neutral-100";
                  }

                  return (
                    <div key={a.id} className={cardStyle}>
                      <div className="flex-1 space-y-0.5">
                        <div className="font-medium text-white">
                          {formatDateFR(a.date)}{" "}
                          {a.time && (
                            <span className="text-neutral-200">
                              · {formatTimeHHMM(a.time)}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-200">
                          {a.vehicleModel
                            ? a.vehicleModel +
                              (a.vehiclePlate ? ` · ${a.vehiclePlate}` : "")
                            : "Détail véhicule non renseigné"}
                        </div>

                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-200">
                          {rating > 0 ? (
                            <>
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={
                                    "h-3.5 w-3.5 " +
                                    (i < rating
                                      ? "text-amber-300 fill-amber-300"
                                      : "text-neutral-500")
                                  }
                                />
                              ))}
                              <span className="ml-1">({rating}/5)</span>
                            </>
                          ) : (
                            <span className="italic text-neutral-300">
                              Pas encore d&apos;avis
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-between gap-1">
                        <div
                          className={
                            "px-2 py-0.5 rounded-full text-[10px] " +
                            appointmentStatusClasses(a.status)
                          }
                        >
                          {appointmentStatusLabel(a.status)}
                        </div>
                        <Button
                          type="button"
                          className="h-7 px-3 text-[11px] rounded-full bg-white text-black hover:bg-neutral-200"
                          onClick={() => openAppointmentModal(a)}
                        >
                          Consulter
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!appointmentsLoading && totalAppointments > 0 && (
              <p className="text-[11px] text-neutral-400">
                Les rendez-vous les plus récents apparaissent en haut de la
                liste.
              </p>
            )}
          </div>
        </Card>
      </main>

      {/* Modale calendrier (book / manage / past) */}
      {currentModalDay && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm px-3">
          <div className="w-full max-w-sm bg-neutral-950 border border-white/10 rounded-3xl p-4 space-y-4 shadow-[0_24px_80px_rgba(0,0,0,1)] text-[13px] text-neutral-100">
            {modalMode === "book" && (
              <>
                <div>
                  <p className="text-sm font-medium mb-1">
                    Demander un rendez-vous
                  </p>
                  <p className="text-[12px] text-neutral-400">
                    Jour sélectionné :{" "}
                    <span className="font-medium text-neutral-100">
                      {currentModalDay.day}/{month.monthIndex + 1}/
                      {month.year}
                    </span>
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-[12px] text-neutral-400">
                    Choisissez une heure entre{" "}
                    <span className="font-medium">8h00</span> et{" "}
                    <span className="font-medium">16h30</span> (créneaux de 30
                    minutes).
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase tracking-[0.16em] text-neutral-500 mb-1">
                        Heure
                      </label>
                      <select
                        className="w-full rounded-xl border border-white/20 bg-black px-3 py-2 text-[13px] text-neutral-100"
                        value={timeHour}
                        onChange={(e) =>
                          setSelectedTime(`${e.target.value}:${timeMinute}`)
                        }
                      >
                        {HOURS.map((h) => (
                          <option key={h} value={String(h).padStart(2, "0")}>
                            {h.toString().padStart(2, "0")}h
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-[10px] uppercase tracking-[0.16em] text-neutral-500 mb-1">
                        Minutes
                      </label>
                      <select
                        className="w-full rounded-xl border border-white/20 bg-black px-3 py-2 text-[13px] text-neutral-100"
                        value={timeMinute}
                        onChange={(e) =>
                          setSelectedTime(`${timeHour}:${e.target.value}`)
                        }
                      >
                        {MINUTES.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl border-white/30 bg-black hover:bg-white hover:text-black"
                    disabled={busyAction}
                    onClick={() => setModalDay(null)}
                  >
                    Annuler
                  </Button>
                  <Button
                    className="flex-1 rounded-xl bg-white text-black hover:bg-neutral-200"
                    disabled={busyAction}
                    onClick={() => book(currentModalDay.date, selectedTime)}
                  >
                    Confirmer
                  </Button>
                </div>
              </>
            )}

            {modalMode === "manage" && (
              <>
                <div>
                  <p className="text-sm font-medium mb-1">
                    Votre rendez-vous
                  </p>
                  <p className="text-[12px] text-neutral-400">
                    Rendez-vous prévu le{" "}
                    <span className="font-medium text-neutral-100">
                      {currentModalDay.day}/{month.monthIndex + 1}/
                      {month.year}
                    </span>{" "}
                    à{" "}
                    <span className="font-medium text-neutral-100">
                      {selectedTime ??
                        localTimes[currentModalDay.date] ??
                        "—"}
                    </span>
                    .
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-[12px] text-neutral-400">
                    Vous pouvez modifier l&apos;heure de ce rendez-vous
                    librement. L&apos;annulation complète n&apos;est possible
                    que jusqu&apos;à la veille à minuit.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase tracking-[0.16em] text-neutral-500 mb-1">
                        Nouvelle heure
                      </label>
                      <select
                        className="w-full rounded-xl border border-white/20 bg-black px-3 py-2 text-[13px] text-neutral-100"
                        value={timeHour}
                        onChange={(e) =>
                          setSelectedTime(`${e.target.value}:${timeMinute}`)
                        }
                      >
                        {HOURS.map((h) => (
                          <option key={h} value={String(h).padStart(2, "0")}>
                            {h.toString().padStart(2, "0")}h
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-[10px] uppercase tracking-[0.16em] text-neutral-500 mb-1">
                        Minutes
                      </label>
                      <select
                        className="w-full rounded-xl border border-white/20 bg-black px-3 py-2 text-[13px] text-neutral-100"
                        value={timeMinute}
                        onChange={(e) =>
                          setSelectedTime(`${timeHour}:${e.target.value}`)
                        }
                      >
                        {MINUTES.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    className="rounded-xl bg-white text-black hover:bg-neutral-200"
                    disabled={busyAction}
                    onClick={() =>
                      updateTime(currentModalDay.date, selectedTime)
                    }
                  >
                    Modifier l&apos;heure
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl border-rose-500/70 text-rose-300 hover:bg-rose-500/10"
                    disabled={busyAction}
                    onClick={() => cancel(currentModalDay.date)}
                  >
                    Annuler le rendez-vous
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl border-white/30 bg-black hover:bg-white hover:text-black"
                    disabled={busyAction}
                    onClick={() => setModalDay(null)}
                  >
                    Fermer
                  </Button>
                </div>
              </>
            )}

            {modalMode === "past" && (
              <>
                <div>
                  <p className="text-sm font-medium mb-1">
                    Rendez-vous effectué
                  </p>
                  <p className="text-[12px] text-neutral-400">
                    Rendez-vous du{" "}
                    <span className="font-medium text-neutral-100">
                      {currentModalDay.day}/{month.monthIndex + 1}/
                      {month.year}
                    </span>{" "}
                    à{" "}
                    <span className="font-medium text-neutral-100">
                      {localTimes[currentModalDay.date] ?? "—"}
                    </span>
                    .
                  </p>
                </div>
                <p className="text-[12px] text-neutral-400">
                  Retrouvez le détail complet, les photos et la possibilité de
                  laisser un avis dans la section{" "}
                  <span className="font-medium text-neutral-100">
                    &quot;Vos rendez-vous&quot;
                  </span>{" "}
                  plus bas.
                </p>
                <div className="flex justify-end pt-2">
                  <Button
                    variant="outline"
                    className="rounded-xl border-white/30 bg-black hover:bg-white hover:text-black"
                    onClick={() => setModalDay(null)}
                  >
                    Fermer
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modale détail rendez-vous (carrousel) */}
      {appointmentModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm px-3">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-neutral-950/98 p-4 space-y-4 shadow-[0_24px_80px_rgba(0,0,0,1)] text-[13px] text-neutral-100">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">
                  Détail du rendez-vous
                </p>
                <p className="text-[12px] text-neutral-400 mt-0.5">
                  {formatDateFR(selectedAppointment.date)}{" "}
                  {selectedAppointment.time && (
                    <>
                      ·{" "}
                      <span className="text-neutral-100">
                        {formatTimeHHMM(selectedAppointment.time)}
                      </span>
                    </>
                  )}
                </p>
                <p className="text-[11px] text-neutral-400">
                  {selectedAppointment.vehicleModel
                    ? selectedAppointment.vehicleModel +
                      (selectedAppointment.vehiclePlate
                        ? ` · ${selectedAppointment.vehiclePlate}`
                        : "")
                    : "Véhicule non renseigné"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div
                  className={
                    "px-2 py-0.5 rounded-full text-[10px] " +
                    appointmentStatusClasses(selectedAppointment.status)
                  }
                >
                  {appointmentStatusLabel(selectedAppointment.status)}
                </div>
                <Button
                  variant="outline"
                  className="h-7 px-3 text-[11px] rounded-full border-white/30 bg-black hover:bg-white hover:text-black"
                  onClick={closeAppointmentModal}
                >
                  Fermer
                </Button>
              </div>
            </div>

            {/* Compte-rendu admin */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-white">
                Compte-rendu du centre
              </div>
              <div className="text-[12px] text-neutral-300">
                {selectedAppointment.adminNote
                  ? selectedAppointment.adminNote
                  : "Aucun compte-rendu spécifique n'a encore été enregistré pour ce rendez-vous."}
              </div>
            </div>

            {/* Photos */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-white">
                Photos du véhicule
              </div>
              {appointmentPhotosLoading && (
                <div className="flex items-center gap-2 text-[12px] text-neutral-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Chargement des photos…</span>
                </div>
              )}

              {!appointmentPhotosLoading && appointmentPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {appointmentPhotos.map((p) => (
                    <a
                      key={p.id}
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl overflow-hidden border border-white/10 bg-black"
                      title={p.label ?? undefined}
                    >
                      <img
                        src={p.url}
                        alt={p.label ?? "Photo rendez-vous"}
                        className="w-full h-20 object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}

              {/* Pas de photos en base → cadres vides pour visualiser */}
              {!appointmentPhotosLoading && appointmentPhotos.length === 0 && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-20 rounded-xl border border-dashed border-white/15 bg-black/40 flex items-center justify-center text-[10px] text-neutral-500"
                    >
                      Photo à venir
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Avis client */}
            {(() => {
              const isOwner =
                selectedAppointment &&
                client &&
                selectedAppointment.vehicleModel === client.vehicleModel &&
                selectedAppointment.vehiclePlate === client.vehiclePlate;

              const canRate = isOwner && selectedAppointment.status === "done";
              const hasReview = !!selectedAppointment.userRating;

              if (!canRate) {
                return (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-white">
                      Avis du client
                    </div>
                    {hasReview ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={
                                "h-3.5 w-3.5 " +
                                (i < (selectedAppointment.userRating || 0)
                                  ? "text-amber-300 fill-amber-300"
                                  : "text-neutral-600")
                              }
                            />
                          ))}
                          <span className="ml-1 text-neutral-300 text-[12px]">
                            ({selectedAppointment.userRating}/5)
                          </span>
                        </div>
                        {selectedAppointment.userReview && (
                          <p className="text-[12px] text-neutral-300 italic">
                            “{selectedAppointment.userReview}”
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-[12px] text-neutral-400 italic">
                        Aucun avis client enregistré pour ce rendez-vous.
                      </p>
                    )}
                  </div>
                );
              }

              // Bloc avis éditable
              return (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-white">
                      Votre avis sur ce nettoyage
                    </span>
                    {selectedAppointment.userRating && (
                      <span className="text-[11px] text-neutral-400">
                        Note actuelle :{" "}
                        <span className="text-amber-300">
                          {selectedAppointment.userRating}/5
                        </span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const value = i + 1;
                      const active = reviewRating >= value;
                      return (
                        <button
                          key={value}
                          type="button"
                          className="p-0.5"
                          onClick={() => setReviewRating(value)}
                        >
                          <Star
                            className={
                              "h-4 w-4 transition-colors " +
                              (active
                                ? "text-amber-300 fill-amber-300"
                                : "text-neutral-600")
                            }
                          />
                        </button>
                      );
                    })}
                    <span className="ml-1 text-[11px] text-neutral-300">
                      {reviewRating > 0
                        ? `${reviewRating}/5`
                        : "Cliquez pour noter"}
                    </span>
                  </div>

                  <textarea
                    rows={3}
                    className="w-full rounded-xl border border-white/15 bg-black px-2 py-1.5 text-[12px] text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-white/60"
                    placeholder="Ajoutez un commentaire sur la prestation (optionnel)…"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                  />

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      variant="outline"
                      className="h-8 px-3 text-[12px] rounded-full border-white/30 bg-black hover:bg-white hover:text-black"
                      disabled={savingReview}
                      onClick={closeAppointmentModal}
                    >
                      Fermer
                    </Button>
                    <Button
                      className="h-8 px-3 text-[12px] rounded-full bg-white text-black hover:bg-neutral-200"
                      disabled={savingReview}
                      onClick={saveReview}
                    >
                      {savingReview
                        ? "Enregistrement…"
                        : "Enregistrer mon avis"}
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Petit toast en bas */}
      {toast && (
        <div className="fixed bottom-4 inset-x-0 flex justify-center z-50">
          <div className="max-w-xs rounded-full bg-neutral-950/95 border border-white/15 px-3.5 py-2 text-[12px] text-neutral-200 shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
