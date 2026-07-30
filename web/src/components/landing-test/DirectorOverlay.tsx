import { useState } from "react";
import type { CameraShot } from "../../../../src/features/landing-test/config/cameraShots";
import {
  Play,
  RotateCcw,
  Plus,
  Save,
  Trash2,
  Copy,
  Download,
  Grid,
  Crosshair,
  Compass,
  ChevronLeft,
  ChevronRight,
  Check,
  ZoomIn,
  ZoomOut,
  Navigation,
  Move,
} from "lucide-react";

export type DirectorOverlayProps = {
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  fov: number;
  carRotation: [number, number, number];
  selectedNodeName: string | null;
  selectedNodeInfo: { width: number; height: number; depth: number } | null;
  nodesList: string[];
  shots: CameraShot[];
  currentShotIndex: number;
  showGrid: boolean;
  showAxes: boolean;
  showTargetDot: boolean;
  enableZqsd: boolean;
  isTransitionPlaying: boolean;
  onToggleGrid: () => void;
  onToggleAxes: () => void;
  onToggleTargetDot: () => void;
  onToggleZqsd: () => void;
  onChangeFov: (newFov: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSelectNode: (nodeName: string | null) => void;
  onRecenterOnNode: (nodeName: string) => void;
  onSelectShot: (index: number) => void;
  onAddShot: () => void;
  onSaveCurrentShot: () => void;
  onDeleteShot: (index: number) => void;
  onPlayTransition: (forward: boolean) => void;
  onExportShots: () => void;
  onCopyJson: () => void;
  onResetShotsToDefault: () => void;
  onChangeDuration: (duration: number) => void;
  onChangeEasing: (easing: CameraShot["easing"]) => void;
};

export function DirectorOverlay({
  cameraPosition,
  cameraTarget,
  fov,
  carRotation,
  selectedNodeName,
  selectedNodeInfo,
  nodesList,
  shots,
  currentShotIndex,
  showGrid,
  showAxes,
  showTargetDot,
  enableZqsd,
  isTransitionPlaying,
  onToggleGrid,
  onToggleAxes,
  onToggleTargetDot,
  onToggleZqsd,
  onChangeFov,
  onZoomIn,
  onZoomOut,
  onSelectNode,
  onRecenterOnNode,
  onSelectShot,
  onAddShot,
  onSaveCurrentShot,
  onDeleteShot,
  onPlayTransition,
  onExportShots,
  onCopyJson,
  onResetShotsToDefault,
  onChangeDuration,
  onChangeEasing,
}: DirectorOverlayProps) {
  const [activeTab, setActiveTab] = useState<"shots" | "telemetry" | "nodes">("shots");
  const [copied, setCopied] = useState(false);

  const dist = Math.sqrt(
    Math.pow(cameraPosition[0] - cameraTarget[0], 2) +
      Math.pow(cameraPosition[1] - cameraTarget[1], 2) +
      Math.pow(cameraPosition[2] - cameraTarget[2], 2)
  );

  const currentShot = shots[currentShotIndex] || shots[0];

  const handleCopy = () => {
    onCopyJson();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-[80] select-none flex flex-col justify-between p-4 font-mono">
      {/* ── GRILLE DES TIERS SI ACTIVÉE ── */}
      {showGrid && (
        <div className="pointer-events-none fixed inset-0 z-0 grid grid-cols-3 grid-rows-3 opacity-30">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="border border-[#e8c98a]" />
          ))}
        </div>
      )}

      {/* ── POINT DE CIBLE REGARDÉ SI ACTIVÉ ── */}
      {showTargetDot && (
        <div className="pointer-events-none fixed left-1/2 top-1/2 z-10 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-[#e8c98a]">
          <Crosshair className="h-full w-full animate-pulse" />
        </div>
      )}

      {/* ── BARRE DE CONTRÔLE SUPÉRIEURE (HUD HEADER) ── */}
      <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-black/85 p-3 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 items-center justify-center rounded-full bg-[#e8c98a]">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-black" />
          </span>
          <span className="text-xs font-bold text-[#e8c98a]">
            MODE DIRECTOR 3D // BUGATTI CHIRON SUPER SPORT
          </span>
        </div>

        {/* Outils visuels & Bouton Nav ZQSD */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* BOUTON ZQSD DÉPLACEMENT VOLANT */}
          <button
            type="button"
            onClick={onToggleZqsd}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold transition ${
              enableZqsd
                ? "border-[#e8c98a] bg-[#e8c98a] text-black shadow-[0_0_15px_rgba(232,201,138,0.4)]"
                : "border-white/20 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            <Navigation className="h-3.5 w-3.5" />
            <span>ZQSD / WASD: {enableZqsd ? "ACTIF (Vol)" : "OFF"}</span>
          </button>

          {/* CONTROLES DE ZOOM PAR BOUTONS & FOV */}
          <div className="flex items-center gap-1 border border-white/15 bg-black/60 rounded-xl px-2 py-1">
            <button
              type="button"
              onClick={onZoomIn}
              title="Zoom Avancer (Rapprocher)"
              className="p-1 hover:text-[#e8c98a] transition"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>

            <span className="text-[10px] text-white/50 px-1">ZOOM</span>

            <button
              type="button"
              onClick={onZoomOut}
              title="Zoom Reculer (Éloigner)"
              className="p-1 hover:text-[#e8c98a] transition"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleGrid}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition ${
              showGrid ? "border-[#e8c98a] bg-[#e8c98a]/20 text-[#e8c98a]" : "border-white/10 bg-white/5 text-white/60"
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
            <span>Grille Tiers</span>
          </button>

          <button
            type="button"
            onClick={onToggleAxes}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition ${
              showAxes ? "border-[#e8c98a] bg-[#e8c98a]/20 text-[#e8c98a]" : "border-white/10 bg-white/5 text-white/60"
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>XYZ Repères</span>
          </button>

          <button
            type="button"
            onClick={onToggleTargetDot}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition ${
              showTargetDot ? "border-[#e8c98a] bg-[#e8c98a]/20 text-[#e8c98a]" : "border-white/10 bg-white/5 text-white/60"
            }`}
          >
            <Crosshair className="h-3.5 w-3.5" />
            <span>Cible</span>
          </button>
        </div>
      </div>

      {/* LÉGENDE ZQSD GUIDAGE SI ACTIF */}
      {enableZqsd && (
        <div className="pointer-events-auto self-start mt-3 rounded-2xl border border-[#e8c98a]/40 bg-black/85 p-3 text-[10px] text-white/90 shadow-2xl backdrop-blur-xl space-y-1">
          <p className="font-bold text-[#e8c98a] flex items-center gap-1.5">
            <Move className="h-3.5 w-3.5" />
            COMMANDES VOL ZQSD / WASD ACTIVES :
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-white/70">
            <span>• <b className="text-white">Z / W / ↑</b> : Avancer Caméra</span>
            <span>• <b className="text-white">S / ↓</b> : Reculer Caméra</span>
            <span>• <b className="text-white">Q / A / ←</b> : Déplacer Gauche</span>
            <span>• <b className="text-white">D / →</b> : Déplacer Droite</span>
            <span>• <b className="text-white">Espace</b> : Monter (Altitude +)</span>
            <span>• <b className="text-white">Shift</b> : Descendre (Altitude -)</span>
            <span className="col-span-2 text-[#e8c98a]">• <b className="text-[#e8c98a]">Molette Souris</b> : Zoom Continu (Rapprocher / Éloigner)</span>
          </div>
        </div>
      )}

      {/* ── PANNEAU PRINCIPAL ET DE RÉGLAGES (FLOTTANT À DROITE) ── */}
      <div className="pointer-events-auto flex items-end justify-between gap-4">
        {/* TÉLÉMÉTRIE EN DIRECT (Bas Gauche) */}
        <div className="w-80 space-y-2 rounded-2xl border border-white/15 bg-black/85 p-4 text-[11px] text-white/80 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 font-bold text-[#e8c98a]">
            <span>TÉLÉMÉTRIE CAMÉRA &amp; SCÈNE</span>
            <div className="flex items-center gap-1">
              <span>FOV:</span>
              <input
                type="number"
                min="15"
                max="90"
                value={fov}
                onChange={(e) => onChangeFov(Number(e.target.value))}
                className="w-12 bg-black border border-white/20 rounded text-center text-white text-[10px]"
              />
              <span>°</span>
            </div>
          </div>
          <div className="space-y-1">
            <p>
              <span className="text-white/40">CAM POS: </span>
              <span className="font-bold text-white">
                [{cameraPosition[0].toFixed(2)}, {cameraPosition[1].toFixed(2)}, {cameraPosition[2].toFixed(2)}]
              </span>
            </p>
            <p>
              <span className="text-white/40">CIBLE REGARDÉE: </span>
              <span className="font-bold text-white">
                [{cameraTarget[0].toFixed(2)}, {cameraTarget[1].toFixed(2)}, {cameraTarget[2].toFixed(2)}]
              </span>
            </p>
            <p>
              <span className="text-white/40">DISTANCE CAMÉRA-CIBLE: </span>
              <span className="font-bold text-[#e8c98a]">{dist.toFixed(2)} m</span>
            </p>
            <p>
              <span className="text-white/40">ROTATION VOITURE: </span>
              <span className="font-bold text-white">
                [{carRotation[0].toFixed(2)}, {carRotation[1].toFixed(2)}, {carRotation[2].toFixed(2)}]
              </span>
            </p>

            {selectedNodeName && (
              <div className="mt-2 rounded-xl border border-[#e8c98a]/30 bg-[#e8c98a]/10 p-2 space-y-1">
                <p className="font-bold text-[#e8c98a] truncate">NODE: {selectedNodeName}</p>
                {selectedNodeInfo && (
                  <p className="text-[10px] text-white/70">
                    TAILLE: {selectedNodeInfo.width}m x {selectedNodeInfo.height}m x {selectedNodeInfo.depth}m
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => onRecenterOnNode(selectedNodeName)}
                  className="mt-1 w-full rounded-lg bg-[#e8c98a] py-1 text-[10px] font-bold text-black hover:bg-white transition"
                >
                  Recentrer la caméra sur ce Node
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PANNEAU DE SAUVEGARDE & TEST DE TRANSITION (Bas Droit) */}
        <div className="w-[480px] space-y-3 rounded-2xl border border-white/15 bg-black/90 p-4 text-xs text-white shadow-2xl backdrop-blur-xl">
          {/* Onglets */}
          <div className="flex border-b border-white/10 pb-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("shots")}
              className={`flex-1 py-1.5 rounded-xl font-bold transition text-[11px] ${
                activeTab === "shots" ? "bg-[#e8c98a] text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              Prises de Vue ({shots.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("nodes")}
              className={`flex-1 py-1.5 rounded-xl font-bold transition text-[11px] ${
                activeTab === "nodes" ? "bg-[#e8c98a] text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              Arbre des Nodes ({nodesList.length})
            </button>
          </div>

          {activeTab === "shots" && (
            <div className="space-y-3">
              {/* Sélecteur de Prise active */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectShot(Math.max(0, currentShotIndex - 1))}
                  disabled={currentShotIndex === 0}
                  className="rounded-xl border border-white/10 bg-white/5 p-2 disabled:opacity-30 hover:bg-white/15"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <select
                  value={currentShotIndex}
                  onChange={(e) => onSelectShot(Number(e.target.value))}
                  className="min-w-0 flex-1 rounded-xl border border-white/20 bg-black px-3 py-2 text-xs text-[#e8c98a] font-bold focus:outline-none"
                >
                  {shots.map((shot, idx) => (
                    <option key={shot.id} value={idx}>
                      {shot.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => onSelectShot(Math.min(shots.length - 1, currentShotIndex + 1))}
                  disabled={currentShotIndex === shots.length - 1}
                  className="rounded-xl border border-white/10 bg-white/5 p-2 disabled:opacity-30 hover:bg-white/15"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Contrôles de mise à jour de la prise actuelle */}
              <div className="flex flex-wrap gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={onSaveCurrentShot}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#e8c98a] bg-[#e8c98a]/20 py-2 font-bold text-[#e8c98a] hover:bg-[#e8c98a] hover:text-black transition"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Enregistrer Cadrage Actuel</span>
                </button>

                <button
                  type="button"
                  onClick={onAddShot}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 font-bold hover:bg-white/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Nouvelle Prise</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteShot(currentShotIndex)}
                  disabled={shots.length <= 1}
                  className="flex items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-rose-300 hover:bg-rose-500 hover:text-white disabled:opacity-30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Réglage de la durée et de l'easing de la prise */}
              {currentShot && (
                <div className="grid grid-cols-2 gap-2 text-[11px] rounded-xl border border-white/10 bg-white/5 p-2.5">
                  <div>
                    <label className="block text-white/50 text-[10px]">Durée Transition (s)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="10"
                      value={currentShot.duration}
                      onChange={(e) => onChangeDuration(Number(e.target.value))}
                      className="w-full mt-1 rounded-lg border border-white/20 bg-black px-2 py-1 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-white/50 text-[10px]">Easing GSAP</label>
                    <select
                      value={currentShot.easing}
                      onChange={(e) => onChangeEasing(e.target.value as CameraShot["easing"])}
                      className="w-full mt-1 rounded-lg border border-white/20 bg-black px-2 py-1 text-white"
                    >
                      <option value="power2.inOut">power2.inOut</option>
                      <option value="power3.out">power3.out</option>
                      <option value="sine.inOut">sine.inOut</option>
                      <option value="linear">linear</option>
                    </select>
                  </div>
                </div>
              )}

              {/* TEST DE TRANSITION & JOUEUR */}
              <div className="space-y-2 rounded-xl border border-[#e8c98a]/30 bg-[#e8c98a]/5 p-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#e8c98a]">
                  <span>TEST DE TRANSITION DE CAMÉRA</span>
                  {isTransitionPlaying && <span className="animate-pulse">EN COURS...</span>}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onPlayTransition(true)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#e8c98a] py-2 font-bold text-black hover:bg-white transition"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Jouer Vers Prise Suivante</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onPlayTransition(false)}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 font-bold hover:bg-white/20"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Inverser</span>
                  </button>
                </div>
              </div>

              {/* Exporter / Copier JSON */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10 text-[10px]">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-white/60 hover:text-[#e8c98a]"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? "JSON Copié !" : "Copier le JSON"}</span>
                </button>

                <button
                  type="button"
                  onClick={onExportShots}
                  className="flex items-center gap-1 text-white/60 hover:text-[#e8c98a]"
                >
                  <Download className="h-3 w-3" />
                  <span>Exporter Toutes les Prises</span>
                </button>

                <button
                  type="button"
                  onClick={onResetShotsToDefault}
                  className="flex items-center gap-1 text-rose-400/80 hover:text-rose-300"
                >
                  <span>Réinitialiser</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "nodes" && (
            <div className="max-h-60 overflow-y-auto space-y-1 pr-1 text-[11px]">
              <p className="text-white/50 mb-2">Cliquez sur un Node pour le sélectionner et afficher ses dimensions :</p>
              {nodesList.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onSelectNode(name)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition truncate ${
                    selectedNodeName === name
                      ? "bg-[#e8c98a] text-black font-bold"
                      : "bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
