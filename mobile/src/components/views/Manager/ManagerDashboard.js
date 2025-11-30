import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import Header from '../../common/Header';
import { COLORS } from '../../../lib/constants';
import { Plus } from 'lucide-react-native';

// Imported Sub-Components
import IncomingRequests from './components/IncomingRequests';
import RosterList from './components/RosterList';

export default function ManagerDashboard({ navigation }) {
  const { 
    fetchRosters, 
    deleteRoster, 
    subscribeToIncomingRequests, 
    respondToRequest,
    loggedInUser 
  } = useAuth();

  const [rosters, setRosters] = useState([]);
  const [requests, setRequests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Subscribe to Requests
  useEffect(() => {
    const unsub = subscribeToIncomingRequests(setRequests);
    return () => unsub && unsub();
  }, [subscribeToIncomingRequests]);

  // 2. Load Rosters
  const loadRosters = async () => {
    setRefreshing(true);
    const data = await fetchRosters();
    const myRosters = data.filter(r => r.createdBy === loggedInUser?.uid);
    setRosters(myRosters);
    setRefreshing(false);
  };

  useEffect(() => {
    loadRosters();
    const unsubscribe = navigation.addListener('focus', loadRosters);
    return unsubscribe;
  }, [navigation, loggedInUser]);

  // --- Handlers ---

  const handleDeleteRoster = (rosterId) => {
    Alert.alert("Delete Team", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          await deleteRoster(rosterId);
          loadRosters();
      }}
    ]);
  };

  const handleRequest = async (req, action) => {
    if (action === 'deny') {
        Alert.alert("Deny Request", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Deny", style: "destructive", onPress: async () => {
                await respondToRequest(req, 'deny');
            }}
        ]);
    } else {
        const success = await respondToRequest(req, 'approve');
        if (success) Alert.alert("Success", "Player added to roster.");
    }
  };

  return (
    <View style={styles.container}>
      <Header 
        title="Manager Dashboard" 
        actions={
          <TouchableOpacity onPress={() => navigation.navigate("CreateRoster")} style={{ padding: 5 }}>
            <Plus color={COLORS.primary} size={24} />
          </TouchableOpacity>
        }
      />

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadRosters} tintColor={COLORS.primary} />}
      >
        <IncomingRequests 
            requests={requests} 
            onApprove={(item) => handleRequest(item, 'approve')} 
            onDeny={(item) => handleRequest(item, 'deny')} 
        />

        <RosterList 
            rosters={rosters}
            onManage={(id) => navigation.navigate("ManageRoster", { rosterId: id })}
            onDelete={handleDeleteRoster}
            onCreate={() => navigation.navigate("CreateRoster")}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 16 },
});