import React, { useState } from 'react';
import {
  Trophy,
  CheckCircle2,
  Lock,
  GitFork,
  Users,
  Split,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { RelayMilestone } from '../../types';

interface RelayMilestonesCardProps {
  milestones: RelayMilestone[];
}

export const RelayMilestonesCard: React.FC<RelayMilestonesCardProps> = ({ milestones }) => {
  const [showAll, setShowAll] = useState(false);

  const unlockedMilestones = milestones.filter((m) => m.unlocked);
  const lockedMilestones = milestones.filter((m) => !m.unlocked);

  const getMilestoneIcon = (id: RelayMilestone['id']) => {
    switch (id) {
      case 'first_relay':
        return GitFork;
      case 'ten_humans':
        return Users;
      case 'first_contradiction':
        return Split;
      case 'prediction_streak':
        return Sparkles;
      case 'twenty_five_decisions':
        return Award;
      case 'hundred_participants':
        return Trophy;
      default:
        return Trophy;
    }
  };

  return (
    <div className="rounded-3xl bg-[#090d1c] border border-white/10 p-6 sm:p-7 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Trophy className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Relay Milestones</h3>
            <p className="text-[11px] text-slate-400">
              Provenance achievements earned through genuine community interactions
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/50 border border-amber-500/30 px-3 py-1 rounded-full">
          {unlockedMilestones.length} / {milestones.length} Unlocked
        </span>
      </div>

      {/* Unlocked Milestones Grid */}
      {unlockedMilestones.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {unlockedMilestones.map((m) => {
            const Icon = getMilestoneIcon(m.id);
            return (
              <div
                key={m.id}
                className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/30 via-[#0a0d1e] to-[#0d1226] border border-amber-500/40 relative overflow-hidden group hover:border-amber-400 transition-all shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Unlocked
                  </span>
                </div>

                <div className="mt-3 space-y-1">
                  <h4 className="text-sm font-extrabold text-white group-hover:text-amber-200 transition-colors">
                    {m.title}
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {m.description}
                  </p>
                </div>

                {m.unlockedAtChapter && (
                  <p className="text-[10px] text-amber-400/80 font-mono mt-2 pt-1 border-t border-white/5">
                    Achieved at Chapter {m.unlockedAtChapter}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 text-center text-xs text-slate-400 bg-white/5 rounded-2xl border border-white/5">
          No milestones unlocked yet. Participate in this Relay to unlock the first achievement!
        </div>
      )}

      {/* Toggle View for Upcoming Milestones */}
      {lockedMilestones.length > 0 && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer font-semibold"
          >
            <span>{showAll ? 'Hide upcoming milestones' : `View ${lockedMilestones.length} upcoming milestones`}</span>
            {showAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAll && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-3">
              {lockedMilestones.map((m) => {
                const Icon = getMilestoneIcon(m.id);
                const pct = Math.round((m.currentProgress / m.targetProgress) * 100);

                return (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-[#060812] border border-white/5 text-slate-400 space-y-2 opacity-75"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="p-2.5 rounded-xl bg-white/5 text-slate-500 border border-white/5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" />
                        Locked
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-300">{m.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                        {m.description}
                      </p>
                    </div>

                    <div className="pt-1 space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Progress</span>
                        <span>{m.currentProgress} / {m.targetProgress}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-purple-500/50 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
