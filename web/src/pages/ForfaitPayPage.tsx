import * as React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type ForfaitStatus = "pending" | "paid" | "failed" | "expired" | "cancelled" | "refunded";

type ForfaitOrder = {
  reference: string;
  forfaitKey: string;
  forfaitLabel: string;
  amountCents: number;
  currency: string;
  status: ForfaitStatus;
  partnerLabel: string | null;
  paidAt: number | null;
  tagline: string | null;
  features: string[];
};

type ForfaitApiResponse = {
  ok: boolean;
  paymentsReady: boolean;
  order: ForfaitOrder;
};

function formatMoneyCents(amountCents: number, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format((amountCents || 0) / 100);
}

function formatPaidAt(unix: number | null) {
  if (!unix) return "";
  return new Date(unix * 1000).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function ForfaitPayPage() {
  const { reference } = useParams();
  const [searchParams] = useSearchParams();
  const justPaid = searchParams.get("paid") === "1";

  const [order, setOrder] = React.useState<ForfaitOrder | null>(null);
  const [paymentsReady, setPaymentsReady] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [fatalError, setFatalError] = React.useState<"not_found" | "network" | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [paying, setPaying] = React.useState(false);
  const syncAttemptsRef = React.useRef(0);

  const load = React.useCallback(
    async (sync: boolean) => {
      if (!reference) return;
      try {
        const url = new URL(
          `/api/payments/forfait/${encodeURIComponent(reference)}`,
          window.location.origin,
        );
        if (sync) url.searchParams.set("sync", "1");

        const response = await fetch(url.toString());
        if (response.status === 404) {
          setFatalError("not_found");
          return;
        }
        const json = (await response.json()) as ForfaitApiResponse;
        if (!json.ok) {
          setFatalError("network");
          return;
        }
        setOrder(json.order);
        setPaymentsReady(Boolean(json.paymentsReady));
        setFatalError(null);
      } catch {
        setFatalError("network");
      } finally {
        setLoading(false);
      }
    },
    [reference],
  );

  React.useEffect(() => {
    void load(justPaid);
  }, [load, justPaid]);

  // Au retour de SumUp, le webhook peut avoir un leger retard: on resynchronise
  // quelques fois tant que le statut reste "en attente".
  React.useEffect(() => {
    if (!justPaid || !order || order.status !== "pending") return;
    if (syncAttemptsRef.current >= 5) return;
    const timeout = window.setTimeout(() => {
      syncAttemptsRef.current += 1;
      void load(true);
    }, 3000);
    return () => window.clearTimeout(timeout);
  }, [justPaid, order, load]);

  async function handlePay() {
    if (!reference || paying) return;
    setPaying(true);
    setActionError(null);
    try {
      const response = await fetch(
        `/api/payments/forfait/${encodeURIComponent(reference)}/checkout`,
        { method: "POST" },
      );
      const json = await response.json();
      if (json.ok && json.hostedCheckoutUrl) {
        window.location.href = json.hostedCheckoutUrl as string;
        return;
      }
      if (json.alreadyPaid) {
        void load(true);
        return;
      }
      if (json.error === "sumup_not_ready") {
        setActionError("Le paiement en ligne n'est pas encore disponible. Contactez l'agence.");
      } else {
        setActionError("Impossible d'ouvrir le paiement pour le moment. Reessayez.");
      }
    } catch {
      setActionError("Erreur reseau pendant l'ouverture du paiement.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-10 md:py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-7rem] top-16 h-72 w-72 rounded-full bg-[#e8c98a]/12 blur-3xl" />
        <div className="absolute bottom-0 right-[-6rem] h-80 w-80 rounded-full bg-[#d99a4e]/10 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-xl space-y-5">
        <header className="flex items-center gap-3">
          <img alt="Bryan Cars" className="h-10 w-auto opacity-90" src="/bryan-cars-logo.png" />
          <div>
            <p className="bb-eyebrow">Paiement securise</p>
            <p className="text-sm text-white/60">Bryan Cars</p>
          </div>
        </header>

        {loading && (
          <article className="bb-surface flex items-center justify-center gap-3 p-10 text-white/70">
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement du forfait...
          </article>
        )}

        {!loading && fatalError === "not_found" && (
          <article className="bb-surface-strong p-8 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-[#ff7d89]" />
            <h1 className="bb-title-xl mt-4 text-2xl">Lien introuvable</h1>
            <p className="mt-3 text-sm leading-6 text-white/62">
              Ce lien de paiement n'existe pas ou n'est plus validé. Demandez un nouveau lien a
              l'agence qui vous l'a transmis.
            </p>
          </article>
        )}

        {!loading && fatalError === "network" && (
          <article className="bb-surface-strong p-8 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-[#ff7d89]" />
            <h1 className="bb-title-xl mt-4 text-2xl">Une erreur est survenue</h1>
            <p className="mt-3 text-sm leading-6 text-white/62">
              Impossible de charger ce forfait pour le moment. Rafraichissez la page dans un
              instant.
            </p>
          </article>
        )}

        {!loading && order && !fatalError && (
          <>
            {order.status === "paid" ? (
              <article className="bb-surface-strong bb-gold-frame p-8 text-center">
                <div className="mx-auto inline-flex rounded-full border border-[#43d79d]/30 bg-[#43d79d]/10 p-4">
                  <CheckCircle2 className="h-10 w-10 text-[#43d79d]" />
                </div>
                <h1 className="bb-title-xl mt-5 text-2xl">Paiement confirmé</h1>
                <p className="mt-3 text-sm leading-6 text-white/62">
                  Votre forfait <span className="font-semibold text-white">{order.forfaitLabel}</span>{" "}
                  est regle{order.paidAt ? ` (${formatPaidAt(order.paidAt)})` : ""}. L'agence et
                  Bryan Cars en sont informes.
                </p>
                <div className="mt-6 rounded-[20px] border border-white/10 bg-white/[0.03] p-4 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">{order.forfaitLabel}</span>
                    <span className="text-lg font-semibold text-white">
                      {formatMoneyCents(order.amountCents, order.currency)}
                    </span>
                  </div>
                </div>
              </article>
            ) : (
              <article className="bb-surface-strong bb-gold-frame overflow-hidden p-6 md:p-7">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bb-pill border-[#e8c98a]/30 bg-[#e8c98a]/10 text-white">
                    <Sparkles className="h-3.5 w-3.5 text-[#e8c98a]" />
                    Forfait esthetique
                  </span>
                  {order.partnerLabel && (
                    <span className="bb-pill border-white/12 bg-white/[0.04] text-white/72">
                      via {order.partnerLabel}
                    </span>
                  )}
                </div>

                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <h1 className="bb-title-xl text-3xl">{order.forfaitLabel}</h1>
                    {order.tagline && (
                      <p className="mt-1 text-sm text-white/60">{order.tagline}</p>
                    )}
                  </div>
                  <p className="bb-text-gold shrink-0 text-3xl font-semibold">
                    {formatMoneyCents(order.amountCents, order.currency)}
                  </p>
                </div>

                {order.features.length > 0 && (
                  <ul className="mt-6 space-y-2">
                    {order.features.map((feature) => (
                      <li className="flex items-start gap-3 text-sm text-white/78" key={feature}>
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#e8c98a]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}

                {(order.status === "failed" || order.status === "expired") && (
                  <p className="mt-6 rounded-2xl border border-[#ff7d89]/25 bg-[#ff7d89]/10 p-3 text-sm text-[#ffb3ba]">
                    Le paiement précédent n'a pas abouti. Vous pouvez reessayer ci-dessous.
                  </p>
                )}

                {justPaid && order.status === "pending" && (
                  <p className="mt-6 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white/70">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Validation du paiement en cours...
                  </p>
                )}

                <button
                  className="bb-button-brand mt-7 w-full justify-center py-3 text-base disabled:opacity-60"
                  disabled={paying || !paymentsReady}
                  onClick={() => void handlePay()}
                  type="button"
                >
                  {paying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ouverture du paiement...
                    </>
                  ) : (
                    <>Payer {formatMoneyCents(order.amountCents, order.currency)}</>
                  )}
                </button>

                {!paymentsReady && (
                  <p className="mt-3 text-center text-xs text-white/50">
                    Paiement en ligne momentanement indisponible.
                  </p>
                )}
                {actionError && (
                  <p className="mt-3 text-center text-sm text-[#ffb3ba]">{actionError}</p>
                )}

                <p className="mt-5 flex items-center justify-center gap-2 text-xs text-white/45">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Paiement securise par SumUp
                </p>
              </article>
            )}
          </>
        )}
      </main>
    </div>
  );
}
