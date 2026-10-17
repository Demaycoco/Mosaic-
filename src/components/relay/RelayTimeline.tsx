import React from 'react';
import { RelayExperience, RelayStep } from '../../types';
import { Avatar } from '../common/Avatar';
import { Sparkles, ArrowDown, HelpCircle, Clock, ShieldCheck, Check } from 'lucide-react';

interface RelayTimelineProps {
  relay: RelayExperience;
  onSelectUser?: (username: string) => void;
}

export const RelayTimeline: React.FC<RelayTimelineProps> = ({ relay, onSelectUser }) => {
  return (
    <div className="space-y-6">
      {/* 1. Genesis NFT Node */}
      <div className="relative rounded-2xl bg-[#090e1f] border border-cyan-500/30 p-4 sm:p-5 shadow-lg shadow-cyan-950/20">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <img
              src={relay.nftImage}
              alt={relay.title}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover ring-2 ring-cyan-500/40"
            />
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-400 text-[9px] font-bold text-cyan-300">
              NFT
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-extrabold uppercase tracking-wider">
                Genesis Asset
              </span>
              <span className="text-xs font-mono text-slate-400">{relay.tokenId}</span>
            </div>

            <h4 className="text-base sm:text-lg font-extrabold text-white truncate mt-1">
              {relay.collection}
            </h4>
            <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
              Original NFT remains with owner {relay.creatorHandle || ''}. Journey co-created by {relay.participantsCount} participants.
            </p>
          </div>
        </div>
      </div>

      {/* Down Connector */}
      <div className="flex justify-center -my-3">
        <div className="flex flex-col items-center">
          <div className="w-0.5 h-6 bg-gradient-to-b from-cyan-400 to-purple-500" />
          <ArrowDown className="w-4 h-4 text-purple-400 -mt-1 animate-bounce" />
        </div>
      </div>

      {/* 2. Visual Sequential Chapter Tree: Person 1 ↓ Person 2 ↓ Person 3... */}
      <div className="relative space-y-3 before:absolute before:top-4 before:bottom-4 before:left-6 sm:before:left-7 before:w-0.5 before:bg-gradient-to-b before:from-purple-500 before:via-pink-500 before:to-cyan-500">
        {relay.steps.map((step, index) => {
          const isLatest = index === relay.steps.length - 1;
          const isCreateAction = step.action?.toUpperCase().includes('CREATE');
          const isChangeAction = step.action?.toUpperCase().includes('CHANGE');

          return (
            <React.Fragment key={index}>
              <div className="relative flex items-start gap-4 sm:gap-5 pl-1">
                {/* Timeline Node Icon / Avatar */}
                <div className="relative z-10 shrink-0">
                  <Avatar
                    src={step.avatar}
                    name={step.personName}
                    size="md"
                    className="ring-4 ring-[#06070a] shadow-md cursor-pointer hover:scale-105 transition-transform"
                  />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#090b16] border border-white/20 text-[10px] font-bold text-white flex items-center justify-center">
                    {step.step}
                  </span>
                </div>

                {/* Chapter Card */}
                <div
                  className={`flex-1 rounded-2xl p-4 sm:p-5 border transition-all ${
                    isLatest
                      ? 'bg-[#0f1428] border-purple-500/40 shadow-xl shadow-purple-950/20'
                      : 'bg-[#090c1a] border-white/10'
                  }`}
                >
                  {/* Header: Identity, Action Pill & Timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/5">
                    <div
                      onClick={() =>
                        onSelectUser &&
                        onSelectUser(step.personHandle.replace(/^@/, ''))
                      }
                      className="cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-white group-hover:text-cyan-300 transition-colors">
                          {step.step}. {step.personName}
                        </span>
                        <span className="text-xs text-purple-400 font-mono">
                          {step.personHandle}
                        </span>
                      </div>
                      <p className={`text-xs font-black uppercase tracking-wider mt-0.5 ${
                        isCreateAction ? 'text-cyan-300' : isChangeAction ? 'text-pink-300' : 'text-purple-300'
                      }`}>
                        {step.action.toUpperCase() === 'CREATE' ? 'Created' : step.action.toUpperCase() === 'CHANGE' ? 'Changed' : step.action}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Answer Badge */}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-sm flex items-center gap-1.5 ${
                          isCreateAction
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                            : isChangeAction
                            ? 'bg-pink-500/20 text-pink-300 border border-pink-400/40'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-400/40'
                        }`}
                      >
                        <span className="text-[10px] font-medium text-slate-400 lowercase">answer:</span>
                        <span>{step.action}</span>
                      </span>

                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {step.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* Lore Commentary */}
                  <div className="pt-2.5 space-y-2">
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                      {step.decisionText}
                    </p>

                    {/* Prediction Pill */}
                    {step.prediction && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[11px] text-slate-300">
                        <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                        <span className="text-slate-400">Predicted Next Choice:</span>
                        <strong className="text-pink-300 uppercase font-black">{step.prediction}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Down Connector Between Contributors */}
              {index < relay.steps.length - 1 && (
                <div className="flex items-center pl-6 sm:pl-7 -my-1">
                  <div className="w-4 flex justify-center">
                    <ArrowDown className="w-3.5 h-3.5 text-purple-400/70" />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 3. Next Chapter Slot Invitation */}
      <div className="relative flex items-center gap-4 pl-1 pt-1 opacity-70 hover:opacity-100 transition-opacity">
        <div className="relative z-10 w-10 h-10 rounded-full border-2 border-dashed border-cyan-500/40 bg-cyan-950/20 text-cyan-400 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold">+{relay.steps.length + 1}</span>
        </div>
        <div className="flex-1 py-3 px-4 rounded-xl border border-dashed border-white/10 bg-white/5 text-xs text-slate-400 flex items-center justify-between">
          <span>Chapter {relay.steps.length + 1} is open for the next community curator...</span>
          <span className="text-[10px] font-bold uppercase text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded">
            Next Fork
          </span>
        </div>
      </div>
    </div>
  );
};
