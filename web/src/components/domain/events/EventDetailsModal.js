import React, { useState, useEffect } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import Avatar from '../../ui/Avatar';
import RSVPSelector from './RSVPSelector';
import UniversalSearch from '../shared/UniversalSearch'; 
import { useEventLogic } from '../../../hooks/useEventLogic';
import { useAuth } from '../../../context/AuthContext';
import { MapPin, Clock, Calendar as CalIcon, Users, Lock, MessageSquare, X, Send, Shield } from 'lucide-react';
import { COLORS } from '../../../lib/constants';

const EventDetailsModal = ({ event, isOpen, onClose }) => {
  const { loggedInUser } = useAuth();
  const { submitRSVP, inviteUsersToEvent, loading } = useEventLogic();
  
  const [selectedOption, setSelectedOption] = useState(null);
  const [note, setNote] = useState('');
  const [showResponsesModal, setShowResponsesModal] = useState(false);
  const [showInviteesModal, setShowInviteesModal] = useState(false);
  const [isEditingResponse, setIsEditingResponse] = useState(false);
  const [shareList, setShareList] = useState([]);

  useEffect(() => {
      if (event && loggedInUser) {
          const myResponse = event.responses?.[loggedInUser.uid];
          setSelectedOption(myResponse?.response || null);
          setNote(myResponse?.note || '');
          setIsEditingResponse(!myResponse);
      }
  }, [event, loggedInUser]);

  if (!event) return null;

  const startDate = new Date(event.startDateTime);
  const now = new Date();
  const isLocked = now > (event.responseDeadline ? new Date(event.responseDeadline) : startDate);
  const myResponse = event.responses?.[loggedInUser?.uid];
  const canShare = event.allowInviteOthers === true || event.authorId === loggedInUser?.uid;

  // Calculate Pending
  const respondedIds = Object.keys(event.responses || {});
  const pendingCount = (event.invitees || []).filter(uid => !respondedIds.includes(uid)).length;

  const handleSaveRSVP = async () => {
    if (!selectedOption) return;
    await submitRSVP(event.id, selectedOption, note);
    setIsEditingResponse(false);
  };

  const handleInviteSelected = async () => {
      if (shareList.length === 0) return;
      // Filter for users only when sharing via this modal (simplified flow)
      const uids = shareList.filter(i => i.type === 'user').map(u => u.id);
      if (uids.length > 0) await inviteUsersToEvent(event.id, event.title, uids);
      setShareList([]); 
  };

  const getResponseLabel = (val) => {
      const opt = event.rsvpOptions.find(o => o.value === val);
      return opt ? opt.label : val;
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Event Details">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 1. DETAILS SECTION */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: 0 }}>{event.title}</h2>
              {isLocked && <span style={{ backgroundColor: '#7f1d1d', color: '#fecaca', fontSize: '12px', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Lock size={12}/> Locked</span>}
            </div>
            <p style={{ color: '#9ca3af', marginTop: '4px', fontSize: '14px' }}>{event.description}</p>
            
            <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', backgroundColor: '#252525', padding: '15px', borderRadius: '8px', border: `1px solid ${COLORS.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d1d5db' }}><CalIcon size={18} color={COLORS.primary}/> {startDate.toLocaleDateString()}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d1d5db' }}><Clock size={18} color={COLORS.primary}/> {startDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d1d5db', gridColumn: '1 / -1' }}><MapPin size={18} color={COLORS.primary}/> {event.location}</div>
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: COLORS.border }} />

          {/* 2. INVITES SECTION (New) */}
          <div>
              <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '10px' }}>Invites</h4>
              
              {/* Linked Groups */}
              {event.linkedGroups && event.linkedGroups.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                      {event.linkedGroups.map((g, idx) => (
                          <div key={idx} style={{ backgroundColor: '#333', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', color: '#ddd', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {g.type === 'roster' ? <Shield size={12}/> : <Users size={12}/>}
                              {g.label}
                          </div>
                      ))}
                  </div>
              )}

              <Button variant="secondary" style={{ width: '100%' }} onClick={() => setShowInviteesModal(true)}>
                  View Invitees ({pendingCount} Pending)
              </Button>
          </div>

          <div style={{ height: '1px', backgroundColor: COLORS.border }} />

          {/* 3. RESPONSES SECTION */}
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '15px' }}>Responses</h4>
            
            {/* Logic: If response exists & not editing, show details. Else show form. */}
            {!isEditingResponse && myResponse ? (
                <div style={{ backgroundColor: '#252525', padding: '15px', borderRadius: '8px', border: `1px solid ${COLORS.border}`, marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>You responded:</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>{getResponseLabel(myResponse.response)}</div>
                    </div>
                    {!isLocked && <Button size="sm" variant="secondary" onClick={() => setIsEditingResponse(true)}>Change</Button>}
                </div>
            ) : (
                !isLocked && (
                    <div style={{ marginBottom: '15px' }}>
                        <RSVPSelector options={event.rsvpOptions || []} selectedValue={selectedOption} onChange={setSelectedOption} disabled={loading} />
                        <div style={{ marginTop: '10px' }}>
                            <input 
                                type="text" 
                                style={{ width: '100%', padding: '10px', backgroundColor: '#252525', border: `1px solid ${COLORS.border}`, borderRadius: '6px', color: 'white', outline: 'none' }} 
                                placeholder="Add note (optional)..." 
                                value={note} 
                                onChange={e => setNote(e.target.value)} 
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', gap: '10px' }}>
                            {myResponse && <Button variant="ghost" onClick={() => setIsEditingResponse(false)}>Cancel</Button>}
                            <Button onClick={handleSaveRSVP} isLoading={loading} disabled={!selectedOption}>Submit Response</Button>
                        </div>
                    </div>
                )
            )}
            <Button variant="secondary" style={{ width: '100%' }} onClick={() => setShowResponsesModal(true)}>
                <Users size={16} style={{ marginRight: '8px' }}/> View Responses
            </Button>
          </div>

          {/* 4. SHARE SECTION (Conditional) */}
          {canShare && (
              <>
                <div style={{ height: '1px', backgroundColor: COLORS.border }} />
                <div>
                    <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '10px' }}>Share Event</h4>
                    <UniversalSearch onSelectionChange={setShareList} placeholder="Invite others..." />
                    {shareList.length > 0 && (
                        <div style={{ marginTop: '10px', textAlign: 'right' }}>
                            <Button onClick={handleInviteSelected} isLoading={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Send size={14} /> Invite Selected
                            </Button>
                        </div>
                    )}
                </div>
              </>
          )}
        </div>
      </Modal>

      {/* OVERLAY: RESPONSES */}
      {showResponsesModal && (
          <OverlayModal title="Responders" onClose={() => setShowResponsesModal(false)}>
              {Object.values(event.responses || {}).map((resp, idx) => (
                  <ResponderRow key={idx} response={resp} />
              ))}
          </OverlayModal>
      )}

      {/* OVERLAY: INVITEES (Pending) */}
      {showInviteesModal && (
          <OverlayModal title="Pending Invitees" onClose={() => setShowInviteesModal(false)}>
              {(event.invitees || [])
                  .filter(uid => !Object.keys(event.responses || {}).includes(uid))
                  .map((uid, idx) => (
                      <div key={idx} style={{ padding: '10px', borderBottom: `1px solid ${COLORS.border}`, color: '#ccc', fontSize: '13px' }}>
                          User ID: {uid.substring(0, 8)}... (Pending)
                      </div>
                  ))
              }
              {pendingCount === 0 && <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>No pending invites.</p>}
          </OverlayModal>
      )}
    </>
  );
};

