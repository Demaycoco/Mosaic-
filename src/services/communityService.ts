import { SocialCommunity, SocialPost } from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, getDocs, collection, query, limit } from 'firebase/firestore';
import { postService } from './postService';

const COMMUNITIES_STORAGE_KEY = 'mosaic_social_communities';

export const INITIAL_COMMUNITIES: SocialCommunity[] = [];

type CommunityListener = (communities: SocialCommunity[]) => void;
const listeners: Set<CommunityListener> = new Set();

const MOCK_COMMUNITY_IDS = new Set([
  'comm-gen-art',
  'comm-relay-lore',
  'comm-digital-fashion',
  'comm-synth-identity',
]);

const MOCK_CREATOR_IDS = new Set([
  'creator-sarah',
  'creator-alex',
  'creator-vance',
  'creator-priya',
  'creator-mosaic',
]);

function isMockCommunity(c: any): boolean {
  if (!c || !c.id) return true;
  if (MOCK_COMMUNITY_IDS.has(c.id)) return true;
  if (c.id.startsWith('comm-seed-') || c.id.includes('seed')) return true;
  if (MOCK_CREATOR_IDS.has(c.creatorId)) return true;
  return false;
}

function getStoredCommunities(): SocialCommunity[] {
  try {
    const raw = localStorage.getItem(COMMUNITIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Strip out all mock data, seeded communities, and mock creators
        const authenticCommunities = parsed.filter((c) => !isMockCommunity(c));
        if (authenticCommunities.length !== parsed.length) {
          localStorage.setItem(COMMUNITIES_STORAGE_KEY, JSON.stringify(authenticCommunities));
        }
        return authenticCommunities;
      }
    }
  } catch (err) {
    console.warn('Failed reading stored communities:', err);
  }
  return [];
}

function saveStoredCommunities(list: SocialCommunity[]) {
  const authenticList = list.filter((c) => !isMockCommunity(c));
  try {
    localStorage.setItem(COMMUNITIES_STORAGE_KEY, JSON.stringify(authenticList));
  } catch (err) {
    console.warn('Failed saving communities to localStorage:', err);
  }
  listeners.forEach((fn) => {
    try {
      fn(authenticList);
    } catch (e) {
      console.error('Error notifying community listener', e);
    }
  });
}

// Background sync from Firestore (only real user-created communities)
async function syncFromFirestore() {
  try {
    const snap = await getDocs(query(collection(db, 'communities'), limit(50)));
    if (!snap.empty) {
      const remote: SocialCommunity[] = [];
      snap.forEach((d) => {
        const data = d.data() as SocialCommunity;
        if (!isMockCommunity(data)) {
          remote.push(data);
        }
      });
      if (remote.length > 0) {
        const local = getStoredCommunities();
        const map = new Map<string, SocialCommunity>();
        local.forEach((c) => map.set(c.id, c));
        remote.forEach((c) => map.set(c.id, c));
        saveStoredCommunities(Array.from(map.values()));
      }
    }
  } catch {
    // Offline fallback
  }
}
syncFromFirestore();

