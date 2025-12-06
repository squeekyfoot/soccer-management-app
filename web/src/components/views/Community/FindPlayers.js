import React, { useState, useEffect } from 'react';
import { useFreeAgency } from '../../../hooks/useFreeAgency';
import { useRosterManager } from '../../../hooks/useRosterManager';
import { useAuth } from '../../../context/AuthContext';
import { useSystemNotification } from '../../../hooks/useSystemNotification';

// UI Components
import Header from '../../ui/Header';
import Loading from '../../ui/Loading';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import Input from '../../ui/Input';

// Domain Components
import PublicPlayerCard from '../../domain/freeAgency/PublicPlayerCard';
import PlayerFilterBar from '../../domain/freeAgency/PlayerFilterBar';

const FindPlayers = ({ onBack }) => {
  const { loggedInUser } = useAuth();
  const { fetchFreeAgents, loading } = useFreeAgency();
  const { 
      fetchManagedRosters, 
      invitePlayer, 
      subscribeToManagerSentInvites, 
      withdrawInvite 
  } = useRosterManager();
  
  const { showNotification } = useSystemNotification();

  // State
  const [players, setPlayers] = useState([]);
  const [sentInvites, setSentInvites] = useState([]); 
  const [filters, setFilters] = useState({ position: 'Any', skillLevel: 'Any' });
  
  // Invite Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [managedTeams, setManagedTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  
  const [modalAvailableTeams, setModalAvailableTeams] = useState([]);

  // Pending Invites Modal State
  const [pendingModalOpen, setPendingModalOpen] = useState(false);
  const [pendingInvitesForSelected, setPendingInvitesForSelected] = useState([]);

  // Withdrawal Confirmation State
  const [withdrawId, setWithdrawId] = useState(null);

  // 1. Fetch Players
  useEffect(() => {
    const loadPlayers = async () => {
      const data = await fetchFreeAgents(filters);
      const others = data.filter(p => p.uid !== loggedInUser?.uid);
      setPlayers(others);
    };
    loadPlayers();
  }, [filters, fetchFreeAgents, loggedInUser]);

  // 2. Fetch Managed Teams
  useEffect(() => {
      const loadTeams = async () => {
          if (loggedInUser) {
              const teams = await fetchManagedRosters(loggedInUser.uid);
              setManagedTeams(teams);
          }
      };
      loadTeams();
  }, [loggedInUser, fetchManagedRosters]);

  // 3. Subscribe to Sent Invites
  useEffect(() => {
      const unsubscribe = subscribeToManagerSentInvites(setSentInvites);
      return () => { if (unsubscribe) unsubscribe(); };
  }, [subscribeToManagerSentInvites]);

  // --- HELPER: Calculate Available Teams for a Player ---
  const getAvailableTeamsForPlayer = (player) => {
      if (!player || managedTeams.length === 0) return [];

      const pendingForPlayer = sentInvites.filter(inv => inv.userId === player.uid && inv.status === 'pending');
      const pendingTeamIds = pendingForPlayer.map(inv => inv.rosterId);

      const joinedTeams = managedTeams.filter(t => t.playerIDs && t.playerIDs.includes(player.uid));
      const joinedTeamIds = joinedTeams.map(t => t.id);

      return managedTeams.filter(team => 
          !pendingTeamIds.includes(team.id) && 
          !joinedTeamIds.includes(team.id)
      );
  };

  // --- ACTIONS ---

  const handleOpenInvite = (player) => {
    if (!player) return;
    
    const available = getAvailableTeamsForPlayer(player);

    if (available.length > 0) {
        setSelectedPlayer(player);
        setModalAvailableTeams(available);
        setSelectedTeamId(available[0].id); 
        setInviteModalOpen(true);
    } else {
        showNotification('info', "No available teams to invite this player to.");
    }
  };

  const handleOpenPending = (player) => {
      if (!player) return;
      const pending = sentInvites.filter(inv => inv.userId === player.uid && inv.status === 'pending');
      setPendingInvitesForSelected(pending);
      setSelectedPlayer(player);
      setPendingModalOpen(true);
  };

  const handleSendInvite = async () => {
    if (!selectedTeamId || !selectedPlayer) return;
    setInviteLoading(true);
    
    const team = managedTeams.find(t => t.id === selectedTeamId);
    const result = await invitePlayer(team.id, team.name, selectedPlayer.uid, inviteMessage);
    
    setInviteLoading(false);
    if (result.success) {
      showNotification('success', "Invite sent successfully!");
      setInviteModalOpen(false);
      setInviteMessage("");
    } else {
      showNotification('error', "Failed to send invite: " + result.message);
    }
  };

  const initiateWithdraw = (inviteId) => {
      setWithdrawId(inviteId);
  };

  const confirmWithdraw = async () => {
      if (!withdrawId) return;
      
      const success = await withdrawInvite(withdrawId);
      if (success) {
          setPendingInvitesForSelected(prev => prev.filter(inv => inv.id !== withdrawId));
          if (pendingInvitesForSelected.length <= 1) {
              setPendingModalOpen(false); 
          }
          showNotification('success', "Invite withdrawn.");
      } else {
          showNotification('error', "Failed to withdraw invite.");
      }
      setWithdrawId(null);
  };

  return (
    <div className="view-container">
      <Header 
        title="Find Players" 
        style={{ maxWidth: '1000px', margin: '0 auto' }} 
        onBack={onBack} 
      />
      
      <div className="view-content">
        <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
          
          <PlayerFilterBar filters={filters} onFilterChange={setFilters} />

          {loading ? <Loading /> : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '20px',
              paddingBottom: '40px'
            }}>
              {players.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#888' }}>
                  No free agents found matching these criteria.
                </div>
              ) : (
                players.map(player => {
                  const playerInvites = sentInvites.filter(inv => inv.userId === player.uid && inv.status === 'pending');
                  const availableTeams = getAvailableTeamsForPlayer(player);
                  const hasAvailableTeams = availableTeams.length > 0;

                  return (
                    <PublicPlayerCard 
                        key={player.uid} 
                        player={player} 
                        isManager={managedTeams.length > 0} 
                        pendingInvites={playerInvites}
                        hasAvailableTeams={hasAvailableTeams}
                        onInvite={handleOpenInvite}
                        onViewPending={handleOpenPending}
                    />
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* 1. Invite Modal */}
      {inviteModalOpen && selectedPlayer && (
        <Modal 
            isOpen={true} 
            onClose={() => setInviteModalOpen(false)}
            title={`Invite ${selectedPlayer.playerName}`}
            actions={
                <Button onClick={handleSendInvite} disabled={inviteLoading} style={{ width: '100%' }}>
                    {inviteLoading ? 'Sending...' : 'Send Invite'}
                </Button>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Select Team</label>
                    <select 
                        style={{ width: '100%', padding: '10px', borderRadius: '5px' }}
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                    >
                        {modalAvailableTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>

                <Input 
                    label="Message (Optional)"
                    multiline
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder="Hey! We need a striker for our Sunday league..."
                />
            </div>
        </Modal>
      )}

      {/* 2. Pending Invites Modal */}
      {pendingModalOpen && selectedPlayer && (
          <Modal
            isOpen={true}
            onClose={() => setPendingModalOpen(false)}
            title={`Pending Invites: ${selectedPlayer.playerName}`}
          >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {pendingInvitesForSelected.length === 0 ? (
                      <p>No pending invites.</p>
                  ) : (
                      pendingInvitesForSelected.map(invite => (
                          <div key={invite.id} style={{ 
                              background: '#333', padding: '15px', borderRadius: '8px', 
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
                          }}>
                              <div>
                                  <div style={{ fontWeight: 'bold', color: '#fff' }}>{invite.rosterName}</div>
                                  <div style={{ fontSize: '12px', color: '#aaa' }}>Sent: {invite.createdAt?.toDate().toLocaleDateString()}</div>
                              </div>
                              <Button 
                                variant="danger" 
                                size="small" 
                                onClick={() => initiateWithdraw(invite.id)}
                              >
                                  Withdraw
                              </Button>
                          </div>
                      ))
                  )}
              </div>
          </Modal>
      )}

      {/* 3. Withdrawal Confirmation Modal */}
      {withdrawId && (
          <Modal
            title="Confirm Withdrawal"
            onClose={() => setWithdrawId(null)}
            actions={
                <Button variant="danger" onClick={confirmWithdraw}>
                    Yes, Withdraw
                </Button>
            }
          >
              <p style={{ color: '#ccc' }}>Are you sure you want to withdraw this invite? The player will no longer see it.</p>
          </Modal>
      )}
    </div>
  );
};

export default FindPlayers;