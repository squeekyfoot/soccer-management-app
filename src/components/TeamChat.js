import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom'; 
import { useAuth } from '../context/AuthContext';
import { collection, query, orderBy, onSnapshot, limit, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import UserSearch from './UserSearch';
import { SquarePen, Send, Paperclip, MoreVertical } from 'lucide-react'; 

// NEW: Import Constants
import { MOBILE_BREAKPOINT, COLORS } from '../constants';

function TeamChat() {
  const { sendMessage, createChat, hideChat, renameChat, uploadImage, loggedInUser, myChats, markChatAsRead } = useAuth();
  
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null); 
  
  const [isCreatingChat, setIsCreatingChat] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState([]); 
  const [newChatName, setNewChatName] = useState("");

  const [viewingImage, setViewingImage] = useState(null);
  const [activeChatMenu, setActiveChatMenu] = useState(null);
  const [activeHeaderMenu, setActiveHeaderMenu] = useState(false);

  const [userProfiles, setUserProfiles] = useState({});

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null); 
  const lastChatIdRef = useRef(null);    

  // USE CONSTANT (Was 800, now synchronized to 768)
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < MOBILE_BREAKPOINT);

  const selectedChatRef = useRef(selectedChat);
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    const handleResize = () => {
      // USE CONSTANT
      setIsCollapsed(window.innerWidth < MOBILE_BREAKPOINT);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ... (Keep fetch user profiles, useEffects, and message logic the same) ...
  // FETCH LIVE USER PROFILES
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
    });
    return () => unsubscribe();
  }, [selectedChat, isCreatingChat]);

  useLayoutEffect(() => {
    if (selectedChat && chatContainerRef.current) {
      const isNewChat = lastChatIdRef.current !== selectedChat.id;
      if (isNewChat) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      } else if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
      if (messages.length > 0) {
        lastChatIdRef.current = selectedChat.id;
      }
    }
  }, [messages, selectedChat]);

  const handleImageLoad = () => {
    if (chatContainerRef.current) {
       const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
       const isNearBottom = scrollHeight - scrollTop - clientHeight < 500;
       if (isNearBottom) {
         chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
       }
    }
  };

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
             const optimisticChat = {
                 id: newChatId,
                 name: resolvedChatName,
                 lastMessage: text || "Sent an image",
                 type: selectedEmails.length > 0 ? 'group' : 'dm',
                 participants: participants,
                 participantDetails: chatResult.participantDetails || [] 
             };
             const optimisticMessage = {
                 id: 'temp-id-' + Date.now(),
                 text: text,
                 imageUrl: imageUrl,
                 senderId: loggedInUser.uid,
                 senderName: loggedInUser.playerName,
                 createdAt: { toDate: () => new Date() }
             };
             setSelectedChat(optimisticChat);
             setMessages([optimisticMessage]); 
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
      setActiveChatMenu(null); 
      setActiveHeaderMenu(false); 
      return;
    }
    if (window.confirm("Are you sure you want to delete this chat? This action cannot be undone.")) {
        await hideChat(chat.id, chat.visibleTo, chat.type);
        if (selectedChat && selectedChat.id === chat.id) {
            setSelectedChat(null);
        }
    }
    setActiveChatMenu(null); 
    setActiveHeaderMenu(false);
  };

  const canSendNewChat = isCreatingChat 
    ? (selectedEmails.length > 0 && (newMessage.trim().length > 0 || selectedFile)) 
    : true; 

  return (
    <div style={{ 
      display: 'flex', 
      height: '100%', 
      width: '100%', 
      maxWidth: '1000px', 
      margin: '0 auto', 
      backgroundColor: COLORS.background, // USE CONSTANT
      border: isCollapsed ? 'none' : `1px solid ${COLORS.border}`, // USE CONSTANT
      borderRadius: isCollapsed ? '0' : '8px', 
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      
      {/* --- LEFT SIDE: Chat List --- */}
      <div style={{ 
        width: isCollapsed ? '80px' : '30%', 
        minWidth: isCollapsed ? '80px' : '250px', 
        transition: 'width 0.2s ease, min-width 0.2s ease',
        backgroundColor: COLORS.background, 
        borderRight: `1px solid ${COLORS.border}`, 
        display: 'flex', 
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}>
        <div style={{ padding: '15px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: isCollapsed ? 'center' : 'flex-end', alignItems: 'center', boxSizing: 'border-box' }}>
          <button 
            onClick={startNewChat}
            style={{ background: 'none', border: 'none', color: isCreatingChat ? 'white' : COLORS.primary, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Start New Chat"
          >
            <SquarePen size={24} />
          </button>
        </div>
        
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {myChats.length === 0 && !isCreatingChat ? (
            <p style={{ padding: '20px', color: '#888', fontSize: '14px', textAlign: 'center' }}>{isCollapsed ? "..." : "No conversations yet."}</p>
          ) : (
            myChats.map(chat => {
              const isDM = chat.type === 'dm' || (chat.participants && chat.participants.length === 2 && chat.type !== 'roster');
              let displayTitle = chat.name || "Chat";
              let iconImage = null;
              if (chat.type === 'roster') {
                  displayTitle = `⚽ ${chat.name}`;
              } else if (isDM) {
                  const otherUser = chat.participantDetails?.find(p => p.uid !== loggedInUser.uid);
                  if (otherUser) {
                      const freshUser = userProfiles[otherUser.uid];
                      if (freshUser) {
                          displayTitle = freshUser.playerName || otherUser.name;
                          iconImage = freshUser.photoURL;
                      } else {
                          displayTitle = otherUser.name;
                          iconImage = otherUser.photoURL; 
                      }
                  }
              }
              const firstLetter = displayTitle.replace(/[^a-zA-Z0-9]/g, '').charAt(0).toUpperCase() || "?";
              const unreadCount = (chat.unreadCounts && chat.unreadCounts[loggedInUser.uid]) || 0;
              const hasUnread = unreadCount > 0 && chat.id !== selectedChat?.id;

              return (
                <div 
                  key={chat.id} 
                  onClick={() => { setSelectedChat(chat); setIsCreatingChat(false); }}
                  style={{ 
                    padding: '15px', 
                    cursor: 'pointer', 
                    backgroundColor: (selectedChat?.id === chat.id && !isCreatingChat) ? '#3a3f4a' : 'transparent',
                    borderBottom: `1px solid ${COLORS.border}`,
                    display: 'flex', 
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                    alignItems: 'center',
                    position: 'relative',
                    boxSizing: 'border-box'
                  }}
                  title={isCollapsed ? displayTitle : ""}
                >
                  <div style={{ 
                       width: '45px', height: '45px', 
                       borderRadius: '50%', 
                       marginRight: isCollapsed ? '0' : '15px', 
                       flexShrink: 0, 
                       backgroundColor: '#444',
                       display: 'flex', justifyContent: 'center', alignItems: 'center',
                       border: '1px solid #555',
                       color: '#eee', fontWeight: 'bold', fontSize: '18px',
                       position: 'relative'
                  }}>
                       {iconImage ? (
                           <img src={iconImage} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                       ) : (
                           <span>{firstLetter}</span>
                       )}
                       {hasUnread && (
                         <div style={{
                           position: 'absolute', top: '0', right: '0', width: '10px', height: '10px',
                           borderRadius: '50%', backgroundColor: COLORS.primary, border: `1px solid ${COLORS.background}`, zIndex: 10
                         }} />
                       )}
                  </div>

                  {!isCollapsed && (
                    <>
                      <div style={{ overflow: 'hidden', flex: 1, marginRight: '10px' }}>
                        <div style={{ fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {displayTitle}
                        </div>
                        <div style={{ fontSize: '12px', color: hasUnread ? '#eee' : '#aaa', fontWeight: hasUnread ? 'bold' : 'normal', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                                style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'left', background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer', borderBottom: '1px solid #333' }}
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
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* --- RIGHT SIDE: Chat Window --- */}
      <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          backgroundColor: COLORS.sidebar, 
          minWidth: 0, 
          boxSizing: 'border-box'
      }}>
        
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
            <div style={{ padding: '15px', borderBottom: `1px solid ${COLORS.border}`, backgroundColor: COLORS.background, boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
              {(() => {
                 const isDM = selectedChat.type === 'dm' || (selectedChat.participants && selectedChat.participants.length === 2);
                 let displayTitle = selectedChat.name;
                 if (isDM) {
                     const otherUser = selectedChat.participantDetails?.find(p => p.uid !== loggedInUser.uid);
                     if (otherUser) {
                         const freshUser = userProfiles[otherUser.uid];
                         displayTitle = freshUser ? (freshUser.playerName || otherUser.name) : otherUser.name;
                     }
                 }
                 let displaySubtext = null;
                 if (!isDM) {
                     const others = selectedChat.participantDetails?.filter(p => p.uid !== loggedInUser.uid);
                     if (others && others.length > 0) {
                         displaySubtext = others.map(p => {
                             const fresh = userProfiles[p.uid];
                             return fresh ? (fresh.playerName || p.name) : p.name;
                         }).join(', ');
                     }
                 }
                 return (
                    <>
                        <h3 style={{ margin: 0 }}>{displayTitle}</h3>
                        {displaySubtext && (
                            <span style={{ fontSize: '12px', color: '#888' }}>
                                {displaySubtext}
                            </span>
                        )}
                    </>
                 );
              })()}
              </div>

              <div style={{ position: 'relative', marginLeft: '10px' }}>
                <button 
                  onClick={() => setActiveHeaderMenu(!activeHeaderMenu)}
                  style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <MoreVertical size={24} />
                </button>
                
                {activeHeaderMenu && (
                  <div style={{ 
                    position: 'absolute', right: '0', top: '35px', 
                    backgroundColor: '#222', border: '1px solid #555', borderRadius: '5px', 
                    zIndex: 100, minWidth: '150px', boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
                  }}>
                    {(selectedChat.type === 'group' || (selectedChat.participants && selectedChat.participants.length > 2)) && (
                        <button 
                          onClick={handleRenameGroup}
                          style={{ display: 'block', width: '100%', padding: '12px', textAlign: 'left', background: 'none', border: 'none', color: 'white', cursor: 'pointer', borderBottom: '1px solid #333' }}
                        >
                          Rename Group
                        </button>
                    )}
                    <button 
                      onClick={() => handleDeleteChat(selectedChat)}
                      style={{ display: 'block', width: '100%', padding: '12px', textAlign: 'left', background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer', borderBottom: '1px solid #333' }}
                    >
                      Delete Chat
                    </button>
                    <button 
                      onClick={() => setActiveHeaderMenu(false)}
                      style={{ display: 'block', width: '100%', padding: '12px', textAlign: 'left', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div ref={chatContainerRef} style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', boxSizing: 'border-box' }}>
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
                          onLoad={handleImageLoad} 
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

        {!isCreatingChat && !selectedChat && (
             <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#888' }}>
                Select a conversation or start a new one.
             </div>
        )}

        {(isCreatingChat || selectedChat) && (
            <form onSubmit={handleSend} style={{ 
                padding: '15px', 
                backgroundColor: COLORS.background, 
                borderTop: `1px solid ${COLORS.border}`, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '10px',
                width: '100%', 
                boxSizing: 'border-box'
            }}>
              {selectedFile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white', fontSize: '12px', paddingLeft: '10px' }}>
                  <span>📎 {selectedFile.name}</span>
                  <button type="button" onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer' }}>✕</button>
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
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
                    backgroundColor: '#3a3f4a', color: 'white', fontSize: '20px', cursor: 'pointer',
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <Paperclip size={20} />
                </button>
                <input 
                  type="text" 
                  placeholder={isCreatingChat ? "Type your first message..." : "Type a message..."}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  style={{ 
                      flex: 1, 
                      padding: '12px', 
                      borderRadius: '20px', 
                      border: 'none', 
                      backgroundColor: '#3a3f4a', 
                      color: 'white',
                      minWidth: 0 
                  }}
                />
                <button 
                    type="submit" 
                    disabled={!canSendNewChat}
                    style={{ 
                        padding: isCollapsed ? '10px' : '10px 20px', 
                        borderRadius: '20px', 
                        border: 'none', 
                        backgroundColor: canSendNewChat ? COLORS.primary : '#444', 
                        color: canSendNewChat ? '#000' : '#888', 
                        fontWeight: 'bold', 
                        cursor: canSendNewChat ? 'pointer' : 'not-allowed',
                        flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                  {isCollapsed ? <Send size={20} /> : "Send"}
                </button>
              </div>
            </form>
        )}
      </div>

      {/* --- MODAL --- */}
      {viewingImage && createPortal(
        <div 
          onClick={() => setViewingImage(null)} 
          style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.95)', 
            display: 'flex', justifyContent: 'center', alignItems: 'center', 
            zIndex: 9999, 
            flexDirection: 'column'
          }}
        >
          <button 
            onClick={(e) => {
              e.stopPropagation(); 
              setViewingImage(null);
            }}
            style={{
              position: 'absolute', 
              top: '40px', 
              right: '20px',
              width: '50px', 
              height: '50px',
              borderRadius: '50%',
              backgroundColor: 'rgba(50, 50, 50, 0.8)', 
              border: '2px solid white', 
              color: 'white', 
              fontSize: '24px', 
              cursor: 'pointer',
              zIndex: 10000, 
              display: 'flex', justifyContent: 'center', alignItems: 'center'
            }}
          >
            ✕
          </button>
          
          <img 
            src={viewingImage} 
            alt="Full size" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '85%', 
              objectFit: 'contain',
              boxShadow: '0 0 20px rgba(0,0,0,0.5)'
            }}
          />
        </div>,
        document.body 
      )}

    </div>
  );
}

export default TeamChat;