import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "firebase/auth";
import { 
  doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, deleteDoc, 
  query, where, arrayUnion, arrayRemove, orderBy, serverTimestamp 
} from "firebase/firestore";
import { auth, db } from "../firebase"; 

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [soccerDetails, setSoccerDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsReauth, setNeedsReauth] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        const soccerDocRef = doc(db, "users", user.uid, "sportsDetails", "soccer");
        const soccerDoc = await getDoc(soccerDocRef);

        if (userDoc.exists()) {
          setLoggedInUser(userDoc.data());
        } else {
          setLoggedInUser(null);
        }

        if (soccerDoc.exists()) {
          setSoccerDetails(soccerDoc.data());
        } else {
          setSoccerDetails(null);
        }
      } else {
        setLoggedInUser(null);
        setSoccerDetails(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []); 

  // ... (signIn, signUp, signOutUser, updateProfile, reauthenticate, updateSoccerDetails, isManager REMAIN UNCHANGED) ...
  
  const signIn = async (email, password) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      const soccerDocRef = doc(db, "users", user.uid, "sportsDetails", "soccer");
      const soccerDoc = await getDoc(soccerDocRef);

      if (soccerDoc.exists()) {
        setSoccerDetails(soccerDoc.data());
      } else {
        setSoccerDetails(null);
      }

      if (userDoc.exists()) {
        setLoggedInUser(userDoc.data());
      } else {
        alert("Authentication successful, but no profile was found.");
        setLoggedInUser(null);
      }
    } catch (error) {
      console.error("Error signing in:", error);
      alert("Error: " + error.message);
    }
    setIsLoading(false);
  };

  const signUp = async (formData) => {
    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      const userProfileData = {
        uid: user.uid,
        playerName: formData.playerName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        notificationPreference: formData.notificationPreference,
        comments: formData.comments,
        role: 'player'
      };
      
      await setDoc(doc(db, "users", user.uid), userProfileData);
      setLoggedInUser(userProfileData);
    } catch (error) {
      console.error("Error signing up:", error);
      alert("Error: " + error.message);
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setLoggedInUser(null);
      setSoccerDetails(null);
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Error: " + error.message);
    }
  };

  const updateProfile = async (profileData) => {
    if (!loggedInUser) return;
    if (profileData.email !== loggedInUser.email) {
      try {
        await updateEmail(auth.currentUser, profileData.email);
      } catch (error) {
        if (error.code === 'auth/requires-recent-login') {
          setNeedsReauth(true); 
        } else {
          alert("Error: " + error.message);
        }
        return;
      }
    }
    try {
      const dataToUpdate = {
        playerName: profileData.playerName,
        phone: profileData.phone,
        address: profileData.address,
        notificationPreference: profileData.notificationPreference,
        comments: profileData.comments,
        email: profileData.email
      };
      
      const userDocRef = doc(db, "users", loggedInUser.uid);
      await updateDoc(userDocRef, dataToUpdate);
      
      setLoggedInUser(prevUser => ({
        ...prevUser,
        ...dataToUpdate
      }));
      
      alert("Profile successfully updated!");
      return true; 
    } catch (error) {
      alert("Error saving profile: " + error.message);
      return false;
    }
  };

  const reauthenticate = async (password, newEmail) => {
    if (!auth.currentUser || !password) return;
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updateEmail(auth.currentUser, newEmail);
      const userDocRef = doc(db, "users", loggedInUser.uid);
      await updateDoc(userDocRef, { email: newEmail });

      setLoggedInUser(prevUser => ({
        ...prevUser,
        email: newEmail
      }));

      alert("Email successfully updated!");
      setNeedsReauth(false); 
      return true; 
    } catch (error) {
      alert("Error: Incorrect password or another error occurred. " + error.message);
      return false;
    }
  };

  const updateSoccerDetails = async (soccerData) => {
    if (!loggedInUser) return;
    try {
      const soccerDataToSave = {
        ...soccerData,
        currentRosters: soccerData.currentRosters.split(',').map(item => item.trim()),
        rosterJerseysOwned: soccerData.rosterJerseysOwned.split(',').map(item => item.trim()),
        playerNumber: Number(soccerData.playerNumber) || 0,
      };
      
      const soccerDocRef = doc(db, "users", loggedInUser.uid, "sportsDetails", "soccer");
      await setDoc(soccerDocRef, soccerDataToSave);
      
      setSoccerDetails(soccerDataToSave); 
      alert("Soccer info saved!");
      return true; 

    } catch (error) {
      alert("Error: " + error.message);
      return false;
    }
  };

  const isManager = () => {
    return loggedInUser && loggedInUser.role === 'manager';
  };

  // --- Roster Management (UPDATED) ---

  const createRoster = async (rosterName, season, maxCapacity) => {
    if (!isManager()) {
      alert("Only managers can create rosters.");
      return false;
    }
    try {
      // 1. Create Roster
      const rosterRef = await addDoc(collection(db, "rosters"), {
        name: rosterName,
        season: season,
        maxCapacity: Number(maxCapacity),
        createdBy: loggedInUser.uid,
        createdAt: new Date(),
        playerIDs: [],
        players: [] 
      });

      // 2. NEW: Create Linked Persistent Chat
      // Managers are auto-added to the chat
      await addDoc(collection(db, "chats"), {
        type: 'roster', // Special type
        rosterId: rosterRef.id, // Link back to roster
        name: `${rosterName} (${season})`, // Team Name
        participants: [loggedInUser.uid],
        visibleTo: [loggedInUser.uid], // Visible to manager initially
        participantDetails: [{
          uid: loggedInUser.uid,
          name: loggedInUser.playerName,
          email: loggedInUser.email
        }],
        createdAt: serverTimestamp(),
        lastMessage: "Team chat created",
        lastMessageTime: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error("Error creating roster:", error);
      alert("Error: " + error.message);
      return false;
    }
  };

  const fetchRosters = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "rosters"));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching rosters:", error);
      return [];
    }
  };

  const deleteRoster = async (rosterId) => {
    if (!isManager()) return false;
    try {
      // Note: In a real app, we should also delete the linked Chat document here.
      await deleteDoc(doc(db, "rosters", rosterId));
      return true;
    } catch (error) {
      console.error("Error deleting roster:", error);
      alert("Error: " + error.message);
      return false;
    }
  };

  const addPlayerToRoster = async (rosterId, playerEmail) => {
    if (!isManager()) return false;
    
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", playerEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("No player found with that email address.");
        return false;
      }

      const playerDoc = querySnapshot.docs[0];
      const playerData = playerDoc.data();

      const playerSummary = {
        uid: playerDoc.id,
        playerName: playerData.playerName || "Unknown",
        email: playerData.email
      };

      // 1. Update Roster
      const rosterRef = doc(db, "rosters", rosterId);
      await updateDoc(rosterRef, {
        playerIDs: arrayUnion(playerDoc.id),
        players: arrayUnion(playerSummary) 
      });

      // 2. NEW: Update Linked Chat (Add player to chat)
      // Find the chat associated with this roster
      const chatsRef = collection(db, "chats");
      const chatQ = query(chatsRef, where("rosterId", "==", rosterId));
      const chatSnapshot = await getDocs(chatQ);

      if (!chatSnapshot.empty) {
        const chatDoc = chatSnapshot.docs[0];
        await updateDoc(chatDoc.ref, {
          participants: arrayUnion(playerDoc.id),
          visibleTo: arrayUnion(playerDoc.id), // Make it visible immediately
          participantDetails: arrayUnion(playerSummary)
        });
      }

      return true;

    } catch (error) {
      console.error("Error adding player:", error);
      alert("Error: " + error.message);
      return false;
    }
  };

  const removePlayerFromRoster = async (rosterId, playerSummary) => {
    if (!isManager()) return false;
    
    try {
      // 1. Update Roster
      const rosterRef = doc(db, "rosters", rosterId);
      await updateDoc(rosterRef, {
        playerIDs: arrayRemove(playerSummary.uid),
        players: arrayRemove(playerSummary)
      });

      // 2. NEW: Update Linked Chat (Remove player from chat)
      const chatsRef = collection(db, "chats");
      const chatQ = query(chatsRef, where("rosterId", "==", rosterId));
      const chatSnapshot = await getDocs(chatQ);

      if (!chatSnapshot.empty) {
        const chatDoc = chatSnapshot.docs[0];
        await updateDoc(chatDoc.ref, {
          participants: arrayRemove(playerSummary.uid),
          visibleTo: arrayRemove(playerSummary.uid),
          participantDetails: arrayRemove(playerSummary)
        });
      }

      return true;
    } catch (error) {
      console.error("Error removing player:", error);
      alert("Error: " + error.message);
      return false;
    }
  };

  // ... (fetchUserRosters, createEvent, fetchEvents, deleteEvent, fetchAllUserEvents REMAIN UNCHANGED) ...
  
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

  const createEvent = async (rosterId, eventData) => {
    try {
      await addDoc(collection(db, "rosters", rosterId, "events"), {
        ...eventData,
        createdAt: new Date()
      });
      return true;
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Error: " + error.message);
      return false;
    }
  };

  const fetchEvents = async (rosterId) => {
    try {
      const eventsRef = collection(db, "rosters", rosterId, "events");
      const q = query(eventsRef, orderBy("dateTime", "asc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching events:", error);
      return [];
    }
  };

  const deleteEvent = async (rosterId, eventId) => {
    if (!isManager()) return false;
    try {
      await deleteDoc(doc(db, "rosters", rosterId, "events", eventId));
      return true;
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Error: " + error.message);
      return false;
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

  // --- UPDATED: Flexible Chat Functions ---

  // 1. Create a new chat (DM or Group)
  // NEW: Initializes visibleTo
  const createChat = async (participantEmails, chatName = "") => {
    try {
      const usersRef = collection(db, "users");
      
      const participants = [];
      const participantIds = [loggedInUser.uid];

      participants.push({
        uid: loggedInUser.uid,
        name: loggedInUser.playerName,
        email: loggedInUser.email
      });

      for (const email of participantEmails) {
        if (email === loggedInUser.email) continue; 

        const q = query(usersRef, where("email", "==", email));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          const userData = userDoc.data();
          
          participantIds.push(userDoc.id);
          participants.push({
            uid: userDoc.id,
            name: userData.playerName || "Unknown",
            email: userData.email
          });
        }
      }

      if (participantIds.length < 2) {
        alert("Could not find any valid users to chat with.");
        return false;
      }

      await addDoc(collection(db, "chats"), {
        type: participantIds.length > 2 ? 'group' : 'dm',
        name: chatName || (participants.length === 2 ? participants[1].name : "Group Chat"),
        participants: participantIds,
        visibleTo: participantIds, // NEW: All participants see it initially
        participantDetails: participants,
        createdAt: serverTimestamp(),
        lastMessage: "Chat created",
        lastMessageTime: serverTimestamp()
      });

      return true;

    } catch (error) {
      console.error("Error creating chat:", error);
      alert("Error: " + error.message);
      return false;
    }
  };

  // 2. Send a message
  // NEW: Updates visibleTo for "Resurrection"
  const sendMessage = async (chatId, text, currentParticipants) => {
    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: text,
        senderId: loggedInUser.uid,
        senderName: loggedInUser.playerName,
        createdAt: serverTimestamp()
      });

      // Update parent chat doc
      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        // NEW: Resurrection Logic
        // Set visibleTo back to the full participants list so it reappears for everyone
        visibleTo: currentParticipants 
      });

      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error: " + error.message);
      return false;
    }
  };

  // 3. Fetch chats for the current user
  // NEW: Queries 'visibleTo' instead of 'participants'
  const fetchUserChats = async (uid) => {
    try {
      const chatsRef = collection(db, "chats");
      // NEW: Only fetch chats where I am in the 'visibleTo' array
      const q = query(chatsRef, where("visibleTo", "array-contains", uid), orderBy("lastMessageTime", "desc"));
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error fetching chats:", error);
      return [];
    }
  };

  // NEW: Hide Chat Function
  const hideChat = async (chatId, currentVisibleTo, chatType) => {
    // Rule: Cannot hide/delete roster chats
    if (chatType === 'roster') {
      alert("Team Roster chats cannot be deleted.");
      return false;
    }

    try {
      // Calculate the new visibility list (remove myself)
      const newVisibleTo = currentVisibleTo.filter(uid => uid !== loggedInUser.uid);

      if (newVisibleTo.length === 0) {
        // If NO ONE can see it anymore, delete the chat document entirely (Cleanup)
        await deleteDoc(doc(db, "chats", chatId));
        console.log("Chat deleted permanently (no visible participants).");
      } else {
        // Otherwise, just update the document to hide it for me
        const chatRef = doc(db, "chats", chatId);
        await updateDoc(chatRef, {
          visibleTo: newVisibleTo
        });
      }
      return true;
    } catch (error) {
      console.error("Error hiding chat:", error);
      alert("Error: " + error.message);
      return false;
    }
  };


  const value = {
    loggedInUser,
    soccerDetails,
    isLoading,
    needsReauth,
    setNeedsReauth,
    signIn,
    signUp,
    signOutUser,
    updateProfile,
    reauthenticate,
    updateSoccerDetails,
    isManager,
    createRoster,
    fetchRosters,
    deleteRoster,
    addPlayerToRoster,
    removePlayerFromRoster,
    fetchUserRosters,
    createEvent,
    fetchEvents,
    deleteEvent,
    fetchAllUserEvents,
    createChat,
    sendMessage,
    fetchUserChats,
    // NEW: Export hideChat
    hideChat
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};