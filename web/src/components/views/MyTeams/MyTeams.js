import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../ui/Header';
import Button from '../../ui/Button';
import Loading from '../../ui/Loading';
import { useAuth } from '../../../context/AuthContext';
import { useRosterManager } from '../../../hooks/useRosterManager';
import { COLORS } from '../../../lib/constants';

// Updated Domain Imports
import RosterDetail from '../../domain/teams/RosterDetail';
import TeamCard from '../../domain/teams/TeamCard';

function MyTeams() {
  const { rosterId } = useParams(); 
  const navigate = useNavigate();
  const { loggedInUser } = useAuth();
  
  const { fetchUserRosters } = useRosterManager();
  
  const [rosters, setRosters] = useState([]);
  const [selectedRoster, setSelectedRoster] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Data
  useEffect(() => {
    const load = async () => {
      if (loggedInUser) {
        setLoading(true);
        const data = await fetchUserRosters(loggedInUser.uid);
        setRosters(data);
        setLoading(false);
      }
    };
    load();
  }, [loggedInUser, fetchUserRosters]);

  // 2. Sync URL to State
  useEffect(() => {
    if (!loading && rosters.length > 0) {
      if (rosterId) {
        const found = rosters.find(r => r.id === rosterId);
        if (found) setSelectedRoster(found);
      } else {
        setSelectedRoster(null);
      }
    } else if (!loading && rosters.length === 0 && rosterId) {
        // Handle case where user navigates to a roster they aren't part of or doesn't exist
        navigate('/myteams');
    }
  }, [rosterId, rosters, loading, navigate]);

  // 3. Handlers
  const handleSelectRoster = (roster) => {
    navigate(`/myteams/${roster.id}`);
  };

  const handleBack = () => {
    navigate('/myteams');
  };

  if (loading) return <Loading />;

  return (
    <div className="view-container">
      {/* Only show main header in List View to avoid double headers with RosterDetail */}
      {!selectedRoster && (
          <Header title="My Teams" style={{ maxWidth: '1000px', margin: '0 auto' }} />
      )}
      
      <div className="view-content">
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* DETAIL VIEW (Unified Component) */}
          {selectedRoster ? (
            <RosterDetail 
              rosterId={selectedRoster.id}
              initialRosterData={selectedRoster}
              viewMode="view" // Explicitly setting read-only mode
              onBack={handleBack} 
            />
          ) : (
            /* LIST VIEW */
            <>
              {rosters.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                  <p>You are not part of any teams yet.</p>
                  <p>Go to <strong>Community &gt; Find Teams</strong> to join one!</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                  {rosters.map(roster => (
                    <TeamCard 
                      key={roster.id} 
                      roster={roster} 
                      onClick={() => handleSelectRoster(roster)}
                      actions={
                        <Button variant="secondary" style={{ fontSize: '13px' }}>View Details</Button>
                      }
                    />
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default MyTeams;