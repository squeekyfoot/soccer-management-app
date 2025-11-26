import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext'; 
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db } from "../firebase";
import UserSearch from './UserSearch';
import { COLORS, MOBILE_BREAKPOINT } from '../constants';

// Components
import ChatList from './chat/ChatList';
import ImageViewer from './chat/ImageViewer';
import ChatHeader from './chat/ChatHeader';
import MessageList from './chat/MessageList';
import MessageInput from './chat/MessageInput';
import ChatDetailsModal from './chat/ChatDetailsModal'; // NEW Component

function TeamChat() {
  const { uploadImage, loggedInUser } = useAuth();
  const { sendMessage, createChat, hideChat, renameChat, myChats, markChatAsRead } = useChat();
  
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null); 
  
  const [isCreatingChat, setIsCreatingChat] = useState(false); // Default false now
  const [selectedEmails, setSelectedEmails] = useState([]); 
  const [newChatName, setNewChatName] = useState("");

  const [viewingImage, setViewingImage] = useState(null);
  const [showChatDetails, setShowChatDetails] = useState(false); // New Modal State
  
  const [userProfiles, setUserProfiles] = useState({});
  
  // Mobile View State
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Total Unread Count for Back Button
  const totalUnread = myChats.reduce((acc, chat) => {
    const count = (chat.unreadCounts && chat.unreadCounts[loggedInUser.uid]) || 0;
    return acc + count;
  }, 0);

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
      // Mark read again if new message comes in while looking
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

  const handleBackToList = () => {
    setSelectedChat(null);
    setIsCreatingChat(false);
  };

  const handleRenameGroup = async () => {
    if (!selectedChat) return;
    const newName = window.prompt("Enter new group name:", selectedChat.name);
    if (newName && newName.trim() !== "") {
      await renameChat(selectedChat.id, newName.trim());
    }
    setShowChatDetails(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();

    if (isCreatingChat) {
        if (selectedEmails.length === 0) {
            alert("Please add at least one person to the chat.");
            return;
        }
        const chatResult = await createChat(selectedEmails, newChatName);
        
        if (chatResult && chatResult.id) {
             const newChatId = chatResult.id;
             const participants = chatResult.participants;
             const text = newMessage;
             const fileToUpload = selectedFile;
             
             setNewMessage(""); 
             setSelectedFile(null); 
             
             let imageUrl = null;
             if (fileToUpload) {
                 imageUrl = await uploadImage(fileToUpload, `chat_images/${newChatId}`);
             }
             
             if (text || imageUrl) {
                await sendMessage(newChatId, text, participants, imageUrl);
             }

             // Switch to the new chat view
             const optimisticChat = {
                 id: newChatId,
                 name: chatResult.name || newChatName || "New Chat",
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
    if (window.confirm("Are you sure you want to delete this chat?")) {
        await hideChat(chat.id, chat.visibleTo, chat.type);
        setSelectedChat(null);
        setShowChatDetails(false);
    }
  };

  const canSend = isCreatingChat 
    ? (selectedEmails.length > 0) 
    : true; 

  // --- RENDER LOGIC ---
  // If mobile: Show EITHER list OR chat. 
  // If desktop: Show split view.
  
  const showList = !isMobile || (!selectedChat && !isCreatingChat);
  const showChat = !isMobile || (selectedChat || isCreatingChat);

  return (
    <div style={{ 
      display: 'flex', height: '100%', width: '100%', maxWidth: '1000px', 
      margin: '0 auto', backgroundColor: COLORS.background, 
      borderRadius: isMobile ? '0' : '8px', overflow: 'hidden', boxSizing: 'border-box',
      border: isMobile ? 'none' : `1px solid ${COLORS.border}`
    }}>
      
      {/* LEFT: Chat List */}
      {showList && (
        <ChatList 
          myChats={myChats}
          selectedChat={selectedChat}
          onSelectChat={handleSelectChat}
          onStartNewChat={startNewChat}
          onDeleteChat={handleDeleteChat}
          userProfiles={userProfiles}
          isMobile={isMobile}
        />
      )}

      {/* RIGHT: Chat Window */}
      {showChat && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: COLORS.sidebar, minWidth: 0, height: '100%' }}>
          
          {isCreatingChat ? (
              <>
                  <div style={{ padding: '15px', borderBottom: `1px solid ${COLORS.border}`, backgroundColor: COLORS.background, display: 'flex', alignItems: 'center' }}>
                      {isMobile && (
                        <button onClick={handleBackToList} style={{ background: 'none', border: 'none', color: COLORS.primary, fontSize: '24px', marginRight: '10px', cursor: 'pointer' }}>
                          ‹
                        </button>
                      )}
                      <h3 style={{ margin: 0, color: 'white' }}>New Message</h3>
                  </div>
                  <div style={{ padding: '20px' }}>
                       <UserSearch onSelectionChange={setSelectedEmails} />
                  </div>
                  <div style={{ flex: 1 }} />
              </>
          ) : selectedChat ? (
            <>
              <ChatHeader 
                selectedChat={selectedChat}
                userProfiles={userProfiles}
                loggedInUser={loggedInUser}
                onShowDetails={() => setShowChatDetails(true)}
                onBack={isMobile ? handleBackToList : null}
                totalUnreadCount={totalUnread}
              />

              <MessageList 
                messages={messages}
                loggedInUser={loggedInUser}
                onImageClick={setViewingImage}
                selectedChatId={selectedChat.id}
              />
            </>
          ) : (
             /* Desktop Placeholder */
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
                canSend={canSend}
              />
          )}
        </div>
      )}

      {/* Modals */}
      <ImageViewer imageUrl={viewingImage} onClose={() => setViewingImage(null)} />
      
      {showChatDetails && (
        <ChatDetailsModal 
          chat={selectedChat} 
          onClose={() => setShowChatDetails(false)}
          onRename={handleRenameGroup}
          onDelete={handleDeleteChat}
          userProfiles={userProfiles}
          loggedInUser={loggedInUser}
        />
      )}

    </div>
  );
}

export default TeamChat;