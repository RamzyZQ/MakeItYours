/**
 * KeychainFilterDialog — Dialog pengaturan filter foto.
 * Diekstrak dari Keychain.tsx untuk mengurangi ukuran god component.
 */
import React from "react";
import { X } from "lucide-react";
import type { PhotoFilter } from "../../types/templates";

const FILTER_OPTIONS: { id: PhotoFilter; label: string; description: string }[] = [
  { id: "none", label: "Normal", description: "Warna asli" },
  { id: "grayscale", label: "B&W Classic", description: "Hitam putih" },
  { id: "vintage", label: "Vintage Warm", description: "Hangat dan klasik" },
  { id: "soft-pink", label: "Soft Glow", description: "Lembut dan cerah" },
];

interface Props {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  filter: PhotoFilter;
  onFilterChange: (filter: PhotoFilter) => void;
  onClose: () => void;
}

export default function KeychainFilterDialog({ dialogRef, filter, onFilterChange, onClose }: Props) {
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="filter-dialog-title"
      className="booth-filter-dialog"
      onCancel={onClose}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="booth-eyebrow">PENYESUAIAN FOTO</p>
          <h2 id="filter-dialog-title" className="mt-1 font-display text-lg font-bold text-[var(--booth-ink)]">
            Pengaturan filter
          </h2>
          <p className="booth-muted mt-1 text-xs">Filter hanya mengubah foto, bukan desain frame.</p>
        </div>
        <button
          type="button"
          aria-label="Tutup pengaturan filter"
          onClick={onClose}
          className="booth-icon-button"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={filter === option.id}
            onClick={() => onFilterChange(option.id)}
            className={`booth-filter-option ${filter === option.id ? "is-selected" : ""}`}
          >
            <span className="block text-sm font-bold">{option.label}</span>
            <span className="mt-1 block text-xs">{option.description}</span>
          </button>
        ))}
      </div>
      <button type="button" onClick={onClose} className="booth-primary-action mt-4 w-full">
        Selesai
      </button>
    </dialog>
  );
}

export { FILTER_OPTIONS };
