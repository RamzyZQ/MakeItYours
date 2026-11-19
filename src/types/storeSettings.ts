import type { BaseType } from "./beads";
import type { KeychainColorId } from "./keychain";

export type StudioStatus = "active" | "coming_soon" | "locked";
export type StudioId = BaseType;

export interface StudioSetting {
  status: StudioStatus;
  note?: string;
}

export interface StoreSettings {
  studios: Record<StudioId, StudioSetting>;
  keychainStock: Record<KeychainColorId, number>;
}

export const LEGACY_STORE_SETTINGS_KEY = "makeityours_store_settings";

export const STUDIO_IDS = ["kalung", "gelang", "strap"] as const satisfies readonly StudioId[];

export const STUDIO_LABELS: Record<StudioId, string> = {
  kalung: "Kalung",
  gelang: "Gelang",
  strap: "Strap",
};

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  studios: {
    kalung: { status: "active", note: "" },
    gelang: { status: "active", note: "" },
    strap: { status: "active", note: "" },
  },
  keychainStock: {
    pink: 10,
    hitam: 10,
    merah: 10,
    biru: 10,
  },
};

function isStudioStatus(value: unknown): value is StudioStatus {
  return value === "active" || value === "coming_soon" || value === "locked";
}

function asStock(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.round(parsed));
}

function parseStudio(value: unknown, fallback: StudioSetting): StudioSetting {
  if (typeof value !== "object" || value === null) return fallback;
  const record = value as { status?: unknown; note?: unknown };
  return {
    status: isStudioStatus(record.status) ? record.status : fallback.status,
    note: typeof record.note === "string" ? record.note : fallback.note ?? "",
  };
}

export function normalizeStoreSettings(value: unknown): StoreSettings {
  if (typeof value !== "object" || value === null) return DEFAULT_STORE_SETTINGS;
  const record = value as {
    studios?: Partial<StoreSettings["studios"]>;
    keychainStock?: Partial<StoreSettings["keychainStock"]>;
  };
  const studios = record.studios ?? DEFAULT_STORE_SETTINGS.studios;
  const stock = record.keychainStock ?? DEFAULT_STORE_SETTINGS.keychainStock;

  return {
    studios: {
      kalung: parseStudio(studios.kalung, DEFAULT_STORE_SETTINGS.studios.kalung),
      gelang: parseStudio(studios.gelang, DEFAULT_STORE_SETTINGS.studios.gelang),
      strap: parseStudio(studios.strap, DEFAULT_STORE_SETTINGS.studios.strap),
    },
    keychainStock: {
      pink: asStock(stock.pink, DEFAULT_STORE_SETTINGS.keychainStock.pink),
      hitam: asStock(stock.hitam, DEFAULT_STORE_SETTINGS.keychainStock.hitam),
      merah: asStock(stock.merah, DEFAULT_STORE_SETTINGS.keychainStock.merah),
      biru: asStock(stock.biru, DEFAULT_STORE_SETTINGS.keychainStock.biru),
    },
  };
}
