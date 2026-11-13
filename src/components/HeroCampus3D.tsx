import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, Sparkles } from '@react-three/drei';
import gsap from 'gsap';
import { SectorKey } from '../data/sectors';

interface HeroCampus3DProps {
  activeSector: SectorKey | null;
  isRtl: boolean;
  onHoverSector: (sector: SectorKey | null) => void;
  onSelectSector: (sector: SectorKey) => void;
}

interface ZoneFocusSpec {
  target: [number, number, number];
  camera: [number, number, number];
}

const SECTOR_CAMERA_MAP: Record<SectorKey, ZoneFocusSpec> = {
  'industrial-engineering': {
    target: [-10.5, 2.2, 4.2],
    camera: [-13.0, 10.5, 19.7],
  },
  contracting: {
    target: [-11.5, 3.5, -7.8],
    camera: [-14.0, 12.5, 8.7],
  },
  'real-estate': {
    target: [0.5, 4.2, -13.5],
    camera: [2.0, 14.0, 3.5],
  },
  healthcare: {
    target: [11.5, 2.2, -7.2],
    camera: [14.5, 11.0, 8.8],
  },
  'solar-energy': {
    target: [10.5, 1.8, 4.2],
    camera: [13.5, 10.5, 19.7],
  },
};

/* ---------------- SHARED MATERIALS HOOK ---------------- */
function useCampusMaterials() {
  const mats = useMemo(() => {
    const matPlinth = new THREE.MeshStandardMaterial({
      color: 0x10223b,
      roughness: 0.55,
      metalness: 0.28,
    });
    const matArchWhite = new THREE.MeshStandardMaterial({
      color: 0xe6edf5,
      roughness: 0.35,
      metalness: 0.12,
    });
    const matSilverMetal = new THREE.MeshStandardMaterial({
      color: 0xb8c7d9,
      roughness: 0.24,
      metalness: 0.85,
    });
    const matDarkSteel = new THREE.MeshStandardMaterial({
      color: 0x1c2c42,
      roughness: 0.38,
      metalness: 0.75,
    });
    const matGlassNavy = new THREE.MeshPhysicalMaterial({
      color: 0x16497d,
      roughness: 0.1,
      metalness: 0.25,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.4,
    });
    const matGlassTeal = new THREE.MeshPhysicalMaterial({
      color: 0x1b6ca8,
      roughness: 0.12,
      metalness: 0.18,
      clearcoat: 0.9,
      envMapIntensity: 1.3,
    });
    const matParkRed = new THREE.MeshStandardMaterial({
      color: 0xd93829,
      emissive: 0x6b140d,
      emissiveIntensity: 0.75,
      roughness: 0.35,
      metalness: 0.3,
    });
    const matWarmGlow = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: 0xfde68a,
      emissiveIntensity: 0.85,
      roughness: 0.3,
    });
    const matLinkGlow = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });
    const matSolarCell = new THREE.MeshStandardMaterial({
      color: 0x0f2d5c,
      roughness: 0.16,
      metalness: 0.78,
      emissive: 0x091e40,
      emissiveIntensity: 0.35,
    });

    return {
      matPlinth,
      matArchWhite,
      matSilverMetal,
      matDarkSteel,
      matGlassNavy,
      matGlassTeal,
      matParkRed,
      matWarmGlow,
      matLinkGlow,
      matSolarCell,
    };
  }, []);

  useEffect(() => {
    return () => {
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [mats]);

  return mats;
}

/* ---------------- CAMERA CHOREOGRAPHY RIG ---------------- */
const CampusCameraRig: React.FC<{
  activeSector: SectorKey | null;
  isRtl: boolean;
  prefersReducedMotion: boolean;
}> = ({ activeSector, isRtl, prefersReducedMotion }) => {
  const { camera, invalidate } = useThree();
  const scrollProgressRef = useRef(0);
  const parallaxRef = useRef({ x: 0, y: 0 });
  const lookTargetVec = useRef(new THREE.Vector3());

  const rigState = useRef({
    camX: 0,
    camY: 16.5,
    camZ: 31.5,
    targetX: isRtl ? 3.2 : -3.2,
    targetY: 2.2,
    targetZ: -2.5,
  });

  useEffect(() => {
    const onScroll = () => {
      const heroH = Math.max(window.innerHeight * 0.9, 1);
      scrollProgressRef.current = Math.min(Math.max(window.scrollY / heroH, 0), 1);
      if (prefersReducedMotion) invalidate();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [invalidate, prefersReducedMotion]);

  useEffect(() => {
    const spec = activeSector ? SECTOR_CAMERA_MAP[activeSector] : null;
    const rtlOffset = isRtl ? 3.2 : -3.2;

    const nextCam = spec ? spec.camera : [0, 16.5, 31.5];
    const nextTarget = spec ? spec.target : [rtlOffset, 2.2, -2.5];

    gsap.to(rigState.current, {
      camX: nextCam[0],
      camY: nextCam[1],
      camZ: nextCam[2],
      targetX: nextTarget[0],
      targetY: nextTarget[1],
      targetZ: nextTarget[2],
      duration: prefersReducedMotion ? 0 : 0.95,
      ease: 'power3.out',
      onUpdate: () => {
        if (prefersReducedMotion) invalidate();
      },
    });
  }, [activeSector, isRtl, prefersReducedMotion, invalidate]);

  useFrame((state) => {
    if (!prefersReducedMotion) {
      parallaxRef.current.x += (state.pointer.x * 1.35 - parallaxRef.current.x) * 0.06;
      parallaxRef.current.y += (state.pointer.y * 0.5 - parallaxRef.current.y) * 0.06;
    } else {
      parallaxRef.current.x = 0;
      parallaxRef.current.y = 0;
    }

    const scrollElev = scrollProgressRef.current * 4.2;
    const scrollPush = scrollProgressRef.current * 3.8;

    camera.position.set(
      rigState.current.camX + parallaxRef.current.x,
      rigState.current.camY + parallaxRef.current.y + scrollElev,
      rigState.current.camZ - scrollPush
    );
    lookTargetVec.current.set(
      rigState.current.targetX,
      rigState.current.targetY - scrollProgressRef.current * 1.4,
      rigState.current.targetZ
    );
    camera.lookAt(lookTargetVec.current);
  });

  return null;
};

/* ---------------- SKY DOME SHADER ---------------- */
const SkyAtmosphere: React.FC = () => {
  const skyMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          topColor: { value: new THREE.Color(0x040d1b) },
          midColor: { value: new THREE.Color(0x0a213f) },
          bottomColor: { value: new THREE.Color(0x164073) },
        },
        vertexShader: `
          varying vec3 vWorldPos;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPos = worldPosition.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 midColor;
          uniform vec3 bottomColor;
          varying vec3 vWorldPos;
          void main() {
            float h = normalize(vWorldPos).y;
            vec3 col = mix(bottomColor, midColor, smoothstep(-0.05, 0.25, h));
            col = mix(col, topColor, smoothstep(0.25, 0.85, h));
            gl_FragColor = vec4(col, 1.0);
          }
        `,
      }),
    []
  );

  useEffect(() => {
    return () => {
      skyMat.dispose();
    };
  }, [skyMat]);

  return (
    <mesh material={skyMat}>
      <sphereGeometry args={[140, 32, 20]} />
    </mesh>
  );
};

