import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { X } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const ImageViewer = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <Modal visible={!!imageUrl} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.closeBtn} 
          onPress={onClose}
        >
          <X color="white" size={24} />
        </TouchableOpacity>

        <Image 
          source={{ uri: imageUrl }} 
          style={styles.image}
          resizeMode="contain"
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(50,50,50,0.5)',
    borderRadius: 20,
  },
  image: {
    width: width,
    height: height * 0.8,
  }
});

export default ImageViewer;