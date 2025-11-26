import React from 'react';
import { MoreVertical } from 'lucide-react'; 
import { COLORS } from '../../constants';

const ChatHeader = ({ 
  selectedChat, 
  userProfiles, 
  loggedInUser, 
  activeHeaderMenu, 
  setActiveHeaderMenu, 
  onRenameGroup, 
  onDeleteChat 
}) => {
  if (!selectedChat) return null;

  // Logic to determine display title
  const isDM = selectedChat.type === 'dm' || (selectedChat.participants && selectedChat.participants.length === 2 && selectedChat.type !== 'roster');
  let displayTitle = selectedChat.name;
  
  if (isDM) {
    const otherUser = selectedChat.participantDetails?.find(p => p.uid !== loggedInUser.uid);
    if (otherUser) {
      const freshUser = userProfiles[otherUser.uid];
      displayTitle = freshUser ? (freshUser.playerName || otherUser.name) : otherUser.name;
    }
  }

  // Logic for subtext (participants)
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
    <div style={{ 
      padding: '15px', 
      borderBottom: `1px solid ${COLORS.border}`, 
      backgroundColor: COLORS.background, 
      boxSizing: 'border-box', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center' 
    }}>
      
      <div style={{ flex: 1, textAlign: 'center' }}>
        <h3 style={{ margin: 0 }}>{displayTitle}</h3>
        {displaySubtext && (
          <span style={{ fontSize: '12px', color: '#888' }}>
            {displaySubtext}
          </span>
        )}
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
                  onClick={onRenameGroup}
                  style={{ display: 'block', width: '100%', padding: '12px', textAlign: 'left', background: 'none', border: 'none', color: 'white', cursor: 'pointer', borderBottom: '1px solid #333' }}
                >
                  Rename Group
                </button>
            )}
            
            <button 
              onClick={() => onDeleteChat(selectedChat)}
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
  );
};

export default ChatHeader;