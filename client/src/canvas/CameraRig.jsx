import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { easing } from "maath";
import { useSnapshot } from "valtio";
import state from "../store";

const CameraRig = ({ children }) => {
  const group = useRef();
  const snap = useSnapshot(state);
  const { gl } = useThree();
  const rotationY = useRef(0);
  const spinVelocity = useRef(0);
  const isDragging = useRef(false);
  const lastClientX = useRef(0);

  useEffect(() => {
    const canvas = gl.domElement;

    const handlePointerDown = (event) => {
      if (snap.decalEditMode || state.isDecalDragging) return;
      isDragging.current = true;
      lastClientX.current = event.clientX;
      canvas.style.cursor = "grabbing";
      canvas.setPointerCapture?.(event.pointerId);
    };

    const handlePointerMove = (event) => {
      if (snap.decalEditMode) return;
      if (!isDragging.current) return;

      const deltaX = event.clientX - lastClientX.current;
      lastClientX.current = event.clientX;

      rotationY.current += deltaX * 0.0125;
      spinVelocity.current = deltaX * 0.0019;
    };

    const handlePointerUp = (event) => {
      isDragging.current = false;
      canvas.style.cursor = snap.decalEditMode ? "crosshair" : "grab";
      canvas.releasePointerCapture?.(event.pointerId);
    };

    if (snap.decalEditMode) {
      isDragging.current = false;
      spinVelocity.current = 0;
    }

    canvas.style.cursor = snap.decalEditMode ? "crosshair" : "grab";
    canvas.style.touchAction = "none";

    canvas.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      canvas.style.cursor = "";
      canvas.style.touchAction = "";
    };
  }, [gl, snap.decalEditMode]);

  useFrame((state, delta) => {
    const isBreakpoint = window.innerWidth <= 1260;
    const isMobile = window.innerWidth <= 600;

    // set the initial position of the model
    let targetPosition = [-0.35, 0.02, 2];
    if (snap.intro) {
      if (isBreakpoint) targetPosition = [0, 0, 2];
      if (isMobile) targetPosition = [0, 0.16, 2.58];
    } else {
      if (isMobile) targetPosition = [0, -0.14, 2.65];
      else targetPosition = [0, 0, 2.06];
    }

    // set model camera position
    easing.damp3(state.camera.position, targetPosition, 0.25, delta);

    if (!isDragging.current) {
      rotationY.current += spinVelocity.current;
      spinVelocity.current *= Math.pow(0.92, delta * 60);

      if (Math.abs(spinVelocity.current) < 0.00005) {
        spinVelocity.current = 0;
      }
    }

    const tiltX = snap.decalEditMode ? 0 : state.pointer.y / 12;

    // set the model rotation smoothly and preserve full 360 yaw rotation
    easing.dampE(
      group.current.rotation,
      [tiltX, rotationY.current, 0],
      0.25,
      delta
    );
  });

  return <group ref={group}>{children}</group>;
};

export default CameraRig;
