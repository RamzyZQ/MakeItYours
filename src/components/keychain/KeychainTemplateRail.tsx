/**
 * KeychainTemplateRail — Rail horizontal untuk memilih template photobooth.
 * Diekstrak dari Keychain.tsx untuk mengurangi ukuran god component.
 */
import React from "react";
import { PHOTOBOOTH_TEMPLATES, type PhotoBoothTemplate } from "../../types/templates";

interface Props {
  selected: PhotoBoothTemplate;
  disabled?: boolean;
  onSelect: (template: PhotoBoothTemplate) => void;
}

export default function KeychainTemplateRail({ selected, disabled = false, onSelect }: Props) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-base font-bold text-[var(--booth-ink)]">Pilih frame</h2>
          <p className="booth-muted text-xs">Foto tetap tersimpan saat layout diganti.</p>
        </div>
        <span className="booth-count">{PHOTOBOOTH_TEMPLATES.length} desain</span>
      </div>
      <div className="booth-template-rail flex gap-2 overflow-x-auto pb-2 pt-1">
        {PHOTOBOOTH_TEMPLATES.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            aria-label={`Pilih template ${item.name}`}
            aria-pressed={selected.id === item.id}
            onClick={() => onSelect(item)}
            className={`booth-template-card shrink-0 ${selected.id === item.id ? "is-selected" : ""}`}
          >
            <img src={item.frameUrl} alt="" loading="lazy" />
            <span>{item.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
