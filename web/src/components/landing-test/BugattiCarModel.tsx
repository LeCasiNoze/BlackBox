import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

export type BugattiCarModelProps = {
  modelUrl?: string;
  carPosition?: [number, number, number];
  carRotation?: [number, number, number];
  selectedNodeName?: string | null;
  hiddenNodes?: string[];
  highlightedNodes?: string[];
  onSelectNode?: (name: string, info: { width: number; height: number; depth: number }) => void;
  onNodesLoaded?: (nodeNames: string[]) => void;
  onError?: (err: Error) => void;
};

// ── COMPOSANT MODÈLE BUGATTI CHIRON SUPER SPORT 300+ ──
export function BugattiCarModel({
  modelUrl = "/models/bugatti/bugatti-director.glb",
  carPosition = [0, -0.6, 0],
  carRotation = [0, 0, 0],
  hiddenNodes = [],
  onSelectNode,
  onNodesLoaded,
  onError,
}: BugattiCarModelProps) {
  const rootRef = useRef<THREE.Group>(null);
  const [gltfLoaded, setGltfLoaded] = useState(false);

  // Essai de chargement du GLB Bugatti officiel s'il existe
  useEffect(() => {
    let active = true;
    const loader = new THREE.FileLoader();
    loader.load(
      modelUrl,
      () => {
        if (active) setGltfLoaded(true);
      },
      undefined,
      (err) => {
        if (active) {
          setGltfLoaded(false);
          if (onError) onError(err as Error);
        }
      }
    );
    return () => {
      active = false;
    };
  }, [modelUrl, onError]);

  // Si le GLB existe sur public/models/bugatti/bugatti-director.glb, on le charge avec useGLTF
  let gltfResult: any = null;
  try {
    if (gltfLoaded) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      gltfResult = useGLTF(modelUrl);
    }
  } catch {
    /* fallback sur modèle segmenté PBR */
  }

  // Traitement, nettoyage du sol ("Plane") et inventaire des Nodes
  useEffect(() => {
    const list: string[] = [];
    if (gltfResult && gltfResult.scene) {
      gltfResult.scene.traverse((obj: THREE.Object3D) => {
        // Masquer le sol "Plane" pour ne garder QUE la voiture volante pure
        if (obj.name.toLowerCase().includes("plane") || obj.name.toLowerCase().includes("floor") || obj.name.toLowerCase().includes("ground")) {
          obj.visible = false;
        }

        // Optimisation des matériaux PBR
        if (obj instanceof THREE.Mesh && obj.material) {
          obj.castShadow = true;
          obj.receiveShadow = true;
          if (obj.material instanceof THREE.MeshStandardMaterial || obj.material instanceof THREE.MeshPhysicalMaterial) {
            obj.material.needsUpdate = true;
          }
        }

        if (obj.name && !list.includes(obj.name)) {
          list.push(obj.name);
        }
      });
    } else {
      // Inventaire des Nodes du prototype segmenté haute définition
      list.push(
        "Body_Main_Chassis",
        "Hood_Grille_Front",
        "Headlights_LED",
        "Badge_Bugatti",
        "Body_Side_Profile",
        "Driver_Door",
        "Wheel_Front_Left",
        "Wheel_Rear_Left",
        "Calliper_Badge",
        "Interior_Cockpit",
        "Steering_Wheel",
        "Seat_Driver",
        "Rear_Diffuser",
        "Taillights_LED",
        "Quad_Exhausts"
      );
    }
    if (onNodesLoaded) onNodesLoaded(list);
  }, [gltfResult, onNodesLoaded]);

  // Lissage rotation/position de la voiture
  useFrame((_, delta) => {
    if (rootRef.current) {
      rootRef.current.position.x = THREE.MathUtils.lerp(rootRef.current.position.x, carPosition[0], delta * 5);
      rootRef.current.position.y = THREE.MathUtils.lerp(rootRef.current.position.y, carPosition[1], delta * 5);
      rootRef.current.position.z = THREE.MathUtils.lerp(rootRef.current.position.z, carPosition[2], delta * 5);

      rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, carRotation[0], delta * 5);
      rootRef.current.rotation.y = THREE.MathUtils.lerp(rootRef.current.rotation.y, carRotation[1], delta * 5);
      rootRef.current.rotation.z = THREE.MathUtils.lerp(rootRef.current.rotation.z, carRotation[2], delta * 5);
    }
  });

  const handlePointerDownNode = (e: any, nodeName: string, meshObj?: THREE.Object3D) => {
    e.stopPropagation();
    if (!onSelectNode) return;
    const box = new THREE.Box3();
    if (meshObj) {
      box.setFromObject(meshObj);
    } else if (e.object) {
      box.setFromObject(e.object);
    }
    const size = new THREE.Vector3();
    box.getSize(size);
    onSelectNode(nodeName, {
      width: Number(size.x.toFixed(3)),
      height: Number(size.y.toFixed(3)),
      depth: Number(size.z.toFixed(3)),
    });
  };

  // Matériaux PBR Bugatti Chiron Super Sport (Obsidienne & Or)
  const bodyMaterial = (
    <meshPhysicalMaterial
      color="#0c0c10"
      metalness={0.96}
      roughness={0.08}
      clearcoat={1.0}
      clearcoatRoughness={0.03}
      reflectivity={1.0}
    />
  );

  const goldAccentMaterial = (
    <meshStandardMaterial color="#e8c98a" metalness={0.92} roughness={0.12} />
  );

  const chromeMaterial = (
    <meshStandardMaterial color="#f1f5f9" metalness={0.98} roughness={0.04} />
  );

  const glassMaterial = (
    <meshPhysicalMaterial
      color="#38bdf8"
      transparent
      opacity={0.3}
      roughness={0.05}
      transmission={0.95}
      ior={1.52}
    />
  );

  const headlightMaterial = (
    <meshStandardMaterial color="#ffffff" emissive="#e8c98a" emissiveIntensity={3.5} />
  );

  const taillightMaterial = (
    <meshStandardMaterial color="#ef4444" emissive="#f87171" emissiveIntensity={4.0} />
  );

  const leatherMaterial = (
    <meshStandardMaterial color="#2a1f18" roughness={0.45} metalness={0.1} />
  );

  const wheelMaterial = (
    <meshStandardMaterial color="#0f0f12" metalness={0.88} roughness={0.18} />
  );

  // Si le fichier GLB Bugatti Chiron officiel est présent et chargé
  if (gltfLoaded && gltfResult && gltfResult.scene) {
    return (
      <group ref={rootRef} position={carPosition} rotation={carRotation}>
        <primitive object={gltfResult.scene} scale={1.0} />
      </group>
    );
  }

  // MODÈLE BUGATTI SEGMENTÉ HAUTE FIDÉLITÉ (PBR Native Three.js)
  return (
    <group ref={rootRef} position={carPosition} rotation={carRotation}>
      {/* Châssis Central */}
      {!hiddenNodes.includes("Body_Main_Chassis") && (
        <mesh
          position={[0, 0.4, 0]}
          onPointerDown={(e) => handlePointerDownNode(e, "Body_Main_Chassis")}
        >
          <boxGeometry args={[1.74, 0.42, 3.84]} />
          {bodyMaterial}
        </mesh>
      )}

      {/* Cockpit & Vitrage Bugatti C-Line */}
      <mesh position={[0, 0.86, -0.15]}>
        <boxGeometry args={[1.48, 0.54, 1.82]} />
        {glassMaterial}
      </mesh>

      {/* Face Avant (Capot, Calandre Fer à Cheval, Phares) */}
      {!hiddenNodes.includes("Hood_Grille_Front") && (
        <group>
          {/* Capot Moteur */}
          <mesh
            position={[0, 0.65, 1.1]}
            rotation={[-0.08, 0, 0]}
            onPointerDown={(e) => handlePointerDownNode(e, "Hood_Grille_Front")}
          >
            <boxGeometry args={[1.65, 0.12, 1.4]} />
            {bodyMaterial}
          </mesh>
          {/* Pare-chocs Avant */}
          <mesh position={[0, 0.35, 1.85]}>
            <boxGeometry args={[1.72, 0.38, 0.35]} />
            {bodyMaterial}
          </mesh>
          {/* Calandre Fer à Cheval Bugatti */}
          <mesh
            position={[0, 0.35, 2.0]}
            onPointerDown={(e) => handlePointerDownNode(e, "Badge_Bugatti")}
          >
            <cylinderGeometry args={[0.45, 0.45, 0.12, 32, 1, false, 0, Math.PI]} />
            {goldAccentMaterial}
          </mesh>
          {/* Phares LED Bugatti Quad-Light */}
          <mesh
            position={[-0.65, 0.48, 1.9]}
            onPointerDown={(e) => handlePointerDownNode(e, "Headlights_LED")}
          >
            <boxGeometry args={[0.32, 0.12, 0.15]} />
            {headlightMaterial}
          </mesh>
          <mesh
            position={[0.65, 0.48, 1.9]}
            onPointerDown={(e) => handlePointerDownNode(e, "Headlights_LED")}
          >
            <boxGeometry args={[0.32, 0.12, 0.15]} />
            {headlightMaterial}
          </mesh>
        </group>
      )}

      {/* Profil & Ligne Latérale C-Line */}
      {!hiddenNodes.includes("Body_Side_Profile") && (
        <group>
          {/* C-Line Arc Bugatti Or */}
          <mesh position={[-0.88, 0.65, -0.1]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.75, 0.05, 16, 32, Math.PI * 1.3]} />
            {goldAccentMaterial}
          </mesh>
          <mesh position={[0.88, 0.65, -0.1]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.75, 0.05, 16, 32, Math.PI * 1.3]} />
            {goldAccentMaterial}
          </mesh>
          {/* Roues & Jantes Bugatti Super Sport */}
          <mesh
            position={[-0.92, 0.3, 1.2]}
            rotation={[0, 0, Math.PI / 2]}
            onPointerDown={(e) => handlePointerDownNode(e, "Wheel_Front_Left")}
          >
            <cylinderGeometry args={[0.35, 0.35, 0.26, 32]} />
            {wheelMaterial}
          </mesh>
          <mesh
            position={[-0.92, 0.3, -1.2]}
            rotation={[0, 0, Math.PI / 2]}
            onPointerDown={(e) => handlePointerDownNode(e, "Wheel_Rear_Left")}
          >
            <cylinderGeometry args={[0.37, 0.37, 0.3, 32]} />
            {wheelMaterial}
          </mesh>
          <mesh position={[0.92, 0.3, 1.2]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.35, 0.35, 0.26, 32]} />
            {wheelMaterial}
          </mesh>
          <mesh position={[0.92, 0.3, -1.2]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.37, 0.37, 0.3, 32]} />
            {wheelMaterial}
          </mesh>
        </group>
      )}

      {/* Portière Conducteur */}
      {!hiddenNodes.includes("Driver_Door") && (
        <mesh
          position={[-0.85, 0.55, 0.2]}
          onPointerDown={(e) => handlePointerDownNode(e, "Driver_Door")}
        >
          <boxGeometry args={[0.12, 0.52, 1.15]} />
          {bodyMaterial}
        </mesh>
      )}

      {/* Habitacle Conducteur (Sièges, Volant, Console) */}
      {!hiddenNodes.includes("Interior_Cockpit") && (
        <group position={[0, 0.45, -0.1]}>
          <mesh
            position={[-0.4, 0.25, 0.1]}
            onPointerDown={(e) => handlePointerDownNode(e, "Seat_Driver")}
          >
            <boxGeometry args={[0.48, 0.55, 0.48]} />
            {leatherMaterial}
          </mesh>
          <mesh
            position={[-0.4, 0.42, 0.38]}
            rotation={[0.4, 0, 0]}
            onPointerDown={(e) => handlePointerDownNode(e, "Steering_Wheel")}
          >
            <torusGeometry args={[0.14, 0.025, 16, 32]} />
            {leatherMaterial}
          </mesh>
        </group>
      )}

      {/* Partie Arrière (Feu Continu LED, Quad-Échappement, Diffuseur Longtail) */}
      {!hiddenNodes.includes("Rear_Diffuser") && (
        <group>
          {/* Feux Arrière Horizontaux LED Continu */}
          <mesh
            position={[0, 0.54, -1.94]}
            onPointerDown={(e) => handlePointerDownNode(e, "Taillights_LED")}
          >
            <boxGeometry args={[1.55, 0.06, 0.06]} />
            {taillightMaterial}
          </mesh>
          {/* Diffuseur Longtail Carbon */}
          <mesh
            position={[0, 0.15, -1.9]}
            onPointerDown={(e) => handlePointerDownNode(e, "Rear_Diffuser")}
          >
            <boxGeometry args={[1.45, 0.18, 0.22]} />
            {chromeMaterial}
          </mesh>
          {/* Quad Échappement Vertical Bugatti Super Sport 300+ */}
          <mesh
            position={[-0.3, 0.25, -1.95]}
            rotation={[Math.PI / 2, 0, 0]}
            onPointerDown={(e) => handlePointerDownNode(e, "Quad_Exhausts")}
          >
            <cylinderGeometry args={[0.06, 0.06, 0.18, 16]} />
            {chromeMaterial}
          </mesh>
          <mesh position={[-0.3, 0.14, -1.95]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.18, 16]} />
            {chromeMaterial}
          </mesh>
          <mesh position={[0.3, 0.25, -1.95]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.18, 16]} />
            {chromeMaterial}
          </mesh>
          <mesh position={[0.3, 0.14, -1.95]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.18, 16]} />
            {chromeMaterial}
          </mesh>
        </group>
      )}
    </group>
  );
}
