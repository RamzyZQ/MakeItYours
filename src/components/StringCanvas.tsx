import React, { forwardRef, useMemo } from "react";
import { pointAt, tangentAt, VIEW_H, VIEW_W, type PathData } from "../game/paths";
import { getBead, BeadGlyph } from "../game/beads";
import type { SimBead } from "../game/sim";

/** how much each bead shape rotates with the string tangent */
const ROTATION_FACTOR: Record<string, number> = {
  oval: 1,
  cube: 0.8,
  heart: 0.45,
  star: 0.4,
  flower: 0.35,
  faceted: 0.6,
};

export type CanvasMatTone = "pastel-pink" | "pastel-lilac" | "pastel-mint" | "pastel-sky" | "pastel-cream";

interface StringCanvasProps {
  path: PathData;
  beads: SimBead[];
  matTone?: CanvasMatTone;
  highlight?: boolean;
  beadScale?: number;
  onBeadClick?: (id: string) => void;
  hint?: string;
  staticString?: boolean;
}

const MAT_STYLES: Record<CanvasMatTone, { bg: string; border: string; stringColor: string; knot: string }> = {
  "pastel-pink": {
    bg: "bg-gradient-to-b from-[#FFF5F8] to-[#FCE7F3]",
    border: "border-[#FBCFE8]",
    stringColor: "#F472B6",
    knot: "#FB7185",
  },
  "pastel-lilac": {
    bg: "bg-gradient-to-b from-[#FAF5FF] to-[#F3E8FF]",
    border: "border-[#E9D5FF]",
    stringColor: "#A78BFA",
    knot: "#C084FC",
  },
  "pastel-mint": {
    bg: "bg-gradient-to-b from-[#F0FDF4] to-[#DCFCE7]",
    border: "border-[#BBF7D0]",
    stringColor: "#4ADE80",
    knot: "#34D399",
  },
  "pastel-sky": {
    bg: "bg-gradient-to-b from-[#F0F9FF] to-[#E0F2FE]",
    border: "border-[#BAE6FD]",
    stringColor: "#60A5FA",
    knot: "#38BDF8",
  },
  "pastel-cream": {
    bg: "bg-gradient-to-b from-[#FFFBEB] to-[#FEF3C7]",
    border: "border-[#FDE68A]",
    stringColor: "#FBBF24",
    knot: "#F59E0B",
  },
};

const StringCanvas = forwardRef<SVGSVGElement, StringCanvasProps>(
  function StringCanvas(
    {
      path,
      beads,
      matTone = "pastel-pink",
      highlight = false,
      beadScale = 1,
      onBeadClick,
      hint,
      staticString = false,
    },
    ref,
  ) {
    const style = MAT_STYLES[matTone] ?? MAT_STYLES["pastel-pink"];

    const rendered = useMemo(
      () =>
        beads.map((b) => {
          const def = getBead(b.type);
          const p = pointAt(path, b.s);
          const t = tangentAt(path, b.s);
          const deg =
            ((Math.atan2(t.y, t.x) * 180) / Math.PI) *
            (ROTATION_FACTOR[def.shape] ?? 0);
          return { b, def, p, deg };
        }),
      [beads, path],
    );

    const ends = useMemo(
      () =>
        path.closed
          ? null
          : ([pointAt(path, 0), pointAt(path, path.length)] as const),
      [path],
    );

    return (
      <div
        className={`relative overflow-hidden rounded-3xl border-2 shadow-lg transition-all duration-300 ${style.bg} ${style.border} ${
          highlight ? "ring-4 ring-[#F472B6] ring-offset-2 scale-[1.008]" : ""
        }`}
      >
        {/* Soft aesthetic background sparkles in corners */}
        <div className="pointer-events-none absolute top-4 left-6 text-sm opacity-40 select-none">✦</div>
        <div className="pointer-events-none absolute top-6 right-8 text-sm opacity-40 select-none">✨</div>
        <div className="pointer-events-none absolute bottom-5 left-10 text-sm opacity-30 select-none">🌸</div>
        <div className="pointer-events-none absolute bottom-4 right-6 text-sm opacity-40 select-none">✦</div>

        <svg
          ref={ref}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="block h-auto w-full select-none"
          role="img"
          aria-label="Kanvas perhiasan manik MakeitYours"
        >
          {/* Subtle string glow */}
          <path
            d={path.d}
            fill="none"
            stroke={style.stringColor}
            strokeWidth={7}
            opacity={0.2}
            strokeLinecap="round"
          />

          {/* Main animated dashed string */}
          <path
            d={path.d}
            className={staticString ? "string-line-static" : "string-line"}
            stroke={style.stringColor}
            opacity={0.9}
          />

          {/* End knots for open string (kalung) */}
          {ends?.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={12} fill="#FFFFFF" stroke={style.knot} strokeWidth={3} />
              <circle cx={p.x} cy={p.y} r={6} fill={style.knot} />
              <circle cx={p.x - 2} cy={p.y - 2} r={2} fill="#FFFFFF" opacity={0.8} />
            </g>
          ))}

          {/* Beads on the string */}
          {rendered.map(({ b, def, p, deg }) => (
            <g
              key={b.id}
              transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${deg.toFixed(1)}) scale(${beadScale})`}
              onClick={onBeadClick ? () => onBeadClick(b.id) : undefined}
              className={onBeadClick ? "cursor-pointer group hover:opacity-95" : undefined}
              style={onBeadClick ? { pointerEvents: "all" } : undefined}
            >
              <title>{def.name} — klik untuk melepas</title>
              <BeadGlyph def={def} uid={b.id} />
            </g>
          ))}
        </svg>

        {hint && beads.length === 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
            <span className="rounded-full bg-white/80 backdrop-blur-xs px-4 py-1.5 text-xs font-semibold text-[#8B7A90] shadow-xs border border-[#FCE7F3] animate-bounce">
              {hint}
            </span>
          </div>
        )}
      </div>
    );
  },
);

export default StringCanvas;
