import { ArrowRight, CalendarRange, CreditCard, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "../lib/portal";

const quickLinks = [
  {
    title: "Portail client",
    copy: "Reservation, historique, credits restants et avis post-prestation.",
    href: "/card/card01",
    badge: "NFC experience",
  },
  {
    title: "Cockpit admin",
    copy: "Clients, rendez-vous, formule, photos et suivi complet du parc.",
    href: "/admin",
    badge: "Operations",
  },
];

const pillars = [
  {
    icon: CalendarRange,
    title: "Agenda detailled",
    copy: "Vue planning claire, gestion des jours disponibles, rendez-vous passes et prochains passages.",
  },
  {
    icon: CreditCard,
    title: "Logique abonnement",
    copy: "Chaque client suit sa formule, ses credits restants et ses actions en autonomie.",
  },
  {
    icon: ShieldCheck,
    title: "Pilotage premium",
    copy: "Une interface plus haut de gamme, plus lisible et plus rassurante pour l'admin comme pour le client.",
  },
];

export function LandingPage() {
  return (
    <div className="bb-shell">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-6rem] top-24 h-72 w-72 rounded-full bg-[#f7b955]/10 blur-3xl" />
        <div className="absolute right-[-4rem] top-10 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#ff7a18]/10 blur-3xl" />
      </div>

      <main className="bb-content space-y-8 md:space-y-10">
        <section className="bb-surface-strong grid gap-8 overflow-hidden p-6 md:grid-cols-[1.3fr_0.9fr] md:p-10">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="bb-eyebrow">Bryan Cars detailing platform</div>
              <h1 className="bb-title max-w-3xl">
                Une vitrine plus nette, un parcours plus premium, une gestion plus fluide.
              </h1>
              <p className="bb-subtitle max-w-2xl">
                Cette nouvelle base reprend le coeur du systeme Bryan Cars:
                reservation client, suivi des credits, cockpit admin, notes et
                photos de rendez-vous.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link className="bb-button-brand" to="/card/card01">
                Voir la carte client
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link className="bb-button-ghost" to="/admin">
                Ouvrir le cockpit admin
              </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {pillars.map(({ icon: Icon, title, copy }) => (
                <article className="bb-surface p-4" key={title}>
                  <div className="mb-4 inline-flex rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-[#f7b955]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mb-2 text-base font-semibold text-white">{title}</h2>
                  <p className="text-sm leading-6 text-white/65">{copy}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-[30px] border border-white/10 bg-black p-3 md:p-5">
            <div className="absolute inset-0 bg-gradient-to-br from-[#f7b955]/20 via-transparent to-sky-400/10" />
            <img
              alt="Bryan Cars Detailing"
              className="relative z-10 h-full min-h-[360px] w-full rounded-[24px] object-contain object-center px-4 py-6 opacity-95"
              src="/bryan-cars-logo.png"
            />
            <div className="absolute inset-x-5 bottom-5 z-20 rounded-[24px] border border-white/10 bg-black/65 p-5 backdrop-blur-md">
              <div className="bb-eyebrow">Signature visuelle</div>
              <p className="mt-3 text-lg font-semibold text-white">
                Une direction plus editorial, plus dense, et clairement premium.
              </p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Fini l&apos;aspect prototype. L&apos;objectif ici est de faire
                ressentir une vraie marque de detailing haut de gamme.
              </p>
            </div>
          </aside>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {quickLinks.map((item, index) => (
            <Link
              className={cn(
                "bb-surface group relative overflow-hidden p-6 transition duration-300 hover:-translate-y-1",
                index === 0 ? "md:rotate-[-0.5deg]" : "md:rotate-[0.5deg]",
              )}
              key={item.title}
              to={item.href}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
              <div className="bb-pill border-white/12 bg-white/[0.05] text-white/80">
                {item.badge}
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-white">{item.title}</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
                {item.copy}
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#f7b955]">
                Ouvrir
                <ArrowRight className="h-4 w-4 transition duration-300 group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
