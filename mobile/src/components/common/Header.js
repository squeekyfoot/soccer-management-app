import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { ChevronLeft } from 'lucide-react-native'; 

export default function Header({ title, onBack, actions }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.leftContainer}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <ChevronLeft color="#61dafb" size={28} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.rightContainer}>{actions}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#121212', borderBottomWidth: 1, borderBottomColor: '#333' },
  container: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  leftContainer: { width: 40, alignItems: 'flex-start' },
  rightContainer: { width: 40, alignItems: 'flex-end' },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center', flex: 1 },
});