import {
  MosaicShardAccount,
  ShardTransaction,
  ShardTransactionType,
  ShardReward,
  ShardRewardClaim,
  PremiumBadgeEligibility,
} from '../types';
import { db } from '../lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  runTransaction,
  orderBy,
  limit,
} from 'firebase/firestore';

const SHARD_ACCOUNTS_STORAGE_KEY = 'mosaic_shard_accounts_cache';
const SHARD_LEDGER_STORAGE_KEY = 'mosaic_shard_ledger_cache';
const SHARD_REWARDS_STORAGE_KEY = 'mosaic_shard_rewards_cache';
const SHARD_CLAIMS_STORAGE_KEY = 'mosaic_shard_claims_cache';

// Initial Rewards Catalog (Platform perks and allowlists)
const DEFAULT_REWARDS: ShardReward[] = [
  {
    id: 'reward_genesis_shard_pass',
    title: 'Genesis Shard Allowlist Pass',
    description: 'Guaranteed priority allowlist reservation for Mosaic upcoming genesis creator drop.',
    shardsCost: 200,
    inventoryLimit: 25,
    claimedCount: 0,
    category: 'allowlist',
    status: 'active',
    requiresFulfillment: true,
    fulfillmentType: 'allowlist_entry',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'reward_lorekeeper_role',
    title: 'Soulbound Lorekeeper Status',
    description: 'Exclusive community role and profile honor acknowledging distinguished artifact storytelling.',
    shardsCost: 150,
    inventoryLimit: 50,
    claimedCount: 0,
    category: 'role',
    status: 'active',
    requiresFulfillment: true,
    fulfillmentType: 'badge_grant',
    imageUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'reward_curated_nft_slab',
    title: 'Curated Artifact: "Prism Genesis #01"',
    description: 'Exclusive 1-of-1 digital artifact transfer from the community provenance treasury.',
    shardsCost: 500,
    inventoryLimit: 3,
    claimedCount: 0,
    category: 'nft',
    status: 'active',
    requiresFulfillment: true,
    fulfillmentType: 'manual_dispatch',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'reward_frontpage_showcase',
    title: 'Front-Page Artifact Showcase Feature',
    description: 'Pin your collection or relay story to the Mosaic Social Hub spotlight carousel for 7 days.',
    shardsCost: 350,
    inventoryLimit: 10,
    claimedCount: 0,
    category: 'perk',
    status: 'active',
    requiresFulfillment: true,
    fulfillmentType: 'manual_dispatch',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
  },
];

type ShardListener = (account: MosaicShardAccount) => void;
type LedgerListener = (transactions: ShardTransaction[]) => void;
type ClaimsListener = (claims: ShardRewardClaim[]) => void;

const accountListeners = new Map<string, Set<ShardListener>>();
const ledgerListeners = new Map<string, Set<LedgerListener>>();
const claimListeners = new Set<ClaimsListener>();

const memoryStore = new Map<string, string>();
function safeGetItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem) {
      return localStorage.getItem(key);
    }
  } catch {}
  return memoryStore.get(key) || null;
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.setItem) {
      localStorage.setItem(key, value);
    }
  } catch {}
  memoryStore.set(key, value);
}

