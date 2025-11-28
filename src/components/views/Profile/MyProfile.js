import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import SportsInfo from '../../SportsInfo';
import { LogOut, User, Activity, Plus } from 'lucide-react'; 
import Header from '../../common/Header';
import Button from '../../common/Button';
import Card from '../../common/Card';
import Avatar from '../../common/Avatar';
import Modal from '../../common/Modal'; 
import Input from '../../common/Input'; 
import { COLORS, MOBILE_BREAKPOINT } from '../../../constants';

function MyProfile() {
  const { loggedInUser, updateProfile, signOutUser, updateSoccerDetails } = useAuth();

  const [currentView, setCurrentView] = useState('hub'); 
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({});
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(loggedInUser?.photoURL || "");
  const [isRemovingImage, setIsRemovingImage] = useState(false);

  const [showAddSportModal, setShowAddSportModal] = useState(false);
  const [newSportType, setNewSportType] = useState("Soccer");
  const [newSportData, setNewSportData] = useState({
      favoredPosition: "",
      jerseySize: "Large",
      playerNumber: 0,
      currentRosters: "",
      rosterJerseysOwned: "",
      comments: ""
  });
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
     if (loggedInUser) {
         setProfileFormData({
             ...loggedInUser,
             emergencyContactFirstName: loggedInUser.emergencyContact?.firstName || "",
             emergencyContactLastName: loggedInUser.emergencyContact?.lastName || "",
             emergencyContactPhone: loggedInUser.emergencyContact?.phone || "",
             emergencyContactRelationship: loggedInUser.emergencyContact?.relationship || ""
         });
         setPreviewUrl(loggedInUser.photoURL || "");
     }
  }, [loggedInUser]);

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
    setProfileFormData(prev => ({ ...prev, [name]: value }));
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

  const styles = {
    profileHeader: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' },
    imageContainer: {
      width: '150px', height: '150px', borderRadius: '50%', overflow: 'hidden',
      backgroundColor: '#444', display: 'flex', justifyContent: 'center', alignItems: 'center',
      marginBottom: '15px', border: '3px solid #61dafb'
    },
    profileImage: { width: '100%', height: '100%', objectFit: 'cover' },
    placeholderText: { color: '#888', fontSize: '40px' },
    actionButtons: { display: 'flex', gap: '10px', marginTop: '10px' }
  };

  const MenuCard = ({ title, desc, icon: Icon, onClick }) => (
    <Card 
        onClick={onClick} hoverable 
        style={{ 
            display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: 'center', 
            justifyContent: isMobile ? 'flex-start' : 'center', textAlign: isMobile ? 'left' : 'center',
            minHeight: isMobile ? 'auto' : '220px', marginBottom: 0, padding: '20px', boxSizing: 'border-box'
        }}
    >
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
                <button 
                  onClick={handleSignOut} 
                  style={{ 
                    background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    width: '32px', height: '32px' 
                  }}
                >
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

                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}><Input label="First Name" name="firstName" value={profileFormData.firstName} onChange={handleProfileFormChange} required /></div>
                    <div style={{ flex: 1 }}><Input label="Last Name" name="lastName" value={profileFormData.lastName} onChange={handleProfileFormChange} required /></div>
                </div>
                <Input label="Preferred Name" name="preferredName" value={profileFormData.preferredName} onChange={handleProfileFormChange} />
                <Input label="Email" type="email" name="email" value={profileFormData.email} onChange={handleProfileFormChange} required />
                <Input label="Phone" type="tel" name="phone" value={profileFormData.phone} onChange={handleProfileFormChange} />
                
                <div style={{ marginBottom: '15px', textAlign: 'left' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '14px' }}>System Notification Preference</label>
                  <select name="notificationPreference" value={profileFormData.notificationPreference} onChange={handleProfileFormChange} style={{ width: '100%', padding: '10px', backgroundColor: '#3a3f4a', border: `1px solid ${COLORS.border}`, borderRadius: '4px', color: 'white', fontSize: '16px' }}>
                    <option value="Email">Email</option>
                    <option value="Text Message">Text Message</option>
                  </select>
                </div>

                <h4 style={{ margin: '15px 0 5px 0', color: COLORS.primary }}>Emergency Contact</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}><Input label="First Name" name="emergencyContactFirstName" value={profileFormData.emergencyContactFirstName} onChange={handleProfileFormChange} /></div>
                    <div style={{ flex: 1 }}><Input label="Last Name" name="emergencyContactLastName" value={profileFormData.emergencyContactLastName} onChange={handleProfileFormChange} /></div>
                </div>
                <Input label="Phone Number" type="tel" name="emergencyContactPhone" value={profileFormData.emergencyContactPhone} onChange={handleProfileFormChange} />
                <Input label="Relationship" name="emergencyContactRelationship" value={profileFormData.emergencyContactRelationship} onChange={handleProfileFormChange} />

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <Button type="submit">Save</Button>
                  <Button variant="secondary" onClick={() => { setIsEditingProfile(false); setPreviewUrl(loggedInUser.photoURL || ""); setSelectedFile(null); setIsRemovingImage(false); }}>Cancel</Button>
                </div>
              </form>
            </div>
          </div>
        );
      }

      return (
        <div className="view-container">
          <Header 
            title="Personal Information" 
            style={{ maxWidth: '1000px', margin: '0 auto' }} 
            onBack={() => setCurrentView('hub')}
          />
          <div className="view-content">
            <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
              <div className="info-table">
                <div className="info-label">Name:</div><div className="info-value">{loggedInUser.firstName} {loggedInUser.lastName}</div>
                <div className="info-label">Preferred Name:</div><div className="info-value">{loggedInUser.preferredName || "N/A"}</div>
                <div className="info-label">Email:</div><div className="info-value">{loggedInUser.email}</div>
                <div className="info-label">Phone:</div><div className="info-value">{loggedInUser.phone}</div>
                <div className="info-label">Notification Pref:</div><div className="info-value">{loggedInUser.notificationPreference}</div>
                
                <div className="info-label" style={{ marginTop: '10px', fontWeight: 'bold', color: COLORS.primary }}>Emergency Contact:</div><div className="info-value"></div>
                <div className="info-label">Name:</div><div className="info-value">{loggedInUser.emergencyContact?.firstName} {loggedInUser.emergencyContact?.lastName}</div>
                <div className="info-label">Phone:</div><div className="info-value">{loggedInUser.emergencyContact?.phone}</div>
                <div className="info-label">Relationship:</div><div className="info-value">{loggedInUser.emergencyContact?.relationship}</div>
              </div>
              <div style={{ marginTop: '30px' }}>
                <Button onClick={() => { setProfileFormData(loggedInUser); setPreviewUrl(loggedInUser.photoURL || ""); setIsEditingProfile(true); }}>Edit Info</Button>
              </div>
            </div>
          </div>
        </div>
      );
  }

  if (currentView === 'sports') {
      return (
        <div className="view-container">
          <Header 
            title="Sports Details" 
            style={{ maxWidth: '1000px', margin: '0 auto' }} 
            onBack={() => setCurrentView('hub')}
            actions={
                <div style={{ display: 'flex', gap: '10px' }}>
                     <Button 
                        onClick={() => setShowAddSportModal(true)} 
                        style={{ 
                          padding: 0, 
                          width: '32px', height: '32px', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          borderRadius: '50%' 
                        }}
                     >
                        <Plus size={18} />
                     </Button>
                </div>
            } 
          />
          <div className="view-content">
             <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
                <SportsInfo />
             </div>
          </div>

          {showAddSportModal && (
              <Modal 
                  title="Add Sport" 
                  onClose={() => setShowAddSportModal(false)}
                  actions={<Button onClick={handleAddSportSubmit}>Save Sport</Button>}
              >
                  <form onSubmit={handleAddSportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                      
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '14px' }}>Select Sport</label>
                        <select
                          value={newSportType}
                          onChange={(e) => setNewSportType(e.target.value)}
                          style={{ 
                            width: '100%', padding: '10px', backgroundColor: '#3a3f4a', 
                            border: `1px solid ${COLORS.border}`, borderRadius: '4px', color: 'white', fontSize: '16px' 
                          }}
                        >
                          <option value="Soccer">Soccer</option>
                          <option value="Basketball" disabled>Basketball (Coming Soon)</option>
                          <option value="Baseball" disabled>Baseball (Coming Soon)</option>
                        </select>
                      </div>

                      {newSportType === 'Soccer' && (
                        <>
                           <Input label="Favored Position" name="favoredPosition" value={newSportData.favoredPosition} onChange={handleSportChange} />
                           
                           <div>
                             <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '14px' }}>Jersey Size</label>
                             <select 
                                name="jerseySize" 
                                value={newSportData.jerseySize} 
                                onChange={handleSportChange} 
                                style={{ width: '100%', padding: '10px', backgroundColor: '#3a3f4a', border: `1px solid ${COLORS.border}`, borderRadius: '4px', color: 'white', fontSize: '16px' }}
                             >
                               <option value="Small">Small</option>
                               <option value="Medium">Medium</option>
                               <option value="Large">Large</option>
                               <option value="X-Large">X-Large</option>
                             </select>
                           </div>

                           <Input label="Player Number" type="number" name="playerNumber" value={newSportData.playerNumber} onChange={handleSportChange} />
                           <Input label="Current Roster(s) (comma-separated)" name="currentRosters" placeholder="e.g. The Gizmos, Team B" value={newSportData.currentRosters} onChange={handleSportChange} />
                           <Input label="Roster Jerseys Owned (comma-separated)" name="rosterJerseysOwned" placeholder="e.g. The Gizmos (Red)" value={newSportData.rosterJerseysOwned} onChange={handleSportChange} />
                           
                           <div>
                             <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '14px' }}>Comments</label>
                             <textarea 
                                name="comments" 
                                value={newSportData.comments} 
                                onChange={handleSportChange} 
                                style={{ width: '100%', padding: '10px', backgroundColor: '#3a3f4a', border: `1px solid ${COLORS.border}`, borderRadius: '4px', color: 'white', fontSize: '16px', minHeight: '80px' }} 
                             />
                           </div>
                        </>
                      )}
                  </form>
              </Modal>
          )}
        </div>
      );
  }
  return null;
}
export default MyProfile;