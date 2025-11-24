import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, orderBy, onSnapshot, limit, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import UserSearch from './UserSearch';
import { SquarePen } from 'lucide-react';

function TeamChat() {
  const { sendMessage, createChat, hideChat, uploadImage, loggedInUser } = useAuth();
  
  const [myChats, setMyChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null); 
  
  // Inline Creation Mode State
  const [isCreatingChat, setIsCreatingChat] = useState(true);
  
  const [selectedEmails, setSelectedEmails] = useState([]); 
  const [newChatName, setNewChatName] = useState("");

  const [viewingImage, setViewingImage] = useState(null);
  const [activeChatMenu, setActiveChatMenu] = useState(null);
  const messagesEndRef = useRef(null);

  // 1. REAL-TIME LISTENER FOR CHAT LIST
  useEffect(() => {
    if (!loggedInUser) return;

    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef, 
      where("visibleTo", "array-contains", loggedInUser.uid), 
      orderBy("lastMessageTime", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMyChats(chats);
      
      // If the selected chat was updated, update our local selection too
      if (selectedChat) {
        const updatedSelected = chats.find(c => c.id === selectedChat.id);
        if (updatedSelected) {
            setSelectedChat(updatedSelected);
        }
      }
    }, (error) => {
      console.error("Error listening to chat list:", error);
    });

    return () => unsubscribe();
  }, [loggedInUser, selectedChat]); 

  // 2. LISTEN for messages
  useEffect(() => {
    if (!selectedChat || isCreatingChat) {
        setMessages([]); 
        return;
    }

    const messagesRef = collection(db, "chats", selectedChat.id, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [selectedChat, isCreatingChat]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Reset right column for new chat
  const startNewChat = () => {
      setIsCreatingChat(true);
      setSelectedChat(null);
      setNewChatName("");
      setSelectedEmails([]);
      setNewMessage("");
      setSelectedFile(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();

    // --- CASE 1: Creating New Chat ---
    if (isCreatingChat) {
        if (selectedEmails.length === 0) {
            alert("Please add at least one person to the chat.");
            return;
        }
        if (!newMessage.trim() && !selectedFile) {
            alert("Please enter a message or attach a file.");
            return;
        }

        // 1. Create the chat
        const chatResult = await createChat(selectedEmails, newChatName);
        
        if (chatResult && chatResult.id) {
             const newChatId = chatResult.id;
             const participants = chatResult.participants;
             const text = newMessage;
             const fileToUpload = selectedFile;

             // Clear inputs
             setNewMessage(""); 
             setSelectedFile(null); 
             
             // 2. Upload Image if needed
             let imageUrl = null;
             if (fileToUpload) {
                 imageUrl = await uploadImage(fileToUpload, `chat_images/${newChatId}`);
             }
             
             // 3. Send the Message
             await sendMessage(newChatId, text, participants, imageUrl);

             // 4. OPTIMISTIC UI UPDATE
             const optimisticChat = {
                 id: newChatId,
                 name: newChatName || "New Chat",
                 lastMessage: text || "Sent an image",
                 type: selectedEmails.length > 0 ? 'group' : 'dm',
                 participants: participants,
                 participantDetails: [] 
             };

             const optimisticMessage = {
                 id: 'temp-id-' + Date.now(),
                 text: text,
                 imageUrl: imageUrl,
                 senderId: loggedInUser.uid,
                 senderName: loggedInUser.playerName,
                 createdAt: { toDate: () => new Date() }
             };

             setMyChats(prev => [optimisticChat, ...prev]);
             setSelectedChat(optimisticChat);
             setMessages([optimisticMessage]); 
             
             setIsCreatingChat(false);
             setNewChatName("");
             setSelectedEmails([]);
        }

    } else {
        // --- CASE 2: Existing Chat ---
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
      setActiveChatMenu(null); 
      return;
    }
    
    if (window.confirm("Are you sure you want to delete this chat? This action cannot be undone.")) {
        await hideChat(chat.id, chat.visibleTo, chat.type);
        if (selectedChat && selectedChat.id === chat.id) {
            setSelectedChat(null);
        }
    }
    setActiveChatMenu(null); 
  };

  const canSendNewChat = isCreatingChat 
    ? (selectedEmails.length > 0 && (newMessage.trim().length > 0 || selectedFile)) 
    : true; 

  return (
    // CHANGE: Remove 'max-width', change height to '100%', remove border-radius for full-screen feel on mobile
    <div style={{ 
      display: 'flex', 
      height: '100%', // Fill parent 
      width: '100%', // Fill parent
      maxWidth: '1000px', 
      margin: '0 auto', // Center on desktop
      backgroundColor: '#282c34', // Ensure background is set
      border: '1px solid #444', // Border is fine for desktop
      borderRadius: '8px', 
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      
      {/* --- LEFT SIDE: Chat List --- */}
      <div style={{ width: '30%', minWidth: '250px', backgroundColor: '#282c34', borderRight: '1px solid #444', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '15px', borderBottom: '1px solid #444', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <button 
            onClick={startNewChat}
            style={{ background: 'none', border: 'none', color: isCreatingChat ? 'white' : '#61dafb', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Start New Chat"
          >
            <SquarePen size={24} />
          </button>
        </div>
        
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {myChats.length === 0 && !isCreatingChat ? (
            <p style={{ padding: '20px', color: '#888', fontSize: '14px', textAlign: 'center' }}>No conversations yet.</p>
          ) : (
            myChats.map(chat => (
              <div 
                key={chat.id} 
                onClick={() => { setSelectedChat(chat); setIsCreatingChat(false); }}
                style={{ 
                  padding: '15px', 
                  cursor: 'pointer', 
                  backgroundColor: (selectedChat?.id === chat.id && !isCreatingChat) ? '#3a3f4a' : 'transparent',
                  borderBottom: '1px solid #333',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  position: 'relative' 
                }}
              >
                <div style={{ overflow: 'hidden', flex: 1, marginRight: '10px' }}>
                  <div style={{ fontWeight: 'bold', color: 'white' }}>
                    {chat.type === 'roster' ? `⚽ ${chat.name}` : chat.name || "Chat"}
                  </div>
                  <div style={{ fontSize: '12px', color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {chat.lastMessage}
                  </div>
                </div>
                
                {chat.type !== 'roster' && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => setActiveChatMenu(activeChatMenu === chat.id ? null : chat.id)}
                      style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '20px', padding: '0 5px' }}
                    >
                      ⋮
                    </button>
                    {activeChatMenu === chat.id && (
                      <div style={{ 
                        position: 'absolute', right: '10px', top: '40px', 
                        backgroundColor: '#222', border: '1px solid #555', borderRadius: '5px', 
                        zIndex: 100, minWidth: '120px', boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
                      }}>
                        <button 
                          onClick={() => handleDeleteChat(chat)}
                          style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'left', background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', borderBottom: '1px solid #333' }}
                        >
                          Delete Chat
                        </button>
                        <button 
                          onClick={() => setActiveChatMenu(null)}
                          style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'left', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- RIGHT SIDE: Chat Window OR New Chat Form --- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#1c1e22' }}>
        
        {/* CASE 1: Creating New Chat */}
        {isCreatingChat && (
            <>
                <div style={{ padding: '20px', borderBottom: '1px solid #444', backgroundColor: '#282c34' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: 'white' }}>New Message</h3>
                    
                    <div style={{ marginBottom: '15px' }}>
                         <label style={{ display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '12px' }}>TO:</label>
                         <UserSearch onSelectionChange={setSelectedEmails} />
                    </div>

                    <div>
                         <label style={{ display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '12px' }}>GROUP NAME (OPTIONAL):</label>
                         <input 
                            type="text" 
                            value={newChatName} 
                            onChange={(e) => setNewChatName(e.target.value)}
                            placeholder="e.g. Weekend Warriors"
                            style={{ width: '100%', padding: '10px', backgroundColor: '#3a3f4a', border: 'none', color: 'white', borderRadius: '4px' }}
                         />
                    </div>
                </div>
                
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontStyle: 'italic' }}>
                    Select people to start a new conversation.
                </div>
            </>
        )}

        {/* CASE 2: Viewing Existing Chat */}
        {!isCreatingChat && selectedChat && (
          <>
            <div style={{ padding: '15px', borderBottom: '1px solid #444', backgroundColor: '#282c34' }}>
              <h3 style={{ margin: 0 }}>{selectedChat.name}</h3>
              <span style={{ fontSize: '12px', color: '#888' }}>
                {selectedChat.participantDetails?.map(p => p.name).join(', ')}
              </span>
            </div>

            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messages.map(msg => {
                const isMe = msg.senderId === loggedInUser.uid;
                return (
                  <div key={msg.id} style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                  }}>
                    <div style={{ fontSize: '10px', color: '#888', marginBottom: '2px', textAlign: isMe ? 'right' : 'left' }}>
                      {isMe ? 'Me' : msg.senderName}
                    </div>
                    <div style={{
                      backgroundColor: isMe ? '#0078d4' : '#3a3f4a',
                      color: 'white',
                      padding: '10px 15px',
                      borderRadius: '15px',
                      borderTopRightRadius: isMe ? '2px' : '15px',
                      borderTopLeftRadius: isMe ? '15px' : '2px'
                    }}>
                      {msg.imageUrl && (
                        <img 
                          src={msg.imageUrl} 
                          alt="Attachment" 
                          onClick={() => setViewingImage(msg.imageUrl)}
                          style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '10px', marginBottom: msg.text ? '10px' : '0', cursor: 'pointer' }}
                        />
                      )}
                      {msg.text && <span>{msg.text}</span>}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </>
        )}

        {/* CASE 3: No Selection */}
        {!isCreatingChat && !selectedChat && (
             <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#888' }}>
                Select a conversation or start a new one.
             </div>
        )}

        {/* INPUT AREA (Visible for both Create and View) */}
        {(isCreatingChat || selectedChat) && (
            <form onSubmit={handleSend} style={{ padding: '15px', backgroundColor: '#282c34', borderTop: '1px solid #444', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {selectedFile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white', fontSize: '12px', paddingLeft: '10px' }}>
                  <span>📎 {selectedFile.name}</span>
                  <button type="button" onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer' }}>✕</button>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="file" 
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                
                <button 
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  style={{ 
                    padding: '0 15px', borderRadius: '20px', border: '1px solid #555', 
                    backgroundColor: '#3a3f4a', color: 'white', fontSize: '20px', cursor: 'pointer'
                  }}
                >
                  📎
                </button>

                <input 
                  type="text" 
                  placeholder={isCreatingChat ? "Type your first message..." : "Type a message..."}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  style={{ flex: 1, padding: '12px', borderRadius: '20px', border: 'none', backgroundColor: '#3a3f4a', color: 'white' }}
                />
                <button 
                    type="submit" 
                    disabled={!canSendNewChat}
                    style={{ 
                        padding: '10px 20px', borderRadius: '20px', border: 'none', 
                        backgroundColor: canSendNewChat ? '#61dafb' : '#444', 
                        color: canSendNewChat ? '#000' : '#888', 
                        fontWeight: 'bold', cursor: canSendNewChat ? 'pointer' : 'not-allowed'
                    }}
                >
                  Send
                </button>
              </div>
            </form>
        )}
      </div>

      {/* --- IMAGE VIEWER MODAL --- */}
      {viewingImage && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000,
          flexDirection: 'column'
        }}>
          <button 
            onClick={() => setViewingImage(null)}
            style={{
              position: 'absolute', top: '20px', right: '20px',
              background: 'none', border: 'none', color: 'white', fontSize: '30px', cursor: 'pointer'
            }}
          >
            ✕
          </button>
          <img 
            src={viewingImage} 
            alt="Full size" 
            style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
          />
        </div>
      )}

    </div>
  );
}

export default TeamChat;