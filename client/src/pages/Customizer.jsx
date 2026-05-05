import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { AnimatePresence, motion } from "framer-motion";
import { useSnapshot } from "valtio";
import { useNavigate } from "react-router-dom";

import state, { defaultDesignState } from "../store";
import { download } from "../assets";
import {
  downloadCanvasToImage,
  getCanvasImageDataUrl,
  getCanvasPreviewDataUrl,
  reader,
  sourceToDataUrl,
} from "../config/helpers";
import { EditorTabs, FilterTabs, DecalTypes } from "./../config/constants";
import { fadeAnimation, slideAnimation } from "../config/motion";
import { saveDesign } from "../services/designs";

import {
  AIPicker,
  ColorPicker,
  CustomButton,
  FilePicker,
  Tab,
} from "../components";

const DEFAULT_DECAL = "./sample.png";
const DEFAULT_DECAL_POSITION = [0, 0.04, 0.15];
const DEFAULT_DECAL_SCALE = 0.15;
const DEFAULT_DECAL_ROTATION = 0;
const isBlobUrl = (value) => typeof value === "string" && value.startsWith("blob:");
const serializeDecalSource = async (source) => {
  try {
    return await sourceToDataUrl(source);
  } catch {
    return typeof source === "string" ? source : "";
  }
};

