import React, { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, Sparkles, useGLTF } from '@react-three/drei';
import gsap from 'gsap';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ChevronDown,
  Cog,
  HardHat,
  RotateCcw,
  Stethoscope,
  Sun,
} from 'lucide-react';
import campusFallbackImage from '../../assets/images/park_campus_clean_hero_1794540145464.jpg';
import { GROUP_SECTORS, getSectorByKey, SectorDefinition, SectorKey } from '../../data/sectors';

const CAMPUS_MODEL_URL = '/models/park-campus.glb';

export interface HoldingCompanyHeroProps {
  heroHeading?: string | null;
  heroSubheading?: string | null;
  heroCtaText?: string | null;
  locale: 'en' | 'ar';
  isRtl: boolean;
  selectedSector?: SectorKey | null;
  onSectorChange?: (sector: SectorKey | null) => void;
  onNavigate: (path: string) => void;
  onExploreGroup: () => void;
}

interface ZoneSceneConfig {
  key: SectorKey;
  position: [number, number, number];
  accentHex: number;
  target: [number, number, number];
  camera: [number, number, number];
}

const SECTOR_ZONES: ZoneSceneConfig[] = [
  {
    key: 'industrial-engineering',
    position: [-10.5, 0, 4.2],
    accentHex: 0x38bdf8,
    target: [-10.5, 2.2, 4.2],
    camera: [-13.0, 10.5, 19.7],
  },
  {
    key: 'contracting',
    position: [-11.5, 0, -7.8],
    accentHex: 0xd93829,
    target: [-11.5, 3.5, -7.8],
    camera: [-14.0, 12.5, 8.7],
  },
  {
    key: 'real-estate',
    position: [0.5, 0, -13.5],
    accentHex: 0x60a5fa,
    target: [0.5, 4.2, -13.5],
    camera: [2.0, 14.0, 3.5],
  },
  {
    key: 'healthcare',
    position: [11.5, 0, -7.2],
    accentHex: 0x22d3ee,
    target: [11.5, 2.2, -7.2],
    camera: [14.5, 11.0, 8.8],
  },
  {
    key: 'solar-energy',
    position: [10.5, 0, 4.2],
    accentHex: 0xf59e0b,
    target: [10.5, 1.8, 4.2],
    camera: [13.5, 10.5, 19.7],
  },
];

const SECTOR_ZONE_MAP: Record<SectorKey, ZoneSceneConfig> = SECTOR_ZONES.reduce(
  (acc, z) => {
    acc[z.key] = z;
    return acc;
  },
  {} as Record<SectorKey, ZoneSceneConfig>
);

useGLTF.preload(CAMPUS_MODEL_URL);

