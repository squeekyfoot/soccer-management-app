import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext'; // NEW
import { collection, query, orderBy, onSnapshot, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import UserSearch from './UserSearch';
import { COLORS, MOBILE_BREAKPOINT } from '../constants';

// Components
import ChatList from './chat/ChatList';
import ImageViewer from './chat/ImageViewer';
import ChatHeader from './chat/ChatHeader';
import MessageList from './chat/MessageList';
import MessageInput from './chat/MessageInput';

function TeamChat() {
  const { uploadImage, loggedInUser } = useAuth();
  const { sendMessage, createChat, hideChat, renameChat, myChats, markChatAsRead } = useChat();
  
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null); 
  
  const [isCreatingChat, setIsCreatingChat] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState([]); 
  const [newChatName, setNewChatName] = useState("");

  const [viewingImage, setViewingImage] = useState(null);
  const [activeHeaderMenu, setActiveHeaderMenu] = useState(false);
  const [userProfiles, setUserProfiles] = useState({});
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < MOBILE_BREAKPOINT);

  const selectedChatRef = useRef(selectedChat);
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    const handleResize = () => {
      setIsCollapsed(window.innerWidth < MOBILE_BREAKPOINT);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch Live Profiles
  useEffect(() => {
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const profiles = {};
      snapshot.docs.forEach(doc => {
        profiles[doc.id] = doc.data();
      });
      setUserProfiles(profiles);
    });
    return () => unsubscribe();
  }, []);

  // Listen for Messages
  useEffect(() => {
    if (!selectedChat || isCreatingChat) {
        setMessages([]); 
        return;
    }

    markChatAsRead(selectedChat.id);

    const messagesRef = collection(db, "chats", selectedChat.id, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      markChatAsRead(selectedChat.id);
    });

    return () => unsubscribe();
  }, [selectedChat, isCreatingChat]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const startNewChat = () => {
      setIsCreatingChat(true);
      setSelectedChat(null);
      setNewChatName("");
      setSelectedEmails([]);
      setNewMessage("");
      setSelectedFile(null);
  };

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setIsCreatingChat(false);
  };

  const handleRenameGroup = async () => {
    if (!selectedChat) return;
    const newName = window.prompt("Enter new group name:", selectedChat.name);
    if (newName && newName.trim() !== "") {
      await renameChat(selectedChat.id, newName.trim());
    }
    setActiveHeaderMenu(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();

    if (isCreatingChat) {
        if (selectedEmails.length === 0) {
            alert("Please add at least one person to the chat.");
            return;
        }
        if (!newMessage.trim() && !selectedFile) {
            alert("Please enter a message or attach a file.");
            return;
        }

        const chatResult = await createChat(selectedEmails, newChatName);
        
        if (chatResult && chatResult.id) {
             const newChatId = chatResult.id;
             const participants = chatResult.participants;
             const text = newMessage;
             const fileToUpload = selectedFile;
             const resolvedChatName = chatResult.name || newChatName || "New Chat";

             setNewMessage(""); 
             setSelectedFile(null); 
             
             let imageUrl = null;
             if (fileToUpload) {
                 imageUrl = await uploadImage(fileToUpload, `chat_images/${newChatId}`);
             }
             
             await sendMessage(newChatId, text, participants, imageUrl);

             // Optimistic selection
             const optimisticChat = {
                 id: newChatId,
                 name: resolvedChatName,
                 type: selectedEmails.length > 0 ? 'group' : 'dm',
                 participants: participants,
                 participantDetails: chatResult.participantDetails || [] 
             };

             setSelectedChat(optimisticChat);
             setIsCreatingChat(false);
             setNewChatName("");
             setSelectedEmails([]);
        }

    } else {
        if ((!newMessage.trim() && !selectedFile) || !selectedChat) return;
        const text = newMessage;
        const fileToUpload = selectedFile;
        setNewMessage(""); 
        setSelectedFile(null); 
        let imageUrl = null;
        try {
            if (fileToUpload) {
                imageUrl = await uploadImage(fileToUpload, `chat_images/${selectedChat.id}`);
            }
            await sendMessage(selectedChat.id, text, selectedChat.participants, imageUrl);
        } catch (error) {
            console.error("Error sending message/image:", error);
            alert("Failed to send message.");
        }
    }
  };

  const handleDeleteChat = async (chat) => {
    if (chat.type === 'roster') {
      alert("Team Roster chats cannot be deleted.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this chat? This action cannot be undone.")) {
        await hideChat(chat.id, chat.visibleTo, chat.type);
        if (selectedChat && selectedChat.id === chat.id) {
            setSelectedChat(null);
        }
    }
  };

  const canSend = isCreatingChat 
    ? (selectedEmails.length > 0 && (newMessage.trim().length > 0 || selectedFile)) 
    : true; 

  return (
    <div style={{ 
      display: 'flex', height: '100%', width: '100%', maxWidth: '1000px', 
      margin: '0 auto', backgroundColor: COLORS.background, 
      border: isCollapsed ? 'none' : `1px solid ${COLORS.border}`, 
      borderRadius: isCollapsed ? '0' : '8px', overflow: 'hidden', boxSizing: 'border-box'
    }}>
      
      {/* LEFT: Chat List */}
      <ChatList 
        myChats={myChats}
        selectedChat={selectedChat}
        isCreatingChat={isCreatingChat}
        onSelectChat={handleSelectChat}
        onStartNewChat={startNewChat}
        onDeleteChat={handleDeleteChat}
        isCollapsed={isCollapsed}
        userProfiles={userProfiles}
      />

      {/* RIGHT: Chat Window & Input */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: COLORS.sidebar, minWidth: 0, boxSizing: 'border-box' }}>
        
        {isCreatingChat && (
            <>
                <div style={{ padding: '20px', borderBottom: `1px solid ${COLORS.border}`, backgroundColor: COLORS.background, boxSizing: 'border-box' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: 'white' }}>New Message</h3>
                    <div style={{ marginBottom: '5px' }}>
                         <UserSearch onSelectionChange={setSelectedEmails} />
                    </div>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontStyle: 'italic' }}>
                    Select people to start a new conversation.
                </div>
            </>
        )}

        {!isCreatingChat && selectedChat && (
          <>
            <ChatHeader 
              selectedChat={selectedChat}
              userProfiles={userProfiles}
              loggedInUser={loggedInUser}
              activeHeaderMenu={activeHeaderMenu}
              setActiveHeaderMenu={setActiveHeaderMenu}
              onRenameGroup={handleRenameGroup}
              onDeleteChat={handleDeleteChat}
            />

            <MessageList 
              messages={messages}
              loggedInUser={loggedInUser}
              onImageClick={setViewingImage}
              selectedChatId={selectedChat.id}
            />
          </>
        )}

        {!isCreatingChat && !selectedChat && (
             <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#888' }}>
                Select a conversation or start a new one.
             </div>
        )}

        {(isCreatingChat || selectedChat) && (
            <MessageInput 
              messageText={newMessage}
              onMessageChange={setNewMessage}
              onSend={handleSend}
              selectedFile={selectedFile}
              onFileChange={handleFileChange}
              onRemoveFile={() => setSelectedFile(null)}
              fileInputRef={fileInputRef}
              isCollapsed={isCollapsed}
              canSend={canSend}
            />
        )}
      </div>

      <ImageViewer imageUrl={viewingImage} onClose={() => setViewingImage(null)} />

    </div>
  );
}

export default TeamChat;