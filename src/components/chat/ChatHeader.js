import React from 'react';
import { ChevronLeft, MoreVertical } from 'lucide-react'; 
import { COLORS } from '../../constants';

const ChatHeader = ({ 
  selectedChat, 
  userProfiles, 
  loggedInUser, 
  onShowDetails, 
  onBack,
  totalUnreadCount
}) => {
  if (!selectedChat) return null;

  // Logic to determine display title & image
  const isDM = selectedChat.type === 'dm' || (selectedChat.participants && selectedChat.participants.length === 2 && selectedChat.type !== 'roster');
  let displayTitle = selectedChat.name;
  let iconImage = null;
  
  if (isDM) {
    const otherUser = selectedChat.participantDetails?.find(p => p.uid !== loggedInUser.uid);
    if (otherUser) {
      const freshUser = userProfiles[otherUser.uid];
      displayTitle = freshUser ? (freshUser.playerName || otherUser.name) : otherUser.name;
      iconImage = freshUser ? freshUser.photoURL : otherUser.photoURL;
    }
  } else if (selectedChat.type === 'roster') {
      displayTitle = `⚽ ${selectedChat.name}`;
  }

  return (
    <div style={{ 
      padding: '10px', 
      borderBottom: `1px solid ${COLORS.border}`, 
      backgroundColor: COLORS.background, 
      boxSizing: 'border-box', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      minHeight: '100px' // Height to fit vertical stack
    }}>
      
      {/* LEFT: Back Button (Mobile Only) */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', minWidth: '60px' }}>
        {onBack && (
          <button 
            onClick={onBack}
            style={{ 
              background: 'none', border: 'none', color: COLORS.primary, 
              cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '16px', fontWeight: '500'
            }}
          >
            <ChevronLeft size={28} />
            {totalUnreadCount > 0 && (
              <span style={{ 
                backgroundColor: COLORS.primary, color: '#000', 
                borderRadius: '50%', width: '20px', height: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 'bold', marginLeft: '2px'
              }}>
                {totalUnreadCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* CENTER: Chat Info (Clickable) - Vertical Stack */}
      <div 
        onClick={onShowDetails}
        style={{ 
          flex: 2, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',    
          justifyContent: 'center',
          cursor: 'pointer' 
        }}
      >
         {/* 1. Avatar (Top) - Increased Size 50px */}
         <div style={{ 
           width: '50px', height: '50px', borderRadius: '50%', 
           backgroundColor: '#444', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
           fontSize: '20px', border: '1px solid #666', marginBottom: '6px'
         }}>
           {iconImage ? (
             <img src={iconImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
           ) : (
             <span>{displayTitle.charAt(0)}</span>
           )}
         </div>

         {/* 2. Chat Name (Middle) */}
         <h3 style={{ 
             margin: 0, 
             fontSize: '16px', 
             whiteSpace: 'nowrap', 
             overflow: 'hidden', 
             textOverflow: 'ellipsis', 
             maxWidth: '200px',
             lineHeight: '1.2'
         }}>
           {displayTitle}
         </h3>

         {/* 3. Member Count (Bottom) */}
         {!isDM && (
           <span style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
             {selectedChat.participantDetails?.length || 0} members
           </span>
         )}
      </div>

      {/* RIGHT: Action Indicator (Vertical Ellipsis) */}
      <div 
        onClick={onShowDetails}
        style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', cursor: 'pointer' }}
      >
        <MoreVertical size={24} color="#666" />
      </div>

    </div>
  );
};

export default ChatHeader;