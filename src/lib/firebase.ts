import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signInAnonymously,
  signOut as fbSignOut,
  Auth
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore';
import appletConfigFallback from '../../firebase-applet-config.json';

// Read Firebase configuration from environment variables (Never hardcoded) with fallback to project config
const getFirebaseConfig = () => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || appletConfigFallback?.apiKey;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appletConfigFallback?.authDomain;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || appletConfigFallback?.projectId;
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || appletConfigFallback?.storageBucket;
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfigFallback?.messagingSenderId;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID || appletConfigFallback?.appId;
  const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || appletConfigFallback?.firestoreDatabaseId || 'khatu-store';

  if (!apiKey || !projectId || !appId) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    firestoreDatabaseId
  };
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let isInitialized = false;
let initErrorMessage: string | null = null;

try {
  const config = getFirebaseConfig();
  if (config) {
    appInstance = !getApps().length ? initializeApp(config) : getApp();
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance, config.firestoreDatabaseId);
    isInitialized = true;
    console.info(`[Firebase] Initialized successfully for project: ${config.projectId} (DB: ${config.firestoreDatabaseId})`);
  } else {
    initErrorMessage = 'Firebase environment variables are missing or incomplete. Using local storage mode.';
    console.info('[Firebase Adapter]', initErrorMessage);
  }
} catch (error: any) {
  isInitialized = false;
  initErrorMessage = error?.message || 'Failed to initialize Firebase SDK.';
  console.warn('[Firebase Adapter Initialization Failure]', initErrorMessage);
}

export const isFirebaseInitialized = isInitialized;
export const firebaseInitError = initErrorMessage;
export const auth = authInstance as Auth;
export const db = dbInstance as Firestore;

export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly'
];

export const googleProvider = new GoogleAuthProvider();
SCOPES.forEach((scope) => {
  googleProvider.addScope(scope);
});

// In-memory access token cache for Google Workspace & Drive integration
let cachedAccessToken: string | null = null;

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export { 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signInAnonymously,
  fbSignOut 
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testConnection(): Promise<boolean> {
  if (!isFirebaseInitialized || !db) return false;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore: client appears offline or connecting.");
    }
    return false;
  }
}

if (isFirebaseInitialized) {
  testConnection();
}
