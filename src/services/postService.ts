import {
  SocialPost,
  SocialNotification,
  PostPoll,
  AttachedNftSummary,
  AttachedRelaySummary,
  NFTReference,
} from '../types';
import { db } from '../lib/firebase';
import { projectService } from './projectService';
import { moderationService } from './moderationService';
import { getFixedProfileOverride } from '../utils/imageUtils';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';

const POSTS_STORAGE_KEY = 'mosaic_social_posts_cache';
const BOOKMARKS_STORAGE_KEY = 'mosaic_user_bookmarks';
const FOLLOWS_STORAGE_KEY = 'mosaic_user_following';
const NOTIFICATIONS_STORAGE_KEY = 'mosaic_user_notifications';

// No false or mock seed tweets - platform only holds authentic user and project posts
export const INITIAL_SEED_POSTS: SocialPost[] = [];

// Helper to get local cache
function getLocalPosts(): SocialPost[] {
  try {
    const raw = localStorage.getItem(POSTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Strip out any false tweets, mock seed posts, or legacy seeded authors
        const authenticPosts = parsed.filter((p: any) => {
          if (!p || !p.id) return false;
          if (typeof p.id === 'string' && (p.id.startsWith('post-seed-') || p.id.includes('seed'))) {
            return false;
          }
          if (['creator-sarah', 'creator-alex', 'creator-priya', 'creator-vance'].includes(p.authorId)) {
            return false;
          }
          return true;
        });

        // If stale seed posts were filtered out, sync cleaned list back to storage
        if (authenticPosts.length !== parsed.length) {
          localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(authenticPosts));
        }

        return authenticPosts.map((p: SocialPost) => {
          const fixed = getFixedProfileOverride(p.authorId);
          const resolvedPhoto = fixed?.photoURL || p.authorPhotoURL;
          const resolvedName = fixed?.displayName || p.authorName;
          const resolvedUsername = fixed?.username || p.authorUsername;

          return {
            ...p,
            authorPhotoURL: resolvedPhoto,
            authorName: resolvedName,
            authorUsername: resolvedUsername,
            likesCount: p.likedBy ? p.likedBy.length : (p.likesCount || 0),
            likedBy: p.likedBy || [],
            repostsCount: p.repostedBy ? p.repostedBy.length : (p.repostsCount || 0),
            repostedBy: p.repostedBy || [],
            bookmarksCount: p.bookmarkedBy ? p.bookmarkedBy.length : (p.bookmarksCount || 0),
            bookmarkedBy: p.bookmarkedBy || [],
            repliesCount: p.repliesCount || 0,
          };
        });
      }
    }
  } catch (e) {
    console.warn('Post cache parse error', e);
  }
  return [];
}

function saveLocalPosts(posts: SocialPost[]) {
  try {
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
  } catch (e) {
    console.warn('Failed to save posts to localStorage', e);
  }
}

// Subscriptions
type PostsListener = (posts: SocialPost[]) => void;
const postListeners: Set<PostsListener> = new Set();

function notifyListeners() {
  const current = getLocalPosts();
  postListeners.forEach((fn) => {
    try {
      fn(current);
    } catch (e) {
      console.error('Error notifying post listener', e);
    }
  });
}

// Firestore background sync
async function syncPostToFirestore(post: SocialPost): Promise<void> {
  try {
    await setDoc(doc(db, 'posts', post.id), post, { merge: true });
  } catch (e) {
    // Graceful offline/local fallback
  }
}

async function deletePostFromFirestore(postId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'posts', postId));
  } catch (e) {
    // Graceful offline/local fallback
  }
}

