import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Switch, TextInput } from 'react-native';
import { useChat } from '../../../context/ChatContext';
import { useAuth } from '../../../context/AuthContext';
import Header from '../../common/Header';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import UserSearch from '../../shared/UserSearch';
import { COLORS } from '../../../lib/constants';
import { Camera, UserPlus, LogOut, Trash2 } from 'lucide-react-native';

export default function ChatDetailsScreen({ route, navigation }) {
  const { chatId } = route.params;
  const { myChats, renameChat, leaveChat, hideChat, addParticipant } = useChat();
  const { loggedInUser } = useAuth();

  const [chat, setChat] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  
  // Add Member State
  const [showAddModal, setShowAddModal] = useState(false);
  const [usersToAdd, setUsersToAdd] = useState([]);
  const [includeHistory, setIncludeHistory] = useState(true);

  useEffect(() => {
    const found = myChats.find(c => c.id === chatId);
    if (found) {
        setChat(found);
        setNewName(found.name);
    }
  }, [myChats, chatId]);

  if (!chat) return null;

  const isRoster = chat.type === 'roster';
  const isGroup = chat.type === 'group' || (chat.participants.length > 2 && !isRoster);

  // --- Handlers ---

  const handleRename = async () => {
      if (newName.trim() && newName !== chat.name) {
          await renameChat(chat.id, newName.trim());
          setIsEditingName(false);
      } else {
          setIsEditingName(false);
      }
  };

  const handleLeaveOrDelete = () => {
      if (isRoster) {
          Alert.alert("Info", "Roster chats are managed by the team manager.");
          return;
      }

      Alert.alert(
          isGroup ? "Leave Group" : "Delete Chat",
          isGroup ? "Are you sure you want to leave?" : "Delete history?",
          [
              { text: "Cancel", style: "cancel" },
              { 
                  text: "Confirm", 
                  style: "destructive", 
                  onPress: async () => {
                      if (isGroup) await leaveChat(chat.id);
                      else await hideChat(chat.id, chat.visibleTo);
                      navigation.popToTop(); // Go back to root
                  }
              }
          ]
      );
  };

  const handleAddMembers = async () => {
      if (usersToAdd.length === 0) return;
      
      for(const user of usersToAdd) {
          // UserSearch returns object with email
          await addParticipant(chat.id, user.email, includeHistory);
      }
      setShowAddModal(false);
      setUsersToAdd([]);
      Alert.alert("Success", "Members added.");
  };

  const handlePhotoPress = () => {
      if (isGroup) {
          Alert.alert("Update Photo", "Photo upload coming soon to mobile.");
      }
  };

  return (
    <View style={styles.container}>
      <Header title="Details" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Header Section */}
        <View style={styles.profileSection}>
            <TouchableOpacity onPress={handlePhotoPress} activeOpacity={isGroup ? 0.7 : 1}>
                <View style={styles.avatarContainer}>
                    {chat.photoURL ? (
                        <Image source={{ uri: chat.photoURL }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.placeholder]}>
                            <Text style={styles.initial}>{chat.name?.charAt(0).toUpperCase()}</Text>
                        </View>
                    )}
                    {isGroup && (
                        <View style={styles.camBadge}><Camera size={12} color="white" /></View>
                    )}
                </View>
            </TouchableOpacity>

            {isEditingName && isGroup ? (
                <View style={styles.renameRow}>
                    <TextInput 
                        style={styles.input} 
                        value={newName} 
                        onChangeText={setNewName}
                        autoFocus
                    />
                    <Button onPress={handleRename} style={{ height: 40, paddingHorizontal: 15 }}>Save</Button>
                </View>
            ) : (
                <TouchableOpacity onPress={() => isGroup && setIsEditingName(true)} disabled={!isGroup}>
                    <Text style={styles.chatName}>{chat.name}</Text>
                </TouchableOpacity>
            )}
            
            <Text style={styles.subText}>
                {isRoster ? "Team Roster" : isGroup ? "Group Chat" : "Direct Message"}
            </Text>
        </View>

        {/* Participants Section */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PARTICIPANTS ({chat.participantDetails?.length || 0})</Text>
            {isGroup && (
                <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addBtn}>
                    <UserPlus size={16} color={COLORS.primary} />
                    <Text style={styles.addText}>Add</Text>
                </TouchableOpacity>
            )}
        </View>

        <Card style={styles.listCard}>
            {chat.participantDetails?.map((p, idx) => (
                <View key={p.uid} style={[styles.participantRow, idx === chat.participantDetails.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={styles.pAvatar}>
                        {p.photoURL ? (
                            <Image source={{ uri: p.photoURL }} style={{ width: 32, height: 32, borderRadius: 16 }} />
                        ) : (
                            <Text style={{ color: '#ccc', fontWeight: 'bold' }}>{p.name?.charAt(0)}</Text>
                        )}
                    </View>
                    <Text style={styles.pName}>
                        {p.name} {p.uid === loggedInUser.uid && <Text style={{ color: COLORS.primary }}>(You)</Text>}
                    </Text>
                </View>
            ))}
        </Card>

        {/* Danger Zone */}
        {!isRoster && (
            <Button variant="danger" onPress={handleLeaveOrDelete} style={{ marginTop: 30 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {isGroup ? <LogOut size={18} color="white" /> : <Trash2 size={18} color="white" />}
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>
                        {isGroup ? "Leave Group" : "Delete Chat"}
                    </Text>
                </View>
            </Button>
        )}

        {/* Add Member Modal */}
        <Modal 
            visible={showAddModal} 
            title="Add People" 
            onClose={() => setShowAddModal(false)}
            actions={<Button onPress={handleAddMembers} disabled={usersToAdd.length === 0}>Add</Button>}
        >
            <View style={{ height: 200 }}>
                <UserSearch onSelectionChange={setUsersToAdd} />
            </View>
            
            <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.switchLabel}>Include Chat History</Text>
                    <Text style={styles.switchDesc}>Allow new members to see past messages</Text>
                </View>
                <Switch 
                    value={includeHistory} 
                    onValueChange={setIncludeHistory}
                    trackColor={{ false: "#767577", true: COLORS.primary }}
                    thumbColor={"#f4f3f4"}
                />
            </View>
        </Modal>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 20 },
  
  profileSection: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  placeholder: { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.primary },
  initial: { fontSize: 32, color: 'white', fontWeight: 'bold' },
  camBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, padding: 6, borderRadius: 12 },
  
  chatName: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  subText: { color: '#888', fontSize: 14 },
  
  renameRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 5 },
  input: { backgroundColor: '#222', color: 'white', padding: 10, borderRadius: 8, minWidth: 200, borderColor: COLORS.border, borderWidth: 1 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: '#888', fontSize: 12, fontWeight: 'bold' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  addText: { color: COLORS.primary, fontWeight: 'bold' },

  listCard: { padding: 0, overflow: 'hidden' },
  participantRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#333' },
  pAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#444', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  pName: { color: 'white', fontSize: 16 },

  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, padding: 10, backgroundColor: '#222', borderRadius: 8 },
  switchLabel: { color: 'white', fontWeight: 'bold' },
  switchDesc: { color: '#888', fontSize: 12 }
});