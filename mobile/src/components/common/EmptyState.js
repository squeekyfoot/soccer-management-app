import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from './Button';

export default function EmptyState({ message, icon: Icon, actionLabel, onAction }) {
  return (
    <View style={styles.container}>
      {Icon && <Icon size={48} color="#444" style={{ marginBottom: 15 }} />}
      <Text style={styles.text}>{message || "Nothing to see here."}</Text>
      {actionLabel && onAction && (
        <Button style={styles.button} onPress={onAction}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, minHeight: 200 },
  text: { color: '#888', textAlign: 'center', fontSize: 16, marginBottom: 20 },
  button: { minWidth: 150 }
});