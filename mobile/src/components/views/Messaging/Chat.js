import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { useChat } from '../../../context/ChatContext';
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"; 
import { db } from "../../../lib/firebase"; 

// NEW IMPORT
import ChatHeader from './components/ChatHeader'; 
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';

export default function ChatScreen({ route, navigation }) {
  const { chatId } = route.params; 
  const { loggedInUser } = useAuth();
  const { sendMessage, markChatAsRead, myChats } = useChat();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Get the full chat object to pass to the Header (for Avatar/Name logic)
  const currentChat = myChats.find(c => c.id === chatId);

  // 1. Mark as Read when entering
  useEffect(() => {
    if (chatId) {
      markChatAsRead(chatId);
    }
  }, [chatId, markChatAsRead]);

  // 2. Listen for Messages
  useEffect(() => {
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleSend = async (text) => {
    const participants = currentChat ? currentChat.participants : [];
    await sendMessage(chatId, text, participants);
  };

  const handleOpenDetails = () => {
      navigation.navigate("ChatDetails", { chatId });
  };

  return (
    <View style={styles.container}>
      {/* Use the new specialized ChatHeader */}
      <ChatHeader 
        chat={currentChat} 
        currentUser={loggedInUser}
        onBack={() => navigation.goBack()} 
        onShowDetails={handleOpenDetails}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#61dafb" style={{ marginTop: 20 }} />
      ) : (
        <MessageList messages={messages} currentUser={loggedInUser} />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0} 
      >
        <MessageInput onSend={handleSend} />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
});