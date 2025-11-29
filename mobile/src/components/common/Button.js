import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function Button({ children, onPress, variant = 'primary', disabled = false, isLoading = false, style }) {
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      style={[
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        disabled && styles.disabled,
        style
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={isPrimary ? "#000" : "#61dafb"} />
      ) : (
        <Text style={[styles.text, isPrimary ? styles.textPrimary : styles.textSecondary]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginVertical: 6,
  },
  primary: { backgroundColor: '#61dafb' },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#61dafb' },
  disabled: { opacity: 0.6 },
  text: { fontSize: 16, fontWeight: '600' },
  textPrimary: { color: '#000000' },
  textSecondary: { color: '#61dafb' },
});