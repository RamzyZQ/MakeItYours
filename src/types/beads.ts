// Shared MakeitYours types and constants

export const BASE_TYPES = ["kalung", "gelang", "strap"] as const;
export type BaseType = (typeof BASE_TYPES)[number];

export interface BeadRecord {
  /** bead definition id from the catalog */
  type: string;
  /** arc-length position along the string path (viewBox units) */
  s: number;
}

export const BASE_TYPE_LABELS: Record<BaseType, string> = {
  kalung: "Rantai Kalung",
  gelang: "Tali Gelang",
  strap: "Phone Strap",
};

export const BASE_TYPE_DESCRIPTIONS: Record<BaseType, string> = {
  kalung: "Kurva-U anggun · manik meluncur dan menumpuk di lekukan tengah",
  gelang: "Lingkar penuh manis · manik mengalir memutari tali pergelangan",
  strap: "Loop oval memanjang · sempurna untuk gantungan HP, tas, & kunci",
};

export const MAX_BEADS_PER_DESIGN = 24;

export interface DesignItem {
  id: string;
  name: string;
  baseType: BaseType;
  beads: BeadRecord[];
  creator: string;
  createdAt: string;
  updatedAt: string;
  likes: number;
  canvasTone?: "pastel-pink" | "pastel-lilac" | "pastel-mint" | "pastel-cream" | "pastel-sky";
  tags?: string[];
}
