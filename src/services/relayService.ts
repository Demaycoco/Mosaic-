import { RelayExperience, RelayStep } from '../types';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { postService } from './postService';

const RELAYS_STORAGE_KEY = 'mosaic_registered_relays';

export const INITIAL_RELAYS: RelayExperience[] = [
  {
    id: 'relay-1847',
    title: 'The Contrarian: Codex of Divergence',
    tokenId: '#1847',
    nftImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    collection: 'CHOG',
    question: 'Would you create or change?',
    options: ['CREATE', 'CHANGE'],
    currentStage: 12,
    totalStages: 15,
    creatorName: 'Mosaic Core',
    creatorHandle: '@mosaic',
    creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    activeCuratorName: 'Jordan Reed',
    activeCuratorHandle: '@jordanreed',
    participantsCount: 12,
    description: 'Passed through 12 creators across 6 countries. A living battleground of creative divergence where participants actively challenge the direction of each preceding chapter.',
    status: 'active',
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    steps: [
      {
        step: 1,
        personName: 'Mosaic Core',
        personHandle: '@mosaic',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        action: 'CREATE',
        decisionText: 'Minted base token and established genesis parameters for the decentralized community.',
        prediction: 'CHANGE',
        timestamp: 'Oct 2, 2026',
        promptQuestion: 'Would you create or change?',
      },
      {
        step: 2,
        personName: 'Sarah Jenkins',
        personHandle: '@sarahj',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        action: 'CHANGE',
        decisionText: 'Shifted chromatic spectrum to bioluminescent ultraviolet frequencies.',
        prediction: 'CREATE',
        timestamp: 'Oct 3, 2026',
        promptQuestion: 'Would you create or change?',
      },
      {
        step: 3,
        personName: 'Alex Chen',
        personHandle: '@alexchen',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        action: 'CREATE',
        decisionText: "Inscribed chapter 3 of The Contrarian's Codex onto living token lore.",
        prediction: 'CHANGE',
        timestamp: 'Oct 5, 2026',
        promptQuestion: 'Would you create or change?',
      },
      {
        step: 4,
        personName: 'Priya Nair',
        personHandle: '@priyanair',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        action: 'CHANGE',
        decisionText: 'Infused holographic edge facets symbolizing shared provenance and open custody.',
        prediction: 'CREATE',
        timestamp: 'Oct 7, 2026',
        promptQuestion: 'Would you create or change?',
      },
      {
        step: 5,
        personName: 'Marcus Vance',
        personHandle: '@vance',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        action: 'CHANGE',
        decisionText: 'Reinforced Priya’s optical filter to harmonize color gradients.',
        prediction: 'CHANGE',
        timestamp: 'Oct 8, 2026',
        promptQuestion: 'Would you create or change?',
      },
      {
        step: 6,
        personName: 'Elena Rostova',
        personHandle: '@elena',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        action: 'CREATE',
        decisionText: 'Broke consensus by introducing an encrypted algorithmic glyph watermark.',
        timestamp: 'Oct 9, 2026',
        promptQuestion: 'Would you create or change?',
      },
      {
        step: 7,
        personName: 'Kaito Tanaka',
        personHandle: '@kaito',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
        action: 'CREATE',
        decisionText: 'Synthesized neo-cybernetic borders anchoring the glyph geometry.',
        timestamp: 'Oct 10, 2026',
        promptQuestion: 'Would you create or change?',
      },
      {
        step: 8,
        personName: 'Devin Cole',
        personHandle: '@devin',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
        action: 'CHANGE',
        decisionText: 'Inverted the light exposure, turning the glyph into an obsidian shadow silhouette.',
        prediction: 'CREATE',
        timestamp: 'Oct 11, 2026',
        promptQuestion: 'Would you create or change?',
      },
      {
        step: 9,
        personName: 'Maya Lin',
        personHandle: '@mayalin',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        action: 'CHANGE',
        decisionText: 'Preserved the obsidian shadow and layered acoustic frequencies into token metadata.',
        timestamp: 'Oct 11, 2026',
        promptQuestion: 'Would you create or change?',
      },
      {
        step: 10,
        personName: 'Liam O’Connor',
        personHandle: '@liam_eth',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
        action: 'CREATE',
        decisionText: 'Reopened architectural generation by weaving an ethereal starlight prism.',
        timestamp: 'Oct 12, 2026',
        promptQuestion: 'Would you create or change?',
      },
      {
        step: 11,
        personName: 'Zoe Martinez',
        personHandle: '@zoem',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        action: 'CHANGE',
        decisionText: 'Countered the prism by applying matte thermal shielding to the token mantle.',
        timestamp: 'Oct 12, 2026',
        promptQuestion: 'Would you create or change?',
      },
      {
        step: 12,
        personName: 'Jordan Reed',
        personHandle: '@jordanreed',
        avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80',
        action: 'CHANGE',
        decisionText: 'Locked in the contrarian phase, sealing the divergence index into immutable history.',
        timestamp: 'Oct 13, 2026',
        promptQuestion: 'Would you create or change?',
      },
    ],
  },
  {
    id: 'relay-3829',
    title: 'Cyber Ape Syndicate: Streetwear Lore Fork',
    tokenId: '#3829',
    nftImage: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&auto=format&fit=crop&q=80',
    collection: 'Ape Syndicate',
    question: 'Would you create or change?',
    options: ['CREATE', 'CHANGE'],
    currentStage: 2,
    totalStages: 4,
    creatorName: 'Marcus Vance',
    creatorHandle: '@vance',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    activeCuratorName: 'Marcus Vance',
    activeCuratorHandle: '@vance',
    participantsCount: 2,
    description: 'Born on the rooftops of Neo-Shibuya. Community streetwear tags inscribed onto the digital garment canvas.',
    status: 'active',
    updatedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    steps: [
      {
        step: 1,
        personName: 'Marcus Vance',
        personHandle: '@vance',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        action: 'CREATE',
        decisionText: 'Generated base syndicate silhouette and opened Tokyo fashion layer.',
        prediction: 'CHANGE',
        timestamp: 'Oct 4, 2026',
        promptQuestion: 'Would you create or change?',
      },
      {
        step: 2,
        personName: 'Kaito Tanaka',
        personHandle: '@kaito',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        action: 'CHANGE',
        decisionText: 'Stitched underground district map into jacket lining.',
        prediction: 'CREATE',
        timestamp: 'Oct 6, 2026',
        promptQuestion: 'Would you create or change?',
      },
    ],
  },
  {
    id: 'relay-89',
    title: 'Astral Gateway: Celestial Soundscape',
    tokenId: '#89',
    nftImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
    collection: 'Cosmic Horizons',
    question: 'Would you create or change?',
    options: ['CREATE', 'CHANGE'],
    currentStage: 2,
    totalStages: 3,
    creatorName: 'Sarah Jenkins',
    creatorHandle: '@sarahj',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    activeCuratorName: 'Sound Voyage',
    activeCuratorHandle: '@soundvoyage',
    participantsCount: 2,
    description: 'Monumental spire with ambient resonant audio frequencies recorded across 3 celestial phases.',
    status: 'voting',
    updatedAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    steps: [
      {
        step: 1,
        personName: 'Sarah Jenkins',
        personHandle: '@sarahj',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        action: 'CREATE',
        decisionText: 'Sculpted base architectural spire bathed in ultraviolet sunset.',
        prediction: 'CHANGE',
        timestamp: 'Oct 1, 2026',
        promptQuestion: 'Would you create or change?',
      },
      {
        step: 2,
        personName: 'Sound Voyage',
        personHandle: '@soundvoyage',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        action: 'CHANGE',
        decisionText: 'Attached dynamic harmonic overtone synthesizer.',
        prediction: 'CREATE',
        timestamp: 'Oct 3, 2026',
        promptQuestion: 'Would you create or change?',
      },
    ],
  },
];

