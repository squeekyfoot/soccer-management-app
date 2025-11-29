import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { Home, Users, MessageSquare, User, Lightbulb } from 'lucide-react-native';

// Screens
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import MyTeamsScreen from './src/screens/MyTeamsScreen';
import RosterDetailScreen from './src/screens/RosterDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FeedbackScreen from './src/screens/FeedbackScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import FindTeamsScreen from './src/screens/FindTeamsScreen';

// We need to define these placeholders if you haven't created the files yet,
// or import them if you have. For safety, I'll define simple placeholders here
// so the app doesn't crash if the files are missing.

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// 1. The Tab Navigator (Visible when logged in)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopColor: '#333',
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarActiveTintColor: '#61dafb',
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={HomeScreen} 
        options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tab.Screen 
        name="My Teams" 
        component={MyTeamsScreen} 
        options={{ tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }}
      />
      <Tab.Screen 
        name="Community" 
        component={CommunityScreen} 
        options={{ tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} /> }}
      />
      <Tab.Screen 
        name="Feedback" 
        component={FeedbackScreen} 
        options={{ tabBarIcon: ({ color, size }) => <Lightbulb color={color} size={size} /> }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}

// 2. The Main App Navigator (Switch between Auth and Tabs)
function AppNavigator() {
  const { loggedInUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#61dafb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {loggedInUser ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            {/* Detail Screens */}
            <Stack.Screen 
              name="RosterDetail" 
              component={RosterDetailScreen}
              options={{ headerShown: true, headerStyle: { backgroundColor: '#121212' }, headerTintColor: '#fff' }} 
            />
            <Stack.Screen name="FindTeams" component={FindTeamsScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

import { Text } from 'react-native'; // Ensure Text is imported

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  }
});