import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  KeyRound,
  Layers,
  Lock,
  LogOut,
  Package,
  RotateCcw,
  Shield,
  Sparkles,
} from "lucide-react";
import AppHeader from "../components/AppHeader";
import { KEYCHAIN_COLORS, type KeychainColorId } from "../types/keychain";
import {
  STUDIO_IDS,
  STUDIO_LABELS,
  getLegacyStoreSettings,
  hasAdminSession,
  loginAdmin,
  logoutAdmin,
  type StudioId,
  type StudioStatus,
  updateAdminPin,
  useStoreSettings,
} from "../services/storeSettings";
import { useStoreSettingsContext } from "../contexts/StoreSettingsContext";

type AdminTab = "studios" | "stock" | "security";

const STATUS_OPTIONS: { id: StudioStatus; label: string }[] = [
  { id: "active", label: "Aktif" },
  { id: "coming_soon", label: "Coming Soon" },
  { id: "locked", label: "Terkunci" },
];

export default function Admin() {
  const {
    settings,
    loading: settingsLoading,
    error: settingsError,
    refreshSettings,
    importLegacySettings,
    updateSettings,
    resetSettings,
  } = useStoreSettingsContext();
  const [unlocked, setUnlocked] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [pin, setPin] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [tab, setTab] = useState<AdminTab>("studios");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [studioNotes, setStudioNotes] = useState<Record<StudioId, string>>(() => ({
    kalung: settings.studios.kalung.note ?? "",
    gelang: settings.studios.gelang.note ?? "",
    strap: settings.studios.strap.note ?? "",
  }));
  const [stockDrafts, setStockDrafts] = useState<Record<KeychainColorId, string>>(() => ({
    pink: String(settings.keychainStock.pink),
    hitam: String(settings.keychainStock.hitam),
    merah: String(settings.keychainStock.merah),
    biru: String(settings.keychainStock.biru),
  }));

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => {
      setToast((current) => (current === message ? null : current));
    }, 2800);
  };

  useEffect(() => {
    setStudioNotes({
      kalung: settings.studios.kalung.note ?? "",
      gelang: settings.studios.gelang.note ?? "",
      strap: settings.studios.strap.note ?? "",
    });
  }, [settings.studios]);

  useEffect(() => {
    setStockDrafts({
      pink: String(settings.keychainStock.pink),
      hitam: String(settings.keychainStock.hitam),
      merah: String(settings.keychainStock.merah),
      biru: String(settings.keychainStock.biru),
    });
  }, [settings.keychainStock]);

  useEffect(() => {
    let active = true;
    hasAdminSession()
      .then(async (authenticated) => {
        if (!active) return;
        setUnlocked(authenticated);
        if (authenticated) {
          const remote = await refreshSettings();
          const legacy = getLegacyStoreSettings();
          if (!remote.initialized && legacy) {
            await importLegacySettings(legacy);
            await refreshSettings();
          }
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLoginError(error instanceof Error ? error.message : "Sesi admin tidak dapat diperiksa.");
        }
      })
      .finally(() => {
        if (active) setAuthChecked(true);
      });
    return () => {
      active = false;
    };
  }, [importLegacySettings, refreshSettings]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await loginAdmin(pin.trim());
      setLoginError(null);
      setPin("");
      setUnlocked(true);
      const remote = await refreshSettings();
      const legacy = getLegacyStoreSettings();
      if (!remote.initialized && legacy) {
        await importLegacySettings(legacy);
        await refreshSettings();
      }
      notify("Selamat datang di panel admin ✨");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Login admin gagal.");
    }
  };

  const handleLogout = async () => {
    try {
      await logoutAdmin();
      setUnlocked(false);
      setPin("");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Logout gagal.");
    }
  };

  const stockTotal = useMemo(
    () => Object.values(settings.keychainStock).reduce((sum, value) => sum + value, 0),
    [settings.keychainStock],
  );

  const changeStock = async (colorId: keyof typeof settings.keychainStock, next: number) => {
    try {
      await updateSettings((current) => ({
        ...current,
        keychainStock: {
          ...current.keychainStock,
          [colorId]: Math.max(0, Math.round(next)),
        },
      }));
      notify("Stok keychain disimpan ✨");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Stok keychain gagal disimpan.");
    }
  };

  const changePin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPin.trim().length < 8) {
      notify("PIN baru minimal 8 karakter");
      return;
    }
    if (newPin.trim() !== confirmPin.trim()) {
      notify("Konfirmasi PIN belum sama");
      return;
    }
    try {
      await updateAdminPin(currentPin.trim(), newPin.trim());
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      notify("PIN admin berhasil diganti ✨");
    } catch (error) {
      notify(error instanceof Error ? error.message : "PIN admin gagal diganti.");
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-pastel-mesh flex items-center justify-center">
        <p className="text-sm font-semibold text-[#6B5E70]">Memeriksa sesi admin...</p>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-pastel-mesh flex flex-col">
        <AppHeader />
        <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-10">
          <form
            onSubmit={handleLogin}
            className="w-full rounded-3xl border-2 border-[#FCE7F3] bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FDF2F8] text-[#DB2777]">
                <Shield className="h-6 w-6" />
              </span>
              <div>
                <p className="meta-label text-[#DB2777]">MakeitYours</p>
                <h1 className="font-display text-2xl font-extrabold text-[#372A3C]">Admin Panel</h1>
              </div>
            </div>
            <p className="mb-4 text-sm text-[#6B5E70]">
              Masukkan PIN toko untuk mengatur status studio dan stok keychain.
            </p>
            <label className="meta-label mb-1 block text-[#8B7A90]">PIN Admin</label>
            <input
              type="password"
              inputMode="text"
              autoComplete="current-password"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              placeholder="PIN rahasia toko"
              className="w-full rounded-2xl border-2 border-[#FCE7F3] px-4 py-3 text-sm font-semibold text-[#372A3C] focus:border-[#F472B6] focus:outline-none"
            />
            {loginError && (
              <p className="mt-2 text-xs font-bold text-[#E11D48]" role="alert">{loginError}</p>
            )}
            <button type="submit" className="btn-pastel-primary mt-5 w-full">
              <Lock className="h-4 w-4" />
              Masuk
            </button>
            <p className="mt-3 text-center text-[11px] text-[#8B7A90]">
              PIN awal diatur melalui konfigurasi server.
            </p>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pastel-mesh flex flex-col">
      <AppHeader />
      {toast && (
        <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2 px-4" role="status">
          <div className="rounded-full border border-[#FBCFE8] bg-white px-5 py-2 text-center text-xs font-bold text-[#DB2777] shadow-lg">
            {toast}
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        {(settingsLoading || settingsError) && (
          <p
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              settingsError
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-[#FCE7F3] bg-white text-[#6B5E70]"
            }`}
            role={settingsError ? "alert" : "status"}
          >
            {settingsError ? `Pengaturan toko gagal dimuat: ${settingsError}` : "Memuat pengaturan toko..."}
          </p>
        )}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-1.5 rounded-full border border-[#FCE7F3] bg-white px-3 py-1.5 text-xs font-bold text-[#6B5E70]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Beranda
            </Link>
            <div>
              <p className="meta-label text-[#DB2777]">Dashboard toko</p>
              <h1 className="font-display text-2xl font-extrabold text-[#372A3C]">Admin MakeitYours</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="btn-pastel-outline !py-2 !px-4 !text-xs">
              <Eye className="h-3.5 w-3.5" />
              Lihat website
            </Link>
            <button type="button" onClick={handleLogout} className="btn-pastel-outline !py-2 !px-4 !text-xs">
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </header>

        <div className="mb-5 grid grid-cols-3 gap-2 rounded-2xl border border-[#FCE7F3] bg-white p-1.5">
          {([
            ["studios", "Status Studio", Layers],
            ["stock", "Stok Keychain", Package],
            ["security", "Keamanan", KeyRound],
          ] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 text-xs font-bold sm:text-sm ${
                tab === id
                  ? "bg-[#FDF2F8] text-[#DB2777] shadow-xs"
                  : "text-[#6B5E70] hover:bg-[#FFF8FA]"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{id === "studios" ? "Studio" : id === "stock" ? "Stok" : "PIN"}</span>
            </button>
          ))}
        </div>

        {tab === "studios" && (
          <section className="grid gap-4 md:grid-cols-3">
            {STUDIO_IDS.map((studioId) => {
              const studio = settings.studios[studioId];
              return (
                <article key={studioId} className="rounded-3xl border-2 border-[#FCE7F3] bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-display text-xl font-bold text-[#372A3C]">{STUDIO_LABELS[studioId]}</h2>
                    <Sparkles className="h-4 w-4 text-[#F472B6]" />
                  </div>
                  <div className="grid gap-2">
                    {STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={studio.status === option.id}
                        onClick={() => {
                          void updateSettings((current) => ({
                            ...current,
                            studios: {
                              ...current.studios,
                              [studioId]: { ...current.studios[studioId], status: option.id },
                            },
                          }))
                            .then(() => notify(`Studio ${STUDIO_LABELS[studioId]}: ${option.label}`))
                            .catch((error: unknown) => notify(
                              error instanceof Error ? error.message : "Status studio gagal disimpan.",
                            ));
                        }}
                        className={`rounded-2xl border-2 px-3 py-2 text-left text-sm font-bold ${
                          studio.status === option.id
                            ? "border-[#F472B6] bg-[#FDF2F8] text-[#DB2777]"
                            : "border-[#FCE7F3] text-[#6B5E70]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <label className="meta-label mt-4 mb-1 block text-[#8B7A90]">Catatan khusus</label>
                  <textarea
                    rows={3}
                    value={studioNotes[studioId]}
                    placeholder='Contoh: "Segera rilis 25 November!"'
                    onChange={(event) => {
                      setStudioNotes((current) => ({ ...current, [studioId]: event.target.value }));
                    }}
                    onBlur={() => {
                      const note = studioNotes[studioId];
                      if (note === (studio.note ?? "")) return;
                      void updateSettings((current) => ({
                        ...current,
                        studios: {
                          ...current.studios,
                          [studioId]: { ...current.studios[studioId], note },
                        },
                      }))
                        .then(() => notify("Catatan studio disimpan ✨"))
                        .catch((error: unknown) => notify(
                          error instanceof Error ? error.message : "Catatan studio gagal disimpan.",
                        ));
                    }}
                    className="w-full rounded-2xl border-2 border-[#FCE7F3] px-3 py-2 text-sm text-[#372A3C] focus:border-[#F472B6] focus:outline-none"
                  />
                </article>
              );
            })}
          </section>
        )}

        {tab === "stock" && (
          <section>
            <p className="mb-4 text-sm text-[#6B5E70]">
              Total stok semua warna: <strong className="text-[#DB2777]">{stockTotal}</strong>
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {KEYCHAIN_COLORS.map((color) => {
                const stock = settings.keychainStock[color.id];
                return (
                  <article key={color.id} className="rounded-3xl border-2 border-[#FCE7F3] bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-10 w-10 rounded-full border-2 border-white shadow"
                          style={{ backgroundColor: color.hex, boxShadow: `0 0 0 1px ${color.hexDark}` }}
                        />
                        <div>
                          <h2 className="font-display text-lg font-bold text-[#372A3C]">{color.label}</h2>
                          <p className="text-xs font-bold text-[#8B7A90]">{stock === 0 ? "Habis" : `Sisa ${stock}`}</p>
                        </div>
                      </div>
                    </div>
                    <label className="meta-label mb-1 block text-[#8B7A90]">Jumlah stok</label>
                    <input
                      type="number"
                      min={0}
                      value={stockDrafts[color.id]}
                      onChange={(event) => setStockDrafts((current) => ({
                        ...current,
                        [color.id]: event.target.value,
                      }))}
                      onBlur={() => {
                        const next = Number(stockDrafts[color.id]);
                        if (!Number.isFinite(next)) {
                          setStockDrafts((current) => ({ ...current, [color.id]: String(stock) }));
                          return;
                        }
                        void changeStock(color.id, next);
                      }}
                      className="w-full rounded-2xl border-2 border-[#FCE7F3] px-3 py-2 text-sm font-bold text-[#372A3C] focus:border-[#F472B6] focus:outline-none"
                    />
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className="btn-pastel-outline min-h-[44px] !py-2 !text-xs font-bold"
                        onClick={() => changeStock(color.id, stock + 1)}
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        disabled={stock <= 0}
                        className="btn-pastel-outline min-h-[44px] !py-2 !text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={() => changeStock(color.id, stock - 1)}
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        className="btn-pastel-outline min-h-[44px] !py-2 !text-xs font-bold text-[#E11D48] border-[#FECDD3]"
                        onClick={() => changeStock(color.id, 0)}
                      >
                        Set 0 (Habis)
                      </button>
                      <button
                        type="button"
                        className="btn-pastel-primary min-h-[44px] !py-2 !text-xs font-bold"
                        onClick={() => changeStock(color.id, stock + 10)}
                      >
                        Restok (+10)
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {tab === "security" && (
          <section className="grid gap-4 md:grid-cols-2">
            <form onSubmit={changePin} className="rounded-3xl border-2 border-[#FCE7F3] bg-white p-5 shadow-sm">
              <h2 className="font-display text-xl font-bold text-[#372A3C]">Ganti PIN admin</h2>
              <p className="mt-1 mb-4 text-xs text-[#8B7A90]">PIN dikelola server dan tidak disimpan di browser.</p>
              <label className="meta-label mb-1 block text-[#8B7A90]">PIN saat ini</label>
              <input
                type="password"
                required
                value={currentPin}
                onChange={(event) => setCurrentPin(event.target.value)}
                placeholder="Masukkan PIN lama"
                className="mb-3 w-full rounded-2xl border-2 border-[#FCE7F3] px-3 py-2 text-sm font-semibold text-[#372A3C] focus:border-[#F472B6] focus:outline-none"
              />
              <label className="meta-label mb-1 block text-[#8B7A90]">PIN baru</label>
              <input
                type="password"
                required
                value={newPin}
                onChange={(event) => setNewPin(event.target.value)}
                placeholder="Minimal 8 karakter"
                className="mb-3 w-full rounded-2xl border-2 border-[#FCE7F3] px-3 py-2 text-sm font-semibold text-[#372A3C] focus:border-[#F472B6] focus:outline-none"
              />
              <label className="meta-label mb-1 block text-[#8B7A90]">Konfirmasi PIN baru</label>
              <input
                type="password"
                required
                value={confirmPin}
                onChange={(event) => setConfirmPin(event.target.value)}
                placeholder="Ulangi PIN baru"
                className="w-full rounded-2xl border-2 border-[#FCE7F3] px-3 py-2 text-sm font-semibold text-[#372A3C] focus:border-[#F472B6] focus:outline-none"
              />
              <button type="submit" className="btn-pastel-primary min-h-[44px] mt-4 w-full !text-sm">Simpan PIN baru</button>
            </form>

            <article className="rounded-3xl border-2 border-[#FCE7F3] bg-white p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-[#372A3C]">Reset & pintasan</h2>
                <p className="mt-1 mb-4 text-xs text-[#8B7A90]">
                  Reset mengembalikan status studio dan stok ke nilai awal. PIN admin tidak berubah.
                </p>
                <div className="rounded-2xl bg-[#FFF8FA] p-3 text-xs text-[#8B7A90] border border-[#FCE7F3] mb-4">
                  Nilai awal: Semua studio <strong>Aktif</strong> dan stok masing-masing warna <strong>10</strong>.
                </div>
              </div>
              <div>
                <button
                  type="button"
                  className="btn-pastel-outline min-h-[44px] w-full !justify-center text-[#E11D48] border-[#FECDD3]"
                  onClick={() => {
                    if (window.confirm("Apakah Anda yakin ingin mengembalikan semua status studio, stok keychain, dan PIN ke default pabrik?")) {
                      void resetSettings()
                        .then(() => notify("Pengaturan berhasil dikembalikan ke nilai awal ✨"))
                        .catch((error: unknown) => notify(
                          error instanceof Error ? error.message : "Pengaturan gagal direset.",
                        ));
                    }
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset ke pengaturan default
                </button>
                <Link to="/" className="btn-pastel-primary min-h-[44px] mt-3 w-full !text-sm">
                  <Eye className="h-4 w-4" />
                  Buka website publik
                </Link>
              </div>
            </article>
          </section>
        )}
      </main>
    </div>
  );
}
