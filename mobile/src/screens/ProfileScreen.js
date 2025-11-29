import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Header from '../components/common/Header';
import Input from '../components/common/Input';
import { User, LogOut, Shirt } from 'lucide-react-native';

export default function ProfileScreen() {
  const { loggedInUser, soccerDetails, signOutUser, updateProfile, updateSoccerDetails } = useAuth();
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State (simplified for mobile demo)
  const [formData, setFormData] = useState({
    firstName: loggedInUser?.firstName || '',
    lastName: loggedInUser?.lastName || '',
    phone: loggedInUser?.phone || '',
  });

  const [soccerData, setSoccerData] = useState({
    jerseySize: soccerDetails?.jerseySize || 'Large',
    favoredPosition: soccerDetails?.favoredPosition || '',
  });

  const handleSave = async () => {
    // 1. Update Basic Profile
    const profileSuccess = await updateProfile({
      ...loggedInUser,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone
    });

    // 2. Update Soccer Details
    const soccerSuccess = await updateSoccerDetails({
      ...soccerDetails,
      jerseySize: soccerData.jerseySize,
      favoredPosition: soccerData.favoredPosition,
      currentRosters: soccerDetails?.currentRosters?.join(',') || '', // Keep existing
      rosterJerseysOwned: soccerDetails?.rosterJerseysOwned?.join(',') || '', // Keep existing
      playerNumber: soccerDetails?.playerNumber || 0
    });

    if (profileSuccess && soccerSuccess) {
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    }
  };

  return (
    <View style={styles.container}>
      <Header 
        title="My Profile" 
        actions={
          <TouchableOpacity onPress={signOutUser} style={{ padding: 5 }}>
            <LogOut color="#ff6b6b" size={24} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Profile Header Card */}
        <View style={styles.profileHeader}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                    {loggedInUser?.firstName?.charAt(0)}{loggedInUser?.lastName?.charAt(0)}
                </Text>
            </View>
            <Text style={styles.name}>{loggedInUser?.playerName}</Text>
            <Text style={styles.email}>{loggedInUser?.email}</Text>
        </View>

        <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Personal Info</Text>
                {!isEditing && (
                    <TouchableOpacity onPress={() => setIsEditing(true)}>
                        <Text style={styles.editLink}>Edit</Text>
                    </TouchableOpacity>
                )}
            </View>

            <Card>
                {isEditing ? (
                    <>
                        <Input label="First Name" value={formData.firstName} onChangeText={t => setFormData({...formData, firstName: t})} />
                        <Input label="Last Name" value={formData.lastName} onChangeText={t => setFormData({...formData, lastName: t})} />
                        <Input label="Phone" value={formData.phone} onChangeText={t => setFormData({...formData, phone: t})} />
                    </>
                ) : (
                    <>
                        <View style={styles.row}>
                            <Text style={styles.label}>Name:</Text>
                            <Text style={styles.value}>{loggedInUser?.firstName} {loggedInUser?.lastName}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Phone:</Text>
                            <Text style={styles.value}>{loggedInUser?.phone || "Not set"}</Text>
                        </View>
                    </>
                )}
            </Card>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sports Details</Text>
            <Card>
                {isEditing ? (
                    <>
                        <Input label="Position" value={soccerData.favoredPosition} onChangeText={t => setSoccerData({...soccerData, favoredPosition: t})} placeholder="e.g. Striker" />
                        <Input label="Jersey Size" value={soccerData.jerseySize} onChangeText={t => setSoccerData({...soccerData, jerseySize: t})} />
                    </>
                ) : (
                    <>
                        <View style={styles.row}>
                            <Text style={styles.label}>Position:</Text>
                            <Text style={styles.value}>{soccerDetails?.favoredPosition || "Not set"}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Jersey Size:</Text>
                            <Text style={styles.value}>{soccerDetails?.jerseySize || "Large"}</Text>
                        </View>
                    </>
                )}
            </Card>
        </View>

        {isEditing && (
            <View style={styles.actionRow}>
                <Button onPress={handleSave}>Save Changes</Button>
                <Button variant="secondary" onPress={() => setIsEditing(false)}>Cancel</Button>
            </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 20 },
  
  profileHeader: { alignItems: 'center', marginBottom: 30 },
  avatar: { 
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#333', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
    borderWidth: 2, borderColor: '#61dafb'
  },
  avatarText: { fontSize: 36, color: 'white', fontWeight: 'bold' },
  name: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 5 },
  email: { fontSize: 16, color: '#888' },

  section: { marginBottom: 25 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#61dafb' },
  editLink: { color: '#61dafb', fontSize: 16 },

  row: { flexDirection: 'row', marginBottom: 8 },
  label: { color: '#888', width: 100, fontWeight: '600' },
  value: { color: 'white', flex: 1 },

  actionRow: { gap: 10, marginBottom: 40 }
});