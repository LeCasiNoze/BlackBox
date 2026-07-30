// web/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import "./index.css";
import { ClientCardPage, CaseDemoPage } from "./pages/ClientCardPage";
import { ClientTermsPage } from "./pages/ClientTermsPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { ForfaitPayPage } from "./pages/ForfaitPayPage";
import { InvoicePage } from "./pages/InvoicePage";
import { LegalPage } from "./pages/LegalPage";
import { LandingTestPage } from "./pages/LandingTestPage";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing-test" element={<LandingTestPage />} />
        <Route path="/card/:slug" element={<ClientCardPage />} />
        <Route path="/card/:slug/conditions" element={<ClientTermsPage />} />
        <Route path="/card/:slug/facture/:orderId" element={<InvoicePage />} />
        <Route path="/forfait/:reference" element={<ForfaitPayPage />} />
        <Route path="/demo/box-bryan-cars" element={<CaseDemoPage />} />
        <Route path="/mentions-legales" element={<LegalPage doc="mentions" />} />
        <Route path="/confidentialite" element={<LegalPage doc="confidentialite" />} />
        <Route path="/cookies" element={<LegalPage doc="cookies" />} />
        <Route path="/conditions" element={<LegalPage doc="conditions" />} />
        <Route path="/admin/*" element={<AdminDashboardPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
      </BrowserRouter>
    </MotionConfig>
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Portee dediee pour l'admin : un abonnement push est unique par
    // enregistrement de service worker, pas par "role". Sans ca, activer les
    // notifications sur une fiche client depuis le meme appareil ecrase
    // silencieusement l'abonnement admin (et vice versa), car les deux
    // partageraient le meme endpoint cote serveur.
    const scope = window.location.pathname.startsWith("/admin") ? "/admin/" : "/";
    navigator.serviceWorker.register("/sw.js", { scope }).catch(() => undefined);
  });
}
