import { MosaicUser } from '../types';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { postService } from './postService';
import { getFixedProfileOverride, setFixedProfileOverride } from '../utils/imageUtils';

export { getFixedProfileOverride, setFixedProfileOverride };

const SESSION_STORAGE_KEY = 'mosaic_auth_user_session';
const PROFILES_STORAGE_KEY = 'mosaic_registered_profiles';


export function sanitizeUsername(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 24);
}

export function generateInitialUsername(email?: string | null, name?: string | null): string {
  if (name) {
    const cleaned = sanitizeUsername(name);
    if (cleaned.length >= 3) return cleaned;
  }
  if (email) {
    const part = email.split('@')[0];
    const cleaned = sanitizeUsername(part);
    if (cleaned.length >= 3) return cleaned;
  }
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `creator_${randomSuffix}`;
}

/**
 * Transforms Firebase Auth error codes into human-readable, actionable error messages.
 */
export function formatAuthError(err: any): { message: string; code: string } {
  if (!err) {
    return { message: 'Authentication failed. Please try again.', code: 'unknown' };
  }
  const code = err.code || 'unknown';
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'current domain';

  switch (code) {
    case 'auth/popup-closed-by-user':
      return {
        message: 'Sign-in was cancelled. The Google popup was closed before completion.',
        code,
      };
    case 'auth/popup-blocked':
      return {
        message: 'The sign-in popup was blocked by your browser. Please allow popups or use redirect sign-in.',
        code,
      };
    case 'auth/unauthorized-domain':
      return {
        message: `This domain ("${currentHostname}") is not authorized for OAuth in your Firebase project. Please add "${currentHostname}" to Firebase Console -> Authentication -> Settings -> Authorized domains.`,
        code,
      };
    case 'auth/operation-not-allowed':
      return {
        message: 'Google sign-in is not enabled in your Firebase project. Please enable "Google" under Authentication -> Sign-in method in Firebase Console.',
        code,
      };
    case 'auth/cancelled-popup-request':
      return {
        message: 'The popup sign-in request was replaced by another request.',
        code,
      };
    case 'auth/account-exists-with-different-credential':
      return {
        message: 'An account already exists with this email address using a different sign-in method.',
        code,
      };
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return {
        message: 'Invalid email or password. Please verify your credentials.',
        code,
      };
    case 'auth/email-already-in-use':
      return {
        message: 'An account with this email address already exists. Please sign in instead.',
        code,
      };
    case 'auth/weak-password':
      return {
        message: 'Password is too weak. Please use at least 6 characters.',
        code,
      };
    case 'auth/invalid-email':
      return {
        message: 'Please enter a valid email address.',
        code,
      };
    case 'auth/network-request-failed':
      return {
        message: 'Network request failed. Please check your internet connection.',
        code,
      };
    case 'auth/user-disabled':
      return {
        message: 'This user account has been disabled by an administrator.',
        code,
      };
    default:
      return {
        message: err.message || 'Authentication error occurred. Please try again.',
        code,
      };
  }
}

// In-memory listeners for onAuthStateChanged
type AuthListener = (user: MosaicUser | null) => void;
const listeners: Set<AuthListener> = new Set();
let cachedCurrentUser: MosaicUser | null = null;

// Read from local persistent storage on startup
function loadStoredSession(): MosaicUser | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const parsed: MosaicUser = JSON.parse(raw);
      if (parsed && parsed.id) {
        // Enforce fixed profile override for photoURL and bannerURL
        const fixed = getFixedProfileOverride(parsed.id);
        if (fixed) {
          return {
            ...parsed,
            photoURL: fixed.photoURL || parsed.photoURL,
            bannerURL: fixed.bannerURL !== undefined ? fixed.bannerURL : parsed.bannerURL,
            displayName: fixed.displayName || parsed.displayName,
            username: fixed.username || parsed.username,
            bio: fixed.bio !== undefined ? fixed.bio : parsed.bio,
          };
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse cached Mosaic session', err);
  }
  return null;
}

