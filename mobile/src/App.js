import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthScreen from './src/screens/AuthScreen';

function AppNavigator() {
  const { loggedInUser, isLoading } = useAuth();
  const Stack = createNativeStackNavigator();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#61dafb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {loggedInUser ? (
          <Stack.Screen name="Home">
            {() => (
              <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: 'white', fontSize: 20 }}>Welcome {loggedInUser.firstName}!</Text>
                <Text style={{ color: '#888', marginTop: 10 }}>Your Mobile App is Live.</Text>
              </View>
            )}
          </Stack.Screen>
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