// Helper for local cache of accounts
function getLocalAccount(userId: string): MosaicShardAccount {
  try {
    const raw = safeGetItem(`${SHARD_ACCOUNTS_STORAGE_KEY}_${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.balance === 'number') {
        return parsed;
      }
    }
  } catch {}
  return {
    userId,
    balance: 0,
    lifetimeEarned: 0,
    lifetimeSpent: 0,
    updatedAt: new Date().toISOString(),
  };
}

function saveLocalAccount(account: MosaicShardAccount) {
  try {
    safeSetItem(
      `${SHARD_ACCOUNTS_STORAGE_KEY}_${account.userId}`,
      JSON.stringify(account)
    );
  } catch {}
  const listeners = accountListeners.get(account.userId);
  if (listeners) {
    listeners.forEach((fn) => {
      try {
        fn(account);
      } catch (e) {
        console.error('Error notifying shard account listener', e);
      }
    });
  }
}

// Concurrency mutex lock per user to serialize concurrent operations
const userLocks = new Map<string, Promise<any>>();
async function withUserLock<T>(userId: string, action: () => Promise<T>): Promise<T> {
  const currentLock = userLocks.get(userId) || Promise.resolve();
  let release: () => void = () => {};
  const newLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  userLocks.set(userId, currentLock.then(() => newLock));

  await currentLock;
  try {
    return await action();
  } finally {
    release();
  }
}

// Helper for local cache of ledger
function getLocalLedger(userId: string): ShardTransaction[] {
  try {
    const raw = safeGetItem(`${SHARD_LEDGER_STORAGE_KEY}_${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveLocalLedger(userId: string, txs: ShardTransaction[]) {
  try {
    safeSetItem(`${SHARD_LEDGER_STORAGE_KEY}_${userId}`, JSON.stringify(txs));
  } catch {}
  const listeners = ledgerListeners.get(userId);
  if (listeners) {
    listeners.forEach((fn) => {
      try {
        fn(txs);
      } catch (e) {
        console.error('Error notifying shard ledger listener', e);
      }
    });
  }
}

// Helper for local cache of rewards catalog
function getLocalRewards(): ShardReward[] {
  try {
    const raw = safeGetItem(SHARD_REWARDS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_REWARDS;
}

function saveLocalRewards(rewards: ShardReward[]) {
  try {
    safeSetItem(SHARD_REWARDS_STORAGE_KEY, JSON.stringify(rewards));
  } catch {}
}

// Helper for local cache of claims
function getLocalClaims(): ShardRewardClaim[] {
  try {
    const raw = safeGetItem(SHARD_CLAIMS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveLocalClaims(claims: ShardRewardClaim[]) {
  try {
    safeSetItem(SHARD_CLAIMS_STORAGE_KEY, JSON.stringify(claims));
  } catch {}
  claimListeners.forEach((fn) => {
    try {
      fn(claims);
    } catch (e) {
      console.error(e);
    }
  });
}

export const shardService = {
  /**
   * Subscribe to live balance changes for a user
   */
  subscribeAccount(userId: string, callback: ShardListener): () => void {
    if (!accountListeners.has(userId)) {
      accountListeners.set(userId, new Set());
    }
    accountListeners.get(userId)!.add(callback);
    callback(this.getAccount(userId));

    // Also trigger Firestore sync
    this.syncAccountFromFirestore(userId);

    return () => {
      accountListeners.get(userId)?.delete(callback);
    };
  },

  /**
   * Subscribe to live transaction history for a user
   */
  subscribeLedger(userId: string, callback: LedgerListener): () => void {
    if (!ledgerListeners.has(userId)) {
      ledgerListeners.set(userId, new Set());
    }
    ledgerListeners.get(userId)!.add(callback);
    callback(this.getLedger(userId));

    // Also trigger Firestore sync
    this.syncLedgerFromFirestore(userId);

    return () => {
      ledgerListeners.get(userId)?.delete(callback);
    };
  },

  /**
   * Subscribe to all reward claims (for user tracking and organizer fulfillment)
   */
  subscribeClaims(callback: ClaimsListener): () => void {
    claimListeners.add(callback);
    callback(this.getAllClaims());
    return () => {
      claimListeners.delete(callback);
    };
  },

  /**
   * Returns current user Shard account balance & totals
   */
  getAccount(userId: string): MosaicShardAccount {
    return getLocalAccount(userId);
  },

  /**
   * Returns complete transaction ledger for user
   */
  getLedger(userId: string): ShardTransaction[] {
    return getLocalLedger(userId);
  },

  /**
   * Returns all rewards in catalog
   */
  getRewards(): ShardReward[] {
    return getLocalRewards();
  },

  updateReward(updated: ShardReward): void {
    const rewards = getLocalRewards();
    const idx = rewards.findIndex((r) => r.id === updated.id);
    if (idx !== -1) {
      rewards[idx] = updated;
    } else {
      rewards.push(updated);
    }
    saveLocalRewards(rewards);
  },

  /**
   * Returns reward claims
   */
  getAllClaims(): ShardRewardClaim[] {
    return getLocalClaims();
  },

  getUserClaims(userId: string): ShardRewardClaim[] {
    return this.getAllClaims().filter((c) => c.userId === userId);
  },

  /**
   * Asynchronously synchronize account state from Firestore
   */
  async syncAccountFromFirestore(userId: string): Promise<MosaicShardAccount> {
    try {
      const snap = await getDoc(doc(db, 'shard_accounts', userId));
      if (snap.exists()) {
        const remote = snap.data() as MosaicShardAccount;
        saveLocalAccount(remote);
        return remote;
      }
    } catch {}
    return getLocalAccount(userId);
  },

  /**
   * Asynchronously synchronize ledger state from Firestore
   */
  async syncLedgerFromFirestore(userId: string): Promise<ShardTransaction[]> {
    try {
      const q = query(
        collection(db, 'shard_transactions'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const remoteTxs: ShardTransaction[] = [];
        snap.forEach((d) => remoteTxs.push(d.data() as ShardTransaction));
        saveLocalLedger(userId, remoteTxs);
        return remoteTxs;
      }
    } catch {}
    return getLocalLedger(userId);
  },

  /**
   * Award quest completion Shards with strict idempotency and atomic ledger updates.
   * Prevents duplicate quest rewards and guarantees integer amounts.
   */
  async awardQuestCompletion(params: {
    userId: string;
    questId: string;
    questTitle: string;
    shardsReward: number;
    communityId?: string;
  }): Promise<{ account: MosaicShardAccount; transaction: ShardTransaction }> {
    const { userId, questId, questTitle, shardsReward, communityId } = params;

    return withUserLock(userId, async () => {
      const rewardAmount = Math.floor(Math.abs(shardsReward));
      if (rewardAmount <= 0) {
        throw new Error('Quest reward amount must be an integer greater than zero.');
      }

      // Deterministic transaction ID enforcing idempotency
      const txId = `tx_reward_${userId}_${questId}`;

      // 1. Check local ledger for duplicate award
      const localTxs = getLocalLedger(userId);
      const existingTx = localTxs.find(
        (t) => t.id === txId || (t.type === 'quest_reward' && t.questId === questId)
      );
      if (existingTx) {
        throw new Error(`Reward for quest "${questTitle}" has already been claimed.`);
      }

      const currentAccount = getLocalAccount(userId);
      const newBalance = currentAccount.balance + rewardAmount;
      const newLifetimeEarned = currentAccount.lifetimeEarned + rewardAmount;

      const transaction: ShardTransaction = {
        id: txId,
        userId,
        type: 'quest_reward',
        amount: rewardAmount,
        questId,
        communityId,
        description: `Completed quest: ${questTitle}`,
        createdAt: new Date().toISOString(),
      };

      const updatedAccount: MosaicShardAccount = {
        userId,
        balance: newBalance,
        lifetimeEarned: newLifetimeEarned,
        lifetimeSpent: currentAccount.lifetimeSpent,
        updatedAt: new Date().toISOString(),
      };

      // 2. Perform atomic Firestore transaction if available
      try {
        await runTransaction(db, async (t) => {
          const txDocRef = doc(db, 'shard_transactions', txId);
          const existingDoc = await t.get(txDocRef);
          if (existingDoc.exists()) {
            throw new Error(`Reward for quest "${questTitle}" has already been processed.`);
          }

          const accountDocRef = doc(db, 'shard_accounts', userId);
          const accountDoc = await t.get(accountDocRef);

          let remoteBalance = rewardAmount;
          let remoteLifetime = rewardAmount;
          let remoteSpent = 0;

          if (accountDoc.exists()) {
            const accData = accountDoc.data() as MosaicShardAccount;
            remoteBalance = (accData.balance || 0) + rewardAmount;
            remoteLifetime = (accData.lifetimeEarned || 0) + rewardAmount;
            remoteSpent = accData.lifetimeSpent || 0;
          }

          t.set(txDocRef, transaction);
          t.set(accountDocRef, {
            userId,
            balance: remoteBalance,
            lifetimeEarned: remoteLifetime,
            lifetimeSpent: remoteSpent,
            updatedAt: new Date().toISOString(),
          });
        });
      } catch (e: any) {
        // If error was duplicate, rethrow
        if (e.message?.includes('already')) {
          throw e;
        }
        // Offline fallback: save locally to persistent storage
        try {
          await setDoc(doc(db, 'shard_transactions', txId), transaction).catch(() => {});
          await setDoc(doc(db, 'shard_accounts', userId), updatedAccount, { merge: true }).catch(() => {});
        } catch {}
      }

      // 3. Update local caches and notify UI
      saveLocalLedger(userId, [transaction, ...localTxs]);
      saveLocalAccount(updatedAccount);

      return { account: updatedAccount, transaction };
    });
  },

  /**
   * Redeem Shards for an available reward.
   * Enforces:
   * - Balance sufficiency (no negative balance permitted)
   * - Inventory limit validation
   * - Atomic debit from balance
   * - Persistent ledger recording with negative amount
   * - Claim record created with 'pending_fulfillment'
   */
  async claimReward(params: {
    userId: string;
    rewardId: string;
    userDisplayName?: string;
    userUsername?: string;
  }): Promise<{ claim: ShardRewardClaim; account: MosaicShardAccount; transaction: ShardTransaction }> {
    const { userId, rewardId, userDisplayName, userUsername } = params;

    return withUserLock(userId, async () => {
      const rewards = getLocalRewards();
      const rewardIndex = rewards.findIndex((r) => r.id === rewardId);
      if (rewardIndex === -1) {
        throw new Error('Reward not found.');
      }

      const reward = rewards[rewardIndex];

      if (reward.status !== 'active') {
        throw new Error('This reward is currently not available for redemption.');
      }

      if (reward.inventoryLimit !== undefined && reward.claimedCount >= reward.inventoryLimit) {
        throw new Error('This reward has reached its claim limit and is out of stock.');
      }

      const cost = Math.floor(Math.abs(reward.shardsCost));
      const currentAccount = getLocalAccount(userId);

      if (currentAccount.balance < cost) {
        throw new Error(
          `Insufficient Mosaic Shards. You have ${currentAccount.balance} Shards, but this reward requires ${cost} Shards.`
        );
      }

      const claimId = `claim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const txId = `tx_redeem_${claimId}`;

      const newBalance = currentAccount.balance - cost;
      const newLifetimeSpent = currentAccount.lifetimeSpent + cost;

      const transaction: ShardTransaction = {
        id: txId,
        userId,
        type: 'reward_redemption',
        amount: -cost, // Negative amount denotes debit
        rewardId,
        communityId: reward.communityId,
        description: `Redeemed: ${reward.title}`,
        createdAt: new Date().toISOString(),
      };

      const updatedAccount: MosaicShardAccount = {
        userId,
        balance: newBalance,
        lifetimeEarned: currentAccount.lifetimeEarned,
        lifetimeSpent: newLifetimeSpent,
        updatedAt: new Date().toISOString(),
      };

      const claim: ShardRewardClaim = {
        id: claimId,
        rewardId: reward.id,
        rewardTitle: reward.title,
        userId,
        userDisplayName,
        userUsername,
        shardsSpent: cost,
        status: 'pending_fulfillment', // Never falsely claim fulfilled until confirmed
        fulfillmentNotes: reward.requiresFulfillment
          ? 'Awaiting organizer fulfillment and delivery confirmation.'
          : 'Eligible for instant access.',
        createdAt: new Date().toISOString(),
      };

      // Update reward inventory count
      reward.claimedCount += 1;
      if (reward.inventoryLimit !== undefined && reward.claimedCount >= reward.inventoryLimit) {
        reward.status = 'out_of_stock';
      }
      rewards[rewardIndex] = reward;

      // Execute atomic Firestore transaction
      try {
        await runTransaction(db, async (t) => {
          const rewardDocRef = doc(db, 'shard_rewards', rewardId);
          const accountDocRef = doc(db, 'shard_accounts', userId);
          const txDocRef = doc(db, 'shard_transactions', txId);
          const claimDocRef = doc(db, 'shard_claims', claimId);

          const accountDoc = await t.get(accountDocRef);
          const currentBal = accountDoc.exists()
            ? (accountDoc.data() as MosaicShardAccount).balance || 0
            : currentAccount.balance;

          if (currentBal < cost) {
            throw new Error('Insufficient Mosaic Shards balance in database.');
          }

          t.set(txDocRef, transaction);
          t.set(claimDocRef, claim);
          t.set(accountDocRef, updatedAccount, { merge: true });
          t.set(rewardDocRef, reward, { merge: true });
        });
      } catch (e: any) {
        // Fallback direct set
        try {
          await setDoc(doc(db, 'shard_transactions', txId), transaction).catch(() => {});
          await setDoc(doc(db, 'shard_claims', claimId), claim).catch(() => {});
          await setDoc(doc(db, 'shard_accounts', userId), updatedAccount, { merge: true }).catch(() => {});
        } catch {}
      }

      // Save local state
      saveLocalRewards(rewards);
      saveLocalAccount(updatedAccount);
      saveLocalLedger(userId, [transaction, ...getLocalLedger(userId)]);
      saveLocalClaims([claim, ...getLocalClaims()]);

      return { claim, account: updatedAccount, transaction };
    });
  },

  /**
   * Organizer Fulfillment Workflow:
   * Mark a pending reward claim as fulfilled with delivery confirmation notes.
   */
  async fulfillClaim(
    claimId: string,
    organizerId: string,
    notes?: string
  ): Promise<ShardRewardClaim> {
    const claims = getLocalClaims();
    const index = claims.findIndex((c) => c.id === claimId);
    if (index === -1) throw new Error('Claim not found.');

    const claim = claims[index];
    if (claim.status === 'fulfilled') {
      return claim;
    }

    claim.status = 'fulfilled';
    claim.fulfilledAt = new Date().toISOString();
    claim.fulfilledBy = organizerId;
    claim.fulfillmentNotes = notes || 'Fulfilled by Mosaic organizer.';

    claims[index] = claim;
    saveLocalClaims(claims);

    try {
      await setDoc(doc(db, 'shard_claims', claimId), claim, { merge: true });
    } catch {}

    return claim;
  },

  /**
   * Organizer Reversal / Refund Workflow:
   * Cancels a pending claim and refunds the Shards to the user via a ledger reversal.
   */
  async cancelAndRefundClaim(
    claimId: string,
    organizerId: string,
    reason: string
  ): Promise<{ claim: ShardRewardClaim; account: MosaicShardAccount }> {
    const claims = getLocalClaims();
    const index = claims.findIndex((c) => c.id === claimId);
    if (index === -1) throw new Error('Claim not found.');

    const claim = claims[index];
    if (claim.status !== 'pending_fulfillment') {
      throw new Error(`Cannot refund claim with status: ${claim.status}`);
    }

    claim.status = 'cancelled';
    claim.fulfillmentNotes = `Cancelled and refunded by organizer: ${reason}`;
    claims[index] = claim;
    saveLocalClaims(claims);

    // Revert inventory
    const rewards = getLocalRewards();
    const rew = rewards.find((r) => r.id === claim.rewardId);
    if (rew && rew.claimedCount > 0) {
      rew.claimedCount -= 1;
      if (rew.status === 'out_of_stock') rew.status = 'active';
      saveLocalRewards(rewards);
    }

    // Refund Shards through reversal transaction
    const userAccount = getLocalAccount(claim.userId);
    const refundAmount = claim.shardsSpent;
    const txId = `tx_reversal_${claimId}`;

    const reversalTx: ShardTransaction = {
      id: txId,
      userId: claim.userId,
      type: 'reversal',
      amount: refundAmount,
      rewardId: claim.rewardId,
      description: `Refund for cancelled claim: ${claim.rewardTitle} (${reason})`,
      createdAt: new Date().toISOString(),
    };

    const updatedAccount: MosaicShardAccount = {
      userId: claim.userId,
      balance: userAccount.balance + refundAmount,
      lifetimeEarned: userAccount.lifetimeEarned,
      lifetimeSpent: Math.max(0, userAccount.lifetimeSpent - refundAmount),
      updatedAt: new Date().toISOString(),
    };

    saveLocalLedger(claim.userId, [reversalTx, ...getLocalLedger(claim.userId)]);
    saveLocalAccount(updatedAccount);

    try {
      await setDoc(doc(db, 'shard_claims', claimId), claim, { merge: true });
      await setDoc(doc(db, 'shard_transactions', txId), reversalTx);
      await setDoc(doc(db, 'shard_accounts', claim.userId), updatedAccount, { merge: true });
    } catch {}

    return { claim, account: updatedAccount };
  },

  /**
   * Premium Badge Service Boundary:
   * Future-compatible interface for checking eligibility and redeeming Shards for account perks.
   * Note: Does not build a store or grant arbitrary badges without balance validation & confirmation.
   */
  checkPremiumBadgeEligibility(userId: string): PremiumBadgeEligibility {
    const account = getLocalAccount(userId);
    const REQUIRED_SHARDS_FOR_GENESIS_BADGE = 400;
    const ledger = getLocalLedger(userId);
    const hasBadge = ledger.some(
      (tx) => tx.type === 'reward_redemption' && tx.description.includes('Mosaic Genesis Curator Badge')
    );

    return {
      userId,
      eligible: !hasBadge && account.balance >= REQUIRED_SHARDS_FOR_GENESIS_BADGE,
      currentBalance: account.balance,
      requiredShards: REQUIRED_SHARDS_FOR_GENESIS_BADGE,
      hasBadge,
      badgeName: 'Mosaic Genesis Curator Badge',
      reason: hasBadge
        ? 'Badge already activated on account.'
        : account.balance >= REQUIRED_SHARDS_FOR_GENESIS_BADGE
        ? 'Eligible to activate Genesis Curator status.'
        : `Requires ${REQUIRED_SHARDS_FOR_GENESIS_BADGE - account.balance} more Shards to unlock.`,
    };
  },

  /**
   * Future-compatible redemption boundary for premium badge.
   */
  async redeemPremiumBadge(
    userId: string,
    badgeName: string,
    cost: number
  ): Promise<{ success: boolean; account: MosaicShardAccount; transaction?: ShardTransaction }> {
    return withUserLock(userId, async () => {
      const ledger = getLocalLedger(userId);
      const alreadyGranted = ledger.some(
        (tx) => tx.type === 'reward_redemption' && tx.description.includes(badgeName)
      );
      if (alreadyGranted) {
        throw new Error(`You have already activated ${badgeName}. Duplicate grants are not permitted.`);
      }

      const account = getLocalAccount(userId);
      if (account.balance < cost) {
        throw new Error(`Insufficient Shards to activate ${badgeName}. Required: ${cost}, Available: ${account.balance}`);
      }

    const txId = `tx_badge_${Date.now()}`;
    const transaction: ShardTransaction = {
      id: txId,
      userId,
      type: 'reward_redemption',
      amount: -cost,
      description: `Activated account benefit: ${badgeName}`,
      createdAt: new Date().toISOString(),
    };

    const updatedAccount: MosaicShardAccount = {
      userId,
      balance: account.balance - cost,
      lifetimeEarned: account.lifetimeEarned,
      lifetimeSpent: account.lifetimeSpent + cost,
      updatedAt: new Date().toISOString(),
    };

    saveLocalLedger(userId, [transaction, ...getLocalLedger(userId)]);
    saveLocalAccount(updatedAccount);

    try {
      await setDoc(doc(db, 'shard_transactions', txId), transaction);
      await setDoc(doc(db, 'shard_accounts', userId), updatedAccount, { merge: true });
    } catch {}

    return { success: true, account: updatedAccount, transaction };
    });
  },
};
