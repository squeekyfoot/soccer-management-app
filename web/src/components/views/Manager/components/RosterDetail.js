import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';

// Hooks
import { useRosterManager } from '../../../../hooks/useRosterManager';
import { useLeagueManager } from '../../../../hooks/useLeagueManager';
import { useGroupManager } from '../../../../hooks/useGroupManager';
import { useChat } from '../../../../context/ChatContext'; 
import { useDirectMessage } from '../../../../hooks/useDirectMessage';

// UI
import Card from '../../../common/Card';
import Button from '../../../common/Button';
import Modal from '../../../common/Modal';
import UserSearch from '../../../shared/UserSearch';
import Header from '../../../common/Header';
import { COLORS } from '../../../../lib/constants';
import { UserPlus, Edit2, Save, X, MessageCircle, Calendar, Clock, Trophy, Link, CheckCircle, AlertCircle, RefreshCw, Unlink } from 'lucide-react';

const RosterDetail = ({ rosterId, onBack }) => {
  const navigate = useNavigate();
  
  // Use New Hooks
  const { updateRoster, addPlayerToRoster, removePlayerFromRoster, createTeamChat } = useRosterManager();
  const { createGroup, linkGroupToRoster, unlinkGroupFromRoster, fetchUserGroups, addGroupMembers } = useGroupManager();
  const { fetchLeagues } = useLeagueManager();
  
  const { myChats, unlinkChatFromRoster } = useChat(); 
  const { startDirectChat } = useDirectMessage();

  // --- LOCAL DATA STATE ---
  const [roster, setRoster] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [myGroups, setMyGroups] = useState([]);

  // --- UI STATE ---
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showGroupSelectModal, setShowGroupSelectModal] = useState(false); 
  const [selectedPlayer, setSelectedPlayer] = useState(null); 
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [targetGroupId, setTargetGroupId] = useState("");
  const [playerForGroup, setPlayerForGroup] = useState(null);
  const [searchKey, setSearchKey] = useState(0); 

  // 1. Live Listen to Roster (Fixes Prop Drilling / Stale Data)
  useEffect(() => {
    if (!rosterId) return;
    const unsub = onSnapshot(doc(db, "rosters", rosterId), (doc) => {
        if (doc.exists()) {
            const data = { id: doc.id, ...doc.data() };
            setRoster(data);
            // Sync Edit Form if not currently editing to keep fresh
            if (!isEditing) {
                setEditForm({
                    name: data.name || '',
                    season: data.season || '',
                    maxCapacity: data.maxCapacity || 20,
                    targetPlayerCount: data.targetPlayerCount || 20,
                    isDiscoverable: data.isDiscoverable || false,
                    leagueId: data.leagueId || '',
                    lookingForPlayers: data.lookingForPlayers || false,
                    pastSeasonsCount: data.pastSeasonsCount || 0,
                    managerName: data.managerName || ''
                });
            }
        }
    });
    return () => unsub();
  }, [rosterId, isEditing]);

  // 2. Load Leagues & Groups
  useEffect(() => {
      const loadAuxData = async () => {
          const ls = await fetchLeagues();
          setLeagues(ls);
          // Fetch groups for the current manager to allow linking
          const gs = await fetchUserGroups(); 
          setMyGroups(gs);
      };
      loadAuxData();
  }, []); 

  if (!roster) return <div style={{ padding: '20px' }}>Loading Roster...</div>;

  // --- DERIVED DATA ---
  const linkedChat = myChats.find(c => c.rosterId === roster.id);
  const linkedGroup = myGroups.find(g => g.associatedRosterId === roster.id);
  const currentLeague = leagues.find(l => l.id === (isEditing ? editForm.leagueId : roster.leagueId));

  // --- HANDLERS ---

  const handleEditChange = (field, value) => {
      setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const saveRosterDetails = async () => {
      const updates = { ...editForm };
      if (updates.leagueId) {
          const l = leagues.find(x => x.id === updates.leagueId);
          if (l) updates.leagueName = l.name;
      } else {
          updates.leagueName = "";
      }

      const success = await updateRoster(roster.id, updates);
      if (success) setIsEditing(false);
  };

  const handleInitiateAdd = (e) => {
      e.preventDefault();
      if (selectedEmails.length === 0) return;
      setTargetGroupId(linkedGroup ? linkedGroup.id : "");
      setShowAddModal(false);
      setShowConfirmModal(true);
  };

  const executeAdd = async () => {
      for (const email of selectedEmails) {
          await addPlayerToRoster(roster.id, email);
      }
      setSelectedEmails([]);
      setSearchKey(k => k + 1);
      setShowConfirmModal(false);
  };

  // --- CONNECTION HANDLERS ---

  // GROUP
  const handleCreateGroup = async () => {
      if (!window.confirm("Create a new community group for this roster?")) return;
      await createGroup({
          name: roster.name,
          description: `Official group for ${roster.name}`,
          isPublic: false,
          associatedRosterId: roster.id
      });
  };

  const handleUnlinkGroup = async () => {
      if (!linkedGroup) return;
      if (window.confirm(`Unlink "${linkedGroup.name}" from this roster?`)) {
          await unlinkGroupFromRoster(linkedGroup.id);
      }
  };

  const handleChangeGroup = async (newGroupId) => {
      if (linkedGroup) await unlinkGroupFromRoster(linkedGroup.id);
      await linkGroupToRoster(newGroupId, roster.id);
      setShowGroupSelectModal(false);
  };

  // CHAT
  const handleCreateChat = async () => {
      if (!window.confirm("Create a new team chat for this roster? All current players will be added.")) return;
      const success = await createTeamChat(roster.id, roster.name, roster.season, roster.players);
      if (success) alert("Chat Created!");
  };

  const handleUnlinkChat = async () => {
      if (!linkedChat) return;
      if (window.confirm("This will unlink the current chat (converting it to a normal group) and CREATE A NEW one for the team. Continue?")) {
          // 1. Unlink Old
          await unlinkChatFromRoster(linkedChat.id);
          
          // 2. Create New with Custom Message
          const customMsg = `Manager has re-created a new chat for the team.`;
          await createTeamChat(roster.id, roster.name, roster.season, roster.players, customMsg);
          
          alert("Team chat recreated.");
      }
  };

  return (
    <div className="view-container">
      <Header 
        title={isEditing ? "Edit Roster Details" : roster.name}
        style={{ maxWidth: '1000px', margin: '0 auto' }}
        onBack={onBack}
        actions={
           <div style={{ display: 'flex', gap: '10px' }}>
               {!isEditing ? (
                   <>
                    <Button onClick={() => setIsEditing(true)} style={{ padding: 0, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: '#444' }}>
                        <Edit2 size={16} />
                    </Button>
                    <Button onClick={() => setShowAddModal(true)} style={{ padding: 0, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                        <UserPlus size={18} />
                    </Button>
                   </>
               ) : (
                   <Button onClick={() => setIsEditing(false)} variant="secondary" style={{ padding: 0, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                        <X size={18} />
                   </Button>
               )}
           </div>
        }
      />
      <div className="view-content">
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
          
          <div style={{ background: '#1e1e1e', padding: '24px', borderRadius: '12px', marginBottom: '30px' }}>
              {!isEditing ? (
                  // --- VIEW MODE ---
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                        <div>
                            <h2 style={{ marginTop: 0, marginBottom: '5px', fontSize: '28px' }}>
                                {roster.name}
                            </h2>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {roster.leagueName && <span style={styles.badge}>{roster.leagueName}</span>}
                                {roster.season && <span style={{ color: '#aaa' }}>{roster.season}</span>}
                                {roster.lookingForPlayers && <span style={{...styles.badge, background: COLORS.success}}>Recruiting</span>}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px', background: '#252525', padding: '15px', borderRadius: '8px' }}>
                        <div>
                            <div style={styles.statLabel}>Roster Status</div>
                            <div style={styles.statValue}>{roster.players?.length || 0} / {roster.maxCapacity}</div>
                            <div style={{ fontSize: '11px', color: '#666' }}>Target: {roster.targetPlayerCount || roster.maxCapacity}</div>
                        </div>
                        <div>
                            <div style={styles.statLabel}>Manager</div>
                            <div style={styles.statValue}>{roster.managerName || "Unknown"}</div>
                        </div>
                        {currentLeague ? (
                            <>
                                <div>
                                    <div style={styles.statLabel}>Frequency</div>
                                    <div style={styles.statValue}>{currentLeague.gameFrequency}</div>
                                    <div style={{ fontSize: '11px', color: '#666' }}>{currentLeague.gameDays?.join(', ')}</div>
                                </div>
                                <div>
                                    <div style={styles.statLabel}>Deadline</div>
                                    <div style={{...styles.statValue, color: '#ffab40'}}>{currentLeague.registrationDeadline}</div>
                                </div>
                            </>
                        ) : (
                            <div style={{ color: '#666', fontStyle: 'italic', display: 'flex', alignItems: 'center' }}>No League Linked</div>
                        )}
                    </div>

                    {/* --- ROSTER CONNECTIONS SECTION --- */}
                    <div style={{ marginBottom: '20px', background: '#252525', padding: '15px', borderRadius: '8px', borderLeft: `4px solid ${COLORS.primary}` }}>
                        <h4 style={{ margin: '0 0 15px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Link size={16} /> Roster Connections
                        </h4>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {/* 1. Community Group */}
                            <div>
                                <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>COMMUNITY GROUP</div>
                                {linkedGroup ? (
                                    <div style={styles.connectionCard}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', marginBottom: '8px' }}>
                                            <CheckCircle size={14} color={COLORS.success} />
                                            <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{linkedGroup.name}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <Button variant="secondary" onClick={() => navigate(`/community/${linkedGroup.id}`)} style={styles.xsBtn}>View</Button>
                                            <Button variant="secondary" onClick={() => setShowGroupSelectModal(true)} style={styles.xsBtn}>Change</Button>
                                            <Button variant="danger" onClick={handleUnlinkGroup} style={styles.xsBtn}><Unlink size={12} /></Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={styles.connectionCard}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#aaa', marginBottom: '8px' }}>
                                            <AlertCircle size={14} />
                                            <span>Not Linked</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <Button onClick={handleCreateGroup} style={styles.xsBtn}>Create New</Button>
                                            <Button variant="secondary" onClick={() => setShowGroupSelectModal(true)} style={styles.xsBtn}>Link Existing</Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 2. Team Chat */}
                            <div>
                                <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>ROSTER CHAT</div>
                                {linkedChat ? (
                                    <div style={styles.connectionCard}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', marginBottom: '8px' }}>
                                            <CheckCircle size={14} color={COLORS.success} />
                                            <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Active</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <Button variant="secondary" onClick={() => navigate(`/messages/${linkedChat.id}`)} style={styles.xsBtn}>Open</Button>
                                            <Button variant="danger" onClick={handleUnlinkChat} style={styles.xsBtn}>Recreate</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={styles.connectionCard}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#aaa', marginBottom: '8px' }}>
                                            <AlertCircle size={14} />
                                            <span>Not Linked</span>
                                        </div>
                                        <Button onClick={handleCreateChat} style={styles.xsBtn}>
                                            <RefreshCw size={12} style={{ marginRight: '4px' }} /> Recreate Chat
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* League Details Expansion */}
                    {currentLeague && (
                        <div style={{ borderTop: '1px solid #333', paddingTop: '15px' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#aaa', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Trophy size={16} /> League Details
                            </h4>
                            <p style={{ color: '#ddd', fontSize: '14px', margin: 0 }}>{currentLeague.description}</p>
                            
                            <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <div style={styles.subLabel}>Season Duration</div>
                                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center', color: '#eee', fontSize: '13px' }}>
                                        <Calendar size={14}/> {currentLeague.seasonStart} - {currentLeague.seasonEnd}
                                    </div>
                                </div>
                                <div>
                                    <div style={styles.subLabel}>Game Time Window</div>
                                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center', color: '#eee', fontSize: '13px' }}>
                                        <Clock size={14}/> {currentLeague.earliestGameTime} - {currentLeague.latestGameTime}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                  </div>
              ) : (
                  // --- EDIT MODE ---
                  <div style={{ display: 'grid', gap: '15px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
                          <div>
                              <label style={styles.label}>Roster Name</label>
                              <input type="text" value={editForm.name} onChange={(e) => handleEditChange('name', e.target.value)} style={styles.input} />
                          </div>
                          <div>
                              <label style={styles.label}>Season Label</label>
                              <input type="text" value={editForm.season} onChange={(e) => handleEditChange('season', e.target.value)} style={styles.input} />
                          </div>
                      </div>

                      {/* Manager Name & League */}
                      <div>
                          <label style={styles.label}>Manager Display Name</label>
                          <input type="text" value={editForm.managerName} onChange={(e) => handleEditChange('managerName', e.target.value)} style={styles.input} placeholder="e.g. Coach Ted" />
                      </div>

                      <div>
                          <label style={styles.label}>Associated League</label>
                          <select value={editForm.leagueId} onChange={(e) => handleEditChange('leagueId', e.target.value)} style={styles.input}>
                              <option value="">-- Independent Team (No League) --</option>
                              {leagues.map(l => (
                                  <option key={l.id} value={l.id}>{l.name} ({l.seasonStart})</option>
                              ))}
                          </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                          <div>
                            <label style={styles.label}>Max Capacity</label>
                            <input type="number" value={editForm.maxCapacity} onChange={(e) => handleEditChange('maxCapacity', e.target.value)} style={styles.input} />
                          </div>
                          <div>
                            <label style={styles.label}>Target Count</label>
                            <input type="number" value={editForm.targetPlayerCount} onChange={(e) => handleEditChange('targetPlayerCount', e.target.value)} style={styles.input} />
                          </div>
                          <div>
                            <label style={styles.label}>Past Seasons</label>
                            <input type="number" value={editForm.pastSeasonsCount} onChange={(e) => handleEditChange('pastSeasonsCount', e.target.value)} style={styles.input} />
                          </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '5px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <input type="checkbox" checked={editForm.isDiscoverable} onChange={(e) => handleEditChange('isDiscoverable', e.target.checked)} style={{ width: '18px', height: '18px' }} />
                              <label style={{ color: '#eee' }}>Publicly Discoverable</label>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <input type="checkbox" checked={editForm.lookingForPlayers} onChange={(e) => handleEditChange('lookingForPlayers', e.target.checked)} style={{ width: '18px', height: '18px' }} />
                              <label style={{ color: '#eee' }}>Mark as "Looking for Players"</label>
                          </div>
                      </div>

                      <Button onClick={saveRosterDetails} style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <Save size={16} /> Save Changes
                      </Button>
                  </div>
              )}
          </div>

          {/* --- ROSTER LIST --- */}
          <div>
              <h3 style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '10px', marginBottom: '15px' }}>Active Roster</h3>
              {(!roster.players || roster.players.length === 0) ? (
                <p style={{ fontStyle: 'italic', color: '#888' }}>No players yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {roster.players.map((player) => (
                    <Card 
                        key={player.uid || player.email} 
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', marginBottom: 0, cursor: 'pointer' }}
                        hoverable
                        onClick={() => setSelectedPlayer(player)} 
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '20px', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {player.photoURL ? (
                                <img src={player.photoURL} alt={player.playerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span style={{ color: '#aaa', fontWeight: 'bold' }}>{player.playerName.charAt(0)}</span>
                            )}
                        </div>
                        <div>
                            <span style={{ fontWeight: 'bold', display: 'block', fontSize: '16px' }}>{player.playerName}</span>
                            <span style={{ fontSize: '13px', color: '#888' }}>{player.email}</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="secondary" 
                            onClick={() => { setPlayerForGroup(player); setShowGroupModal(true); }} 
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                          >
                            + Group
                          </Button>
                          <Button 
                            variant="danger" 
                            onClick={() => { if (window.confirm(`Remove ${player.playerName}?`)) removePlayerFromRoster(roster.id, player); }} 
                            style={{ padding: '6px', fontSize: '12px', minWidth: '32px' }}
                          >
                            <X size={14} />
                          </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
          </div>

          {/* --- MODALS --- */}
          {selectedPlayer && (
              <Modal title="Player Details" onClose={() => setSelectedPlayer(null)} actions={
                    <Button onClick={() => { startDirectChat(selectedPlayer.email); setSelectedPlayer(null); }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <MessageCircle size={18} /> Message Player
                    </Button>
              }>
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <h2 style={{ margin: 0 }}>{selectedPlayer.playerName}</h2>
                        <p style={{ color: '#aaa' }}>{selectedPlayer.email}</p>
                  </div>
              </Modal>
          )}

          {showAddModal && (
            <Modal title="Add Players" onClose={() => setShowAddModal(false)} actions={null}>
               <div style={{ textAlign: 'left' }}>
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

          {showConfirmModal && (
              <Modal title="Confirm Add" onClose={() => setShowConfirmModal(false)} actions={<Button onClick={executeAdd}>Add Players</Button>}>
                  <p>Adding {selectedEmails.length} players.</p>
              </Modal>
          )}

          {showGroupModal && (
              <Modal title={`Add ${playerForGroup?.playerName} to Group`} onClose={() => { setShowGroupModal(false); setPlayerForGroup(null); }} actions={null}>
                  <p style={{ color: '#ccc' }}>Select a group:</p>
                  <div style={{ display: 'grid', gap: '10px' }}>
                      {myGroups && myGroups.length > 0 ? (
                          myGroups.map(group => (
                              <Card key={group.id} onClick={async () => {
                                  if (playerForGroup && playerForGroup.email) {
                                      const success = await addGroupMembers(group.id, [playerForGroup.email]);
                                      if (success) {
                                          alert(`Added ${playerForGroup.playerName} to ${group.name}`);
                                          setShowGroupModal(false);
                                          setPlayerForGroup(null);
                                      }
                                  }
                              }} hoverable>
                                  <strong>{group.name}</strong>
                              </Card>
                          ))
                      ) : (
                          <p style={{ color: '#888', fontStyle: 'italic', textAlign: 'center' }}>No groups found.</p>
                      )}
                  </div>
              </Modal>
          )}

          {showGroupSelectModal && (
              <Modal title="Link Roster to Group" onClose={() => setShowGroupSelectModal(false)} actions={null}>
                  <p style={{ color: '#ccc' }}>Select a group to link to <strong>{roster.name}</strong>:</p>
                  <div style={{ display: 'grid', gap: '10px' }}>
                      {myGroups && myGroups.length > 0 ? (
                          myGroups.map(group => (
                              <Card key={group.id} onClick={() => handleChangeGroup(group.id)} hoverable>
                                  <strong>{group.name}</strong>
                                  {group.id === linkedGroup?.id && <span style={{ fontSize: '12px', color: COLORS.success, marginLeft: '10px' }}>(Current)</span>}
                              </Card>
                          ))
                      ) : (
                          <p style={{ color: '#888', fontStyle: 'italic', textAlign: 'center' }}>No groups found.</p>
                      )}
                  </div>
              </Modal>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
    label: { display: 'block', color: '#888', marginBottom: '5px', fontSize: '12px' },
    subLabel: { fontSize: '11px', textTransform: 'uppercase', color: '#888', marginBottom: '6px' },
    input: { width: '100%', padding: '10px', background: '#333', border: '1px solid #555', borderRadius: '6px', color: 'white', boxSizing: 'border-box' },
    badge: { backgroundColor: '#333', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', border: '1px solid #555' },
    statLabel: { fontSize: '11px', textTransform: 'uppercase', color: '#888', marginBottom: '4px' },
    statValue: { fontSize: '16px', fontWeight: 'bold', color: '#eee' },
    connectionCard: { background: '#333', padding: '12px', borderRadius: '6px', display: 'flex', flexDirection: 'column' },
    xsBtn: { fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center' }
};

export default RosterDetail;