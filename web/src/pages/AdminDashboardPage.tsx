// web/src/pages/AdminDashboardPage.tsx
import * as React from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Loader2,
  CalendarDays,
  Users,
  Phone,
  Mail,
  MoreVertical,
  Image as ImageIcon,
} from "lucide-react";

type AdminClient = {
  id: number;
  slug: string;
  cardCode: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null; // 👈 AJOUT
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  city: string | null;
  vehicleModel: string | null;
  vehiclePlate: string | null;
  formulaName: string | null;
  formulaTotal: number;
  formulaRemaining: number;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
};

type AdminAppointmentStatus = "requested" | "confirmed" | "done" | "cancelled";

type AdminAppointment = {
  id: number;
  clientId: number;
  date: string; // YYYY-MM-DD
  time: string | null;
  status: AdminAppointmentStatus;
  clientNote: string | null;
  adminNote: string | null;
  createdAt: number;
  updatedAt: number;
  clientName: string | null;
  vehicleModel: string | null;
  vehiclePlate: string | null;
};

type ClientDetailResponse = {
  ok: boolean;
  client: AdminClient;
  appointments: AdminAppointment[];
};

type ListClientsResponse = {
  ok: boolean;
  clients: AdminClient[];
};

type ListAppointmentsResponse = {
  ok: boolean;
  appointments: AdminAppointment[];
};

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(time: string | null) {
  if (!time) return "—";
  return time.slice(0, 5);
}

