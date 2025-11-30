import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Input from '../../common/Input';
import Modal from '../../common/Modal';
import Header from '../../common/Header';
import EmptyState from '../../common/EmptyState';
import { COLORS } from '../../../lib/constants';
import { Activity, Plus } from 'lucide-react-native';

export default function SportsInfo({ onBack }) {
  const { soccerDetails, updateSoccerDetails } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Add Sport State
  const [newSportType, setNewSportType] = useState("Soccer");
  const [newSportData, setNewSportData] = useState({
      favoredPosition: "", jerseySize: "Large", playerNumber: "0",
      currentRosters: "", rosterJerseysOwned: "", comments: ""
  });

  // Init Edit Data
  React.useEffect(() => {
    if (soccerDetails) {
        setFormData({
            ...soccerDetails,
            currentRosters: soccerDetails.currentRosters?.join(', ') || "",
            rosterJerseysOwned: soccerDetails.rosterJerseysOwned?.join(', ') || "",
            playerNumber: String(soccerDetails.playerNumber || 0)
        });
    }
  }, [soccerDetails]);

  const handleSubmit = async () => {
    const success = await updateSoccerDetails(formData);
    if (success) {
      setIsEditing(false);
      Alert.alert("Success", "Sports details updated.");
    }
  };

  const handleAddSubmit = async () => {
      if (newSportType === 'Soccer') {
          const success = await updateSoccerDetails(newSportData);
          if (success) {
              setShowAddModal(false);
              Alert.alert("Success", "Sport added successfully.");
          }
      } else {
          Alert.alert("Notice", "Only Soccer is supported at this time.");
      }
  };

  const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value || "Not set"}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
        <Header 
            title="Sports Details" 
            onBack={onBack} 
            actions={
                <TouchableOpacity onPress={() => setShowAddModal(true)}>
                    <Plus color={COLORS.primary} size={24} />
                </TouchableOpacity>
            }
        />
        <ScrollView contentContainerStyle={styles.content}>
            {isEditing ? (
                <View style={styles.formContainer}>
                    <Input label="Favored Position" value={formData.favoredPosition} onChangeText={t => setFormData({...formData, favoredPosition: t})} />
                    <Input label="Jersey Size" value={formData.jerseySize} onChangeText={t => setFormData({...formData, jerseySize: t})} />
                    <Input label="Player Number" value={formData.playerNumber} onChangeText={t => setFormData({...formData, playerNumber: t})} keyboardType="numeric" />
                    <Input label="Current Rosters" value={formData.currentRosters} onChangeText={t => setFormData({...formData, currentRosters: t})} placeholder="Comma separated" />
                    <Input label="Jerseys Owned" value={formData.rosterJerseysOwned} onChangeText={t => setFormData({...formData, rosterJerseysOwned: t})} placeholder="Comma separated" />
                    <Input label="Comments" value={formData.comments} onChangeText={t => setFormData({...formData, comments: t})} multiline />

                    <View style={styles.btnRow}>
                        <Button onPress={handleSubmit} style={{ flex: 1 }}>Save</Button>
                        <Button variant="secondary" onPress={() => setIsEditing(false)} style={{ flex: 1 }}>Cancel</Button>
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
                        <Button style={{ marginTop: 20 }} onPress={() => setIsEditing(true)}>Edit Details</Button>
                    </View>
                ) : (
                    <EmptyState 
                        message="You haven't added any sports details yet."
                        icon={Activity}
                        actionLabel="Add Sport"
                        onAction={() => setShowAddModal(true)}
                    />
                )
            )}
        </ScrollView>

        <Modal 
            visible={showAddModal} 
            title="Add Sport" 
            onClose={() => setShowAddModal(false)}
            actions={<Button onPress={handleAddSubmit}>Save Sport</Button>}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 20 },
  formContainer: { gap: 5 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  infoRow: { flexDirection: 'row', marginBottom: 12 },
  infoLabel: { color: '#888', width: 110, fontWeight: '600', fontSize: 14 },
  infoValue: { color: 'white', flex: 1, fontSize: 14 },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 15 },
  cardTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  modalLabel: { color: '#ccc', marginBottom: 10 }
});