import { NftProjectAccount } from '../types';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const PROJECTS_STORAGE_KEY = 'mosaic_nft_projects_cache';
const PROJECT_FOLLOWS_KEY = 'mosaic_project_follows_cache';

export const INITIAL_PROJECTS: NftProjectAccount[] = [];

const MOCK_PROJECT_IDS = new Set([
  'proj-chog',
  'proj-chromatic',
  'proj-nomads',
]);

const MOCK_CREATOR_IDS = new Set([
  'creator-sarah',
  'creator-alex',
  'creator-vance',
  'creator-priya',
  'creator-mosaic',
]);

function isMockProject(p: any): boolean {
  if (!p || !p.id) return true;
  if (MOCK_PROJECT_IDS.has(p.id)) return true;
  if (p.id.startsWith('proj-seed-') || p.id.includes('seed')) return true;
  if (MOCK_CREATOR_IDS.has(p.ownerId)) return true;
  return false;
}

function getStoredProjects(): NftProjectAccount[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Sanitize any stale mock data from legacy browser storage
        const authentic = parsed.filter((p) => !isMockProject(p));
        if (authentic.length !== parsed.length) {
          localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(authentic));
        }
        return authentic;
      }
    }
  } catch (e) {
    console.warn('Projects cache parse error', e);
  }
  return [];
}

function saveStoredProjects(projects: NftProjectAccount[]) {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.warn('Failed to save projects to localStorage', e);
  }
}

type ProjectsListener = (projects: NftProjectAccount[]) => void;
const projectListeners: Set<ProjectsListener> = new Set();

function notifyListeners() {
  const current = getStoredProjects();
  projectListeners.forEach((fn) => {
    try {
      fn(current);
    } catch (e) {
      console.error(e);
    }
  });
}

export const projectService = {
  subscribe(callback: ProjectsListener): () => void {
    projectListeners.add(callback);
    callback(getStoredProjects());
    return () => {
      projectListeners.delete(callback);
    };
  },

  getAllProjects(): NftProjectAccount[] {
    return getStoredProjects();
  },

  getProjectByUsername(username: string): NftProjectAccount | undefined {
    const list = getStoredProjects();
    const clean = username.toLowerCase().replace('@', '');
    return list.find((p) => p.username.toLowerCase() === clean);
  },

  getProjectsByOwner(ownerId: string): NftProjectAccount[] {
    const list = getStoredProjects();
    return list.filter((p) => p.ownerId === ownerId);
  },

  async createProject(params: {
    name: string;
    username: string;
    logo: string;
    banner: string;
    description: string;
    website?: string;
    xLink?: string;
    communityLink?: string;
    category: string;
    ownerId: string;
    collectionName?: string;
    contractAddress?: string;
  }): Promise<NftProjectAccount> {
    const cleanHandle = params.username.toLowerCase().replace(/[^a-z0-9_]/g, '');

    const newProject: NftProjectAccount = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: params.name.trim(),
      username: cleanHandle,
      logo: params.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
      banner: params.banner || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
      description: params.description.trim(),
      website: params.website?.trim(),
      xLink: params.xLink?.trim(),
      communityLink: params.communityLink?.trim(),
      category: params.category || 'Generative & Lore',
      ownerId: params.ownerId,
      followersCount: 0,
      collection: params.collectionName
        ? {
            name: params.collectionName.trim(),
            contractAddress: params.contractAddress?.trim() || undefined,
            verificationStatus: 'unverified',
            featuredNftImage: params.logo,
          }
        : undefined,
      relaysCount: 0,
      createdAt: new Date().toISOString(),
    };

    const current = getStoredProjects();
    const updated = [newProject, ...current];
    saveStoredProjects(updated);
    notifyListeners();

    try {
      await setDoc(doc(db, 'projects', newProject.id), newProject, { merge: true });
    } catch (e) {
      // offline fallback
    }

    return newProject;
  },

  getFollowedProjectIds(userId: string): string[] {
    try {
      const raw = localStorage.getItem(`${PROJECT_FOLLOWS_KEY}_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  toggleFollowProject(projectId: string, userId: string): boolean {
    const list = getStoredProjects();
    const project = list.find((p) => p.id === projectId);
    if (!project) return false;

    const followed = this.getFollowedProjectIds(userId);
    const isFollowed = followed.includes(projectId);
    let updatedFollows: string[];

    if (isFollowed) {
      updatedFollows = followed.filter((id) => id !== projectId);
      project.followersCount = Math.max(0, project.followersCount - 1);
    } else {
      updatedFollows = [...followed, projectId];
      project.followersCount += 1;
    }

    try {
      localStorage.setItem(`${PROJECT_FOLLOWS_KEY}_${userId}`, JSON.stringify(updatedFollows));
    } catch {}

    saveStoredProjects(list);
    notifyListeners();
    return !isFollowed;
  },

  searchProjects(term: string): NftProjectAccount[] {
    const q = term.toLowerCase().trim().replace(/^@/, '');
    if (!q) return [];
    return getStoredProjects().filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.collection?.name && p.collection.name.toLowerCase().includes(q))
    );
  },

  async updateCollectionVerification(
    projectId: string,
    status: 'unverified' | 'pending' | 'verified',
    contractAddress?: string,
    itemsCount?: number
  ): Promise<NftProjectAccount | null> {
    const list = getStoredProjects();
    const proj = list.find((p) => p.id === projectId);
    if (!proj) return null;

    if (!proj.collection) {
      proj.collection = {
        name: `${proj.name} Collection`,
        verificationStatus: status,
        contractAddress,
        itemsCount,
      };
    } else {
      proj.collection.verificationStatus = status;
      if (contractAddress) proj.collection.contractAddress = contractAddress;
      if (itemsCount !== undefined) proj.collection.itemsCount = itemsCount;
    }

    saveStoredProjects(list);
    notifyListeners();

    try {
      await setDoc(doc(db, 'projects', proj.id), proj, { merge: true });
    } catch {}

    return proj;
  },
};
