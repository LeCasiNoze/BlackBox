// web/src/pages/ClientCardPage.tsx
import * as React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Loader2 } from "lucide-react";

type DayStatus = "free" | "mine" | "busy";

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

  // Modale
  const [modalDay, setModalDay] = React.useState<ApiDay | null>(null);
  const [modalMode, setModalMode] = React.useState<ModalMode>("book");
  const [selectedTime, setSelectedTime] = React.useState<string>(defaultTime());

  // Petit message en bas
  const [toast, setToast] = React.useState<string | null>(null);

  const monthParam = query.get("m");

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

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  }

  function openDayModal(day: ApiDay) {
    if (!client) return;
    const past = isPastDay(day.date);

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

    if (day.status === "mine") {
      setModalDay(day);
      const existing = localTimes[day.date] ?? defaultTime();
      setSelectedTime(existing);
      if (past) setModalMode("past");
      else setModalMode("manage");
      return;
    }

    if (day.status === "busy") {
      showToast("Ce jour est déjà réservé.");
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
      // si on veut re-synchroniser strictement avec la DB :
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

    // Mise à jour instantanée côté UI
    setLocalTimes((prev) => ({
        ...prev,
        [date]: newTime,
    }));

    try {
        // Le backend détecte que c'est un rendez-vous déjà existant pour ce client
        // et passe en mode "updateAppointmentTimeForClient" (pas de crédit consommé).
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

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Chargement de votre espace…</span>
        </div>
      </div>
    );
  }

  if (error || !client || !month) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        <div className="max-w-xs text-center space-y-2">
          <p className="text-sm font-medium">Une erreur est survenue.</p>
          <p className="text-xs text-slate-400">
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

  // Modale en bas de l’écran
  const { h: timeHour, m: timeMinute } = splitTime(selectedTime);
  const currentModalDay = modalDay;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-black text-slate-50 flex justify-center px-3 py-4">
      <main className="w-full max-w-md space-y-3">
        {/* Header */}
        <Card>
          <div className="p-4 space-y-3">
            <div className="inline-flex items-center rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
              BlackBox NFC
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">
                Bonjour {displayName},
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Bienvenue dans votre espace privé de suivi detailing.
              </p>
            </div>
          </div>
        </Card>

        {/* Infos client */}
        <Card>
          <div className="p-4 grid grid-cols-1 gap-3 text-sm">
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500 mb-1">
                Client
              </div>
              <div>{client.fullName ?? displayName}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500 mb-1">
                Carte / code
              </div>
              <div>{client.cardCode ?? client.slug}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500 mb-1">
                Véhicule
              </div>
              <div>
                {client.vehicleModel ?? "—"}
                {client.vehiclePlate ? ` · ${client.vehiclePlate}` : ""}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500 mb-1">
                Formule
              </div>
              <div>{client.formulaName ?? "—"}</div>
            </div>
          </div>
        </Card>

        {/* Crédits */}
        <Card>
          <div className="p-4 space-y-1">
            <p className="text-base font-semibold">
              Nettoyages restants :{" "}
              <span
                className={
                  client.formulaRemaining > 0
                    ? "text-emerald-400"
                    : "text-red-400"
                }
              >
                {remainingLabel}
              </span>
            </p>
            <p className="text-xs text-slate-400">
              Chaque rendez-vous validé déduira 1 nettoyage de votre forfait.
            </p>
          </div>
        </Card>

        {/* Agenda */}
        <Card>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Agenda</p>
                <p className="text-xs text-slate-400">{month.label}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-full border-slate-700/70"
                  onClick={() => goMonth(-1)}
                >
                  ‹
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-full border-slate-700/70"
                  onClick={() => goMonth(1)}
                >
                  ›
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-[10px] text-slate-400">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-slate-900 border border-slate-600" />
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
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span>Indisponible</span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 mt-1">
              {month.days.map((d) => {
                const mine = d.status === "mine";
                const busy = d.status === "busy";
                const free = d.status === "free";
                const past = isPastDay(d.date);

                const base =
                  "w-full aspect-square rounded-xl border flex flex-col items-center justify-center text-xs transition focus-visible:outline-none";

                if (free) {
                  return (
                    <button
                      key={d.date}
                      className={`${base} border-slate-700 bg-slate-950 hover:border-emerald-400 hover:bg-emerald-500/10`}
                      disabled={busyAction}
                      onClick={() => openDayModal(d)}
                    >
                      <span className="font-medium">{d.day}</span>
                    </button>
                  );
                }

                if (mine && !past) {
                  // Rendez-vous futur → vert
                  return (
                    <button
                      key={d.date}
                      className={`${base} border-emerald-500 bg-emerald-500/15`}
                      disabled={busyAction}
                      onClick={() => openDayModal(d)}
                    >
                      <span className="font-medium">{d.day}</span>
                      <span className="mt-0.5 h-1 w-1 rounded-full bg-emerald-400" />
                    </button>
                  );
                }

                if (mine && past) {
                  // Rendez-vous passé → bleu
                  return (
                    <button
                      key={d.date}
                      className={`${base} border-sky-500 bg-sky-500/15`}
                      disabled={busyAction}
                      onClick={() => openDayModal(d)}
                    >
                      <span className="font-medium">{d.day}</span>
                      <span className="mt-0.5 h-1 w-1 rounded-full bg-sky-400" />
                    </button>
                  );
                }

                // busy (autre client)
                return (
                  <div
                    key={d.date}
                    className={`${base} border-red-500/80 bg-red-500/10 text-slate-300`}
                  >
                    <span className="font-medium">{d.day}</span>
                    <span className="mt-0.5 h-1 w-1 rounded-full bg-red-500" />
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Touchez un jour disponible pour demander un rendez-vous. Vos
              rendez-vous à venir sont en vert. Une fois la date passée, ils
              apparaîtront en bleu. Les jours déjà pris par d&apos;autres
              clients sont en rouge.
            </p>
          </div>
        </Card>
      </main>

      {/* Modale de bas de page */}
    {currentModalDay && (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-3xl p-4 space-y-4 shadow-2xl">
        {/* plus besoin de la barre de drag en haut */}
        {/* ... laisse exactement le contenu book/manage/past que tu as déjà ... */}
        {modalMode === "book" && (
              <>
                <div>
                  <p className="text-sm font-medium mb-1">
                    Demander un rendez-vous
                  </p>
                  <p className="text-xs text-slate-400">
                    Jour sélectionné :{" "}
                    <span className="font-medium">
                      {currentModalDay.day}/{month.monthIndex + 1}/
                      {month.year}
                    </span>
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-400">
                    Choisissez une heure entre{" "}
                    <span className="font-medium">8h00</span> et{" "}
                    <span className="font-medium">16h30</span> (créneaux de 30
                    minutes).
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase tracking-[0.16em] text-slate-500 mb-1">
                        Heure
                      </label>
                      <select
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
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
                      <label className="block text-[10px] uppercase tracking-[0.16em] text-slate-500 mb-1">
                        Minutes
                      </label>
                      <select
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
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
                    className="flex-1 rounded-xl"
                    disabled={busyAction}
                    onClick={() => setModalDay(null)}
                  >
                    Annuler
                  </Button>
                  <Button
                    className="flex-1 rounded-xl"
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
                  <p className="text-xs text-slate-400">
                    Rendez-vous prévu le{" "}
                    <span className="font-medium">
                      {currentModalDay.day}/{month.monthIndex + 1}/
                      {month.year}
                    </span>{" "}
                    à{" "}
                    <span className="font-medium">
                      {selectedTime ?? localTimes[currentModalDay.date] ?? "—"}
                    </span>
                  </p>
                </div>

                <div className="space-y-2">
                    <p className="text-xs text-slate-400">
                    Vous pouvez modifier l&apos;heure de ce rendez-vous librement. 
                    L&apos;annulation complète n&apos;est possible que jusqu&apos;à la veille à minuit.
                    </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase tracking-[0.16em] text-slate-500 mb-1">
                        Nouvelle heure
                      </label>
                      <select
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
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
                      <label className="block text-[10px] uppercase tracking-[0.16em] text-slate-500 mb-1">
                        Minutes
                      </label>
                      <select
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
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
                    className="rounded-xl"
                    disabled={busyAction}
                    onClick={() =>
                      updateTime(currentModalDay.date, selectedTime)
                    }
                  >
                    Modifier l&apos;heure
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl text-red-400 border-red-500/70 hover:bg-red-500/10"
                    disabled={busyAction}
                    onClick={() => cancel(currentModalDay.date)}
                  >
                    Annuler le rendez-vous
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl"
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
                  <p className="text-xs text-slate-400">
                    Rendez-vous du{" "}
                    <span className="font-medium">
                      {currentModalDay.day}/{month.monthIndex + 1}/
                      {month.year}
                    </span>{" "}
                    à{" "}
                    <span className="font-medium">
                      {localTimes[currentModalDay.date] ?? "—"}
                    </span>
                    .
                  </p>
                </div>
                <p className="text-xs text-slate-400">
                  Ici on affichera le compte-rendu, les photos avant / après et
                  votre avis sur la prestation. Pour l&apos;instant, aucun
                  contenu n&apos;a encore été enregistré pour ce jour.
                </p>
                <div className="flex justify-end pt-2">
                  <Button
                    variant="outline"
                    className="rounded-xl"
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

      {/* Petit toast en bas */}
      {toast && (
        <div className="fixed bottom-4 inset-x-0 flex justify-center z-40">
          <div className="max-w-xs rounded-full bg-slate-900/95 border border-slate-700 px-3 py-2 text-xs text-slate-100 shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
