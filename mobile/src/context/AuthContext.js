import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateEmail,
  updateProfile as firebaseUpdateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser
} from "firebase/auth";
import { 
  doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, deleteDoc, 
  query, where, arrayUnion, arrayRemove, orderBy, serverTimestamp, 
  deleteField, onSnapshot, increment 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

import { auth, db, storage } from "../lib/firebase"; 

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
      await signInWithEmailAndPassword(auth, email, password);
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
    
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      const displayName = `${formData.firstName} ${formData.lastName}`;
      
      const userProfileData = {
        uid: user.uid,
        firstName: formData.firstName || "",
        lastName: formData.lastName || "",
        preferredName: formData.preferredName || "",
        playerName: displayName,
        email: formData.email,
        phone: formData.phone || "",
        notificationPreference: formData.notificationPreference || "Email",
        emergencyContact: {
            firstName: formData.emergencyContactFirstName || "",
            lastName: formData.emergencyContactLastName || "",
            phone: formData.emergencyContactPhone || "",
            relationship: formData.emergencyContactRelationship || ""
        },
        role: 'player', 
        photoURL: ""
      };
      
      await setDoc(doc(db, "users", user.uid), userProfileData);
      setLoggedInUser(userProfileData);

    } catch (error) {
      console.error("Error signing up:", error);
      alert("Error: " + error.message);

      if (userCredential && userCredential.user) {
        try {
          await deleteUser(userCredential.user);
        } catch (cleanupError) {
          console.error("Failed to cleanup user:", cleanupError);
        }
      }
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
      
      const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          resolve(xhr.response);
        };
        xhr.onerror = function (e) {
          console.log(e);
          reject(new TypeError("Network request failed"));
        };
        xhr.responseType = "blob";
        xhr.open("GET", file.uri, true);
        xhr.send(null);
      });

      await uploadBytes(storageRef, blob);
      blob.close(); 
      
      const url = await getDownloadURL(storageRef);
      return url;

    } catch (error) {
      console.error("Error uploading profile image:", error);
      throw error;
    }
  };

  const uploadImage = async (file, path) => {
    if (!file) return null;
    try {
      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
      
      const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          resolve(xhr.response);
        };
        xhr.onerror = function (e) {
          reject(new TypeError("Network request failed"));
        };
        xhr.responseType = "blob";
        xhr.open("GET", file.uri, true);
        xhr.send(null);
      });

      const snapshot = await uploadBytes(storageRef, blob);
      blob.close();

      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
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

      const displayName = `${profileData.firstName} ${profileData.lastName}`;

      const dataToUpdate = {
        firstName: profileData.firstName ?? "",
        lastName: profileData.lastName ?? "",
        preferredName: profileData.preferredName ?? "",
        playerName: displayName,
        phone: profileData.phone ?? "",
        notificationPreference: profileData.notificationPreference ?? "Email",
        emergencyContact: {
            firstName: profileData.emergencyContactFirstName ?? "",
            lastName: profileData.emergencyContactLastName ?? "",
            phone: profileData.emergencyContactPhone ?? "",
            relationship: profileData.emergencyContactRelationship ?? ""
        },
        email: profileData.email,
        photoURL: photoURL || ""
      };
      
      const userDocRef = doc(db, "users", loggedInUser.uid);
      await updateDoc(userDocRef, dataToUpdate);
      
      await firebaseUpdateProfile(auth.currentUser, {
        displayName: displayName,
        photoURL: photoURL
      });
      
      setLoggedInUser(prevUser => ({
        ...prevUser,
        ...dataToUpdate
      }));

      const chatsRef = collection(db, "chats");
      const q = query(chatsRef, where("participants", "array-contains", loggedInUser.uid));
      const querySnapshot = await getDocs(q);

      const batchPromises = querySnapshot.docs.map(async (chatDoc) => {
        const chatData = chatDoc.data();
        if (chatData.participantDetails) {
          const updatedDetails = chatData.participantDetails.map(p => {
            if (p.uid === loggedInUser.uid) {
              return { 
                ...p, 
                name: displayName, 
                email: profileData.email,
                photoURL: photoURL || "" 
              };
            }
            return p;
          });
          await updateDoc(chatDoc.ref, { participantDetails: updatedDetails });
        }
      });
      
      await Promise.all(batchPromises);
      return true; 
    } catch (error) {
      console.error(error);
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
        currentRosters: (soccerData.currentRosters || "").split(',').map(item => item.trim()),
        rosterJerseysOwned: (soccerData.rosterJerseysOwned || "").split(',').map(item => item.trim()),
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

  const isManager = () => loggedInUser && (loggedInUser.role === 'manager' || loggedInUser.role === 'developer');
  const isDeveloper = () => loggedInUser && loggedInUser.role === 'developer';

  // --- FEEDBACK FUNCTIONS ---

  const createFeedback = async (data) => {
    try {
      await addDoc(collection(db, "feedback"), {
        ...data,
        authorId: loggedInUser.uid,
        authorName: loggedInUser.playerName,
        status: 'Proposed', 
        developerNotes: [], 
        // FIX: Removed 'votes' and 'voters' to comply with Firestore allow-create rule
        createdAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Error creating feedback:", error);
      alert("Error submitting feedback: " + error.message);
      return false;
    }
  };

  const subscribeToFeedback = (callback) => {
    const feedbackRef = collection(db, "feedback");
    // Sort logic handled client-side in FeedbackScreen if votes are missing initially
    const q = query(feedbackRef); 
    
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(items);
    });
  };

  const voteForFeedback = async (feedbackId) => {
    if (!loggedInUser) return;
    try {
      const feedbackRef = doc(db, "feedback", feedbackId);
      const feedbackSnap = await getDoc(feedbackRef);
      
      if (feedbackSnap.exists()) {
        const data = feedbackSnap.data();
        
        if (data.status === 'Completed' || data.status === 'Rejected') {
          alert("Voting is closed for this item.");
          return false;
        }

        // Safe vote toggle even if voters array doesn't exist yet
        if (data.voters && data.voters.includes(loggedInUser.uid)) {
          await updateDoc(feedbackRef, {
             votes: increment(-1),
             voters: arrayRemove(loggedInUser.uid)
          });
        } else {
          await updateDoc(feedbackRef, {
            votes: increment(1),
            voters: arrayUnion(loggedInUser.uid)
          });
        }
        return true;
      }
    } catch (error) {
      console.error("Error voting:", error);
      return false;
    }
  };

  const updateFeedback = async (feedbackId, updates) => {
    if (!isDeveloper()) return false;
    try {
      const feedbackRef = doc(db, "feedback", feedbackId);
      if (updates.status) {
          updates.statusUpdatedAt = serverTimestamp();
      }
      await updateDoc(feedbackRef, updates);
      return true;
    } catch (error) {
      console.error("Error updating feedback:", error);
      alert("Error updating feedback: " + error.message);
      return false;
    }
  };

  const addDeveloperNote = async (feedbackId, noteText) => {
      if (!isDeveloper()) return false;
      try {
          const feedbackRef = doc(db, "feedback", feedbackId);
          const noteObject = {
              text: noteText,
              createdAt: Date.now(),
              author: loggedInUser.playerName
          };
          await updateDoc(feedbackRef, {
              developerNotes: arrayUnion(noteObject)
          });
          return true;
      } catch (error) {
          console.error("Error adding note:", error);
          alert("Error adding note: " + error.message);
          return false;
      }
  };

  const deleteFeedback = async (feedbackId) => {
    if (!isDeveloper()) return false;
    try {
      await deleteDoc(doc(db, "feedback", feedbackId));
      return true;
    } catch (error) {
      console.error("Error deleting feedback:", error);
      alert("Error deleting feedback: " + error.message);
      return false;
    }
  };

  // --- Other existing functions (createRoster, etc.) ---
  // (Keeping these included to maintain full file context)
  
  const createRoster = async (rosterName, season, maxCapacity, isDiscoverable = false, groupCreationData = null, addManagerAsPlayer = false) => {
    if (!isManager()) {
      alert("Only managers can create rosters.");
      return false;
    }
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
        name: rosterName,
        season: season,
        maxCapacity: Number(maxCapacity),
        createdBy: loggedInUser.uid,
        isDiscoverable: isDiscoverable,
        createdAt: new Date(),
        playerIDs: initialPlayerIDs, 
        players: initialPlayers       
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
          email: loggedInUser.email,
          photoURL: loggedInUser.photoURL || ""
        }],
        unreadCounts: { [loggedInUser.uid]: 0 }, 
        createdAt: serverTimestamp(),
        lastMessage: "Team chat created",
        lastMessageTime: serverTimestamp()
      });

      if (groupCreationData && groupCreationData.createGroup) {
          await addDoc(collection(db, "groups"), {
            name: groupCreationData.groupName || rosterName,
            description: `Official group for ${rosterName} (${season})`,
            isPublic: false, 
            createdBy: loggedInUser.uid,
            associatedRosterId: rosterRef.id, 
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
      }

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

      const chatsRef = collection(db, "chats");
      const q = query(chatsRef, where("rosterId", "==", rosterId));
      const querySnapshot = await getDocs(q);

      const batchPromises = querySnapshot.docs.map(async (chatDoc) => {
          const systemMessage = "This team has been disbanded by the manager. This chat is now a regular group.";
          await addDoc(collection(db, "chats", chatDoc.id, "messages"), {
              text: systemMessage,
              type: 'system',
              createdAt: serverTimestamp()
          });
          await updateDoc(chatDoc.ref, {
              type: 'group',
              rosterId: deleteField(),
              lastMessage: systemMessage, 
              lastMessageTime: serverTimestamp() 
          });
      });

      await Promise.all(batchPromises);
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
        email: playerData.email,
        photoURL: playerData.photoURL || ""
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
        await setDoc(chatDoc.ref, {
          participants: arrayUnion(playerDoc.id),
          visibleTo: arrayUnion(playerDoc.id),
          participantDetails: arrayUnion(playerSummary),
          unreadCounts: { [playerDoc.id]: 0 } 
        }, { merge: true });
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
      
      if (!isDeveloper() && (!myMemberDetails || (myMemberDetails.role !== 'owner' && myMemberDetails.role !== 'admin'))) {
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

  const subscribeToIncomingRequests = (callback) => {
    if (!isManager() && !isDeveloper()) return () => {};
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

  const submitJoinRequest = async (rosterId, rosterName, managerId) => {
    try {
       const requestsRef = collection(db, "rosterRequests");
       const q = query(
         requestsRef, 
         where("rosterId", "==", rosterId),
         where("userId", "==", loggedInUser.uid)
       );
       const existing = await getDocs(q);
       if (!existing.empty) {
         alert("You have already sent a request for this team.");
         return false;
       }

       await addDoc(requestsRef, {
         rosterId,
         rosterName,
         managerId,
         userId: loggedInUser.uid,
         userName: loggedInUser.playerName,
         userEmail: loggedInUser.email,
         status: 'pending',
         createdAt: serverTimestamp()
       });
       return true;
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Failed to submit request: " + error.message);
      return false;
    }
  };

  const fetchIncomingRequests = async () => {
    if (!isManager() && !isDeveloper()) return [];
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

  const fetchUserRequests = async () => {
    try {
      const requestsRef = collection(db, "rosterRequests");
      const q = query(requestsRef, where("userId", "==", loggedInUser.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching user requests:", error);
      return [];
    }
  };
  
  const fetchDiscoverableRosters = async () => {
    try {
      const rostersRef = collection(db, "rosters");
      const q = query(rostersRef, where("isDiscoverable", "==", true));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching discoverable rosters:", error);
      return [];
    }
  };

  const fetchPlayerDetails = async (uid) => {
    try {
        const userDocRef = doc(db, "users", uid);
        const userSnap = await getDoc(userDocRef);
        
        if (!userSnap.exists()) return null;

        const soccerDocRef = doc(db, "users", uid, "sportsDetails", "soccer");
        const soccerSnap = await getDoc(soccerDocRef);

        return {
            ...userSnap.data(),
            soccerDetails: soccerSnap.exists() ? soccerSnap.data() : null
        };
    } catch (error) {
        console.error("Error fetching player details:", error);
        return null;
    }
  };

  const respondToRequest = async (request, action, targetGroupId = null) => {
      if (!isManager() && !isDeveloper()) return false;
      
      try {
        if (action === 'approve') {
            const userDocRef = doc(db, "users", request.userId);
            const userSnap = await getDoc(userDocRef);
            
            if (!userSnap.exists()) {
                alert("User no longer exists.");
                await deleteDoc(doc(db, "rosterRequests", request.id));
                return false;
            }
            
            const userData = userSnap.data();
            const playerSummary = {
                uid: request.userId,
                playerName: userData.playerName || "Unknown",
                email: userData.email,
                photoURL: userData.photoURL || ""
            };

            // 1. Add to Roster
            const rosterRef = doc(db, "rosters", request.rosterId);
            await updateDoc(rosterRef, {
                playerIDs: arrayUnion(request.userId),
                players: arrayUnion(playerSummary)
            });

            // 2. Add to Chat
            const chatsRef = collection(db, "chats");
            const chatQ = query(chatsRef, where("rosterId", "==", request.rosterId));
            const chatSnapshot = await getDocs(chatQ);

            if (!chatSnapshot.empty) {
                const chatDoc = chatSnapshot.docs[0];
                await setDoc(chatDoc.ref, {
                participants: arrayUnion(request.userId),
                visibleTo: arrayUnion(request.userId),
                participantDetails: arrayUnion(playerSummary),
                unreadCounts: { [request.userId]: 0 } 
                }, { merge: true });
            }

            // 3. Add to Targeted Group (if selected)
            if (targetGroupId) {
                const groupRef = doc(db, "groups", targetGroupId);
                const groupSnap = await getDoc(groupRef);
                
                if (groupSnap.exists()) {
                    await updateDoc(groupRef, {
                        members: arrayUnion(request.userId),
                        memberDetails: arrayUnion({
                            uid: request.userId,
                            name: userData.playerName || "Unknown",
                            email: userData.email,
                            photoURL: userData.photoURL || "",
                            role: 'member'
                        })
                    });
                }
            }
        }
        
        await deleteDoc(doc(db, "rosterRequests", request.id));
        return true;
      } catch (error) {
          console.error("Error responding to request:", error);
          alert("Error: " + error.message);
          return false;
      }
  };

  // --- VALUE OBJECT ---
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
    isDeveloper, 
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
    uploadImage,
    createGroup,
    fetchUserGroups,
    createGroupPost,
    addGroupMembers,
    updateGroupMemberRole,
    transferGroupOwnership,
    removeGroupMember,
    fetchDiscoverableRosters, 
    submitJoinRequest,        
    fetchIncomingRequests,    
    fetchUserRequests,        
    respondToRequest,
    subscribeToIncomingRequests,
    subscribeToUserRequests,
    subscribeToDiscoverableRosters,
    fetchPlayerDetails,
    createFeedback,
    subscribeToFeedback,
    voteForFeedback,
    updateFeedback, 
    deleteFeedback,  
    addDeveloperNote 
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};