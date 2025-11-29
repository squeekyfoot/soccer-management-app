import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'lucide-react-native';

export default function RosterSchedule({ route }) {
  return (
    <View style={styles.container}>
      <Calendar color="#666" size={48} />
      <Text style={styles.text}>Team Schedule</Text>
      <Text style={styles.subtext}>(Events will appear here)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  text: { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  subtext: { color: '#888' }
});