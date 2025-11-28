import React, { useRef, useEffect } from 'react';
import { COLORS } from '../../../../constants';

const MessageList = ({ messages, loggedInUser, onImageClick, selectedChatId }) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const lastChatIdRef = useRef(null);

  // --- INSTANT SCROLL LOGIC ---
  // Switched to useEffect to run AFTER paint. 
  // This eliminates the "Forced reflow" violation.
  useEffect(() => {
    if (containerRef.current) {
      const isNewChat = lastChatIdRef.current !== selectedChatId;
      
      if (isNewChat) {
        // Jump to bottom immediately for new chat
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      } else if (messagesEndRef.current) {
        // Smooth scroll for new messages
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }

      if (messages.length > 0) {
        lastChatIdRef.current = selectedChatId;
      }
    }
  }, [messages, selectedChatId]);

  const handleImageLoad = () => {
    if (containerRef.current) {
       // Check if user is near bottom before auto-scrolling
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
        // --- SYSTEM MESSAGES ---
        if (msg.type === 'system') {
          return (
            <div key={msg.id} style={{
              alignSelf: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '5px 12px',
              margin: '10px 0',
              maxWidth: '80%'
            }}>
              <span style={{ fontSize: '12px', color: '#aaa', fontStyle: 'italic' }}>
                {msg.text}
              </span>
            </div>
          );
        }

        // --- REGULAR MESSAGES ---
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