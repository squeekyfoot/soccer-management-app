import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator } from 'react-native';
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../../../lib/firebase"; // Ensure path is correct
import { useAuth } from '../../../../context/AuthContext';
import Card from '../../../common/Card';
import { COLORS } from '../../../../lib/constants';

export default function RosterPlayers({ route }) {
  const { rosterId } = route.params;
  const { loggedInUser } = useAuth();
  const [roster, setRoster] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to the specific roster document in real-time
  useEffect(() => {
    const rosterRef = doc(db, "rosters", rosterId);
    const unsubscribe = onSnapshot(rosterRef, (docSnap) => {
      if (docSnap.exists()) {
        setRoster({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [rosterId]);

  const renderPlayer = ({ item }) => {
    const isMe = item.uid === loggedInUser?.uid;
    // Simple check if this player is the manager/creator
    const isManager = roster?.createdBy === item.uid;

    return (
      <Card style={styles.playerCard}>
        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          {item.photoURL ? (
            <Image source={{ uri: item.photoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Text style={styles.initials}>
                {item.playerName?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.info}>
          <Text style={[styles.name, isMe && styles.meText]}>
            {item.playerName} {isMe && "(You)"}
          </Text>
          <Text style={styles.email}>{item.email}</Text>
        </View>

        {/* Role Badge */}
        {isManager && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Manager</Text>
          </View>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!roster) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Roster not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.countText}>
          {roster.players?.length || 0} / {roster.maxCapacity} Players
        </Text>
      </View>

      <FlatList
        data={roster.players || []}
        keyExtractor={(item) => item.uid}
        renderItem={renderPlayer}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  text: { color: '#888' },
  
  header: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  countText: { color: '#666', fontSize: 14, textTransform: 'uppercase', fontWeight: 'bold' },
  
  list: { padding: 15 },
  playerCard: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 10 },
  
  avatarContainer: { marginRight: 15 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  placeholderAvatar: { 
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#333', 
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#444' 
  },
  initials: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  
  info: { flex: 1 },
  name: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  meText: { color: COLORS.primary },
  email: { color: '#888', fontSize: 12 },
  
  badge: { 
    backgroundColor: 'rgba(97, 218, 251, 0.15)', paddingHorizontal: 8, paddingVertical: 4, 
    borderRadius: 6, borderWidth: 1, borderColor: 'rgba(97, 218, 251, 0.3)' 
  },
  badgeText: { color: COLORS.primary, fontSize: 10, fontWeight: 'bold' }
});