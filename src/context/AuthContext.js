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
  query, where, arrayUnion, arrayRemove 
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
          console.error("No user profile found!");
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

  // --- NEW: Fetch Rosters for the CURRENT USER ---
  // This allows a player to see which teams they are on
  const fetchUserRosters = async (uid) => {
    try {
      // Query rosters where the 'playerIDs' array contains this user's UID
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
    // NEW: Export this
    fetchUserRosters
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};