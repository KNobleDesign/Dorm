import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getDatabase, Database } from "firebase/database";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";
import firebaseAppletConfig from "../../firebase-applet-config.json";

// Support Vite environment variables (VITE_FIREBASE_*) with production fallback to firebase-applet-config.json
const env = typeof import.meta !== 'undefined' ? (import.meta as any).env : {};

export const firebaseConfig = {
  apiKey: env?.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey,
  authDomain: env?.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain,
  databaseURL: env?.VITE_FIREBASE_DATABASE_URL || (firebaseAppletConfig as any).databaseURL || `https://${firebaseAppletConfig.projectId}-default-rtdb.asia-southeast1.firebasedatabase.app`,
  projectId: env?.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId,
  storageBucket: env?.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket,
  messagingSenderId: env?.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId,
  appId: env?.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId,
  measurementId: env?.VITE_FIREBASE_MEASUREMENT_ID || firebaseAppletConfig.measurementId || ""
};

// Singleton initialization
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Cloud Firestore with firestoreDatabaseId if configured
export const db: Firestore = (firebaseAppletConfig as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseAppletConfig as any).firestoreDatabaseId)
  : getFirestore(app);

// Safe Firebase Auth accessor (does not crash if Auth component is not registered or not enabled)
let authInstance: Auth | null = null;
export function getFirebaseAuth(): Auth | null {
  if (!authInstance && typeof window !== 'undefined') {
    try {
      authInstance = getAuth(app);
    } catch {
      // Auth service not registered or not enabled in project
      authInstance = null;
    }
  }
  return authInstance;
}
export const auth: Auth | null = typeof window !== 'undefined' ? getFirebaseAuth() : null;

// Safe Realtime Database accessor
let rtdbInstance: Database | null = null;
try {
  if (firebaseConfig.databaseURL) {
    rtdbInstance = getDatabase(app, firebaseConfig.databaseURL);
  }
} catch {
  rtdbInstance = null;
}
export const rtdb: Database | null = rtdbInstance;

// Standard OperationType and handleFirestoreError for error monitoring & diagnosis
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentAuth = getFirebaseAuth();
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.currentUser?.uid,
      email: currentAuth?.currentUser?.email,
      emailVerified: currentAuth?.currentUser?.emailVerified,
      isAnonymous: currentAuth?.currentUser?.isAnonymous,
      tenantId: currentAuth?.currentUser?.tenantId,
      providerInfo: currentAuth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Safe Analytics Initialization (supported only in client browser environments)
export let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      try {
        analytics = getAnalytics(app);
      } catch (err) {
        console.warn("Firebase Analytics could not be initialized:", err);
      }
    }
  });

  // Validate Connection to Firestore on boot
  (async () => {
    try {
      const { doc, getDocFromServer } = await import("firebase/firestore");
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration.");
      }
    }
  })();
}