cachedCurrentUser = loadStoredSession();

function saveStoredSession(user: MosaicUser | null) {
  cachedCurrentUser = user;

  if (user) {
    // 1. Always lock into fixed override key
    setFixedProfileOverride(user.id, {
      photoURL: user.photoURL,
      bannerURL: user.bannerURL,
      displayName: user.displayName,
      username: user.username,
      bio: user.bio,
    });

    // 2. Save active user session
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Warning saving session storage:', e);
    }

    // 3. Save lightweight registry for user discovery (strip bulky banner data to protect localStorage quota)
    try {
      const rawProfiles = localStorage.getItem(PROFILES_STORAGE_KEY);
      const registry = rawProfiles ? JSON.parse(rawProfiles) : {};
      registry[user.id] = {
        id: user.id,
        displayName: user.displayName,
        username: user.username,
        photoURL: user.photoURL,
        bio: user.bio,
        accountType: user.accountType,
      };
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(registry));
    } catch (err) {
      console.warn('Failed to store profiles registry in localStorage', err);
    }
  } else {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {}
  }

  // Notify all listeners
  listeners.forEach((listener) => {
    try {
      listener(user);
    } catch (e) {
      console.error('Error in onAuthStateChanged listener', e);
    }
  });
}

// Try syncing with Firestore if reachable
async function syncToFirestore(user: MosaicUser): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, user, { merge: true });
  } catch (err) {
    // Graceful offline fallback
    console.warn('Firestore sync note:', err);
  }
}

/**
 * Creates or retrieves user profile from Firestore / cache for a Firebase User
 */
