import { useMemo } from "react";
import * as THREE from "three";
import { ContactShadows } from "@react-three/drei";

const Backdrop = ({ renderMode = "high" }) => {
  const isHighQuality = renderMode === "high";
  const shadowTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    const gradient = ctx.createRadialGradient(256, 256, 48, 256, 256, 256);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.5)");
    gradient.addColorStop(0.45, "rgba(0, 0, 0, 0.26)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, []);

  if (isHighQuality) {
    return (
      <ContactShadows
        position={[0, -0.8, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        opacity={0.42}
        width={6}
        height={6}
        blur={2.2}
        far={2.1}
        resolution={512}
        frames={1}
      />
    );
  }

  return (
    <mesh
      position={[0, -0.8, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={-1}>
      <circleGeometry args={[2.45, 64]} />
      <meshBasicMaterial
        map={shadowTexture || null}
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </mesh>
  );
};

export default Backdrop;
