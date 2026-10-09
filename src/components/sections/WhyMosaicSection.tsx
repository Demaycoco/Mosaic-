import React from 'react';
import { UserCheck, Layers, GitFork, Users2, ArrowRight } from 'lucide-react';

interface WhyMosaicSectionProps {
  onLearnMoreRelay: () => void;
  onExploreProfiles: () => void;
  onExploreProjects: () => void;
  onExploreSocial: () => void;
}

export const WhyMosaicSection: React.FC<WhyMosaicSectionProps> = ({
  onLearnMoreRelay,
  onExploreProfiles,
  onExploreProjects,
  onExploreSocial,
}) => {
  const features = [
    {
      id: 'profiles',
      icon: UserCheck,
      iconBg: 'bg-purple-950/60 border-purple-500/30 text-purple-400',
      title: 'Profiles',
      description: 'Create your profile, showcase your NFTs, and connect with creators, collectors, and communities.',
      actionText: 'Explore Profiles',
      onClick: onExploreProfiles,
    },
    {
      id: 'projects',
      icon: Layers,
      iconBg: 'bg-blue-950/60 border-cyan-500/30 text-cyan-400',
      title: 'NFT Projects',
      description: 'Build your project’s profile, showcase your collection, and grow your community directly on Mosaic.',
      actionText: 'View Projects',
      onClick: onExploreProjects,
    },
    {
      id: 'relay',
      icon: GitFork,
      iconBg: 'bg-indigo-950/70 border-violet-500/40 text-violet-300',
      title: 'NFT Relay',
      isCoreFeature: true,
      description: 'Pass an NFT through people, collect their decisions, and watch its living story evolve through provenance.',
      actionText: 'Experience Relay',
      onClick: onLearnMoreRelay,
    },
    {
      id: 'social',
      icon: Users2,
      iconBg: 'bg-pink-950/60 border-pink-500/30 text-pink-400',
      title: 'Social Hub',
      description: 'Follow creators, engage in story discussions, discover emerging drops, and be part of what’s next.',
      actionText: 'Join the Hub',
      onClick: onExploreSocial,
    },
  ];

  return (
    <section id="why-mosaic" className="relative py-24 md:py-32 border-t border-white/5 bg-[#06080e] overflow-hidden">
      {/* Background illumination */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Heading & Editorial Exposition */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2">
              <span className="text-xs md:text-sm font-bold tracking-[0.2em] text-cyan-400 uppercase">
                WHY MOSAIC
              </span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.12]">
              More than <br />
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                just an NFT
              </span>
              <span className="text-[#f97316]">.</span>
            </h2>

            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
              Mosaic gives NFTs a social layer, so your assets can be seen, shared, and experienced with others. Ownership is no longer a static transaction in a lonely wallet—it is an ongoing shared journey.
            </p>

            <div className="pt-2">
              <div className="p-5 rounded-2xl bg-[#0c1020] border border-purple-500/20 space-y-3">
                <p className="text-xs uppercase tracking-wider text-purple-300 font-bold">
                  The Social Paradigm
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Every artwork on Mosaic maintains an evolving ledger of human impressions: who held it, what decisions they made, and how they enriched its story.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: 2x2 Feature Cards Grid matching screenshot */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.id}
                  onClick={feature.onClick}
                  className={`group relative p-6 sm:p-7 rounded-2xl bg-[#0a0d1a] border transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between ${
                    feature.isCoreFeature
                      ? 'border-purple-500/40 shadow-lg shadow-purple-950/40 hover:border-purple-400 hover:shadow-purple-900/50'
                      : 'border-white/10 hover:border-white/20 hover:bg-[#0f1426]'
                  }`}
                >
                  <div>
                    {/* Header with Icon and optional CORE FEATURE badge */}
                    <div className="flex items-center justify-between mb-5">
                      <div className={`p-3 rounded-xl border ${feature.iconBg} group-hover:scale-105 transition-transform`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      {feature.isCoreFeature && (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          CORE FEATURE
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                      {feature.title}
                    </h3>

                    <p className="text-sm text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Clean Text Action */}
                  <div className="pt-6 mt-2 flex items-center text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">
                    <span>{feature.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform text-cyan-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