async function buildUserProfile(fbUser: FirebaseUser): Promise<{ user: MosaicUser; isNewUser: boolean }> {
  let isNewUser = false;
  let mosaicUser: MosaicUser;

  // Check in-memory cached session, local storage, and fixed profile overrides
  const activeUser = cachedCurrentUser || loadStoredSession();
  const hasMatch = Boolean(activeUser && activeUser.id === fbUser.uid);
  const fixedOverride = getFixedProfileOverride(fbUser.uid);

  try {
    const snap = await getDoc(doc(db, 'users', fbUser.uid));
    if (snap.exists()) {
      const data = snap.data() as MosaicUser;
      mosaicUser = {
        ...data,
        email: fbUser.email || data.email,
        displayName: fixedOverride?.displayName || (hasMatch && activeUser?.displayName) || data.displayName || fbUser.displayName || 'Mosaic Creator',
        username: fixedOverride?.username || (hasMatch && activeUser?.username) || data.username || generateInitialUsername(fbUser.email, fbUser.displayName),
        photoURL: fixedOverride?.photoURL || (hasMatch && activeUser?.photoURL) || data.photoURL || fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bannerURL: fixedOverride?.bannerURL !== undefined ? fixedOverride.bannerURL : ((hasMatch && activeUser?.bannerURL !== undefined ? activeUser.bannerURL : data.bannerURL) || ''),
        bio: fixedOverride?.bio !== undefined ? fixedOverride.bio : ((hasMatch && activeUser?.bio !== undefined ? activeUser.bio : data.bio) ?? ''),
        xLink: (hasMatch && activeUser?.xLink !== undefined ? activeUser.xLink : data.xLink) ?? '',
        instagramLink: (hasMatch && activeUser?.instagramLink !== undefined ? activeUser.instagramLink : data.instagramLink) ?? '',
        tiktokLink: (hasMatch && activeUser?.tiktokLink !== undefined ? activeUser.tiktokLink : data.tiktokLink) ?? '',
        website: (hasMatch && activeUser?.website !== undefined ? activeUser.website : data.website) ?? '',
        nftCommunities: (hasMatch && activeUser?.nftCommunities ? activeUser.nftCommunities : data.nftCommunities) || [],
        linkedWalletAddress: (hasMatch && activeUser?.linkedWalletAddress) || data.linkedWalletAddress,
        walletVerified: (hasMatch && activeUser?.walletVerified) || data.walletVerified,
        updatedAt: new Date().toISOString(),
      };
      await syncToFirestore(mosaicUser);
    } else {
      isNewUser = true;
      const initialUsername = fixedOverride?.username || (hasMatch && activeUser?.username) || generateInitialUsername(fbUser.email, fbUser.displayName);
      mosaicUser = {
        id: fbUser.uid,
        email: fbUser.email || '',
        displayName: fixedOverride?.displayName || (hasMatch && activeUser?.displayName) || fbUser.displayName || fbUser.email?.split('@')[0] || 'Mosaic Creator',
        username: initialUsername,
        photoURL:
          fixedOverride?.photoURL ||
          (hasMatch && activeUser?.photoURL) ||
          fbUser.photoURL ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bannerURL: fixedOverride?.bannerURL !== undefined ? fixedOverride.bannerURL : (hasMatch && activeUser?.bannerURL ? activeUser.bannerURL : ''),
        bio: fixedOverride?.bio !== undefined ? fixedOverride.bio : (hasMatch && activeUser?.bio ? activeUser.bio : ''),
        xLink: hasMatch && activeUser?.xLink ? activeUser.xLink : '',
        instagramLink: hasMatch && activeUser?.instagramLink ? activeUser.instagramLink : '',
        tiktokLink: hasMatch && activeUser?.tiktokLink ? activeUser.tiktokLink : '',
        website: hasMatch && activeUser?.website ? activeUser.website : '',
        nftCommunities: hasMatch && activeUser?.nftCommunities ? activeUser.nftCommunities : [],
        linkedWalletAddress: hasMatch ? activeUser?.linkedWalletAddress : undefined,
        walletVerified: hasMatch ? activeUser?.walletVerified : undefined,
        accountType: 'user',
        createdAt: hasMatch && activeUser?.createdAt ? activeUser.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profileCompleted: false,
      };
      await syncToFirestore(mosaicUser);
    }
  } catch (dbErr) {
    // Offline or network error fallback: Preserve existing session completely!
    if (hasMatch && activeUser) {
      mosaicUser = {
        ...activeUser,
        email: fbUser.email || activeUser.email,
        updatedAt: new Date().toISOString(),
      };
    } else {
      const initialUsername = generateInitialUsername(fbUser.email, fbUser.displayName);
      mosaicUser = {
        id: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || 'Mosaic Creator',
        username: initialUsername,
        photoURL:
          fbUser.photoURL ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bannerURL: '',
        bio: '',
        accountType: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profileCompleted: false,
      };
    }
  }

  saveStoredSession(mosaicUser);
  return { user: mosaicUser, isNewUser };
}

// Background Firebase Auth Listener to sync sessions
try {
  firebaseOnAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      try {
        const { user } = await buildUserProfile(fbUser);
        saveStoredSession(user);
      } catch (err) {
        console.warn('Failed to sync auth state user', err);
      }
    } else {
      // User is logged out in Firebase
      if (cachedCurrentUser) {
        saveStoredSession(null);
      }
    }
  });
} catch (err) {
  console.warn('Firebase onAuthStateChanged init note', err);
}

/**
 * Core Authentication Service Abstraction
 */
