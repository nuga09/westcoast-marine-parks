"use client";

import * as React from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { useGLTF, Environment, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

/* ── Water plane with animated vertex shader ─────────────────────────── */
const WATER_VERT = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float wave1 = sin(pos.x * 0.6 + uTime * 1.2) * 0.18;
    float wave2 = sin(pos.z * 0.4 + uTime * 0.9) * 0.14;
    float wave3 = sin((pos.x + pos.z) * 0.3 + uTime * 0.7) * 0.10;
    pos.y += wave1 + wave2 + wave3;
    vElevation = wave1 + wave2 + wave3;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const WATER_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    vec3 deepColor  = vec3(0.02, 0.15, 0.38);
    vec3 shallowColor = vec3(0.12, 0.52, 0.72);
    vec3 foamColor  = vec3(0.72, 0.88, 0.96);

    float t = clamp((vElevation + 0.35) / 0.7, 0.0, 1.0);
    vec3 color = mix(deepColor, shallowColor, t);

    // specular shimmer
    float shimmer = pow(max(0.0, sin(vUv.x * 40.0 + uTime * 2.5) * sin(vUv.y * 30.0 + uTime * 1.8)), 6.0);
    color += foamColor * shimmer * 0.35;

    // foam crests
    float foam = smoothstep(0.28, 0.38, vElevation);
    color = mix(color, foamColor, foam * 0.55);

    gl_FragColor = vec4(color, 0.93);
  }
`;

function Ocean() {
  const matRef = React.useRef<THREE.ShaderMaterial>(null);
  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime();
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[60, 60, 120, 120]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={WATER_VERT}
        fragmentShader={WATER_FRAG}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ── Animated boat ──────────────────────────────────────────────────── */
function Boat({
  src,
  position,
  scale,
  rotY,
  phaseOffset = 0,
  driftSpeed = 0.04,
}: {
  src: string;
  position: [number, number, number];
  scale: number;
  rotY: number;
  phaseOffset?: number;
  driftSpeed?: number;
}) {
  const { scene } = useGLTF(src);
  const ref = React.useRef<THREE.Group>(null);
  const cloned = React.useMemo(() => scene.clone(true), [scene]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() + phaseOffset;
    ref.current.position.y = position[1] + Math.sin(t * 0.9) * 0.12 + Math.sin(t * 0.55) * 0.07;
    ref.current.rotation.z = Math.sin(t * 0.7) * 0.04;
    ref.current.rotation.x = Math.sin(t * 0.5 + 1) * 0.03;
    ref.current.position.x = position[0] + Math.sin(t * driftSpeed) * 0.15;
  });

  return (
    <group ref={ref} position={position} rotation={[0, rotY, 0]} scale={scale}>
      <primitive object={cloned} castShadow />
    </group>
  );
}

/* ── Scene ──────────────────────────────────────────────────────────── */
function Scene() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4.5, 14]} fov={48} />
      <fog attach="fog" args={["#b8dff5", 20, 55]} />
      <color attach="background" args={["#b8dff5"]} />

      <ambientLight intensity={1.2} color="#e8f4ff" />
      <directionalLight
        position={[10, 18, 8]}
        intensity={3}
        color="#fff5e0"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-8, 6, -6]} intensity={0.6} color="#a0c8ff" />

      <Ocean />

      <Boat
        src="/models/low_poly_boat.glb"
        position={[-3.5, 0.18, 0]}
        scale={1.4}
        rotY={0.3}
        phaseOffset={0}
        driftSpeed={0.035}
      />
      <Boat
        src="/models/tow_boat.glb"
        position={[3.2, 0.15, 1.5]}
        scale={1.1}
        rotY={-0.4}
        phaseOffset={Math.PI * 0.6}
        driftSpeed={0.045}
      />

      <Environment preset="sunset" />
    </>
  );
}

/* ── Export ─────────────────────────────────────────────────────────── */
export function WaterScene({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Canvas shadows gl={{ antialias: true, alpha: false }}>
        <React.Suspense fallback={null}>
          <Scene />
        </React.Suspense>
      </Canvas>
    </div>
  );
}
