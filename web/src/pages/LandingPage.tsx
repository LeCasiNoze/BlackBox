import React from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Award,
  CheckCircle2,
  ArrowRight,
  Star,
  ChevronLeft,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  X,
  UserCheck,
  UploadCloud,
} from "lucide-react";

interface SignupForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  clientType: "bbx" | "pro" | "data";
  isFounder: boolean;
  address: string;
  postalCode: string;
  city: string;
  vehicleModel: string;
  vehiclePlate: string;
  quoteDescription: string;
}

const initialForm: SignupForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  clientType: "bbx",
  isFounder: false,
  address: "",
  postalCode: "",
  city: "",
  vehicleModel: "",
  vehiclePlate: "",
  quoteDescription: "",
};

type ShowcaseCategory = "all" | "interieur" | "polissage" | "protection";
type GalleryTab = "beforeafter" | "finished";

interface BeforeAfterPair {
  label: string;
  before: string;
  after: string;
}

interface ShowcaseItem {
  id: string;
  title: string;
  category: ShowcaseCategory;
  categoryLabel: string;
  vehicle: string;
  description: string;
  tag: string;
  coverImage: string;
  beforeAfterPairs: BeforeAfterPair[];
  finishedPhotos: string[];
}

interface VideoReelExample {
  id: string;
  title: string;
  subtitle: string;
  src: string;
  poster: string;
  badge: string;
}

// 3 Vidéos Réelles Traitées avec Son Origine (Coupées 4s avant la fin)
const VIDEO_REELS: VideoReelExample[] = [
  {
    id: "reel-1",
    title: "Vidéo 1",
    subtitle: "",
    src: "/reel-1.mp4",
    poster: "/tiktok_10s.jpg",
    badge: "VIDÉO 1",
  },
  {
    id: "reel-2",
    title: "Vidéo 2",
    subtitle: "",
    src: "/reel-2.mp4",
    poster: "/corvette_5s.jpg",
    badge: "VIDÉO 2",
  },
  {
    id: "reel-3",
    title: "Vidéo 3",
    subtitle: "",
    src: "/reel-3.mp4",
    poster: "/tiktok_30s.jpg",
    badge: "VIDÉO 3",
  },
];

