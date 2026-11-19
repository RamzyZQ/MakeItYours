import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_STORE_SETTINGS,
  LEGACY_STORE_SETTINGS_KEY,
  normalizeStoreSettings,
  type StoreSettings,
} from "../types/storeSettings";
import type { StudioId, StudioStatus } from "../types/storeSettings";

export type {
  StudioId,
  StudioSetting,
  StudioStatus,
  StoreSettings,
} from "../types/storeSettings";
export { STUDIO_IDS, STUDIO_LABELS } from "../types/storeSettings";

interface StoreSettingsResponse {
  settings: StoreSettings;
  initialized: boolean;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const payload = await response.json() as { error?: string } & T;
  if (!response.ok) {
    throw new Error(payload.error || `Permintaan gagal (${response.status}).`);
  }
  return payload;
}

export async function fetchStoreSettings(): Promise<StoreSettingsResponse> {
  const result = await requestJson<StoreSettingsResponse>("/api/store-settings");
  return {
    settings: normalizeStoreSettings(result.settings),
    initialized: result.initialized,
  };
}

export async function saveStoreSettings(settings: StoreSettings): Promise<StoreSettingsResponse> {
  const result = await requestJson<StoreSettingsResponse>("/api/store-settings", {
    method: "PUT",
    body: JSON.stringify({ settings }),
  });
  return {
    settings: normalizeStoreSettings(result.settings),
    initialized: result.initialized,
  };
}

export async function initializeStoreSettings(settings: StoreSettings): Promise<StoreSettingsResponse> {
  const result = await requestJson<StoreSettingsResponse>("/api/store-settings/initialize", {
    method: "POST",
    body: JSON.stringify({ settings }),
  });
  return {
    settings: normalizeStoreSettings(result.settings),
    initialized: result.initialized,
  };
}

export function getLegacyStoreSettings(): StoreSettings | null {
  try {
    const raw = window.localStorage.getItem(LEGACY_STORE_SETTINGS_KEY);
    return raw ? normalizeStoreSettings(JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

export async function loginAdmin(pin: string): Promise<void> {
  await requestJson("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ pin }),
  });
}

export async function logoutAdmin(): Promise<void> {
  await requestJson("/api/admin/session", { method: "DELETE" });
}

export async function hasAdminSession(): Promise<boolean> {
  const result = await requestJson<{ authenticated: boolean }>("/api/admin/session");
  return result.authenticated;
}

export async function updateAdminPin(currentPin: string, newPin: string): Promise<void> {
  await requestJson("/api/admin/pin", {
    method: "POST",
    body: JSON.stringify({ currentPin, newPin }),
  });
}

export function isStudioOpen(status: StudioStatus): boolean {
  return status === "active";
}

export function studioStatusLabel(status: StudioStatus): string {
  if (status === "coming_soon") return "Segera Hadir";
  if (status === "locked") return "Terkunci";
  return "Aktif";
}

export function getFirstOpenStudio(settings: StoreSettings) {
  return (["kalung", "gelang", "strap"] as const satisfies readonly StudioId[]).find((id) =>
    isStudioOpen(settings.studios[id].status),
  ) ?? null;
}

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const settingsRef = useRef(settings);
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  const applyResponse = useCallback((result: StoreSettingsResponse) => {
    settingsRef.current = result.settings;
    setSettings(result.settings);
    setInitialized(result.initialized);
  }, []);

  const refreshSettings = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchStoreSettings();
      applyResponse(result);
      setError(null);
      return result;
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Pengaturan toko gagal dimuat.";
      setError(message);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, [applyResponse]);

  useEffect(() => {
    void refreshSettings().catch(() => undefined);
  }, [refreshSettings]);

  const updateSettings = useCallback(
    (patch: Partial<StoreSettings> | ((current: StoreSettings) => StoreSettings)) => {
      const operation = queueRef.current.then(async () => {
        const current = settingsRef.current;
        const next = normalizeStoreSettings(
          typeof patch === "function" ? patch(current) : { ...current, ...patch },
        );
        const result = await saveStoreSettings(next);
        applyResponse(result);
        setError(null);
        return result.settings;
      });
      queueRef.current = operation.then(() => undefined, () => undefined);
      return operation;
    },
    [applyResponse],
  );

  const resetSettings = useCallback(
    () => updateSettings(DEFAULT_STORE_SETTINGS),
    [updateSettings],
  );

  const importLegacySettings = useCallback(async (legacySettings: StoreSettings) => {
    const result = await initializeStoreSettings(legacySettings);
    applyResponse(result);
    return result;
  }, [applyResponse]);

  return {
    settings,
    initialized,
    loading,
    error,
    refreshSettings,
    updateSettings,
    resetSettings,
    importLegacySettings,
  };
}
