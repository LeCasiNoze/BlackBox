import * as React from "react";
import {
  ArrowRight,
  CalendarCheck,
  Camera,
  CheckCircle2,
  CreditCard,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";

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

  return (
    <div className="bb-shell pb-24 md:pb-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bb-founder-orb bb-founder-orb-gold" />
        <div className="bb-founder-orb bb-founder-orb-blue" />
        <div className="bb-founder-orb bb-founder-orb-ember" />
      </div>

      <main className="bb-content space-y-6 md:space-y-8">
        <section className="bb-gold-frame bb-surface-strong relative overflow-hidden p-6 md:p-8 xl:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(232,201,138,0.18),transparent_34%),radial-gradient(circle_at_right,rgba(44,162,255,0.12),transparent_28%)]" />
          <div className="relative z-10 grid gap-10 xl:grid-cols-[1fr_1.05fr] xl:items-center">
            <div className="space-y-7">
              <div className="bb-rise flex flex-wrap items-center gap-2.5">
                <div className="bb-pill border-[#e8c98a]/30 bg-[#e8c98a]/10 text-[#ffe8a8]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Bryan Cars Detailing
                </div>
                <div className="bb-pill border-white/10 bg-white/[0.04] text-white/70">
                  <Star className="h-3.5 w-3.5 fill-[#e8c98a] text-[#e8c98a]" />
                  4,9 / 5 sur Google
                </div>
              </div>

              <div className="bb-rise bb-rise-2">
                <h1 className="bb-title-xl max-w-3xl">
                  Votre voiture,
                  <br />
                  <span className="bb-text-gold">sublimee</span> et suivie.
                </h1>
                <p className="bb-subtitle mt-5 max-w-xl text-base md:text-lg">
                  Creez votre espace client en deux minutes : agenda, credits prepayes,
                  historique et suivi photo de chaque prestation.
                </p>
              </div>

              <ul className="bb-rise bb-rise-3 grid gap-3 sm:grid-cols-2">
                {[
                  [CalendarCheck, "Reservation en ligne", "Choisissez votre creneau."],
                  [CreditCard, "Credits prepayes", "Payez une fois, profitez."],
                  [Camera, "Suivi photo", "Avant / apres de chaque soin."],
                  [ShieldCheck, "Espace securise", "Acces par code email."],
                ].map(([Icon, label, copy]) => {
                  const FeatureIcon = Icon as typeof CalendarCheck;
                  return (
                    <li className="bb-hairline bb-hover-lift flex items-start gap-3 p-3.5" key={label as string}>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e8c98a]/12 text-[#e8c98a]">
                        <FeatureIcon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-white">{label as string}</span>
                        <span className="block text-xs leading-5 text-white/55">{copy as string}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <article className="bb-surface bb-rise bb-rise-2 relative overflow-hidden p-5 md:p-6">
              <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#e8c98a]/10 blur-3xl" />
              <div className="relative mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="bb-eyebrow">
                    {step === "ready" ? "Bienvenue" : step === "code" ? "Verification" : "Inscription"}
                  </p>
                  <h2 className="bb-display mt-2 text-2xl font-bold text-white">
                    {step === "ready"
                      ? "Votre compte est pret"
                      : step === "code"
                        ? "Validez votre email"
                        : "Vos informations"}
                  </h2>
                </div>
                <img alt="" className="h-14 w-14 rounded-2xl object-cover ring-1 ring-white/10" src="/app-icon-192.png" />
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

                  <button className="bb-button-brand mt-5 w-full justify-center" disabled={busy} onClick={requestCode} type="button">
                    {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    Recevoir mon code
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
                </div>
              )}
            </article>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            [Star, "Avis Google", "4,9 / 5", "Consultez les avis clients publics.", GOOGLE_MAPS_URL],
            [MessageCircle, "Contact rapide", "WhatsApp", "Envoyez une question ou une photo.", WHATSAPP_URL],
            [Smartphone, "Application", "iPhone & Android", "Ajoutez l'espace a votre ecran d'accueil.", ""],
          ].map(([Icon, label, value, copy, href], index) => {
            const CardIcon = Icon as typeof Star;
            return (
              <article
                className={`bb-surface bb-hover-lift bb-rise relative overflow-hidden p-5 bb-rise-${index + 2}`}
                key={label as string}
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e8c98a]/12 text-[#e8c98a]">
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
      </main>
    </div>
  );
}
