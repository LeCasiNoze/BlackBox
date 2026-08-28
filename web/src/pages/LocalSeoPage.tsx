import * as React from "react";
import {
  ArrowRight,
  Camera,
  CarFront,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

const GOOGLE_MAPS_URL = "https://maps.app.goo.gl/SNXz7PaTRSWWMxLa8";

const services = [
  {
    title: "Nettoyage intérieur",
    copy: "Aspiration, plastiques, vitres, sellerie tissu, cuir ou Alcantara, ciel de toit et traitements des odeurs selon les besoins réels de l'habitacle.",
    icon: Sparkles,
  },
  {
    title: "Nettoyage extérieur",
    copy: "Lavage soigné, décontamination de la carrosserie, jantes, pneus, plastiques extérieurs et protection adaptée à l'usage du véhicule.",
    icon: CarFront,
  },
  {
    title: "Polissage & protection",
    copy: "Correction légère à intensive, rénovation des optiques, cire, protection céramique et traitements hydrophobes pour retrouver éclat et profondeur.",
    icon: ShieldCheck,
  },
];

const steps = [
  { title: "Composez votre demande", copy: "Sélectionnez les prestations utiles depuis le catalogue.", icon: FileText },
  { title: "Montrez le véhicule", copy: "Décrivez son état et ajoutez des photos pour un chiffrage juste.", icon: Camera },
  { title: "Recevez le prix exact", copy: "Bryan Cars étudie la demande et transmet un devis personnalisé.", icon: CreditCard },
  { title: "Planifiez après paiement", copy: "Une fois le devis réglé, choisissez une disponibilité dans l'agenda.", icon: Clock3 },
];

export function LocalSeoPage() {
  React.useEffect(() => {
    document.title = "Nettoyage voiture à Louhans | Bryan Cars Detailing";
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    description?.setAttribute(
      "content",
      "Nettoyage intérieur et extérieur, polissage et protection automobile à Louhans. Recevez un devis personnalisé chez Bryan Cars Detailing.",
    );
  }, []);

  return (
    <main className="min-h-screen bg-[#080707] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <a className="flex items-center gap-3" href="/">
            <img alt="Bryan Cars Detailing" className="h-10 w-auto" src="/bc-gold-logo.png" />
            <span className="hidden text-xs font-black uppercase tracking-[0.16em] text-white/75 sm:block">Bryan Cars Detailing</span>
          </a>
          <a className="inline-flex items-center gap-2 bg-[#e8c98a] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-[#f3dda9]" href="/#devis">
            Demander un devis <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </header>

      <section className="relative isolate overflow-hidden border-b border-white/10">
        <img alt="Voiture entretenue dans l'atelier de detailing Bryan Cars" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-35" src="/hero-detailing.jpg" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(6,5,5,.98)_0%,rgba(6,5,5,.86)_48%,rgba(6,5,5,.42)_100%)]" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#e8c98a]"><MapPin className="h-4 w-4" /> Louhans · Saône-et-Loire</p>
            <h1 className="mt-5 text-4xl font-black uppercase leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Nettoyage &amp; detailing automobile <span className="text-[#e8c98a]">à Louhans</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/70 sm:text-lg">
              Bryan Cars prend soin de votre véhicule avec une prestation construite autour de son état réel : entretien intérieur, lavage extérieur, rénovation, polissage et protections. Vous choisissez vos besoins, nous vous transmettons un prix précis avant tout engagement.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a className="inline-flex items-center justify-center gap-2 bg-[#e8c98a] px-6 py-4 text-xs font-black uppercase tracking-[0.15em] text-black" href="/#devis">Obtenir mon devis <ArrowRight className="h-4 w-4" /></a>
              <a className="inline-flex items-center justify-center gap-2 border border-white/20 bg-black/35 px-6 py-4 text-xs font-black uppercase tracking-[0.15em] text-white" href={GOOGLE_MAPS_URL} rel="noreferrer" target="_blank"><MapPin className="h-4 w-4 text-[#e8c98a]" /> Voir sur la carte</a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e8c98a]">Une réponse adaptée au véhicule</p>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-5xl">Des prestations lisibles, un devis sans surprise</h2>
          <p className="mt-5 text-sm leading-7 text-white/60 sm:text-base">
            Deux véhicules du même modèle ne demandent pas toujours le même travail. L'état de la sellerie, les taches, les micro-rayures, les contaminations et la finition attendue changent la durée d'intervention. C'est pourquoi Bryan Cars travaille sur devis personnalisé : vous ne payez pas un forfait aveugle, mais une intervention cohérente avec votre demande.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {services.map(({ title, copy, icon: Icon }) => (
            <article className="border border-white/10 bg-[#120f0f] p-6" key={title}>
              <span className="grid h-12 w-12 place-items-center border border-[#e8c98a]/30 bg-[#e8c98a]/10 text-[#e8c98a]"><Icon className="h-6 w-6" /></span>
              <h3 className="mt-5 text-xl font-black uppercase">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/58">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0d0b0b]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e8c98a]">Le parcours</p>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-5xl">Simple avant, clair pendant</h2>
              <p className="mt-5 text-sm leading-7 text-white/60">
                La demande se fait en ligne en quelques minutes, depuis un téléphone ou un ordinateur. Les photos ne sont pas obligatoires, mais elles aident fortement à estimer le temps de travail et à proposer un tarif juste. Aucun créneau n'est bloqué avant votre décision et le paiement du devis.
              </p>
            </div>
            <ol className="grid gap-3 sm:grid-cols-2">
              {steps.map(({ title, copy, icon: Icon }, index) => (
                <li className="border border-white/10 bg-black/25 p-5" key={title}>
                  <div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center bg-[#e8c98a]/10 text-[#e8c98a]"><Icon className="h-5 w-5" /></span><span className="text-2xl font-black text-white/12">0{index + 1}</span></div>
                  <h3 className="mt-4 text-sm font-black uppercase tracking-[0.08em]">{title}</h3>
                  <p className="mt-2 text-xs leading-6 text-white/52">{copy}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e8c98a]">Louhans &amp; Bresse bourguignonne</p>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-5xl">Un service automobile local</h2>
          <p className="mt-5 text-sm leading-7 text-white/60">
            L'activité est basée à Louhans, au cœur de la Bresse bourguignonne. Les demandes de Louhans, Châteaurenaud et des communes proches peuvent être étudiées pour une intervention à l'atelier ou à domicile, selon la prestation et le planning. Le lieu exact et les modalités sont confirmés lors de la planification.
          </p>
          <p className="mt-4 text-sm leading-7 text-white/60">
            Que vous souhaitiez remettre au propre un véhicule du quotidien, préparer une automobile à la vente, corriger une peinture ternie ou protéger une carrosserie, la demande commence de la même façon : véhicule, prestations, état et photos utiles. Vous gardez ainsi une trace claire du devis, du paiement et de la future intervention dans votre espace client.
          </p>
        </div>
        <aside className="border border-[#e8c98a]/25 bg-[linear-gradient(145deg,rgba(232,201,138,.11),rgba(255,255,255,.02))] p-6 sm:p-8">
          <Wrench className="h-8 w-8 text-[#e8c98a]" />
          <h2 className="mt-5 text-2xl font-black uppercase">Votre véhicule mérite une estimation juste</h2>
          <ul className="mt-6 space-y-3 text-sm text-white/70">
            {["Devis personnalisé avant paiement", "Prestations sélectionnées à la carte", "Photos et état du véhicule pris en compte", "Suivi depuis un espace client", "Planification après règlement"].map((item) => <li className="flex items-start gap-3" key={item}><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#e8c98a]" />{item}</li>)}
          </ul>
          <a className="mt-7 inline-flex w-full items-center justify-center gap-2 bg-[#e8c98a] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-black" href="/#devis">Composer ma demande <ArrowRight className="h-4 w-4" /></a>
          <a className="mt-3 inline-flex w-full items-center justify-center gap-2 border border-white/15 px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-white" href="tel:+33603125186"><Phone className="h-4 w-4 text-[#e8c98a]" /> 06 03 12 51 86</a>
        </aside>
      </section>

      <footer className="border-t border-white/10 bg-black px-4 py-8 text-center text-xs text-white/40">
        <p>Bryan Cars Detailing · Louhans 71500 · Saône-et-Loire</p>
        <div className="mt-3 flex flex-wrap justify-center gap-4"><a className="hover:text-white" href="/">Accueil</a><a className="hover:text-white" href="/preparation-vente">Préparation vente</a><a className="hover:text-white" href="/mentions-legales">Mentions légales</a></div>
      </footer>
    </main>
  );
}
