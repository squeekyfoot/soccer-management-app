import React, { useState, useEffect, useCallback } from 'react';
import Header from '../../common/Header';
import { useAuth } from '../../../context/AuthContext';
import RosterList from './components/RosterList';
import IncomingRequests from './components/IncomingRequests';
import RosterDetail from './components/RosterDetail';
import CreateRosterForm from './components/CreateRosterForm';
import CreateLeagueModal from './components/CreateLeagueModal';
import Button from '../../common/Button';

const ManagerDashboard = () => {
  const { 
    createRoster, 
    fetchRosters, 
    deleteRoster, 
    addPlayerToRoster, 
    removePlayerFromRoster, 
    fetchIncomingRequests, 
    addGroupMembers, 
    fetchUserGroups,
    loggedInUser
  } = useAuth();

  const [activeView, setActiveView] = useState('list'); 
  const [rosters, setRosters] = useState([]);
  const [requests, setRequests] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [selectedRoster, setSelectedRoster] = useState(null);
  const [showLeagueModal, setShowLeagueModal] = useState(false);

  const loadData = useCallback(async () => {
    const r = await fetchRosters();
    const req = await fetchIncomingRequests();
    setRosters(r);
    setRequests(req);

    if (loggedInUser?.uid) {
        const g = await fetchUserGroups(loggedInUser.uid);
        setMyGroups(g);
    }
  }, [fetchRosters, fetchIncomingRequests, fetchUserGroups, loggedInUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateRoster = async (data, groupData, addManager) => {
    const success = await createRoster(data, groupData, addManager);
    if (success) {
      loadData();
      setActiveView('list');
    }
  };

  const handleRosterClick = (roster) => {
    setSelectedRoster(roster);
    setActiveView('detail');
  };

  const handleAddPlayer = async (rosterId, emails, targetGroupId) => {
      let allSuccess = true;
      for (const email of emails) {
          const success = await addPlayerToRoster(rosterId, email);
          if (!success) allSuccess = false;
      }
      
      if (targetGroupId && emails.length > 0) {
          await addGroupMembers(targetGroupId, emails);
      }

      if (allSuccess) alert("Players added!");
      loadData();
      
      const freshRosters = await fetchRosters();
      setRosters(freshRosters);
      const freshSelected = freshRosters.find(r => r.id === rosterId);
      if (freshSelected) setSelectedRoster(freshSelected);
  };

  const handleAddToGroup = async (groupId, emails) => {
      await addGroupMembers(groupId, emails);
      alert("Added to group.");
  };

  return (
    <div className="view-container">
      <Header title="Manager Dashboard" style={{ maxWidth: '1000px', margin: '0 auto' }} />
      
      <div className="view-content">
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
          
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
              <Button onClick={() => setActiveView('create')}>+ New Roster</Button>
              <Button variant="secondary" onClick={() => setShowLeagueModal(true)}>+ New League</Button>
          </div>

          {activeView === 'list' && (
            <>
              <IncomingRequests requests={requests} onRefresh={loadData} />
              <div style={{ height: '30px' }} />
              <RosterList 
                rosters={rosters} 
                onDelete={async (id) => { await deleteRoster(id); loadData(); }} 
                onSelect={handleRosterClick}
              />
            </>
          )}

          {activeView === 'create' && (
            <CreateRosterForm 
                onSubmit={handleCreateRoster} 
                onCancel={() => setActiveView('list')} 
            />
          )}

          {activeView === 'detail' && selectedRoster && (
            <RosterDetail 
                roster={selectedRoster} 
                onBack={() => { setSelectedRoster(null); setActiveView('list'); loadData(); }}
                onRefresh={loadData} // PASSING LOAD DATA DOWN
                onRemovePlayer={async (rid, p) => { 
                    await removePlayerFromRoster(rid, p); 
                    loadData(); 
                    setSelectedRoster(prev => ({
                        ...prev, 
                        players: prev.players ? prev.players.filter(pl => pl.uid !== p.uid) : []
                    })); 
                }}
                onAddPlayer={handleAddPlayer}
                myGroups={myGroups}
                onAddToGroup={handleAddToGroup}
            />
          )}

        </div>
      </div>

      {showLeagueModal && <CreateLeagueModal onClose={() => setShowLeagueModal(false)} />}
    </div>
  );
};

export default ManagerDashboard;