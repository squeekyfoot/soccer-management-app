import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Header from '../../common/Header';
import ChatList from './components/ChatList';
import { useChat } from '../../../context/ChatContext';
import { useAuth } from '../../../context/AuthContext';
import { SquarePen } from 'lucide-react-native';
import { COLORS } from '../../../lib/constants';
import { collection, onSnapshot } from "firebase/firestore"; 
import { db } from "../../../lib/firebase";

const Messaging = ({ navigation }) => {
  const { myChats, leaveChat, hideChat } = useChat();
  const [userProfiles, setUserProfiles] = useState({});

  useEffect(() => {
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const profiles = {};
      snapshot.docs.forEach(doc => profiles[doc.id] = doc.data());
      setUserProfiles(profiles);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (chat) => {
      if (chat.type === 'roster') return Alert.alert("Cannot delete roster chats");
      // Basic delete logic logic...
  };

  return (
    <View style={styles.container}>
      <Header 
        title="Messaging" 
        actions={
            <TouchableOpacity onPress={() => navigation.navigate('NewChat')} style={styles.iconBtn}>
                <SquarePen size={22} color="white" />
            </TouchableOpacity>
        }
      />
      <ChatList 
        myChats={myChats}
        onSelectChat={(chat) => navigation.navigate('Conversation', { chatId: chat.id })}
        onDeleteChat={handleDelete}
        userProfiles={userProfiles}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  iconBtn: { padding: 5 }
});

export default Messaging;