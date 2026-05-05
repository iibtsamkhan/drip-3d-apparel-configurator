import { useAuth } from "@clerk/clerk-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export const RouteLoadingState = () => (
  <div className="route-loader-shell">
    <div className="route-loader-card">
      <span className="ai-spinner" />
      <p>Loading secure studio...</p>
    </div>
  </div>
);

export const ProtectedRoute = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return <RouteLoadingState />;
  }

  if (!isSignedIn) {
    return (
      <Navigate
        to="/sign-in"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  return <Outlet />;
};

export const PublicOnlyRoute = () => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <RouteLoadingState />;
  }

  if (isSignedIn) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
};
