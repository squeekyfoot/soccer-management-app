import React, { useRef, useLayoutEffect } from 'react';
import { COLORS } from '../../constants';

const MessageList = ({ messages, loggedInUser, onImageClick, selectedChatId }) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const lastChatIdRef = useRef(null);

  // --- INSTANT SCROLL LOGIC ---
  // We moved this from TeamChat.js to here. 
  // It now reacts specifically to changes in the 'messages' prop.
  useLayoutEffect(() => {
    if (containerRef.current) {
      const isNewChat = lastChatIdRef.current !== selectedChatId;
      
      if (isNewChat) {
        // Instant jump for new chat
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      } else if (messagesEndRef.current) {
        // Smooth scroll for new message in same chat
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }

      // Update ref tracking
      if (messages.length > 0) {
        lastChatIdRef.current = selectedChatId;
      }
    }
  }, [messages, selectedChatId]);

  const handleImageLoad = () => {
    if (containerRef.current) {
       const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
       const isNearBottom = scrollHeight - scrollTop - clientHeight < 500;
       if (isNearBottom) {
         containerRef.current.scrollTop = containerRef.current.scrollHeight;
       }
    }
  };

  return (
    <div 
      ref={containerRef} 
      style={{ 
        flex: 1, 
        padding: '20px', 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '10px', 
        boxSizing: 'border-box' 
      }}
    >
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
                  onClick={() => onImageClick(msg.imageUrl)}
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
  );
};

export default MessageList;