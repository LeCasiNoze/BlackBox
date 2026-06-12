import {
  ArrowRight,
  CalendarClock,
  Clock3,
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

import { cn } from "../lib/portal";

const BOOKING_URL = "https://www.sumupbookings.com/bryan-cars";
const GOOGLE_MAPS_URL = "https://maps.app.goo.gl/SNXz7PaTRSWWMxLa8";
const GOOGLE_SITE_URL = "https://sites.google.com/view/nettoyage-voiture-louhans/accueil";
const WHATSAPP_URL = "https://wa.me/message/FSJMNKNGPVTTK1";
const PHONE_DISPLAY = "06 03 12 51 86";
const PHONE_HREF = "tel:+33603125186";
const CONTACT_EMAIL = "bryancarsauto@gmail.com";

const highlights = [
  {
    label: "Avis Google",
    value: "4,9 / 5",
    copy: "59 avis publics visibles sur Google Maps.",
    icon: Star,
  },
  {
    label: "Disponibilite",
    value: "8h - 20h",
    copy: "Du lundi au samedi, sur rendez-vous.",
    icon: Clock3,
  },
  {
    label: "Intervention",
    value: "Atelier ou domicile",
    copy: "Louhans et alentours selon le besoin.",
    icon: MapPin,
  },
];

const services = [
  {
    title: "Exterieur",
    duration: "45 min",
    price: "69 EUR",
    copy: "Formule rapide pour redonner de l'eclat et garder une carrosserie propre entre deux gros details.",
  },
  {
    title: "Interieur",
    duration: "45 min",
    price: "129 EUR",
    copy: "Nettoyage interieur cible pour remettre l'habitacle au propre, sans surcharge ni detour.",
  },
  {
    title: "Interieur + exterieur",
    duration: "2 h",
    price: "159 EUR",
    copy: "Le combo le plus lisible pour repartir sur une voiture propre dedans comme dehors.",
  },
  {
    title: "Nettoyage extreme",
    duration: "4 h",
    price: "249 EUR",
    copy: "Pour les vehicules qui demandent une vraie remise a niveau et un resultat beaucoup plus pousse.",
  },
];

const googleReviews = [
  {
    author: "Alice Nennig",
    meta: "Avis Google · il y a 6 mois",
    excerpt: "Travail rapide, efficace et tres soigne.",
  },
  {
    author: "Anthony Roux",
    meta: "Avis Google · il y a 4 mois",
    excerpt: "Ma voiture est ressortie comme neuve a l'interieur.",
  },
];

const contactActions = [
  {
    label: "Reserver sur SumUp",
    href: BOOKING_URL,
    tone: "brand",
    icon: CalendarClock,
  },
  {
    label: "WhatsApp",
    href: WHATSAPP_URL,
    tone: "ghost",
    icon: MessageCircle,
  },
  {
    label: "Appeler",
    href: PHONE_HREF,
    tone: "ghost",
    icon: Phone,
  },
];

const weeklyHours = [
  "Lundi 08:00 - 20:00",
  "Mardi 08:00 - 20:00",
  "Mercredi 08:00 - 20:00",
  "Jeudi 08:00 - 20:00",
  "Vendredi 08:00 - 20:00",
  "Samedi 08:00 - 20:00",
  "Dimanche ferme",
];

export function LandingPage() {
  return (
    <div className="bb-shell pb-24 md:pb-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bb-founder-orb bb-founder-orb-gold" />
        <div className="bb-founder-orb bb-founder-orb-blue" />
        <div className="bb-founder-orb bb-founder-orb-ember" />
        <img
          alt=""
          aria-hidden="true"
          className="absolute right-[-8rem] top-[-3rem] hidden w-[34rem] opacity-[0.08] mix-blend-screen xl:block"
          src="/bryan-cars-logo.png"
        />
      </div>

      <main className="bb-content space-y-6 md:space-y-8">
        <section className="bb-surface-strong relative overflow-hidden p-6 md:p-8 xl:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(247,185,85,0.16),transparent_30%),radial-gradient(circle_at_right,rgba(44,162,255,0.12),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.02),transparent)]" />
          <div className="absolute inset-y-0 right-0 hidden w-[46%] xl:block">
            <img
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover opacity-35"
              src="/BCD.jpg"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b0d12] via-[#0b0d12]/45 to-transparent" />
          </div>

          <div className="relative z-10 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="bb-pill border-[#f7b955]/25 bg-[#f7b955]/10 text-[#ffe8a8]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Bryan Cars Detailing Louhans
                </div>
                <div className="bb-pill border-white/12 bg-white/[0.04] text-white/72">
                  <Star className="h-3.5 w-3.5 text-[#f7b955]" />
                  4,9/5 sur Google Maps
                </div>
                <div className="bb-pill border-white/12 bg-white/[0.04] text-white/72">
                  <ShieldCheck className="h-3.5 w-3.5 text-sky-300" />
                  Sur rendez-vous
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="bb-title max-w-4xl">
                  Le detailing Bryan Cars, pense comme une vraie signature premium.
                </h1>
                <p className="bb-subtitle max-w-2xl text-base">
                  Nettoyage interieur, exterieur, remises a niveau plus poussees et
                  reservations en ligne: l&apos;objectif ici est simple, montrer une
                  marque propre, rassurante et desiree des le premier ecran.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  className="bb-button-brand"
                  href={BOOKING_URL}
                  rel="noreferrer"
                  target="_blank"
                >
                  Reserver maintenant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
                <a
                  className="bb-button-ghost"
                  href={WHATSAPP_URL}
                  rel="noreferrer"
                  target="_blank"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Contacter sur WhatsApp
                </a>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {highlights.map(({ copy, icon: Icon, label, value }) => (
                  <article className="rounded-[26px] border border-white/10 bg-black/20 p-4" key={label}>
                    <div className="mb-4 inline-flex rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-[#f7b955]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-xs uppercase tracking-[0.16em] text-white/38">{label}</p>
                    <p className="mt-2 text-xl font-semibold text-white">{value}</p>
                    <p className="mt-2 text-sm leading-6 text-white/58">{copy}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="grid gap-4 self-start">
              <article className="bb-founder-media relative overflow-hidden rounded-[32px] border border-white/10 bg-black/35 p-4 shadow-[0_28px_80px_rgba(0,0,0,0.42)]">
                <div className="bb-founder-shimmer" />
                <div className="absolute inset-0 bg-gradient-to-br from-[#f7b955]/15 via-transparent to-sky-400/10" />
                <div className="relative rounded-[26px] border border-white/10 bg-black/45 p-4">
                  <img
                    alt="Bryan Cars Detailing"
                    className="mx-auto h-[220px] w-full max-w-[28rem] object-contain"
                    src="/bryan-cars-logo.png"
                  />
                </div>

                <div className="relative mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/38">Contact</p>
                    <p className="mt-2 text-lg font-semibold text-white">{PHONE_DISPLAY}</p>
                    <p className="mt-1 text-sm text-white/58">{CONTACT_EMAIL}</p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/38">Acces</p>
                    <p className="mt-2 text-lg font-semibold text-white">Louhans, 71500</p>
                    <p className="mt-1 text-sm text-white/58">Atelier ou a domicile</p>
                  </div>
                </div>
              </article>

              <article className="bb-surface p-5">
                <div className="bb-section-head">
                  <div>
                    <p className="bb-eyebrow">Services visibles</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                      Reservation publique deja en place
                    </h2>
                  </div>
                  <a
                    className="bb-button-ghost px-4 py-2"
                    href={BOOKING_URL}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Ouvrir SumUp
                  </a>
                </div>

                <div className="mt-5 space-y-3">
                  {services.slice(0, 3).map((service) => (
                    <div
                      className="flex items-start justify-between gap-4 rounded-[24px] border border-white/10 bg-black/20 p-4"
                      key={service.title}
                    >
                      <div>
                        <p className="text-lg font-semibold text-white">{service.title}</p>
                        <p className="mt-2 text-sm leading-6 text-white/58">{service.copy}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-white">{service.price}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/42">
                          {service.duration}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <article className="bb-surface p-6" id="services">
            <div className="bb-section-head">
              <div>
                <p className="bb-eyebrow">Prestations</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Une offre lisible des le premier coup d&apos;oeil
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62">
                  Les tarifs et durees ci-dessous reprennent la grille visible sur la
                  reservation publique SumUp de Bryan Cars.
                </p>
              </div>
              <div className="bb-pill border-white/12 bg-white/[0.04] text-white/72">
                4 formules visibles + carte VIP
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {services.map((service, index) => (
                <article
                  className={cn(
                    "rounded-[28px] border p-5 transition duration-200",
                    index === 2
                      ? "border-[#f7b955]/28 bg-[#f7b955]/10 shadow-[0_18px_48px_rgba(247,185,85,0.08)]"
                      : "border-white/10 bg-white/[0.03]",
                  )}
                  key={service.title}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xl font-semibold text-white">{service.title}</p>
                      <p className="mt-2 text-sm text-white/58">{service.duration}</p>
                    </div>
                    <div className="bb-pill border-white/12 bg-black/25 text-white/78">
                      {service.price}
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-white/62">{service.copy}</p>
                </article>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                className="bb-button-brand"
                href={BOOKING_URL}
                rel="noreferrer"
                target="_blank"
              >
                Voir les disponibilites
              </a>
              <a
                className="bb-button-ghost"
                href={GOOGLE_SITE_URL}
                rel="noreferrer"
                target="_blank"
              >
                Site public
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </div>
          </article>

          <article className="bb-surface overflow-hidden p-6">
            <div className="bb-section-head">
              <div>
                <p className="bb-eyebrow">Avis Google</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Une preuve sociale deja solide
                </h2>
              </div>
              <div className="rounded-[22px] border border-[#f7b955]/25 bg-[#f7b955]/10 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.16em] text-[#ffe8a8]">Google Maps</p>
                <p className="mt-2 text-3xl font-semibold text-white">4,9</p>
                <p className="mt-1 text-sm text-white/65">59 avis</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {googleReviews.map((review) => (
                <article
                  className="rounded-[26px] border border-white/10 bg-black/20 p-5"
                  key={review.author}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">{review.author}</p>
                      <p className="mt-1 text-sm text-white/48">{review.meta}</p>
                    </div>
                    <div className="bb-pill border-[#f7b955]/25 bg-[#f7b955]/10 text-[#ffe8a8]">
                      <Star className="h-3.5 w-3.5" />
                      5,0
                    </div>
                  </div>
                  <p className="mt-4 text-lg leading-7 text-white">
                    &quot;{review.excerpt}&quot;
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-white/40">Repartition</p>
                <p className="mt-2 text-sm font-semibold text-white">56 avis 5 etoiles</p>
                <p className="mt-1 text-sm text-white/56">3 avis 4 etoiles</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-white/40">Themes cites</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  vehicule, prix, nickel, etat
                </p>
                <p className="mt-1 text-sm text-white/56">
                  Themes visibles dans le resume Google Maps.
                </p>
              </div>
            </div>

            <a
              className="bb-button-ghost mt-6"
              href={GOOGLE_MAPS_URL}
              rel="noreferrer"
              target="_blank"
            >
              Lire les avis Google
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
          <article className="bb-surface p-6">
            <div className="bb-section-head">
              <div>
                <p className="bb-eyebrow">Contact</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Les bons raccourcis, sans friction
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {contactActions.map((action) => {
                const Icon = action.icon;
                return (
                  <a
                    className={
                      action.tone === "brand"
                        ? "bb-button-brand justify-between"
                        : "bb-button-ghost justify-between"
                    }
                    href={action.href}
                    key={action.label}
                    rel={action.href.startsWith("http") ? "noreferrer" : undefined}
                    target={action.href.startsWith("http") ? "_blank" : undefined}
                  >
                    <span className="inline-flex items-center">
                      <Icon className="mr-2 h-4 w-4" />
                      {action.label}
                    </span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                );
              })}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-white/40">Telephone</p>
                <p className="mt-2 text-lg font-semibold text-white">{PHONE_DISPLAY}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-white/40">Email</p>
                <p className="mt-2 text-lg font-semibold text-white break-all">
                  {CONTACT_EMAIL}
                </p>
              </div>
            </div>
          </article>

          <article className="bb-surface p-6">
            <div className="bb-section-head">
              <div>
                <p className="bb-eyebrow">Infos pratiques</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Horaires et points d&apos;entree publics
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62">
                  Les horaires ci-dessous reprennent la fiche de reservation publique.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {weeklyHours.map((label) => (
                <div
                  className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/72"
                  key={label}
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                className="bb-button-ghost"
                href={GOOGLE_MAPS_URL}
                rel="noreferrer"
                target="_blank"
              >
                Ouvrir Google Maps
              </a>
              <a
                className="bb-button-ghost"
                href={GOOGLE_SITE_URL}
                rel="noreferrer"
                target="_blank"
              >
                Voir le site Google
              </a>
              <a
                className="bb-button-ghost"
                href={BOOKING_URL}
                rel="noreferrer"
                target="_blank"
              >
                Ouvrir SumUp
              </a>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
