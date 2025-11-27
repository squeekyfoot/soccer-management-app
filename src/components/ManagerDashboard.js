import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './common/Button'; 
import Input from './common/Input';   
import { COLORS } from '../constants'; 
import UserSearch from './UserSearch';
import Header from './common/Header';
import Avatar from './common/Avatar'; 
import Card from './common/Card';     
import Modal from './common/Modal';   

function ManagerDashboard() {
  const { 
    fetchRosters, createRoster, deleteRoster, addPlayerToRoster, removePlayerFromRoster,
    subscribeToIncomingRequests, respondToRequest, fetchPlayerDetails,
    fetchUserGroups, addGroupMembers, loggedInUser
  } = useAuth();

  // --- Data State ---
  const [rosters, setRosters] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoster, setSelectedRoster] = useState(null); 

  // --- Create Roster Form State ---
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRosterName, setNewRosterName] = useState("");
  const [newRosterSeason, setNewRosterSeason] = useState("");
  const [newRosterCapacity, setNewRosterCapacity] = useState("20");
  const [isDiscoverable, setIsDiscoverable] = useState(false); 
  const [addManagerToRoster, setAddManagerToRoster] = useState(false);
  const [createAssociatedGroup, setCreateAssociatedGroup] = useState(false);
  const [associatedGroupName, setAssociatedGroupName] = useState("");
  const [groupNameDirty, setGroupNameDirty] = useState(false);

  // --- Player Search State ---
  const [selectedPlayerEmails, setSelectedPlayerEmails] = useState([]);
  const [userSearchKey, setUserSearchKey] = useState(0);

  // --- Request UI State ---
  const [expandedRequestId, setExpandedRequestId] = useState(null);
  const [expandedPlayerDetails, setExpandedPlayerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [requestToApprove, setRequestToApprove] = useState(null);
  const [targetGroupId, setTargetGroupId] = useState("");

  // --- Group/Modal State ---
  const [myGroups, setMyGroups] = useState([]);
  const [showAddToGroupModal, setShowAddToGroupModal] = useState(false);
  const [playerToAdd, setPlayerToAdd] = useState(null); 
  const [showConfirmAddModal, setShowConfirmAddModal] = useState(false);
  const [manualAddTargetGroupId, setManualAddTargetGroupId] = useState("");

  // --- Data Loading ---
  const loadRosters = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchRosters();
    setRosters(data);
    setIsLoading(false);
  }, [fetchRosters]);

  const loadMyGroups = useCallback(async () => {
      if (loggedInUser) {
          const groups = await fetchUserGroups(loggedInUser.uid);
          setMyGroups(groups);
      }
  }, [fetchUserGroups, loggedInUser]);

  useEffect(() => {
    loadRosters();
    loadMyGroups(); 
    const unsubscribe = subscribeToIncomingRequests((requests) => {
      setIncomingRequests(requests);
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, [loadRosters, loadMyGroups, subscribeToIncomingRequests]);

  // Keep selected roster updated if underlying data changes
  useEffect(() => {
    if (selectedRoster) {
      const updated = rosters.find(r => r.id === selectedRoster.id);
      if (updated && updated !== selectedRoster) setSelectedRoster(updated);
    }
  }, [rosters, selectedRoster]);

  // --- Handlers: Form Inputs ---
  const handleRosterNameChange = (e) => {
      const val = e.target.value;
      setNewRosterName(val);
      if (!groupNameDirty) {
          setAssociatedGroupName(val);
      }
  };

  const handleGroupNameChange = (e) => {
      setAssociatedGroupName(e.target.value);
      setGroupNameDirty(true);
  };

  // --- Handlers: Roster Actions ---
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newRosterName || !newRosterSeason) { alert("Please fill in all fields"); return; }
    
    const success = await createRoster(
        newRosterName, newRosterSeason, newRosterCapacity, isDiscoverable,
        { createGroup: createAssociatedGroup, groupName: associatedGroupName },
        addManagerToRoster
    );

    if (success) {
      alert("Roster created!");
      setShowCreateForm(false);
      // Reset Form
      setNewRosterName(""); setNewRosterSeason(""); setNewRosterCapacity("20");
      setIsDiscoverable(false); setAddManagerToRoster(false); setCreateAssociatedGroup(false);
      setAssociatedGroupName(""); setGroupNameDirty(false);
      loadRosters(); loadMyGroups(); 
    }
  };

  const handleDeleteRoster = async (rosterId) => {
    if (window.confirm("Delete this roster? This cannot be undone.")) {
      const success = await deleteRoster(rosterId);
      if (success) loadRosters();
    }
  };

  // --- Handlers: Player Actions ---
  const handleRemovePlayer = async (playerSummary) => {
    if (window.confirm(`Remove ${playerSummary.playerName} from this roster?`)) {
      const success = await removePlayerFromRoster(selectedRoster.id, playerSummary);
      if (success) loadRosters();
    }
  };

  const initiateManualAdd = (e) => {
      e.preventDefault();
      if (selectedPlayerEmails.length === 0) return;
      // Default to associated group if exists
      const associated = myGroups.find(g => g.associatedRosterId === selectedRoster.id);
      setManualAddTargetGroupId(associated ? associated.id : "");
      setShowConfirmAddModal(true);
  };

  const executeManualAdd = async () => {
      for (const email of selectedPlayerEmails) {
          await addPlayerToRoster(selectedRoster.id, email);
      }
      if (manualAddTargetGroupId) {
          await addGroupMembers(manualAddTargetGroupId, selectedPlayerEmails);
      }
      alert("Players added successfully!");
      setSelectedPlayerEmails([]);
      setUserSearchKey(prev => prev + 1); // Force clear UserSearch component
      setShowConfirmAddModal(false);
      setManualAddTargetGroupId("");
      loadRosters();
  };

  const openAddToGroupModal = (player) => {
      setPlayerToAdd(player);
      setShowAddToGroupModal(true);
  };

  const confirmAddToGroup = async (groupId) => {
      if (!playerToAdd) return;
      const success = await addGroupMembers(groupId, [playerToAdd.email]);
      if (success) {
          alert(`${playerToAdd.playerName} added to group!`);
          setShowAddToGroupModal(false);
          setPlayerToAdd(null);
      }
  };

  // --- Handlers: Requests ---
  const initiateApproval = (req) => {
      setRequestToApprove(req);
      const associated = myGroups.find(g => g.associatedRosterId === req.rosterId);
      setTargetGroupId(associated ? associated.id : "");
  };

  const confirmApproval = async () => {
      if (!requestToApprove) return;
      await respondToRequest(requestToApprove, 'approve', targetGroupId || null);
      loadRosters(); 
      setRequestToApprove(null);
      setTargetGroupId("");
  };

  const handleDenyRequest = async (request) => {
     if (window.confirm(`Deny request from ${request.userName}?`)) {
         await respondToRequest(request, 'deny');
     }
  };

  const toggleRequestDetails = async (req) => {
      if (expandedRequestId === req.id) {
          setExpandedRequestId(null); setExpandedPlayerDetails(null); return;
      }
      setExpandedRequestId(req.id);
      setLoadingDetails(true);
      const details = await fetchPlayerDetails(req.userId);
      setExpandedPlayerDetails(details);
      setLoadingDetails(false);
  };

  // --- RENDER: Selected Roster Detail View ---
  if (selectedRoster) {
    return (
      <div className="view-container">
        <Header 
          title={selectedRoster.name}
          style={{ maxWidth: '1000px', margin: '0 auto' }}
          actions={<Button onClick={() => setSelectedRoster(null)} variant="secondary" style={{ padding: '5px 10px', fontSize: '14px' }}>Back</Button>}
        />

        <div className="view-content">
          <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
            <p style={{ color: '#ccc', marginTop: 0 }}>
              {selectedRoster.season} • {selectedRoster.players?.length || 0} / {selectedRoster.maxCapacity} Players
              {selectedRoster.isDiscoverable && <span style={{ marginLeft: '10px', fontSize: '12px', backgroundColor: COLORS.success, padding: '2px 6px', borderRadius: '4px', color: 'white' }}>Discoverable</span>}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '30px' }}>
              {/* Column 1: Player List */}
              <div>
                <h3 style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '10px' }}>Roster</h3>
                {(!selectedRoster.players || selectedRoster.players.length === 0) ? (
                  <p style={{ fontStyle: 'italic', color: '#888' }}>No players yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedRoster.players.map((player) => (
                      <Card key={player.uid || player.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', marginBottom: 0 }}>
                        <div>
                          <span style={{ fontWeight: 'bold', display: 'block' }}>{player.playerName}</span>
                          <span style={{ fontSize: '12px', color: '#aaa' }}>{player.email}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <Button variant="secondary" onClick={() => openAddToGroupModal(player)} style={{ padding: '5px 10px', fontSize: '10px' }}>+ Group</Button>
                            <Button variant="danger" onClick={() => handleRemovePlayer(player)} style={{ padding: '5px 10px', fontSize: '12px' }}>Remove</Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Column 2: Add Player Form */}
              <div>
                <h3 style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '10px' }}>Add Player</h3>
                <Card>
                  <p style={{ marginTop: 0, fontSize: '14px', marginBottom: '15px' }}>Search for users by name or email to add them to this team.</p>
                  <form onSubmit={initiateManualAdd}>
                    <div style={{ marginBottom: '15px' }}>
                        <UserSearch key={userSearchKey} onSelectionChange={setSelectedPlayerEmails} />
                    </div>
                    <Button type="submit" style={{ width: '100%' }}>Add Selected to Roster</Button>
                  </form>
                </Card>
              </div>
            </div>

            {/* Modals for Roster View */}
            {showConfirmAddModal && (
                <Modal 
                  title="Confirm Add" 
                  onClose={() => setShowConfirmAddModal(false)}
                  actions={<Button onClick={executeManualAdd}>Add Players</Button>}
                >
                    <p style={{ color: '#ccc' }}>You are adding <strong>{selectedPlayerEmails.length}</strong> player(s) to <strong>{selectedRoster.name}</strong>.</p>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Add to Community Group (Optional):</label>
                        <select value={manualAddTargetGroupId} onChange={(e) => setManualAddTargetGroupId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px' }}>
                            <option value="">-- No Group --</option>
                            {myGroups.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
                        </select>
                        <p style={{ fontSize: '11px', color: '#aaa', marginTop: '5px' }}>{manualAddTargetGroupId ? "Players will also be added to this group." : "Players will only be added to the roster."}</p>
                    </div>
                </Modal>
            )}

            {showAddToGroupModal && (
                <Modal
                  title={`Add ${playerToAdd?.playerName} to Group`}
                  onClose={() => { setShowAddToGroupModal(false); setPlayerToAdd(null); }}
                  actions={null} 
                >
                    <p style={{ color: '#ccc' }}>Select a group to add this player to:</p>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '20px', display: 'grid', gap: '10px' }}>
                        {myGroups.length === 0 ? <p style={{ fontStyle: 'italic', color: '#aaa' }}>You don't manage any groups.</p> : myGroups.map(group => (
                            <Card key={group.id} onClick={() => confirmAddToGroup(group.id)} hoverable>
                                <strong>{group.name}</strong><br/>
                                <span style={{ fontSize: '11px', color: '#aaa' }}>{group.memberDetails?.length || 0} Members</span>
                            </Card>
                        ))}
                    </div>
                </Modal>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: Main Dashboard List View ---
  return (
    <div className="view-container">
      <Header 
        title="Manager Dashboard" 
        style={{ maxWidth: '1000px', margin: '0 auto' }}
        actions={
           <Button onClick={() => setShowCreateForm(!showCreateForm)} style={{ fontSize: '14px', padding: '5px 15px' }}>
            {showCreateForm ? "Cancel" : "+ Create Roster"}
          </Button>
        }
      />

      <div className="view-content">
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
          
          {incomingRequests.length > 0 && (
            <div style={{ marginTop: '10px', marginBottom: '40px' }}>
                <h3 style={{ color: COLORS.primary }}>Incoming Join Requests</h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                    {incomingRequests.map(req => (
                        <Card key={req.id} style={{ border: `1px solid ${COLORS.primary}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ fontWeight: 'bold' }}>{req.userName}</span>
                                    <span style={{ color: '#aaa', margin: '0 10px' }}>wants to join</span>
                                    <span style={{ fontWeight: 'bold', color: 'white' }}>{req.rosterName}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <Button variant="secondary" onClick={() => toggleRequestDetails(req)} style={{ padding: '5px 15px', fontSize: '12px' }}>{expandedRequestId === req.id ? "Hide Details" : "View Profile"}</Button>
                                    <Button onClick={() => initiateApproval(req)} style={{ padding: '5px 15px', fontSize: '12px' }}>Approve</Button>
                                    <Button variant="danger" onClick={() => handleDenyRequest(req)} style={{ padding: '5px 15px', fontSize: '12px' }}>Deny</Button>
                                </div>
                            </div>
                            {expandedRequestId === req.id && (
                                <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#333', borderRadius: '5px', border: '1px solid #555' }}>
                                    {loadingDetails ? <p style={{ fontStyle: 'italic', margin: 0 }}>Loading player details...</p> : expandedPlayerDetails ? (
                                        <div style={{ fontSize: '14px' }}>
                                            <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                                                {/* REFACTORED: Using Avatar Component */}
                                                <Avatar src={expandedPlayerDetails.photoURL} text={expandedPlayerDetails.playerName} size={50} />
                                                <div>
                                                    <strong>{expandedPlayerDetails.playerName}</strong>
                                                    <div style={{ color: '#aaa' }}>{expandedPlayerDetails.email}</div>
                                                    <div style={{ color: '#aaa' }}>{expandedPlayerDetails.phone}</div>
                                                </div>
                                            </div>
                                            {expandedPlayerDetails.soccerDetails ? (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                    <div><strong>Positions:</strong> {expandedPlayerDetails.soccerDetails.positions}</div>
                                                    <div><strong>Skill Level:</strong> {expandedPlayerDetails.soccerDetails.skillLevel}</div>
                                                    <div><strong>Experience:</strong> {expandedPlayerDetails.soccerDetails.yearsExperience}</div>
                                                    <div><strong>Number:</strong> {expandedPlayerDetails.soccerDetails.playerNumber}</div>
                                                </div>
                                            ) : <p style={{ color: '#aaa', fontStyle: 'italic' }}>No soccer details available.</p>}
                                            {expandedPlayerDetails.comments && <div style={{ marginTop: '10px', borderTop: '1px solid #444', paddingTop: '10px' }}><strong>About:</strong> {expandedPlayerDetails.comments}</div>}
                                        </div>
                                    ) : <p style={{ color: COLORS.danger }}>Failed to load details.</p>}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            </div>
          )}

          {requestToApprove && (
              <Modal 
                title="Confirm Approval" 
                onClose={() => setRequestToApprove(null)}
                actions={<Button onClick={confirmApproval}>Confirm</Button>}
              >
                  <p style={{ color: '#ccc' }}>You are approving <strong>{requestToApprove.userName}</strong> for <strong>{requestToApprove.rosterName}</strong>.</p>
                  <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Add to Community Group (Optional):</label>
                      <select value={targetGroupId} onChange={(e) => setTargetGroupId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px' }}>
                          <option value="">-- No Group --</option>
                          {myGroups.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
                      </select>
                      <p style={{ fontSize: '11px', color: '#aaa', marginTop: '5px' }}>{targetGroupId ? "User will be added to this group automatically." : "User will only be added to the roster."}</p>
                  </div>
              </Modal>
          )}

          <div style={{ marginTop: '30px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Current Rosters</h3>
            
            {showCreateForm && (
              <Card style={{ marginBottom: '20px', border: `1px solid ${COLORS.primary}` }}>
                <h4 style={{ marginTop: 0, color: 'white' }}>New Roster Details</h4>
                <form onSubmit={handleCreateSubmit}>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}><Input label="Roster Name" placeholder="e.g. The Gizmos" value={newRosterName} onChange={handleRosterNameChange} /></div>
                      <div style={{ flex: 1, minWidth: '150px' }}><Input label="Season" placeholder="e.g. Fall 2025" value={newRosterSeason} onChange={(e) => setNewRosterSeason(e.target.value)} /></div>
                      <div style={{ width: '100px' }}><Input label="Capacity" type="number" value={newRosterCapacity} onChange={(e) => setNewRosterCapacity(e.target.value)} /></div>
                    </div>
                    <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input type="checkbox" id="discoverableCheck" checked={isDiscoverable} onChange={(e) => setIsDiscoverable(e.target.checked)} />
                            <label htmlFor="discoverableCheck">Make this team <strong>Discoverable</strong> in "Find Teams"</label>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input type="checkbox" id="createGroupCheck" checked={createAssociatedGroup} onChange={(e) => setCreateAssociatedGroup(e.target.checked)} />
                            <label htmlFor="createGroupCheck">Create a new <strong>Community Group</strong> for this team</label>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input type="checkbox" id="addManagerCheck" checked={addManagerToRoster} onChange={(e) => setAddManagerToRoster(e.target.checked)} />
                            <label htmlFor="addManagerCheck">Add <strong>Myself</strong> to this roster</label>
                        </div>
                    </div>
                    {createAssociatedGroup && (
                        <div style={{ marginBottom: '20px' }}>
                            <Input label="Group Name" placeholder="e.g. The Gizmos Community" value={associatedGroupName} onChange={handleGroupNameChange} />
                        </div>
                    )}
                    <Button type="submit">Save Roster</Button>
                </form>
              </Card>
            )}

            {isLoading ? <p>Loading rosters...</p> : rosters.length === 0 ? <p style={{ color: '#aaa', fontStyle: 'italic' }}>No rosters found.</p> : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {rosters.map(roster => (
                  <Card key={roster.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, color: COLORS.primary }}>{roster.name}</h4>
                      <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#ccc' }}>
                          {roster.season} • {roster.players?.length || 0} / {roster.maxCapacity} players 
                          {roster.isDiscoverable && <span style={{ marginLeft: '10px', fontSize: '10px', border: '1px solid #555', padding: '2px 4px', borderRadius: '3px' }}>Public</span>}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <Button variant="secondary" onClick={() => setSelectedRoster(roster)} style={{ padding: '5px 15px', fontSize: '12px' }}>Manage</Button>
                      <Button variant="danger" onClick={() => handleDeleteRoster(roster.id)} style={{ padding: '5px 10px', fontSize: '12px' }}>Delete</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  export default ManagerDashboard;