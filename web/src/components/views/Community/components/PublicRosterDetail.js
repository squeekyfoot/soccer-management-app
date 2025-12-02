import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../common/Header';
import Button from '../../../common/Button';
import { COLORS } from '../../../../lib/constants';
import { Calendar, Clock, Trophy, Info, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

const PublicRosterDetail = ({ roster, onBack, onJoin, joinStatus }) => {
  const navigate = useNavigate();
  const { fetchLeagues, loggedInUser } = useAuth();
  const [league, setLeague] = useState(null);

  // Load League Data
  useEffect(() => {
    const loadLeague = async () => {
        if (roster.leagueId) {
            const leagues = await fetchLeagues();
            const l = leagues.find(i => i.id === roster.leagueId);
            setLeague(l);
        }
    };
    loadLeague();
  }, [roster, fetchLeagues]);

  const isMember = roster.playerIDs?.includes(loggedInUser.uid);

  return (
    <div className="fade-in">
      {/* Back Navigation */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button variant="secondary" onClick={onBack}>← Back to Search</Button>
      </div>

      {/* --- MAIN INFO CARD --- */}
      <div style={{ background: '#1e1e1e', padding: '30px', borderRadius: '12px', marginBottom: '30px', borderTop: `4px solid ${COLORS.primary}` }}>
          
          <div style={{ marginBottom: '20px' }}>
              <h1 style={{ marginTop: 0, marginBottom: '8px', fontSize: '32px' }}>{roster.name}</h1>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {league && <span style={styles.badge}>{league.name}</span>}
                  <span style={{ color: '#aaa', fontSize: '14px' }}>{roster.season}</span>
                  {roster.lookingForPlayers && <span style={{...styles.badge, background: COLORS.success, borderColor: COLORS.success}}>Recruiting</span>}
              </div>
          </div>

          <p style={{ color: '#ccc', fontSize: '15px', lineHeight: '1.5', maxWidth: '800px' }}>
              This team is currently active and looking for players. Review the league details below to see if the schedule works for you.
          </p>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginTop: '30px', padding: '20px', background: '#252525', borderRadius: '8px' }}>
              <div>
                  <div style={styles.statLabel}>Current Roster</div>
                  <div style={styles.statValue}>{roster.players?.length || 0} Players</div>
              </div>
              <div>
                  <div style={styles.statLabel}>Target Size</div>
                  <div style={styles.statValue}>{roster.targetPlayerCount || roster.maxCapacity} Players</div>
              </div>
              <div>
                  <div style={styles.statLabel}>Manager</div>
                  <div style={styles.statValue}>{roster.managerName || "Unknown"}</div>
              </div>
              <div>
                  <div style={styles.statLabel}>History</div>
                  <div style={styles.statValue}>{roster.pastSeasonsCount || 0} Seasons</div>
              </div>
          </div>
      </div>

      {/* --- LEAGUE DETAILS --- */}
      {league ? (
          <div style={{ background: '#1e1e1e', padding: '30px', borderRadius: '12px', marginBottom: '30px' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Trophy size={20} color={COLORS.primary} /> League Information
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                  <div>
                      <div style={styles.detailRow}>
                          <Info size={18} color="#888" style={{ marginTop: '3px' }} />
                          <div>
                              <strong style={{ display: 'block', marginBottom: '4px', color: '#eee' }}>Description</strong>
                              <span style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.4' }}>{league.description}</span>
                          </div>
                      </div>
                      
                      <div style={styles.detailRow}>
                          <Clock size={18} color="#888" />
                          <div>
                              <strong style={{ display: 'block', marginBottom: '4px', color: '#eee' }}>Game Schedule</strong>
                              <span style={{ color: '#aaa', fontSize: '14px' }}>
                                  {league.gameFrequency} on <span style={{ color: '#fff' }}>{league.gameDays?.join(', ')}</span>
                              </span>
                              <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                                  Windows: {league.earliestGameTime} - {league.latestGameTime}
                              </div>
                          </div>
                      </div>
                  </div>

                  <div>
                      <div style={styles.detailRow}>
                          <Calendar size={18} color="#888" />
                          <div>
                              <strong style={{ display: 'block', marginBottom: '4px', color: '#eee' }}>Season Dates</strong>
                              <span style={{ color: '#aaa', fontSize: '14px' }}>
                                  {new Date(league.seasonStart).toLocaleDateString()} to {new Date(league.seasonEnd).toLocaleDateString()}
                              </span>
                          </div>
                      </div>

                      <div style={styles.detailRow}>
                          <ArrowRight size={18} color="#888" />
                          <div>
                              <strong style={{ display: 'block', marginBottom: '4px', color: '#eee' }}>Registration Deadline</strong>
                              <span style={{ color: COLORS.warning, fontSize: '14px', fontWeight: 'bold' }}>
                                  {new Date(league.registrationDeadline).toLocaleDateString()}
                              </span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666', fontStyle: 'italic', marginBottom: '30px' }}>
              No league information linked to this roster.
          </div>
      )}

      {/* --- BOTTOM ACTION BAR --- */}
      <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'center', borderTop: `1px solid #333` }}>
          {isMember ? (
              <Button 
                onClick={() => navigate(`/myteams/${roster.id}`)} // UPDATED ROUTE
                style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#333', border: '1px solid #555', padding: '12px 24px', fontSize: '16px' }}
              >
                  <CheckCircle size={20} color={COLORS.success} /> View in My Teams
              </Button>
          ) : joinStatus === 'pending' ? (
              <Button disabled style={{ backgroundColor: '#444', color: '#aaa', cursor: 'default', padding: '12px 24px', fontSize: '16px' }}>
                  Request Pending...
              </Button>
          ) : (
              <Button onClick={() => onJoin(roster)} style={{ padding: '12px 32px', fontSize: '16px', fontWeight: 'bold' }}>
                  Request to Join Team
              </Button>
          )}
      </div>
    </div>
  );
};

const styles = {
    badge: { backgroundColor: '#333', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', border: '1px solid #555' },
    statLabel: { fontSize: '12px', textTransform: 'uppercase', color: '#888', marginBottom: '6px' },
    statValue: { fontSize: '20px', fontWeight: 'bold', color: '#eee' },
    detailRow: { display: 'flex', gap: '15px', marginBottom: '25px', alignItems: 'flex-start' }
};

export default PublicRosterDetail;