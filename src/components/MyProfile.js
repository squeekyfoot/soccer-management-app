import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Import the "brain"
// NEW: Import SportsInfo to render it here
import SportsInfo from './SportsInfo';

function MyProfile() {
  const { loggedInUser, updateProfile, signOutUser } = useAuth();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({});

  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const success = await updateProfile(profileFormData);
    if (success) {
      setIsEditingProfile(false);
    }
  };

  // --- EDIT MODE ---
  if (isEditingProfile) {
    return (
      <form onSubmit={handleProfileSubmit} style={{
        display: 'flex', flexDirection: 'column', gap: '15px',
        maxWidth: '500px', textAlign: 'left', margin: '0 auto'
      }}>
        <h2>Edit My Profile</h2>
        {/* ... (Inputs remain the same as before) ... */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          Player Name:
          <input type="text" name="playerName" value={profileFormData.playerName} onChange={handleProfileFormChange} required style={{ padding: '8px' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          Email:
          <input type="email" name="email" value={profileFormData.email} onChange={handleProfileFormChange} required style={{ padding: '8px' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          Phone:
          <input type="tel" name="phone" value={profileFormData.phone} onChange={handleProfileFormChange} style={{ padding: '8px' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          Address:
          <input type="text" name="address" value={profileFormData.address} onChange={handleProfileFormChange} style={{ padding: '8px' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          Notification Preference:
          <select name="notificationPreference" value={profileFormData.notificationPreference} onChange={handleProfileFormChange} style={{ padding: '8px' }}>
            <option value="Email">Email</option>
            <option value="Text Message">Text Message</option>
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          Comments:
          <textarea name="comments" value={profileFormData.comments} onChange={handleProfileFormChange} style={{ padding: '8px', minHeight: '60px' }} />
        </label>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#61dafb', border: 'none', cursor: 'pointer', fontSize: '16px' }}>Save</button>
          <button type="button" onClick={() => setIsEditingProfile(false)} style={{ padding: '10px 20px', backgroundColor: '#555', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px' }}>Cancel</button>
        </div>
      </form>
    );
  }

  // --- VIEW MODE ---
  return (
    <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
      
      {/* Section 1: Basic Profile */}
      <section style={{ marginBottom: '40px', paddingBottom: '20px', borderBottom: '1px solid #444' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>My Profile</h2>
          <button
            onClick={() => {
              setProfileFormData(loggedInUser);
              setIsEditingProfile(true);
            }}
            style={{
              padding: '8px 15px', backgroundColor: '#333', border: '1px solid #555',
              color: 'white', cursor: 'pointer', borderRadius: '5px'
            }}>
            Edit
          </button>
        </div>

        <div className="info-table" style={{ marginTop: '20px' }}>
          <div className="info-label">Player Name:</div><div className="info-value">{loggedInUser.playerName}</div>
          <div className="info-label">Email:</div><div className="info-value">{loggedInUser.email}</div>
          <div className="info-label">Phone:</div><div className="info-value">{loggedInUser.phone}</div>
          <div className="info-label">Address:</div><div className="info-value">{loggedInUser.address}</div>
          <div className="info-label">Preference:</div><div className="info-value">{loggedInUser.notificationPreference}</div>
          <div className="info-label">Comments:</div><div className="info-value">{loggedInUser.comments}</div>
          <div className="info-label">Is Admin:</div><div className="info-value">{loggedInUser.isAdmin ? 'Yes' : 'No'}</div>
        </div>
      </section>

      {/* Section 2: Sports Info (Imported Component) */}
      <section style={{ marginBottom: '40px' }}>
        <SportsInfo />
      </section>

      {/* Section 3: Sign Out */}
      <section style={{ textAlign: 'center' }}>
        <button 
          onClick={signOutUser} 
          style={{ 
            width: '100%', padding: '12px', backgroundColor: '#ff6b6b', color: 'white',
            border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer'
          }}
        >
          Sign Out
        </button>
      </section>

    </div>
  );
}

export default MyProfile;