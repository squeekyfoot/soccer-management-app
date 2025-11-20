import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function ManagerDashboard() {
  // Get roster functions from the brain
  const { createRoster, fetchRosters, deleteRoster } = useAuth();

  // Local state for the list of rosters
  const [rosters, setRosters] = useState([]);
  const [isLoadingRosters, setIsLoadingRosters] = useState(true);

  // Local state for the "Create Roster" form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRosterName, setNewRosterName] = useState("");
  const [newRosterSeason, setNewRosterSeason] = useState("");
  const [newRosterCapacity, setNewRosterCapacity] = useState("20");

  // Load rosters when this component first appears
  useEffect(() => {
    loadRosters();
  }, []);

  const loadRosters = async () => {
    setIsLoadingRosters(true);
    const data = await fetchRosters();
    setRosters(data);
    setIsLoadingRosters(false);
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
      setShowCreateForm(false); // Close form
      setNewRosterName(""); // Reset fields
      setNewRosterSeason("");
      setNewRosterCapacity("20");
      loadRosters(); // Refresh the list
    }
  };

  const handleDelete = async (rosterId) => {
    if (window.confirm("Are you sure you want to delete this roster? This cannot be undone.")) {
      const success = await deleteRoster(rosterId);
      if (success) {
        loadRosters(); // Refresh the list
      }
    }
  };

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

        {/* --- Create Roster Form --- */}
        {showCreateForm && (
          <form onSubmit={handleCreateSubmit} style={{
            backgroundColor: '#3a3f4a', padding: '20px', borderRadius: '8px', marginBottom: '20px',
            border: '1px solid #61dafb'
          }}>
            <h4 style={{ marginTop: 0, color: 'white' }}>New Roster Details</h4>
            
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <label style={{ flex: 1, minWidth: '200px' }}>
                <span style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Roster Name</span>
                <input 
                  type="text" 
                  placeholder="e.g. The Gizmos"
                  value={newRosterName}
                  onChange={(e) => setNewRosterName(e.target.value)}
                  style={{ width: '100%', padding: '8px' }}
                />
              </label>

              <label style={{ flex: 1, minWidth: '150px' }}>
                <span style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Season</span>
                <input 
                  type="text" 
                  placeholder="e.g. Fall 2025"
                  value={newRosterSeason}
                  onChange={(e) => setNewRosterSeason(e.target.value)}
                  style={{ width: '100%', padding: '8px' }}
                />
              </label>

              <label style={{ width: '100px' }}>
                <span style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Capacity</span>
                <input 
                  type="number" 
                  value={newRosterCapacity}
                  onChange={(e) => setNewRosterCapacity(e.target.value)}
                  style={{ width: '100%', padding: '8px' }}
                />
              </label>
            </div>

            <button type="submit" style={{
              marginTop: '15px', padding: '10px 20px', backgroundColor: '#61dafb',
              border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
            }}>
              Save Roster
            </button>
          </form>
        )}

        {/* --- Roster List --- */}
        {isLoadingRosters ? (
          <p>Loading rosters...</p>
        ) : rosters.length === 0 ? (
          <p style={{ color: '#aaa', fontStyle: 'italic' }}>No rosters found. Create one above.</p>
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
                    {roster.season} • Max: {roster.maxCapacity} players
                  </p>
                </div>
                <button 
                  onClick={() => handleDelete(roster.id)}
                  style={{
                    padding: '5px 10px', backgroundColor: '#ff6b6b', border: 'none',
                    cursor: 'pointer', fontSize: '12px', color: 'white', borderRadius: '4px'
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ManagerDashboard;