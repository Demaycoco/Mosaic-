import React, { useState } from 'react';
import { userService } from '../../services/userService';
import { nftService } from '../../services/nftService';
import { Avatar } from '../common/Avatar';
import { NftImage } from '../common/NftImage';
import { ShieldCheck, Plus, Check, Heart, ExternalLink, Sparkles } from 'lucide-react';
import { NftItem, Creator } from '../../types';

interface ProfilesSectionProps {
  onOpenAuth: () => void;
  onSelectNft: (nft: NftItem) => void;
}

export const ProfilesSection: React.FC<ProfilesSectionProps> = ({
  onOpenAuth,
  onSelectNft,
}) => {
  const creators = userService.getAllUsers();
  const nfts = nftService.getAllNfts();
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>(creators[0]?.id || 'creator-sarah');
  const [followedIds, setFollowedIds] = useState<Record<string, boolean>>({});

  const activeCreator: Creator =
    creators.find((c) => c.id === selectedCreatorId) || creators[0];

  const toggleFollow = (id: string) => {
    setFollowedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section id="profiles" className="relative py-24 md:py-32 border-t border-white/5 bg-[#05060b] overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 right-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs md:text-sm font-bold tracking-[0.2em] text-cyan-400 uppercase">
            CREATOR & COLLECTOR IDENTITY
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Profiles built for{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
              real relationships
            </span>
            .
          </h2>
          <p className="text-base sm:text-lg text-slate-300">
            Showcase your NFTs, reveal the collaborative decisions you’ve made across relays, and connect directly with fellow creators and collectors.
          </p>
        </div>

        {/* Creator Selection Bar */}
        <div className="flex items-center justify-center gap-3 overflow-x-auto pb-4 mb-8">
          {creators.map((creator) => {
            const isSelected = creator.id === selectedCreatorId;
            return (
              <button
                key={creator.id}
                onClick={() => setSelectedCreatorId(creator.id)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-full border transition-all text-xs font-semibold cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-purple-600/30 border-purple-400 text-white shadow-lg shadow-purple-900/40'
                    : 'bg-[#0a0d18] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                <Avatar src={creator.avatar} name={creator.name} size="xs" />
                <span>{creator.name}</span>
                {creator.verified && <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
            );
          })}
        </div>

        {/* Active Profile Showcase Card */}
        <div className="relative rounded-3xl bg-[#090b14] border border-white/10 shadow-2xl p-6 sm:p-8 md:p-10 overflow-hidden">
          {/* Subtle profile banner backdrop */}
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-r from-blue-900/30 via-purple-900/40 to-pink-900/30 opacity-70" />

          <div className="relative z-10 pt-10">
            {/* Profile Meta Row */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-8 border-b border-white/10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="relative">
                  <Avatar
                    src={activeCreator.avatar}
                    name={activeCreator.name}
                    size="xl"
                    className="ring-4 ring-[#090b14] shadow-xl"
                  />
                  <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-[#090b14]" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-white">
                      {activeCreator.name}
                    </h3>
                    {activeCreator.verified && (
                      <span title="Verified Creator">
                        <ShieldCheck className="w-5 h-5 text-cyan-400" />
                      </span>
                    )}
                    {activeCreator.badge && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {activeCreator.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-purple-400 font-medium">{activeCreator.handle}</p>
                  <p className="text-sm text-slate-300 max-w-md pt-1 leading-relaxed">
                    {activeCreator.bio}
                  </p>
                </div>
              </div>

              {/* Action Buttons & Statistics */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 self-stretch md:self-auto justify-between md:justify-end">
                <div className="flex items-center gap-5 text-center">
                  <div>
                    <p className="text-lg font-bold text-white">
                      {activeCreator.followersCount.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400">Followers</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div>
                    <p className="text-lg font-bold text-white">{activeCreator.nftsCount}</p>
                    <p className="text-xs text-slate-400">Artifacts</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleFollow(activeCreator.id)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    followedIds[activeCreator.id]
                      ? 'bg-purple-900/40 text-purple-200 border border-purple-400/50'
                      : 'bg-white text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {followedIds[activeCreator.id] ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Showcase Grid of the Creator's NFTs */}
            <div className="pt-8">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Featured Collection & Relays
                </h4>
                <button
                  onClick={onOpenAuth}
                  className="text-xs text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
                >
                  View full catalog →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {nfts.slice(0, 3).map((nft) => (
                  <div
                    key={nft.id}
                    onClick={() => onSelectNft(nft)}
                    className="group rounded-2xl bg-[#0c0e1a] border border-white/10 hover:border-purple-500/40 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col"
                  >
                    <div className="relative overflow-hidden aspect-[4/3]">
                      <NftImage src={nft.image} alt={nft.name} />
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                        {nft.relaysCount} Relays
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>{nft.collection}</span>
                          <span className="text-slate-300 font-medium">{nft.price}</span>
                        </div>
                        <h5 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors mt-1">
                          {nft.name}
                        </h5>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {nft.storySnippet}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1 text-rose-400">
                          <Heart className="w-3.5 h-3.5 fill-rose-500/40" />
                          <span>{nft.likes}</span>
                        </span>
                        <span className="flex items-center gap-1 text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                          <span>Inspect Provenance</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
