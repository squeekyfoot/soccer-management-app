import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from '../context/AuthContext';

export const useLeagueManager = () => {
  const { loggedInUser } = useAuth();

  const createLeague = async (leagueData) => {
    if (!loggedInUser) return false;
    try {
      await addDoc(collection(db, "leagues"), {
        ...leagueData,
        createdBy: loggedInUser.uid,
        createdAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Error creating league:", error);
      return false;
    }
  };

  const fetchLeagues = async () => {
    try {
      const q = query(collection(db, "leagues"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching leagues:", error);
      return [];
    }
  };

  return { createLeague, fetchLeagues };
};