import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export type CarExplodedOffsets = {
  front: number; // Offset décomposition avant (capot, pare-chocs, phares)
  side: number;  // Offset décomposition latérale (portières, jantes)
  doorOpen: number; // Angle d'ouverture portière conducteur
  interiorOpacity: number; // Opacité carrosserie extérieure pour voir l'intérieur
  rear: number;  // Offset décomposition arrière (coffre, feux, diffuseur)
};

type Segmented3DCarProps = {
  rotationY: number;
  exploded: CarExplodedOffsets;
  isHydrophobicActive?: boolean;
};

export function Segmented3DCar({ rotationY, exploded, isHydrophobicActive }: Segmented3DCarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const frontGroupRef = useRef<THREE.Group>(null);
  const sideLeftGroupRef = useRef<THREE.Group>(null);
  const sideRightGroupRef = useRef<THREE.Group>(null);
  const doorGroupRef = useRef<THREE.Group>(null);
  const interiorGroupRef = useRef<THREE.Group>(null);
  const rearGroupRef = useRef<THREE.Group>(null);
  const bodyMaterialRef = useRef<THREE.MeshPhysicalMaterial>(null);

  // Animation frame-by-frame smoothing
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, rotationY, delta * 4);
    }
    if (frontGroupRef.current) {
      frontGroupRef.current.position.z = THREE.MathUtils.lerp(frontGroupRef.current.position.z, exploded.front * 0.8, delta * 5);
      frontGroupRef.current.position.y = THREE.MathUtils.lerp(frontGroupRef.current.position.y, exploded.front * 0.15, delta * 5);
    }
    if (sideLeftGroupRef.current) {
      sideLeftGroupRef.current.position.x = THREE.MathUtils.lerp(sideLeftGroupRef.current.position.x, -exploded.side * 0.6, delta * 5);
    }
    if (sideRightGroupRef.current) {
      sideRightGroupRef.current.position.x = THREE.MathUtils.lerp(sideRightGroupRef.current.position.x, exploded.side * 0.6, delta * 5);
    }
    if (doorGroupRef.current) {
      doorGroupRef.current.rotation.y = THREE.MathUtils.lerp(doorGroupRef.current.rotation.y, exploded.doorOpen * 0.9, delta * 5);
      doorGroupRef.current.position.x = THREE.MathUtils.lerp(doorGroupRef.current.position.x, -exploded.doorOpen * 0.25, delta * 5);
    }
    if (rearGroupRef.current) {
      rearGroupRef.current.position.z = THREE.MathUtils.lerp(rearGroupRef.current.position.z, -exploded.rear * 0.8, delta * 5);
      rearGroupRef.current.position.y = THREE.MathUtils.lerp(rearGroupRef.current.position.y, exploded.rear * 0.12, delta * 5);
    }
    if (bodyMaterialRef.current) {
      bodyMaterialRef.current.opacity = THREE.MathUtils.lerp(bodyMaterialRef.current.opacity, exploded.interiorOpacity, delta * 4);
      bodyMaterialRef.current.transparent = bodyMaterialRef.current.opacity < 0.98;
    }
  });

  // Matériaux PBR automobile ultra-premium
  const bodyMaterial = (
    <meshPhysicalMaterial
      ref={bodyMaterialRef}
      color="#0d0d11"
      metalness={0.92}
      roughness={0.12}
      clearcoat={1.0}
      clearcoatRoughness={0.08}
      reflectivity={1.0}
    />
  );

  const chromeMaterial = (
    <meshStandardMaterial color="#e2e8f0" metalness={0.98} roughness={0.05} />
  );

  const glassMaterial = (
    <meshPhysicalMaterial
      color="#38bdf8"
      transparent
      opacity={0.35}
      roughness={0.05}
      transmission={0.9}
      ior={1.5}
    />
  );

  const headlightMaterial = (
    <meshStandardMaterial color="#ffffff" emissive="#e8c98a" emissiveIntensity={2.5} />
  );

  const taillightMaterial = (
    <meshStandardMaterial color="#ef4444" emissive="#f87171" emissiveIntensity={3.0} />
  );

  const interiorMaterial = (
    <meshStandardMaterial color="#1e1e24" roughness={0.7} metalness={0.1} />
  );

  const leatherMaterial = (
    <meshStandardMaterial color="#2d221c" roughness={0.4} metalness={0.1} />
  );

  const wheelMaterial = (
    <meshStandardMaterial color="#111" metalness={0.85} roughness={0.2} />
  );

  return (
    <group ref={groupRef} position={[0, -0.6, 0]}>
      {/* ── 1. CARROSSERIE CENTRALE FIXE (Châssis) ── */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.7, 0.4, 3.8]} />
        {bodyMaterial}
      </mesh>

      {/* Habitacle Vitré */}
      <mesh position={[0, 0.85, -0.2]}>
        <boxGeometry args={[1.5, 0.55, 1.8]} />
        {glassMaterial}
      </mesh>

      {/* ── 2. GROUPE AVANT (Exploded Front: Capot, Pare-chocs, Phares, Grille) ── */}
      <group ref={frontGroupRef}>
        {/* Capot Moteur */}
        <mesh position={[0, 0.65, 1.1]} rotation={[-0.08, 0, 0]}>
          <boxGeometry args={[1.65, 0.12, 1.4]} />
          {bodyMaterial}
        </mesh>
        {/* Pare-chocs Avant */}
        <mesh position={[0, 0.35, 1.85]}>
          <boxGeometry args={[1.72, 0.38, 0.35]} />
          {bodyMaterial}
        </mesh>
        {/* Calandre Chrome */}
        <mesh position={[0, 0.35, 2.0]}>
          <boxGeometry args={[1.0, 0.22, 0.08]} />
          {chromeMaterial}
        </mesh>
        {/* Phares LED Gauche & Droit */}
        <mesh position={[-0.65, 0.48, 1.9]}>
          <boxGeometry args={[0.3, 0.12, 0.15]} />
          {headlightMaterial}
        </mesh>
        <mesh position={[0.65, 0.48, 1.9]}>
          <boxGeometry args={[0.3, 0.12, 0.15]} />
          {headlightMaterial}
        </mesh>
      </group>

      {/* ── 3. GROUPE LATÉRAL GAUCHE & DROIT (Exploded Side & Wheels) ── */}
      <group ref={sideLeftGroupRef}>
        {/* Bas de caisse gauche */}
        <mesh position={[-0.9, 0.2, 0]}>
          <boxGeometry args={[0.15, 0.2, 3.6]} />
          {bodyMaterial}
        </mesh>
        {/* Roue Avant Gauche */}
        <mesh position={[-0.92, 0.3, 1.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.34, 0.34, 0.25, 32]} />
          {wheelMaterial}
        </mesh>
        {/* Roue Arrière Gauche */}
        <mesh position={[-0.92, 0.3, -1.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.35, 0.35, 0.28, 32]} />
          {wheelMaterial}
        </mesh>
      </group>

      <group ref={sideRightGroupRef}>
        {/* Bas de caisse droit */}
        <mesh position={[0.9, 0.2, 0]}>
          <boxGeometry args={[0.15, 0.2, 3.6]} />
          {bodyMaterial}
        </mesh>
        {/* Roue Avant Droite */}
        <mesh position={[0.92, 0.3, 1.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.34, 0.34, 0.25, 32]} />
          {wheelMaterial}
        </mesh>
        {/* Roue Arrière Droite */}
        <mesh position={[0.92, 0.3, -1.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.35, 0.35, 0.28, 32]} />
          {wheelMaterial}
        </mesh>
      </group>

      {/* Portière Conducteur (S'ouvre vers l'extérieur lors de l'Étape 3) */}
      <group ref={doorGroupRef} position={[-0.85, 0.55, 0.2]}>
        <mesh position={[0, 0, -0.5]}>
          <boxGeometry args={[0.12, 0.5, 1.1]} />
          {bodyMaterial}
        </mesh>
        {/* Rétroviseur Conducteur */}
        <mesh position={[-0.15, 0.22, 0.0]}>
          <boxGeometry args={[0.2, 0.1, 0.12]} />
          {bodyMaterial}
        </mesh>
      </group>

      {/* ── 4. GROUPE INTÉRIEUR (Exploded Cockpit: Sièges, Volant, Tableau de bord) ── */}
      <group ref={interiorGroupRef} position={[0, 0.45, -0.1]}>
        {/* Siège Conducteur Cuir Noble */}
        <mesh position={[-0.4, 0.25, 0.1]}>
          <boxGeometry args={[0.48, 0.55, 0.48]} />
          {leatherMaterial}
        </mesh>
        {/* Siège Passager Cuir Noble */}
        <mesh position={[0.4, 0.25, 0.1]}>
          <boxGeometry args={[0.48, 0.55, 0.48]} />
          {leatherMaterial}
        </mesh>
        {/* Tableau de bord & Console */}
        <mesh position={[0, 0.35, 0.55]}>
          <boxGeometry args={[1.35, 0.25, 0.35]} />
          {interiorMaterial}
        </mesh>
        {/* Volant Sport */}
        <mesh position={[-0.4, 0.42, 0.38]} rotation={[0.4, 0, 0]}>
          <torusGeometry args={[0.14, 0.025, 16, 32]} />
          {leatherMaterial}
        </mesh>
      </group>

      {/* ── 5. GROUPE ARRIÈRE (Exploded Rear: Coffre, Pare-chocs, Feux, Diffuseur) ── */}
      <group ref={rearGroupRef}>
        {/* Coffre Arrière & Aileron */}
        <mesh position={[0, 0.72, -1.35]}>
          <boxGeometry args={[1.6, 0.1, 0.9]} />
          {bodyMaterial}
        </mesh>
        {/* Pare-chocs Arrière */}
        <mesh position={[0, 0.38, -1.85]}>
          <boxGeometry args={[1.72, 0.4, 0.3]} />
          {bodyMaterial}
        </mesh>
        {/* Diffuseur Arrière Carbon */}
        <mesh position={[0, 0.15, -1.9]}>
          <boxGeometry args={[1.4, 0.18, 0.2]} />
          {interiorMaterial}
        </mesh>
        {/* Feux Arrière Rouge LED */}
        <mesh position={[-0.62, 0.52, -1.92]}>
          <boxGeometry args={[0.35, 0.08, 0.08]} />
          {taillightMaterial}
        </mesh>
        <mesh position={[0.62, 0.52, -1.92]}>
          <boxGeometry args={[0.35, 0.08, 0.08]} />
          {taillightMaterial}
        </mesh>
        {/* Sorties d'échappement Chrome */}
        <mesh position={[-0.3, 0.18, -1.95]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.2, 16]} />
          {chromeMaterial}
        </mesh>
        <mesh position={[0.3, 0.18, -1.95]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.2, 16]} />
          {chromeMaterial}
        </mesh>
      </group>
    </group>
  );
}
