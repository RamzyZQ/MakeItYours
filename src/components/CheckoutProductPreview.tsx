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
  const [mobileSide, setMobileSide] = useState<PhotoBoothSide>("front");
  const colorName = PREVIEW_COLORS[color];
  const nextMobileSide = mobileSide === "front" ? "back" : "front";
  const mobileDesign = mobileSide === "front" ? frontDesign : backDesign;

  return (
    <section className={`checkout-product-preview${compact ? " is-compact" : ""}`} aria-label="Preview bentuk produk">
      {/* Desktop view: Tampilan Side-by-side (Depan & Belakang tampil bersebelahan) */}
      <div className="hidden md:flex items-center justify-center gap-6 my-2">
        {/* Sisi Depan */}
        <div className="flex flex-col items-center gap-2">
          <div className="checkout-product-preview__mockup-wrap !w-[220px] lg:!w-[250px]">
            <div
              className="checkout-product-preview__mockup shadow-lg"
              role="img"
              aria-label={`Mockup keychain sisi depan warna ${color}`}
            >
              <img
                src={`/Preview/${colorName}rope-front.png`}
                alt=""
                aria-hidden="true"
                className="checkout-product-preview__frame"
              />
              <div className="checkout-product-preview__design-slot">
                <img
                  src={frontDesign}
                  alt=""
                  aria-hidden="true"
                  className="checkout-product-preview__design"
                />
              </div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF0F5] px-3 py-1 text-xs font-bold text-[#DB2777] border border-[#FCE7F3]">
            <span>🌸</span> Sisi Depan
          </span>
        </div>

        {/* Sisi Belakang */}
        <div className="flex flex-col items-center gap-2">
          <div className="checkout-product-preview__mockup-wrap !w-[220px] lg:!w-[250px]">
            <div
              className="checkout-product-preview__mockup shadow-lg"
              role="img"
              aria-label={`Mockup keychain sisi belakang warna ${color}`}
            >
              <img
                src={`/Preview/${colorName}rope-back.png`}
                alt=""
                aria-hidden="true"
                className="checkout-product-preview__frame"
              />
              <div className="checkout-product-preview__design-slot">
                <img
                  src={backDesign}
                  alt=""
                  aria-hidden="true"
                  className="checkout-product-preview__design"
                />
              </div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EDE9FE] px-3 py-1 text-xs font-bold text-[#7C3AED] border border-[#DDD6FE]">
            <span>🎀</span> Sisi Belakang
          </span>
        </div>
      </div>

      {/* Mobile view: Single card with Flip button */}
      <div className="md:hidden checkout-product-preview__mockup-wrap">
        <div
          className="checkout-product-preview__mockup"
          role="img"
          aria-label={`Mockup keychain ${mobileSide === "front" ? "depan" : "belakang"} warna ${color}`}
        >
          <img
            src={`/Preview/${colorName}rope-${mobileSide}.png`}
            alt=""
            aria-hidden="true"
            className="checkout-product-preview__frame"
          />
          <div className="checkout-product-preview__design-slot">
            <img
              src={mobileDesign}
              alt=""
              aria-hidden="true"
              className="checkout-product-preview__design"
            />
          </div>
        </div>
        <button
          type="button"
          className="checkout-product-preview__flip"
          aria-label={`Tampilkan sisi ${nextMobileSide === "front" ? "depan" : "belakang"}`}
          title={`Tampilkan sisi ${nextMobileSide === "front" ? "depan" : "belakang"}`}
          aria-pressed={mobileSide === "back"}
          onClick={() => setMobileSide(nextMobileSide)}
        >
          <FlipHorizontal className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <p className="md:hidden mt-2 text-center text-xs font-semibold text-[#8B7A90]">
        Ketuk tombol putar untuk melihat sisi {nextMobileSide === "front" ? "depan" : "belakang"}
      </p>
    </section>
  );
}
