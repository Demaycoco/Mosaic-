import React, { useState } from 'react';
import { ArrowRight, GitFork, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';
import { MosaicHeroCard } from '../brand/MosaicHeroCard';
import { Avatar } from '../common/Avatar';
import { relayService } from '../../services/relayService';

interface NftRelaySectionProps {
  onLearnMore: () => void;
  onOpenAuth: () => void;
}

export const NftRelaySection: React.FC<NftRelaySectionProps> = ({
  onLearnMore,
  onOpenAuth,
}) => {
  const [viewMode, setViewMode] = useState<'cycle' | 'timeline'>('cycle');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(1); // 0-indexed, default Sarah

  return (
    <section id="relay" className="relative py-24 md:py-36 border-t border-white/5 bg-[#05060b] overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[170px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Heading, Explanation & View Toggle */}
          <div className="lg:col-span-5 space-y-6 md:space-y-8">
            <div className="inline-flex items-center gap-2">
              <span className="text-xs md:text-sm font-bold tracking-[0.2em] text-cyan-400 uppercase">
                THE NFT RELAY
              </span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
              Turn your NFT into <br />
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                a shared story
              </span>
              <span className="text-[#f97316]">.</span>
            </h2>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              Let people interact with your NFT, make decisions, and add to its journey. The more it travels from person to person, the richer and more unique it becomes.
            </p>

            {/* Step sequence schema representation: NFT ↓ Person ↓ Decision ↓ Person ↓ Decision ↓ History */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0d1c] border border-purple-500/20 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                <GitFork className="w-3.5 h-3.5 text-cyan-400" />
                The Relay Flow Architecture
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-medium">
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white">
                  Genesis NFT
                </span>
                <span className="text-purple-400">→</span>
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-cyan-300">
                  Person
                </span>
                <span className="text-purple-400">→</span>
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-pink-300">
                  Decision
                </span>
                <span className="text-purple-400">→</span>
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-cyan-300">
                  Person
                </span>
                <span className="text-purple-400">→</span>
                <span className="px-2.5 py-1 rounded-md bg-purple-900/40 border border-purple-500/40 text-purple-200">
                  NFT History
                </span>
              </div>
            </div>

            {/* Interactive View Mode Selector */}
            <div className="flex items-center gap-2 pt-1">
              <div className="p-1 rounded-full bg-white/5 border border-white/10 inline-flex">
                <button
                  type="button"
                  onClick={() => setViewMode('cycle')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'cycle'
                      ? 'bg-purple-600/40 text-white border border-purple-400/50 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Decision Cycle
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('timeline')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'timeline'
                      ? 'bg-purple-600/40 text-white border border-purple-400/50 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Provenance Tree
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-4 pt-2">
              <button
                type="button"
                onClick={onLearnMore}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/15 hover:border-purple-400/50 transition-all cursor-pointer shadow-lg"
              >
                <span>Learn More</span>
                <ArrowRight className="w-4 h-4 text-purple-400" />
              </button>

              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Start your first Relay drop</span>
              </button>
            </div>
          </div>

          {/* Right Column: Visual Representation matching Screenshot 1 & 2 */}
          <div className="lg:col-span-7 relative flex items-center justify-center min-h-[460px] sm:min-h-[560px]">
            {viewMode === 'cycle' ? (
              /* VIEW MODE 1: Interactive Decision Cycle with Circular Orbit & Bubbles (Screenshot 1) */
              <div className="relative w-full max-w-[540px] aspect-square flex items-center justify-center p-4">
                {/* SVG Connecting Curved Arrows */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  viewBox="0 0 500 500"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="arrow-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                    <linearGradient id="arrow-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                    <marker
                      id="arrowhead"
                      markerWidth="6"
                      markerHeight="6"
                      refX="5"
                      refY="3"
                      orient="auto"
                    >
                      <polygon points="0 0, 6 3, 0 6" fill="#a855f7" />
                    </marker>
                    <marker
                      id="arrowhead-cyan"
                      markerWidth="6"
                      markerHeight="6"
                      refX="5"
                      refY="3"
                      orient="auto"
                    >
                      <polygon points="0 0, 6 3, 0 6" fill="#38bdf8" />
                    </marker>
                  </defs>

                  {/* Curve from Top Prompt to Right Action Bubble */}
                  <path
                    d="M 370 110 C 440 160 450 250 420 320"
                    stroke="url(#arrow-grad-1)"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                    strokeDasharray="4 4"
                  />

                  {/* Curve from Right Action Bubble to Bottom */}
                  <path
                    d="M 420 370 C 390 450 300 470 240 450"
                    stroke="url(#arrow-grad-2)"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />

                  {/* Curve from Left Action Bubble to Top */}
                  <path
                    d="M 120 320 C 80 240 120 140 220 90"
                    stroke="url(#arrow-grad-1)"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead-cyan)"
                  />
                </svg>

                {/* Central NFT Slab (CHOG #1847) */}
                <div className="relative z-20 w-44 sm:w-56 md:w-60 shadow-2xl">
                  <MosaicHeroCard showDetails />
                </div>

                {/* Top Question Bubble: "Would you rather create or change?" */}
                <div className="absolute top-4 sm:top-6 right-2 sm:right-6 z-30 flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-[#0f1426]/90 border border-purple-500/40 backdrop-blur-md shadow-xl animate-pulse" style={{ animationDuration: '4s' }}>
                  <div className="w-6 h-6 rounded-full bg-purple-500/30 border border-purple-400/50 flex items-center justify-center text-[10px] font-black text-purple-200">
                    Q
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] sm:text-xs font-semibold text-slate-100">
                      Would you rather
                    </p>
                    <p className="text-[10px] text-purple-300">create or change?</p>
                  </div>
                </div>

                {/* Right Action Decision Bubble: "I'd change." */}
                <div className="absolute top-1/2 translate-y-8 sm:translate-y-12 right-0 sm:-right-4 z-30 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#0f1426]/90 border border-pink-500/40 backdrop-blur-md shadow-xl">
                  <div className="w-6 h-6 rounded-full bg-pink-500/30 border border-pink-400/50 flex items-center justify-center text-[10px] font-bold text-pink-200">
                    B
                  </div>
                  <span className="text-xs font-bold text-white">Branch: CHANGE</span>
                </div>

                {/* Left Action Decision Bubble: "I'd create." */}
                <div className="absolute top-1/2 -translate-y-8 left-0 sm:-left-4 z-30 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#0f1426]/90 border border-cyan-500/40 backdrop-blur-md shadow-xl">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/30 border border-cyan-400/50 flex items-center justify-center text-[10px] font-bold text-cyan-200">
                    A
                  </div>
                  <span className="text-xs font-bold text-white">Branch: CREATE</span>
                </div>
              </div>
            ) : (
              /* VIEW MODE 2: Hierarchical Provenance Tree / Journey Timeline */
              <div className="w-full max-w-xl rounded-3xl bg-[#090b16] border border-white/10 p-6 sm:p-8 shadow-2xl relative space-y-8">
                {/* Top Origin NFT Card Preview */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-36 rounded-2xl overflow-hidden shadow-xl border border-purple-500/40 bg-[#0c0f1c] mb-3">
                    <MosaicHeroCard showDetails={false} />
                  </div>
                  <h4 className="text-sm font-bold text-white">NFT Living Lore</h4>
                  <p className="text-xs text-purple-400">Collaborative Decision Branches</p>
                </div>

                {/* Connecting branch tree line */}
                <div className="relative">
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
                  <div className="absolute left-1/2 -top-4 w-px h-4 bg-purple-500/40 -translate-x-1/2" />
                </div>

                {/* Contributors Sequence or Architecture Explanation */}
                {(() => {
                  const activeRelay = relayService.getActiveRelay();
                  const steps = activeRelay?.steps || [];

                  if (steps.length > 0) {
                    return (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {steps.map((step, idx) => {
                            const isActive = activeStepIndex === idx;
                            return (
                              <div
                                key={step.step}
                                onClick={() => setActiveStepIndex(idx)}
                                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between ${
                                  isActive
                                    ? 'bg-purple-950/40 border-purple-400 shadow-lg shadow-purple-900/30'
                                    : 'bg-white/5 border-white/5 hover:border-white/20'
                                }`}
                              >
                                <Avatar src={step.avatar} name={step.personName} size="md" className="mb-2" />
                                <div>
                                  <p className="text-xs font-bold text-white truncate">{step.step}. {step.personName}</p>
                                  <span
                                    className={`inline-block text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-full ${
                                      step.action === 'CREATE'
                                        ? 'bg-cyan-500/20 text-cyan-300'
                                        : 'bg-pink-500/20 text-pink-300'
                                    }`}
                                  >
                                    ● {step.action}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {steps[activeStepIndex] && (
                          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-1">
                            <div className="flex items-center justify-between font-semibold text-white">
                              <span>{steps[activeStepIndex].personName}&apos;s Contribution</span>
                              <span className="text-slate-500 font-normal">{steps[activeStepIndex].timestamp}</span>
                            </div>
                            <p className="text-slate-400 italic">
                              &ldquo;{steps[activeStepIndex].decisionText}&rdquo;
                            </p>
                          </div>
                        )}
                      </>
                    );
                  }

                  return (
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-3">
                      <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                        Every participant adds a permanent chapter of decisions, votes, and narrative lore to the token&apos;s living on-chain history.
                      </p>
                      <button
                        type="button"
                        onClick={onOpenAuth}
                        className="px-5 py-2 rounded-full text-xs font-bold bg-white text-slate-950 hover:bg-slate-200 transition-colors shadow-md cursor-pointer"
                      >
                        Start First Living Relay
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
