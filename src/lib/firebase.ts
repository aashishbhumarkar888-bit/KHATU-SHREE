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
import { getStorage, FirebaseStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import appletConfigFallback from '../../firebase-applet-config.json';

/**
 * Parses user input for Firebase config. Accepts JSON or JavaScript config snippets.
 */
export function parseFirebaseConfigInput(input: string): Record<string, string> | null {
  if (!input || !input.trim()) return null;
  const str = input.trim();

  // Try raw JSON parse first
  try {
    const obj = JSON.parse(str);
    if (typeof obj === 'object' && obj !== null) return obj;
  } catch (_) {}

  // Try relaxed JSON parse
  try {
    const jsonMatch = str.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const relaxed = jsonMatch[0]
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
        .replace(/'/g, '"')
        .replace(/,\s*\}/g, '}');
      const obj = JSON.parse(relaxed);
      if (typeof obj === 'object' && obj !== null) return obj;
    }
  } catch (_) {}

  // Key-value regex extraction for standard Firebase snippet
  const result: Record<string, string> = {};
  const apiKeyMatch = str.match(/apiKey["']?\s*:\s*["']([^"']+)["']/i);
  const authDomainMatch = str.match(/authDomain["']?\s*:\s*["']([^"']+)["']/i);
  const projectIdMatch = str.match(/projectId["']?\s*:\s*["']([^"']+)["']/i);
  const storageBucketMatch = str.match(/storageBucket["']?\s*:\s*["']([^"']+)["']/i);
  const messagingSenderIdMatch = str.match(/messagingSenderId["']?\s*:\s*["']([^"']+)["']/i);
  const appIdMatch = str.match(/appId["']?\s*:\s*["']([^"']+)["']/i);

  if (apiKeyMatch) result.apiKey = apiKeyMatch[1];
  if (authDomainMatch) result.authDomain = authDomainMatch[1];
  if (projectIdMatch) result.projectId = projectIdMatch[1];
  if (storageBucketMatch) result.storageBucket = storageBucketMatch[1];
  if (messagingSenderIdMatch) result.messagingSenderId = messagingSenderIdMatch[1];
  if (appIdMatch) result.appId = appIdMatch[1];

  if (result.apiKey || result.projectId) {
    return result;
  }

  // If user passed just the API key
  if (str.startsWith('AIzaSy') && str.length > 25) {
    return { apiKey: str };
  }

  return null;
}

export function saveFirebaseCustomConfig(configOrSnippet: string | Record<string, string>): boolean {
  if (typeof window === 'undefined') return false;
  let parsed: Record<string, string> | null = null;
  if (typeof configOrSnippet === 'string') {
    parsed = parseFirebaseConfigInput(configOrSnippet);
  } else {
    parsed = configOrSnippet;
  }

  if (!parsed) return false;

  const existingRaw = window.localStorage?.getItem('ksp_custom_firebase_config');
  let merged: Record<string, string> = {};
  if (existingRaw) {
    try {
      merged = JSON.parse(existingRaw);
    } catch (_) {}
  }
  merged = { ...merged, ...parsed };

  window.localStorage?.setItem('ksp_custom_firebase_config', JSON.stringify(merged));
  if (parsed.apiKey) {
    window.localStorage?.setItem('ksp_custom_firebase_api_key', parsed.apiKey);
  }
  return true;
}

export function clearCustomFirebaseConfig(): void {
  if (typeof window === 'undefined') return;
  window.localStorage?.removeItem('ksp_custom_firebase_config');
  window.localStorage?.removeItem('ksp_custom_firebase_api_key');
}

// Read Firebase configuration from environment variables with optional local override
const getFirebaseConfig = () => {
  let customConfig: Record<string, any> | null = null;
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage?.getItem('ksp_custom_firebase_config');
      if (raw) customConfig = JSON.parse(raw);
    } catch (_) {}
  }
  const customKey = (typeof window !== 'undefined' && window.localStorage?.getItem('ksp_custom_firebase_api_key')) || null;

  const apiKey = 
    customConfig?.apiKey ||
    customKey ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_API_KEY) ||
    appletConfigFallback?.apiKey;

  const authDomain = 
    customConfig?.authDomain ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) ||
    (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_AUTH_DOMAIN) ||
    appletConfigFallback?.authDomain;

  const projectId = 
    customConfig?.projectId ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) ||
    (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_PROJECT_ID) ||
    appletConfigFallback?.projectId;

  const storageBucket = 
    customConfig?.storageBucket ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) ||
    (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_STORAGE_BUCKET) ||
    appletConfigFallback?.storageBucket;

  const messagingSenderId = 
    customConfig?.messagingSenderId ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
    (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
    appletConfigFallback?.messagingSenderId;

  const appId = 
    customConfig?.appId ||
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
let storageInstance: FirebaseStorage | null = null;
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
    
    // Initialize Cloud Storage for Firebase if bucket is present
    if (config.storageBucket) {
      try {
        storageInstance = getStorage(appInstance);
      } catch (storageErr) {
        console.warn('[Firebase Storage Init Warning]', storageErr);
      }
    }

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
export const storage = storageInstance as FirebaseStorage;
export { storageRef, uploadBytes, getDownloadURL, deleteObject };

// Validate Connection to Firestore safely without raising console errors
export async function testConnection(): Promise<boolean> {
  if (!isInitialized || !dbInstance) return false;
  try {
    await getDocFromServer(doc(dbInstance, 'test', 'connection'));
    console.info('[Firebase] Firestore connected successfully');
    return true;
  } catch (error) {
    // Standby or local persistence mode active, do not emit blocking console.error
    console.info('[Firebase] Local persistence and standby mode active.');
    return false;
  }
}

if (typeof window !== 'undefined') {
  testConnection().catch(() => {});
}

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
  storageConfigured: boolean;
  storageBucket: string;
  authMessage: string;
  firestoreMessage: string;
  storageMessage: string;
  issues: string[];
  instructions: string[];
}

export const checkFirebaseHealth = async (): Promise<FirebaseHealthReport> => {
  const config = getFirebaseConfig();
  const projectId = config?.projectId || 'unknown';
  const bucketName = config?.storageBucket || '';

  if (!isInitialized || !auth || !db) {
    return {
      isConfigured: false,
      projectId,
      authConfigured: false,
      firestoreConfigured: false,
      storageConfigured: false,
      storageBucket: bucketName,
      authMessage: 'Firebase configuration incomplete in .env',
      firestoreMessage: 'Firestore client not initialized',
      storageMessage: 'Storage client not initialized',
      issues: ['Missing Firebase credentials in .env file or local storage'],
      instructions: ['Verify VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID in .env or paste your new configuration.']
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
    if (
      err?.code === 'auth/api-key-not-valid' || 
      err?.code?.includes('api-key-not-valid') || 
      err?.message?.includes('api-key-not-valid') ||
      err?.message?.includes('API key not valid')
    ) {
      authConfigured = false;
      authMessage = 'Firebase Web API Key is not valid or project was deleted';
      issues.push(`API key was deleted or rejected for project "${projectId}"`);
      instructions.push(
        `If you created a new Firebase project, copy the "firebaseConfig" snippet and paste it below.`,
        `Or open Firebase Console (https://console.firebase.google.com/project/${projectId}/settings/general) and verify the API key.`,
        `Use 1-Click Instant Admin Access to manage your store without delays.`
      );
    } else if (err?.code === 'auth/configuration-not-found') {
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

  // Probe Cloud Storage
  let storageConfigured = false;
  let storageMessage = 'Not Configured';
  if (storage && bucketName) {
    try {
      const testRef = storageRef(storage, `__probe/ping-${Date.now()}.txt`);
      const blob = new Blob(['probe'], { type: 'text/plain' });
      await uploadBytes(testRef, blob);
      storageConfigured = true;
      storageMessage = `Active & Writable (${bucketName})`;
      try {
        await deleteObject(testRef);
      } catch (_) {}
    } catch (stErr: any) {
      if (stErr?.code === 'storage/unauthorized') {
        storageConfigured = true;
        storageMessage = `Bucket online (${bucketName}), check security rules`;
      } else {
        storageConfigured = false;
        storageMessage = stErr?.message || `Storage bucket "${bucketName}" not found or offline`;
        issues.push(`Cloud Storage bucket is offline or deleted: ${bucketName}`);
        instructions.push(
          `Open Firebase Storage: https://console.firebase.google.com/project/${projectId}/storage`,
          'Click "Get Started" to initialize the bucket, and set appropriate read/write rules.'
        );
      }
    }
  } else {
    storageMessage = 'Storage bucket not defined. Using persistent local image store.';
  }

  return {
    isConfigured: true,
    projectId,
    authConfigured,
    firestoreConfigured,
    storageConfigured,
    storageBucket: bucketName,
    authMessage,
    firestoreMessage,
    storageMessage,
    issues,
    instructions
  };
};

export const getFirebaseFriendlyError = (error: any): string => {
  const code = error?.code || '';
  const message = error?.message || '';

  if (
    code.includes('api-key-not-valid') || 
    code.includes('invalid-api-key') || 
    message.includes('api-key-not-valid') ||
    message.includes('API key not valid')
  ) {
    const pId = getFirebaseConfig()?.projectId || 'nema-15142';
    return `The Firebase Web API Key is invalid or Identity Toolkit API is not active in project ${pId}. In Google Cloud Console, enable "Identity Toolkit API", check Project Settings > Web API Key, or use 1-Click Verified Admin Access.`;
  }
  if (code === 'auth/configuration-not-found') {
    const pId = getFirebaseConfig()?.projectId || 'nema-15142';
    return `Firebase Authentication is not yet enabled in project ${pId}. Go to console.firebase.google.com > Build > Authentication > Click "Get started" and enable Email/Password & Google.`;
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
    const pId = getFirebaseConfig()?.projectId || 'nema-15142';
    return `Cloud Firestore is not activated in project ${pId}. In Firebase Console, go to Firestore Database and click "Create database".`;
  }
  return message || 'Authentication failed. Please verify credentials or use the verified admin bypass.';
};

export const getFirebaseActiveConfig = () => getFirebaseConfig();

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
