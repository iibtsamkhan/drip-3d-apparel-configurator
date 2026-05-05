import { Link } from "react-router-dom";
import Drip3DLogo from "./Drip3DLogo";

const AuthLayout = ({ title, eyebrow, children, alternateLabel, alternateHref }) => {
  return (
    <main className="auth-shell">
      <div className="auth-backdrop" />
      <section className="auth-panel">
        <div className="auth-copy">
          <div className="auth-copy-panel">
            <div className="auth-brand-lockup">
              <div className="auth-brand-mark">
                <Drip3DLogo className="brand-logo-svg" />
              </div>
              <div>
                <p className="auth-brand-title">Drip3D</p>
                <p className="auth-brand-copy">Protected Streetwear Studio</p>
              </div>
            </div>
            <p className="auth-eyebrow">{eyebrow}</p>
            <h1 className="auth-title">{title}</h1>
            <p className="auth-subtitle">
              Access the Drip3D dashboard, create premium mockups, and manage your
              apparel design workflow in one place.
            </p>
            <div className="auth-meta-row">
              <span className="auth-meta-pill">Protected Studio</span>
              <span className="auth-meta-pill">Realtime 3D Customizer</span>
            </div>
          </div>

          <div className="auth-feature-grid">
            <article className="auth-feature-card">
              <p className="auth-feature-value">Secure</p>
              <p className="auth-feature-label">Clerk-powered identity and account management</p>
            </article>
            <article className="auth-feature-card">
              <p className="auth-feature-value">AI + 3D</p>
              <p className="auth-feature-label">Generate artwork and apply it directly to the model</p>
            </article>
            <article className="auth-feature-card">
              <p className="auth-feature-value">SaaS Ready</p>
              <p className="auth-feature-label">Prepared for saved designs, billing, and team workflows</p>
            </article>
          </div>
        </div>

        <div className="auth-card-shell">
          <div className="auth-card-topbar">
            <span className="auth-card-brand">Drip3D Access</span>
            <span className="auth-card-status">Secure Session</span>
          </div>
          {children}
          <p className="auth-switch-copy">
            {alternateLabel} <Link to={alternateHref}>Continue here</Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default AuthLayout;
