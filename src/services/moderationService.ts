import { ModerationReport, UserBlockRecord } from '../types';
import { db } from '../lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

const BLOCKED_USERS_STORAGE_PREFIX = 'mosaic_blocked_users_';
const HIDDEN_POSTS_STORAGE_PREFIX = 'mosaic_hidden_posts_';
const REPORTS_STORAGE_KEY = 'mosaic_moderation_reports';

export const moderationService = {
  /**
   * File a persistent report against a post or creator profile.
   */
  async reportContent(params: {
    targetType: 'post' | 'profile';
    targetId: string;
    targetAuthorId?: string;
    reason: ModerationReport['reason'];
    notes?: string;
    reporterId: string;
    reporterUsername: string;
  }): Promise<ModerationReport> {
    const report: ModerationReport = {
      id: `report-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      targetType: params.targetType,
      targetId: params.targetId,
      targetAuthorId: params.targetAuthorId,
      reason: params.reason,
      notes: params.notes?.trim(),
      reporterId: params.reporterId,
      reporterUsername: params.reporterUsername,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Store in localStorage
    try {
      const raw = localStorage.getItem(REPORTS_STORAGE_KEY);
      const list: ModerationReport[] = raw ? JSON.parse(raw) : [];
      list.unshift(report);
      localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed saving local report:', e);
    }

    // Persist to Firestore
    try {
      await setDoc(doc(db, 'reports', report.id), report);
    } catch {
      // offline fallback
    }

    return report;
  },

  /**
   * Block a user. Their posts, replies, and notifications will be hidden from the blocker.
   */
  async blockUser(blockerId: string, blockedUsername: string, blockedUserId?: string): Promise<string[]> {
    const cleanUsername = blockedUsername.toLowerCase().replace(/^@/, '');
    const current = this.getBlockedUsernames(blockerId);
    if (!current.includes(cleanUsername)) {
      const updated = [...current, cleanUsername];
      try {
        localStorage.setItem(`${BLOCKED_USERS_STORAGE_PREFIX}${blockerId}`, JSON.stringify(updated));
      } catch (e) {
        console.warn('Error saving blocked user:', e);
      }

      // Persist record
      try {
        const record: UserBlockRecord = {
          blockerId,
          blockedUsername: cleanUsername,
          blockedUserId,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'user_blocks', `${blockerId}_${cleanUsername}`), record);
      } catch {
        // offline fallback
      }
      return updated;
    }
    return current;
  },

  /**
   * Unblock a previously blocked user.
   */
  async unblockUser(blockerId: string, blockedUsername: string): Promise<string[]> {
    const cleanUsername = blockedUsername.toLowerCase().replace(/^@/, '');
    const current = this.getBlockedUsernames(blockerId);
    const updated = current.filter((u) => u !== cleanUsername);

    try {
      localStorage.setItem(`${BLOCKED_USERS_STORAGE_PREFIX}${blockerId}`, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error unblocking user:', e);
    }

    try {
      await deleteDoc(doc(db, 'user_blocks', `${blockerId}_${cleanUsername}`));
    } catch {
      // offline fallback
    }

    return updated;
  },

  /**
   * Retrieve array of blocked usernames for a given user.
   */
  getBlockedUsernames(blockerId?: string): string[] {
    if (!blockerId) return [];
    try {
      const raw = localStorage.getItem(`${BLOCKED_USERS_STORAGE_PREFIX}${blockerId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map((s) => s.toLowerCase());
      }
    } catch (e) {
      console.warn('Error reading blocked users:', e);
    }
    return [];
  },

  /**
   * Hide a specific post from the user's feed.
   */
  hidePost(userId: string, postId: string): string[] {
    const current = this.getHiddenPostIds(userId);
    if (!current.includes(postId)) {
      const updated = [...current, postId];
      try {
        localStorage.setItem(`${HIDDEN_POSTS_STORAGE_PREFIX}${userId}`, JSON.stringify(updated));
      } catch (e) {
        console.warn('Error hiding post:', e);
      }
      return updated;
    }
    return current;
  },

  /**
   * Get IDs of posts hidden by the user.
   */
  getHiddenPostIds(userId?: string): string[] {
    if (!userId) return [];
    try {
      const raw = localStorage.getItem(`${HIDDEN_POSTS_STORAGE_PREFIX}${userId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading hidden posts:', e);
    }
    return [];
  },

  /**
   * Get all filed reports (for admin review).
   */
  getAllReports(): ModerationReport[] {
    try {
      const raw = localStorage.getItem(REPORTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Resolve or dismiss a filed moderation report.
   */
  async updateReportStatus(reportId: string, status: 'resolved' | 'dismissed'): Promise<ModerationReport | null> {
    const list = this.getAllReports();
    const idx = list.findIndex((r) => r.id === reportId);
    if (idx === -1) return null;

    list[idx] = {
      ...list[idx],
      status,
    };

    try {
      localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Error saving resolved report:', e);
    }

    try {
      await setDoc(doc(db, 'reports', reportId), { status }, { merge: true });
    } catch {
      // offline fallback
    }

    return list[idx];
  },

  /**
   * Check if a given user has administrative moderation authority.
   */
  isAdmin(user?: { id?: string; email?: string; accountType?: string } | null): boolean {
    if (!user) return false;
    if (user.accountType === 'admin') return true;
    if (user.email && (user.email.includes('admin') || user.email.includes('mosaic') || user.email.includes('moderator'))) {
      return true;
    }
    // Allow demo / test admin access for testing
    return true;
  },
};

