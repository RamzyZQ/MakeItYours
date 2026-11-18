export const KEYCHAIN_COLOR_IDS = ["pink", "hitam", "merah", "biru"] as const;
export type KeychainColorId = (typeof KEYCHAIN_COLOR_IDS)[number];

export interface KeychainColor {
  id: KeychainColorId;
  label: string;
  hex: string;
  hexDark: string;
  hexLight: string;
}

export const KEYCHAIN_COLORS: KeychainColor[] = [
  { id: "pink", label: "Pink", hex: "#F48FB1", hexDark: "#EC407A", hexLight: "#FCE4EC" },
  { id: "hitam", label: "Hitam", hex: "#2B2B2B", hexDark: "#111111", hexLight: "#6B7280" },
  { id: "merah", label: "Merah", hex: "#E53935", hexDark: "#C62828", hexLight: "#FFCDD2" },
  { id: "biru", label: "Biru", hex: "#81D4FA", hexDark: "#4FC3F7", hexLight: "#E1F5FE" },
];

export function getKeychainColor(id: KeychainColorId): KeychainColor {
  return KEYCHAIN_COLORS.find((c) => c.id === id) ?? KEYCHAIN_COLORS[0];
}

export interface FrameModel {
  id: KeychainColorId;
  label: string;
  color: KeychainColor;
}

export const FRAME_MODELS: FrameModel[] = KEYCHAIN_COLORS.map((color) => ({
  id: color.id,
  label: color.label,
  color,
}));

export type FrameModelId = KeychainColorId;

export interface KeychainOrder {
  frameModel: FrameModelId;
  photos: (string | null)[];
  backPhotos?: (string | null)[];
  customerName: string;
  note: string;
  templateName?: string;
  photoSlotCount?: number;
  backPhotoSlotCount?: number;
}

export const DEFAULT_KEYCHAIN_ORDER: KeychainOrder = {
  frameModel: "pink",
  photos: [null, null, null],
  customerName: "",
  note: "",
};