function statusLabel(status: AdminAppointmentStatus) {
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

function statusClasses(status: AdminAppointmentStatus) {
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

function normalizePhoneForTel(phone: string) {
  return phone.replace(/\s+/g, "");
}

export function AdminDashboardPage() {
  const [clients, setClients] = React.useState<AdminClient[]>([]);
  const [clientsLoading, setClientsLoading] = React.useState(true);
  const [clientsError, setClientsError] = React.useState<string | null>(null);

  const [selectedClientId, setSelectedClientId] = React.useState<number | null>(
    null
  );
  const [selectedClient, setSelectedClient] =
    React.useState<ClientDetailResponse | null>(null);
  const [clientLoading, setClientLoading] = React.useState(false);

  const [globalAppointments, setGlobalAppointments] = React.useState<
    AdminAppointment[]
  >([]);
  const [globalApptsLoading, setGlobalApptsLoading] = React.useState(true);

  const [busyAction, setBusyAction] = React.useState(false);
  const [busyFormula, setBusyFormula] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const [filterClientQuery, setFilterClientQuery] = React.useState("");
  const [noteDrafts, setNoteDrafts] = React.useState<Record<number, string>>(
    {}
  );

  // Modal création / édition de profil
  const [profileModalOpen, setProfileModalOpen] = React.useState(false);
  const [profileMode, setProfileMode] = React.useState<"edit" | "new">("edit");
  const [profileSubmitting, setProfileSubmitting] = React.useState(false);
  const [profileDraft, setProfileDraft] = React.useState<{
    firstName: string;
    lastName: string;
    company: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    postalCode: string;
    city: string;
    vehicleModel: string;
    vehiclePlate: string;
    formulaName: string;
    formulaTotal: string;
    formulaRemaining: string;
    notes: string;
  } | null>(null);

  // Menu / édition formule
  const [formulaMenuOpen, setFormulaMenuOpen] = React.useState(false);
  const [formulaEditOpen, setFormulaEditOpen] = React.useState(false);
  const [formulaDraftTotal, setFormulaDraftTotal] = React.useState<number | null>(
    null
  );
  const [formulaDraftRemaining, setFormulaDraftRemaining] = React.useState<
    number | null
  >(null);

  // Quand on change de client sélectionné → on ferme les menus de formule
  React.useEffect(() => {
    setFormulaMenuOpen(false);
    setFormulaEditOpen(false);
  }, [selectedClientId]);

  // Load clients
  React.useEffect(() => {
    let active = true;

    async function load() {
      try {
        setClientsLoading(true);
        setClientsError(null);

        const res = await fetch("/api/admin/clients");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as ListClientsResponse;
        if (!json.ok) throw new Error("API not ok");
        if (!active) return;

        setClients(json.clients);
        if (json.clients.length > 0 && !selectedClientId) {
          setSelectedClientId(json.clients[0].id);
        }
      } catch (err) {
        if (active) setClientsError("Impossible de charger les clients.");
      } finally {
        if (active) setClientsLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  // Load global appointments
  React.useEffect(() => {
    let active = true;

    async function load() {
      try {
        setGlobalApptsLoading(true);
        const res = await fetch("/api/admin/appointments?limit=300");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as ListAppointmentsResponse;
        if (!json.ok) throw new Error("API not ok");
        if (!active) return;
        setGlobalAppointments(json.appointments);
      } catch (err) {
        if (active)
          console.error("Impossible de charger les rendez-vous globaux.");
      } finally {
        if (active) setGlobalApptsLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  // Load selected client detail
  React.useEffect(() => {
    if (!selectedClientId) return;

    let active = true;

    async function load() {
      try {
        setClientLoading(true);
        const res = await fetch(`/api/admin/clients/${selectedClientId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as ClientDetailResponse & {
          ok: boolean;
        };
        if (!json.ok) throw new Error("API not ok");
        if (!active) return;
        setSelectedClient(json);

        // init drafts for notes
        setNoteDrafts((prev) => {
          const next = { ...prev };
          json.appointments.forEach((a) => {
            if (next[a.id] === undefined) {
              next[a.id] = a.adminNote ?? "";
            }
          });
          return next;
        });
      } catch (err) {
        if (active)
          console.error("Impossible de charger les détails du client.");
      } finally {
        if (active) setClientLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [selectedClientId]);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  }

  // Actions admin — RDV

  async function changeStatus(
    appointmentId: number,
    status: AdminAppointmentStatus
  ) {
    setBusyAction(true);

    // Optimistic update local state
    setSelectedClient((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        appointments: prev.appointments.map((a) =>
          a.id === appointmentId ? { ...a, status } : a
        ),
      };
    });

    setGlobalAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status } : a))
    );

    try {
      const res = await fetch(
        `/api/admin/appointments/${appointmentId}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      const json = await res.json();
      if (!res.ok || !json.ok) {
        showToast("Erreur lors de la mise à jour du statut.");
      } else {
        showToast("Statut mis à jour.");
      }
    } catch {
      showToast("Erreur réseau lors de la mise à jour.");
    } finally {
      setBusyAction(false);
    }
  }

  async function saveAdminNote(appointmentId: number) {
    const note = noteDrafts[appointmentId] ?? "";

    setBusyAction(true);

    try {
      const res = await fetch(
        `/api/admin/appointments/${appointmentId}/admin-note`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminNote: note }),
        }
      );
      const json = await res.json();
      if (!res.ok || !json.ok) {
        showToast("Erreur lors de l'enregistrement de la note.");
      } else {
        showToast("Note enregistrée.");
        const updated: AdminAppointment | undefined = json.appointment;

        if (updated) {
          setSelectedClient((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              appointments: prev.appointments.map((a) =>
                a.id === appointmentId ? updated : a
              ),
            };
          });

          setGlobalAppointments((prev) =>
            prev.map((a) => (a.id === appointmentId ? updated : a))
          );
        }
      }
    } catch {
      showToast("Erreur réseau lors de l'enregistrement de la note.");
    } finally {
      setBusyAction(false);
    }
  }

  // Actions admin — formule

  async function updateFormula(mode: "reset" | "empty" | "custom") {
    const client = selectedClient?.client;
    if (!client) return;

    let newTotal = client.formulaTotal;
    let newRemaining = client.formulaRemaining;

    if (mode === "custom") {
      const t =
        formulaDraftTotal != null ? Math.max(0, Math.floor(formulaDraftTotal)) : client.formulaTotal;
      const r =
        formulaDraftRemaining != null
          ? Math.max(0, Math.floor(formulaDraftRemaining))
          : client.formulaRemaining;

      newTotal = t;
      newRemaining = Math.min(r, t);
    } else if (mode === "reset") {
      newRemaining = client.formulaTotal;
    } else if (mode === "empty") {
      newRemaining = 0;
    }

    setBusyFormula(true);
    try {
      const payload: any = { mode };
      if (mode === "custom") {
        payload.total = newTotal;
        payload.remaining = newRemaining;
      }

      const res = await fetch(`/api/admin/clients/${client.id}/formula`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let ok = res.ok;
      try {
        const json = await res.json();
        if (json && json.ok === false) ok = false;
      } catch {
        // pas grave, on fait juste confiance au status HTTP
      }

      if (!ok) {
        showToast("Erreur lors de la mise à jour de la formule.");
        return;
      }

      // Mise à jour optimiste locale
      setSelectedClient((prev) => {
        if (!prev) return prev;
        if (prev.client.id !== client.id) return prev;
        return {
          ...prev,
          client: {
            ...prev.client,
            formulaTotal: newTotal,
            formulaRemaining: newRemaining,
          },
        };
      });

      setClients((prev) =>
        prev.map((c) =>
          c.id === client.id
            ? { ...c, formulaTotal: newTotal, formulaRemaining: newRemaining }
            : c
        )
      );

      showToast("Formule mise à jour.");
      setFormulaMenuOpen(false);
      setFormulaEditOpen(false);
    } catch {
      showToast("Erreur réseau lors de la mise à jour de la formule.");
    } finally {
      setBusyFormula(false);
    }
  }

  function openFormulaEdit() {
    const client = selectedClient?.client;
    if (!client) return;
    setFormulaDraftTotal(client.formulaTotal);
    setFormulaDraftRemaining(client.formulaRemaining);
    setFormulaEditOpen(true);
    setFormulaMenuOpen(false);
  }

  // ─────────────────────────────────────────────
  // Actions profil client (modal)
  // ─────────────────────────────────────────────

  function openCreateProfile() {
    setProfileMode("new");
    setProfileDraft({
      firstName: "",
      lastName: "",
      company: "",
      email: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      postalCode: "",
      city: "",
      vehicleModel: "",
      vehiclePlate: "",
      formulaName: "",
      formulaTotal: "",
      formulaRemaining: "",
      notes: "",
    });
    setProfileModalOpen(true);
  }

  function openEditProfile() {
    const c = selectedClientData;
    if (!c) return;
    setProfileMode("edit");
    setProfileDraft({
      firstName: c.firstName ?? "",
      lastName: c.lastName ?? "",
      company: (c as any).company ?? "", // company est maintenant dans AdminClient
      email: c.email ?? "",
      phone: c.phone ?? "",
      addressLine1: c.addressLine1 ?? "",
      addressLine2: c.addressLine2 ?? "",
      postalCode: c.postalCode ?? "",
      city: c.city ?? "",
      vehicleModel: c.vehicleModel ?? "",
      vehiclePlate: c.vehiclePlate ?? "",
      formulaName: c.formulaName ?? "",
      formulaTotal:
        c.formulaTotal != null ? String(c.formulaTotal) : "",
      formulaRemaining:
        c.formulaRemaining != null ? String(c.formulaRemaining) : "",
      notes: c.notes ?? "",
    });
    setProfileModalOpen(true);
  }

  function updateProfileDraft(field: keyof NonNullable<typeof profileDraft>, value: string) {
    setProfileDraft((prev) =>
      prev ? { ...prev, [field]: value } : prev
    );
  }

  async function submitProfile() {
    if (!profileDraft) return;

    try {
      setProfileSubmitting(true);

      const body: any = {
        firstName: profileDraft.firstName || null,
        lastName: profileDraft.lastName || null,
        company: profileDraft.company || null,
        email: profileDraft.email || null,
        phone: profileDraft.phone || null,
        addressLine1: profileDraft.addressLine1 || null,
        addressLine2: profileDraft.addressLine2 || null,
        postalCode: profileDraft.postalCode || null,
        city: profileDraft.city || null,
        vehicleModel: profileDraft.vehicleModel || null,
        vehiclePlate: profileDraft.vehiclePlate || null,
        formulaName: profileDraft.formulaName || null,
        notes: profileDraft.notes || null,
      };

      const ft = profileDraft.formulaTotal.trim();
      const fr = profileDraft.formulaRemaining.trim();
      if (ft !== "") body.formulaTotal = Number(ft);
      if (fr !== "") body.formulaRemaining = Number(fr);

      let url: string;
      if (profileMode === "new") {
        url = "/api/admin/clients";
      } else {
        const c = selectedClientData;
        if (!c) {
          showToast("Aucun client sélectionné.");
          return;
        }
        url = `/api/admin/clients/${c.id}/profile`;
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        showToast("Erreur lors de l'enregistrement du profil.");
        return;
      }

      const updated: AdminClient = json.client;

      if (profileMode === "new") {
        // On ajoute le client et on le sélectionne
        setClients((prev) => [...prev, updated]);
        setSelectedClientId(updated.id);
        setSelectedClient({
          ok: true,
          client: updated,
          appointments: [],
        });
        showToast("Nouveau client créé.");
      } else {
        // Mise à jour d'un client existant
        setClients((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
        setSelectedClient((prev) =>
          prev ? { ...prev, client: updated } : prev
        );
        showToast("Profil mis à jour.");
      }

      setProfileModalOpen(false);
      setProfileDraft(null);
    } catch (err) {
      console.error("submitProfile error:", err);
      showToast("Erreur réseau lors de l'enregistrement du profil.");
    } finally {
      setProfileSubmitting(false);
    }
  }

  // Filtre clients côté front
  const filteredClients = clients.filter((c) => {
    if (!filterClientQuery.trim()) return true;
    const q = filterClientQuery.toLowerCase();
    return (
      (c.fullName || "").toLowerCase().includes(q) ||
      (c.vehicleModel || "").toLowerCase().includes(q) ||
      (c.vehiclePlate || "").toLowerCase().includes(q) ||
      (c.slug || "").toLowerCase().includes(q) ||
      (c.cardCode || "").toLowerCase().includes(q)
    );
  });

  const selectedClientData = selectedClient?.client ?? null;
  const selectedAppointments = selectedClient?.appointments ?? [];

  // Rendez-vous globaux triés chronologiquement (date + heure)
  const sortedGlobalAppointments = React.useMemo(() => {
    const copy = [...globalAppointments];
    copy.sort((a, b) => {
      const aKey = `${a.date ?? ""}T${a.time ?? "00:00"}`;
      const bKey = `${b.date ?? ""}T${b.time ?? "00:00"}`;
      return aKey.localeCompare(bKey);
    });
    return copy;
  }, [globalAppointments]);

  return (
    <div className="min-h-screen bg-black text-white flex justify-center px-3 py-6">
      <main className="w-full max-w-6xl space-y-5">
        {/* Header */}
        <Card className="rounded-3xl border border-white/10 bg-neutral-950/95 shadow-[0_20px_60px_rgba(0,0,0,0.85)]">
          <div className="p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center rounded-full border border-white/15 bg-black/80 px-3 py-1 text-[11px] font-medium tracking-[0.22em] text-neutral-300 uppercase">
                BlackBox · Admin
              </div>
              <div>
                <h1 className="text-xl font-semibold leading-tight tracking-tight text-white">
                  Tableau de bord detailing
                </h1>
                <p className="text-[13px] text-neutral-400 mt-1">
                  Suivi des cartes NFC, clients et planning de rendez-vous.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="h-9 px-4 text-[12px] rounded-full border-white/20 bg-black/80 hover:bg-white hover:text-black hover:border-white transition-colors"
                onClick={openCreateProfile}
              >
                Nouveau client
              </Button>
              <span className="text-[12px] text-neutral-400">
                {clients.length} client{clients.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </Card>


        {/* Layout principal */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,3fr)]">
        {/* Colonne gauche : liste clients */}
        <Card className="min-h-[260px] rounded-3xl border border-white/10 bg-neutral-950/95 shadow-[0_18px_50px_rgba(0,0,0,0.75)]">
        <div className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-black border border-white/10">
                <Users className="h-4 w-4 text-neutral-200" />
                </div>
                <div>
                <p className="text-sm font-semibold text-white">Clients</p>
                <p className="text-[11px] text-neutral-400">
                    Cartes, coordonnées et formules.
                </p>
                </div>
            </div>
            </div>

            <div>
            <input
                className="w-full rounded-2xl border border-white/15 bg-black px-3 py-2 text-[12px] text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-white/60"
                placeholder="Filtrer par nom, véhicule, plaque, slug, code carte…"
                value={filterClientQuery}
                onChange={(e) => setFilterClientQuery(e.target.value)}
            />
            </div>

            {clientsLoading && (
            <div className="flex justify-center py-8">
                <div className="flex items-center gap-2 text-[12px] text-neutral-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Chargement des clients…</span>
                </div>
            </div>
            )}

            {clientsError && !clientsLoading && (
            <p className="text-[12px] text-rose-400">{clientsError}</p>
            )}

            {!clientsLoading && filteredClients.length === 0 && (
            <p className="text-[12px] text-neutral-500">
                Aucun client ne correspond à ce filtre.
            </p>
            )}

            <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
            {filteredClients.map((c) => {
                const remainingLabel =
                c.formulaTotal > 0
                    ? `${c.formulaRemaining} / ${c.formulaTotal}`
                    : `${c.formulaRemaining}`;
                const isSelected = c.id === selectedClientId;

                return (
                <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedClientId(c.id)}
                    className={[
                    "w-full text-left rounded-2xl border px-3 py-2.5 text-[12px] transition flex flex-col gap-1",
                    isSelected
                        ? "border-white/60 bg-white/10"
                        : "border-white/10 bg-black/70 hover:border-white/40 hover:bg-black",
                    ].join(" ")}
                >
                    <div className="flex items-center justify-between gap-2">
                    <div className="font-medium truncate text-white">
                        {c.fullName ?? "Client sans nom"}
                    </div>
                    <div
                        className={
                        c.formulaRemaining > 0
                            ? "text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/50"
                            : "text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/50"
                        }
                    >
                        {remainingLabel}
                    </div>
                    </div>
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-neutral-400">
                    <span>
                        {(c.vehicleModel || "—") +
                        (c.vehiclePlate ? ` · ${c.vehiclePlate}` : "")}
                    </span>
                    <span className="text-neutral-500">
                        {c.slug}
                        {c.cardCode ? ` · ${c.cardCode}` : ""}
                    </span>
                    </div>
                </button>
                );
            })}
            </div>
        </div>
        </Card>

          {/* Colonne droite : détails client + rendez-vous */}
          <div className="space-y-4">
            {/* Détails client */}
            <Card className="min-h-[160px] relative z-20 rounded-3xl border border-white/10 bg-neutral-950/95 shadow-[0_18px_60px_rgba(0,0,0,0.8)]">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-black border border-white/10">
                      <CalendarDays className="h-4 w-4 text-neutral-200" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Détails client
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        Identité, contact, carte, véhicule et formule.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedClientData && (
                      <Button
                        variant="outline"
                        className="h-8 px-3.5 text-[12px] rounded-full border-white/20 bg-black/80 hover:bg-white hover:text-black hover:border-white transition-colors"
                        onClick={openEditProfile}
                      >
                        Modifier le profil
                      </Button>
                    )}
                    {clientLoading && (
                      <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                    )}
                  </div>
                </div>

                {!selectedClientData && (
                  <p className="text-[12px] text-neutral-500">
                    Sélectionne un client dans la liste pour voir les détails.
                  </p>
                )}

                {selectedClientData && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12px]">
                    {/* Bloc identité + contact */}
                    <div className="rounded-2xl border border-white/10 bg-black/60 p-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 pb-1 mb-1 border-b border-white/10">
                        <span className="text-[12px] font-semibold text-white">
                          Client
                        </span>
                      </div>

                      <div className="text-[15px] font-semibold text-white">
                        {selectedClientData.fullName ?? selectedClientData.slug}
                      </div>

                      <div className="flex items-center gap-1.5 text-neutral-200">
                        <span>{selectedClientData.phone ?? "—"}</span>
                        {selectedClientData.phone && (
                          <a
                            href={`tel:${normalizePhoneForTel(
                              selectedClientData.phone
                            )}`}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-black/80 hover:bg-white hover:text-black transition-colors"
                            title="Appeler"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-neutral-200">
                        <span className="truncate">
                          {selectedClientData.email ?? "—"}
                        </span>
                        {selectedClientData.email && (
                          <a
                            href={`mailto:${selectedClientData.email}`}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-black/80 hover:bg-white hover:text-black transition-colors"
                            title="Envoyer un mail"
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>

                      <div className="text-[12px] text-neutral-300">
                        {selectedClientData.company || "Aucune compagnie"}
                      </div>
                    </div>

                    {/* Bloc carte */}
                    <div className="rounded-2xl border border-white/10 bg-black/60 p-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 pb-1 mb-1 border-b border-white/10">
                        <span className="text-[12px] font-semibold text-white">
                          Carte / code
                        </span>
                      </div>
                      <div className="text-[14px] font-medium text-white">
                        {selectedClientData.cardCode ?? selectedClientData.slug}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Slug :{" "}
                        <span className="text-neutral-200">
                          {selectedClientData.slug}
                        </span>
                      </div>
                    </div>

                    {/* Bloc véhicule */}
                    <div className="rounded-2xl border border-white/10 bg-black/60 p-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 pb-1 mb-1 border-b border-white/10">
                        <span className="text-[12px] font-semibold text-white">
                          Véhicule
                        </span>
                      </div>
                      <div className="text-[14px] text-white">
                        {selectedClientData.vehicleModel ?? "Non renseigné"}
                        {selectedClientData.vehiclePlate
                          ? ` · ${selectedClientData.vehiclePlate}`
                          : ""}
                      </div>
                    </div>

                    {/* Bloc formule avec menu */}
                    <div className="rounded-2xl border border-white/10 bg-black/60 p-3 space-y-1.5 relative">
                      <div className="flex items-center justify-between gap-2 pb-1 mb-1 border-b border-white/10">
                        <span className="text-[12px] font-semibold text-white">
                          Formule
                        </span>
                        <button
                          type="button"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/80 hover:bg-white hover:text-black transition-colors"
                          onClick={() =>
                            setFormulaMenuOpen((open) => !open)
                          }
                          disabled={busyFormula}
                          title="Options formule"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="space-y-0.5">
                        <div className="text-[14px] text-white">
                          {selectedClientData.formulaName ?? "Aucune formule"}
                        </div>
                        <div className="text-[12px] text-neutral-300">
                          Nettoyages restants :{" "}
                          <span
                            className={
                              selectedClientData.formulaRemaining > 0
                                ? "text-emerald-300"
                                : "text-rose-300"
                            }
                          >
                            {selectedClientData.formulaTotal > 0
                              ? `${selectedClientData.formulaRemaining} / ${selectedClientData.formulaTotal}`
                              : selectedClientData.formulaRemaining}
                          </span>
                        </div>
                      </div>

                      {/* Menu rapide formule */}
                      {formulaMenuOpen && !formulaEditOpen && (
                        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/15 bg-black/95 p-2.5 text-[12px] shadow-2xl z-40">
                          <button
                            type="button"
                            className="w-full rounded-xl px-2.5 py-1.5 text-left hover:bg-white/5 text-neutral-100"
                            disabled={busyFormula}
                            onClick={() => updateFormula("reset")}
                          >
                            Remettre au max ({selectedClientData.formulaTotal})
                          </button>
                          <button
                            type="button"
                            className="mt-1 w-full rounded-xl px-2.5 py-1.5 text-left hover:bg-rose-950/40 text-rose-300"
                            disabled={busyFormula}
                            onClick={() => updateFormula("empty")}
                          >
                            Vider le forfait (0 restant)
                          </button>
                          <button
                            type="button"
                            className="mt-1 w-full rounded-xl px-2.5 py-1.5 text-left hover:bg-white/5 text-neutral-100"
                            disabled={busyFormula}
                            onClick={openFormulaEdit}
                          >
                            Modifier les valeurs…
                          </button>
                        </div>
                      )}

                      {/* Formulaire d'édition détaillée */}
                      {formulaEditOpen && (
                        <div className="mt-3 rounded-2xl border border-white/15 bg-black/95 p-3 space-y-2.5 text-[12px]">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-white">
                              Modifier la formule
                            </p>
                            <button
                              type="button"
                              className="text-neutral-400 hover:text-white text-[11px]"
                              onClick={() => setFormulaEditOpen(false)}
                              disabled={busyFormula}
                            >
                              Fermer
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <label className="space-y-1">
                              <span className="text-neutral-300 text-[11px]">
                                Max nettoyages
                              </span>
                              <input
                                type="number"
                                min={0}
                                className="w-full rounded-lg border border-white/15 bg-black px-2 py-1.5 text-[12px] text-white focus:outline-none focus:ring-1 focus:ring-white/60"
                                value={
                                  formulaDraftTotal ??
                                  selectedClientData.formulaTotal
                                }
                                onChange={(e) =>
                                  setFormulaDraftTotal(
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value)
                                  )
                                }
                              />
                            </label>
                            <label className="space-y-1">
                              <span className="text-neutral-300 text-[11px]">
                                Restants
                              </span>
                              <input
                                type="number"
                                min={0}
                                className="w-full rounded-lg border border-white/15 bg-black px-2 py-1.5 text-[12px] text-white focus:outline-none focus:ring-1 focus:ring-white/60"
                                value={
                                  formulaDraftRemaining ??
                                  selectedClientData.formulaRemaining
                                }
                                onChange={(e) =>
                                  setFormulaDraftRemaining(
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value)
                                  )
                                }
                              />
                            </label>
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <Button
                              variant="outline"
                              className="h-8 px-3 text-[12px] rounded-full border-white/20 bg-black hover:bg-white hover:text-black"
                              disabled={busyFormula}
                              onClick={() => setFormulaEditOpen(false)}
                            >
                              Annuler
                            </Button>
                          </div>
                          <div className="flex justify-end pt-1">
                            <Button
                              className="h-8 px-3 text-[12px] rounded-full bg-white text-black hover:bg-neutral-200"
                              disabled={busyFormula}
                              onClick={() => updateFormula("custom")}
                            >
                              Enregistrer
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Rendez-vous du client sélectionné */}
            <Card className="min-h-[220px] relative z-10 rounded-3xl border border-white/10 bg-neutral-950/95 shadow-[0_18px_50px_rgba(0,0,0,0.75)]">
            <div className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white">
                    Rendez-vous du client sélectionné
                </p>
                <span className="text-[11px] text-neutral-400">
                    {selectedAppointments.length} rdv
                </span>
                </div>

                {!selectedClientData && (
                <p className="text-[12px] text-neutral-500">
                    Sélectionne un client pour voir / gérer ses rendez-vous.
                </p>
                )}

                {selectedClientData && selectedAppointments.length === 0 && (
                <p className="text-[12px] text-neutral-500">
                    Aucun rendez-vous pour ce client pour le moment.
                </p>
                )}

                {selectedClientData && selectedAppointments.length > 0 && (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                    {selectedAppointments.map((a) => (
                    <div
                        key={a.id}
                        className="rounded-2xl border border-white/10 bg-black/70 px-3 py-2.5 text-[12px] space-y-2"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-0.5">
                            <div className="font-medium text-white">
                            {formatDate(a.date)}{" "}
                            {a.time && (
                                <span className="text-neutral-400">
                                · {formatTime(a.time)}
                                </span>
                            )}
                            </div>
                            {a.clientNote && (
                            <div className="text-[11px] text-neutral-400">
                                Note client : {a.clientNote}
                            </div>
                            )}
                        </div>

                        <div className="flex flex-col items-end gap-1">
                            <div
                            className={
                                "px-2 py-0.5 rounded-full text-[10px] " +
                                statusClasses(a.status)
                            }
                            >
                            {statusLabel(a.status)}
                            </div>
                            <div className="flex flex-wrap gap-1.5 justify-end">
                            {a.status === "requested" && (
                                <>
                                <Button
                                    variant="outline"
                                    className="h-7 px-2 text-[11px] rounded-full border-white/30 bg-black/80 hover:bg-white hover:text-black"
                                    disabled={busyAction}
                                    onClick={() => changeStatus(a.id, "confirmed")}
                                >
                                    Confirmer
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-7 px-2 text-[11px] rounded-full border-rose-500/70 text-rose-300 hover:bg-rose-500/15"
                                    disabled={busyAction}
                                    onClick={() => changeStatus(a.id, "cancelled")}
                                >
                                    Annuler
                                </Button>
                                </>
                            )}

                            {a.status === "confirmed" && (
                                <>
                                <Button
                                    className="h-7 px-2 text-[11px] rounded-full bg-white text-black hover:bg-neutral-200"
                                    disabled={busyAction}
                                    onClick={() => changeStatus(a.id, "done")}
                                >
                                    Marquer effectué
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-7 px-2 text-[11px] rounded-full border-rose-500/70 text-rose-300 hover:bg-rose-500/15"
                                    disabled={busyAction}
                                    onClick={() => changeStatus(a.id, "cancelled")}
                                >
                                    Annuler
                                </Button>
                                </>
                            )}

                            {a.status === "done" && (
                                <Button
                                variant="outline"
                                className="h-7 px-2 text-[11px] rounded-full border-white/30 bg-black/80 hover:bg-white hover:text-black"
                                disabled={busyAction}
                                onClick={() => changeStatus(a.id, "confirmed")}
                                >
                                Repasser en confirmé
                                </Button>
                            )}
                            </div>
                        </div>
                        </div>

                        {/* Note admin */}
                        <div className="space-y-1">
                        <div className="text-[11px] font-semibold text-white">
                            Compte-rendu / note interne
                        </div>
                        <textarea
                            rows={2}
                            className="w-full rounded-xl border border-white/15 bg-black px-2 py-1.5 text-[12px] text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-white/60"
                            placeholder="Ex : lavage complet extérieur + protection céramique, client très satisfait…"
                            value={noteDrafts[a.id] ?? a.adminNote ?? ""}
                            onChange={(e) =>
                            setNoteDrafts((prev) => ({
                                ...prev,
                                [a.id]: e.target.value,
                            }))
                            }
                        />
                        <div className="flex justify-end">
                            <Button
                            variant="outline"
                            className="h-7 px-3 text-[11px] rounded-full border-white/30 bg-black/80 hover:bg-white hover:text-black"
                            disabled={busyAction}
                            onClick={() => saveAdminNote(a.id)}
                            >
                            Enregistrer
                            </Button>
                        </div>
                        </div>

                        {/* Bloc photos (structure pour plus tard) */}
                        <div className="border-t border-white/10 pt-2 mt-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                            <ImageIcon className="h-3.5 w-3.5 text-neutral-300" />
                            <span className="text-[11px] font-semibold text-white">
                                Photos du véhicule
                            </span>
                            </div>
                            <Button
                            variant="outline"
                            className="h-7 px-2 text-[11px] rounded-full border-white/20 text-neutral-300 bg-black/60"
                            disabled
                            >
                            Ajouter une photo (bientôt)
                            </Button>
                        </div>
                        <p className="text-[11px] text-neutral-500">
                            Le module d&apos;upload et de consultation des photos sera ajouté
                            ici.
                        </p>
                        </div>
                    </div>
                    ))}
                </div>
                )}
            </div>
            </Card>
          </div>
        </div>

            {/* Rendez-vous globaux sur toute la largeur */}
            <Card className="rounded-3xl border border-white/10 bg-neutral-950/95 shadow-[0_18px_50px_rgba(0,0,0,0.75)]">
            <div className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white">
                    Tous les rendez-vous (ordre chronologique)
                </p>
                <span className="text-[11px] text-neutral-400">
                    {sortedGlobalAppointments.length} affichés
                </span>
                </div>

                {globalApptsLoading && (
                <div className="flex justify-center py-6">
                    <div className="flex items-center gap-2 text-[12px] text-neutral-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Chargement des rendez-vous…</span>
                    </div>
                </div>
                )}

                {!globalApptsLoading && sortedGlobalAppointments.length === 0 && (
                <p className="text-[12px] text-neutral-500">
                    Aucun rendez-vous enregistré pour le moment.
                </p>
                )}

                {!globalApptsLoading && sortedGlobalAppointments.length > 0 && (
                <div className="space-y-1 max-h-[260px] overflow-y-auto pr-1 text-[12px]">
                    {sortedGlobalAppointments.map((a) => (
                    <div
                        key={a.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/70 px-3 py-2"
                    >
                        <div className="space-y-0.5">
                        <div className="font-medium text-white">
                            {formatDate(a.date)}{" "}
                            {a.time && (
                            <span className="text-neutral-400">
                                · {formatTime(a.time)}
                            </span>
                            )}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                            {a.clientName ?? "Client ?"}{" "}
                            {a.vehicleModel && (
                            <>
                                · {a.vehicleModel}
                                {a.vehiclePlate ? ` (${a.vehiclePlate})` : ""}
                            </>
                            )}
                        </div>
                        </div>

                        <div className="flex items-center gap-2">
                        <div
                            className={
                            "px-2 py-0.5 rounded-full text-[10px] " +
                            statusClasses(a.status)
                            }
                        >
                            {statusLabel(a.status)}
                        </div>
                        <Button
                            variant="outline"
                            className="h-7 px-2 text-[11px] rounded-full border-white/30 bg-black/80 hover:bg-white hover:text-black"
                            onClick={() => {
                            setSelectedClientId(a.clientId);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                        >
                            Voir client
                        </Button>
                        </div>
                    </div>
                    ))}
                </div>
                )}
            </div>
            </Card>

        {/* Modal profil client (création / édition) */}
        {profileModalOpen && profileDraft && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-3">
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-black/95 px-4 py-3 shadow-[0_24px_80px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {profileMode === "new"
                      ? "Nouveau client"
                      : "Modifier le profil"}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Nom, contact, véhicule, formule…
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="h-7 px-3 text-[11px] rounded-full"
                  onClick={() => {
                    setProfileModalOpen(false);
                    setProfileDraft(null);
                  }}
                  disabled={profileSubmitting}
                >
                  Fermer
                </Button>
              </div>

              {profileMode === "new" && (
                <div className="mb-2 text-[11px] text-white0">
                  Le code carte sera généré automatiquement (BBX-00X) et ne
                  pourra pas être modifié.
                </div>
              )}

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1.5 text-[12px] scrollbar-thin scrollbar-thumb-slate-700/70 scrollbar-track-transparent">
                {/* Identité */}
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="space-y-1">
                    <span className="text-neutral-400 text-[11px]">
                      Prénom
                    </span>
                    <input
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2 py-1.5 text-[12px] text-neutral-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      value={profileDraft.firstName}
                      onChange={(e) =>
                        updateProfileDraft("firstName", e.target.value)
                      }
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-neutral-400 text-[11px]">
                      Nom
                    </span>
                    <input
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2 py-1.5 text-[12px] text-neutral-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      value={profileDraft.lastName}
                      onChange={(e) =>
                        updateProfileDraft("lastName", e.target.value)
                      }
                    />
                  </label>
                </div>

                <label className="space-y-1">
                  <span className="text-neutral-400 text-[11px]">
                    Compagnie (optionnel)
                  </span>
                  <input
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2 py-1.5 text-[12px] text-neutral-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    value={profileDraft.company}
                    onChange={(e) =>
                      updateProfileDraft("company", e.target.value)
                    }
                  />
                </label>

                {/* Contact */}
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="space-y-1">
                    <span className="text-neutral-400 text-[11px]">
                      Téléphone
                    </span>
                    <input
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2 py-1.5 text-[12px] text-neutral-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      value={profileDraft.phone}
                      onChange={(e) =>
                        updateProfileDraft("phone", e.target.value)
                      }
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-neutral-400 text-[11px]">
                      Email
                    </span>
                    <input
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2 py-1.5 text-[12px] text-neutral-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      value={profileDraft.email}
                      onChange={(e) =>
                        updateProfileDraft("email", e.target.value)
                      }
                    />
                  </label>
                </div>

                {/* Adresse */}
                <label className="space-y-1">
                  <span className="text-neutral-400 text-[11px]">
                    Adresse
                  </span>
                  <input
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2 py-1.5 text-[12px] text-neutral-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    value={profileDraft.addressLine1}
                    onChange={(e) =>
                      updateProfileDraft("addressLine1", e.target.value)
                    }
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-neutral-400 text-[11px]">
                    Complément
                  </span>
                  <input
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2 py-1.5 text-[12px] text-neutral-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    value={profileDraft.addressLine2}
                    onChange={(e) =>
                      updateProfileDraft("addressLine2", e.target.value)
                    }
                  />
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="space-y-1">
                    <span className="text-neutral-400 text-[11px]">
                      Code postal
                    </span>
                    <input
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2 py-1.5 text-[12px] text-neutral-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      value={profileDraft.postalCode}
                      onChange={(e) =>
                        updateProfileDraft("postalCode", e.target.value)
                      }
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-neutral-400 text-[11px]">
                      Ville
                    </span>
                    <input
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2 py-1.5 text-[12px] text-neutral-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      value={profileDraft.city}
                      onChange={(e) =>
                        updateProfileDraft("city", e.target.value)
                      }
                    />
                  </label>
                </div>

                {/* Véhicule */}
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="space-y-1">
                    <span className="text-neutral-400 text-[11px]">
                      Véhicule
                    </span>
                    <input
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2 py-1.5 text-[12px] text-neutral-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      value={profileDraft.vehicleModel}
                      onChange={(e) =>
                        updateProfileDraft("vehicleModel", e.target.value)
                      }
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-neutral-400 text-[11px]">
                      Plaque
                    </span>
                    <input
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2 py-1.5 text-[12px] text-neutral-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      value={profileDraft.vehiclePlate}
                      onChange={(e) =>
                        updateProfileDraft("vehiclePlate", e.target.value)
                      }
                    />
                  </label>
                </div>

                {/* Formule (optionnel) */}
                <label className="space-y-1">
                  <span className="text-neutral-400 text-[11px]">
                    Nom de la formule
                  </span>
                  <input
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2 py-1.5 text-[12px] text-neutral-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    value={profileDraft.formulaName}
                    onChange={(e) =>
                      updateProfileDraft("formulaName", e.target.value)
                    }
                  />
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="space-y-1">
                    <span className="text-neutral-400 text-[11px]">
                      Max nettoyages
                    </span>
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2 py-1.5 text-[12px] text-neutral-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      value={profileDraft.formulaTotal}
                      onChange={(e) =>
                        updateProfileDraft("formulaTotal", e.target.value)
                      }
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-neutral-400 text-[11px]">
                      Restants
                    </span>
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2 py-1.5 text-[12px] text-neutral-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      value={profileDraft.formulaRemaining}
                      onChange={(e) =>
                        updateProfileDraft(
                          "formulaRemaining",
                          e.target.value
                        )
                      }
                    />
                  </label>
                </div>

                {/* Notes */}
                <label className="space-y-1">
                  <span className="text-neutral-400 text-[11px]">
                    Notes internes
                  </span>
                  <textarea
                    rows={3}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2 py-1.5 text-[12px] text-neutral-200 placeholder:text-white0 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    value={profileDraft.notes}
                    onChange={(e) =>
                      updateProfileDraft("notes", e.target.value)
                    }
                  />
                </label>
              </div>

              <div className="mt-3 flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="h-8 px-3 text-[12px] rounded-full"
                  onClick={() => {
                    setProfileModalOpen(false);
                    setProfileDraft(null);
                  }}
                  disabled={profileSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  className="h-8 px-3 text-[12px] rounded-full"
                  onClick={submitProfile}
                  disabled={profileSubmitting}
                >
                  {profileMode === "new"
                    ? "Créer le client"
                    : "Enregistrer"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-4 inset-x-0 flex justify-center z-40">
            <div className="max-w-xs rounded-full bg-slate-950/95 border border-slate-700 px-3.5 py-2 text-[12px] text-neutral-200 shadow-lg">
              {toast}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
