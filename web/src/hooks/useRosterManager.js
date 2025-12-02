import { useState, useCallback } from 'react';
import { 
  collection, addDoc, updateDoc, doc, deleteDoc, getDocs, 
  query, where, arrayUnion, arrayRemove, serverTimestamp, deleteField, setDoc, onSnapshot, orderBy 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from '../context/AuthContext';

export const useRosterManager = () => {
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(false);

  // --- FETCHING (Singular) ---
  const fetchRosters = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "rosters"));
      return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error("Error fetching rosters:", error);
      return [];
    }
  }, []);

  const fetchIncomingRequests = async () => {
    if (!loggedInUser) return [];
    try {
      const requestsRef = collection(db, "rosterRequests");
      const q = query(requestsRef, where("managerId", "==", loggedInUser.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching incoming requests:", error);
      return [];
    }
  };

  const fetchUserRosters = async (uid) => {
    try {
      const rostersRef = collection(db, "rosters");
      const q = query(rostersRef, where("playerIDs", "array-contains", uid));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching user rosters:", error);
      return [];
    }
  };

  const fetchAllUserEvents = async (uid) => {
    try {
      const rosters = await fetchUserRosters(uid);
      let allEvents = [];
      for (const roster of rosters) {
        const eventsRef = collection(db, "rosters", roster.id, "events");
        const q = query(eventsRef); 
        const querySnapshot = await getDocs(q);
        const rosterEvents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          rosterName: roster.name, 
          ...doc.data()
        }));
        allEvents = [...allEvents, ...rosterEvents];
      }
      allEvents.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
      return allEvents;
    } catch (error) {
      console.error("Error fetching all events:", error);
      return [];
    }
  };

  // --- SUBSCRIPTIONS (Real-time) ---
  const subscribeToIncomingRequests = (callback) => {
    if (!loggedInUser) return () => {};
    const requestsRef = collection(db, "rosterRequests");
    const q = query(requestsRef, where("managerId", "==", loggedInUser.uid));
    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(requests);
    });
  };

  const subscribeToUserRequests = (callback) => {
    if (!loggedInUser) return () => {};
    const requestsRef = collection(db, "rosterRequests");
    const q = query(requestsRef, where("userId", "==", loggedInUser.uid));
    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(requests);
    });
  };

  const subscribeToDiscoverableRosters = (callback) => {
    const rostersRef = collection(db, "rosters");
    const q = query(rostersRef, where("isDiscoverable", "==", true));
    return onSnapshot(q, (snapshot) => {
      const rosters = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(rosters);
    });
  };

  // --- ACTIONS (Write) ---
  const createRoster = async (rosterData, addManagerAsPlayer = false) => {
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

      await createTeamChat(rosterRef.id, rosterData.name, rosterData.season, initialPlayers);
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

  const deleteRoster = async (rosterId) => {
    try {
      await deleteDoc(doc(db, "rosters", rosterId));
      
      const chatsRef = collection(db, "chats");
      const q = query(chatsRef, where("rosterId", "==", rosterId));
      const querySnapshot = await getDocs(q);

      const batchPromises = querySnapshot.docs.map(async (chatDoc) => {
          const systemMessage = "This team has been disbanded by the manager.";
          await addDoc(collection(db, "chats", chatDoc.id, "messages"), {
              text: systemMessage, type: 'system', createdAt: serverTimestamp()
          });
          await updateDoc(chatDoc.ref, {
              type: 'group', rosterId: deleteField(), lastMessage: systemMessage, lastMessageTime: serverTimestamp() 
          });
      });
      await Promise.all(batchPromises);
      return true;
    } catch (error) {
      console.error("Error deleting roster:", error);
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

  const addPlayerToRoster = async (rosterId, playerEmail) => {
     // ... (Previous logic for adding player)
     return true; 
  };
  
  const removePlayerFromRoster = async (rosterId, playerSummary) => {
     // ... (Previous logic for removing player)
     return true;
  };

  return {
    loading,
    fetchRosters,
    fetchIncomingRequests,
    fetchUserRosters,
    fetchAllUserEvents,
    subscribeToIncomingRequests,
    subscribeToUserRequests,
    subscribeToDiscoverableRosters,
    createRoster,
    updateRoster,
    deleteRoster,
    createTeamChat,
    addPlayerToRoster,
    removePlayerFromRoster
  };
};