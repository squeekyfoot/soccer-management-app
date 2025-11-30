import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import Header from '../../common/Header';
import Card from '../../common/Card';
import Button from '../../common/Button';
import { COLORS } from '../../../lib/constants';
import { Plus, Trash2, Check, X, Users } from 'lucide-react-native';

export default function ManagerDashboardScreen({ navigation }) {
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
    // Filter to only show rosters created by this manager
    const myRosters = data.filter(r => r.createdBy === loggedInUser?.uid);
    setRosters(myRosters);
    setRefreshing(false);
  };

  useEffect(() => {
    loadRosters();
    const unsubscribe = navigation.addListener('focus', loadRosters);
    return unsubscribe;
  }, [navigation, loggedInUser]);

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

  const renderRequest = ({ item }) => (
    <Card style={styles.requestCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.reqName}>{item.userName}</Text>
        <Text style={styles.reqDetail}>wants to join {item.rosterName}</Text>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity onPress={() => handleRequest(item, 'approve')} style={[styles.iconBtn, { backgroundColor: COLORS.success }]}>
          <Check size={18} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleRequest(item, 'deny')} style={[styles.iconBtn, { backgroundColor: COLORS.danger }]}>
          <X size={18} color="white" />
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderRoster = ({ item }) => (
    <Card style={styles.rosterCard}>
      <View style={styles.rosterHeader}>
        <View>
          <Text style={styles.rosterName}>{item.name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.rosterSeason}>
              {item.season} • {item.players?.length || 0} / {item.maxCapacity} players
            </Text>
            {item.isDiscoverable && (
              <View style={styles.publicBadge}>
                <Text style={styles.publicText}>Public</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.cardActions}>
        <Button 
          variant="secondary" 
          style={styles.manageBtn} 
          textStyle={{ fontSize: 12 }}
          onPress={() => navigation.navigate("ManageRoster", { rosterId: item.id })}
        >
          Manage
        </Button>
        <Button 
          variant="danger" 
          style={styles.deleteBtn} 
          textStyle={{ fontSize: 12 }}
          onPress={() => handleDeleteRoster(item.id)}
        >
          Delete
        </Button>
      </View>
    </Card>
  );

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

      <FlatList
        data={rosters}
        keyExtractor={item => item.id}
        renderItem={renderRoster}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadRosters} tintColor={COLORS.primary} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {requests.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Incoming Requests ({requests.length})</Text>
                <FlatList 
                    data={requests}
                    keyExtractor={item => item.id}
                    renderItem={renderRequest}
                    scrollEnabled={false}
                />
              </View>
            )}
            <Text style={styles.sectionTitle}>Current Rosters</Text>
          </>
        }
        ListEmptyComponent={
            <View style={styles.empty}>
                <Users size={48} color="#444" />
                <Text style={styles.emptyText}>You haven't created any teams yet.</Text>
                <Button style={{ marginTop: 20 }} onPress={() => navigation.navigate("CreateRoster")}>
                    Create Your First Team
                </Button>
            </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  listContent: { padding: 16 },
  
  section: { marginBottom: 25 },
  sectionTitle: { color: COLORS.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 10 },

  // Request Card
  requestCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, marginBottom: 8 },
  reqName: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  reqDetail: { color: '#ccc', fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

  // Roster Card
  rosterCard: { padding: 16, marginBottom: 15 },
  rosterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  rosterName: { color: COLORS.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  rosterSeason: { color: '#ccc', fontSize: 14, marginRight: 10 },
  publicBadge: { 
    borderWidth: 1, borderColor: '#555', borderRadius: 4, 
    paddingHorizontal: 4, paddingVertical: 2 
  },
  publicText: { color: '#ccc', fontSize: 10 },

  cardActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  manageBtn: { paddingVertical: 6, paddingHorizontal: 15, minWidth: 80 },
  deleteBtn: { paddingVertical: 6, paddingHorizontal: 15, minWidth: 80 },

  empty: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#888', marginTop: 10 }
});