// web/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { ClientCardPage, CaseDemoPage } from "./pages/ClientCardPage";
import { ClientTermsPage } from "./pages/ClientTermsPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { ForfaitPayPage } from "./pages/ForfaitPayPage";
import { InvoicePage } from "./pages/InvoicePage";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/card/:slug" element={<ClientCardPage />} />
        <Route path="/card/:slug/conditions" element={<ClientTermsPage />} />
        <Route path="/card/:slug/facture/:orderId" element={<InvoicePage />} />
        <Route path="/forfait/:reference" element={<ForfaitPayPage />} />
        <Route path="/demo/box-bryan-cars" element={<CaseDemoPage />} />
        <Route path="/admin/*" element={<AdminDashboardPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}