const Customizer = () => {
  const navigate = useNavigate();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const snap = useSnapshot(state);
  const downloadResetTimer = useRef(null);
  const managedAIBlobUrls = useRef(new Set());

  const [file, setFile] = useState("");
  const [activeEditorTab, setActiveEditorTab] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState({
    logoShirt: true,
    stylishShirt: false,
  });
  const [downloadState, setDownloadState] = useState("idle");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({
    type: "info",
    text: "Pick a tool and start shaping your design.",
  });
  const isToolDrawerOpen = Boolean(activeEditorTab);

  const activeTool =
    EditorTabs.find((tab) => tab.name === activeEditorTab)?.label ?? "None";

  const releaseUnreferencedAIBlobUrls = (
    nextLogoDecal = state.logoDecal,
    nextFullDecal = state.fullDecal
  ) => {
    const activeUrls = new Set([nextLogoDecal, nextFullDecal]);
    managedAIBlobUrls.current.forEach((url) => {
      if (!activeUrls.has(url)) {
        URL.revokeObjectURL(url);
        managedAIBlobUrls.current.delete(url);
      }
    });
  };

  useEffect(() => {
    state.intro = false;
    return () => {
      if (downloadResetTimer.current) {
        clearTimeout(downloadResetTimer.current);
      }
      managedAIBlobUrls.current.forEach((url) => URL.revokeObjectURL(url));
      managedAIBlobUrls.current.clear();
    };
  }, []);

  const generateDrawerContent = () => {
    switch (activeEditorTab) {
      case "aipicker":
        return (
          <AIPicker
            onApplyDesign={handleApplyAIDesign}
            onStatusChange={setStatus}
          />
        );
      case "colorpicker":
        return <ColorPicker />;
      case "filepicker":
        return <FilePicker file={file} setFile={setFile} readFile={readFile} />;
      default:
        return null;
    }
  };

  const handleDecals = (type, result) => {
    const decalType = DecalTypes[type];
    state[decalType.stateProperty] = result;
    if (!activeFilterTab[decalType.filterTab]) {
      handleActiveFilterTab(decalType.filterTab);
    }
    releaseUnreferencedAIBlobUrls(state.logoDecal, state.fullDecal);
  };

  const handleActiveFilterTab = (tabName) => {
    switch (tabName) {
      case "logoShirt":
        state.isLogoTexture = !activeFilterTab[tabName];
        break;
      case "stylishShirt":
        if (
          !activeFilterTab[tabName] &&
          state.fullDecal === DEFAULT_DECAL &&
          state.logoDecal !== DEFAULT_DECAL
        ) {
          state.fullDecal = state.logoDecal;
          setStatus({
            type: "info",
            text: "Full Print is now using your uploaded logo. Upload a full texture anytime to replace it.",
          });
        }

        state.isFullTexture = !activeFilterTab[tabName];
        break;
      default:
        state.isLogoTexture = true;
        state.isFullTexture = false;
        break;
    }

    setActiveFilterTab((prevState) => ({
      ...prevState,
      [tabName]: !prevState[tabName],
    }));
    releaseUnreferencedAIBlobUrls(state.logoDecal, state.fullDecal);
  };

  const readFile = (type) => {
    if (!file) {
      setStatus({
        type: "error",
        text: "Select an image first, then choose where to apply it.",
      });
      return;
    }

    reader(file).then((result) => {
      handleDecals(type, result);
      setActiveEditorTab("");
      setStatus({
        type: "success",
        text: `${type === "logo" ? "Logo" : "Full print"} artwork applied.`,
      });
    });
  };

  const handleApplyAIDesign = (finalDesignUrl) => {
    if (isBlobUrl(finalDesignUrl)) {
      managedAIBlobUrls.current.add(finalDesignUrl);
    }
    handleDecals("logo", finalDesignUrl);
    releaseUnreferencedAIBlobUrls(state.logoDecal, state.fullDecal);
    state.decalEditMode = true;
    setStatus({
      type: "success",
      text: "Design applied to shirt. Drag it on the model and fine-tune size/rotation below.",
    });
  };

  const resetDecalTransform = () => {
    state.decalPosition = [...DEFAULT_DECAL_POSITION];
    state.decalScale = DEFAULT_DECAL_SCALE;
    state.decalRotation = DEFAULT_DECAL_ROTATION;
    state.decalEditMode = false;
    state.isDecalDragging = false;
    setStatus({
      type: "info",
      text: "Decal transform reset.",
    });
  };

  const handleDownload = () => {
    const exported = downloadCanvasToImage();
    if (!exported) {
      setStatus({
        type: "error",
        text: "Could not export image right now. Restart 3D view and try again.",
      });
      return;
    }

    setDownloadState("done");
    setStatus({
      type: "success",
      text: "Design exported as a PNG.",
    });

    if (downloadResetTimer.current) {
      clearTimeout(downloadResetTimer.current);
    }

    downloadResetTimer.current = setTimeout(() => {
      setDownloadState("idle");
    }, 1800);
  };

  const buildDesignPayload = async () => {
    const serializedLogoDecal = await serializeDecalSource(snap.logoDecal);
    const serializedFullDecal = await serializeDecalSource(snap.fullDecal);
    const previewImage =
      getCanvasPreviewDataUrl() || getCanvasImageDataUrl();
    const timestamp = new Date();
    const designName = `Design ${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;

    return {
      name: designName,
      previewImage,
      designState: {
        ...defaultDesignState,
        color: snap.color,
        isLogoTexture: snap.isLogoTexture,
        isFullTexture: snap.isFullTexture,
        logoDecal: serializedLogoDecal,
        fullDecal: serializedFullDecal,
        decalPosition: [...snap.decalPosition],
        decalScale: snap.decalScale,
        decalRotation: snap.decalRotation,
      },
    };
  };

  const handleSaveDesign = async () => {
    try {
      if (!isLoaded || !isSignedIn) {
        throw new Error("Your session is still loading. Wait a moment and try again.");
      }

      setIsSaving(true);
      setStatus({
        type: "info",
        text: "Saving design to your account...",
      });

      const payload = await buildDesignPayload();
      await saveDesign(payload, getToken);

      setStatus({
        type: "success",
        text: "Design saved. It is now available from your dashboard.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        text: error?.message || "Could not save design right now.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <>
        <motion.div
          key="custom"
          className="absolute inset-0 z-10"
          {...slideAnimation("left")}>
          <div className="customizer-layout">
            <div className="editor-panel">
              <div className="editor-panel-header">
                <p className="panel-title">Design Controls</p>
                <p className="panel-subtitle">
                  Work inside a focused control card with fixed sections instead of one long stack.
                </p>
                <p className="panel-gesture-note">
                  Rotate the shirt freely. Enable Decal Edit only when you want to move the artwork.
                </p>
              </div>

              <div className="editortabs-container tabs">
                {EditorTabs.map((tab) => (
                  <Tab
                    key={tab.name}
                    tab={tab}
                    isEditorActive={activeEditorTab === tab.name}
                    handleClick={() =>
                      setActiveEditorTab((prevTab) =>
                        prevTab === tab.name ? "" : tab.name
                      )
                    }
                  />
                ))}
              </div>

              <div className="editor-panel-body">
                <div className="editor-tool-empty">
                  <p className="editor-tool-empty-title">Pick a tool to start</p>
                  <p className="editor-tool-empty-copy">
                    All editor tools now open in a dedicated side drawer so nothing gets crushed
                    inside the main control card. Use the left panel for studio settings and the
                    right drawer for AI, upload, and color workflows.
                  </p>
                  <div className="editor-tool-empty-grid">
                    <div className="editor-tool-empty-card">
                      <span className="editor-tool-empty-label">Active Tool</span>
                      <span className="editor-tool-empty-value">{activeTool}</span>
                    </div>
                    <div className="editor-tool-empty-card">
                      <span className="editor-tool-empty-label">Logo Layer</span>
                      <span className="editor-tool-empty-value">
                        {snap.isLogoTexture ? "Enabled" : "Hidden"}
                      </span>
                    </div>
                    <div className="editor-tool-empty-card">
                      <span className="editor-tool-empty-label">Full Print</span>
                      <span className="editor-tool-empty-value">
                        {snap.isFullTexture ? "Enabled" : "Hidden"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="session-panel">
                <div className="session-overview">
                  <p className="session-title">Studio Status</p>
                  <div className="session-stat-grid">
                    <div className="session-stat-card">
                      <span className="session-key">Tool</span>
                      <span className="session-value">{activeTool}</span>
                    </div>
                    <div className="session-stat-card">
                      <span className="session-key">Logo</span>
                      <span className={`session-value ${snap.isLogoTexture ? "is-on" : "is-off"}`}>
                        {snap.isLogoTexture ? "On" : "Off"}
                      </span>
                    </div>
                    <div className="session-stat-card">
                      <span className="session-key">Full Print</span>
                      <span className={`session-value ${snap.isFullTexture ? "is-on" : "is-off"}`}>
                        {snap.isFullTexture ? "On" : "Off"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="decal-controls">
                  <div className="session-row">
                    <span className="session-key">Decal Edit</span>
                    <button
                      type="button"
                      className={`mini-toggle ${snap.decalEditMode ? "is-on" : ""}`}
                      onClick={() => {
                        state.decalEditMode = !snap.decalEditMode;
                        state.isDecalDragging = false;
                      }}>
                      {snap.decalEditMode ? "On" : "Off"}
                    </button>
                  </div>
                  <p className="decal-help">
                    Turn this on to drag the chest artwork directly on the shirt.
                  </p>

                  <label className="decal-control">
                    <span>Size</span>
                    <input
                      type="range"
                      min="0.06"
                      max="0.45"
                      step="0.005"
                      value={snap.decalScale}
                      onChange={(event) => {
                        state.decalScale = Number(event.target.value);
                      }}
                    />
                  </label>

                  <label className="decal-control">
                    <span>
                      Rotation {Math.round((snap.decalRotation * 180) / Math.PI)} deg
                    </span>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={Math.round((snap.decalRotation * 180) / Math.PI)}
                      onChange={(event) => {
                        state.decalRotation =
                          (Number(event.target.value) * Math.PI) / 180;
                      }}
                    />
                  </label>

                  <CustomButton
                    type="outline"
                    title="Reset Transform"
                    handleClick={resetDecalTransform}
                    customStyles="w-full mt-2 text-[10px] uppercase tracking-[0.12em]"
                    styleOverrides={{
                      color: "#d9e8ff",
                      borderColor: "rgba(166, 205, 255, 0.44)",
                      backgroundColor: "rgba(11, 28, 59, 0.32)",
                    }}
                  />
                </div>
                <p className={`session-notice ${status.type}`}>{status.text}</p>
              </div>
            </div>

            <AnimatePresence>
              {isToolDrawerOpen && (
                <motion.aside
                  className="ai-studio-drawer"
                  initial={{ opacity: 0, x: 36 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}>
                  <div className="ai-studio-drawer-shell">
                    <div className="ai-studio-drawer-topbar">
                      <div>
                        <p className="ai-studio-drawer-label">Focused Workspace</p>
                        <h2 className="ai-studio-drawer-title">{activeTool}</h2>
                      </div>
                      <button
                        type="button"
                        className="ai-studio-drawer-close"
                        onClick={() => setActiveEditorTab("")}
                        aria-label="Close AI Studio drawer">
                        Close
                      </button>
                    </div>
                    {generateDrawerContent()}
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div className="top-actions" {...fadeAnimation}>
          <div className="color-chip">
            <span
              className="color-chip-preview"
              style={{ backgroundColor: snap.color }}
            />
            <div className="leading-tight">
              <p className="text-[0.65rem] uppercase tracking-[0.22em] text-slate-300/70">
                Active Color
              </p>
              <p className="text-xs font-semibold text-slate-100">{snap.color}</p>
            </div>
          </div>
          <CustomButton
            type="filled"
            title={isSaving ? "Saving..." : "Save Design"}
            handleClick={handleSaveDesign}
            customStyles="w-fit px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em]"
            isDisabled={isSaving || !isLoaded || !isSignedIn}
            styleOverrides={{
              background:
                "linear-gradient(135deg, rgba(27, 76, 160, 0.96) 0%, rgba(44, 121, 225, 0.92) 52%, rgba(96, 86, 237, 0.92) 100%)",
              borderColor: "rgba(180, 214, 255, 0.62)",
              color: "#f5fbff",
            }}
          />
          <CustomButton
            type="outline"
            title="Back To Dashboard"
            handleClick={() => {
              setActiveEditorTab("");
              setDownloadState("idle");
              state.decalEditMode = false;
              state.isDecalDragging = false;
              setStatus({
                type: "info",
                text: "Pick a tool and start shaping your design.",
              });
              state.intro = true;
              navigate("/app");
            }}
            customStyles="w-fit px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em]"
            styleOverrides={{
              color: "#E7F1FF",
              borderColor: "rgba(170, 203, 255, 0.45)",
              backgroundColor: "rgba(10, 19, 35, 0.78)",
            }}
          />
        </motion.div>

        <div className="filtertabs-positioner">
          <motion.div
            className="filtertabs-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}>
            <p className="dock-label">Render Mode</p>
            <div className="filtertabs-row">
              {FilterTabs.map((tab) => (
                <Tab
                  key={tab.name}
                  tab={tab}
                  isFilterTab
                  isActiveTab={activeFilterTab[tab.name]}
                  handleClick={() => handleActiveFilterTab(tab.name)}
                />
              ))}
              <button
                className="download-btn"
                onClick={handleDownload}
                aria-label="Download current design preview">
                <img
                  src={download}
                  alt="download_image"
                  className="w-3/5 h-3/5 object-contain"
                />
              </button>
            </div>
          </motion.div>
        </div>

        {downloadState === "done" && (
          <motion.div
            className="download-toast"
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.24, ease: "easeOut" }}>
            Design exported
          </motion.div>
        )}
      </>
    </AnimatePresence>
  );
};

export default Customizer;
