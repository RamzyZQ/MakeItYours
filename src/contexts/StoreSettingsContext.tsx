/**
 * StoreSettingsContext — single global fetch untuk store settings.
 * Semua page (Home, Builder, Keychain) cukup pakai useStoreSettingsContext()
 * sehingga tidak ada duplicate request ke /api/store-settings.
 */
import React, { createContext, useContext, type ReactNode } from "react";
import { useStoreSettings, type StoreSettings } from "../services/storeSettings";

interface StoreSettingsContextValue {
  settings: StoreSettings;
  initialized: boolean;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<{ settings: StoreSettings; initialized: boolean }>;
  updateSettings: (
    patch: Partial<StoreSettings> | ((current: StoreSettings) => StoreSettings),
  ) => Promise<StoreSettings>;
  resetSettings: () => Promise<StoreSettings>;
  importLegacySettings: (legacy: StoreSettings) => Promise<{ settings: StoreSettings; initialized: boolean }>;
}

const StoreSettingsContext = createContext<StoreSettingsContextValue | null>(null);

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const value = useStoreSettings();
  return (
    <StoreSettingsContext.Provider value={value}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettingsContext(): StoreSettingsContextValue {
  const ctx = useContext(StoreSettingsContext);
  if (!ctx) {
    throw new Error("useStoreSettingsContext must be used inside <StoreSettingsProvider>");
  }
  return ctx;
}
