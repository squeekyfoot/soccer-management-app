import { useState, useCallback } from 'react';
import { 
  collection, addDoc, updateDoc, doc, deleteDoc, getDocs, getDoc, 
  query, where, arrayUnion, arrayRemove, serverTimestamp, deleteField, setDoc, onSnapshot,
  writeBatch 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from '../context/AuthContext';
import { useGroupManager } from './useGroupManager'; 
import { useNotifications } from './useNotifications';
import { useChatManager } from './useChatManager'; 

export const useRosterManager = () => {
  const { loggedInUser } = useAuth();
  const { createGroup } = useGroupManager(); 
  const { sendResponseNotification } = useNotifications();
  const { sendSystemMessage } = useChatManager(); 
  const [loading, setLoading] = useState(false);

  // --- SUBSCRIPTIONS (Real-time) ---
  
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

  // NEW: Listen to all rosters managed by the current user
  const subscribeToManagedRosters = useCallback((callback) => {
    if (!loggedInUser) return () => {};
    const rostersRef = collection(db, "rosters");
    const q = query(rostersRef, where("createdBy", "==", loggedInUser.uid));
    return onSnapshot(q, (snapshot) => {
      const rosters = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(rosters);
    });
  }, [loggedInUser]);

  const subscribeToIncomingRequests = useCallback((callback) => {
    if (!loggedInUser) return () => {};
    const requestsRef = collection(db, "rosterRequests");
    const q = query(
        requestsRef, 
        where("managerId", "==", loggedInUser.uid),
        where("type", "==", "JOIN_TEAM") 
    );
    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(requests);
    });
  }, [loggedInUser]);

  const subscribeToUserRequests = useCallback((callback) => {
    if (!loggedInUser) return () => {};
    const requestsRef = collection(db, "rosterRequests");
    const q = query(requestsRef, where("userId", "==", loggedInUser.uid), where("type", "==", "JOIN_TEAM"));
    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(requests);
    });
  }, [loggedInUser]);

  const subscribeToMyPendingInvites = useCallback((callback) => {
    if (!loggedInUser) return () => {};
    const requestsRef = collection(db, "rosterRequests");
    const q = query(
        requestsRef, 
        where("userId", "==", loggedInUser.uid), 
        where("type", "==", "INVITE_PLAYER"),
        where("status", "==", "pending")
    );
    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(requests);
    });
  }, [loggedInUser]);

  const subscribeToManagerSentInvites = useCallback((callback) => {
    if (!loggedInUser) return () => {};
    const requestsRef = collection(db, "rosterRequests");
    const q = query(
        requestsRef, 
        where("managerId", "==", loggedInUser.uid),
        where("type", "==", "INVITE_PLAYER")
    );
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

  const fetchManagedRosters = useCallback(async (uid) => {
    try {
        const rostersRef = collection(db, "rosters");
        const q = query(rostersRef, where("createdBy", "==", uid));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching managed rosters:", error);
        return [];
    }
  }, []);

  const fetchAllUserEvents = useCallback(async (uid) => {
      return []; 
  }, []);

  // --- ACTIONS ---

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
         type: 'JOIN_TEAM',
         status: 'pending', createdAt: serverTimestamp()
       });
       return true;
    } catch (error) {
      console.error("Error submitting request:", error);
      return false;
    }
  };

  const invitePlayer = async (teamId, teamName, playerId, message = "") => {
    if (!loggedInUser) return false;
    try {
        const batch = writeBatch(db);

        // 1. Check for existing
        const requestsRef = collection(db, "rosterRequests");
        const q = query(
            requestsRef, 
            where("rosterId", "==", teamId), 
            where("userId", "==", playerId),
            where("type", "==", "INVITE_PLAYER"),
            where("status", "==", "pending")
        );
        const existing = await getDocs(q);
        if(!existing.empty) {
             return { success: false, message: "Invite already pending" };
        }

        // 2. Create Roster Request
        const newRequestRef = doc(collection(db, "rosterRequests"));
        batch.set(newRequestRef, {
            rosterId: teamId,
            rosterName: teamName,
            managerId: loggedInUser.uid, 
            managerName: loggedInUser.playerName,
            userId: playerId, 
            message: message,
            type: 'INVITE_PLAYER',
            status: 'pending',
            createdAt: serverTimestamp()
        });

        // 3. Create Action Item (The Inbox Notification)
        const newActionRef = doc(collection(db, "actionItems"));
        batch.set(newActionRef, {
            ownerId: playerId, // The recipient
            type: 'roster_invite',
            relatedEntityId: newRequestRef.id,
            status: 'pending',
            isDismissable: true,
            createdAt: serverTimestamp(),
            data: {
                title: `Team Invite: ${teamName}`,
                message: `${loggedInUser.playerName} invited you to join.`,
                rosterName: teamName,
                managerName: loggedInUser.playerName
            }
        });

        await batch.commit();
        return { success: true };
    } catch (error) {
        console.error("Error sending invite:", error);
        return { success: false, message: error.message };
    }
  };

  const withdrawInvite = async (requestId) => {
      try {
          await deleteDoc(doc(db, "rosterRequests", requestId));
          return true;
      } catch (error) {
          console.error("Error withdrawing invite:", error);
          return false;
      }
  };

  const respondToInvite = async (requestId, accept, message = "") => {
     if (!loggedInUser) return false;
     try {
         const batch = writeBatch(db);
         
         const requestRef = doc(db, "rosterRequests", requestId);
         const requestSnap = await getDoc(requestRef); 
         if (!requestSnap.exists()) return false;
         
         const requestData = requestSnap.data();
         
         batch.update(requestRef, {
             status: accept ? 'accepted' : 'rejected'
         });

         const actionQ = query(
             collection(db, "actionItems"),
             where("relatedEntityId", "==", requestId),
             where("ownerId", "==", loggedInUser.uid)
         );
         const actionSnap = await getDocs(actionQ);
         actionSnap.forEach(doc => {
             batch.update(doc.ref, { status: 'completed', updatedAt: serverTimestamp() });
         });

         await batch.commit();

         if (accept) {
             await addPlayerToRoster(requestData.rosterId, loggedInUser.email);
             
             await sendResponseNotification(
                 requestData.managerId, 
                 'OFFER_ACCEPTED', 
                 `${loggedInUser.playerName} joined ${requestData.rosterName}`, 
                 requestData.rosterName
             );
         } else {
             await sendResponseNotification(
                 requestData.managerId,
                 'OFFER_REJECTED',
                 message || `${loggedInUser.playerName} declined the invite to ${requestData.rosterName}`,
                 requestData.rosterName
             );
         }
         return true;
     } catch (error) {
         console.error("Error responding to invite:", error);
         return false;
     }
  };

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

      await createTeamChat(rosterRef.id, rosterData.name, rosterData.season, initialPlayers);

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

  const deleteRoster = async (rosterId) => {
    try {
      await deleteDoc(doc(db, "rosters", rosterId));
      return true;
    } catch (error) {
      console.error("Error deleting roster:", error);
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
        const chatDoc = chatSnapshot.docs[0];
        await setDoc(chatDoc.ref, {
          participants: arrayUnion(playerDoc.id), visibleTo: arrayUnion(playerDoc.id),
          participantDetails: arrayUnion(playerSummary), [`unreadCounts.${playerDoc.id}`]: 0 
        }, { merge: true });
        await sendSystemMessage(chatDoc.id, `${playerSummary.playerName} joined the team.`);
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
        const chatDoc = chatSnapshot.docs[0];
        await updateDoc(chatDoc.ref, {
            participants: arrayRemove(playerSummary.uid),
            visibleTo: arrayRemove(playerSummary.uid),
            participantDetails: arrayRemove(playerSummary),
            [`unreadCounts.${playerSummary.uid}`]: deleteField() 
        });
        await sendSystemMessage(chatDoc.id, `${playerSummary.playerName} was removed from the team.`);
      }

      return true;
    } catch (error) {
      console.error("Error removing player:", error);
      return false;
    }
  };

  const unlinkChatFromRoster = async (chatId) => {
      try {
          const chatRef = doc(db, "chats", chatId);
          await updateDoc(chatRef, { 
              type: 'group', 
              rosterId: deleteField() 
          });
          return true;
      } catch (error) {
          console.error("Error unlinking chat:", error);
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
    subscribeToRoster, 
    subscribeToManagedRosters, // <--- NEW EXPORT
    subscribeToIncomingRequests,
    subscribeToUserRequests,
    subscribeToMyPendingInvites,
    subscribeToManagerSentInvites,
    subscribeToDiscoverableRosters,
    fetchRosters, 
    fetchUserRosters,
    fetchManagedRosters,
    fetchAllUserEvents, 
    createRoster, 
    updateRoster, 
    deleteRoster,
    addPlayerToRoster, 
    removePlayerFromRoster,
    createTeamChat,
    unlinkChatFromRoster,
    submitJoinRequest,
    invitePlayer,
    withdrawInvite,
    respondToInvite
  };
};