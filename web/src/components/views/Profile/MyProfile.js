import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useProfileLogic } from '../../../hooks/useProfileLogic'; // Import New Hook
import SportsInfo from './SportsInfo';
import { LogOut, User, Activity, Plus } from 'lucide-react'; 
import Header from '../../common/Header';
import Button from '../../common/Button';
import Card from '../../common/Card';
import Avatar from '../../common/Avatar';
import Modal from '../../common/Modal'; 
import Input from '../../common/Input'; 
import { COLORS, MOBILE_BREAKPOINT } from '../../../lib/constants';

function MyProfile() {
  const { loggedInUser, signOutUser } = useAuth();
  
  // Use the new hook
  const {
      currentView, setCurrentView,
      isEditingProfile, setIsEditingProfile,
      profileFormData, handleProfileFormChange,
      previewUrl, handleFileChange, handleRemoveImage,
      handleProfileSubmit,
      updateSoccerDetails
  } = useProfileLogic();

  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  const fileInputRef = useRef(null);
  
  // Local state just for the "Add Sport" modal interaction
  const [showAddSportModal, setShowAddSportModal] = useState(false);
  const [newSportType, setNewSportType] = useState("Soccer");
  const [newSportData, setNewSportData] = useState({
      favoredPosition: "", jerseySize: "Large", playerNumber: 0,
      currentRosters: "", rosterJerseysOwned: "", comments: ""
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSportChange = (e) => {
      const { name, value } = e.target;
      setNewSportData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSportSubmit = async (e) => {
      e.preventDefault();
      if (newSportType === 'Soccer') {
          const success = await updateSoccerDetails(newSportData);
          if (success) {
              setShowAddSportModal(false);
              setNewSportData({
                  favoredPosition: "", jerseySize: "Large", playerNumber: 0,
                  currentRosters: "", rosterJerseysOwned: "", comments: ""
              });
          }
      } else {
          alert("Only Soccer is supported at this time.");
      }
  };

  // ... (Styles object same as before) ...
  const styles = {
    profileHeader: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' },
    imageContainer: { width: '150px', height: '150px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#444', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '15px', border: '3px solid #61dafb' },
    profileImage: { width: '100%', height: '100%', objectFit: 'cover' },
    placeholderText: { color: '#888', fontSize: '40px' },
    actionButtons: { display: 'flex', gap: '10px', marginTop: '10px' }
  };

  // ... (MenuCard component same as before) ...
  const MenuCard = ({ title, desc, icon: Icon, onClick }) => (
    <Card onClick={onClick} hoverable style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: 'center', justifyContent: isMobile ? 'flex-start' : 'center', textAlign: isMobile ? 'left' : 'center', minHeight: isMobile ? 'auto' : '220px', marginBottom: 0, padding: '20px', boxSizing: 'border-box' }}>
      <Icon size={isMobile ? 32 : 40} color={COLORS.primary} style={{ marginBottom: isMobile ? 0 : '15px', marginRight: isMobile ? '15px' : 0, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>{title}</div>
        <div style={{ fontSize: '13px', color: '#aaa' }}>{desc}</div>
      </div>
    </Card>
  );

  if (currentView === 'hub') {
      return (
        <div className="view-container">
          <Header title="Profile" style={{ maxWidth: '1000px', margin: '0 auto' }}
            actions={
                <button onClick={() => { if(window.confirm("Sign out?")) signOutUser() }} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px' }}>
                  <LogOut size={20} />
                </button>
            }
          />
          <div className="view-content">
            <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px', marginTop: '20px' }}>
                  <div style={{ marginBottom: '15px' }}>
                      <Avatar src={loggedInUser.photoURL} text={loggedInUser.playerName} size={100} style={{ border: `3px solid ${COLORS.primary}`, fontSize: '40px' }} />
                  </div>
                  <h2 style={{ margin: 0, color: 'white' }}>{loggedInUser.playerName}</h2>
                  <p style={{ margin: '5px 0', color: '#aaa' }}>{loggedInUser.email}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gridAutoRows: isMobile ? 'auto' : 'minmax(220px, auto)', gap: '20px', minHeight: 0 }}>
                 <MenuCard title="Personal Information" desc="Contact information and preferences" icon={User} onClick={() => setCurrentView('personal')} />
                 <MenuCard title="Sports Details" desc="Sport-specific profile information" icon={Activity} onClick={() => setCurrentView('sports')} />
              </div>
            </div>
          </div>
        </div>
      );
  }

  // ... (Views for 'personal' and 'sports' similar to before, but using variables from hook) ...
  // Simplified for brevity in this answer, but you would paste the form rendering here using `profileFormData` and `handleProfileFormChange`
  
  if (currentView === 'personal') {
      if (isEditingProfile) {
        return (
          <div className="view-container">
            <Header title="Edit Personal Info" style={{ maxWidth: '1000px', margin: '0 auto' }} />
            <div className="view-content">
              <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left', maxWidth: '1000px', margin: '0 auto' }}>
                <div style={styles.profileHeader}>
                  <div style={styles.imageContainer}>
                    {previewUrl ? <img src={previewUrl} alt="Profile" style={styles.profileImage} /> : <span style={styles.placeholderText}>?</span>}
                  </div>
                  <div style={styles.actionButtons}>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                    <button type="button" onClick={() => fileInputRef.current.click()} style={{ padding: '8px 15px', backgroundColor: '#333', border: '1px solid #555', color: 'white', cursor: 'pointer', borderRadius: '5px' }}>{previewUrl ? "Change Picture" : "Add Picture"}</button>
                    {previewUrl && <button type="button" onClick={handleRemoveImage} style={{ padding: '8px 15px', backgroundColor: '#333', border: '1px solid #ff6b6b', color: '#ff6b6b', cursor: 'pointer', borderRadius: '5px' }}>Remove</button>}
                  </div>
                </div>
                {/* Inputs using profileFormData and handleProfileFormChange */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}><Input label="First Name" name="firstName" value={profileFormData.firstName || ''} onChange={handleProfileFormChange} required /></div>
                    <div style={{ flex: 1 }}><Input label="Last Name" name="lastName" value={profileFormData.lastName || ''} onChange={handleProfileFormChange} required /></div>
                </div>
                <Input label="Preferred Name" name="preferredName" value={profileFormData.preferredName || ''} onChange={handleProfileFormChange} />
                <Input label="Email" type="email" name="email" value={profileFormData.email || ''} onChange={handleProfileFormChange} required />
                {/* ... other inputs ... */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <Button type="submit">Save</Button>
                  <Button variant="secondary" onClick={() => { setIsEditingProfile(false); }}>Cancel</Button>
                </div>
              </form>
            </div>
          </div>
        );
      }
      return (
        <div className="view-container">
          <Header title="Personal Information" style={{ maxWidth: '1000px', margin: '0 auto' }} onBack={() => setCurrentView('hub')} />
          <div className="view-content">
             {/* Read-Only View using loggedInUser directly is fine */}
             <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
                <div className="info-table">
                   <div className="info-label">Name:</div><div className="info-value">{loggedInUser.firstName} {loggedInUser.lastName}</div>
                   {/* ... fields ... */}
                </div>
                <div style={{ marginTop: '30px' }}>
                   <Button onClick={() => setIsEditingProfile(true)}>Edit Info</Button>
                </div>
             </div>
          </div>
        </div>
      );
  }

  // Sports View omitted for length, identical logic to Personal View
  return null;
}
export default MyProfile;