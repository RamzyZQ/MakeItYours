import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import confetti from "canvas-confetti";
import AppHeader from "../components/AppHeader";
import StringCanvas, { type CanvasMatTone } from "../components/StringCanvas";
import { BeadCatalog } from "../components/BeadCatalog";
import { getPath, nearestS, topS, VIEW_H, VIEW_W } from "../game/paths";
import { BeadGlyph, type BeadDef } from "../game/beads";
import { useStringSim } from "../game/sim";
import {
  BASE_TYPES,
  BASE_TYPE_LABELS,
  MAX_BEADS_PER_DESIGN,
  type BaseType,
  type BeadRecord,
} from "../types/beads";
import {
  saveLocalDesign,
  getDesignById,
  downloadSvgAsPng,
  getUserProfile,
} from "../services/storage";
import CheckoutModal from "../components/CheckoutModal";
import { buildBeadDesignMessage } from "../services/whatsapp";
import {
  ArrowLeft,
  Eraser,
  Save,
  Undo2,
  Download,
  X,
  Info,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import {
  isStudioOpen,
  studioStatusLabel,
  useStoreSettings,
} from "../services/storeSettings";

export default function Builder() {
  const { base } = useParams<{ base: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  if (!base || !BASE_TYPES.includes(base as BaseType)) {
    return <Navigate to="/" replace />;
  }

  const designId = searchParams.get("desain");

  return (
    <BuilderInner
      key={base}
      base={base as BaseType}
      designId={designId}
      setDesignParam={(id) => setSearchParams(id ? { desain: id } : {}, { replace: true })}
      navigate={navigate}
    />
  );
}

function BuilderInner({
  base,
  designId,
  setDesignParam,
  navigate,
}: {
  base: BaseType;
  designId: string | null;
  setDesignParam: (id: string | null) => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const { settings } = useStoreSettings();
  const studio = settings.studios[base];
  const path = getPath(base);
  const sim = useStringSim(path);

  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ def: BeadDef } | null>(null);
  const countRef = useRef(0);

  const [ghost, setGhost] = useState<{ def: BeadDef; x: number; y: number } | null>(null);
  const [overCanvas, setOverCanvas] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [designName, setDesignName] = useState("");
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [matTone, setMatTone] = useState<CanvasMatTone>("pastel-pink");
  const [notification, setNotification] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  useEffect(() => {
    countRef.current = sim.beads.length;
  }, [sim.beads.length]);

  // Load design if `desain` param is present
  useEffect(() => {
    if (!designId) return;
    const item = getDesignById(designId);
    if (item) {
      if (item.baseType === base) {
        sim.loadBeads(item.beads);
        setDesignName(item.name);
        setLoadedId(item.id);
        if (item.canvasTone) setMatTone(item.canvasTone);
        notify(`Membuka desain "${item.name}"`);
      } else {
        notify("Media tali desain berbeda dari pilihan saat ini.");
      }
    }
  }, [designId, base]);

  // Drag & drop logic (PointerEvent based for smooth mouse + touch support)
  useEffect(() => {
    const insideCanvas = (x: number, y: number) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return null;
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return null;
      return {
        vx: ((x - rect.left) / rect.width) * VIEW_W,
        vy: ((y - rect.top) / rect.height) * VIEW_H,
      };
    };

    const move = (e: PointerEvent) => {
      if (!dragRef.current) return;
      setGhost((g) => (g ? { ...g, x: e.clientX, y: e.clientY } : g));
      setOverCanvas(insideCanvas(e.clientX, e.clientY) !== null);
    };

    const up = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      setGhost(null);
      setOverCanvas(false);

      const pos = insideCanvas(e.clientX, e.clientY);
      if (!pos) return;

      if (countRef.current >= MAX_BEADS_PER_DESIGN) {
        notify("Tali sudah penuh — ketuk manik di tali untuk melepasnya.");
        return;
      }
      sim.addBead(drag.def.id, nearestS(path, pos.vx, pos.vy));
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [path, sim]);

  const startDrag = useCallback((def: BeadDef, x: number, y: number) => {
    dragRef.current = { def };
    setGhost({ def, x, y });
  }, []);

  const pickBead = useCallback(
    (def: BeadDef) => {
      if (countRef.current >= MAX_BEADS_PER_DESIGN) {
        notify("Tali sudah penuh — ketuk manik di tali untuk melepasnya.");
        return;
      }
      // Tap fallback: drop near the top of the string and let it slide with gravity
      const jitter = (Math.random() - 0.5) * path.length * 0.12;
      sim.addBead(def.id, topS(path) + jitter);
    },
    [path, sim],
  );

  const handleSaveClick = () => {
    if (sim.beads.length === 0) {
      notify("Rangkaian masih kosong — tambahkan manik dulu!");
      return;
    }
    setSaveOpen(true);
  };

  const submitSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = designName.trim() || `Kreasi ${BASE_TYPE_LABELS[base]}`;
    const beads: BeadRecord[] = sim.beads.map((b) => ({ type: b.type, s: Math.round(b.s) }));

    const saved = saveLocalDesign({
      id: loadedId || undefined,
      name: finalName,
      baseType: base,
      beads,
      canvasTone: matTone,
      creator: getUserProfile().name,
    });

    setLoadedId(saved.id);
    setDesignParam(saved.id);
    setSaveOpen(false);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#F472B6", "#A78BFA", "#FDE047", "#6EE7B7"],
    });

    notify("✨ Desain berhasil disimpan di Galeri!");
  };

  const handleExportPng = async () => {
    if (!svgRef.current) return;
    setExporting(true);
    try {
      const fname = (designName || `makeityours-${base}`).toLowerCase().replace(/\s+/g, "-");
      await downloadSvgAsPng(svgRef.current, fname);
      confetti({
        particleCount: 30,
        spread: 45,
        origin: { y: 0.6 },
        colors: ["#F472B6", "#60A5FA", "#FACC15"],
      });
      notify("Foto desain berhasil diunduh (PNG)! 📷");
    } catch (err) {
      notify("Gagal mengunduh gambar. Coba lagi.");
    } finally {
      setExporting(false);
    }
  };

  const count = sim.beads.length;

  if (!isStudioOpen(studio.status)) {
    return (
      <div className="flex min-h-screen flex-col bg-pastel-mesh">
        <AppHeader />
        <main className="mx-auto flex w-full max-w-2xl flex-1 items-center px-4 py-10">
          <div className="w-full rounded-[2rem] border-2 border-[#FCE7F3] bg-white p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#FDF2F8] text-[#DB2777]">
              <Sparkles className="h-8 w-8 animate-pulse" />
            </div>
            <p className="meta-label text-[#DB2777]">{studioStatusLabel(studio.status)}</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-[#372A3C]">
              Studio {BASE_TYPE_LABELS[base]} Segera Hadir!
            </h1>
            <p className="mx-auto mt-3 max-w-[42ch] text-sm leading-relaxed text-[#6B5E70]">
              {studio.note?.trim() ||
                "Kami masih merapikan studio pastel ini. Keychain custom sudah bisa dipakai, dan studio manik akan menyusul!"}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link to="/" className="btn-pastel-secondary">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Beranda
              </Link>
              <Link to="/keychain" className="btn-pastel-primary">
                Buka Studio Keychain
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const MAT_OPTIONS: { id: CanvasMatTone; label: string; color: string }[] = [
    { id: "pastel-pink", label: "Pink", color: "bg-[#FCE7F3]" },
    { id: "pastel-lilac", label: "Lilac", color: "bg-[#F3E8FF]" },
    { id: "pastel-mint", label: "Mint", color: "bg-[#DCFCE7]" },
    { id: "pastel-sky", label: "Sky", color: "bg-[#E0F2FE]" },
    { id: "pastel-cream", label: "Cream", color: "bg-[#FEF3C7]" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-pastel-mesh">
      <AppHeader />

      {/* Floating Notification */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="rounded-full bg-white/95 px-5 py-2 text-xs font-bold text-[#DB2777] shadow-lg border-2 border-[#FCE7F3] flex items-center gap-2">
            <span>✨</span>
            <span>{notification}</span>
          </div>
        </div>
      )}

      {/* Studio Top Control Toolbar */}
      <div className="border-b border-[#FCE7F3] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* Back button and design name */}
          <div className="flex items-center gap-3">
            <Link
              to="/#pilih-tali"
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-[#6B5E70] bg-[#FFF0F5] hover:text-[#DB2777] border border-[#FCE7F3] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Ganti Tali</span>
            </Link>

            <div className="h-6 w-px bg-[#FCE7F3]" />

            <div>
              <h1 className="font-display text-base sm:text-lg font-bold text-[#372A3C] leading-none">
                {designName || BASE_TYPE_LABELS[base]}
              </h1>
              <p className="meta-label text-[10px] text-[#A288A6] mt-0.5">
                {count}/{MAX_BEADS_PER_DESIGN} manik {loadedId ? "· Tersimpan" : ""}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Tone Selector */}
            <div className="hidden sm:flex items-center gap-1 bg-[#FFF0F5] p-1 rounded-full border border-[#FCE7F3]">
              {MAT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  title={`Warna Kanvas: ${opt.label}`}
                  onClick={() => setMatTone(opt.id)}
                  className={`h-5 w-5 rounded-full ${opt.color} transition-all ${
                    matTone === opt.id ? "scale-125 ring-2 ring-[#F472B6]" : "opacity-70 hover:opacity-100"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={sim.undo}
              disabled={!sim.canUndo}
              className="btn-pastel-outline !py-1.5 !px-3 !text-xs disabled:opacity-40"
              title="Urungkan manik terakhir"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Urungkan</span>
            </button>

            <button
              type="button"
              onClick={sim.clear}
              disabled={count === 0}
              className="btn-pastel-outline !py-1.5 !px-3 !text-xs disabled:opacity-40"
              title="Lepaskan semua manik"
            >
              <Eraser className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Bersihkan</span>
            </button>

            <button
              type="button"
              onClick={handleExportPng}
              disabled={count === 0 || exporting}
              className="btn-pastel-outline !py-1.5 !px-3 !text-xs text-[#8B5CF6] border-[#DDD6FE] disabled:opacity-40"
              title="Unduh foto desain sebagai PNG"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Unduh PNG</span>
            </button>

            <button
              type="button"
              onClick={handleSaveClick}
              className="btn-pastel-primary !py-1.5 !px-4 !text-xs"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Simpan</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (sim.beads.length === 0) {
                  notify("Tambahkan manik dulu sebelum memesan.");
                  return;
                }
                setCheckoutOpen(true);
              }}
              className="btn-pastel-primary !py-1.5 !px-4 !text-xs !bg-gradient-to-r !from-[#25D366] !to-[#128C7E]"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Pesan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Workspace: Responsive (Canvas Top on mobile, Catalog Bottom/Left) */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col-reverse lg:flex-row p-4 sm:p-6 gap-6">
        {/* Bead Catalog Sidebar / Bottom Section */}
        <aside className="w-full lg:w-[340px] xl:w-[380px] rounded-3xl bg-white p-5 border-2 border-[#FCE7F3] shadow-md flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-base">✨</span>
              <h2 className="font-display text-base font-bold text-[#372A3C]">Katalog Manik</h2>
            </div>
            <span className="meta-label text-[10px] text-[#A288A6] bg-[#FFF0F5] px-2 py-0.5 rounded-full">
              18 Variasi
            </span>
          </div>

          <p className="text-xs text-[#8B7A90] mb-3 leading-relaxed">
            💡 <strong>Sentuh/Klik</strong> manik untuk langsung menjatuhkannya dari atas, atau <strong>seret</strong> ke tali.
          </p>

          <BeadCatalog onPick={pickBead} onDragStart={startDrag} />

          <div className="mt-4 pt-3 border-t border-[#FCE7F3] flex items-center justify-between text-[11px] text-[#8B7A90]">
            <span className="flex items-center gap-1">
              <Info className="h-3.5 w-3.5 text-[#F472B6]" />
              Ketuk manik di tali untuk melepas
            </span>
            <span className="font-bold text-[#DB2777]">
              {count}/{MAX_BEADS_PER_DESIGN}
            </span>
          </div>
        </aside>

        {/* Canvas Center / Top Viewport */}
        <main className="flex-1 flex flex-col justify-center">
          <div className="w-full max-w-4xl mx-auto">
            {/* Tone selector on mobile */}
            <div className="sm:hidden flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-bold text-[#6B5E70]">Warna Kanvas:</span>
              <div className="flex items-center gap-1.5">
                {MAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMatTone(opt.id)}
                    className={`h-5 w-5 rounded-full ${opt.color} ${
                      matTone === opt.id ? "ring-2 ring-[#F472B6]" : "opacity-60"
                    }`}
                  />
                ))}
              </div>
            </div>

            <StringCanvas
              ref={svgRef}
              path={path}
              beads={sim.beads}
              matTone={matTone}
              highlight={overCanvas}
              onBeadClick={(id) => sim.removeBead(id)}
              hint="✨ Sentuh atau jatuhkan manik di sini!"
            />

            <div className="mt-3 flex items-center justify-between px-2 text-xs text-[#8B7A90]">
              <span className="font-medium">
                {BASE_TYPE_LABELS[base]} · Simulasi gravitasi & fisika aktif
              </span>
              <span className="hidden sm:inline text-[#DB2777] font-semibold">
                MakeitYours Studio
              </span>
            </div>
          </div>
        </main>
      </div>

      {/* Drag Ghost Follower */}
      {ghost && (
        <div
          className="pointer-events-none fixed left-0 top-0 z-50 select-none"
          style={{ transform: `translate(${ghost.x - 34}px, ${ghost.y - 44}px)` }}
          aria-hidden
        >
          <svg
            viewBox="-38 -38 76 76"
            className="h-[68px] w-[68px] drop-shadow-[0_12px_16px_rgba(244,114,182,0.45)]"
          >
            <BeadGlyph def={ghost.def} uid="ghost" />
          </svg>
          <span className="meta-label mt-1 block rounded-full bg-[#372A3C] px-2 py-0.5 text-center text-[9px] text-white shadow-md">
            {ghost.def.name}
          </span>
        </div>
      )}

      <CheckoutModal
        open={checkoutOpen}
        title="Pesan Rangkaian Ini"
        summary={
          <>
            <p>Produk: {BASE_TYPE_LABELS[base]}</p>
            <p>Jumlah manik: {count}</p>
            <p>Tidak perlu login — checkout ke WhatsApp.</p>
          </>
        }
        buildMessage={(name, note) =>
          buildBeadDesignMessage({
            name: designName,
            base,
            beads: sim.beads.map((b) => ({ type: b.type, s: Math.round(b.s) })),
            customerName: name,
            note,
          })
        }
        onClose={() => setCheckoutOpen(false)}
      />

      {/* Save Modal */}
      {saveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border-2 border-[#FCE7F3] animate-scaleUp">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-2xl font-bold text-[#372A3C] flex items-center gap-2">
                <span>{loadedId ? "Perbarui Desain" : "Simpan Kreasi"}</span>
                <span>🌸</span>
              </h3>
              <button
                type="button"
                onClick={() => setSaveOpen(false)}
                className="h-8 w-8 rounded-full bg-[#FFF0F5] text-[#6B5E70] flex items-center justify-center hover:bg-[#FCE7F3]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submitSave} className="space-y-4">
              <div>
                <label className="meta-label text-[#8B7A90] block mb-1">
                  Beri Nama Rangkaianmu
                </label>
                <input
                  type="text"
                  value={designName}
                  onChange={(e) => setDesignName(e.target.value)}
                  placeholder="Contoh: Kalung Senja Sakura, Gelang Bestie"
                  maxLength={60}
                  autoFocus
                  className="w-full rounded-2xl border-2 border-[#FCE7F3] px-4 py-2.5 text-sm font-semibold text-[#372A3C] focus:border-[#F472B6] focus:outline-none"
                />
              </div>

              <div>
                <label className="meta-label text-[#8B7A90] block mb-1">
                  Pilih Warna Latar Kanvas
                </label>
                <div className="flex items-center gap-2">
                  {MAT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setMatTone(opt.id)}
                      className={`flex-1 py-2 rounded-2xl text-xs font-bold border-2 transition-all ${
                        matTone === opt.id
                          ? "border-[#F472B6] bg-[#FFF0F5] text-[#DB2777]"
                          : "border-[#FCE7F3] bg-white text-[#6B5E70]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-[#FFF8FA] p-3 text-xs text-[#8B7A90] leading-relaxed">
                ✨ Desain ini akan langsung tersimpan di galeri lokal browser-mu dan bisa kamu buka, ubah, atau unduh kapan saja!
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSaveOpen(false)}
                  className="rounded-full px-4 py-2 text-xs font-bold text-[#8B7A90] hover:bg-[#FDF2F8]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-pastel-primary !py-2 !px-6 !text-xs"
                >
                  Simpan ke Galeri
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