function getStoredRelays(): RelayExperience[] {
  try {
    const raw = localStorage.getItem(RELAYS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existing1847 = parsed.find((r) => r.id === 'relay-1847');
        if (existing1847 && (!existing1847.steps || existing1847.steps.length < 12)) {
          const updated = parsed.map((r) => (r.id === 'relay-1847' ? INITIAL_RELAYS[0] : r));
          localStorage.setItem(RELAYS_STORAGE_KEY, JSON.stringify(updated));
          return updated;
        }
        return parsed;
      }
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

function notifyListeners() {
  const current = getStoredRelays();
  listeners.forEach((fn) => fn(current));
}

// Initialize Firestore live listener if database is reachable
let isFirestoreSynced = false;
function initFirestoreSync() {
  if (isFirestoreSynced || typeof window === 'undefined') return;
  isFirestoreSynced = true;

  try {
    const relaysCol = collection(db, 'relays');
    onSnapshot(
      relaysCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteRelays: RelayExperience[] = [];
          snapshot.forEach((docSnap) => {
            remoteRelays.push(docSnap.data() as RelayExperience);
          });

          // Merge remote relays with stored relays
          const localRelays = getStoredRelays();
          const mergedMap = new Map<string, RelayExperience>();
          localRelays.forEach((r) => mergedMap.set(r.id, r));
          remoteRelays.forEach((r) => mergedMap.set(r.id, r));

          const mergedList = Array.from(mergedMap.values());
          saveStoredRelays(mergedList);
          notifyListeners();
        }
      },
      (err) => {
        console.warn('Firestore relays subscription offline, using local cache:', err);
      }
    );
  } catch (err) {
    console.warn('Firestore sync init error:', err);
  }
}

