import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  collection, addDoc, updateDoc, doc, 
  query, where, orderBy, onSnapshot, serverTimestamp, increment, 
  getDocs, getDoc, arrayUnion, deleteField 
} from "firebase/firestore"; 
import { db } from "../config/firebase"; 
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => {
  return useContext(ChatContext);
};

export const ChatProvider = ({ children }) => {
  const { loggedInUser } = useAuth();
  const [myChats, setMyChats] = useState([]);

  // 1. GLOBAL LISTENER
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

  // 2. MARK READ (Stabilized with useCallback)
  const markChatAsRead = useCallback(async (chatId) => {
    if (!loggedInUser) return;
    try {
      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, {
        [`unreadCounts.${loggedInUser.uid}`]: 0
      });
    } catch (error) {
      console.error("Error marking read:", error);
    }
  }, [loggedInUser]);

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

      // Resolve other emails
      for (const email of participantEmails) {
        if (email === loggedInUser.email) continue; 
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);
        
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

      // Check for existing
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
        createdAt: serverTimestamp(),
        type: 'text'
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

  // 5. UPDATE GROUP PHOTO
  const updateGroupPhoto = async (chatId, photoURL) => {
    try {
      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, { photoURL: photoURL });

      const systemMsgText = `${loggedInUser.playerName} changed the group photo.`;
      
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: systemMsgText,
        type: 'system',
        createdAt: serverTimestamp()
      });

      await updateDoc(chatRef, {
        lastMessage: systemMsgText,
        lastMessageTime: new Date()
      });

      return true;
    } catch (error) {
      console.error("Error updating group photo:", error);
      return false;
    }
  };

  // 6. ADD PARTICIPANT
  const addParticipant = async (chatId, newEmail, includeHistory) => {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", newEmail));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            alert("User not found.");
            return false;
        }

        const userDoc = querySnapshot.docs[0];
        const newUser = {
            uid: userDoc.id,
            name: userDoc.data().playerName || "Unknown",
            email: userDoc.data().email,
            photoURL: userDoc.data().photoURL || ""
        };

        const chatRef = doc(db, "chats", chatId);
        const chatSnap = await getDoc(chatRef);
        const chatData = chatSnap.data();

        if (chatData.participants.includes(newUser.uid)) {
            alert("User is already in the group.");
            return false;
        }

        // Basic Update
        let updateData = {
            participants: arrayUnion(newUser.uid),
            visibleTo: arrayUnion(newUser.uid),
            participantDetails: arrayUnion(newUser),
            [`unreadCounts.${newUser.uid}`]: 0
        };

        if (!includeHistory) {
             // Hide history -> Set timestamp
             updateData[`hiddenHistory.${newUser.uid}`] = serverTimestamp();
        } else {
             // Show history -> EXPLICITLY DELETE any old restriction
             updateData[`hiddenHistory.${newUser.uid}`] = deleteField();
        }

        // 1. Update Chat Doc
        await updateDoc(chatRef, updateData);

        // 2. Add System Message
        const systemMsgText = `${loggedInUser.playerName} added ${newUser.name} to the group.`;
        await addDoc(collection(db, "chats", chatId, "messages"), {
            text: systemMsgText,
            type: 'system',
            createdAt: serverTimestamp()
        });

        // 3. Update Last Message
        await updateDoc(chatRef, {
            lastMessage: systemMsgText,
            lastMessageTime: new Date()
        });

        return true;
    } catch (error) {
        console.error("Error adding participant:", error);
        alert("Error adding user: " + error.message);
        return false;
    }
  };

  // 7. LEAVE/HIDE CHAT
  const hideChat = async (chatId, currentVisibleTo) => {
    try {
      const newVisibleTo = currentVisibleTo.filter(uid => uid !== loggedInUser.uid);
      if (newVisibleTo.length === 0) {
        const chatRef = doc(db, "chats", chatId);
        await updateDoc(chatRef, { visibleTo: [] });
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

  const leaveChat = async (chatId) => {
    try {
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) return false;

      const chatData = chatSnap.data();
      
      const updatedParticipants = chatData.participants.filter(uid => uid !== loggedInUser.uid);
      const updatedVisibleTo = chatData.visibleTo.filter(uid => uid !== loggedInUser.uid);
      const updatedDetails = chatData.participantDetails.filter(p => p.uid !== loggedInUser.uid);

      await updateDoc(chatRef, {
        participants: updatedParticipants,
        visibleTo: updatedVisibleTo,
        participantDetails: updatedDetails
      });

      const systemMsgText = `${loggedInUser.playerName} left the group.`;
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: systemMsgText,
        type: 'system',
        createdAt: serverTimestamp()
      });
      
      await updateDoc(chatRef, {
        lastMessage: systemMsgText,
        lastMessageTime: new Date()
      });

      return true;
    } catch (error) {
      console.error("Error leaving chat:", error);
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

  const value = {
    myChats,
    createChat,
    sendMessage,
    updateGroupPhoto,
    addParticipant,
    leaveChat,
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