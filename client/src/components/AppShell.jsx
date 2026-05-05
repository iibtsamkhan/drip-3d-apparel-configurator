import { UserButton, useUser } from "@clerk/clerk-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import CustomButton from "./CustomButton";
import { clerkAppearance } from "../config/clerk";
import Drip3DLogo from "./Drip3DLogo";

const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const isCustomizerRoute = location.pathname.startsWith("/app/customizer");
  const displayName = user?.fullName || user?.firstName || user?.username || "Creator";
  const emailAddress =
    user?.primaryEmailAddress?.emailAddress || "Authenticated workspace";

  return (
    <div className="app-shell">
      <header className="app-shell-header">
        <div className="app-shell-brand">
          <div className="app-shell-logo">
            <Drip3DLogo className="brand-logo-svg" />
          </div>
          <div>
            <p className="app-shell-brand-title">Drip3D</p>
            <p className="app-shell-brand-copy">Authenticated Design Studio</p>
          </div>
        </div>

        <nav className="app-shell-nav" aria-label="Authenticated navigation">
          <NavLink
            to="/app"
            end
            className={({ isActive }) =>
              `app-shell-link ${isActive ? "is-active" : ""}`
            }>
            Dashboard
          </NavLink>
          <NavLink
            to="/app/customizer"
            className={({ isActive }) =>
              `app-shell-link ${isActive ? "is-active" : ""}`
            }>
            Customizer
          </NavLink>
        </nav>

        <div className="app-shell-actions">
          {!isCustomizerRoute && (
            <CustomButton
              type="filled"
              title="Start New Design"
              handleClick={() => navigate("/app/customizer")}
              customStyles="app-shell-cta px-5 py-3 text-[0.72rem] font-semibold tracking-[0.12em] uppercase"
              styleOverrides={{
                background:
                  "linear-gradient(135deg, rgba(40, 92, 196, 0.98) 0%, rgba(59, 125, 239, 0.94) 52%, rgba(107, 96, 243, 0.94) 100%)",
                borderColor: "rgba(180, 214, 255, 0.72)",
                color: "#f5fbff",
                minHeight: "4.1rem",
                minWidth: "10rem",
              }}
            />
          )}
          <div className="app-shell-user">
            <div className="app-shell-user-copy">
              <span className="app-shell-user-label">Account</span>
              <span className="app-shell-user-name" title={displayName}>
                {displayName}
              </span>
              <span className="app-shell-user-meta" title={emailAddress}>
                {emailAddress}
              </span>
            </div>
            <div className="app-shell-user-avatar">
              <UserButton
                appearance={clerkAppearance}
                userProfileProps={{ appearance: clerkAppearance }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="app-shell-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
