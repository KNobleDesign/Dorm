import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

// Support Vite environment variables (VITE_FIREBASE_*) with production fallback
const env = typeof import.meta !== 'undefined' ? (import.meta as any).env : {};

export const firebaseConfig = {
  apiKey: env?.VITE_FIREBASE_API_KEY || "AIzaSyDkee_QXNcOEjmk1dzv3FkC-tDm7O25BSQ",
  authDomain: env?.VITE_FIREBASE_AUTH_DOMAIN || "dorm-4263e.firebaseapp.com",
  databaseURL: env?.VITE_FIREBASE_DATABASE_URL || "https://dorm-4263e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: env?.VITE_FIREBASE_PROJECT_ID || "dorm-4263e",
  storageBucket: env?.VITE_FIREBASE_STORAGE_BUCKET || "dorm-4263e.firebasestorage.app",
  messagingSenderId: env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "157710677359",
  appId: env?.VITE_FIREBASE_APP_ID || "1:157710677359:web:ff1e8444d49242f16fa49a",
  measurementId: env?.VITE_FIREBASE_MEASUREMENT_ID || "G-75N0MRFJMT"
};

// Singleton initialization
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Realtime Database (with custom databaseURL)
export const rtdb: Database = getDatabase(app, firebaseConfig.databaseURL);

// Initialize Cloud Firestore
export const db: Firestore = getFirestore(app);

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
}
