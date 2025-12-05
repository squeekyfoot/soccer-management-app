import React, { useState, useEffect, useCallback } from 'react';
import Header from '../../ui/Header';
import { useAuth } from '../../../context/AuthContext';
import { useRosterManager } from '../../../hooks/useRosterManager'; 

// Domain Imports
import RosterList from '../../domain/teams/RosterList';
import RosterDetail from '../../domain/teams/RosterDetail';
import CreateRosterForm from '../../domain/teams/CreateRosterForm';
import JoinRequestList from '../../domain/joinRequests/JoinRequestList'; // <-- NEW

import CreateLeagueModal from './components/CreateLeagueModal';
import Button from '../../ui/Button';

const ManagerDashboard = () => {
  const { loggedInUser } = useAuth(); 
  const { createRoster, fetchRosters, deleteRoster } = useRosterManager();

  const [activeView, setActiveView] = useState('list'); 
  const [rosters, setRosters] = useState([]);
  const [selectedRoster, setSelectedRoster] = useState(null);
  const [showLeagueModal, setShowLeagueModal] = useState(false);

  // Load Roster Data
  const loadData = useCallback(async () => {
    const r = await fetchRosters();
    const myRosters = r.filter(roster => roster.createdBy === loggedInUser?.uid);
    setRosters(myRosters);
  }, [fetchRosters, loggedInUser]);

  useEffect(() => {
    if (loggedInUser) loadData();
  }, [loadData, loggedInUser]);

  const handleCreateRoster = async (name, season, capacity, isDiscoverable, groupData, addManager) => {
    const rosterId = await createRoster({
        name, season, maxCapacity: capacity, isDiscoverable
    }, groupData, addManager);

    if (rosterId) {
      loadData();
      setActiveView('list');
    }
  };

  const handleRosterClick = (roster) => {
    setSelectedRoster(roster);
    setActiveView('detail');
  };

  const handleDeleteRoster = async (id) => {
      if (window.confirm("Are you sure? This will disband the team.")) {
          await deleteRoster(id);
          loadData();
      }
  };

  return (
    <div className="view-container">
      <Header title="Manager Dashboard" style={{ maxWidth: '1000px', margin: '0 auto' }} />
      
      <div className="view-content">
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
          
          {activeView === 'list' && (
              <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                  <Button onClick={() => setActiveView('create')}>+ New Roster</Button>
                  <Button variant="secondary" onClick={() => setShowLeagueModal(true)}>+ New League</Button>
              </div>
          )}

          {/* VIEW: LIST */}
          {activeView === 'list' && (
            <>
              {/* Smart Component: Fetches its own data */}
              <JoinRequestList /> 
              
              <div style={{ height: '30px' }} />
              <RosterList 
                rosters={rosters} 
                onDelete={handleDeleteRoster} 
                onSelect={handleRosterClick}
              />
            </>
          )}

          {/* VIEW: CREATE */}
          {activeView === 'create' && (
            <CreateRosterForm 
                onSubmit={handleCreateRoster} 
                onCancel={() => setActiveView('list')} 
            />
          )}

          {/* VIEW: DETAIL */}
          {activeView === 'detail' && selectedRoster && (
            <RosterDetail 
                rosterId={selectedRoster.id} 
                initialRosterData={selectedRoster}
                viewMode="manager"
                onBack={() => { 
                    setSelectedRoster(null); 
                    setActiveView('list'); 
                    loadData(); 
                }}
            />
          )}

        </div>
      </div>

      {showLeagueModal && <CreateLeagueModal onClose={() => setShowLeagueModal(false)} />}
    </div>
  );
};

export default ManagerDashboard;