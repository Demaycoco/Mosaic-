import { SocialPost, SocialNotification, PostPoll, AttachedNftSummary } from '../types';
import { db } from '../lib/firebase';
import { projectService } from './projectService';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
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
          if (p.likesCount > 0 && (!p.likedBy || p.likedBy.length === 0)) {
            return {
              ...p,
              likesCount: p.likedBy ? p.likedBy.length : 0,
              likedBy: p.likedBy || [],
              repostsCount: p.repostedBy ? p.repostedBy.length : 0,
              repostedBy: p.repostedBy || [],
              bookmarksCount: p.bookmarkedBy ? p.bookmarkedBy.length : 0,
              bookmarkedBy: p.bookmarkedBy || [],
              repliesCount: p.repliesCount || 0,
            };
          }
          return p;
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
        firestorePosts.forEach((p) => mergedMap.set(p.id, p));
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
    const topLevel = all.filter((p) => !p.replyToId);

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
  }): Promise<SocialPost> {
    const newPost: SocialPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      authorId: params.authorId,
      authorName: params.authorName,
      authorUsername: params.authorUsername,
      authorPhotoURL: params.authorPhotoURL,
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
    const newNotif: SocialNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    try {
      localStorage.setItem(`${NOTIFICATIONS_STORAGE_KEY}_${notif.recipientId}`, JSON.stringify([newNotif, ...list]));
    } catch (e) {}
  },

  markNotificationsRead(userId: string): void {
    const list = this.getNotifications(userId).map((n) => ({ ...n, read: true }));
    try {
      localStorage.setItem(`${NOTIFICATIONS_STORAGE_KEY}_${userId}`, JSON.stringify(list));
    } catch (e) {}
    notifyListeners();
  },

  markNotificationRead(userId: string, notifId: string): void {
    const list = this.getNotifications(userId).map((n) => (n.id === notifId ? { ...n, read: true } : n));
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
