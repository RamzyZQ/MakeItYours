// Cute pastel bead catalog: definitions + SVG glyph rendering for MakeitYours
import React from "react";

export type BeadShape =
  | "round"
  | "faceted"
  | "cube"
  | "star"
  | "heart"
  | "donut"
  | "oval"
  | "flower";

export interface BeadDef {
  id: string;
  name: string;
  shape: BeadShape;
  category: "candy" | "pearl" | "nature" | "crystal";
  color: string;
  shade: string;
  light: string;
  r: number;
}

export const BEADS: BeadDef[] = [
  {
    id: "sakura-pink-round",
    name: "Sakura Pink",
    shape: "round",
    category: "pearl",
    color: "#F472B6",
    shade: "#DB2777",
    light: "#FCE7F3",
    r: 26,
  },
  {
    id: "lavender-star",
    name: "Lilac Star",
    shape: "star",
    category: "candy",
    color: "#C084FC",
    shade: "#9333EA",
    light: "#F3E8FF",
    r: 28,
  },
  {
    id: "peach-heart",
    name: "Peach Heart",
    shape: "heart",
    category: "candy",
    color: "#FB923C",
    shade: "#EA580C",
    light: "#FFEDD5",
    r: 26,
  },
  {
    id: "mint-donut",
    name: "Minty Glaze",
    shape: "donut",
    category: "candy",
    color: "#4ADE80",
    shade: "#16A34A",
    light: "#DCFCE7",
    r: 28,
  },
  {
    id: "butter-cube",
    name: "Buttercream",
    shape: "cube",
    category: "candy",
    color: "#FACC15",
    shade: "#CA8A04",
    light: "#FEF9C3",
    r: 25,
  },
  {
    id: "baby-blue-round",
    name: "Sky Cotton",
    shape: "round",
    category: "pearl",
    color: "#60A5FA",
    shade: "#2563EB",
    light: "#DBEAFE",
    r: 26,
  },
  {
    id: "daisy-flower",
    name: "Daisy Blossom",
    shape: "flower",
    category: "nature",
    color: "#FFFFFF",
    shade: "#E2E8F0",
    light: "#FEF08A",
    r: 28,
  },
  {
    id: "sakura-flower",
    name: "Cherry Petal",
    shape: "flower",
    category: "nature",
    color: "#FDA4AF",
    shade: "#F43F5E",
    light: "#FFE4E6",
    r: 28,
  },
  {
    id: "sweet-berry-round",
    name: "Berry Bubble",
    shape: "round",
    category: "candy",
    color: "#FB7185",
    shade: "#E11D48",
    light: "#FFE4E6",
    r: 26,
  },
  {
    id: "candy-swirl-donut",
    name: "Sugar Donut",
    shape: "donut",
    category: "candy",
    color: "#F472B6",
    shade: "#BE185D",
    light: "#FDF2F8",
    r: 28,
  },
  {
    id: "vanilla-cloud-heart",
    name: "Cloud Heart",
    shape: "heart",
    category: "candy",
    color: "#93C5FD",
    shade: "#3B82F6",
    light: "#EFF6FF",
    r: 26,
  },
  {
    id: "marshmallow-cube",
    name: "Marshmallow",
    shape: "cube",
    category: "candy",
    color: "#E9D5FF",
    shade: "#A855F7",
    light: "#FAF5FF",
    r: 25,
  },
  {
    id: "crystal-prism",
    name: "Prism Jewel",
    shape: "faceted",
    category: "crystal",
    color: "#A7F3D0",
    shade: "#059669",
    light: "#ECFDF5",
    r: 27,
  },
  {
    id: "starlight-apricot",
    name: "Apricot Star",
    shape: "star",
    category: "candy",
    color: "#FED7AA",
    shade: "#F97316",
    light: "#FFF7ED",
    r: 28,
  },
  {
    id: "pearl-oval",
    name: "Ivory Pearl",
    shape: "oval",
    category: "pearl",
    color: "#FEF3C7",
    shade: "#D97706",
    light: "#FFFFFF",
    r: 26,
  },
  {
    id: "sparkle-sapphire",
    name: "Sky Jewel",
    shape: "faceted",
    category: "crystal",
    color: "#BAE6FD",
    shade: "#0284C7",
    light: "#F0F9FF",
    r: 27,
  },
  {
    id: "matcha-cube",
    name: "Matcha Latte",
    shape: "cube",
    category: "nature",
    color: "#BBF7D0",
    shade: "#22C55E",
    light: "#F0FDF4",
    r: 25,
  },
  {
    id: "taro-milk-round",
    name: "Taro Milk",
    shape: "round",
    category: "pearl",
    color: "#DDD6FE",
    shade: "#7C3AED",
    light: "#F5F3FF",
    r: 26,
  },
];

