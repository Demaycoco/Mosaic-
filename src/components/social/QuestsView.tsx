import React from 'react';
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
  Compass,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { relayService } from '../../services/relayService';
import { postService } from '../../services/postService';
import { projectService } from '../../services/projectService';

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

  // Calculate real progression from genuine stored user activity
  const allRelays = relayService.getAllRelays();
  const userHasRelayChapter = currentUser
    ? allRelays.some((r) =>
        r.steps?.some(
          (s) => s.userId === currentUser.id || s.personHandle === `@${currentUser.username}`
        )
      )
    : false;

  const userCreatedRelay = currentUser
    ? allRelays.some((r) => r.creatorId === currentUser.id || r.creatorHandle === `@${currentUser.username}`)
    : false;

  const followedProjectIds = currentUser
    ? projectService.getFollowedProjectIds(currentUser.id)
    : [];

  const userPostsCount = currentUser
    ? postService.getUserPosts(currentUser.username).length
    : 0;

  const isWalletConnected = !!walletState.address;

  const quests = [
    {
      id: 'relay_contributor',
      title: 'Living Story Curator',
      description: 'Inscribe at least 1 collaborative chapter into an active living NFT Relay.',
      icon: GitFork,
      accentColor: 'text-cyan-400',
      bgColor: 'bg-cyan-950/40 border-cyan-500/20',
      progress: userHasRelayChapter ? 1 : 0,
      target: 1,
      completed: userHasRelayChapter,
      actionLabel: 'Explore Relays',
      actionRoute: '/relay/relay-1847',
    },
    {
      id: 'community_guilds',
      title: 'Network Explorer',
      description: 'Follow 3 or more verified NFT project accounts and decentralized guilds.',
      icon: Users,
      accentColor: 'text-purple-400',
      bgColor: 'bg-purple-950/40 border-purple-500/20',
      progress: Math.min(followedProjectIds.length, 3),
      target: 3,
      completed: followedProjectIds.length >= 3,
      actionLabel: 'Browse Guilds',
      actionRoute: '/community',
    },
    {
      id: 'create_relay',
      title: 'Genesis Storyteller',
      description: 'Launch an original living NFT Relay from an artifact you own.',
      icon: Trophy,
      accentColor: 'text-pink-400',
      bgColor: 'bg-pink-950/40 border-pink-500/20',
      progress: userCreatedRelay ? 1 : 0,
      target: 1,
      completed: userCreatedRelay,
      actionLabel: 'Launch Relay',
      customAction: onOpenCreateRelay,
    },
    {
      id: 'social_voice',
      title: 'Creative Voice',
      description: 'Publish 3 posts or perspective threads in the Mosaic Social Hub.',
      icon: Sparkles,
      accentColor: 'text-amber-400',
      bgColor: 'bg-amber-950/40 border-amber-500/20',
      progress: Math.min(userPostsCount, 3),
      target: 3,
      completed: userPostsCount >= 3,
      actionLabel: 'Post Thought',
      actionRoute: '/home',
    },
    {
      id: 'wallet_connector',
      title: 'On-Chain Provenance',
      description: 'Connect a self-custodial wallet to verify on-chain token custody.',
      icon: Wallet,
      accentColor: 'text-emerald-400',
      bgColor: 'bg-emerald-950/40 border-emerald-500/20',
      progress: isWalletConnected ? 1 : 0,
      target: 1,
      completed: isWalletConnected,
      actionLabel: isWalletConnected ? 'Connected' : 'Connect Wallet',
      customAction: !isWalletConnected ? connectWallet : undefined,
    },
  ];

  const completedCount = quests.filter((q) => q.completed).length;

  return (
    <div className="space-y-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-[#06070a]/90 backdrop-blur-md border-b border-white/10 px-4 py-3.5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Quests & Milestones</span>
          </h1>
          <p className="text-xs text-slate-400">
            Earn community provenance through curation, storytelling, and token collaboration
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-cyan-400">{completedCount}/{quests.length}</span>
          <span className="text-[11px] text-slate-500 block">Completed</span>
        </div>
      </div>

      {/* Overview Card */}
      <div className="mx-4 p-4 rounded-2xl bg-[#080b18] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Provenance Progress
          </span>
          <span className="text-xs text-cyan-400 font-bold">
            {Math.round((completedCount / quests.length) * 100)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / quests.length) * 100}%` }}
          />
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          Quests measure authentic engagement within the Mosaic ecosystem. Token claim allocations and soulbound provenance badges will activate on mainnet deployment.
        </p>
      </div>

      {/* Quests List */}
      <div className="px-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Available Quests
        </h3>

        <div className="space-y-3">
          {quests.map((quest) => {
            const Icon = quest.icon;

            return (
              <div
                key={quest.id}
                className="p-4 rounded-2xl bg-[#080a14] border border-white/5 hover:border-white/15 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className={`p-2.5 rounded-xl ${quest.bgColor} shrink-0 mt-0.5`}>
                    <Icon className={`w-5 h-5 ${quest.accentColor}`} />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {quest.title}
                      </h4>
                      {quest.completed && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Done
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                      {quest.description}
                    </p>

                    <div className="pt-1 flex items-center gap-3 text-[11px] text-slate-500">
                      <span>Progress: <strong className="text-white">{quest.progress}</strong> / {quest.target}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 self-end sm:self-center">
                  {quest.completed ? (
                    <span className="text-xs text-emerald-400 font-bold px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/20 inline-flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Achieved
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (quest.customAction) {
                          quest.customAction();
                        } else if (quest.actionRoute) {
                          onNavigate(quest.actionRoute);
                        }
                      }}
                      className="h-9 px-4 rounded-full bg-white text-slate-950 hover:bg-slate-200 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <span>{quest.actionLabel}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
