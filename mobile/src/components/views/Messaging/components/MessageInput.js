import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Send, Image as ImageIcon } from 'lucide-react-native'; // Aliased Image to avoid conflict
import { COLORS } from '../../../../lib/constants';

export default function MessageInput({ onSend, isLoading }) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.iconButton} onPress={() => alert("Image upload coming soon")}>
        <ImageIcon color="#888" size={24} />
      </TouchableOpacity>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#888"
          value={text}
          onChangeText={setText}
          multiline
        />
      </View>

      <TouchableOpacity 
        style={[styles.sendButton, !text.trim() && styles.disabledButton]} 
        onPress={handleSend}
        disabled={!text.trim() || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#121212" size="small" />
        ) : (
          <Send color={text.trim() ? "#121212" : "#666"} size={20} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: '#1e1e1e',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  iconButton: {
    padding: 10,
    marginBottom: 2,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#2c2c2c',
    borderRadius: 20,
    marginHorizontal: 8,
    minHeight: 40,
    justifyContent: 'center',
  },
  input: {
    color: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#333',
  },
});