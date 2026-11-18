import { useState } from "react";
import { FlipHorizontal } from "lucide-react";
import type { FrameModelId } from "../types/keychain";
import type { PhotoBoothSide } from "../types/templates";

const PREVIEW_COLORS: Record<FrameModelId, string> = {
  pink: "pink",
  hitam: "black",
  merah: "red",
  biru: "blue",
};

export default function CheckoutProductPreview({
  color,
  frontDesign,
  backDesign,
  compact = false,
}: {
  color: FrameModelId;
  frontDesign: string;
  backDesign: string;
  compact?: boolean;
}) {
  const [side, setSide] = useState<PhotoBoothSide>("front");
  const design = side === "front" ? frontDesign : backDesign;
  const colorName = PREVIEW_COLORS[color];
  const nextSide = side === "front" ? "back" : "front";

  return (
    <section className={`checkout-product-preview${compact ? " is-compact" : ""}`} aria-label="Preview bentuk produk">
      <div className="checkout-product-preview__mockup-wrap">
        <div
          className="checkout-product-preview__mockup"
          role="img"
          aria-label={`Mockup keychain ${side === "front" ? "depan" : "belakang"} warna ${color}`}
        >
          <img
            src={`/Preview/${colorName}rope-${side}.png`}
            alt=""
            aria-hidden="true"
            className="checkout-product-preview__frame"
          />
          <div className="checkout-product-preview__design-slot">
            <img
              src={design}
              alt=""
              aria-hidden="true"
              className="checkout-product-preview__design"
            />
          </div>
        </div>
        <button
          type="button"
          className="checkout-product-preview__flip"
          aria-label={`Tampilkan sisi ${nextSide === "front" ? "depan" : "belakang"}`}
          title={`Tampilkan sisi ${nextSide === "front" ? "depan" : "belakang"}`}
          aria-pressed={side === "back"}
          onClick={() => setSide(nextSide)}
        >
          <FlipHorizontal className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
