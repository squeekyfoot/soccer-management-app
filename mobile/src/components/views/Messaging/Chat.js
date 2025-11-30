import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { useChat } from '../../../context/ChatContext';
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"; 
import { db } from "../../../lib/firebase"; 

import ChatHeader from './components/ChatHeader'; 
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import ImageViewer from './components/ImageViewer'; // NEW IMPORT

export default function Chat({ route, navigation }) {
  const { chatId } = route.params; 
  const { loggedInUser } = useAuth();
  const { sendMessage, markChatAsRead, myChats } = useChat();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for image viewing
  const [viewingImage, setViewingImage] = useState(null); 
  
  const currentChat = myChats.find(c => c.id === chatId);

  useEffect(() => {
    if (chatId) {
      markChatAsRead(chatId);
    }
  }, [chatId, markChatAsRead]);

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

  const handleSend = async (messageData) => {
    const participants = currentChat ? currentChat.participants : [];
    
    // Check if messageData is an object (from new input) or string (legacy)
    let text = "";
    let file = null;

    if (typeof messageData === 'string') {
        text = messageData;
    } else {
        text = messageData.text;
        file = messageData.file;
    }

    // Pass file if it exists, ChatContext/sendMessage handles upload logic if adapted, 
    // BUT typically we handle upload here in the view for mobile if context expects a URL.
    // Based on previous web context, sendMessage takes (chatId, text, participants, imageUrl).
    // So we should upload here if there is a file.
    
    let imageUrl = null;
    if (file) {
        // We need uploadImage from useAuth to be exposed or handle it here
        // Assuming context handles it or we need to import it.
        // Let's assume for now we just pass text. 
        // If you haven't implemented mobile upload in Chat.js yet:
        alert("Image upload logic needs to be connected in Chat.js handleSend");
    }

    await sendMessage(chatId, text, participants, imageUrl);
  };

  const handleOpenDetails = () => {
      navigation.navigate("ChatDetails", { chatId });
  };

  return (
    <View style={styles.container}>
      <ChatHeader 
        chat={currentChat} 
        currentUser={loggedInUser}
        onBack={() => navigation.goBack()} 
        onShowDetails={handleOpenDetails}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#61dafb" style={{ marginTop: 20 }} />
      ) : (
        <MessageList 
            messages={messages} 
            currentUser={loggedInUser} 
            onImageClick={setViewingImage} // FIX: Pass the handler
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0} 
      >
        <MessageInput onSend={handleSend} />
      </KeyboardAvoidingView>

      {/* FIX: Render the Image Viewer Modal */}
      <ImageViewer imageUrl={viewingImage} onClose={() => setViewingImage(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
});