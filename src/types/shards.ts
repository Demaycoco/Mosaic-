/**
 * Mosaic Shards System Types
 * 
 * IMPORTANT:
 * Mosaic Shards are an internal platform reward unit.
 * They are not cryptocurrency tokens, have no cash value, and are not transferable.
 */

export interface MosaicShardAccount {
  userId: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  updatedAt: string;
}

export type ShardTransactionType =
  | 'quest_reward'
  | 'reward_redemption'
  | 'admin_adjustment'
  | 'reversal';

export interface ShardTransaction {
  id: string;
  userId: string;
  type: ShardTransactionType;
  amount: number; // positive = earned, negative = spent
  questId?: string;
  communityId?: string;
  rewardId?: string;
  description: string;
  createdAt: string;
}

export type QuestParticipationStatus =
  | 'joined'
  | 'in_progress'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'completed';

export interface QuestTask {
  id: string;
  title: string;
  description: string;
  type: 'action' | 'evidence_upload' | 'text_submission' | 'automated';
  required: boolean;
  actionRoute?: string;
  actionLabel?: string;
}

export interface MosaicQuest {
  id: string;
  title: string;
  description: string;
  communityId?: string;
  communityName?: string;
  shardsReward: number;
  category: 'storytelling' | 'community' | 'curation' | 'governance';
  verificationType: 'automated' | 'manual_review';
  tasks: QuestTask[];
  maxCompletions?: number;
  completedCount: number;
  active: boolean;
  iconName: string;
  accentColor: string;
  bgColor: string;
}

export interface QuestParticipation {
  id: string;
  questId: string;
  userId: string;
  status: QuestParticipationStatus;
  completedTaskIds: string[];
  submissionData?: {
    evidenceText?: string;
    evidenceUrl?: string;
    submittedAt?: string;
    notes?: string;
  };
  reviewFeedback?: string;
  reviewedBy?: string;
  rewardClaimed?: boolean;
  shardsAwarded?: number;
  joinedAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  completedAt?: string;
}

export interface ShardReward {
  id: string;
  title: string;
  description: string;
  communityId?: string;
  shardsCost: number;
  inventoryLimit?: number;
  claimedCount: number;
  imageUrl?: string;
  category: 'nft' | 'role' | 'perk' | 'allowlist';
  status: 'active' | 'out_of_stock' | 'paused';
  requiresFulfillment: boolean;
  fulfillmentType: 'manual_dispatch' | 'allowlist_entry' | 'badge_grant';
}

export interface ShardRewardClaim {
  id: string;
  rewardId: string;
  rewardTitle: string;
  userId: string;
  userDisplayName?: string;
  userUsername?: string;
  shardsSpent: number;
  status: 'pending_fulfillment' | 'fulfilled' | 'cancelled';
  fulfillmentNotes?: string;
  fulfilledAt?: string;
  fulfilledBy?: string;
  createdAt: string;
}

export interface PremiumBadgeEligibility {
  userId: string;
  eligible: boolean;
  currentBalance: number;
  requiredShards: number;
  hasBadge: boolean;
  badgeName: string;
  reason?: string;
}
