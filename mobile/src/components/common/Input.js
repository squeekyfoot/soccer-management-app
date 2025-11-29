import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

export default function Input({ label, value, onChangeText, placeholder, secureTextEntry, autoCapitalize = "none" }) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#666"
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { color: '#ccc', fontSize: 14, marginBottom: 6, fontWeight: '500' },
  input: {
    backgroundColor: '#2a2a2a', color: 'white', paddingHorizontal: 15, paddingVertical: 12,
    borderRadius: 8, borderWidth: 1, borderColor: '#444', fontSize: 16,
  },
});