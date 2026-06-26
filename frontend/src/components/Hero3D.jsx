// Hero3D.jsx
// ----------
// A lightweight animated 3D scene for the landing hero, built with
// react-three-fiber (a React renderer for Three.js) + drei helpers.
//
// What's on screen:
//   * A big "distorted" icosahedron that gently morphs and rotates (the
//     centerpiece) with a glossy gradient-like material.
//   * A few small floating spheres orbiting around it for depth.
//   * Soft lighting + a contact-shadow-free, transparent background so it
//     blends into the page.
//
// It's wrapped so it degrades gracefully: if WebGL isn't available the
// <Canvas> simply renders nothing instead of crashing the page.

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, OrbitControls } from "@react-three/drei";
import { Suspense, useRef } from "react";

// The morphing centerpiece. useFrame runs every animation frame so we can
// slowly spin it.
function Blob() {
  const mesh = useRef();
  useFrame((_, delta) => {
    if (mesh.current) {
      mesh.current.rotation.x += delta * 0.15;
      mesh.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <Float speed={1.4} rotationIntensity={0.6} floatIntensity={1.2}>
      <mesh ref={mesh} scale={1.6}>
        {/* An icosahedron with extra detail so the distortion looks smooth. */}
        <icosahedronGeometry args={[1, 12]} />
        <MeshDistortMaterial
          color="#6366f1"      // brand indigo
          distort={0.4}        // how much it wobbles
          speed={2}            // wobble speed
          roughness={0.15}
          metalness={0.6}
        />
      </mesh>
    </Float>
  );
}

// A small accent sphere placed at a fixed position; Float makes it bob.
function Accent({ position, color, scale = 0.35 }) {
  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh position={position} scale={scale}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          metalness={0.4}
        />
      </mesh>
    </Float>
  );
}

export default function Hero3D() {
  return (
    <Canvas
      // Transparent so the page background shows through.
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0, 6], fov: 45 }}
      // dpr capped to 2 keeps it crisp without hammering low-end devices.
      dpr={[1, 2]}
      style={{ width: "100%", height: "100%" }}
    >
      <Suspense fallback={null}>
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <pointLight position={[-5, -3, 2]} intensity={0.8} color="#a855f7" />

        <Blob />
        <Accent position={[2.6, 1.4, -1]} color="#22c55e" scale={0.4} />
        <Accent position={[-2.7, -1.2, -1]} color="#f59e0b" scale={0.3} />
        <Accent position={[2.2, -1.6, 0]} color="#ec4899" scale={0.25} />

        {/* Let users gently spin it with the mouse, but no zoom/pan so the
            page scroll still works on mobile. autoRotate adds life. */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.8}
        />
      </Suspense>
    </Canvas>
  );
}
