import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { doc, onSnapshot } from "firebase/firestore"; 
import { db } from "../../../lib/firebase"; 
import Header from '../../common/Header';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import Input from '../../common/Input';
import { COLORS } from '../../../lib/constants';
import { UserPlus, Trash2, Plus } from 'lucide-react-native';

// NOTE: Ensure this component exists, or replace with a simple TextInput
import UserSearch from '../../shared/UserSearch'; 

export default function ManageRosterScreen({ route, navigation }) {
  const { rosterId } = route.params;
  const { 
    removePlayerFromRoster, 
    addPlayerToRoster, 
    fetchUserGroups, 
    addGroupMembers, 
    loggedInUser 
  } = useAuth();

  const [roster, setRoster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myGroups, setMyGroups] = useState([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  
  // Selection
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [targetGroupId, setTargetGroupId] = useState(""); // For "Add Player" flow
  const [playerForGroup, setPlayerForGroup] = useState(null); // For "Add existing player to group"

  // 1. Listen to Roster
  useEffect(() => {
    const rosterRef = doc(db, "rosters", rosterId);
    const unsubscribe = onSnapshot(rosterRef, (docSnap) => {
      if (docSnap.exists()) {
        setRoster({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [rosterId]);

  // 2. Fetch Groups (for dropdowns)
  useEffect(() => {
    if (loggedInUser) {
      fetchUserGroups(loggedInUser.uid).then(setMyGroups);
    }
  }, [loggedInUser]);

  // --- Handlers ---

  const handleAddPlayers = async () => {
    if (selectedEmails.length === 0) return;
    
    setShowAddModal(false);
    
    // Add to Roster
    for (const email of selectedEmails) {
      await addPlayerToRoster(rosterId, email);
    }

    // Add to Group (optional)
    if (targetGroupId) {
      await addGroupMembers(targetGroupId, selectedEmails);
    }

    Alert.alert("Success", "Players added!");
    setSelectedEmails([]);
    setTargetGroupId("");
  };

  const handleRemovePlayer = (player) => {
    Alert.alert("Remove Player", `Remove ${player.playerName}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
          await removePlayerFromRoster(rosterId, player);
      }}
    ]);
  };

  const handleAddExistingToGroup = async (group) => {
    if (!playerForGroup) return;
    await addGroupMembers(group.id, [playerForGroup.email]);
    setShowGroupModal(false);
    setPlayerForGroup(null);
    Alert.alert("Success", "Added to group!");
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>;
  if (!roster) return <View style={styles.center}><Text style={{color:'white'}}>Roster not found</Text></View>;

  return (
    <View style={styles.container}>
      <Header 
        title={roster.name} 
        onBack={() => navigation.goBack()} 
        actions={
          <TouchableOpacity onPress={() => setShowAddModal(true)}>
            <UserPlus color={COLORS.primary} size={24} />
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        {/* Meta Info */}
        <View style={styles.metaBox}>
          <Text style={styles.metaText}>
            {roster.season} • {roster.players?.length || 0} / {roster.maxCapacity} Players
          </Text>
          {roster.isDiscoverable && (
            <View style={styles.discoverableBadge}>
              <Text style={styles.discoverableText}>Discoverable</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionHeader}>Roster</Text>

        <FlatList 
          data={roster.players || []}
          keyExtractor={item => item.uid}
          renderItem={({ item }) => (
            <Card style={styles.playerCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.playerName}>{item.playerName}</Text>
                <Text style={styles.playerEmail}>{item.email}</Text>
              </View>
              <View style={styles.actions}>
                <Button 
                  variant="secondary" 
                  style={{ paddingVertical: 4, paddingHorizontal: 8 }}
                  textStyle={{ fontSize: 10 }}
                  onPress={() => { setPlayerForGroup(item); setShowGroupModal(true); }}
                >
                  + Group
                </Button>
                <TouchableOpacity onPress={() => handleRemovePlayer(item)} style={{ padding: 8 }}>
                  <Trash2 size={20} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            </Card>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No players yet.</Text>}
        />
      </View>

      {/* --- Modals --- */}

      {/* Add Player Modal */}
      <Modal 
        visible={showAddModal} 
        title="Add Players" 
        onClose={() => setShowAddModal(false)}
        actions={<Button onPress={handleAddPlayers} disabled={selectedEmails.length === 0}>Add Players</Button>}
      >
        <Text style={styles.modalLabel}>Search Users:</Text>
        <View style={{ height: 200 }}>
           <UserSearch onSelectionChange={setSelectedEmails} />
        </View>
        
        <Text style={[styles.modalLabel, { marginTop: 20 }]}>Add to Group (Optional):</Text>
        <View style={styles.groupList}>
           <TouchableOpacity 
             style={[styles.groupOption, targetGroupId === "" && styles.selectedGroup]}
             onPress={() => setTargetGroupId("")}
           >
             <Text style={{ color: 'white' }}>None</Text>
           </TouchableOpacity>
           {myGroups.map(g => (
             <TouchableOpacity 
               key={g.id} 
               style={[styles.groupOption, targetGroupId === g.id && styles.selectedGroup]}
               onPress={() => setTargetGroupId(g.id)}
             >
               <Text style={{ color: 'white' }}>{g.name}</Text>
             </TouchableOpacity>
           ))}
        </View>
      </Modal>

      {/* Add Existing to Group Modal */}
      <Modal
        visible={showGroupModal}
        title={`Add ${playerForGroup?.playerName} to Group`}
        onClose={() => { setShowGroupModal(false); setPlayerForGroup(null); }}
      >
        <Text style={styles.modalLabel}>Select a group:</Text>
        {myGroups.map(group => (
          <Card key={group.id} onPress={() => handleAddExistingToGroup(group)} style={{ marginBottom: 10 }}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>{group.name}</Text>
          </Card>
        ))}
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  content: { flex: 1, padding: 20 },
  
  metaBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  metaText: { color: '#ccc', marginRight: 10 },
  discoverableBadge: { backgroundColor: COLORS.success, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  discoverableText: { color: 'white', fontSize: 12, fontWeight: 'bold' },

  sectionHeader: { color: COLORS.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 10, paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: '#333' },
  emptyText: { color: '#888', fontStyle: 'italic', marginTop: 10 },

  playerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, marginBottom: 8 },
  playerName: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  playerEmail: { color: '#aaa', fontSize: 12 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  modalLabel: { color: '#ccc', marginBottom: 10 },
  groupList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  groupOption: { padding: 10, backgroundColor: '#333', borderRadius: 5, borderWidth: 1, borderColor: '#333' },
  selectedGroup: { borderColor: COLORS.primary, backgroundColor: 'rgba(97, 218, 251, 0.1)' }
});