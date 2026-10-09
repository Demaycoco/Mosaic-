import React from 'react';

interface MosaicLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  withText?: boolean;
  className?: string;
  textClassName?: string;
}

export const MosaicLogo: React.FC<MosaicLogoProps> = ({
  size = 'md',
  withText = false,
  className = '',
  textClassName = 'text-white font-bold tracking-[0.2em]',
}) => {
  const pixelSize =
    typeof size === 'number'
      ? size
      : size === 'sm'
      ? 28
      : size === 'md'
      ? 38
      : size === 'lg'
      ? 56
      : 96;

  return (
    <div className={`inline-flex items-center gap-3.5 select-none ${className}`}>
      {/* Mosaic Logo Vector Mark */}
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-[0_4px_16px_rgba(168,85,247,0.35)]"
        aria-label="Mosaic Logo"
      >
        <defs>
          {/* Gradients matching exact Mosaic palette */}
          {/* Top-left gold/orange */}
          <linearGradient id="mosaic-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>

          {/* Mid-left deep purple */}
          <linearGradient id="mosaic-purple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>

          {/* Bottom-left magenta/pink */}
          <linearGradient id="mosaic-pink" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#db2777" />
          </linearGradient>

          {/* Bottom-center fuchsia */}
          <linearGradient id="mosaic-fuchsia" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>

          {/* Bottom-right peach/coral */}
          <linearGradient id="mosaic-coral" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>

          {/* Lower-right teal/cyan */}
          <linearGradient id="mosaic-teal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>

          {/* Upper-right mint/green */}
          <linearGradient id="mosaic-mint" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Top-right sky blue */}
          <linearGradient id="mosaic-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>

          {/* Center face profile gradient */}
          <linearGradient id="mosaic-profile" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="45%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>

          {/* Bezel glow gradient */}
          <linearGradient id="mosaic-bezel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* 3D Slab Base Frame */}
        <rect
          x="14"
          y="10"
          width="60"
          height="80"
          rx="12"
          fill="#090a12"
          stroke="url(#mosaic-purple)"
          strokeWidth="1.8"
          strokeOpacity="0.6"
        />

        {/* Top-Left Gold Tile */}
        <path
          d="M 18 20 C 18 15 21 14 26 14 L 46 16 L 40 38 L 18 40 Z"
          fill="url(#mosaic-gold)"
        />

        {/* Mid-Left Purple Tile */}
        <path
          d="M 18 43 L 39 41 L 39 56 L 18 57 Z"
          fill="url(#mosaic-purple)"
        />

        {/* Bottom-Left Pink Tile */}
        <path
          d="M 18 60 L 39 59 L 36 78 L 18 73 Z"
          fill="url(#mosaic-pink)"
        />

        {/* Bottom Center Fuchsia Tile */}
        <path
          d="M 28 76 L 46 86 C 44 87 40 87 36 86 L 22 75 Z"
          fill="url(#mosaic-fuchsia)"
        />

        {/* Top Right Cyan Tile */}
        <path
          d="M 49 16 L 68 20 C 70 20 71 22 71 25 L 67 40 L 49 33 Z"
          fill="url(#mosaic-blue)"
        />

        {/* Upper-Right Green Tile */}
        <path
          d="M 68 43 L 71 58 L 59 55 L 59 42 Z"
          fill="url(#mosaic-mint)"
        />

        {/* Lower-Right Teal Tile */}
        <path
          d="M 58 58 L 70 61 L 62 76 L 47 67 Z"
          fill="url(#mosaic-teal)"
        />

        {/* Bottom-Right Coral/Peach Tile */}
        <path
          d="M 63 78 C 65 77 69 74 70 70 L 71 80 C 69 85 64 86 58 86 L 48 85 Z"
          fill="url(#mosaic-coral)"
        />

        {/* Center Human Profile Silhouette Mosaic Piece */}
        {/* Profile facing right: forehead, eye indention, nose, upper lip, chin, throat */}
        <path
          d="M 42 22
             C 45 22 49 24 51 29
             C 52 32 54 35 56 38
             L 55 43
             L 57 44
             L 56 46
             L 58 48
             C 57 50 56 52 54 53
             L 56 55
             C 54 57 52 59 48 61
             L 45 64
             L 40 64
             L 40 37
             Z"
          fill="url(#mosaic-profile)"
          filter="drop-shadow(0 0 6px rgba(124,58,237,0.4))"
        />

        {/* Grout overlay lines for stained glass texture */}
        <line x1="18" y1="41" x2="40" y2="39" stroke="#06070a" strokeWidth="2.5" />
        <line x1="18" y1="58" x2="39" y2="57" stroke="#06070a" strokeWidth="2.5" />
        <line x1="47" y1="16" x2="41" y2="64" stroke="#06070a" strokeWidth="2.5" />
        <line x1="49" y1="35" x2="68" y2="42" stroke="#06070a" strokeWidth="2.5" />
        <line x1="58" y1="56" x2="71" y2="59" stroke="#06070a" strokeWidth="2.5" />

        {/* Floating Satellite Mosaic Pixel Tiles (top right dispersing) */}
        {/* 1. Large Cyan Tile */}
        <rect
          x="73"
          y="10"
          width="13"
          height="13"
          rx="3"
          transform="rotate(18 73 10)"
          fill="#38bdf8"
          stroke="#0284c7"
          strokeWidth="0.8"
        />
        {/* 2. Small Lavender Tile */}
        <rect
          x="88"
          y="23"
          width="8"
          height="8"
          rx="2"
          transform="rotate(22 88 23)"
          fill="#c084fc"
        />
        {/* 3. Medium Warm Gold Tile */}
        <rect
          x="78"
          y="31"
          width="10"
          height="10"
          rx="2.5"
          transform="rotate(24 78 31)"
          fill="#f59e0b"
        />
      </svg>

      {/* Brand Name Typography */}
      {withText && (
        <span className={`font-extrabold text-lg md:text-xl ${textClassName}`}>
          MOSAIC
        </span>
      )}
    </div>
  );
};
