import React from "react";
import { getKeychainColor, type KeychainOrder } from "../types/keychain";

export default function KeychainPreview({ order }: { order: KeychainOrder }) {
  const color = getKeychainColor(order.frameModel);
  const photos = [order.photos[0], order.photos[1], order.photos[2]];

  return (
    <div className="overflow-hidden rounded-[1.75rem] border-2 border-[#FCE7F3] bg-white p-3 shadow-sm sm:p-5">
      <svg viewBox="0 0 360 520" className="mx-auto h-auto w-full max-w-md" role="img" aria-label={`Pratinjau keychain photo strip warna ${color.label}`}>
        <defs>
          <linearGradient id="ringMetal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F5F5F5" />
            <stop offset="45%" stopColor="#C0C0C0" />
            <stop offset="100%" stopColor="#9CA3AF" />
          </linearGradient>
          <filter id="productShadow" x="-20%" y="-10%" width="140%" height="140%">
            <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#6B5E70" floodOpacity="0.2" />
          </filter>
          {photos.map((src, i) => (
            <clipPath key={`photo-clip-${i}`} id={`photoClip${i}`}>
              <rect x="106" y={198 + i * 87} width="108" height="80" rx="7" />
            </clipPath>
          ))}
        </defs>

        <rect x="18" y="16" width="324" height="488" rx="28" fill="#FFF8FB" />
        <g filter="url(#productShadow)">
          <circle cx="180" cy="54" r="28" fill="none" stroke="url(#ringMetal)" strokeWidth="8" />
          <circle cx="180" cy="54" r="22" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.7" />
          <path d="M180 82 L180 105" stroke="url(#ringMetal)" strokeWidth="7" strokeLinecap="round" />
          <circle cx="180" cy="105" r="7" fill="none" stroke="#A8A8A8" strokeWidth="3" />

          <path d="M176 104 C156 106 142 112 130 127" fill="none" stroke="url(#ringMetal)" strokeWidth="4" />
          <path d="M184 104 C204 106 218 112 230 127" fill="none" stroke="url(#ringMetal)" strokeWidth="4" />
          <circle cx="130" cy="127" r="5" fill="none" stroke="#A8A8A8" strokeWidth="3" />
          <circle cx="230" cy="127" r="5" fill="none" stroke="#A8A8A8" strokeWidth="3" />

          <g transform="translate(130,148)">
            <path
              d="M0,-22 L6,-6 L23,-6 L10,4 L15,20 L0,11 L-15,20 L-10,4 L-23,-6 L-6,-6 Z"
              fill={color.hex}
              stroke={color.hexDark}
              strokeWidth="2"
            />
            <path d="M0,-14 L3,-5 L0,-2 L-3,-5 Z" fill="#ffffff" opacity="0.35" />
          </g>

          <g transform="translate(230,148)">
            <ellipse cx="0" cy="-4" rx="14" ry="16" fill={color.hex} stroke={color.hexDark} strokeWidth="2" />
            <rect x="-7" y="-22" width="14" height="8" rx="3" fill={color.hexDark} />
            <ellipse cx="0" cy="12" rx="16" ry="5" fill={color.hexDark} />
            <circle cx="0" cy="16" r="4" fill="#FDE68A" stroke="#D97706" strokeWidth="1" />
            <ellipse cx="-4" cy="-8" rx="4" ry="6" fill="#ffffff" opacity="0.28" />
          </g>

          <rect x="92" y="184" width="136" height="296" rx="15" fill="#ffffff" stroke={color.hexDark} strokeWidth="5" />
          <rect x="98" y="190" width="124" height="284" rx="11" fill={color.hexLight} stroke={color.hex} strokeWidth="2" />
          {photos.map((src, i) => {
            const y = 198 + i * 87;
            return (
              <g key={i} clipPath={`url(#photoClip${i})`}>
                <rect x="106" y={y} width="108" height="80" rx="7" fill="#ffffff" stroke={color.hex} strokeWidth="2" />
                {src ? (
                  <image href={src} x="106" y={y} width="108" height="80" preserveAspectRatio="xMidYMid slice" />
                ) : (
                  <>
                    <rect x="106" y={y} width="108" height="80" rx="7" fill="#ffffff" />
                    <text x="160" y={y + 46} textAnchor="middle" fontSize="11" fill="#A288A6" fontFamily="Quicksand, sans-serif">
                      Foto {i + 1}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          <path d="M193 105 C220 111 255 126 258 158" fill="none" stroke={color.hexDark} strokeWidth="8" strokeLinecap="round" />
          {Array.from({ length: 8 }).map((_, i) => {
            const y = 157 + i * 25;
            const flip = i % 2 === 0;
            return (
              <g key={i}>
                <path
                  d={
                    flip
                      ? `M238 ${y} C 249 ${y - 13}, 269 ${y - 13}, 280 ${y} C 269 ${y + 13}, 249 ${y + 13}, 238 ${y}`
                      : `M238 ${y} C 249 ${y + 13}, 269 ${y + 13}, 280 ${y} C 269 ${y - 13}, 249 ${y - 13}, 238 ${y}`
                  }
                  fill="none"
                  stroke={color.hexDark}
                  strokeWidth="9"
                  strokeLinecap="round"
                  opacity={0.8}
                />
                <path
                  d={
                    flip
                      ? `M238 ${y} C 249 ${y - 13}, 269 ${y - 13}, 280 ${y} C 269 ${y + 13}, 249 ${y + 13}, 238 ${y}`
                      : `M238 ${y} C 249 ${y + 13}, 269 ${y + 13}, 280 ${y} C 269 ${y - 13}, 249 ${y - 13}, 238 ${y}`
                  }
                  fill="none"
                  stroke={color.hex}
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </g>
            );
          })}
          <path d="M244 354 C 241 388 235 416 228 443" stroke={color.hex} strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M274 354 C 278 389 283 417 290 443" stroke={color.hex} strokeWidth="8" fill="none" strokeLinecap="round" />
          <g stroke={color.hexDark} strokeWidth="1">
            {Array.from({ length: 8 }).map((_, i) => (
              <path key={`l${i}`} d={`M${222 + i * 2} 442 l -5 26`} stroke={color.hex} strokeWidth="2" />
            ))}
            {Array.from({ length: 8 }).map((_, i) => (
              <path key={`r${i}`} d={`M${284 + i * 2} 442 l 5 26`} stroke={color.hex} strokeWidth="2" />
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
}
