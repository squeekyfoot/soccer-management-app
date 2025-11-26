import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import SportsInfo from './SportsInfo';
import { LogOut } from 'lucide-react'; 

function MyProfile() {
  const { loggedInUser, updateProfile, signOutUser } = useAuth();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({});
  
  // Image State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(loggedInUser?.photoURL || "");
  const [isRemovingImage, setIsRemovingImage] = useState(false);
  
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIsRemovingImage(false);
    }
  };

  // Handle "Remove" button
  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setIsRemovingImage(true);
  };

  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const success = await updateProfile(profileFormData, selectedFile, isRemovingImage);
    if (success) {
      setIsEditingProfile(false);
      setSelectedFile(null);
      setIsRemovingImage(false);
    }
  };

  const handleSignOut = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      signOutUser();
    }
  };

  const styles = {
    profileHeader: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: '30px'
    },
    imageContainer: {
      width: '150px',
      height: '150px',
      borderRadius: '50%',
      overflow: 'hidden',
      backgroundColor: '#444',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: '15px',
      border: '3px solid #61dafb'
    },
    profileImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    placeholderText: {
      color: '#888',
      fontSize: '40px'
    },
    actionButtons: {
      display: 'flex',
      gap: '10px',
      marginTop: '10px'
    }
  };

  if (isEditingProfile) {
    return (
      <form onSubmit={handleProfileSubmit} style={{
        display: 'flex', flexDirection: 'column', gap: '15px',
        maxWidth: '500px', textAlign: 'left', margin: '0 auto'
      }}>
        <h2>Edit My Profile</h2>

        <div style={styles.profileHeader}>
          <div style={styles.imageContainer}>
            {previewUrl ? (
              <img src={previewUrl} alt="Profile" style={styles.profileImage} />
            ) : (
              <span style={styles.placeholderText}>?</span>
            )}
          </div>
          
          <div style={styles.actionButtons}>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange} 
              accept="image/*"
              style={{ display: 'none' }}
            />
            
            <button 
              type="button"
              onClick={() => fileInputRef.current.click()}
              style={{ padding: '8px 15px', backgroundColor: '#333', border: '1px solid #555', color: 'white', cursor: 'pointer', borderRadius: '5px' }}
            >
              {previewUrl ? "Change Picture" : "Add Picture"}
            </button>

            {previewUrl && (
              <button 
                type="button"
                onClick={handleRemoveImage}
                style={{ padding: '8px 15px', backgroundColor: '#333', border: '1px solid #ff6b6b', color: '#ff6b6b', cursor: 'pointer', borderRadius: '5px' }}
              >
                Remove
              </button>
            )}
          </div>
        </div>

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
          <button 
            type="button" 
            onClick={() => {
              setIsEditingProfile(false);
              setPreviewUrl(loggedInUser.photoURL || ""); 
              setSelectedFile(null);
              setIsRemovingImage(false);
            }} 
            style={{ padding: '10px 20px', backgroundColor: '#555', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px' }}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #444', paddingBottom: '20px', gap: '20px' }}>
        
        {/* 1. Avatar */}
        <div style={{ 
          width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', 
          backgroundColor: '#444', display: 'flex', justifyContent: 'center', alignItems: 'center',
          border: '2px solid #61dafb', flexShrink: 0
        }}>
          {loggedInUser.photoURL ? (
            <img src={loggedInUser.photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '30px', color: '#888' }}>
              {loggedInUser.playerName ? loggedInUser.playerName.charAt(0).toUpperCase() : "?"}
            </span>
          )}
        </div>

        {/* 2. Details */}
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0 }}>{loggedInUser.playerName}</h2>
          <p style={{ color: '#aaa', margin: '5px 0' }}>{loggedInUser.email}</p>
          
          <button
            onClick={() => {
              setProfileFormData(loggedInUser);
              setPreviewUrl(loggedInUser.photoURL || "");
              setIsEditingProfile(true);
            }}
            style={{
              padding: '8px 15px', backgroundColor: '#333', border: '1px solid #555',
              color: 'white', cursor: 'pointer', borderRadius: '5px', marginTop: '10px'
            }}>
            Edit Profile
          </button>
        </div>

        {/* 3. Sign Out Button (Top Right, Text Under Icon) */}
        <div>
          <button 
            onClick={handleSignOut}
            style={{ 
              background: 'none', border: 'none', color: '#ff6b6b', 
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              fontSize: '10px', fontWeight: 'bold'
            }}
          >
            <LogOut size={24} />
            Sign Out
          </button>
        </div>

      </div>

      <section style={{ marginBottom: '40px' }}>
        <h3 style={{ marginTop: 0 }}>Details</h3>
        <div className="info-table">
          <div className="info-label">Phone:</div><div className="info-value">{loggedInUser.phone}</div>
          <div className="info-label">Address:</div><div className="info-value">{loggedInUser.address}</div>
          <div className="info-label">Preference:</div><div className="info-value">{loggedInUser.notificationPreference}</div>
          <div className="info-label">Comments:</div><div className="info-value">{loggedInUser.comments}</div>
          <div className="info-label">Is Admin:</div><div className="info-value">{loggedInUser.isAdmin ? 'Yes' : 'No'}</div>
        </div>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <SportsInfo />
      </section>

    </div>
  );
}

export default MyProfile;