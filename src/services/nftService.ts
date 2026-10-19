import { NftItem } from '../types';

const NFTS_STORAGE_KEY = 'mosaic_registered_nfts';

export const INITIAL_NFTS: NftItem[] = [];

const MOCK_NFT_IDS = new Set([
  'chog-1847',
  'ape-3829',
  'astral-89',
  'pixel-41',
  'lumina-12',
  'metropolis-504',
]);

function isMockNft(item: any): boolean {
  if (!item || !item.id) return true;
  if (MOCK_NFT_IDS.has(item.id)) return true;
  if (typeof item.id === 'string' && (item.id.startsWith('nft-seed-') || item.id.includes('seed'))) return true;
  if (item.creator && ['@sarahj', '@vance', '@alexchen', '@priyanair', '@elenar', '@mosaic'].includes(item.creator.handle)) return true;
  return false;
}

function getStoredNfts(): NftItem[] {
  try {
    const raw = localStorage.getItem(NFTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const authentic = parsed.filter((n) => !isMockNft(n));
        if (authentic.length !== parsed.length) {
          localStorage.setItem(NFTS_STORAGE_KEY, JSON.stringify(authentic));
        }
        return authentic;
      }
    }
  } catch (e) {
    console.warn('Error reading NFTs storage', e);
  }
  return [];
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
