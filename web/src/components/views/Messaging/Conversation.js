import React, { useState, useEffect, useRef, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, limitToLast, where } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuth } from '../../../context/AuthContext';
import { useChat } from '../../../context/ChatContext';
import { compressImage } from '../../../utils/imageUtils';

// Sub-components
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import ChatDetailsModal from './components/ChatDetailsModal';
import ImageViewer from './components/ImageViewer';

const Conversation = ({ chatId, onBack, userProfiles = {} }) => {
    const { uploadImage, loggedInUser } = useAuth();
    const { 
        myChats, sendMessage, markChatAsRead, updateGroupPhoto, 
        leaveChat, hideChat, renameChat, addParticipant 
    } = useChat();

    // Derived State from Context (ensures we always have fresh data)
    const chat = useMemo(() => myChats.find(c => c.id === chatId), [myChats, chatId]);

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [viewingImage, setViewingImage] = useState(null);
    const [showChatDetails, setShowChatDetails] = useState(false);
    
    const fileInputRef = useRef(null);

    // 1. Mark Read & Fetch Messages
    useEffect(() => {
        if (!chatId || !chat) return;

        // Mark read immediately
        markChatAsRead(chatId);

        const messagesRef = collection(db, "chats", chatId, "messages");
        
        // Filter history if user was added late/removed previously
        let qConstraints = [orderBy("createdAt", "asc"), limitToLast(50)];
        if (chat.hiddenHistory && chat.hiddenHistory[loggedInUser.uid]) {
             const cutoffTimestamp = chat.hiddenHistory[loggedInUser.uid];
             qConstraints.push(where("createdAt", ">=", cutoffTimestamp));
        }

        const q = query(messagesRef, ...qConstraints);
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(msgs);
            // Mark read again on new message arrival if component is active
            markChatAsRead(chatId);
        });

        return () => unsubscribe();
    }, [chatId, chat, loggedInUser.uid, markChatAsRead]);

    // 2. Handlers
    const handleSend = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || !chatId) return;

        const text = newMessage;
        const fileToUpload = selectedFile;
        
        // Optimistic Reset
        setNewMessage("");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";

        let imageUrl = null;
        try {
            if (fileToUpload) {
                imageUrl = await uploadImage(fileToUpload, `chat_images/${chatId}`);
            }
            await sendMessage(chatId, text, chat.participants, imageUrl);
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message.");
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) setSelectedFile(e.target.files[0]);
    };

    const handleGroupPhotoChange = async (file) => {
        if (!chat || !file) return;
        try {
            const compressedFile = await compressImage(file, 300, 0.8);
            const imageUrl = await uploadImage(compressedFile, `chat_avatars/${chat.id}/${Date.now()}`);
            if (imageUrl) await updateGroupPhoto(chat.id, imageUrl);
        } catch (error) {
            console.error("Failed to update photo", error);
        }
    };

    const handleDeleteChat = async () => {
        if (!chat) return;
        if (chat.type === 'roster') {
            alert("Team Roster chats cannot be deleted.");
            return;
        }
        
        const isGroup = chat.type === 'group' || (chat.participants.length > 2);
        
        if (isGroup) {
            if (window.confirm("Are you sure you want to leave this group?")) {
                await leaveChat(chatId);
                if (onBack) onBack(); // Navigate away
            }
        } else {
            if (window.confirm("Are you sure you want to delete this chat history?")) {
                await hideChat(chatId, chat.visibleTo);
                if (onBack) onBack(); // Navigate away
            }
        }
    };

    const handleRenameGroup = async () => {
        const newName = window.prompt("Enter new group name:", chat.name);
        if (newName && newName.trim() !== "") await renameChat(chatId, newName.trim());
    };

    const handleAddMember = async (email, includeHistory) => {
        await addParticipant(chatId, email, includeHistory);
    };

    if (!chat) {
        return <div style={{ padding: '20px', color: '#888' }}>Loading chat or chat not found...</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
            <ChatHeader 
                selectedChat={chat}
                userProfiles={userProfiles}
                loggedInUser={loggedInUser}
                onShowDetails={() => setShowChatDetails(true)}
                onBack={onBack}
                totalUnreadCount={0} // Managed internally or context
            />

            <MessageList 
                messages={messages}
                loggedInUser={loggedInUser}
                onImageClick={setViewingImage}
                selectedChatId={chatId}
            />

            <MessageInput 
                messageText={newMessage}
                onMessageChange={setNewMessage}
                onSend={handleSend}
                selectedFile={selectedFile}
                onFileChange={handleFileChange}
                onRemoveFile={() => setSelectedFile(null)}
                fileInputRef={fileInputRef}
                canSend={true}
            />

            <ImageViewer imageUrl={viewingImage} onClose={() => setViewingImage(null)} />

            {showChatDetails && (
                <ChatDetailsModal 
                    chat={chat} 
                    onClose={() => setShowChatDetails(false)}
                    onRename={handleRenameGroup}
                    onDelete={handleDeleteChat}
                    onUpdatePhoto={handleGroupPhotoChange}
                    onAddMember={handleAddMember}
                    userProfiles={userProfiles}
                    loggedInUser={loggedInUser}
                />
            )}
        </div>
    );
};

export default Conversation;