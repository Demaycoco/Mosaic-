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

export const INITIAL_RELAYS: RelayExperience[] = [];

const MOCK_RELAY_IDS = new Set([
  "relay-1847",
  "relay-ape",
  "relay-astral",
]);

function isMockRelay(r: any): boolean {
  if (!r || !r.id) return true;
  if (MOCK_RELAY_IDS.has(r.id)) return true;
  if (typeof r.id === "string" && (r.id.startsWith("relay-seed-") || r.id.includes("seed"))) return true;
  if (["@sarahj", "@vance", "@alexchen", "@priyanair", "@mosaic"].includes(r.creatorHandle)) return true;
  return false;
}

function getStoredRelays(): RelayExperience[] {
  try {
    const raw = localStorage.getItem(RELAYS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const authentic = parsed.filter((r) => !isMockRelay(r));
        if (authentic.length !== parsed.length) {
          localStorage.setItem(RELAYS_STORAGE_KEY, JSON.stringify(authentic));
        }
        return authentic;
      }
    }
  } catch (e) {
    console.warn("Error reading Relays storage", e);
  }
  return [];
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

  getActiveRelay(): RelayExperience | null {
    return getStoredRelays()[0] || null;
  },

  getRelayById(id: string): RelayExperience | undefined {
    return getStoredRelays().find((r) => r.id === id);
  },

  getRelaySteps(relayId?: string): RelayStep[] {
    const relay = relayId ? this.getRelayById(relayId) : getStoredRelays()[0];
    return relay ? relay.steps : [];
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
