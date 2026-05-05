import { useEffect } from "react";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  headContainerAnimation,
  headContentAnimation,
  headTextAnimation,
  slideAnimation,
} from "../config/motion.js";
import CustomButton from "./../components/CustomButton";
import Drip3DLogo from "../components/Drip3DLogo";
import state from "../store";

const featurePills = [
  { label: "Studio-grade Materials", value: "PBR-ready" },
  { label: "Interactive Workflow", value: "Realtime" },
  { label: "Export Pipeline", value: "1-click PNG" },
];

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    state.intro = true;
    state.decalEditMode = false;
    state.isDecalDragging = false;
  }, []);

  return (
    <motion.section className="home" {...slideAnimation("left")}>
      <motion.header className="home-topbar" {...slideAnimation("down")}>
        <div className="logo-shell">
          <Drip3DLogo className="home-logo-img" />
        </div>
        <div className="home-topbar-meta">
          <span className="home-badge">Realtime 3D Studio</span>
          <p className="home-topbar-note">Premium 3D apparel configurator</p>
        </div>
      </motion.header>

      <motion.div className="home-content" {...headContainerAnimation}>
        <motion.div {...headTextAnimation}>
          <p className="section-caption">Design Without Limits</p>
          <h1 className="head-text drip-blue-text">DRIP WITH</h1>
          <h1 className="head-text">THE SAUCE.</h1>
        </motion.div>
        <motion.div {...headContentAnimation} className="flex flex-col gap-6">
          <p className="hero-subtext">
            Build premium streetwear concepts in seconds with rich materials,
            instant color updates, layered decals, and protected studio access.{" "}
            <strong className="drip-blue-text">Your vision, fully interactive.</strong>
          </p>
          <div className="feature-grid">
            {featurePills.map((feature) => (
              <article key={feature.label} className="feature-chip">
                <p className="feature-value">{feature.value}</p>
                <p className="feature-label">{feature.label}</p>
              </article>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <SignedOut>
              <CustomButton
                type="filled"
                title="Get Started"
                handleClick={() => navigate("/sign-up")}
                customStyles="home-primary-cta w-fit px-7 py-3.5 text-sm font-semibold tracking-[0.08em]"
                styleOverrides={{
                  background:
                    "linear-gradient(132deg, #264eb3 0%, #3569dd 46%, #5b8df6 100%)",
                  borderColor: "rgba(199, 221, 255, 0.68)",
                  color: "#f4f8ff",
                  boxShadow:
                    "0 18px 36px rgba(24, 69, 176, 0.46), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                }}
              />
              <CustomButton
                type="outline"
                title="Sign In"
                handleClick={() => navigate("/sign-in")}
                customStyles="w-fit px-6 py-3.5 text-sm font-semibold tracking-[0.08em]"
                styleOverrides={{
                  color: "#e4efff",
                  borderColor: "rgba(173, 214, 255, 0.36)",
                  backgroundColor: "rgba(9, 22, 47, 0.62)",
                }}
              />
            </SignedOut>
            <SignedIn>
              <CustomButton
                type="filled"
                title="Open Dashboard"
                handleClick={() => navigate("/app")}
                customStyles="home-primary-cta w-fit px-7 py-3.5 text-sm font-semibold tracking-[0.08em]"
                styleOverrides={{
                  background:
                    "linear-gradient(132deg, #264eb3 0%, #3569dd 46%, #5b8df6 100%)",
                  borderColor: "rgba(199, 221, 255, 0.68)",
                  color: "#f4f8ff",
                }}
              />
            </SignedIn>
            <p className="floating-hint">
              Built for fashion drops, mockups, and concept reviews.
            </p>
          </div>
          <p className="hero-footnote">No design software required.</p>
        </motion.div>
      </motion.div>
    </motion.section>
  );
};

export default Home;
