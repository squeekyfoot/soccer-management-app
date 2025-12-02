import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Header from '../../common/Header';
import { useAuth } from '../../../context/AuthContext';
import RosterList from './components/RosterList';
import IncomingRequests from './components/IncomingRequests';
import CreateLeagueModal from './components/CreateLeagueModal';
import { Plus } from 'lucide-react-native';
import { COLORS } from '../../../lib/constants';

const ManagerDashboard = ({ navigation }) => {
  const { 
    fetchRosters, 
    fetchIncomingRequests, 
    deleteRoster,
    loggedInUser,
    fetchUserGroups 
  } = useAuth();

  const [rosters, setRosters] = useState([]);
  const [requests, setRequests] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [showLeagueModal, setShowLeagueModal] = useState(false);

  const loadData = useCallback(async () => {
    const r = await fetchRosters();
    const req = await fetchIncomingRequests();
    setRosters(r);
    setRequests(req);
    
    if (loggedInUser?.uid) {
        const g = await fetchUserGroups(loggedInUser.uid);
        setMyGroups(g);
    }
  }, [fetchRosters, fetchIncomingRequests, fetchUserGroups, loggedInUser]);

  useEffect(() => {
    // Reload on focus to catch updates from detail screens
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  return (
    <View style={styles.container}>
      <Header title="Manager Dashboard" />
      
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Action Bar */}
        <View style={styles.actionBar}>
            <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => navigation.navigate('CreateRoster')}
            >
                <Plus size={18} color="white" />
                <Text style={styles.actionText}>New Roster</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.actionButton, styles.secondaryButton]} 
                onPress={() => setShowLeagueModal(true)}
            >
                <Plus size={18} color="white" />
                <Text style={styles.actionText}>New League</Text>
            </TouchableOpacity>
        </View>

        {/* Requests */}
        <IncomingRequests requests={requests} onRefresh={loadData} />
        
        <View style={styles.spacer} />

        {/* Rosters */}
        <RosterList 
            rosters={rosters} 
            onDelete={async (id) => { await deleteRoster(id); loadData(); }}
            onSelect={(roster) => navigation.navigate('RosterDetail', { rosterId: roster.id })}
        />

      </ScrollView>

      {showLeagueModal && (
          <CreateLeagueModal onClose={() => setShowLeagueModal(false)} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 16 },
  actionBar: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  actionButton: { 
      flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, 
      paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, gap: 5 
  },
  secondaryButton: { backgroundColor: '#444' },
  actionText: { color: 'white', fontWeight: 'bold' },
  spacer: { height: 20 }
});

export default ManagerDashboard;