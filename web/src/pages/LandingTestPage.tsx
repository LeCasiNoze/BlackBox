import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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
  Calendar,
  Layers,
  RotateCcw,
  Eye,
} from "lucide-react";

import {
  Segmented3DCar,
  CarExplodedOffsets,
} from "../components/landing-test/Segmented3DCar";
import { ContextualGallery } from "../components/landing-test/ContextualGallery";
import {
  ImageComparison,
  ImageComparisonImage,
  ImageComparisonSlider,
} from "../components/landing-test/ImageComparison";
import {
  StackingCards,
  StackingCardItem,
} from "../components/landing-test/StackingCards";

gsap.registerPlugin(ScrollTrigger);

const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/place/Bryan+Cars+Detailing+%E2%80%93+Nettoyage+voiture+%C3%A0+Louhans/@46.6343847,5.2423649,13z/data=!4m8!3m7!1s0x47f327b91eec4c27:0x81bd1ae9f5024543!8m2!3d46.6343847!4d5.2423649!9m1!1b1!16s%2Fg%2F11nxrbfcrd!18m1!1e1?entry=ttu&g_ep=EgoyMDI2MDcyNy4wIKXMDSoASAFQAw%3D%3D";
const WHATSAPP_URL = "https://wa.me/33649520862";

// ── COMPOSANT CAMÉRA ANIMÉE R3F (Smooth Camera Rig) ──
function CameraRig({
  cameraPos,
  targetPos,
}: {
  cameraPos: [number, number, number];
  targetPos: [number, number, number];
}) {
  const vecCam = useRef(new THREE.Vector3());
  const vecTarget = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    vecCam.current.set(...cameraPos);
    vecTarget.current.set(...targetPos);

    state.camera.position.lerp(vecCam.current, delta * 4);
    state.camera.lookAt(vecTarget.current);
  });

  return null;
}

