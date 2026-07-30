import * as React from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  MapPin,
  Menu,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Star,
  Wrench,
  X,
  Car,
  Upload,
  Play,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";
import { InstallAppButton } from "../components/InstallAppButton";

const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/place/Bryan+Cars+Detailing+%E2%80%93+Nettoyage+voiture+%C3%A0+Louhans/@46.6343847,5.2423649,13z/data=!4m8!3m7!1s0x47f327b91eec4c27:0x81bd1ae9f5024543!8m2!3d46.6343847!4d5.2423649!9m1!1b1!16s%2Fg%2F11nxrbfcrd!18m1!1e1?entry=ttu";
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
  quoteDescription: string;
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
  quoteDescription: "",
};

type ShowcaseCategory = "all" | "polissage" | "ceramique" | "interieur" | "ppf";
type GalleryTab = "ext_finished" | "intext_finished" | "ext_beforeafter" | "intext_beforeafter";

interface ShowcaseItem {
  id: string;
  title: string;
  category: ShowcaseCategory;
  categoryLabel: string;
  vehicle: string;
  description: string;
  tag: string;
  coverImage: string;
  galleries: {
    ext_finished: string[];
    intext_finished: string[];
    ext_beforeafter: { before: string; after: string }[];
    intext_beforeafter: { before: string; after: string }[];
  };
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

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: "corvette-c8",
    title: "Correction Peinture & Traitement Céramique 9H",
    category: "ceramique",
    categoryLabel: "Protection Céramique",
    vehicle: "Chevrolet Corvette C8 Stingray",
    description:
      "Correction complète des micro-rayures, polissage 3 passes et pose d'une protection céramique bi-couche haute résistance.",
    tag: "Projet Phare BC",
    coverImage: "/corvette_5s.jpg",
    galleries: {
      ext_finished: ["/corvette_5s.jpg", "/corvette_40s.jpg"],
      intext_finished: ["/corvette_5s.jpg", "/corvette_40s.jpg", "/tiktok_30s.jpg"],
      ext_beforeafter: [{ before: "/corvette_20s.jpg", after: "/corvette_5s.jpg" }],
      intext_beforeafter: [
        { before: "/corvette_20s.jpg", after: "/corvette_5s.jpg" },
        { before: "/tiktok_10s.jpg", after: "/tiktok_30s.jpg" },
      ],
    },
  },
  {
    id: "corvette-polish-gt",
    title: "Rénovation Peinture & Polissage Miroir",
    category: "polissage",
    categoryLabel: "Polissage & Rénovation",
    vehicle: "Corvette C8 Blue Metallic",
    description:
      "Polissage intensif sur vernis tendre, élimination des hologrammes et lustrage haute brillance.",
    tag: "Atelier BC",
    coverImage: "/corvette_40s.jpg",
    galleries: {
      ext_finished: ["/corvette_40s.jpg", "/corvette_60s.jpg"],
      intext_finished: ["/corvette_40s.jpg", "/corvette_60s.jpg", "/tiktok_10s.jpg"],
      ext_beforeafter: [{ before: "/corvette_60s.jpg", after: "/corvette_40s.jpg" }],
      intext_beforeafter: [{ before: "/corvette_60s.jpg", after: "/corvette_40s.jpg" }],
    },
  },
  {
    id: "bc-tiktok-reel",
    title: "Detailing Intérieur & Soin Carrosserie",
    category: "interieur",
    categoryLabel: "Detailing Sur-Mesure",
    vehicle: "Supercar & Sportive",
    description:
      "Décontamination complète, rénovation minutieuse des éléments de carrosserie et soin intérieur.",
    tag: "Reel TikTok",
    coverImage: "/tiktok_30s.jpg",
    galleries: {
      ext_finished: ["/tiktok_30s.jpg"],
      intext_finished: ["/tiktok_30s.jpg", "/tiktok_10s.jpg"],
      ext_beforeafter: [{ before: "/tiktok_10s.jpg", after: "/tiktok_30s.jpg" }],
      intext_beforeafter: [{ before: "/tiktok_10s.jpg", after: "/tiktok_30s.jpg" }],
    },
  },
  {
    id: "bmw-m4-ppf",
    title: "Pose Film de Protection PPF & Céramique",
    category: "ppf",
    categoryLabel: "Film PPF",
    vehicle: "Sportive Haute Performance",
    description:
      "Pose d'un film PPF auto-cicatrisant + traitement céramique haute déperlance.",
    tag: "Protection Ultime",
    coverImage: "/corvette_60s.jpg",
    galleries: {
      ext_finished: ["/corvette_60s.jpg", "/hero-bg.png"],
      intext_finished: ["/corvette_60s.jpg", "/hero-bg.png"],
      ext_beforeafter: [{ before: "/corvette_20s.jpg", after: "/corvette_60s.jpg" }],
      intext_beforeafter: [{ before: "/corvette_20s.jpg", after: "/corvette_60s.jpg" }],
    },
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

  // Lightbox Modal & 4 Options de Galerie
  const [activeShowcase, setActiveShowcase] = React.useState<ShowcaseItem | null>(null);
  const [activeGalleryTab, setActiveGalleryTab] = React.useState<GalleryTab>("ext_finished");
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
        body: JSON.stringify({ email: lookupEmail }),
      });
      const json = await res.json().catch(() => ({}));
      if (json.ok && json.portalUrl) {
        window.location.href = json.portalUrl;
      } else {
        setLookupError("Aucun espace membre trouvé avec cette adresse email. Demandez un devis ci-dessous !");
      }
    } catch {
      setLookupError("Erreur lors de la recherche. Réessayez.");
    } finally {
      setLookupBusy(false);
    }
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(0, 5 - selectedPhotos.length);
    if (files.length === 0) return;

    const newPhotos = [...selectedPhotos, ...files];
    setSelectedPhotos(newPhotos);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
  }

  function removePhoto(index: number) {
    const updatedPhotos = selectedPhotos.filter((_, i) => i !== index);
    const updatedPreviews = photoPreviews.filter((_, i) => i !== index);
    setSelectedPhotos(updatedPhotos);
    setPhotoPreviews(updatedPreviews);
  }

  function updateField(key: keyof SignupForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function requestCode() {
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        formData.append(key, val);
      });
      selectedPhotos.forEach((file) => {
        formData.append("images", file);
      });

      const response = await fetch("/api/client/signup/request-code", {
        method: "POST",
        body: formData,
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json.ok) {
        throw new Error(json.error || "request_failed");
      }
      setStep("code");
    } catch (requestError) {
      setError("Impossible d'envoyer la demande. Vérifiez les informations et réessayez.");
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
      setError("Code invalide ou expiré. Demandez un nouveau code si besoin.");
    } finally {
      setBusy(false);
    }
  }

  function scrollToSection(id: string) {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

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
      author: "Maxime V.",
      rating: 5,
      comment: "Un souci du détail rare et un professionnalisme exemplaire. Les vidéos parlent d'elles-mêmes !",
      vehicleModel: "Porsche 911 Carrera S",
    },
    {
      id: 103,
      author: "Julien M.",
      rating: 5,
      comment: "Service à domicile et atelier au top. L'application permet d'envoyer les photos et de tout suivre en direct.",
      vehicleModel: "Audi RS6 Avant",
    },
  ];

  const displayReviews = reviews.length > 0 ? reviews : fallbackReviews;

  return (
    <div className="min-h-screen bg-[#090707] text-[#f5efe4] font-sans antialiased selection:bg-[#e8c98a]/30 pb-16 md:pb-0">
      {/* ── HEADER NAVBAR MOBILE-FIRST ── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#090707]/90 border-b border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <a className="flex items-center gap-3 group py-1" href="#">
            <img
              alt="BC Detailing Logo Officiel"
              className="h-10 sm:h-12 w-auto object-contain filter drop-shadow-[0_0_12px_rgba(232,201,138,0.3)] transition-transform group-hover:scale-105"
              src="/bc-gold-logo.png"
            />
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-black tracking-tighter leading-none text-white font-mono group-hover:text-[#e8c98a] transition-colors">
                BC
              </span>
              <span className="text-[8px] sm:text-[9px] font-bold tracking-[0.3em] text-[#e8c98a] uppercase leading-tight">
                DETAILING
              </span>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-[0.18em] text-white/70">
            <button
              className="hover:text-white transition-colors cursor-pointer py-1"
              onClick={() => scrollToSection("realisations")}
            >
              RÉALISATIONS
            </button>
            <button
              className="hover:text-white transition-colors cursor-pointer py-1"
              onClick={() => scrollToSection("avis")}
            >
              AVIS CLIENTS
            </button>
            <button
              className="hover:text-white transition-colors cursor-pointer py-1"
              onClick={() => scrollToSection("contact")}
            >
              CONTACT
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button
              className="px-4 py-2.5 rounded-none border border-white/30 text-white text-xs font-bold uppercase tracking-[0.15em] hover:border-white hover:bg-white/10 transition-all cursor-pointer flex items-center gap-2"
              onClick={() => setPortalLookupModalOpen(true)}
            >
              <User className="h-3.5 w-3.5" />
              <span>ACCÉDER À MON ESPACE</span>
            </button>
            <button
              className="px-5 py-2.5 rounded-none border border-[#e8c98a]/80 text-[#e8c98a] text-xs font-bold uppercase tracking-[0.15em] hover:bg-[#e8c98a] hover:text-black transition-all duration-300 shadow-[0_0_15px_rgba(232,201,138,0.15)] cursor-pointer"
              onClick={() => scrollToSection("devis")}
            >
              DEMANDER UN DEVIS
            </button>
          </div>

          <button
            aria-label="Menu"
            className="md:hidden p-2 text-white/80 hover:text-white cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6 text-[#e8c98a]" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0c0909] border-b border-white/10 px-6 py-5 space-y-3">
            <button
              className="block w-full text-left py-2 text-sm font-bold uppercase tracking-wider text-white/80 hover:text-[#e8c98a] cursor-pointer"
              onClick={() => scrollToSection("realisations")}
            >
              RÉALISATIONS
            </button>
            <button
              className="block w-full text-left py-2 text-sm font-bold uppercase tracking-wider text-white/80 hover:text-[#e8c98a] cursor-pointer"
              onClick={() => scrollToSection("avis")}
            >
              AVIS CLIENTS
            </button>
            <button
              className="block w-full text-left py-2 text-sm font-bold uppercase tracking-wider text-white/80 hover:text-[#e8c98a] cursor-pointer"
              onClick={() => scrollToSection("contact")}
            >
              CONTACT
            </button>
            <button
              className="w-full text-center py-3 border border-white/30 text-white font-bold text-xs uppercase tracking-wider bg-white/5 cursor-pointer"
              onClick={() => {
                setMobileMenuOpen(false);
                setPortalLookupModalOpen(true);
              }}
            >
              ACCÉDER À MON ESPACE MEMBRE
            </button>
            <button
              className="w-full mt-2 px-5 py-3 border border-[#e8c98a] text-[#e8c98a] text-xs font-bold uppercase tracking-wider bg-[#e8c98a]/10 cursor-pointer"
              onClick={() => scrollToSection("devis")}
            >
              DEMANDER UN DEVIS
            </button>
          </div>
        )}
      </header>

      {/* ── HERO BANNER MOBILE-FIRST ── */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-start overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <img
            alt="BC Detailing Chevrolet Corvette Polish"
            className="w-full h-full object-cover object-[50%_35%] filter brightness-105 contrast-100 scale-100"
            src="/hero-bg.png"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090707]/95 via-[#090707]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090707] via-transparent to-[#090707]/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-32 w-full">
          <div className="max-w-2xl space-y-6 sm:space-y-8">
            <div className="space-y-0.5">
              <h1 className="text-3xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white leading-[1.05]">
                L&apos;EXIGENCE
              </h1>
              <h1 className="text-3xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-[1.05] text-transparent bg-clip-text bg-gradient-to-r from-[#e8c98a] via-[#f4dca0] to-[#c99a4e]">
                JUSQUE DANS
              </h1>
              <h1 className="text-3xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white leading-[1.05]">
                LES MOINDRES DÉTAILS
              </h1>
            </div>

            <p className="text-sm sm:text-lg text-white/80 font-normal max-w-lg leading-relaxed">
              Nettoyage, rénovation et protection haut de gamme pour sublimer votre véhicule.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <button
                className="w-full sm:w-auto px-8 py-4 bg-[#e8c98a] text-black font-extrabold text-xs uppercase tracking-[0.18em] flex items-center justify-center gap-3 hover:bg-[#f4dca0] transition-all shadow-[0_0_25px_rgba(232,201,138,0.25)] group cursor-pointer"
                onClick={() => scrollToSection("devis")}
              >
                <span>DEMANDER UN DEVIS</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                className="w-full sm:w-auto px-8 py-4 border border-[#e8c98a]/60 bg-[#e8c98a]/10 backdrop-blur-sm text-[#e8c98a] font-extrabold text-xs uppercase tracking-[0.18em] hover:bg-[#e8c98a] hover:text-black transition-all text-center cursor-pointer shadow-[0_0_15px_rgba(232,201,138,0.15)] flex items-center justify-center gap-2"
                onClick={() => setPortalLookupModalOpen(true)}
              >
                <User className="h-4 w-4" />
                <span>ACCÉDER À MON ESPACE</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── MODAL RECHERCHE ESPACE MEMBRE PAR EMAIL ── */}
      {portalLookupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-md w-full bg-[#120e0e] border border-white/20 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#e8c98a]">
                  ESPACE CLIENT BRYAN CARS
                </span>
                <h3 className="text-xl font-bold uppercase text-white mt-0.5">Accéder à mon espace</h3>
              </div>
              <button
                className="p-2 text-white/60 hover:text-white rounded-full bg-white/5 hover:bg-white/10 cursor-pointer"
                onClick={() => {
                  setPortalLookupModalOpen(false);
                  setLookupError(null);
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Saisissez l&apos;adresse email associée à votre compte pour être redirigé directement vers votre espace membre.
            </p>

            {lookupError && (
              <div className="p-3 border border-rose-500/30 bg-rose-500/10 text-rose-200 text-xs font-medium rounded-lg">
                {lookupError}
              </div>
            )}

            <label className="block space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Adresse Email *</span>
              <input
                type="email"
                placeholder="jean.dupont@email.com"
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleFindPortal();
                }}
                className="w-full px-4 py-3 bg-black/50 border border-white/15 text-sm text-white focus:border-[#e8c98a] focus:outline-none rounded-lg"
              />
            </label>

            <button
              onClick={handleFindPortal}
              disabled={lookupBusy || !lookupEmail.trim()}
              className="w-full py-3.5 bg-[#e8c98a] text-black font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#f4dca0] transition-colors disabled:opacity-50 cursor-pointer shadow-[0_0_20px_rgba(232,201,138,0.2)] rounded-lg"
            >
              {lookupBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              <span>RECHERCHER MON ESPACE →</span>
            </button>
          </div>
        </div>
      )}

      {/* ── SECTION DÉMONSTRATION VIDÉOS 9:16 VERTICAL REELS (AVEC SON D'ORIGINE) ── */}
      <section className="py-16 sm:py-24 bg-[#090707] border-t border-white/5 relative" id="realisations">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#e8c98a]/30 bg-[#e8c98a]/10 text-[#e8c98a] text-[11px] font-bold uppercase tracking-widest">
              <Play className="h-3.5 w-3.5 fill-current" /> DÉMONSTRATIONS VIDÉOS REELS (AVEC SON)
            </div>
            <h2 className="text-2xl sm:text-5xl font-black uppercase tracking-tight text-white">
              NOS VIDÉOS EN ACTION
            </h2>
            <p className="text-xs sm:text-base text-white/60">
              Visionnez nos 3 vidéos avec le son d&apos;origine au format vertical Reel 9:16.
            </p>
          </div>

          {/* LECTEUR VIDÉO 9:16 VERTICAL SANS BANDES NOIRES AVEC SON */}
          <div className="max-w-4xl mx-auto bg-[#120e0e] border border-white/10 rounded-3xl p-6 sm:p-10 space-y-6">
            {/* Onglets de sélection des 3 vidéos */}
            <div className="flex flex-wrap items-center justify-center gap-3 border-b border-white/10 pb-4">
              {VIDEO_REELS.map((reel, idx) => (
                <button
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                    activeReelIndex === idx
                      ? "bg-[#e8c98a] text-black shadow-[0_0_15px_rgba(232,201,138,0.3)]"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10"
                  }`}
                  key={reel.id}
                  onClick={() => setActiveReelIndex(idx)}
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>{reel.badge}</span>
                </button>
              ))}
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg sm:text-2xl font-black uppercase text-white">
                {activeReel.title}
              </h3>
              {activeReel.subtitle ? (
                <p className="text-xs text-white/60">{activeReel.subtitle}</p>
              ) : null}
            </div>

            {/* Cadre Spécifique Vertical 9:16 (Smartphones / Reels) */}
            <div className="relative max-w-[320px] aspect-[9/16] mx-auto rounded-3xl overflow-hidden shadow-2xl border-2 border-[#e8c98a]/40 bg-black">
              <video
                key={activeReel.src}
                autoPlay
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

          {/* ── GALERIE VITRINE FILTRABLE AVEC 4 OPTIONS PAR VÉHICULE ── */}
          <div className="mt-20 text-center space-y-3 mb-10">
            <h3 className="text-xl sm:text-3xl font-black uppercase text-white">
              GALERIE DES RÉALISATIONS
            </h3>
            <p className="text-xs text-white/60">
              Cliquez sur un véhicule pour explorer ses 4 catégories de photos (Fini, Avant/Après...).
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {[
              { id: "all", label: "TOUT" },
              { id: "polissage", label: "POLISSAGE" },
              { id: "ceramique", label: "CÉRAMIQUE" },
              { id: "interieur", label: "INTÉRIEUR" },
              { id: "ppf", label: "FILM PPF" },
            ].map((cat) => (
              <button
                className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-[#e8c98a] text-black border-[#e8c98a]"
                    : "bg-[#120e0e] text-white/70 border-white/10 hover:border-white/30 hover:text-white"
                }`}
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as ShowcaseCategory)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grille Vitrine Mobile-First */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {filteredItems.map((item) => (
              <div
                className="group bg-[#120e0e] border border-white/10 overflow-hidden hover:border-[#e8c98a]/50 transition-all duration-300 flex flex-col cursor-pointer"
                key={item.id}
                onClick={() => {
                  setActiveShowcase(item);
                  setActiveGalleryTab("ext_finished");
                  setActiveImageIndex(0);
                }}
              >
                <div className="relative aspect-4/3 overflow-hidden bg-black/60">
                  <img
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-95 group-hover:brightness-100"
                    src={item.coverImage}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />

                  <span className="absolute top-3 left-3 bg-[#e8c98a] text-black text-[10px] font-black uppercase tracking-widest px-2.5 py-1">
                    {item.tag}
                  </span>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                    <span className="px-4 py-2 border border-white text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 bg-black/60">
                      <Eye className="h-3.5 w-3.5" /> EXPLORER LES 4 GALERIES
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#e8c98a]">
                      {item.categoryLabel}
                    </span>
                    <h3 className="text-sm font-bold text-white uppercase mt-0.5 leading-snug">
                      {item.vehicle}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-bold text-[#e8c98a]">
                    <span>VOIR LES GALERIES</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIGHTBOX MODAL AVEC LES 4 OPTIONS DE GALERIES POUR UN MÊME VÉHICULE ── */}
      {activeShowcase && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8">
          <div className="relative max-w-4xl w-full bg-[#120e0e] border border-white/20 rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#e8c98a]">
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

            <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
              {/* SÉLECTEUR DES 4 OPTIONS DE GALERIES POUR LE VÉHICULE */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "ext_finished", label: "Extérieur Fini" },
                  { id: "intext_finished", label: "Intérieur & Extérieur" },
                  { id: "ext_beforeafter", label: "Extérieur Avant/Après" },
                  { id: "intext_beforeafter", label: "Inté/Exté Avant/Après" },
                ].map((tab) => (
                  <button
                    className={`px-3 py-2 text-[11px] font-bold uppercase tracking-wider rounded border text-center transition-all cursor-pointer ${
                      activeGalleryTab === tab.id
                        ? "bg-[#e8c98a] text-black border-[#e8c98a]"
                        : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                    key={tab.id}
                    onClick={() => {
                      setActiveGalleryTab(tab.id as GalleryTab);
                      setActiveImageIndex(0);
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* RENDER PHOTOS / COMPARATIF SELON L'ONGLET SÉLECTIONNÉ */}
              {activeGalleryTab === "ext_beforeafter" || activeGalleryTab === "intext_beforeafter" ? (
                <div className="space-y-4">
                  {activeShowcase.galleries[activeGalleryTab].map((pair, i) => (
                    <div className="grid grid-cols-2 gap-3" key={i}>
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-rose-500/40">
                        <img alt="Avant" className="w-full h-full object-cover" src={pair.before} />
                        <span className="absolute top-2 left-2 bg-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                          AVANT
                        </span>
                      </div>
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-emerald-500/40">
                        <img alt="Après" className="w-full h-full object-cover" src={pair.after} />
                        <span className="absolute top-2 right-2 bg-emerald-500 text-black text-[9px] font-bold px-2 py-0.5 rounded">
                          APRÈS
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="relative aspect-video w-full overflow-hidden bg-black rounded-xl border border-white/10">
                  <img
                    alt={activeShowcase.title}
                    className="w-full h-full object-cover"
                    src={
                      activeShowcase.galleries[activeGalleryTab][activeImageIndex] ||
                      activeShowcase.coverImage
                    }
                  />

                  {activeShowcase.galleries[activeGalleryTab].length > 1 && (
                    <>
                      <button
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 text-white hover:bg-[#e8c98a] hover:text-black rounded-full transition-colors cursor-pointer"
                        onClick={() =>
                          setActiveImageIndex((prev) =>
                            prev === 0
                              ? activeShowcase.galleries[activeGalleryTab].length - 1
                              : prev - 1
                          )
                        }
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 text-white hover:bg-[#e8c98a] hover:text-black rounded-full transition-colors cursor-pointer"
                        onClick={() =>
                          setActiveImageIndex((prev) =>
                            prev === activeShowcase.galleries[activeGalleryTab].length - 1
                              ? 0
                              : prev + 1
                          )
                        }
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-base font-bold text-white">{activeShowcase.title}</h4>
                <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                  {activeShowcase.description}
                </p>
                <button
                  className="w-full py-3.5 bg-[#e8c98a] text-black font-extrabold text-xs uppercase tracking-widest hover:bg-[#f4dca0] transition-colors cursor-pointer"
                  onClick={() => {
                    setActiveShowcase(null);
                    scrollToSection("devis");
                  }}
                >
                  OBTENIR UN DEVIS POUR MON VÉHICULE →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION AVIS CLIENTS GOOGLE MAPS LOUHANS ── */}
      <section className="py-16 sm:py-24 bg-[#0c0909] border-t border-white/5 relative" id="avis">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#e8c98a] mb-1">
                <Star className="h-4 w-4 fill-current" /> NOTE 5.0 / 5 SUR GOOGLE MAPS
              </div>
              <h2 className="text-2xl sm:text-5xl font-black uppercase tracking-tight text-white">
                AVIS CLIENTS GOOGLE
              </h2>
            </div>
            <a
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-white/20 bg-white/5 text-xs font-bold uppercase tracking-wider text-white hover:border-[#e8c98a] hover:text-[#e8c98a] transition-all"
              href={GOOGLE_MAPS_URL}
              rel="noreferrer"
              target="_blank"
            >
              VOIR LES AVIS GOOGLE (LOUHANS) <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
            {displayReviews.map((review) => (
              <div
                className="bg-[#120e0e] border border-white/10 p-5 flex flex-col justify-between space-y-3 hover:border-[#e8c98a]/40 transition-colors"
                key={review.id}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{review.author}</span>
                    <div className="flex gap-1 text-[#e8c98a]">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star className="h-3.5 w-3.5 fill-current" key={i} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-white/70 italic leading-relaxed">&laquo; {review.comment} &raquo;</p>
                </div>
                {review.vehicleModel && (
                  <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-[11px] text-[#e8c98a]">
                    <Car className="h-3.5 w-3.5" />
                    <span>{review.vehicleModel}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION FORMULAIRE DE DEVIS ── */}
      <section className="py-16 sm:py-24 bg-[#090707] border-t border-white/5 relative" id="devis">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-8 sm:mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#e8c98a]">
              ESTIMATION SUR-MESURE
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
              DEMANDER UN DEVIS
            </h2>
            <p className="text-xs sm:text-sm text-white/60">
              Remplissez le formulaire et joignez les photos de votre véhicule pour recevoir votre estimation gratuite.
            </p>
          </div>

          <div className="max-w-3xl mx-auto bg-[#120e0e] border border-white/15 p-5 sm:p-8" ref={signupCardRef}>
            <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#e8c98a]">
                  {step === "ready"
                    ? "Étape 3 / 3 — Confirmation"
                    : step === "code"
                    ? "Étape 2 / 3 — Validation Code"
                    : "Étape 1 / 3 — Formulaire Devis & Photos"}
                </span>
                <h3 className="text-lg sm:text-xl font-bold uppercase text-white mt-0.5">
                  {step === "ready"
                    ? "Votre demande est transmise !"
                    : step === "code"
                    ? "Validez votre code par email"
                    : "Informations & Photos Véhicule"}
                </h3>
              </div>
              <div className="p-2.5 bg-[#e8c98a]/10 text-[#e8c98a] border border-[#e8c98a]/30">
                <Wrench className="h-5 w-5" />
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 border border-rose-500/30 bg-rose-500/10 text-rose-200 text-xs font-medium">
                {error}
              </div>
            )}

            {step === "form" && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Prénom *</span>
                    <input
                      className="w-full mt-1.5 px-3.5 py-3 bg-black/50 border border-white/15 text-sm text-white focus:border-[#e8c98a] focus:outline-none"
                      onChange={(e) => updateField("firstName", e.target.value)}
                      placeholder="Jean"
                      value={form.firstName}
                    />
                  </label>

                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Nom *</span>
                    <input
                      className="w-full mt-1.5 px-3.5 py-3 bg-black/50 border border-white/15 text-sm text-white focus:border-[#e8c98a] focus:outline-none"
                      onChange={(e) => updateField("lastName", e.target.value)}
                      placeholder="Dupont"
                      value={form.lastName}
                    />
                  </label>

                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Email *</span>
                    <input
                      className="w-full mt-1.5 px-3.5 py-3 bg-black/50 border border-white/15 text-sm text-white focus:border-[#e8c98a] focus:outline-none"
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="jean.dupont@email.com"
                      type="email"
                      value={form.email}
                    />
                  </label>

                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Téléphone *</span>
                    <input
                      className="w-full mt-1.5 px-3.5 py-3 bg-black/50 border border-white/15 text-sm text-white focus:border-[#e8c98a] focus:outline-none"
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="06 12 34 56 78"
                      value={form.phone}
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Modèle du Véhicule *</span>
                    <input
                      className="w-full mt-1.5 px-3.5 py-3 bg-black/50 border border-white/15 text-sm text-white focus:border-[#e8c98a] focus:outline-none"
                      onChange={(e) => updateField("vehicleModel", e.target.value)}
                      placeholder="Ex: Chevrolet Corvette C8 / Porsche 911"
                      value={form.vehicleModel}
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Description du travail souhaité</span>
                    <textarea
                      className="w-full mt-1.5 px-3.5 py-3 bg-black/50 border border-white/15 text-sm text-white focus:border-[#e8c98a] focus:outline-none resize-none h-24"
                      onChange={(e) => updateField("quoteDescription", e.target.value)}
                      placeholder="Précisez votre demande (ex: Polissage complet, traitement céramique, rénovation cuir...)"
                      value={form.quoteDescription}
                    />
                  </label>

                  {/* UPLOAD PHOTOS VÉHICULE */}
                  <div className="sm:col-span-2 space-y-2 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                      Photos du Véhicule (Jusqu&apos;à 5 photos pour l&apos;estimation)
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                      {photoPreviews.map((src, i) => (
                        <div className="relative w-16 h-16 rounded border border-white/20 overflow-hidden bg-black" key={i}>
                          <img alt="Prévisualisation" className="w-full h-full object-cover" src={src} />
                          <button
                            className="absolute top-0.5 right-0.5 p-0.5 bg-black/80 text-white hover:text-rose-400 rounded-full cursor-pointer"
                            onClick={() => removePhoto(i)}
                            type="button"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}

                      {selectedPhotos.length < 5 && (
                        <label className="w-16 h-16 flex flex-col items-center justify-center border border-dashed border-[#e8c98a]/50 bg-[#e8c98a]/5 text-[#e8c98a] hover:bg-[#e8c98a]/10 cursor-pointer transition-colors rounded">
                          <Upload className="h-4 w-4 mb-1" />
                          <span className="text-[9px] font-bold">AJOUTER</span>
                          <input
                            accept="image/*"
                            className="hidden"
                            multiple
                            onChange={handlePhotoSelect}
                            type="file"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Adresse (Intervention)</span>
                    <input
                      className="w-full mt-1.5 px-3.5 py-3 bg-black/50 border border-white/15 text-sm text-white focus:border-[#e8c98a] focus:outline-none"
                      onChange={(e) => updateField("addressLine1", e.target.value)}
                      placeholder="12 rue de la Paix"
                      value={form.addressLine1}
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Code Postal</span>
                      <input
                        className="w-full mt-1.5 px-3.5 py-3 bg-black/50 border border-white/15 text-sm text-white focus:border-[#e8c98a] focus:outline-none"
                        onChange={(e) => updateField("postalCode", e.target.value)}
                        placeholder="71500"
                        value={form.postalCode}
                      />
                    </label>

                    <label className="block">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Ville</span>
                      <input
                        className="w-full mt-1.5 px-3.5 py-3 bg-black/50 border border-white/15 text-sm text-white focus:border-[#e8c98a] focus:outline-none"
                        onChange={(e) => updateField("city", e.target.value)}
                        placeholder="Louhans"
                        value={form.city}
                      />
                    </label>
                  </div>
                </div>

                <label className="mt-4 flex items-start gap-3 text-xs text-white/70 cursor-pointer pt-2">
                  <input
                    checked={acceptedTerms}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#e8c98a]"
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    type="checkbox"
                  />
                  <span>
                    J&apos;accepte les{" "}
                    <a className="text-[#e8c98a] underline" href="/conditions" target="_blank">
                      conditions générales
                    </a>{" "}
                    et la{" "}
                    <a className="text-[#e8c98a] underline" href="/confidentialite" target="_blank">
                      politique de confidentialité
                    </a>{" "}
                    de Bryan Cars.
                  </span>
                </label>

                <button
                  className="w-full py-4 mt-6 bg-[#e8c98a] text-black font-extrabold text-xs sm:text-sm uppercase tracking-[0.18em] flex items-center justify-center gap-2 hover:bg-[#f4dca0] transition-colors disabled:opacity-50 cursor-pointer shadow-[0_0_20px_rgba(232,201,138,0.2)]"
                  disabled={busy || !acceptedTerms || !form.email || !form.firstName}
                  onClick={requestCode}
                  type="button"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  <span>{acceptedTerms ? "ENVOYER MA DEMANDE DE DEVIS →" : "ACCEPTER LES CONDITIONS"}</span>
                </button>
              </div>
            )}

            {step === "code" && (
              <div className="space-y-6">
                <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                  Un code de vérification à 6 chiffres vient d&apos;être envoyé à l&apos;adresse <strong className="text-white">{form.email}</strong>.
                </p>

                <input
                  className="w-full py-3.5 px-4 bg-black/60 border border-[#e8c98a] text-center text-2xl tracking-[0.4em] font-mono text-[#e8c98a] focus:outline-none"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  value={code}
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    className="py-3.5 bg-[#e8c98a] text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#f4dca0] disabled:opacity-50 cursor-pointer"
                    disabled={busy || code.length !== 6}
                    onClick={verifyCode}
                    type="button"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    <span>VALIDER MON CODE</span>
                  </button>
                  <button
                    className="py-3.5 border border-white/20 text-white text-xs font-bold uppercase tracking-wider hover:border-white disabled:opacity-50 cursor-pointer"
                    disabled={busy}
                    onClick={requestCode}
                    type="button"
                  >
                    RENVOYER LE CODE
                  </button>
                </div>
              </div>
            )}

            {step === "ready" && (
              <div className="space-y-6">
                <div className="p-5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-sm sm:text-base font-bold uppercase">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>DEMANDE TRANSMISE À L&apos;ADMINISTRATEUR</span>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Votre demande de devis et vos photos ont bien été transmises à l&apos;équipe. Vous recevrez une notification par email dès que votre estimation sera prête.
                  </p>
                </div>

                {portalUrl && (
                  <Link
                    className="w-full py-4 bg-[#e8c98a] text-black font-extrabold text-xs uppercase tracking-[0.18em] flex items-center justify-center gap-2 hover:bg-[#f4dca0]"
                    to={portalUrl}
                  >
                    <span>ACCÉDER À MON ESPACE MEMBRE</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}

                <div className="p-5 border border-white/10 bg-white/5 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white uppercase">
                    <Smartphone className="h-4 w-4 text-[#e8c98a]" />
                    <span>INSTALLER L&apos;APPLICATION BRYAN CARS</span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Ajoutez l&apos;application à votre écran d&apos;accueil pour recevoir les notifications et suivre l&apos;avancement en direct.
                  </p>
                  <InstallAppButton
                    appName="Bryan Cars"
                    className="w-full py-3 border border-[#e8c98a] text-[#e8c98a] font-bold text-xs uppercase tracking-wider hover:bg-[#e8c98a] hover:text-black transition-colors cursor-pointer"
                    startUrl={portalUrl || "/"}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── SECTION CONTACT & SECTEUR LOUHANS ── */}
      <section className="py-16 bg-[#0c0909] border-t border-white/5" id="contact">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
            <div className="p-5 bg-[#120e0e] border border-white/10 space-y-2">
              <MapPin className="h-5 w-5 text-[#e8c98a]" />
              <h4 className="text-sm font-bold text-white uppercase">Secteur d&apos;intervention</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                Atelier &amp; À Domicile — Louhans (71500), Saône-et-Loire &amp; Bresse.
              </p>
              <a
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e8c98a] hover:underline pt-1"
                href={GOOGLE_MAPS_URL}
                rel="noreferrer"
                target="_blank"
              >
                <span>Fiche Google Maps</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="p-5 bg-[#120e0e] border border-white/10 space-y-2">
              <MessageCircle className="h-5 w-5 text-[#e8c98a]" />
              <h4 className="text-sm font-bold text-white uppercase">WhatsApp Direct</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                Envoyez-nous les photos de votre véhicule pour une pré-estimation rapide.
              </p>
              <a
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e8c98a] hover:underline pt-1"
                href={WHATSAPP_URL}
                rel="noreferrer"
                target="_blank"
              >
                <span>Discuter sur WhatsApp</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="p-5 bg-[#120e0e] border border-white/10 space-y-2">
              <ShieldCheck className="h-5 w-5 text-[#e8c98a]" />
              <h4 className="text-sm font-bold text-white uppercase">Engagement Qualité BC</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                Produits professionnels haut de gamme, céramiques accrédité Carpro.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 bg-black border-t border-white/10 text-center text-xs text-white/40 space-y-3">
        <div className="flex items-center justify-center gap-2">
          <img alt="BC Detailing Logo" className="h-7 w-auto object-contain" src="/bc-gold-logo.png" />
          <span>· Bryan Cars Detailing Premium</span>
        </div>
        <nav className="flex flex-wrap justify-center gap-4 text-[11px] text-white/50">
          <a className="hover:text-white" href="/mentions-legales">Mentions légales</a>
          <a className="hover:text-white" href="/confidentialite">Confidentialité</a>
          <a className="hover:text-white" href="/cookies">Cookies</a>
          <a className="hover:text-white" href="/conditions">Conditions Générales</a>
        </nav>
        <p className="text-[10px] text-white/30">
          © {new Date().getFullYear()} Bryan Cars Detailing. Tous droits réservés.
        </p>
      </footer>
    </div>
  );
}
