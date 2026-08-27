import * as React from "react";
import {
  ArrowRight,
  CalendarDays,
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
import { ServicePicker } from "../components/ServicePicker";
import { SERVICE_CATALOG, SERVICE_CATEGORIES } from "../lib/serviceCatalog";

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

type AccountSignupForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
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

type ShowcaseCategory = "tout" | "interieur" | "exterieur";

interface VideoReelExample {
  id: string;
  title: string;
  subtitle: string;
  src: string;
  poster: string;
  badge: string;
}

const VIDEO_REELS: VideoReelExample[] = [
  {
    id: "reel-1",
    title: "Vidéo 1",
    subtitle: "",
    src: "/reel-1.mp4",
    poster: "/showcase/vw_golf_gti_front_after.png",
    badge: "VIDÉO 1",
  },
  {
    id: "reel-2",
    title: "Vidéo 2",
    subtitle: "",
    src: "/reel-2.mp4",
    poster: "/peugeot_208_clean_after.jpg",
    badge: "VIDÉO 2",
  },
  {
    id: "reel-3",
    title: "Vidéo 3",
    subtitle: "",
    src: "/reel-3.mp4",
    poster: "/showcase/chrysler_crossfire_rear_finished.png",
    badge: "VIDÉO 3",
  },
];

interface GalleryPair {
  id: string;
  vehicleId: "peugeot-208" | "vw-golf-gti" | "chrysler-crossfire";
  vehicleName: string;
  title: string;
  category: "interieur" | "exterieur";
  before: string;
  after: string;
}

interface VehicleModelItem {
  id: "peugeot-208" | "vw-golf-gti" | "chrysler-crossfire";
  name: string;
  subtitle: string;
  coverImage: string;
  pairs: GalleryPair[];
}

const GALLERY_PAIRS: GalleryPair[] = [
  {
    id: "peugeot-208-int",
    vehicleId: "peugeot-208",
    vehicleName: "Peugeot 208 GT i-Cockpit",
    title: "Habitacle & i-Cockpit (Boue vs Neuf)",
    category: "interieur",
    before: "/peugeot_208_muddy_before.jpg",
    after: "/peugeot_208_clean_after.jpg",
  },
  {
    id: "golf-gti-front",
    vehicleId: "vw-golf-gti",
    vehicleName: "Volkswagen Golf 7 GTI",
    title: "Poste de Conduite & Volant Cuir Surpiqué",
    category: "interieur",
    before: "/showcase/vw_golf_gti_front_before.png",
    after: "/showcase/vw_golf_gti_front_after.png",
  },
  {
    id: "golf-gti-rear",
    vehicleId: "vw-golf-gti",
    vehicleName: "Volkswagen Golf 7 GTI",
    title: "Places Arrière & Sièges Tissu Tartan",
    category: "interieur",
    before: "/showcase/vw_golf_gti_rear_before.png",
    after: "/showcase/vw_golf_gti_rear_after.png",
  },
  {
    id: "crossfire-driver",
    vehicleId: "chrysler-crossfire",
    vehicleName: "Chrysler Crossfire Black Metallic",
    title: "Poste Conducteur Cuir Rouge Mat",
    category: "interieur",
    before: "/showcase/chrysler_crossfire_interior_driver_before.png",
    after: "/showcase/chrysler_crossfire_interior_driver_after.png",
  },
  {
    id: "crossfire-pass",
    vehicleId: "chrysler-crossfire",
    vehicleName: "Chrysler Crossfire Black Metallic",
    title: "Poste Passager Cuir Rouge Mat",
    category: "interieur",
    before: "/showcase/chrysler_crossfire_interior_pass_before.png",
    after: "/showcase/chrysler_crossfire_interior_pass_after.png",
  },
  {
    id: "crossfire-hood",
    vehicleId: "chrysler-crossfire",
    vehicleName: "Chrysler Crossfire Black Metallic",
    title: "Capot Noir Metallic - Polissage Miroir",
    category: "exterieur",
    before: "/showcase/chrysler_crossfire_hood_before.png",
    after: "/showcase/chrysler_crossfire_hood_after.png",
  },
];

const VEHICLE_MODELS: VehicleModelItem[] = [
  {
    id: "peugeot-208",
    name: "Peugeot 208 GT i-Cockpit",
    subtitle: "Rénovation Intérieure Extrême",
    coverImage: "/peugeot_208_clean_after.jpg",
    pairs: GALLERY_PAIRS.filter((p) => p.vehicleId === "peugeot-208"),
  },
  {
    id: "vw-golf-gti",
    name: "Volkswagen Golf 7 GTI",
    subtitle: "Detailing Habitacle & Sièges Tartan",
    coverImage: "/showcase/vw_golf_gti_front_after.png",
    pairs: GALLERY_PAIRS.filter((p) => p.vehicleId === "vw-golf-gti"),
  },
  {
    id: "chrysler-crossfire",
    name: "Chrysler Crossfire Black Metallic",
    subtitle: "Polissage Miroir Capot & Cuir Rouge",
    coverImage: "/showcase/chrysler_crossfire_rear_finished.png",
    pairs: GALLERY_PAIRS.filter((p) => p.vehicleId === "chrysler-crossfire"),
  },
];

function getVisitorId(): string {
  try {
    let id = localStorage.getItem("bbx_visitor_id");
    if (!id) {
      id = "v_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
      localStorage.setItem("bbx_visitor_id", id);
    }
    return id;
  } catch (_e) {
    return "v_anon_" + Date.now();
  }
}

function trackLandingEvent(eventType: string) {
  try {
    const visitorId = getVisitorId();
    const payload = JSON.stringify({
      eventType,
      visitorId,
      referrer: document.referrer || null,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/client/landing/track", new Blob([payload], { type: "application/json" }));
    } else {
      void fetch("/api/client/landing/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
    }
  } catch (_e) {
    // silencieux
  }
}

export function LandingPage() {
  const [form, setForm] = React.useState<SignupForm>(initialForm);
  const [selectedPhotos, setSelectedPhotos] = React.useState<File[]>([]);
  const [selectedQuoteServiceKeys, setSelectedQuoteServiceKeys] = React.useState<string[]>([]);
  const [quoteConditionScore, setQuoteConditionScore] = React.useState(5);
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

  // Creation de compte autonome : aucun devis, véhicule ou photo requis.
  const [accountSignupModalOpen, setAccountSignupModalOpen] = React.useState(false);
  const [accountSignupStep, setAccountSignupStep] = React.useState<"form" | "code" | "ready">("form");
  const [accountSignupForm, setAccountSignupForm] = React.useState<AccountSignupForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [accountSignupCode, setAccountSignupCode] = React.useState("");
  const [accountSignupTerms, setAccountSignupTerms] = React.useState(false);
  const [accountSignupBusy, setAccountSignupBusy] = React.useState(false);
  const [accountSignupError, setAccountSignupError] = React.useState<string | null>(null);
  const [accountPortalUrl, setAccountPortalUrl] = React.useState("");

  // Navigation Mobile
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Galerie & Lightbox Slider
  const [selectedCategory, setSelectedCategory] = React.useState<ShowcaseCategory>("tout");
  const [activeVehicleModal, setActiveVehicleModal] = React.useState<VehicleModelItem | null>(null);
  const [lightboxActiveIndex, setLightboxActiveIndex] = React.useState<number | null>(null);
  const [lightboxPhotoList, setLightboxPhotoList] = React.useState<GalleryPair[]>([]);

  // State Vidéo 9:16 Vertical Reel Player
  const [activeReelIndex, setActiveReelIndex] = React.useState(0);

  const [reviews, setReviews] = React.useState<
    Array<{ id: number; author: string; rating: number; comment: string; vehicleModel: string | null }>
  >([]);
  const signupCardRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    trackLandingEvent("pageview");
  }, []);

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
    trackLandingEvent("click_login");
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

  function closeAccountSignup() {
    setAccountSignupModalOpen(false);
    setAccountSignupError(null);
  }

  async function requestAccountSignupCode() {
    setAccountSignupBusy(true);
    setAccountSignupError(null);
    try {
      const payload = new FormData();
      Object.entries(accountSignupForm).forEach(([key, value]) => payload.append(key, value));
      const response = await fetch("/api/client/signup/request-code", {
        method: "POST",
        body: payload,
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json.ok) throw new Error(json.error || "request_failed");
      trackLandingEvent("submit_account");
      setAccountSignupStep("code");
    } catch {
      setAccountSignupError("Impossible d'envoyer le code. Vérifiez vos informations et réessayez.");
    } finally {
      setAccountSignupBusy(false);
    }
  }

  async function verifyAccountSignupCode() {
    setAccountSignupBusy(true);
    setAccountSignupError(null);
    try {
      const response = await fetch("/api/client/signup/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: accountSignupForm.email, code: accountSignupCode }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json.ok) throw new Error(json.error || "verify_failed");
      setAccountPortalUrl(json.portalUrl || "");
      setAccountSignupStep("ready");
    } catch {
      setAccountSignupError("Code invalide ou expiré. Vous pouvez demander un nouveau code.");
    } finally {
      setAccountSignupBusy(false);
    }
  }

  function scrollToSection(id: string) {
    setMobileMenuOpen(false);
    trackLandingEvent("click_" + id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
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
    if (selectedQuoteServiceKeys.length === 0) {
      setError("Choisissez au moins une prestation avant d'envoyer le devis.");
      return;
    }
    if (selectedPhotos.length === 0) {
      setError("Les photos sont obligatoires : ajoutez au moins une photo du véhicule avant d'envoyer le devis.");
      return;
    }
    if (!form.vehicleModel.trim()) {
      setError("Indiquez le modèle du véhicule avant d'envoyer le devis.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        formData.append(key, val);
      });
      formData.append("quoteServiceKeys", JSON.stringify(selectedQuoteServiceKeys));
      formData.append("vehicleConditionScore", String(quoteConditionScore));
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
      setError(
        requestError instanceof Error && requestError.message === "invalid_quote_details"
          ? "Une prestation, le modèle du véhicule et au moins une photo sont nécessaires."
          : "Impossible d'envoyer la demande. Vérifiez les informations et réessayez.",
      );
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



  const activeReel = VIDEO_REELS[activeReelIndex];



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
              className="px-4 py-2.5 text-white/75 text-xs font-bold uppercase tracking-[0.15em] hover:text-[#e8c98a] transition-colors cursor-pointer"
              onClick={() => setAccountSignupModalOpen(true)}
            >
              CRÉER MON COMPTE
            </button>
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
              className="w-full text-center py-3 border border-white/15 text-white/80 font-bold text-xs uppercase tracking-wider bg-white/[0.03] cursor-pointer"
              onClick={() => {
                setMobileMenuOpen(false);
                setAccountSignupModalOpen(true);
              }}
            >
              CRÉER MON COMPTE
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

            <div className="border-t border-white/10 pt-4 text-center">
              <p className="text-xs text-white/50">Pas encore de compte ?</p>
              <button
                className="mt-2 text-xs font-bold uppercase tracking-wider text-[#e8c98a] hover:text-[#f4dca0]"
                onClick={() => {
                  setPortalLookupModalOpen(false);
                  setAccountSignupModalOpen(true);
                }}
                type="button"
              >
                Créer mon espace gratuitement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATION DE COMPTE SANS DEMANDE DE DEVIS ── */}
      {accountSignupModalOpen && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center overflow-y-auto bg-black/90 p-4 backdrop-blur-md">
          <div className="relative my-auto w-full max-w-lg space-y-5 rounded-2xl border border-white/20 bg-[#120e0e] p-6">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#e8c98a]">
                  {accountSignupStep === "ready" ? "COMPTE CRÉÉ" : accountSignupStep === "code" ? "VÉRIFICATION" : "NOUVEAU CLIENT"}
                </span>
                <h3 className="mt-1 text-xl font-bold uppercase text-white">
                  {accountSignupStep === "ready" ? "Bienvenue chez Bryan Cars" : accountSignupStep === "code" ? "Validez votre e-mail" : "Créer mon espace"}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-white/55">
                  {accountSignupStep === "form"
                    ? "Créez votre compte maintenant. Vous pourrez ajouter votre véhicule et demander un rendez-vous plus tard."
                    : accountSignupStep === "code"
                      ? `Un code à 6 chiffres a été envoyé à ${accountSignupForm.email}.`
                      : "Votre espace est prêt. Aucun devis n'a été créé automatiquement."}
                </p>
              </div>
              <button
                aria-label="Fermer"
                className="rounded-full bg-white/5 p-2 text-white/60 hover:bg-white/10 hover:text-white"
                onClick={closeAccountSignup}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {accountSignupError && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-medium text-rose-200">
                {accountSignupError}
              </div>
            )}

            {accountSignupStep === "form" && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Prénom *</span>
                    <input
                      className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-[#e8c98a]"
                      onChange={(event) => setAccountSignupForm((current) => ({ ...current, firstName: event.target.value }))}
                      placeholder="Jean"
                      value={accountSignupForm.firstName}
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Nom *</span>
                    <input
                      className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-[#e8c98a]"
                      onChange={(event) => setAccountSignupForm((current) => ({ ...current, lastName: event.target.value }))}
                      placeholder="Dupont"
                      value={accountSignupForm.lastName}
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">E-mail *</span>
                    <input
                      className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-[#e8c98a]"
                      onChange={(event) => setAccountSignupForm((current) => ({ ...current, email: event.target.value }))}
                      placeholder="jean.dupont@email.com"
                      type="email"
                      value={accountSignupForm.email}
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Téléphone (optionnel)</span>
                    <input
                      className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/50 px-4 py-3 text-sm text-white outline-none focus:border-[#e8c98a]"
                      onChange={(event) => setAccountSignupForm((current) => ({ ...current, phone: event.target.value }))}
                      placeholder="06 12 34 56 78"
                      value={accountSignupForm.phone}
                    />
                  </label>
                </div>
                <label className="flex cursor-pointer items-start gap-3 text-xs text-white/65">
                  <input
                    checked={accountSignupTerms}
                    className="mt-0.5 h-4 w-4 accent-[#e8c98a]"
                    onChange={(event) => setAccountSignupTerms(event.target.checked)}
                    type="checkbox"
                  />
                  <span>
                    J&apos;accepte les <a className="text-[#e8c98a] underline" href="/conditions" target="_blank">conditions générales</a> et la <a className="text-[#e8c98a] underline" href="/confidentialite" target="_blank">politique de confidentialité</a>.
                  </span>
                </label>
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e8c98a] py-3.5 text-xs font-extrabold uppercase tracking-widest text-black disabled:opacity-50"
                  disabled={accountSignupBusy || !accountSignupTerms || !accountSignupForm.firstName.trim() || !accountSignupForm.lastName.trim() || !accountSignupForm.email.trim()}
                  onClick={() => void requestAccountSignupCode()}
                  type="button"
                >
                  {accountSignupBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Recevoir mon code
                </button>
              </div>
            )}

            {accountSignupStep === "code" && (
              <div className="space-y-4">
                <input
                  className="w-full rounded-lg border border-[#e8c98a] bg-black/60 px-4 py-3.5 text-center font-mono text-2xl tracking-[0.4em] text-[#e8c98a] outline-none"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) => setAccountSignupCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  value={accountSignupCode}
                />
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e8c98a] py-3.5 text-xs font-extrabold uppercase tracking-widest text-black disabled:opacity-50"
                  disabled={accountSignupBusy || accountSignupCode.length !== 6}
                  onClick={() => void verifyAccountSignupCode()}
                  type="button"
                >
                  {accountSignupBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Valider et créer mon compte
                </button>
                <button
                  className="w-full py-2 text-xs font-bold uppercase tracking-wider text-white/55 hover:text-white"
                  disabled={accountSignupBusy}
                  onClick={() => void requestAccountSignupCode()}
                  type="button"
                >
                  Renvoyer le code
                </button>
              </div>
            )}

            {accountSignupStep === "ready" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-100">
                  Vous pouvez maintenant compléter votre garage ou demander un devis quand vous le souhaitez.
                </div>
                {accountPortalUrl && (
                  <Link
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e8c98a] py-3.5 text-xs font-extrabold uppercase tracking-widest text-black"
                    to={accountPortalUrl}
                  >
                    Accéder à mon espace <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PARCOURS SIMPLE : un seul chemin du besoin au rendez-vous ── */}
      <section className="border-t border-white/5 bg-[#0c0909] py-16 sm:py-24" id="fonctionnement">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#e8c98a]">
              SIMPLE, CLAIR, SANS SURPRISE
            </span>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
              Votre devis en 4 étapes
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/60">
              Aucun paiement avant validation. Vous composez votre demande, Bryan Cars fixe le prix exact, puis vous décidez.
            </p>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-4">
            {[
              { n: "01", icon: Car, title: "Composez", copy: "Choisissez votre véhicule, vos prestations et joignez ses photos." },
              { n: "02", icon: ShieldCheck, title: "Recevez", copy: "Bryan Cars étudie la demande et fixe votre prix exact." },
              { n: "03", icon: CheckCircle2, title: "Décidez", copy: "Payez le devis via SumUp ou refusez-le en indiquant votre motif." },
              { n: "04", icon: CalendarDays, title: "Planifiez", copy: "Après paiement, choisissez le jour, l'heure et le lieu de l'intervention." },
            ].map((item) => (
              <article className="group border border-white/10 bg-[#120e0e] p-5 transition hover:border-[#e8c98a]/45" key={item.n}>
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-[#e8c98a]/35 bg-[#e8c98a]/10 text-[#e8c98a]">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-xs font-bold tracking-widest text-white/25">{item.n}</span>
                </div>
                <h3 className="mt-5 text-base font-black uppercase tracking-wide text-white">{item.title}</h3>
                <p className="mt-2 text-xs leading-6 text-white/55">{item.copy}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              className="inline-flex items-center justify-center gap-2 bg-[#e8c98a] px-7 py-4 text-xs font-extrabold uppercase tracking-[0.16em] text-black transition hover:bg-[#f4dca0]"
              onClick={() => setAccountSignupModalOpen(true)}
              type="button"
            >
              Créer mon compte gratuitement
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              className="border border-white/20 px-7 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:border-white/45"
              onClick={() => setPortalLookupModalOpen(true)}
              type="button"
            >
              J'ai déjà un espace
            </button>
          </div>
        </div>
      </section>

      {/* ── PROGRAMME FONDATEUR ── */}
      <section className="relative overflow-hidden border-t border-emerald-300/10 bg-[#050a07] py-16 sm:py-24" id="fondateur">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(45,212,128,0.12),transparent_36%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
          <div>
            <span className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">
              Programme Fondateur
            </span>
            <h2 className="mt-5 max-w-2xl text-3xl font-black uppercase leading-tight text-white sm:text-5xl">
              L'entretien régulier, réservé aux passionnés
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/60">
              Accédez toute l'année aux prestations d'entretien intérieur, extérieur et complet réservées aux membres, tout en gagnant deux fois plus de BC'Coins.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-emerald-100">
              {["Prestations exclusives", "Priorité membre", "BC'Coins x2"].map((benefit) => (
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-3 py-2" key={benefit}>
                  {benefit}
                </span>
              ))}
            </div>
          </div>
          <div className="border border-emerald-300/25 bg-black/35 p-6 shadow-[0_30px_90px_rgba(16,185,129,0.12)] sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Accès Fondateur</p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-5xl font-black text-white">49,90 €</span>
              <span className="pb-1 text-xs uppercase tracking-wider text-white/40">accès membre</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/55">
              Créez votre espace gratuitement, puis demandez votre accès Fondateur depuis votre compte.
            </p>
            <button
              className="mt-6 flex w-full items-center justify-center gap-2 bg-emerald-300 px-6 py-4 text-xs font-black uppercase tracking-[0.17em] text-[#031008] transition hover:bg-emerald-200"
              onClick={() => setAccountSignupModalOpen(true)}
              type="button"
            >
              Devenir Fondateur
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

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
                controls
                loop
                playsInline
                preload="none"
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
              { id: "tout", label: "TOUT (PAR MODÈLE)" },
              { id: "interieur", label: "INTÉRIEUR" },
              { id: "exterieur", label: "EXTÉRIEUR" },
            ].map((cat) => (
              <button
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border rounded-full cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-[#e8c98a] text-black border-[#e8c98a] shadow-[0_0_15px_rgba(232,201,138,0.3)]"
                    : "bg-[#120e0e] text-white/70 border-white/10 hover:border-white/30 hover:text-white"
                }`}
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as ShowcaseCategory)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* RENDU EN FONCTION DE LA CATÉGORIE SÉLECTIONNÉE */}

          {/* VUE 1 : TOUT (Modèles de Véhicules) */}
          {selectedCategory === "tout" && (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {VEHICLE_MODELS.map((model) => (
                <div
                  className="group bg-[#120e0e] border border-white/10 rounded-2xl overflow-hidden hover:border-[#e8c98a]/60 transition-all duration-300 flex flex-col cursor-pointer shadow-xl"
                  key={model.id}
                  onClick={() => setActiveVehicleModal(model)}
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-black/60">
                    <img
                      alt={model.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-95 group-hover:brightness-100"
                      src={model.coverImage}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70 group-hover:opacity-40 transition-opacity" />

                    <span className="absolute top-3 left-3 bg-[#e8c98a] text-black text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded">
                      {model.pairs.length} TRANSFORMATION{model.pairs.length > 1 ? "S" : ""}
                    </span>

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 backdrop-blur-[2px]">
                      <span className="px-4 py-2 border border-white text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 bg-black/70 rounded-full">
                        <Eye className="h-4 w-4 text-[#e8c98a]" /> VOIR LES PHOTOS DU MODÈLE
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#e8c98a]">
                        {model.subtitle}
                      </span>
                      <h3 className="text-base font-bold text-white uppercase mt-0.5 leading-snug">
                        {model.name}
                      </h3>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-[#e8c98a]">
                      <span>DÉCOUVRIR LE VÉHICULE</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VUE 2 & 3 : INTÉRIEUR / EXTÉRIEUR (Cartes Avant/Après Directes sur la page) */}
          {selectedCategory !== "tout" && (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {GALLERY_PAIRS.filter((pair) => pair.category === selectedCategory).map((pair, index, array) => (
                <div
                  className="group bg-[#120e0e] border border-white/10 rounded-2xl overflow-hidden hover:border-[#e8c98a]/60 transition-all duration-300 flex flex-col cursor-pointer shadow-xl"
                  key={pair.id}
                  onClick={() => {
                    setLightboxPhotoList(array);
                    setLightboxActiveIndex(index);
                  }}
                >
                  <div className="p-3 border-b border-white/5 flex items-center justify-between bg-black/40">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#e8c98a]">
                      {pair.vehicleName}
                    </span>
                  </div>

                  {/* Comparatif Avant / Après direct */}
                  <div className="grid grid-cols-2 gap-1 p-2 bg-black">
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-rose-500/40">
                      <img alt="Avant" className="w-full h-full object-cover" src={pair.before} />
                      <span className="absolute top-1.5 left-1.5 bg-rose-600 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                        AVANT
                      </span>
                    </div>
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-emerald-500/40">
                      <img alt="Après" className="w-full h-full object-cover" src={pair.after} />
                      <span className="absolute top-1.5 right-1.5 bg-emerald-500 text-black text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                        APRÈS
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                    <h3 className="text-xs font-bold text-white uppercase leading-snug">
                      {pair.title}
                    </h3>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── MODAL VÉHICULE (Toutes les photos d'un modèle spécifique) ── */}
      {activeVehicleModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
          <div className="relative max-w-4xl w-full bg-[#120e0e] border border-white/20 rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#e8c98a]">
                  {activeVehicleModal.subtitle}
                </span>
                <h3 className="text-lg sm:text-2xl font-black uppercase text-white">
                  {activeVehicleModal.name}
                </h3>
              </div>
              <button
                className="p-2 text-white/60 hover:text-white rounded-full bg-white/5 hover:bg-white/10 cursor-pointer"
                onClick={() => setActiveVehicleModal(null)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeVehicleModal.pairs.map((pair, idx) => (
                  <div
                    key={pair.id}
                    className="bg-black/60 border border-white/10 rounded-2xl overflow-hidden p-3 space-y-2 cursor-pointer hover:border-[#e8c98a]/60 transition-all"
                    onClick={() => {
                      setLightboxPhotoList(activeVehicleModal.pairs);
                      setLightboxActiveIndex(idx);
                    }}
                  >
                    <h4 className="text-xs font-mono font-bold text-[#e8c98a] uppercase tracking-wider">
                      {pair.title}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-rose-500/40">
                        <img alt="Avant" className="w-full h-full object-cover" src={pair.before} />
                        <span className="absolute top-2 left-2 bg-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                          AVANT
                        </span>
                      </div>
                      <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-emerald-500/40">
                        <img alt="Après" className="w-full h-full object-cover" src={pair.after} />
                        <span className="absolute top-2 right-2 bg-emerald-500 text-black text-[9px] font-bold px-2 py-0.5 rounded">
                          APRÈS
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="w-full py-4 bg-[#e8c98a] text-black font-extrabold text-xs uppercase tracking-widest rounded-xl hover:bg-white transition-all shadow-xl cursor-pointer"
                onClick={() => {
                  setActiveVehicleModal(null);
                  scrollToSection("devis");
                }}
              >
                OBTENIR UN DEVIS POUR CE MODÈLE →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LIGHTBOX FULLSCREEN SLIDER AVEC FLÈCHES GAUCHE ET DROITE ── */}
      {lightboxActiveIndex !== null && lightboxPhotoList[lightboxActiveIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center p-4 sm:p-8">
          <button
            className="absolute top-6 right-6 p-3 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-all z-10 cursor-pointer"
            onClick={() => setLightboxActiveIndex(null)}
          >
            <X className="h-7 w-7" />
          </button>

          {/* Bouton Précédent */}
          {lightboxPhotoList.length > 1 && (
            <button
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-3 sm:p-4 bg-black/70 border border-white/20 text-white hover:bg-[#e8c98a] hover:text-black rounded-full transition-all z-10 cursor-pointer shadow-2xl"
              onClick={() =>
                setLightboxActiveIndex((prev) =>
                  prev === null || prev === 0 ? lightboxPhotoList.length - 1 : prev - 1
                )
              }
            >
              <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
            </button>
          )}

          {/* Contenu de la photo active */}
          <div className="max-w-5xl w-full space-y-4 text-center">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#e8c98a]">
                {lightboxPhotoList[lightboxActiveIndex].vehicleName} ({lightboxActiveIndex + 1} / {lightboxPhotoList.length})
              </span>
              <h3 className="text-lg sm:text-2xl font-black uppercase text-white">
                {lightboxPhotoList[lightboxActiveIndex].title}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[65vh]">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-rose-500/50 shadow-2xl bg-black">
                <img
                  alt="Avant"
                  className="w-full h-full object-cover"
                  src={lightboxPhotoList[lightboxActiveIndex].before}
                />
                <span className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow">
                  AVANT
                </span>
              </div>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-2xl bg-black">
                <img
                  alt="Après"
                  className="w-full h-full object-cover"
                  src={lightboxPhotoList[lightboxActiveIndex].after}
                />
                <span className="absolute top-3 right-3 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow">
                  APRÈS
                </span>
              </div>
            </div>

            <div className="pt-4 max-w-md mx-auto">
              <button
                className="w-full py-3.5 bg-[#e8c98a] text-black font-extrabold text-xs uppercase tracking-widest rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(232,201,138,0.4)] cursor-pointer"
                onClick={() => {
                  setLightboxActiveIndex(null);
                  setActiveVehicleModal(null);
                  scrollToSection("devis");
                }}
              >
                OBTENIR UN DEVIS POUR VOTRE VÉHICULE →
              </button>
            </div>
          </div>

          {/* Bouton Suivant */}
          {lightboxPhotoList.length > 1 && (
            <button
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-3 sm:p-4 bg-black/70 border border-white/20 text-white hover:bg-[#e8c98a] hover:text-black rounded-full transition-all z-10 cursor-pointer shadow-2xl"
              onClick={() =>
                setLightboxActiveIndex((prev) =>
                  prev === null || prev === lightboxPhotoList.length - 1 ? 0 : prev + 1
                )
              }
            >
              <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
            </button>
          )}
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

      {/* ── ENTREE UNIQUE VERS LE DEVIS ET LE RENDEZ-VOUS ── */}
      <section className="relative border-t border-white/5 bg-[#090707] py-16 sm:py-24" id="devis-intro">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#e8c98a]">
            DEVIS PERSONNALISÉ
          </span>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
            Composez votre demande dans votre espace
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/60">
            Créez votre compte gratuitement, renseignez votre véhicule, choisissez vos prestations et joignez vos photos. Bryan Cars fixe ensuite le prix exact ; le créneau ne se choisit qu&apos;après paiement.
          </p>
          <div className="mx-auto mt-8 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
            {["Panier de prestations clair", "Photos jointes à la demande", "Prix validé avant paiement"].map((item) => (
              <div className="flex items-center gap-3 border border-white/10 bg-white/[0.03] p-4 text-xs font-semibold text-white/75" key={item}>
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#e8c98a]" />
                {item}
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              className="inline-flex items-center justify-center gap-2 bg-[#e8c98a] px-8 py-4 text-xs font-extrabold uppercase tracking-[0.17em] text-black transition hover:bg-[#f4dca0]"
              onClick={() => scrollToSection("devis")}
              type="button"
            >
              Créer mon compte et commencer
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              className="border border-white/20 px-8 py-4 text-xs font-bold uppercase tracking-[0.17em] text-white transition hover:border-white/45"
              onClick={() => setPortalLookupModalOpen(true)}
              type="button"
            >
              Retrouver mon espace
            </button>
          </div>
        </div>
      </section>

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
              Choisissez vos prestations et joignez les photos de votre véhicule pour recevoir votre devis personnalisé.
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

                  <div className="sm:col-span-2">
                    <ServicePicker
                      catalog={SERVICE_CATALOG}
                      categories={SERVICE_CATEGORIES}
                      onChange={setSelectedQuoteServiceKeys}
                      selectedKeys={selectedQuoteServiceKeys}
                      tone="landing"
                    />
                  </div>

                  <div className="border border-white/15 bg-black/25 p-4 sm:col-span-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-white">État actuel du véhicule</p>
                        <p className="mt-1 text-[11px] text-white/45">0 = très dégradé · 10 = très propre</p>
                      </div>
                      <span className="border border-[#e8c98a]/30 bg-[#e8c98a]/10 px-3 py-1.5 text-xs font-black text-[#f4dca0]">{quoteConditionScore}/10</span>
                    </div>
                    <input
                      aria-label="État du véhicule sur 10"
                      className="mt-4 h-2 w-full cursor-pointer accent-[#e8c98a]"
                      max="10"
                      min="0"
                      onChange={(event) => setQuoteConditionScore(Number(event.target.value))}
                      step="1"
                      type="range"
                      value={quoteConditionScore}
                    />
                    <div className="mt-2 flex justify-between text-[9px] font-bold uppercase tracking-[0.1em] text-white/30"><span>Très dégradé</span><span>Très propre</span></div>
                  </div>

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
                      Photos du Véhicule * (Jusqu&apos;à 5 photos)
                    </span>
                    {selectedPhotos.length === 0 && (
                      <p className="border border-amber-300/20 bg-amber-300/[0.06] px-3 py-2 text-[11px] leading-5 text-amber-100/80">
                        Les photos sont obligatoires pour permettre à l&apos;atelier d&apos;évaluer correctement le devis. Ajoutez-en au moins une.
                      </p>
                    )}
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
                  disabled={
                    busy ||
                    !acceptedTerms ||
                    !form.email ||
                    !form.firstName ||
                    !form.phone ||
                    !form.vehicleModel ||
                    selectedQuoteServiceKeys.length === 0
                  }
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
                    Votre demande de devis et vos photos ont bien été transmises à l&apos;équipe. Vous recevrez un e-mail avec un lien direct dès que votre prix sera prêt.
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
