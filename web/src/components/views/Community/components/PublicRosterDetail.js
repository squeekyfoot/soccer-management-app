import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useLeagueManager } from '../../../../hooks/useLeagueManager'; // NEW IMPORT
import Card from '../../../common/Card';
import Button from '../../../common/Button';
import { COLORS } from '../../../../lib/constants';
import { Calendar, Clock, Trophy, MapPin, Users, CheckCircle, AlertCircle } from 'lucide-react';

const PublicRosterDetail = ({ roster, onBack, onJoin, joinStatus }) => {
  const { loggedInUser } = useAuth();
  const { fetchLeagues } = useLeagueManager(); // USE NEW HOOK

  const [league, setLeague] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeague = async () => {
      if (roster.leagueId) {
        // Now calling the function from the hook, not AuthContext
        const leagues = await fetchLeagues();
        const found = leagues.find(l => l.id === roster.leagueId);
        setLeague(found);
      }
      setLoading(false);
    };
    loadLeague();
  }, [roster, fetchLeagues]);

  const isFull = (roster.players?.length || 0) >= (roster.maxCapacity || 99);
  const alreadyJoined = roster.playerIDs?.includes(loggedInUser?.uid);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button variant="secondary" onClick={onBack}>← Back to Search</Button>
      </div>

      <div style={{ background: '#1e1e1e', padding: '24px', borderRadius: '12px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                  <h2 style={{ marginTop: 0, marginBottom: '5px', fontSize: '28px', color: 'white' }}>{roster.name}</h2>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {league && <span style={styles.badge}>{league.name}</span>}
                      <span style={{ color: '#aaa' }}>{roster.season}</span>
                      {roster.lookingForPlayers && !isFull && (
                          <span style={{ backgroundColor: COLORS.success, color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>RECRUITING</span>
                      )}
                  </div>
              </div>
              
              {/* JOIN ACTION BUTTON */}
              <div>
                  {alreadyJoined ? (
                      <Button disabled style={{ backgroundColor: '#333', border: '1px solid #555', color: COLORS.success }}>
                          <CheckCircle size={16} style={{ marginRight: '5px' }} /> Joined
                      </Button>
                  ) : joinStatus === 'pending' ? (
                      <Button disabled style={{ backgroundColor: '#333', border: '1px solid #ffc107', color: '#ffc107' }}>
                          <Clock size={16} style={{ marginRight: '5px' }} /> Pending
                      </Button>
                  ) : isFull ? (
                      <Button disabled style={{ backgroundColor: '#333', color: '#888' }}>
                          <AlertCircle size={16} style={{ marginRight: '5px' }} /> Team Full
                      </Button>
                  ) : (
                      <Button onClick={() => onJoin(roster)}>
                          Request to Join
                      </Button>
                  )}
              </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px', background: '#252525', padding: '20px', borderRadius: '8px' }}>
              <div>
                  <div style={styles.statLabel}>Roster Spots</div>
                  <div style={styles.statValue}>
                      {roster.players?.length || 0} / <span style={{ color: '#888' }}>{roster.maxCapacity}</span>
                  </div>
              </div>
              <div>
                  <div style={styles.statLabel}>Manager</div>
                  <div style={styles.statValue}>{roster.managerName || "Unknown"}</div>
              </div>
              {league && (
                  <div>
                      <div style={styles.statLabel}>Match Day</div>
                      <div style={styles.statValue}>{league.gameDays?.join(', ') || "TBD"}</div>
                  </div>
              )}
          </div>

          {league && (
              <div style={{ borderTop: '1px solid #333', paddingTop: '20px', marginTop: '20px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#aaa', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Trophy size={16} /> League Information
                  </h4>
                  <p style={{ color: '#ddd', fontSize: '14px', lineHeight: '1.5', marginBottom: '20px' }}>
                      {league.description}
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div style={styles.infoRow}>
                          <Calendar size={16} color={COLORS.primary}/> 
                          <div>
                              <div style={styles.subLabel}>Season Dates</div>
                              <div style={{ color: '#eee' }}>{league.seasonStart} to {league.seasonEnd}</div>
                          </div>
                      </div>
                      <div style={styles.infoRow}>
                          <Clock size={16} color={COLORS.primary}/> 
                          <div>
                              <div style={styles.subLabel}>Game Times</div>
                              <div style={{ color: '#eee' }}>{league.earliestGameTime} - {league.latestGameTime}</div>
                          </div>
                      </div>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

const styles = {
    badge: { backgroundColor: '#333', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', border: '1px solid #555' },
    statLabel: { fontSize: '11px', textTransform: 'uppercase', color: '#888', marginBottom: '5px' },
    statValue: { fontSize: '18px', fontWeight: 'bold', color: '#eee' },
    subLabel: { fontSize: '11px', textTransform: 'uppercase', color: '#888', marginBottom: '2px' },
    infoRow: { display: 'flex', gap: '12px', alignItems: 'flex-start' }
};

export default PublicRosterDetail;