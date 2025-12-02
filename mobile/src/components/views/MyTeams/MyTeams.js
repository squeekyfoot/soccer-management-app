import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import Header from '../../common/Header';
import { useAuth } from '../../../context/AuthContext';
import { COLORS } from '../../../lib/constants';
import { ChevronRight } from 'lucide-react-native';

const MyTeams = ({ navigation }) => {
  const { loggedInUser, fetchUserRosters } = useAuth();
  const [rosters, setRosters] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadRosters = useCallback(async () => {
    if (!loggedInUser) return;
    setRefreshing(true);
    const data = await fetchUserRosters(loggedInUser.uid);
    setRosters(data);
    setRefreshing(false);
  }, [loggedInUser, fetchUserRosters]);

  useEffect(() => {
    loadRosters();
  }, [loadRosters]);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.7}
      onPress={() => navigation.navigate('RosterDetailReadOnly', { rosterId: item.id })}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.teamName}>{item.name}</Text>
        <Text style={styles.teamSeason}>
            {item.season} • {item.players?.length || 0} Players
        </Text>
      </View>
      <ChevronRight size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="My Teams" />
      
      {rosters.length === 0 && !refreshing ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>You are not part of any teams yet.</Text>
          <Text style={styles.emptySubText}>Check out "Community" to find a team!</Text>
        </View>
      ) : (
        <FlatList
          data={rosters}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadRosters} tintColor={COLORS.primary} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#333'
  },
  teamName: { color: COLORS.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  teamSeason: { color: '#aaa', fontSize: 14 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  emptySubText: { color: '#888', fontSize: 14 }
});

export default MyTeams;