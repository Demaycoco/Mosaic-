import {
  MosaicQuest,
  QuestParticipation,
  QuestParticipationStatus,
} from '../types';
import { db } from '../lib/firebase';
import { relayService } from './relayService';
import { projectService } from './projectService';
import { postService } from './postService';
import { shardService } from './shardService';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

const QUESTS_STORAGE_KEY = 'mosaic_quests_definitions';
const PARTICIPATIONS_STORAGE_KEY = 'mosaic_quest_participations';

export const INITIAL_QUESTS: MosaicQuest[] = [
  {
    id: 'relay_contributor',
    title: 'Living Story Curator',
    description: 'Inscribe at least 1 collaborative chapter into an active living NFT Relay.',
    shardsReward: 150,
    category: 'storytelling',
    verificationType: 'automated',
    completedCount: 0,
    active: true,
    iconName: 'GitFork',
    accentColor: 'text-cyan-400',
    bgColor: 'bg-cyan-950/40 border-cyan-500/20',
    tasks: [
      {
        id: 'task_add_relay_chapter',
        title: 'Add a Chapter to a Living Relay',
        description: 'Navigate to any active NFT Relay and add a perspective or decision branch.',
        type: 'automated',
        required: true,
        actionRoute: '/relay',
        actionLabel: 'Explore Relays',
      },
    ],
  },
  {
    id: 'community_guilds',
    title: 'Network Explorer',
    description: 'Follow 3 or more verified NFT project accounts and decentralized community guilds.',
    shardsReward: 100,
    category: 'community',
    verificationType: 'automated',
    completedCount: 0,
    active: true,
    iconName: 'Users',
    accentColor: 'text-purple-400',
    bgColor: 'bg-purple-950/40 border-purple-500/20',
    tasks: [
      {
        id: 'task_follow_three_projects',
        title: 'Follow 3 Project Spaces',
        description: 'Connect with community guilds and follow at least 3 project accounts.',
        type: 'automated',
        required: true,
        actionRoute: '/community',
        actionLabel: 'Browse Guilds',
      },
    ],
  },
  {
    id: 'social_voice',
    title: 'Creative Voice',
    description: 'Publish 3 posts or perspective threads in the Mosaic Social Hub.',
    shardsReward: 120,
    category: 'curation',
    verificationType: 'automated',
    completedCount: 0,
    active: true,
    iconName: 'Sparkles',
    accentColor: 'text-amber-400',
    bgColor: 'bg-amber-950/40 border-amber-500/20',
    tasks: [
      {
        id: 'task_publish_three_posts',
        title: 'Publish 3 Community Posts',
        description: 'Share your artistic or NFT insights on the Mosaic feed.',
        type: 'automated',
        required: true,
        actionRoute: '/home',
        actionLabel: 'Post Thought',
      },
    ],
  },
  {
    id: 'wallet_connector',
    title: 'On-Chain Provenance',
    description: 'Connect a self-custodial Web3 wallet to verify on-chain token custody.',
    shardsReward: 80,
    category: 'curation',
    verificationType: 'automated',
    completedCount: 0,
    active: true,
    iconName: 'Wallet',
    accentColor: 'text-emerald-400',
    bgColor: 'bg-emerald-950/40 border-emerald-500/20',
    tasks: [
      {
        id: 'task_link_web3_wallet',
        title: 'Connect Web3 Wallet',
        description: 'Link an Ethereum / EVM wallet address to your profile.',
        type: 'automated',
        required: true,
        actionLabel: 'Connect Wallet',
      },
    ],
  },
  {
    id: 'create_relay',
    title: 'Genesis Storyteller',
    description: 'Launch an original living NFT Relay from an artifact you own.',
    shardsReward: 250,
    category: 'storytelling',
    verificationType: 'automated',
    completedCount: 0,
    active: true,
    iconName: 'Trophy',
    accentColor: 'text-pink-400',
    bgColor: 'bg-pink-950/40 border-pink-500/20',
    tasks: [
      {
        id: 'task_deploy_relay',
        title: 'Create an NFT Relay Drop',
        description: 'Initiate a collaborative journey for any artifact token.',
        type: 'automated',
        required: true,
        actionLabel: 'Launch Relay',
      },
    ],
  },
  {
    id: 'artifact_lore_thesis',
    title: 'Community Lorekeeper Thesis',
    description: 'Submit an in-depth provenance critique or lore expansion (100+ words) for manual review by community curators.',
    shardsReward: 300,
    category: 'governance',
    verificationType: 'manual_review',
    completedCount: 0,
    active: true,
    iconName: 'Award',
    accentColor: 'text-cyan-300',
    bgColor: 'bg-cyan-900/30 border-cyan-400/30',
    tasks: [
      {
        id: 'task_submit_lore_thesis',
        title: 'Submit Lore Analysis & Evidence',
        description: 'Provide your essay or reference link detailing an artifact’s collective history.',
        type: 'text_submission',
        required: true,
        actionLabel: 'Submit Evidence',
      },
    ],
  },
];

