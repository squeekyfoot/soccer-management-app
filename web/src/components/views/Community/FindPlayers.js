import React, { useState, useEffect } from 'react';
import { useFreeAgency } from '../../../hooks/useFreeAgency';
import { useRosterManager } from '../../../hooks/useRosterManager';
import { useAuth } from '../../../context/AuthContext';
import { COLORS, MOBILE_BREAKPOINT } from '../../../lib/constants';

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
  const { fetchManagedRosters, invitePlayer } = useRosterManager();

  // State
  const [players, setPlayers] = useState([]);
  const [filters, setFilters] = useState({ position: 'Any', skillLevel: 'Any' });
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  
  // Invite Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [managedTeams, setManagedTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  // 1. Responsive Check
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. Fetch Players
  useEffect(() => {
    const loadPlayers = async () => {
      const data = await fetchFreeAgents(filters);
      // Filter out self
      const others = data.filter(p => p.uid !== loggedInUser?.uid);
      setPlayers(others);
    };
    loadPlayers();
  }, [filters, fetchFreeAgents, loggedInUser]);

  // 3. Fetch Managed Teams (to determine Manager Status)
  useEffect(() => {
      const loadTeams = async () => {
          if (loggedInUser) {
              const teams = await fetchManagedRosters(loggedInUser.uid);
              setManagedTeams(teams);
              if (teams.length > 0) setSelectedTeamId(teams[0].id);
          }
      };
      loadTeams();
  }, [loggedInUser, fetchManagedRosters]);

  // 4. Actions
  const handleOpenInvite = (player) => {
    if (!player) return;
    setSelectedPlayer(player);
    setInviteModalOpen(true);
  };

  const handleSendInvite = async () => {
    if (!selectedTeamId || !selectedPlayer) return;
    setInviteLoading(true);
    
    const team = managedTeams.find(t => t.id === selectedTeamId);
    const result = await invitePlayer(team.id, team.name, selectedPlayer.uid, inviteMessage);
    
    setInviteLoading(false);
    if (result.success) {
      alert("Invite sent successfully!");
      setInviteModalOpen(false);
      setInviteMessage("");
    } else {
      alert("Failed to send invite: " + result.message);
    }
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
                players.map(player => (
                  <PublicPlayerCard 
                    key={player.uid} 
                    player={player} 
                    // Pass explicit manager status based on team ownership
                    isManager={managedTeams.length > 0} 
                    onInvite={handleOpenInvite} 
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {inviteModalOpen && selectedPlayer && (
        <Modal 
            isOpen={true} 
            onClose={() => setInviteModalOpen(false)}
            title={`Invite ${selectedPlayer.playerName}`}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {managedTeams.length === 0 ? (
                <p style={{ color: COLORS.danger }}>You need to manage a team to send invites.</p>
            ) : (
                <>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Select Team</label>
                    <select 
                        style={{ width: '100%', padding: '10px', borderRadius: '5px' }}
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                    >
                        {managedTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>

                <Input 
                    label="Message (Optional)"
                    multiline
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder="Hey! We need a striker for our Sunday league..."
                />

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <Button onClick={handleSendInvite} disabled={inviteLoading} style={{ flex: 1 }}>
                        {inviteLoading ? 'Sending...' : 'Send Invite'}
                    </Button>
                    <Button onClick={() => setInviteModalOpen(false)} variant="secondary" style={{ flex: 1 }}>
                        Cancel
                    </Button>
                </div>
                </>
            )}
            </div>
        </Modal>
      )}
    </div>
  );
};

export default FindPlayers;