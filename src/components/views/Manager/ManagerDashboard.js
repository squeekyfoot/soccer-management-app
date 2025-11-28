import React, { useState, useEffect } from 'react';
// FIX: Move up 3 levels to reach 'src'
import { useAuth } from '../../../context/AuthContext';
import { Plus, X } from 'lucide-react';

// FIX: Point to ../../common
import Button from '../../common/Button';
import Header from '../../common/Header';
import Loading from '../../common/Loading';

// FIX: Point to local ./components folder (Sub-components)
import RosterList from './components/RosterList';
import RosterDetail from './components/RosterDetail';
import CreateRosterForm from './components/CreateRosterForm';
import IncomingRequests from './components/IncomingRequests';

function ManagerDashboard() {
  const { 
    fetchRosters, createRoster, deleteRoster, addPlayerToRoster, removePlayerFromRoster,
    subscribeToIncomingRequests, respondToRequest, fetchUserGroups, addGroupMembers, loggedInUser
  } = useAuth();

  // --- Data State ---
  const [rosters, setRosters] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]); 
  const [myGroups, setMyGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- UI State ---
  const [selectedRoster, setSelectedRoster] = useState(null); 
  const [showCreateForm, setShowCreateForm] = useState(false);

  // --- Initial Data Load ---
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const [rData, gData] = await Promise.all([
        fetchRosters(),
        loggedInUser ? fetchUserGroups(loggedInUser.uid) : []
      ]);
      setRosters(rData);
      setMyGroups(gData);
      setIsLoading(false);
    };
    init();

    const unsubRequests = subscribeToIncomingRequests(setIncomingRequests);
    return () => { if (unsubRequests) unsubRequests(); };
  }, [fetchRosters, fetchUserGroups, subscribeToIncomingRequests, loggedInUser]);

  // --- Sync Selection ---
  useEffect(() => {
    if (selectedRoster) {
      const updated = rosters.find(r => r.id === selectedRoster.id);
      if (updated && updated !== selectedRoster) setSelectedRoster(updated);
    }
  }, [rosters, selectedRoster]);

  // --- Handlers ---
  const handleCreateSubmit = async (name, season, capacity, isDiscoverable, groupOptions, addManager) => {
    const success = await createRoster(name, season, capacity, isDiscoverable, groupOptions, addManager);
    if (success) {
      alert("Roster created!");
      setShowCreateForm(false);
      // Reload logic
      const r = await fetchRosters();
      const g = await fetchUserGroups(loggedInUser.uid);
      setRosters(r); setMyGroups(g);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this roster?")) {
      await deleteRoster(id);
      setRosters(await fetchRosters());
    }
  };

  const handleAddPlayers = async (rosterId, emails, groupId) => {
      for (const email of emails) await addPlayerToRoster(rosterId, email);
      if (groupId) await addGroupMembers(groupId, emails);
      alert("Players added!");
      setRosters(await fetchRosters());
  };

  const handleRemovePlayer = async (rosterId, player) => {
      if (window.confirm(`Remove ${player.playerName}?`)) {
          await removePlayerFromRoster(rosterId, player);
          setRosters(await fetchRosters());
      }
  };

  const handleAddToGroup = async (groupId, emails) => {
      await addGroupMembers(groupId, emails);
      alert("Added to group!");
  };

  const handleApproveRequest = async (req, groupId) => {
      await respondToRequest(req, 'approve', groupId);
      setRosters(await fetchRosters());
  };

  const handleDenyRequest = async (req) => {
      if (window.confirm("Deny request?")) await respondToRequest(req, 'deny');
  };

  // --- Render Views ---

  if (selectedRoster) {
    return (
      <RosterDetail 
        roster={selectedRoster}
        onBack={() => setSelectedRoster(null)}
        onRemovePlayer={handleRemovePlayer}
        onAddPlayer={handleAddPlayers}
        onAddToGroup={handleAddToGroup}
        myGroups={myGroups}
      />
    );
  }

  return (
    <div className="view-container">
      <Header 
        title="Manager Dashboard" 
        style={{ maxWidth: '1000px', margin: '0 auto' }}
        actions={
           <Button onClick={() => setShowCreateForm(!showCreateForm)} style={{ padding: 0, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
            {showCreateForm ? <X size={18} /> : <Plus size={18} />}
          </Button>
        }
      />

      <div className="view-content">
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
          
          <IncomingRequests 
            requests={incomingRequests} 
            onApprove={handleApproveRequest}
            onDeny={handleDenyRequest}
            myGroups={myGroups}
          />

          <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Current Rosters</h3>
          
          {showCreateForm && (
            <CreateRosterForm 
              onSubmit={handleCreateSubmit} 
              onCancel={() => setShowCreateForm(false)} 
            />
          )}

          {isLoading ? <Loading message="Loading rosters..." /> : (
            <RosterList 
              rosters={rosters} 
              onSelect={setSelectedRoster} 
              onDelete={handleDelete} 
            />
          )}
        </div>
      </div>
    </div> 
  );
}

export default ManagerDashboard;