/* ---------------- SECTOR CONNECTOR PATHWAY ---------------- */
const SectorPathway: React.FC<{
  targetPos: [number, number, number];
  material: THREE.Material;
}> = ({ targetPos, material }) => {
  const { position, rotationY, length } = useMemo(() => {
    const hq = new THREE.Vector3(0, 0.05, -1.5);
    const zone = new THREE.Vector3(targetPos[0], 0.05, targetPos[2]);
    const dist = hq.distanceTo(zone);
    const mid = hq.clone().add(zone).multiplyScalar(0.5);
    const dx = zone.x - hq.x;
    const dz = zone.z - hq.z;
    return {
      position: [mid.x, mid.y, mid.z] as [number, number, number],
      rotationY: Math.atan2(dx, dz),
      length: Math.max(dist - 8.5, 1),
    };
  }, [targetPos]);

  return (
    <mesh position={position} rotation={[0, rotationY, 0]} material={material}>
      <boxGeometry args={[0.14, 0.04, length]} />
    </mesh>
  );
};

/* ---------------- SECTOR ZONE WRAPPER (RAYCASTING + HALO) ---------------- */
const SectorZoneShell: React.FC<{
  sectorKey: SectorKey;
  position: [number, number, number];
  accentHex: number;
  activeSector: SectorKey | null;
  mats: ReturnType<typeof useCampusMaterials>;
  onHoverSector: (sector: SectorKey | null) => void;
  onSelectSector: (sector: SectorKey) => void;
  children: React.ReactNode;
}> = ({
  sectorKey,
  position,
  accentHex,
  activeSector,
  mats,
  onHoverSector,
  onSelectSector,
  children,
}) => {
  const isSelected = activeSector === sectorKey;
  const lightIntensity = isSelected ? 6.5 : activeSector ? 1.2 : 2.2;
  const haloOpacity = isSelected ? 0.9 : activeSector ? 0.18 : 0.35;

  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
    onHoverSector(sectorKey);
  };

  const handleOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'default';
    onHoverSector(null);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelectSector(sectorKey);
  };

  return (
    <>
      <SectorPathway targetPos={position} material={mats.matLinkGlow} />
      <group position={position}>
        <mesh position={[0, 0.15, 0]} material={mats.matPlinth} receiveShadow>
          <cylinderGeometry args={[4.4, 4.7, 0.3, 36]} />
        </mesh>

        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.55, 4.85, 48]} />
          <meshBasicMaterial
            color={accentHex}
            transparent
            opacity={haloOpacity}
            side={THREE.DoubleSide}
          />
        </mesh>

        <pointLight position={[0, 6.5, 1.5]} color={accentHex} intensity={lightIntensity} distance={16} decay={1.6} />

        {/* Invisible hit proxy for responsive sector selection */}
        <mesh
          position={[0, 4.25, 0]}
          onPointerOver={handleOver}
          onPointerOut={handleOut}
          onClick={handleClick}
        >
          <cylinderGeometry args={[4.8, 4.8, 8.5, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {children}
      </group>
    </>
  );
};

