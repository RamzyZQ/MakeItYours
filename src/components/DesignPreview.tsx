import React, { useMemo } from "react";
import { getPath, pointAt, VIEW_H, VIEW_W } from "../game/paths";
import { getBead, BeadGlyph } from "../game/beads";
import type { BaseType, BeadRecord } from "../types/beads";

interface DesignPreviewProps {
  base: BaseType;
  beads: BeadRecord[];
  uidPrefix: string;
  tone?: "pastel-pink" | "pastel-lilac" | "pastel-mint" | "pastel-sky" | "pastel-cream";
}

const TONE_COLORS = {
  "pastel-pink": { bg: "#FFF5F8", string: "#F472B6", knot: "#FB7185" },
  "pastel-lilac": { bg: "#FAF5FF", string: "#A78BFA", knot: "#C084FC" },
  "pastel-mint": { bg: "#F0FDF4", string: "#4ADE80", knot: "#34D399" },
  "pastel-sky": { bg: "#F0F9FF", string: "#60A5FA", knot: "#38BDF8" },
  "pastel-cream": { bg: "#FFFBEB", string: "#FBBF24", knot: "#F59E0B" },
};

export default function DesignPreview({
  base,
  beads,
  uidPrefix,
  tone = "pastel-pink",
}: DesignPreviewProps) {
  const path = getPath(base);
  const colors = TONE_COLORS[tone] ?? TONE_COLORS["pastel-pink"];

  const placed = useMemo(
    () =>
      beads.map((b, i) => ({
        def: getBead(b.type),
        p: pointAt(path, b.s),
        i,
      })),
    [beads, path],
  );

  return (
    <div
      style={{ backgroundColor: colors.bg }}
      className="relative flex w-full items-center justify-center overflow-hidden rounded-2xl p-2 select-none"
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="block h-auto w-full"
        role="img"
        aria-label="Pratinjau Desain MakeitYours"
      >
        {/* String path */}
        <path
          d={path.d}
          className="string-line-static"
          stroke={colors.string}
          strokeWidth={3.5}
          opacity={0.85}
        />

        {/* Knots for open path */}
        {!path.closed && (
          <>
            <circle
              cx={path.samples[0].x}
              cy={path.samples[0].y}
              r={11}
              fill="#FFFFFF"
              stroke={colors.knot}
              strokeWidth={3}
            />
            <circle
              cx={path.samples[0].x}
              cy={path.samples[0].y}
              r={5}
              fill={colors.knot}
            />
            <circle
              cx={path.samples[path.samples.length - 1].x}
              cy={path.samples[path.samples.length - 1].y}
              r={11}
              fill="#FFFFFF"
              stroke={colors.knot}
              strokeWidth={3}
            />
            <circle
              cx={path.samples[path.samples.length - 1].x}
              cy={path.samples[path.samples.length - 1].y}
              r={5}
              fill={colors.knot}
            />
          </>
        )}

        {/* Beads */}
        {placed.map(({ def, p, i }) => (
          <g key={i} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`}>
            <BeadGlyph def={def} uid={`${uidPrefix}-${i}`} />
          </g>
        ))}
      </svg>
    </div>
  );
}
