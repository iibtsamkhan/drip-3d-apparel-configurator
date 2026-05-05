import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import state, { resetDesignState } from "../store";
import { fadeAnimation, slideAnimation } from "../config/motion";
import CustomButton from "../components/CustomButton";
import { listSavedDesigns } from "../services/designs";

const dashboardStats = [
  { label: "3D Workflow", value: "Live" },
  { label: "AI Pipeline", value: "Ready" },
  { label: "Export Format", value: "PNG" },
];

const DashboardPage = () => {
  const navigate = useNavigate();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [savedDesigns, setSavedDesigns] = useState([]);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(true);
  const [designsError, setDesignsError] = useState("");

  useEffect(() => {
    state.intro = true;
    state.decalEditMode = false;
    state.isDecalDragging = false;
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return undefined;
    }

    let cancelled = false;

    const loadDesigns = async () => {
      try {
        setIsLoadingDesigns(true);
        setDesignsError("");
        const payload = await listSavedDesigns(getToken);
        if (cancelled) return;
        setSavedDesigns(Array.isArray(payload?.designs) ? payload.designs : []);
        setDesignsError("");
      } catch (error) {
        if (cancelled) return;
        const rawMessage = String(error?.message || "");
        if (/missing session token/i.test(rawMessage)) {
          setDesignsError("");
          setSavedDesigns([]);
          return;
        }
        setDesignsError(
          rawMessage || "Saved designs could not be loaded right now."
        );
      } finally {
        if (!cancelled) {
          setIsLoadingDesigns(false);
        }
      }
    };

    loadDesigns();

    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn]);

  const savedDesignsMessage = (() => {
    if (!isLoaded) {
      return "Loading your workspace...";
    }
    if (isLoadingDesigns) {
      return "Loading your recent saved designs...";
    }
    if (designsError) {
      if (/failed to fetch|networkerror|load failed/i.test(designsError)) {
        return "No saved designs yet. Your first saved design will appear here after you save it.";
      }
      return "Saved designs are not available right now. Your first saved design will appear here after you save it.";
    }
    return "No saved designs yet. Your first saved design will appear here after you save it.";
  })();

  return (
    <section className="dashboard-page">
      <motion.div className="dashboard-hero" {...slideAnimation("up")}>
        <div className="dashboard-hero-copy">
          <p className="section-caption">Authenticated Workspace</p>
          <h1 className="dashboard-title">
            Welcome back, {user?.firstName || "Creator"}.
          </h1>
          <p className="dashboard-subtitle">
            Launch the 3D customizer, generate AI artwork, and keep the studio
            ready for saved projects and future SaaS features.
          </p>
        </div>
        <div className="dashboard-hero-actions">
          <CustomButton
            type="filled"
            title="Start New Design"
            handleClick={() => {
              resetDesignState();
              navigate("/app/customizer");
            }}
            customStyles="px-6 py-3.5 text-sm font-semibold tracking-[0.08em]"
            styleOverrides={{
              background:
                "linear-gradient(132deg, #264eb3 0%, #3569dd 46%, #5b8df6 100%)",
              borderColor: "rgba(199, 221, 255, 0.68)",
              color: "#f4f8ff",
            }}
          />
          <CustomButton
            type="outline"
            title="Resume Studio"
            handleClick={() => navigate("/app/customizer")}
            customStyles="px-6 py-3.5 text-sm font-semibold tracking-[0.08em]"
            styleOverrides={{
              color: "#d9eaff",
              borderColor: "rgba(147, 189, 255, 0.42)",
              backgroundColor: "rgba(10, 23, 46, 0.68)",
            }}
          />
        </div>
      </motion.div>

      <motion.div className="dashboard-grid" {...fadeAnimation}>
        <article className="dashboard-card dashboard-card-wide">
          <p className="dashboard-card-label">Studio Status</p>
          <div className="dashboard-stat-row">
            {dashboardStats.map((item) => (
              <div key={item.label} className="dashboard-stat-pill">
                <span className="dashboard-stat-value">{item.value}</span>
                <span className="dashboard-stat-label">{item.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-card">
          <p className="dashboard-card-label">Next Action</p>
          <h2 className="dashboard-card-title">Open the protected customizer</h2>
          <p className="dashboard-card-copy">
            The full 3D studio, upload tools, AI design workflow, and export
            controls are only available after authentication.
          </p>
        </article>

        <article className="dashboard-card">
          <p className="dashboard-card-label">Recent Designs</p>
          <h2 className="dashboard-card-title">Saved work</h2>
          {(!isLoaded || isLoadingDesigns || designsError || savedDesigns.length === 0) && (
            <p
              className={`dashboard-card-copy ${
                designsError && !/failed to fetch|networkerror|load failed/i.test(designsError)
                  ? "is-error"
                  : ""
              }`}>
              {savedDesignsMessage}
            </p>
          )}
          {!isLoadingDesigns && savedDesigns.length > 0 && (
            <div className="saved-designs-list">
              {savedDesigns.map((design) => (
                <button
                  key={design._id}
                  type="button"
                  className="saved-design-card"
                  onClick={() => navigate(`/app/customizer?design=${design._id}`)}>
                  <div className="saved-design-preview">
                    {design.previewImage ? (
                      <img src={design.previewImage} alt={design.name} />
                    ) : (
                      <span>Preview</span>
                    )}
                  </div>
                  <div className="saved-design-copy">
                    <span className="saved-design-name">{design.name}</span>
                    <span className="saved-design-date">
                      {new Date(design.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </article>
      </motion.div>
    </section>
  );
};

export default DashboardPage;
