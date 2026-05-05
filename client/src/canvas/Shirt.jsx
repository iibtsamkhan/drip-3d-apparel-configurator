import { easing } from "maath";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useSnapshot } from "valtio";
import { useFrame } from "@react-three/fiber";
import { Decal, useGLTF } from "@react-three/drei";

import state from "../store";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const configureTexture = (texture) => {
  if (!texture) return;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
};

const useManagedTexture = (source) => {
  const [texture, setTexture] = useState(null);
  const textureRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    if (!source) {
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
      setTexture(null);
      return () => {
        cancelled = true;
      };
    }

    const loader = new THREE.TextureLoader();
    loader.load(
      source,
      (nextTexture) => {
        if (cancelled) {
          nextTexture.dispose();
          return;
        }

        configureTexture(nextTexture);
        setTexture((previousTexture) => {
          if (previousTexture && previousTexture !== nextTexture) {
            previousTexture.dispose();
          }
          textureRef.current = nextTexture;
          return nextTexture;
        });
      },
      undefined,
      () => {
        if (!cancelled) {
          setTexture((previousTexture) => {
            if (previousTexture) {
              previousTexture.dispose();
            }
            return null;
          });
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [source]);

  useEffect(
    () => () => {
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
    },
    []
  );

  return texture;
};

const mapUvToDecalPosition = (uv) => {
  const mappedX = clamp((uv.x - 0.5) * 0.72, -0.24, 0.24);
  const mappedY = clamp((uv.y - 0.5) * 0.95 + 0.02, -0.26, 0.32);
  return [mappedX, mappedY, 0.15];
};

const Shirt = ({ renderMode = "high" }) => {
  const snap = useSnapshot(state);
  const isDraggingDecal = useRef(false);
  const { nodes, materials } = useGLTF("/shirt_baked.glb");
  const isHighQuality = renderMode === "high";

  const logoTexture = useManagedTexture(snap.logoDecal);
  const fullTexture = useManagedTexture(snap.fullDecal);
  const safeMaterial = useMemo(
    () =>
      new THREE.MeshLambertMaterial({
        color: new THREE.Color(snap.color),
      }),
    []
  );

  useEffect(
    () => () => {
      safeMaterial.dispose();
    },
    [safeMaterial]
  );

  const shirtMaterial =
    isHighQuality && materials?.lambert1 ? materials.lambert1 : safeMaterial;

  useFrame((state, delta) =>
    easing.dampC(shirtMaterial.color, snap.color, 0.25, delta)
  );

  const beginDecalDrag = (event) => {
    if (!snap.decalEditMode || !snap.isLogoTexture) return;
    event.stopPropagation();
    isDraggingDecal.current = true;
    state.isDecalDragging = true;
    event.target.setPointerCapture?.(event.pointerId);

    if (event.uv) {
      state.decalPosition = mapUvToDecalPosition(event.uv);
    }
  };

  const moveDecalDrag = (event) => {
    if (!isDraggingDecal.current || !snap.decalEditMode || !snap.isLogoTexture) return;
    event.stopPropagation();

    if (event.uv) {
      state.decalPosition = mapUvToDecalPosition(event.uv);
    }
  };

  const endDecalDrag = (event) => {
    if (!isDraggingDecal.current) return;
    event.stopPropagation();
    isDraggingDecal.current = false;
    state.isDecalDragging = false;
    event.target.releasePointerCapture?.(event.pointerId);
  };

  return (
    <group>
      <mesh
        castShadow={isHighQuality}
        receiveShadow={isHighQuality}
        geometry={nodes.T_Shirt_male.geometry}
        material={shirtMaterial}
        onPointerDown={beginDecalDrag}
        onPointerMove={moveDecalDrag}
        onPointerUp={endDecalDrag}
        onPointerOut={endDecalDrag}
        dispose={null}>
        {snap.isFullTexture && fullTexture && (
          <Decal
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            scale={1}
            map={fullTexture}
            polygonOffset
            polygonOffsetFactor={-1}
            depthTest
            depthWrite={false}
          />
        )}
        {snap.isLogoTexture && logoTexture && (
          <Decal
            position={snap.decalPosition}
            rotation={[0, 0, snap.decalRotation]}
            scale={snap.decalScale}
            map={logoTexture}
            polygonOffset
            polygonOffsetFactor={-2}
            depthTest
            depthWrite={false}
          />
        )}
      </mesh>
    </group>
  );
};

export default Shirt;
