// web/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { LandingPage } from "./pages/LandingPage";
import "./index.css";
import "./refinement.css";
import "./motion.css";
import "./benefits.css";
const ClientCardPage = React.lazy(() => import("./pages/ClientCardPage").then(m => ({ default: m.ClientCardPage })));
const CaseDemoPage = React.lazy(() => import("./pages/ClientCardPage").then(m => ({ default: m.CaseDemoPage })));
const ClientTermsPage = React.lazy(() => import("./pages/ClientTermsPage").then(m => ({ default: m.ClientTermsPage })));
const AdminDashboardPage = React.lazy(() => import("./pages/AdminDashboardPage").then(m => ({ default: m.AdminDashboardPage })));
const ForfaitPayPage = React.lazy(() => import("./pages/ForfaitPayPage").then(m => ({ default: m.ForfaitPayPage })));
const InvoicePage = React.lazy(() => import("./pages/InvoicePage").then(m => ({ default: m.InvoicePage })));
const LegalPage = React.lazy(() => import("./pages/LegalPage").then(m => ({ default: m.LegalPage })));
const LandingTestPage = React.lazy(() => import("./pages/LandingTestPage").then(m => ({ default: m.LandingTestPage })));
const SalesPrepPage = React.lazy(() => import("./pages/SalesPrepPage").then(m => ({ default: m.SalesPrepPage })));
const LocalSeoPage = React.lazy(() => import("./pages/LocalSeoPage").then(m => ({ default: m.LocalSeoPage })));

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
      <React.Suspense fallback={<div className="route-loading" role="status" aria-label="Chargement"><span /></div>}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing-test" element={<LandingTestPage />} />
        <Route path="/card/:slug" element={<ClientCardPage />} />
        <Route path="/card/:slug/conditions" element={<ClientTermsPage />} />
        <Route path="/card/:slug/facture/:orderId" element={<InvoicePage />} />
        <Route path="/forfait/:reference" element={<ForfaitPayPage />} />
        <Route path="/preparation-vente" element={<SalesPrepPage />} />
        <Route path="/preparation-vente/:token" element={<SalesPrepPage />} />
        <Route path="/nettoyage-voiture-louhans" element={<LocalSeoPage />} />
        <Route path="/demo/box-bryan-cars" element={<CaseDemoPage />} />
        <Route path="/mentions-legales" element={<LegalPage doc="mentions" />} />
        <Route path="/confidentialite" element={<LegalPage doc="confidentialite" />} />
        <Route path="/cookies" element={<LegalPage doc="cookies" />} />
        <Route path="/conditions" element={<LegalPage doc="conditions" />} />
        <Route path="/admin/*" element={<AdminDashboardPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
      </React.Suspense>
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
