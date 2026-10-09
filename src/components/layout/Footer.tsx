import React from 'react';
import { MosaicLogo } from '../brand/MosaicLogo';

interface FooterProps {
  onNavigate: (sectionId: string) => void;
  onOpenAuth: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenAuth }) => {
  return (
    <footer className="relative bg-[#040508] border-t border-white/5 pt-16 pb-12 overflow-hidden">
      {/* Subtle ambient gradient highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-purple-900/10 to-transparent blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-14">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="cursor-pointer" onClick={() => onNavigate('home')}>
              <MosaicLogo size="md" withText textClassName="text-white font-extrabold tracking-[0.2em] text-xl" />
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Mosaic is a social NFT platform where people and projects connect, showcase their NFTs, and turn ownership into interactive shared experiences.
            </p>
            <div className="pt-2 flex items-center gap-3 text-xs text-slate-500">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
              <span>Mosaic Network Active</span>
              <span aria-hidden="true">·</span>
              <span>Genesis Era</span>
            </div>
          </div>

          {/* Navigation Column: Platform */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 tracking-wider uppercase mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('explore')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Explore NFTs
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('relay')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  NFT Relay
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('profiles')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Creator Profiles
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('projects')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  NFT Projects
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('social')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Social Hub
                </button>
              </li>
            </ul>
          </div>

          {/* Navigation Column: Community */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 tracking-wider uppercase mb-4">
              Community
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('community')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Guilds & Collectives
                </button>
              </li>
              <li>
                <a
                  href="#manifesto"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('about');
                  }}
                  className="hover:text-white transition-colors"
                >
                  The Mosaic Manifesto
                </a>
              </li>
              <li>
                <button
                  onClick={onOpenAuth}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Join with Google
                </button>
              </li>
              <li>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Twitter / X
                </a>
              </li>
            </ul>
          </div>

          {/* Navigation Column: Legal & Trust */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 tracking-wider uppercase mb-4">
              Ecosystem
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <a
                  href="#terms"
                  onClick={(e) => e.preventDefault()}
                  className="hover:text-white transition-colors"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="#privacy"
                  onClick={(e) => e.preventDefault()}
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#guidelines"
                  onClick={(e) => e.preventDefault()}
                  className="hover:text-white transition-colors"
                >
                  Community Code
                </a>
              </li>
              <li>
                <a
                  href="#brand"
                  onClick={(e) => e.preventDefault()}
                  className="hover:text-white transition-colors"
                >
                  Brand Assets
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 MOSAIC. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Designed for real people</span>
            <span aria-hidden="true">·</span>
            <span>Web3 Social Experience</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
