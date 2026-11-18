import React from "react";
import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import { Home, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-pastel-mesh flex flex-col">
      <AppHeader />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md rounded-3xl bg-white p-8 border-2 border-[#FCE7F3] shadow-lg">
          <span className="text-5xl">🌸</span>
          <h1 className="mt-4 font-display text-4xl font-extrabold text-[#372A3C]">
            404
          </h1>
          <h2 className="mt-2 font-display text-xl font-bold text-[#DB2777]">
            Halaman Tidak Ditemukan
          </h2>
          <p className="mt-2 text-xs text-[#6B5E70]">
            Tampaknya rangkaian ini terselip di kotak manik. Yuk kembali ke studio MakeitYours!
          </p>
          <div className="mt-6">
            <Link to="/" className="btn-pastel-primary">
              <Home className="h-4 w-4" />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
