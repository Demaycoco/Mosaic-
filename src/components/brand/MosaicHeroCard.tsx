import React from 'react';

interface MosaicHeroCardProps {
  className?: string;
  showDetails?: boolean;
  tiltAngle?: number;
  title?: string;
  subtitle?: string;
}

export const MosaicHeroCard: React.FC<MosaicHeroCardProps> = ({
  className = '',
  showDetails = true,
  title = 'Mosaic Genesis',
  subtitle = 'Living Relay Artifact',
}) => {
  return (
    <div
      className={`relative group transition-transform duration-500 hover:scale-[1.02] ${className}`}
    >
      {/* Outer ambient glow */}
      <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-500/25 rounded-3xl blur-2xl opacity-75 group-hover:opacity-100 transition duration-700" />

      {/* Main 3D Beveled Card Container */}
      <div className="relative rounded-2xl md:rounded-3xl bg-[#090b14] border border-purple-500/30 p-3 md:p-4.5 shadow-2xl shadow-purple-950/50 backdrop-blur-xl overflow-visible">
        {/* Mosaic Stained-Glass Face Artwork Canvas */}
        <div className="relative aspect-[4/5] w-full rounded-xl md:rounded-2xl overflow-hidden bg-[#070911] border border-white/5 flex items-center justify-center">
          {/* Subtle radial background depth */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-transparent to-black" />

          {/* SVG Artwork Rendering */}
          <svg
            viewBox="0 0 340 400"
            className="w-full h-full p-2"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="hc-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>

              <linearGradient id="hc-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#6d28d9" />
              </linearGradient>

              <linearGradient id="hc-magenta" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#be185d" />
              </linearGradient>

              <linearGradient id="hc-rose" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#9333ea" />
              </linearGradient>

              <linearGradient id="hc-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>

              <linearGradient id="hc-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>

              <linearGradient id="hc-teal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>

              <linearGradient id="hc-coral" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#e11d48" />
              </linearGradient>

              <linearGradient id="hc-face" x1="10%" y1="0%" x2="90%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="40%" stopColor="#818cf8" />
                <stop offset="70%" stopColor="#9333ea" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>

            {/* Base Slab Shadow & Rim */}
            <rect
              x="50"
              y="40"
              width="210"
              height="290"
              rx="24"
              fill="#06070c"
              stroke="#2e1065"
              strokeWidth="3"
            />

            {/* Tile 1: Top-Left Golden Yellow */}
            <path
              d="M 68 76 C 68 62 76 54 94 54 L 160 62 L 142 135 L 68 142 Z"
              fill="url(#hc-gold)"
            />

            {/* Tile 2: Mid-Left Violet */}
            <path
              d="M 68 152 L 140 145 L 140 200 L 68 202 Z"
              fill="url(#hc-purple)"
            />

            {/* Tile 3: Bottom-Left Magenta */}
            <path
              d="M 68 212 L 140 210 L 130 278 L 68 260 Z"
              fill="url(#hc-magenta)"
            />

            {/* Tile 4: Bottom Rose/Purple */}
            <path
              d="M 104 272 L 168 310 C 160 314 146 314 132 310 L 82 270 Z"
              fill="url(#hc-rose)"
            />

            {/* Tile 5: Top-Right Blue */}
            <path
              d="M 172 62 L 236 76 C 242 78 244 84 244 92 L 230 148 L 172 122 Z"
              fill="url(#hc-cyan)"
            />

            {/* Tile 6: Upper-Right Emerald */}
            <path
              d="M 234 158 L 244 214 L 202 202 L 202 154 Z"
              fill="url(#hc-emerald)"
            />

            {/* Tile 7: Lower-Right Teal */}
            <path
              d="M 200 212 L 242 224 L 214 278 L 162 248 Z"
              fill="url(#hc-teal)"
            />

            {/* Tile 8: Bottom-Right Peach/Coral */}
            <path
              d="M 218 284 C 224 280 238 270 242 258 L 244 294 C 238 310 220 314 200 310 L 166 310 Z"
              fill="url(#hc-coral)"
            />

            {/* Center Profile Silhouette (Female profile facing right) */}
            <path
              d="M 148 84
                 C 160 84 175 92 182 108
                 C 186 118 193 128 200 138
                 L 196 156
                 L 204 160
                 L 200 168
                 L 206 174
                 C 202 182 198 188 190 192
                 L 196 200
                 C 190 208 182 214 170 220
                 L 158 232
                 L 142 232
                 L 142 136
                 Z"
              fill="url(#hc-face)"
              className="drop-shadow-[0_0_12px_rgba(99,102,241,0.5)]"
            />

            {/* Floating Satellite Tiles breaking into space (Top Right) */}
            {/* Tile A: Large Cyan */}
            <rect
              x="254"
              y="42"
              width="44"
              height="44"
              rx="9"
              transform="rotate(18 254 42)"
              fill="#38bdf8"
              stroke="#0284c7"
              strokeWidth="2"
              className="drop-shadow-[0_0_15px_rgba(56,189,248,0.6)] animate-pulse"
              style={{ animationDuration: '4s' }}
            />
            {/* Tile B: Small Violet */}
            <rect
              x="305"
              y="88"
              width="24"
              height="24"
              rx="5"
              transform="rotate(22 305 88)"
              fill="#c084fc"
              className="drop-shadow-[0_0_10px_rgba(192,132,252,0.5)]"
            />
            {/* Tile C: Medium Warm Amber */}
            <rect
              x="274"
              y="114"
              width="32"
              height="32"
              rx="7"
              transform="rotate(24 274 114)"
              fill="#f59e0b"
              className="drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]"
            />
          </svg>
        </div>

        {/* Card Details Footer */}
        {showDetails && (
          <div className="mt-3 px-2 flex items-center justify-between">
            <div>
              <h4 className="text-sm md:text-base font-bold text-white tracking-wide">
                {title}
              </h4>
              <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
