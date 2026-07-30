import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Shield,
  Sparkles,
  Star,
  MapPin,
  MessageCircle,
  CheckCircle2,
  ChevronDown,
  Volume2,
  VolumeX,
  Calendar,
} from "lucide-react";

import {
  ImageComparison,
  ImageComparisonImage,
  ImageComparisonSlider,
} from "../components/landing-test/ImageComparison";
import {
  StackingCards,
  StackingCardItem,
} from "../components/landing-test/StackingCards";

const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/place/Bryan+Cars+Detailing+%E2%80%93+Nettoyage+voiture+%C3%A0+Louhans/@46.6343847,5.2423649,13z/data=!4m8!3m7!1s0x47f327b91eec4c27:0x81bd1ae9f5024543!8m2!3d46.6343847!4d5.2423649!9m1!1b1!16s%2Fg%2F11nxrbfcrd!18m1!1e1?entry=ttu&g_ep=EgoyMDI2MDcyNy4wIKXMDSoASAFQAw%3D%3D";
const WHATSAPP_URL = "https://wa.me/33649520862";

export function LandingTestPage() {
  // ── 1. PRELOADER ──
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1400);
    return () => clearTimeout(timer);
  }, []);

  // ── 2. SCROLL PROGRESS & REF DE SECTIONS ──
  const sequenceRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress: sequenceProgress } = useScroll({
    target: sequenceRef,
    offset: ["start start", "end end"],
  });

  // Index de la séquence d'inspection (0 à 4)
  const inspectionStep = useTransform(sequenceProgress, [0, 0.2, 0.4, 0.6, 0.8, 1], [0, 0, 1, 2, 3, 4]);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const unsubscribe = inspectionStep.on("change", (latest) => {
      setActiveStep(Math.min(4, Math.floor(latest)));
    });
    return () => unsubscribe();
  }, [inspectionStep]);

  // ── 3. LECTEUR VIDÉO REELS DEMO ──
  const [activeReel, setActiveReel] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(true);

  // ── 4. FORMULAIRE DE DEMANDE DE DEVIS / RDV ──
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    vehicleModel: "",
    vehiclePlate: "",
    note: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      setFormError("Veuillez remplir tous les champs obligatoires (*).");
      return;
    }
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/client/signup/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setSubmitted(true);
      } else {
        setFormError(data.error || "Impossible d'envoyer la demande pour le moment.");
      }
    } catch {
      setFormError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const stepsList = [
    {
      num: "01",
      title: "INSPECTION OPTIQUE 5000K",
      subtitle: "Diagnostic micrométrique de la carrosserie",
      desc: "Chaque élément de carrosserie est nettoyé puis analysé sous projecteurs LED haute définition pour cartographier micro-rayures, holographes et défauts de vernis.",
      badge: "Étape 1 — Analyse",
    },
    {
      num: "02",
      title: "DÉCONTAMINATION CHIMIQUE & MECANIQUE",
      subtitle: "Suppression des impuretés incrustées",
      desc: "Bain de mousse neutre, décontamination ferreuse et passage de gomme de dcontamination (Clay Bar) pour obtenir une surface absolument lisse.",
      badge: "Étape 2 — Purification",
    },
    {
      num: "03",
      title: "POLISSAGE CORRECTION 3-PASS",
      subtitle: "Suppression de 99.8% des défauts de vernis",
      desc: "Polisseuses orbitales Rupes et composés abrasifs gradués pour éliminer les rayures sans affaiblir la couche de vernis d'origine.",
      badge: "Étape 3 — Correction",
    },
    {
      num: "04",
      title: "BOUCLIER CÉRAMIQUE CARPRO 9H",
      subtitle: "Protection nano-cristalline longue durée",
      desc: "Application manuelle du traitement céramique accrédité CarPro. Formation d'une liaison covalente permanente ultra-hydrophobe et anti-rayures.",
      badge: "Étape 4 — Shield",
    },
    {
      num: "05",
      title: "FINITION SIGNATURE & ENTRETIEN CUIR",
      subtitle: "L'éclat ultime pour supercar et véhicule d'exception",
      desc: "Nourrissage des cuirs, soin des plastiques et caoutchoucs, inspection finale sous tunnel de lumière avant remise des clés.",
      badge: "Étape 5 — Sublimation",
    },
  ];

  const servicesList = [
    {
      id: "polissage",
      tag: "Populaire",
      title: "Restauration & Polissage Miroir",
      desc: "Correction intégrale des défauts de peinture, suppression des micro-rayures et des effets d'hologrammes pour un rendu miroir parfait.",
      features: ["Lavage minutieux à la main", "Décontamination ferreuse", "Polissage multi-passes Rupes", "Lustrage haute brillance"],
      image: "/corvette_40s.jpg",
    },
    {
      id: "ceramique",
      tag: "Haute Protection",
      title: "Traitement Céramique CarPro 9H",
      desc: "Protection nano-cristalline accréditée CarPro. Bouclier hydrophobe résistant aux UV, fientes, micro-rayures et agressions chimiques.",
      features: ["Accrédité CarPro officiel", "Effet hydrophobe perlant", "Dureté 9H certifiée", "Brillance profonde effet mouillé"],
      image: "/hero-detailing.jpg",
    },
    {
      id: "interieur",
      tag: "Soin Habitacle",
      title: "Detailing Intérieur & Cuir Premium",
      desc: "Nettoyage en profondeur des textiles, dégraissage et nourrissage des cuirs nobles, désinfection et traitement hydrophobe habitacle.",
      features: ["Nettoyage injecteur/extracteur", "Traitement cuir nourrissant", "Désinfection antibactérienne", "Protection plastiques UV"],
      image: "/corvette_20s.jpg",
    },
  ];

  return (
    <div className="bg-[#060608] text-[#e2e8f0] font-sans selection:bg-[#e8c98a] selection:text-black min-h-screen relative overflow-x-hidden">
      {/* ── 1. PRELOADER CINÉMATIQUE ── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="preloader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#060608]"
          >
            <div className="relative flex flex-col items-center space-y-4">
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                src="/bc-gold-logo.png"
                alt="BlackBox BC"
                className="h-16 w-auto object-contain"
              />
              <div className="h-[2px] w-32 bg-[#121114] relative overflow-hidden rounded-full">
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                  className="h-full w-full bg-gradient-to-r from-transparent via-[#e8c98a] to-transparent"
                />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#e8c98a]">
                BLACKBOX BC // ENTERING
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER FLOATING PROTOTYPE ── */}
      <header className="fixed top-4 inset-x-0 z-50 px-4 sm:px-6 max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/landing-test" className="flex items-center gap-3 bg-[#0c0b0e]/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full shadow-2xl">
          <img src="/bc-gold-logo.png" alt="BlackBox" className="h-6 w-auto" />
          <span className="text-xs font-mono font-bold tracking-widest text-[#e8c98a]">
            BLACKBOX BC
          </span>
          <span className="hidden sm:inline-block rounded-full bg-[#e8c98a]/15 border border-[#e8c98a]/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#e8c98a]">
            /LANDING-TEST
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 bg-[#0c0b0e]/80 backdrop-blur-xl border border-white/10 px-6 py-2 rounded-full text-xs font-semibold uppercase tracking-wider text-white/70">
          <a href="#sequence" className="hover:text-[#e8c98a] transition">Inspection</a>
          <a href="#process" className="hover:text-[#e8c98a] transition">Processus</a>
          <a href="#avant-apres" className="hover:text-[#e8c98a] transition">Avant/Après</a>
          <a href="#services" className="hover:text-[#e8c98a] transition">Services</a>
          <a href="#realisations" className="hover:text-[#e8c98a] transition">Réalisations</a>
        </nav>

        <a
          href="#devis-form"
          className="inline-flex items-center gap-2 bg-[#e8c98a] text-black font-bold text-xs px-5 py-2.5 rounded-full hover:bg-white transition-all shadow-[0_0_20px_rgba(232,201,138,0.3)]"
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>RÉSERVER</span>
        </a>
      </header>

      {/* ── 2. HERO CINÉMATIQUE ── */}
      <section className="relative min-h-screen flex flex-col justify-between px-4 sm:px-6 pt-32 pb-12 max-w-7xl mx-auto z-10">
        {/* Arrière-plan cinématique avec halo de lumière */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#e8c98a]/15 via-blue-500/10 to-transparent blur-[120px] rounded-full" />
          <img
            src="/hero-detailing.jpg"
            alt="Detailing BlackBox"
            className="w-full h-full object-cover opacity-25 mix-blend-luminosity scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-[#060608]/70 to-[#060608]/40" />
        </div>

        <div className="space-y-6 max-w-4xl mt-12">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="inline-flex items-center gap-2 border border-[#e8c98a]/30 bg-[#e8c98a]/10 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#e8c98a]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>DETAILING &amp; PROTECTION AUTOMOBILE</span>
          </motion.div>

          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.7, duration: 0.9 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold uppercase tracking-tight leading-[0.95] text-white"
          >
            ENTREZ DANS LA <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#e8c98a] to-[#99793d]">
              BLACK BOX.
            </span>
          </motion.h1>

          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.9, duration: 0.9 }}
            className="text-base sm:text-lg text-white/70 font-light max-w-2xl leading-relaxed"
          >
            Chaque surface est inspectée, corrigée et protégée avec une précision obsessionnelle. L’excellence du detailing automobile à Louhans et en Saône-et-Loire.
          </motion.p>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 2.1, duration: 0.9 }}
            className="flex flex-wrap items-center gap-4 pt-4"
          >
            <a
              href="#devis-form"
              className="inline-flex items-center gap-2 bg-[#e8c98a] text-black font-bold text-sm px-7 py-3.5 rounded-full hover:bg-white transition-all shadow-[0_0_30px_rgba(232,201,138,0.4)]"
            >
              <span>Prendre rendez-vous</span>
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#sequence"
              className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white font-semibold text-sm px-6 py-3.5 rounded-full hover:bg-white/20 transition-all"
            >
              <span>Découvrir l'expérience</span>
              <ChevronDown className="h-4 w-4" />
            </a>
          </motion.div>
        </div>

        {/* Footer du Hero */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.3, duration: 0.8 }}
          className="flex flex-wrap items-center justify-between gap-6 border-t border-white/10 pt-8"
        >
          <div className="flex items-center gap-8">
            <div>
              <p className="text-2xl font-bold font-mono text-[#e8c98a]">99.8%</p>
              <p className="text-[10px] uppercase tracking-widest text-white/50">Correction Défauts</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-white">9H</p>
              <p className="text-[10px] uppercase tracking-widest text-white/50">Dureté Céramique</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-white">5.0 ★</p>
              <p className="text-[10px] uppercase tracking-widest text-white/50">Avis Google Certified</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-white/40 uppercase">
            <span>Défilé au scroll</span>
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </div>
        </motion.div>
      </section>

      {/* ── 3. SÉQUENCE IMMERSIVE AU SCROLL (PINNED LIGHT INSPECTION) ── */}
      <section ref={sequenceRef} id="sequence" className="relative min-h-[300vh] bg-[#080709]">
        <div className="sticky top-0 h-screen flex flex-col justify-between p-6 overflow-hidden">
          {/* Entête de la séquence */}
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between z-10">
            <span className="text-xs font-mono font-bold text-[#e8c98a] tracking-[0.2em]">
              SÉQUENCE D'INSPECTION // STAGE {stepsList[activeStep].num}
            </span>
            <span className="text-xs font-mono text-white/40">
              {activeStep + 1} / 5
            </span>
          </div>

          {/* Visuel central avec balayage lumineux dynamique */}
          <div className="relative flex-1 flex items-center justify-center my-4">
            <div className="relative max-w-4xl w-full aspect-[16/9] rounded-3xl overflow-hidden border border-white/10 bg-black/60 shadow-[0_0_100px_rgba(0,0,0,0.9)]">
              <img
                src={servicesList[activeStep % servicesList.length].image}
                alt="Inspection carrosserie"
                className="w-full h-full object-cover transition-all duration-700 filter brightness-90 contrast-110"
              />

              {/* Faisceau de lumière d'inspection */}
              <motion.div
                className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-[#e8c98a]/35 to-transparent pointer-events-none"
                animate={{ x: ["-100%", "500%"] }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              />

              {/* Tag HUD superposé */}
              <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full text-[10px] font-mono text-[#e8c98a]">
                {stepsList[activeStep].badge}
              </div>
            </div>
          </div>

          {/* Texte explicatif de l'étape active */}
          <div className="max-w-3xl mx-auto w-full text-center space-y-2 z-10">
            <h3 className="text-2xl sm:text-4xl font-extrabold uppercase text-white transition-all">
              {stepsList[activeStep].title}
            </h3>
            <p className="text-xs sm:text-sm text-white/60 max-w-xl mx-auto">
              {stepsList[activeStep].desc}
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. PROCESSUS EN 5 ÉTAPES (STACKING CARDS) ── */}
      <section id="process" className="py-24 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#e8c98a]">
            MÉTHODOLOGIE BLACKBOX
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold uppercase text-white">
            LE PROCESSUS EN 5 ÉTAPES
          </h2>
          <p className="text-sm text-white/60 max-w-xl mx-auto">
            Chaque véhicule qui entre dans la BlackBox suit un protocole rigoureux et sans compromis.
          </p>
        </div>

        <StackingCards totalCards={stepsList.length} className="space-y-6">
          {stepsList.map((step, i) => (
            <StackingCardItem index={i} key={step.num}>
              <div className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-[#0f0e12] backdrop-blur-xl flex flex-col sm:flex-row items-start gap-6 shadow-2xl">
                <span className="text-4xl sm:text-6xl font-black font-mono text-[#e8c98a]">
                  {step.num}
                </span>
                <div className="space-y-2 flex-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                    {step.badge}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold uppercase text-white">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-white/60">
                    {step.desc}
                  </p>
                </div>
              </div>
            </StackingCardItem>
          ))}
        </StackingCards>
      </section>

      {/* ── 5. DEMONSTRATION AVANT / APRÈS (INTERACTIVE SLIDER 21ST.DEV) ── */}
      <section id="avant-apres" className="py-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#e8c98a]">
            DÉMONSTRATION VISUELLE
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold uppercase text-white">
            TRANSFORMATION AVANT / APRÈS
          </h2>
          <p className="text-sm text-white/60 max-w-xl mx-auto">
            Glissez le curseur pour observer la suppression des micro-rayures et l'apparition de l'effet miroir.
          </p>
        </div>

        <div className="rounded-3xl border border-white/15 overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.8)]">
          <ImageComparison className="aspect-[16/9] w-full" enableHover={false}>
            {/* Image Droite (Après : Corvette polie céramique) */}
            <ImageComparisonImage
              src="/corvette_40s.jpg"
              alt="Après Polissage Miroir & Céramique"
              position="right"
            />
            {/* Image Gauche (Avant : Peinture terne / micro-rayée) */}
            <ImageComparisonImage
              src="/corvette_5s.jpg"
              alt="Avant Traitement"
              position="left"
            />
            {/* Curseur de séparation */}
            <ImageComparisonSlider className="w-1 bg-[#e8c98a] shadow-[0_0_15px_#e8c98a]">
              <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black bg-[#e8c98a] flex items-center justify-center shadow-xl">
                <span className="text-black font-bold text-xs">◄ ►</span>
              </div>
            </ImageComparisonSlider>
          </ImageComparison>
        </div>

        <div className="flex justify-between items-center text-xs font-mono text-white/50 pt-4 px-2">
          <span>◄ PEINTURE INITIALE (SANS TRAITEMENT)</span>
          <span>POLISSAGE MIROIR &amp; CÉRAMIQUE 9H ►</span>
        </div>
      </section>

      {/* ── 6. SERVICES (ÉDITORIAL GRANDES CARTES) ── */}
      <section id="services" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#e8c98a]">
            PRESTATIONS EXCLUSIVES
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold uppercase text-white">
            NOS SERVICES HAUTE COUTURE
          </h2>
        </div>

        <div className="grid gap-12">
          {servicesList.map((service, idx) => (
            <div
              key={service.id}
              className={`flex flex-col ${
                idx % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
              } gap-8 items-center p-8 rounded-3xl border border-white/10 bg-[#0c0b0e] shadow-2xl`}
            >
              <div className="w-full lg:w-1/2 aspect-[16/10] rounded-2xl overflow-hidden border border-white/10">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover transition hover:scale-105 duration-500"
                />
              </div>

              <div className="w-full lg:w-1/2 space-y-6">
                <span className="inline-block border border-[#e8c98a]/30 bg-[#e8c98a]/10 px-3 py-1 rounded-full text-xs font-semibold text-[#e8c98a]">
                  {service.tag}
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold uppercase text-white">
                  {service.title}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  {service.desc}
                </p>
                <ul className="grid grid-cols-2 gap-3 pt-2">
                  {service.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-xs font-semibold text-white/80">
                      <CheckCircle2 className="h-4 w-4 text-[#e8c98a] shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-4">
                  <a
                    href="#devis-form"
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#e8c98a] hover:underline"
                  >
                    <span>Demander un devis pour cette prestation</span>
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. RÉALISATIONS (VIDÉOS REELS & GALERIE) ── */}
      <section id="realisations" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#e8c98a]">
            GALERIE EN ACTION
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold uppercase text-white">
            EXTRAITS ATELIER BRYAN CARS
          </h2>
          <p className="text-sm text-white/60 max-w-xl mx-auto">
            Découvrez nos réalisations vidéos et photos sur supercars et véhicules de prestige.
          </p>
        </div>

        {/* Choix du Reel vidéo */}
        <div className="flex justify-center gap-3">
          {[1, 2, 3].map((num) => (
            <button
              key={num}
              onClick={() => setActiveReel(num)}
              className={`px-5 py-2 rounded-full text-xs font-bold uppercase transition ${
                activeReel === num
                  ? "bg-[#e8c98a] text-black shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Vidéo {num}
            </button>
          ))}
        </div>

        {/* Lecteur Vidéo Vertical 9:16 Center */}
        <div className="relative max-w-sm mx-auto aspect-[9/16] rounded-3xl overflow-hidden border border-white/20 shadow-[0_0_80px_rgba(0,0,0,0.9)] bg-black">
          <video
            key={activeReel}
            src={`/reel-${activeReel}.mp4`}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="w-full h-full object-cover"
          />

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-[#e8c98a] hover:text-black transition"
            aria-label="Activer le son"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>
      </section>

      {/* ── 8. PREUVES ET CONFIANCE (GOOGLE REVIEWS & CERTIFICATIONS) ── */}
      <section className="py-20 bg-[#0a090c] border-y border-white/10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid gap-8 sm:grid-cols-3">
          <div className="p-6 rounded-2xl border border-white/10 bg-black/40 space-y-3">
            <div className="flex items-center gap-1 text-[#e8c98a]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <h4 className="text-lg font-bold text-white uppercase">Avis Google Certified</h4>
            <p className="text-xs text-white/60 leading-relaxed">
              Note moyenne de 5.0★ attribuée par nos clients passionnés d'automobile à Louhans.
            </p>
            <a href={GOOGLE_MAPS_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e8c98a] hover:underline pt-2">
              <span>Voir la fiche Google Maps</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-black/40 space-y-3">
            <Shield className="h-6 w-6 text-[#e8c98a]" />
            <h4 className="text-lg font-bold text-white uppercase">Accrédité CarPro Official</h4>
            <p className="text-xs text-white/60 leading-relaxed">
              Centre agréé pour l'application des traitements céramiques professionnels CarPro 9H.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-black/40 space-y-3">
            <MapPin className="h-6 w-6 text-[#e8c98a]" />
            <h4 className="text-lg font-bold text-white uppercase">Atelier &amp; À Domicile</h4>
            <p className="text-xs text-white/60 leading-relaxed">
              Prestations réalisées en atelier sécurisé à Louhans (71500), Saône-et-Loire &amp; Bresse.
            </p>
          </div>
        </div>
      </section>

      {/* ── 9. CTA FINAL & FORMULAIRE DE RÉSORTION / DEVIS ── */}
      <section id="devis-form" className="py-24 px-4 sm:px-6 max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#e8c98a]">
            PRENDRE RENDEZ-VOUS / DEMANDE DE DEVIS
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold uppercase text-white">
            VOTRE VÉHICULE MÉRITE L'EXCELLENCE.
          </h2>
          <p className="text-sm text-white/60 max-w-lg mx-auto">
            Confiez-nous chaque détail. Remplissez le formulaire ci-dessous pour recevoir votre estimation gratuite.
          </p>
        </div>

        <div className="p-8 rounded-3xl border border-white/15 bg-[#0f0e12] shadow-2xl space-y-6">
          {submitted ? (
            <div className="p-6 rounded-2xl border border-[#e8c98a]/40 bg-[#e8c98a]/10 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-[#e8c98a] mx-auto" />
              <h3 className="text-xl font-bold text-white uppercase">Demande transmise avec succès !</h3>
              <p className="text-xs text-white/70">
                L'équipe Bryan Cars étudie votre dossier et vous recontactera sous 24 à 48 heures.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitQuote} className="space-y-4">
              {formError && (
                <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-xs font-medium">
                  {formError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">Prénom *</label>
                  <input
                    className="w-full px-4 py-3 bg-black/60 border border-white/15 rounded-xl text-sm text-white focus:border-[#e8c98a] focus:outline-none"
                    placeholder="Jean"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">Nom *</label>
                  <input
                    className="w-full px-4 py-3 bg-black/60 border border-white/15 rounded-xl text-sm text-white focus:border-[#e8c98a] focus:outline-none"
                    placeholder="Dupont"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">Email *</label>
                  <input
                    className="w-full px-4 py-3 bg-black/60 border border-white/15 rounded-xl text-sm text-white focus:border-[#e8c98a] focus:outline-none"
                    type="email"
                    placeholder="jean.dupont@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">Téléphone *</label>
                  <input
                    className="w-full px-4 py-3 bg-black/60 border border-white/15 rounded-xl text-sm text-white focus:border-[#e8c98a] focus:outline-none"
                    placeholder="06 12 34 56 78"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">Modèle du véhicule</label>
                  <input
                    className="w-full px-4 py-3 bg-black/60 border border-white/15 rounded-xl text-sm text-white focus:border-[#e8c98a] focus:outline-none"
                    placeholder="Ex: Porsche 911 / Audi RS6"
                    value={form.vehicleModel}
                    onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">Immatriculation (optionnel)</label>
                  <input
                    className="w-full px-4 py-3 bg-black/60 border border-white/15 rounded-xl text-sm text-white focus:border-[#e8c98a] focus:outline-none"
                    placeholder="AA-123-AA"
                    value={form.vehiclePlate}
                    onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">Précisions ou besoins spécifiques</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 bg-black/60 border border-white/15 rounded-xl text-sm text-white focus:border-[#e8c98a] focus:outline-none"
                  placeholder="Décrivez l'état actuel de votre véhicule ou vos attentes..."
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-[#e8c98a] text-black font-bold uppercase text-sm rounded-xl hover:bg-white transition-all shadow-[0_0_25px_rgba(232,201,138,0.3)] cursor-pointer"
              >
                {submitting ? "Envoi en cours..." : "Envoyer ma demande de rendez-vous"}
              </button>
            </form>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 text-xs text-white/50">
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-[#e8c98a] transition">
              <MessageCircle className="h-4 w-4 text-[#e8c98a]" />
              <span>Contact direct via WhatsApp</span>
            </a>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-[#e8c98a]" />
              <span>Louhans (71500), Saône-et-Loire</span>
            </span>
          </div>
        </div>
      </section>

      {/* ── FOOTER DÉDIÉ ── */}
      <footer className="py-12 bg-black border-t border-white/10 text-center text-xs text-white/40 space-y-4">
        <div className="flex justify-center items-center gap-2">
          <img src="/bc-gold-logo.png" alt="BlackBox" className="h-6 w-auto opacity-70" />
          <span className="font-bold text-white/70">BLACKBOX BC — BRYAN CARS DETAILING</span>
        </div>
        <p className="max-w-md mx-auto leading-relaxed">
          Atelier de detailing haut de gamme &amp; protection céramique. Louhans, Saône-et-Loire &amp; Bresse.
        </p>
        <p className="text-[10px] text-white/20">
          Page expérimentale isolée /landing-test — Ne modifie pas la page d'accueil principale /.
        </p>
      </footer>
    </div>
  );
}
