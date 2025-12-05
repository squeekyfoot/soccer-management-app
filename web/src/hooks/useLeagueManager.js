import { useState, useCallback } from 'react';
import { 
  collection, addDoc, getDocs, query, orderBy, serverTimestamp, 
  doc, updateDoc, deleteDoc, onSnapshot 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from '../context/AuthContext';

export const useLeagueManager = () => {
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- ACTIONS ---

  const createLeague = async (leagueData) => {
    if (!loggedInUser) return false;
    setLoading(true);
    try {
      await addDoc(collection(db, "leagues"), {
        ...leagueData,
        createdBy: loggedInUser.uid,
        createdAt: serverTimestamp()
      });
      return true;
    } catch (err) {
      console.error("Error creating league:", err);
      setError(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateLeague = async (leagueId, updates) => {
    setLoading(true);
    try {
      const leagueRef = doc(db, "leagues", leagueId);
      await updateDoc(leagueRef, updates);
      return true;
    } catch (err) {
      console.error("Error updating league:", err);
      setError(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteLeague = async (leagueId) => {
    if (!window.confirm("Delete this league? This cannot be undone.")) return false;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "leagues", leagueId));
      return true;
    } catch (err) {
      console.error("Error deleting league:", err);
      setError(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // --- DATA FETCHING ---

  const fetchLeagues = useCallback(async () => {
    try {
      const q = query(collection(db, "leagues"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("Error fetching leagues:", err);
      setError(err);
      return [];
    }
  }, []);

  // --- SUBSCRIPTIONS ---

  const subscribeToLeagues = useCallback((callback) => {
    const q = query(collection(db, "leagues"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(data);
    });
  }, []);

  return { 
    loading, 
    error,
    createLeague, 
    updateLeague, 
    deleteLeague, 
    fetchLeagues,
    subscribeToLeagues 
  };
};