/* ---------------- 3D CAMPUS SCENE GRAPH ---------------- */
const CampusSceneContent: React.FC<{
  activeSector: SectorKey | null;
  isRtl: boolean;
  isSoftwareGl: boolean;
  prefersReducedMotion: boolean;
  onHoverSector: (sector: SectorKey | null) => void;
  onSelectSector: (sector: SectorKey) => void;
}> = ({
  activeSector,
  isRtl,
  isSoftwareGl,
  prefersReducedMotion,
  onHoverSector,
  onSelectSector,
}) => {
  const mats = useCampusMaterials();
  const craneBoomRef = useRef<THREE.Group | null>(null);
  const fanRotorRef = useRef<THREE.Group | null>(null);
  const solarMeshRef = useRef<THREE.InstancedMesh | null>(null);

  // Populate instanced photovoltaic panels once
  useEffect(() => {
    const inst = solarMeshRef.current;
    if (!inst) return;
    const dummy = new THREE.Object3D();
    let idx = 0;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 6; c++) {
        dummy.position.set(-1.8 + c * 1.12, 0.95, -0.2 + r * 0.92);
        dummy.rotation.set(Math.PI / 5.5, 0, 0);
        dummy.updateMatrix();
        inst.setMatrixAt(idx++, dummy.matrix);
      }
    }
    inst.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(({ clock }) => {
    if (prefersReducedMotion) return;
    const t = clock.getElapsedTime();
    if (craneBoomRef.current) {
      craneBoomRef.current.rotation.y = Math.sin(t * 0.22) * 0.38;
    }
    if (fanRotorRef.current) {
      fanRotorRef.current.rotation.y = t * 2.2;
    }
  });

  const westFins = [-1.5, -0.75, 0, 0.75, 1.5];
  const eastFins = [-1.2, -0.4, 0.4, 1.2];
  const craneColumns: [number, number][] = [
    [-2.7, -1.6],
    [1.1, -1.6],
    [-2.7, 1.6],
    [1.1, 1.6],
  ];

  return (
    <>
      <color attach="background" args={['#061325']} />
      <fogExp2 attach="fog" args={['#07172d', 0.0115]} />
      <SkyAtmosphere />

      {/* Procedural Architectural Studio Reflections via Drei Lightformers */}
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 0]}>
          <Lightformer form="rect" intensity={2.2} position={[0, 6, -4]} scale={[14, 4, 1]} color="#dbeafe" />
          <Lightformer form="rect" intensity={1.4} position={[-8, 3, 4]} scale={[10, 3, 1]} color="#93c5fd" />
          <Lightformer form="rect" intensity={1.8} position={[8, 4, 4]} scale={[10, 3, 1]} color="#fef3c7" />
        </group>
      </Environment>

      {/* Architectural Lighting Hierarchy */}
      <hemisphereLight args={['#8ec5ff', '#0b1729', 0.75]} />
      <directionalLight
        position={[22, 34, 18]}
        intensity={2.2}
        color="#fff4e4"
        castShadow={!isSoftwareGl}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={5}
        shadow-camera-far={90}
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
      />
      <directionalLight position={[-26, 16, -24]} intensity={0.95} color="#38bdf8" />

      <CampusCameraRig
        activeSector={activeSector}
        isRtl={isRtl}
        prefersReducedMotion={prefersReducedMotion}
      />

      {/* Masterplan Ground Plane & Architectural Grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[75, 64]} />
        <meshStandardMaterial color="#081526" roughness={0.88} metalness={0.15} />
      </mesh>
      <gridHelper args={[90, 45, 0x1d4d80, 0x122b49]} position={[0, 0.02, 0]} />

      {!isSoftwareGl && (
        <ContactShadows
          position={[0, 0.03, -2]}
          opacity={0.42}
          scale={56}
          blur={1.8}
          far={12}
          resolution={256}
          color="#020813"
        />
      )}

      {/* Central HQ Plaza & Illuminated Ring */}
      <mesh position={[0, 0.17, -1.5]} material={mats.matPlinth} receiveShadow>
        <cylinderGeometry args={[7.6, 8.2, 0.35, 48]} />
      </mesh>
      <mesh position={[0, 0.05, -1.5]} rotation={[-Math.PI / 2, 0, 0]} material={mats.matLinkGlow}>
        <ringGeometry args={[8.3, 8.5, 64]} />
      </mesh>

      {/* CENTRAL LANDMARK: UNITED PARK GROUP HEADQUARTERS */}
      <group position={[0, 0, -1.5]}>
        <mesh position={[0, 0.65, 0]} material={mats.matPlinth} castShadow receiveShadow>
          <boxGeometry args={[8.4, 1.3, 6.2]} />
        </mesh>
        <mesh position={[0, 0.5, 0.3]} material={mats.matWarmGlow}>
          <boxGeometry args={[7.6, 0.45, 5.8]} />
        </mesh>
        <mesh position={[0, 1.35, 0]} material={mats.matParkRed}>
          <boxGeometry args={[8.6, 0.14, 6.4]} />
        </mesh>

        {/* West Corporate Wing */}
        <mesh position={[-1.35, 7.9, -0.2]} material={mats.matGlassNavy} castShadow receiveShadow>
          <boxGeometry args={[3.6, 13.4, 3.6]} />
        </mesh>
        <mesh position={[-1.35, 14.7, -0.2]} material={mats.matSilverMetal} castShadow>
          <boxGeometry args={[3.85, 0.25, 3.85]} />
        </mesh>
        {westFins.map((x) => (
          <mesh key={`wf-${x}`} position={[-1.35 + x, 8.0, -0.2]} material={mats.matSilverMetal}>
            <boxGeometry args={[0.12, 13.6, 3.78]} />
          </mesh>
        ))}

        {/* East Corporate Wing */}
        <mesh position={[1.6, 6.5, 0.35]} material={mats.matGlassNavy} castShadow receiveShadow>
          <boxGeometry args={[3.2, 10.6, 3.4]} />
        </mesh>
        <mesh position={[1.6, 11.9, 0.35]} material={mats.matSilverMetal} castShadow>
          <boxGeometry args={[3.45, 0.24, 3.65]} />
        </mesh>
        {eastFins.map((x) => (
          <mesh key={`ef-${x}`} position={[1.6 + x, 6.55, 0.35]} material={mats.matSilverMetal}>
            <boxGeometry args={[0.12, 10.7, 3.55]} />
          </mesh>
        ))}

        {/* Skybridge & Signature PARK Spire */}
        <mesh position={[0.15, 7.5, 0.1]} material={mats.matGlassTeal} castShadow>
          <boxGeometry args={[2.2, 1.1, 1.9]} />
        </mesh>
        <mesh position={[0.15, 8.1, 0.1]} material={mats.matParkRed}>
          <boxGeometry args={[2.4, 0.12, 2.1]} />
        </mesh>
        <mesh position={[-1.35, 16.3, -0.2]} material={mats.matSilverMetal}>
          <cylinderGeometry args={[0.05, 0.14, 3.2, 8]} />
        </mesh>
        <mesh position={[-1.35, 17.95, -0.2]} material={mats.matParkRed}>
          <sphereGeometry args={[0.16, 12, 12]} />
        </mesh>
        <pointLight position={[0, 12, 4]} color="#93c5fd" intensity={3.5} distance={22} decay={1.5} />
      </group>

      {/* SECTOR 1: INDUSTRIAL & ENGINEERING SOLUTIONS */}
      <SectorZoneShell
        sectorKey="industrial-engineering"
        position={[-10.5, 0, 4.2]}
        accentHex={0x38bdf8}
        activeSector={activeSector}
        mats={mats}
        onHoverSector={onHoverSector}
        onSelectSector={onSelectSector}
      >
        <mesh position={[-0.7, 1.6, -0.4]} material={mats.matDarkSteel} castShadow receiveShadow>
          <boxGeometry args={[4.8, 2.6, 3.2]} />
        </mesh>
        <mesh position={[-0.7, 2.95, -0.4]} material={mats.matSilverMetal} castShadow>
          <boxGeometry args={[5.0, 0.16, 3.4]} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <group key={`tank-${i}`} position={[2.3, 0, -1.3 + i * 1.35]}>
            <mesh position={[0, 1.9, 0]} material={mats.matSilverMetal} castShadow>
              <cylinderGeometry args={[0.55, 0.55, 3.2, 20]} />
            </mesh>
            <mesh position={[0, 3.5, 0]} material={mats.matSilverMetal}>
              <sphereGeometry args={[0.55, 16, 10]} />
            </mesh>
          </group>
        ))}
        <mesh position={[1.2, 1.1, 0.1]} rotation={[Math.PI / 2, 0, 0]} material={mats.matGlassTeal}>
          <cylinderGeometry args={[0.18, 0.18, 4.4, 14]} />
        </mesh>
        <group ref={fanRotorRef} position={[-1.3, 3.15, -0.4]}>
          <mesh material={mats.matLinkGlow}>
            <boxGeometry args={[1.2, 0.08, 0.2]} />
          </mesh>
          <mesh material={mats.matLinkGlow}>
            <boxGeometry args={[0.2, 0.08, 1.2]} />
          </mesh>
        </group>
      </SectorZoneShell>

      {/* SECTOR 2: CONTRACTING & CONSTRUCTION */}
      <SectorZoneShell
        sectorKey="contracting"
        position={[-11.5, 0, -7.8]}
        accentHex={0xd93829}
        activeSector={activeSector}
        mats={mats}
        onHoverSector={onHoverSector}
        onSelectSector={onSelectSector}
      >
        <mesh position={[-0.8, 3.9, 0]} material={mats.matPlinth} castShadow receiveShadow>
          <boxGeometry args={[1.8, 7.2, 1.8]} />
        </mesh>
        {[0, 1, 2, 3, 4].map((floor) => (
          <mesh key={`fl-${floor}`} position={[-0.8, 1.4 + floor * 1.25, 0]} material={mats.matArchWhite} castShadow>
            <boxGeometry args={[4.2, 0.18, 3.6]} />
          </mesh>
        ))}
        {craneColumns.map(([cx, cz]) => (
          <mesh key={`col-${cx}-${cz}`} position={[cx, 3.7, cz]} material={mats.matSilverMetal}>
            <boxGeometry args={[0.18, 6.8, 0.18]} />
          </mesh>
        ))}
        <mesh position={[2.1, 5.1, -0.5]} material={mats.matArchWhite} castShadow>
          <boxGeometry args={[0.45, 9.6, 0.45]} />
        </mesh>
        <group ref={craneBoomRef} position={[2.1, 9.9, -0.5]}>
          <mesh position={[-1.4, 0.1, 0]} material={mats.matArchWhite} castShadow>
            <boxGeometry args={[6.4, 0.32, 0.36]} />
          </mesh>
          <mesh position={[1.8, 0.1, 0]} material={mats.matParkRed}>
            <boxGeometry args={[1.1, 0.55, 0.65]} />
          </mesh>
          <mesh position={[-3.4, -1.3, 0]} material={mats.matSilverMetal}>
            <cylinderGeometry args={[0.03, 0.03, 2.6, 6]} />
          </mesh>
        </group>
      </SectorZoneShell>

      {/* SECTOR 3: REAL ESTATE DEVELOPMENT */}
      <SectorZoneShell
        sectorKey="real-estate"
        position={[0.5, 0, -13.5]}
        accentHex={0x60a5fa}
        activeSector={activeSector}
        mats={mats}
        onHoverSector={onHoverSector}
        onSelectSector={onSelectSector}
      >
        <mesh position={[0, 0.75, 0]} material={mats.matArchWhite} castShadow receiveShadow>
          <boxGeometry args={[6.6, 0.9, 4.2]} />
        </mesh>
        <mesh position={[-1.45, 6.1, -0.2]} material={mats.matGlassNavy} castShadow receiveShadow>
          <boxGeometry args={[2.7, 10.2, 2.7]} />
        </mesh>
        <mesh position={[-1.45, 11.3, -0.2]} material={mats.matArchWhite} castShadow>
          <boxGeometry args={[2.9, 0.2, 2.9]} />
        </mesh>
        <mesh position={[1.65, 4.8, 0.3]} material={mats.matGlassTeal} castShadow receiveShadow>
          <boxGeometry args={[2.6, 7.6, 2.6]} />
        </mesh>
        <mesh position={[1.65, 8.7, 0.3]} material={mats.matArchWhite} castShadow>
          <boxGeometry args={[2.8, 0.2, 2.8]} />
        </mesh>
        {[2, 4, 6, 8].map((fl) => (
          <mesh key={`reb1-${fl}`} position={[-1.45, fl + 1.0, -0.2]} material={mats.matWarmGlow}>
            <boxGeometry args={[2.76, 0.09, 2.76]} />
          </mesh>
        ))}
        {[2, 4, 6].map((fl) => (
          <mesh key={`reb2-${fl}`} position={[1.65, fl + 1.0, 0.3]} material={mats.matWarmGlow}>
            <boxGeometry args={[2.66, 0.09, 2.66]} />
          </mesh>
        ))}
      </SectorZoneShell>

      {/* SECTOR 4: MEDICAL CLINICS & HEALTHCARE */}
      <SectorZoneShell
        sectorKey="healthcare"
        position={[11.5, 0, -7.2]}
        accentHex={0x22d3ee}
        activeSector={activeSector}
        mats={mats}
        onHoverSector={onHoverSector}
        onSelectSector={onSelectSector}
      >
        <mesh position={[0, 1.7, -0.2]} material={mats.matArchWhite} castShadow receiveShadow>
          <boxGeometry args={[5.4, 2.8, 3.6]} />
        </mesh>
        <mesh position={[0, 1.4, 1.2]} material={mats.matGlassTeal} castShadow>
          <boxGeometry args={[4.6, 2.1, 2.2]} />
        </mesh>
        {[1.1, 1.65, 2.2, 2.75].map((y) => (
          <mesh key={`hc-${y}`} position={[0, y, -0.2]} material={mats.matArchWhite}>
            <boxGeometry args={[5.7, 0.1, 3.9]} />
          </mesh>
        ))}
        <mesh position={[0, 1.9, 2.3]} material={mats.matArchWhite} castShadow>
          <boxGeometry args={[2.8, 0.16, 1.9]} />
        </mesh>
        <mesh position={[0, 3.25, 0.2]} material={mats.matLinkGlow}>
          <boxGeometry args={[0.25, 0.22, 0.9]} />
        </mesh>
        <mesh position={[0, 3.25, 0.2]} material={mats.matLinkGlow}>
          <boxGeometry args={[0.9, 0.22, 0.25]} />
        </mesh>
      </SectorZoneShell>

      {/* SECTOR 5: SOLAR ENERGY & RENEWABLE ENERGY */}
      <SectorZoneShell
        sectorKey="solar-energy"
        position={[10.5, 0, 4.2]}
        accentHex={0xf59e0b}
        activeSector={activeSector}
        mats={mats}
        onHoverSector={onHoverSector}
        onSelectSector={onSelectSector}
      >
        <mesh position={[-2.0, 1.15, -1.6]} material={mats.matArchWhite} castShadow receiveShadow>
          <boxGeometry args={[2.6, 1.7, 1.9]} />
        </mesh>
        <mesh position={[-2.0, 2.05, -1.6]} material={mats.matSilverMetal}>
          <boxGeometry args={[2.7, 0.12, 2.0]} />
        </mesh>
        <instancedMesh
          ref={solarMeshRef}
          args={[undefined, undefined, 24]}
          material={mats.matSolarCell}
          castShadow={!isSoftwareGl}
        >
          <boxGeometry args={[0.95, 0.06, 0.65]} />
        </instancedMesh>
      </SectorZoneShell>

      {/* Subtle Atmospheric Dust Motes via Drei Sparkles */}
      <Sparkles
        count={90}
        scale={[42, 16, 36]}
        position={[0, 8, -4]}
        size={1.6}
        speed={prefersReducedMotion ? 0 : 0.25}
        opacity={0.35}
        color="#93c5fd"
      />
    </>
  );
};

