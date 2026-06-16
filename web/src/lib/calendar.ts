// Ajout d'un rendez-vous a un agenda: lien Google Calendar + telechargement
// .ics (Apple/Google/Outlook). Heure "flottante" en Europe/Paris.

export type CalendarEvent = {
  title: string;
  date: string; // AAAA-MM-JJ
  time: string | null; // HH:MM
  slot: "morning" | "afternoon";
  durationMinutes?: number;
  location?: string | null;
  details?: string | null;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function startEndStamps(ev: CalendarEvent): { start: string; end: string } {
  const fallback = ev.slot === "afternoon" ? "14:00" : "09:00";
  const time = ev.time && /^\d{2}:\d{2}/.test(ev.time) ? ev.time.slice(0, 5) : fallback;
  const [y, m, d] = ev.date.split("-").map((v) => Number(v));
  const [hh, mm] = time.split(":").map((v) => Number(v));
  const startDate = new Date(y, m - 1, d, hh, mm);
  const endDate = new Date(startDate.getTime() + (ev.durationMinutes ?? 240) * 60000);
  const fmt = (dt: Date) =>
    `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(
      dt.getMinutes(),
    )}00`;
  return { start: fmt(startDate), end: fmt(endDate) };
}

export function googleCalendarUrl(ev: CalendarEvent): string {
  const { start, end } = startEndStamps(ev);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates: `${start}/${end}`,
    ctz: "Europe/Paris",
  });
  if (ev.details) params.set("details", ev.details);
  if (ev.location) params.set("location", ev.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcs(ev: CalendarEvent, fileName = "rendez-vous-bryan-cars.ics"): void {
  const { start, end } = startEndStamps(ev);
  const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  const uid = `bbx-${start}-${Math.floor(Math.random() * 1e6)}@bryancars`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bryan Cars//BlackBox//FR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${start}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${esc(ev.title)}`,
    ev.location ? `LOCATION:${esc(ev.location)}` : "",
    ev.details ? `DESCRIPTION:${esc(ev.details)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
