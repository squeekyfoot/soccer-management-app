import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateEmail,
  updateProfile as firebaseUpdateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "firebase/auth";
import { 
  doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, deleteDoc, 
  query, where, arrayUnion, arrayRemove, orderBy, serverTimestamp 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { auth, db, storage } from "../firebase"; 

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
        role: 'player',
        photoURL: ""
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

  const uploadProfileImage = async (file, uid) => {
    if (!file) return null;
    try {
      const storageRef = ref(storage, `users/${uid}/profile.jpg`);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Error uploading profile image:", error);
      throw error;
    }
  };

  const deleteProfileImage = async (uid) => {
    try {
      const storageRef = ref(storage, `users/${uid}/profile.jpg`);
      await deleteObject(storageRef);
    } catch (error) {
      console.warn("Error deleting image (might not exist):", error);
    }
  };

  const updateProfile = async (profileData, newImageFile = null, removeImage = false) => {
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
      let photoURL = loggedInUser.photoURL;

      if (removeImage) {
        await deleteProfileImage(loggedInUser.uid);
        photoURL = "";
      } else if (newImageFile) {
        photoURL = await uploadProfileImage(newImageFile, loggedInUser.uid);
      }

      const dataToUpdate = {
        playerName: profileData.playerName,
        phone: profileData.phone,
        address: profileData.address,
        notificationPreference: profileData.notificationPreference,
        comments: profileData.comments,
        email: profileData.email,
        photoURL: photoURL || ""
      };
      
      const userDocRef = doc(db, "users", loggedInUser.uid);
      await updateDoc(userDocRef, dataToUpdate);
      
      await firebaseUpdateProfile(auth.currentUser, {
        displayName: profileData.playerName,
        photoURL: photoURL
      });
      
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
      const rosterRef = await addDoc(collection(db, "rosters"), {
        name: rosterName,
        season: season,
        maxCapacity: Number(maxCapacity),
        createdBy: loggedInUser.uid,
        createdAt: new Date(),
        playerIDs: [],
        players: [] 
      });

      await addDoc(collection(db, "chats"), {
        type: 'roster', 
        rosterId: rosterRef.id,
        name: `${rosterName} (${season})`,
        participants: [loggedInUser.uid],
        visibleTo: [loggedInUser.uid],
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

      const chatsRef = collection(db, "chats");
      const chatQ = query(chatsRef, where("rosterId", "==", rosterId));
      const chatSnapshot = await getDocs(chatQ);

      if (!chatSnapshot.empty) {
        const chatDoc = chatSnapshot.docs[0];
        await updateDoc(chatDoc.ref, {
          participants: arrayUnion(playerDoc.id),
          visibleTo: arrayUnion(playerDoc.id),
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
      const rosterRef = doc(db, "rosters", rosterId);
      await updateDoc(rosterRef, {
        playerIDs: arrayRemove(playerSummary.uid),
        players: arrayRemove(playerSummary)
      });

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

  const uploadImage = async (file, path) => {
    if (!file) return null;
    try {
      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  // --- FIXED: createChat returns Object ---
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

      const docRef = await addDoc(collection(db, "chats"), {
        type: participantIds.length > 2 ? 'group' : 'dm',
        name: chatName || (participants.length === 2 ? participants[1].name : "Group Chat"),
        participants: participantIds,
        visibleTo: participantIds,
        participantDetails: participants,
        createdAt: serverTimestamp(),
        lastMessage: "Chat created",
        lastMessageTime: new Date() // FIXED: Use new Date() for immediate sort availability
      });
      
      // CORRECT: Returns object with ID and participants
      return { id: docRef.id, participants: participantIds }; 

    } catch (error) {
      console.error("Error creating chat:", error);
      alert("Error: " + error.message);
      return false;
    }
  };

  const sendMessage = async (chatId, text, currentParticipants, imageUrl = null) => {
    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: text,
        imageUrl: imageUrl,
        senderId: loggedInUser.uid,
        senderName: loggedInUser.playerName,
        createdAt: serverTimestamp()
      });

      const chatRef = doc(db, "chats", chatId);
      let summary = text;
      if (imageUrl) {
        summary = text ? `📷 ${text}` : "📷 Sent an image";
      }

      // FIXED: Fallback if currentParticipants is somehow missing/null
      // (Though it shouldn't be with the fix in createChat/TeamChat)
      const visibleToUpdate = currentParticipants || [loggedInUser.uid];

      await updateDoc(chatRef, {
        lastMessage: summary,
        lastMessageTime: new Date(), // FIXED: Use new Date()
        visibleTo: visibleToUpdate
      });

      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error: " + error.message);
      return false;
    }
  };

  const fetchUserChats = async (uid) => {
    try {
      const chatsRef = collection(db, "chats");
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

  const hideChat = async (chatId, currentVisibleTo, chatType) => {
    if (chatType === 'roster') {
      alert("Team Roster chats cannot be deleted.");
      return false;
    }
    try {
      const newVisibleTo = currentVisibleTo.filter(uid => uid !== loggedInUser.uid);
      if (newVisibleTo.length === 0) {
        await deleteDoc(doc(db, "chats", chatId));
      } else {
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

  const createGroup = async (groupData) => {
     try {
      await addDoc(collection(db, "groups"), {
        ...groupData,
        createdBy: loggedInUser.uid,
        createdAt: serverTimestamp(),
        members: [loggedInUser.uid], 
        memberDetails: [{
          uid: loggedInUser.uid,
          name: loggedInUser.playerName,
          email: loggedInUser.email,
          photoURL: loggedInUser.photoURL || "",
          role: 'owner' 
        }]
      });
      return true;
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Error: " + error.message);
      return false;
    }
  };

  const fetchUserGroups = async (uid) => {
    try {
      const groupsRef = collection(db, "groups");
      const q = query(groupsRef, where("members", "array-contains", uid));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching groups:", error);
      return [];
    }
  };

  const createGroupPost = async (groupId, text, imageUrl = null) => {
     try {
      await addDoc(collection(db, "groups", groupId, "posts"), {
        text: text,
        imageUrl: imageUrl,
        authorId: loggedInUser.uid,
        authorName: loggedInUser.playerName,
        authorPhoto: loggedInUser.photoURL || "",
        createdAt: serverTimestamp(),
        replies: [] 
      });
      return true;
    } catch (error) {
      console.error("Error creating post:", error);
      return false;
    }
  };

  const addGroupMembers = async (groupId, emails) => {
    try {
      const groupRef = doc(db, "groups", groupId);
      const groupSnap = await getDoc(groupRef);
      
      if (!groupSnap.exists()) return false;
      
      const groupData = groupSnap.data();
      const myMemberDetails = groupData.memberDetails.find(m => m.uid === loggedInUser.uid);
      
      if (!myMemberDetails || (myMemberDetails.role !== 'owner' && myMemberDetails.role !== 'admin')) {
        alert("Only Owners and Admins can add members.");
        return false;
      }

      const usersRef = collection(db, "users");
      const newMembers = [];
      const newMemberIds = [];

      for (const email of emails) {
        const q = query(usersRef, where("email", "==", email));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          const userData = userDoc.data();
          
          if (!groupData.members.includes(userDoc.id)) {
             newMemberIds.push(userDoc.id);
             newMembers.push({
               uid: userDoc.id,
               name: userData.playerName || "Unknown",
               email: userData.email,
               photoURL: userData.photoURL || "",
               role: 'member'
             });
          }
        }
      }

      if (newMemberIds.length === 0) {
        return true; 
      }

      await updateDoc(groupRef, {
        members: arrayUnion(...newMemberIds),
        memberDetails: arrayUnion(...newMembers)
      });
      return true;
    } catch (error) {
      console.error("Error adding group members:", error);
      alert("Error adding members: " + error.message);
      return false;
    }
  };

  const updateGroupMemberRole = async (groupId, memberUid, newRole, currentMemberDetails) => {
    try {
      const groupRef = doc(db, "groups", groupId);
      const updatedMemberDetails = currentMemberDetails.map(member => {
        if (member.uid === memberUid) {
          return { ...member, role: newRole };
        }
        return member;
      });
      await updateDoc(groupRef, { memberDetails: updatedMemberDetails });
      return true;
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Error updating role: " + error.message);
      return false;
    }
  };

  const transferGroupOwnership = async (groupId, newOwnerUid, currentMemberDetails) => {
    try {
      const groupRef = doc(db, "groups", groupId);
      const updatedMemberDetails = currentMemberDetails.map(member => {
        if (member.uid === loggedInUser.uid) {
          return { ...member, role: 'admin' }; 
        }
        if (member.uid === newOwnerUid) {
          return { ...member, role: 'owner' };
        }
        return member;
      });
      await updateDoc(groupRef, { memberDetails: updatedMemberDetails });
      return true;
    } catch (error) {
      console.error("Error transferring ownership:", error);
      alert("Error transferring ownership: " + error.message);
      return false;
    }
  };

  const removeGroupMember = async (groupId, memberUid, currentMemberDetails, currentMembers) => {
    try {
      const groupRef = doc(db, "groups", groupId);
      const updatedMemberDetails = currentMemberDetails.filter(m => m.uid !== memberUid);
      const updatedMembers = currentMembers.filter(uid => uid !== memberUid);

      await updateDoc(groupRef, {
        memberDetails: updatedMemberDetails,
        members: updatedMembers
      });
      
      return true;
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Error removing member: " + error.message);
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
    hideChat,
    uploadImage,
    createGroup,
    fetchUserGroups,
    createGroupPost,
    addGroupMembers,
    updateGroupMemberRole,
    transferGroupOwnership,
    removeGroupMember
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};