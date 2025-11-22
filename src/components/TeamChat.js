import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, orderBy, onSnapshot, limit, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

// --- INTERNAL COMPONENT: User Search & Select ---
function UserSearch({ onSelectionChange }) {
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const users = querySnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        }));
        setAllUsers(users);
      } catch (error) {
        console.error("Error fetching users for search:", error);
      }
    };
    fetchAllUsers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSuggestions([]);
      return;
    }
    
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = allUsers.filter(user => 
      (user.playerName && user.playerName.toLowerCase().includes(lowerTerm)) ||
      (user.email && user.email.toLowerCase().includes(lowerTerm))
    ).filter(user => 
      !selectedUsers.find(s => s.uid === user.uid)
    );

    setSuggestions(filtered.slice(0, 5));
  }, [searchTerm, allUsers, selectedUsers]);

  const addUser = (user) => {
    const newSelection = [...selectedUsers, user];
    setSelectedUsers(newSelection);
    onSelectionChange(newSelection.map(u => u.email));
    setSearchTerm("");
    setSuggestions([]);
  };

  const removeUser = (userToRemove) => {
    const newSelection = selectedUsers.filter(u => u.uid !== userToRemove.uid);
    setSelectedUsers(newSelection);
    onSelectionChange(newSelection.map(u => u.email));
  };

  return (
    <div style={{ marginBottom: '15px' }}>
      <label style={{ display: 'block', marginBottom: '5px', color: 'white' }}>
        Add People:
      </label>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '5px' }}>
        {selectedUsers.map(user => (
          <span key={user.uid} style={{
            backgroundColor: '#0078d4', color: 'white', padding: '4px 8px',
            borderRadius: '15px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px'
          }}>
            {user.playerName || user.email}
            <button 
              onClick={() => removeUser(user)}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </span>
        ))}
      </div>

      <input 
        type="text" 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search by name or email..."
        style={{ width: '100%', padding: '8px', backgroundColor: '#3a3f4a', border: 'none', color: 'white' }}
      />

      {suggestions.length > 0 && (
        <div style={{
          backgroundColor: '#222', border: '1px solid #444', borderRadius: '4px',
          position: 'absolute', width: '80%', zIndex: 10, maxHeight: '150px', overflowY: 'auto'
        }}>
          {suggestions.map(user => (
            <div 
              key={user.uid}
              onClick={() => addUser(user)}
              style={{ padding: '8px', borderBottom: '1px solid #333', cursor: 'pointer', color: 'white' }}
            >
              <div style={{ fontWeight: 'bold' }}>{user.playerName}</div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>{user.email}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function TeamChat() {
  const { sendMessage, createChat, loggedInUser } = useAuth();
  
  // Data State
  const [myChats, setMyChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  
  // New Chat Modal State
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState([]); 
  const [newChatName, setNewChatName] = useState("");

  const messagesEndRef = useRef(null);

  // --- NEW: Real-Time Listener for My Chats ---
  useEffect(() => {
    if (!loggedInUser) return;

    // Query: chats where 'participants' array contains my UID
    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef, 
      where("participants", "array-contains", loggedInUser.uid), 
      orderBy("lastMessageTime", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMyChats(chats);
    }, (error) => {
      console.error("Error listening to chats:", error);
    });

    return () => unsubscribe();
  }, [loggedInUser]);


  // 2. LISTEN for messages when a chat is selected (Unchanged)
  useEffect(() => {
    if (!selectedChat) return;

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
  }, [selectedChat]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    const text = newMessage;
    setNewMessage(""); 
    await sendMessage(selectedChat.id, text);
    // No need to call loadChats(), the snapshot listener handles it!
  };

  const handleCreateChat = async (e) => {
    e.preventDefault();
    if (selectedEmails.length === 0) {
      alert("Please select at least one person.");
      return;
    }

    const success = await createChat(selectedEmails, newChatName);
    if (success) {
      // alert("Chat created!"); // Optional: removed to make it smoother
      setShowNewChatModal(false);
      setSelectedEmails([]);
      setNewChatName("");
      // No need to call loadChats()
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 100px)', maxWidth: '1000px', border: '1px solid #444', borderRadius: '8px', overflow: 'hidden' }}>
      
      {/* --- LEFT SIDE: Chat List --- */}
      <div style={{ width: '30%', backgroundColor: '#282c34', borderRight: '1px solid #444', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '15px', borderBottom: '1px solid #444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Messages</h3>
          <button 
            onClick={() => setShowNewChatModal(true)}
            style={{ background: 'none', border: 'none', color: '#61dafb', fontSize: '24px', cursor: 'pointer' }}
          >
            +
          </button>
        </div>
        
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {myChats.length === 0 ? (
            <p style={{ padding: '20px', color: '#888', fontSize: '14px', textAlign: 'center' }}>No conversations yet.</p>
          ) : (
            myChats.map(chat => (
              <div 
                key={chat.id} 
                onClick={() => setSelectedChat(chat)}
                style={{ 
                  padding: '15px', 
                  cursor: 'pointer', 
                  backgroundColor: selectedChat?.id === chat.id ? '#3a3f4a' : 'transparent',
                  borderBottom: '1px solid #333'
                }}
              >
                <div style={{ fontWeight: 'bold', color: 'white' }}>{chat.name || "Chat"}</div>
                <div style={{ fontSize: '12px', color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {chat.lastMessage}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- RIGHT SIDE: Chat Window --- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#1c1e22' }}>
        {selectedChat ? (
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
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} style={{ padding: '15px', backgroundColor: '#282c34', borderTop: '1px solid #444', display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Type a message..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                style={{ flex: 1, padding: '12px', borderRadius: '20px', border: 'none', backgroundColor: '#3a3f4a', color: 'white' }}
              />
              <button type="submit" style={{ 
                padding: '10px 20px', borderRadius: '20px', border: 'none', 
                backgroundColor: '#61dafb', color: '#000', fontWeight: 'bold', cursor: 'pointer'
              }}>
                Send
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#888' }}>
            Select a conversation to start chatting.
          </div>
        )}
      </div>

      {/* --- NEW CHAT MODAL --- */}
      {showNewChatModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: '#282c34', padding: '30px', borderRadius: '8px', width: '400px', border: '1px solid #61dafb', position: 'relative' }}>
            <h3 style={{ marginTop: 0, color: 'white' }}>Start New Chat</h3>
            
            <label style={{ display: 'block', marginBottom: '10px', color: 'white' }}>
              Chat Name (Optional):
              <input 
                type="text" 
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
                placeholder="e.g. Defenders Group"
                style={{ width: '100%', padding: '8px', marginTop: '5px', backgroundColor: '#3a3f4a', border: 'none', color: 'white' }}
              />
            </label>

            {/* UserSearch Component */}
            <UserSearch onSelectionChange={setSelectedEmails} />

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={handleCreateChat} style={{ flex: 1, padding: '10px', backgroundColor: '#61dafb', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                Start Chat
              </button>
              <button onClick={() => setShowNewChatModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: '#555', border: 'none', color: 'white', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default TeamChat;