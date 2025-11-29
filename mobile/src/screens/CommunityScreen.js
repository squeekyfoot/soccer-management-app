import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Header from '../components/common/Header';
import Card from '../components/common/Card';
import { Globe, Search, UserPlus, Users } from 'lucide-react-native';

export default function CommunityScreen({ navigation }) {
  
  const HubButton = ({ title, desc, icon: Icon, onClick, color = "#61dafb" }) => (
    <Card onPress={onClick} style={styles.hubCard}>
      <Icon size={32} color={color} style={{ marginBottom: 12 }} />
      <Text style={styles.hubTitle}>{title}</Text>
      <Text style={styles.hubDesc}>{desc}</Text>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header title="Community" />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          <HubButton 
            title="Explore Communities" 
            desc="Discover new groups and communities" 
            icon={Globe} 
            onClick={() => Alert.alert("Coming Soon", "Feature under construction.")} 
          />
          
          <HubButton 
            title="Find Teams" 
            desc="Search for local teams to join" 
            icon={Search} 
            onClick={() => navigation.navigate("FindTeams")} 
          />
          
          <HubButton 
            title="Find Players" 
            desc="Connect with other players" 
            icon={UserPlus} 
            color="#888"
            onClick={() => Alert.alert("Coming Soon", "Feature under construction.")} 
          />
          
          <HubButton 
            title="My Groups" 
            desc="Teams & communities I've joined" 
            icon={Users} 
            onClick={() => Alert.alert("Coming Soon", "We will build MyGroups next!")} 
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  
  hubCard: {
    width: '48%', // 2 columns
    alignItems: 'flex-start',
    minHeight: 160,
    padding: 16,
  },
  hubTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  hubDesc: { color: '#aaa', fontSize: 12, lineHeight: 18 }
});