import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// 1. Check if an app is ALREADY initialized.
// If yes (getApps().length > 0), use that existing app (getApp()).
// If no, create a new one (initializeApp).
// This prevents "Duplicate App" errors during hot-reloading.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. Export services
export const auth = getAuth(app);
export const db = getFirestore(app);