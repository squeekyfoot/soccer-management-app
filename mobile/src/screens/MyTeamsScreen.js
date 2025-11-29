import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Header from '../components/common/Header';
import Button from '../components/common/Button';
import { Users, ChevronRight, Plus } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';

export default function MyTeamsScreen({ navigation }) {
  const { loggedInUser, fetchUserRosters } = useAuth();
  const [rosters, setRosters] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadRosters = useCallback(async () => {
    if (!loggedInUser) return;
    setRefreshing(true);
    try {
      const data = await fetchUserRosters(loggedInUser.uid);
      setRosters(data);
    } catch (error) {
      console.error("Failed to load rosters", error);
    } finally {
      setRefreshing(false);
    }
  }, [loggedInUser, fetchUserRosters]);

  // Reload data every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRosters();
    }, [loadRosters])
  );

  const renderRosterItem = ({ item }) => (
    <Card 
      style={styles.card} 
      onPress={() => navigation.navigate("RosterDetail", { rosterId: item.id, rosterName: item.name })}
    >
      <View style={styles.iconBox}>
        <Users color="#61dafb" size={24} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.role}>{item.role || 'Player'}</Text>
      </View>
      <ChevronRight color="#666" size={20} />
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header 
        title="My Teams" 
        actions={
          <TouchableOpacity style={styles.addBtn} onPress={() => alert("Create Roster Coming Soon")}>
            <Plus color="#61dafb" size={24} />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={rosters}
        keyExtractor={item => item.id}
        renderItem={renderRosterItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadRosters} tintColor="#61dafb" />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>You haven't joined any teams yet.</Text>
            <Button style={{ marginTop: 20 }} onPress={() => alert("Join Team Flow Coming Soon")}>
              Join a Team
            </Button>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  list: { padding: 16 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconBox: { 
    width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(97, 218, 251, 0.1)', 
    justifyContent: 'center', alignItems: 'center', marginRight: 15 
  },
  info: { flex: 1 },
  name: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  role: { fontSize: 14, color: '#888', textTransform: 'capitalize' },
  emptyState: { alignItems: 'center', marginTop: 50, padding: 20 },
  emptyText: { color: '#888', fontSize: 16 },
  addBtn: { padding: 5 }
});