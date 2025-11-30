import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import Header from '../../common/Header';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Input from '../../common/Input';
import Modal from '../../common/Modal';
import { COLORS } from '../../../lib/constants';
import { LogOut, User, Activity, ChevronRight, Plus, Camera, Trash2 } from 'lucide-react-native';

export default function ProfileScreen() {
  const { loggedInUser, soccerDetails, signOutUser, updateProfile, updateSoccerDetails } = useAuth();
  
  // Navigation State
  const [currentView, setCurrentView] = useState('hub'); // 'hub', 'personal', 'sports'
  
  // Edit Mode States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingSoccer, setIsEditingSoccer] = useState(false);
  
  // Data States
  const [profileFormData, setProfileFormData] = useState({});
  const [soccerFormData, setSoccerFormData] = useState({});
  const [showAddSportModal, setShowAddSportModal] = useState(false);
  
  // Add Sport State
  const [newSportType, setNewSportType] = useState("Soccer");
  const [newSportData, setNewSportData] = useState({
      favoredPosition: "",
      jerseySize: "Large",
      playerNumber: "0",
      currentRosters: "",
      rosterJerseysOwned: "",
      comments: ""
  });

  // Init Data
  useEffect(() => {
    if (loggedInUser) {
        setProfileFormData({
            ...loggedInUser,
            emergencyContactFirstName: loggedInUser.emergencyContact?.firstName || "",
            emergencyContactLastName: loggedInUser.emergencyContact?.lastName || "",
            emergencyContactPhone: loggedInUser.emergencyContact?.phone || "",
            emergencyContactRelationship: loggedInUser.emergencyContact?.relationship || ""
        });
    }
    if (soccerDetails) {
        setSoccerFormData({
            ...soccerDetails,
            currentRosters: soccerDetails.currentRosters?.join(', ') || "",
            rosterJerseysOwned: soccerDetails.rosterJerseysOwned?.join(', ') || "",
            playerNumber: String(soccerDetails.playerNumber || 0)
        });
    }
  }, [loggedInUser, soccerDetails]);

  // --- Handlers ---

  const handleProfileSubmit = async () => {
    const success = await updateProfile(profileFormData);
    if (success) {
      setIsEditingProfile(false);
      Alert.alert("Success", "Personal info updated.");
    }
  };

  const handleSoccerSubmit = async () => {
    const success = await updateSoccerDetails(soccerFormData);
    if (success) {
      setIsEditingSoccer(false);
      Alert.alert("Success", "Sports details updated.");
    }
  };

  const handleAddSportSubmit = async () => {
      if (newSportType === 'Soccer') {
          const success = await updateSoccerDetails(newSportData);
          if (success) {
              setShowAddSportModal(false);
              setNewSportData({
                  favoredPosition: "", jerseySize: "Large", playerNumber: "0",
                  currentRosters: "", rosterJerseysOwned: "", comments: ""
              });
              Alert.alert("Success", "Sport added successfully.");
          }
      } else {
          Alert.alert("Notice", "Only Soccer is supported at this time.");
      }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOutUser }
    ]);
  };

  const handleImageAction = () => {
      Alert.alert("Profile Picture", "Choose an option", [
          { text: "Cancel", style: "cancel" },
          { text: "Remove Photo", style: "destructive", onPress: () => updateProfile(loggedInUser, null, true) },
          { text: "Upload New", onPress: () => Alert.alert("Coming Soon", "Image picking requires a native library installation.") }
      ]);
  };

  // --- Sub-Components ---

  const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value || "Not set"}</Text>
    </View>
  );

  const MenuCard = ({ title, desc, icon: Icon, onPress }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Card style={styles.menuCard}>
            <View style={styles.menuIconContainer}>
                <Icon size={28} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.menuTitle}>{title}</Text>
                <Text style={styles.menuDesc}>{desc}</Text>
            </View>
            <ChevronRight size={20} color="#666" />
        </Card>
    </TouchableOpacity>
  );

  // --- RENDER VIEWS ---

  // 1. HUB VIEW
  if (currentView === 'hub') {
      return (
        <View style={styles.container}>
          <Header 
            title="Profile" 
            actions={
              <TouchableOpacity onPress={handleSignOut} style={{ padding: 5 }}>
                <LogOut color={COLORS.danger} size={24} />
              </TouchableOpacity>
            }
          />
          <ScrollView contentContainerStyle={styles.content}>
             <View style={styles.profileHeader}>
                 <TouchableOpacity onPress={handleImageAction}>
                    <View style={styles.avatarContainer}>
                        {loggedInUser?.photoURL ? (
                            <Image source={{ uri: loggedInUser.photoURL }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarText}>
                                {loggedInUser?.firstName?.charAt(0)}{loggedInUser?.lastName?.charAt(0)}
                            </Text>
                        )}
                        <View style={styles.editBadge}>
                            <Camera size={12} color="black" />
                        </View>
                    </View>
                 </TouchableOpacity>
                 <Text style={styles.headerName}>{loggedInUser?.playerName}</Text>
                 <Text style={styles.headerEmail}>{loggedInUser?.email}</Text>
             </View>

             <View style={styles.menuContainer}>
                 <MenuCard 
                    title="Personal Information" 
                    desc="Contact information and preferences" 
                    icon={User} 
                    onPress={() => setCurrentView('personal')} 
                 />
                 <MenuCard 
                    title="Sports Details" 
                    desc="Sport-specific profile information" 
                    icon={Activity} 
                    onPress={() => setCurrentView('sports')} 
                 />
             </View>
          </ScrollView>
        </View>
      );
  }

  // 2. PERSONAL INFO VIEW
  if (currentView === 'personal') {
      return (
        <View style={styles.container}>
            <Header title={isEditingProfile ? "Edit Info" : "Personal Info"} onBack={() => setCurrentView('hub')} />
            <ScrollView contentContainerStyle={styles.content}>
                {isEditingProfile ? (
                    <View style={styles.formContainer}>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Input label="First Name" value={profileFormData.firstName} onChangeText={t => setProfileFormData({...profileFormData, firstName: t})} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Input label="Last Name" value={profileFormData.lastName} onChangeText={t => setProfileFormData({...profileFormData, lastName: t})} />
                            </View>
                        </View>
                        <Input label="Preferred Name" value={profileFormData.preferredName} onChangeText={t => setProfileFormData({...profileFormData, preferredName: t})} />
                        <Input label="Phone" value={profileFormData.phone} onChangeText={t => setProfileFormData({...profileFormData, phone: t})} keyboardType="phone-pad" />
                        
                        <Text style={styles.sectionLabel}>Emergency Contact</Text>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Input label="EC First Name" value={profileFormData.emergencyContactFirstName} onChangeText={t => setProfileFormData({...profileFormData, emergencyContactFirstName: t})} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Input label="EC Last Name" value={profileFormData.emergencyContactLastName} onChangeText={t => setProfileFormData({...profileFormData, emergencyContactLastName: t})} />
                            </View>
                        </View>
                        <Input label="EC Phone" value={profileFormData.emergencyContactPhone} onChangeText={t => setProfileFormData({...profileFormData, emergencyContactPhone: t})} keyboardType="phone-pad" />
                        <Input label="Relationship" value={profileFormData.emergencyContactRelationship} onChangeText={t => setProfileFormData({...profileFormData, emergencyContactRelationship: t})} />

                        <View style={styles.btnRow}>
                            <Button onPress={handleProfileSubmit} style={{ flex: 1 }}>Save</Button>
                            <Button variant="secondary" onPress={() => setIsEditingProfile(false)} style={{ flex: 1 }}>Cancel</Button>
                        </View>
                    </View>
                ) : (
                    <View>
                        <Card style={{ padding: 20 }}>
                            <InfoRow label="Name" value={`${loggedInUser.firstName} ${loggedInUser.lastName}`} />
                            <InfoRow label="Preferred Name" value={loggedInUser.preferredName} />
                            <InfoRow label="Email" value={loggedInUser.email} />
                            <InfoRow label="Phone" value={loggedInUser.phone} />
                            <InfoRow label="Notification Pref" value={loggedInUser.notificationPreference} />
                            
                            <View style={styles.divider} />
                            <Text style={styles.subHeader}>Emergency Contact</Text>
                            <InfoRow label="Name" value={`${loggedInUser.emergencyContact?.firstName || ''} ${loggedInUser.emergencyContact?.lastName || ''}`} />
                            <InfoRow label="Phone" value={loggedInUser.emergencyContact?.phone} />
                            <InfoRow label="Relationship" value={loggedInUser.emergencyContact?.relationship} />
                        </Card>
                        <Button style={{ marginTop: 20 }} onPress={() => setIsEditingProfile(true)}>Edit Info</Button>
                    </View>
                )}
            </ScrollView>
        </View>
      );
  }

  // 3. SPORTS DETAILS VIEW
  if (currentView === 'sports') {
      return (
        <View style={styles.container}>
            <Header 
                title="Sports Details" 
                onBack={() => setCurrentView('hub')} 
                actions={
                    <TouchableOpacity onPress={() => setShowAddSportModal(true)}>
                        <Plus color={COLORS.primary} size={24} />
                    </TouchableOpacity>
                }
            />
            <ScrollView contentContainerStyle={styles.content}>
                {isEditingSoccer ? (
                    <View style={styles.formContainer}>
                        <Input label="Favored Position" value={soccerFormData.favoredPosition} onChangeText={t => setSoccerFormData({...soccerFormData, favoredPosition: t})} />
                        {/* Simple Text Input for Jersey Size for now, could be Picker */}
                        <Input label="Jersey Size" value={soccerFormData.jerseySize} onChangeText={t => setSoccerFormData({...soccerFormData, jerseySize: t})} />
                        <Input label="Player Number" value={soccerFormData.playerNumber} onChangeText={t => setSoccerFormData({...soccerFormData, playerNumber: t})} keyboardType="numeric" />
                        <Input label="Current Rosters" value={soccerFormData.currentRosters} onChangeText={t => setSoccerFormData({...soccerFormData, currentRosters: t})} placeholder="Comma separated" />
                        <Input label="Jerseys Owned" value={soccerFormData.rosterJerseysOwned} onChangeText={t => setSoccerFormData({...soccerFormData, rosterJerseysOwned: t})} placeholder="Comma separated" />
                        <Input label="Comments" value={soccerFormData.comments} onChangeText={t => setSoccerFormData({...soccerFormData, comments: t})} multiline />

                        <View style={styles.btnRow}>
                            <Button onPress={handleSoccerSubmit} style={{ flex: 1 }}>Save</Button>
                            <Button variant="secondary" onPress={() => setIsEditingSoccer(false)} style={{ flex: 1 }}>Cancel</Button>
                        </View>
                    </View>
                ) : (
                    soccerDetails ? (
                        <View>
                            <Card style={{ padding: 20 }}>
                                <Text style={styles.cardTitle}>Soccer</Text>
                                <InfoRow label="Position" value={soccerDetails.favoredPosition} />
                                <InfoRow label="Jersey Size" value={soccerDetails.jerseySize} />
                                <InfoRow label="Player #" value={soccerDetails.playerNumber} />
                                <InfoRow label="Rosters" value={soccerDetails.currentRosters?.join(', ')} />
                                <InfoRow label="Jerseys Owned" value={soccerDetails.rosterJerseysOwned?.join(', ')} />
                                <View style={styles.divider} />
                                <Text style={styles.infoLabel}>Comments:</Text>
                                <Text style={styles.infoValue}>{soccerDetails.comments || "None"}</Text>
                            </Card>
                            <Button style={{ marginTop: 20 }} onPress={() => setIsEditingSoccer(true)}>Edit Details</Button>
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>You haven't added any sports details yet.</Text>
                            <Button style={{ marginTop: 15 }} onPress={() => setShowAddSportModal(true)}>Add Sport</Button>
                        </View>
                    )
                )}
            </ScrollView>

            {/* Add Sport Modal */}
            <Modal 
                visible={showAddSportModal} 
                title="Add Sport" 
                onClose={() => setShowAddSportModal(false)}
                actions={<Button onPress={handleAddSportSubmit}>Save Sport</Button>}
            >
                <View>
                    <Text style={styles.modalLabel}>Select Sport: Soccer (Default)</Text>
                    <Input label="Favored Position" value={newSportData.favoredPosition} onChangeText={t => setNewSportData({...newSportData, favoredPosition: t})} />
                    <Input label="Jersey Size" value={newSportData.jerseySize} onChangeText={t => setNewSportData({...newSportData, jerseySize: t})} />
                    <Input label="Player Number" value={newSportData.playerNumber} onChangeText={t => setNewSportData({...newSportData, playerNumber: t})} keyboardType="numeric" />
                    <Input label="Comments" value={newSportData.comments} onChangeText={t => setNewSportData({...newSportData, comments: t})} multiline />
                </View>
            </Modal>
        </View>
      );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 20 },
  
  // Hub Styles
  profileHeader: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: COLORS.primary },
  avatarText: { 
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#333', 
    textAlign: 'center', lineHeight: 100, fontSize: 36, color: 'white', fontWeight: 'bold',
    borderWidth: 3, borderColor: COLORS.primary, overflow: 'hidden'
  },
  editBadge: {
      position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary,
      width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
      borderWidth: 2, borderColor: '#121212'
  },
  headerName: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 5 },
  headerEmail: { fontSize: 14, color: '#888' },
  
  menuContainer: { gap: 15 },
  menuCard: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  menuIconContainer: { marginRight: 15 },
  menuTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  menuDesc: { fontSize: 12, color: '#aaa' },

  // Info/Edit Styles
  infoRow: { flexDirection: 'row', marginBottom: 12 },
  infoLabel: { color: '#888', width: 110, fontWeight: '600', fontSize: 14 },
  infoValue: { color: 'white', flex: 1, fontSize: 14 },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 15 },
  subHeader: { color: COLORS.primary, fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  cardTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  
  formContainer: { gap: 5 },
  row: { flexDirection: 'row' },
  sectionLabel: { color: COLORS.primary, marginTop: 15, marginBottom: 5, fontWeight: 'bold' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 10 },

  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#888', fontStyle: 'italic' },
  
  modalLabel: { color: '#ccc', marginBottom: 10 }
});