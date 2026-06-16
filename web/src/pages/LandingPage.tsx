import * as React from "react";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Crown,
  Gem,
  Loader2,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";
import { InstallAppButton } from "../components/InstallAppButton";

const GOOGLE_MAPS_URL = "https://maps.app.goo.gl/SNXz7PaTRSWWMxLa8";
const WHATSAPP_URL = "https://wa.me/message/FSJMNKNGPVTTK1";

type SignupForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  addressLine1: string;
  postalCode: string;
  city: string;
  vehicleModel: string;
  vehiclePlate: string;
};

const initialForm: SignupForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  addressLine1: "",
  postalCode: "",
  city: "",
  vehicleModel: "",
  vehiclePlate: "",
};

export function LandingPage() {
  const [form, setForm] = React.useState<SignupForm>(initialForm);
  const [code, setCode] = React.useState("");
  const [step, setStep] = React.useState<"form" | "code" | "ready">("form");
  const [portalUrl, setPortalUrl] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [reviews, setReviews] = React.useState<
    Array<{ id: number; author: string; rating: number; comment: string; vehicleModel: string | null }>
  >([]);
  const signupCardRef = React.useRef<HTMLDivElement | null>(null);

  // Au changement d'etape (code envoye / compte cree), on remonte sur la carte
  // d'inscription pour que le client voie directement la saisie du code.
  React.useEffect(() => {
    if (step === "code" || step === "ready") {
      signupCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [step]);

  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/client/public/reviews");
        const json = await response.json().catch(() => ({}));
        if (active && json.ok && Array.isArray(json.reviews)) setReviews(json.reviews);
      } catch {
        /* best-effort */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  function updateField(key: keyof SignupForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function requestCode() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/client/signup/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json.ok) {
        throw new Error(json.error || "request_failed");
      }
      setStep("code");
    } catch (requestError) {
      setError("Impossible d'envoyer le code. Verifiez l'email et reessayez.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/client/signup/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, code }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json.ok) {
        throw new Error(json.error || "verify_failed");
      }
      setPortalUrl(json.portalUrl || "");
      setStep("ready");
    } catch (requestError) {
      setError("Code invalide ou expire. Demandez un nouveau code si besoin.");
    } finally {
      setBusy(false);
    }
  }

  const stepLabel = step === "ready" ? "Bienvenue" : step === "code" ? "Verification" : "Inscription";
  const stepTitle =
    step === "ready" ? "Votre compte est pret" : step === "code" ? "Validez votre email" : "Creer mon espace";

  const tiers: Array<{ theme: "founder" | "bbx" | "pro"; Icon: typeof Crown; name: string; tag: string; desc: string }> = [
    { theme: "founder", Icon: Crown, name: "Fondateur", tag: "50 places a vie", desc: "BC'Coins & avantages exclusifs." },
    { theme: "bbx", Icon: Gem, name: "BBX", tag: "L'experience signature", desc: "Le standard Bryan Cars." },
    { theme: "pro", Icon: Wrench, name: "Pro", tag: "B2B & flottes", desc: "Espace pro sur-mesure." },
  ];

  return (
    <div className="bb-shell pb-24 md:pb-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bb-founder-orb bb-founder-orb-gold" />
        <div className="bb-founder-orb bb-founder-orb-blue" />
        <div className="bb-founder-orb bb-founder-orb-ember" />
      </div>

      <main className="bb-content space-y-12 md:space-y-16">
        {/* Barre de marque */}
        <header className="bb-rise flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              alt="Bryan Cars"
              className="h-11 w-11 rounded-2xl object-cover ring-1 ring-white/10"
              src="/app-icon-192.png"
            />
            <div>
              <p className="bb-display text-base font-bold leading-none text-white">Bryan Cars</p>
              <p className="mt-1.5 text-[11px] uppercase tracking-[0.24em] text-white/40">Detailing premium</p>
            </div>
          </div>
          <a
            className="bb-pill border-accent/30 bg-accent/[0.08] text-accent transition hover:bg-accent/[0.14]"
            href={GOOGLE_MAPS_URL}
            rel="noreferrer"
            target="_blank"
          >
            <Star className="h-3.5 w-3.5 fill-current" /> 4,9 / 5
          </a>
        </header>

        {/* HERO */}
        <section className="grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
          {/* Pitch */}
          <div>
            <p className="bb-eyebrow bb-rise flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" /> Lavage &amp; detailing a domicile
            </p>
            <h1 className="bb-title-xl bb-rise bb-rise-2 mt-4">
              L&apos;eclat <span className="bb-text-gold">concession</span>,
              <br className="hidden sm:block" /> livre chez vous.
            </h1>
            <p className="bb-subtitle bb-rise bb-rise-2 mt-5 max-w-xl">
              Reservez, suivez vos rendez-vous et pilotez l&apos;entretien de vos vehicules depuis un
              espace pense pour les exigeants. Trois univers, une meme exigence du detail.
            </p>

            {/* Signaux de confiance */}
            <div className="bb-rise bb-rise-3 mt-7 flex flex-wrap items-center gap-2.5">
              <span className="bb-pill border-white/10 bg-white/[0.04] text-white/70">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" /> Produits pro
              </span>
              <span className="bb-pill border-white/10 bg-white/[0.04] text-white/70">
                <MapPin className="h-3.5 w-3.5 text-accent" /> A domicile
              </span>
              <a
                className="bb-pill border-white/10 bg-white/[0.04] text-white/70 transition hover:border-white/25"
                href={WHATSAPP_URL}
                rel="noreferrer"
                target="_blank"
              >
                <MessageCircle className="h-3.5 w-3.5 text-accent" /> WhatsApp
              </a>
            </div>

            {/* Apercu des paliers (or / bronze / acier) */}
            <div className="bb-rise bb-rise-4 mt-8 grid gap-3 sm:grid-cols-3">
              {tiers.map((tier) => {
                const TierIcon = tier.Icon;
                return (
                  <div
                    className="bb-hover-lift rounded-2xl border border-accent/20 bg-accent/[0.06] p-4"
                    data-theme={tier.theme}
                    key={tier.name}
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/15 text-accent">
                      <TierIcon className="h-4 w-4" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-white">{tier.name}</p>
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">{tier.tag}</p>
                    <p className="mt-1.5 text-xs leading-5 text-white/55">{tier.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Carte d'inscription (logique inchangee) */}
          <div
            className="bb-rise bb-rise-2 bb-gold-frame relative scroll-mt-4 overflow-hidden rounded-[30px] border border-white/10 bg-[var(--bb-glass-solid-2)] p-5 shadow-[0_44px_100px_-44px_rgba(0,0,0,0.92)] md:p-6"
            ref={signupCardRef}
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-accent/10 blur-3xl" />
            <div className="relative mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="bb-eyebrow">{stepLabel}</p>
                <h2 className="bb-display mt-2 text-2xl font-bold text-white">{stepTitle}</h2>
              </div>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-accent/25 bg-accent/10 text-accent">
                {step === "ready" ? <CheckCircle2 className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
              </span>
            </div>

            {error && (
              <div className="mb-4 rounded-[22px] border border-rose-300/25 bg-rose-300/10 p-4 text-sm text-rose-50">
                {error}
              </div>
            )}

            {step === "form" && (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    ["firstName", "Prenom"],
                    ["lastName", "Nom"],
                    ["email", "Email"],
                    ["phone", "Telephone"],
                    ["company", "Societe"],
                    ["vehicleModel", "Vehicule"],
                    ["addressLine1", "Adresse"],
                    ["postalCode", "Code postal"],
                    ["city", "Ville"],
                  ].map(([key, label]) => (
                    <label className={key === "addressLine1" ? "md:col-span-2" : ""} key={key}>
                      <span className="text-xs uppercase tracking-[0.16em] text-white/40">{label}</span>
                      <input
                        className="bb-input mt-2"
                        onChange={(event) => updateField(key as keyof SignupForm, event.target.value)}
                        value={form[key as keyof SignupForm]}
                      />
                    </label>
                  ))}
                </div>

                <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-white/70">
                  <input
                    checked={acceptedTerms}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 bg-black/30 accent-[var(--bb-accent)]"
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                    type="checkbox"
                  />
                  <span>
                    J&apos;accepte les conditions generales et la politique de confidentialite de Bryan Cars.
                  </span>
                </label>

                <button
                  className="bb-button-brand mt-5 w-full justify-center"
                  disabled={busy || !acceptedTerms}
                  onClick={requestCode}
                  type="button"
                >
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                  {acceptedTerms ? "Recevoir mon code" : "Accepte les conditions pour continuer"}
                </button>
              </>
            )}

            {step === "code" && (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-white/65">
                  Un code a 6 chiffres vient d&apos;etre envoye a <strong className="text-white">{form.email}</strong>.
                </p>
                <input
                  className="bb-input text-center text-2xl tracking-[0.35em]"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  value={code}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <button className="bb-button-brand justify-center" disabled={busy || code.length !== 6} onClick={verifyCode} type="button">
                    {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Valider
                  </button>
                  <button className="bb-button-ghost justify-center" disabled={busy} onClick={requestCode} type="button">
                    Renvoyer un code
                  </button>
                </div>
              </div>
            )}

            {step === "ready" && (
              <div className="space-y-4">
                <div className="rounded-[26px] border border-emerald-300/25 bg-emerald-300/10 p-5">
                  <CheckCircle2 className="h-8 w-8 text-emerald-200" />
                  <p className="mt-4 text-xl font-semibold text-white">Compte cree.</p>
                  <p className="mt-2 text-sm leading-6 text-white/65">
                    Le lien d&apos;acces vient aussi d&apos;etre envoye par mail.
                  </p>
                </div>
                {portalUrl && (
                  <Link className="bb-button-brand w-full justify-center" to={portalUrl}>
                    Ouvrir mon espace
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                )}
                <div className="rounded-[26px] border border-accent/25 bg-accent/[0.06] p-5">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-accent" />
                    <p className="text-base font-semibold text-white">Installe l&apos;application</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/65">
                    Ajoute Bryan Cars a ton ecran d&apos;accueil pour un acces direct, puis active les
                    <span className="inline-flex items-center gap-1 font-semibold text-white">
                      {" "}
                      <Bell className="h-3.5 w-3.5" /> notifications
                    </span>{" "}
                    depuis ton espace pour suivre tes rendez-vous.
                  </p>
                  <InstallAppButton
                    appName="Bryan Cars"
                    startUrl={portalUrl || "/"}
                    className="bb-button-brand mt-4 w-full justify-center"
                  />
                  <p className="mt-3 text-xs leading-5 text-white/45">
                    iPhone : bouton Partager → Plus → « Sur l&apos;écran d&apos;accueil ». Android : menu &#8942; →
                    « Installer l&apos;application ».
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Liens rapides */}
        <section className="grid gap-4 md:grid-cols-2">
          {[
            [Star, "Avis Google", "4,9 / 5", "Consultez les avis clients publics.", GOOGLE_MAPS_URL],
            [MessageCircle, "Contact rapide", "WhatsApp", "Envoyez une question ou une photo.", WHATSAPP_URL],
          ].map(([Icon, label, value, copy, href], index) => {
            const CardIcon = Icon as typeof Star;
            return (
              <article
                className={`bb-surface bb-hover-lift bb-rise relative overflow-hidden p-5 bb-rise-${index + 2}`}
                key={label as string}
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/[0.12] text-accent">
                  <CardIcon className="h-5 w-5" />
                </span>
                <p className="mt-4 text-xs uppercase tracking-[0.16em] text-white/40">{label as string}</p>
                <p className="mt-1.5 text-2xl font-semibold text-white">{value as string}</p>
                <p className="mt-2 text-sm leading-6 text-white/60">{copy as string}</p>
                {(href as string) && (
                  <a className="bb-button-ghost mt-5" href={href as string} rel="noreferrer" target="_blank">
                    Ouvrir
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </a>
                )}
              </article>
            );
          })}
        </section>

        {/* Avis clients */}
        {reviews.length > 0 && (
          <section className="bb-surface bb-rise relative overflow-hidden p-5 md:p-6">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-accent" />
              <p className="text-xs uppercase tracking-[0.16em] text-white/40">Ils nous font confiance</p>
            </div>
            <h2 className="bb-display mt-2 text-2xl font-bold text-white">Avis clients</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {reviews.map((review) => (
                <article className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4" key={review.id}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{review.author}</p>
                    <div className="flex items-center gap-0.5 text-accent">
                      {Array.from({ length: Math.max(0, Math.min(5, review.rating)) }).map((_, i) => (
                        <Star className="h-3.5 w-3.5 fill-current" key={i} />
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/70">&laquo; {review.comment} &raquo;</p>
                  {review.vehicleModel && <p className="mt-2 text-xs text-white/40">{review.vehicleModel}</p>}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Pied de page */}
        <footer className="flex flex-col items-center gap-2 pt-2 text-center">
          <p className="text-xs text-white/35">Bryan Cars · Detailing premium · A domicile</p>
          <p className="text-[11px] text-white/25">L&apos;exigence du detail, a chaque passage.</p>
        </footer>
      </main>
    </div>
  );
}
