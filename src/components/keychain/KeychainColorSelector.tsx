/**
 * KeychainColorSelector — Section pemilihan warna frame / aksesori keychain.
 * Diekstrak dari Keychain.tsx untuk mengurangi ukuran god component.
 */
import React from "react";
import { Download, MessageCircle } from "lucide-react";
import { FRAME_MODELS, type FrameModelId } from "../../types/keychain";
import type { StoreSettings } from "../../types/storeSettings";

interface Props {
  order: { frameModel: FrameModelId };
  settings: StoreSettings;
  isRendering: boolean;
  renderError: string | null;
  isCheckoutBusy: boolean;
  isPreparingCheckout: boolean;
  allKeychainOutOfStock: boolean;
  selectedColorLabel: string;
  onSelectColor: (id: FrameModelId) => void;
  onDownload: (format: "png" | "jpg") => void;
  onCheckout: () => void;
}

export default function KeychainColorSelector({
  order,
  settings,
  isRendering,
  renderError,
  isCheckoutBusy,
  isPreparingCheckout,
  allKeychainOutOfStock,
  selectedColorLabel,
  onSelectColor,
  onDownload,
  onCheckout,
}: Props) {
  const keychainStock = settings.keychainStock;

  return (
    <section className="booth-control-section">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-base font-bold text-[var(--booth-ink)]">Warna aksesori</h2>
          <p className="booth-muted text-xs">Pilih warna charm, lonceng, dan tali.</p>
        </div>
        <span className="booth-muted text-xs">{selectedColorLabel}</span>
      </div>

      {allKeychainOutOfStock && (
        <p className="mb-2 rounded-xl bg-[#FFF1F2] px-3 py-2 text-xs font-bold text-[#BE123C]" role="alert">
          Semua varian keychain sedang habis
        </p>
      )}

      <div className="grid grid-cols-4 gap-2">
        {FRAME_MODELS.map((frame) => {
          const stock = keychainStock[frame.id];
          const soldOut = stock <= 0;
          return (
            <button
              key={frame.id}
              type="button"
              disabled={soldOut}
              aria-pressed={order.frameModel === frame.id}
              onClick={() => {
                if (soldOut) return;
                onSelectColor(frame.id);
              }}
              className={`booth-color-option ${order.frameModel === frame.id ? "is-selected" : ""} ${soldOut ? "is-soldout" : ""}`}
            >
              <span style={{ backgroundColor: frame.color.hex, borderColor: frame.color.hexDark }} />
              <span className="booth-color-option-copy">
                {frame.label}
                <small className={`booth-stock-badge${soldOut ? " is-empty" : ""}`}>
                  {soldOut ? "Habis" : `Sisa ${stock}`}
                </small>
              </span>
            </button>
          );
        })}
      </div>

      <div className="booth-order-actions">
        <button
          type="button"
          aria-label="Unduh PNG kedua sisi"
          onClick={() => onDownload("png")}
          disabled={isRendering || Boolean(renderError)}
          className="booth-secondary-action"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">PNG 2 sisi</span>
          <span className="sm:hidden">PNG ×2</span>
        </button>
        <button
          type="button"
          aria-label="Unduh JPG kedua sisi"
          onClick={() => onDownload("jpg")}
          disabled={isRendering || Boolean(renderError)}
          className="booth-secondary-action"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">JPG 2 sisi</span>
          <span className="sm:hidden">JPG ×2</span>
        </button>
        <button
          type="button"
          aria-label="Pesan dan lanjutkan ke WhatsApp"
          onClick={onCheckout}
          disabled={isCheckoutBusy || allKeychainOutOfStock}
          className="booth-primary-action"
        >
          <MessageCircle className="h-4 w-4" />
          {allKeychainOutOfStock
            ? "Stok habis"
            : isRendering ? "Memperbarui…" : isPreparingCheckout ? "Menyiapkan…" : "Pesan"}
        </button>
      </div>
    </section>
  );
}
