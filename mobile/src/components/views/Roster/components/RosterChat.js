import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useAuth } from '../../../../context/AuthContext';
import { useChat } from '../../../../context/ChatContext';
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"; 
import { db } from "../../../../lib/firebase"; 

import MessageList from '../../Messaging/components/MessageList';
import MessageInput from '../../Messaging/components/MessageInput';

export default function RosterChat({ route }) {
  const { rosterId } = route.params;
  const { loggedInUser } = useAuth();
  const { myChats, sendMessage } = useChat();

  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Identify the Correct Chat ID for this Roster
  useEffect(() => {
    if (myChats.length > 0) {
      const foundChat = myChats.find(c => c.rosterId === rosterId);
      setActiveChat(foundChat);
    }
  }, [myChats, rosterId]);

  // 2. Listen for Messages in that Chat
  useEffect(() => {
    if (!activeChat) {
      setLoading(false);
      return;
    }

    const messagesRef = collection(db, "chats", activeChat.id, "messages");
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
  }, [activeChat]);

  const handleSend = async (text) => {
    if (!activeChat) return;
    await sendMessage(activeChat.id, text, activeChat.participants);
  };

  if (!activeChat && !loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Chat not found for this roster.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#61dafb" style={{ marginTop: 20 }} />
      ) : (
        <MessageList messages={messages} currentUser={loggedInUser} />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0} // Adjust based on your header height
      >
        <MessageInput onSend={handleSend} />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  errorText: { color: '#888' }
});