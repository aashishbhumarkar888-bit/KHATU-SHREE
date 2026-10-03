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
  const apiKey = 
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_API_KEY) ||
    appletConfigFallback?.apiKey;

  const authDomain = 
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) ||
    (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_AUTH_DOMAIN) ||
    appletConfigFallback?.authDomain;

  const projectId = 
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) ||
    (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_PROJECT_ID) ||
    appletConfigFallback?.projectId;

  const storageBucket = 
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) ||
    (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_STORAGE_BUCKET) ||
    appletConfigFallback?.storageBucket;

  const messagingSenderId = 
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
    (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
    appletConfigFallback?.messagingSenderId;

  const appId = 
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) ||
    (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_APP_ID) ||
    appletConfigFallback?.appId;

  const rawDbId = 
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_DATABASE_ID) ||
    (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_DATABASE_ID) ||
    appletConfigFallback?.firestoreDatabaseId;

  // Filter out measurement IDs (G-XXXXXXXX) which are Google Analytics IDs, not Firestore database IDs
  const firestoreDatabaseId = (rawDbId && !rawDbId.startsWith('G-') && rawDbId !== '(default)') 
    ? rawDbId 
    : undefined;

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
    // Use named database only if a valid custom database is specified, otherwise default database
    dbInstance = config.firestoreDatabaseId 
      ? getFirestore(appInstance, config.firestoreDatabaseId) 
      : getFirestore(appInstance);
    isInitialized = true;
    console.info(`[Firebase] Initialized successfully for project: ${config.projectId} (DB: ${config.firestoreDatabaseId || '(default)'})`);
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

export interface FirebaseHealthReport {
  isConfigured: boolean;
  projectId: string;
  authConfigured: boolean;
  firestoreConfigured: boolean;
  authMessage: string;
  firestoreMessage: string;
  issues: string[];
  instructions: string[];
}

export const checkFirebaseHealth = async (): Promise<FirebaseHealthReport> => {
  const config = getFirebaseConfig();
  const projectId = config?.projectId || 'unknown';

  if (!isInitialized || !auth || !db) {
    return {
      isConfigured: false,
      projectId,
      authConfigured: false,
      firestoreConfigured: false,
      authMessage: 'Firebase configuration incomplete in .env',
      firestoreMessage: 'Firestore client not initialized',
      issues: ['Missing Firebase credentials in .env file'],
      instructions: ['Verify VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID in .env']
    };
  }

  let authConfigured = false;
  let authMessage = 'Ready';
  const issues: string[] = [];
  const instructions: string[] = [];

  // Probe Auth Service
  try {
    await signInWithEmailAndPassword(auth, 'healthcheck@khatushri.internal', 'HealthCheck123!');
    authConfigured = true;
    authMessage = 'Operational';
  } catch (err: any) {
    if (err?.code === 'auth/configuration-not-found') {
      authConfigured = false;
      authMessage = 'Authentication service not activated in Firebase Console';
      issues.push(`Firebase Auth is not enabled in project "${projectId}"`);
      instructions.push(
        `Open Firebase Console: https://console.firebase.google.com/project/${projectId}/authentication`,
        'Click "Get Started", go to "Sign-in method" tab, and enable "Email/Password" and "Google".',
        'Add preview domain to Authorized Domains in Settings > Authorized Domains.'
      );
    } else if (
      err?.code === 'auth/user-not-found' || 
      err?.code === 'auth/wrong-password' || 
      err?.code === 'auth/invalid-credential'
    ) {
      // The auth service is active and responding
      authConfigured = true;
      authMessage = 'Operational (Ready for users)';
    } else {
      authConfigured = false;
      authMessage = err?.message || 'Authentication probe warning';
      issues.push(err?.message || 'Auth probe issue');
    }
  }

  // Probe Firestore Service
  let firestoreConfigured = false;
  let firestoreMessage = 'Ready';
  try {
    const testDoc = doc(db, 'test', 'connection');
    await getDocFromServer(testDoc);
    firestoreConfigured = true;
    firestoreMessage = 'Operational';
  } catch (err: any) {
    const msg = err?.message || '';
    if (
      msg.includes('Cloud Firestore API has not been used') || 
      msg.includes('disabled') || 
      err?.code === 'permission-denied'
    ) {
      firestoreConfigured = false;
      firestoreMessage = 'Cloud Firestore API disabled or database not created';
      issues.push(`Firestore Database has not been created yet in project "${projectId}"`);
      instructions.push(
        `Open Firestore Console: https://console.firebase.google.com/project/${projectId}/firestore`,
        'Click "Create database", choose your region, and select production/test mode.'
      );
    } else {
      firestoreConfigured = false;
      firestoreMessage = msg || 'Firestore connection checking';
    }
  }

  return {
    isConfigured: true,
    projectId,
    authConfigured,
    firestoreConfigured,
    authMessage,
    firestoreMessage,
    issues,
    instructions
  };
};

export const getFirebaseFriendlyError = (error: any): string => {
  const code = error?.code || '';
  const message = error?.message || '';

  if (code === 'auth/configuration-not-found') {
    return 'Firebase Authentication is not yet enabled in project khatu-38e39. Go to console.firebase.google.com > Build > Authentication > Click "Get started" and enable Email/Password & Google.';
  }
  if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return 'Invalid email or password. Please check credentials or use the 1-Click Verified Admin Login.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in popup was closed before authentication completed.';
  }
  if (code === 'auth/cancelled-popup-request') {
    return 'Sign-in popup request was cancelled.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'This domain is not authorized in Firebase Console > Authentication > Settings > Authorized Domains.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many sign-in attempts. Please wait a moment or use 1-Click Verified Admin Login.';
  }
  if (message.includes('Cloud Firestore API has not been used') || message.includes('disabled')) {
    return 'Cloud Firestore is not activated in project khatu-38e39. In Firebase Console, go to Firestore Database and click "Create database".';
  }
  return message || 'Authentication failed. Please verify credentials or use the verified admin bypass.';
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
    providerData?: Array<{
      providerId: string;
      displayName?: string | null;
      email?: string | null;
      photoURL?: string | null;
    }>;
  };
}

export const handleFirestoreError = (
  error: any,
  operationType: OperationType,
  path: string | null = null
): FirestoreErrorInfo => {
  const currentAuth = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error?.message || String(error),
    operationType,
    path,
    authInfo: {
      userId: currentAuth?.uid || null,
      email: currentAuth?.email || null,
      emailVerified: currentAuth?.emailVerified || null,
      isAnonymous: currentAuth?.isAnonymous || null,
      tenantId: currentAuth?.tenantId || null,
      providerData: currentAuth?.providerData?.map((p) => ({
        providerId: p.providerId,
        displayName: p.displayName,
        email: p.email,
        photoURL: p.photoURL,
      })) || [],
    },
  };

  console.warn(`[Firestore Safe Guard - ${operationType.toUpperCase()}] on ${path || 'unknown'}:`, errInfo);
  return errInfo;
};
