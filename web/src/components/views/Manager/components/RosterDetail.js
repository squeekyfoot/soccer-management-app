import React, { useState } from 'react';
import Card from '../../../common/Card';
import Button from '../../../common/Button';
import Modal from '../../../common/Modal';
import UserSearch from '../../../shared/UserSearch';
import Header from '../../../common/Header';
import { COLORS } from '../../../../lib/constants';
import { UserPlus } from 'lucide-react';

const RosterDetail = ({ roster, onBack, onRemovePlayer, onAddPlayer, myGroups, onAddToGroup }) => {
  // Modal State local to this view
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [targetGroupId, setTargetGroupId] = useState("");
  const [playerForGroup, setPlayerForGroup] = useState(null);
  const [searchKey, setSearchKey] = useState(0); // For resetting search

  const handleInitiateAdd = (e) => {
      e.preventDefault();
      if (selectedEmails.length === 0) return;
      const associated = myGroups.find(g => g.associatedRosterId === roster.id);
      setTargetGroupId(associated ? associated.id : "");
      setShowAddModal(false);
      setShowConfirmModal(true);
  };

  const executeAdd = () => {
      onAddPlayer(roster.id, selectedEmails, targetGroupId);
      setSelectedEmails([]);
      setSearchKey(k => k + 1);
      setShowConfirmModal(false);
  };

  return (
    <div className="view-container">
      <Header 
        title={roster.name}
        style={{ maxWidth: '1000px', margin: '0 auto' }}
        onBack={onBack}
        actions={
           <Button onClick={() => setShowAddModal(true)} style={{ padding: 0, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
             <UserPlus size={18} />
           </Button>
        }
      />
      <div className="view-content">
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
          <p style={{ color: '#ccc', marginTop: 0 }}>
             {roster.season} • {roster.players?.length || 0} / {roster.maxCapacity} Players
             {roster.isDiscoverable && <span style={{ marginLeft: '10px', fontSize: '12px', backgroundColor: COLORS.success, padding: '2px 6px', borderRadius: '4px', color: 'white' }}>Discoverable</span>}
          </p>

          <div style={{ marginTop: '30px' }}>
              <h3 style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '10px' }}>Roster</h3>
              {(!roster.players || roster.players.length === 0) ? (
                <p style={{ fontStyle: 'italic', color: '#888' }}>No players yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {roster.players.map((player) => (
                    <Card key={player.uid || player.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', marginBottom: 0 }}>
                      <div>
                        <span style={{ fontWeight: 'bold', display: 'block' }}>{player.playerName}</span>
                        <span style={{ fontSize: '12px', color: '#aaa' }}>{player.email}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                          <Button variant="secondary" onClick={() => { setPlayerForGroup(player); setShowGroupModal(true); }} style={{ padding: '5px 10px', fontSize: '10px' }}>+ Group</Button>
                          <Button variant="danger" onClick={() => onRemovePlayer(roster.id, player)} style={{ padding: '5px 10px', fontSize: '12px' }}>Remove</Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
          </div>

          {/* Add Player Modal */}
          {showAddModal && (
            <Modal title="Add Players" onClose={() => setShowAddModal(false)} actions={null}>
               <div style={{ textAlign: 'left' }}>
                 <p style={{ marginTop: 0, fontSize: '14px', marginBottom: '15px', color: '#ccc' }}>Search for users by name or email.</p>
                 <form onSubmit={handleInitiateAdd}>
                   <UserSearch key={searchKey} onSelectionChange={setSelectedEmails} />
                   <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                      <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
                      <Button type="submit" disabled={selectedEmails.length === 0}>Continue</Button>
                   </div>
                 </form>
               </div>
            </Modal>
          )}

          {/* Confirm Add Modal */}
          {showConfirmModal && (
              <Modal title="Confirm Add" onClose={() => setShowConfirmModal(false)} actions={<Button onClick={executeAdd}>Add Players</Button>}>
                  <p style={{ color: '#ccc' }}>Adding <strong>{selectedEmails.length}</strong> player(s).</p>
                  <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '10px' }}>Add to Community Group:</label>
                      <select value={targetGroupId} onChange={(e) => setTargetGroupId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px' }}>
                          <option value="">-- No Group --</option>
                          {myGroups.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
                      </select>
                  </div>
              </Modal>
          )}

          {/* Add To Group Modal */}
          {showGroupModal && (
              <Modal title={`Add ${playerForGroup?.playerName} to Group`} onClose={() => { setShowGroupModal(false); setPlayerForGroup(null); }} actions={null}>
                  <p style={{ color: '#ccc' }}>Select a group:</p>
                  <div style={{ display: 'grid', gap: '10px' }}>
                      {myGroups.map(group => (
                          <Card key={group.id} onClick={() => { onAddToGroup(group.id, [playerForGroup.email]); setShowGroupModal(false); }} hoverable>
                              <strong>{group.name}</strong>
                          </Card>
                      ))}
                  </div>
              </Modal>
          )}
        </div>
      </div>
    </div>
  );
};

export default RosterDetail;