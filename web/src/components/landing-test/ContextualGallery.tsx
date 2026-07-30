import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ZoomIn, CheckCircle2 } from "lucide-react";

export type ZonePhoto = {
  id: string;
  url: string;
  title: string;
  subtitle: string;
  tag: string;
};

type ContextualGalleryProps = {
  stageIndex: number; // 0: Front, 1: Side, 2: Interior, 3: Rear, 4: Reassembly
  onOpenLightbox?: (url: string) => void;
};

// Data-driven photos map matching ONLY the specific vehicle zones!
const ZONE_PHOTOS_MAP: Record<number, ZonePhoto[]> = {
  0: [
    {
      id: "front-1",
      url: "/corvette_5s.jpg",
      title: "Diagnostic Optique & Impact",
      subtitle: "Inspection sous projecteurs 5000K",
      tag: "Face Avant — Avant",
    },
    {
      id: "front-2",
      url: "/corvette_40s.jpg",
      title: "Correction Capot & Calandre",
      subtitle: "Polissage micro-précision 3-passes",
      tag: "Face Avant — Correction",
    },
    {
      id: "front-3",
      url: "/hero-detailing.jpg",
      title: "Éclat Miroir & Phares LED",
      subtitle: "Finition céramique CarPro 9H",
      tag: "Face Avant — Fini",
    },
  ],
  1: [
    {
      id: "side-1",
      url: "/corvette_20s.jpg",
      title: "Polissage Portières & Bas de Caisse",
      subtitle: "Élimination 99.8% micro-rayures",
      tag: "Profil — Correction",
    },
    {
      id: "side-2",
      url: "/corvette_60s.jpg",
      title: "Reflet Miroir Panneaux Latéraux",
      subtitle: "Profondeur de peinture ultime",
      tag: "Profil — Effet Miroir",
    },
    {
      id: "side-3",
      url: "/tiktok_10s.jpg",
      title: "Restauration Jantes & Étriers",
      subtitle: "Protection thermique céramique",
      tag: "Profil — Jantes & Freins",
    },
  ],
  2: [
    {
      id: "interior-1",
      url: "/tiktok_30s.jpg",
      title: "Soin Nourrissant Cuir & Volant",
      subtitle: "Dégraissage et protection mat",
      tag: "Habitacle — Cuir Noble",
    },
    {
      id: "interior-2",
      url: "/corvette_20s.jpg",
      title: "Détail Console & Coutures",
      subtitle: "Nettoyage minutieux au pinceau",
      tag: "Habitacle — Console",
    },
    {
      id: "interior-3",
      url: "/hero-detailing.jpg",
      title: "Désinfection Antibactérienne",
      subtitle: "Traitement hydrophobe habitacle",
      tag: "Habitacle — Fini",
    },
  ],
  3: [
    {
      id: "rear-1",
      url: "/corvette_60s.jpg",
      title: "Correction Feux & Diffuseur",
      subtitle: "Restauration optique arrière",
      tag: "Arrière — Optiques LED",
    },
    {
      id: "rear-2",
      url: "/corvette_40s.jpg",
      title: "Polissage Coffre & Aileron",
      subtitle: "Suppression des hologrammes",
      tag: "Arrière — Carrosserie",
    },
    {
      id: "rear-3",
      url: "/hero-bg.png",
      title: "Protection Céramique Hydrophobe",
      subtitle: "Effet perlant sur le bouclier",
      tag: "Arrière — Hydrophobe",
    },
  ],
  4: [
    {
      id: "final-1",
      url: "/corvette_40s.jpg",
      title: "Transformation Complète Validée",
      subtitle: "Inpection finale sous tunnel de lumière",
      tag: "Finition — Résultat Ultime",
    },
    {
      id: "final-2",
      url: "/corvette_60s.jpg",
      title: "Prête pour la Remise des Clés",
      subtitle: "Bryan Cars Detailing — Louhans",
      tag: "Excellence — BlackBox BC",
    },
  ],
};

export function ContextualGallery({ stageIndex, onOpenLightbox }: ContextualGalleryProps) {
  const photos = ZONE_PHOTOS_MAP[stageIndex] || [];

  return (
    <div className="w-full max-w-xl space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#e8c98a]" />
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#e8c98a]">
            DOSSIER PHOTO INSPECTION // STAGE 0{stageIndex + 1}
          </span>
        </div>
        <span className="text-[10px] font-mono text-white/40">
          {photos.length} ÉLÉMENTS DE RÉFÉRENCE
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={stageIndex}
          initial={{ opacity: 0, y: 25, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -25, scale: 0.96 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="grid gap-3 sm:grid-cols-2"
        >
          {/* Photo Principale Grand Format */}
          {photos[0] && (
            <div
              className="group relative sm:col-span-2 aspect-[16/9] rounded-2xl overflow-hidden border border-white/15 bg-black/60 shadow-2xl cursor-pointer"
              onClick={() => onOpenLightbox?.(photos[0].url)}
            >
              <img
                src={photos[0].url}
                alt={photos[0].title}
                className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-4 flex flex-col justify-end">
                <span className="inline-block self-start rounded-full bg-[#e8c98a]/20 border border-[#e8c98a]/40 px-2.5 py-0.5 text-[9px] font-mono text-[#e8c98a] font-bold mb-1">
                  {photos[0].tag}
                </span>
                <h4 className="text-sm font-bold text-white uppercase group-hover:text-[#e8c98a] transition">
                  {photos[0].title}
                </h4>
                <p className="text-[11px] text-white/60">{photos[0].subtitle}</p>
              </div>
              <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition">
                <ZoomIn className="h-4 w-4" />
              </div>
            </div>
          )}

          {/* Photos Détaillées Secondaires */}
          {photos.slice(1).map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-black/60 shadow-xl cursor-pointer"
              onClick={() => onOpenLightbox?.(photo.url)}
            >
              <img
                src={photo.url}
                alt={photo.title}
                className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-3 flex flex-col justify-end">
                <span className="text-[9px] font-mono text-[#e8c98a] font-bold">
                  {photo.tag}
                </span>
                <h5 className="text-xs font-bold text-white uppercase truncate group-hover:text-[#e8c98a] transition">
                  {photo.title}
                </h5>
              </div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
