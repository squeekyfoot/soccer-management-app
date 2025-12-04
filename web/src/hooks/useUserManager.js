import { useState, useCallback } from 'react';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';

/**
 * @description The "Brain" for managing all User/Profile business logic.
 * This hook encapsulates all Firestore and Storage interactions
 * related to the 'users' collection.
 *
 * @returns {object} - An object containing functions and state for user management.
 */
export const useUserManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Updates a user's profile document in Firestore.
   * @param {string} userId - The ID of the user to update.
   * @param {object} data - An object with the fields to update (e.g., { displayName: 'New Name' }).
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Uploads a new avatar image, gets the URL, and updates the user's profile.
   * @param {string} userId - The ID of the user.
   * @param {File} file - The image file to upload.
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
      return photoURL; // Return the new URL so the UI can update instantly
    } catch (err) {
      console.error("Error uploading avatar:", err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [updateUserProfile]);

  // NOTE: A search implementation would go here.
  // const searchUsers = useCallback(async (searchQuery) => { ... });

  return {
    isLoading,
    error,
    updateUserProfile,
    uploadProfileAvatar,
  };
};