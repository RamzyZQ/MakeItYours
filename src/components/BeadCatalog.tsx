import React, { useState } from "react";
import { BEADS, BeadGlyph, type BeadDef } from "../game/beads";
import { Sparkles, Heart, CircleDot, Flower2, Gem } from "lucide-react";

interface BeadCatalogProps {
  onPick: (def: BeadDef) => void;
  onDragStart: (def: BeadDef, x: number, y: number) => void;
  disabled?: boolean;
}

export function BeadCatalog({ onPick, onDragStart, disabled }: BeadCatalogProps) {
  const [filter, setFilter] = useState<string>("all");

  const categories = [
    { id: "all", label: "Semua", icon: Sparkles },
    { id: "candy", label: "Candy", icon: Heart },
    { id: "pearl", label: "Pearl", icon: CircleDot },
    { id: "nature", label: "Flora", icon: Flower2 },
    { id: "crystal", label: "Crystal", icon: Gem },
  ];

  const filteredBeads = filter === "all" ? BEADS : BEADS.filter((b) => b.category === filter);

  return (
    <div className="flex flex-col gap-3">
      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const active = filter === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilter(cat.id)}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all whitespace-nowrap ${
                active
                  ? "bg-[#F472B6] text-white shadow-xs"
                  : "bg-white text-[#8B7A90] border border-[#FCE7F3] hover:border-[#F472B6] hover:text-[#DB2777]"
              }`}
            >
              <Icon className="h-3 w-3" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Grid of cute pastel beads */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 xl:grid-cols-4 gap-2 max-h-[380px] sm:max-h-[460px] overflow-y-auto pr-1">
        {filteredBeads.map((def) => (
          <button
            key={def.id}
            type="button"
            className="bead-item-cute group"
            disabled={disabled}
            aria-label={`Tambah manik ${def.name}`}
            onPointerDown={(e) => {
              // start drag on pointer down
              onDragStart(def, e.clientX, e.clientY);
            }}
            onClick={() => {
              // Click or tap to drop directly
              onPick(def);
            }}
          >
            <div className="relative flex h-14 w-14 items-center justify-center group-hover:scale-110 transition-transform">
              <svg viewBox="-34 -34 68 68" className="h-12 w-12" aria-hidden>
                <BeadGlyph def={def} uid={`cat-${def.id}`} />
              </svg>
            </div>
            <span className="font-display text-[10px] font-bold text-[#523B54] truncate max-w-[80px] text-center">
              {def.name}
            </span>
            <span className="text-[8px] font-mono text-[#A288A6] uppercase">
              {def.shape}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
