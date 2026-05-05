import { Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import DashboardPage from "./pages/DashboardPage";
import StudioPage from "./pages/StudioPage";
import AppShell from "./components/AppShell";
import { ProtectedRoute, PublicOnlyRoute } from "./components/RouteGuards";

function App() {
  return (
    <main className="app transition-all ease-in">
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="customizer" element={<StudioPage />} />
          </Route>
        </Route>
      </Routes>
    </main>
  );
}

export default App;
