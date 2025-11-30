import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ChatProvider, useChat } from './src/context/ChatContext';
import { Home, Users, MessageSquare, User, Globe, Settings, Lightbulb } from 'lucide-react-native';

// Screens
import AuthScreen from './src/components/auth/AuthPage';
import HomeScreen from './src/components/views/Home/Home';
import MyTeamsScreen from './src/components/views/MyTeams/MyTeams';
import RosterDetailScreen from './src/components/views/Roster/RosterDetail';
import ProfileScreen from './src/components/views/Profile/MyProfile';
import FeedbackScreen from './src/components/views/Feedback/Feedback';
import CommunityScreen from './src/components/views/Community/Community';
import FindTeamsScreen from './src/components/views/MyTeams/FindTeams';
import MessagingScreen from './src/components/views/Messaging/Messaging';
import ChatScreen from './src/components/views/Messaging/Chat';
import NewChatScreen from './src/components/views/Messaging/NewChat';
import ChatDetailsScreen from './src/components/views/Messaging/ChatDetails';
import MyGroupsScreen from './src/components/views/Community/MyGroups';
import GroupDetailScreen from './src/components/views/Community/GroupDetail';

// Manager Screens
import ManagerDashboardScreen from './src/components/views/Manager/ManagerDashboard';
import CreateRosterScreen from './src/components/views/Manager/CreateRoster';
import ManageRosterScreen from './src/components/views/Manager/ManageRoster';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MessagingIcon({ color, size }) {
  const { myChats } = useChat();
  const { loggedInUser } = useAuth();
  
  const unreadTotal = myChats.reduce((sum, chat) => {
    if (chat.unreadCounts && loggedInUser && chat.unreadCounts[loggedInUser.uid]) {
      return sum + chat.unreadCounts[loggedInUser.uid];
    }
    return sum;
  }, 0);

  return (
    <View>
      <MessageSquare color={color} size={size} />
      {unreadTotal > 0 && (
        <View style={{
          position: 'absolute', right: -6, top: -4, 
          backgroundColor: '#61dafb', borderRadius: 6, 
          width: 12, height: 12, justifyContent: 'center', alignItems: 'center'
        }}>
          <Text style={{ color: 'black', fontSize: 8, fontWeight: 'bold' }}>{unreadTotal}</Text>
        </View>
      )}
    </View>
  );
}

function MainTabs() {
  const { isManager } = useAuth();

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
        tabBarLabelStyle: { fontSize: 10, marginBottom: 2 } // Tweaked for 6 items
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tab.Screen 
        name="Community" 
        component={CommunityScreen} 
        options={{ tabBarIcon: ({ color, size }) => <Globe color={color} size={size} /> }}
      />
      <Tab.Screen 
        name="My Teams" 
        component={MyTeamsScreen} 
        options={{ tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }}
      />
      <Tab.Screen 
        name="Messaging" 
        component={MessagingScreen} 
        options={{ tabBarIcon: ({ color, size }) => <MessagingIcon color={color} size={size} /> }}
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
      
      {isManager() && (
        <Tab.Screen 
          name="Manager" 
          component={ManagerDashboardScreen} 
          options={{ tabBarIcon: ({ color, size }) => <Settings color={color} size={size} /> }}
        />
      )}
    </Tab.Navigator>
  );
}

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
            <Stack.Screen name="NewChat" component={NewChatScreen} />
<Stack.Screen name="ChatDetails" component={ChatDetailsScreen} />
            <Stack.Screen name="ChatScreen" component={ChatScreen} /> 
            <Stack.Screen name="CreateRoster" component={CreateRosterScreen} />
            <Stack.Screen name="ManageRoster" component={ManageRosterScreen} /> 
            <Stack.Screen name="MyGroups" component={MyGroupsScreen} />
<Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
            <Stack.Screen 
              name="RosterDetail" 
              component={RosterDetailScreen}
              options={{ headerShown: true, headerStyle: { backgroundColor: '#121212' }, headerTintColor: '#fff' }} 
            />
            <Stack.Screen name="FindTeams" component={FindTeamsScreen} />
            {/* Feedback is now in Tabs, removed from Stack to avoid dupes/confusion */}
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
      <ChatProvider>
        <AppNavigator />
      </ChatProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
});