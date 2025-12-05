import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRosterManager } from '../../../hooks/useRosterManager';
import { useGroupManager } from '../../../hooks/useGroupManager';
import { useLeagueManager } from '../../../hooks/useLeagueManager';
import { useChat } from '../../../context/ChatContext';
import { useDirectMessage } from '../../../hooks/useDirectMessage';
import { useAuth } from '../../../context/AuthContext';

// UI
import Header from '../../ui/Header';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Input from '../../ui/Input'; // Assuming you have this from CreateRosterForm
import Modal from '../../ui/Modal';
import UserSearch from '../users/UserSearch';
import { COLORS } from '../../../lib/constants';
import { 
  UserPlus, Edit2, Save, X, MessageCircle, Calendar, Clock, Trophy, 
  Link as LinkIcon, CheckCircle, AlertCircle, RefreshCw, Unlink, Mail, Phone, User 
} from 'lucide-react';

const RosterDetail = ({ rosterId, initialRosterData, viewMode = 'view', onBack }) => {
  const navigate = useNavigate();
  const { loggedInUser } = useAuth();
  const isManager = viewMode === 'manager';

  // Hooks
  const { 
    subscribeToRoster, updateRoster, addPlayerToRoster, 
    removePlayerFromRoster, createTeamChat 
  } = useRosterManager();
  
  const { 
    createGroup, linkGroupToRoster, unlinkGroupFromRoster, 
    fetchUserGroups, addGroupMembers 
  } = useGroupManager();
  
  const { fetchLeagues } = useLeagueManager();
  const { myChats, unlinkChatFromRoster } = useChat();
  const { startDirectChat } = useDirectMessage();

  // State
  const [roster, setRoster] = useState(initialRosterData || null);
  const [leagues, setLeagues] = useState([]);
  const [myGroups, setMyGroups] = useState([]); // For linking groups (Manager only)
  
  // UI State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGroupSelectModal, setShowGroupSelectModal] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [searchKey, setSearchKey] = useState(0);

  // 1. Subscription (Live Data for everyone)
  useEffect(() => {
    if (!rosterId) return;
    const unsub = subscribeToRoster(rosterId, (data) => {
        setRoster(data);
        if (data && !isEditing) {
            setEditForm({
                name: data.name || '',
                season: data.season || '',
                maxCapacity: data.maxCapacity || 20,
                targetPlayerCount: data.targetPlayerCount || 20,
                isDiscoverable: data.isDiscoverable || false,
                leagueId: data.leagueId || '',
                managerName: data.managerName || '',
                lookingForPlayers: data.lookingForPlayers || false,
                pastSeasonsCount: data.pastSeasonsCount || 0
            });
        }
    });
    return () => unsub();
  }, [rosterId, isEditing, subscribeToRoster]);

  // 2. Load Aux Data
  useEffect(() => {
    const load = async () => {
        const ls = await fetchLeagues();
        setLeagues(ls);
        if (isManager && loggedInUser) {
            const gs = await fetchUserGroups(loggedInUser.uid);
            setMyGroups(gs);
        } else {
            // For players, we might want to fetch just the linked group? 
            // Currently handled by 'associatedRosterId' check on the roster object or separate fetch.
            // Simplified: We rely on the `roster` object or global group context if needed.
        }
    };
    load();
  }, [isManager, loggedInUser, fetchLeagues, fetchUserGroups]);

  if (!roster) return <div style={{ padding: '20px', color: '#888' }}>Loading Roster...</div>;

  // Derived Data
  const linkedChat = myChats.find(c => c.rosterId === roster.id);
  // Note: For managers, we check their owned groups. For players, we might need a different check, 
  // but for now let's assume we find it via the roster's link or the user's membership.
  // Ideally, the Roster object should store `linkedGroupId`. If not, we search.
  const linkedGroup = (isManager ? myGroups : []).find(g => g.associatedRosterId === roster.id);
  const currentLeague = leagues.find(l => l.id === (isEditing ? editForm.leagueId : roster.leagueId));

  // --- HANDLERS ---
  const handleEditSave = async () => {
      const updates = { ...editForm };
      if (updates.leagueId) {
          const l = leagues.find(x => x.id === updates.leagueId);
          if (l) updates.leagueName = l.name;
      }
      await updateRoster(roster.id, updates);
      setIsEditing(false);
  };

  const handleAddPlayers = async () => {
      for (const email of selectedEmails) {
          await addPlayerToRoster(roster.id, email);
      }
      setShowAddModal(false);
      setSelectedEmails([]);
      setSearchKey(k => k + 1);
  };

  // --- RENDER HELPERS ---
  
  const renderHeader = () => (
      <Header 
        title={isEditing ? "Edit Roster" : roster.name}
        onBack={onBack}
        style={{ maxWidth: '1000px', margin: '0 auto' }}
        actions={isManager && (
            <div style={{ display: 'flex', gap: '10px' }}>
                {!isEditing ? (
                   <>
                    <Button onClick={() => setIsEditing(true)} style={styles.iconBtn}><Edit2 size={16} /></Button>
                    <Button onClick={() => setShowAddModal(true)} style={styles.iconBtn}><UserPlus size={18} /></Button>
                   </>
                ) : (
                   <Button onClick={() => setIsEditing(false)} variant="secondary" style={styles.iconBtn}><X size={18} /></Button>
                )}
            </div>
        )}
      />
  );

  const renderStats = () => (
      <div style={styles.statsGrid}>
          <div>
              <div style={styles.statLabel}>Roster</div>
              <div style={styles.statValue}>{roster.players?.length || 0} / {roster.maxCapacity}</div>
          </div>
          <div>
              <div style={styles.statLabel}>Manager</div>
              <div style={styles.statValue}>{roster.managerName || "Unknown"}</div>
          </div>
          {currentLeague && (
              <>
                <div>
                    <div style={styles.statLabel}>Frequency</div>
                    <div style={styles.statValue}>{currentLeague.gameFrequency}</div>
                </div>
                <div>
                    <div style={styles.statLabel}>Deadline</div>
                    <div style={{...styles.statValue, color: COLORS.warning}}>{currentLeague.registrationDeadline}</div>
                </div>
              </>
          )}
      </div>
  );

  const renderConnections = () => (
      <div style={styles.sectionBox}>
          <h4 style={styles.sectionTitle}><LinkIcon size={16} /> Team Resources</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Group */}
              <div>
                  <div style={styles.subLabel}>COMMUNITY GROUP</div>
                  {linkedGroup ? (
                      <div style={styles.connectionCard}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', marginBottom: '8px' }}>
                              <CheckCircle size={14} color={COLORS.success} />
                              <span style={{ fontWeight: 'bold' }}>{linkedGroup.name}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '5px' }}>
                             <Button variant="secondary" onClick={() => navigate(`/community/${linkedGroup.id}`)} style={styles.xsBtn}>View</Button>
                             {isManager && <Button variant="danger" onClick={() => unlinkGroupFromRoster(linkedGroup.id)} style={styles.xsBtn}><Unlink size={12}/></Button>}
                          </div>
                      </div>
                  ) : (
                      <div style={styles.connectionCard}>
                          <span style={{ color: '#aaa', fontSize: '13px', marginBottom: '5px', display: 'block' }}>Not Linked</span>
                          {isManager && (
                              <div style={{ display: 'flex', gap: '5px' }}>
                                <Button onClick={() => createGroup({ name: roster.name, isPublic: false, associatedRosterId: roster.id })} style={styles.xsBtn}>Create</Button>
                                <Button variant="secondary" onClick={() => setShowGroupSelectModal(true)} style={styles.xsBtn}>Link</Button>
                              </div>
                          )}
                      </div>
                  )}
              </div>

              {/* Chat */}
              <div>
                  <div style={styles.subLabel}>ROSTER CHAT</div>
                  {linkedChat ? (
                      <div style={styles.connectionCard}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', marginBottom: '8px' }}>
                              <CheckCircle size={14} color={COLORS.success} />
                              <span style={{ fontWeight: 'bold' }}>Active</span>
                          </div>
                          <div style={{ display: 'flex', gap: '5px' }}>
                              <Button variant="secondary" onClick={() => navigate(`/messages/${linkedChat.id}`)} style={styles.xsBtn}>Open</Button>
                              {isManager && <Button variant="danger" onClick={() => unlinkChatFromRoster(linkedChat.id)} style={styles.xsBtn}>Recreate</Button>}
                          </div>
                      </div>
                  ) : (
                      <div style={styles.connectionCard}>
                          <span style={{ color: '#aaa', fontSize: '13px', marginBottom: '5px', display: 'block' }}>Not Active</span>
                          {isManager && (
                             <Button onClick={() => createTeamChat(roster.id, roster.name, roster.season, roster.players)} style={styles.xsBtn}>
                                 <RefreshCw size={12} style={{ marginRight: '4px' }} /> Create
                             </Button>
                          )}
                      </div>
                  )}
              </div>
          </div>
      </div>
  );

  return (
    <div className="view-container">
      {renderHeader()}
      <div className="view-content">
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
          
          <div style={{ background: '#1e1e1e', padding: '24px', borderRadius: '12px', marginBottom: '30px' }}>
              {isEditing ? (
                  // --- EDIT FORM ---
                  <div style={{ display: 'grid', gap: '15px' }}>
                      <Input label="Team Name" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                      <Input label="Season" value={editForm.season} onChange={e => setEditForm({...editForm, season: e.target.value})} />
                      <Input label="Manager Name" value={editForm.managerName} onChange={e => setEditForm({...editForm, managerName: e.target.value})} />
                      <div>
                          <label style={styles.label}>League</label>
                          <select value={editForm.leagueId} onChange={e => setEditForm({...editForm, leagueId: e.target.value})} style={styles.select}>
                              <option value="">-- Independent --</option>
                              {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                          </select>
                      </div>
                      <Button onClick={handleEditSave}><Save size={16} /> Save Changes</Button>
                  </div>
              ) : (
                  // --- VIEW DISPLAY ---
                  <>
                    <div style={{ marginBottom: '20px' }}>
                        <h2 style={{ margin: '0 0 5px 0', fontSize: '28px' }}>{roster.name}</h2>
                        <div style={{ display: 'flex', gap: '10px', color: '#aaa' }}>
                            {roster.leagueName && <span style={styles.badge}>{roster.leagueName}</span>}
                            <span>{roster.season}</span>
                        </div>
                    </div>
                    {renderStats()}
                    {renderConnections()}
                    {currentLeague && (
                         <div style={{ borderTop: '1px solid #333', paddingTop: '15px', color: '#ccc', fontSize: '14px' }}>
                             <h4 style={{ margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Trophy size={15}/> {currentLeague.name}</h4>
                             <p>{currentLeague.description}</p>
                             <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
                                 <span><Calendar size={12}/> {currentLeague.seasonStart} - {currentLeague.seasonEnd}</span>
                                 <span><Clock size={12}/> {currentLeague.earliestGameTime} - {currentLeague.latestGameTime}</span>
                             </div>
                         </div>
                    )}
                  </>
              )}
          </div>

          {/* --- PLAYER LIST --- */}
          <h3 style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '10px' }}>Roster</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
              {roster.players?.map(player => (
                  <Card key={player.uid || player.email} style={styles.playerCard} onClick={() => setSelectedPlayer(player)} hoverable>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <div style={styles.avatar}>{player.playerName?.[0]}</div>
                          <div>
                              <div style={{ fontWeight: 'bold' }}>{player.playerName}</div>
                              <div style={{ fontSize: '12px', color: '#888' }}>{player.email}</div>
                          </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                          {isManager ? (
                              <Button variant="danger" onClick={(e) => { e.stopPropagation(); removePlayerFromRoster(roster.id, player); }} style={styles.xsBtn}>
                                  <X size={14} />
                              </Button>
                          ) : (
                             player.uid !== loggedInUser?.uid && <MessageCircle size={18} color={COLORS.primary} />
                          )}
                      </div>
                  </Card>
              ))}
          </div>
          
          {/* --- MODALS --- */}
          {showAddModal && (
              <Modal title="Add Players" onClose={() => setShowAddModal(false)}>
                  <UserSearch key={searchKey} onSelectionChange={setSelectedEmails} />
                  <Button onClick={handleAddPlayers} style={{ marginTop: '20px', width: '100%' }}>Add Selected</Button>
              </Modal>
          )}

          {showGroupSelectModal && (
               <Modal title="Link Group" onClose={() => setShowGroupSelectModal(false)}>
                   {myGroups.map(g => (
                       <Card key={g.id} onClick={() => { linkGroupToRoster(g.id, roster.id); setShowGroupSelectModal(false); }} hoverable>
                           {g.name}
                       </Card>
                   ))}
               </Modal>
          )}

          {selectedPlayer && (
              <Modal title="Player Details" onClose={() => setSelectedPlayer(null)}>
                  <div style={{ textAlign: 'center' }}>
                      <div style={{...styles.avatar, width: '80px', height: '80px', margin: '0 auto 15px', fontSize: '30px'}}>
                          {selectedPlayer.playerName?.[0]}
                      </div>
                      <h3>{selectedPlayer.playerName}</h3>
                      <p>{selectedPlayer.email}</p>
                      {selectedPlayer.uid !== loggedInUser?.uid && (
                          <Button onClick={() => { startDirectChat(selectedPlayer.email); setSelectedPlayer(null); }} style={{ width: '100%', marginTop: '15px' }}>
                              <MessageCircle size={16} style={{marginRight: '8px'}} /> Message
                          </Button>
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
    iconBtn: { padding: 0, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' },
    badge: { backgroundColor: '#333', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', border: '1px solid #555' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px', marginBottom: '20px', background: '#252525', padding: '15px', borderRadius: '8px' },
    statLabel: { fontSize: '11px', textTransform: 'uppercase', color: '#888', marginBottom: '4px' },
    statValue: { fontSize: '16px', fontWeight: 'bold', color: '#eee' },
    sectionBox: { marginBottom: '20px', background: '#252525', padding: '15px', borderRadius: '8px', borderLeft: `4px solid ${COLORS.primary}` },
    sectionTitle: { margin: '0 0 15px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' },
    subLabel: { fontSize: '11px', textTransform: 'uppercase', color: '#888', marginBottom: '6px' },
    connectionCard: { background: '#333', padding: '12px', borderRadius: '6px' },
    xsBtn: { fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center' },
    playerCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', cursor: 'pointer' },
    avatar: { width: '40px', height: '40px', borderRadius: '20px', backgroundColor: '#444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
    label: { display: 'block', color: '#888', marginBottom: '5px', fontSize: '12px' },
    select: { width: '100%', padding: '10px', background: '#333', border: '1px solid #555', borderRadius: '6px', color: 'white' }
};

export default RosterDetail;