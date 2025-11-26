import React, { useState } from 'react';
import { SquarePen } from 'lucide-react'; 
import { COLORS } from '../../constants';
import { useAuth } from '../../context/AuthContext';

const ChatList = ({ 
  myChats, 
  selectedChat, 
  isCreatingChat, 
  onSelectChat, 
  onStartNewChat, 
  onDeleteChat,
  isCollapsed,
  userProfiles // Passed down from parent
}) => {
  const { loggedInUser } = useAuth();
  const [activeChatMenu, setActiveChatMenu] = useState(null);

  return (
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
          onClick={onStartNewChat}
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
                onClick={() => onSelectChat(chat)}
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
                              onClick={() => { onDeleteChat(chat); setActiveChatMenu(null); }}
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
  );
};

export default ChatList;