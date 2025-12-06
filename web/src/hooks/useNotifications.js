import { useState, useCallback, useEffect } from 'react';
import { 
  collection, addDoc, updateDoc, doc, deleteDoc, 
  query, where, onSnapshot, serverTimestamp, getDoc 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from '../context/AuthContext';

export const useNotifications = () => {
  const { loggedInUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // --- LISTENER ---
  useEffect(() => {
    if (!loggedInUser) {
        setNotifications([]);
        return;
    }
    
    const notifRef = collection(db, "notifications");
    const q = query(
        notifRef, 
        where("recipientId", "==", loggedInUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort client side (descending) since we didn't add createdAt index yet
      notifs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [loggedInUser]);

  // --- ACTIONS ---

  const sendReferral = async (managerId, playerId, playerName) => {
    if (!loggedInUser) return false;
    try {
      await addDoc(collection(db, "notifications"), {
        recipientId: managerId,
        senderId: loggedInUser.uid,
        senderName: loggedInUser.playerName,
        type: 'PLAYER_REFERRAL',
        read: false,
        createdAt: serverTimestamp(),
        payload: {
            targetPlayerId: playerId,
            targetPlayerName: playerName,
            message: `${loggedInUser.playerName} thinks ${playerName} would be a good fit for your team.`
        }
      });
      return true;
    } catch (error) {
      console.error("Error sending referral:", error);
      return false;
    }
  };

  const sendResponseNotification = async (recipientId, type, message, teamName) => {
    // type: 'OFFER_ACCEPTED' | 'OFFER_REJECTED'
    if (!loggedInUser) return false;
    try {
        await addDoc(collection(db, "notifications"), {
            recipientId: recipientId,
            senderId: loggedInUser.uid,
            senderName: loggedInUser.playerName,
            type: type,
            read: false,
            createdAt: serverTimestamp(),
            payload: {
                teamName: teamName,
                message: message
            }
        });
        return true;
    } catch (error) {
        console.error("Error sending response notification:", error);
        return false;
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true
      });
    } catch (error) {
      console.error("Error marking read:", error);
    }
  };

  const dismissNotification = async (notificationId) => {
    try {
      await deleteDoc(doc(db, "notifications", notificationId));
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };

  return {
    notifications,
    unreadCount,
    sendReferral,
    sendResponseNotification,
    markAsRead,
    dismissNotification
  };
};