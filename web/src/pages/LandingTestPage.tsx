import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { ArrowUpRight, Sparkles, Shield, Award, Layers, Eye, RefreshCw, ChevronDown } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export function LandingTestPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const pinSectionRef = useRef<HTMLDivElement | null>(null);
  const maskSectionRef = useRef<HTMLDivElement | null>(null);
  const maskSliderRef = useRef<HTMLDivElement | null>(null);

  const [activeStage, setActiveStage] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);

  // ── 1. GESTION DU CURSEUR PERSONNALISÉ ──
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // ── 2. SCÈNE 3D WEBGL (THREE.JS) ──
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100,
    );
    camera.position.z = 6;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const goldSpotLight = new THREE.SpotLight(0xe8c98a, 4);
    goldSpotLight.position.set(5, 5, 5);
    scene.add(goldSpotLight);

    const blueSpotLight = new THREE.SpotLight(0x38bdf8, 2);
    blueSpotLight.position.set(-5, -5, 3);
    scene.add(blueSpotLight);

    // 3D Object: Car Silhouette Geometry (Torus Knot + Metallic Shell)
    const geometry = new THREE.TorusKnotGeometry(1.2, 0.38, 128, 32);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x121214,
      metalness: 0.9,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      emissive: 0x1a150c,
      wireframe: false,
    });
    const carObject = new THREE.Mesh(geometry, material);
    scene.add(carObject);

    // Particles Cloud around 3D mesh
    const particlesCount = 200;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 10;
    }
    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(posArray, 3),
    );
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.025,
      color: 0xe8c98a,
      transparent: true,
      opacity: 0.6,
    });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      particlesMesh.rotation.y += 0.001;
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!canvas) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    // ── GSAP SCROLLTRIGGER 3D BINDINGS ──
    const ctx = gsap.context(() => {
      // Rotation 3D basée sur le scroll
      gsap.to(carObject.rotation, {
        x: Math.PI * 2,
        y: Math.PI * 3,
        z: Math.PI,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.2,
        },
      });

      // Modification de la couleur/lumière au fil du scroll
      gsap.to(material.color, {
        r: 0.91,
        g: 0.78,
        b: 0.54, // Coloration or liquide
        ease: "none",
        scrollTrigger: {
          trigger: pinSectionRef.current,
          start: "top center",
          end: "bottom center",
          scrub: 1,
        },
      });
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      ctx.revert();
      renderer.dispose();
    };
  }, []);

  // ── 3. ANIMATIONS GSAP SCROLLTRIGGER SUR LE TEXTE ET SECTIONS PINNED ──
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Title Staggering
      gsap.fromTo(
        ".hero-title-char",
        { y: 120, opacity: 0, rotateX: -45 },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          stagger: 0.04,
          duration: 1.2,
          ease: "power4.out",
          delay: 0.2,
        },
      );

      // Section Pinned Experience
      if (pinSectionRef.current) {
        ScrollTrigger.create({
          trigger: pinSectionRef.current,
          start: "top top",
          end: "+=300%",
          pin: true,
          scrub: 0.5,
          onUpdate: (self) => {
            const progress = self.progress;
            if (progress < 0.25) setActiveStage(0);
            else if (progress < 0.5) setActiveStage(1);
            else if (progress < 0.75) setActiveStage(2);
            else setActiveStage(3);
          },
        });
      }

      // Transition par Masque Avant / Après (Curtain Reveal)
      if (maskSectionRef.current && maskSliderRef.current) {
        gsap.to(maskSliderRef.current, {
          width: "100%",
          ease: "none",
          scrollTrigger: {
            trigger: maskSectionRef.current,
            start: "top top",
            end: "+=150%",
            pin: true,
            scrub: 1,
          },
        });
      }
    });

    return () => ctx.revert();
  }, []);

  const stages = [
    {
      num: "01",
      title: "DÉCONTAMINATION ULTRASONIQUE",
      desc: "Nettoyage cryogénique et élimination micrométrique de toutes les impuretés accumulées.",
      badge: "Étape Préliminaire",
    },
    {
      num: "02",
      title: "POLISSAGE CORRECTION 3-PASS",
      desc: "Suppression de 99.8% des micro-rayures et restauration de la transparence du vernis d'origine.",
      badge: "Optique & Restauration",
    },
    {
      num: "03",
      title: "BOUCLIER CÉRAMIQUE 9H CARPRO",
      desc: "Coque de protection nano-cristalline hydrophobe résistant aux UV, acides et micro-impacts.",
      badge: "Protection Céramique",
    },
    {
      num: "04",
      title: "FINITION SIGNATURE BRYAN CARS",
      desc: "Traitement cuir hydrophobe, soin nourissant et inspection sous éclairage LED chirurgical.",
      badge: "Excellence Finale",
    },
  ];

  return (
    <div className="min-h-screen bg-[#080708] text-white selection:bg-[#e8c98a] selection:text-black font-sans relative overflow-x-hidden">
      {/* ── CURSEUR SUR-MESURE AWWWARDS ── */}
      <div
        className="pointer-events-none fixed z-[999] rounded-full transition-transform duration-75 ease-out -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${cursorPos.x}px`,
          top: `${cursorPos.y}px`,
          width: isHovered ? "60px" : "24px",
          height: isHovered ? "60px" : "24px",
          background: isHovered ? "rgba(232, 201, 138, 0.25)" : "rgba(232, 201, 138, 0.8)",
          border: isHovered ? "1.5px solid #e8c98a" : "none",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* ── HUD HEADER FLOATING ── */}
      <header className="fixed top-6 inset-x-0 z-50 px-6 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-2xl border border-white/10 px-4 py-2.5 rounded-full shadow-2xl">
          <span className="h-2 w-2 rounded-full bg-[#e8c98a] animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#e8c98a] font-bold">
            EXPERIMENT // LOCALHOST 3D GSAP
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 bg-black/60 backdrop-blur-2xl border border-white/10 px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider text-white/70">
          <a href="#hero" className="hover:text-[#e8c98a] transition">Vision</a>
          <a href="#experience" className="hover:text-[#e8c98a] transition">Process 3D</a>
          <a href="#mask" className="hover:text-[#e8c98a] transition">Avant/Après</a>
        </nav>

        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-[#e8c98a] text-black font-bold text-xs px-5 py-2.5 rounded-full hover:bg-white transition-all shadow-[0_0_24px_rgba(232,201,138,0.4)]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <span>RETOUR AU SITE</span>
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </header>

      {/* ── 3D CANVAS EN ARRIÈRE-PLAN ── */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-85">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* ── 1. SECTION HERO CINÉMATIQUE ── */}
      <section ref={heroRef} id="hero" className="relative z-10 min-h-screen flex flex-col justify-between px-6 pt-32 pb-16 max-w-7xl mx-auto">
        <div className="space-y-6 max-w-4xl mt-12">
          <div className="inline-flex items-center gap-2 border border-[#e8c98a]/30 bg-[#e8c98a]/10 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#e8c98a]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>BRYAN CARS — STUDIO EXPERIMENTAL</span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold uppercase tracking-tight leading-[0.9] text-white">
            {"L'ART DU DETAILING".split("").map((char, index) => (
              <span key={index} className="hero-title-char inline-block">
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
            <br />
            <span className="text-transparent bg-clip-text bg-[linear-gradient(135deg,#ffffff_0%,#e8c98a_60%,#99793d_100%)]">
              ULTRA PRESTIGE
            </span>
          </h1>

          <p className="text-base sm:text-xl text-white/60 font-light max-w-2xl leading-relaxed">
            Une expérience immersive scroll-driven sculptée pour sublimer les carrosseries d&apos;exception. Polissage miroir &amp; protection céramique sous contrôle optique.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6 border-t border-white/10 pt-8">
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
              <p className="text-2xl font-bold font-mono text-white">5.0★</p>
              <p className="text-[10px] uppercase tracking-widest text-white/50">Avis Google Verified</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-white/40 uppercase animate-bounce">
            <span>Scroll pour explorer</span>
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </section>

      {/* ── 2. SECTION PINNED 3D PROCESS (GSAP SCROLLTRIGGER PIN) ── */}
      <section ref={pinSectionRef} id="experience" className="relative z-10 h-screen flex items-center justify-center px-6">
        <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Côté Gauche : Texte interactif selon le scroll */}
          <div className="space-y-6">
            <span className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-[#e8c98a]">
              ETAPE {stages[activeStage].num} / 04
            </span>

            <h2 className="text-4xl sm:text-6xl font-extrabold uppercase tracking-tight text-white transition-all duration-500">
              {stages[activeStage].title}
            </h2>

            <p className="text-lg text-white/70 leading-relaxed max-w-xl transition-all duration-500">
              {stages[activeStage].desc}
            </p>

            <div className="pt-4">
              <span className="inline-block border border-white/20 bg-white/5 px-4 py-2 rounded-full text-xs font-semibold text-[#e8c98a]">
                {stages[activeStage].badge}
              </span>
            </div>

            {/* Barre de progression des 4 étapes */}
            <div className="flex items-center gap-3 pt-8">
              {stages.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                    idx === activeStage ? "bg-[#e8c98a] scale-y-125" : "bg-white/15"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Côté Droit : Hub d'informations HUD 3D */}
          <div className="relative p-8 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-3xl space-y-6 shadow-[0_0_80px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="text-xs font-mono text-white/50">TELEMETRIE WEBGL</span>
              <span className="text-xs font-mono text-[#e8c98a] animate-pulse">ACTIVE // 60 FPS</span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Réflectivité de la surface</span>
                <span className="font-mono text-[#e8c98a]">{(activeStage + 1) * 24.8}%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#e8c98a] h-full transition-all duration-700"
                  style={{ width: `${(activeStage + 1) * 25}%` }}
                />
              </div>

              <div className="flex justify-between text-sm pt-2">
                <span className="text-white/60">Épaisseur Nano-Couche</span>
                <span className="font-mono text-white">{(activeStage + 1) * 2.5} µm</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-white h-full transition-all duration-700"
                  style={{ width: `${(activeStage + 1) * 25}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-[#e8c98a]/20 bg-[#e8c98a]/5 text-xs text-[#e8c98a] leading-relaxed">
              * Ce module 3D réagit précisément à la molette et au scroll tactile grâce à GSAP ScrollTrigger.
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. SECTION MASQUE AVANT / APRÈS (CURTAIN REVEAL) ── */}
      <section ref={maskSectionRef} id="mask" className="relative z-10 h-screen flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Image de fond (Avant : Peinture terne / brut) */}
          <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(40,40,45,1),rgba(10,10,12,1))]">
            <div className="text-center space-y-4 px-4">
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-rose-400 font-bold">
                ÉTAT INITIAL // SANS TRAITEMENT
              </span>
              <h3 className="text-4xl sm:text-6xl font-extrabold uppercase text-white/40">
                VERNIS OXYDÉ &amp; MICRO-RAYURES
              </h3>
            </div>
          </div>

          {/* Image Masquée au Scroll (Après : Miroir Or & Céramique 9H) */}
          <div
            ref={maskSliderRef}
            className="absolute inset-y-0 left-0 w-0 overflow-hidden bg-[radial-gradient(circle_at_center,rgba(232,201,138,0.25),rgba(8,7,8,1))] border-r-2 border-[#e8c98a] transition-all"
          >
            <div className="absolute inset-0 w-screen h-full flex items-center justify-center">
              <div className="text-center space-y-4 px-4">
                <span className="text-xs font-mono uppercase tracking-[0.3em] text-[#e8c98a] font-bold">
                  RÉSULTAT FINI // POLISSAGE MIROIR BC
                </span>
                <h3 className="text-4xl sm:text-6xl font-extrabold uppercase text-transparent bg-clip-text bg-[linear-gradient(135deg,#ffffff,#e8c98a)]">
                  CLARTÉ CRISTALLINE &amp; ECLAT SUPRÊME
                </h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER EXPERIMENTAL ── */}
      <footer className="relative z-10 border-t border-white/10 bg-[#080708] py-16 px-6 text-center space-y-6">
        <h4 className="text-2xl font-bold uppercase text-white">BRYAN CARS DETAILING</h4>
        <p className="text-xs text-white/50 max-w-md mx-auto">
          Landing page de démonstration expérimentale Awwwards (GSAP ScrollTrigger + Three.js WebGL).
        </p>
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-6 py-3 rounded-full text-xs font-bold text-white hover:bg-[#e8c98a] hover:text-black transition-all"
          >
            RETOUNER SUR BLACKBOX
          </Link>
        </div>
      </footer>
    </div>
  );
}
