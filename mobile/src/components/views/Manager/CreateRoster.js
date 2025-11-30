import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Switch, Text } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import Header from '../../common/Header';
import Input from '../../common/Input';
import Button from '../../common/Button';
import { COLORS } from '../../../lib/constants';

export default function CreateRosterScreen({ navigation }) {
  const { createRoster } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    season: '',
    maxCapacity: '20',
    isDiscoverable: true,
    createGroup: true
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.season || !formData.maxCapacity) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    setLoading(true);
    const success = await createRoster(
      formData.name,
      formData.season,
      Number(formData.maxCapacity),
      formData.isDiscoverable,
      { createGroup: formData.createGroup, groupName: formData.name },
      true // Add manager as player automatically
    );
    setLoading(false);

    if (success) {
      Alert.alert("Success", "Team created successfully!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Create New Team" onBack={() => navigation.goBack()} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <Input 
          label="Team Name" 
          value={formData.name} 
          onChangeText={t => setFormData({...formData, name: t})} 
          placeholder="e.g. The Net Busters"
        />
        
        <Input 
          label="Season" 
          value={formData.season} 
          onChangeText={t => setFormData({...formData, season: t})} 
          placeholder="e.g. Fall 2025"
        />
        
        <Input 
          label="Max Capacity" 
          value={formData.maxCapacity} 
          onChangeText={t => setFormData({...formData, maxCapacity: t})} 
          keyboardType="numeric"
        />

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Make Discoverable</Text>
            <Text style={styles.switchDesc}>Allow players to find this team in search.</Text>
          </View>
          <Switch 
            value={formData.isDiscoverable} 
            onValueChange={v => setFormData({...formData, isDiscoverable: v})}
            trackColor={{ false: "#767577", true: COLORS.primary }}
            thumbColor={"#f4f3f4"}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Create Community Group</Text>
            <Text style={styles.switchDesc}>Automatically create a group for posts.</Text>
          </View>
          <Switch 
            value={formData.createGroup} 
            onValueChange={v => setFormData({...formData, createGroup: v})}
            trackColor={{ false: "#767577", true: COLORS.primary }}
            thumbColor={"#f4f3f4"}
          />
        </View>

        <Button onPress={handleSubmit} disabled={loading} style={{ marginTop: 20 }}>
          {loading ? "Creating..." : "Create Team"}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 20 },
  switchRow: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginVertical: 15, padding: 10, backgroundColor: '#2a2a2a', borderRadius: 8 
  },
  switchLabel: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  switchDesc: { color: '#aaa', fontSize: 12, marginTop: 4 }
});