export const authService = {
  /**
   * Retrieves the current user synchronously from session cache
   */
  getCurrentUser(): MosaicUser | null {
    if (cachedCurrentUser) return cachedCurrentUser;
    return loadStoredSession();
  },

  /**
   * Subscribes to auth state changes across the application
   */
  onAuthStateChanged(callback: AuthListener): () => void {
    listeners.add(callback);
    // Immediately emit current state
    callback(this.getCurrentUser());
    return () => {
      listeners.delete(callback);
    };
  },

  /**
   * Signs in using Google via the official Firebase Google popup flow.
   * Throws formatted error if user cancels, popup is blocked, domain unauthorized, etc.
   * Never fabricates fake credentials.
   */
  async signInWithGoogle(): Promise<{ user: MosaicUser; isNewUser: boolean }> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return await buildUserProfile(result.user);
    } catch (firebaseErr: any) {
      const formatted = formatAuthError(firebaseErr);
      const error = new Error(formatted.message);
      (error as any).code = formatted.code;
      (error as any).originalError = firebaseErr;
      throw error;
    }
  },

  /**
   * Signs in using Google via the official Firebase redirect flow.
   * Useful when popup windows are blocked or disallowed in the environment.
   */
  async signInWithGoogleRedirect(): Promise<void> {
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (firebaseErr: any) {
      const formatted = formatAuthError(firebaseErr);
      const error = new Error(formatted.message);
      (error as any).code = formatted.code;
      throw error;
    }
  },

  /**
   * Resolves redirect auth result if the user is returning from a redirect flow.
   */
  async checkRedirectResult(): Promise<MosaicUser | null> {
    try {
      const result = await getRedirectResult(auth);
      if (result && result.user) {
        const { user } = await buildUserProfile(result.user);
        return user;
      }
    } catch (err: any) {
      const formatted = formatAuthError(err);
      console.warn('Firebase redirect result note:', formatted.message);
      throw new Error(formatted.message);
    }
    return null;
  },

  /**
   * Signs in using email and password
   */
  async signInWithEmail(email: string, password: string): Promise<MosaicUser> {
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      const { user } = await buildUserProfile(result.user);
      return user;
    } catch (err: any) {
      const formatted = formatAuthError(err);
      const error = new Error(formatted.message);
      (error as any).code = formatted.code;
      throw error;
    }
  },

  /**
   * Creates a new account using email and password
   */
  async signUpWithEmail(email: string, password: string, displayName?: string): Promise<MosaicUser> {
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const fbUser = result.user;
      const cleanName = displayName?.trim() || email.split('@')[0];
      const initialUsername = generateInitialUsername(email, cleanName);

      const newUser: MosaicUser = {
        id: fbUser.uid,
        email: fbUser.email || email.trim(),
        displayName: cleanName,
        username: initialUsername,
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bio: '',
        accountType: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profileCompleted: false,
      };

      await syncToFirestore(newUser);
      saveStoredSession(newUser);
      return newUser;
    } catch (err: any) {
      const formatted = formatAuthError(err);
      const error = new Error(formatted.message);
      (error as any).code = formatted.code;
      throw error;
    }
  },

  /**
   * Signs out the current user and clears persistent session
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase signOut notice:', e);
    }
    saveStoredSession(null);
  },

  /**
   * Updates the authenticated user's profile
   */
  async updateUserProfile(
    updates: Partial<Omit<MosaicUser, 'id' | 'email' | 'createdAt'>>
  ): Promise<MosaicUser> {
    const current = this.getCurrentUser();
    if (!current) throw new Error('No user is currently authenticated.');

    const updated: MosaicUser = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    saveStoredSession(updated);

    // Synchronize user's new PFP and name across their posts immediately
    try {
      postService.updateAuthorProfile(current.id, {
        photoURL: updated.photoURL,
        displayName: updated.displayName,
        username: updated.username,
      });
    } catch (e) {
      console.warn('Note updating author posts:', e);
    }

    await syncToFirestore(updated);
    return updated;
  },

  /**
   * Links a verified Web3 wallet address to the user's social identity
   */
  async linkWalletToAccount(walletAddress: string, verified = false): Promise<MosaicUser> {
    const current = this.getCurrentUser();
    if (!current) throw new Error('No user is currently authenticated.');
    return await this.updateUserProfile({
      linkedWalletAddress: walletAddress.toLowerCase(),
      walletVerified: verified,
    });
  },
};
