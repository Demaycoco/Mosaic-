import React, { useState, useEffect } from 'react';
import {
  Trophy,
  GitFork,
  Users,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Wallet,
  Gift,
  History,
  Clock,
  AlertTriangle,
  Check,
  X,
  ExternalLink,
  FileText,
  Send,
  Gem,
  Award,
  Layers,
  Info,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { questService } from '../../services/questService';
import { shardService } from '../../services/shardService';
import {
  MosaicQuest,
  QuestParticipation,
  MosaicShardAccount,
  ShardTransaction,
  ShardReward,
  ShardRewardClaim,
} from '../../types';

interface QuestsViewProps {
  onNavigate: (route: string) => void;
  onOpenCreateRelay?: () => void;
}

export const QuestsView: React.FC<QuestsViewProps> = ({
  onNavigate,
  onOpenCreateRelay,
}) => {
  const { currentUser } = useAuth();
  const { walletState, connectWallet } = useWallet();

  const [activeTab, setActiveTab] = useState<'quests' | 'rewards' | 'claims' | 'ledger' | 'organizer'>('quests');
  const [shardAccount, setShardAccount] = useState<MosaicShardAccount>({
    userId: currentUser?.id || '',
    balance: 0,
    lifetimeEarned: 0,
    lifetimeSpent: 0,
    updatedAt: new Date().toISOString(),
  });
  const [ledger, setLedger] = useState<ShardTransaction[]>([]);
  const [participations, setParticipations] = useState<QuestParticipation[]>([]);
  const [allParticipations, setAllParticipations] = useState<QuestParticipation[]>([]);
  const [rewards, setRewards] = useState<ShardReward[]>([]);
  const [claims, setClaims] = useState<ShardRewardClaim[]>([]);

  // Modals & User actions
  const [selectedQuestForEvidence, setSelectedQuestForEvidence] = useState<MosaicQuest | null>(null);
  const [evidenceText, setEvidenceText] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState(false);

  const [selectedRewardForClaim, setSelectedRewardForClaim] = useState<ShardReward | null>(null);
  const [isClaimingReward, setIsClaimingReward] = useState(false);

  const [isConfirmingBadgeModal, setIsConfirmingBadgeModal] = useState(false);
  const [isRedeemingBadge, setIsRedeemingBadge] = useState(false);

  const [selectedParticipationForReview, setSelectedParticipationForReview] = useState<QuestParticipation | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'approve' | 'reject'>('approve');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Success / celebration toast message
  const [celebrationToast, setCelebrationToast] = useState<{ message: string; shards: number } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Subscribe to live Shard account and Ledger
  useEffect(() => {
    if (!currentUser) return;

    const unsubAccount = shardService.subscribeAccount(currentUser.id, (acc) => {
      setShardAccount(acc);
    });

    const unsubLedger = shardService.subscribeLedger(currentUser.id, (txs) => {
      setLedger(txs);
    });

    const unsubParticipations = questService.subscribeUserParticipations(currentUser.id, (parts) => {
      setParticipations(parts);
    });

    const unsubAllParts = questService.subscribeAllParticipations((all) => {
      setAllParticipations(all);
    });

    const unsubClaims = shardService.subscribeClaims((allClaims) => {
      setClaims(allClaims);
    });

    setRewards(shardService.getRewards());

    return () => {
      unsubAccount();
      unsubLedger();
      unsubParticipations();
      unsubAllParts();
      unsubClaims();
    };
  }, [currentUser]);

  // Evaluate automated quest tasks on render or wallet change
  useEffect(() => {
    if (!currentUser) return;
    const quests = questService.getAllQuests();
    quests.forEach((q) => {
      if (q.verificationType === 'automated') {
        questService.evaluateUserProgress(
          q.id,
          currentUser.id,
          !!walletState.address,
          currentUser.username
        );
      }
    });
  }, [currentUser, walletState.address]);

  const quests = questService.getAllQuests();

  const handleJoinQuest = async (questId: string) => {
    if (!currentUser) {
      onNavigate('/login');
      return;
    }
    setActionError(null);
    try {
      await questService.joinQuest(questId, currentUser.id);
      await questService.evaluateUserProgress(
        questId,
        currentUser.id,
        !!walletState.address,
        currentUser.username
      );
    } catch (err: any) {
      setActionError(err.message || 'Failed to join quest.');
    }
  };

  const handleClaimReward = async (questId: string) => {
    if (!currentUser) return;
    setActionError(null);
    try {
      const res = await questService.claimQuestReward(questId, currentUser.id);
      setCelebrationToast({
        message: `You earned ${res.shardsAwarded} Mosaic Shards!`,
        shards: res.shardsAwarded,
      });
      setTimeout(() => setCelebrationToast(null), 6000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to claim reward.');
    }
  };

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedQuestForEvidence) return;
    if (!evidenceText.trim() && !evidenceUrl.trim()) {
      setActionError('Please provide text explanation or link evidence.');
      return;
    }

    setIsSubmittingEvidence(true);
    setActionError(null);
    try {
      await questService.submitEvidence(selectedQuestForEvidence.id, currentUser.id, {
        evidenceText: evidenceText.trim(),
        evidenceUrl: evidenceUrl.trim(),
      });
      setSelectedQuestForEvidence(null);
      setEvidenceText('');
      setEvidenceUrl('');
      setCelebrationToast({
        message: 'Evidence submitted! Awaiting curator review.',
        shards: 0,
      });
      setTimeout(() => setCelebrationToast(null), 5000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to submit evidence.');
    } finally {
      setIsSubmittingEvidence(false);
    }
  };

  const handleConfirmRewardRedemption = async () => {
    if (!currentUser || !selectedRewardForClaim) return;
    setIsClaimingReward(true);
    setActionError(null);
    try {
      const res = await shardService.claimReward({
        userId: currentUser.id,
        rewardId: selectedRewardForClaim.id,
        userDisplayName: currentUser.displayName,
        userUsername: currentUser.username,
      });
      setRewards(shardService.getRewards());
      setSelectedRewardForClaim(null);
      setCelebrationToast({
        message: `Successfully claimed ${res.claim.rewardTitle}! Claim status: Pending Fulfillment.`,
        shards: -res.claim.shardsSpent,
      });
      setTimeout(() => setCelebrationToast(null), 6000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to redeem reward.');
    } finally {
      setIsClaimingReward(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!currentUser || !selectedParticipationForReview) return;
    setIsSubmittingReview(true);
    setActionError(null);
    try {
      await questService.reviewSubmission(
        selectedParticipationForReview.id,
        currentUser.id,
        reviewDecision,
        reviewFeedback.trim() || undefined
      );
      setSelectedParticipationForReview(null);
      setReviewFeedback('');
    } catch (err: any) {
      setActionError(err.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const badgeEligibility = currentUser
    ? shardService.checkPremiumBadgeEligibility(currentUser.id)
    : {
        userId: '',
        eligible: false,
        currentBalance: 0,
        requiredShards: 400,
        hasBadge: false,
        badgeName: 'Mosaic Genesis Curator Badge',
        reason: 'Sign in to check eligibility.',
      };

  const handleConfirmBadgeRedemption = async () => {
    if (!currentUser) return;
    setIsRedeemingBadge(true);
    setActionError(null);
    try {
      await shardService.redeemPremiumBadge(
        currentUser.id,
        badgeEligibility.badgeName,
        badgeEligibility.requiredShards
      );
      setIsConfirmingBadgeModal(false);
      setCelebrationToast({
        message: `Unlocked ${badgeEligibility.badgeName}!`,
        shards: -badgeEligibility.requiredShards,
      });
      setTimeout(() => setCelebrationToast(null), 6000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to activate premium badge.');
    } finally {
      setIsRedeemingBadge(false);
    }
  };

  const completedQuestsCount = participations.filter((p) => p.status === 'completed').length;
  const pendingSubmissions = allParticipations.filter((p) => p.status === 'under_review');
  const userClaims = claims.filter((c) => c.userId === currentUser?.id);

  return (
    <div className="space-y-6 pb-16">
      {/* Sticky Header with Shards Balance Capsule */}
      <div className="sticky top-0 z-30 bg-[#06070a]/90 backdrop-blur-md border-b border-white/10 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Quests & Mosaic Shards</span>
          </h1>
          <p className="text-xs text-slate-400">
            Earn internal platform reward units through curation, storytelling, and provenance.
          </p>
        </div>

        {/* Shards Balance Capsule */}
        <div className="flex items-center gap-2 bg-[#0d1124] border border-cyan-500/30 px-3.5 py-1.5 rounded-full shadow-lg self-start sm:self-auto">
          <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-300">
            <Gem className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-extrabold text-white tracking-wide">
                {shardAccount.balance.toLocaleString()}
              </span>
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                Shards
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Celebration Notification Toast */}
      {celebrationToast && (
        <div className="mx-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-cyan-950/80 to-purple-950/80 border border-emerald-500/40 text-white flex items-center justify-between gap-3 shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{celebrationToast.message}</p>
              <p className="text-xs text-slate-300">
                {celebrationToast.shards > 0
                  ? `Balance updated: ${shardAccount.balance} Shards`
                  : 'Ledger transaction recorded.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setCelebrationToast(null)}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {actionError && (
        <div className="mx-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="p-1 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Shards Account Metrics Bar */}
      <div className="mx-4 p-5 rounded-3xl bg-[#090b16] border border-white/10 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Gem className="w-3.5 h-3.5 text-cyan-400" />
              Available Shards
            </span>
            <p className="text-2xl font-black text-white">{shardAccount.balance.toLocaleString()}</p>
            <p className="text-[10px] text-slate-500">Ready to redeem for perks</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Lifetime Earned
            </span>
            <p className="text-2xl font-black text-amber-300">
              {shardAccount.lifetimeEarned.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500">Total Shards gained from quests</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-pink-400" />
              Lifetime Spent
            </span>
            <p className="text-2xl font-black text-slate-300">
              {shardAccount.lifetimeSpent.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500">Redeemed for rewards & roles</p>
          </div>
        </div>

        {/* Shards Disclaimers & Integrity Note */}
        <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-2.5 text-xs text-slate-400 leading-relaxed">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p>
            Mosaic Shards are an <strong>internal platform reward unit</strong> designed to acknowledge authentic community curation and provenance. Shards carry no cash value, cannot be redeemed for fiat currency, and cannot be transferred between accounts.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="px-4 flex items-center gap-2 overflow-x-auto pb-1 border-b border-white/10">
        <button
          onClick={() => setActiveTab('quests')}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'quests'
              ? 'bg-purple-600/30 text-white border border-purple-400/50 shadow-sm'
              : 'text-slate-400 hover:text-white bg-white/5'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Quests ({completedQuestsCount}/{quests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rewards')}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'rewards'
              ? 'bg-purple-600/30 text-white border border-purple-400/50 shadow-sm'
              : 'text-slate-400 hover:text-white bg-white/5'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          <span>Rewards Catalog</span>
        </button>

        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'claims'
              ? 'bg-purple-600/30 text-white border border-purple-400/50 shadow-sm'
              : 'text-slate-400 hover:text-white bg-white/5'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>My Claims ({userClaims.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ledger'
              ? 'bg-purple-600/30 text-white border border-purple-400/50 shadow-sm'
              : 'text-slate-400 hover:text-white bg-white/5'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Shards Ledger ({ledger.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('organizer')}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'organizer'
              ? 'bg-cyan-600/30 text-white border border-cyan-400/50 shadow-sm'
              : 'text-slate-400 hover:text-white bg-white/5'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Curator Desk {pendingSubmissions.length > 0 && `(${pendingSubmissions.length})`}</span>
        </button>
      </div>

      {/* TAB 1: QUESTS LIST */}
      {activeTab === 'quests' && (
        <div className="px-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Provenance Challenges
            </h3>
            <span className="text-xs text-slate-500">
              Complete tasks to unlock instant Shard rewards
            </span>
          </div>

          <div className="space-y-4">
            {quests.map((quest) => {
              const participation = participations.find((p) => p.questId === quest.id);
              const status = participation?.status || 'unjoined';
              const isJoined = !!participation;
              const isCompleted = status === 'completed';
              const isApproved = status === 'approved';
              const isUnderReview = status === 'under_review';
              const isRejected = status === 'rejected';

              const allTasksDone = quest.tasks
                .filter((t) => t.required)
                .every((t) => participation?.completedTaskIds.includes(t.id));

              return (
                <div
                  key={quest.id}
                  className="p-5 rounded-3xl bg-[#080a14] border border-white/5 hover:border-white/15 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className={`p-3 rounded-2xl ${quest.bgColor} shrink-0`}>
                        <Gem className={`w-6 h-6 ${quest.accentColor}`} />
                      </div>

                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-bold text-white">{quest.title}</h4>
                          <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-extrabold flex items-center gap-1">
                            +{quest.shardsReward} Shards
                          </span>

                          {/* Status Badge */}
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Completed & Awarded
                            </span>
                          )}
                          {isApproved && !isCompleted && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-300 bg-cyan-950/50 border border-cyan-400/40 px-2.5 py-0.5 rounded-full animate-pulse">
                              <Sparkles className="w-3 h-3" />
                              Ready to Claim
                            </span>
                          )}
                          {isUnderReview && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/50 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" />
                              Under Review
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-950/50 border border-rose-400/30 px-2.5 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              Needs Revision
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                          {quest.description}
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0 self-end sm:self-center">
                      {!isJoined && (
                        <button
                          type="button"
                          onClick={() => handleJoinQuest(quest.id)}
                          className="px-5 py-2 rounded-full bg-white text-slate-950 hover:bg-slate-200 text-xs font-bold transition-all cursor-pointer shadow-md"
                        >
                          Join Quest
                        </button>
                      )}

                      {isJoined && !isCompleted && isApproved && (
                        <button
                          type="button"
                          onClick={() => handleClaimReward(quest.id)}
                          className="px-5 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 hover:opacity-90 text-white text-xs font-extrabold transition-all cursor-pointer shadow-lg shadow-purple-900/40 flex items-center gap-1.5"
                        >
                          <Gift className="w-4 h-4" />
                          <span>Claim {quest.shardsReward} Shards</span>
                        </button>
                      )}

                      {isJoined && quest.verificationType === 'manual_review' && (
                        <>
                          {status === 'joined' && (
                            <button
                              type="button"
                              onClick={() => setSelectedQuestForEvidence(quest)}
                              className="px-4 py-2 rounded-full bg-cyan-600/30 hover:bg-cyan-600/40 border border-cyan-400/50 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5 text-cyan-300" />
                              <span>Submit Evidence</span>
                            </button>
                          )}
                          {isRejected && (
                            <button
                              type="button"
                              onClick={() => setSelectedQuestForEvidence(quest)}
                              className="px-4 py-2 rounded-full bg-amber-600/30 hover:bg-amber-600/40 border border-amber-400/50 text-amber-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Resubmit Evidence</span>
                            </button>
                          )}
                        </>
                      )}

                      {isCompleted && (
                        <span className="text-xs text-emerald-400 font-bold px-3.5 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          {participation?.shardsAwarded || quest.shardsReward} Shards Received
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rejection Feedback Note if rejected */}
                  {isRejected && participation?.reviewFeedback && (
                    <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/20 text-xs text-rose-300 space-y-1">
                      <p className="font-semibold text-rose-200 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Curator Feedback
                      </p>
                      <p className="italic">&ldquo;{participation.reviewFeedback}&rdquo;</p>
                      <p className="text-[11px] text-slate-400">
                        You can update and resubmit your thesis to earn the reward.
                      </p>
                    </div>
                  )}

                  {/* Tasks Checklist */}
                  <div className="pt-2 border-t border-white/5 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Required Tasks ({participation?.completedTaskIds.length || 0}/{quest.tasks.length})
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {quest.tasks.map((task) => {
                        const isDone = participation?.completedTaskIds.includes(task.id);

                        return (
                          <div
                            key={task.id}
                            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                              isDone
                                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                                : 'bg-white/[0.02] border-white/5 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs ${
                                  isDone
                                    ? 'bg-emerald-500 text-black font-bold'
                                    : 'border border-slate-600 text-slate-400'
                                }`}
                              >
                                {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : '○'}
                              </div>
                              <span className="truncate font-medium">{task.title}</span>
                            </div>

                            {/* Task Action Link if not completed */}
                            {!isDone && task.actionRoute && (
                              <button
                                onClick={() => onNavigate(task.actionRoute!)}
                                className="text-cyan-400 hover:text-cyan-300 font-semibold text-[11px] shrink-0 flex items-center gap-1"
                              >
                                <span>Go</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                            {!isDone && task.id === 'task_link_web3_wallet' && !walletState.address && (
                              <button
                                onClick={connectWallet}
                                className="text-cyan-400 hover:text-cyan-300 font-semibold text-[11px] shrink-0"
                              >
                                Connect
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: REWARDS CATALOG */}
      {activeTab === 'rewards' && (
        <div className="px-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Mosaic Shards Redemption Catalog
              </h3>
              <p className="text-xs text-slate-500">
                Redeem earned Shards for verified allowlists, community roles, and physical/digital art drops.
              </p>
            </div>
            <div className="text-xs text-slate-400 font-semibold">
              Balance: <span className="text-cyan-400 font-bold">{shardAccount.balance} Shards</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rewards.map((reward) => {
              const canAfford = shardAccount.balance >= reward.shardsCost;
              const isOutOfStock =
                reward.status === 'out_of_stock' ||
                (reward.inventoryLimit !== undefined && reward.claimedCount >= reward.inventoryLimit);

              return (
                <div
                  key={reward.id}
                  className="rounded-3xl bg-[#080b18] border border-white/10 overflow-hidden flex flex-col justify-between hover:border-purple-500/40 transition-all shadow-xl"
                >
                  {reward.imageUrl && (
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
                      <img
                        src={reward.imageUrl}
                        alt={reward.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-extrabold text-cyan-300 border border-white/10 flex items-center gap-1">
                        <Gem className="w-3.5 h-3.5" />
                        <span>{reward.shardsCost} Shards</span>
                      </div>
                      <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-black/60 text-[10px] uppercase font-bold text-slate-300 border border-white/10">
                        {reward.category}
                      </div>
                    </div>
                  )}

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <h4 className="text-base font-bold text-white">{reward.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {reward.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Availability:</span>
                        <span className="font-semibold text-slate-200">
                          {reward.inventoryLimit !== undefined
                            ? `${reward.inventoryLimit - reward.claimedCount} of ${reward.inventoryLimit} remaining`
                            : 'Unlimited'}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isOutOfStock || !canAfford}
                        onClick={() => setSelectedRewardForClaim(reward)}
                        className={`w-full py-2.5 px-4 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isOutOfStock
                            ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                            : canAfford
                            ? 'bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 hover:opacity-90 text-white shadow-md shadow-purple-900/30'
                            : 'bg-white/5 text-slate-400 border border-white/10 hover:border-white/20'
                        }`}
                      >
                        {isOutOfStock ? (
                          'Out of Stock'
                        ) : canAfford ? (
                          <>
                            <Gift className="w-3.5 h-3.5" />
                            <span>Claim for {reward.shardsCost} Shards</span>
                          </>
                        ) : (
                          `Need ${reward.shardsCost - shardAccount.balance} more Shards`
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Future-Compatible Account Benefits / Premium Badge Service Boundary */}
          <div className="mt-6 p-5 rounded-3xl bg-gradient-to-r from-purple-950/40 via-[#0a0d1e] to-cyan-950/40 border border-purple-500/30 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-300 shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{badgeEligibility.badgeName}</h4>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                      Account Benefit
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                    Future-compatible premium account status recognizing premier storytellers and provenance curators across all Mosaic communities.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Status: <strong className={badgeEligibility.hasBadge ? 'text-emerald-400' : 'text-slate-200'}>{badgeEligibility.reason}</strong>
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex flex-col sm:items-end gap-2">
                <div className="flex items-baseline gap-1 text-sm font-black text-cyan-300">
                  <span>{badgeEligibility.requiredShards}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Shards</span>
                </div>

                {badgeEligibility.hasBadge ? (
                  <span className="px-4 py-2 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>Badge Active</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={!badgeEligibility.eligible}
                    onClick={() => setIsConfirmingBadgeModal(true)}
                    className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      badgeEligibility.eligible
                        ? 'bg-gradient-to-r from-purple-500 to-cyan-400 text-white shadow-lg hover:opacity-95'
                        : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Activate Badge</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: USER CLAIMS HISTORY */}
      {activeTab === 'claims' && (
        <div className="px-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Reward Redemption History
            </h3>
            <span className="text-xs text-slate-500">Track delivery & allowlist allocations</span>
          </div>

          {userClaims.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#080b18] border border-white/5 space-y-3">
              <Gift className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-white">No Rewards Claimed Yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Complete community quests to accumulate Shards, then redeem them for exclusive allowlist passes and digital artifacts.
              </p>
              <button
                onClick={() => setActiveTab('quests')}
                className="px-5 py-2 rounded-full text-xs font-bold bg-white text-slate-950 hover:bg-slate-200 transition-colors"
              >
                Browse Quests
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {userClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="p-4 rounded-2xl bg-[#080a14] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{claim.rewardTitle}</h4>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          claim.status === 'fulfilled'
                            ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                            : claim.status === 'cancelled'
                            ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                            : 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
                        }`}
                      >
                        {claim.status === 'fulfilled'
                          ? 'Fulfilled'
                          : claim.status === 'cancelled'
                          ? 'Cancelled & Refunded'
                          : 'Pending Organizer Fulfillment'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">
                      Cost: <strong className="text-cyan-300">{claim.shardsSpent} Shards</strong> · {new Date(claim.createdAt).toLocaleDateString()}
                    </p>

                    {claim.fulfillmentNotes && (
                      <p className="text-[11px] text-slate-400 italic">
                        Notes: {claim.fulfillmentNotes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SHARDS LEDGER */}
      {activeTab === 'ledger' && (
        <div className="px-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Mosaic Shards Ledger & Audit Trail
            </h3>
            <span className="text-xs text-slate-500">Immutable transaction log</span>
          </div>

          {ledger.length === 0 ? (
            <div className="p-10 text-center rounded-3xl bg-[#080b18] border border-white/5 space-y-2">
              <History className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-white">No Transactions Recorded Yet</p>
              <p className="text-xs text-slate-400">
                Complete your first quest to generate your genesis Shards transaction.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-[#080a14] overflow-hidden">
              <div className="divide-y divide-white/5">
                {ledger.map((tx) => {
                  const isCredit = tx.amount > 0;

                  return (
                    <div key={tx.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold ${
                            isCredit
                              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-400'
                              : 'bg-rose-950/60 border border-rose-500/40 text-rose-400'
                          }`}
                        >
                          {isCredit ? '+' : '-'}
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{tx.description}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {tx.type} · {new Date(tx.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`font-black text-sm ${
                            isCredit ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isCredit ? `+${tx.amount}` : tx.amount}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-semibold">Shards</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ORGANIZER CURATOR DESK */}
      {activeTab === 'organizer' && (
        <div className="px-4 space-y-6">
          <div className="p-4 rounded-3xl bg-[#080d20] border border-cyan-500/30 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>Curator Review & Fulfillment Desk</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Community organizers review evidence submissions requiring human verification, and confirm reward fulfillment for physical or allowlist drops.
            </p>
          </div>

          {/* Pending Submissions Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pending Quest Submissions ({pendingSubmissions.length})
            </h4>

            {pendingSubmissions.length === 0 ? (
              <p className="text-xs text-slate-500 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                No submissions currently awaiting review.
              </p>
            ) : (
              <div className="space-y-3">
                {pendingSubmissions.map((part) => {
                  const quest = quests.find((q) => q.id === part.questId);

                  return (
                    <div
                      key={part.id}
                      className="p-4 rounded-2xl bg-[#080a14] border border-white/10 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-white">{quest?.title || part.questId}</p>
                          <p className="text-xs text-slate-400">
                            Participant ID: <code className="text-purple-300 font-mono">{part.userId.slice(0, 10)}...</code>
                          </p>
                        </div>
                        <span className="text-xs font-bold text-cyan-400">+{quest?.shardsReward} Shards</span>
                      </div>

                      {part.submissionData && (
                        <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-300 space-y-1">
                          <p className="font-semibold text-slate-200">Submitted Analysis:</p>
                          <p className="whitespace-pre-line leading-relaxed italic">
                            &ldquo;{part.submissionData.evidenceText}&rdquo;
                          </p>
                          {part.submissionData.evidenceUrl && (
                            <a
                              href={part.submissionData.evidenceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 hover:underline flex items-center gap-1 pt-1"
                            >
                              <span>External reference link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedParticipationForReview(part);
                            setReviewDecision('approve');
                          }}
                          className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          Approve Submission
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedParticipationForReview(part);
                            setReviewDecision('reject');
                          }}
                          className="px-4 py-1.5 rounded-full bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-xs font-bold transition-all cursor-pointer"
                        >
                          Reject with Feedback
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Reward Claims to Fulfill */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Reward Claims Awaiting Fulfillment ({claims.filter((c) => c.status === 'pending_fulfillment').length})
            </h4>

            {claims.filter((c) => c.status === 'pending_fulfillment').length === 0 ? (
              <p className="text-xs text-slate-500 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                All claims have been fulfilled.
              </p>
            ) : (
              <div className="space-y-3">
                {claims
                  .filter((c) => c.status === 'pending_fulfillment')
                  .map((claim) => (
                    <div
                      key={claim.id}
                      className="p-4 rounded-2xl bg-[#080a14] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <p className="font-bold text-white text-sm">{claim.rewardTitle}</p>
                        <p className="text-slate-400">
                          User: {claim.userDisplayName || claim.userId.slice(0, 10)} · Spent: <strong className="text-cyan-300">{claim.shardsSpent} Shards</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!currentUser) return;
                            await shardService.fulfillClaim(claim.id, currentUser.id, 'Dispatched & verified on Mosaic.');
                            setClaims(shardService.getAllClaims());
                          }}
                          className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all cursor-pointer"
                        >
                          Confirm Delivery
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!currentUser) return;
                            await shardService.cancelAndRefundClaim(claim.id, currentUser.id, 'Item unavailable, Shards refunded.');
                            setClaims(shardService.getAllClaims());
                          }}
                          className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold transition-all cursor-pointer"
                        >
                          Refund Shards
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: SUBMIT EVIDENCE */}
      {selectedQuestForEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#090b16] border border-white/10 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Submit Quest Evidence</h3>
                <p className="text-xs text-purple-400">{selectedQuestForEvidence.title}</p>
              </div>
              <button
                onClick={() => setSelectedQuestForEvidence(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEvidence} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">
                  Lore Thesis or Provenance Analysis:
                </label>
                <textarea
                  required
                  rows={4}
                  value={evidenceText}
                  onChange={(e) => setEvidenceText(e.target.value)}
                  placeholder="Explain the narrative journey, collaborative choices, or historical significance of the artifact (min 100 words)..."
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none text-xs leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">
                  External Reference Link (Optional):
                </label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://etherscan.io/... or https://arweave.net/..."
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedQuestForEvidence(null)}
                  className="px-4 py-2 rounded-full text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEvidence}
                  className="px-5 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingEvidence ? 'Submitting...' : 'Submit to Curators'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM REWARD CLAIM */}
      {selectedRewardForClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-[#090b16] border border-white/10 p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-pink-400" />
                <span>Confirm Reward Claim</span>
              </h3>
              <button
                onClick={() => setSelectedRewardForClaim(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <p className="font-bold text-white text-sm">{selectedRewardForClaim.title}</p>
              <p className="text-slate-400 leading-relaxed">{selectedRewardForClaim.description}</p>
              <div className="pt-2 flex items-center justify-between border-t border-white/5 font-semibold">
                <span className="text-slate-400">Cost:</span>
                <span className="text-cyan-300 font-bold text-sm">
                  {selectedRewardForClaim.shardsCost} Shards
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Your Available Balance:</span>
                <span className="text-white font-bold">{shardAccount.balance} Shards</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Remaining Balance after claim:</span>
                <span className="text-emerald-400 font-bold">
                  {shardAccount.balance - selectedRewardForClaim.shardsCost} Shards
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed italic">
              Upon confirming, {selectedRewardForClaim.shardsCost} Shards will be debited from your ledger. The claim will be registered with status <strong>Pending Fulfillment</strong> until verified by organizers.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedRewardForClaim(null)}
                className="px-4 py-2 rounded-full text-slate-300 hover:text-white bg-white/5 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClaimingReward}
                onClick={handleConfirmRewardRedemption}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 hover:opacity-90 text-white font-bold shadow-lg"
              >
                {isClaimingReward ? 'Processing...' : 'Confirm Redemption'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REVIEW SUBMISSION (ORGANIZER) */}
      {selectedParticipationForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-[#090b16] border border-white/10 p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                Review Decision ({reviewDecision === 'approve' ? 'Approve' : 'Reject'})
              </h3>
              <button
                onClick={() => setSelectedParticipationForReview(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">
                Curator Feedback / Reason:
              </label>
              <textarea
                rows={3}
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                placeholder={
                  reviewDecision === 'approve'
                    ? 'Excellent provenance breakdown. Verified by curator.'
                    : 'Please elaborate on the historical choices in chapter 2...'
                }
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none text-xs"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedParticipationForReview(null)}
                className="px-4 py-2 rounded-full text-slate-300 hover:text-white bg-white/5 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingReview}
                onClick={handleSubmitReview}
                className={`px-5 py-2 rounded-full font-bold text-white shadow-md ${
                  reviewDecision === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {isSubmittingReview ? 'Saving...' : `Confirm ${reviewDecision === 'approve' ? 'Approval' : 'Rejection'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CONFIRM PREMIUM BADGE ACTIVATION */}
      {isConfirmingBadgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-[#090b16] border border-white/10 p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" />
                <span>Confirm Account Benefit</span>
              </h3>
              <button
                onClick={() => setIsConfirmingBadgeModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <p className="font-bold text-white text-sm">{badgeEligibility.badgeName}</p>
              <p className="text-slate-400 leading-relaxed">
                Activate verified Genesis Curator standing. Validated on the backend ledger and recorded permanently.
              </p>
              <div className="pt-2 flex items-center justify-between border-t border-white/5 font-semibold">
                <span className="text-slate-400">Price:</span>
                <span className="text-cyan-300 font-bold text-sm">
                  {badgeEligibility.requiredShards} Shards
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Available Shards:</span>
                <span className="text-white font-bold">{shardAccount.balance} Shards</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Balance After Activation:</span>
                <span className="text-emerald-400 font-bold">
                  {shardAccount.balance - badgeEligibility.requiredShards} Shards
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmingBadgeModal(false)}
                className="px-4 py-2 rounded-full text-slate-300 hover:text-white bg-white/5 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRedeemingBadge}
                onClick={handleConfirmBadgeRedemption}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 hover:opacity-90 text-white font-bold shadow-lg"
              >
                {isRedeemingBadge ? 'Activating...' : 'Confirm Activation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