export const communityService = {
  subscribe(callback: CommunityListener): () => void {
    listeners.add(callback);
    callback(getStoredCommunities());
    return () => {
      listeners.delete(callback);
    };
  },

  getAllCommunities(): SocialCommunity[] {
    return getStoredCommunities();
  },

  getCommunityById(id: string): SocialCommunity | undefined {
    return getStoredCommunities().find((c) => c.id === id);
  },

  getCommunityByHandle(handle: string): SocialCommunity | undefined {
    const clean = handle.toLowerCase().replace(/^@/, '');
    return getStoredCommunities().find((c) => c.handle.toLowerCase() === clean);
  },

  isMember(communityId: string, userId: string): boolean {
    const comm = this.getCommunityById(communityId);
    return Boolean(comm?.memberIds.includes(userId));
  },

  isAdmin(communityId: string, userId: string): boolean {
    const comm = this.getCommunityById(communityId);
    if (!comm) return false;
    return comm.creatorId === userId || comm.adminIds.includes(userId);
  },

  canPost(communityId: string, userId?: string | null): { allowed: boolean; reason?: string } {
    if (!userId) {
      return { allowed: false, reason: 'Please sign in to publish a post in this community.' };
    }
    const comm = this.getCommunityById(communityId);
    if (!comm) return { allowed: false, reason: 'Community not found.' };

    if (comm.postingPermission === 'all') {
      return { allowed: true };
    }
    if (comm.postingPermission === 'members') {
      if (this.isMember(communityId, userId) || this.isAdmin(communityId, userId)) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'Only joined members can publish in this community. Click Join to participate!' };
    }
    if (comm.postingPermission === 'admins') {
      if (this.isAdmin(communityId, userId)) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'Only designated community administrators may publish announcements here.' };
    }
    return { allowed: true };
  },

  async joinCommunity(communityId: string, userId: string, userMeta?: { name: string; username: string; photoURL: string }): Promise<SocialCommunity> {
    const all = getStoredCommunities();
    const idx = all.findIndex((c) => c.id === communityId);
    if (idx === -1) throw new Error('Community not found');

    const comm = all[idx];
    if (comm.memberIds.includes(userId)) {
      return comm; // Already a member
    }

    const updated: SocialCommunity = {
      ...comm,
      memberIds: [...comm.memberIds, userId],
      membersCount: comm.membersCount + 1,
      updatedAt: new Date().toISOString(),
    };

    all[idx] = updated;
    saveStoredCommunities(all);

    // Sync to Firestore
    try {
      await setDoc(doc(db, 'communities', comm.id), updated, { merge: true });
    } catch {
      // offline fallback
    }

    // Trigger notification to community creator if different
    if (userMeta && comm.creatorId !== userId) {
      postService.createNotification({
        recipientId: comm.creatorId,
        actorId: userId,
        actorName: userMeta.name,
        actorUsername: userMeta.username,
        actorPhotoURL: userMeta.photoURL,
        type: 'community',
        relatedCommunityId: comm.id,
        relatedCommunityHandle: comm.handle,
        relatedCommunityName: comm.name,
        text: `joined your community "${comm.name}"`,
      });
    }

    return updated;
  },

  async leaveCommunity(communityId: string, userId: string): Promise<SocialCommunity> {
    const all = getStoredCommunities();
    const idx = all.findIndex((c) => c.id === communityId);
    if (idx === -1) throw new Error('Community not found');

    const comm = all[idx];
    if (!comm.memberIds.includes(userId)) {
      return comm;
    }

    const updated: SocialCommunity = {
      ...comm,
      memberIds: comm.memberIds.filter((id) => id !== userId),
      membersCount: Math.max(0, comm.membersCount - 1),
      updatedAt: new Date().toISOString(),
    };

    all[idx] = updated;
    saveStoredCommunities(all);

    try {
      await setDoc(doc(db, 'communities', comm.id), updated, { merge: true });
    } catch {
      // offline fallback
    }

    return updated;
  },

  async createCommunity(params: {
    name: string;
    handle: string;
    description: string;
    avatarUrl: string;
    coverUrl?: string;
    category: string;
    creatorId: string;
    creatorName: string;
    postingPermission?: 'all' | 'members' | 'admins';
    tags?: string[];
  }): Promise<SocialCommunity> {
    const cleanHandle = params.handle.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30);
    if (!cleanHandle || cleanHandle.length < 3) {
      throw new Error('Community handle must be at least 3 characters long.');
    }

    const all = getStoredCommunities();
    if (all.some((c) => c.handle.toLowerCase() === cleanHandle)) {
      throw new Error(`The handle "@${cleanHandle}" is already taken by another community.`);
    }

    const newCommunity: SocialCommunity = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: params.name.trim(),
      handle: cleanHandle,
      description: params.description.trim(),
      avatarUrl: params.avatarUrl.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
      coverUrl: params.coverUrl?.trim() || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
      creatorId: params.creatorId,
      creatorName: params.creatorName,
      adminIds: [params.creatorId],
      memberIds: [params.creatorId],
      membersCount: 1,
      postsCount: 0,
      isVerified: false, // Strict verification protocol: new communities are not auto-verified
      category: params.category || 'Creator Community',
      postingPermission: params.postingPermission || 'members',
      tags: params.tags && params.tags.length > 0 ? params.tags : ['Mosaic', 'Community'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    all.unshift(newCommunity);
    saveStoredCommunities(all);

    try {
      await setDoc(doc(db, 'communities', newCommunity.id), newCommunity);
    } catch {
      // offline fallback
    }

    return newCommunity;
  },

  async updateCommunitySettings(
    communityId: string,
    updates: Partial<Pick<SocialCommunity, 'name' | 'description' | 'avatarUrl' | 'coverUrl' | 'postingPermission' | 'rules' | 'tags'>>,
    adminUserId: string
  ): Promise<SocialCommunity> {
    if (!this.isAdmin(communityId, adminUserId)) {
      throw new Error('Unauthorized: only community administrators can modify settings.');
    }

    const all = getStoredCommunities();
    const idx = all.findIndex((c) => c.id === communityId);
    if (idx === -1) throw new Error('Community not found');

    const updated: SocialCommunity = {
      ...all[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    all[idx] = updated;
    saveStoredCommunities(all);

    try {
      await setDoc(doc(db, 'communities', communityId), updated, { merge: true });
    } catch {
      // offline fallback
    }

    return updated;
  },

  getCommunityPosts(communityId: string): SocialPost[] {
    const all = postService.getAllPosts();
    return all.filter((p) => p.communityId === communityId);
  },

  searchCommunities(query: string): SocialCommunity[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const cleanTag = q.replace(/^#/, '').replace(/^@/, '');
    return getStoredCommunities().filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(cleanTag) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(cleanTag))
    );
  },

  getPopularCommunities(limitCount = 6): SocialCommunity[] {
    const all = [...getStoredCommunities()];
    all.sort((a, b) => b.membersCount - a.membersCount);
    return all.slice(0, limitCount);
  },
};

