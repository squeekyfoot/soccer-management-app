import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, addDoc, setDoc, updateDoc, deleteDoc, doc, 
  query, where, orderBy, onSnapshot, serverTimestamp, increment 
} from "firebase/firestore";
import { db } from "../firebase"; 
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => {
  return useContext(ChatContext);
};

export const ChatProvider = ({ children }) => {
  const { loggedInUser } = useAuth();
  const [myChats, setMyChats] = useState([]);

  // 1. GLOBAL LISTENER: Fetch chats for the logged-in user
  useEffect(() => {
    if (!loggedInUser) {
      setMyChats([]);
      return;
    }

    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef, 
      where("visibleTo", "array-contains", loggedInUser.uid), 
      orderBy("lastMessageTime", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMyChats(chats);
    }, (error) => {
      console.error("Error listening to chat list:", error);
    });

    return () => unsubscribe();
  }, [loggedInUser]);

  // 2. MARK READ
  const markChatAsRead = async (chatId) => {
    if (!loggedInUser) return;
    try {
      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, {
        [`unreadCounts.${loggedInUser.uid}`]: 0
      });
    } catch (error) {
      // Fallback for older documents without the field
      try {
        const chatRef = doc(db, "chats", chatId);
        await setDoc(chatRef, {
          unreadCounts: { [loggedInUser.uid]: 0 }
        }, { merge: true });
      } catch (e) {
        console.error("Error marking read:", e);
      }
    }
  };

  // 3. CREATE CHAT
  const createChat = async (participantEmails, chatName = "") => {
    try {
      const usersRef = collection(db, "users");
      const participants = [];
      const participantIds = [loggedInUser.uid];

      // Add self
      participants.push({
        uid: loggedInUser.uid,
        name: loggedInUser.playerName,
        email: loggedInUser.email,
        photoURL: loggedInUser.photoURL || "" 
      });

      // Resolve other emails to Users
      for (const email of participantEmails) {
        if (email === loggedInUser.email) continue; 
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await import("firebase/firestore").then(mod => mod.getDocs(q));
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          participantIds.push(userDoc.id);
          participants.push({
            uid: userDoc.id,
            name: userData.playerName || "Unknown",
            email: userData.email,
            photoURL: userData.photoURL || "" 
          });
        }
      }

      if (participantIds.length < 2) {
        alert("Could not find any valid users to chat with.");
        return false;
      }

      // Check for existing 1:1 or exact group match
      // (Note: We are doing a client-side check on the 'myChats' we already loaded)
      const existingChat = myChats.find(c => {
        if (c.participants.length !== participantIds.length) return false;
        return participantIds.every(id => c.participants.includes(id));
      });

      if (existingChat) {
        const chatRef = doc(db, "chats", existingChat.id);
        if (!existingChat.visibleTo.includes(loggedInUser.uid)) {
           await updateDoc(chatRef, {
             visibleTo: arrayUnion(loggedInUser.uid)
           });
        }
        return { 
          id: existingChat.id, 
          participants: existingChat.participants,
          name: existingChat.name, 
          ...existingChat
        };
      }

      // Create New
      const initialUnread = {};
      participantIds.forEach(uid => initialUnread[uid] = 0);

      const docRef = await addDoc(collection(db, "chats"), {
        type: participantIds.length > 2 ? 'group' : 'dm',
        name: chatName || (participants.length === 2 ? participants[1].name : "Group Chat"),
        participants: participantIds,
        visibleTo: participantIds,
        participantDetails: participants,
        unreadCounts: initialUnread,
        createdAt: serverTimestamp(),
        lastMessage: "Chat created",
        lastMessageTime: new Date() 
      });
      
      return { id: docRef.id, participants: participantIds, participantDetails: participants }; 

    } catch (error) {
      console.error("Error creating chat:", error);
      alert("Error: " + error.message);
      return false;
    }
  };

  // 4. SEND MESSAGE
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

      const visibleToUpdate = currentParticipants || [loggedInUser.uid];
      const updatePayload = {
        lastMessage: summary,
        lastMessageTime: new Date(),
        visibleTo: visibleToUpdate
      };

      const unreadUpdates = {};
      if (currentParticipants) {
        currentParticipants.forEach(uid => {
          if (uid !== loggedInUser.uid) {
            unreadUpdates[`unreadCounts.${uid}`] = increment(1);
          }
        });
      }

      await updateDoc(chatRef, { ...updatePayload, ...unreadUpdates });
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error: " + error.message);
      return false;
    }
  };

  // 5. ADMIN / UTILS
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
        await updateDoc(chatRef, { visibleTo: newVisibleTo });
      }
      return true;
    } catch (error) {
      console.error("Error hiding chat:", error);
      return false;
    }
  };

  const renameChat = async (chatId, newName) => {
    try {
      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, { name: newName });
      return true;
    } catch (error) {
      console.error("Error renaming chat:", error);
      return false;
    }
  };

  // Need this for arrayUnion in createChat
  const { arrayUnion } = require("firebase/firestore"); 

  const value = {
    myChats,
    createChat,
    sendMessage,
    hideChat,
    renameChat,
    markChatAsRead
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};