// PROJETS RÉELS DE LA GALERIE VITRINE
const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: "peugeot-208-interior",
    title: "Nettoyage Extrême Habitacle & Dégraissage i-Cockpit",
    category: "interieur",
    categoryLabel: "Soin Habitacle Extrême",
    vehicle: "Peugeot 208 GT i-Cockpit",
    description:
      "Rénovation complète d'un habitacle entièrement souillé par la boue. Dépoussiérage, shampouinage moquettes & sièges, dégraissage du volant et rénovation des plastiques.",
    tag: "Avant / Après Choc",
    coverImage: "/peugeot_208_clean_after.jpg",
    beforeAfterPairs: [
      {
        label: "Poste de Conduite & i-Cockpit (Boue vs Neuf)",
        before: "/peugeot_208_muddy_before.jpg",
        after: "/peugeot_208_clean_after.jpg",
      },
    ],
    finishedPhotos: ["/peugeot_208_clean_after.jpg"],
  },
  {
    id: "vw-golf-gti-interior",
    title: "Soin Habitacle Complexe & Shampouinage Tartan",
    category: "interieur",
    categoryLabel: "Detailing Intérieur GT",
    vehicle: "Volkswagen Golf 7 GTI",
    description:
      "Rénovation intégrale des sièges tissu Tartan, dégraissage du volant cuir surpiqué rouge et brossage haute précision des moquettes avec traçage de lignes d'atelier.",
    tag: "Finition Atelier BC",
    coverImage: "/showcase/vw_golf_gti_front_after.png",
    beforeAfterPairs: [
      {
        label: "Poste de Conduite & Volant GTI",
        before: "/showcase/vw_golf_gti_front_before.png",
        after: "/showcase/vw_golf_gti_front_after.png",
      },
      {
        label: "Places Arrière & Tapis Tartan",
        before: "/showcase/vw_golf_gti_rear_before.png",
        after: "/showcase/vw_golf_gti_rear_after.png",
      },
    ],
    finishedPhotos: [
      "/showcase/vw_golf_gti_front_after.png",
      "/showcase/vw_golf_gti_rear_after.png",
    ],
  },
  {
    id: "chrysler-crossfire-full",
    title: "Polissage Miroir Capot & Rénovation Cuir Rouge",
    category: "polissage",
    categoryLabel: "Polissage & Rénovation",
    vehicle: "Chrysler Crossfire Black Metallic",
    description:
      "Correction complète de peinture noire vernie avec élimination des micro-rayures (effet miroir), rénovation intégrale du cuir rouge mat et protection synthétique.",
    tag: "Rénovation Complète",
    coverImage: "/showcase/chrysler_crossfire_rear_finished.png",
    beforeAfterPairs: [
      {
        label: "Polissage Miroir Capot Noir Metallic",
        before: "/showcase/chrysler_crossfire_hood_before.png",
        after: "/showcase/chrysler_crossfire_hood_after.png",
      },
      {
        label: "Poste Conducteur Cuir Rouge",
        before: "/showcase/chrysler_crossfire_interior_driver_before.png",
        after: "/showcase/chrysler_crossfire_interior_driver_after.png",
      },
      {
        label: "Poste Passager Cuir Rouge",
        before: "/showcase/chrysler_crossfire_interior_pass_before.png",
        after: "/showcase/chrysler_crossfire_interior_pass_after.png",
      },
    ],
    finishedPhotos: [
      "/showcase/chrysler_crossfire_rear_finished.png",
      "/showcase/chrysler_crossfire_hood_after.png",
      "/showcase/chrysler_crossfire_interior_driver_after.png",
      "/showcase/chrysler_crossfire_interior_pass_after.png",
    ],
  },
  {
    id: "corvette-c8",
    title: "Correction Peinture & Traitement Céramique 9H",
    category: "protection",
    categoryLabel: "Protection Céramique 9H",
    vehicle: "Chevrolet Corvette C8 Stingray",
    description:
      "Correction complète des micro-rayures, polissage 3 passes et pose d'une protection céramique bi-couche haute résistance.",
    tag: "Projet Phare BC",
    coverImage: "/corvette_5s.jpg",
    beforeAfterPairs: [
      {
        label: "Correction Vernis & Polissage",
        before: "/corvette_20s.jpg",
        after: "/corvette_5s.jpg",
      },
    ],
    finishedPhotos: ["/corvette_5s.jpg", "/corvette_40s.jpg"],
  },
  {
    id: "bmw-m4-ppf",
    title: "Pose Film de Protection PPF & Céramique",
    category: "protection",
    categoryLabel: "Film PPF Auto-Cicatrisant",
    vehicle: "BMW M4 Competition",
    description:
      "Pose d'un film PPF transparent auto-cicatrisant + traitement céramique haute déperlance.",
    tag: "Protection Ultime",
    coverImage: "/corvette_60s.jpg",
    beforeAfterPairs: [
      {
        label: "Protection Face Avant & Rétroviseurs",
        before: "/corvette_20s.jpg",
        after: "/corvette_60s.jpg",
      },
    ],
    finishedPhotos: ["/corvette_60s.jpg", "/hero-bg.png"],
  },
];

