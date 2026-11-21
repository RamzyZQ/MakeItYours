import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import DesignPreview from "../components/DesignPreview";
import {
  getLocalDesigns,
  deleteLocalDesign,
  likeLocalDesign,
} from "../services/storage";
import {
  BASE_TYPE_LABELS,
  type BaseType,
  type DesignItem,
} from "../types/beads";
import {
  ArrowRight,
  Trash2,
  Heart,
  Plus,
  Search,
  Sparkles,
  Palette,
  X,
} from "lucide-react";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default function Gallery() {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState<DesignItem[]>([]);
  const [filterBase, setFilterBase] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<DesignItem | null>(null);

  const loadData = () => {
    setDesigns(getLocalDesigns());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    likeLocalDesign(id);
    loadData();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteLocalDesign(deleteTarget.id);
    setDeleteTarget(null);
    loadData();
  };

  const filtered = designs.filter((d) => {
    const matchBase = filterBase === "all" || d.baseType === filterBase;
    const matchQuery =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.creator.toLowerCase().includes(searchQuery.toLowerCase());
    return matchBase && matchQuery;
  });

  return (
    <div className="min-h-screen bg-pastel-mesh flex flex-col">
      <AppHeader />

      <main className="mx-auto max-w-6xl w-full px-4 py-8 sm:py-12 sm:px-6">
        {/* Banner peringatan localStorage */}
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-sm text-[#92400E]">
          <span className="mt-0.5 shrink-0 text-lg">💾</span>
          <div>
            <p className="font-bold">Desainmu tersimpan di browser ini saja</p>
            <p className="mt-0.5 text-xs leading-relaxed opacity-80">
              Galeri menggunakan penyimpanan lokal (localStorage). Desain <strong>tidak tersinkronisasi</strong> ke perangkat lain
              dan akan hilang jika kamu ganti HP, hapus data browser, atau buka di mode Incognito.
              Unduh desainmu sebagai PNG untuk menyimpannya secara permanen.
            </p>
          </div>
        </div>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-[#FCE7F3]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 border border-[#FCE7F3] shadow-xs text-xs font-bold text-[#DB2777]">
              <span>🌸</span>
              <span>Koleksi MakeitYours</span>
            </div>
            <h1 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#372A3C] tracking-tight">
              Galeri Kreasi Manik
            </h1>
            <p className="mt-2 text-sm text-[#6B5E70]">
              Jelajahi dan buka kembali berbagai karya manik pastel yang telah kamu dan komunitas rangkai.
            </p>
          </div>

          <Link to="/#pilih-tali" className="btn-pastel-primary whitespace-nowrap self-start sm:self-auto">
            <Plus className="h-4 w-4" />
            <span>Buat Rangkaian Baru</span>
          </Link>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Base Type Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "all", label: "Semua Rangkaian" },
              { id: "kalung", label: "Kalung" },
              { id: "gelang", label: "Gelang" },
              { id: "strap", label: "Phone Strap" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterBase(f.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                  filterBase === f.id
                    ? "bg-[#DB2777] text-white shadow-xs"
                    : "bg-white text-[#6B5E70] border border-[#FCE7F3] hover:border-[#F472B6]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A288A6]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama desain..."
              className="w-full rounded-full border-2 border-[#FCE7F3] bg-white pl-9 pr-4 py-1.5 text-xs font-semibold text-[#372A3C] focus:border-[#F472B6] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A288A6] hover:text-[#DB2777]"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Designs Grid */}
        <div className="mt-8">
          {filtered.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-[#FBCFE8] bg-white/70 p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#FFF0F5] text-3xl">
                🌸
              </div>
              <h3 className="mt-4 font-display text-2xl font-bold text-[#372A3C]">
                Belum ada rangkaian yang cocok
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-[#6B5E70]">
                {searchQuery
                  ? "Coba gunakan kata kunci pencarian lain atau pilih filter tali yang berbeda."
                  : "Mulai rangkai manik-manik pastel favoritmu sekarang dan simpan ke galeri!"}
              </p>
              <Link to="/#pilih-tali" className="btn-pastel-primary mt-6 inline-flex">
                <Sparkles className="h-4 w-4" />
                <span>Mulai Merangkai Sekarang</span>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((d) => (
                <article
                  key={d.id}
                  className="group flex flex-col rounded-3xl border-2 border-[#FCE7F3] bg-white p-4 shadow-sm transition-all duration-300 hover:border-[#F472B6] hover:shadow-xl hover:-translate-y-1"
                >
                  {/* Miniature SVG Preview */}
                  <div
                    onClick={() => navigate(`/builder/${d.baseType}?desain=${d.id}`)}
                    className="cursor-pointer overflow-hidden rounded-2xl transition-transform group-hover:scale-[1.01]"
                  >
                    <DesignPreview
                      base={d.baseType as BaseType}
                      beads={d.beads}
                      uidPrefix={`gal-${d.id}`}
                      tone={d.canvasTone}
                    />
                  </div>

                  {/* Card Info */}
                  <div className="mt-4 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2
                          onClick={() => navigate(`/builder/${d.baseType}?desain=${d.id}`)}
                          className="font-display text-lg font-bold text-[#372A3C] hover:text-[#DB2777] cursor-pointer transition-colors leading-snug"
                        >
                          {d.name}
                        </h2>
                        <p className="mt-1 text-xs text-[#8B7A90]">
                          Oleh <span className="font-semibold text-[#523B54]">{d.creator}</span>
                        </p>
                      </div>

                      {/* Like button */}
                      <button
                        type="button"
                        onClick={(e) => handleLike(d.id, e)}
                        className="flex items-center gap-1 rounded-full bg-[#FFF0F5] px-2.5 py-1 text-xs font-bold text-[#DB2777] border border-[#FCE7F3] hover:bg-[#FCE7F3] transition-colors"
                        title="Sukai desain ini"
                      >
                        <Heart className="h-3.5 w-3.5 fill-[#F472B6] text-[#F472B6]" />
                        <span>{d.likes || 0}</span>
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-[#A288A6] border-t border-[#FCE7F3] pt-2">
                      <span className="font-semibold text-[#DB2777]">
                        {BASE_TYPE_LABELS[d.baseType as BaseType] || d.baseType}
                      </span>
                      <span>
                        {d.beads.length} manik · {dateFmt.format(new Date(d.createdAt))}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="mt-4 flex items-center justify-between border-t border-[#FCE7F3] pt-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/builder/${d.baseType}?desain=${d.id}`)}
                      className="flex items-center gap-1 text-xs font-extrabold text-[#DB2777] hover:underline"
                    >
                      <Palette className="h-3.5 w-3.5" />
                      <span>Buka di Studio</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(d)}
                      className="flex items-center gap-1 text-xs font-bold text-[#A288A6] hover:text-[#EF4444] transition-colors"
                      title="Hapus desain"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border-2 border-[#FCE7F3] animate-scaleUp">
            <h3 className="font-display text-xl font-bold text-[#372A3C]">
              Hapus Desain?
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#6B5E70]">
              Apakah kamu yakin ingin menghapus rangkaian <strong>"{deleteTarget.name}"</strong>? Desain yang dihapus tidak dapat dipulihkan.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-full px-4 py-2 text-xs font-bold text-[#6B5E70] hover:bg-[#FDF2F8]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-full bg-[#EF4444] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#DC2626]"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
