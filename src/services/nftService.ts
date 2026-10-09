import { NftItem } from '../types';

const NFTS_STORAGE_KEY = 'mosaic_registered_nfts';

export const INITIAL_NFTS: NftItem[] = [
  {
    id: 'chog-1847',
    tokenId: '#1847',
    name: 'CHOG #1847',
    collection: 'The Contrarian',
    creator: {
      name: 'Mosaic Core',
      handle: '@mosaic',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    tags: ['Relay Active', 'Living Story', 'Genesis'],
    likes: 1420,
    relaysCount: 38,
    commentsCount: 94,
    price: '2.4 ETH',
    storySnippet: 'Passed through 4 creators across 3 continents. Every hand modified the emotional resonance.',
  },
  {
    id: 'ape-3829',
    tokenId: '#3829',
    name: 'Cyber Ape Renegade',
    collection: 'Ape Syndicate',
    creator: {
      name: 'Marcus Vance',
      handle: '@vance',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&auto=format&fit=crop&q=80',
    tags: ['Generative', 'Streetwear'],
    likes: 852,
    relaysCount: 19,
    commentsCount: 42,
    price: '1.8 ETH',
    storySnippet: 'Born on the rooftops of Neo-Shibuya. Its streetwear tag was added by collector @kaito.',
  },
  {
    id: 'astral-89',
    tokenId: '#89',
    name: 'Astral Gateway',
    collection: 'Cosmic Horizons',
    creator: {
      name: 'Sarah Jenkins',
      handle: '@sarahj',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
    tags: ['Sci-Fi', 'Architecture'],
    likes: 1205,
    relaysCount: 27,
    commentsCount: 67,
    price: '3.1 ETH',
    storySnippet: 'A monumental spire bathed in celestial dusk. The soundscape layer was contributed by @soundvoyage.',
  },
  {
    id: 'pixel-41',
    tokenId: '#41',
    name: 'Pixel Courier 8-Bit',
    collection: 'Retroverse',
    creator: {
      name: 'Alex Chen',
      handle: '@alexchen',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    tags: ['Pixel Art', 'Arcade'],
    likes: 640,
    relaysCount: 14,
    commentsCount: 31,
    price: '0.65 ETH',
    storySnippet: 'Courier with a battered floppy disk. Three collectors chose which faction received the decrypted data.',
  },
  {
    id: 'lumina-12',
    tokenId: '#12',
    name: 'Lumina Portrait #12',
    collection: 'Synth Human',
    creator: {
      name: 'Priya Nair',
      handle: '@priyanair',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    tags: ['Portrait', 'Cybernetic'],
    likes: 980,
    relaysCount: 22,
    commentsCount: 54,
    price: '2.0 ETH',
    storySnippet: 'Illuminated by violet rim-light. Sarah chose the ocular tint, while Alex shaped her neural crown.',
  },
  {
    id: 'metropolis-504',
    tokenId: '#504',
    name: 'Neon Metropolis',
    collection: 'Spires of Dawn',
    creator: {
      name: 'Elena Rostova',
      handle: '@elenar',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    tags: ['Cyberpunk', 'Cityscape'],
    likes: 1140,
    relaysCount: 31,
    commentsCount: 78,
    price: '2.9 ETH',
    storySnippet: 'Vertical sky-bridge city. Over 5 community votes determined whether the city experienced solar dusk or eclipse.',
  },
];

function getStoredNfts(): NftItem[] {
  try {
    const raw = localStorage.getItem(NFTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading NFTs storage', e);
  }
  localStorage.setItem(NFTS_STORAGE_KEY, JSON.stringify(INITIAL_NFTS));
  return INITIAL_NFTS;
}

function saveStoredNfts(items: NftItem[]) {
  try {
    localStorage.setItem(NFTS_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Error saving NFTs storage', e);
  }
}

type NftListener = (items: NftItem[]) => void;
const listeners = new Set<NftListener>();

function notify() {
  const current = getStoredNfts();
  listeners.forEach((fn) => fn(current));
}

export const nftService = {
  subscribe(fn: NftListener): () => void {
    listeners.add(fn);
    fn(getStoredNfts());
    return () => {
      listeners.delete(fn);
    };
  },

  getAllNfts(): NftItem[] {
    return getStoredNfts();
  },

  getHeroNft(): NftItem {
    return getStoredNfts()[0] || INITIAL_NFTS[0];
  },

  getNftById(id: string): NftItem | undefined {
    return getStoredNfts().find((n) => n.id === id);
  },

  getNftsByCollection(collection: string): NftItem[] {
    return getStoredNfts().filter((n) => n.collection.toLowerCase() === collection.toLowerCase());
  },

  getCollections(): Array<{ name: string; count: number; sampleImage: string }> {
    const all = getStoredNfts();
    const map = new Map<string, { count: number; sampleImage: string }>();
    all.forEach((item) => {
      const existing = map.get(item.collection);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(item.collection, { count: 1, sampleImage: item.image });
      }
    });
    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      sampleImage: data.sampleImage,
    }));
  },

  toggleLike(nftId: string): NftItem | undefined {
    const all = getStoredNfts();
    const item = all.find((n) => n.id === nftId);
    if (!item) return undefined;
    item.likes += 1;
    saveStoredNfts(all);
    notify();
    return item;
  },

  searchNfts(term: string): NftItem[] {
    const q = term.toLowerCase().trim();
    if (!q) return [];
    return getStoredNfts().filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.collection.toLowerCase().includes(q) ||
        n.creator.name.toLowerCase().includes(q) ||
        n.creator.handle.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
    );
  },
};
