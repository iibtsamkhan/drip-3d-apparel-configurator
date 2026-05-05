import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useSearchParams } from "react-router-dom";
import Canvas from "../canvas";
import Customizer from "./Customizer";
import state, { applyDesignState } from "../store";
import { getSavedDesign } from "../services/designs";

const StudioPage = () => {
  const { getToken } = useAuth();
  const [searchParams] = useSearchParams();
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    state.intro = false;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const designId = searchParams.get("design");

    const loadSavedDesign = async () => {
      if (!designId) {
        setLoadError("");
        return;
      }

      try {
        const payload = await getSavedDesign(designId, getToken);
        if (cancelled) return;
        applyDesignState(payload?.design?.designState || {});
        state.intro = false;
        setLoadError("");
      } catch (error) {
        if (cancelled) return;
        setLoadError(error?.message || "Could not load saved design.");
      }
    };

    loadSavedDesign();

    return () => {
      cancelled = true;
    };
  }, [getToken, searchParams]);

  return (
    <div className="studio-page">
      <Canvas />
      <Customizer />
      {loadError && <div className="studio-inline-error">{loadError}</div>}
    </div>
  );
};

export default StudioPage;
