import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Header from '../components/common/Header';
import { Calendar } from 'lucide-react-native';

export default function HomeScreen({ navigation }) {
  const { loggedInUser, fetchAllUserEvents, signOutUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!loggedInUser) return;
    setRefreshing(true);
    try {
      // Fetch events just like the web app
      const eventData = await fetchAllUserEvents(loggedInUser.uid);
      // Filter for future events only and sort by date
      const upcoming = eventData
        .filter(e => new Date(e.dateTime) >= new Date())
        .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
      
      setEvents(upcoming);
    } catch (error) {
      console.error("Failed to load home data", error);
    } finally {
      setRefreshing(false);
    }
  }, [loggedInUser, fetchAllUserEvents]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Render a single event item
  const renderEventItem = (item) => (
    <Card key={item.id} style={styles.eventCard}>
      <View style={styles.dateBox}>
        <Text style={styles.dateDay}>{new Date(item.dateTime).getDate()}</Text>
        <Text style={styles.dateMonth}>
          {new Date(item.dateTime).toLocaleDateString('en-US', { month: 'short' })}
        </Text>
      </View>
      <View style={styles.eventInfo}>
        <Text style={styles.eventName} numberOfLines={1}>
          {item.type}: {item.rosterName}
        </Text>
        <Text style={styles.eventTime}>
          {new Date(item.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={styles.eventLoc} numberOfLines={1}>@ {item.location}</Text>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header 
        title="Dashboard" 
        actions={
          <TouchableOpacity onPress={signOutUser} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        } 
      />

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor="#61dafb" />}
      >
        <Text style={styles.sectionTitle}>Welcome, {loggedInUser?.firstName}</Text>

        {/* Upcoming Schedule Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Upcoming Schedule</Text>
            <Calendar size={20} color="#61dafb" />
          </View>
          
          {events.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No upcoming events found.</Text>
            </Card>
          ) : (
            events.map(item => renderEventItem(item))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Quick Actions</Text>
          <Button onPress={() => navigation.navigate("My Teams")}>
            View My Teams
          </Button>
          <Button variant="secondary" onPress={() => navigation.navigate("Profile")}>
             Edit Profile
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 20 },
  section: { marginBottom: 30 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionHeader: { fontSize: 18, fontWeight: '600', color: '#61dafb' },
  
  emptyCard: { alignItems: 'center', padding: 20 },
  emptyText: { color: '#888', fontStyle: 'italic' },
  
  // Event Card Styles
  eventCard: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  dateBox: { 
    backgroundColor: '#2a2a2a', padding: 8, borderRadius: 8, alignItems: 'center', marginRight: 15, minWidth: 55 
  },
  dateDay: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  dateMonth: { fontSize: 12, color: '#61dafb', textTransform: 'uppercase', fontWeight: '700' },
  eventInfo: { flex: 1 },
  eventName: { fontSize: 16, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  eventTime: { fontSize: 14, color: '#ccc' },
  eventLoc: { fontSize: 14, color: '#888', marginTop: 2 },

  logoutBtn: { padding: 8 },
  logoutText: { color: '#ff6b6b', fontWeight: '600' }
});