// Background sync from Firestore for authentic posts
async function loadPostsFromFirestore(): Promise<void> {
  try {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const firestorePosts: SocialPost[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as SocialPost;
        if (
          data &&
          data.id &&
          !data.id.startsWith('post-seed-') &&
          !data.id.includes('seed') &&
          !['creator-sarah', 'creator-alex', 'creator-priya', 'creator-vance'].includes(data.authorId)
        ) {
          firestorePosts.push(data);
        }
      });
      if (firestorePosts.length > 0) {
        const local = getLocalPosts();
        const mergedMap = new Map<string, SocialPost>();
        local.forEach((p) => mergedMap.set(p.id, p));

        firestorePosts.forEach((fp) => {
          const fixed = getFixedProfileOverride(fp.authorId);
          const localExisting = mergedMap.get(fp.id);
          const resolvedPhoto = fixed?.photoURL || localExisting?.authorPhotoURL || fp.authorPhotoURL;
          const resolvedName = fixed?.displayName || localExisting?.authorName || fp.authorName;
          const resolvedUsername = fixed?.username || localExisting?.authorUsername || fp.authorUsername;
          mergedMap.set(fp.id, {
            ...fp,
            authorPhotoURL: resolvedPhoto,
            authorName: resolvedName,
            authorUsername: resolvedUsername,
          });
        });

        const merged = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        saveLocalPosts(merged);
        notifyListeners();
      }
    }
  } catch (err) {
    // Graceful offline fallback
  }
}
loadPostsFromFirestore();

