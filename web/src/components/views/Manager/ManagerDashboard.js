import React, { useState, useEffect, useCallback } from 'react';
import Header from '../../common/Header';
import { useAuth } from '../../../context/AuthContext';
import { useRosterManager } from '../../../hooks/useRosterManager'; 

import RosterList from './components/RosterList';
import IncomingRequests from './components/IncomingRequests';
import RosterDetail from './components/RosterDetail';
import CreateRosterForm from './components/CreateRosterForm';
import CreateLeagueModal from './components/CreateLeagueModal';
import Button from '../../common/Button';

const ManagerDashboard = () => {
  const { loggedInUser } = useAuth(); 
  
  const { 
    createRoster, 
    fetchRosters, 
    deleteRoster, 
    fetchIncomingRequests 
  } = useRosterManager();

  const [activeView, setActiveView] = useState('list'); 
  const [rosters, setRosters] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedRoster, setSelectedRoster] = useState(null);
  const [showLeagueModal, setShowLeagueModal] = useState(false);

  // Load List Data Only
  const loadData = useCallback(async () => {
    const r = await fetchRosters();
    setRosters(r);
    
    if (fetchIncomingRequests) {
        const req = await fetchIncomingRequests();
        setRequests(req);
    }
  }, [fetchRosters, fetchIncomingRequests]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // FIX: Pass groupData to the createRoster hook
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
          
          {/* Action Bar */}
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
              <Button onClick={() => setActiveView('create')}>+ New Roster</Button>
              <Button variant="secondary" onClick={() => setShowLeagueModal(true)}>+ New League</Button>
          </div>

          {/* VIEW: LIST */}
          {activeView === 'list' && (
            <>
              <IncomingRequests requests={requests} onRefresh={loadData} />
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