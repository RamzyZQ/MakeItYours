// Local storage and export service for MakeitYours
import type { DesignItem, BaseType, BeadRecord } from "../types/beads";

const STORAGE_KEY = "makeityours_designs_v2";
const PROFILE_KEY = "makeityours_user_profile";

export interface UserProfile {
  name: string;
  avatar: string;
  bio: string;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "Basa",
  avatar: "🌸",
  bio: "Pencinta manik-manik & pernak-pernik pastel estetik ✨",
};

// Cute pre-made sample designs showcasing pastel combinations
const SEED_DESIGNS: DesignItem[] = [
  {
    id: "sample-1",
    name: "Sakura Dream Choker",
    baseType: "kalung",
    creator: "MakeitYours Studio",
    createdAt: "2026-10-18T10:00:00.000Z",
    updatedAt: "2026-10-18T10:00:00.000Z",
    likes: 24,
    canvasTone: "pastel-pink",
    tags: ["sakura", "dreamy", "sweet"],
    beads: [
      { type: "sakura-pink-round", s: 630 },
      { type: "sakura-flower", s: 680 },
      { type: "peach-heart", s: 730 },
      { type: "sakura-pink-round", s: 780 },
      { type: "pearl-oval", s: 830 },
      { type: "lavender-star", s: 880 },
      { type: "sakura-flower", s: 930 },
      { type: "taro-milk-round", s: 980 },
    ],
  },
  {
    id: "sample-2",
    name: "Cotton Candy Charm",
    baseType: "gelang",
    creator: "Basa",
    createdAt: "2026-10-19T14:30:00.000Z",
    updatedAt: "2026-10-19T14:30:00.000Z",
    likes: 38,
    canvasTone: "pastel-lilac",
    tags: ["cotton candy", "pastel", "bubble"],
    beads: [
      { type: "baby-blue-round", s: 120 },
      { type: "marshmallow-cube", s: 175 },
      { type: "candy-swirl-donut", s: 230 },
      { type: "sweet-berry-round", s: 285 },
      { type: "vanilla-cloud-heart", s: 340 },
      { type: "butter-cube", s: 395 },
      { type: "mint-donut", s: 450 },
      { type: "sakura-pink-round", s: 505 },
      { type: "lavender-star", s: 560 },
      { type: "crystal-prism", s: 615 },
    ],
  },
  {
    id: "sample-3",
    name: "Pastel Meadow Phone Strap",
    baseType: "strap",
    creator: "MakeitYours Studio",
    createdAt: "2026-10-20T09:15:00.000Z",
    updatedAt: "2026-10-20T09:15:00.000Z",
    likes: 42,
    canvasTone: "pastel-mint",
    tags: ["phone strap", "daisy", "matcha"],
    beads: [
      { type: "daisy-flower", s: 180 },
      { type: "matcha-cube", s: 235 },
      { type: "mint-donut", s: 290 },
      { type: "starlight-apricot", s: 345 },
      { type: "butter-cube", s: 400 },
      { type: "pearl-oval", s: 455 },
      { type: "daisy-flower", s: 510 },
      { type: "sweet-berry-round", s: 565 },
    ],
  },
];

export function getLocalDesigns(): DesignItem[] {
  if (typeof window === "undefined") return SEED_DESIGNS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DESIGNS));
      return SEED_DESIGNS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_DESIGNS;
  } catch {
    return SEED_DESIGNS;
  }
}

export function saveLocalDesign(design: Omit<DesignItem, "id" | "createdAt" | "updatedAt" | "likes"> & { id?: string }): DesignItem {
  const designs = getLocalDesigns();
  const now = new Date().toISOString();

  if (design.id) {
    // Update existing
    const idx = designs.findIndex((d) => d.id === design.id);
    if (idx !== -1) {
      const updated: DesignItem = {
        ...designs[idx],
        ...design,
        id: design.id,
        updatedAt: now,
      };
      designs[idx] = updated;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
      return updated;
    }
  }

  // Create new
  const newItem: DesignItem = {
    id: `des-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: design.name.trim() || "Rangkaian Pastel Cantik",
    baseType: design.baseType,
    beads: design.beads,
    creator: design.creator || getUserProfile().name,
    createdAt: now,
    updatedAt: now,
    likes: 1,
    canvasTone: design.canvasTone || "pastel-pink",
    tags: design.tags || ["manik", design.baseType],
  };

  designs.unshift(newItem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
  return newItem;
}

export function getDesignById(id: string): DesignItem | null {
  const designs = getLocalDesigns();
  return designs.find((d) => d.id === id) ?? null;
}

export function deleteLocalDesign(id: string): boolean {
  const designs = getLocalDesigns();
  const filtered = designs.filter((d) => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export function likeLocalDesign(id: string): number {
  const designs = getLocalDesigns();
  const target = designs.find((d) => d.id === id);
  if (target) {
    target.likes = (target.likes || 0) + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
    return target.likes;
  }
  return 0;
}

export function getUserProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function setUserProfile(profile: Partial<UserProfile>): UserProfile {
  const curr = getUserProfile();
  const next = { ...curr, ...profile };
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  } catch {
    // safe fallback
  }
  return next;
}

/**
 * High-res PNG export from SVG element
 */
export async function downloadSvgAsPng(svgElement: SVGSVGElement, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const serializer = new XMLSerializer();
      let source = serializer.serializeToString(svgElement);

      if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = 2; // 2x retina clarity
        canvas.width = (svgElement.viewBox.baseVal.width || 1000) * scale;
        canvas.height = (svgElement.viewBox.baseVal.height || 640) * scale;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context failed"));
          return;
        }

        // Draw soft pastel gradient background
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, "#FFF5F8");
        grad.addColorStop(0.5, "#FBF4FE");
        grad.addColorStop(1, "#F0FAF6");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Watermark MakeitYours brand logo in corner
        ctx.font = "bold 32px 'Quicksand', 'Plus Jakarta Sans', sans-serif";
        ctx.fillStyle = "#F472B6";
        ctx.fillText("MakeitYours 🌸", 40, canvas.height - 40);

        ctx.font = "500 20px 'Plus Jakarta Sans', sans-serif";
        ctx.fillStyle = "#A78BFA";
        ctx.fillText("Studio Manik Interaktif", 40, canvas.height - 15);

        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(blobURL);

        const a = document.createElement("a");
        a.download = `${filename || "makeityours-design"}.png`;
        a.href = canvas.toDataURL("image/png");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        resolve();
      };

      image.onerror = (e) => {
        URL.revokeObjectURL(blobURL);
        reject(e);
      };

      image.src = blobURL;
    } catch (err) {
      reject(err);
    }
  });
}
