import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useChat } from '../../../context/ChatContext'; 
import { collection, query, orderBy, onSnapshot, limitToLast, where } from "firebase/firestore"; 
import { db } from "../../../firebase";
import { COLORS, MOBILE_BREAKPOINT } from '../../../constants';
import { compressImage } from '../../../utils/imageUtils'; 
import { SquarePen } from 'lucide-react';

// UPDATED IMPORTS
import UserSearch from '../../shared/UserSearch';
import Header from '../../common/Header'; 
import Button from '../../common/Button';

// Sub-components are now in the local ./components folder
import ChatList from './components/ChatList';
import ImageViewer from './components/ImageViewer';
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import ChatDetailsModal from './components/ChatDetailsModal'; 

function TeamChat() {
  const { uploadImage, loggedInUser } = useAuth();
  const { 
    sendMessage, createChat, hideChat, leaveChat, renameChat, 
    updateGroupPhoto, addParticipant, myChats, markChatAsRead 
  } = useChat();
  
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null); 
  
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState([]); 
  const [newChatName, setNewChatName] = useState("");

  const [viewingImage, setViewingImage] = useState(null);
  const [showChatDetails, setShowChatDetails] = useState(false); 
  
  const [userProfiles, setUserProfiles] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (selectedChat) {
      const freshChatData = myChats.find(c => c.id === selectedChat.id);
      if (freshChatData && JSON.stringify(freshChatData) !== JSON.stringify(selectedChat)) {
        setSelectedChat(freshChatData);
      }
    }
  }, [myChats, selectedChat]);

  // OPTIMIZATION: Memoize this calculation so it doesn't run on every render (e.g. typing)
  const totalUnread = useMemo(() => {
    return myChats.reduce((acc, chat) => {
      const count = (chat.unreadCounts && chat.unreadCounts[loggedInUser.uid]) || 0;
      return acc + count;
    }, 0);
  }, [myChats, loggedInUser.uid]);

  useEffect(() => {
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const profiles = {};
      snapshot.docs.forEach(doc => profiles[doc.id] = doc.data());
      setUserProfiles(profiles);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedChat || isCreatingChat) {
        setMessages(prev => prev.length > 0 ? [] : prev); 
        return;
    }
    
    markChatAsRead(selectedChat.id);
    
    const messagesRef = collection(db, "chats", selectedChat.id, "messages");
    let qConstraints = [orderBy("createdAt", "asc"), limitToLast(50)];
    if (selectedChat.hiddenHistory && selectedChat.hiddenHistory[loggedInUser.uid]) {
         const cutoffTimestamp = selectedChat.hiddenHistory[loggedInUser.uid];
         qConstraints.push(where("createdAt", ">=", cutoffTimestamp));
    }
    const q = query(messagesRef, ...qConstraints);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      markChatAsRead(selectedChat.id);
    });
    return () => unsubscribe();
  }, [selectedChat, isCreatingChat, loggedInUser.uid, markChatAsRead]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) setSelectedFile(e.target.files[0]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startNewChat = useCallback(() => {
      setIsCreatingChat(true); setSelectedChat(null); setMessages([]); 
      setNewChatName(""); setSelectedEmails([]); setNewMessage(""); setSelectedFile(null);
  }, []);

  const handleSelectChat = useCallback((chat) => {
    setMessages([]); setSelectedChat(chat); setIsCreatingChat(false);
  }, []);

  const handleBackToList = () => {
    setSelectedChat(null); setIsCreatingChat(false);
  };

  const handleRenameGroup = async () => {
    if (!selectedChat) return;
    const newName = window.prompt("Enter new group name:", selectedChat.name);
    if (newName && newName.trim() !== "") await renameChat(selectedChat.id, newName.trim());
  };

  const handleAddMember = async (email, includeHistory) => {
      if(!selectedChat) return;
      await addParticipant(selectedChat.id, email, includeHistory);
  };

  const handleGroupPhotoChange = async (file) => {
    if (!selectedChat || !file) return;
    const isGroup = selectedChat.type === 'group' || (selectedChat.participants.length > 2 && selectedChat.type !== 'roster');
    if (isGroup) {
       try {
           const compressedFile = await compressImage(file, 300, 0.8);
           const imageUrl = await uploadImage(compressedFile, `chat_avatars/${selectedChat.id}/${Date.now()}`);
           if (imageUrl) await updateGroupPhoto(selectedChat.id, imageUrl);
       } catch (error) {
           console.error("Failed to compress or upload group photo", error);
           alert("Failed to update photo. Please try again.");
       }
    }
  };

  const handleDeleteChat = useCallback(async (chat) => {
    if (chat.type === 'roster') { alert("Team Roster chats cannot be deleted."); return; }
    const isGroup = chat.type === 'group' || (chat.participants.length > 2 && chat.type !== 'roster');
    if (isGroup) {
       if (window.confirm("Are you sure you want to leave this group?")) {
          await leaveChat(chat.id); setSelectedChat(null); setShowChatDetails(false);
       }
    } else {
       if (window.confirm("Are you sure you want to delete this chat history?")) {
           await hideChat(chat.id, chat.visibleTo); setSelectedChat(null); setShowChatDetails(false);
       }
    }
  }, [leaveChat, hideChat]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (isCreatingChat) {
        if (selectedEmails.length === 0) { alert("Please add at least one person to the chat."); return; }
        const chatResult = await createChat(selectedEmails, newChatName);
        if (chatResult && chatResult.id) {
             const newChatId = chatResult.id;
             const participants = chatResult.participants;
             const text = newMessage;
             let fileToUpload = selectedFile;
             setNewMessage(""); setSelectedFile(null); 
             let imageUrl = null;
             if (fileToUpload) imageUrl = await uploadImage(fileToUpload, `chat_images/${newChatId}`);
             if (text || imageUrl) await sendMessage(newChatId, text, participants, imageUrl);

             const optimisticChat = {
                 id: newChatId, name: chatResult.name || newChatName || "New Chat",
                 type: selectedEmails.length > 0 ? 'group' : 'dm',
                 participants: participants, participantDetails: chatResult.participantDetails || [] 
             };
             setSelectedChat(optimisticChat); setIsCreatingChat(false); setNewChatName(""); setSelectedEmails([]);
        }
    } else {
        if ((!newMessage.trim() && !selectedFile) || !selectedChat) return;
        const text = newMessage; let fileToUpload = selectedFile;
        setNewMessage(""); setSelectedFile(null); 
        let imageUrl = null;
        try {
            if (fileToUpload) imageUrl = await uploadImage(fileToUpload, `chat_images/${selectedChat.id}`);
            await sendMessage(selectedChat.id, text, selectedChat.participants, imageUrl);
        } catch (error) {
            console.error("Error sending message/image:", error);
            alert("Failed to send message.");
        }
    }
  };

  const canSend = isCreatingChat ? (selectedEmails.length > 0) : true; 
  const showList = !isMobile || (!selectedChat && !isCreatingChat);
  const showChat = !isMobile || (selectedChat || isCreatingChat);
  const showHeader = !isMobile || showList; 

  return (
    <div className="view-container">
        
        {showHeader && (
          <Header 
            title="Messaging" 
            actions={
              <Button 
                onClick={startNewChat} 
                style={{ 
                    padding: 0, 
                    width: '32px', height: '32px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    borderRadius: '50%' 
                }}
              >
                 <SquarePen size={18} />
              </Button>
            }
            style={{ maxWidth: '1000px', margin: '0 auto' }} 
          />
        )}
        
        <div style={{ 
            flex: 1, 
            overflow: 'hidden', // Hide main scrollbar
            padding: isMobile ? '15px 20px 20px 20px' : '20px 40px 40px 40px',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '1000px',
            margin: '0 auto',
            width: '100%',
            boxSizing: 'border-box'
        }}>
            <div style={{ 
                display: 'flex', flex: 1, width: '100%', 
                backgroundColor: COLORS.background, 
                borderRadius: isMobile ? '0' : '8px', overflow: 'hidden',
                border: isMobile ? 'none' : `1px solid ${COLORS.border}`,
                minHeight: 0 
            }}>
            
            {showList && (
                <ChatList 
                myChats={myChats}
                selectedChat={selectedChat}
                onSelectChat={handleSelectChat}
                onDeleteChat={handleDeleteChat}
                userProfiles={userProfiles}
                isMobile={isMobile}
                />
            )}

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

            <ImageViewer imageUrl={viewingImage} onClose={() => setViewingImage(null)} />
            
            {showChatDetails && (
                <ChatDetailsModal 
                chat={selectedChat} 
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
        </div>
    </div>
  );
}

export default TeamChat;