export const postService = {
  subscribe(callback: PostsListener): () => void {
    postListeners.add(callback);
    callback(getLocalPosts());
    return () => {
      postListeners.delete(callback);
    };
  },

  getAllPosts(): SocialPost[] {
    return getLocalPosts();
  },

  getFeed(feedType: 'forYou' | 'following', currentUserId?: string): SocialPost[] {
    const all = getLocalPosts();
    // Filter out replies from top-level feed unless they are root of a thread
    let topLevel = all.filter((p) => !p.replyToId);

    // Apply moderation rules: filter blocked authors and hidden posts
    if (currentUserId) {
      const blocked = moderationService.getBlockedUsernames(currentUserId);
      const hidden = moderationService.getHiddenPostIds(currentUserId);
      topLevel = topLevel.filter((p) => {
        if (hidden.includes(p.id)) return false;
        if (blocked.includes(p.authorUsername.toLowerCase())) return false;
        return true;
      });
    }

    if (feedType === 'following' && currentUserId) {
      const followingUsers = this.getFollowingIds(currentUserId);
      const followingProjects = projectService.getFollowedProjectIds(currentUserId);
      return topLevel.filter(
        (p) =>
          followingUsers.includes(p.authorId) ||
          followingUsers.includes(p.authorUsername) ||
          followingProjects.includes(p.authorId) ||
          followingProjects.includes(p.authorUsername) ||
          p.authorId === currentUserId
      );
    }

    return topLevel;
  },

  /**
   * Incremental cursor-based feed pagination for fast performance
   */
  getPaginatedFeed(
    feedType: 'forYou' | 'following',
    currentUserId?: string,
    cursor?: string | null,
    limitCount = 15
  ): { posts: SocialPost[]; nextCursor: string | null; hasMore: boolean } {
    const full = this.getFeed(feedType, currentUserId);
    let startIndex = 0;
    if (cursor) {
      const idx = full.findIndex((p) => p.id === cursor);
      if (idx !== -1) {
        startIndex = idx + 1;
      }
    }
    const page = full.slice(startIndex, startIndex + limitCount);
    const nextCursor = page.length === limitCount ? page[page.length - 1].id : null;
    return {
      posts: page,
      nextCursor,
      hasMore: startIndex + limitCount < full.length,
    };
  },

  /**
   * Calculates trending posts using engagement velocity decayed over time
   */
  getTrendingPosts(limitCount = 10, currentUserId?: string): SocialPost[] {
    const all = this.getFeed('forYou', currentUserId);
    const scored = all.map((post) => {
      const hoursSince = Math.max(0.1, (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60));
      // Engagement formula: likes * 1.5 + reposts * 2 + replies * 2.5 decayed over time
      const engagement = (post.likesCount * 1.5) + (post.repostsCount * 2) + (post.repliesCount * 2.5);
      const score = (engagement + 1) / Math.pow(hoursSince + 2, 1.2);
      return { post, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limitCount).map((s) => s.post);
  },

  getPostById(postId: string): SocialPost | undefined {
    const all = getLocalPosts();
    return all.find((p) => p.id === postId);
  },

  getRepliesForPost(postId: string): SocialPost[] {
    const all = getLocalPosts();
    return all
      .filter((p) => p.replyToId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  getThreadPosts(threadId: string): SocialPost[] {
    const all = getLocalPosts();
    return all
      .filter((p) => p.threadId === threadId)
      .sort((a, b) => (a.threadOrder || 0) - (b.threadOrder || 0));
  },

  getUserPosts(username: string): SocialPost[] {
    const all = getLocalPosts();
    return all.filter((p) => p.authorUsername.toLowerCase() === username.toLowerCase());
  },

  getBookmarkedPosts(userId: string): SocialPost[] {
    const all = getLocalPosts();
    return all.filter((p) => p.bookmarkedBy.includes(userId));
  },

  async createPost(params: {
    authorId: string;
    authorName: string;
    authorUsername: string;
    authorPhotoURL: string;
    authorBadge?: string;
    authorAccountType?: 'user' | 'project';
    isProjectPost?: boolean;
    projectCategory?: string;
    text: string;
    mediaUrls?: string[];
    poll?: PostPoll;
    quotePostId?: string;
    quotePost?: SocialPost['quotePost'];
    replyToId?: string;
    replyToUsername?: string;
    attachedNft?: AttachedNftSummary;
    nftReference?: NFTReference;
    attachedRelay?: AttachedRelaySummary;
    communityId?: string;
    communityHandle?: string;
    communityName?: string;
  }): Promise<SocialPost> {
    const fixed = getFixedProfileOverride(params.authorId);
    const resolvedPhoto = fixed?.photoURL || params.authorPhotoURL;
    const resolvedName = fixed?.displayName || params.authorName;
    const resolvedUsername = fixed?.username || params.authorUsername;

    const newPost: SocialPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      authorId: params.authorId,
      authorName: resolvedName,
      authorUsername: resolvedUsername,
      authorPhotoURL: resolvedPhoto,
      authorBadge: params.authorBadge,
      authorAccountType: params.authorAccountType,
      isProjectPost: params.isProjectPost,
      projectCategory: params.projectCategory,
      text: params.text,
      mediaUrls: params.mediaUrls || [],
      poll: params.poll,
      likesCount: 0,
      likedBy: [],
      repostsCount: 0,
      repostedBy: [],
      bookmarksCount: 0,
      bookmarkedBy: [],
      repliesCount: 0,
      quotePostId: params.quotePostId,
      quotePost: params.quotePost,
      replyToId: params.replyToId,
      replyToUsername: params.replyToUsername,
      attachedNft: params.attachedNft,
      nftReference: params.nftReference,
      attachedRelay: params.attachedRelay,
      communityId: params.communityId,
      communityHandle: params.communityHandle,
      communityName: params.communityName,
      createdAt: new Date().toISOString(),
    };

    const all = getLocalPosts();

    // If this is a reply, update parent's repliesCount
    if (params.replyToId) {
      const parent = all.find((p) => p.id === params.replyToId);
      if (parent) {
        parent.repliesCount = (parent.repliesCount || 0) + 1;
        syncPostToFirestore(parent);

        // Create notification for parent author if different
        if (parent.authorId !== params.authorId) {
          this.createNotification({
            recipientId: parent.authorId,
            actorId: params.authorId,
            actorName: params.authorName,
            actorUsername: params.authorUsername,
            actorPhotoURL: params.authorPhotoURL,
            type: 'reply',
            postId: parent.id,
            text: params.text.slice(0, 80),
          });
        }
      }
    }

    // If this is a quote post, notify original author
    if (params.quotePostId) {
      const quoted = all.find((p) => p.id === params.quotePostId);
      if (quoted && quoted.authorId !== params.authorId) {
        this.createNotification({
          recipientId: quoted.authorId,
          actorId: params.authorId,
          actorName: params.authorName,
          actorUsername: params.authorUsername,
          actorPhotoURL: params.authorPhotoURL,
          type: 'quote',
          postId: newPost.id,
          text: params.text.slice(0, 80),
        });
      }
    }

    // Dispatch mention notifications for any @username in text
    const mentionMatches = params.text.match(/@([a-zA-Z0-9_]+)/g);
    if (mentionMatches) {
      const handles = Array.from(new Set(mentionMatches.map((m) => m.slice(1).toLowerCase())));
      handles.forEach((handle) => {
        if (handle !== params.authorUsername.toLowerCase()) {
          const targetUser = all.find((p) => p.authorUsername.toLowerCase() === handle);
          const recipientId = targetUser?.authorId || `user-${handle}`;
          this.createNotification({
            recipientId,
            actorId: params.authorId,
            actorName: params.authorName,
            actorUsername: params.authorUsername,
            actorPhotoURL: params.authorPhotoURL,
            type: 'mention',
            postId: newPost.id,
            text: params.text.slice(0, 100),
          });
        }
      });
    }

    const updated = [newPost, ...all];
    saveLocalPosts(updated);
    notifyListeners();
    syncPostToFirestore(newPost);
    return newPost;
  },

  async editPost(postId: string, newText: string, currentUserId: string): Promise<SocialPost> {
    const all = getLocalPosts();
    const post = all.find((p) => p.id === postId);
    if (!post) throw new Error('Post not found');

    if (post.authorId !== currentUserId) {
      throw new Error('Unauthorized: you can only edit your own posts');
    }

    const trimmed = newText.trim();
    if (!trimmed) {
      throw new Error('Post content cannot be empty');
    }

    post.text = trimmed;
    post.updatedAt = new Date().toISOString();

    saveLocalPosts(all);
    notifyListeners();

    try {
      await updateDoc(doc(db, 'posts', postId), {
        text: post.text,
        updatedAt: post.updatedAt,
      });
    } catch {
      await syncPostToFirestore(post);
    }

    return post;
  },

  async deletePost(postId: string, currentUserId: string): Promise<void> {
    const all = getLocalPosts();
    const post = all.find((p) => p.id === postId);
    if (!post) return;

    if (post.authorId !== currentUserId) {
      throw new Error('Unauthorized: you can only delete your own posts');
    }

    // If it was a reply to another post, decrement parent reply count
    if (post.replyToId) {
      const parent = all.find((p) => p.id === post.replyToId);
      if (parent) {
        parent.repliesCount = Math.max(0, (parent.repliesCount || 1) - 1);
        syncPostToFirestore(parent);
      }
    }

    // Filter out post from local cache
    const remaining = all.filter((p) => p.id !== postId);
    saveLocalPosts(remaining);
    notifyListeners();

    await deletePostFromFirestore(postId);
  },

  async createThread(params: {
    authorId: string;
    authorName: string;
    authorUsername: string;
    authorPhotoURL: string;
    authorBadge?: string;
    authorAccountType?: 'user' | 'project';
    isProjectPost?: boolean;
    projectCategory?: string;
    posts: Array<{ text: string; mediaUrls?: string[] }>;
  }): Promise<SocialPost[]> {
    const threadId = `thread-${Date.now()}`;
    const totalInThread = params.posts.length;
    const now = Date.now();

    const createdPosts: SocialPost[] = params.posts.map((p, idx) => ({
      id: `post-${now + idx}-${Math.random().toString(36).substring(2, 6)}`,
      authorId: params.authorId,
      authorName: params.authorName,
      authorUsername: params.authorUsername,
      authorPhotoURL: params.authorPhotoURL,
      authorBadge: params.authorBadge,
      authorAccountType: params.authorAccountType,
      isProjectPost: params.isProjectPost,
      projectCategory: params.projectCategory,
      text: p.text,
      mediaUrls: p.mediaUrls || [],
      likesCount: 0,
      likedBy: [],
      repostsCount: 0,
      repostedBy: [],
      bookmarksCount: 0,
      bookmarkedBy: [],
      repliesCount: 0,
      threadId,
      threadOrder: idx + 1,
      totalInThread,
      createdAt: new Date(now + idx * 1000).toISOString(),
    }));

    const all = getLocalPosts();
    const updated = [...createdPosts, ...all];
    saveLocalPosts(updated);
    notifyListeners();

    createdPosts.forEach((post) => syncPostToFirestore(post));
    return createdPosts;
  },

  async toggleLike(postId: string, userId: string, userMeta?: { name: string; username: string; photoURL: string }): Promise<SocialPost> {
    const all = getLocalPosts();
    const post = all.find((p) => p.id === postId);
    if (!post) throw new Error('Post not found');

    const hasLiked = post.likedBy.includes(userId);
    if (hasLiked) {
      post.likedBy = post.likedBy.filter((id) => id !== userId);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      post.likedBy.push(userId);
      post.likesCount += 1;

      if (post.authorId !== userId && userMeta) {
        this.createNotification({
          recipientId: post.authorId,
          actorId: userId,
          actorName: userMeta.name,
          actorUsername: userMeta.username,
          actorPhotoURL: userMeta.photoURL,
          type: 'like',
          postId: post.id,
          text: post.text.slice(0, 60),
        });
      }
    }

    saveLocalPosts(all);
    notifyListeners();
    syncPostToFirestore(post);
    return post;
  },

  async toggleRepost(postId: string, userId: string, userMeta?: { name: string; username: string; photoURL: string }): Promise<SocialPost> {
    const all = getLocalPosts();
    const post = all.find((p) => p.id === postId);
    if (!post) throw new Error('Post not found');

    const hasReposted = post.repostedBy.includes(userId);
    if (hasReposted) {
      post.repostedBy = post.repostedBy.filter((id) => id !== userId);
      post.repostsCount = Math.max(0, post.repostsCount - 1);
    } else {
      post.repostedBy.push(userId);
      post.repostsCount += 1;

      if (post.authorId !== userId && userMeta) {
        this.createNotification({
          recipientId: post.authorId,
          actorId: userId,
          actorName: userMeta.name,
          actorUsername: userMeta.username,
          actorPhotoURL: userMeta.photoURL,
          type: 'repost',
          postId: post.id,
        });
      }
    }

    saveLocalPosts(all);
    notifyListeners();
    syncPostToFirestore(post);
    return post;
  },

  async toggleBookmark(postId: string, userId: string): Promise<SocialPost> {
    const all = getLocalPosts();
    const post = all.find((p) => p.id === postId);
    if (!post) throw new Error('Post not found');

    const hasBookmarked = post.bookmarkedBy.includes(userId);
    if (hasBookmarked) {
      post.bookmarkedBy = post.bookmarkedBy.filter((id) => id !== userId);
      post.bookmarksCount = Math.max(0, post.bookmarksCount - 1);
    } else {
      post.bookmarkedBy.push(userId);
      post.bookmarksCount += 1;
    }

    saveLocalPosts(all);
    notifyListeners();
    syncPostToFirestore(post);
    return post;
  },

  async votePoll(postId: string, optionId: string, userId: string): Promise<SocialPost> {
    const all = getLocalPosts();
    const post = all.find((p) => p.id === postId);
    if (!post || !post.poll) throw new Error('Poll not found');

    const currentVote = post.poll.voters[userId];
    if (currentVote === optionId) return post; // already voted for this option

    if (currentVote) {
      // Switch vote
      const prevOpt = post.poll.options.find((o) => o.id === currentVote);
      if (prevOpt) prevOpt.votes = Math.max(0, prevOpt.votes - 1);
    } else {
      post.poll.totalVotes += 1;
    }

    const newOpt = post.poll.options.find((o) => o.id === optionId);
    if (newOpt) newOpt.votes += 1;

    post.poll.voters[userId] = optionId;

    saveLocalPosts(all);
    notifyListeners();
    syncPostToFirestore(post);
    return post;
  },

  updateAuthorProfile(authorId: string, updates: { photoURL?: string; displayName?: string; username?: string }) {
    const all = getLocalPosts();
    let changed = false;
    all.forEach((p) => {
      if (p.authorId === authorId) {
        if (updates.photoURL) p.authorPhotoURL = updates.photoURL;
        if (updates.displayName) p.authorName = updates.displayName;
        if (updates.username) p.authorUsername = updates.username;
        changed = true;
        // Asynchronously sync to Firestore so remote docs do not retain stale authorPhotoURL
        syncPostToFirestore(p);
      }
    });
    if (changed) {
      saveLocalPosts(all);
      notifyListeners();
    }
  },

  // Following Mechanics
  getFollowingIds(userId: string): string[] {
    try {
      const raw = localStorage.getItem(`${FOLLOWS_STORAGE_KEY}_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  toggleFollow(targetUserId: string, currentUserId: string): boolean {
    const following = this.getFollowingIds(currentUserId);
    const isFollowing = following.includes(targetUserId);
    let updated: string[];

    if (isFollowing) {
      updated = following.filter((id) => id !== targetUserId);
    } else {
      updated = [...following, targetUserId];
    }

    try {
      localStorage.setItem(`${FOLLOWS_STORAGE_KEY}_${currentUserId}`, JSON.stringify(updated));
    } catch (e) {}

    notifyListeners();
    return !isFollowing;
  },

  // Notifications
  getNotifications(userId: string): SocialNotification[] {
    try {
      const raw = localStorage.getItem(`${NOTIFICATIONS_STORAGE_KEY}_${userId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const authenticNotifs = parsed.filter((n: any) => {
            if (!n || !n.id) return false;
            if (n.id.includes('seed')) return false;
            if (['creator-sarah', 'creator-alex', 'creator-priya', 'creator-vance'].includes(n.actorId)) return false;
            return true;
          });
          if (authenticNotifs.length !== parsed.length) {
            localStorage.setItem(`${NOTIFICATIONS_STORAGE_KEY}_${userId}`, JSON.stringify(authenticNotifs));
          }
          return authenticNotifs;
        }
      }
    } catch (e) {}

    // Return empty notifications list by default (no fake/mock notifications)
    return [];
  },

  createNotification(notif: Omit<SocialNotification, 'id' | 'createdAt' | 'read'>): void {
    const list = this.getNotifications(notif.recipientId);

    // Prevent duplicate notifications for the same event
    const isDuplicate = list.some((existing) => {
      const isSameActor = existing.actorId === notif.actorId;
      const isSameType = existing.type === notif.type;
      const isSameTarget =
        (notif.postId && existing.postId === notif.postId) ||
        (notif.relatedCommunityId && existing.relatedCommunityId === notif.relatedCommunityId);
      const isRecent = Date.now() - new Date(existing.createdAt).getTime() < 10 * 60 * 1000;
      return isSameActor && isSameType && isSameTarget && isRecent;
    });

    if (isDuplicate) return;

    const newNotif: SocialNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };

    try {
      localStorage.setItem(`${NOTIFICATIONS_STORAGE_KEY}_${notif.recipientId}`, JSON.stringify([newNotif, ...list]));
    } catch (e) {}

    // Firestore async sync
    try {
      setDoc(doc(db, 'notifications', newNotif.id), newNotif, { merge: true }).catch(() => {});
    } catch {}

    notifyListeners();
  },

  markNotificationsRead(userId: string): void {
    const now = new Date().toISOString();
    const list = this.getNotifications(userId).map((n) => ({ ...n, read: true, readAt: n.readAt || now }));
    try {
      localStorage.setItem(`${NOTIFICATIONS_STORAGE_KEY}_${userId}`, JSON.stringify(list));
    } catch (e) {}
    notifyListeners();
  },

  markNotificationRead(userId: string, notifId: string): void {
    const now = new Date().toISOString();
    const list = this.getNotifications(userId).map((n) => (n.id === notifId ? { ...n, read: true, readAt: n.readAt || now } : n));
    try {
      localStorage.setItem(`${NOTIFICATIONS_STORAGE_KEY}_${userId}`, JSON.stringify(list));
    } catch (e) {}
    notifyListeners();
  },

  async removeBookmark(postId: string, userId: string): Promise<SocialPost> {
    const all = getLocalPosts();
    const post = all.find((p) => p.id === postId);
    if (!post) throw new Error('Post not found');
    post.bookmarkedBy = post.bookmarkedBy.filter((id) => id !== userId);
    post.bookmarksCount = Math.max(0, post.bookmarksCount - 1);
    saveLocalPosts(all);
    notifyListeners();
    syncPostToFirestore(post);
    return post;
  },

  getPostsByHashtag(tag: string): SocialPost[] {
    const clean = tag.replace(/^#/, '').toLowerCase().trim();
    if (!clean) return [];
    const all = getLocalPosts();
    return all.filter((p) => {
      const regex = new RegExp(`(^|\\s|#)(${clean})(\\b|\\s|$)`, 'i');
      return regex.test(p.text);
    });
  },

  getTrendingHashtags(): Array<{ tag: string; count: number }> {
    const all = getLocalPosts();
    const counts: Record<string, number> = {};
    all.forEach((post) => {
      const matches = post.text.match(/#([a-zA-Z0-9_]+)/g);
      if (matches) {
        matches.forEach((m) => {
          const t = m.slice(1);
          counts[t] = (counts[t] || 0) + 1;
        });
      }
    });

    const sorted = Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    return sorted;
  },

  searchPosts(queryStr: string): SocialPost[] {
    const q = queryStr.toLowerCase().trim();
    if (!q) return [];
    const all = getLocalPosts();
    return all.filter(
      (p) =>
        p.text.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q) ||
        p.authorUsername.toLowerCase().includes(q)
    );
  },
};
