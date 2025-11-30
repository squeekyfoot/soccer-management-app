import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import Header from '../../common/Header';
import Card from '../../common/Card';
import Button from '../../common/Button';

export default function FindTeamsScreen({ navigation }) {
  const { 
    fetchDiscoverableRosters, 
    subscribeToUserRequests, 
    submitJoinRequest,
    loggedInUser 
  } = useAuth();

  const [teams, setTeams] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Load Discoverable Rosters
    const loadTeams = async () => {
      setLoading(true);
      const data = await fetchDiscoverableRosters();
      setTeams(data);
      setLoading(false);
    };
    loadTeams();

    // 2. Subscribe to my existing requests (so we can show "Pending")
    const unsubRequests = subscribeToUserRequests((data) => {
      setMyRequests(data);
    });

    return () => unsubRequests();
  }, [fetchDiscoverableRosters, subscribeToUserRequests]);

  const handleJoinRequest = async (team) => {
    const success = await submitJoinRequest(team.id, team.name, team.createdBy);
    if (success) Alert.alert("Success", "Request sent to team manager.");
  };

  const getRequestStatus = (teamId) => {
    const req = myRequests.find(r => r.rosterId === teamId);
    return req ? req.status : null;
  };

  return (
    <View style={styles.container}>
      <Header title="Find Teams" onBack={() => navigation.goBack()} />
      
      <FlatList
        data={teams}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          !loading && <Text style={styles.empty}>No public teams found.</Text>
        }
        renderItem={({ item }) => {
          const status = getRequestStatus(item.id);
          const alreadyJoined = item.playerIDs?.includes(loggedInUser.uid);

          return (
            <Card style={styles.card}>
              <View style={{flex: 1, marginRight: 10}}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  {item.season} • {item.players?.length || 0}/{item.maxCapacity} Players
                </Text>
              </View>
              
              <View style={{minWidth: 90}}>
                {alreadyJoined ? (
                  <Text style={styles.joined}>Joined</Text>
                ) : status === 'pending' ? (
                  <Text style={styles.pending}>Pending</Text>
                ) : (
                  <Button 
                    onPress={() => handleJoinRequest(item)} 
                    style={{paddingVertical: 8, paddingHorizontal: 12}}
                  >
                    Join
                  </Button>
                )}
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  empty: { color: '#888', textAlign: 'center', marginTop: 40 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  meta: { fontSize: 14, color: '#aaa' },
  joined: { color: '#28a745', fontWeight: 'bold', textAlign: 'right' },
  pending: { color: '#ffc107', fontWeight: 'bold', textAlign: 'right' }
});