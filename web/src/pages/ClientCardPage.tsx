import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import {
  addMonthsIso,
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
  locationClasses,
  locationLabel,
  normalizeAppointmentSlot,
  slotIsPast,
  slotLabel,
  slotShortLabel,
  slotWindowLabel,
  weekdayLabel,
  type AppointmentLocation,
  type AppointmentSlot,
  type AppointmentStatus,
  type DayStatus,
} from "../lib/portal";

const SUMUP_TOPUP_URL =
  import.meta.env.VITE_SUMUP_TOPUP_URL || "https://www.sumupbookings.com/bryan-cars";

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

type ClientAppointment = {
  id: number;
  date: string;
  slot: AppointmentSlot;
  time: string | null;
  status: AppointmentStatus;
  adminNote: string | null;
  userRating: number | null;
  userReview: string | null;
  vehicleModel: string | null;
  vehiclePlate: string | null;
  hasPhotos: boolean;
  location: AppointmentLocation | null;
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

const SLOT_ORDER: AppointmentSlot[] = ["morning", "afternoon"];
const MINUTES = ["00", "30"];

const SLOT_HOURS: Record<AppointmentSlot, number[]> = {
  morning: [9, 10, 11, 12],
  afternoon: [14, 15, 16, 17, 18],
};

function splitTime(value: string, slot: AppointmentSlot) {
  const fallback = defaultTimeForSlot(slot);
  const [hour, minute] = value.split(":");
  return {
    hour: hour ?? fallback.slice(0, 2),
    minute: minute ?? "00",
  };
}

function buildMonthMatrix(days: ApiDay[]) {
  const first = days[0];
  if (!first) return [];

  const firstDate = new Date(`${first.date}T00:00:00`);
  const lead = (firstDate.getDay() + 6) % 7;
  const cells: Array<ApiDay | null> = Array.from({ length: lead }, () => null);

  days.forEach((day) => cells.push(day));

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function previewNote(note: string | null) {
  if (!note) return "Aucun compte-rendu admin pour cette prestation.";
  return note.length > 110 ? `${note.slice(0, 110)}...` : note;
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

function dayOverviewLabel(status: DayStatus) {
  if (status === "free") return "Jour ouvert";
  if (status === "mine") return "Votre jour";
  if (status === "busy") return "Jour complet";
  return "Jour passe";
}

function dayOverviewCompactLabel(status: DayStatus) {
  if (status === "free") return "Ouvert";
  if (status === "mine") return "A vous";
  if (status === "busy") return "Complet";
  return "Passe";
}

function slotNavigatorStatusLabel(status: DayStatus) {
  if (status === "free") return "Libre";
  if (status === "mine") return "A vous";
  if (status === "busy") return "Occupe";
  return "Passe";
}

function pickFocusedDay(days: ApiDay[]) {
  if (days.length === 0) return null;

  const mine = days.find((day) =>
    SLOT_ORDER.some((slot) => day.slots[slot].status === "mine"),
  );
  if (mine) return mine.date;

  const free = days.find((day) =>
    SLOT_ORDER.some((slot) => day.slots[slot].status === "free"),
  );
  if (free) return free.date;

  const busy = days.find((day) =>
    SLOT_ORDER.some((slot) => day.slots[slot].status === "busy"),
  );
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

function AppointmentsEmpty() {
  return (
    <div className="bb-surface flex flex-col items-start gap-3 p-6">
      <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-[#f7b955]">
        <CalendarClock className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white">Aucun rendez-vous pour le moment</h3>
        <p className="mt-2 max-w-lg text-sm leading-6 text-white/65">
          Des qu&apos;une prestation est planifiee, elle apparait ici avec son
          statut, son lieu, les notes du centre et vos photos.
        </p>
      </div>
    </div>
  );
}

export function ClientCardPage() {
  const params = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const query = useQuery();

  const slug = params.slug || "card01";
  const monthParam = query.get("m");

  const [data, setData] = React.useState<ApiResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [appointments, setAppointments] = React.useState<ClientAppointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = React.useState(true);
  const [busyAction, setBusyAction] = React.useState(false);
  const [reloadToken, setReloadToken] = React.useState(0);
  const [focusedDayDate, setFocusedDayDate] = React.useState<string | null>(null);

  const [selectedDay, setSelectedDay] = React.useState<ApiDay | null>(null);
  const [selectedSlot, setSelectedSlot] =
    React.useState<AppointmentSlot>("morning");
  const [selectedMode, setSelectedMode] = React.useState<ModalMode>("book");
  const [selectedTime, setSelectedTime] =
    React.useState(defaultTimeForSlot("morning"));
  const [appointmentLocation, setAppointmentLocation] =
    React.useState<AppointmentLocation>("atelier");

  const [selectedAppointment, setSelectedAppointment] =
    React.useState<ClientAppointment | null>(null);
  const [appointmentPhotos, setAppointmentPhotos] = React.useState<AppointmentPhoto[]>([]);
  const [appointmentPhotosLoading, setAppointmentPhotosLoading] = React.useState(false);
  const [reviewRating, setReviewRating] = React.useState(0);
  const [reviewText, setReviewText] = React.useState("");
  const [savingReview, setSavingReview] = React.useState(false);
  const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    async function loadClient() {
      try {
        setLoading(true);
        setError(null);

        const url = new URL(
          `/api/client/${encodeURIComponent(slug)}`,
          window.location.origin,
        );
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
          setError("Impossible de charger votre carte client.");
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

        const response = await fetch(
          `/api/client/${encodeURIComponent(slug)}/appointments`,
        );
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
    if (!toast) return undefined;

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 2800);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  function showToast(message: string) {
    setToast(message);
  }

  const client = data?.client ?? null;
  const month = data?.month ?? null;
  const monthDays = month?.days ?? [];
  const matrix = React.useMemo(() => buildMonthMatrix(monthDays), [monthDays]);
  const upcomingAppointment = React.useMemo(
    () => nextAppointment(appointments),
    [appointments],
  );
  const freeSlot = React.useMemo(() => nextFreeSlot(monthDays), [monthDays]);
  const creditsRatio = client
    ? clampNumber(
        client.formulaTotal > 0
          ? client.formulaRemaining / client.formulaTotal
          : 0,
        0,
        1,
      )
    : 0;

  const sortedAppointments = React.useMemo(() => {
    const next = [...appointments];
    next.sort(
      (left, right) =>
        appointmentDateTime(right).getTime() - appointmentDateTime(left).getTime(),
    );
    return next;
  }, [appointments]);

  const focusedDay = React.useMemo(
    () =>
      monthDays.find((day) => day.date === focusedDayDate) ??
      monthDays[0] ??
      null,
    [focusedDayDate, monthDays],
  );

  React.useEffect(() => {
    if (monthDays.length === 0) return;
    if (focusedDayDate && monthDays.some((day) => day.date === focusedDayDate)) {
      return;
    }

    setFocusedDayDate(pickFocusedDay(monthDays));
  }, [focusedDayDate, monthDays]);

  React.useEffect(() => {
    if (!selectedDay && !selectedAppointment && !lightboxUrl) {
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

      if (selectedDay) {
        closeDayModal();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [lightboxUrl, selectedAppointment, selectedDay]);

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
      appointmentForSlot?.time ??
        slotInfo.time ??
        defaultTimeForSlot(normalizedSlot),
    );
    setAppointmentLocation(
      appointmentForSlot?.location ?? slotInfo.location ?? "atelier",
    );

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
  }

  async function openAppointmentModal(appointment: ClientAppointment) {
    setSelectedAppointment(appointment);
    setReviewRating(appointment.userRating ?? 0);
    setReviewText(appointment.userReview ?? "");
    setAppointmentPhotosLoading(true);

    try {
      const response = await fetch(
        `/api/client/${encodeURIComponent(
          slug,
        )}/appointments/${appointment.id}/photos`,
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

  function selectDaySlot(slot: AppointmentSlot) {
    if (!selectedDay) return;
    syncDaySelection(selectedDay, slot);
  }

  async function openDayModal(day: ApiDay, preferredSlot?: AppointmentSlot) {
    if (!client) return;
    const slot = preferredSlot ?? pickDefaultSlot(day);
    const slotInfo = day.slots[slot];

    setFocusedDayDate(day.date);
    syncDaySelection(day, slot);

    if (slotInfo.status === "free" && client.formulaRemaining <= 0) {
      showToast("Votre formule n'a plus de credits disponibles.");
    }
  }

  async function book(date: string, slot: AppointmentSlot, time: string) {
    if (!data) return;

    if (data.client.formulaRemaining <= 0) {
      showToast("Votre formule n'a plus de credits disponibles.");
      return;
    }

    setBusyAction(true);

    try {
      const response = await fetch(`/api/client/${encodeURIComponent(slug)}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          slot,
          time,
          location: appointmentLocation,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.ok) {
        showToast("Impossible de reserver ce creneau.");
        return;
      }

      showToast("Demande de rendez-vous envoyee.");
      setSelectedDay(null);
      setReloadToken((value) => value + 1);
    } catch (saveError) {
      showToast("Erreur reseau pendant la reservation.");
    } finally {
      setBusyAction(false);
    }
  }

  async function cancel(date: string, slot: AppointmentSlot) {
    if (!canChangeDay(date)) {
      showToast("Annulation fermee a partir de la veille a minuit.");
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
        `/api/client/${encodeURIComponent(
          slug,
        )}/appointments/${selectedAppointment.id}/review`,
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

  function goMonth(delta: number) {
    if (!month) return;
    navigate(`/card/${encodeURIComponent(slug)}?m=${addMonthsIso(month.iso, delta)}`);
  }

  const canReviewSelected =
    !!selectedAppointment &&
    selectedAppointment.status === "done" &&
    appointments.some((appointment) => appointment.id === selectedAppointment.id);
  const creditsExhausted = (client?.formulaRemaining ?? 0) <= 0;
  const nextFreeDay = React.useMemo(() => {
    if (!freeSlot) return null;
    return monthDays.find((day) => day.date === freeSlot.date) ?? null;
  }, [freeSlot, monthDays]);

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
              Verifiez le lien NFC ou retournez a l&apos;accueil pour relancer la
              navigation.
            </p>
            <Link className="bb-button-brand mt-6 inline-flex" to="/">
              Retour a l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bb-shell">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-7rem] top-28 h-72 w-72 rounded-full bg-[#f7b955]/12 blur-3xl" />
        <div className="absolute right-[-7rem] top-0 h-80 w-80 rounded-full bg-sky-400/12 blur-3xl" />
        <div className="absolute bottom-10 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#ff7a18]/10 blur-3xl" />
      </div>

      <main className="bb-content space-y-6 md:space-y-8">
        <section className="bb-surface-strong relative overflow-hidden p-6 md:p-8">
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden lg:flex lg:items-center lg:justify-end">
            <img
              alt=""
              aria-hidden="true"
              className="h-[29rem] w-[23rem] translate-x-14 object-contain opacity-[0.08] mix-blend-screen saturate-0"
              src="/BCD.jpg"
            />
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  className="bb-button-ghost px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/80"
                  to="/"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Link>
                <div className="bb-pill border-white/12 bg-white/[0.05] text-white/80">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#f7b955]" />
                  Carte active
                </div>
              </div>

              <div>
                <p className="bb-eyebrow">BlackBox client portal</p>
                <h1 className="bb-title mt-3">
                  Bonjour {client.firstName || client.fullName || "client"},
                </h1>
                <p className="bb-subtitle mt-3 max-w-2xl">
                  Suivez vos passages, planifiez la prochaine prestation et gardez
                  une vue claire sur votre formule detailing.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <article className="bb-metric">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                    Credits
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-white">
                    {client.formulaRemaining}
                    <span className="ml-2 text-lg text-white/35">/ {client.formulaTotal}</span>
                  </p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#f7b955] to-[#ff7a18]"
                      style={{ width: `${creditsRatio * 100}%` }}
                    />
                  </div>
                </article>

                <article className="bb-metric">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                    Prochain creneau libre
                  </p>
                  <p className="mt-3 text-xl font-semibold text-white">
                    {freeSlot ? formatDateFR(freeSlot.date) : "A confirmer"}
                  </p>
                  <p className="mt-2 text-sm text-white/55">
                    {freeSlot
                      ? `${slotLabel(freeSlot.slot)} ${slotWindowLabel(
                          freeSlot.slot,
                        )} disponible a la reservation.`
                      : "Le planning ne propose pas encore de disponibilite."}
                  </p>
                </article>

                <article className="bb-metric">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                    Prochain rendez-vous
                  </p>
                  <p className="mt-3 text-xl font-semibold text-white">
                    {upcomingAppointment
                      ? formatDateFR(upcomingAppointment.date)
                      : "Rien de prevu"}
                  </p>
                  <p className="mt-2 text-sm text-white/55">
                    {upcomingAppointment
                      ? `${slotLabel(upcomingAppointment.slot)} · ${formatTimeHHMM(
                          upcomingAppointment.time,
                        )} - ${locationLabel(
                          upcomingAppointment.location,
                        )}`
                      : "Aucune prestation planifiee pour le moment."}
                  </p>
                </article>
              </div>
            </div>

            <div className="bb-surface relative min-w-[280px] max-w-sm overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-10 top-2 h-24 w-24 rounded-full bg-sky-400/10 blur-3xl" />
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-[#f7b955]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                      Formule active
                    </p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {client.formulaName || "Formule detailing"}
                    </p>
                  </div>
                </div>

                <div className="hidden overflow-hidden rounded-[20px] border border-white/10 bg-black/35 sm:block">
                  <img
                    alt="Bryan Cars Detailing"
                    className="h-20 w-20 object-cover object-center opacity-90"
                    src="/BCD.jpg"
                  />
                </div>
              </div>
              <p className="mt-5 text-sm leading-6 text-white/62">
                Cet espace est concu pour aller droit au but: voir votre vehicule,
                vos credits, vos creneaux et vos retours de prestation sans friction.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  className="bb-button-brand flex-1 justify-center px-4 py-3"
                  href={SUMUP_TOPUP_URL}
                  rel="noreferrer"
                  target="_blank"
                >
                  Recharger
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
                <a
                  className="bb-button-ghost flex-1 justify-center px-4 py-3"
                  href="tel:0603125186"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Appeler
                </a>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-[22px] border border-white/10 bg-black/25 p-3 sm:hidden">
                <img
                  alt="Bryan Cars Detailing"
                  className="h-16 w-16 rounded-[18px] object-cover object-center"
                  src="/BCD.jpg"
                />
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                    Signature Bryan Cars
                  </p>
                  <p className="mt-1 text-sm leading-5 text-white/62">
                    Une identite visuelle detailer plus marquee sur l'espace client.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="bb-surface p-6">
            <div className="bb-section-head">
              <div>
                <p className="bb-eyebrow">Profil client</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Coordonnees et carte
                </h2>
              </div>
              <div className="bb-pill border-white/12 bg-white/[0.04] text-white/70">
                <UserRound className="h-3.5 w-3.5 text-[#f7b955]" />
                {client.cardCode || slug}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-white/45">Nom</p>
                <p className="mt-3 text-xl font-semibold text-white">
                  {client.fullName || `${client.firstName || ""} ${client.lastName || ""}`.trim() || "Client"}
                </p>
                <div className="mt-5 space-y-3 text-sm text-white/65">
                  <p>{client.phone || "Telephone non renseigne"}</p>
                  <p>{client.email || "Email non renseigne"}</p>
                  <p>
                    {[client.addressLine1, client.postalCode, client.city]
                      .filter(Boolean)
                      .join(", ") || "Adresse non renseignee"}
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-white/45">Vehicule</p>
                <p className="mt-3 text-xl font-semibold text-white">
                  {client.vehicleModel || "Vehicule non renseigne"}
                </p>
                <div className="mt-5 space-y-3 text-sm text-white/65">
                  <p>Plaque: {client.vehiclePlate || "Non renseignee"}</p>
                  <p>Formule: {client.formulaName || "Non renseignee"}</p>
                  <p>
                    Credits restants: {client.formulaRemaining} sur {client.formulaTotal}
                  </p>
                </div>
              </div>
            </div>
          </article>

          <article className="bb-surface p-6">
            <div className="bb-section-head">
              <div>
                <p className="bb-eyebrow">Acces rapide</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Contact centre
                </h2>
              </div>
              <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100">
                Support direct
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-lg font-semibold text-white">Bryan Cars Detailing</p>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  Une question sur votre nettoyage, un besoin de precision avant le
                  rendez-vous ou une demande specifique sur le vehicule ?
                </p>
              </div>

              <div className="grid gap-3">
                <a className="bb-button-brand justify-center" href="tel:0603125186">
                  <Phone className="mr-2 h-4 w-4" />
                  Appeler le centre
                </a>
                <a className="bb-button-ghost justify-center" href={SUMUP_TOPUP_URL}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Voir la recharge / booking
                </a>
              </div>
            </div>
          </article>
        </section>

        <section className="space-y-4">
          <article className="bb-surface p-6">
            <div className="bb-section-head">
              <div>
                <p className="bb-eyebrow">Agenda</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Choisissez votre prochain passage
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62">
                  Les jours libres sont reservables. Vos prochains rendez-vous sont
                  mis en avant. Une fois passes, ils restent consultables avec leur
                  historique et les photos de prestation.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="bb-button-ghost h-11 w-11 rounded-full px-0"
                  onClick={() => goMonth(-1)}
                  type="button"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  className="bb-button-ghost h-11 w-11 rounded-full px-0"
                  onClick={() => goMonth(1)}
                  type="button"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-[32px] border border-white/10 bg-black/25 p-4 md:p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-2xl">
                  <p className="text-sm uppercase tracking-[0.16em] text-white/40">
                    Periode
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold capitalize text-white">
                    {month.label}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-white/58">
                    Chaque jour peut accueillir deux passages distincts: un le
                    matin entre 9h et 12h, puis un l&apos;apres-midi entre 14h et
                    18h. Choisissez un jour pour afficher les deux creneaux en
                    detail.
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Libre", status: "free" as const },
                    { label: "Votre date", status: "mine" as const },
                    { label: "Passe", status: "done" as const },
                    { label: "Complet", status: "busy" as const },
                  ].map((item) => (
                    <div
                      className={cn(
                        "bb-pill justify-center px-3 py-1.5",
                        dayStatusClasses(item.status),
                      )}
                      key={item.label}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {nextFreeDay && freeSlot && (
                  <button
                    className="bb-button-brand"
                    onClick={() => {
                      void openDayModal(nextFreeDay, freeSlot.slot);
                    }}
                    type="button"
                  >
                    Premier creneau libre
                  </button>
                )}
                {upcomingAppointment && (
                  <button
                    className="bb-button-ghost"
                    onClick={() => {
                      void openAppointmentModal(upcomingAppointment);
                    }}
                    type="button"
                  >
                    Voir mon prochain rendez-vous
                  </button>
                )}
              </div>

              <div className="mt-6 space-y-3 md:hidden">
                {monthDays.map((day) => {
                  const overviewStatus = dayOverviewStatus(day);
                  const active = focusedDay?.date === day.date;

                  return (
                    <div
                      className={cn(
                        "rounded-[26px] border p-4 transition duration-200",
                        active
                          ? "border-[#f7b955]/45 bg-[#f7b955]/10 shadow-[0_18px_48px_rgba(247,185,85,0.12)]"
                          : "border-white/10 bg-white/[0.03]",
                      )}
                      key={day.date}
                    >
                      <button
                        className="w-full text-left"
                        onClick={() => {
                          void openDayModal(day);
                        }}
                        type="button"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                              {weekdayLabel(day.date)}
                            </p>
                            <h3 className="mt-2 text-2xl font-semibold text-white">
                              {formatDateFR(day.date, {
                                day: "numeric",
                                month: "long",
                              })}
                            </h3>
                          </div>
                          <div
                            className={cn(
                              "bb-pill px-3 py-1",
                              dayStatusClasses(overviewStatus),
                            )}
                          >
                            {dayOverviewLabel(overviewStatus)}
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2">
                          {SLOT_ORDER.map((slot) => (
                            <div
                              className={cn(
                                "rounded-[18px] border px-3 py-3",
                                dayStatusClasses(day.slots[slot].status),
                              )}
                              key={`${day.date}-${slot}`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                                    {slotLabel(slot)}
                                  </p>
                                  <p className="mt-1 text-xs opacity-75">
                                    {slotWindowLabel(slot)}
                                  </p>
                                </div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                                  {slotNavigatorStatusLabel(day.slots[slot].status)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 hidden md:block">
                <div className="mb-4 grid grid-cols-7 gap-4">
                  {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((label) => (
                    <div
                      className="px-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35"
                      key={label}
                    >
                      {label}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-4">
                  {matrix.map((day, index) =>
                    day ? (
                      <button
                        className={cn(
                          "min-h-[184px] rounded-[28px] border p-4 text-left transition duration-200",
                          focusedDay?.date === day.date
                            ? "border-[#f7b955]/45 bg-[#f7b955]/10 shadow-[0_18px_48px_rgba(247,185,85,0.12)]"
                            : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
                        )}
                        key={day.date}
                        onClick={() => {
                          void openDayModal(day);
                        }}
                        type="button"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-3xl font-semibold text-white">{day.day}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/40">
                              {weekdayLabel(day.date)}
                            </p>
                          </div>
                          <div
                            className={cn(
                              "bb-pill px-2.5 py-1 text-[10px]",
                              dayStatusClasses(dayOverviewStatus(day)),
                            )}
                          >
                            {dayOverviewCompactLabel(dayOverviewStatus(day))}
                          </div>
                        </div>

                        <div className="mt-5 space-y-3">
                          {SLOT_ORDER.map((slot) => (
                            <div
                              className={cn(
                                "rounded-[20px] border px-3 py-3",
                                dayStatusClasses(day.slots[slot].status),
                              )}
                              key={`${day.date}-${slot}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                                    {slotShortLabel(slot)}
                                  </p>
                                  <p className="mt-1 text-[11px] opacity-75">
                                    {slotWindowLabel(slot)}
                                  </p>
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
                        className="min-h-[184px] rounded-[28px] border border-transparent bg-transparent"
                        key={`empty-${index}`}
                      />
                    ),
                  )}
                </div>
              </div>
            </div>

          </article>

          <article className="bb-surface p-6">
            <div className="bb-section-head">
              <div>
                <p className="bb-eyebrow">Rendez-vous</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Historique et suivi
                </h2>
              </div>
              <div className="bb-pill border-white/12 bg-white/[0.04] text-white/75">
                {appointments.length} fiche{appointments.length > 1 ? "s" : ""}
              </div>
            </div>

            <div className="mt-6 grid gap-3 xl:grid-cols-2">
              {appointmentsLoading ? (
                <div className="bb-surface flex items-center gap-3 px-5 py-4 text-sm text-white/70">
                  <Loader2 className="h-4 w-4 animate-spin text-[#f7b955]" />
                  Chargement des rendez-vous...
                </div>
              ) : sortedAppointments.length === 0 ? (
                <AppointmentsEmpty />
              ) : (
                sortedAppointments.map((appointment) => (
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
                            {slotLabel(appointment.slot)}
                          </div>
                          {appointmentIsPast(appointment) && (
                            <div className="bb-pill border-white/12 bg-white/[0.04] text-white/55">
                              Archive
                            </div>
                          )}
                        </div>

                        <div>
                          <h3 className="text-xl font-semibold text-white">
                            {formatDateFR(appointment.date)}
                          </h3>
                          <p className="mt-2 text-sm text-white/60">
                            {slotWindowLabel(appointment.slot)} · {formatTimeHHMM(appointment.time)} -{" "}
                            {appointment.vehicleModel || client.vehicleModel || "Vehicule"}
                            {appointment.vehiclePlate ? ` / ${appointment.vehiclePlate}` : ""}
                          </p>
                        </div>

                        <p className="max-w-2xl text-sm leading-6 text-white/58">
                          {previewNote(appointment.adminNote)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-right">
                          <p className="text-xs uppercase tracking-[0.16em] text-white/35">
                            Photos
                          </p>
                          <p className="mt-2 text-lg font-semibold text-white">
                            {appointment.hasPhotos ? "Oui" : "Non"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </article>
        </section>
      </main>

      {selectedDay && currentDaySlot && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/75 px-3 pb-3 pt-8 backdrop-blur-md md:items-center"
          onClick={closeDayModal}
        >
          <div
            className="bb-surface-strong w-full max-w-lg p-6"
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
                    "Chaque jour propose un passage le matin 9h-12h et un autre l'apres-midi 14h-18h."}
                  {selectedMode === "manage" &&
                    "Vous pouvez ajuster l'heure de ce passage ou l'annuler tant que la fenetre est encore ouverte."}
                  {selectedMode === "past" &&
                    "Ce creneau n'est plus reservable depuis ce planning instantane."}
                </p>
              </div>

              <button
                className="bb-button-ghost h-11 w-11 rounded-full px-0"
                onClick={closeDayModal}
                type="button"
              >
                <span className="text-lg">x</span>
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
                        selectedSlot === slot &&
                          "shadow-[0_0_0_1px_rgba(247,185,85,0.45)]",
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
                            ? "Choisissez ce creneau pour envoyer une demande."
                            : slotInfo.status === "busy"
                              ? "Une autre reservation est deja engagee sur cette demi-journee."
                              : "Creneau consulte a titre d'historique."}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="bb-pill border-white/12 bg-white/[0.05] text-white/80">
                    {slotLabel(selectedSlot)}
                  </div>
                  {currentDayAppointment && (
                    <div
                      className={cn(
                        "bb-pill",
                        appointmentStatusClasses(currentDayAppointment.status),
                      )}
                    >
                      {appointmentStatusLabel(currentDayAppointment.status)}
                    </div>
                  )}
                  <div
                    className={cn(
                      "bb-pill border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                      locationClasses(
                        currentDayAppointment?.location ?? currentDaySlot.location,
                      ),
                    )}
                  >
                    {locationLabel(currentDayAppointment?.location ?? currentDaySlot.location)}
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-white/65">
                  Fenetre {slotWindowLabel(selectedSlot)}.{" "}
                  {currentDayAppointment
                    ? `Horaire actuel: ${formatTimeHHMM(currentDayAppointment.time)}.`
                    : selectedMode === "book"
                      ? "Le creneau est libre et reservable."
                      : selectedMode === "past"
                        ? "Cette demi-journee est archivee."
                        : "Ce creneau est deja pris pour l'instant."}
                </p>
              </div>

              {selectedMode === "book" && (
                <>
                  {creditsExhausted && (
                    <div className="rounded-[24px] border border-amber-300/25 bg-amber-300/10 p-4">
                      <p className="text-sm font-semibold text-white">
                        Aucun credit disponible
                      </p>
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        Rechargez votre formule pour envoyer une nouvelle demande
                        de rendez-vous sur ce creneau.
                      </p>
                      <a className="bb-button-ghost mt-4 justify-center" href={SUMUP_TOPUP_URL}>
                        Voir la recharge
                      </a>
                    </div>
                  )}

                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                      Lieu souhaite
                    </p>
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
                            <span className="text-base font-semibold text-white">
                              {option.label}
                            </span>
                            {appointmentLocation === option.value && (
                              <CheckCircle2 className="h-4 w-4 text-[#f7b955]" />
                            )}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-white/60">{option.copy}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                        Heure
                      </span>
                      <select
                        className="bb-select"
                        onChange={(event) =>
                          setSelectedTime(`${event.target.value}:${timeParts.minute}`)
                        }
                        value={timeParts.hour}
                      >
                        {availableHours.map((hour) => (
                          <option key={hour} value={String(hour).padStart(2, "0")}>
                            {String(hour).padStart(2, "0")}h
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                        Minutes
                      </span>
                      <select
                        className="bb-select"
                        onChange={(event) =>
                          setSelectedTime(`${timeParts.hour}:${event.target.value}`)
                        }
                        value={timeParts.minute}
                      >
                        {MINUTES.map((minute) => (
                          <option key={minute} value={minute}>
                            {minute}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      className="bb-button-brand justify-center"
                      disabled={busyAction || creditsExhausted}
                      onClick={() => {
                        void book(selectedDay.date, selectedSlot, selectedTime);
                      }}
                      type="button"
                    >
                      {busyAction
                        ? "Envoi..."
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
                    <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                      Lieu de prestation
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        {
                          value: "atelier" as const,
                          label: "Au studio",
                        },
                        {
                          value: "domicile" as const,
                          label: "A domicile",
                        },
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

                  <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                        Heure
                      </span>
                      <select
                        className="bb-select"
                        onChange={(event) =>
                          setSelectedTime(`${event.target.value}:${timeParts.minute}`)
                        }
                        value={timeParts.hour}
                      >
                        {availableHours.map((hour) => (
                          <option key={hour} value={String(hour).padStart(2, "0")}>
                            {String(hour).padStart(2, "0")}h
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                        Minutes
                      </span>
                      <select
                        className="bb-select"
                        onChange={(event) =>
                          setSelectedTime(`${timeParts.hour}:${event.target.value}`)
                        }
                        value={timeParts.minute}
                      >
                        {MINUTES.map((minute) => (
                          <option key={minute} value={minute}>
                            {minute}
                          </option>
                        ))}
                      </select>
                    </label>
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
            className="bb-surface-strong w-full max-w-4xl p-6 md:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    className={cn(
                      "bb-pill",
                      appointmentStatusClasses(selectedAppointment.status),
                    )}
                  >
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
                  {selectedAppointment.vehicleModel || client.vehicleModel || "Vehicule"}
                  {selectedAppointment.vehiclePlate
                    ? ` / ${selectedAppointment.vehiclePlate}`
                    : ""}
                </p>
              </div>

              <button
                className="bb-button-ghost self-start"
                onClick={closeAppointmentModal}
                type="button"
              >
                Fermer
              </button>
            </div>

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
                        onClick={() => setLightboxUrl(photo.url)}
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

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 px-4"
          onClick={() => setLightboxUrl(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="bb-button-ghost absolute right-3 top-3 z-10"
              onClick={() => setLightboxUrl(null)}
              type="button"
            >
              Fermer
            </button>
            <img
              alt="Photo prestation"
              className="max-h-[90vh] rounded-[28px] border border-white/10 object-contain"
              src={lightboxUrl}
            />
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
