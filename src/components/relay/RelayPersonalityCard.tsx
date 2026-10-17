import React from 'react';
import { Sparkles, HelpCircle, Flame, Users, CheckCircle, Split, ShieldAlert } from 'lucide-react';
import { RelayExperience, RelayMetrics, NftPersonality } from '../../types';

interface RelayPersonalityCardProps {
  relay: RelayExperience;
  personality: NftPersonality;
  metrics: RelayMetrics;
}

export const RelayPersonalityCard: React.FC<RelayPersonalityCardProps> = ({
  relay,
  personality,
  metrics,
}) => {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#0c0f24] via-[#080b18] to-[#140b24] border border-purple-500/30 p-6 sm:p-7 shadow-2xl relative overflow-hidden">
      {/* Ambient decorative glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Header: NFT Name & Personality Tag */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                LIVING NFT PERSONALITY
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs font-mono text-slate-300">
                {relay.collection} {relay.tokenId}
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase mt-0.5">
              THE {personality.title.toUpperCase()}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {personality.tagline}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span
              className="px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shadow-md border"
              style={{
                backgroundColor: `${personality.accentColor}20`,
                borderColor: `${personality.accentColor}50`,
                color: personality.accentColor,
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{personality.title}</span>
            </span>
          </div>
        </div>

        {/* Dynamic Percentage Gauge Bar: Disagreement vs Consensus */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-rose-400 flex items-center gap-1.5">
              <Split className="w-3.5 h-3.5" />
              <span>{metrics.disagreementPct}% Disagreement</span>
            </span>
            <span className="text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{metrics.consensusPct}% Consensus</span>
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden flex p-0.5 border border-white/10">
            <div
              className="h-full rounded-l-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-700"
              style={{ width: `${metrics.disagreementPct}%` }}
              title={`${metrics.disagreementPct}% Disagreement`}
            />
            <div
              className="h-full rounded-r-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-700"
              style={{ width: `${metrics.consensusPct}%` }}
              title={`${metrics.consensusPct}% Consensus`}
            />
          </div>
        </div>

        {/* Real Interaction Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-center space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Participants
            </span>
            <p className="text-xl sm:text-2xl font-black text-white">{metrics.participantsCount}</p>
            <span className="text-[10px] text-slate-500 block">Unique Curators</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-center space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Decisions
            </span>
            <p className="text-xl sm:text-2xl font-black text-cyan-300">{metrics.decisionsCount}</p>
            <span className="text-[10px] text-slate-500 block">Actions Inscribed</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-center space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Predictions
            </span>
            <p className="text-xl sm:text-2xl font-black text-pink-300">{metrics.predictionsCount}</p>
            <span className="text-[10px] text-slate-500 block">Next-Step Forecasts</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-center space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Contradictions
            </span>
            <p className="text-xl sm:text-2xl font-black text-rose-300">{metrics.contradictionsCount}</p>
            <span className="text-[10px] text-slate-500 block">Divergent Flips</span>
          </div>
        </div>

        {/* Narrative Summary & Notice */}
        <div className="p-3.5 rounded-2xl bg-[#060810]/80 border border-white/10 text-xs text-slate-300 space-y-1">
          <p className="text-slate-200 leading-relaxed font-medium">
            {personality.summary}
          </p>
          <p className="text-[10px] text-slate-500 italic pt-1">
            * NFT personality traits are playful collective entertainment indicators calculated strictly from real stored Relay interactions, not psychological diagnoses.
          </p>
        </div>
      </div>
    </div>
  );
};
