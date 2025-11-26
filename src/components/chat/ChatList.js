import React, { useState, useEffect, useRef } from 'react';
import { SquarePen, MoreVertical } from 'lucide-react'; 
import { COLORS } from '../../constants';
import { useAuth } from '../../context/AuthContext';

const ChatList = ({ 
  myChats, 
  selectedChat, 
  onSelectChat, 
  onStartNewChat, 
  onDeleteChat,
  userProfiles,
  isMobile
}) => {
  const { loggedInUser } = useAuth();
  const [activeChatMenu, setActiveChatMenu] = useState(null);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveChatMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
    }
  };

  return (
    <div style={{ 
      width: isMobile ? '100%' : '30%', 
      minWidth: isMobile ? '100%' : '300px',
      backgroundColor: COLORS.background, 
      borderRight: isMobile ? 'none' : `1px solid ${COLORS.border}`, 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      position: 'relative',
      zIndex: 1
    }}>
      {/* Header */}
      <div style={{ 
        padding: '15px', 
        borderBottom: `1px solid ${COLORS.border}`, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        height: '60px',
        boxSizing: 'border-box',
        backgroundColor: COLORS.background,
        zIndex: 10
      }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>Chats</h2>
        <button 
          onClick={onStartNewChat}
          style={{ background: 'none', border: 'none', color: COLORS.primary, cursor: 'pointer' }}
          title="Start New Chat"
        >
          <SquarePen size={24} />
        </button>
      </div>
      
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {myChats.length === 0 ? (
          <p style={{ padding: '20px', color: '#888', textAlign: 'center' }}>No conversations yet.</p>
        ) : (
          myChats.map(chat => {
            // --- Data Prep ---
            const isDM = chat.type === 'dm' || (chat.participants && chat.participants.length === 2 && chat.type !== 'roster');
            let displayTitle = chat.name || "Chat";
            let iconImage = null;
            
            if (chat.type === 'roster') {
                displayTitle = `⚽ ${chat.name}`;
            } else if (isDM) {
                const otherUser = chat.participantDetails?.find(p => p.uid !== loggedInUser.uid);
                if (otherUser) {
                    const freshUser = userProfiles[otherUser.uid];
                    displayTitle = freshUser ? (freshUser.playerName || otherUser.name) : otherUser.name;
                    iconImage = freshUser ? freshUser.photoURL : otherUser.photoURL;
                }
            }
            
            const firstLetter = displayTitle.replace(/[^a-zA-Z0-9]/g, '').charAt(0).toUpperCase() || "?";
            const unreadCount = (chat.unreadCounts && chat.unreadCounts[loggedInUser.uid]) || 0;
            const hasUnread = unreadCount > 0;
            const timeDisplay = formatTime(chat.lastMessageTime);

            return (
              <div 
                key={chat.id} 
                onClick={() => onSelectChat(chat)}
                style={{ 
                  width: '100%',
                  height: '90px', 
                  cursor: 'pointer', 
                  backgroundColor: (selectedChat?.id === chat.id) ? '#3a3f4a' : 'transparent',
                  borderBottom: `1px solid ${COLORS.border}`,
                  display: 'flex', 
                  boxSizing: 'border-box',
                  position: 'relative'
                }}
              >
                
                {/* --- COLUMN A (20%): Avatar --- */}
                <div style={{ 
                  width: '20%', 
                  height: '100%', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center' 
                }}>
                  <div style={{ 
                       width: '50px', height: '50px', 
                       borderRadius: '50%', 
                       backgroundColor: '#444',
                       display: 'flex', justifyContent: 'center', alignItems: 'center',
                       border: '1px solid #555',
                       color: '#eee', fontWeight: 'bold', fontSize: '20px',
                       overflow: 'hidden'
                  }}>
                       {iconImage ? (
                           <img src={iconImage} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                       ) : (
                           <span>{firstLetter}</span>
                       )}
                  </div>
                </div>

                {/* --- COLUMN B (60%): Name & Message --- */}
                <div style={{ 
                  width: '60%', 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column'
                }}>
                  {/* 1. Top Spacer (5% Height) */}
                  <div style={{ height: '5%', width: '100%' }} />

                  {/* 2. Row 1: Name + Badge (40% Height) */}
                  <div style={{ 
                    height: '40%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    position: 'relative',
                    width: '100%'
                  }}>
                    <div style={{
                      fontWeight: hasUnread ? 'bold' : '600', 
                      color: 'white', 
                      fontSize: '16px',
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      textAlign: 'center',
                      maxWidth: hasUnread ? 'calc(100% - 40px)' : '100%'
                    }}>
                      {displayTitle}
                    </div>

                    {/* Badge: Absolute Right, Vertically Centered */}
                    {hasUnread && (
                      <div style={{ 
                        position: 'absolute',
                        right: '0',
                        top: '50%',
                        transform: 'translateY(-50%)', 
                        backgroundColor: COLORS.primary, color: '#000', 
                        borderRadius: '10px', padding: '2px 6px', 
                        fontSize: '10px', fontWeight: 'bold',
                        whiteSpace: 'nowrap'
                      }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </div>
                    )}
                  </div>

                  {/* 3. Row 2: Preview (50% Height) */}
                  <div style={{ 
                    height: '50%',
                    display: 'flex',
                    alignItems: 'center', 
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      fontSize: '13px', 
                      color: hasUnread ? '#ddd' : '#aaa', 
                      lineHeight: '1.2em',
                      maxHeight: '2.4em', 
                      overflow: 'hidden',
                      textAlign: 'center',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      wordBreak: 'break-word'
                    }}>
                      {chat.lastMessage || "No messages yet"}
                    </div>
                  </div>

                  {/* 4. Bottom Spacer (5% Height) */}
                  <div style={{ height: '5%', width: '100%' }} />
                </div>

                {/* --- COLUMN C (20%): Date & Actions --- */}
                <div style={{ 
                  width: '20%', 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column'
                }}>
                  {/* 1. Top Spacer (5% Height) */}
                  <div style={{ height: '5%', width: '100%' }} />

                  {/* 2. Row 1: Date Only (40% Height) */}
                  <div style={{ 
                    height: '40%',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center'
                  }}>
                    <span style={{ 
                      fontSize: '11px', 
                      color: hasUnread ? COLORS.primary : '#888',
                      whiteSpace: 'nowrap'
                    }}>
                      {timeDisplay}
                    </span>
                  </div>

                  {/* 3. Row 2: Ellipsis (50% Height) */}
                  <div style={{ 
                    height: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center'
                  }}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveChatMenu(activeChatMenu === chat.id ? null : chat.id);
                      }}
                      style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '5px' }}
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>

                  {/* 4. Bottom Spacer (5% Height) */}
                  <div style={{ height: '5%', width: '100%' }} />
                </div>

                {/* --- Popup Menu --- */}
                {activeChatMenu === chat.id && (
                  <div 
                    ref={menuRef}
                    onClick={(e) => e.stopPropagation()}
                    style={{ 
                      position: 'absolute', 
                      top: '60px', 
                      right: '10px', 
                      backgroundColor: '#222', 
                      border: '1px solid #555', 
                      borderRadius: '5px', 
                      zIndex: 9999, 
                      minWidth: '140px', 
                      boxShadow: '0 4px 15px rgba(0,0,0,0.8)'
                    }}
                  >
                    {chat.type !== 'roster' && (
                      <button 
                        onClick={() => { onDeleteChat(chat); setActiveChatMenu(null); }}
                        style={{ display: 'block', width: '100%', padding: '12px', textAlign: 'left', background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer', borderBottom: '1px solid #333' }}
                      >
                        Delete Chat
                      </button>
                    )}
                    <button 
                      onClick={() => setActiveChatMenu(null)}
                      style={{ display: 'block', width: '100%', padding: '12px', textAlign: 'left', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;