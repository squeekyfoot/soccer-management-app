import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useProfileLogic } from '../../../hooks/useProfileLogic'; 
import { LogOut, User, Activity, Edit2, Camera } from 'lucide-react'; 
import Header from '../../ui/Header';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import Avatar from '../../ui/Avatar';
import Input from '../../ui/Input'; 
import { COLORS, MOBILE_BREAKPOINT } from '../../../lib/constants';
import SportsInfoCard from '../../domain/users/SportsInfoCard';

function MyProfile() {
  const { loggedInUser, signOutUser } = useAuth();
  
  const {
      currentView, setCurrentView,
      isEditingProfile, setIsEditingProfile,
      profileFormData, handleProfileFormChange,
      previewUrl, handleFileChange, handleRemoveImage,
      handleProfileSubmit,
      isSexLocked, isBirthDateLocked
  } = useProfileLogic();

  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    subSection: { marginTop: '25px', background: '#252525', padding: '15px', borderRadius: '8px' },
    disabledInput: { backgroundColor: '#2a2a2a', color: '#888', cursor: 'not-allowed', border: '1px solid #444' }
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

  if (currentView === 'personal') {
      return (
        <div className="view-container">
          <Header title={isEditingProfile ? "Edit Personal Info" : "Personal Information"} style={{ maxWidth: '800px', margin: '0 auto' }} onBack={!isEditingProfile ? () => setCurrentView('hub') : undefined} />
          <div className="view-content">
             <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                {isEditingProfile ? (
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
                        
                        <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: isSexLocked ? '#888' : '#ccc', fontSize: '14px' }}>
                                    Sex {isSexLocked && "(Locked)"} <span style={{ color: COLORS.danger }}>*</span>
                                </label>
                                <select 
                                    name="sex" 
                                    value={profileFormData.sex || ""} 
                                    onChange={handleProfileFormChange} 
                                    disabled={isSexLocked}
                                    title={isSexLocked ? "Contact support to change" : ""}
                                    style={{ 
                                        width: '100%', 
                                        padding: '10px', 
                                        backgroundColor: '#333', 
                                        border: '1px solid #555', 
                                        borderRadius: '5px', 
                                        color: 'white',
                                        ...(isSexLocked ? styles.disabledInput : {})
                                    }}
                                    required
                                >
                                    <option value="" disabled>Please select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <Input 
                                    label={`Date of Birth ${isBirthDateLocked ? "(Locked)" : ""}`}
                                    type="date" 
                                    name="birthDate" 
                                    value={profileFormData.birthDate || ""} 
                                    onChange={handleProfileFormChange}
                                    disabled={isBirthDateLocked}
                                    style={isBirthDateLocked ? styles.disabledInput : {}}
                                    required
                                />
                            </div>
                        </div>

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
                          <div style={styles.infoRow}><span style={styles.infoLabel}>Sex:</span><span style={styles.infoValue}>{loggedInUser.personalInfo?.sex || "N/A"}</span></div>
                          <div style={styles.infoRow}><span style={styles.infoLabel}>Birth Date:</span><span style={styles.infoValue}>{loggedInUser.personalInfo?.birthDate || "N/A"}</span></div>
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
                              ) : (<span style={{ color: '#888', fontStyle: 'italic' }}>No emergency contact set.</span>)}
                          </div>
                      </Card>
                  </div>
                )}
             </div>
          </div>
        </div>
      );
  }

  if (currentView === 'sports') {
      return (
          <div className="view-container">
              <Header title="Sports Details" style={{ maxWidth: '800px', margin: '0 auto' }} onBack={() => setCurrentView('hub')} />
              <div className="view-content">
                  <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                      <SportsInfoCard />
                  </div>
              </div>
          </div>
      );
  }

  return null;
}

export default MyProfile;