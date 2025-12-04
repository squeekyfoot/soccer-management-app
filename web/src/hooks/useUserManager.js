// src/hooks/useUserManager.js
import { useState, useCallback } from 'react';
import { 
  doc, 
  updateDoc, 
  collection, 
  getDocs, 
  setDoc, 
  getDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';

/**
 * @description The "Brain" for managing all User/Profile business logic.
 * Encapsulates Firestore and Storage interactions for 'users'.
 */
export const useUserManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Updates a user's profile document in Firestore.
   */
  const updateUserProfile = useCallback(async (userId, data) => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, data);
    } catch (err) {
      console.error("Error updating user profile:", err);
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Uploads a new avatar image, gets the URL, and updates the user's profile.
   */
  const uploadProfileAvatar = useCallback(async (userId, file) => {
    if (!userId || !file) return;
    setIsLoading(true);
    setError(null);
    try {
      const storageRef = ref(storage, `avatars/${userId}/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(snapshot.ref);
      await updateUserProfile(userId, { photoURL });
      return photoURL;
    } catch (err) {
      console.error("Error uploading avatar:", err);
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [updateUserProfile]);

  /**
   * Searches for users based on a query string.
   * Note: Currently performs client-side filtering to support substring matching.
   * Future optimization: Move to Algolia or server-side simple match.
   */
  const searchUsers = useCallback(async (searchTerm) => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all users (Optimization needed for large scale apps)
      const querySnapshot = await getDocs(collection(db, "users"));
      const users = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));

      if (!searchTerm) return users;

      const lowerTerm = searchTerm.toLowerCase();
      return users.filter(user => 
        (user.playerName && user.playerName.toLowerCase().includes(lowerTerm)) ||
        (user.email && user.email.toLowerCase().includes(lowerTerm))
      );
    } catch (err) {
      console.error("Error searching users:", err);
      setError(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Updates a specific sport detail section for a user.
   */
  const updateUserSportsDetails = useCallback(async (userId, sport, data) => {
    if (!userId || !sport) return;
    setIsLoading(true);
    setError(null);
    try {
      const ref = doc(db, "users", userId, "sportsDetails", sport);
      await setDoc(ref, data);
      return true;
    } catch (err) {
      console.error(`Error updating ${sport} details:`, err);
      setError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetches a specific sport detail section for a user.
   */
  const fetchUserSportsDetails = useCallback(async (userId, sport) => {
    if (!userId || !sport) return null;
    setIsLoading(true);
    try {
      const ref = doc(db, "users", userId, "sportsDetails", sport);
      const snap = await getDoc(ref);
      return snap.exists() ? snap.data() : null;
    } catch (err) {
      console.error(`Error fetching ${sport} details:`, err);
      setError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    updateUserProfile,
    uploadProfileAvatar,
    searchUsers,
    updateUserSportsDetails,
    fetchUserSportsDetails
  };
};