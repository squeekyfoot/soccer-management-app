import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Users } from 'lucide-react-native';
import Card from '../../components/common/Card';

// We will pass the full roster object via props later
export default function RosterPlayers({ route }) {
  // For now, mock data or empty state
  const players = []; 

  return (
    <View style={styles.container}>
      <FlatList
        data={players}
        keyExtractor={item => item.uid}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.empty}>
             <Users color="#666" size={48} />
             <Text style={styles.emptyText}>No players in this roster yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card><Text style={{color:'white'}}>{item.playerName}</Text></Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  empty: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#888', marginTop: 10 }
});