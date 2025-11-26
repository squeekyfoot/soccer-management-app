import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './common/Button'; // NEW
import Input from './common/Input';   // NEW
import { COLORS } from '../constants'; // NEW

function ManagerDashboard() {
  const { fetchRosters, createRoster, deleteRoster, addPlayerToRoster, removePlayerFromRoster } = useAuth();

  const [rosters, setRosters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoster, setSelectedRoster] = useState(null); 

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRosterName, setNewRosterName] = useState("");
  const [newRosterSeason, setNewRosterSeason] = useState("");
  const [newRosterCapacity, setNewRosterCapacity] = useState("20");

  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    loadRosters();
  }, []);

  const loadRosters = async () => {
    setIsLoading(true);
    const data = await fetchRosters();
    setRosters(data);
    setIsLoading(false);
    
    if (selectedRoster) {
      const updatedRoster = data.find(r => r.id === selectedRoster.id);
      if (updatedRoster) setSelectedRoster(updatedRoster);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newRosterName || !newRosterSeason) {
      alert("Please fill in all fields");
      return;
    }
    const success = await createRoster(newRosterName, newRosterSeason, newRosterCapacity);
    if (success) {
      alert("Roster created!");
      setShowCreateForm(false);
      setNewRosterName("");
      setNewRosterSeason("");
      setNewRosterCapacity("20");
      loadRosters();
    }
  };

  const handleDeleteRoster = async (rosterId) => {
    if (window.confirm("Delete this roster? This cannot be undone.")) {
      const success = await deleteRoster(rosterId);
      if (success) loadRosters();
    }
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    const success = await addPlayerToRoster(selectedRoster.id, inviteEmail);
    if (success) {
      alert("Player added!");
      setInviteEmail("");
      loadRosters();
    }
  };

  const handleRemovePlayer = async (playerSummary) => {
    if (window.confirm(`Remove ${playerSummary.playerName} from this roster?`)) {
      const success = await removePlayerFromRoster(selectedRoster.id, playerSummary);
      if (success) loadRosters();
    }
  };

  // --- VIEW 1: Roster Detail View ---
  if (selectedRoster) {
    return (
      <div style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto' }}>
        <button 
          onClick={() => setSelectedRoster(null)}
          style={{ marginBottom: '20px', background: 'none', border: 'none', color: COLORS.primary, cursor: 'pointer', fontSize: '16px' }}
        >
          ← Back to Dashboard
        </button>

        <h2 style={{ margin: '0 0 10px 0' }}>{selectedRoster.name}</h2>
        <p style={{ color: '#ccc', marginTop: 0 }}>
          {selectedRoster.season} • {selectedRoster.players?.length || 0} / {selectedRoster.maxCapacity} Players
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '30px' }}>
          
          {/* LEFT COL: Player List */}
          <div>
            <h3 style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '10px' }}>Roster</h3>
            {(!selectedRoster.players || selectedRoster.players.length === 0) ? (
              <p style={{ fontStyle: 'italic', color: '#888' }}>No players yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {selectedRoster.players.map((player, index) => (
                  <li key={index} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px', backgroundColor: COLORS.sidebar, marginBottom: '5px', borderRadius: '5px', border: `1px solid ${COLORS.border}`
                  }}>
                    <div>
                      <span style={{ fontWeight: 'bold', display: 'block' }}>{player.playerName}</span>
                      <span style={{ fontSize: '12px', color: '#aaa' }}>{player.email}</span>
                    </div>
                    <Button variant="danger" onClick={() => handleRemovePlayer(player)} style={{ padding: '5px 10px', fontSize: '12px' }}>
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* RIGHT COL: Add Player */}
          <div>
            <h3 style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '10px' }}>Add Player</h3>
            <form onSubmit={handleAddPlayer} style={{ backgroundColor: COLORS.sidebar, padding: '20px', borderRadius: '8px' }}>
              <p style={{ marginTop: 0, fontSize: '14px' }}>Enter the email address of an existing player to add them to this team.</p>
              
              <Input 
                placeholder="player@email.com"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              
              <Button type="submit" style={{ width: '100%' }}>Add to Roster</Button>
            </form>
          </div>

        </div>
      </div>
    );
  }

  // --- VIEW 2: Roster List View (Default) ---
  return (
    <div style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Manager Dashboard</h2>
      <p>Manage your teams and rosters here.</p>

      <div style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Current Rosters</h3>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? "Cancel" : "+ Create New Roster"}
          </Button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateSubmit} style={{
            backgroundColor: COLORS.sidebar, padding: '20px', borderRadius: '8px', marginBottom: '20px',
            border: `1px solid ${COLORS.primary}`
          }}>
            <h4 style={{ marginTop: 0, color: 'white' }}>New Roster Details</h4>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <Input label="Roster Name" placeholder="e.g. The Gizmos" value={newRosterName} onChange={(e) => setNewRosterName(e.target.value)} />
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <Input label="Season" placeholder="e.g. Fall 2025" value={newRosterSeason} onChange={(e) => setNewRosterSeason(e.target.value)} />
              </div>
              <div style={{ width: '100px' }}>
                <Input label="Capacity" type="number" value={newRosterCapacity} onChange={(e) => setNewRosterCapacity(e.target.value)} />
              </div>
            </div>
            <Button type="submit">Save Roster</Button>
          </form>
        )}

        {isLoading ? (
          <p>Loading rosters...</p>
        ) : rosters.length === 0 ? (
          <p style={{ color: '#aaa', fontStyle: 'italic' }}>No rosters found.</p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {rosters.map(roster => (
              <div key={roster.id} style={{
                backgroundColor: COLORS.sidebar, padding: '15px', borderRadius: '8px',
                border: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <h4 style={{ margin: 0, color: COLORS.primary }}>{roster.name}</h4>
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#ccc' }}>
                    {roster.season} • {roster.players?.length || 0} / {roster.maxCapacity} players
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button variant="secondary" onClick={() => setSelectedRoster(roster)} style={{ padding: '5px 15px', fontSize: '12px' }}>
                    Manage
                  </Button>
                  <Button variant="danger" onClick={() => handleDeleteRoster(roster.id)} style={{ padding: '5px 10px', fontSize: '12px' }}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ManagerDashboard;