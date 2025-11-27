import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import SportsInfo from './SportsInfo';
import { LogOut, User, Activity } from 'lucide-react'; 
import Header from './common/Header';
import Button from './common/Button';
import Card from './common/Card';
import Avatar from './common/Avatar';
import { COLORS, MOBILE_BREAKPOINT } from '../constants';

function MyProfile() {
  const { loggedInUser, updateProfile, signOutUser } = useAuth();

  // --- Navigation State ---
  const [currentView, setCurrentView] = useState('hub'); // 'hub' | 'personal' | 'sports'
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);

  // --- Edit Profile State (Personal Info) ---
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({});
  
  // --- Image State ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(loggedInUser?.photoURL || "");
  const [isRemovingImage, setIsRemovingImage] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Handlers ---
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIsRemovingImage(false);
    }
  };

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

  // --- Styles for Edit Form ---
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

  // --- Shared Component: Menu Card ---
  const MenuCard = ({ title, desc, icon: Icon, onClick }) => (
    <Card 
        onClick={onClick} 
        hoverable 
        style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'row' : 'column', 
            alignItems: 'center', 
            justifyContent: isMobile ? 'flex-start' : 'center', 
            textAlign: isMobile ? 'left' : 'center',
            minHeight: isMobile ? 'auto' : '220px', 
            marginBottom: 0,
            padding: '20px',
            boxSizing: 'border-box'
        }}
    >
      <Icon 
        size={isMobile ? 32 : 40} 
        color={COLORS.primary} 
        style={{ 
            marginBottom: isMobile ? 0 : '15px', 
            marginRight: isMobile ? '15px' : 0,
            flexShrink: 0 
        }} 
      />
      <div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>{title}</div>
        <div style={{ fontSize: '13px', color: '#aaa' }}>{desc}</div>
      </div>
    </Card>
  );

  // --- VIEW 1: PROFILE HUB ---
  if (currentView === 'hub') {
      return (
        <div className="view-container">
          <Header 
            title="Profile" 
            style={{ maxWidth: '1000px', margin: '0 auto' }}
            actions={
                <button 
                  onClick={handleSignOut}
                  style={{ 
                    background: 'none', border: 'none', color: '#ff6b6b', 
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    fontSize: '10px', fontWeight: 'bold'
                  }}
                >
                  <LogOut size={20} />
                  Sign Out
                </button>
            }
          />
          
          <div className="view-content">
            <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
              
              {/* --- Identity Section (Moved Here) --- */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px', marginTop: '20px' }}>
                  <div style={{ marginBottom: '15px' }}>
                      <Avatar 
                        src={loggedInUser.photoURL} 
                        text={loggedInUser.playerName} 
                        size={100} 
                        style={{ border: `3px solid ${COLORS.primary}`, fontSize: '40px' }} 
                      />
                  </div>
                  <h2 style={{ margin: 0, color: 'white' }}>{loggedInUser.playerName}</h2>
                  <p style={{ margin: '5px 0', color: '#aaa' }}>{loggedInUser.email}</p>
              </div>

              {/* --- Navigation Cards --- */}
              <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                  gridAutoRows: isMobile ? 'auto' : 'minmax(220px, auto)',
                  gap: '20px', 
                  minHeight: 0 
              }}>
                 <MenuCard 
                    title="Personal Information" 
                    desc="Contact information and preferences" 
                    icon={User} 
                    onClick={() => setCurrentView('personal')} 
                 />
                 <MenuCard 
                    title="Sports Details" 
                    desc="Sport-specific profile information" 
                    icon={Activity} 
                    onClick={() => setCurrentView('sports')} 
                 />
              </div>
            </div>
          </div>
        </div>
      );
  }

  // --- VIEW 2: PERSONAL INFORMATION ---
  if (currentView === 'personal') {
      // A. Edit Mode
      if (isEditingProfile) {
        return (
          <div className="view-container">
            <Header title="Edit Personal Info" style={{ maxWidth: '1000px', margin: '0 auto' }} />
            <div className="view-content">
              <form onSubmit={handleProfileSubmit} style={{
                display: 'flex', flexDirection: 'column', gap: '15px',
                textAlign: 'left', maxWidth: '1000px', margin: '0 auto'
              }}>
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
                  <Button type="submit">Save</Button>
                  <Button 
                    variant="secondary"
                    onClick={() => {
                      setIsEditingProfile(false);
                      setPreviewUrl(loggedInUser.photoURL || ""); 
                      setSelectedFile(null);
                      setIsRemovingImage(false);
                    }} 
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        );
      }

      // B. View Mode (Table Only)
      return (
        <div className="view-container">
          <Header 
            title="Personal Information" 
            style={{ maxWidth: '1000px', margin: '0 auto' }}
            actions={<Button variant="secondary" onClick={() => setCurrentView('hub')} style={{ fontSize: '14px', padding: '5px 15px' }}>Back</Button>}
          />
          
          <div className="view-content">
            <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
              <div className="info-table">
                <div className="info-label">Phone:</div><div className="info-value">{loggedInUser.phone}</div>
                <div className="info-label">Address:</div><div className="info-value">{loggedInUser.address}</div>
                <div className="info-label">Preference:</div><div className="info-value">{loggedInUser.notificationPreference}</div>
                <div className="info-label">Comments:</div><div className="info-value">{loggedInUser.comments}</div>
                <div className="info-label">Is Admin:</div><div className="info-value">{loggedInUser.isAdmin ? 'Yes' : 'No'}</div>
              </div>

              <div style={{ marginTop: '30px' }}>
                <Button
                   onClick={() => {
                     setProfileFormData(loggedInUser);
                     setPreviewUrl(loggedInUser.photoURL || "");
                     setIsEditingProfile(true);
                   }}
                >
                   Edit Info
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
  }

  // --- VIEW 3: SPORTS DETAILS ---
  if (currentView === 'sports') {
      return (
        <div className="view-container">
          <Header 
             title="Sports Details" 
             style={{ maxWidth: '1000px', margin: '0 auto' }}
             actions={<Button variant="secondary" onClick={() => setCurrentView('hub')} style={{ fontSize: '14px', padding: '5px 15px' }}>Back</Button>}
          />
          <div className="view-content">
             <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
                <SportsInfo />
             </div>
          </div>
        </div>
      );
  }

  return null;
}

export default MyProfile;