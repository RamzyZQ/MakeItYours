import { normalizeStoreSettings, type StoreSettings } from "../src/types/storeSettings.js";
import { getOrderRedis } from "./orderStorage.js";

export const STORE_SETTINGS_KEY = "miy:store-settings";
export const ADMIN_PIN_HASH_KEY = "miy:admin-pin-hash";

export async function readStoreSettings(): Promise<{ settings: StoreSettings; initialized: boolean }> {
  const raw = await getOrderRedis().get<unknown>(STORE_SETTINGS_KEY);
  if (raw === null || raw === undefined) {
    return { settings: normalizeStoreSettings(null), initialized: false };
  }

  let parsed: unknown;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("Data pengaturan toko di Upstash tidak valid.");
    }
  } else {
    parsed = raw;
  }
  return { settings: normalizeStoreSettings(parsed), initialized: true };
}

export async function writeStoreSettings(value: unknown): Promise<StoreSettings> {
  const settings = normalizeStoreSettings(value);
  await getOrderRedis().set(STORE_SETTINGS_KEY, settings);
  return settings;
}

export async function initializeStoreSettings(value: unknown): Promise<StoreSettings> {
  const settings = normalizeStoreSettings(value);
  await getOrderRedis().set(STORE_SETTINGS_KEY, settings, { nx: true });
  return (await readStoreSettings()).settings;
}
