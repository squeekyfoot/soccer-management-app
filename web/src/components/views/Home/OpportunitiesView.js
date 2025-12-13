import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// UI Components
import Header from '../../ui/Header';
import Loading from '../../ui/Loading';
import Button from '../../ui/Button';

// Hooks
import { useRosterManager } from '../../../hooks/useRosterManager';
import { useAuth } from '../../../context/AuthContext';
import { useSystemNotification } from '../../../hooks/useSystemNotification';

function OpportunitiesView() {
  const navigate = useNavigate();
  const { loggedInUser } = useAuth();
  const { showNotification } = useSystemNotification();
  
  // Data Hooks
  const { subscribeToDiscoverableRosters, submitJoinRequest } = useRosterManager();
  
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loggedInUser) {
      setLoading(false);
      return;
    }

    const unsub = subscribeToDiscoverableRosters((rosters) => {
      // Filter out rosters the user is already on
      const filtered = rosters.filter(r => !r.playerIDs?.includes(loggedInUser.uid));
      setOpportunities(filtered);
      setLoading(false);
    });

    return () => unsub && unsub();
  }, [loggedInUser, subscribeToDiscoverableRosters]);

  if (loading) return <Loading />;

  const handleBack = () => {
    navigate('/');
  };

  const handleJoinRequest = async (roster) => {
    const success = await submitJoinRequest(roster.id, roster.name, roster.createdBy);
    if (success) {
      showNotification('success', "Request sent!");
    }
  };

  return (
    <div className="view-container">
      <Header 
        title="Opportunities" 
        onBack={handleBack}
        style={{ maxWidth: '1100px', margin: '0 auto' }}
      />

      <div className="view-content">
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {opportunities.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666', background: '#1a1a1a', borderRadius: '12px' }}>
              No new opportunities at this time.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px', paddingBottom: '20px' }}>
              {opportunities.map(roster => (
                <div 
                  key={roster.id} 
                  style={styles.itemCard}
                >
                  <div>
                    <div style={styles.itemTitle}>{roster.name}</div>
                    <div style={styles.itemDesc}>
                      {roster.season && <span>{roster.season}</span>}
                      {roster.leagueName && <span> - {roster.leagueName}</span>}
                      {roster.players && (
                        <span style={{ marginLeft: '10px', color: '#888' }}>
                          {roster.players.length}/{roster.maxCapacity || '?'} players
                        </span>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => handleJoinRequest(roster)} 
                    style={styles.btnOutline}
                  >
                    Request Join
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  itemCard: { 
    background: '#252525', 
    padding: '20px', 
    borderRadius: '10px', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    border: '1px solid #333'
  },
  itemTitle: { 
    fontWeight: 'bold', 
    fontSize: '16px', 
    color: '#fff', 
    marginBottom: '4px' 
  },
  itemDesc: { 
    color: '#aaa', 
    fontSize: '13px' 
  },
  btnOutline: { 
    background: 'transparent', 
    border: '1px solid #666', 
    color: '#eee', 
    padding: '8px 16px', 
    borderRadius: '6px', 
    cursor: 'pointer' 
  }
};

export default OpportunitiesView;
