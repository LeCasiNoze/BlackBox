export type DayStatus = "free" | "mine" | "busy" | "done";
export type AppointmentSlot = "morning" | "afternoon";
export type AppointmentLocation = "atelier" | "domicile";
export type AppointmentStatus =
  | "requested"
  | "confirmed"
  | "done"
  | "cancelled";

type DatedAppointment = {
  date: string;
  time: string | null;
  slot?: AppointmentSlot | null;
};

type DateLabelOptions = {
  weekday?: "long" | "short" | "narrow";
  day?: "numeric" | "2-digit";
  month?: "numeric" | "2-digit" | "long" | "short" | "narrow";
  year?: "numeric" | "2-digit";
};

const SLOT_DEFAULT_TIMES: Record<AppointmentSlot, string> = {
  morning: "09:00",
  afternoon: "14:00",
};

const SLOT_END_TIMES: Record<AppointmentSlot, string> = {
  morning: "12:00",
  afternoon: "18:00",
};

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function addMonthsIso(iso: string, delta: number) {
  const [yearValue, monthValue] = iso.split("-").map(Number);
  if (!yearValue || !monthValue) return iso;
  const next = new Date(yearValue, monthValue - 1 + delta, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

export function isPastDay(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  return target < today;
}

export function canChangeDay(dateStr: string) {
  const dayStart = new Date(`${dateStr}T00:00:00`);
  const limit = new Date(dayStart.getTime() - 24 * 60 * 60 * 1000);
  return Date.now() < limit.getTime();
}

export function formatDateFR(dateStr: string, options: DateLabelOptions = {}) {
  if (!dateStr) return "--";

  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString("fr-FR", {
    day: options.day ?? "2-digit",
    month: options.month ?? "long",
    year: options.year ?? "numeric",
    weekday: options.weekday,
  });
}

export function formatTimeHHMM(time: string | null) {
  if (!time) return "--";
  return time.slice(0, 5);
}

export function normalizeAppointmentSlot(
  slot: AppointmentSlot | null | undefined,
  time?: string | null,
): AppointmentSlot {
  if (slot === "morning" || slot === "afternoon") {
    return slot;
  }

  if (time) {
    const hour = Number(time.slice(0, 2));
    if (Number.isFinite(hour) && hour >= 14) {
      return "afternoon";
    }
  }

  return "morning";
}

export function defaultTimeForSlot(slot: AppointmentSlot) {
  return SLOT_DEFAULT_TIMES[normalizeAppointmentSlot(slot)];
}

export function slotWindowLabel(slot: AppointmentSlot) {
  return normalizeAppointmentSlot(slot) === "afternoon"
    ? "14h-18h"
    : "9h-12h";
}

export function slotLabel(slot: AppointmentSlot) {
  return normalizeAppointmentSlot(slot) === "afternoon"
    ? "Apres-midi"
    : "Matin";
}

export function slotShortLabel(slot: AppointmentSlot) {
  return normalizeAppointmentSlot(slot) === "afternoon" ? "AP" : "AM";
}

export function slotIsPast(dateStr: string, slot: AppointmentSlot) {
  const endTime = SLOT_END_TIMES[normalizeAppointmentSlot(slot)];
  return Date.now() > new Date(`${dateStr}T${endTime}:00`).getTime();
}

export function appointmentDateTime(appointment: DatedAppointment) {
  const slot = normalizeAppointmentSlot(appointment.slot, appointment.time);
  const time = appointment.time ?? defaultTimeForSlot(slot);
  return new Date(`${appointment.date}T${time}:00`);
}

export function appointmentIsPast(appointment: DatedAppointment) {
  const slot = normalizeAppointmentSlot(appointment.slot, appointment.time);
  return slotIsPast(appointment.date, slot);
}

export function appointmentStatusLabel(status: AppointmentStatus) {
  switch (status) {
    case "requested":
      return "En attente";
    case "confirmed":
      return "Confirme";
    case "done":
      return "Effectue";
    case "cancelled":
      return "Annule";
    default:
      return status;
  }
}

export function appointmentStatusClasses(status: AppointmentStatus) {
  switch (status) {
    case "requested":
      return "border-amber-400/35 bg-amber-300/10 text-amber-100";
    case "confirmed":
      return "border-sky-400/35 bg-sky-300/10 text-sky-100";
    case "done":
      return "border-emerald-400/35 bg-emerald-300/10 text-emerald-100";
    case "cancelled":
      return "border-rose-400/35 bg-rose-300/10 text-rose-100";
    default:
      return "border-white/10 bg-white/5 text-white";
  }
}

export function locationLabel(location: AppointmentLocation | null | undefined) {
  switch (location) {
    case "atelier":
      return "Au studio";
    case "domicile":
      return "A domicile";
    default:
      return "Lieu a confirmer";
  }
}

export function locationClasses(
  location: AppointmentLocation | null | undefined,
) {
  switch (location) {
    case "atelier":
      return "border-sky-400/35 bg-sky-300/10 text-sky-100";
    case "domicile":
      return "border-fuchsia-400/35 bg-fuchsia-300/10 text-fuchsia-100";
    default:
      return "border-white/10 bg-white/5 text-white/70";
  }
}

export function dayStatusLabel(status: DayStatus) {
  switch (status) {
    case "free":
      return "Disponible";
    case "mine":
      return "Reserve";
    case "busy":
      return "Occupe";
    case "done":
      return "Passe";
    default:
      return status;
  }
}

export function dayStatusClasses(status: DayStatus) {
  switch (status) {
    case "free":
      return "border-white/10 bg-white/[0.03] text-white hover:border-[#f7b955]/50 hover:bg-[#f7b955]/12";
    case "mine":
      return "border-emerald-400/35 bg-emerald-300/12 text-emerald-50 shadow-[0_0_0_1px_rgba(16,185,129,0.15)]";
    case "busy":
      return "border-rose-400/25 bg-rose-300/10 text-rose-100";
    case "done":
      return "border-sky-400/25 bg-sky-300/10 text-sky-100";
    default:
      return "border-white/10 bg-white/[0.03] text-white";
  }
}

export function weekdayLabel(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`);
  const map = ["D", "LU", "MA", "ME", "JE", "VE", "SA"];
  return map[date.getDay()] ?? "";
}

export function normalizePhoneForTel(phone: string) {
  return phone.replace(/\s+/g, "");
}

export function clampNumber(value: number, min = 0, max = Number.MAX_SAFE_INTEGER) {
  return Math.min(Math.max(value, min), max);
}
