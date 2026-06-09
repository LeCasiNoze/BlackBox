// web/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { ClientCardPage } from "./pages/ClientCardPage";
import { ClientTermsPage } from "./pages/ClientTermsPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { LandingPage } from "./pages/LandingPage";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/card/:slug" element={<ClientCardPage />} />
        <Route path="/card/:slug/conditions" element={<ClientTermsPage />} />
        <Route path="/admin/*" element={<AdminDashboardPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
