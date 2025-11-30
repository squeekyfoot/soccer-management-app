import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import Header from '../../common/Header';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Input from '../../common/Input';
import Avatar from '../../common/Avatar';
import SportsInfo from './SportsInfo';
import { COLORS } from '../../../lib/constants';
import { LogOut, User, Activity, ChevronRight, Camera } from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';

export default function MyProfile() {
  const { loggedInUser, signOutUser, updateProfile } = useAuth();
  
  const [currentView, setCurrentView] = useState('hub'); 
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({});

  useEffect(() => {
    if (loggedInUser) {
        setProfileFormData({
            ...loggedInUser,
            // Ensure default if missing
            notificationPreference: loggedInUser.notificationPreference || "Email", 
            emergencyContactFirstName: loggedInUser.emergencyContact?.firstName || "",
            emergencyContactLastName: loggedInUser.emergencyContact?.lastName || "",
            emergencyContactPhone: loggedInUser.emergencyContact?.phone || "",
            emergencyContactRelationship: loggedInUser.emergencyContact?.relationship || ""
        });
    }
  }, [loggedInUser]);

  const handleProfileSubmit = async () => {
    // 1. Validation Logic (Parity with Web)
    if (!profileFormData.firstName?.trim() || !profileFormData.lastName?.trim() || !profileFormData.email?.trim()) {
        Alert.alert("Error", "First Name, Last Name, and Email are required fields.");
        return;
    }

    const success = await updateProfile(profileFormData);
    if (success) {
      setIsEditingProfile(false);
      Alert.alert("Success", "Personal info updated.");
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
          { 
            text: "Remove Photo", 
            style: "destructive", 
            onPress: () => updateProfile(profileFormData, null, true) 
          },
          { 
            text: "Upload New", 
            onPress: async () => {
                const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 0.8 });
                if (!result.didCancel && result.assets && result.assets.length > 0) {
                    const asset = result.assets[0];
                    const file = {
                        uri: asset.uri,
                        name: asset.fileName || `profile_${Date.now()}.jpg`,
                        type: asset.type || 'image/jpeg',
                    };
                    const success = await updateProfile(profileFormData, file, false);
                    if (success) Alert.alert("Success", "Profile picture updated!");
                }
            } 
          }
      ]);
  };

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

  const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value || "Not set"}</Text>
    </View>
  );

  // --- VIEW ROUTING ---

  if (currentView === 'sports') {
      return <SportsInfo onBack={() => setCurrentView('hub')} />;
  }

  if (currentView === 'personal') {
      return (
        <View style={styles.container}>
            <Header title={isEditingProfile ? "Edit Info" : "Personal Info"} onBack={() => setCurrentView('hub')} />
            <ScrollView contentContainerStyle={styles.content}>
                {isEditingProfile ? (
                    <View style={styles.formContainer}>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Input label="First Name *" value={profileFormData.firstName} onChangeText={t => setProfileFormData({...profileFormData, firstName: t})} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Input label="Last Name *" value={profileFormData.lastName} onChangeText={t => setProfileFormData({...profileFormData, lastName: t})} />
                            </View>
                        </View>
                        <Input label="Preferred Name" value={profileFormData.preferredName} onChangeText={t => setProfileFormData({...profileFormData, preferredName: t})} />
                        <Input label="Email *" value={profileFormData.email} onChangeText={t => setProfileFormData({...profileFormData, email: t})} keyboardType="email-address" />
                        <Input label="Phone" value={profileFormData.phone} onChangeText={t => setProfileFormData({...profileFormData, phone: t})} keyboardType="phone-pad" />
                        
                        {/* Notification Preference Selector */}
                        <Text style={styles.sectionLabel}>System Notification Preference</Text>
                        <View style={styles.prefRow}>
                            {['Email', 'Text Message'].map(opt => (
                                <TouchableOpacity 
                                    key={opt}
                                    style={[styles.prefOption, profileFormData.notificationPreference === opt && styles.activePrefOption]}
                                    onPress={() => setProfileFormData({...profileFormData, notificationPreference: opt})}
                                >
                                    <Text style={[styles.prefText, profileFormData.notificationPreference === opt && styles.activePrefText]}>{opt}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

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

  // --- HUB VIEW ---
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
             <View style={styles.avatarWrapper}>
                <Avatar 
                    photoURL={loggedInUser?.photoURL} 
                    name={loggedInUser?.playerName} 
                    size={100} 
                    bordered
                    onPress={handleImageAction}
                />
                <View style={styles.editBadge}>
                    <Camera size={14} color="black" />
                </View>
             </View>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 20 },
  
  // Hub Styles
  profileHeader: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  avatarWrapper: { marginBottom: 15, position: 'relative' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#121212' },
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
  
  formContainer: { gap: 5 },
  row: { flexDirection: 'row' },
  sectionLabel: { color: COLORS.primary, marginTop: 15, marginBottom: 10, fontWeight: 'bold' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 10 },

  // Pref Selector Styles
  prefRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  prefOption: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#444', alignItems: 'center' },
  activePrefOption: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  prefText: { color: '#ccc' },
  activePrefText: { color: '#000', fontWeight: 'bold' }
});