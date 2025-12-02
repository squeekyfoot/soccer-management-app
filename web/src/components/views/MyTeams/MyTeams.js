import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../common/Header';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Loading from '../../common/Loading';
import { useAuth } from '../../../context/AuthContext';
import { useRosterManager } from '../../../hooks/useRosterManager'; // NEW HOOK
import { COLORS } from '../../../lib/constants';
import RosterDetail from './components/RosterDetail';

function MyTeams() {
  const { rosterId } = useParams(); 
  const navigate = useNavigate();
  const { loggedInUser } = useAuth();
  
  // Use new hook
  const { fetchUserRosters } = useRosterManager();
  
  const [rosters, setRosters] = useState([]);
  const [selectedRoster, setSelectedRoster] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Data
  useEffect(() => {
    const load = async () => {
      if (loggedInUser) {
        setLoading(true);
        // Uses the hook function instead of Context
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
    }
  }, [rosterId, rosters, loading]);

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
      <Header title="My Teams" style={{ maxWidth: '1000px', margin: '0 auto' }} />
      
      <div className="view-content">
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* DETAIL VIEW */}
          {selectedRoster ? (
            <RosterDetail 
              roster={selectedRoster} 
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
                    <Card 
                      key={roster.id} 
                      hoverable 
                      onClick={() => handleSelectRoster(roster)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div>
                        <h3 style={{ margin: '0 0 5px 0', color: COLORS.primary }}>{roster.name}</h3>
                        <p style={{ margin: 0, color: '#ccc', fontSize: '14px' }}>
                            {roster.season} • {roster.players?.length || 0} Players
                        </p>
                      </div>
                      <Button variant="secondary" style={{ fontSize: '13px' }}>View Details</Button>
                    </Card>
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