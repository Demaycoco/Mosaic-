import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  doc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
  firestoreDatabaseId: import.meta.env?.VITE_FIREBASE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId,
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.addScope('openid');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Firestore with robust long-polling settings for proxy/iframe/Cloud Run environments
function initFirestoreInstance(): Firestore {
  try {
    if (firebaseConfig.firestoreDatabaseId) {
      return initializeFirestore(
        app,
        {
          experimentalForceLongPolling: true,
        },
        firebaseConfig.firestoreDatabaseId
      );
    }
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  } catch {
    // If already initialized, retrieve existing instance
    return firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
  }
}

export const db: Firestore = initFirestoreInstance();

// Connection verification test with resilient fallback
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (
      error?.code === 'unavailable' ||
      (error instanceof Error &&
        (error.message.includes('the client is offline') ||
          error.message.includes('unavailable') ||
          error.message.includes('Could not reach Cloud Firestore')))
    ) {
      console.warn('Firestore client operates in offline-first mode until connection is confirmed.');
    }
  }
}

// Test connection without blocking initialization
testFirestoreConnection();