// Auto-trigger sync on load
if (typeof window !== 'undefined') {
  initFirestoreSync();
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

  /**
   * CREATE RELAY
   * The NFT owner enters:
   * - Relay title
   * - Question (e.g. "Would you create or change?")
   * - Description
   * - Optional image (or NFT artwork)
   * - Response options (e.g. ["CREATE", "CHANGE"])
   * Note: The owner does NOT transfer the NFT. They remain the sole owner.
   */
  async createRelay(params: {
    title: string;
    question: string;
    description: string;
    options: string[];
    nftImage: string;
    tokenId?: string;
    collection?: string;
    contractAddress?: string;
    chain?: string;
    initialDecisionText?: string;
    creator: {
      id: string;
      displayName: string;
      username: string;
      photoURL: string;
    };
  }): Promise<RelayExperience> {
    const relayId = `relay-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();
    const formattedDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const initialOptions =
      params.options && params.options.length >= 2
        ? params.options
        : ['CREATE', 'CHANGE'];

    const genesisStep: RelayStep = {
      step: 1,
      personName: params.creator.displayName,
      personHandle: `@${params.creator.username}`,
      avatar: params.creator.photoURL,
      userId: params.creator.id,
      action: initialOptions[0],
      decisionText:
        params.initialDecisionText?.trim() ||
        `Created Genesis Relay for ${params.title}. Opened shared story to the community.`,
      prediction: initialOptions[1] || initialOptions[0],
      timestamp: formattedDate,
      promptQuestion: params.question,
    };

    const newRelay: RelayExperience = {
      id: relayId,
      title: params.title.trim(),
      tokenId: params.tokenId?.trim() || '#1',
      nftImage: params.nftImage.trim(),
      collection: params.collection?.trim() || 'Genesis Artifact',
      contractAddress: params.contractAddress,
      chain: params.chain || 'Ethereum',
      creatorId: params.creator.id,
      creatorName: params.creator.displayName,
      creatorHandle: `@${params.creator.username}`,
      creatorAvatar: params.creator.photoURL,
      question: params.question.trim() || 'Would you create or change?',
      options: initialOptions,
      currentStage: 1,
      totalStages: 10,
      activeCuratorName: params.creator.displayName,
      activeCuratorHandle: `@${params.creator.username}`,
      participantsCount: 1,
      description: params.description.trim(),
      status: 'active',
      steps: [genesisStep],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Save to local cache
    const current = getStoredRelays();
    const updated = [newRelay, ...current];
    saveStoredRelays(updated);
    notifyListeners();

    // Persist to Firestore
    try {
      await setDoc(doc(db, 'relays', relayId), newRelay, { merge: true });
    } catch (e) {
      console.warn('Firestore offline fallback for relay creation:', e);
    }

    return newRelay;
  },

  /**
   * PARTICIPANT FLOW: Add Chapter
   * A participant answers the question, optionally predicts the next person's choice,
   * and appends a chapter to the visual timeline.
   */
  async addChapter(
    relayId: string,
    params: {
      answer: string;
      prediction?: string;
      decisionText?: string;
      participant: {
        id: string;
        displayName: string;
        username: string;
        photoURL: string;
      };
    }
  ): Promise<RelayStep | null> {
    const list = getStoredRelays();
    const relay = list.find((r) => r.id === relayId);
    if (!relay) return null;

    const formattedDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const nextStepNum = relay.steps.length + 1;
    const newStep: RelayStep = {
      step: nextStepNum,
      personName: params.participant.displayName,
      personHandle: `@${params.participant.username}`,
      avatar: params.participant.photoURL,
      userId: params.participant.id,
      action: params.answer,
      prediction: params.prediction,
      decisionText:
        params.decisionText?.trim() ||
        `Chose ${params.answer} and contributed chapter ${nextStepNum} to the shared artifact journey.`,
      timestamp: formattedDate,
      promptQuestion: relay.question,
    };

    relay.steps.push(newStep);
    relay.currentStage = nextStepNum;
    relay.participantsCount += 1;
    relay.activeCuratorName = params.participant.displayName;
    relay.activeCuratorHandle = `@${params.participant.username}`;
    relay.updatedAt = new Date().toISOString();

    saveStoredRelays(list);
    notifyListeners();

    // Persist to Firestore
    try {
      await setDoc(doc(db, 'relays', relayId), relay, { merge: true });
    } catch (e) {
      console.warn('Firestore offline fallback for chapter addition:', e);
    }

    // Trigger notification to relay creator
    if (relay.creatorId && relay.creatorId !== params.participant.id) {
      postService.createNotification({
        recipientId: relay.creatorId,
        actorId: params.participant.id,
        actorName: params.participant.displayName,
        actorUsername: params.participant.username,
        actorPhotoURL: params.participant.photoURL,
        type: 'relay_activity',
        relayId: relay.id,
        relayTitle: relay.title,
        text: `added chapter ${nextStepNum} (${params.answer}) to your NFT Relay "${relay.title}"`,
      });
    }

    return newStep;
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
      text: `invited you to co-create chapter ${relay.currentStage + 1} of "${relay.title}"`,
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
        r.question.toLowerCase().includes(q) ||
        r.activeCuratorName.toLowerCase().includes(q) ||
        r.activeCuratorHandle.toLowerCase().includes(q)
    );
  },
};