/* ---------------- ERROR BOUNDARY FOR GLTF LOADER ---------------- */
class CampusModelErrorBoundary extends Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/* ---------------- MOBILE & NON-WEBGL 3D-STYLE PARALLAX FALLBACK ---------------- */
const MobileHeroFallback: React.FC<{ isAr: boolean; prefersReducedMotion: boolean }> = ({
  isAr,
  prefersReducedMotion,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const layerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = layerRef.current;
    if (!el || prefersReducedMotion || imgFailed) {
      if (el) el.style.transform = 'translate3d(0px, 0px, 0px) scale(1.06)';
      return;
    }

    const state = {
      targetX: 0,
      targetY: 0,
      scrollY: 0,
      curX: 0,
      curY: 0,
      touchOriginX: 0,
      touchOriginY: 0,
      rafId: 0,
    };

    const clamp = (val: number, limit: number) => Math.max(-limit, Math.min(limit, val));

    const scheduleFrame = () => {
      if (state.rafId) return;
      state.rafId = requestAnimationFrame(step);
    };

    const step = () => {
      state.rafId = 0;
      const goalY = clamp(state.targetY + state.scrollY, 16);
      const goalX = clamp(state.targetX, 14);
      state.curX += (goalX - state.curX) * 0.14;
      state.curY += (goalY - state.curY) * 0.14;

      if (layerRef.current) {
        layerRef.current.style.transform = `translate3d(${state.curX.toFixed(2)}px, ${state.curY.toFixed(2)}px, 0px) scale(1.06)`;
      }

      if (Math.abs(goalX - state.curX) > 0.08 || Math.abs(goalY - state.curY) > 0.08) {
        scheduleFrame();
      }
    };

    const onScroll = () => {
      const heroH = Math.max(window.innerHeight * 0.9, 1);
      const ratio = Math.min(Math.max(window.scrollY / heroH, 0), 1);
      state.scrollY = -ratio * 14;
      scheduleFrame();
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      state.touchOriginX = e.touches[0].clientX;
      state.touchOriginY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const dx = (e.touches[0].clientX - state.touchOriginX) * 0.08;
      const dy = (e.touches[0].clientY - state.touchOriginY) * 0.05;
      state.targetX = clamp(dx, 14);
      state.targetY = clamp(dy, 10);
      scheduleFrame();
    };

    const onTouchEnd = () => {
      state.targetX = 0;
      state.targetY = 0;
      scheduleFrame();
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      cancelAnimationFrame(state.rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [prefersReducedMotion, imgFailed]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#051020]" aria-hidden="true">
      {!imgFailed ? (
        <div
          ref={layerRef}
          className="w-full h-full will-change-transform origin-center scale-[1.06]"
        >
          <img
            src={campusFallbackImage}
            alt={
              isAr
                ? 'المقر الرئيسي لمجموعة بارك المتحدة وقطاعاتها الخمسة المتكاملة'
                : 'United Park Group diversified architectural headquarters campus'
            }
            decoding="async"
            fetchPriority="high"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover object-center opacity-70"
          />
        </div>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#061427] via-[#0C2B4B] to-[#133D68] flex items-center justify-center">
          <div className="w-72 h-72 rounded-full bg-sky-500/10 border border-sky-400/20" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-[#040E1D]/86 via-[#081D38]/70 to-[#133D68]/58" />
    </div>
  );
};

/* ---------------- CAMERA RIG (DAMPED PARALLAX + SCROLL HQ ZOOM + SECTOR FOCUS) ---------------- */
const CampusCameraRig: React.FC<{
  activeSector: SectorKey | null;
  isRtl: boolean;
  prefersReducedMotion: boolean;
}> = ({ activeSector, isRtl, prefersReducedMotion }) => {
  const { camera, invalidate } = useThree();
  const scrollTargetRef = useRef(0);
  const scrollDampedRef = useRef(0);
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
      const next = Math.min(Math.max(window.scrollY / heroH, 0), 1);
      scrollTargetRef.current = next;
      if (prefersReducedMotion) {
        scrollDampedRef.current = next;
        invalidate();
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [invalidate, prefersReducedMotion]);

  useEffect(() => {
    const spec = activeSector ? SECTOR_ZONE_MAP[activeSector] : null;
    const rtlOffset = isRtl ? 3.2 : -3.2;

    const nextCam = spec ? spec.camera : [0, 16.5, 31.5];
    const nextTarget = spec ? spec.target : [rtlOffset, 2.2, -2.5];

    const tween = gsap.to(rigState.current, {
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

    return () => {
      tween.kill();
    };
  }, [activeSector, isRtl, prefersReducedMotion, invalidate]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);

    if (!prefersReducedMotion) {
      parallaxRef.current.x = THREE.MathUtils.damp(
        parallaxRef.current.x,
        state.pointer.x * 1.4,
        4.5,
        dt
      );
      parallaxRef.current.y = THREE.MathUtils.damp(
        parallaxRef.current.y,
        state.pointer.y * 0.55,
        4.5,
        dt
      );
      scrollDampedRef.current = THREE.MathUtils.damp(
        scrollDampedRef.current,
        scrollTargetRef.current,
        5.5,
        dt
      );
    } else {
      parallaxRef.current.x = 0;
      parallaxRef.current.y = 0;
      scrollDampedRef.current = scrollTargetRef.current;
    }

    // Subtle upward crane elevation & forward zoom toward the central HQ plaza on scroll
    const s = scrollDampedRef.current;
    const scrollElev = s * 4.2;
    const scrollZoomZ = s * 4.6;
    const hqPullFactor = activeSector ? 0 : s * 0.35;

    const camX = THREE.MathUtils.lerp(rigState.current.camX, 0, hqPullFactor);
    const targetX = THREE.MathUtils.lerp(rigState.current.targetX, 0, hqPullFactor);
    const targetY = THREE.MathUtils.lerp(rigState.current.targetY, 3.2, hqPullFactor) - s * 0.8;
    const targetZ = THREE.MathUtils.lerp(rigState.current.targetZ, -1.5, hqPullFactor);

    camera.position.set(
      camX + parallaxRef.current.x,
      rigState.current.camY + parallaxRef.current.y + scrollElev,
      rigState.current.camZ - scrollZoomZ
    );
    lookTargetVec.current.set(targetX, targetY, targetZ);
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

/* ---------------- INTERACTIVE SECTOR HALO & HIT PROXY ---------------- */
const SectorInteractiveOverlays: React.FC<{
  activeSector: SectorKey | null;
  onHoverSector: (sector: SectorKey | null) => void;
  onSelectSector: (sector: SectorKey) => void;
}> = ({ activeSector, onHoverSector, onSelectSector }) => {
  return (
    <>
      {SECTOR_ZONES.map((zone) => {
        const isSelected = activeSector === zone.key;
        const lightIntensity = isSelected ? 6.5 : activeSector ? 1.2 : 2.2;
        const haloOpacity = isSelected ? 0.92 : activeSector ? 0.18 : 0.38;

        const handleOver = (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          onHoverSector(zone.key);
        };

        const handleOut = (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          document.body.style.cursor = 'default';
          onHoverSector(null);
        };

        const handleClick = (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onSelectSector(zone.key);
        };

        return (
          <group key={zone.key} position={zone.position}>
            <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[4.55, 4.88, 48]} />
              <meshBasicMaterial
                color={zone.accentHex}
                transparent
                opacity={haloOpacity}
                side={THREE.DoubleSide}
              />
            </mesh>

            <pointLight
              position={[0, 6.5, 1.5]}
              color={zone.accentHex}
              intensity={lightIntensity}
              distance={16}
              decay={1.6}
            />

            <mesh
              position={[0, 4.25, 0]}
              onPointerOver={handleOver}
              onPointerOut={handleOut}
              onClick={handleClick}
            >
              <cylinderGeometry args={[4.8, 4.8, 8.5, 16]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>
        );
      })}
    </>
  );
};

/* ---------------- GLTF CAMPUS MODEL (VIA USEGLTF) ---------------- */
const GltfCampusModel: React.FC<{ prefersReducedMotion: boolean }> = ({
  prefersReducedMotion,
}) => {
  const gltf = useGLTF(CAMPUS_MODEL_URL);

  const { clonedScene, craneBoom, fanRotor } = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.envMapIntensity = Math.max(mat.envMapIntensity ?? 1, 1.15);
        }
      }
    });
    return {
      clonedScene: clone,
      craneBoom: clone.getObjectByName('Crane_Boom') ?? null,
      fanRotor: clone.getObjectByName('Fan_Rotor') ?? null,
    };
  }, [gltf.scene]);

  useFrame(({ clock }) => {
    if (prefersReducedMotion) return;
    const t = clock.getElapsedTime();
    if (craneBoom) {
      craneBoom.rotation.y = Math.sin(t * 0.22) * 0.38;
    }
    if (fanRotor) {
      fanRotor.rotation.y = t * 2.2;
    }
  });

  return <primitive object={clonedScene} />;
};

/* ---------------- PROCEDURAL 3D CAMPUS FALLBACK (SUSPENSE / ERROR) ---------------- */
const ProceduralCampusFallback: React.FC<{
  prefersReducedMotion: boolean;
  isSoftwareGl: boolean;
}> = ({ prefersReducedMotion, isSoftwareGl }) => {
  const craneRef = useRef<THREE.Group | null>(null);
  const rotorRef = useRef<THREE.Group | null>(null);
  const solarRef = useRef<THREE.InstancedMesh | null>(null);

  const mats = useMemo(() => {
    return {
      plinth: new THREE.MeshStandardMaterial({ color: 0x10223b, roughness: 0.55, metalness: 0.28 }),
      archWhite: new THREE.MeshStandardMaterial({ color: 0xe6edf5, roughness: 0.35, metalness: 0.12 }),
      silver: new THREE.MeshStandardMaterial({ color: 0xb8c7d9, roughness: 0.24, metalness: 0.85 }),
      darkSteel: new THREE.MeshStandardMaterial({ color: 0x1c2c42, roughness: 0.38, metalness: 0.75 }),
      glassNavy: new THREE.MeshPhysicalMaterial({ color: 0x16497d, roughness: 0.1, metalness: 0.25, clearcoat: 1 }),
      glassTeal: new THREE.MeshPhysicalMaterial({ color: 0x1b6ca8, roughness: 0.12, metalness: 0.18, clearcoat: 0.9 }),
      parkRed: new THREE.MeshStandardMaterial({ color: 0xd93829, emissive: 0x6b140d, emissiveIntensity: 0.75 }),
      warmGlow: new THREE.MeshStandardMaterial({ color: 0xfef3c7, emissive: 0xfde68a, emissiveIntensity: 0.85 }),
      linkGlow: new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.8 }),
      solarCell: new THREE.MeshStandardMaterial({ color: 0x0f2d5c, roughness: 0.16, metalness: 0.78 }),
    };
  }, []);

  useEffect(() => {
    return () => {
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [mats]);

  useEffect(() => {
    const inst = solarRef.current;
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
    inst.computeBoundingSphere();
  }, []);

  useFrame(({ clock }) => {
    if (prefersReducedMotion) return;
    const t = clock.getElapsedTime();
    if (craneRef.current) craneRef.current.rotation.y = Math.sin(t * 0.22) * 0.38;
    if (rotorRef.current) rotorRef.current.rotation.y = t * 2.2;
  });

  return (
    <group>
      {/* Central HQ */}
      <mesh position={[0, 0.17, -1.5]} material={mats.plinth} receiveShadow>
        <cylinderGeometry args={[7.6, 8.2, 0.35, 36]} />
      </mesh>
      <group position={[0, 0, -1.5]}>
        <mesh position={[0, 0.65, 0]} material={mats.plinth} castShadow receiveShadow>
          <boxGeometry args={[8.4, 1.3, 6.2]} />
        </mesh>
        <mesh position={[0, 1.35, 0]} material={mats.parkRed}>
          <boxGeometry args={[8.6, 0.14, 6.4]} />
        </mesh>
        <mesh position={[-1.35, 7.9, -0.2]} material={mats.glassNavy} castShadow receiveShadow>
          <boxGeometry args={[3.6, 13.4, 3.6]} />
        </mesh>
        <mesh position={[1.6, 6.5, 0.35]} material={mats.glassNavy} castShadow receiveShadow>
          <boxGeometry args={[3.2, 10.6, 3.4]} />
        </mesh>
        <mesh position={[0.15, 7.5, 0.1]} material={mats.glassTeal} castShadow>
          <boxGeometry args={[2.2, 1.1, 1.9]} />
        </mesh>
        <mesh position={[-1.35, 16.3, -0.2]} material={mats.silver}>
          <cylinderGeometry args={[0.05, 0.14, 3.2, 8]} />
        </mesh>
        <mesh position={[-1.35, 17.95, -0.2]} material={mats.parkRed}>
          <sphereGeometry args={[0.16, 12, 12]} />
        </mesh>
      </group>

      {/* Industrial Sector */}
      <group position={[-10.5, 0, 4.2]}>
        <mesh position={[0, 0.15, 0]} material={mats.plinth} receiveShadow>
          <cylinderGeometry args={[4.4, 4.7, 0.3, 32]} />
        </mesh>
        <mesh position={[-0.7, 1.6, -0.4]} material={mats.darkSteel} castShadow>
          <boxGeometry args={[4.8, 2.6, 3.2]} />
        </mesh>
        <group ref={rotorRef} position={[-1.3, 3.15, -0.4]}>
          <mesh material={mats.linkGlow}>
            <boxGeometry args={[1.2, 0.08, 0.2]} />
          </mesh>
          <mesh material={mats.linkGlow}>
            <boxGeometry args={[0.2, 0.08, 1.2]} />
          </mesh>
        </group>
      </group>

      {/* Contracting Sector */}
      <group position={[-11.5, 0, -7.8]}>
        <mesh position={[0, 0.15, 0]} material={mats.plinth} receiveShadow>
          <cylinderGeometry args={[4.4, 4.7, 0.3, 32]} />
        </mesh>
        <mesh position={[-0.8, 3.9, 0]} material={mats.plinth} castShadow>
          <boxGeometry args={[1.8, 7.2, 1.8]} />
        </mesh>
        <mesh position={[2.1, 5.1, -0.5]} material={mats.archWhite} castShadow>
          <boxGeometry args={[0.45, 9.6, 0.45]} />
        </mesh>
        <group ref={craneRef} position={[2.1, 9.9, -0.5]}>
          <mesh position={[-1.4, 0.1, 0]} material={mats.archWhite}>
            <boxGeometry args={[6.4, 0.32, 0.36]} />
          </mesh>
          <mesh position={[1.8, 0.1, 0]} material={mats.parkRed}>
            <boxGeometry args={[1.1, 0.55, 0.65]} />
          </mesh>
        </group>
      </group>

      {/* Real Estate Sector */}
      <group position={[0.5, 0, -13.5]}>
        <mesh position={[0, 0.15, 0]} material={mats.plinth} receiveShadow>
          <cylinderGeometry args={[4.4, 4.7, 0.3, 32]} />
        </mesh>
        <mesh position={[-1.45, 6.1, -0.2]} material={mats.glassNavy} castShadow>
          <boxGeometry args={[2.7, 10.2, 2.7]} />
        </mesh>
        <mesh position={[1.65, 4.8, 0.3]} material={mats.glassTeal} castShadow>
          <boxGeometry args={[2.6, 7.6, 2.6]} />
        </mesh>
      </group>

      {/* Healthcare Sector */}
      <group position={[11.5, 0, -7.2]}>
        <mesh position={[0, 0.15, 0]} material={mats.plinth} receiveShadow>
          <cylinderGeometry args={[4.4, 4.7, 0.3, 32]} />
        </mesh>
        <mesh position={[0, 1.7, -0.2]} material={mats.archWhite} castShadow>
          <boxGeometry args={[5.4, 2.8, 3.6]} />
        </mesh>
        <mesh position={[0, 1.4, 1.2]} material={mats.glassTeal}>
          <boxGeometry args={[4.6, 2.1, 2.2]} />
        </mesh>
      </group>

      {/* Solar Energy Sector */}
      <group position={[10.5, 0, 4.2]}>
        <mesh position={[0, 0.15, 0]} material={mats.plinth} receiveShadow>
          <cylinderGeometry args={[4.4, 4.7, 0.3, 32]} />
        </mesh>
        <instancedMesh
          ref={solarRef}
          args={[undefined, undefined, 24]}
          material={mats.solarCell}
          castShadow={!isSoftwareGl}
        >
          <boxGeometry args={[0.95, 0.06, 0.65]} />
        </instancedMesh>
      </group>
    </group>
  );
};

/* ---------------- FULL CAMPUS SCENE GRAPH ---------------- */
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
  const proceduralFallback = (
    <ProceduralCampusFallback
      prefersReducedMotion={prefersReducedMotion}
      isSoftwareGl={isSoftwareGl}
    />
  );

  return (
    <>
      <color attach="background" args={['#061325']} />
      <fogExp2 attach="fog" args={['#07172d', 0.0115]} />
      <SkyAtmosphere />

      {/* Studio Reflections via Drei Lightformers */}
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 0]}>
          <Lightformer form="rect" intensity={2.2} position={[0, 6, -4]} scale={[14, 4, 1]} color="#dbeafe" />
          <Lightformer form="rect" intensity={1.4} position={[-8, 3, 4]} scale={[10, 3, 1]} color="#93c5fd" />
          <Lightformer form="rect" intensity={1.8} position={[8, 4, 4]} scale={[10, 3, 1]} color="#fef3c7" />
        </group>
      </Environment>

      {/* Warm Key + Cool Fill + Rim Lighting */}
      <hemisphereLight args={['#8ec5ff', '#0b1729', 0.8]} />
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
      <pointLight position={[0, 12, 4]} color="#93c5fd" intensity={3.5} distance={22} decay={1.5} />

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

      {/* Local GLB Campus Environment Loaded via useGLTF with ErrorBoundary + Procedural Fallback */}
      <CampusModelErrorBoundary fallback={proceduralFallback}>
        <Suspense fallback={proceduralFallback}>
          <GltfCampusModel prefersReducedMotion={prefersReducedMotion} />
        </Suspense>
      </CampusModelErrorBoundary>

      {/* Interactive Sector Halos & Pointer Raycasting Proxies */}
      <SectorInteractiveOverlays
        activeSector={activeSector}
        onHoverSector={onHoverSector}
        onSelectSector={onSelectSector}
      />

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

/* ---------------- UNIFIED HOLDING COMPANY HERO ---------------- */
export const HoldingCompanyHero: React.FC<HoldingCompanyHeroProps> = ({
  heroHeading,
  heroSubheading,
  heroCtaText,
  locale,
  isRtl,
  selectedSector: controlledSelectedSector,
  onSectorChange,
  onNavigate,
  onExploreGroup,
}) => {
  const isAr = locale === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const [internalSelectedSector, setInternalSelectedSector] = useState<SectorKey | null>(null);
  const selectedSector =
    controlledSelectedSector !== undefined ? controlledSelectedSector : internalSelectedSector;
  const setSelectedSector = (next: SectorKey | null) => {
    setInternalSelectedSector(next);
    onSectorChange?.(next);
  };
  const [hoveredSector, setHoveredSector] = useState<SectorKey | null>(null);

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

  const focusedSectorKey = hoveredSector ?? selectedSector;
  const focusedSector = focusedSectorKey ? getSectorByKey(focusedSectorKey) : null;

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

  const renderSectorIcon = (iconName: SectorDefinition['iconName'], className = 'w-5 h-5') => {
    switch (iconName) {
      case 'Cog':
        return <Cog className={className} aria-hidden="true" />;
      case 'HardHat':
        return <HardHat className={className} aria-hidden="true" />;
      case 'Building2':
        return <Building2 className={className} aria-hidden="true" />;
      case 'Stethoscope':
        return <Stethoscope className={className} aria-hidden="true" />;
      case 'Sun':
        return <Sun className={className} aria-hidden="true" />;
    }
  };

  const handleTileClick = (sector: SectorDefinition) => {
    if (selectedSector === sector.key) {
      onNavigate(sector.route);
    } else {
      setSelectedSector(sector.key);
    }
  };

  return (
    <section className="relative min-h-[92vh] sm:min-h-[95vh] bg-[#051020] text-white overflow-hidden flex flex-col justify-between">
      {/* 3D GLTF Campus Canvas (Desktop WebGL) or Custom Mobile Parallax Fallback Image (<768px) */}
      {isMobileViewport || webglUnavailable ? (
        <MobileHeroFallback isAr={isAr} prefersReducedMotion={prefersReducedMotion} />
      ) : (
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
              activeSector={focusedSectorKey}
              isRtl={isRtl}
              isSoftwareGl={isSoftwareGl}
              prefersReducedMotion={prefersReducedMotion}
              onHoverSector={setHoveredSector}
              onSelectSector={(key) => {
                if (selectedSector === key) {
                  const sec = getSectorByKey(key);
                  if (sec) onNavigate(sec.route);
                } else {
                  setSelectedSector(key);
                }
              }}
            />
          </Canvas>
        </div>
      )}

      {/* Directional readability scrims (solid RGBA gradients, zero backdrop-blur over WebGL) */}
      <div
        className={`pointer-events-none absolute inset-0 z-[1] ${
          isRtl
            ? 'bg-gradient-to-l from-[#040E1D]/92 via-[#051428]/68 to-[#051428]/20'
            : 'bg-gradient-to-r from-[#040E1D]/92 via-[#051428]/68 to-[#051428]/20'
        }`}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#040E1D]/95 via-[#040E1D]/55 to-transparent z-[1]"
        aria-hidden="true"
      />

      {/* Semantic Foreground Overlay */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-8 flex-1 flex flex-col justify-between gap-8">
        <div className="max-w-2xl space-y-5 my-auto pt-4">
          <div className="inline-flex items-center gap-2.5 text-[11px] sm:text-xs font-semibold tracking-[0.18em] uppercase text-sky-300">
            <span className="w-5 h-0.5 bg-[#D93829]" aria-hidden="true" />
            <span>
              {isAr
                ? 'مجموعة واحدة · قطاعات متعددة · رؤية موحدة'
                : 'ONE GROUP · MULTIPLE INDUSTRIES · ONE VISION'}
            </span>
          </div>

          <h1
            className="font-display font-extrabold tracking-tight text-white leading-[1.08] whitespace-pre-line"
            style={{ fontSize: 'clamp(2.1rem, 4.3vw, 3.65rem)', textWrap: 'balance' }}
          >
            {heroHeading ||
              (isAr
                ? 'أكثر من مجرد مجموعة...\nرؤية تجمع قطاعات متعددة.'
                : 'MORE THAN A GROUP.\nA VISION THAT CONNECTS INDUSTRIES.')}
          </h1>

          <p className="text-sm sm:text-base lg:text-[17px] text-slate-200 leading-relaxed max-w-xl">
            {heroSubheading ||
              (isAr
                ? 'تجمع مجموعة يونايتد بارك قطاعات متنوعة تشمل الحلول الصناعية والهندسية، والمقاولات، والتطوير العقاري، والرعاية الصحية، والطاقة المتجددة، ضمن رؤية موحدة للنمو والاستدامة.'
                : 'UNITED PARK GROUP brings together diverse businesses across industrial engineering, contracting, real estate development, healthcare, and renewable energy — creating integrated opportunities for sustainable growth and a stronger future.')}
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-3.5">
            <button
              type="button"
              onClick={onExploreGroup}
              className="inline-flex items-center gap-2.5 px-6 sm:px-7 py-3.5 text-xs sm:text-sm font-bold tracking-wide uppercase text-white bg-[#16528E] hover:bg-[#1B64AC] rounded-md shadow-lg transition-colors min-h-[44px]"
            >
              <span>
                {heroCtaText || (isAr ? 'استكشف قطاعات المجموعة' : 'EXPLORE OUR GROUP')}
              </span>
              <ArrowIcon className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/contact')}
              className="inline-flex items-center gap-2 px-6 py-3.5 text-xs sm:text-sm font-semibold tracking-wide uppercase text-white bg-[#091A32]/85 border border-white/30 hover:bg-[#10294B] rounded-md transition-colors min-h-[44px]"
            >
              <span>{isAr ? 'تواصل معنا' : 'GET IN TOUCH'}</span>
            </button>
          </div>
        </div>

        {/* Active Sector Focus Preview + Five-Tile Sector Dock */}
        <div className="space-y-3">
          {focusedSector && (
            <div className="bg-[#071528]/92 border border-white/15 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-4xl">
              <div className="flex items-start sm:items-center gap-3">
                <span
                  className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 text-white"
                  style={{ backgroundColor: focusedSector.accentHex }}
                >
                  {renderSectorIcon(focusedSector.iconName, 'w-4 h-4')}
                </span>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-[11px] font-mono-tabular uppercase tracking-wider text-sky-300">
                    <span>
                      {isAr ? `القطاع ${focusedSector.zoneCode}` : `Sector ${focusedSector.zoneCode}`}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-300">
                      {isAr ? focusedSector.ar.subtitle : focusedSector.en.subtitle}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-white">
                    {isAr ? focusedSector.ar.title : focusedSector.en.title}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedSector && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSector(null);
                      setHoveredSector(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white border border-white/15 rounded-md"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{isAr ? 'نظرة عامة' : 'Overview'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onNavigate(focusedSector.route)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#D93829] hover:bg-[#B92B1D] rounded-md transition-colors"
                >
                  <span>{isAr ? 'استكشف القطاع' : 'Explore Sector'}</span>
                  <ArrowIcon className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {/* Five-Tile Sector Dock */}
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3"
            role="region"
            aria-label={isAr ? 'محدد قطاعات المجموعة' : 'Five-tile sector dock'}
          >
            {GROUP_SECTORS.map((sec) => {
              const isActive = focusedSectorKey === sec.key;
              return (
                <button
                  key={sec.key}
                  type="button"
                  aria-pressed={selectedSector === sec.key}
                  onMouseEnter={() => setHoveredSector(sec.key)}
                  onMouseLeave={() => setHoveredSector(null)}
                  onFocus={() => setHoveredSector(sec.key)}
                  onBlur={() => setHoveredSector(null)}
                  onClick={() => handleTileClick(sec)}
                  className={`group text-start rounded-lg px-3.5 py-3 border transition-colors flex items-center gap-3 min-h-[60px] ${
                    isActive
                      ? 'bg-[#12325C] border-sky-400 text-white shadow-md'
                      : 'bg-[#071528]/88 border-white/15 text-slate-200 hover:bg-[#0D2342] hover:border-white/35'
                  }`}
                >
                  <span
                    className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? 'bg-[#D93829] text-white'
                        : 'bg-[#10294B] text-sky-300 group-hover:text-white'
                    }`}
                  >
                    {renderSectorIcon(sec.iconName, 'w-4 h-4')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-mono-tabular text-slate-400 leading-none mb-1">
                      {sec.zoneCode}
                    </span>
                    <span className="block text-xs sm:text-[13px] font-semibold leading-tight truncate">
                      {isAr ? sec.ar.shortLabel : sec.en.shortLabel}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Scroll Prompt Bar */}
          <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
            <button
              type="button"
              onClick={onExploreGroup}
              className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
            >
              <ChevronDown className="w-4 h-4 text-sky-300" aria-hidden="true" />
              <span>
                {isAr
                  ? 'مرر لاستكشاف قطاعات الأعمال الخمسة'
                  : 'Scroll to explore our five business sectors · Click any 3D zone'}
              </span>
            </button>
            <span className="hidden md:inline font-mono-tabular text-[11px] text-slate-400">
              {isAr ? 'جدة · المملكة العربية السعودية · منذ ١٩٨٩' : 'JEDDAH, KSA · EST. 1989'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HoldingCompanyHero;
