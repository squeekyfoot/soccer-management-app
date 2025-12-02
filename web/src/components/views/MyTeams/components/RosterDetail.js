import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../common/Card';
import Button from '../../../common/Button';
import Modal from '../../../common/Modal';
import { COLORS } from '../../../../lib/constants';
import { MessageSquare, Calendar, Clock, Trophy, Link, CheckCircle, MessageCircle, Mail, Phone, User } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useChat } from '../../../../context/ChatContext';
import { useDirectMessage } from '../../../../hooks/useDirectMessage';
// NEW IMPORTS
import { useLeagueManager } from '../../../../hooks/useLeagueManager';
import { useGroupManager } from '../../../../hooks/useGroupManager';

const RosterDetail = ({ roster, onBack }) => {
  const navigate = useNavigate();
  const { loggedInUser } = useAuth();
  const { myChats } = useChat();
  const { startDirectChat } = useDirectMessage();
  
  // Use new hooks for data fetching
  const { fetchLeagues } = useLeagueManager();
  const { fetchUserGroups } = useGroupManager();

  const [league, setLeague] = useState(null);
  const [linkedGroup, setLinkedGroup] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Load League & Group Data
  useEffect(() => {
    const loadExtras = async () => {
        // 1. League
        if (roster.leagueId) {
            const leagues = await fetchLeagues();
            const l = leagues.find(i => i.id === roster.leagueId);
            setLeague(l);
        }
        
        // 2. Group
        if (loggedInUser?.uid) {
            // fetchUserGroups safely handles logic internally now, 
            // but we pass uid for explicit clarity if needed, or rely on hook default
            const groups = await fetchUserGroups(loggedInUser.uid);
            const g = groups.find(grp => grp.associatedRosterId === roster.id);
            setLinkedGroup(g);
        }
    };
    loadExtras();
  }, [roster, fetchLeagues, fetchUserGroups, loggedInUser]);

  const linkedChat = myChats.find(c => c.rosterId === roster.id);

  return (
    <div className="fade-in">
      {/* Custom Sub-Header for Back Navigation */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button variant="secondary" onClick={onBack}>← Back</Button>
      </div>

      {/* --- TOP SECTION --- */}
      <div style={{ background: '#1e1e1e', padding: '24px', borderRadius: '12px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                  <h2 style={{ marginTop: 0, marginBottom: '5px', fontSize: '28px' }}>{roster.name}</h2>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {league && <span style={styles.badge}>{league.name}</span>}
                      <span style={{ color: '#aaa' }}>{roster.season}</span>
                  </div>
              </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px', background: '#252525', padding: '15px', borderRadius: '8px' }}>
              <div>
                  <div style={styles.statLabel}>Roster</div>
                  <div style={styles.statValue}>{roster.players?.length || 0} Players</div>
              </div>
              <div>
                  <div style={styles.statLabel}>Manager</div>
                  <div style={styles.statValue}>{roster.managerName || "Unknown"}</div>
              </div>
              {league && (
                  <>
                      <div>
                          <div style={styles.statLabel}>Frequency</div>
                          <div style={styles.statValue}>{league.gameFrequency}</div>
                      </div>
                      <div>
                          <div style={styles.statLabel}>Game Days</div>
                          <div style={styles.statValue}>{league.gameDays?.join(', ')}</div>
                      </div>
                  </>
              )}
          </div>

          {/* --- CONNECTIONS SECTION (User View) --- */}
          <div style={{ marginBottom: '20px', background: '#252525', padding: '15px', borderRadius: '8px', borderLeft: `4px solid ${COLORS.primary}` }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Link size={16} /> Team Resources
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Community Group */}
                  <div>
                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>COMMUNITY GROUP</div>
                      {linkedGroup ? (
                          <div style={styles.connectionCard}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', marginBottom: '8px' }}>
                                  <CheckCircle size={14} color={COLORS.success} />
                                  <span style={{ fontWeight: 'bold' }}>{linkedGroup.name}</span>
                              </div>
                              <Button variant="secondary" onClick={() => navigate(`/community/${linkedGroup.id}`)} style={styles.xsBtn}>View</Button>
                          </div>
                      ) : (
                          <div style={styles.connectionCard}>
                              <span style={{ color: '#aaa', fontSize: '13px' }}>Not available</span>
                          </div>
                      )}
                  </div>

                  {/* Team Chat */}
                  <div>
                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>ROSTER CHAT</div>
                      {linkedChat ? (
                          <div style={styles.connectionCard}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', marginBottom: '8px' }}>
                                  <CheckCircle size={14} color={COLORS.success} />
                                  <span style={{ fontWeight: 'bold' }}>Active</span>
                              </div>
                              <Button variant="secondary" onClick={() => navigate(`/messages/${linkedChat.id}`)} style={styles.xsBtn}>Open</Button>
                          </div>
                      ) : (
                          <div style={styles.connectionCard}>
                              <span style={{ color: '#aaa', fontSize: '13px' }}>Not active</span>
                          </div>
                      )}
                  </div>
              </div>
          </div>

          {/* League Details Expansion */}
          {league && (
              <div style={{ borderTop: '1px solid #333', paddingTop: '15px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#aaa', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Trophy size={16} /> League Details
                  </h4>
                  <p style={{ color: '#ddd', fontSize: '14px', margin: 0 }}>{league.description}</p>
                  
                  <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                          <div style={styles.subLabel}>Season Duration</div>
                          <div style={{ display: 'flex', gap: '5px', alignItems: 'center', color: '#eee' }}>
                              <Calendar size={14}/> {league.seasonStart} - {league.seasonEnd}
                          </div>
                      </div>
                      <div>
                          <div style={styles.subLabel}>Game Time Window</div>
                          <div style={{ display: 'flex', gap: '5px', alignItems: 'center', color: '#eee' }}>
                              <Clock size={14}/> {league.earliestGameTime} - {league.latestGameTime}
                          </div>
                      </div>
                  </div>
              </div>
          )}
      </div>

      {/* --- PLAYER LIST --- */}
      <div>
          <h3 style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '10px', marginBottom: '15px' }}>Player List</h3>
          {(!roster.players || roster.players.length === 0) ? (
            <p style={{ fontStyle: 'italic', color: '#888' }}>No players yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {roster.players.map((player) => {
                const isMe = player.uid === loggedInUser.uid;
                return (
                    <Card 
                        key={player.uid || player.email} 
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', marginBottom: 0, cursor: 'pointer' }}
                        hoverable
                        onClick={() => setSelectedPlayer(player)} 
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '20px', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {player.photoURL ? (
                                <img src={player.photoURL} alt={player.playerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span style={{ color: '#aaa', fontWeight: 'bold' }}>{player.playerName.charAt(0)}</span>
                            )}
                        </div>
                        <div>
                            <span style={{ fontWeight: 'bold', display: 'block', fontSize: '16px' }}>
                                {player.playerName} {isMe && <span style={{color: COLORS.primary, fontSize: '12px'}}>(You)</span>}
                            </span>
                            <span style={{ fontSize: '13px', color: '#888' }}>{player.email}</span>
                        </div>
                      </div>
                      
                      {!isMe && (
                          <div style={{ color: COLORS.primary }}>
                              <MessageSquare size={18} />
                          </div>
                      )}
                    </Card>
                );
              })}
            </div>
          )}
      </div>

      {/* --- PLAYER DETAIL MODAL --- */}
      {selectedPlayer && (
          <Modal 
            title="Teammate Profile" 
            onClose={() => setSelectedPlayer(null)} 
            actions={
                selectedPlayer.uid !== loggedInUser.uid && (
                    <Button 
                        onClick={() => {
                            startDirectChat(selectedPlayer.email);
                            setSelectedPlayer(null);
                        }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        <MessageCircle size={18} /> Message
                    </Button>
                )
            }
          >
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '40px', backgroundColor: '#333', margin: '0 auto 15px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {selectedPlayer.photoURL ? (
                            <img src={selectedPlayer.photoURL} alt={selectedPlayer.playerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <User size={40} color="#666" />
                        )}
                    </div>
                    <h2 style={{ margin: 0 }}>{selectedPlayer.playerName}</h2>
              </div>

              <div style={{ background: '#252525', borderRadius: '8px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Mail size={18} color={COLORS.primary} />
                      <span style={{ color: '#eee' }}>{selectedPlayer.email}</span>
                  </div>
                  {selectedPlayer.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Phone size={18} color={COLORS.primary} />
                          <span style={{ color: '#eee' }}>{selectedPlayer.phone}</span>
                      </div>
                  )}
              </div>
          </Modal>
      )}
    </div>
  );
};

const styles = {
    badge: { backgroundColor: '#333', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', border: '1px solid #555' },
    statLabel: { fontSize: '11px', textTransform: 'uppercase', color: '#888', marginBottom: '4px' },
    statValue: { fontSize: '16px', fontWeight: 'bold', color: '#eee' },
    subLabel: { fontSize: '11px', textTransform: 'uppercase', color: '#888', marginBottom: '6px' },
    connectionCard: { background: '#333', padding: '12px', borderRadius: '6px', display: 'flex', flexDirection: 'column' },
    xsBtn: { fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', width: 'fit-content' }
};

export default RosterDetail;