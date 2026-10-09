import { Creator } from '../types';

const CREATORS_STORAGE_KEY = 'mosaic_registered_creators';

export const INITIAL_CREATORS: Creator[] = [
  {
    id: 'creator-sarah',
    name: 'Sarah Jenkins',
    handle: '@sarahj',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bio: 'Generative artist investigating light, memory, and collective storytelling on Mosaic.',
    badge: 'Genesis Creator',
    followersCount: 0,
    nftsCount: 0,
    featuredNftImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=80',
    verified: true,
  },
  {
    id: 'creator-alex',
    name: 'Alex Chen',
    handle: '@alexchen',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    bio: 'Narrative designer & pixel purist. Co-author of 9 Relay journeys with over 150 contributors.',
    badge: 'Relay Master',
    followersCount: 0,
    nftsCount: 0,
    featuredNftImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=80',
    verified: true,
  },
  {
    id: 'creator-priya',
    name: 'Priya Nair',
    handle: '@priyanair',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    bio: 'Sculpting synthetic emotions and digital identity. Passionate about human-curated NFT branches.',
    badge: 'Curator',
    followersCount: 0,
    nftsCount: 0,
    featuredNftImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80',
    verified: true,
  },
  {
    id: 'creator-vance',
    name: 'Marcus Vance',
    handle: '@vance',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'Streetwear x Web3. Bringing physical exhibition storytelling directly into collective digital ownership.',
    badge: 'Guild Lead',
    followersCount: 0,
    nftsCount: 0,
    featuredNftImage: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&auto=format&fit=crop&q=80',
    verified: true,
  },
];

function getStoredCreators(): Creator[] {
  let baseCreators: Creator[] = INITIAL_CREATORS;
  try {
    const raw = localStorage.getItem(CREATORS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        baseCreators = parsed.map((c: Creator) => ({
          ...c,
          followersCount: c.followersCount > 100 ? 0 : (c.followersCount || 0),
          nftsCount: c.nftsCount > 20 ? 0 : (c.nftsCount || 0),
        }));
      }
    }
  } catch (e) {
    console.warn('Error reading Creators storage', e);
  }

  const creators: Creator[] = [...baseCreators];

  // Merge real registered accounts from Mosaic user registry
  try {
    const rawProfiles = localStorage.getItem('mosaic_registered_profiles');
    if (rawProfiles) {
      const registry = JSON.parse(rawProfiles);
      Object.values(registry).forEach((user: any) => {
        if (
          user &&
          user.id &&
          !creators.some(
            (c) =>
              c.id === user.id ||
              c.handle.toLowerCase() === `@${user.username}`.toLowerCase()
          )
        ) {
          creators.unshift({
            id: user.id,
            name: user.displayName || user.username || 'Mosaic Member',
            handle: user.username
              ? user.username.startsWith('@')
                ? user.username
                : `@${user.username}`
              : `@${user.id.slice(0, 8)}`,
            avatar:
              user.photoURL ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            bio: user.bio || 'Creator on Mosaic exploring provenance and narrative relays.',
            badge: user.accountType === 'project' ? 'Project' : 'Member',
            followersCount: 1,
            nftsCount: 0,
            featuredNftImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=80',
            verified: false,
          });
        }
      });
    }
  } catch (e) {
    console.warn('Error merging registered profiles', e);
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
