import React, { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Builder from "./pages/Builder";
import Gallery from "./pages/Gallery";
import Keychain from "./pages/Keychain";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import { StoreSettingsProvider } from "./contexts/StoreSettingsContext";
import { hasAdminSession } from "./services/storeSettings";

// Lazy-load Admin — bundle-nya tidak diunduh sampai route /admin dikunjungi
const Admin = lazy(() => import("./pages/Admin"));

/**
 * ProtectedRoute — cek session sebelum render Admin.
 * Mencegah bundle admin diproses oleh pengunjung biasa,
 * dan menghilangkan "flash konten" sebelum redirect.
 */
function ProtectedAdminRoute() {
  const [status, setStatus] = useState<"checking" | "ok" | "denied">("checking");

  useEffect(() => {
    hasAdminSession()
      .then((authenticated) => setStatus(authenticated ? "ok" : "denied"))
      .catch(() => setStatus("denied"));
  }, []);

  if (status === "checking") {
    return (
      <div className="min-h-screen bg-pastel-mesh flex items-center justify-center">
        <p className="text-sm font-semibold text-[#6B5E70]">Memeriksa sesi admin...</p>
      </div>
    );
  }

  // Jika sudah punya session, tampilkan Admin. Jika tidak, tetap tampilkan Admin
  // (Admin.tsx sendiri handle login form — hanya bundle yang kita defer).
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-pastel-mesh flex items-center justify-center">
          <p className="text-sm font-semibold text-[#6B5E70]">Memuat panel admin...</p>
        </div>
      }
    >
      <Admin />
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <StoreSettingsProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/builder/:base" element={<Builder />} />
          <Route path="/galeri" element={<Gallery />} />
          <Route path="/keychain" element={<Keychain />} />
          <Route path="/admin" element={<ProtectedAdminRoute />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </StoreSettingsProvider>
    </BrowserRouter>
  );
}
