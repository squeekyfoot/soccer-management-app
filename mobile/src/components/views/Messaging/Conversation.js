import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useChat } from '../../../context/ChatContext';
import { useAuth } from '../../../context/AuthContext';
import { collection, query, orderBy, onSnapshot, limitToLast, where } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';

const Conversation = ({ route, navigation }) => {
    const { chatId } = route.params;
    const { myChats, sendMessage, markChatAsRead } = useChat();
    const { loggedInUser } = useAuth();

    const chat = useMemo(() => myChats.find(c => c.id === chatId), [myChats, chatId]);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (!chatId) return;
        markChatAsRead(chatId);

        const messagesRef = collection(db, "chats", chatId, "messages");
        let qConstraints = [orderBy("createdAt", "asc"), limitToLast(50)];
        if (chat?.hiddenHistory?.[loggedInUser.uid]) {
             qConstraints.push(where("createdAt", ">=", chat.hiddenHistory[loggedInUser.uid]));
        }
        const q = query(messagesRef, ...qConstraints);
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(msgs);
            markChatAsRead(chatId);
        });
        return () => unsubscribe();
    }, [chatId, markChatAsRead, chat, loggedInUser.uid]);

    const handleSend = async (text, image) => {
        if (!chat) return;
        await sendMessage(chat.id, text, chat.participants, image);
    };

    if (!chat) return <View style={styles.container}><Text>Loading...</Text></View>;

    return (
        <View style={styles.container}>
            <ChatHeader chat={chat} onBack={() => navigation.goBack()} />
            <MessageList messages={messages} loggedInUser={loggedInUser} />
            <MessageInput onSend={handleSend} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' }
});

export default Conversation;