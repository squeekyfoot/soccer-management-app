import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Text } from 'react-native';
import { Send, Image as ImageIcon, X } from 'lucide-react-native'; 
import { launchImageLibrary } from 'react-native-image-picker'; // NEW IMPORT
import { COLORS } from '../../../../lib/constants';

export default function MessageInput({ onSend, isLoading, onFileChange, selectedFile, onRemoveFile }) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim() || selectedFile) {
      onSend({ text: text.trim(), file: selectedFile });
      setText('');
    }
  };

  const handlePickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 1, // We compress manually later
    });

    if (result.didCancel) return;

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      // Normalize the object to match what your App expects (uri, name, type)
      const file = {
        uri: asset.uri,
        name: asset.fileName || `photo_${Date.now()}.jpg`,
        type: asset.type || 'image/jpeg',
      };
      if (onFileChange) onFileChange({ target: { files: [file] } });
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Preview Area */}
      {selectedFile && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: selectedFile.uri }} style={styles.previewImage} />
          <TouchableOpacity onPress={onRemoveFile} style={styles.removePreviewBtn}>
            <X size={16} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* Input Bar */}
      <View style={styles.container}>
        <TouchableOpacity style={styles.iconButton} onPress={handlePickImage} disabled={isLoading}>
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
          style={[styles.sendButton, (!text.trim() && !selectedFile) && styles.disabledButton]} 
          onPress={handleSend}
          disabled={(!text.trim() && !selectedFile) || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#121212" size="small" />
          ) : (
            <Send color={(text.trim() || selectedFile) ? "#121212" : "#666"} size={20} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#1e1e1e',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  previewContainer: {
    padding: 10,
    paddingBottom: 0,
    flexDirection: 'row',
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444'
  },
  removePreviewBtn: {
    position: 'absolute',
    top: 5,
    left: 60,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    padding: 2,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
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