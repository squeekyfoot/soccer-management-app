import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useChat } from '../../../context/ChatContext'; 
import { collection, onSnapshot } from "firebase/firestore"; 
import { db } from "../../../lib/firebase";
import { COLORS, MOBILE_BREAKPOINT } from '../../../lib/constants';
import { SquarePen } from 'lucide-react';

import UserSearch from '../../shared/UserSearch';
import Header from '../../common/Header'; 
import Button from '../../common/Button';

// Sub-components
import ChatList from './components/ChatList';
import Conversation from './Conversation'; // Ensure you have this from the previous step
import MessageInput from './components/MessageInput'; 

function Messaging() {
  const { chatId } = useParams(); // URL Driver
  const navigate = useNavigate();
  const { loggedInUser, uploadImage } = useAuth();
  const { myChats, createChat, sendMessage, hideChat, leaveChat } = useChat(); 
  
  // -- UI STATE --
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  const [userProfiles, setUserProfiles] = useState({});

  // -- DRAFT STATE (Only for New Chat Screen) --
  const [selectedEmails, setSelectedEmails] = useState([]); 
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // 1. Responsive Check
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. Load Profiles (Shared Resource)
  useEffect(() => {
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const profiles = {};
      snapshot.docs.forEach(doc => profiles[doc.id] = doc.data());
      setUserProfiles(profiles);
    });
    return () => unsubscribe();
  }, []);

  // 3. Routing Sync
  useEffect(() => {
    if (chatId) {
        setIsCreatingChat(false); // URL overrides manual creation mode
    }
  }, [chatId]);

  // -- HANDLERS --

  const startNewChat = useCallback(() => {
      navigate('/messages'); // Clear URL
      setIsCreatingChat(true); 
      setNewMessage(""); 
      setSelectedEmails([]);
  }, [navigate]);

  const handleSelectChat = useCallback((chat) => {
    navigate(`/messages/${chat.id}`);
  }, [navigate]);

  const handleBackToList = () => {
    navigate('/messages');
    setIsCreatingChat(false);
  };

  const handleDeleteChatFromList = async (chat) => {
    if (chat.type === 'roster') return alert("Team Roster chats cannot be deleted.");
    const isGroup = chat.type === 'group' || chat.participants.length > 2;
    if (isGroup) {
       if (window.confirm("Leave group?")) await leaveChat(chat.id);
    } else {
       if (window.confirm("Delete chat?")) await hideChat(chat.id, chat.visibleTo);
    }
  };

  const handleCreateAndSend = async (e) => {
    e.preventDefault();
    if (selectedEmails.length === 0) return alert("Add a recipient.");
    
    const chatResult = await createChat(selectedEmails);
    
    if (chatResult && chatResult.id) {
         const text = newMessage;
         const fileToUpload = selectedFile;
         
         let imageUrl = null;
         if (fileToUpload) imageUrl = await uploadImage(fileToUpload, `chat_images/${chatResult.id}`);
         
         if (text || imageUrl) {
            await sendMessage(chatResult.id, text, chatResult.participants, imageUrl);
         }

         setNewMessage(""); 
         setSelectedFile(null);
         navigate(`/messages/${chatResult.id}`);
    }
  };

  const showList = !isMobile || (!chatId && !isCreatingChat);
  const showDetail = !isMobile || (chatId || isCreatingChat);

  return (
    <div className="view-container">
        {(!isMobile || showList) && (
          <Header 
            title="Messaging" 
            actions={
              <Button onClick={startNewChat} style={{ padding: 0, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                 <SquarePen size={18} />
              </Button>
            }
            style={{ maxWidth: '1000px', margin: '0 auto' }} 
          />
        )}
        
        <div style={{ 
            flex: 1, overflow: 'hidden',
            padding: isMobile ? '0' : '20px 40px 40px 40px',
            display: 'flex', flexDirection: 'column',
            maxWidth: '1000px', margin: '0 auto', width: '100%',
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
                    selectedChat={{ id: chatId }} 
                    onSelectChat={handleSelectChat}
                    onDeleteChat={handleDeleteChatFromList}
                    userProfiles={userProfiles}
                    isMobile={isMobile}
                />
            )}

            {showDetail && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: COLORS.sidebar, minWidth: 0, height: '100%' }}>
                    {chatId ? (
                        <Conversation 
                            chatId={chatId} 
                            onBack={handleBackToList}
                            userProfiles={userProfiles}
                        />
                    ) : isCreatingChat ? (
                        <>
                            <div style={{ padding: '15px', borderBottom: `1px solid ${COLORS.border}`, backgroundColor: COLORS.background, display: 'flex', alignItems: 'center' }}>
                                <button onClick={handleBackToList} style={{ background: 'none', border: 'none', color: COLORS.primary, fontSize: '24px', marginRight: '10px', cursor: 'pointer' }}>‹</button>
                                <h3 style={{ margin: 0, color: 'white' }}>New Message</h3>
                            </div>
                            <div style={{ padding: '20px', flex: 1 }}>
                                <UserSearch onSelectionChange={setSelectedEmails} />
                            </div>
                            <MessageInput 
                                messageText={newMessage}
                                onMessageChange={setNewMessage}
                                onSend={handleCreateAndSend}
                                selectedFile={selectedFile}
                                onFileChange={(e) => setSelectedFile(e.target.files[0])}
                                onRemoveFile={() => setSelectedFile(null)}
                                fileInputRef={fileInputRef}
                                canSend={selectedEmails.length > 0}
                            />
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#888' }}>
                            Select a conversation or start a new one.
                        </div>
                    )}
                </div>
            )}
            </div>
        </div>
    </div>
  );
}

export default Messaging;