export const BEAD_MAP: Record<string, BeadDef> = Object.fromEntries(
  BEADS.map((b) => [b.id, b]),
);

export function getBead(id: string): BeadDef {
  return BEAD_MAP[id] ?? BEADS[0];
}

function starPath(r: number, points = 5): string {
  const inner = r * 0.48;
  let d = "";
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  }
  return d + "Z";
}

function heartPath(r: number): string {
  const s = r / 30;
  return [
    `M0,${(26 * s).toFixed(2)}`,
    `C${(-40 * s).toFixed(2)},${(2 * s).toFixed(2)} ${(-22 * s).toFixed(2)},${(-30 * s).toFixed(2)} 0,${(-12 * s).toFixed(2)}`,
    `C${(22 * s).toFixed(2)},${(-30 * s).toFixed(2)} ${(40 * s).toFixed(2)},${(2 * s).toFixed(2)} 0,${(26 * s).toFixed(2)}Z`,
  ].join(" ");
}

/**
 * Renders one cute pastel bead centered at (0,0).
 * Gradient ids are scoped to `uid` to guarantee uniqueness.
 */
export function BeadGlyph({ def, uid }: { def: BeadDef; uid: string }) {
  const gid = `bg-${uid}`;
  const r = def.r;
  const common = (
    <defs>
      <radialGradient id={gid} cx="32%" cy="28%" r="80%">
        <stop offset="0%" stopColor={def.light} />
        <stop offset="60%" stopColor={def.color} />
        <stop offset="100%" stopColor={def.shade} />
      </radialGradient>
      {/* Soft drop shadow for cute dimensional effect */}
      <filter id={`sh-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="rgba(80, 40, 70, 0.16)" />
      </filter>
    </defs>
  );

  switch (def.shape) {
    case "round":
      return (
        <g filter={`url(#sh-${uid})`}>
          {common}
          <circle r={r} fill={`url(#${gid})`} stroke={def.light} strokeWidth={1} />
          {/* Glossy specular highlight */}
          <ellipse
            cx={-r * 0.32}
            cy={-r * 0.38}
            rx={r * 0.34}
            ry={r * 0.2}
            fill="#FFFFFF"
            opacity={0.8}
            transform={`rotate(-24 ${-r * 0.32} ${-r * 0.38})`}
          />
          <circle cx={r * 0.28} cy={r * 0.28} r={r * 0.12} fill="#FFFFFF" opacity={0.35} />
        </g>
      );
    case "faceted": {
      const pts = Array.from({ length: 8 }, (_, i) => {
        const a = (Math.PI / 4) * i - Math.PI / 2;
        return `${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`;
      }).join(" ");
      const innerPts = Array.from({ length: 8 }, (_, i) => {
        const a = (Math.PI / 4) * i - Math.PI / 2;
        return `${(Math.cos(a) * r * 0.55).toFixed(2)},${(Math.sin(a) * r * 0.55).toFixed(2)}`;
      }).join(" ");
      return (
        <g filter={`url(#sh-${uid})`}>
          {common}
          <polygon points={pts} fill={`url(#${gid})`} stroke={def.light} strokeWidth={1.5} />
          <polygon points={innerPts} fill={def.light} opacity={0.65} />
          <circle cx={-r * 0.2} cy={-r * 0.25} r={r * 0.15} fill="#FFFFFF" opacity={0.8} />
        </g>
      );
    }
    case "cube":
      return (
        <g filter={`url(#sh-${uid})`}>
          {common}
          <rect
            x={-r * 0.86}
            y={-r * 0.86}
            width={r * 1.72}
            height={r * 1.72}
            rx={r * 0.32}
            fill={`url(#${gid})`}
            stroke={def.light}
            strokeWidth={1.5}
          />
          <rect
            x={-r * 0.52}
            y={-r * 0.52}
            width={r * 1.04}
            height={r * 1.04}
            rx={r * 0.22}
            fill={def.light}
            opacity={0.45}
          />
          <circle cx={-r * 0.35} cy={-r * 0.35} r={r * 0.14} fill="#FFFFFF" opacity={0.85} />
        </g>
      );
    case "star":
      return (
        <g filter={`url(#sh-${uid})`}>
          {common}
          <path
            d={starPath(r)}
            fill={`url(#${gid})`}
            stroke={def.light}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <circle cx={-r * 0.15} cy={-r * 0.2} r={r * 0.18} fill="#FFFFFF" opacity={0.85} />
          <circle cx={r * 0.15} cy={r * 0.18} r={r * 0.1} fill="#FFFFFF" opacity={0.4} />
        </g>
      );
    case "heart":
      return (
        <g filter={`url(#sh-${uid})`}>
          {common}
          <path
            d={heartPath(r)}
            fill={`url(#${gid})`}
            stroke={def.light}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <ellipse
            cx={-r * 0.32}
            cy={-r * 0.28}
            rx={r * 0.22}
            ry={r * 0.12}
            fill="#FFFFFF"
            opacity={0.85}
            transform={`rotate(-28 ${-r * 0.32} ${-r * 0.28})`}
          />
        </g>
      );
    case "donut":
      return (
        <g filter={`url(#sh-${uid})`}>
          {common}
          <path
            d={`M${-r},0 A${r},${r} 0 1,0 ${r},0 A${r},${r} 0 1,0 ${-r},0 Z M${-r * 0.35},0 A${r * 0.35},${r * 0.35} 0 1,1 ${r * 0.35},0 A${r * 0.35},${r * 0.35} 0 1,1 ${-r * 0.35},0 Z`}
            fill={`url(#${gid})`}
            fillRule="evenodd"
            stroke={def.light}
            strokeWidth={1}
          />
          <circle r={r * 0.35} fill="none" stroke={def.shade} strokeWidth={1.5} opacity={0.6} />
          <ellipse
            cx={-r * 0.45}
            cy={-r * 0.5}
            rx={r * 0.24}
            ry={r * 0.14}
            fill="#FFFFFF"
            opacity={0.8}
            transform={`rotate(-32 ${-r * 0.45} ${-r * 0.5})`}
          />
        </g>
      );
    case "oval":
      return (
        <g filter={`url(#sh-${uid})`}>
          {common}
          <ellipse rx={r * 1.15} ry={r * 0.78} fill={`url(#${gid})`} stroke={def.light} strokeWidth={1} />
          <ellipse
            cx={-r * 0.35}
            cy={-r * 0.3}
            rx={r * 0.32}
            ry={r * 0.16}
            fill="#FFFFFF"
            opacity={0.85}
            transform={`rotate(-18 ${-r * 0.35} ${-r * 0.3})`}
          />
        </g>
      );
    case "flower": {
      const petals = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i;
        return { x: Math.cos(a) * r * 0.52, y: Math.sin(a) * r * 0.52 };
      });
      return (
        <g filter={`url(#sh-${uid})`}>
          {common}
          {petals.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={r * 0.46}
              fill={`url(#${gid})`}
              stroke={def.shade}
              strokeWidth={0.8}
            />
          ))}
          {/* Flower center disc */}
          <circle r={r * 0.36} fill={def.light} stroke="#F59E0B" strokeWidth={1.5} />
          <circle cx={-r * 0.08} cy={-r * 0.08} r={r * 0.12} fill="#FFFFFF" opacity={0.9} />
        </g>
      );
    }
  }
}
