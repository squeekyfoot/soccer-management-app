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
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase"; // Your firebase.js file

// 1. Create the Context
// This is the "channel" components will listen to.
const AuthContext = createContext();

// 2. Create a "hook"
// This is a simple shortcut so components can just call `useAuth()`
// instead of the more complex `useContext(AuthContext)`.
export const useAuth = () => {
  return useContext(AuthContext);
};

// 3. Create the "Provider"
// This is the component that does all the work.
// It will hold all the state and logic.
export const AuthProvider = ({ children }) => {
  // --- All our global state lives here ---
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [soccerDetails, setSoccerDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsReauth, setNeedsReauth] = useState(false);

  // --- Core Auth Logic (runs on app start) ---
  useEffect(() => {
    // onAuthStateChanged is the listener that checks login status
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is logged in. Fetch their data.
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
        // User is logged out.
        setLoggedInUser(null);
        setSoccerDetails(null);
      }
      setIsLoading(false);
    });

    // Cleanup the listener when the app closes
    return () => unsubscribe();
  }, []); // Empty array = runs once on mount

  // --- All our functions now live here ---
  
  // Note: These functions now take arguments (email, password, etc.)
  // that are passed up from the component forms.

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
        role: 'player' // <--- NEW WAY: Default role
      };
      
      await setDoc(doc(db, "users", user.uid), userProfileData);
      setLoggedInUser(userProfileData);
      // No need to clear forms here, the component will do that.
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

    // 1. Handle Email Update (if necessary)
    if (profileData.email !== loggedInUser.email) {
      try {
        await updateEmail(auth.currentUser, profileData.email);
      } catch (error) {
        if (error.code === 'auth/requires-recent-login') {
          setNeedsReauth(true); // Open the modal
        } else {
          alert("Error: " + error.message);
        }
        return; // Stop the function
      }
    }

    // 2. Handle Firestore Document Update
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
      
      // 3. Update local state
      setLoggedInUser(prevUser => ({
        ...prevUser,
        ...dataToUpdate
      }));
      
      alert("Profile successfully updated!");
      return true; // Signal to the component that it can close the form
      
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
      
      // Retry the email update
      await updateEmail(auth.currentUser, newEmail);
      
      // Update Firestore
      const userDocRef = doc(db, "users", loggedInUser.uid);
      await updateDoc(userDocRef, { email: newEmail });

      // Update local state
      setLoggedInUser(prevUser => ({
        ...prevUser,
        email: newEmail
      }));

      alert("Email successfully updated!");
      setNeedsReauth(false); // Close the modal
      return true; // Signal success

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
      
      setSoccerDetails(soccerDataToSave); // Update global state
      alert("Soccer info saved!");
      return true; // Signal success

    } catch (error) {
      alert("Error: " + error.message);
      return false;
    }
  };

    // --- NEW: Helper function to check roles ---
  const isManager = () => {
    return loggedInUser && loggedInUser.role === 'manager';
  };

  // 4. "Provide" the state and functions to the app
  // Any component inside <AuthProvider> can now access these values.
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
    isManager
  };

  return (
    <AuthContext.Provider value={value}>
      {/* We render children so the rest of the app appears */}
      {children}
    </AuthContext.Provider>
  );
};
