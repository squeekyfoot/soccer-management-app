import { useState, useCallback } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp, arrayUnion, getDoc, getDocs, query, where, deleteField } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from '../context/AuthContext';

export const useGroupManager = () => {
  const { loggedInUser } = useAuth();

  const createGroup = useCallback(async (groupData) => {
    if (!loggedInUser) return false;
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
      return false;
    }
  }, [loggedInUser]);

  // FIX: Wrapped in useCallback to prevent infinite loops in Community.js
  const fetchUserGroups = useCallback(async (uid = loggedInUser?.uid) => {
    if (!uid) {
        // Silent return or debug log if needed, but safe to return empty
        return [];
    }
    
    try {
      const groupsRef = collection(db, "groups");
      const q = query(groupsRef, where("members", "array-contains", uid));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching groups:", error);
      return [];
    }
  }, [loggedInUser]);

  const linkGroupToRoster = useCallback(async (groupId, rosterId) => {
      try {
          const groupRef = doc(db, "groups", groupId);
          await updateDoc(groupRef, { associatedRosterId: rosterId });
          return true;
      } catch (e) {
          console.error(e);
          return false;
      }
  }, []);

  const unlinkGroupFromRoster = useCallback(async (groupId) => {
      try {
          const groupRef = doc(db, "groups", groupId);
          await updateDoc(groupRef, { associatedRosterId: deleteField() });
          return true;
      } catch (e) {
          console.error(e);
          return false;
      }
  }, []);

  const addGroupMembers = useCallback(async (groupId, emails) => {
    try {
      const groupRef = doc(db, "groups", groupId);
      const groupSnap = await getDoc(groupRef);
      if (!groupSnap.exists()) return false;
      
      const groupData = groupSnap.data();
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

      if (newMemberIds.length > 0) {
        await updateDoc(groupRef, {
            members: arrayUnion(...newMemberIds),
            memberDetails: arrayUnion(...newMembers)
        });
      }
      return true;
    } catch (error) {
      console.error("Error adding group members:", error);
      return false;
    }
  }, []);

  return {
      createGroup,
      fetchUserGroups,
      linkGroupToRoster,
      unlinkGroupFromRoster,
      addGroupMembers
  };
};