import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Import the "brain"

/**
 * This component ONLY worries about the Sports Info page.
 */
function SportsInfo() {
  // Get what we need from the "brain"
  const { soccerDetails, updateSoccerDetails } = useAuth();

  // This state is LOCAL
  const [isEditingSoccer, setIsEditingSoccer] = useState(false);
  const [soccerFormData, setSoccerFormData] = useState({
    favoredPosition: "",
    jerseySize: "Large",
    playerNumber: 0,
    comments: "",
    currentRosters: "",
    rosterJerseysOwned: ""
  });

  // Local form change handler
  const handleSoccerFormChange = (e) => {
    const { name, value } = e.target;
    setSoccerFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Local form submit handler
  const handleSoccerSubmit = async (e) => {
    e.preventDefault();
    // Call the function from the "brain"
    const success = await updateSoccerDetails(soccerFormData);
    if (success) {
      setIsEditingSoccer(false); // Close the form
    }
  };

  if (isEditingSoccer) {
    /* --- START: SOCCER EDIT FORM --- */
    return (
      <form onSubmit={handleSoccerSubmit} style={{
        display: 'flex', flexDirection: 'column', gap: '15px',
        maxWidth: '400px', textAlign: 'left'
      }}>
        <h2>Enter Soccer Details</h2>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          Favored Position:
          <input
            type="text"
            name="favoredPosition"
            value={soccerFormData.favoredPosition}
            onChange={handleSoccerFormChange}
            style={{ padding: '8px' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          Jersey Size:
          <select
            name="jerseySize"
            value={soccerFormData.jerseySize}
            onChange={handleSoccerFormChange}
            style={{ padding: '8px' }}
          >
            <option value="Small">Small</option>
            <option value="Medium">Medium</option>
            <option value="Large">Large</option>
            <option value="X-Large">X-Large</option>
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          Player Number:
          <input
            type="number"
            name="playerNumber"
            value={soccerFormData.playerNumber}
            onChange={handleSoccerFormChange}
            style={{ padding: '8px' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          Current Roster(s) (comma-separated):
          <input
            type="text"
            name="currentRosters"
            placeholder="e.g. The Gizmos, Team B"
            value={soccerFormData.currentRosters}
            onChange={handleSoccerFormChange}
            style={{ padding: '8px' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          Roster Jerseys Owned (comma-separated):
          <input
            type="text"
            name="rosterJerseysOwned"
            placeholder="e.g. The Gizmos (Red)"
            value={soccerFormData.rosterJerseysOwned}
            onChange={handleSoccerFormChange}
            style={{ padding: '8px' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          Comments:
          <textarea
            name="comments"
            value={soccerFormData.comments}
            onChange={handleSoccerFormChange}
            style={{ padding: '8px', minHeight: '60px' }}
          />
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" style={{
            padding: '10px 20px', backgroundColor: '#61dafb', border: 'none',
            cursor: 'pointer', fontSize: '16px'
          }}>
            Save Info
          </button>
          <button
            type="button"
            onClick={() => setIsEditingSoccer(false)}
            style={{
              padding: '10px 20px', backgroundColor: '#555', border: 'none',
              color: 'white', cursor: 'pointer', fontSize: '16px'
            }}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

  if (soccerDetails) {
    /* --- START: SOCCER VIEW MODE --- */
    return (
      <div style={{ textAlign: 'left', maxWidth: '500px' }}>
        <h2>My Soccer Details</h2>
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

        <button
          onClick={() => {
            // Pre-fill the form with current data
            setSoccerFormData({
              ...soccerDetails,
              currentRosters: soccerDetails.currentRosters.join(', '),
              rosterJerseysOwned: soccerDetails.rosterJerseysOwned.join(', ')
            });
            setIsEditingSoccer(true);
          }}
          style={{
            padding: '10px 20px', backgroundColor: '#61dafb', border: 'none',
            cursor: 'pointer', fontSize: '16px', marginTop: '30px'
          }}>
          Edit Info
        </button>
      </div>
    );
  }

  /* --- START: SOCCER "ADD" PROMPT --- */
  return (
    <div style={{ textAlign: 'left' }}>
      <h2>Sports Information</h2>
      <p>You haven't added any sports information yet.</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
        <select style={{ padding: '8px' }}>
          <option value="soccer">Soccer</option>
        </select>
        <button
          onClick={() => {
            // Reset form to blank
            setSoccerFormData({
              favoredPosition: "", jerseySize: "Large", playerNumber: 0,
              comments: "", currentRosters: "", rosterJerseysOwned: ""
            });
            setIsEditingSoccer(true);
          }}
          style={{
            padding: '10px 20px', backgroundColor: '#61dafb', border: 'none',
            cursor: 'pointer', fontSize: '16px'
          }}>
          Enter Info
        </button>
      </div>
    </div>
  );
}

export default SportsInfo;
