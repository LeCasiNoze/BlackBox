export type CameraShot = {
  id: string;
  label: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  fov: number;
  carPosition: [number, number, number];
  carRotation: [number, number, number];
  selectedFocusNode?: string | null;
  hiddenNodes?: string[];
  highlightedNodes?: string[];
  duration: number; // Durée de la transition (en secondes)
  hold: number;     // Maintien après transition (en secondes)
  easing: "power2.inOut" | "power3.out" | "sine.inOut" | "linear";
};

export const INITIAL_CAMERA_SHOTS: CameraShot[] = [
  {
    id: "intro-dark",
    label: "01. Introduction Ombre & Silhouette",
    cameraPosition: [0.0, 1.8, 8.5],
    cameraTarget: [0.0, 0.4, 0.0],
    fov: 40,
    carPosition: [0.0, -0.6, 0.0],
    carRotation: [0.0, 0.25, 0.0],
    selectedFocusNode: null,
    hiddenNodes: [],
    highlightedNodes: [],
    duration: 3.0,
    hold: 1.0,
    easing: "power2.inOut",
  },
  {
    id: "front-three-quarter",
    label: "02. Vue 3/4 Avant Calandre & Phares",
    cameraPosition: [1.8, 1.0, 3.5],
    cameraTarget: [0.0, 0.4, 1.1],
    fov: 45,
    carPosition: [0.0, -0.6, 0.0],
    carRotation: [0.0, 0.45, 0.0],
    selectedFocusNode: "Hood_Grille_Front",
    hiddenNodes: [],
    highlightedNodes: ["Headlights_LED"],
    duration: 2.5,
    hold: 1.5,
    easing: "power2.inOut",
  },
  {
    id: "front-close",
    label: "03. Gros Plan Insigne Bugatti Macaron",
    cameraPosition: [0.6, 0.65, 2.1],
    cameraTarget: [0.0, 0.45, 1.8],
    fov: 35,
    carPosition: [0.0, -0.6, 0.0],
    carRotation: [0.0, 0.2, 0.0],
    selectedFocusNode: "Badge_Bugatti",
    hiddenNodes: [],
    highlightedNodes: ["Badge_Bugatti"],
    duration: 2.0,
    hold: 1.0,
    easing: "sine.inOut",
  },
  {
    id: "front-wheel",
    label: "04. Jante & Étriers de Frein Avant",
    cameraPosition: [1.9, 0.45, 1.4],
    cameraTarget: [0.9, 0.35, 1.2],
    fov: 38,
    carPosition: [0.0, -0.6, 0.0],
    carRotation: [0.0, 0.6, 0.0],
    selectedFocusNode: "Wheel_Front_Left",
    hiddenNodes: [],
    highlightedNodes: ["Calliper_Badge"],
    duration: 2.2,
    hold: 1.2,
    easing: "power2.inOut",
  },
  {
    id: "side-profile",
    label: "05. Profil Ligne C-Line Bugatti",
    cameraPosition: [4.2, 1.1, 0.2],
    cameraTarget: [0.0, 0.4, 0.0],
    fov: 45,
    carPosition: [0.0, -0.6, 0.0],
    carRotation: [0.0, 1.57, 0.0],
    selectedFocusNode: "Body_Side_Profile",
    hiddenNodes: [],
    highlightedNodes: ["Carbon_Side_Skirt"],
    duration: 3.0,
    hold: 1.5,
    easing: "power2.inOut",
  },
  {
    id: "rear-wheel",
    label: "06. Roue Arrière & Bas de Caisse Carbon",
    cameraPosition: [2.2, 0.45, -1.4],
    cameraTarget: [0.9, 0.35, -1.2],
    fov: 38,
    carPosition: [0.0, -0.6, 0.0],
    carRotation: [0.0, 2.1, 0.0],
    selectedFocusNode: "Wheel_Rear_Left",
    hiddenNodes: [],
    highlightedNodes: ["Carbon_Fiber_Rear"],
    duration: 2.2,
    hold: 1.2,
    easing: "power2.inOut",
  },
  {
    id: "driver-door-approach",
    label: "07. Approche Portière Conducteur",
    cameraPosition: [-1.8, 1.1, 0.6],
    cameraTarget: [-0.6, 0.6, 0.1],
    fov: 42,
    carPosition: [0.0, -0.6, 0.0],
    carRotation: [0.0, -0.4, 0.0],
    selectedFocusNode: "Driver_Door",
    hiddenNodes: [],
    highlightedNodes: ["Driver_Door"],
    duration: 2.5,
    hold: 1.0,
    easing: "power3.out",
  },
  {
    id: "driver-interior",
    label: "08. Habitacle Volant & Cuir Bugatti",
    cameraPosition: [-0.65, 1.15, 0.55],
    cameraTarget: [-0.4, 0.85, -0.15],
    fov: 50,
    carPosition: [0.0, -0.6, 0.0],
    carRotation: [0.0, -0.3, 0.0],
    selectedFocusNode: "Interior_Cockpit",
    hiddenNodes: [],
    highlightedNodes: ["Steering_Wheel", "Seat_Driver"],
    duration: 3.0,
    hold: 2.0,
    easing: "power2.inOut",
  },
  {
    id: "rear-three-quarter",
    label: "09. Vue 3/4 Arrière Feux LED & Diffuseur",
    cameraPosition: [-2.2, 1.25, -3.5],
    cameraTarget: [0.0, 0.45, -1.2],
    fov: 45,
    carPosition: [0.0, -0.6, 0.0],
    carRotation: [0.0, 3.45, 0.0],
    selectedFocusNode: "Rear_Diffuser",
    hiddenNodes: [],
    highlightedNodes: ["Taillights_LED", "Quad_Exhausts"],
    duration: 2.8,
    hold: 1.5,
    easing: "power2.inOut",
  },
  {
    id: "final-reveal",
    label: "10. Révélation Complète Réassemblée",
    cameraPosition: [2.8, 1.4, 4.2],
    cameraTarget: [0.0, 0.4, 0.0],
    fov: 45,
    carPosition: [0.0, -0.6, 0.0],
    carRotation: [0.0, 6.28, 0.0],
    selectedFocusNode: null,
    hiddenNodes: [],
    highlightedNodes: [],
    duration: 3.5,
    hold: 2.0,
    easing: "power2.inOut",
  },
];

const LOCAL_STORAGE_KEY = "blackbox_director_camera_shots";

export function loadCameraShots(): CameraShot[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    /* fallback */
  }
  return INITIAL_CAMERA_SHOTS;
}

export function saveCameraShots(shots: CameraShot[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(shots, null, 2));
  } catch {
    /* fallback */
  }
}
