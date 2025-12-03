// web/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { ClientCardPage } from "./pages/ClientCardPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/card/:slug" element={<ClientCardPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        {/* pour tester facilement la carte client */}
        <Route path="/" element={<ClientCardPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
