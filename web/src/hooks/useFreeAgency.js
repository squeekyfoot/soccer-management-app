import { useState, useCallback } from 'react';
import { 
  collection, doc, updateDoc, getDocs, query, where 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from '../context/AuthContext';

export const useFreeAgency = () => {
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- ACTIONS (User Side) ---

  const validateProfileForFreeAgency = (soccerProfile) => {
    const required = ['positions', 'yearsPlayed', 'skillLevel', 'competitionLevel'];
    const missing = required.filter(field => {
      const val = soccerProfile[field];
      return val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0);
    });
    return missing;
  };

  const updateSoccerProfile = async (profileData) => {
    if (!loggedInUser) return false;
    setLoading(true);
    setError(null);
    try {
      const userRef = doc(db, "users", loggedInUser.uid);
      
      // Merge with existing profile to avoid overwriting unrelated keys
      const updatedProfile = {
        ...loggedInUser.soccerProfile,
        ...profileData
      };

      // Safety Check: If they are turning it ON, validate first
      if (profileData.isFreeAgent === true) {
        const missingFields = validateProfileForFreeAgency(updatedProfile);
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }
      }

      await updateDoc(userRef, {
        soccerProfile: updatedProfile
      });
      
      return true;
    } catch (err) {
      console.error("Error updating soccer profile:", err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const toggleFreeAgency = async (currentStatus, currentProfileData) => {
    return updateSoccerProfile({ 
        ...currentProfileData,
        isFreeAgent: !currentStatus 
    });
  };

  // --- DATA FETCHING (Public Side) ---

  const fetchFreeAgents = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      // Basic Query: All Free Agents
      let q = query(usersRef, where("soccerProfile.isFreeAgent", "==", true));
      
      // Note: Firestore requires composite indexes for complex filtering.
      // For now, we fetch all free agents and filter client-side for advanced fields 
      // (Position, Skill) to avoid index explosion.
      
      const snapshot = await getDocs(q);
      let players = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));

      // Client-Side Filtering
      if (filters.position && filters.position !== 'Any') {
        players = players.filter(p => 
          p.soccerProfile?.positions?.includes(filters.position)
        );
      }
      if (filters.skillLevel && filters.skillLevel !== 'Any') {
        players = players.filter(p => 
          p.soccerProfile?.skillLevel === filters.skillLevel
        );
      }

      return players;
    } catch (err) {
      console.error("Error fetching free agents:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    updateSoccerProfile,
    toggleFreeAgency,
    fetchFreeAgents,
    validateProfileForFreeAgency
  };
};