import * as React from "react";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Star,
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
          <div className="relative z-10 mx-auto w-full max-w-2xl">
            {/* Pas de backdrop-blur ici: cette carte est deja DANS une surface
                en verre. Imbriquer deux backdrop-filter fait disparaitre le
                contenu sur iOS Safari apres un changement de layout. */}
            <article className="bb-rise relative overflow-hidden rounded-[26px] border border-white/10 bg-[#16120c]/90 p-5 shadow-[0_30px_70px_-32px_rgba(0,0,0,0.85)] md:p-6">
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

                  <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-white/70">
                    <input
                      checked={acceptedTerms}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 bg-black/30 accent-[#e8c98a]"
                      onChange={(event) => setAcceptedTerms(event.target.checked)}
                      type="checkbox"
                    />
                    <span>
                      J&apos;accepte les conditions generales et la politique de confidentialite de
                      Bryan Cars.
                    </span>
                  </label>

                  <button
                    className="bb-button-brand mt-4 w-full justify-center"
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
                  <div className="rounded-[26px] border border-[#e8c98a]/25 bg-[#e8c98a]/[0.06] p-5">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-[#e8c98a]" />
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
                      iPhone : bouton Partager puis « Sur l&apos;ecran d&apos;accueil ». Android : menu ⋮ puis
                      « Installer l&apos;application ».
                    </p>
                  </div>
                </div>
              )}
            </article>
          </div>
        </section>

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
