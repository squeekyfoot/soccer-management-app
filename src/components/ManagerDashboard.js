import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './common/Button'; 
import Input from './common/Input';   
import { COLORS } from '../constants'; 
import UserSearch from './UserSearch';
import Header from './common/Header';

function ManagerDashboard() {
  const { 
    fetchRosters, createRoster, deleteRoster, addPlayerToRoster, removePlayerFromRoster,
    subscribeToIncomingRequests, respondToRequest, fetchPlayerDetails,
    fetchUserGroups, addGroupMembers, loggedInUser
  } = useAuth();

  const [rosters, setRosters] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoster, setSelectedRoster] = useState(null); 

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRosterName, setNewRosterName] = useState("");
  const [newRosterSeason, setNewRosterSeason] = useState("");
  const [newRosterCapacity, setNewRosterCapacity] = useState("20");
  const [isDiscoverable, setIsDiscoverable] = useState(false); 
  const [addManagerToRoster, setAddManagerToRoster] = useState(false);

  const [createAssociatedGroup, setCreateAssociatedGroup] = useState(false);
  const [associatedGroupName, setAssociatedGroupName] = useState("");
  const [groupNameDirty, setGroupNameDirty] = useState(false);

  const [selectedPlayerEmails, setSelectedPlayerEmails] = useState([]);
  const [userSearchKey, setUserSearchKey] = useState(0);

  const [expandedRequestId, setExpandedRequestId] = useState(null);
  const [expandedPlayerDetails, setExpandedPlayerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // --- Add to Group States ---
  const [myGroups, setMyGroups] = useState([]);
  const [showAddToGroupModal, setShowAddToGroupModal] = useState(false);
  const [playerToAdd, setPlayerToAdd] = useState(null); 

  // --- Request Approval Modal State ---
  const [requestToApprove, setRequestToApprove] = useState(null);
  const [targetGroupId, setTargetGroupId] = useState("");

  // --- NEW: Manual Add Confirmation State ---
  const [showConfirmAddModal, setShowConfirmAddModal] = useState(false);
  const [manualAddTargetGroupId, setManualAddTargetGroupId] = useState("");

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

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loadRosters, loadMyGroups, subscribeToIncomingRequests]);

  useEffect(() => {
    if (selectedRoster) {
      const updated = rosters.find(r => r.id === selectedRoster.id);
      if (updated && updated !== selectedRoster) setSelectedRoster(updated);
    }
  }, [rosters, selectedRoster]);

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

  // --- NEW: Manual Add Logic ---
  const initiateManualAdd = (e) => {
      e.preventDefault();
      if (selectedPlayerEmails.length === 0) return;

      // Try to find an associated group for the currently selected roster
      const associated = myGroups.find(g => g.associatedRosterId === selectedRoster.id);
      setManualAddTargetGroupId(associated ? associated.id : "");
      
      setShowConfirmAddModal(true);
  };

  const executeManualAdd = async () => {
      // 1. Add all selected users to the roster
      for (const email of selectedPlayerEmails) {
          await addPlayerToRoster(selectedRoster.id, email);
      }

      // 2. If a group is selected, add them all to the group (batch)
      if (manualAddTargetGroupId) {
          await addGroupMembers(manualAddTargetGroupId, selectedPlayerEmails);
      }

      alert("Players added successfully!");
      
      // Reset UI
      setSelectedPlayerEmails([]);
      setUserSearchKey(prev => prev + 1);
      setShowConfirmAddModal(false);
      setManualAddTargetGroupId("");
      
      loadRosters();
  };

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

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newRosterName || !newRosterSeason) {
      alert("Please fill in all fields");
      return;
    }
    
    const success = await createRoster(
        newRosterName, 
        newRosterSeason, 
        newRosterCapacity, 
        isDiscoverable,
        { createGroup: createAssociatedGroup, groupName: associatedGroupName },
        addManagerToRoster
    );

    if (success) {
      alert("Roster created!");
      setShowCreateForm(false);
      setNewRosterName("");
      setNewRosterSeason("");
      setNewRosterCapacity("20");
      setIsDiscoverable(false);
      setAddManagerToRoster(false);
      setCreateAssociatedGroup(false);
      setAssociatedGroupName("");
      setGroupNameDirty(false);
      loadRosters();
      loadMyGroups(); 
    }
  };

  const handleDeleteRoster = async (rosterId) => {
    if (window.confirm("Delete this roster? This cannot be undone.")) {
      const success = await deleteRoster(rosterId);
      if (success) loadRosters();
    }
  };

  const handleRemovePlayer = async (playerSummary) => {
    if (window.confirm(`Remove ${playerSummary.playerName} from this roster?`)) {
      const success = await removePlayerFromRoster(selectedRoster.id, playerSummary);
      if (success) loadRosters();
    }
  };
  
  const handleDenyRequest = async (request) => {
     if (window.confirm(`Deny request from ${request.userName}?`)) {
         await respondToRequest(request, 'deny');
     }
  };

  const toggleRequestDetails = async (req) => {
      if (expandedRequestId === req.id) {
          setExpandedRequestId(null);
          setExpandedPlayerDetails(null);
          return;
      }
      
      setExpandedRequestId(req.id);
      setLoadingDetails(true);
      const details = await fetchPlayerDetails(req.userId);
      setExpandedPlayerDetails(details);
      setLoadingDetails(false);
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

  if (selectedRoster) {
    return (
      <div style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Header 
          title={selectedRoster.name}
          actions={
            <Button 
              onClick={() => setSelectedRoster(null)}
              variant="secondary"
              style={{ padding: '5px 10px', fontSize: '14px' }}
            >
              Back
            </Button>
          }
        />

        <p style={{ color: '#ccc', marginTop: 0, paddingLeft: '20px' }}>
          {selectedRoster.season} • {selectedRoster.players?.length || 0} / {selectedRoster.maxCapacity} Players
          {selectedRoster.isDiscoverable && <span style={{ marginLeft: '10px', fontSize: '12px', backgroundColor: '#28a745', padding: '2px 6px', borderRadius: '4px', color: 'white' }}>Discoverable</span>}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '30px', padding: '0 20px', flex: 1, overflowY: 'auto' }}>
          
          <div>
            <h3 style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '10px' }}>Roster</h3>
            {(!selectedRoster.players || selectedRoster.players.length === 0) ? (
              <p style={{ fontStyle: 'italic', color: '#888' }}>No players yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {selectedRoster.players.map((player, index) => (
                  <li key={index} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px', backgroundColor: COLORS.sidebar, marginBottom: '5px', borderRadius: '5px', border: `1px solid ${COLORS.border}`
                  }}>
                    <div>
                      <span style={{ fontWeight: 'bold', display: 'block' }}>{player.playerName}</span>
                      <span style={{ fontSize: '12px', color: '#aaa' }}>{player.email}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <Button 
                            variant="secondary" 
                            onClick={() => openAddToGroupModal(player)} 
                            style={{ padding: '5px 10px', fontSize: '10px' }}
                            title="Add to a Community Group"
                        >
                            + Group
                        </Button>
                        <Button variant="danger" onClick={() => handleRemovePlayer(player)} style={{ padding: '5px 10px', fontSize: '12px' }}>
                        Remove
                        </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '10px' }}>Add Player</h3>
            <form onSubmit={initiateManualAdd} style={{ backgroundColor: COLORS.sidebar, padding: '20px', borderRadius: '8px' }}>
              <p style={{ marginTop: 0, fontSize: '14px', marginBottom: '15px' }}>Search for users by name or email to add them to this team.</p>
              
              <div style={{ marginBottom: '15px' }}>
                  <UserSearch 
                      key={userSearchKey}
                      onSelectionChange={setSelectedPlayerEmails} 
                  />
              </div>
              
              <Button type="submit" style={{ width: '100%' }}>Add Selected to Roster</Button>
            </form>
          </div>

        </div>

        {/* NEW: Manual Add Confirmation Modal */}
        {showConfirmAddModal && (
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
            }}>
                <div style={{
                    backgroundColor: '#2c3e50', padding: '30px', borderRadius: '10px', maxWidth: '400px', width: '100%'
                }}>
                    <h3 style={{ marginTop: 0, color: 'white' }}>Confirm Add</h3>
                    <p style={{ color: '#ccc' }}>
                        You are adding <strong>{selectedPlayerEmails.length}</strong> player(s) to <strong>{selectedRoster.name}</strong>.
                    </p>
                    
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Add to Community Group (Optional):</label>
                        <select 
                            value={manualAddTargetGroupId} 
                            onChange={(e) => setManualAddTargetGroupId(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '5px' }}
                        >
                            <option value="">-- No Group --</option>
                            {myGroups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                        <p style={{ fontSize: '11px', color: '#aaa', marginTop: '5px' }}>
                            {manualAddTargetGroupId ? "Players will also be added to this group." : "Players will only be added to the roster."}
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Button onClick={executeManualAdd} style={{ flex: 1 }}>Add Players</Button>
                        <Button variant="secondary" onClick={() => setShowConfirmAddModal(false)} style={{ flex: 1 }}>Cancel</Button>
                    </div>
                </div>
            </div>
        )}

        {/* Existing "Add To Group" Modal (Single Player) */}
        {showAddToGroupModal && (
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
            }}>
                <div style={{
                    backgroundColor: '#2c3e50', padding: '30px', borderRadius: '10px', maxWidth: '400px', width: '100%'
                }}>
                    <h3 style={{ marginTop: 0, color: 'white' }}>Add {playerToAdd?.playerName} to Group</h3>
                    <p style={{ color: '#ccc' }}>Select a group to add this player to:</p>
                    
                    <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '20px', display: 'grid', gap: '10px' }}>
                        {myGroups.length === 0 ? (
                            <p style={{ fontStyle: 'italic', color: '#aaa' }}>You don't manage any groups.</p>
                        ) : (
                            myGroups.map(group => (
                                <button 
                                    key={group.id}
                                    onClick={() => confirmAddToGroup(group.id)}
                                    style={{
                                        padding: '10px', textAlign: 'left', backgroundColor: '#34495e', 
                                        border: `1px solid ${COLORS.border}`, color: 'white', cursor: 'pointer', borderRadius: '5px'
                                    }}
                                >
                                    <strong>{group.name}</strong>
                                    <br/><span style={{ fontSize: '11px', color: '#aaa' }}>{group.memberDetails?.length || 0} Members</span>
                                </button>
                            ))
                        )}
                    </div>

                    <Button variant="secondary" onClick={() => { setShowAddToGroupModal(false); setPlayerToAdd(null); }} style={{ width: '100%' }}>
                        Cancel
                    </Button>
                </div>
            </div>
        )}

      </div>
    );
  }

  return (
    <div style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Header 
        title="Manager Dashboard" 
        actions={
           <Button onClick={() => setShowCreateForm(!showCreateForm)} style={{ fontSize: '14px', padding: '5px 15px' }}>
            {showCreateForm ? "Cancel" : "+ Create Roster"}
          </Button>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
        {incomingRequests.length > 0 && (
          <div style={{ marginTop: '10px', marginBottom: '40px' }}>
              <h3 style={{ color: '#61dafb' }}>Incoming Join Requests</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                  {incomingRequests.map(req => (
                      <div key={req.id} style={{
                          backgroundColor: COLORS.sidebar, padding: '15px', borderRadius: '8px',
                          border: `1px solid ${COLORS.primary}`
                      }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                  <span style={{ fontWeight: 'bold' }}>{req.userName}</span>
                                  <span style={{ color: '#aaa', margin: '0 10px' }}>wants to join</span>
                                  <span style={{ fontWeight: 'bold', color: 'white' }}>{req.rosterName}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '10px' }}>
                                  <Button variant="secondary" onClick={() => toggleRequestDetails(req)} style={{ padding: '5px 15px', fontSize: '12px' }}>
                                      {expandedRequestId === req.id ? "Hide Details" : "View Profile"}
                                  </Button>
                                  <Button onClick={() => initiateApproval(req)} style={{ padding: '5px 15px', fontSize: '12px' }}>Approve</Button>
                                  <Button variant="danger" onClick={() => handleDenyRequest(req)} style={{ padding: '5px 15px', fontSize: '12px' }}>Deny</Button>
                              </div>
                          </div>

                          {/* Expandable Player Details */}
                          {expandedRequestId === req.id && (
                              <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#333', borderRadius: '5px', border: '1px solid #555' }}>
                                  {loadingDetails ? (
                                      <p style={{ fontStyle: 'italic', margin: 0 }}>Loading player details...</p>
                                  ) : expandedPlayerDetails ? (
                                      <div style={{ fontSize: '14px' }}>
                                          <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                                              <div style={{ width: '50px', height: '50px', backgroundColor: '#555', borderRadius: '50%', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                  {expandedPlayerDetails.photoURL ? <img src={expandedPlayerDetails.photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>{expandedPlayerDetails.playerName?.charAt(0)}</span>}
                                              </div>
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
                                                  <div><strong>Years Experience:</strong> {expandedPlayerDetails.soccerDetails.yearsExperience}</div>
                                                  <div><strong>Number:</strong> {expandedPlayerDetails.soccerDetails.playerNumber}</div>
                                              </div>
                                          ) : (
                                              <p style={{ color: '#aaa', fontStyle: 'italic' }}>No soccer details available for this user.</p>
                                          )}
                                          
                                          {expandedPlayerDetails.comments && (
                                              <div style={{ marginTop: '10px', borderTop: '1px solid #444', paddingTop: '10px' }}>
                                                  <strong>About:</strong> {expandedPlayerDetails.comments}
                                              </div>
                                          )}
                                      </div>
                                  ) : (
                                      <p style={{ color: '#f88' }}>Failed to load details.</p>
                                  )}
                              </div>
                          )}
                      </div>
                  ))}
              </div>
          </div>
        )}

        {/* Approval Confirmation Modal */}
        {requestToApprove && (
            <div style={{
                  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                  backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
              }}>
                  <div style={{
                      backgroundColor: '#2c3e50', padding: '30px', borderRadius: '10px', maxWidth: '400px', width: '100%'
                  }}>
                      <h3 style={{ marginTop: 0, color: 'white' }}>Confirm Approval</h3>
                      <p style={{ color: '#ccc' }}>
                          You are approving <strong>{requestToApprove.userName}</strong> for <strong>{requestToApprove.rosterName}</strong>.
                      </p>
                      
                      <div style={{ marginBottom: '20px' }}>
                          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Add to Community Group (Optional):</label>
                          <select 
                              value={targetGroupId} 
                              onChange={(e) => setTargetGroupId(e.target.value)}
                              style={{ width: '100%', padding: '10px', borderRadius: '5px' }}
                          >
                              <option value="">-- No Group --</option>
                              {myGroups.map(g => (
                                  <option key={g.id} value={g.id}>{g.name}</option>
                              ))}
                          </select>
                          <p style={{ fontSize: '11px', color: '#aaa', marginTop: '5px' }}>
                              {targetGroupId ? "User will be added to this group automatically." : "User will only be added to the roster."}
                          </p>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                          <Button onClick={confirmApproval} style={{ flex: 1 }}>Confirm</Button>
                          <Button variant="secondary" onClick={() => setRequestToApprove(null)} style={{ flex: 1 }}>Cancel</Button>
                      </div>
                  </div>
              </div>
        )}

        <div style={{ marginTop: '30px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Current Rosters</h3>

          {showCreateForm && (
            <form onSubmit={handleCreateSubmit} style={{
              backgroundColor: COLORS.sidebar, padding: '20px', borderRadius: '8px', marginBottom: '20px',
              border: `1px solid ${COLORS.primary}`
            }}>
              <h4 style={{ marginTop: 0, color: 'white' }}>New Roster Details</h4>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <Input label="Roster Name" placeholder="e.g. The Gizmos" value={newRosterName} onChange={handleRosterNameChange} />
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <Input label="Season" placeholder="e.g. Fall 2025" value={newRosterSeason} onChange={(e) => setNewRosterSeason(e.target.value)} />
                </div>
                <div style={{ width: '100px' }}>
                  <Input label="Capacity" type="number" value={newRosterCapacity} onChange={(e) => setNewRosterCapacity(e.target.value)} />
                </div>
              </div>
              
              <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        type="checkbox" 
                        id="discoverableCheck"
                        checked={isDiscoverable}
                        onChange={(e) => setIsDiscoverable(e.target.checked)}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <label htmlFor="discoverableCheck" style={{ cursor: 'pointer' }}>
                          Make this team <strong>Discoverable</strong> in "Find Teams"
                      </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        type="checkbox" 
                        id="createGroupCheck"
                        checked={createAssociatedGroup}
                        onChange={(e) => setCreateAssociatedGroup(e.target.checked)}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <label htmlFor="createGroupCheck" style={{ cursor: 'pointer' }}>
                          Create a new <strong>Community Group</strong> for this team
                      </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        type="checkbox" 
                        id="addManagerCheck"
                        checked={addManagerToRoster}
                        onChange={(e) => setAddManagerToRoster(e.target.checked)}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <label htmlFor="addManagerCheck" style={{ cursor: 'pointer' }}>
                          Add <strong>Myself</strong> to this roster
                      </label>
                  </div>
              </div>
              
              {createAssociatedGroup && (
                  <div style={{ marginBottom: '20px' }}>
                      <Input 
                          label="Group Name" 
                          placeholder="e.g. The Gizmos Community" 
                          value={associatedGroupName} 
                          onChange={handleGroupNameChange}
                      />
                      <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#aaa' }}>
                          By default, this group will be private and not visible to public users.
                      </p>
                  </div>
              )}
              
              <Button type="submit">Save Roster</Button>
            </form>
          )}

          {isLoading ? (
            <p>Loading rosters...</p>
          ) : rosters.length === 0 ? (
            <p style={{ color: '#aaa', fontStyle: 'italic' }}>No rosters found.</p>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {rosters.map(roster => (
                <div key={roster.id} style={{
                  backgroundColor: COLORS.sidebar, padding: '15px', borderRadius: '8px',
                  border: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <h4 style={{ margin: 0, color: COLORS.primary }}>{roster.name}</h4>
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#ccc' }}>
                      {roster.season} • {roster.players?.length || 0} / {roster.maxCapacity} players
                      {roster.isDiscoverable && <span style={{ marginLeft: '10px', fontSize: '10px', border: '1px solid #555', padding: '2px 4px', borderRadius: '3px' }}>Public</span>}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Button variant="secondary" onClick={() => setSelectedRoster(roster)} style={{ padding: '5px 15px', fontSize: '12px' }}>
                      Manage
                    </Button>
                    <Button variant="danger" onClick={() => handleDeleteRoster(roster.id)} style={{ padding: '5px 10px', fontSize: '12px' }}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ManagerDashboard;