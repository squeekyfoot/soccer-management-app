import React from 'react';
import { Modal as RNModal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';

export default function Modal({ visible, title, onClose, children, actions }) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <X color="#ccc" size={24} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content} contentContainerStyle={{paddingBottom: 20}}>
            {children}
          </ScrollView>
          
          {actions && (
            <View style={styles.footer}>
              {actions}
            </View>
          )}
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1e1e1e', // Dark sidebar color
    borderRadius: 12,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
});