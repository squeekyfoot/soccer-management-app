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

  // --- FETCHING ---
  const fetchRosters = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "rosters"));
      return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error("Error fetching rosters:", error);
      return [];
    }
  }, []);

  const fetchIncomingRequests = useCallback(async () => {
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
  }, [loggedInUser]);

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

  // --- EVENTS ---
  const fetchAllUserEvents = useCallback(async (uid) => {
    try {
      // Note: We cannot call the memoized fetchUserRosters directly inside another useCallback easily 
      // without adding it to deps, which is fine, but direct DB calls are often safer in complex hooks 
      // to avoid circular deps. However, since we defined fetchUserRosters above, we can use it.
      
      // Re-implementing logic slightly to avoid dependency chain issues, 
      // or simply calling the DB directly is safer for stable references.
      const rostersRef = collection(db, "rosters");
      const q = query(rostersRef, where("playerIDs", "array-contains", uid));
      const rosterSnap = await getDocs(q);
      const rosters = rosterSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      let allEvents = [];
      for (const roster of rosters) {
        const eventsRef = collection(db, "rosters", roster.id, "events");
        const qEvents = query(eventsRef); 
        const querySnapshot = await getDocs(qEvents);
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
  }, []);

  const createEvent = async (rosterId, eventData) => {
    try {
      await addDoc(collection(db, "rosters", rosterId, "events"), {
        ...eventData,
        createdAt: new Date()
      });
      return true;
    } catch (error) {
      console.error("Error creating event:", error);
      return false;
    }
  };

  const fetchEvents = useCallback(async (rosterId) => {
    try {
      const eventsRef = collection(db, "rosters", rosterId, "events");
      const q = query(eventsRef, orderBy("dateTime", "asc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching events:", error);
      return [];
    }
  }, []);

  const deleteEvent = async (rosterId, eventId) => {
    try {
      await deleteDoc(doc(db, "rosters", rosterId, "events", eventId));
      return true;
    } catch (error) {
      console.error("Error deleting event:", error);
      return false;
    }
  };

  // --- SUBSCRIPTIONS ---
  const subscribeToIncomingRequests = useCallback((callback) => {
    if (!loggedInUser) return () => {};
    const requestsRef = collection(db, "rosterRequests");
    const q = query(requestsRef, where("managerId", "==", loggedInUser.uid));
    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(requests);
    });
  }, [loggedInUser]);

  const subscribeToUserRequests = useCallback((callback) => {
    if (!loggedInUser) return () => {};
    const requestsRef = collection(db, "rosterRequests");
    const q = query(requestsRef, where("userId", "==", loggedInUser.uid));
    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(requests);
    });
  }, [loggedInUser]);

  const subscribeToDiscoverableRosters = useCallback((callback) => {
    const rostersRef = collection(db, "rosters");
    const q = query(rostersRef, where("isDiscoverable", "==", true));
    return onSnapshot(q, (snapshot) => {
      const rosters = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(rosters);
    });
  }, []);

  const submitJoinRequest = async (rosterId, rosterName, managerId) => {
    if (!loggedInUser) return false;
    try {
       const requestsRef = collection(db, "rosterRequests");
       const q = query(requestsRef, where("rosterId", "==", rosterId), where("userId", "==", loggedInUser.uid));
       const existing = await getDocs(q);
       if (!existing.empty) { alert("Already requested."); return false; }

       await addDoc(requestsRef, {
         rosterId, rosterName, managerId,
         userId: loggedInUser.uid, userName: loggedInUser.playerName, userEmail: loggedInUser.email,
         status: 'pending', createdAt: serverTimestamp()
       });
       return true;
    } catch (error) {
      console.error("Error submitting request:", error);
      return false;
    }
  };

  // --- ACTIONS ---
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

      const chatsRef = collection(db, "chats");
      const chatQ = query(chatsRef, where("rosterId", "==", rosterId));
      const chatSnapshot = await getDocs(chatQ);

      if (!chatSnapshot.empty) {
        await updateDoc(chatSnapshot.docs[0].ref, {
          participants: arrayRemove(playerSummary.uid), visibleTo: arrayRemove(playerSummary.uid), participantDetails: arrayRemove(playerSummary)
        });
      }
      return true;
    } catch (error) {
      console.error("Error removing player:", error);
      return false;
    }
  };

  return {
    loading,
    fetchRosters, fetchIncomingRequests, fetchUserRosters,
    createRoster, updateRoster, deleteRoster,
    addPlayerToRoster, removePlayerFromRoster,
    createTeamChat,
    // Events
    fetchAllUserEvents, createEvent, fetchEvents, deleteEvent,
    // Subscriptions
    subscribeToIncomingRequests, subscribeToUserRequests, subscribeToDiscoverableRosters, submitJoinRequest
  };
};