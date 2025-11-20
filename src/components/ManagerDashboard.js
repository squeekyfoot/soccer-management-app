import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function ManagerDashboard() {
  // Get roster functions from the brain
  const { fetchRosters, createRoster, deleteRoster, addPlayerToRoster, removePlayerFromRoster } = useAuth();

  // Global state for this component
  const [rosters, setRosters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoster, setSelectedRoster] = useState(null); // null = show list, object = show detail

  // Create Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRosterName, setNewRosterName] = useState("");
  const [newRosterSeason, setNewRosterSeason] = useState("");
  const [newRosterCapacity, setNewRosterCapacity] = useState("20");

  // Add Player State
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    loadRosters();
  }, []);

  const loadRosters = async () => {
    setIsLoading(true);
    const data = await fetchRosters();
    setRosters(data);
    setIsLoading(false);
    
    // If we are looking at a specific roster, we need to refresh its data too
    if (selectedRoster) {
      const updatedRoster = data.find(r => r.id === selectedRoster.id);
      if (updatedRoster) setSelectedRoster(updatedRoster);
    }
  };

  // --- Actions ---

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
      loadRosters(); // Refresh data to see new player
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
      <div style={{ textAlign: 'left', maxWidth: '800px' }}>
        <button 
          onClick={() => setSelectedRoster(null)}
          style={{ marginBottom: '20px', background: 'none', border: 'none', color: '#61dafb', cursor: 'pointer', fontSize: '16px' }}
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
            <h3 style={{ borderBottom: '1px solid #444', paddingBottom: '10px' }}>Roster</h3>
            {(!selectedRoster.players || selectedRoster.players.length === 0) ? (
              <p style={{ fontStyle: 'italic', color: '#888' }}>No players yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {selectedRoster.players.map((player, index) => (
                  <li key={index} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px', backgroundColor: '#282c34', marginBottom: '5px', borderRadius: '5px', border: '1px solid #444'
                  }}>
                    <div>
                      <span style={{ fontWeight: 'bold', display: 'block' }}>{player.playerName}</span>
                      <span style={{ fontSize: '12px', color: '#aaa' }}>{player.email}</span>
                    </div>
                    <button 
                      onClick={() => handleRemovePlayer(player)}
                      style={{ color: '#ff6b6b', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* RIGHT COL: Add Player */}
          <div>
            <h3 style={{ borderBottom: '1px solid #444', paddingBottom: '10px' }}>Add Player</h3>
            <form onSubmit={handleAddPlayer} style={{ backgroundColor: '#3a3f4a', padding: '20px', borderRadius: '8px' }}>
              <p style={{ marginTop: 0, fontSize: '14px' }}>Enter the email address of an existing player to add them to this team.</p>
              
              <input 
                type="email" 
                placeholder="player@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }}
              />
              
              <button type="submit" style={{
                width: '100%', padding: '10px', backgroundColor: '#61dafb',
                border: 'none', cursor: 'pointer', fontWeight: 'bold'
              }}>
                Add to Roster
              </button>
            </form>
          </div>

        </div>
      </div>
    );
  }

  // --- VIEW 2: Roster List View (Default) ---
  return (
    <div style={{ textAlign: 'left', maxWidth: '800px' }}>
      <h2>Manager Dashboard</h2>
      <p>Manage your teams and rosters here.</p>

      <div style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Current Rosters</h3>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              padding: '10px 15px', backgroundColor: '#61dafb', border: 'none',
              cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', borderRadius: '5px'
            }}
          >
            {showCreateForm ? "Cancel" : "+ Create New Roster"}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateSubmit} style={{
            backgroundColor: '#3a3f4a', padding: '20px', borderRadius: '8px', marginBottom: '20px',
            border: '1px solid #61dafb'
          }}>
            <h4 style={{ marginTop: 0, color: 'white' }}>New Roster Details</h4>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <label style={{ flex: 1, minWidth: '200px' }}>
                <span style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Roster Name</span>
                <input type="text" placeholder="e.g. The Gizmos" value={newRosterName} onChange={(e) => setNewRosterName(e.target.value)} style={{ width: '100%', padding: '8px' }} />
              </label>
              <label style={{ flex: 1, minWidth: '150px' }}>
                <span style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Season</span>
                <input type="text" placeholder="e.g. Fall 2025" value={newRosterSeason} onChange={(e) => setNewRosterSeason(e.target.value)} style={{ width: '100%', padding: '8px' }} />
              </label>
              <label style={{ width: '100px' }}>
                <span style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Capacity</span>
                <input type="number" value={newRosterCapacity} onChange={(e) => setNewRosterCapacity(e.target.value)} style={{ width: '100%', padding: '8px' }} />
              </label>
            </div>
            <button type="submit" style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#61dafb', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>Save Roster</button>
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
                backgroundColor: '#282c34', padding: '15px', borderRadius: '8px',
                border: '1px solid #444', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <h4 style={{ margin: 0, color: '#61dafb' }}>{roster.name}</h4>
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#ccc' }}>
                    {roster.season} • {roster.players?.length || 0} / {roster.maxCapacity} players
                  </p>
                </div>
                <div>
                  <button 
                    onClick={() => setSelectedRoster(roster)}
                    style={{ marginRight: '10px', padding: '5px 15px', backgroundColor: '#555', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'white', borderRadius: '4px' }}
                  >
                    Manage
                  </button>
                  <button 
                    onClick={() => handleDeleteRoster(roster.id)}
                    style={{ padding: '5px 10px', backgroundColor: '#ff6b6b', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'white', borderRadius: '4px' }}
                  >
                    Delete
                  </button>
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