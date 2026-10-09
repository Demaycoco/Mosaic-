import React, { useState } from 'react';
import { nftService } from '../../services/nftService';
import { NftItem } from '../../types';
import { NftImage } from '../common/NftImage';
import { Avatar } from '../common/Avatar';
import { Heart, GitFork, Sparkles, Filter, ExternalLink } from 'lucide-react';

interface DiscoverSectionProps {
  onSelectNft: (nft: NftItem) => void;
  onOpenAuth: () => void;
}

export const DiscoverSection: React.FC<DiscoverSectionProps> = ({
  onSelectNft,
  onOpenAuth,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'relay' | 'generative' | 'cyberpunk'>('all');
  const allNfts = nftService.getAllNfts();

  const filteredNfts = allNfts.filter((nft) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'relay') return nft.relaysCount > 20;
    if (activeCategory === 'generative') return nft.tags.includes('Generative') || nft.tags.includes('Genesis');
    if (activeCategory === 'cyberpunk') return nft.tags.includes('Cyberpunk') || nft.tags.includes('Cybernetic') || nft.tags.includes('Pixel Art');
    return true;
  });

  return (
    <section id="explore" className="relative py-24 md:py-32 border-t border-white/5 bg-[#06070e] overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header with Category Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3 max-w-xl">
            <span className="text-xs md:text-sm font-bold tracking-[0.2em] text-cyan-400 uppercase">
              DISCOVER & EXPLORE
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Curated across the{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                Mosaic network
              </span>
              .
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Discover living artifacts shaped by collective authorship, from genesis releases to evolving multi-stage community pieces.
            </p>
          </div>

          {/* Interactive Filter Controls */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 self-start md:self-auto overflow-x-auto">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-purple-600/40 text-white shadow-sm border border-purple-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Artifacts
            </button>
            <button
              onClick={() => setActiveCategory('relay')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === 'relay'
                  ? 'bg-purple-600/40 text-white shadow-sm border border-purple-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Active Relays
            </button>
            <button
              onClick={() => setActiveCategory('generative')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === 'generative'
                  ? 'bg-purple-600/40 text-white shadow-sm border border-purple-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Generative
            </button>
            <button
              onClick={() => setActiveCategory('cyberpunk')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === 'cyberpunk'
                  ? 'bg-purple-600/40 text-white shadow-sm border border-purple-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cybernetic & Sci-Fi
            </button>
          </div>
        </div>

        {/* Artifacts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredNfts.map((nft) => (
            <div
              key={nft.id}
              onClick={() => onSelectNft(nft)}
              className="group rounded-3xl bg-[#090b16] border border-white/10 hover:border-purple-500/40 transition-all duration-300 overflow-hidden shadow-xl hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between"
            >
              {/* Image Preview with Badges */}
              <div className="relative overflow-hidden aspect-[4/3] bg-slate-900">
                <NftImage src={nft.image} alt={nft.name} />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-bold text-white border border-white/10">
                  {nft.collection}
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-950/80 backdrop-blur-md text-[11px] font-bold text-purple-200 border border-purple-500/30">
                  <GitFork className="w-3 h-3 text-cyan-400" />
                  <span>{nft.relaysCount} Relays</span>
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <div className="flex items-center gap-2">
                      <Avatar src={nft.creator.avatar} name={nft.creator.name} size="xs" />
                      <span className="font-medium text-slate-300">{nft.creator.name}</span>
                    </div>
                    <span className="font-semibold text-slate-200">{nft.price}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                    {nft.name}
                  </h3>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {nft.storySnippet}
                  </p>
                </div>

                {/* Footer action bar */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 text-rose-400">
                    <Heart className="w-3.5 h-3.5 fill-rose-500/20" />
                    <span className="font-medium">{nft.likes}</span>
                  </div>

                  <span className="flex items-center gap-1 text-cyan-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                    <span>Inspect Story</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All CTA */}
        <div className="text-center pt-12">
          <button
            onClick={onOpenAuth}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-sm font-bold text-white transition-all cursor-pointer hover:border-purple-400/50"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Load More Community Collections</span>
          </button>
        </div>
      </div>
    </section>
  );
};
