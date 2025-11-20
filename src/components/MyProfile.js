import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Import the "brain"

/**
 * This component ONLY worries about the Profile page.
 * It gets its data and functions from the useAuth hook.
 */
function MyProfile() {
  // Get what we need from the "brain"
  const { loggedInUser, updateProfile } = useAuth();

  // This state is LOCAL to this component
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({});

  // Form change handler is also local
  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Form submit handler
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    // Call the updateProfile function from the "brain"
    const success = await updateProfile(profileFormData);
    if (success) {
      setIsEditingProfile(false); // Close the form
    }
  };

  if (isEditingProfile) {
    /* --- START: PROFILE EDIT FORM --- */
    return (
      <form onSubmit={handleProfileSubmit} style={{
        display: 'flex', flexDirection: 'column', gap: '15px',
        maxWidth: '400px', textAlign: 'left'
      }}>
        <h2>Edit My Profile</h2>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          Player Name:
          <input
            type="text"
            name="playerName"
            value={profileFormData.playerName}
            onChange={handleProfileFormChange}
            required
            style={{ padding: '8px' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          Email:
          <input
            type="email"
            name="email"
            value={profileFormData.email}
            onChange={handleProfileFormChange}
            required
            style={{ padding: '8px' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          Phone:
          <input
            type="tel"
            name="phone"
            value={profileFormData.phone}
            onChange={handleProfileFormChange}
            style={{ padding: '8px' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          Address:
          <input
            type="text"
            name="address"
            value={profileFormData.address}
            onChange={handleProfileFormChange}
            style={{ padding: '8px' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          Notification Preference:
          <select
            name="notificationPreference"
            value={profileFormData.notificationPreference}
            onChange={handleProfileFormChange}
            style={{ padding: '8px' }}
          >
            <option value="Email">Email</option>
            <option value="Text Message">Text Message</option>
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          Comments:
          <textarea
            name="comments"
            value={profileFormData.comments}
            onChange={handleProfileFormChange}
            placeholder="Feel free to contact me anytime."
            style={{ padding: '8px', minHeight: '60px' }}
          />
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" style={{
            padding: '10px 20px', backgroundColor: '#61dafb', border: 'none',
            cursor: 'pointer', fontSize: '16px'
          }}>
            Save Profile
          </button>
          <button
            type="button"
            onClick={() => setIsEditingProfile(false)}
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

  /* --- START: PROFILE VIEW MODE --- */
  return (
    <div style={{ textAlign: 'left', maxWidth: '500px' }}>
      <h2>My Profile</h2>
      <div className="info-table">
        <div className="info-label">Player Name:</div>
        <div className="info-value">{loggedInUser.playerName}</div>

        <div className="info-label">Email:</div>
        <div className="info-value">{loggedInUser.email}</div>

        <div className="info-label">Phone:</div>
        <div className="info-value">{loggedInUser.phone}</div>

        <div className="info-label">Address:</div>
        <div className="info-value">{loggedInUser.address}</div>

        <div className="info-label">Preference:</div>
        <div className="info-value">{loggedInUser.notificationPreference}</div>

        <div className="info-label">Comments:</div>
        <div className="info-value">{loggedInUser.comments}</div>

        <div className="info-label">Is Admin:</div>
        <div className="info-value">{loggedInUser.isAdmin ? 'Yes' : 'No'}</div>
      </div>

      <button
        onClick={() => {
          // Pre-fill the form with the user's current data
          setProfileFormData(loggedInUser);
          setIsEditingProfile(true);
        }}
        style={{
          padding: '10px 20px', backgroundColor: '#61dafb', border: 'none',
          cursor: 'pointer', fontSize: '16px', marginTop: '30px'
        }}>
        Edit Profile
      </button>
    </div>
  );
}

export default MyProfile;
