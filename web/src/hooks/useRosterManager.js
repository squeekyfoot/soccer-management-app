// src/hooks/useRosterManager.js
import { useState, useCallback } from 'react';
import { 
  collection, addDoc, updateDoc, doc, deleteDoc, getDocs, 
  query, where, arrayUnion, arrayRemove, serverTimestamp, deleteField, setDoc, onSnapshot, orderBy, getDoc 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from '../context/AuthContext';
import { useGroupManager } from './useGroupManager'; 

export const useRosterManager = () => {
  const { loggedInUser } = useAuth();
  const { createGroup } = useGroupManager(); 
  const [loading, setLoading] = useState(false);

  // --- SUBSCRIPTIONS (Real-time) ---
  
  /**
   * Listen to a specific Roster document.
   * Replaces direct onSnapshot usage in Views.
   */
  const subscribeToRoster = useCallback((rosterId, callback) => {
    if (!rosterId) return () => {};
    const rosterRef = doc(db, "rosters", rosterId);
    return onSnapshot(rosterRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() });
      } else {
        callback(null);
      }
    });
  }, []);

  const subscribeToIncomingRequests = useCallback((callback) => {
    if (!loggedInUser) return () => {};
    const requestsRef = collection(db, "rosterRequests");
    const q = query(requestsRef, where("managerId", "==", loggedInUser.uid));
    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(requests);
    });
  }, [loggedInUser]);

  // --- FETCHING (One-time) ---
  
  const fetchRosters = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "rosters"));
      return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error("Error fetching rosters:", error);
      return [];
    }
  }, []);

  const fetchUserRosters = useCallback(async (uid) => {
    try {
      const rostersRef = collection(db, "rosters");
      const q = query(rostersRef, where("playerIDs", "array-contains", uid));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching user rosters:", error);
      return [];
    }
  }, []);

  // --- ACTIONS ---

  const createRoster = async (rosterData, groupCreationData = null, addManagerAsPlayer = false) => {
    if (!loggedInUser) return false;
    setLoading(true);
    try {
      const initialPlayerIDs = [];
      const initialPlayers = [];

      if (addManagerAsPlayer) {
          initialPlayerIDs.push(loggedInUser.uid);
          initialPlayers.push({
              uid: loggedInUser.uid,
              playerName: loggedInUser.playerName,
              email: loggedInUser.email,
              photoURL: loggedInUser.photoURL || ""
          });
      }

      const rosterRef = await addDoc(collection(db, "rosters"), {
        ...rosterData, 
        managerName: loggedInUser.playerName,
        maxCapacity: Number(rosterData.maxCapacity),
        targetPlayerCount: Number(rosterData.targetPlayerCount || rosterData.maxCapacity),
        createdBy: loggedInUser.uid,
        createdAt: new Date(),
        playerIDs: initialPlayerIDs, 
        players: initialPlayers       
      });

      // 1. Create Chat
      await createTeamChat(rosterRef.id, rosterData.name, rosterData.season, initialPlayers);

      // 2. Create Group
      if (groupCreationData && groupCreationData.createGroup) {
          await createGroup({
              name: groupCreationData.groupName || rosterData.name,
              description: `Official group for ${rosterData.name}`,
              isPublic: false,
              associatedRosterId: rosterRef.id
          });
      }
      
      return rosterRef.id;
    } catch (error) {
      console.error("Error creating roster:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateRoster = async (rosterId, updates) => {
    try {
      const rosterRef = doc(db, "rosters", rosterId);
      const cleanUpdates = { ...updates };
      if (cleanUpdates.maxCapacity) cleanUpdates.maxCapacity = Number(cleanUpdates.maxCapacity);
      if (cleanUpdates.targetPlayerCount) cleanUpdates.targetPlayerCount = Number(cleanUpdates.targetPlayerCount);
      await updateDoc(rosterRef, cleanUpdates);
      return true;
    } catch (error) {
      console.error("Error updating roster:", error);
      return false;
    }
  };

  const addPlayerToRoster = async (rosterId, playerEmail) => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", playerEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) { alert("No player found."); return false; }

      const playerDoc = querySnapshot.docs[0];
      const playerData = playerDoc.data();
      const playerSummary = {
        uid: playerDoc.id, playerName: playerData.playerName || "Unknown", email: playerData.email, photoURL: playerData.photoURL || ""
      };

      await updateDoc(doc(db, "rosters", rosterId), {
        playerIDs: arrayUnion(playerDoc.id), players: arrayUnion(playerSummary) 
      });

      // Sync Chat
      const chatsRef = collection(db, "chats");
      const chatQ = query(chatsRef, where("rosterId", "==", rosterId));
      const chatSnapshot = await getDocs(chatQ);

      if (!chatSnapshot.empty) {
        await setDoc(chatSnapshot.docs[0].ref, {
          participants: arrayUnion(playerDoc.id), visibleTo: arrayUnion(playerDoc.id),
          participantDetails: arrayUnion(playerSummary), [`unreadCounts.${playerDoc.id}`]: 0 
        }, { merge: true });
      }
      return true;
    } catch (error) {
      console.error("Error adding player:", error);
      return false;
    }
  };

  const removePlayerFromRoster = async (rosterId, playerSummary) => {
    try {
      await updateDoc(doc(db, "rosters", rosterId), {
        playerIDs: arrayRemove(playerSummary.uid), players: arrayRemove(playerSummary)
      });
      // Note: We don't strictly remove from chat history visibility here to preserve history, 
      // but you can add that logic if desired.
      return true;
    } catch (error) {
      console.error("Error removing player:", error);
      return false;
    }
  };

  const createTeamChat = async (rosterId, rosterName, season, rosterPlayers = [], customMessage = null) => {
    if (!loggedInUser) return false;
    try {
      const participantIds = [loggedInUser.uid];
      const participantDetails = [{
          uid: loggedInUser.uid, name: loggedInUser.playerName, email: loggedInUser.email, photoURL: loggedInUser.photoURL || ""
      }];
      const initialUnread = { [loggedInUser.uid]: 0 };

      rosterPlayers.forEach(p => {
          if (p.uid !== loggedInUser.uid) { 
              participantIds.push(p.uid);
              participantDetails.push({ ...p });
              initialUnread[p.uid] = 1; 
          }
      });

      const initialText = customMessage || "Team chat created";
      const chatRef = await addDoc(collection(db, "chats"), {
        type: 'roster', rosterId, name: `${rosterName} (${season || 'Season'})`,
        participants: participantIds, visibleTo: participantIds, participantDetails,
        unreadCounts: initialUnread, createdAt: serverTimestamp(), lastMessage: initialText, lastMessageTime: serverTimestamp()
      });

      await addDoc(collection(db, "chats", chatRef.id, "messages"), {
          text: initialText, type: 'system', createdAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Error creating team chat:", error);
      return false;
    }
  };

  return {
    loading,
    subscribeToRoster, // <--- EXPORTED
    fetchRosters, fetchUserRosters,
    createRoster, updateRoster,
    addPlayerToRoster, removePlayerFromRoster,
    createTeamChat,
    subscribeToIncomingRequests
  };
};