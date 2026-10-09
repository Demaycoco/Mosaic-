import React from 'react';
import { GoogleAuthButton } from '../common/GoogleAuthButton';
import { MosaicHeroCard } from '../brand/MosaicHeroCard';
import { Avatar } from '../common/Avatar';
import { Heart, Compass } from 'lucide-react';
import { NftItem } from '../../types';

interface HeroSectionProps {
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onExploreClick: () => void;
  onSelectNft: (nft: NftItem) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenAuth,
  onExploreClick,
  onSelectNft,
}) => {
  return (
    <section className="relative min-h-screen pt-28 pb-20 md:pt-36 md:pb-32 flex items-center overflow-hidden">
      {/* Deep ambient background glows matching Mosaic visual identity */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/3 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Typography & CTAs */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-6 md:space-y-8 text-center lg:text-left">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2">
              <span className="text-xs md:text-sm font-bold tracking-[0.22em] text-cyan-400 uppercase">
                SOCIAL NFT PLATFORM
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
              NFTs meet{' '}
              <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#38bdf8] via-[#a855f7] to-[#ec4899] bg-clip-text text-transparent">
                real people
              </span>
              <span className="text-[#f97316]">.</span>
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-xl mx-auto lg:mx-0">
              Mosaic is a social NFT platform where people and projects connect, showcase their NFTs, and create experiences together.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              {/* Google Sign-in Primary Button */}
              <GoogleAuthButton
                variant="primary"
                label="Sign up with Google"
                showArrow
                onClick={() => onOpenAuth('signup')}
              />

              {/* Secondary Explore Button */}
              <button
                type="button"
                onClick={onExploreClick}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold text-slate-200 bg-[#0e1222] hover:bg-[#141b33] border border-white/10 hover:border-purple-500/40 transition-all duration-200 cursor-pointer w-full sm:w-auto"
              >
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>Explore NFTs</span>
              </button>
            </div>

            {/* Secondary Sign-in Link */}
            <div className="pt-1 text-sm text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onOpenAuth('signin')}
                className="text-white font-medium underline underline-offset-4 hover:text-purple-300 transition-colors ml-1 cursor-pointer"
              >
                Sign in
              </button>
            </div>
          </div>

          {/* Right Column: Visual Collage inspired by Screenshots */}
          <div className="lg:col-span-7 xl:col-span-7 relative flex items-center justify-center min-h-[460px] sm:min-h-[580px] lg:min-h-[640px]">
            {/* Constellation SVG Connecting Threads */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              viewBox="0 0 600 600"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Curve from Top Avatar to Center Card */}
              <path
                d="M 330 60 C 330 140 370 190 350 250"
                stroke="url(#line-glow-1)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              {/* Curve from Right Avatar to Center Card */}
              <path
                d="M 520 160 C 470 200 450 280 390 320"
                stroke="url(#line-glow-2)"
                strokeWidth="1.5"
              />
              {/* Curve from Bottom Avatar to Center Card */}
              <path
                d="M 390 520 C 370 460 350 420 340 380"
                stroke="url(#line-glow-3)"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              {/* Curve from Left Avatar to Center Card */}
              <path
                d="M 230 460 C 270 420 290 380 300 350"
                stroke="url(#line-glow-1)"
                strokeWidth="1.2"
              />

              <defs>
                <linearGradient id="line-glow-1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="line-glow-2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="line-glow-3" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
                </linearGradient>
              </defs>
            </svg>

            {/* Collage Cluster Elements */}
            <div className="relative w-full max-w-[560px] h-full flex items-center justify-center">
              {/* Card 1: Top-Left Primate / Cyber Ape Artwork (tilted) */}
              <div className="absolute -top-4 sm:top-2 left-0 sm:left-4 w-36 sm:w-48 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-purple-500/30 transform -rotate-12 hover:rotate-0 hover:z-30 transition-all duration-300 group cursor-pointer bg-[#0e1220]">
                <img
                  src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=500&auto=format&fit=crop&q=80"
                  alt="Cyber Ape NFT"
                  className="w-full aspect-[4/5] object-cover"
                />
                <div className="p-2 sm:p-2.5 bg-[#090b14]/90 backdrop-blur-sm border-t border-white/5">
                  <p className="text-[10px] sm:text-xs font-bold text-white truncate">Cyber Ape #912</p>
                  <p className="text-[8px] sm:text-[10px] text-slate-400">Streetwear Syndicate</p>
                </div>
              </div>

              {/* Card 2: Top-Right Neon Portrait (Human Creator - tilted) */}
              <div className="absolute top-4 sm:top-6 right-0 sm:right-2 w-38 sm:w-52 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-cyan-500/30 transform rotate-8 hover:rotate-0 hover:z-30 transition-all duration-300 group cursor-pointer bg-[#0e1220]">
                <img
                  src="https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80"
                  alt="Lumina Creator Portrait"
                  className="w-full aspect-[4/5] object-cover"
                />
                <div className="p-2 sm:p-2.5 bg-[#090b14]/90 backdrop-blur-sm border-t border-white/5">
                  <p className="text-[10px] sm:text-xs font-bold text-white truncate">Lumina #12</p>
                  <p className="text-[8px] sm:text-[10px] text-slate-400">By Priya Nair</p>
                </div>
              </div>

              {/* Card 3: Bottom-Left Creator looking at skyline (Human Lifestyle - tilted) */}
              <div className="absolute -bottom-2 sm:bottom-4 left-2 sm:left-6 w-36 sm:w-48 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-white/10 transform rotate-6 hover:rotate-0 hover:z-30 transition-all duration-300 group cursor-pointer bg-[#0e1220]">
                <img
                  src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80"
                  alt="Urban Visionary"
                  className="w-full aspect-square object-cover"
                />
                <div className="p-2 sm:p-2.5 bg-[#090b14]/90 backdrop-blur-sm border-t border-white/5">
                  <p className="text-[10px] sm:text-xs font-bold text-white truncate">Spires of Dawn</p>
                  <p className="text-[8px] sm:text-[10px] text-slate-400">5 Contributors</p>
                </div>
              </div>

              {/* Card 4: Bottom-Right Pixel / Sci-Fi Art (tilted) */}
              <div className="absolute bottom-2 sm:bottom-6 right-2 sm:right-6 w-36 sm:w-48 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-pink-500/30 transform -rotate-8 hover:rotate-0 hover:z-30 transition-all duration-300 group cursor-pointer bg-[#0e1220]">
                <img
                  src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&auto=format&fit=crop&q=80"
                  alt="Astral Gateway"
                  className="w-full aspect-[4/5] object-cover"
                />
                <div className="p-2 sm:p-2.5 bg-[#090b14]/90 backdrop-blur-sm border-t border-white/5">
                  <p className="text-[10px] sm:text-xs font-bold text-white truncate">Astral Gateway</p>
                  <p className="text-[8px] sm:text-[10px] text-slate-400">Sarah Jenkins</p>
                </div>
              </div>

              {/* CENTERPIECE: Mosaic Slab (CHOG #1847) */}
              <div
                className="relative z-20 w-52 sm:w-68 md:w-72 cursor-pointer transform -rotate-2 hover:rotate-0 transition-transform duration-500"
                onClick={() =>
                  onSelectNft({
                    id: 'chog-1847',
                    tokenId: '#1847',
                    name: 'CHOG #1847',
                    collection: 'The Contrarian',
                    creator: {
                      name: 'Mosaic Core',
                      handle: '@mosaic',
                      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                    },
                    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
                    tags: ['Relay Active', 'Living Story', 'Genesis'],
                    likes: 1420,
                    relaysCount: 38,
                    commentsCount: 94,
                    price: '2.4 ETH',
                    storySnippet: 'Passed through 4 creators across 3 continents. Every hand modified the emotional resonance.',
                  })
                }
              >
                <MosaicHeroCard showDetails />
              </div>

              {/* Floating Human Avatar Bubbles (Nodes on Constellation) */}
              {/* Top Center Avatar Node */}
              <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 p-1.5 rounded-full bg-[#0d1020]/90 border border-purple-500/40 backdrop-blur-md shadow-lg shadow-purple-900/30">
                <Avatar
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                  name="Marcus"
                  size="xs"
                />
                <span className="text-[10px] font-semibold text-slate-200 pr-1 hidden sm:inline">Marcus V.</span>
              </div>

              {/* Mid-Left Avatar Node */}
              <div className="absolute top-1/2 -translate-y-12 left-0 sm:-left-3 z-30 p-1 rounded-full bg-[#0d1020]/90 border border-cyan-500/40 backdrop-blur-md shadow-lg">
                <Avatar
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
                  name="Alex"
                  size="xs"
                />
              </div>

              {/* Bottom Right Avatar Node */}
              <div className="absolute bottom-6 sm:bottom-10 right-1/4 z-30 p-1 rounded-full bg-[#0d1020]/90 border border-pink-500/40 backdrop-blur-md shadow-lg">
                <Avatar
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                  name="Sarah"
                  size="xs"
                />
              </div>

              {/* Floating Reaction Pill with Heart */}
              <div className="absolute top-28 sm:top-36 right-0 sm:right-6 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#111425]/90 border border-pink-500/30 backdrop-blur-md shadow-lg shadow-pink-900/30 animate-bounce" style={{ animationDuration: '3s' }}>
                <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
                <span className="text-[10px] font-bold text-slate-200">1.4k</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
