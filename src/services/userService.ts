import { Creator } from '../types';

const CREATORS_STORAGE_KEY = 'mosaic_registered_creators';

export const INITIAL_CREATORS: Creator[] = [];

const MOCK_CREATOR_IDS = new Set([
  'creator-sarah',
  'creator-alex',
  'creator-vance',
  'creator-priya',
  'creator-mosaic',
]);

function getStoredCreators(): Creator[] {
  const creators: Creator[] = [];

  // Only load authentic registered accounts from Mosaic user registry
  try {
    const rawProfiles = localStorage.getItem('mosaic_registered_profiles');
    if (rawProfiles) {
      const registry = JSON.parse(rawProfiles);
      Object.values(registry).forEach((user: any) => {
        if (
          user &&
          user.id &&
          !MOCK_CREATOR_IDS.has(user.id) &&
          !creators.some(
            (c) =>
              c.id === user.id ||
              c.handle.toLowerCase() === `@${user.username}`.toLowerCase()
          )
        ) {
          creators.push({
            id: user.id,
            name: user.displayName || user.username || 'Mosaic Member',
            handle: user.username
              ? user.username.startsWith('@')
                ? user.username
                : `@${user.username}`
              : `@${user.id.slice(0, 8)}`,
            avatar: user.photoURL || '',
            bio: user.bio || 'Creator on Mosaic exploring provenance and narrative relays.',
            badge: user.accountType === 'project' ? 'Project' : 'Member',
            followersCount: 0,
            nftsCount: 0,
            featuredNftImage: '',
            verified: false,
          });
        }
      });
    }
  } catch (e) {
    console.warn('Error reading registered profiles', e);
  }

  return creators;
}

export const userService = {
  getAllUsers(): Creator[] {
    return getStoredCreators();
  },

  getAllCreators(): Creator[] {
    return getStoredCreators();
  },

  getFeaturedCreators(): Creator[] {
    return getStoredCreators();
  },

  getCreatorByHandle(handle: string): Creator | undefined {
    const clean = handle.startsWith('@') ? handle : `@${handle}`;
    return getStoredCreators().find((c) => c.handle.toLowerCase() === clean.toLowerCase());
  },

  getSuggestedFollows(excludeUserId?: string): Creator[] {
    return getStoredCreators().filter((c) => c.id !== excludeUserId);
  },

  searchUsers(term: string): Creator[] {
    const q = term.toLowerCase().trim().replace(/^@/, '');
    if (!q) return [];
    return getStoredCreators().filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(q) ||
        c.bio.toLowerCase().includes(q)
    );
  },
};
