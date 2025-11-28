import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext'; 
import Button from '../../common/Button'; 
import Input from '../../common/Input';   
import { COLORS } from '../../../config/constants'; 

function SportsInfo() {
  const { soccerDetails, updateSoccerDetails } = useAuth();

  const [isEditingSoccer, setIsEditingSoccer] = useState(false);
  const [soccerFormData, setSoccerFormData] = useState({
    favoredPosition: "",
    jerseySize: "Large",
    playerNumber: 0,
    comments: "",
    currentRosters: "",
    rosterJerseysOwned: ""
  });

  const handleSoccerFormChange = (e) => {
    const { name, value } = e.target;
    setSoccerFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSoccerSubmit = async (e) => {
    e.preventDefault();
    const success = await updateSoccerDetails(soccerFormData);
    if (success) {
      setIsEditingSoccer(false);
    }
  };

  // --- EDIT MODE ---
  if (isEditingSoccer) {
    return (
      <form onSubmit={handleSoccerSubmit} style={{
        display: 'flex', flexDirection: 'column', gap: '10px',
        maxWidth: '400px', textAlign: 'left'
      }}>
        <h2 style={{ margin: '0 0 20px 0' }}>Enter Soccer Details</h2>
        
        <Input 
          label="Favored Position" 
          name="favoredPosition" 
          value={soccerFormData.favoredPosition} 
          onChange={handleSoccerFormChange} 
        />

        <div style={{ marginBottom: '15px', textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '14px' }}>Jersey Size</label>
          <select
            name="jerseySize"
            value={soccerFormData.jerseySize}
            onChange={handleSoccerFormChange}
            style={{ 
              width: '100%', padding: '10px', backgroundColor: '#3a3f4a', 
              border: `1px solid ${COLORS.border}`, borderRadius: '4px', color: 'white', fontSize: '16px' 
            }}
          >
            <option value="Small">Small</option>
            <option value="Medium">Medium</option>
            <option value="Large">Large</option>
            <option value="X-Large">X-Large</option>
          </select>
        </div>

        <Input 
          label="Player Number" 
          type="number" 
          name="playerNumber" 
          value={soccerFormData.playerNumber} 
          onChange={handleSoccerFormChange} 
        />
        
        <Input 
          label="Current Roster(s) (comma-separated)" 
          name="currentRosters" 
          placeholder="e.g. The Gizmos, Team B"
          value={soccerFormData.currentRosters} 
          onChange={handleSoccerFormChange} 
        />
        
        <Input 
          label="Roster Jerseys Owned (comma-separated)" 
          name="rosterJerseysOwned" 
          placeholder="e.g. The Gizmos (Red)"
          value={soccerFormData.rosterJerseysOwned} 
          onChange={handleSoccerFormChange} 
        />

        <div style={{ marginBottom: '15px', textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '14px' }}>Comments</label>
          <textarea
            name="comments"
            value={soccerFormData.comments}
            onChange={handleSoccerFormChange}
            style={{ 
              width: '100%', padding: '10px', backgroundColor: '#3a3f4a', 
              border: `1px solid ${COLORS.border}`, borderRadius: '4px', color: 'white', fontSize: '16px', minHeight: '80px' 
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button type="submit">Save Info</Button>
          <Button variant="secondary" onClick={() => setIsEditingSoccer(false)}>Cancel</Button>
        </div>
      </form>
    );
  }

  // --- VIEW MODE ---
  if (soccerDetails) {
    return (
      <div style={{ textAlign: 'left', maxWidth: '500px' }}>
        <h2 style={{ marginTop: 0 }}>My Soccer Details</h2>
        <div className="info-table">
          <div className="info-label">Favored Position:</div>
          <div className="info-value">{soccerDetails.favoredPosition}</div>

          <div className="info-label">Jersey Size:</div>
          <div className="info-value">{soccerDetails.jerseySize}</div>

          <div className="info-label">Player Number:</div>
          <div className="info-value">{soccerDetails.playerNumber}</div>

          <div className="info-label">Current Rosters:</div>
          <div className="info-value">{soccerDetails.currentRosters.join(', ')}</div>

          <div className="info-label">Jerseys Owned:</div>
          <div className="info-value">{soccerDetails.rosterJerseysOwned.join(', ')}</div>

          <div className="info-label">Comments:</div>
          <div className="info-value">{soccerDetails.comments}</div>
        </div>

        <div style={{ marginTop: '30px' }}>
          <Button onClick={() => {
            setSoccerFormData({
              ...soccerDetails,
              currentRosters: soccerDetails.currentRosters.join(', '),
              rosterJerseysOwned: soccerDetails.rosterJerseysOwned.join(', ')
            });
            setIsEditingSoccer(true);
          }}>
            Edit Info
          </Button>
        </div>
      </div>
    );
  }

  // --- EMPTY STATE ---
  return (
    <div style={{ textAlign: 'left' }}>
      <h2>Sports Information</h2>
      <p style={{ color: '#ccc', fontStyle: 'italic' }}>You haven't added any sports information yet.</p>
    </div>
  );
}

export default SportsInfo;