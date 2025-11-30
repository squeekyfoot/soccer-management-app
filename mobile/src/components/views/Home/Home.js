import React from 'react';
import { View, StyleSheet } from 'react-native';
import Header from '../../common/Header';
import CalendarView from './CalendarView';

export default function Home() {
  return (
    <View style={styles.container}>
      <Header title="Dashboard" />
      <CalendarView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
});