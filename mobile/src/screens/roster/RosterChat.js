import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MessageSquare } from 'lucide-react-native';

export default function RosterChat({ route }) {
  return (
    <View style={styles.container}>
      <MessageSquare color="#666" size={48} />
      <Text style={styles.text}>Team Chat</Text>
      <Text style={styles.subtext}>(Chat feature coming in Phase 4.5)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  text: { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  subtext: { color: '#888' }
});