export function LandingPage() {
  const [form, setForm] = React.useState<SignupForm>(initialForm);
  const [selectedPhotos, setSelectedPhotos] = React.useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = React.useState<string[]>([]);
  const [code, setCode] = React.useState("");
  const [step, setStep] = React.useState<"form" | "code" | "ready">("form");
  const [portalUrl, setPortalUrl] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);

  // Modal Accéder à mon Espace par Email
  const [portalLookupModalOpen, setPortalLookupModalOpen] = React.useState(false);
  const [lookupEmail, setLookupEmail] = React.useState("");
  const [lookupBusy, setLookupBusy] = React.useState(false);
  const [lookupError, setLookupError] = React.useState<string | null>(null);

  // Navigation Mobile
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Lightbox Modal & Options de Galerie
  const [activeShowcase, setActiveShowcase] = React.useState<ShowcaseItem | null>(null);
  const [activeGalleryTab, setActiveGalleryTab] = React.useState<GalleryTab>("beforeafter");
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [selectedCategory, setSelectedCategory] = React.useState<ShowcaseCategory>("all");

  // State Vidéo 9:16 Vertical Reel Player
  const [activeReelIndex, setActiveReelIndex] = React.useState(0);

  const [reviews, setReviews] = React.useState<
    Array<{ id: number; author: string; rating: number; comment: string; vehicleModel: string | null }>
  >([]);
  const signupCardRef = React.useRef<HTMLDivElement | null>(null);

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

  async function handleFindPortal() {
    if (!lookupEmail.trim()) return;
    setLookupBusy(true);
    setLookupError(null);
    try {
      const res = await fetch("/api/client/public/find-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: lookupEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok && data.slug) {
        window.location.href = `/card/${data.slug}`;
      } else {
        setLookupError(data.error || "Aucun espace trouvé pour cet email.");
      }
    } catch {
      setLookupError("Erreur de connexion au serveur.");
    } finally {
      setLookupBusy(false);
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newFiles = [...selectedPhotos, ...files].slice(0, 5);
    setSelectedPhotos(newFiles);

    const previews = newFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreviews(previews);
  }

  function removePhoto(index: number) {
    const newFiles = selectedPhotos.filter((_, i) => i !== index);
    setSelectedPhotos(newFiles);
    const previews = newFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreviews(previews);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptedTerms) {
      setError("Veuillez accepter les conditions d'utilisation.");
      return;
    }
    setBusy(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("firstName", form.firstName);
      formData.append("lastName", form.lastName);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("clientType", form.clientType);
      formData.append("isFounder", form.isFounder ? "true" : "false");
      formData.append("address", form.address);
      formData.append("postalCode", form.postalCode);
      formData.append("city", form.city);
      formData.append("vehicleModel", form.vehicleModel);
      formData.append("vehiclePlate", form.vehiclePlate);
      formData.append("quoteDescription", form.quoteDescription);

      selectedPhotos.forEach((file) => {
        formData.append("photos", file);
      });

      const response = await fetch("/api/client/signup/request-code", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Impossible d'envoyer la demande.");
      }

      setStep("code");
    } catch (err: any) {
      setError(err.message || "Erreur de traitement.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/client/signup/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          code,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Code invalide.");
      }

      setPortalUrl(data.portalUrl || `/card/${data.slug}`);
      setStep("ready");
    } catch (err: any) {
      setError(err.message || "Code incorrect.");
    } finally {
      setBusy(false);
    }
  }

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  const activeReel = VIDEO_REELS[activeReelIndex];

  const filteredItems =
    selectedCategory === "all"
      ? SHOWCASE_ITEMS
      : SHOWCASE_ITEMS.filter((item) => item.category === selectedCategory);

  const fallbackReviews = [
    {
      id: 101,
      author: "Alexandre D.",
      rating: 5,
      comment: "Prestation de polissage et céramique tout simplement bluffante sur ma carrosserie à Louhans. Travail d'une précision incroyable !",
      vehicleModel: "Chevrolet Corvette C8",
    },
    {
      id: 102,
      author: "Matthieu B.",
      rating: 5,
      comment: "Habitacle entièrement nettoyé après plusieurs mois de salissure. Le résultat sur la Peugeot 208 est spectaculaire, c'est remis à neuf !",
      vehicleModel: "Peugeot 208 GT",
    },
    {
      id: 103,
      author: "Guillaume P.",
      rating: 5,
      comment: "Traitement intérieur et moquettes sur ma Golf GTI. Volant dégraissé et moquettes impeccables. Je recommande Bryan Cars les yeux fermés.",
      vehicleModel: "VW Golf 7 GTI",
    },
  ];

  const displayedReviews = reviews.length > 0 ? reviews : fallbackReviews;

  return (
    <div className="min-h-screen bg-[#070505] text-[#f1ede6] font-sans antialiased selection:bg-[#e8c98a] selection:text-black">
      {/* ── HEADER FLOATING PREMIUM ── */}
      <header className="fixed top-0 inset-x-0 z-40 bg-[#070505]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/bc-gold-logo.png" alt="Bryan Cars Logo" className="h-10 w-auto" />
            <div className="flex flex-col">
              <span className="font-mono text-sm font-black tracking-widest text-[#e8c98a]">
                BRYAN CARS
              </span>
              <span className="text-[9px] font-mono tracking-wider text-white/50">
                BLACKBOX DETAILING
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-white/80">
            <button className="hover:text-[#e8c98a] transition-colors cursor-pointer" onClick={() => scrollToSection("tarifs")}>
              Services &amp; Tarifs
            </button>
            <button className="hover:text-[#e8c98a] transition-colors cursor-pointer" onClick={() => scrollToSection("vitrine")}>
              Réalisations
            </button>
            <button className="hover:text-[#e8c98a] transition-colors cursor-pointer" onClick={() => scrollToSection("avis")}>
              Avis Clients
            </button>
            <Link to="/landing-test" className="text-[#e8c98a] font-mono hover:underline flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> PROTOTYPE 3D
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              className="hidden sm:inline-flex items-center gap-2 border border-[#e8c98a]/40 bg-[#e8c98a]/10 hover:bg-[#e8c98a]/20 text-[#e8c98a] text-xs font-bold px-4 py-2 rounded-full transition-all cursor-pointer"
              onClick={() => setPortalLookupModalOpen(true)}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>MON ESPACE</span>
            </button>

            <button
              className="bg-[#e8c98a] text-black font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-full hover:bg-white transition-all shadow-[0_0_20px_rgba(232,201,138,0.3)] cursor-pointer"
              onClick={() => scrollToSection("devis")}
            >
              DEVIS EN LIGNE
            </button>

            <button
              className="md:hidden p-2 text-white/80 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <SlidersHorizontal className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#070505] border-b border-white/10 px-4 py-4 space-y-3">
            <button className="block w-full text-left py-2 text-sm font-bold uppercase text-white/80" onClick={() => scrollToSection("tarifs")}>
              Services &amp; Tarifs
            </button>
            <button className="block w-full text-left py-2 text-sm font-bold uppercase text-white/80" onClick={() => scrollToSection("vitrine")}>
              Réalisations
            </button>
            <button className="block w-full text-left py-2 text-sm font-bold uppercase text-white/80" onClick={() => scrollToSection("avis")}>
              Avis Clients
            </button>
            <button className="block w-full text-left py-2 text-sm font-bold uppercase text-[#e8c98a]" onClick={() => setPortalLookupModalOpen(true)}>
              Accéder à mon Espace Client
            </button>
          </div>
        )}
      </header>

      {/* ── HERO SECTION IMPACTANTE ── */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 z-0">
          <img src="/hero-bg.png" alt="Atelier Bryan Cars" className="w-full h-full object-cover opacity-20 filter blur-sm" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#070505] via-[#070505]/90 to-[#070505]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 border border-[#e8c98a]/30 bg-[#e8c98a]/10 px-4 py-1.5 rounded-full text-xs font-mono text-[#e8c98a] font-bold">
            <Award className="h-3.5 w-3.5" />
            <span>CENTRE DE DETAILING &amp; POSEUR ACCRÉDITÉ CARPRO CÉRAMIQUE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-[0.95] text-white">
            RÉNOVATION PEINTURE &amp; <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#e8c98a] to-[#b38f48]">
              PROTECTION CÉRAMIQUE 9H
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-white/70 max-w-2xl mx-auto font-light leading-relaxed">
            Atelier fixe &amp; Service à domicile — Louhans (71500), Saône-et-Loire &amp; Bresse.
            Sublimez votre véhicule avec nos traitements sur-mesure pour supercars, sportives et véhicules passion.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              className="bg-[#e8c98a] text-black font-extrabold text-xs uppercase tracking-widest px-8 py-4 rounded-full hover:bg-white transition-all shadow-[0_0_30px_rgba(232,201,138,0.4)] flex items-center gap-2 cursor-pointer"
              onClick={() => scrollToSection("devis")}
            >
              <span>DEMANDER UN DEVIS GRATUIT</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              className="border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest px-8 py-4 rounded-full transition-all cursor-pointer"
              onClick={() => scrollToSection("vitrine")}
            >
              DÉCOUVRIR LES RÉALISATIONS
            </button>
          </div>
        </div>
      </section>

      {/* ── SECTION VIDÉO SHOWCASE REELS ── */}
      <section className="py-16 bg-[#0a0808] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-10">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#e8c98a]">
              EN ACTION À L'ATELIER
            </span>
            <h2 className="text-2xl sm:text-4xl font-black uppercase text-white">
              EXTRAITS VIDÉOS DU TRAVAIL BRYAN CARS
            </h2>
            <p className="text-xs text-white/60">
              Sélectionnez une vidéo ci-dessous pour visionner nos étapes de polissage et soin.
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-center gap-2">
              {VIDEO_REELS.map((reel, idx) => (
                <button
                  key={reel.id}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full border transition-all cursor-pointer ${
                    activeReelIndex === idx
                      ? "bg-[#e8c98a] text-black border-[#e8c98a]"
                      : "bg-white/5 text-white/70 border-white/10 hover:border-white/30"
                  }`}
                  onClick={() => setActiveReelIndex(idx)}
                >
                  {reel.badge}
                </button>
              ))}
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg sm:text-2xl font-black uppercase text-white">
                {activeReel.title}
              </h3>
            </div>

            {/* Cadre Spécifique Vertical 9:16 (Smartphones / Reels) */}
            <div className="relative max-w-[320px] aspect-[9/16] mx-auto rounded-3xl overflow-hidden shadow-2xl border-2 border-[#e8c98a]/40 bg-black">
              <video
                key={activeReel.src}
                controls
                loop
                playsInline
                className="w-full h-full object-cover bg-black"
                poster={activeReel.poster}
                src={activeReel.src}
              />
              <span className="absolute top-3 left-3 bg-[#e8c98a] text-black text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow pointer-events-none">
                BRYAN CARS REEL
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── GALERIE VITRINE RESTRUCTURÉE PAR PROJETS VÉHICULES ── */}
      <section className="py-20 bg-[#070505] border-b border-white/10" id="vitrine">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-10">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#e8c98a]">
              GALERIE DES RÉALISATIONS
            </span>
            <h2 className="text-2xl sm:text-5xl font-black uppercase text-white">
              NOS TRANSFORMATIONS ATELIER
            </h2>
            <p className="text-xs sm:text-sm text-white/60">
              Sélectionnez un projet pour explorer la transformation Avant/Après et la finition.
            </p>
          </div>

          {/* Filtres par Catégorie de Prestation */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-12">
            {[
              { id: "all", label: "TOUS LES PROJETS" },
              { id: "interieur", label: "SOIN INTÉRIEUR" },
              { id: "polissage", label: "POLISSAGE & RÉNOVATION" },
              { id: "protection", label: "PROTECTION CÉRAMIQUE & PPF" },
            ].map((cat) => (
              <button
                key={cat.id}
                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border rounded-full cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-[#e8c98a] text-black border-[#e8c98a] shadow-[0_0_15px_rgba(232,201,138,0.3)]"
                    : "bg-[#120e0e] text-white/70 border-white/10 hover:border-white/30 hover:text-white"
                }`}
                onClick={() => setSelectedCategory(cat.id as ShowcaseCategory)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grille des Cartes Projets */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group bg-[#110e0e] border border-white/10 rounded-2xl overflow-hidden hover:border-[#e8c98a]/60 transition-all duration-300 flex flex-col cursor-pointer shadow-xl"
                onClick={() => {
                  setActiveShowcase(item);
                  setActiveGalleryTab("beforeafter");
                  setActiveImageIndex(0);
                }}
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-black/60">
                  <img
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-95 group-hover:brightness-100"
                    src={item.coverImage}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70 group-hover:opacity-40 transition-opacity" />

                  <span className="absolute top-3 left-3 bg-[#e8c98a] text-black text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded">
                    {item.tag}
                  </span>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 backdrop-blur-[2px]">
                    <span className="px-4 py-2 border border-white text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 bg-black/70 rounded-full">
                      <Eye className="h-4 w-4 text-[#e8c98a]" /> EXPLORER LE PROJET
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#e8c98a]">
                      {item.categoryLabel}
                    </span>
                    <h3 className="text-base font-bold text-white uppercase leading-snug">
                      {item.vehicle}
                    </h3>
                    <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-[#e8c98a]">
                    <span>VOIR LA TRANSFORMATION</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIGHTBOX MODAL CLAIR ET INTUITIF POUR UN PROJET ── */}
      {activeShowcase && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
          <div className="relative max-w-4xl w-full bg-[#110e0e] border border-white/20 rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            {/* Header du Modal */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#e8c98a]">
                  {activeShowcase.categoryLabel}
                </span>
                <h3 className="text-lg sm:text-2xl font-black uppercase text-white">
                  {activeShowcase.vehicle}
                </h3>
              </div>
              <button
                className="p-2 text-white/60 hover:text-white rounded-full bg-white/5 hover:bg-white/10 cursor-pointer"
                onClick={() => setActiveShowcase(null)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Contenu du Modal */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
              {/* Sélecteur des Onglets (Avant/Après vs Vue Finale) */}
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <button
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer ${
                    activeGalleryTab === "beforeafter"
                      ? "bg-[#e8c98a] text-black"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => setActiveGalleryTab("beforeafter")}
                >
                  TRANSFORMATION AVANT / APRÈS ({activeShowcase.beforeAfterPairs.length})
                </button>

                {activeShowcase.finishedPhotos.length > 0 && (
                  <button
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer ${
                      activeGalleryTab === "finished"
                        ? "bg-[#e8c98a] text-black"
                        : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                    onClick={() => {
                      setActiveGalleryTab("finished");
                      setActiveImageIndex(0);
                    }}
                  >
                    VUE D'ENSEMBLE FINIE ({activeShowcase.finishedPhotos.length})
                  </button>
                )}
              </div>

              {/* Contenu Onglet Avant/Après */}
              {activeGalleryTab === "beforeafter" ? (
                <div className="space-y-6">
                  {activeShowcase.beforeAfterPairs.map((pair, idx) => (
                    <div key={idx} className="space-y-2">
                      <h4 className="text-xs font-mono font-bold text-[#e8c98a] uppercase tracking-wider">
                        {pair.label}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-rose-500/50 shadow-xl bg-black">
                          <img alt="Avant" className="w-full h-full object-cover" src={pair.before} />
                          <span className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow">
                            AVANT
                          </span>
                        </div>
                        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-emerald-500/50 shadow-xl bg-black">
                          <img alt="Après" className="w-full h-full object-cover" src={pair.after} />
                          <span className="absolute top-3 right-3 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow">
                            APRÈS
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Contenu Onglet Photos Finies */
                <div className="space-y-4">
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-black rounded-2xl border border-white/15 shadow-2xl">
                    <img
                      alt={activeShowcase.title}
                      className="w-full h-full object-cover"
                      src={activeShowcase.finishedPhotos[activeImageIndex] || activeShowcase.coverImage}
                    />

                    {activeShowcase.finishedPhotos.length > 1 && (
                      <>
                        <button
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-black/70 text-white hover:bg-[#e8c98a] hover:text-black rounded-full transition-colors cursor-pointer"
                          onClick={() =>
                            setActiveImageIndex((prev) =>
                              prev === 0 ? activeShowcase.finishedPhotos.length - 1 : prev - 1
                            )
                          }
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-black/70 text-white hover:bg-[#e8c98a] hover:text-black rounded-full transition-colors cursor-pointer"
                          onClick={() =>
                            setActiveImageIndex((prev) =>
                              prev === activeShowcase.finishedPhotos.length - 1 ? 0 : prev + 1
                            )
                          }
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Description & Action CTA */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <h4 className="text-base font-bold text-white uppercase">{activeShowcase.title}</h4>
                <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                  {activeShowcase.description}
                </p>
                <button
                  className="w-full py-4 bg-[#e8c98a] text-black font-extrabold text-xs uppercase tracking-widest rounded-xl hover:bg-white transition-all shadow-[0_0_25px_rgba(232,201,138,0.3)] cursor-pointer"
                  onClick={() => {
                    setActiveShowcase(null);
                    scrollToSection("devis");
                  }}
                >
                  OBTENIR UN DEVIS POUR VOTRE VÉHICULE →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION AVIS CLIENTS GOOGLE MAPS ── */}
      <section className="py-16 sm:py-24 bg-[#0a0808] border-b border-white/10" id="avis">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#e8c98a] mb-1">
                <Star className="h-4 w-4 fill-current" /> NOTE 5.0 / 5 SUR GOOGLE MAPS
              </div>
              <h2 className="text-2xl sm:text-4xl font-black uppercase text-white">
                L'AVIS DE NOS CLIENTS PASSIONNÉS
              </h2>
            </div>
          </div>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            {displayedReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-[#110e0e] border border-white/10 p-6 rounded-2xl space-y-4 shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-[#e8c98a]">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-white/80 italic leading-relaxed">
                    "{rev.comment}"
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{rev.author}</span>
                  {rev.vehicleModel && (
                    <span className="text-[10px] font-mono text-[#e8c98a] font-bold">
                      {rev.vehicleModel}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION RÉSORTION DE DEVIS & INSCRIPTION (FORMULAIRE) ── */}
      <section className="py-20 bg-[#070505]" id="devis">
        <div className="max-w-3xl mx-auto px-4 sm:px-6" ref={signupCardRef}>
          <div className="text-center space-y-3 mb-10">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#e8c98a]">
              DEMANDE DE DEVIS &amp; PREPARATION
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase text-white">
              OBTENIR VOTRE ESTIMATION
            </h2>
            <p className="text-xs sm:text-sm text-white/60">
              Remplissez les informations ci-dessous pour recevoir votre devis sous 24 à 48h.
            </p>
          </div>

          <div className="bg-[#110e0e] border border-white/15 p-6 sm:p-10 rounded-3xl shadow-2xl space-y-6">
            {step === "form" && (
              <form onSubmit={handleFormSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-200 text-xs">
                    {error}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-white/50 mb-1">
                      Prénom *
                    </label>
                    <input
                      required
                      className="w-full px-4 py-3 bg-black/60 border border-white/15 rounded-xl text-sm text-white focus:border-[#e8c98a] focus:outline-none"
                      placeholder="Jean"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-white/50 mb-1">
                      Nom *
                    </label>
                    <input
                      required
                      className="w-full px-4 py-3 bg-black/60 border border-white/15 rounded-xl text-sm text-white focus:border-[#e8c98a] focus:outline-none"
                      placeholder="Dupont"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-white/50 mb-1">
                      Email *
                    </label>
                    <input
                      required
                      type="email"
                      className="w-full px-4 py-3 bg-black/60 border border-white/15 rounded-xl text-sm text-white focus:border-[#e8c98a] focus:outline-none"
                      placeholder="jean.dupont@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-white/50 mb-1">
                      Téléphone *
                    </label>
                    <input
                      required
                      className="w-full px-4 py-3 bg-black/60 border border-white/15 rounded-xl text-sm text-white focus:border-[#e8c98a] focus:outline-none"
                      placeholder="06 12 34 56 78"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-white/50 mb-1">
                    Modèle &amp; Marque du véhicule
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-black/60 border border-white/15 rounded-xl text-sm text-white focus:border-[#e8c98a] focus:outline-none"
                    placeholder="Ex: Porsche 911 / Peugeot 208 / Corvette C8"
                    value={form.vehicleModel}
                    onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-white/50 mb-1">
                    Description de la prestation souhaitée
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 bg-black/60 border border-white/15 rounded-xl text-sm text-white focus:border-[#e8c98a] focus:outline-none resize-none"
                    placeholder="Précisez votre besoin (Lavage extrême, Polissage, Céramique 9H, Intérieur...)"
                    value={form.quoteDescription}
                    onChange={(e) => setForm({ ...form, quoteDescription: e.target.value })}
                  />
                </div>

                {/* Upload de photos du véhicule */}
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-white/50 mb-2">
                    Ajouter des photos du véhicule (Max 5)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/15 rounded-xl text-xs font-bold text-white hover:bg-white/10 cursor-pointer">
                      <UploadCloud className="h-4 w-4 text-[#e8c98a]" />
                      <span>SÉLECTIONNER FICHIERS</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoChange}
                      />
                    </label>
                    <span className="text-xs text-white/50 font-mono">
                      {selectedPhotos.length} photo(s) sélectionnée(s)
                    </span>
                  </div>

                  {photoPreviews.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {photoPreviews.map((src, i) => (
                        <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/20">
                          <img src={src} alt="Aperçu" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            className="absolute top-0.5 right-0.5 p-0.5 bg-black/80 text-white rounded-full hover:bg-rose-600"
                            onClick={() => removePhoto(i)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 rounded border-white/20 bg-black text-[#e8c98a] focus:ring-0"
                  />
                  <label htmlFor="terms" className="text-xs text-white/70 leading-relaxed cursor-pointer">
                    J'accepte d'être recontacté(e) par l'équipe Bryan Cars pour l'établissement de mon devis sur-mesure.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-4 bg-[#e8c98a] text-black font-extrabold uppercase text-xs tracking-widest rounded-xl hover:bg-white transition-all shadow-[0_0_25px_rgba(232,201,138,0.3)] cursor-pointer"
                >
                  {busy ? "TRANSMISSION EN COURS..." : "RECEVOIR MON CODE D'ACCÈS & DEVIS →"}
                </button>
              </form>
            )}

            {step === "code" && (
              <form onSubmit={handleVerifyCode} className="space-y-4 text-center">
                <CheckCircle2 className="h-12 w-12 text-[#e8c98a] mx-auto" />
                <h3 className="text-xl font-bold uppercase text-white">Vérification de votre Email</h3>
                <p className="text-xs text-white/70">
                  Un code de vérification à 6 chiffres a été envoyé à <strong className="text-[#e8c98a]">{form.email}</strong>.
                </p>

                {error && (
                  <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-200 text-xs">
                    {error}
                  </div>
                )}

                <input
                  required
                  maxLength={6}
                  className="w-48 mx-auto px-4 py-3 bg-black/80 border border-[#e8c98a] rounded-xl text-center text-xl font-mono tracking-widest text-[#e8c98a] focus:outline-none"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-4 bg-[#e8c98a] text-black font-extrabold uppercase text-xs tracking-widest rounded-xl hover:bg-white transition-all cursor-pointer"
                >
                  {busy ? "VÉRIFICATION..." : "ACCÉDER À MON ESPACE PROJET →"}
                </button>
              </form>
            )}

            {step === "ready" && (
              <div className="text-center space-y-4">
                <CheckCircle2 className="h-14 w-14 text-emerald-400 mx-auto" />
                <h3 className="text-2xl font-black uppercase text-white">ESPACE CRÉÉ AVEC SUCCÈS !</h3>
                <p className="text-xs text-white/70">
                  Votre espace suivi de devis est désormais actif.
                </p>
                <a
                  href={portalUrl}
                  className="inline-block w-full py-4 bg-[#e8c98a] text-black font-extrabold uppercase text-xs tracking-widest rounded-xl hover:bg-white transition-all shadow-2xl"
                >
                  ACCÉDER À MON ESPACE BRYAN CARS →
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── MODAL ACCÉDER À MON ESPACE (PAR EMAIL) ── */}
      {portalLookupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-md w-full bg-[#110e0e] border border-white/20 p-6 rounded-3xl space-y-4 shadow-2xl">
            <button
              className="absolute top-4 right-4 text-white/60 hover:text-white"
              onClick={() => setPortalLookupModalOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-black uppercase text-white">Retrouver mon Espace Client</h3>
            <p className="text-xs text-white/60">
              Saisissez l'adresse email utilisée lors de votre réservation pour accéder à votre espace de suivi.
            </p>

            {lookupError && (
              <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-200 text-xs">
                {lookupError}
              </div>
            )}

            <input
              type="email"
              className="w-full px-4 py-3 bg-black/60 border border-white/15 rounded-xl text-sm text-white focus:border-[#e8c98a] focus:outline-none"
              placeholder="jean.dupont@email.com"
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.target.value)}
            />

            <button
              disabled={lookupBusy}
              className="w-full py-3.5 bg-[#e8c98a] text-black font-extrabold uppercase text-xs tracking-widest rounded-xl hover:bg-white transition-all cursor-pointer"
              onClick={handleFindPortal}
            >
              {lookupBusy ? "RECHERCHE..." : "ACCÉDER À MON ESPACE →"}
            </button>
          </div>
        </div>
      )}

      {/* ── FOOTER D'ATELIER HAUT DE GAMME ── */}
      <footer className="bg-[#050404] border-t border-white/10 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-white/50">
          <div className="flex items-center gap-3">
            <img src="/bc-gold-logo.png" alt="Bryan Cars" className="h-8 w-auto" />
            <span className="font-mono text-white font-bold">BRYAN CARS — BLACKBOX DETAILING</span>
          </div>

          <p>© {new Date().getFullYear()} Bryan Cars. Atelier &amp; A Domicile — Saône-et-Loire (71500).</p>

          <div className="flex items-center gap-6">
            <a href="#tarifs" className="hover:text-white">Tarifs</a>
            <a href="#vitrine" className="hover:text-white">Galerie</a>
            <Link to="/landing-test" className="text-[#e8c98a]">Prototype 3D</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
