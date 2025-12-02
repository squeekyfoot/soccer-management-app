import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { House, Users, MessageSquare, User, Settings, Dribbble, Lightbulb } from 'lucide-react-native';

// --- CONTEXTS ---
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ChatProvider } from './src/context/ChatContext';
import { COLORS } from './src/lib/constants';

// --- SCREENS ---
import AuthPage from './src/components/auth/AuthPage';
import Home from './src/components/views/Home/Home';
import Community from './src/components/views/Community/Community';
import MyTeams from './src/components/views/MyTeams/MyTeams';
import Messaging from './src/components/views/Messaging/Messaging';
import Conversation from './src/components/views/Messaging/Conversation';
import MyProfile from './src/components/views/Profile/MyProfile';
import Feedback from './src/components/views/Feedback/Feedback';

// Detail Screens
import GroupDetail from './src/components/views/Community/GroupDetail';
import RosterDetailReadOnly from './src/components/views/MyTeams/RosterDetail';

// Manager Screens
import ManagerDashboard from './src/components/views/Manager/ManagerDashboard';
import RosterDetail from './src/components/views/Manager/components/RosterDetail';
import CreateRoster from './src/components/views/Manager/CreateRoster';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- TAB NAVIGATOR (Main Layout) ---
function MainTabs() {
  const { isManager } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopColor: '#333',
          paddingBottom: 5,
          height: 60
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={Home} 
        options={{ tabBarIcon: ({ color }) => <House color={color} size={24} /> }} 
      />
      <Tab.Screen 
        name="Community" 
        component={Community} 
        options={{ tabBarIcon: ({ color }) => <Users color={color} size={24} /> }} 
      />
      <Tab.Screen 
        name="MyTeams" 
        component={MyTeams} 
        options={{ tabBarLabel: 'Teams', tabBarIcon: ({ color }) => <Dribbble color={color} size={24} /> }} 
      />
      <Tab.Screen 
        name="Messaging" 
        component={Messaging} 
        options={{ tabBarIcon: ({ color }) => <MessageSquare color={color} size={24} /> }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={MyProfile} 
        options={{ tabBarIcon: ({ color }) => <User color={color} size={24} /> }} 
      />
      
      {/* Manager Tab (Conditional) */}
      {isManager() && (
        <Tab.Screen 
          name="Manager" 
          component={ManagerDashboard} 
          options={{ tabBarIcon: ({ color }) => <Settings color={color} size={24} /> }} 
        />
      )}
    </Tab.Navigator>
  );
}

// --- ROOT STACK NAVIGATOR ---
function RootNavigator() {
  const { loggedInUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#121212' } }}>
      {!loggedInUser ? (
        // Auth Stack
        <Stack.Screen name="Auth" component={AuthPage} />
      ) : (
        // Main App Stack
        <>
          {/* Main Tabs */}
          <Stack.Screen name="Main" component={MainTabs} />
          
          {/* Global Screens (Drill-downs) */}
          <Stack.Screen name="Conversation" component={Conversation} />
          <Stack.Screen name="Feedback" component={Feedback} />
          <Stack.Screen name="GroupDetail" component={GroupDetail} />
          
          {/* My Teams Detail (Read Only) */}
          <Stack.Screen name="RosterDetailReadOnly" component={RosterDetailReadOnly} />

          {/* Manager Specific Screens */}
          <Stack.Screen name="RosterDetail" component={RosterDetail} />
          <Stack.Screen name="CreateRoster" component={CreateRoster} />
        </>
      )}
    </Stack.Navigator>
  );
}

// --- APP ENTRY POINT ---
export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </ChatProvider>
    </AuthProvider>
  );
}