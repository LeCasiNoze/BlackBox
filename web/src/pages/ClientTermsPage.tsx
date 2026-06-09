import * as React from "react";
import { ArrowLeft, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";

import { cn, formatUnixDateTimeFR } from "../lib/portal";
import {
  TERMS_ACCEPTANCE_LABEL,
  TERMS_HIGHLIGHTS,
  TERMS_SECTIONS,
  TERMS_UPDATED_LABEL,
} from "../lib/terms";

const SUMUP_TOPUP_URL =
  import.meta.env.VITE_SUMUP_TOPUP_URL || "https://www.sumupbookings.com/bryan-cars";

type TermsClient = {
  id: number;
  slug: string;
  fullName: string | null;
  formulaName: string | null;
  termsAcceptedAt: number | null;
};

type TermsResponse = {
  ok: boolean;
  client: TermsClient;
};

export function ClientTermsPage() {
  const params = useParams<{ slug?: string }>();
  const location = useLocation();

  const slug = params.slug || "card01";
  const query = React.useMemo(() => new URLSearchParams(location.search), [location.search]);
  const returnTo = query.get("back") || `/card/${encodeURIComponent(slug)}`;
  const intent = query.get("intent");

  const [client, setClient] = React.useState<TermsClient | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [accepted, setAccepted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [checkboxAttention, setCheckboxAttention] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/client/${encodeURIComponent(slug)}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const json = (await response.json()) as TermsResponse;
        if (!json.ok) throw new Error("invalid_payload");
        if (!active) return;

        setClient(json.client);
      } catch (loadError) {
        if (active) {
          setError("Impossible de charger les conditions pour cette carte.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [slug]);

  React.useEffect(() => {
    if (!checkboxAttention) return undefined;

    const timeout = window.setTimeout(() => {
      setCheckboxAttention(false);
    }, 1300);

    return () => window.clearTimeout(timeout);
  }, [checkboxAttention]);

  const alreadyAccepted = !!client?.termsAcceptedAt;

  React.useEffect(() => {
    if (alreadyAccepted || !intent) return undefined;

    const timeout = window.setTimeout(() => {
      setCheckboxAttention(true);
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [alreadyAccepted, intent]);

  function drawCheckboxAttention() {
    setCheckboxAttention(false);
    window.requestAnimationFrame(() => {
      setCheckboxAttention(true);
    });
  }

  async function acceptTerms() {
    if (!client) return;
    if (!accepted) {
      drawCheckboxAttention();
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/client/${encodeURIComponent(slug)}/terms/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const json = (await response.json()) as TermsResponse;
      if (!response.ok || !json.ok) {
        setError("Impossible d'enregistrer votre acceptation.");
        return;
      }

      setClient(json.client);
      setAccepted(true);

      if (intent === "topup") {
        window.open(SUMUP_TOPUP_URL, "_blank", "noopener,noreferrer");
      }
    } catch (saveError) {
      setError("Erreur reseau pendant l'acceptation.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="bb-shell">
        <div className="bb-content flex min-h-[70vh] items-center justify-center">
          <div className="bb-surface flex items-center gap-3 px-6 py-4 text-sm text-white/70">
            <Loader2 className="h-4 w-4 animate-spin text-[#f7b955]" />
            Chargement des conditions...
          </div>
        </div>
      </div>
    );
  }

  if (!client || error) {
    return (
      <div className="bb-shell">
        <div className="bb-content py-10">
          <div className="rounded-[28px] border border-rose-300/20 bg-rose-300/10 p-6 text-white">
            <p className="text-lg font-semibold">Conditions indisponibles</p>
            <p className="mt-2 text-sm text-white/75">
              {error || "Cette carte client n'a pas pu etre retrouvee."}
            </p>
            <Link className="bb-button-ghost mt-5" to={returnTo}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour a la carte
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bb-shell">
      <main className="bb-content space-y-6 py-8 md:py-10">
        <section className="bb-surface-strong overflow-hidden p-6 md:p-8">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-3">
              <Link className="bb-button-ghost" to={returnTo}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour a ma carte
              </Link>
              <div className="bb-pill border-white/12 bg-white/[0.04] text-white/75">
                <ShieldCheck className="h-3.5 w-3.5 text-[#f7b955]" />
                Conditions & reglement
              </div>
            </div>

            <div className="max-w-4xl">
              <p className="bb-eyebrow">Document client</p>
              <h1 className="bb-title mt-3">Conditions d'utilisation Bryan Cars</h1>
              <p className="bb-subtitle mt-3 max-w-3xl">
                Retrouvez ici les regles de fonctionnement de votre formule, du
                planning et du suivi apres prestation. Version mise a jour le {TERMS_UPDATED_LABEL}.
              </p>
            </div>

            <div
              className={cn(
                "rounded-[28px] border p-5",
                alreadyAccepted
                  ? "border-emerald-300/25 bg-emerald-300/10"
                  : "border-amber-300/25 bg-amber-300/10",
              )}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                    Statut d'acceptation
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {alreadyAccepted ? "Conditions deja acceptees" : "Acceptation requise"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    {alreadyAccepted
                      ? `Enregistree le ${formatUnixDateTimeFR(client.termsAcceptedAt)}.`
                      : "Vous devrez accepter ce document avant une nouvelle activation ou recharge de formule."}
                  </p>
                </div>

                {alreadyAccepted ? (
                  <a
                    className="bb-button-brand justify-center"
                    href={SUMUP_TOPUP_URL}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Recharger la formule
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                ) : (
                  <button
                    className="bb-button-brand justify-center"
                    disabled={submitting}
                    onClick={() => {
                      void acceptTerms();
                    }}
                    type="button"
                  >
                    {submitting ? "Validation..." : "Accepter et continuer"}
                  </button>
                )}
              </div>

              {!alreadyAccepted && (
                <label
                  className={cn(
                    "mt-5 flex items-start gap-3 rounded-[22px] border border-white/10 bg-black/20 p-4 text-sm text-white/72 transition duration-200",
                    checkboxAttention &&
                      "bb-attention-ring bb-attention-nudge border-[#f7b955]/55 bg-[#f7b955]/10 text-white",
                  )}
                >
                  <input
                    checked={accepted}
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-black/30 text-[#f7b955] accent-[#f7b955]"
                    onChange={(event) => setAccepted(event.target.checked)}
                    type="checkbox"
                  />
                  <span>{TERMS_ACCEPTANCE_LABEL}</span>
                </label>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
          <article className="bb-surface p-6">
            <p className="bb-eyebrow">Resume utile</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Ce qu'il faut retenir</h2>
            <div className="mt-6 space-y-3">
              {TERMS_HIGHLIGHTS.map((item) => (
                <div
                  className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-white/68"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </article>

          <article className="bb-surface p-6">
            <p className="bb-eyebrow">Detail</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Reglement de la formule {client.formulaName || "detailing"}
            </h2>

            <div className="mt-6 space-y-4">
              {TERMS_SECTIONS.map((section) => (
                <section
                  className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5"
                  key={section.title}
                >
                  <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                  <div className="mt-3 space-y-3 text-sm leading-6 text-white/68">
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
