import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { relayService } from '../services/relayService';
import { RelayExperience, RelayStep } from '../types';
import { RelayTimeline } from '../components/relay/RelayTimeline';
import { RelayPersonalityCard } from '../components/relay/RelayPersonalityCard';
import { RelayMilestonesCard } from '../components/relay/RelayMilestonesCard';
import { ShareRelayPostModal } from '../components/relay/ShareRelayPostModal';
import {
  calculateRelayMetrics,
  calculateNftPersonality,
  calculateRelayMilestones,
} from '../services/relayStoryService';
import { GoogleAuthButton } from '../components/common/GoogleAuthButton';
import { Avatar } from '../components/common/Avatar';
import {
  ArrowLeft,
  Share2,
  Sparkles,
  Check,
  Copy,
  GitFork,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Info,
  Clock,
  Layers,
  Award,
  Users,
  Trophy,
} from 'lucide-react';

interface RelayExperiencePageProps {
  relayId?: string;
  onBack: () => void;
  onNavigateHome?: () => void;
  onSelectUser?: (username: string) => void;
}

export const RelayExperiencePage: React.FC<RelayExperiencePageProps> = ({
  relayId,
  onBack,
  onNavigateHome,
  onSelectUser,
}) => {
  const { currentUser, signInWithGoogle, loading: authLoading } = useAuth();

  const [relay, setRelay] = useState<RelayExperience | null>(() => {
    if (relayId) return relayService.getRelayById(relayId) || relayService.getActiveRelay();
    return relayService.getActiveRelay();
  });

  // Participant Form state
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [predictedOption, setPredictedOption] = useState<string>('');
  const [decisionText, setDecisionText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Confirmation state
  const [submittedChapter, setSubmittedChapter] = useState<RelayStep | null>(null);
  const [forceShowForm, setForceShowForm] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSharePostModalOpen, setIsSharePostModalOpen] = useState(false);

  // Compute genuine metrics, personality, and milestones from actual stored steps
  const metrics = relay ? calculateRelayMetrics(relay) : null;
  const personality = relay && metrics ? calculateNftPersonality(relay, metrics) : null;
  const milestones = relay && metrics ? calculateRelayMilestones(relay, metrics) : [];

  // Subscribe to live Relay changes (real database sync)
  useEffect(() => {
    const unsub = relayService.subscribe((allRelays) => {
      if (relayId) {
        const found = allRelays.find((r) => r.id === relayId);
        if (found) setRelay(found);
      } else if (!relay && allRelays.length > 0) {
        setRelay(allRelays[0]);
      }
    });

    return () => unsub();
  }, [relayId, relay]);

  // Set default selected option when relay loads
  useEffect(() => {
    if (relay && relay.options?.length > 0 && !selectedOption) {
      setSelectedOption(relay.options[0]);
      setPredictedOption(relay.options[1] || relay.options[0]);
    }
  }, [relay, selectedOption]);

  if (!relay) {
    return (
      <div className="min-h-screen bg-[#06070a] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-cyan-400 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Loading NFT Relay...</p>
        </div>
      </div>
    );
  }

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/relay/${relay.id}`
    : `/relay/${relay.id}`;

  const handleCopyShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
    if (navigator.share) {
      navigator.share({
        title: relay.title,
        text: `Co-create the shared story for ${relay.title} on Mosaic: "${relay.question}"`,
        url: shareUrl,
      }).catch(() => {});
    }
  };

  const handleSubmitChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedOption) return;

    setIsSubmitting(true);
    try {
      const step = await relayService.addChapter(relay.id, {
        answer: selectedOption,
        prediction: predictedOption,
        decisionText:
          decisionText.trim() ||
          `Chose ${selectedOption}. Contributed perspective to the living journey of this artifact.`,
        participant: {
          id: currentUser.id,
          displayName: currentUser.displayName,
          username: currentUser.username,
          photoURL: currentUser.photoURL,
        },
      });

      if (step) {
        setSubmittedChapter(step);
      }
    } catch (err) {
      console.error('Error adding chapter:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if current user already added a chapter in this relay
  const existingUserStep = currentUser
    ? relay.steps.find((s) => s.userId === currentUser.id || s.personHandle === `@${currentUser.username}`)
    : undefined;

  const currentParticipantStepNumber = relay.steps.length + 1;

  return (
    <div className="min-h-screen bg-[#06070a] text-slate-100 selection:bg-purple-600/30 selection:text-white pb-24">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 bg-[#06070a]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateHome || onBack}
            className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <GitFork className="w-3.5 h-3.5" />
                NFT Relay
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs text-slate-300 font-mono">{relay.tokenId}</span>
            </div>
            <h1 className="text-sm sm:text-base font-extrabold text-white truncate max-w-[200px] sm:max-w-md">
              {relay.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {personality && metrics && (
            <button
              type="button"
              onClick={() => setIsSharePostModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-slate-950 text-xs font-black hover:opacity-95 transition-opacity cursor-pointer shadow-md shadow-purple-950/40"
              title="Share this NFT story directly to the Mosaic feed"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span className="hidden sm:inline">Post to Mosaic</span>
              <span className="sm:hidden">Post</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-cyan-400" />}
            <span className="hidden sm:inline">{copiedLink ? 'Link Copied!' : 'Share URL'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
        {/* 1. HERO OVERVIEW CARD */}
        <section className="relative rounded-3xl bg-[#090b16] border border-white/10 shadow-2xl p-6 sm:p-8 overflow-hidden">
          {/* Ambient Lighting */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-cyan-500/15 via-purple-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
            {/* NFT Artwork Column */}
            <div className="md:col-span-5 relative group">
              <div className="aspect-square rounded-2xl overflow-hidden bg-black/60 border border-white/15 shadow-2xl relative">
                <img
                  src={relay.nftImage}
                  alt={relay.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-black/75 backdrop-blur-md text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                    {relay.collection}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-black/60 backdrop-blur-md text-slate-300 border border-white/10">
                    {relay.tokenId}
                  </span>
                </div>
              </div>
            </div>

            {/* Title & Core Question Column */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-purple-400">
                    NFT Relay Experience
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="text-xs font-semibold text-cyan-400">
                    NFT: <strong className="text-white">{relay.collection} {relay.tokenId}</strong>
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="text-xs text-purple-300">
                    Owner: <strong>{relay.creatorName}</strong> ({relay.creatorHandle})
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                  {relay.title}
                </h2>
              </div>

              {/* Journey Length & Live Key Stats Chips */}
              {metrics && personality && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Journey Length: {metrics.journeyLength} Chapters</span>
                  </span>

                  <span className="px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    <span>{metrics.participantsCount} Participants</span>
                  </span>

                  <span className="px-3 py-1 rounded-full bg-pink-950/60 border border-pink-500/30 text-pink-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    <span>THE {personality.title.toUpperCase()}</span>
                  </span>

                  <span className="px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>{milestones.filter((m) => m.unlocked).length} Milestones</span>
                  </span>
                </div>
              )}

              {/* Central Question Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-[#090b16] border border-cyan-500/30 space-y-2">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-cyan-400">
                  The Community Question
                </p>
                <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                  &quot;{relay.question}&quot;
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {relay.description}
              </p>

              {/* Ownership Preservation Notice */}
              <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[11px]">
                  <strong>Asset Ownership Preserved:</strong> The original NFT remains solely with owner {relay.creatorHandle || 'the creator'}. You are adding a permanent chapter to its living provenance.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. LIVING NFT PERSONALITY SECTION */}
        {personality && metrics && (
          <section className="space-y-4">
            <RelayPersonalityCard
              relay={relay}
              personality={personality}
              metrics={metrics}
            />
          </section>
        )}

        {/* 3. PROVENANCE MILESTONES SECTION */}
        {milestones.length > 0 && (
          <section className="space-y-4">
            <RelayMilestonesCard milestones={milestones} />
          </section>
        )}

        {/* 2. PARTICIPANT INTERACTION FLOW */}
        <section className="relative rounded-3xl bg-[#090d1c] border border-white/10 shadow-xl p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Add Chapter {currentParticipantStepNumber}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Co-create the next chapter of this living artifact
                </p>
              </div>
            </div>

            <span className="text-xs font-mono text-cyan-400 font-semibold bg-white/5 px-2.5 py-1 rounded-full">
              {relay.participantsCount} Chapters Inscribed
            </span>
          </div>

          {/* Flow States: Not Logged In vs Logged In vs Already Submitted */}
          {!currentUser ? (
            /* A. Participant needs Google Sign-In */
            <div className="py-10 text-center space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-md">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Sign In to Add Your Chapter</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sign in with your Google account to contribute your decision and inscribe your chapter into this NFT&apos;s story.
                </p>
              </div>
              <div className="pt-2 flex justify-center">
                <GoogleAuthButton
                  label="Sign In with Google to Answer"
                  onClick={async () => {
                    await signInWithGoogle();
                  }}
                />
              </div>
            </div>
          ) : (submittedChapter || (existingUserStep && !forceShowForm)) ? (
            /* B. AFTER SUBMISSION SUCCESS NOTIFICATION & CHAPTER DISPLAY */
            (() => {
              const activeChapter = submittedChapter || existingUserStep!;
              const isJustSubmitted = !!submittedChapter;

              return (
                <div className="py-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                  <div className={`p-4 sm:p-5 rounded-2xl border flex items-start justify-between gap-3 ${
                    isJustSubmitted
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-purple-950/40 border-purple-500/40 text-purple-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${isJustSubmitted ? 'text-emerald-400' : 'text-purple-400'}`} />
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          {isJustSubmitted ? 'Your chapter has been added.' : `Your Chapter (${activeChapter.step}) is Inscribed.`}
                        </h4>
                        <p className={`text-xs leading-relaxed mt-0.5 ${isJustSubmitted ? 'text-emerald-300/90' : 'text-purple-300/90'}`}>
                          {isJustSubmitted
                            ? 'Your contribution is now part of this NFT\'s permanent shared story.'
                            : 'You have contributed to this NFT\'s living community lore.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setForceShowForm(true)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold shrink-0 transition-colors cursor-pointer"
                    >
                      Add Another Chapter
                    </button>
                  </div>

                  {/* Participant Chapter Summary Display */}
                  <div className="p-5 rounded-2xl bg-[#060810] border border-white/10 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={activeChapter.avatar}
                          name={activeChapter.personName}
                          size="md"
                        />
                        <div>
                          <p className="text-sm font-bold text-white">{activeChapter.personName}</p>
                          <p className="text-xs text-purple-400 font-mono">{activeChapter.personHandle}</p>
                        </div>
                      </div>

                      <span className="text-xs font-mono text-slate-400">
                        Chapter {activeChapter.step} · {activeChapter.timestamp}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">Your Answer</span>
                        <p className="text-sm font-extrabold text-cyan-300">{activeChapter.action}</p>
                      </div>

                      {activeChapter.prediction && (
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase">Next Prediction</span>
                          <p className="text-sm font-extrabold text-pink-300">{activeChapter.prediction}</p>
                        </div>
                      )}
                    </div>

                    {activeChapter.decisionText && (
                      <p className="text-xs text-slate-300 italic pt-1">
                        &quot;{activeChapter.decisionText}&quot;
                      </p>
                    )}
                  </div>

                  {/* Share Relay Callout */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="text-left space-y-0.5">
                      <p className="text-xs font-bold text-white">Share this Relay</p>
                      <p className="text-[11px] text-slate-400">Invite another curator to continue from your chapter.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setIsSharePostModalOpen(true)}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-slate-950 font-extrabold text-xs hover:opacity-95 transition-opacity cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-purple-950/40"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                        <span>Post to Mosaic</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyShare}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-cyan-400" />}
                        <span>{copiedLink ? 'Link Copied!' : 'Share URL'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            /* C. PARTICIPANT ANSWER FORM */
            <form onSubmit={handleSubmitChapter} className="pt-5 space-y-6">
              {/* Participant Identity Capsule */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={currentUser.photoURL}
                    name={currentUser.displayName}
                    size="sm"
                  />
                  <div>
                    <p className="text-xs font-bold text-white">{currentUser.displayName}</p>
                    <p className="text-[11px] text-purple-400">@{currentUser.username}</p>
                  </div>
                </div>

                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Authenticated with Google
                </span>
              </div>

              {/* Step 1: Answer Question */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Step 1: Your Choice for &quot;{relay.question}&quot;
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {relay.options.map((option) => {
                    const isSelected = selectedOption === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setSelectedOption(option)}
                        className={`p-4 rounded-2xl border text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          isSelected
                            ? 'bg-gradient-to-r from-cyan-950 to-purple-950 border-cyan-400 text-white ring-2 ring-cyan-500/30 shadow-lg'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                        <span>{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Prediction Question (Optional) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Step 2: What do you think the next person will choose?
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Optional Forecast</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {relay.options.map((option) => {
                    const isSelected = predictedOption === option;
                    return (
                      <button
                        key={`pred-${option}`}
                        type="button"
                        onClick={() => setPredictedOption(option)}
                        className={`py-2.5 px-4 rounded-xl border text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          isSelected
                            ? 'bg-pink-950/60 border-pink-400 text-pink-200 ring-1 ring-pink-400/40'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isSelected ? 'text-pink-400' : 'text-slate-500'}`} />
                        <span>I predict next: {option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Chapter Reasoning / Lore */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Step 3: Chapter Note or Lore Reasoning
                </label>
                <textarea
                  value={decisionText}
                  onChange={(e) => setDecisionText(e.target.value)}
                  rows={2}
                  placeholder={`Explain why you chose ${selectedOption || 'this option'}. What does it mean for the artifact's journey?`}
                  className="w-full bg-[#060810] border border-white/10 rounded-xl p-3 text-xs text-white resize-none focus:outline-none focus:border-cyan-400 leading-relaxed"
                />
              </div>

              {/* Submit Action */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedOption}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 hover:opacity-95 text-slate-950 font-extrabold text-sm transition-all shadow-xl shadow-purple-900/30 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>
                    {isSubmitting ? 'Inscribing Chapter...' : `Inscribe Chapter ${currentParticipantStepNumber} (${selectedOption})`}
                  </span>
                </button>
              </div>
            </form>
          )}
        </section>

        {/* 3. VISUAL RELAY TIMELINE (NFT ↓ Person 1 ↓ Person 2 ↓ Person 3...) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <GitFork className="w-5 h-5 text-cyan-400" />
                <span>The Living Timeline</span>
              </h3>
              <p className="text-xs text-slate-400">
                Visual progression from Genesis NFT down through every community chapter
              </p>
            </div>

            <span className="text-xs font-semibold text-purple-300 bg-purple-950/40 border border-purple-500/30 px-3 py-1 rounded-full">
              {relay.steps.length} Chapters Inscribed
            </span>
          </div>

          <RelayTimeline relay={relay} onSelectUser={onSelectUser} />
        </section>
      </main>

      {/* Share Relay to Mosaic Social Hub Post Modal */}
      {personality && metrics && (
        <ShareRelayPostModal
          isOpen={isSharePostModalOpen}
          onClose={() => setIsSharePostModalOpen(false)}
          relay={relay}
          metrics={metrics}
          personality={personality}
          onPostSuccess={() => {
            // Success callback
          }}
        />
      )}
    </div>
  );
};