type ParticipationsListener = (participations: QuestParticipation[]) => void;
const participationListeners = new Map<string, Set<ParticipationsListener>>();
const globalParticipationListeners = new Set<ParticipationsListener>();

const questMemoryStore = new Map<string, string>();
function safeGetQuestItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem) {
      return localStorage.getItem(key);
    }
  } catch {}
  return questMemoryStore.get(key) || null;
}

function safeSetQuestItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.setItem) {
      localStorage.setItem(key, value);
    }
  } catch {}
  questMemoryStore.set(key, value);
}

function getStoredParticipations(): QuestParticipation[] {
  try {
    const raw = safeGetQuestItem(PARTICIPATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveStoredParticipations(list: QuestParticipation[]) {
  try {
    safeSetQuestItem(PARTICIPATIONS_STORAGE_KEY, JSON.stringify(list));
  } catch {}

  // Notify user-specific listeners
  participationListeners.forEach((set, uId) => {
    const userList = list.filter((p) => p.userId === uId);
    set.forEach((fn) => {
      try {
        fn(userList);
      } catch (e) {
        console.error(e);
      }
    });
  });

  // Notify global listeners (e.g. organizer view)
  globalParticipationListeners.forEach((fn) => {
    try {
      fn(list);
    } catch (e) {
      console.error(e);
    }
  });
}

export const questService = {
  /**
   * Returns all available quests
   */
  getAllQuests(): MosaicQuest[] {
    return INITIAL_QUESTS;
  },

  getQuestById(questId: string): MosaicQuest | undefined {
    return INITIAL_QUESTS.find((q) => q.id === questId);
  },

  /**
   * Subscribe to user's participations
   */
  subscribeUserParticipations(userId: string, callback: ParticipationsListener): () => void {
    if (!participationListeners.has(userId)) {
      participationListeners.set(userId, new Set());
    }
    participationListeners.get(userId)!.add(callback);
    callback(this.getUserParticipations(userId));

    this.syncUserParticipationsFromFirestore(userId);

    return () => {
      participationListeners.get(userId)?.delete(callback);
    };
  },

  /**
   * Subscribe to all participations (for organizer review workspace)
   */
  subscribeAllParticipations(callback: ParticipationsListener): () => void {
    globalParticipationListeners.add(callback);
    callback(getStoredParticipations());
    return () => {
      globalParticipationListeners.delete(callback);
    };
  },

  getUserParticipations(userId: string): QuestParticipation[] {
    return getStoredParticipations().filter((p) => p.userId === userId);
  },

  getParticipation(questId: string, userId: string): QuestParticipation | undefined {
    return getStoredParticipations().find((p) => p.questId === questId && p.userId === userId);
  },

  /**
   * Sync user participations from Firestore
   */
  async syncUserParticipationsFromFirestore(userId: string): Promise<QuestParticipation[]> {
    try {
      const q = query(collection(db, 'quest_participations'), where('userId', '==', userId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const remoteList: QuestParticipation[] = [];
        snap.forEach((d) => remoteList.push(d.data() as QuestParticipation));

        const all = getStoredParticipations();
        const otherUsers = all.filter((p) => p.userId !== userId);
        const merged = [...otherUsers, ...remoteList];
        saveStoredParticipations(merged);
        return remoteList;
      }
    } catch {}
    return this.getUserParticipations(userId);
  },

  /**
   * User joins an eligible quest
   */
  async joinQuest(questId: string, userId: string): Promise<QuestParticipation> {
    const quest = this.getQuestById(questId);
    if (!quest) throw new Error('Quest not found.');

    const all = getStoredParticipations();
    let participation = all.find((p) => p.questId === questId && p.userId === userId);

    if (participation) {
      return participation;
    }

    const id = `part_${userId}_${questId}`;
    participation = {
      id,
      questId,
      userId,
      status: 'joined',
      completedTaskIds: [],
      joinedAt: new Date().toISOString(),
    };

    const updated = [...all, participation];
    saveStoredParticipations(updated);

    try {
      await setDoc(doc(db, 'quest_participations', id), participation);
    } catch {}

    // Check automated task conditions immediately upon joining
    return await this.evaluateUserProgress(questId, userId);
  },

  /**
   * Checks automated conditions (wallet, posts, relay chapters) and updates progress
   */
  async evaluateUserProgress(
    questId: string,
    userId: string,
    walletConnected = false,
    username = ''
  ): Promise<QuestParticipation> {
    const quest = this.getQuestById(questId);
    if (!quest) throw new Error('Quest not found.');

    const all = getStoredParticipations();
    let participation = all.find((p) => p.questId === questId && p.userId === userId);

    if (!participation) {
      participation = {
        id: `part_${userId}_${questId}`,
        questId,
        userId,
        status: 'joined',
        completedTaskIds: [],
        joinedAt: new Date().toISOString(),
      };
      all.push(participation);
    }

    // If already completed or reward claimed, return current state
    if (participation.status === 'completed') {
      return participation;
    }

    const completedTasks: string[] = [...participation.completedTaskIds];

    if (quest.id === 'relay_contributor') {
      const relays = relayService.getAllRelays();
      const hasChapter = relays.some((r) =>
        r.steps?.some((s) => s.userId === userId || (username && s.personHandle === `@${username}`))
      );
      if (hasChapter && !completedTasks.includes('task_add_relay_chapter')) {
        completedTasks.push('task_add_relay_chapter');
      }
    } else if (quest.id === 'community_guilds') {
      const followed = projectService.getFollowedProjectIds(userId);
      if (followed.length >= 3 && !completedTasks.includes('task_follow_three_projects')) {
        completedTasks.push('task_follow_three_projects');
      }
    } else if (quest.id === 'social_voice') {
      const postsCount = username ? postService.getUserPosts(username).length : 0;
      if (postsCount >= 3 && !completedTasks.includes('task_publish_three_posts')) {
        completedTasks.push('task_publish_three_posts');
      }
    } else if (quest.id === 'wallet_connector') {
      if (walletConnected && !completedTasks.includes('task_link_web3_wallet')) {
        completedTasks.push('task_link_web3_wallet');
      }
    } else if (quest.id === 'create_relay') {
      const relays = relayService.getAllRelays();
      const hasCreated = relays.some(
        (r) => r.creatorId === userId || (username && r.creatorHandle === `@${username}`)
      );
      if (hasCreated && !completedTasks.includes('task_deploy_relay')) {
        completedTasks.push('task_deploy_relay');
      }
    }

    participation.completedTaskIds = completedTasks;

    // Check if all required tasks are satisfied for automated verification
    const allRequiredSatisfied = quest.tasks
      .filter((t) => t.required)
      .every((t) => completedTasks.includes(t.id));

    if (quest.verificationType === 'automated') {
      if (allRequiredSatisfied) {
        participation.status = 'approved';
      } else if (completedTasks.length > 0) {
        participation.status = 'in_progress';
      }
    }

    saveStoredParticipations(all);

    try {
      await setDoc(doc(db, 'quest_participations', participation.id), participation, { merge: true });
    } catch {}

    return participation;
  },

  /**
   * Submit Evidence for Manual Review Quests
   */
  async submitEvidence(
    questId: string,
    userId: string,
    data: { evidenceText?: string; evidenceUrl?: string; notes?: string }
  ): Promise<QuestParticipation> {
    const quest = this.getQuestById(questId);
    if (!quest) throw new Error('Quest not found.');

    const all = getStoredParticipations();
    let participation = all.find((p) => p.questId === questId && p.userId === userId);

    if (!participation) {
      participation = {
        id: `part_${userId}_${questId}`,
        questId,
        userId,
        status: 'joined',
        completedTaskIds: [],
        joinedAt: new Date().toISOString(),
      };
      all.push(participation);
    }

    if (participation.status === 'completed') {
      throw new Error('Quest is already completed.');
    }

    participation.status = 'under_review';
    participation.submittedAt = new Date().toISOString();
    participation.submissionData = {
      ...data,
      submittedAt: new Date().toISOString(),
    };
    participation.completedTaskIds = quest.tasks.map((t) => t.id);
    participation.reviewFeedback = undefined; // clear previous rejection feedback upon resubmission

    saveStoredParticipations(all);

    try {
      await setDoc(doc(db, 'quest_participations', participation.id), participation, { merge: true });
    } catch {}

    return participation;
  },

  /**
   * Claim completed quest reward & credit Mosaic Shards balance
   */
  async claimQuestReward(questId: string, userId: string): Promise<{
    participation: QuestParticipation;
    shardsAwarded: number;
    newBalance: number;
  }> {
    const quest = this.getQuestById(questId);
    if (!quest) throw new Error('Quest not found.');

    const all = getStoredParticipations();
    const participation = all.find((p) => p.questId === questId && p.userId === userId);

    if (!participation) {
      throw new Error('You have not joined this quest.');
    }

    if (participation.status === 'completed' || participation.rewardClaimed) {
      throw new Error(`Reward for quest "${quest.title}" has already been claimed.`);
    }

    if (participation.status !== 'approved') {
      if (participation.status === 'under_review') {
        throw new Error('This submission is currently under organizer review. Rewards will unlock once approved.');
      }
      if (participation.status === 'rejected') {
        throw new Error(`Submission was not approved: ${participation.reviewFeedback || 'Requirements not met'}. Please resubmit.`);
      }
      throw new Error('Required tasks have not been verified yet.');
    }

    // Award Shards through the persistent atomic ledger
    const { account } = await shardService.awardQuestCompletion({
      userId,
      questId: quest.id,
      questTitle: quest.title,
      shardsReward: quest.shardsReward,
      communityId: quest.communityId,
    });

    participation.status = 'completed';
    participation.completedAt = new Date().toISOString();
    participation.rewardClaimed = true;
    participation.shardsAwarded = quest.shardsReward;

    quest.completedCount += 1;

    saveStoredParticipations(all);

    try {
      await setDoc(doc(db, 'quest_participations', participation.id), participation, { merge: true });
    } catch {}

    return {
      participation,
      shardsAwarded: quest.shardsReward,
      newBalance: account.balance,
    };
  },

  /**
   * Organizer Review Workflow:
   * Approves or rejects a participant's submission with feedback
   */
  async reviewSubmission(
    participationId: string,
    reviewerId: string,
    decision: 'approve' | 'reject',
    feedback?: string
  ): Promise<QuestParticipation> {
    const all = getStoredParticipations();
    const participation = all.find((p) => p.id === participationId);

    if (!participation) throw new Error('Submission not found.');

    if (participation.status === 'completed') {
      throw new Error('Quest is already completed and rewarded.');
    }

    participation.reviewedAt = new Date().toISOString();
    participation.reviewedBy = reviewerId;
    participation.reviewFeedback = feedback;

    if (decision === 'approve') {
      participation.status = 'approved';
    } else {
      participation.status = 'rejected';
    }

    saveStoredParticipations(all);

    try {
      await setDoc(doc(db, 'quest_participations', participation.id), participation, { merge: true });
    } catch {}

    return participation;
  },
};
