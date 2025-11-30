import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../../../context/AuthContext';
import Card from '../../../common/Card';
import { COLORS } from '../../../../lib/constants';
import { Plus, Trash2 } from 'lucide-react-native';

export default function RosterSchedule({ route }) {
  const { rosterId } = route.params;
  const { fetchEvents, deleteEvent, isManager } = useAuth();
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      const data = await fetchEvents(rosterId);
      setEvents(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rosterId, fetchEvents]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleDelete = (eventId) => {
    Alert.alert("Delete Event", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          await deleteEvent(rosterId, eventId);
          loadEvents(); // Reload after delete
      }}
    ]);
  };

  const renderEvent = ({ item }) => (
    <Card style={styles.card}>
      <View style={styles.dateBox}>
        <Text style={styles.dateDay}>{new Date(item.dateTime).getDate()}</Text>
        <Text style={styles.dateMonth}>
          {new Date(item.dateTime).toLocaleDateString('en-US', { month: 'short' })}
        </Text>
      </View>
      
      <View style={styles.info}>
        <Text style={styles.title}>{item.type}</Text>
        <Text style={styles.time}>
          {new Date(item.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={styles.location} numberOfLines={1}>@ {item.location}</Text>
      </View>

      {/* Only Managers can delete */}
      {isManager() && (
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
          <Trash2 size={20} color={COLORS.danger} />
        </TouchableOpacity>
      )}
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={item => item.id}
        renderItem={renderEvent}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadEvents(); }} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No upcoming events.</Text>
            </View>
          )
        }
      />

      {/* Floating Action Button for Managers */}
      {isManager() && (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => Alert.alert("Coming Soon", "Event creation will be added in the Manager phase.")}
        >
          <Plus color="black" size={24} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  list: { padding: 15 },
  empty: { marginTop: 50, alignItems: 'center' },
  emptyText: { color: '#666' },

  card: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 12 },
  
  dateBox: { 
    backgroundColor: '#2a2a2a', padding: 10, borderRadius: 8, 
    alignItems: 'center', marginRight: 15, minWidth: 60 
  },
  dateDay: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  dateMonth: { fontSize: 12, color: COLORS.primary, textTransform: 'uppercase', fontWeight: '700' },

  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  time: { fontSize: 14, color: '#ccc' },
  location: { fontSize: 14, color: '#888', marginTop: 2 },

  deleteBtn: { padding: 10 },

  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  }
});