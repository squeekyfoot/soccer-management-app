import React from 'react';

function ManagerDashboard() {
  return (
    <div style={{ textAlign: 'left' }}>
      <h2>Team Manager Dashboard</h2>
      <p>Welcome, Manager. This is your command center.</p>
      
      <div style={{ 
        marginTop: '20px', 
        padding: '20px', 
        backgroundColor: '#3a3f4a', 
        borderRadius: '8px' 
      }}>
        <h3>Roster Management</h3>
        <p>Roster tools coming soon...</p>
        {/* Future features:
            - Create Roster
            - Add Player to Roster
            - View Team Stats
        */}
      </div>
    </div>
  );
}

export default ManagerDashboard;