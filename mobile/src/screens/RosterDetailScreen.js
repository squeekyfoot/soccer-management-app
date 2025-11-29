import React, { useEffect } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, Text, StyleSheet } from 'react-native';

// Import the sub-screens
import RosterPlayers from './roster/RosterPlayers';
import RosterSchedule from './roster/RosterSchedule';
import RosterChat from './roster/RosterChat';

const TopTab = createMaterialTopTabNavigator();

export default function RosterDetailScreen({ route, navigation }) {
  const { rosterId, rosterName } = route.params;

  // Update the header title dynamically
  useEffect(() => {
    navigation.setOptions({ title: rosterName || 'Team Detail' });
  }, [navigation, rosterName]);

  return (
    <TopTab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: '#121212' },
        tabBarActiveTintColor: '#61dafb',
        tabBarInactiveTintColor: '#888',
        tabBarIndicatorStyle: { backgroundColor: '#61dafb' },
        tabBarLabelStyle: { fontWeight: 'bold', fontSize: 12 },
      }}
    >
      <TopTab.Screen 
        name="Roster" 
        component={RosterPlayers} 
        initialParams={{ rosterId }} // Pass ID down
      />
      <TopTab.Screen 
        name="Schedule" 
        component={RosterSchedule} 
        initialParams={{ rosterId }} 
      />
      <TopTab.Screen 
        name="Chat" 
        component={RosterChat} 
        initialParams={{ rosterId }} 
      />
    </TopTab.Navigator>
  );
}