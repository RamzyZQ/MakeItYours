import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Heart, Palette, Volume2, VolumeX, Menu, X, KeyRound } from "lucide-react";
import { getUserProfile, setUserProfile, type UserProfile } from "../services/storage";
import { chime } from "../game/sim";
import { getFirstOpenStudio, useStoreSettings } from "../services/storeSettings";

export default function AppHeader() {
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [newName, setNewName] = useState(profile.name);
  const [newAvatar, setNewAvatar] = useState(profile.avatar);

  const { settings, error: settingsError } = useStoreSettings();
  const studioPath = `/builder/${getFirstOpenStudio(settings) ?? "kalung"}`;
  const AVATAR_OPTIONS = ["🌸", "✨", "🎀", "💖", "🍓", "🧁", "🌼", "🍡", "🧸", "🦄"];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = setUserProfile({ name: newName.trim() || "Pencipta Manik", avatar: newAvatar });
    setProfile(updated);
    setProfileOpen(false);
  };

  const toggleSound = () => {
    chime.enabled = !soundOn;
    setSoundOn(!soundOn);
    if (!soundOn) {
      chime.playPop(1.2);
    }
  };

  return (
    <>
      {settingsError && (
        <div
          className="bg-red-50 px-4 py-2 text-center text-xs font-semibold text-red-700"
          role="alert"
        >
          Pengaturan toko belum dapat dimuat. Sebagian status dan stok mungkin belum terbaru.
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-[#FCE7F3] bg-[#FFF8FA]/90 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Brand Logo */}
          <Link
            to="/"
            className="group flex items-center gap-2.5 transition-transform hover:scale-[1.02]"
            aria-label="MakeitYours — Beranda"
          >
            <div className="flex min-w-0 items-center">
              <span className="block h-9 w-[118px] overflow-hidden sm:h-10 sm:w-[136px]">
                <img
                  src="/logo.png"
                  alt="MakeitYours"
                  className="h-full w-full object-cover object-center"
                />
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                  isActive
                    ? "bg-[#FDF2F8] text-[#DB2777] shadow-xs border border-[#FBCFE8]"
                    : "text-[#6B5E70] hover:bg-[#FFF0F5] hover:text-[#DB2777]"
                }`
              }
            >
              <span>Beranda</span>
            </NavLink>
            <NavLink
              to={studioPath}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                  isActive
                    ? "bg-[#FDF2F8] text-[#DB2777] shadow-xs border border-[#FBCFE8]"
                    : "text-[#6B5E70] hover:bg-[#FFF0F5] hover:text-[#DB2777]"
                }`
              }
            >
              <Palette className="h-4 w-4 text-[#C084FC]" />
              <span>Studio</span>
            </NavLink>
            <NavLink
              to="/keychain"
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                  isActive
                    ? "bg-[#FDF2F8] text-[#DB2777] shadow-xs border border-[#FBCFE8]"
                    : "text-[#6B5E70] hover:bg-[#FFF0F5] hover:text-[#DB2777]"
                }`
              }
            >
              <KeyRound className="h-4 w-4 text-[#F472B6]" />
              <span>Keychain</span>
            </NavLink>
            <NavLink
              to="/galeri"
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                  isActive
                    ? "bg-[#FDF2F8] text-[#DB2777] shadow-xs border border-[#FBCFE8]"
                    : "text-[#6B5E70] hover:bg-[#FFF0F5] hover:text-[#DB2777]"
                }`
              }
            >
              <Heart className="h-4 w-4 text-[#F472B6]" />
              <span>Galeri</span>
            </NavLink>
          </nav>

          {/* Controls: Sound + Profile + Mobile Menu */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSound}
              title={soundOn ? "Matikan Suara Pop" : "Nyalakan Suara Pop"}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#FCE7F3] text-[#8B7A90] hover:text-[#DB2777] hover:border-[#F472B6] transition-colors shadow-xs"
            >
              {soundOn ? <Volume2 className="h-4 w-4 text-[#F472B6]" /> : <VolumeX className="h-4 w-4" />}
            </button>

            {/* Profile trigger */}
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-2 rounded-full bg-white pl-2 pr-3 py-1.5 border border-[#FCE7F3] shadow-xs hover:border-[#F472B6] transition-all"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FCE7F3] text-sm">
                {profile.avatar}
              </span>
              <span className="hidden sm:inline font-bold text-xs text-[#523B54] max-w-[80px] truncate">
                {profile.name}
              </span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#FCE7F3] text-[#523B54]"
              aria-label="Buka Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#FCE7F3] bg-[#FFF8FA] px-4 py-4 space-y-2 shadow-lg animate-fadeIn">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-[#523B54] hover:bg-[#FDF2F8] hover:text-[#DB2777]"
            >
              <span>Beranda</span>
            </Link>
            <Link
              to={studioPath}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-[#523B54] hover:bg-[#FDF2F8] hover:text-[#DB2777]"
            >
              <Palette className="h-4 w-4 text-[#C084FC]" />
              <span>Studio Rangkai</span>
            </Link>
            <Link
              to="/keychain"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-[#523B54] hover:bg-[#FDF2F8] hover:text-[#DB2777]"
            >
              <KeyRound className="h-4 w-4 text-[#F472B6]" />
              <span>Keychain Custom</span>
            </Link>
            <Link
              to="/galeri"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-[#523B54] hover:bg-[#FDF2F8] hover:text-[#DB2777]"
            >
              <Heart className="h-4 w-4 text-[#F472B6]" />
              <span>Galeri Kreasi</span>
            </Link>
            <div className="pt-2 border-t border-[#FCE7F3] flex justify-between items-center text-xs text-[#8B7A90] px-3">
              <span>Creator: {profile.avatar} {profile.name}</span>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setProfileOpen(true);
                }}
                className="text-[#DB2777] font-bold underline"
              >
                Ubah Profil
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Profile Customize Modal */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border-2 border-[#FCE7F3] animate-scaleUp">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-[#372A3C] flex items-center gap-2">
                <span>Profil Pencipta</span>
                <span>✨</span>
              </h3>
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="h-8 w-8 rounded-full bg-[#FDF2F8] text-[#6B5E70] flex items-center justify-center hover:bg-[#FCE7F3]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
              <div>
                <label className="meta-label text-[#8B7A90] block mb-2">Pilih Avatar Imut</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewAvatar(emoji)}
                      className={`h-10 w-10 text-xl rounded-2xl flex items-center justify-center transition-all ${
                        newAvatar === emoji
                          ? "bg-[#FDF2F8] border-2 border-[#F472B6] scale-110 shadow-xs"
                          : "bg-[#FAFAFA] border border-[#F3F4F6] hover:bg-[#FDF2F8]"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="meta-label text-[#8B7A90] block mb-1">Nama Panggilan Creator</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={30}
                  placeholder="Contoh: Basa, Lala, Kimi"
                  className="w-full rounded-2xl border-2 border-[#FCE7F3] px-4 py-2.5 text-sm font-semibold text-[#372A3C] focus:border-[#F472B6] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  className="rounded-full px-4 py-2 text-xs font-bold text-[#8B7A90] hover:bg-[#FDF2F8]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-pastel-primary !py-2 !px-5 !text-xs"
                >
                  Simpan Profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
