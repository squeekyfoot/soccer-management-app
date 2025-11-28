import React, { useRef, useState } from 'react';
import { COLORS } from '../../../../constants';
import Button from '../../../common/Button';
import { Camera, UserPlus, ArrowLeft } from 'lucide-react';
import UserSearch from '../UserSearch'; // We reuse your existing UserSearch

const ChatDetailsModal = ({ 
  chat, 
  onClose, 
  onRename, 
  onDelete,
  onUpdatePhoto,
  onAddMember, // New handler
  userProfiles, 
  loggedInUser 
}) => {
  const fileInputRef = useRef(null);
  
  // Local state for the "Add Member" view
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [selectedEmailsToAdd, setSelectedEmailsToAdd] = useState([]);
  const [includeHistory, setIncludeHistory] = useState(true);

  if (!chat) return null;

  const isRoster = chat.type === 'roster';
  const isGroup = chat.type === 'group' || (chat.participants.length > 2 && !isRoster);
  
  // --- HANDLERS ---
  const handlePhotoClick = () => {
    if (isGroup && fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
        onUpdatePhoto(e.target.files[0]);
    }
  };

  const handleAddSubmit = async () => {
      if (selectedEmailsToAdd.length === 0) return;
      
      // We assume single select for simplicity, or iterate for multiple
      // Prompt said "add someone", so let's loop just in case they picked multiple
      for(const email of selectedEmailsToAdd) {
          await onAddMember(email, includeHistory);
      }
      setIsAddingMember(false);
      setSelectedEmailsToAdd([]);
  };

  // --- RENDER CONTENT ---
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
        border: `1px solid ${COLORS.border}`, textAlign: 'center',
        minHeight: '300px'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Close Button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '10px', right: '10px', background: 'none',
          border: 'none', color: '#aaa', fontSize: '20px', cursor: 'pointer'
        }}>✕</button>

        {/* --- VIEW 1: ADD MEMBER --- */}
        {isAddingMember ? (
             <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                 <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                     <button onClick={() => setIsAddingMember(false)} style={{ background:'none', border:'none', color: COLORS.primary, cursor:'pointer', marginRight:'10px' }}>
                         <ArrowLeft size={24} />
                     </button>
                     <h3 style={{ color: 'white', margin: 0 }}>Add People</h3>
                 </div>

                 <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                     <label style={{ color: '#ccc', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Search User by Email</label>
                     {/* Reuse UserSearch but control it via local state */}
                     <UserSearch onSelectionChange={setSelectedEmailsToAdd} />
                 </div>

                 {/* Include History Checkbox */}
                 <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', cursor: 'pointer' }} onClick={() => setIncludeHistory(!includeHistory)}>
                     <input 
                        type="checkbox" 
                        checked={includeHistory} 
                        onChange={(e) => setIncludeHistory(e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', marginRight: '10px' }}
                     />
                     <div style={{ textAlign: 'left' }}>
                        <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>Include Chat History</span>
                        <div style={{ color: '#888', fontSize: '11px' }}>
                            Allow new member to see previous messages
                        </div>
                     </div>
                 </div>

                 <div style={{ marginTop: 'auto' }}>
                     <Button onClick={handleAddSubmit} disabled={selectedEmailsToAdd.length === 0} style={{ width: '100%' }}>
                        Add Member
                     </Button>
                 </div>
             </div>
        ) : (
        /* --- VIEW 2: DETAILS (DEFAULT) --- */
            <>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />

                <div 
                  onClick={handlePhotoClick}
                  style={{ 
                    width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 15px',
                    backgroundColor: '#444', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '30px', overflow: 'hidden', border: `2px solid ${COLORS.primary}`,
                    position: 'relative', cursor: isGroup ? 'pointer' : 'default'
                }}>
                   {chat.photoURL ? (
                     <img src={chat.photoURL} alt="Chat" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                   ) : (
                     <span>{chat.name?.charAt(0).toUpperCase()}</span>
                   )}
                   {isGroup && (
                       <div style={{
                           position: 'absolute', bottom: 0, left: 0, width: '100%', height: '25px',
                           backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center'
                       }}>
                           <Camera size={14} color="white" />
                       </div>
                   )}
                </div>

                <h3 style={{ color: 'white', margin: '0 0 5px' }}>{chat.name}</h3>
                <p style={{ color: '#888', fontSize: '12px', marginTop: 0 }}>
                    {isRoster ? 'Team Roster' : (isGroup ? 'Group Chat' : 'Direct Message')}
                </p>

                {/* Participants List */}
                <div style={{ textAlign: 'left', marginTop: '20px', maxHeight: '200px', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '5px', marginBottom: '5px' }}>
                      <h4 style={{ color: '#aaa', margin: 0, fontSize: '12px' }}>PARTICIPANTS</h4>
                      {isGroup && (
                          <button 
                             onClick={() => setIsAddingMember(true)}
                             style={{ background: 'none', border: 'none', color: COLORS.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '12px' }}
                          >
                             <UserPlus size={14} style={{ marginRight: '4px' }} /> Add
                          </button>
                      )}
                  </div>
                  
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
                  {isGroup && (
                    <Button variant="secondary" onClick={onRename} style={{ width: '100%' }}>Rename Chat</Button>
                  )}
                  
                  {!isRoster && (
                    <Button variant="danger" onClick={() => onDelete(chat)} style={{ width: '100%' }}>
                        {isGroup ? "Leave Group & Delete Chat" : "Delete Chat"}
                    </Button>
                  )}
                </div>
            </>
        )}

      </div>
    </div>
  );
};

export default ChatDetailsModal;