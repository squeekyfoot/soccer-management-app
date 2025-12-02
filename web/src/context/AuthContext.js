import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, arrayUnion, arrayRemove, orderBy, serverTimestamp, deleteField } from "firebase/firestore";
import { auth, db } from "../lib/firebase"; 
import { useStorage } from '../hooks/useStorage';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [soccerDetails, setSoccerDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsReauth, setNeedsReauth] = useState(false);
  const { upload, remove } = useStorage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        const soccerDocRef = doc(db, "users", user.uid, "sportsDetails", "soccer");
        const soccerDoc = await getDoc(soccerDocRef);

        if (userDoc.exists()) {
          // CRITICAL FIX: Merge the UID from the auth object with the Firestore data
          setLoggedInUser({ uid: user.uid, ...userDoc.data() });
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

  // --- AUTH FUNCTIONS ---
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
        alert("Password must be 6+ chars.");
        return;
    }
    
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      const displayName = `${formData.firstName} ${formData.lastName}`;
      
      const userProfileData = {
        uid: user.uid, // Explicitly save UID
        firstName: formData.firstName,
        lastName: formData.lastName,
        preferredName: formData.preferredName,
        playerName: displayName,
        email: formData.email,
        phone: formData.phone,
        notificationPreference: formData.notificationPreference,
        emergencyContact: {
            firstName: formData.emergencyContactFirstName,
            lastName: formData.emergencyContactLastName,
            phone: formData.emergencyContactPhone,
            relationship: formData.emergencyContactRelationship
        },
        role: 'player', 
        photoURL: ""
      };
      
      await setDoc(doc(db, "users", user.uid), userProfileData);
      // Ensure local state has it immediately
      setLoggedInUser(userProfileData);

    } catch (error) {
      console.error("Error signing up:", error);
      alert("Error: " + error.message);
      if (userCredential?.user) await deleteUser(userCredential.user);
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setLoggedInUser(null);
      setSoccerDetails(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const updateProfile = async (profileData, newImageFile = null, removeImage = false) => {
    if (!loggedInUser) return;

    if (profileData.email !== loggedInUser.email) {
      try {
        await updateEmail(auth.currentUser, profileData.email);
      } catch (error) {
        if (error.code === 'auth/requires-recent-login') setNeedsReauth(true);
        else alert("Error: " + error.message);
        return;
      }
    }

    try {
      let photoURL = loggedInUser.photoURL;

      if (removeImage) {
        await remove(`users/${loggedInUser.uid}/profile.jpg`);
        photoURL = "";
      } else if (newImageFile) {
        photoURL = await upload(newImageFile, `users/${loggedInUser.uid}/profile.jpg`);
      }

      const displayName = `${profileData.firstName} ${profileData.lastName}`;
      const dataToUpdate = {
        ...profileData,
        playerName: displayName,
        photoURL: photoURL || ""
      };
      
      await updateDoc(doc(db, "users", loggedInUser.uid), dataToUpdate);
      await firebaseUpdateProfile(auth.currentUser, { displayName, photoURL });
      
      // Preserve UID in local state update
      setLoggedInUser(prev => ({ ...prev, ...dataToUpdate, uid: loggedInUser.uid }));

      // Denormalize updates to chats
      const chatsRef = collection(db, "chats");
      const q = query(chatsRef, where("participants", "array-contains", loggedInUser.uid));
      const querySnapshot = await getDocs(q);

      const batchPromises = querySnapshot.docs.map(async (chatDoc) => {
        const chatData = chatDoc.data();
        if (chatData.participantDetails) {
          const updatedDetails = chatData.participantDetails.map(p => 
            p.uid === loggedInUser.uid ? { ...p, name: displayName, email: profileData.email, photoURL: photoURL || "" } : p
          );
          await updateDoc(chatDoc.ref, { participantDetails: updatedDetails });
        }
      });
      await Promise.all(batchPromises);
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
      await updateDoc(doc(db, "users", loggedInUser.uid), { email: newEmail });

      setLoggedInUser(prev => ({ ...prev, email: newEmail }));
      setNeedsReauth(false); 
      return true; 
    } catch (error) {
      alert("Error: " + error.message);
      return false;
    }
  };

  const updateSoccerDetails = async (soccerData) => {
    if (!loggedInUser) return;
    try {
      const data = {
        ...soccerData,
        currentRosters: typeof soccerData.currentRosters === 'string' ? soccerData.currentRosters.split(',') : soccerData.currentRosters,
        rosterJerseysOwned: typeof soccerData.rosterJerseysOwned === 'string' ? soccerData.rosterJerseysOwned.split(',') : soccerData.rosterJerseysOwned,
        playerNumber: Number(soccerData.playerNumber) || 0,
      };
      await setDoc(doc(db, "users", loggedInUser.uid, "sportsDetails", "soccer"), data);
      setSoccerDetails(data);
      return true; 
    } catch (error) {
      alert("Error: " + error.message);
      return false;
    }
  };

  // --- ROLE HELPERS ---
  const isManager = useCallback(() => {
    return loggedInUser && (loggedInUser.role === 'manager' || loggedInUser.role === 'developer');
  }, [loggedInUser]);

  const isDeveloper = useCallback(() => {
    return loggedInUser && loggedInUser.role === 'developer';
  }, [loggedInUser]);

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
    isDeveloper  
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};