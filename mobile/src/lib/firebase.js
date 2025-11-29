import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// PASTE YOUR CONFIG HERE (Same as web/.env or web/src/lib/firebase.js)
const firebaseConfig = {
  apiKey: "AIzaSyBI4jzmLya_E9JT6NWBydIRVvSLBi5RKy4",
  authDomain: "soccer-management-app.firebaseapp.com",
  projectId: "soccer-management-app",
  storageBucket: "soccer-management-app.firebasestorage.app",
  messagingSenderId: "465013767492",
  appId: "1:465013767492:web:575ed6f193654bd7436b11",
  measurementId: "G-EQJFZV1LPD"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);
export const storage = getStorage(app);
export { auth };