export function LandingTestPage() {
  const sequenceRef = useRef<HTMLDivElement>(null);

  // ── ÉTATS DE LA SCÈNE 3D CONTRÔLÉS PAR GSAP SCROLLTRIGGER ──
  const [activeStage, setActiveStage] = useState(0);
  const [carRotationY, setCarRotationY] = useState(0.3);
  const [cameraPos, setCameraPos] = useState<[number, number, number]>([0, 1.5, 7.5]);
  const [targetPos, setTargetPos] = useState<[number, number, number]>([0, 0.4, 0]);
  const [explodedOffsets, setExplodedOffsets] = useState<CarExplodedOffsets>({
    front: 0,
    side: 0,
    doorOpen: 0,
    interiorOpacity: 1.0,
    rear: 0,
  });

  // ── MODALE LIGHTBOX SECTIONS ──
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // ── FORMULAIRE DE DEMANDE DE DEVIS ──
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

  // ── ORCHESTRATION GSAP SCROLLTRIGGER SUR LA TIMELINE 3D (REVERSIBLE) ──
  useEffect(() => {
    if (!sequenceRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sequenceRef.current,
          start: "top top",
          end: "+=600%",
          pin: true,
          scrub: 0.8,
          onUpdate: (self) => {
            const p = self.progress;

            // STAGE 0: INTRODUCTION (0% - 15%)
            if (p < 0.15) {
              setActiveStage(0);
              const subP = p / 0.15;
              setCarRotationY(0.3 + subP * 0.15);
              setCameraPos([0, 1.5 - subP * 0.5, 7.5 - subP * 4.1]);
              setTargetPos([0, 0.4, 0]);
              setExplodedOffsets({
                front: subP * 0.1,
                side: 0,
                doorOpen: 0,
                interiorOpacity: 1.0,
                rear: 0,
              });
            }
            // STAGE 1: FACE AVANT (15% - 40%)
            else if (p < 0.4) {
              setActiveStage(0);
              const subP = (p - 0.15) / 0.25;
              setCarRotationY(0.45 + subP * 0.2);
              setCameraPos([1.6 + subP * 0.2, 1.0, 3.4]);
              setTargetPos([0, 0.4, 1.1]);
              setExplodedOffsets({
                front: 0.6 * Math.sin(subP * Math.PI),
                side: 0,
                doorOpen: 0,
                interiorOpacity: 1.0,
                rear: 0,
              });
            }
            // STAGE 2: PROFIL ET CARROSSERIE (40% - 65%)
            else if (p < 0.65) {
              setActiveStage(1);
              const subP = (p - 0.4) / 0.25;
              setCarRotationY(0.65 + subP * 0.92); // Vers vue latérale 90°
              setCameraPos([1.8 + subP * 2.0, 1.0 + subP * 0.1, 3.4 - subP * 3.2]);
              setTargetPos([0, 0.4, 0]);
              setExplodedOffsets({
                front: 0,
                side: 0.55 * Math.sin(subP * Math.PI),
                doorOpen: 0,
                interiorOpacity: 1.0,
                rear: 0,
              });
            }
            // STAGE 3: INTÉRIEUR CONDUCTEUR (65% - 85%)
            else if (p < 0.85) {
              setActiveStage(2);
              const subP = (p - 0.65) / 0.2;
              setCarRotationY(1.57 + subP * 0.28);
              setCameraPos([3.8 - subP * 4.45, 1.1 + subP * 0.05, 0.2 + subP * 0.35]);
              setTargetPos([-0.4, 0.85, -0.15]);
              setExplodedOffsets({
                front: 0,
                side: 0,
                doorOpen: subP > 0.1 ? 0.85 * Math.sin(((subP - 0.1) / 0.9) * Math.PI) : 0,
                interiorOpacity: 1.0 - subP * 0.65, // Carrosserie à 35% d'opacité pour voir l'intérieur
                rear: 0,
              });
            }
            // STAGE 4: PARTIE ARRIÈRE (85% - 95%)
            else if (p < 0.95) {
              setActiveStage(3);
              const subP = (p - 0.85) / 0.1;
              setCarRotationY(1.85 + subP * 1.6);
              setCameraPos([-0.65 - subP * 1.55, 1.15 + subP * 0.1, 0.55 - subP * 4.05]);
              setTargetPos([0, 0.45, -1.2]);
              setExplodedOffsets({
                front: 0,
                side: 0,
                doorOpen: 0,
                interiorOpacity: 1.0,
                rear: 0.6 * Math.sin(subP * Math.PI),
              });
            }
            // STAGE 5: RÉASSEMBLAGE ET CTA FINAL (95% - 100%)
            else {
              setActiveStage(4);
              const subP = (p - 0.95) / 0.05;
              setCarRotationY(3.45 + subP * 2.83); // 360° tour complet
              setCameraPos([-2.2 + subP * 5.0, 1.25 + subP * 0.15, -3.5 + subP * 7.7]);
              setTargetPos([0, 0.4, 0]);
              setExplodedOffsets({
                front: 0,
                side: 0,
                doorOpen: 0,
                interiorOpacity: 1.0,
                rear: 0,
              });
            }
          },
        },
      });
    });

    return () => ctx.revert();
  }, []);

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
        setFormError(data.error || "Impossible d'envoyer la demande.");
      }
    } catch {
      setFormError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const stageHeadings = [
    {
      title: "01 — FACE AVANT",
      subtitle: "Impact, brillance et première impression.",
      desc: "Inspection de la calandre, du capot et des optiques sous projecteurs chirurgicales. Suppression des impacts d'insectes et rayures de laçage.",
    },
    {
      title: "02 — LA LIGNE",
      subtitle: "Corriger les défauts. Restaurer la profondeur.",
      desc: "Correction multi-passes des portières et bas de caisse. Traitement des jantes et polissage céramique des panneaux latéraux.",
    },
    {
      title: "03 — L’HABITACLE",
      subtitle: "Chaque surface mérite le même niveau d’exigence.",
      desc: "Ouverture du cockpit, dégraissage des cuirs nobles, traitement hydrophobe et nourrissage des plastiques d'origine.",
    },
    {
      title: "04 — LA SIGNATURE",
      subtitle: "Une finition impeccable, sous tous les angles.",
      desc: "Polissage du coffre, feux arrière et diffuseur. Pose du bouclier céramique CarPro 9H résistant aux intempéries.",
    },
    {
      title: "05 — LA TRANSFORMATION",
      subtitle: "Réassemblage complet & Protection finale.",
      desc: "Votre supercar prête pour la remise des clés avec certificat d'accréditation CarPro.",
    },
  ];

  const stepsMethodology = [
    { num: "01", title: "Inspection Optique 5000K", desc: "Diagnostic sous projecteurs LED haute définition." },
    { num: "02", title: "Décontamination Chimique", desc: "Lavage au shampoing neutre & Clay-bar décontaminante." },
    { num: "03", title: "Polissage 3-Passes Rupes", desc: "Suppression de 99.8% des défauts de vernis." },
    { num: "04", title: "Céramique CarPro 9H", desc: "Nano-bouclier hydrophobe permanent." },
    { num: "05", title: "Finition & Livraison", desc: "Inspection finale sous tunnel de lumière." },
  ];

  return (
    <div className="bg-[#060608] text-[#e2e8f0] font-sans selection:bg-[#e8c98a] selection:text-black min-h-screen relative overflow-x-hidden">
      {/* ── HEADER NAVIGATION FLOATING ── */}
      <header className="fixed top-4 inset-x-0 z-50 px-4 sm:px-6 max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 bg-[#0c0b0e]/85 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full shadow-2xl">
          <img src="/bc-gold-logo.png" alt="BlackBox" className="h-6 w-auto" />
          <span className="text-xs font-mono font-bold tracking-widest text-[#e8c98a]">
            INSIDE THE BLACK BOX
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 bg-[#0c0b0e]/85 backdrop-blur-xl border border-white/10 px-6 py-2 rounded-full text-xs font-semibold uppercase tracking-wider text-white/70">
          <a href="#sequence" className="hover:text-[#e8c98a] transition">Expérience 3D</a>
          <a href="#process" className="hover:text-[#e8c98a] transition">Processus</a>
          <a href="#avant-apres" className="hover:text-[#e8c98a] transition">Avant/Après</a>
          <a href="#booking" className="hover:text-[#e8c98a] transition">Réservation</a>
        </nav>

        <a
          href="#booking"
          className="inline-flex items-center gap-2 bg-[#e8c98a] text-black font-bold text-xs px-5 py-2.5 rounded-full hover:bg-white transition-all shadow-[0_0_20px_rgba(232,201,138,0.3)]"
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>PRENDRE RDV</span>
        </a>
      </header>

      {/* ── SECTION 1 — INTRODUCTION ── */}
      <section className="relative min-h-screen flex flex-col justify-between px-4 sm:px-6 pt-32 pb-12 max-w-7xl mx-auto z-10">
        <div className="space-y-6 max-w-3xl mt-12">
          <div className="inline-flex items-center gap-2 border border-[#e8c98a]/30 bg-[#e8c98a]/10 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#e8c98a]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>EXPÉRIENCE 3D CINÉMATIQUE // INSIDE THE BLACK BOX</span>
          </div>

          <h1 className="text-4xl sm:text-7xl font-extrabold uppercase tracking-tight leading-[0.95] text-white">
            ENTREZ DANS LA <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#e8c98a] to-[#99793d]">
              BLACK BOX.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-white/70 font-light max-w-xl leading-relaxed">
            Une transformation visible dans chaque détail. Découvrez l'exploration 3D haute précision de nos étapes de correction et de protection céramique.
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-4">
            <a
              href="#sequence"
              className="inline-flex items-center gap-2 bg-[#e8c98a] text-black font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-full hover:bg-white transition-all shadow-[0_0_30px_rgba(232,201,138,0.4)]"
            >
              <Eye className="h-4 w-4" />
              <span>Scroll pour inspecter</span>
            </a>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-8 text-xs font-mono text-white/50">
          <span>BRYAN CARS DETAILING — LOUHANS (71500)</span>
          <span className="animate-bounce">▼ SCROLL DOWN FOR 3D SEQUENCE</span>
        </div>
      </section>

      {/* ── SECTION 2 & SÉQUENCE 3D PINNED "INSIDE THE BLACK BOX" (500vh - 700vh) ── */}
      <section ref={sequenceRef} id="sequence" className="relative min-h-[600vh] bg-[#060608]">
        <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between p-4 sm:p-6">
          {/* Canvas WebGL 3D en arrière-plan central */}
          <div className="absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 1.5, 7.5], fov: 45 }}>
              <color attach="background" args={["#060608"]} />

              {/* Éclairage Studio Automobile */}
              <ambientLight intensity={0.35} />
              <directionalLight position={[4, 6, 4]} intensity={3.5} color="#e8c98a" />
              <directionalLight position={[-5, 3, -3]} intensity={1.8} color="#38bdf8" />
              <pointLight position={[0, 4, 2]} intensity={4.0} color="#ffffff" />

              {/* Modèle 3D Segmenté avec Décomposition & Matériaux PBR */}
              <Segmented3DCar rotationY={carRotationY} exploded={explodedOffsets} />

              {/* Contrôleur de Caméra fluide */}
              <CameraRig cameraPos={cameraPos} targetPos={targetPos} />
            </Canvas>
          </div>

          {/* HUD d'Information Supérieur */}
          <div className="relative z-10 max-w-7xl mx-auto w-full flex items-center justify-between pt-16">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full">
              <span className="h-2 w-2 rounded-full bg-[#e8c98a] animate-pulse" />
              <span className="text-[10px] font-mono text-[#e8c98a] font-bold">
                TÉLÉMÉTRIE 3D // STAGE 0{activeStage + 1}
              </span>
            </div>

            <span className="text-xs font-mono text-white/50 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full">
              ZONE ACTIF: {stageHeadings[activeStage].title}
            </span>
          </div>

          {/* Superposition Interactive : Contenus & Galeries Contextuelles par Zone */}
          <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center pb-6">
            {/* Côté Gauche : Titre et Description de la Zone */}
            <div className="space-y-4 bg-black/70 backdrop-blur-xl border border-white/15 p-6 rounded-3xl max-w-lg shadow-2xl">
              <span className="text-xs font-mono text-[#e8c98a] font-bold uppercase tracking-widest">
                {stageHeadings[activeStage].subtitle}
              </span>
              <h3 className="text-2xl sm:text-4xl font-extrabold uppercase text-white">
                {stageHeadings[activeStage].title}
              </h3>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                {stageHeadings[activeStage].desc}
              </p>
            </div>

            {/* Côté Droit : Dossier Photos de la Zone (Seulement les photos correspondant à la zone!) */}
            <div className="flex justify-end">
              <ContextualGallery
                stageIndex={activeStage}
                onOpenLightbox={(url) => setLightboxUrl(url)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4 — PROCESSUS EN 5 ÉTAPES (STACKING CARDS) ── */}
      <section id="process" className="py-24 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#e8c98a]">
            MÉTHODOLOGIE ATELIER
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold uppercase text-white">
            LE PROTOCOLE EN 5 ÉTAPES
          </h2>
        </div>

        <StackingCards totalCards={stepsMethodology.length} className="space-y-6">
          {stepsMethodology.map((step, i) => (
            <StackingCardItem index={i} key={step.num}>
              <div className="p-6 sm:p-8 rounded-3xl border border-white/15 bg-[#0f0e12] flex items-start gap-6 shadow-2xl">
                <span className="text-4xl font-mono font-black text-[#e8c98a]">
                  {step.num}
                </span>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold uppercase text-white">
                    {step.title}
                  </h3>
                  <p className="text-xs text-white/60 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            </StackingCardItem>
          ))}
        </StackingCards>
      </section>

      {/* ── SECTION 5 — AVANT / APRÈS (IMAGE COMPARISON SLIDER 21ST.DEV) ── */}
      <section id="avant-apres" className="py-24 px-4 sm:px-6 max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#e8c98a]">
            DÉMONSTRATION TRANSFORMATION
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold uppercase text-white">
            PEINTURE OXYDÉE vs POLISSAGE CÉRAMIQUE
          </h2>
        </div>

        <div className="rounded-3xl border border-white/15 overflow-hidden shadow-2xl">
          <ImageComparison className="aspect-[16/9] w-full">
            <ImageComparisonImage
              src="/corvette_40s.jpg"
              alt="Après traitement miroir"
              position="right"
            />
            <ImageComparisonImage
              src="/corvette_5s.jpg"
              alt="Avant traitement"
              position="left"
            />
            <ImageComparisonSlider className="w-1 bg-[#e8c98a] shadow-[0_0_15px_#e8c98a]">
              <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black bg-[#e8c98a] flex items-center justify-center shadow-2xl text-black font-bold text-xs">
                ◄ ►
              </div>
            </ImageComparisonSlider>
          </ImageComparison>
        </div>
      </section>

      {/* ── SECTION 9 — CTA FINAL & FORMULAIRE DE RÉSORTION DE VIS (CONNECTÉ API) ── */}
      <section id="booking" className="py-24 px-4 sm:px-6 max-w-3xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#e8c98a]">
            RÉSERVATION &amp; DEVIS
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold uppercase text-white">
            VOTRE VÉHICULE MÉRITE L'EXCELLENCE.
          </h2>
          <p className="text-xs sm:text-sm text-white/60">
            Confiez-nous chaque détail. Nous nous occupons du reste.
          </p>
        </div>

        <div className="p-8 rounded-3xl border border-white/15 bg-[#0d0c10] shadow-2xl space-y-6">
          {submitted ? (
            <div className="p-6 rounded-2xl border border-[#e8c98a]/40 bg-[#e8c98a]/10 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-[#e8c98a] mx-auto" />
              <h3 className="text-xl font-bold text-white uppercase">Demande transmise avec succès !</h3>
              <p className="text-xs text-white/70">
                L'équipe Bryan Cars étudie votre véhicule et vous recontacte sous 24 à 48h.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitQuote} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-xs">
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
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">Modèle du véhicule</label>
                <input
                  className="w-full px-4 py-3 bg-black/60 border border-white/15 rounded-xl text-sm text-white focus:border-[#e8c98a] focus:outline-none"
                  placeholder="Ex: Porsche 911 GT3 / Corvette"
                  value={form.vehicleModel}
                  onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-[#e8c98a] text-black font-bold uppercase text-xs tracking-wider rounded-xl hover:bg-white transition-all shadow-[0_0_25px_rgba(232,201,138,0.3)] cursor-pointer"
              >
                {submitting ? "Traitement..." : "Valider ma demande de rendez-vous"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* MODALE LIGHTBOX PHOTO */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setLightboxUrl(null)}
        >
          <img src={lightboxUrl} alt="Agrandissement" className="max-h-[90vh] max-w-full rounded-2xl border border-white/20 object-contain shadow-2xl" />
        </div>
      )}
    </div>
  );
}
