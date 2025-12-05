import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRosterManager } from '../../../hooks/useRosterManager';
import { COLORS } from '../../../lib/constants';
import { ArrowRight } from 'lucide-react';

// UI & Domain
import Header from '../../ui/Header';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import PublicRosterDetail from '../../domain/teams/PublicRosterDetail';

const FindTeams = ({ onBack }) => {
  const { loggedInUser } = useAuth();
  const { subscribeToDiscoverableRosters, subscribeToUserRequests, submitJoinRequest } = useRosterManager();

  // Local State for this view only
  const [discoverableTeams, setDiscoverableTeams] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [selectedRoster, setSelectedRoster] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to data
  useEffect(() => {
      setIsLoading(true);
      const unsubRosters = subscribeToDiscoverableRosters((data) => { 
          // Filter logic could eventually move to useFilter hook here
          const recruiting = data.filter(t => t.lookingForPlayers);
          setDiscoverableTeams(recruiting); 
          setIsLoading(false); 
      });
      const unsubRequests = subscribeToUserRequests((data) => { setMyRequests(data); });
      return () => { unsubRosters(); unsubRequests(); };
  }, [subscribeToDiscoverableRosters, subscribeToUserRequests]);

  const getRequestStatus = (teamId) => { 
      const req = myRequests.find(r => r.rosterId === teamId); 
      return req ? req.status : null; 
  };

  const handleJoinRequest = async (team) => { 
      await submitJoinRequest(team.id, team.name, team.createdBy); 
  };

  // 1. Roster Detail View (Drill-down)
  if (selectedRoster) {
      const status = getRequestStatus(selectedRoster.id);
      return (
          <div className="view-container">
              <Header title="Team Details" style={{ maxWidth: '1000px', margin: '0 auto' }} />
              <div className="view-content">
                  <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                      <PublicRosterDetail 
                          roster={selectedRoster} 
                          onBack={() => setSelectedRoster(null)}
                          onJoin={handleJoinRequest}
                          joinStatus={status}
                      />
                  </div>
              </div>
          </div>
      );
  }

  // 2. Main List View
  return (
    <div className="view-container">
        <Header title="Find Teams" style={{ maxWidth: '1000px', margin: '0 auto' }} onBack={onBack} />
        <div className="view-content">
          <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            {isLoading ? <p>Loading teams...</p> : discoverableTeams.length === 0 ? <p style={{ color: '#888' }}>No teams are currently recruiting.</p> : (
                <div style={{ display: 'grid', gap: '15px' }}>
                    {discoverableTeams.map(team => {
                        const status = getRequestStatus(team.id);
                        const alreadyJoined = team.playerIDs?.includes(loggedInUser.uid);
                        return (
                            <Card 
                                key={team.id} 
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} 
                                hoverable 
                                onClick={() => setSelectedRoster(team)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedRoster(team); }}
                            >
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0', color: 'white' }}>{team.name}</h3>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <span style={{ color: '#aaa', fontSize: '14px' }}>{team.season}</span>
                                        {team.lookingForPlayers && <span style={{ backgroundColor: COLORS.success, color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>RECRUITING</span>}
                                        {alreadyJoined && <span style={{ color: COLORS.success, fontSize: '12px', fontWeight: 'bold' }}>Joined</span>}
                                        {status === 'pending' && <span style={{ color: '#ffc107', fontSize: '12px', fontWeight: 'bold' }}>Pending</span>}
                                    </div>
                                </div>
                                <Button variant="secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>Details <ArrowRight size={14} /></Button>
                            </Card>
                        );
                    })}
                </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default FindTeams;