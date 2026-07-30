import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  Sliders,
} from "lucide-react";

import { BugattiCarModel } from "../components/landing-test/BugattiCarModel";
import { ContextualGallery } from "../components/landing-test/ContextualGallery";
import { DirectorOverlay } from "../components/landing-test/DirectorOverlay";
import {
  ImageComparison,
  ImageComparisonImage,
  ImageComparisonSlider,
} from "../components/landing-test/ImageComparison";
import {
  StackingCards,
  StackingCardItem,
} from "../components/landing-test/StackingCards";
import {
  type CameraShot,
  loadCameraShots,
  saveCameraShots,
  INITIAL_CAMERA_SHOTS,
} from "../../../src/features/landing-test/config/cameraShots";

gsap.registerPlugin(ScrollTrigger);

// ── COMPOSANT CAMÉRA ANIMÉE ULTRALISSE & SUIVI DE TÉLÉMÉTRIE R3F ──
function DirectorCameraControls({
  isDirector,
  enableZqsd,
  cameraPos,
  targetPos,
  fov,
  onTelemetryUpdate,
}: {
  isDirector: boolean;
  enableZqsd: boolean;
  cameraPos: [number, number, number];
  targetPos: [number, number, number];
  fov: number;
  onTelemetryUpdate: (pos: [number, number, number], target: [number, number, number], fov: number) => void;
}) {
  const { camera } = useThree();
  const orbitRef = useRef<any>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const vecCam = useRef(new THREE.Vector3());
  const vecTarget = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3(targetPos[0], targetPos[1], targetPos[2]));

  // Force la réinitialisation de la position de la caméra et de la cible dans OrbitControls lors des changements externes (sélection de prise)
  useEffect(() => {
    if (isDirector && orbitRef.current) {
      camera.position.set(cameraPos[0], cameraPos[1], cameraPos[2]);
      orbitRef.current.target.set(targetPos[0], targetPos[1], targetPos[2]);
      orbitRef.current.update();
    }
  }, [isDirector, cameraPos[0], cameraPos[1], cameraPos[2], targetPos[0], targetPos[1], targetPos[2], camera]);

  // Gestionnaires des touches du clavier pour ZQSD / WASD / Flèches
  useEffect(() => {
    if (!isDirector || !enableZqsd) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) return;
      keysRef.current[e.key.toLowerCase()] = true;
      keysRef.current[e.code.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
      keysRef.current[e.code.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isDirector, enableZqsd]);

  // Mise à jour du FOV
  useEffect(() => {
    if (camera && "fov" in camera) {
      (camera as THREE.PerspectiveCamera).fov = fov;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
  }, [camera, fov]);

  useFrame((_, delta) => {
    if (!isDirector) {
      // Amortissement exponentiel ultra-lisse pour éliminer tout saccadement (60 FPS / 120 FPS Fluidité Pro)
      const factor = THREE.MathUtils.clamp(delta * 8.0, 0.05, 1.0);
      vecCam.current.set(...cameraPos);
      vecTarget.current.set(...targetPos);

      camera.position.lerp(vecCam.current, factor);
      currentLookAt.current.lerp(vecTarget.current, factor);
      camera.lookAt(currentLookAt.current);
    } else if (orbitRef.current) {
      // DÉPLACEMENT VOLANT CLAVIER ZQSD / WASD SI ACTIF
      if (enableZqsd) {
        const speed = 3.5 * delta;
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);

        const sideDir = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
        const move = new THREE.Vector3();

        // Z / W / ArrowUp -> Avancer
        if (keysRef.current["z"] || keysRef.current["w"] || keysRef.current["arrowup"] || keysRef.current["keyw"] || keysRef.current["keyz"]) {
          move.addScaledVector(dir, speed);
        }
        // S / ArrowDown -> Reculer
        if (keysRef.current["s"] || keysRef.current["arrowdown"] || keysRef.current["keys"]) {
          move.addScaledVector(dir, -speed);
        }
        // Q / A / ArrowLeft -> Gauche
        if (keysRef.current["q"] || keysRef.current["a"] || keysRef.current["arrowleft"] || keysRef.current["keya"] || keysRef.current["keyq"]) {
          move.addScaledVector(sideDir, -speed);
        }
        // D / ArrowRight -> Droite
        if (keysRef.current["d"] || keysRef.current["arrowright"] || keysRef.current["keyd"]) {
          move.addScaledVector(sideDir, speed);
        }
        // Espace -> Monter
        if (keysRef.current["space"] || keysRef.current[" "]) {
          move.y += speed;
        }
        // Shift -> Descendre
        if (keysRef.current["shift"] || keysRef.current["shiftleft"]) {
          move.y -= speed;
        }

        if (move.lengthSq() > 0) {
          camera.position.add(move);
          orbitRef.current.target.add(move);
          orbitRef.current.update();
        }
      }

      const pos: [number, number, number] = [
        Number(camera.position.x.toFixed(2)),
        Number(camera.position.y.toFixed(2)),
        Number(camera.position.z.toFixed(2)),
      ];
      const target: [number, number, number] = [
        Number(orbitRef.current.target.x.toFixed(2)),
        Number(orbitRef.current.target.y.toFixed(2)),
        Number(orbitRef.current.target.z.toFixed(2)),
      ];
      const currentFov = "fov" in camera ? (camera as THREE.PerspectiveCamera).fov : 45;
      onTelemetryUpdate(pos, target, currentFov);
    }
  });

  if (isDirector) {
    return (
      <OrbitControls
        ref={orbitRef}
        makeDefault
        target={targetPos}
        enableZoom={true}
        zoomSpeed={1.5}
        minDistance={0.2}
        maxDistance={40.0}
        enablePan={true}
        screenSpacePanning={true}
        enableDamping
        dampingFactor={0.05}
      />
    );
  }

  return null;
}

