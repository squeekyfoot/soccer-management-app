import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, query, where, orderBy, onSnapshot 
} from "firebase/firestore"; 
import { db } from "../lib/firebase"; 
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => {
  return useContext(ChatContext);
};

export const ChatProvider = ({ children }) => {
  const { loggedInUser } = useAuth();
  const [myChats, setMyChats] = useState([]);

  // GLOBAL LISTENER
  // We keep this in Context because it's likely used by your Sidebar or Navbar 
  // to show unread badges regardless of what view you are in.
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

  const value = {
    myChats // Only exposing the list state
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};