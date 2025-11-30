import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import Header from '../../common/Header';
import Card from '../../common/Card';
import { Globe, Search, UserPlus, Users } from 'lucide-react-native';
import { COLORS } from '../../../lib/constants';

export default function CommunityScreen({ navigation }) {
  
  const HubButton = ({ title, desc, icon: Icon, onClick, color = COLORS.primary }) => (
    <Card onPress={onClick} style={styles.hubCard}>
      <View style={styles.iconContainer}>
        <Icon size={32} color={color} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.hubTitle}>{title}</Text>
        <Text style={styles.hubDesc}>{desc}</Text>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header title="Community" />
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* 1. Explore */}
        <HubButton 
          title="Explore Communities" 
          desc="Discover new groups and communities" 
          icon={Globe} 
          onClick={() => Alert.alert("Coming Soon", "Feature under construction.")} 
        />
        
        {/* 2. Find Teams */}
        <HubButton 
          title="Find Teams" 
          desc="Search for local teams to join" 
          icon={Search} 
          onClick={() => navigation.navigate("FindTeams")} 
        />
        
        {/* 3. Find Players */}
        <HubButton 
          title="Find Players" 
          desc="Connect with other players" 
          icon={UserPlus} 
          color="#888"
          onClick={() => Alert.alert("Coming Soon", "Feature under construction.")} 
        />
        
        {/* 4. My Groups */}
        <HubButton 
          title="My Groups" 
          desc="Teams, groups and communities that I've already joined" 
          icon={Users} 
          onClick={() => navigation.navigate("MyGroups")} 
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 16 },
  
  hubCard: {
    flexDirection: 'row', // Horizontal layout
    alignItems: 'center',
    padding: 20,
    marginBottom: 16,
    minHeight: 100, // Consistent height
  },
  iconContainer: {
    marginRight: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
  },
  textContainer: {
    flex: 1,
  },
  hubTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  hubDesc: { color: '#aaa', fontSize: 13, lineHeight: 18 }
});