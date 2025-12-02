import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useProfileLogic } from '../../../hooks/useProfileLogic'; 
import { LogOut, User, Activity, Edit2, Camera } from 'lucide-react'; 
import Header from '../../common/Header';
import Button from '../../common/Button';
import Card from '../../common/Card';
import Avatar from '../../common/Avatar';
import Modal from '../../common/Modal'; 
import Input from '../../common/Input'; 
import { COLORS, MOBILE_BREAKPOINT } from '../../../lib/constants';

function MyProfile() {
  const { loggedInUser, signOutUser } = useAuth();
  
  const {
      currentView, setCurrentView,
      isEditingProfile, setIsEditingProfile,
      profileFormData, handleProfileFormChange,
      previewUrl, handleFileChange, handleRemoveImage,
      handleProfileSubmit,
      soccerDetails, updateSoccerDetails
  } = useProfileLogic();

  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  const fileInputRef = useRef(null);
  
  // Local state for "Add/Edit Sport" modal
  const [showAddSportModal, setShowAddSportModal] = useState(false);
  const [newSportType, setNewSportType] = useState("Soccer");
  const [sportForm, setSportForm] = useState({
      favoredPosition: "", 
      jerseySize: "Large", 
      playerNumber: 0,
      currentRosters: "", 
      rosterJerseysOwned: "", 
      comments: ""
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pre-fill sport form when editing existing details
  useEffect(() => {
      if (showAddSportModal && soccerDetails) {
          setSportForm({
              favoredPosition: soccerDetails.favoredPosition || "",
              jerseySize: soccerDetails.jerseySize || "Large",
              playerNumber: soccerDetails.playerNumber || 0,
              currentRosters: Array.isArray(soccerDetails.currentRosters) ? soccerDetails.currentRosters.join(', ') : "",
              rosterJerseysOwned: Array.isArray(soccerDetails.rosterJerseysOwned) ? soccerDetails.rosterJerseysOwned.join(', ') : "",
              comments: soccerDetails.comments || ""
          });
      }
  }, [showAddSportModal, soccerDetails]);

  const handleSportChange = (e) => {
      const { name, value } = e.target;
      setSportForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSportSubmit = async (e) => {
      e.preventDefault();
      if (newSportType === 'Soccer') {
          const success = await updateSoccerDetails(sportForm);
          if (success) {
              setShowAddSportModal(false);
              // Reset form
              setSportForm({
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
    imageContainer: { width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#333', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '15px', border: `3px solid ${COLORS.primary}`, position: 'relative' },
    profileImage: { width: '100%', height: '100%', objectFit: 'cover' },
    placeholderText: { color: '#888', fontSize: '40px' },
    actionButtons: { display: 'flex', gap: '10px', marginTop: '10px' },
    sectionTitle: { borderBottom: '1px solid #444', paddingBottom: '10px', marginBottom: '20px', color: COLORS.primary, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    infoRow: { marginBottom: '15px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '5px' : '20px' },
    infoLabel: { fontWeight: 'bold', color: '#888', minWidth: '140px', fontSize: '14px' },
    infoValue: { color: 'white', flex: 1 },
    subSection: { marginTop: '25px', background: '#252525', padding: '15px', borderRadius: '8px' }
  };

  const MenuCard = ({ title, desc, icon: Icon, onClick }) => (
    <Card onClick={onClick} hoverable style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: 'center', justifyContent: isMobile ? 'flex-start' : 'center', textAlign: isMobile ? 'left' : 'center', minHeight: isMobile ? 'auto' : '200px', marginBottom: 0, padding: '25px', boxSizing: 'border-box' }}>
      <Icon size={isMobile ? 32 : 48} color={COLORS.primary} style={{ marginBottom: isMobile ? 0 : '20px', marginRight: isMobile ? '20px' : 0, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>{title}</div>
        <div style={{ fontSize: '13px', color: '#aaa' }}>{desc}</div>
      </div>
    </Card>
  );

  // --- VIEW: HUB ---
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
                 <MenuCard title="Personal Information" desc="Contact information, emergency contacts, and app preferences" icon={User} onClick={() => setCurrentView('personal')} />
                 <MenuCard title="Sports Details" desc="Manage your positions, numbers, and sport-specific profiles" icon={Activity} onClick={() => setCurrentView('sports')} />
              </div>
            </div>
          </div>
        </div>
      );
  }

  // --- VIEW: PERSONAL INFO ---
  if (currentView === 'personal') {
      return (
        <div className="view-container">
          <Header title={isEditingProfile ? "Edit Personal Info" : "Personal Information"} style={{ maxWidth: '800px', margin: '0 auto' }} onBack={!isEditingProfile ? () => setCurrentView('hub') : undefined} />
          <div className="view-content">
             <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                
                {isEditingProfile ? (
                  /* EDIT MODE */
                  <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
                    <div style={styles.profileHeader}>
                      <div style={styles.imageContainer}>
                        {previewUrl ? <img src={previewUrl} alt="Profile" style={styles.profileImage} /> : <span style={styles.placeholderText}>{profileFormData.firstName?.[0]}</span>}
                      </div>
                      <div style={styles.actionButtons}>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                        <Button type="button" onClick={() => fileInputRef.current.click()} variant="secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Camera size={16} /> Change Photo
                        </Button>
                        {previewUrl && <Button type="button" onClick={handleRemoveImage} variant="danger">Remove</Button>}
                      </div>
                    </div>

                    <Card style={{ padding: '25px' }}>
                        <h4 style={styles.sectionTitle}>Basic Info</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <Input label="First Name" name="firstName" value={profileFormData.firstName || ''} onChange={handleProfileFormChange} required />
                            <Input label="Last Name" name="lastName" value={profileFormData.lastName || ''} onChange={handleProfileFormChange} required />
                        </div>
                        <Input label="Preferred Name" name="preferredName" value={profileFormData.preferredName || ''} onChange={handleProfileFormChange} placeholder="e.g. Johnny" />
                        <Input label="Email" type="email" name="email" value={profileFormData.email || ''} onChange={handleProfileFormChange} required />
                        <Input label="Phone Number" type="tel" name="phone" value={profileFormData.phone || ''} onChange={handleProfileFormChange} />
                        
                        <div style={{ marginTop: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Notification Preference</label>
                            <select name="notificationPreference" value={profileFormData.notificationPreference || 'email'} onChange={handleProfileFormChange} style={{ width: '100%', padding: '10px', backgroundColor: '#333', border: '1px solid #555', borderRadius: '5px', color: 'white' }}>
                                <option value="email">Email</option>
                                <option value="sms">SMS</option>
                                <option value="none">None</option>
                            </select>
                        </div>
                    </Card>

                    <Card style={{ padding: '25px' }}>
                        <h4 style={styles.sectionTitle}>Emergency Contact</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <Input label="Contact First Name" name="emergencyContactFirstName" value={profileFormData.emergencyContactFirstName || ''} onChange={handleProfileFormChange} />
                            <Input label="Contact Last Name" name="emergencyContactLastName" value={profileFormData.emergencyContactLastName || ''} onChange={handleProfileFormChange} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <Input label="Relationship" name="emergencyContactRelationship" value={profileFormData.emergencyContactRelationship || ''} onChange={handleProfileFormChange} />
                            <Input label="Contact Phone" type="tel" name="emergencyContactPhone" value={profileFormData.emergencyContactPhone || ''} onChange={handleProfileFormChange} />
                        </div>
                    </Card>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <Button type="submit" style={{ flex: 1 }}>Save Changes</Button>
                      <Button type="button" variant="secondary" onClick={() => { setIsEditingProfile(false); }} style={{ flex: 1 }}>Cancel</Button>
                    </div>
                  </form>
                ) : (
                  /* READ ONLY MODE */
                  <div>
                      <Card style={{ padding: '30px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                              <h3 style={{ margin: 0, color: COLORS.primary }}>Contact Information</h3>
                              <Button onClick={() => setIsEditingProfile(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <Edit2 size={16} /> Edit
                              </Button>
                          </div>

                          <div style={styles.infoRow}><span style={styles.infoLabel}>Full Name:</span><span style={styles.infoValue}>{loggedInUser.firstName} {loggedInUser.lastName}</span></div>
                          <div style={styles.infoRow}><span style={styles.infoLabel}>Preferred Name:</span><span style={styles.infoValue}>{loggedInUser.preferredName || "N/A"}</span></div>
                          <div style={styles.infoRow}><span style={styles.infoLabel}>Email:</span><span style={styles.infoValue}>{loggedInUser.email}</span></div>
                          <div style={styles.infoRow}><span style={styles.infoLabel}>Phone:</span><span style={styles.infoValue}>{loggedInUser.phone || "N/A"}</span></div>
                          <div style={styles.infoRow}><span style={styles.infoLabel}>Notifications:</span><span style={styles.infoValue}>{loggedInUser.notificationPreference || "Email"}</span></div>

                          <div style={styles.subSection}>
                              <h4 style={{ margin: '0 0 15px 0', color: '#ccc' }}>Emergency Contact</h4>
                              {loggedInUser.emergencyContact ? (
                                  <>
                                    <div style={styles.infoRow}><span style={styles.infoLabel}>Name:</span><span style={styles.infoValue}>{loggedInUser.emergencyContact.firstName} {loggedInUser.emergencyContact.lastName}</span></div>
                                    <div style={styles.infoRow}><span style={styles.infoLabel}>Relationship:</span><span style={styles.infoValue}>{loggedInUser.emergencyContact.relationship || "N/A"}</span></div>
                                    <div style={styles.infoRow}><span style={styles.infoLabel}>Phone:</span><span style={styles.infoValue}>{loggedInUser.emergencyContact.phone || "N/A"}</span></div>
                                  </>
                              ) : (
                                  <span style={{ color: '#888', fontStyle: 'italic' }}>No emergency contact set.</span>
                              )}
                          </div>
                      </Card>
                  </div>
                )}
             </div>
          </div>
        </div>
      );
  }

  // --- VIEW: SPORTS DETAILS ---
  if (currentView === 'sports') {
      return (
          <div className="view-container">
              <Header title="Sports Details" style={{ maxWidth: '800px', margin: '0 auto' }} onBack={() => setCurrentView('hub')} />
              <div className="view-content">
                  <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                      
                      {!soccerDetails ? (
                          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                              <p>You haven't set up your sports profile yet.</p>
                              <Button onClick={() => setShowAddSportModal(true)}>Set Up Soccer Profile</Button>
                          </div>
                      ) : (
                          <Card style={{ padding: '30px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #444', paddingBottom: '15px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <Activity size={24} color={COLORS.primary} />
                                      <h3 style={{ margin: 0 }}>Soccer</h3>
                                  </div>
                                  <Button variant="secondary" onClick={() => setShowAddSportModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <Edit2 size={16} /> Edit
                                  </Button>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>
                                  <div>
                                      <div style={styles.infoRow}><span style={styles.infoLabel}>Position:</span><span style={styles.infoValue}>{soccerDetails.favoredPosition || "Any"}</span></div>
                                      <div style={styles.infoRow}><span style={styles.infoLabel}>Jersey Size:</span><span style={styles.infoValue}>{soccerDetails.jerseySize || "Large"}</span></div>
                                      <div style={styles.infoRow}><span style={styles.infoLabel}>Preferred #:</span><span style={styles.infoValue}>{soccerDetails.playerNumber || "N/A"}</span></div>
                                  </div>
                                  <div>
                                      <div style={{ marginBottom: '15px' }}>
                                          <div style={{...styles.infoLabel, marginBottom: '5px'}}>Current Rosters:</div>
                                          <div style={{ color: '#ccc', fontSize: '14px' }}>
                                              {(Array.isArray(soccerDetails.currentRosters) && soccerDetails.currentRosters.length > 0 && soccerDetails.currentRosters[0] !== "") 
                                                  ? soccerDetails.currentRosters.join(', ') 
                                                  : "None"}
                                          </div>
                                      </div>
                                      <div>
                                          <div style={{...styles.infoLabel, marginBottom: '5px'}}>Jerseys Owned:</div>
                                          <div style={{ color: '#ccc', fontSize: '14px' }}>
                                              {(Array.isArray(soccerDetails.rosterJerseysOwned) && soccerDetails.rosterJerseysOwned.length > 0 && soccerDetails.rosterJerseysOwned[0] !== "") 
                                                  ? soccerDetails.rosterJerseysOwned.join(', ') 
                                                  : "None"}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                              
                              {soccerDetails.comments && (
                                  <div style={styles.subSection}>
                                      <h4 style={{ margin: '0 0 10px 0', color: '#ccc', fontSize: '14px' }}>Notes / Comments</h4>
                                      <p style={{ margin: 0, color: '#eee', fontSize: '14px' }}>{soccerDetails.comments}</p>
                                  </div>
                              )}
                          </Card>
                      )}
                  </div>
              </div>

              {/* MODAL: ADD/EDIT SPORT */}
              {showAddSportModal && (
                  <Modal title="Manage Sports Profile" onClose={() => setShowAddSportModal(false)} actions={
                      <Button onClick={handleSportSubmit}>Save Profile</Button>
                  }>
                      <form onSubmit={handleSportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
                          <div>
                              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '14px' }}>Sport</label>
                              <select 
                                  value={newSportType} 
                                  onChange={(e) => setNewSportType(e.target.value)} 
                                  style={{ width: '100%', padding: '10px', backgroundColor: '#333', border: '1px solid #555', borderRadius: '5px', color: 'white' }}
                              >
                                  <option value="Soccer">Soccer</option>
                                  <option value="Basketball" disabled>Basketball (Coming Soon)</option>
                              </select>
                          </div>

                          <div style={{ display: 'flex', gap: '10px' }}>
                              <div style={{ flex: 1 }}>
                                  <Input label="Favored Position" name="favoredPosition" value={sportForm.favoredPosition} onChange={handleSportChange} placeholder="e.g. Striker" />
                              </div>
                              <div style={{ flex: 1 }}>
                                  <Input label="Player Number" type="number" name="playerNumber" value={sportForm.playerNumber} onChange={handleSportChange} />
                              </div>
                          </div>

                          <div style={{ display: 'flex', gap: '10px' }}>
                              <div style={{ flex: 1 }}>
                                  <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Jersey Size</label>
                                  <select name="jerseySize" value={sportForm.jerseySize} onChange={handleSportChange} style={{ width: '100%', padding: '10px', backgroundColor: '#333', border: '1px solid #555', borderRadius: '5px', color: 'white' }}>
                                      <option value="Small">Small</option>
                                      <option value="Medium">Medium</option>
                                      <option value="Large">Large</option>
                                      <option value="XL">XL</option>
                                      <option value="XXL">XXL</option>
                                  </select>
                              </div>
                          </div>

                          <Input label="Current Teams (comma separated)" name="currentRosters" value={sportForm.currentRosters} onChange={handleSportChange} placeholder="Team A, Team B" />
                          
                          <Input label="Jerseys Owned (comma separated)" name="rosterJerseysOwned" value={sportForm.rosterJerseysOwned} onChange={handleSportChange} placeholder="Red Home, Blue Away" />

                          <div>
                              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Additional Comments</label>
                              <textarea 
                                  name="comments" 
                                  value={sportForm.comments} 
                                  onChange={handleSportChange} 
                                  style={{ width: '100%', padding: '10px', backgroundColor: '#333', border: '1px solid #555', borderRadius: '5px', color: 'white', minHeight: '80px', fontFamily: 'inherit' }} 
                                  placeholder="Allergies, availability notes, etc."
                              />
                          </div>
                      </form>
                  </Modal>
              )}
          </div>
      );
  }

  return null;
}

export default MyProfile;