/* ---------------- MAIN EXPORTED HERO 3D / MOBILE STATIC FALLBACK ---------------- */
export const HeroCampus3D: React.FC<HeroCampus3DProps> = ({
  activeSector,
  isRtl,
  onHoverSector,
  onSelectSector,
}) => {
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const [isSoftwareGl, setIsSoftwareGl] = useState(false);

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const syncFlags = () => {
      setIsMobileViewport(mobileQuery.matches);
      setPrefersReducedMotion(motionQuery.matches);
    };
    syncFlags();

    mobileQuery.addEventListener('change', syncFlags);
    motionQuery.addEventListener('change', syncFlags);

    // Quick static check for WebGL support on desktop
    if (!mobileQuery.matches) {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl =
          probeCanvas.getContext('webgl2') ||
          probeCanvas.getContext('webgl') ||
          probeCanvas.getContext('experimental-webgl');
        if (!gl) {
          setWebglUnavailable(true);
        }
      } catch {
        setWebglUnavailable(true);
      }
    }

    return () => {
      mobileQuery.removeEventListener('change', syncFlags);
      motionQuery.removeEventListener('change', syncFlags);
      document.body.style.cursor = 'default';
    };
  }, []);

  // Mobile devices OR browsers without WebGL render an optimized static architectural fallback image
  if (isMobileViewport || webglUnavailable) {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[#051020]" aria-hidden="true">
        <img
          src="/images/partners-banner.jpg"
          alt="United Park Group diversified corporate headquarters skyline"
          decoding="async"
          fetchPriority="high"
          className="w-full h-full object-cover object-center opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#040E1D]/88 via-[#081D38]/75 to-[#133D68]/65" />
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 w-full h-full"
      aria-label="Interactive 3D architectural masterplan of United Park Group holding company and its five business sectors"
    >
      <Canvas
        dpr={isSoftwareGl ? 1 : [1, 2]}
        shadows={!isSoftwareGl}
        frameloop={prefersReducedMotion ? 'demand' : 'always'}
        camera={{ position: [0, 16.5, 31.5], fov: 42, near: 0.5, far: 220 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.08,
        }}
        onCreated={({ gl }) => {
          const ctx = gl.getContext();
          const dbg = ctx.getExtension('WEBGL_debug_renderer_info');
          const rendererStr = dbg ? String(ctx.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
          if (/SwiftShader|llvmpipe|WARP|Software|Apple Paravirtual/i.test(rendererStr)) {
            setIsSoftwareGl(true);
          }
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            setWebglUnavailable(true);
          });
        }}
      >
        <CampusSceneContent
          activeSector={activeSector}
          isRtl={isRtl}
          isSoftwareGl={isSoftwareGl}
          prefersReducedMotion={prefersReducedMotion}
          onHoverSector={onHoverSector}
          onSelectSector={onSelectSector}
        />
      </Canvas>
    </div>
  );
};
