import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import StringCanvas from "../components/StringCanvas";
import { getPath, topS } from "../game/paths";
import { BEADS } from "../game/beads";
import { useStringSim } from "../game/sim";
import { BASE_TYPE_LABELS, BASE_TYPE_DESCRIPTIONS, type BaseType } from "../types/beads";
import { ArrowRight, Sparkles, Heart, MousePointer2, MoveDown, Layers, Download, Palette, RefreshCw, Lock } from "lucide-react";
import {
  isStudioOpen,
  studioStatusLabel,
  useStoreSettings,
  type StudioId,
} from "../services/storeSettings";

const BASE_CARDS: ({ base: BaseType; icon: string } | { base: "keychain"; icon: string })[] = [
  { base: "kalung", icon: "✨" },
  { base: "gelang", icon: "🌸" },
  { base: "strap", icon: "🎀" },
  { base: "keychain", icon: "✦" },
];

function HeroDemo() {
  const path = getPath("kalung");
  const { beads, addBead, clear } = useStringSim(path);
  const countRef = useRef(0);

  useEffect(() => {
    const top = topS(path);
    const timer = setInterval(() => {
      if (countRef.current >= 12) {
        countRef.current = 0;
        clear();
        return;
      }
      const def = BEADS[Math.floor(Math.random() * BEADS.length)];
      const spread = path.length * 0.26;
      const s = top + (Math.random() - 0.5) * spread + (Math.random() < 0.5 ? -spread : spread);
      addBead(def.id, Math.max(30, Math.min(path.length - 30, s)));
      countRef.current += 1;
    }, 1200);
    return () => clearInterval(timer);
  }, [path, addBead, clear]);

  return (
    <div className="relative">
      {/* Decorative cute badge */}
      <div className="absolute -top-3 -right-3 z-10 hidden sm:flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 shadow-md border border-[#FCE7F3] text-xs font-bold text-[#DB2777] animate-bounce">
        <Sparkles className="h-3.5 w-3.5 text-[#F472B6]" />
        <span>Fisika Gravitasi Nyata</span>
      </div>

      <StringCanvas
        path={path}
        beads={beads}
        matTone="pastel-pink"
        beadScale={0.94}
      />

      <div className="mt-3 flex items-center justify-between text-xs text-[#8B7A90]">
        <p className="flex items-center gap-1.5 font-medium">
          <MoveDown className="h-3.5 w-3.5 text-[#F472B6]" aria-hidden />
          Demo interaktif: manik meluncur dan menumpuk di lekukan tali
        </p>
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1 text-[11px] font-bold text-[#DB2777] hover:underline"
        >
          <RefreshCw className="h-3 w-3" />
          Ulangi
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { settings } = useStoreSettings();
  const [notice, setNotice] = useState<string | null>(null);

  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => {
      setNotice((current) => (current === message ? null : current));
    }, 2800);
  };

  return (
    <div className="min-h-screen bg-pastel-mesh flex flex-col">
      <AppHeader />
      {notice && (
        <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2 px-4" role="status">
          <div className="rounded-full border-2 border-[#FBCFE8] bg-white px-5 py-2 text-center text-xs font-bold text-[#DB2777] shadow-lg">
            {notice}
          </div>
        </div>
      )}

      {/* ---- Hero Section ---- */}
      <section className="mx-auto max-w-6xl w-full px-4 pt-8 pb-14 sm:px-6 lg:pt-14 lg:pb-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-1.5 border border-[#FCE7F3] shadow-xs backdrop-blur-xs">
              <span className="text-base">🌸</span>
              <span className="meta-label text-[#DB2777]">
                MakeitYours · Studio Aksesori Pastel
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight text-[#372A3C]">
              Rangkai manik impianmu.{" "}
              <br className="hidden sm:inline" />
              Biarkan{" "}
              <span className="bg-gradient-to-r from-[#EC4899] via-[#A855F7] to-[#6366F1] bg-clip-text text-transparent">
                gravitasi
              </span>{" "}
              yang menatanya.
            </h1>

            <p className="max-w-[48ch] text-base sm:text-lg leading-relaxed text-[#6B5E70]">
              Pilih manik pastel lucu dari katalog, jatuhkan di atas tali, dan
              saksikan manik meluncur mulus mengikuti lekukan tali hingga menumpuk
              rapi di titik terendah — persis seperti merangkai manik sungguhan!
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a href="#pilih-tali" className="btn-pastel-primary">
                <span>Mulai Merangkai Sekarang</span>
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
              <Link to="/keychain" className="btn-pastel-secondary">
                <span>Keychain Custom</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/galeri" className="btn-pastel-secondary">
                <Heart className="h-4 w-4 text-[#F472B6]" />
                <span>Lihat Galeri Kreasi</span>
              </Link>
            </div>

            {/* Quick highlight feature badges */}
            <div className="flex flex-wrap items-center gap-4 pt-3 text-xs font-semibold text-[#8B7A90]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#F472B6]"></span>
                18+ Manik Pastel 3D
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#A78BFA]"></span>
                Ekspor Gambar PNG
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#34D399]"></span>
                100% Berjalan di Perangkatmu
              </span>
            </div>
          </div>

          {/* Hero Live Physics Demo */}
          <HeroDemo />
        </div>
      </section>

      {/* ---- Base Selection Section ---- */}
      <section id="pilih-tali" className="border-y border-[#FCE7F3] bg-white/70 py-16 backdrop-blur-xs">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="meta-label text-[#DB2777] bg-[#FDF2F8] px-3 py-1 rounded-full border border-[#FBCFE8]">
              Langkah 01 — Media Dasar
            </span>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl font-extrabold text-[#372A3C]">
              Pilih Media Favoritmu
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#6B5E70]">
              Rangkai aksesori di studio atau buat gantungan kunci photo strip custom.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BASE_CARDS.map(({ base, icon }, idx) => {
              const isKeychain = base === "keychain";
              const path = isKeychain ? null : getPath(base);
              const label = isKeychain ? "Gantungan Kunci" : BASE_TYPE_LABELS[base];
              const desc = isKeychain
                ? "Gantungan praktis — pas untuk foto strip, kunci, dan tas favoritmu"
                : BASE_TYPE_DESCRIPTIONS[base];
              const studio = isKeychain ? null : settings.studios[base as StudioId];
              const studioLocked = Boolean(studio && !isStudioOpen(studio.status));

              return (
                <button
                  key={base}
                  type="button"
                  onClick={() => {
                    if (studioLocked && studio) {
                      notify(
                        studio.note?.trim()
                          ? `Studio ${label}: ${studio.note.trim()}`
                          : `Studio ${label} sedang ${studioStatusLabel(studio.status).toLowerCase()} — pantau terus ya! 🌸`
                      );
                      return;
                    }
                    navigate(isKeychain ? "/keychain" : `/builder/${base}`);
                  }}
                  className={`group relative flex flex-col rounded-3xl border-2 border-[#FCE7F3] bg-white p-6 text-left shadow-sm transition-all duration-300 hover:border-[#F472B6] hover:shadow-xl hover:-translate-y-1.5 cursor-pointer ${
                    studioLocked ? "opacity-90" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#FFF0F5] text-lg">
                      {isKeychain ? <span className="text-xl text-[#DB2777]">{icon}</span> : icon}
                    </span>
                    <div className="flex items-center gap-2">
                      {isKeychain && (
                        <span className="rounded-full bg-[#FDF2F8] px-2.5 py-1 text-[10px] font-extrabold text-[#DB2777]">
                          BARU
                        </span>
                      )}
                      {studioLocked && studio && (
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold border ${
                            studio.status === "locked"
                              ? "bg-[#FEE2E2] border-[#FECACA] text-[#DC2626]"
                              : "bg-[#FEF3C7] border-[#FDE68A] text-[#D97706]"
                          }`}
                        >
                          {studioStatusLabel(studio.status)}
                        </span>
                      )}
                      <span className="meta-label text-[#A288A6] font-bold">0{idx + 1}</span>
                    </div>
                  </div>

                  <div className="my-4 flex h-32 items-center justify-center rounded-2xl border border-[#FCE7F3] bg-[#FFF8FA] p-3 transition-colors group-hover:bg-[#FFF0F5]">
                    {path ? (
                      <svg viewBox="120 40 760 560" className="h-32 w-full" aria-hidden>
                        <path
                          d={path.d}
                          className="string-line-static"
                          stroke="#F472B6"
                          strokeWidth={5}
                          opacity={0.8}
                        />
                        {!path.closed && (
                          <>
                            <circle cx={path.samples[0].x} cy={path.samples[0].y} r={14} fill="#FB7185" />
                            <circle cx={path.samples[0].x} cy={path.samples[0].y} r={6} fill="#FFFFFF" />
                            <circle
                              cx={path.samples[path.samples.length - 1].x}
                              cy={path.samples[path.samples.length - 1].y}
                              r={14}
                              fill="#FB7185"
                            />
                            <circle
                              cx={path.samples[path.samples.length - 1].x}
                              cy={path.samples[path.samples.length - 1].y}
                              r={6}
                              fill="#FFFFFF"
                            />
                          </>
                        )}
                      </svg>
                    ) : (
                      <svg viewBox="0 0 180 140" className="h-full w-full" role="img" aria-label="Ilustrasi gantungan kunci dengan tiga slot foto">
                        <circle cx="90" cy="27" r="20" fill="none" stroke="#F9A8D4" strokeWidth="3" />
                        <circle cx="90" cy="27" r="15" fill="none" stroke="#F9A8D4" strokeWidth="1.5" />
                        <path d="M90 47v9" stroke="#F9A8D4" strokeWidth="4" strokeLinecap="round" />
                        <rect x="65" y="56" width="50" height="76" rx="4" fill="none" stroke="#F9A8D4" strokeWidth="2" />
                        {[0, 1, 2].map((slot) => (
                          <rect
                            key={slot}
                            x="72"
                            y={63 + slot * 21}
                            width="36"
                            height="16"
                            rx="2"
                            fill="white"
                            stroke="#F9A8D4"
                            strokeWidth="1.5"
                          />
                        ))}
                      </svg>
                    )}
                  </div>

                  <h3 className="font-display text-2xl font-bold text-[#372A3C] group-hover:text-[#DB2777] transition-colors">
                    {label}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#6B5E70]">
                    {desc}
                  </p>

                  {studioLocked && studio?.note?.trim() && (
                    <div className="mt-2 rounded-xl bg-[#FEF3C7]/60 border border-[#FDE68A] px-2.5 py-1 text-[11px] font-semibold text-[#B45309]">
                      📌 {studio.note.trim()}
                    </div>
                  )}

                  <div
                    className={`mt-auto flex items-center gap-1.5 pt-5 text-xs font-extrabold ${
                      studioLocked
                        ? studio?.status === "locked"
                          ? "text-[#DC2626]"
                          : "text-[#D97706]"
                        : "text-[#DB2777]"
                    }`}
                  >
                    <span>{studioLocked ? studioStatusLabel(studio?.status ?? "coming_soon") : "Buka di Studio"}</span>
                    {studioLocked ? (
                      <Lock className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---- Physics Features Band (Cute Pastel) ---- */}
      <section className="bg-gradient-to-r from-[#FFF0F5] via-[#FAF5FF] to-[#F0FDF4] py-16 border-b border-[#FCE7F3]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr_1fr_1fr] items-start">
            <div>
              <span className="meta-label text-[#8B5CF6]">Kenapa Begitu Seru?</span>
              <h2 className="mt-3 font-display text-3xl font-extrabold text-[#372A3C]">
                Fisika Tali Nyata di Layarmu
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#6B5E70]">
                Setiap manik dihitung secara matematis dengan algoritma gravitasi kurva 1D dan deteksi tabrakan presisi.
              </p>
            </div>

            {[
              {
                icon: MousePointer2,
                title: "Magnet Jalur Kurva",
                desc: "Jatuhkan manik di mana saja dekat tali, manik otomatis mengikat dan terpasang pada koordinat terdekat.",
                color: "text-[#EC4899] bg-[#FDF2F8]",
              },
              {
                icon: MoveDown,
                title: "Luncuran Alami",
                desc: "Gravitasi diproyeksikan langsung pada garis singgung tali sehingga manik meluncur mulus mengikuti lekukan.",
                color: "text-[#8B5CF6] bg-[#F5F3FF]",
              },
              {
                icon: Layers,
                title: "Menumpuk Rapi",
                desc: "Manik saling menahan dan tersusun rapi mengisi slot kosong paling rendah tanpa saling bertabrakan.",
                color: "text-[#10B981] bg-[#ECFDF5]",
              },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-3xl bg-white/90 p-5 border border-[#FCE7F3] shadow-xs">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${f.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-[#372A3C]">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#6B5E70]">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="mt-auto border-t border-[#FCE7F3] bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌸</span>
            <span className="font-display text-base font-extrabold bg-gradient-to-r from-[#DB2777] to-[#9333EA] bg-clip-text text-transparent">
              MakeitYours
            </span>
            <span className="text-xs text-[#8B7A90]">· Studio Aksesori Pastel</span>
          </div>
          <p className="text-xs text-[#8B7A90]">
            18+ variasi manik estetik · 3 media dasar · simulasi gravitasi lokal
          </p>
        </div>
      </footer>
    </div>
  );
}
