import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

// Your web app's Firebase configuration
// Connected to dorm-4263e
export const firebaseConfig = {
  apiKey: "AIzaSyDkee_QXNcOEjmk1dzv3FkC-tDm7O25BSQ",
  authDomain: "dorm-4263e.firebaseapp.com",
  databaseURL: "https://dorm-4263e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dorm-4263e",
  storageBucket: "dorm-4263e.firebasestorage.app",
  messagingSenderId: "157710677359",
  appId: "1:157710677359:web:ff1e8444d49242f16fa49a",
  measurementId: "G-75N0MRFJMT"
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
