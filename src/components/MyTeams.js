import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function MyTeams() {
  const { fetchUserRosters, loggedInUser } = useAuth();
  const [myRosters, setMyRosters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loggedInUser) {
      loadMyTeams();
    }
  }, [loggedInUser]);

  const loadMyTeams = async () => {
    setIsLoading(true);
    const data = await fetchUserRosters(loggedInUser.uid);
    setMyRosters(data);
    setIsLoading(false);
  };

  return (
    <div style={{ textAlign: 'left', maxWidth: '800px' }}>
      <h2>My Teams</h2>
      <p>The rosters you are currently assigned to.</p>

      <div style={{ marginTop: '30px' }}>
        {isLoading ? (
          <p>Loading teams...</p>
        ) : myRosters.length === 0 ? (
          <p style={{ color: '#aaa', fontStyle: 'italic' }}>
            You are not currently on any rosters. 
            <br />
            Ask your team manager to add you using your email: <strong>{loggedInUser.email}</strong>
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {myRosters.map(roster => (
              <div key={roster.id} style={{
                backgroundColor: '#282c34', padding: '20px', borderRadius: '8px',
                border: '1px solid #444'
              }}>
                <h4 style={{ margin: 0, color: '#61dafb', fontSize: '1.2rem' }}>{roster.name}</h4>
                <p style={{ margin: '5px 0 15px 0', fontSize: '14px', color: '#ccc' }}>
                  {roster.season}
                </p>
                
                {/* Optional: Show teammates */}
                <div style={{ borderTop: '1px solid #444', paddingTop: '10px' }}>
                   <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#888', marginBottom: '5px' }}>Teammates</p>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                     {roster.players && roster.players.map(p => (
                       <span key={p.uid} style={{ 
                         backgroundColor: '#333', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', color: '#eee' 
                       }}>
                         {p.playerName}
                       </span>
                     ))}
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyTeams;