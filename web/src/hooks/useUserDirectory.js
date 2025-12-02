import { useState, useEffect } from 'react';
import { collection, onSnapshot } from "firebase/firestore"; 
import { db } from "../lib/firebase";

// Global cache outside the hook prevents re-fetching when navigating between pages
let globalUserCache = {};
let listenersActive = false;

export const useUserDirectory = () => {
  const [userProfiles, setUserProfiles] = useState(globalUserCache);

  useEffect(() => {
    // Return cached data immediately if available
    if (Object.keys(globalUserCache).length > 0) {
        setUserProfiles(globalUserCache);
    }

    // Only set up the listener if one isn't already active (or you want real-time updates)
    // For this example, we'll allow it to subscribe to ensure we get new users.
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const profiles = {};
      snapshot.docs.forEach(doc => {
          profiles[doc.id] = doc.data();
      });
      
      // Update global cache
      globalUserCache = profiles;
      setUserProfiles(profiles);
      listenersActive = true;
    });

    return () => {
        // Optional: Decide if you want to unsubscribe when component unmounts
        // or keep the listener alive for the session.
        unsubscribe(); 
    };
  }, []);

  return { userProfiles };
};