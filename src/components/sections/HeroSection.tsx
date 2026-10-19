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

            {/* Collage Cluster Elements: Clean Brand Visuals without Mock Data */}
            <div className="relative w-full max-w-[560px] h-full flex items-center justify-center">
              {/* Feature Badge 1: Top-Left Collaborative Relays */}
              <div className="absolute -top-2 sm:top-4 left-2 sm:left-6 px-4 py-2 rounded-2xl bg-[#0e1220]/90 backdrop-blur-md border border-purple-500/30 shadow-xl transform -rotate-6 hover:rotate-0 transition-transform">
                <p className="text-[10px] sm:text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  Collaborative Lore
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">Decision-based provenance</p>
              </div>

              {/* Feature Badge 2: Top-Right Verified Provenance */}
              <div className="absolute top-6 sm:top-8 right-2 sm:right-6 px-4 py-2 rounded-2xl bg-[#0e1220]/90 backdrop-blur-md border border-cyan-500/30 shadow-xl transform rotate-6 hover:rotate-0 transition-transform">
                <p className="text-[10px] sm:text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
                  Verified Identity
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">Google Auth & On-chain</p>
              </div>

              {/* Feature Badge 3: Bottom-Left Project Spaces */}
              <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 px-4 py-2 rounded-2xl bg-[#0e1220]/90 backdrop-blur-md border border-white/10 shadow-xl transform rotate-3 hover:rotate-0 transition-transform">
                <p className="text-[10px] sm:text-xs font-bold text-white">Project Hubs</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Creator communities</p>
              </div>

              {/* Feature Badge 4: Bottom-Right Multi-Author Relays */}
              <div className="absolute bottom-6 sm:bottom-10 right-4 sm:right-8 px-4 py-2 rounded-2xl bg-[#0e1220]/90 backdrop-blur-md border border-pink-500/30 shadow-xl transform -rotate-4 hover:rotate-0 transition-transform">
                <p className="text-[10px] sm:text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_8px_#ec4899]" />
                  Multi-Author History
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">Every hand enriches the tale</p>
              </div>

              {/* CENTERPIECE: Mosaic Stained-Glass Genesis Slab */}
              <div
                className="relative z-20 w-56 sm:w-72 md:w-80 cursor-pointer transform hover:scale-[1.02] transition-transform duration-500"
                onClick={() => onOpenAuth('signup')}
              >
                <MosaicHeroCard
                  showDetails
                  title="Mosaic Genesis"
                  subtitle="Living Collaborative Artifact"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
