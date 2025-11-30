import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Header from '../../common/Header';

export default function MyTeamsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Header 
        title="My Teams" 
        // We remove the "Plus" action since the web app doesn't show actions here yet
      />
      
      <View style={styles.content}>
        <View style={styles.messageContainer}>
            <Text style={styles.text}>This page is under construction.</Text>
            <Text style={styles.text}>Here you will see all the teams you are a part of.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  messageContainer: { maxWidth: 300, alignItems: 'center' },
  text: { 
    color: '#888', 
    fontSize: 16, 
    textAlign: 'center', 
    marginBottom: 10,
    lineHeight: 24 
  }
});