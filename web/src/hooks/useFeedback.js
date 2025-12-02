import { useState, useEffect } from 'react';
import { 
  collection, addDoc, doc, updateDoc, deleteDoc, 
  query, orderBy, onSnapshot, serverTimestamp, increment, 
  arrayUnion, arrayRemove, getDoc 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from '../context/AuthContext';

export const useFeedback = () => {
  const { loggedInUser } = useAuth();
  const [feedbackItems, setFeedbackItems] = useState([]);

  // Subscribe to feedback list
  useEffect(() => {
    const feedbackRef = collection(db, "feedback");
    const q = query(feedbackRef, orderBy("votes", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFeedbackItems(items);
    }, (error) => {
      console.error("Error listening to feedback:", error);
    });

    return () => unsubscribe();
  }, []);

  const createFeedback = async (data) => {
    if (!loggedInUser) return false;
    try {
      await addDoc(collection(db, "feedback"), {
        ...data,
        authorId: loggedInUser.uid,
        authorName: loggedInUser.playerName,
        status: 'Proposed', 
        developerNotes: [], 
        votes: 0,
        voters: [], 
        createdAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Error creating feedback:", error);
      alert("Error submitting feedback: " + error.message);
      return false;
    }
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
        
        // Toggle Vote
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

  // Admin/Developer functions
  const updateFeedbackStatus = async (feedbackId, status) => {
    try {
      const feedbackRef = doc(db, "feedback", feedbackId);
      await updateDoc(feedbackRef, { 
          status,
          statusUpdatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Error updating feedback:", error);
      return false;
    }
  };

  const addDeveloperNote = async (feedbackId, noteText) => {
      if (!loggedInUser) return false;
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
          return false;
      }
  };

  const deleteFeedback = async (feedbackId) => {
    try {
      await deleteDoc(doc(db, "feedback", feedbackId));
      return true;
    } catch (error) {
      console.error("Error deleting feedback:", error);
      return false;
    }
  };

  return {
      feedbackItems,
      createFeedback,
      voteForFeedback,
      updateFeedbackStatus,
      addDeveloperNote,
      deleteFeedback
  };
};