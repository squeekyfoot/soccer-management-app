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

  // ... (useEffect for auth state listener remains the same) ...
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

  // ... (signIn, signUp, signOutUser, updateProfile, reauthenticate, updateSoccerDetails, isManager, Roster functions, Event functions REMAIN THE SAME) ...
  
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

  const createRoster = async (rosterName, season, maxCapacity) => {
    if (!isManager()) {
      alert("Only managers can create rosters.");
      return false;
    }
    try {
      await addDoc(collection(db, "rosters"), {
        name: rosterName,
        season: season,
        maxCapacity: Number(maxCapacity),
        createdBy: loggedInUser.uid,
        createdAt: new Date(),
        playerIDs: [],
        players: [] 
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
      const rosterList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return rosterList;
    } catch (error) {
      console.error("Error fetching rosters:", error);
      return [];
    }
  };

  const deleteRoster = async (rosterId) => {
    if (!isManager()) return false;
    try {
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

      const rosterRef = doc(db, "rosters", rosterId);
      
      await updateDoc(rosterRef, {
        playerIDs: arrayUnion(playerDoc.id),
        players: arrayUnion(playerSummary) 
      });

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
      const rosterRef = doc(db, "rosters", rosterId);
      
      await updateDoc(rosterRef, {
        playerIDs: arrayRemove(playerSummary.uid),
        players: arrayRemove(playerSummary)
      });

      return true;
    } catch (error) {
      console.error("Error removing player:", error);
      alert("Error: " + error.message);
      return false;
    }
  };

  const fetchUserRosters = async (uid) => {
    try {
      const rostersRef = collection(db, "rosters");
      const q = query(rostersRef, where("playerIDs", "array-contains", uid));
      
      const querySnapshot = await getDocs(q);
      const rosterList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return rosterList;
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

  // --- NEW: Flexible Chat Functions ---

  // 1. Create a new chat (DM or Group)
  const createChat = async (participantEmails, chatName = "") => {
    try {
      // Convert emails to UIDs and summaries
      const usersRef = collection(db, "users");
      // Note: Firestore 'in' query supports max 10 values
      // For MVP we will loop to find users. Not efficient for large groups but safe.
      
      const participants = [];
      const participantIds = [loggedInUser.uid]; // Add myself first

      // Add myself to summaries
      participants.push({
        uid: loggedInUser.uid,
        name: loggedInUser.playerName,
        email: loggedInUser.email
      });

      for (const email of participantEmails) {
        if (email === loggedInUser.email) continue; // Skip myself

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

      // Create the chat document
      await addDoc(collection(db, "chats"), {
        type: participantIds.length > 2 ? 'group' : 'dm',
        name: chatName || (participants.length === 2 ? participants[1].name : "Group Chat"),
        participants: participantIds, // Array of UIDs for security rules
        participantDetails: participants, // Array of objects for UI
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
  const sendMessage = async (chatId, text) => {
    try {
      // Add message to sub-collection
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: text,
        senderId: loggedInUser.uid,
        senderName: loggedInUser.playerName,
        createdAt: serverTimestamp()
      });

      // Update the parent chat document with the "Last Message" (for the list view)
      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, {
        lastMessage: text,
        lastMessageTime: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error: " + error.message);
      return false;
    }
  };

  // 3. Fetch chats for the current user
  const fetchUserChats = async (uid) => {
    try {
      const chatsRef = collection(db, "chats");
      // Query: chats where 'participants' array contains my UID
      const q = query(chatsRef, where("participants", "array-contains", uid), orderBy("lastMessageTime", "desc"));
      
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
    // NEW: Chat exports
    createChat,
    sendMessage,
    fetchUserChats
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};