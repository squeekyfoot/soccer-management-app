import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

export default function Card({ children, style, onPress }) {
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container style={[styles.card, style]} onPress={onPress} activeOpacity={0.7}>
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e1e1e', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
});