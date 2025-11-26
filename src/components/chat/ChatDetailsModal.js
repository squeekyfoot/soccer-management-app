import React from 'react';
import { COLORS } from '../../constants';
import Button from '../common/Button';

const ChatDetailsModal = ({ 
  chat, 
  onClose, 
  onRename, 
  onDelete, 
  userProfiles, 
  loggedInUser 
}) => {
  if (!chat) return null;

  const isOwner = chat.participantDetails?.find(p => p.uid === loggedInUser.uid)?.role === 'owner' || chat.createdBy === loggedInUser.uid;
  const isRoster = chat.type === 'roster';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2000,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '20px', boxSizing: 'border-box'
    }} onClick={onClose}>
      
      <div style={{
        backgroundColor: COLORS.sidebar, width: '100%', maxWidth: '400px',
        borderRadius: '12px', padding: '20px', position: 'relative',
        border: `1px solid ${COLORS.border}`, textAlign: 'center'
      }} onClick={e => e.stopPropagation()}>
        
        <button onClick={onClose} style={{
          position: 'absolute', top: '10px', right: '10px', background: 'none',
          border: 'none', color: '#aaa', fontSize: '20px', cursor: 'pointer'
        }}>✕</button>

        {/* Icon */}
        <div style={{ 
          width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 15px',
          backgroundColor: '#444', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '30px', overflow: 'hidden', border: `2px solid ${COLORS.primary}`
        }}>
           {chat.photoURL ? (
             <img src={chat.photoURL} alt="Chat" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
           ) : (
             <span>{chat.name?.charAt(0).toUpperCase()}</span>
           )}
        </div>

        <h3 style={{ color: 'white', margin: '0 0 5px' }}>{chat.name}</h3>
        <p style={{ color: '#888', fontSize: '12px', marginTop: 0 }}>{chat.type === 'roster' ? 'Team Roster' : 'Group Chat'}</p>

        {/* Participants List */}
        <div style={{ textAlign: 'left', marginTop: '20px', maxHeight: '200px', overflowY: 'auto' }}>
          <h4 style={{ color: '#aaa', borderBottom: '1px solid #333', paddingBottom: '5px', fontSize: '12px' }}>PARTICIPANTS</h4>
          {chat.participantDetails?.map(p => {
             const fresh = userProfiles[p.uid];
             const name = fresh ? (fresh.playerName || p.name) : p.name;
             return (
               <div key={p.uid} style={{ padding: '8px 0', borderBottom: '1px solid #333', fontSize: '14px', color: 'white' }}>
                 {name} {p.uid === loggedInUser.uid && <span style={{color: '#61dafb'}}>(You)</span>}
               </div>
             );
          })}
        </div>

        {/* Actions */}
        <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {!isRoster && (
            <Button variant="secondary" onClick={onRename} style={{ width: '100%' }}>Rename Chat</Button>
          )}
          {!isRoster && (
            <Button variant="danger" onClick={() => onDelete(chat)} style={{ width: '100%' }}>Delete Chat</Button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ChatDetailsModal;