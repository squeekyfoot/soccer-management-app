import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import Header from '../../common/Header';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Input from '../../common/Input';
import { COLORS } from '../../../lib/constants';
import { Plus, X } from 'lucide-react-native';

export default function MyGroupsScreen({ navigation }) {
  const { fetchUserGroups, createGroup, loggedInUser } = useAuth();
  
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");

  const loadGroups = useCallback(async () => {
    if (!loggedInUser) return;
    setRefreshing(true);
    const data = await fetchUserGroups(loggedInUser.uid);
    setGroups(data);
    setLoading(false);
    setRefreshing(false);
  }, [loggedInUser, fetchUserGroups]);

  useEffect(() => {
    loadGroups();
    const unsub = navigation.addListener('focus', loadGroups);
    return unsub;
  }, [loadGroups, navigation]);

  const handleCreate = async () => {
    if (!newGroupName) {
        Alert.alert("Error", "Group Name is required.");
        return;
    }
    const success = await createGroup({ name: newGroupName, description: newGroupDesc, links: [] });
    if (success) {
        Alert.alert("Success", "Group created!");
        setShowCreateForm(false);
        setNewGroupName("");
        setNewGroupDesc("");
        loadGroups();
    }
  };

  const renderGroup = ({ item }) => (
    <Card 
        style={styles.card} 
        onPress={() => navigation.navigate("GroupDetail", { groupId: item.id, groupName: item.name })}
    >
      <Text style={styles.groupName}>{item.name}</Text>
      <Text style={styles.groupDesc} numberOfLines={1}>{item.description}</Text>
      <Text style={styles.memberCount}>{item.memberDetails?.length || 0} Members</Text>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header 
        title="My Groups" 
        onBack={() => navigation.goBack()}
        actions={
            <TouchableOpacity onPress={() => setShowCreateForm(!showCreateForm)} style={styles.iconBtn}>
                {showCreateForm ? <X color="white" size={24} /> : <Plus color={COLORS.primary} size={24} />}
            </TouchableOpacity>
        }
      />

      <FlatList 
        data={groups}
        keyExtractor={item => item.id}
        renderItem={renderGroup}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadGroups} tintColor={COLORS.primary} />}
        ListHeaderComponent={
            showCreateForm && (
                <Card style={styles.formCard}>
                    <Text style={styles.formTitle}>New Group</Text>
                    <Input label="Name" value={newGroupName} onChangeText={setNewGroupName} />
                    <Input label="Description" value={newGroupDesc} onChangeText={setNewGroupDesc} multiline />
                    <Button onPress={handleCreate}>Create Group</Button>
                </Card>
            )
        }
        ListEmptyComponent={
            !loading && (
                <View style={styles.empty}>
                    <Text style={styles.emptyText}>You haven't joined any groups yet.</Text>
                </View>
            )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  list: { padding: 16 },
  
  card: { padding: 16, marginBottom: 12 },
  groupName: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginBottom: 4 },
  groupDesc: { fontSize: 14, color: '#ccc', marginBottom: 10 },
  memberCount: { fontSize: 12, color: '#888' },

  formCard: { padding: 16, marginBottom: 20, borderColor: COLORS.primary, borderWidth: 1 },
  formTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 15 },
  
  iconBtn: { padding: 5 },
  empty: { marginTop: 50, alignItems: 'center' },
  emptyText: { color: '#888' }
});