// Helper Components
const OverlayModal = ({ title, children, onClose }) => (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2100 }} onClick={onClose}>
        <div onClick={e => e.stopPropagation()} style={{ backgroundColor: COLORS.sidebar, width: '100%', maxWidth: '400px', borderRadius: '12px', border: `1px solid ${COLORS.border}`, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: 'white', fontSize: '18px' }}>{title}</h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>{children}</div>
        </div>
    </div>
);

const ResponderRow = ({ response }) => {
    const [showNote, setShowNote] = useState(false);
    
    // Style logic for badges
    const getBadgeStyle = () => {
        const base = { padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' };
        if (response.response === 'yes') return { ...base, backgroundColor: '#14532d', color: '#bbf7d0' };
        if (response.response === 'no') return { ...base, backgroundColor: '#7f1d1d', color: '#fecaca' };
        return { ...base, backgroundColor: '#1e3a8a', color: '#bfdbfe' };
    };

    return (
        <div style={{ backgroundColor: '#252525', padding: '12px', borderRadius: '6px', border: `1px solid ${COLORS.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Avatar size={32} text={response.userName?.[0]} src={response.userAvatar} />
                    <div>
                        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>{response.userName}</div>
                        <div style={{ fontSize: '11px', color: '#666' }}>{new Date(response.timestamp).toLocaleDateString()}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={getBadgeStyle()}>{response.response}</span>
                    {response.note && (
                        <button onClick={() => setShowNote(!showNote)} style={{ background: 'none', border: 'none', color: showNote ? '#818cf8' : '#666', cursor: 'pointer' }}>
                            <MessageSquare size={16} />
                        </button>
                    )}
                </div>
            </div>
            {showNote && response.note && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#d1d5db', backgroundColor: '#333', padding: '8px', borderRadius: '4px', borderLeft: '2px solid #818cf8', fontStyle: 'italic' }}>
                    "{response.note}"
                </div>
            )}
        </div>
    );
};

export default EventDetailsModal;