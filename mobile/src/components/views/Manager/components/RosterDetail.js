import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import Header from '../../../common/Header';
import Modal from '../../../common/Modal';
import UserSearch from '../../../shared/UserSearch';
import { useAuth } from '../../../../context/AuthContext';
import { useChat } from '../../../../context/ChatContext'; 
import { useDirectMessage } from '../../../../hooks/useDirectMessage';
import { COLORS } from '../../../../lib/constants';
import { Edit2, Save, X, MessageCircle, Calendar, Clock, Link as LinkIcon, Users, CheckCircle, AlertCircle, RefreshCw, Unlink, Plus } from 'lucide-react-native';

const RosterDetail = ({ route, navigation }) => {
  const { rosterId } = route.params;
  const { 
      updateRoster, fetchLeagues, fetchRosters, removePlayerFromRoster, 
      addPlayerToRoster, addGroupMembers, fetchUserGroups,
      createGroup, createTeamChat, linkGroupToRoster, unlinkGroupFromRoster, unlinkChatFromRoster, loggedInUser 
  } = useAuth();
  
  const { myChats } = useChat();
  const { startDirectChat } = useDirectMessage();

  // Load roster locally since we only got ID
  const [roster, setRoster] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGroupSelectModal, setShowGroupSelectModal] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState([]);

  // Load Data
  useEffect(() => {
      const load = async () => {
          const allRosters = await fetchRosters();
          const r = allRosters.find(x => x.id === rosterId);
          if (r) {
              setRoster(r);
              setEditForm({
                  name: r.name,
                  season: r.season,
                  maxCapacity: r.maxCapacity?.toString(),
                  targetPlayerCount: r.targetPlayerCount?.toString(),
                  isDiscoverable: r.isDiscoverable,
                  leagueId: r.leagueId,
                  lookingForPlayers: r.lookingForPlayers,
                  pastSeasonsCount: r.pastSeasonsCount?.toString()
              });
          }
          const ls = await fetchLeagues();
          setLeagues(ls);
          if (loggedInUser) {
              const g = await fetchUserGroups(loggedInUser.uid);
              setMyGroups(g);
          }
      };
      load();
  }, [rosterId, fetchRosters, fetchLeagues, fetchUserGroups, loggedInUser]);

  if (!roster) return <View style={styles.container}><Text style={{color:'white'}}>Loading...</Text></View>;

  // Derived Data
  const linkedChat = myChats.find(c => c.rosterId === roster.id);
  const linkedGroup = myGroups.find(g => g.associatedRosterId === roster.id);
  const currentLeague = leagues.find(l => l.id === (isEditing ? editForm.leagueId : roster.leagueId));

  // -- Handlers --

  const handleSave = async () => {
      const updates = { ...editForm };
      if (updates.leagueId) {
          const l = leagues.find(x => x.id === updates.leagueId);
          if (l) updates.leagueName = l.name;
      } else { updates.leagueName = ""; }

      const success = await updateRoster(roster.id, updates);
      if (success) {
          setIsEditing(false);
          // Manually update local state to reflect
          setRoster(prev => ({ ...prev, ...updates }));
      }
  };

  // Group Handlers
  const handleCreateGroup = async () => {
      Alert.alert("Confirm", "Create new community group?", [
          { text: "Cancel" },
          { text: "Create", onPress: async () => {
              await createGroup({ name: roster.name, description: `Official group for ${roster.name}`, isPublic: false, associatedRosterId: roster.id });
              // Refresh logic omitted for brevity, simpler to nav back
              navigation.goBack();
          }}
      ]);
  };

  const handleUnlinkGroup = async () => {
      if (!linkedGroup) return;
      await unlinkGroupFromRoster(linkedGroup.id);
      navigation.goBack(); // Refresh
  };

  const handleChangeGroup = async (newGroupId) => {
      if (linkedGroup) await unlinkGroupFromRoster(linkedGroup.id);
      await linkGroupToRoster(newGroupId, roster.id);
      setShowGroupSelectModal(false);
      navigation.goBack(); // Refresh
  };

  // Chat Handlers
  const handleCreateChat = async () => {
      await createTeamChat(roster.id, roster.name, roster.season, roster.players);
      Alert.alert("Success", "Chat Created");
  };

  const handleUnlinkChat = async () => {
      if (!linkedChat) return;
      Alert.alert("Recreate Chat", "Unlink current chat (archive it) and create a new one?", [
          { text: "Cancel" },
          { text: "Proceed", onPress: async () => {
              await unlinkChatFromRoster(linkedChat.id);
              const customMsg = "Manager has re-created a new chat for the team.";
              await createTeamChat(roster.id, roster.name, roster.season, roster.players, customMsg);
              Alert.alert("Done", "Team chat recreated.");
          }}
      ]);
  };

  // Player Handlers
  const handleAddPlayers = async () => {
      if (selectedEmails.length === 0) return;
      const associated = linkedGroup;
      
      let allSuccess = true;
      for (const email of selectedEmails) {
          const success = await addPlayerToRoster(roster.id, email);
          if (!success) allSuccess = false;
      }
      
      if (associated && selectedEmails.length > 0) {
          await addGroupMembers(associated.id, selectedEmails);
      }

      setShowAddModal(false);
      setSelectedEmails([]);
      // Reload page data
      const allRosters = await fetchRosters();
      const r = allRosters.find(x => x.id === rosterId);
      if (r) setRoster(r);
  };

  return (
    <View style={styles.container}>
      <Header 
        title={isEditing ? "Edit Roster" : roster.name} 
        onBack={() => navigation.goBack()}
        actions={
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={{ padding: 5 }}>
                {isEditing ? <X size={24} color="white" /> : <Edit2 size={24} color="white" />}
            </TouchableOpacity>
        }
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* --- MAIN INFO CARD --- */}
        <View style={styles.card}>
            {!isEditing ? (
                <>
                    <Text style={styles.title}>{roster.name}</Text>
                    <View style={styles.badgeRow}>
                        {roster.leagueName && <Text style={styles.badge}>{roster.leagueName}</Text>}
                        <Text style={{color: '#aaa'}}>{roster.season}</Text>
                        {roster.lookingForPlayers && <Text style={[styles.badge, {backgroundColor: COLORS.success}]}>Recruiting</Text>}
                    </View>

                    {/* Stats */}
                    <View style={styles.statsGrid}>
                        <View>
                            <Text style={styles.statLabel}>Status</Text>
                            <Text style={styles.statValue}>{roster.players?.length || 0} / {roster.maxCapacity}</Text>
                        </View>
                        <View>
                            <Text style={styles.statLabel}>Target</Text>
                            <Text style={styles.statValue}>{roster.targetPlayerCount || roster.maxCapacity}</Text>
                        </View>
                        <View>
                            <Text style={styles.statLabel}>Visibility</Text>
                            <Text style={styles.statValue}>{roster.isDiscoverable ? 'Public' : 'Private'}</Text>
                        </View>
                    </View>

                    {/* League Info */}
                    {currentLeague && (
                        <View style={styles.leagueSection}>
                            <Text style={styles.sectionHeader}>LEAGUE DETAILS</Text>
                            <Text style={{ color: '#ccc', marginBottom: 5 }}>{currentLeague.description}</Text>
                            <View style={styles.row}>
                                <Calendar size={14} color="#888" />
                                <Text style={styles.metaText}>{currentLeague.seasonStart} - {currentLeague.seasonEnd}</Text>
                            </View>
                            <View style={styles.row}>
                                <Clock size={14} color="#888" />
                                <Text style={styles.metaText}>{currentLeague.gameFrequency} • {currentLeague.gameDays?.join(', ')}</Text>
                            </View>
                        </View>
                    )}
                </>
            ) : (
                // EDIT FORM
                <View>
                    <Text style={styles.inputLabel}>Name</Text>
                    <TextInput style={styles.input} value={editForm.name} onChangeText={t => setEditForm(p => ({...p, name: t}))} />
                    
                    <Text style={styles.inputLabel}>Season</Text>
                    <TextInput style={styles.input} value={editForm.season} onChangeText={t => setEditForm(p => ({...p, season: t}))} />

                    <View style={styles.row}>
                        <View style={{flex: 1, marginRight: 5}}>
                            <Text style={styles.inputLabel}>Max Cap</Text>
                            <TextInput style={styles.input} value={editForm.maxCapacity} keyboardType="numeric" onChangeText={t => setEditForm(p => ({...p, maxCapacity: t}))} />
                        </View>
                        <View style={{flex: 1, marginLeft: 5}}>
                            <Text style={styles.inputLabel}>Target</Text>
                            <TextInput style={styles.input} value={editForm.targetPlayerCount} keyboardType="numeric" onChangeText={t => setEditForm(p => ({...p, targetPlayerCount: t}))} />
                        </View>
                    </View>

                    <Text style={styles.inputLabel}>League ID (Paste ID)</Text>
                    {/* Simplified for mobile: Text input for ID instead of complex dropdown logic, or build a picker later */}
                    <TextInput style={styles.input} value={editForm.leagueId} onChangeText={t => setEditForm(p => ({...p, leagueId: t}))} />

                    <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                        <Save size={18} color="white" />
                        <Text style={{color: 'white', fontWeight: 'bold', marginLeft: 5}}>Save Changes</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>

        {/* --- CONNECTIONS SECTION --- */}
        <View style={[styles.card, { borderLeftColor: COLORS.primary, borderLeftWidth: 4 }]}>
            <Text style={[styles.sectionHeader, { marginBottom: 10, color: 'white' }]}>ROSTER CONNECTIONS</Text>
            
            {/* Group */}
            <View style={styles.connectionRow}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.connLabel}>COMMUNITY GROUP</Text>
                    {linkedGroup ? (
                        <View style={styles.row}>
                            <CheckCircle size={14} color={COLORS.success} />
                            <Text style={styles.connValue} numberOfLines={1}>{linkedGroup.name}</Text>
                        </View>
                    ) : (
                        <View style={styles.row}>
                            <AlertCircle size={14} color="#666" />
                            <Text style={[styles.connValue, {color: '#666'}]}>Not Linked</Text>
                        </View>
                    )}
                </View>
                <View style={styles.connActions}>
                    {linkedGroup ? (
                        <>
                            <TouchableOpacity onPress={() => navigation.navigate('GroupDetail', { groupId: linkedGroup.id })} style={styles.xsBtn}><Text style={styles.xsBtnText}>View</Text></TouchableOpacity>
                            <TouchableOpacity onPress={handleUnlinkGroup} style={[styles.xsBtn, {backgroundColor: '#442222'}]}><Unlink size={14} color="#ff5252" /></TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity onPress={handleCreateGroup} style={styles.xsBtn}><Text style={styles.xsBtnText}>Create</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowGroupSelectModal(true)} style={styles.xsBtn}><Text style={styles.xsBtnText}>Link</Text></TouchableOpacity>
                        </>
                    )}
                </View>
            </View>

            {/* Chat */}
            <View style={[styles.connectionRow, { marginTop: 15 }]}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.connLabel}>ROSTER CHAT</Text>
                    {linkedChat ? (
                        <View style={styles.row}>
                            <CheckCircle size={14} color={COLORS.success} />
                            <Text style={styles.connValue}>Active</Text>
                        </View>
                    ) : (
                        <View style={styles.row}>
                            <AlertCircle size={14} color="#666" />
                            <Text style={[styles.connValue, {color: '#666'}]}>Not Linked</Text>
                        </View>
                    )}
                </View>
                <View style={styles.connActions}>
                    {linkedChat ? (
                        <>
                            <TouchableOpacity onPress={() => navigation.navigate('Messaging', { screen: 'Conversation', params: { chatId: linkedChat.id } })} style={styles.xsBtn}><Text style={styles.xsBtnText}>Open</Text></TouchableOpacity>
                            <TouchableOpacity onPress={handleUnlinkChat} style={[styles.xsBtn, {backgroundColor: '#442222'}]}><RefreshCw size={14} color="#ff5252" /></TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity onPress={handleCreateChat} style={styles.xsBtn}><Text style={styles.xsBtnText}>Create Chat</Text></TouchableOpacity>
                    )}
                </View>
            </View>
        </View>

        {/* --- PLAYERS LIST --- */}
        <View style={styles.headerRow}>
            <Text style={styles.sectionHeader}>PLAYERS</Text>
            <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.iconBtn}>
                <UserPlus size={20} color={COLORS.primary} />
            </TouchableOpacity>
        </View>

        {roster.players?.map(p => (
            <TouchableOpacity 
                key={p.uid || p.email} 
                style={styles.playerCard}
                onPress={() => Alert.alert("Actions", p.playerName, [
                    { text: "Message", onPress: () => startDirectChat(p.email) },
                    { text: "Remove", style: 'destructive', onPress: async () => { await removePlayerFromRoster(roster.id, p); navigation.goBack(); } }, // Simple refresh
                    { text: "Cancel", style: "cancel" }
                ])}
            >
                <View style={styles.avatar}><Text style={styles.avatarText}>{p.playerName[0]}</Text></View>
                <View style={{flex: 1}}>
                    <Text style={styles.playerName}>{p.playerName}</Text>
                    <Text style={styles.playerEmail}>{p.email}</Text>
                </View>
                <MessageCircle size={20} color="#666" />
            </TouchableOpacity>
        ))}

      </ScrollView>

      {/* MODALS */}
      {showAddModal && (
          <Modal title="Add Players" onClose={() => setShowAddModal(false)}>
              <UserSearch onSelectionChange={setSelectedEmails} />
              <TouchableOpacity onPress={handleAddPlayers} style={styles.saveBtn}>
                  <Text style={{color: 'white'}}>Add Selected</Text>
              </TouchableOpacity>
          </Modal>
      )}

      {showGroupSelectModal && (
          <Modal title="Link Group" onClose={() => setShowGroupSelectModal(false)}>
              <ScrollView style={{maxHeight: 300}}>
                  {myGroups.map(g => (
                      <TouchableOpacity key={g.id} onPress={() => handleChangeGroup(g.id)} style={styles.groupOption}>
                          <Text style={{color:'white'}}>{g.name}</Text>
                      </TouchableOpacity>
                  ))}
              </ScrollView>
          </Modal>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 16 },
  card: { backgroundColor: '#1e1e1e', padding: 16, borderRadius: 12, marginBottom: 20 },
  title: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  badgeRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginVertical: 8 },
  badge: { backgroundColor: '#333', color: 'white', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, fontSize: 12, overflow: 'hidden' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#252525', padding: 10, borderRadius: 8, marginTop: 10 },
  statLabel: { color: '#888', fontSize: 10, textTransform: 'uppercase' },
  statValue: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  leagueSection: { borderTopWidth: 1, borderTopColor: '#333', marginTop: 15, paddingTop: 15 },
  sectionHeader: { color: '#888', fontSize: 12, fontWeight: 'bold', marginBottom: 5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#ccc', fontSize: 13 },
  input: { backgroundColor: '#333', color: 'white', padding: 8, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: '#555' },
  inputLabel: { color: '#888', fontSize: 12, marginBottom: 4 },
  saveBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 8, marginTop: 10 },
  connectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#252525', padding: 10, borderRadius: 8 },
  connLabel: { fontSize: 10, color: '#888', marginBottom: 4 },
  connValue: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  connActions: { flexDirection: 'row', gap: 5 },
  xsBtn: { backgroundColor: '#444', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  xsBtnText: { color: 'white', fontSize: 11 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  playerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e1e1e', padding: 12, borderRadius: 8, marginBottom: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#aaa', fontWeight: 'bold' },
  playerName: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  playerEmail: { color: '#888', fontSize: 12 },
  groupOption: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#333' }
});

export default RosterDetail;