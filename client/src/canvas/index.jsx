import { useCallback, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Center, Environment } from "@react-three/drei";

import Shirt from "./Shirt";
import Backdrop from "./Backdrop";
import CameraRig from "./CameraRig";

const CanvasHealthWatcher = ({ onContextLost, onContextRestored }) => {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;

    const handleContextLost = (event) => {
      event.preventDefault();
      onContextLost?.();
    };

    const handleContextRestored = () => {
      onContextRestored?.();
    };

    canvas.addEventListener("webglcontextlost", handleContextLost, false);
    canvas.addEventListener("webglcontextrestored", handleContextRestored, false);

    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost, false);
      canvas.removeEventListener(
        "webglcontextrestored",
        handleContextRestored,
        false
      );
    };
  }, [gl, onContextLost, onContextRestored]);

  return null;
};

const CanvasModel = () => {
  const [canvasVersion, setCanvasVersion] = useState(0);
  const [renderMode, setRenderMode] = useState("high");
  const [canvasIssue, setCanvasIssue] = useState("");
  const isHighQuality = renderMode === "high";

  const remountCanvas = useCallback(() => {
    setCanvasVersion((previous) => previous + 1);
  }, []);

  const switchToSafeMode = useCallback((reason) => {
    setCanvasIssue(reason);
    setRenderMode("safe");
    setCanvasVersion((previous) => previous + 1);
  }, []);

  const handleContextLost = useCallback(() => {
    if (isHighQuality) {
      switchToSafeMode(
        "High-quality rendering is unstable on this device. Switched to Safe Mode automatically."
      );
      return;
    }

    setCanvasIssue(
      "WebGL context was lost again in Safe Mode. Restart the 3D view to continue."
    );
    remountCanvas();
  }, [isHighQuality, remountCanvas, switchToSafeMode]);

  const handleContextRestored = useCallback(() => {
    setCanvasIssue("");
  }, []);

  useEffect(() => {
    const handleWindowError = (event) => {
      const message = String(event?.message || "");
      if (
        isHighQuality &&
        /failed to link vertex and fragment shaders|shader|webglprogram/i.test(
          message
        )
      ) {
        switchToSafeMode(
          "Shader linking failed in High Quality mode. Switched to Safe Mode automatically."
        );
      }
    };

    window.addEventListener("error", handleWindowError);
    return () => window.removeEventListener("error", handleWindowError);
  }, [isHighQuality, switchToSafeMode]);

  const resetCanvas = useCallback(() => {
    setCanvasIssue("");
    remountCanvas();
  }, [remountCanvas]);

  const tryHighQuality = useCallback(() => {
    setCanvasIssue("");
    setRenderMode("high");
    remountCanvas();
  }, [remountCanvas]);

  return (
    <div className="canvas-shell">
      {canvasIssue && (
        <div className="canvas-status-overlay" role="status" aria-live="polite">
          <p className="canvas-status-title">3D Renderer Recovered</p>
          <p className="canvas-status-copy">{canvasIssue}</p>
          <div className="canvas-status-actions">
            <button
              type="button"
              className="canvas-status-btn"
              onClick={resetCanvas}>
              Restart 3D View
            </button>
            {renderMode === "safe" && (
              <button
                type="button"
                className="canvas-status-btn canvas-status-btn-alt"
                onClick={tryHighQuality}>
                Try High Quality
              </button>
            )}
          </div>
        </div>
      )}

      <Canvas
        key={canvasVersion}
        camera={{ position: [0, 0, 0], fov: 25 }}
        shadows={isHighQuality}
        dpr={isHighQuality ? [1, 1.75] : [1, 1.2]}
        gl={{
          preserveDrawingBuffer: true,
          antialias: isHighQuality,
          alpha: true,
          powerPreference: "high-performance",
          precision: isHighQuality ? "highp" : "mediump",
          stencil: isHighQuality,
          failIfMajorPerformanceCaveat: !isHighQuality,
        }}
        fallback={
          <div className="canvas-status-overlay">
            <p className="canvas-status-title">WebGL Not Available</p>
            <p className="canvas-status-copy">
              This device/browser cannot initialize 3D rendering.
            </p>
          </div>
        }
        onCreated={({ gl }) => {
          gl.setPixelRatio(
            Math.min(window.devicePixelRatio || 1, isHighQuality ? 1.75 : 1.2)
          );
        }}
        className="w-full max-w-full h-full transition-all ease-in">
        <CanvasHealthWatcher
          onContextLost={handleContextLost}
          onContextRestored={handleContextRestored}
        />
        <ambientLight intensity={isHighQuality ? 0.5 : 0.62} />
        <hemisphereLight intensity={0.4} color="#d9e7ff" groundColor="#0d1424" />
        <directionalLight
          castShadow={isHighQuality}
          intensity={isHighQuality ? 0.82 : 0.55}
          position={[3, 3, 2]}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0002}
          shadow-normalBias={0.02}
        />
        {isHighQuality && <Environment preset="city" />}
        <Backdrop renderMode={renderMode} />
        <CameraRig>
          <Center>
            <Shirt renderMode={renderMode} />
          </Center>
        </CameraRig>
      </Canvas>
    </div>
  );
};
export default CanvasModel;
