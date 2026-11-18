import type { PhotoBoothSide } from "./templates";

export type PhotoBoothTool = "hand" | "move" | "brush" | "eraser" | "text" | "sticker";

export interface PhotoAdjustment {
  zoom: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  panX: number;
  panY: number;
}

export interface BrushStroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  mode: "brush" | "eraser";
}

export interface EditorObject {
  id: string;
  kind: "text" | "sticker" | "image";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  text?: string;
  emoji?: string;
  src?: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
}

export interface PhotoBoothDocument {
  strokes: BrushStroke[];
  objects: EditorObject[];
  photoAdjustments: PhotoAdjustment[];
  selectedObjectId: string | null;
  selectedPhotoIndex: number | null;
}

export interface SideHistory {
  past: PhotoBoothDocument[];
  future: PhotoBoothDocument[];
}

export type PhotoBoothDocuments = Record<PhotoBoothSide, PhotoBoothDocument>;

export const DEFAULT_PHOTO_ADJUSTMENT: PhotoAdjustment = {
  zoom: 1,
  rotation: 0,
  flipX: false,
  flipY: false,
  panX: 0,
  panY: 0,
};

export function createPhotoBoothDocument(): PhotoBoothDocument {
  return {
    strokes: [],
    objects: [],
    photoAdjustments: [],
    selectedObjectId: null,
    selectedPhotoIndex: null,
  };
}
