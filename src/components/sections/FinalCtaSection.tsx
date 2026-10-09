import React from 'react';
import { GoogleAuthButton } from '../common/GoogleAuthButton';
import { ArrowRight, Sparkles } from 'lucide-react';

interface FinalCtaSectionProps {
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({ onOpenAuth }) => {
  return (
    <section className="relative py-28 md:py-36 border-t border-white/5 bg-[#05060b] overflow-hidden">
      {/* Background illumination & deep sweep gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/20 to-black pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-gradient-to-tl from-purple-600/20 via-pink-600/10 to-transparent blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Text & CTAs */}
          <div className="lg:col-span-6 space-y-6 md:space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2">
              <span className="text-xs md:text-sm font-bold tracking-[0.2em] text-cyan-400 uppercase">
                READY TO START?
              </span>
            </div>

            <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
              Give your NFTs <br />
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                a story
              </span>
              <span className="text-[#f97316]">.</span>
            </h2>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Join Mosaic today and be part of a community where NFTs do more than just exist. Connect with Google in seconds and start collaborating with real people.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <GoogleAuthButton
                variant="primary"
                label="Sign up with Google"
                showArrow
                onClick={() => onOpenAuth('signup')}
              />

              <button
                type="button"
                onClick={() => onOpenAuth('signin')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
              >
                <span>Existing Member Sign In</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Right Column: 3D Tilted Cards Fan with Handwritten Script (Screenshot 2) */}
          <div className="lg:col-span-6 relative flex flex-col items-center justify-center min-h-[400px]">
            {/* The 3 Tilted Floating Cards */}
            <div className="relative w-full max-w-[480px] h-80 flex items-center justify-center">
              {/* Card 1: Left Tilted Card (Metropolis) */}
              <div className="absolute left-6 sm:left-10 w-44 sm:w-52 rounded-2xl overflow-hidden shadow-2xl border border-blue-500/30 transform -rotate-12 -translate-y-4 hover:rotate-0 hover:z-20 transition-all duration-300 bg-[#090b16]">
                <img
                  src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80"
                  alt="Metropolis"
                  className="w-full aspect-[4/5] object-cover"
                />
              </div>

              {/* Card 3: Right Tilted Card (Astral) */}
              <div className="absolute right-6 sm:right-10 w-44 sm:w-52 rounded-2xl overflow-hidden shadow-2xl border border-pink-500/30 transform rotate-12 -translate-y-2 hover:rotate-0 hover:z-20 transition-all duration-300 bg-[#090b16]">
                <img
                  src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&auto=format&fit=crop&q=80"
                  alt="Astral Horizon"
                  className="w-full aspect-[4/5] object-cover"
                />
              </div>

              {/* Card 2: Center Front Card (Lumina Portrait) */}
              <div className="relative z-10 w-48 sm:w-56 rounded-2xl overflow-hidden shadow-2xl border border-purple-500/40 shadow-purple-950/70 transform hover:scale-105 transition-transform duration-300 bg-[#090b16]">
                <img
                  src="https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80"
                  alt="Lumina Portrait"
                  className="w-full aspect-[4/5] object-cover"
                />
                <div className="p-3 bg-[#0a0d1c]/95 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Lumina #12</span>
                  <span className="text-[10px] text-purple-400 font-semibold">Living Story</span>
                </div>
              </div>
            </div>

            {/* Handwritten script accent matching Screenshot 2: "More than just ownership." */}
            <div className="mt-4 sm:mt-6 text-right self-end pr-4 sm:pr-12 transform -rotate-3 select-none">
              <span className="font-script text-2xl sm:text-3xl md:text-4xl text-slate-300 tracking-wide drop-shadow-md">
                More than just ownership.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
