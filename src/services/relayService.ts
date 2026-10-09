import { RelayExperience, RelayStep } from '../types';
import { postService } from './postService';

const RELAYS_STORAGE_KEY = 'mosaic_registered_relays';

export const INITIAL_RELAYS: RelayExperience[] = [
  {
    id: 'relay-1847',
    title: 'The Contrarian: Codex of Divergence',
    tokenId: '#1847',
    nftImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    collection: 'The Contrarian',
    currentStage: 4,
    totalStages: 5,
    activeCuratorName: 'Priya Nair',
    activeCuratorHandle: '@priyanair',
    participantsCount: 38,
    description: 'Passed through 4 creators across 3 continents. Every hand modified the emotional resonance and visual frequencies.',
    status: 'active',
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    steps: [
      {
        step: 1,
        personName: 'Mosaic Core',
        personHandle: '@mosaic',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        action: 'Created',
        decisionText: 'Minted base token and established genesis parameters for the decentralized community.',
        timestamp: 'Oct 2, 2026',
        promptQuestion: 'Would you rather branch the mythos or preserve the core glyph?',
      },
      {
        step: 2,
        personName: 'Sarah Jenkins',
        personHandle: '@sarahj',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        action: 'Changed',
        decisionText: "I'd change. Shifted color chromatic spectrum to bioluminescent ultraviolet.",
        timestamp: 'Oct 3, 2026',
        promptQuestion: 'Should the contrarian rebel outward or retreat into introspection?',
      },
      {
        step: 3,
        personName: 'Alex Chen',
        personHandle: '@alexchen',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        action: 'Created',
        decisionText: "I'd create. Inscribed chapter 3 of The Contrarian's Codex onto token metadata.",
        timestamp: 'Oct 5, 2026',
        promptQuestion: 'Would you pass the relay to an individual collector or open guild vote?',
      },
      {
        step: 4,
        personName: 'Priya Nair',
        personHandle: '@priyanair',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        action: 'Changed',
        decisionText: "I'd change. Infused holographic edge facets symbolizing shared custody.",
        timestamp: 'Oct 7, 2026',
        promptQuestion: 'Next relay recipient: You decide the fork.',
      },
    ],
  },
  {
    id: 'relay-3829',
    title: 'Cyber Ape Syndicate: Streetwear Lore Fork',
    tokenId: '#3829',
    nftImage: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&auto=format&fit=crop&q=80',
    collection: 'Ape Syndicate',
    currentStage: 2,
    totalStages: 4,
    activeCuratorName: 'Marcus Vance',
    activeCuratorHandle: '@vance',
    participantsCount: 19,
    description: 'Born on the rooftops of Neo-Shibuya. Community streetwear tags inscribed onto the digital garment canvas.',
    status: 'active',
    updatedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    steps: [
      {
        step: 1,
        personName: 'Marcus Vance',
        personHandle: '@vance',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        action: 'Created',
        decisionText: 'Generated base syndicate silhouette and opened Tokyo fashion layer.',
        timestamp: 'Oct 4, 2026',
      },
      {
        step: 2,
        personName: 'Kaito Tanaka',
        personHandle: '@kaito',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        action: 'Added Lore',
        decisionText: 'Stitched underground district map into jacket lining.',
        timestamp: 'Oct 6, 2026',
      },
    ],
  },
  {
    id: 'relay-89',
    title: 'Astral Gateway: Celestial Soundscape',
    tokenId: '#89',
    nftImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
    collection: 'Cosmic Horizons',
    currentStage: 3,
    totalStages: 3,
    activeCuratorName: 'Sound Voyage',
    activeCuratorHandle: '@soundvoyage',
    participantsCount: 27,
    description: 'Monumental spire with ambient resonant audio frequencies recorded across 3 celestial phases.',
    status: 'voting',
    updatedAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    steps: [
      {
        step: 1,
        personName: 'Sarah Jenkins',
        personHandle: '@sarahj',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        action: 'Created',
        decisionText: 'Sculpted base architectural spire bathed in ultraviolet sunset.',
        timestamp: 'Oct 1, 2026',
      },
      {
        step: 2,
        personName: 'Sound Voyage',
        personHandle: '@soundvoyage',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        action: 'Changed',
        decisionText: 'Attached dynamic harmonic overtone synthesizer.',
        timestamp: 'Oct 3, 2026',
      },
    ],
  },
];

function getStoredRelays(): RelayExperience[] {
  try {
    const raw = localStorage.getItem(RELAYS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading Relays storage', e);
  }
  localStorage.setItem(RELAYS_STORAGE_KEY, JSON.stringify(INITIAL_RELAYS));
  return INITIAL_RELAYS;
}

function saveStoredRelays(relays: RelayExperience[]) {
  try {
    localStorage.setItem(RELAYS_STORAGE_KEY, JSON.stringify(relays));
  } catch (e) {
    console.warn('Error saving Relays storage', e);
  }
}

type RelayListener = (relays: RelayExperience[]) => void;
const listeners = new Set<RelayListener>();

function notify() {
  const current = getStoredRelays();
  listeners.forEach((fn) => fn(current));
}

export const relayService = {
  subscribe(fn: RelayListener): () => void {
    listeners.add(fn);
    fn(getStoredRelays());
    return () => {
      listeners.delete(fn);
    };
  },

  getAllRelays(): RelayExperience[] {
    return getStoredRelays();
  },

  getFeaturedRelays(): RelayExperience[] {
    return getStoredRelays().slice(0, 3);
  },

  getActiveRelay(): RelayExperience {
    return getStoredRelays()[0] || INITIAL_RELAYS[0];
  },

  getRelayById(id: string): RelayExperience | undefined {
    return getStoredRelays().find((r) => r.id === id);
  },

  getRelaySteps(relayId?: string): RelayStep[] {
    const relay = relayId ? this.getRelayById(relayId) : getStoredRelays()[0];
    return relay ? relay.steps : INITIAL_RELAYS[0].steps;
  },

  inviteUserToRelay(params: {
    relayId: string;
    inviterUser: { id: string; name: string; username: string; photoURL: string };
    targetUserId: string;
  }): void {
    const relay = this.getRelayById(params.relayId);
    if (!relay) return;

    postService.createNotification({
      recipientId: params.targetUserId,
      actorId: params.inviterUser.id,
      actorName: params.inviterUser.name,
      actorUsername: params.inviterUser.username,
      actorPhotoURL: params.inviterUser.photoURL,
      type: 'relay_invite',
      relayId: relay.id,
      relayTitle: relay.title,
      text: `invited you to co-create Stage ${relay.currentStage + 1} of "${relay.title}"`,
    });
  },

  searchRelays(term: string): RelayExperience[] {
    const q = term.toLowerCase().trim();
    if (!q) return [];
    return getStoredRelays().filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.collection.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.activeCuratorName.toLowerCase().includes(q) ||
        r.activeCuratorHandle.toLowerCase().includes(q)
    );
  },
};