export function LandingTestPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isDirectorMode = searchParams.get("director") === "1";

  const sequenceRef = useRef<HTMLDivElement>(null);

  // ── ÉTATS DE LA SCÈNE 3D ──
  const [activeStage, setActiveStage] = useState(0);
  const [carRotation, setCarRotation] = useState<[number, number, number]>([0, 0.3, 0]);
  const [carPosition, setCarPosition] = useState<[number, number, number]>([0, -0.6, 0]);
  const [cameraPos, setCameraPos] = useState<[number, number, number]>([0, 1.8, 8.5]);
  const [targetPos, setTargetPos] = useState<[number, number, number]>([0, 0.4, 0]);
  const [fov, setFov] = useState<number>(45);

  // ── DIRECTOR MODE CONTROLS ──
  const [enableZqsd, setEnableZqsd] = useState(true);
  const [shots, setShots] = useState<CameraShot[]>(() => loadCameraShots());
  const [currentShotIndex, setCurrentShotIndex] = useState(0);
  const [selectedNodeName, setSelectedNodeName] = useState<string | null>(null);
  const [selectedNodeInfo, setSelectedNodeInfo] = useState<{ width: number; height: number; depth: number } | null>(null);
  const [nodesList, setNodesList] = useState<string[]>([]);
  const [showGrid, setShowGrid] = useState(false);
  const [showAxes, setShowAxes] = useState(false);
  const [showTargetDot, setShowTargetDot] = useState(false);
  const [isTransitionPlaying, setIsTransitionPlaying] = useState(false);

  // Modale Lightbox Photo
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Formulaire Devis / RDV
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

  // Sauvegarde auto des prises dans localStorage
  useEffect(() => {
    saveCameraShots(shots);
  }, [shots]);

  // Synchronisation de la prise sélectionnée vers les états de la caméra
  const handleSelectShot = (idx: number) => {
    setCurrentShotIndex(idx);
    const shot = shots[idx];
    if (shot) {
      setCameraPos([...shot.cameraPosition]);
      setTargetPos([...shot.cameraTarget]);
      setFov(shot.fov);
      setCarPosition([...shot.carPosition]);
      setCarRotation([...shot.carRotation]);
    }
  };

  // ── GSAP SCROLLTRIGGER AVEC SNAP AUTOMATIQUE PRISE-À-PRISE ET FLUIDITÉ SANS SACCADE ──
  useEffect(() => {
    if (isDirectorMode || !sequenceRef.current || shots.length === 0) return;

    const ctx = gsap.context(() => {
      const count = shots.length;
      if (count < 2) return;

      const totalSegments = count - 1;

      gsap.timeline({
        scrollTrigger: {
          trigger: sequenceRef.current,
          start: "top top",
          end: "+=600%",
          pin: true,
          scrub: 0.8,
          // SNAP CINÉMATIQUE SUR LES PRISES DE VUE: Un coup de scroll déclenche un mouvement fluide complet d'une prise à l'autre !
          snap: {
            snapTo: 1 / totalSegments,
            duration: { min: 0.8, max: 1.4 },
            delay: 0.05,
            ease: "power2.inOut",
          },
          onUpdate: (self) => {
            const p = self.progress;

            const rawSeg = p * totalSegments;
            const segment = Math.min(totalSegments - 1, Math.floor(rawSeg));
            const subP = rawSeg - segment;

            const shotA = shots[segment];
            const shotB = shots[segment + 1] || shots[segment];

            if (shotA && shotB) {
              setCameraPos([
                shotA.cameraPosition[0] + (shotB.cameraPosition[0] - shotA.cameraPosition[0]) * subP,
                shotA.cameraPosition[1] + (shotB.cameraPosition[1] - shotA.cameraPosition[1]) * subP,
                shotA.cameraPosition[2] + (shotB.cameraPosition[2] - shotA.cameraPosition[2]) * subP,
              ]);

              setTargetPos([
                shotA.cameraTarget[0] + (shotB.cameraTarget[0] - shotA.cameraTarget[0]) * subP,
                shotA.cameraTarget[1] + (shotB.cameraTarget[1] - shotA.cameraTarget[1]) * subP,
                shotA.cameraTarget[2] + (shotB.cameraTarget[2] - shotA.cameraTarget[2]) * subP,
              ]);

              setFov(shotA.fov + (shotB.fov - shotA.fov) * subP);

              setCarRotation([
                shotA.carRotation[0] + (shotB.carRotation[0] - shotA.carRotation[0]) * subP,
                shotA.carRotation[1] + (shotB.carRotation[1] - shotA.carRotation[1]) * subP,
                shotA.carRotation[2] + (shotB.carRotation[2] - shotA.carRotation[2]) * subP,
              ]);

              setCarPosition([
                shotA.carPosition[0] + (shotB.carPosition[0] - shotA.carPosition[0]) * subP,
                shotA.carPosition[1] + (shotB.carPosition[1] - shotA.carPosition[1]) * subP,
                shotA.carPosition[2] + (shotB.carPosition[2] - shotA.carPosition[2]) * subP,
              ]);

              // Définition de l'étape active en fonction du segment
              if (p < 0.25) setActiveStage(0);
              else if (p < 0.5) setActiveStage(1);
              else if (p < 0.75) setActiveStage(2);
              else if (p < 0.9) setActiveStage(3);
              else setActiveStage(4);
            }
          },
        },
      });
    });

    return () => ctx.revert();
  }, [isDirectorMode, shots]);

  // Callback mise à jour télémétrie en Director mode
  const handleTelemetryUpdate = useCallback(
    (pos: [number, number, number], target: [number, number, number], currentFov: number) => {
      setCameraPos(pos);
      setTargetPos(target);
      setFov(currentFov);
    },
    []
  );

  // Zoom handlers (Boutons Zoom In / Zoom Out)
  const handleZoomIn = () => {
    setCameraPos((prev) => [
      Number((prev[0] * 0.85).toFixed(2)),
      Number((prev[1] * 0.85).toFixed(2)),
      Number((prev[2] * 0.85).toFixed(2)),
    ]);
  };

  const handleZoomOut = () => {
    setCameraPos((prev) => [
      Number((prev[0] * 1.18).toFixed(2)),
      Number((prev[1] * 1.18).toFixed(2)),
      Number((prev[2] * 1.18).toFixed(2)),
    ]);
  };

  // Recadrage automatique sur un Node sélectionné
  const handleRecenterOnNode = (nodeName: string) => {
    setSelectedNodeName(nodeName);
    if (nodeName.toLowerCase().includes("front") || nodeName.toLowerCase().includes("hood")) {
      setCameraPos([1.5, 0.9, 3.2]);
      setTargetPos([0, 0.45, 1.2]);
    } else if (nodeName.toLowerCase().includes("door") || nodeName.toLowerCase().includes("side")) {
      setCameraPos([3.6, 1.0, 0.1]);
      setTargetPos([0, 0.4, 0]);
    } else if (nodeName.toLowerCase().includes("interior") || nodeName.toLowerCase().includes("seat") || nodeName.toLowerCase().includes("wheel")) {
      setCameraPos([-0.65, 1.15, 0.55]);
      setTargetPos([-0.4, 0.85, -0.15]);
    } else if (nodeName.toLowerCase().includes("rear") || nodeName.toLowerCase().includes("diffuser")) {
      setCameraPos([-2.1, 1.2, -3.3]);
      setTargetPos([0, 0.45, -1.1]);
    }
  };

  // Enregistrer le cadrage actuel exact sur la prise sélectionnée
  const handleSaveCurrentShot = () => {
    setShots((prev) => {
      const updated = [...prev];
      if (updated[currentShotIndex]) {
        updated[currentShotIndex] = {
          ...updated[currentShotIndex],
          cameraPosition: [...cameraPos],
          cameraTarget: [...targetPos],
          fov,
          carPosition: [...carPosition],
          carRotation: [...carRotation],
          selectedFocusNode: selectedNodeName,
        };
      }
      return updated;
    });
  };

  const handleAddShot = () => {
    const newShot: CameraShot = {
      id: `shot-${Date.now()}`,
      label: `${shots.length + 1}. Prise Sur-Mesure`,
      cameraPosition: [...cameraPos],
      cameraTarget: [...targetPos],
      fov,
      carPosition: [...carPosition],
      carRotation: [...carRotation],
      selectedFocusNode: selectedNodeName,
      duration: 2.5,
      hold: 1.0,
      easing: "power2.inOut",
    };
    setShots((prev) => [...prev, newShot]);
    setCurrentShotIndex(shots.length);
  };

  const handleDeleteShot = (index: number) => {
    if (shots.length <= 1) return;
    setShots((prev) => prev.filter((_, i) => i !== index));
    handleSelectShot(Math.max(0, index - 1));
  };

  // TESTER LES TRANSITIONS ENTRE PRISES (Démarrage depuis la position réelle instantanée)
  const handlePlayTransition = (forward = true) => {
    if (isTransitionPlaying) return;
    const nextIdx = forward
      ? (currentShotIndex + 1) % shots.length
      : (currentShotIndex - 1 + shots.length) % shots.length;

    const startCamPos: [number, number, number] = [...cameraPos];
    const startTargetPos: [number, number, number] = [...targetPos];
    const startFov = fov;
    const startCarRot: [number, number, number] = [...carRotation];

    const toShot = shots[nextIdx];
    if (!toShot) return;

    setIsTransitionPlaying(true);
    const duration = toShot.duration || 2.5;

    gsap.to(
      {},
      {
        duration,
        ease: toShot.easing || "power2.inOut",
        onUpdate: function () {
          const p = this.progress();

          setCameraPos([
            startCamPos[0] + (toShot.cameraPosition[0] - startCamPos[0]) * p,
            startCamPos[1] + (toShot.cameraPosition[1] - startCamPos[1]) * p,
            startCamPos[2] + (toShot.cameraPosition[2] - startCamPos[2]) * p,
          ]);

          setTargetPos([
            startTargetPos[0] + (toShot.cameraTarget[0] - startTargetPos[0]) * p,
            startTargetPos[1] + (toShot.cameraTarget[1] - startTargetPos[1]) * p,
            startTargetPos[2] + (toShot.cameraTarget[2] - startTargetPos[2]) * p,
          ]);

          setFov(startFov + (toShot.fov - startFov) * p);

          setCarRotation([
            startCarRot[0] + (toShot.carRotation[0] - startCarRot[0]) * p,
            startCarRot[1] + (toShot.carRotation[1] - startCarRot[1]) * p,
            startCarRot[2] + (toShot.carRotation[2] - startCarRot[2]) * p,
          ]);
        },
        onComplete: () => {
          setIsTransitionPlaying(false);
          setCurrentShotIndex(nextIdx);
        },
      }
    );
  };

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(shots, null, 2);
    navigator.clipboard.writeText(jsonStr);
  };

  const handleExportShots = () => {
    const jsonStr = JSON.stringify(shots, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cameraShots.json";
    a.click();
    URL.revokeObjectURL(url);
  };

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
    { title: "01 — FACE AVANT", subtitle: "Impact, brillance et calandre.", desc: "Inspection de la calandre, du capot et des phares LED sous projecteurs 5000K." },
    { title: "02 — LA LIGNE", subtitle: "Corriger les défauts du profil.", desc: "Correction multi-passes des portières, bas de caisse et jantes." },
    { title: "03 — L’HABITACLE", subtitle: "Soin intérieur & Cuir noble.", desc: "Dégraissage et nourrissage des cuirs d'origine, soin du volant et plastiques." },
    { title: "04 — LA SIGNATURE", subtitle: "Finition arrière & Diffuseur.", desc: "Polissage du coffre, feux LED et pose de la céramique 9H CarPro." },
    { title: "05 — LA TRANSFORMATION", subtitle: "Réassemblage complet.", desc: "Votre Bugatti Chiron Super Sport prête pour la livraison." },
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
      {/* ── HEADER FLOATING PROTOTYPE & BOUTON TOGGLE DIRECTOR ── */}
      <header className="fixed top-4 inset-x-0 z-50 px-4 sm:px-6 max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 bg-[#0c0b0e]/85 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full shadow-2xl">
          <img src="/bc-gold-logo.png" alt="BlackBox" className="h-6 w-auto" />
          <span className="text-xs font-mono font-bold tracking-widest text-[#e8c98a]">
            INSIDE THE BLACK BOX
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {/* BOUTON TOGGLE MODE DIRECTOR (?director=1) */}
          <button
            type="button"
            onClick={() => {
              if (isDirectorMode) {
                setSearchParams({});
              } else {
                setSearchParams({ director: "1" });
              }
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-bold border transition shadow-xl cursor-pointer ${
              isDirectorMode
                ? "border-[#e8c98a] bg-[#e8c98a] text-black"
                : "border-white/20 bg-black/60 text-[#e8c98a] hover:bg-white/10"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>{isDirectorMode ? "QUITTER MODE DIRECTOR" : "MODE DIRECTOR 3D (?director=1)"}</span>
          </button>

          <a
            href="#booking"
            className="inline-flex items-center gap-2 bg-[#e8c98a] text-black font-bold text-xs px-5 py-2.5 rounded-full hover:bg-white transition-all shadow-[0_0_20px_rgba(232,201,138,0.3)]"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">PRENDRE RDV</span>
          </a>
        </div>
      </header>

      {/* ── MODE DIRECTOR OVERLAY SI ?director=1 ── */}
      {isDirectorMode && (
        <DirectorOverlay
          cameraPosition={cameraPos}
          cameraTarget={targetPos}
          fov={fov}
          carRotation={carRotation}
          selectedNodeName={selectedNodeName}
          selectedNodeInfo={selectedNodeInfo}
          nodesList={nodesList}
          shots={shots}
          currentShotIndex={currentShotIndex}
          showGrid={showGrid}
          showAxes={showAxes}
          showTargetDot={showTargetDot}
          enableZqsd={enableZqsd}
          isTransitionPlaying={isTransitionPlaying}
          onToggleGrid={() => setShowGrid(!showGrid)}
          onToggleAxes={() => setShowAxes(!showAxes)}
          onToggleTargetDot={() => setShowTargetDot(!showTargetDot)}
          onToggleZqsd={() => setEnableZqsd(!enableZqsd)}
          onChangeFov={(newFov) => setFov(newFov)}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onSelectNode={(nodeName) => setSelectedNodeName(nodeName)}
          onRecenterOnNode={handleRecenterOnNode}
          onSelectShot={handleSelectShot}
          onAddShot={handleAddShot}
          onSaveCurrentShot={handleSaveCurrentShot}
          onDeleteShot={handleDeleteShot}
          onPlayTransition={handlePlayTransition}
          onExportShots={handleExportShots}
          onCopyJson={handleCopyJson}
          onResetShotsToDefault={() => {
            setShots(INITIAL_CAMERA_SHOTS);
            handleSelectShot(0);
          }}
          onChangeDuration={(dur) => {
            setShots((prev) => {
              const updated = [...prev];
              if (updated[currentShotIndex]) updated[currentShotIndex].duration = dur;
              return updated;
            });
          }}
          onChangeEasing={(ease) => {
            setShots((prev) => {
              const updated = [...prev];
              if (updated[currentShotIndex]) updated[currentShotIndex].easing = ease;
              return updated;
            });
          }}
        />
      )}

      {/* ── SECTION 1 — INTRODUCTION ── */}
      <section className="relative min-h-[70vh] flex flex-col justify-between px-4 sm:px-6 pt-28 pb-8 max-w-7xl mx-auto z-10">
        <div className="space-y-4 max-w-3xl mt-8">
          <div className="inline-flex items-center gap-2 border border-[#e8c98a]/30 bg-[#e8c98a]/10 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#e8c98a]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>EXPÉRIENCE 3D BUGATTI CHIRON SUPER SPORT 300+</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold uppercase tracking-tight leading-[0.95] text-white">
            ENTREZ DANS LA <br />
            <span className="text-transparent bg-clip-text bg-[#e8c98a] bg-gradient-to-r from-white via-[#e8c98a] to-[#99793d]">
              BLACK BOX.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-white/70 font-light max-w-xl leading-relaxed">
            Exploration 3D cinématique haute précision de la Bugatti Chiron Super Sport. Observez la décomposition des éléments et les dossiers de référence sous tous les angles.
          </p>
        </div>
      </section>

      {/* ── SECTION 2 — SCÈNE 3D DE LA BUGATTI CHIRON (65-70% SUPÉRIEUR D'ÉCRAN) ── */}
      <section ref={sequenceRef} id="sequence" className={`relative ${isDirectorMode ? "h-screen" : "min-h-[500vh]"} bg-[#060608]`}>
        <div className="sticky top-0 h-[70vh] w-full overflow-hidden flex flex-col justify-between p-4">
          {/* Canvas WebGL R3F Bugatti Chiron (70% Supérieur) */}
          <div className="absolute inset-0 z-0">
            <Canvas camera={{ position: cameraPos, fov }}>
              <color attach="background" args={["#060608"]} />

              {/* Éclairage Studio Automobile & Reflets Environnement HDRI */}
              <ambientLight intensity={0.4} />
              <directionalLight position={[4, 6, 4]} intensity={3.5} color="#e8c98a" />
              <directionalLight position={[-5, 3, -3]} intensity={1.8} color="#38bdf8" />
              <pointLight position={[0, 4, 2]} intensity={4.5} color="#ffffff" />
              <Environment preset="studio" environmentIntensity={0.8} />

              {showAxes && <axesHelper args={[4]} />}

              {/* Modèle 3D Bugatti Chiron Super Sport */}
              <BugattiCarModel
                modelUrl="/models/bugatti/bugatti-director.glb"
                carPosition={carPosition}
                carRotation={carRotation}
                selectedNodeName={selectedNodeName}
                hiddenNodes={[]}
                highlightedNodes={[]}
                onSelectNode={(name, info) => {
                  setSelectedNodeName(name);
                  setSelectedNodeInfo(info);
                }}
                onNodesLoaded={(list) => setNodesList(list)}
              />

              {/* Contrôles de Caméra R3F (Director ZQSD + Orbit vs Smooth Rig) */}
              <DirectorCameraControls
                isDirector={isDirectorMode}
                enableZqsd={enableZqsd}
                cameraPos={cameraPos}
                targetPos={targetPos}
                fov={fov}
                onTelemetryUpdate={handleTelemetryUpdate}
              />
            </Canvas>
          </div>

          {/* En-tête HUD discret */}
          <div className="relative z-10 max-w-7xl mx-auto w-full flex items-center justify-between pt-16">
            <span className="text-xs font-mono text-[#e8c98a] font-bold bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              STAGE 0{activeStage + 1} // {stageHeadings[activeStage].title}
            </span>
          </div>
        </div>

        {/* ── NOUVELLE COMPOSITION: GALERIES ET TEXTES PLACÉS SOUS LA VOITURE ── */}
        {!isDirectorMode && (
          <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-20 space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Titre & Explication de la Zone */}
              <div className="space-y-4 bg-black/80 backdrop-blur-xl border border-white/15 p-6 rounded-3xl shadow-2xl">
                <span className="text-xs font-mono text-[#e8c98a] font-bold uppercase tracking-widest">
                  {stageHeadings[activeStage].subtitle}
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold uppercase text-white">
                  {stageHeadings[activeStage].title}
                </h3>
                <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                  {stageHeadings[activeStage].desc}
                </p>
              </div>

              {/* Galerie Contextuelle sous le véhicule */}
              <div>
                <ContextualGallery
                  stageIndex={activeStage}
                  onOpenLightbox={(url) => setLightboxUrl(url)}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── SECTION 4 — PROCESSUS EN 5 ÉTAPES (STACKING CARDS) ── */}
      {!isDirectorMode && (
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
      )}

      {/* ── SECTION 5 — AVANT / APRÈS (IMAGE COMPARISON SLIDER 21ST.DEV) ── */}
      {!isDirectorMode && (
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
      )}

      {/* ── SECTION 9 — CTA FINAL & FORMULAIRE DE RÉSORTION DE VIS (CONNECTÉ API) ── */}
      {!isDirectorMode && (
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
                    placeholder="Ex: Bugatti Chiron / Porsche 911"
                    value={form.vehicleModel}
                    onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-[#e8c98a] text-black font-bold uppercase text-xs tracking-wider rounded-xl hover:bg-[#e8c98a] hover:bg-white transition-all shadow-[0_0_25px_rgba(232,201,138,0.3)] cursor-pointer"
                >
                  {submitting ? "Traitement..." : "Valider ma demande de rendez-vous"}
                </button>
              </form>
            )}
          </div>
        </section>
      )}

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
