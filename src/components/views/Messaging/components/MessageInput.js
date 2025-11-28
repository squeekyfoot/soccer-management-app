import React from 'react';
import { Send, Paperclip } from 'lucide-react'; 
import { COLORS } from '../../../../config/constants';

const MessageInput = ({
  messageText,
  onMessageChange,
  onSend,
  selectedFile,
  onFileChange,
  onRemoveFile,
  fileInputRef,
  isCollapsed,
  canSend
}) => {
  return (
    <form onSubmit={onSend} style={{ 
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
          <button type="button" onClick={onRemoveFile} style={{ background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer' }}>✕</button>
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
        <input 
          type="file" 
          accept="image/*"
          ref={fileInputRef}
          onChange={onFileChange}
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
          placeholder="Type a message..."
          value={messageText}
          onChange={(e) => onMessageChange(e.target.value)}
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
            disabled={!canSend}
            style={{ 
                padding: isCollapsed ? '10px' : '10px 20px', 
                borderRadius: '20px', 
                border: 'none', 
                backgroundColor: canSend ? COLORS.primary : '#444', 
                color: canSend ? '#000' : '#888', 
                fontWeight: 'bold', 
                cursor: canSend ? 'pointer' : 'not-allowed',
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
        >
          {isCollapsed ? <Send size={20} /> : "Send"}
        </button>
      </div>
    </form>
  );
};

export default MessageInput;