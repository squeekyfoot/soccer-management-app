import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Header from '../../common/Header';
import Modal from '../../common/Modal';
import { useAuth } from '../../../context/AuthContext';
import { useChat } from '../../../context/ChatContext'; 
import { useDirectMessage } from '../../../hooks/useDirectMessage';
import { COLORS } from '../../../lib/constants';
import { MessageCircle, Calendar, Clock, Trophy, Link as LinkIcon, CheckCircle, AlertCircle, Phone, Mail, User } from 'lucide-react-native';

const RosterDetail = ({ route, navigation }) => {
  const { rosterId } = route.params;
  const { fetchRosters, fetchLeagues, fetchUserGroups, loggedInUser } = useAuth();
  const { myChats } = useChat();
  const { startDirectChat } = useDirectMessage();

  const [roster, setRoster] = useState(null);
  const [league, setLeague] = useState(null);
  const [linkedGroup, setLinkedGroup] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Load Data
  useEffect(() => {
      const load = async () => {
          const allRosters = await fetchRosters();
          const r = allRosters.find(x => x.id === rosterId);
          setRoster(r);

          if (r) {
              if (r.leagueId) {
                  const ls = await fetchLeagues();
                  setLeague(ls.find(l => l.id === r.leagueId));
              }
              if (loggedInUser) {
                  const gs = await fetchUserGroups(loggedInUser.uid);
                  setLinkedGroup(gs.find(g => g.associatedRosterId === r.id));
              }
          }
      };
      load();
  }, [rosterId, fetchRosters, fetchLeagues, fetchUserGroups, loggedInUser]);

  if (!roster) return <View style={styles.container}><Text style={{color:'#888', margin: 20}}>Loading...</Text></View>;

  const linkedChat = myChats.find(c => c.rosterId === roster.id);

  return (
    <View style={styles.container}>
      <Header title="Team Details" onBack={() => navigation.goBack()} />
      
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* --- INFO CARD --- */}
        <View style={styles.card}>
            <Text style={styles.title}>{roster.name}</Text>
            <View style={styles.badgeRow}>
                {league && <Text style={styles.badge}>{league.name}</Text>}
                <Text style={{color: '#aaa'}}>{roster.season}</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsGrid}>
                <View>
                    <Text style={styles.statLabel}>Roster</Text>
                    <Text style={styles.statValue}>{roster.players?.length || 0} Players</Text>
                </View>
                <View>
                    <Text style={styles.statLabel}>Manager</Text>
                    <Text style={styles.statValue}>{roster.managerName || "Unknown"}</Text>
                </View>
            </View>

            {/* League Info */}
            {league && (
                <View style={styles.leagueSection}>
                    <Text style={styles.sectionHeader}>LEAGUE DETAILS</Text>
                    <Text style={{ color: '#ccc', marginBottom: 5 }}>{league.description}</Text>
                    <View style={styles.row}>
                        <Calendar size={14} color="#888" />
                        <Text style={styles.metaText}>{league.seasonStart} - {league.seasonEnd}</Text>
                    </View>
                    <View style={styles.row}>
                        <Clock size={14} color="#888" />
                        <Text style={styles.metaText}>{league.gameFrequency} • {league.gameDays?.join(', ')}</Text>
                    </View>
                </View>
            )}
        </View>

        {/* --- CONNECTIONS --- */}
        <View style={[styles.card, { borderLeftColor: COLORS.primary, borderLeftWidth: 4 }]}>
            <Text style={[styles.sectionHeader, { marginBottom: 10, color: 'white' }]}>TEAM RESOURCES</Text>
            
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
                            <Text style={[styles.connValue, {color: '#666'}]}>Not available</Text>
                        </View>
                    )}
                </View>
                {linkedGroup && (
                    <TouchableOpacity onPress={() => navigation.navigate('GroupDetail', { groupId: linkedGroup.id })} style={styles.xsBtn}>
                        <Text style={styles.xsBtnText}>View</Text>
                    </TouchableOpacity>
                )}
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
                            <Text style={[styles.connValue, {color: '#666'}]}>Not active</Text>
                        </View>
                    )}
                </View>
                {linkedChat && (
                    <TouchableOpacity onPress={() => navigation.navigate('Messaging', { screen: 'Conversation', params: { chatId: linkedChat.id } })} style={styles.xsBtn}>
                        <Text style={styles.xsBtnText}>Open</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>

        {/* --- PLAYERS LIST --- */}
        <Text style={styles.sectionHeaderMain}>TEAMMATES</Text>
        {roster.players?.map(p => (
            <TouchableOpacity 
                key={p.uid || p.email} 
                style={styles.playerCard}
                onPress={() => setSelectedPlayer(p)}
            >
                <View style={styles.avatar}><Text style={styles.avatarText}>{p.playerName[0]}</Text></View>
                <View style={{flex: 1}}>
                    <Text style={styles.playerName}>{p.playerName}</Text>
                    <Text style={styles.playerEmail}>{p.email}</Text>
                </View>
                <MessageCircle size={20} color={COLORS.primary} />
            </TouchableOpacity>
        ))}

      </ScrollView>

      {/* PLAYER MODAL */}
      {selectedPlayer && (
          <Modal title="Teammate Profile" onClose={() => setSelectedPlayer(null)}>
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
                      <User size={40} color="#666" />
                  </View>
                  <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>{selectedPlayer.playerName}</Text>
              </View>

              <View style={{ backgroundColor: '#252525', padding: 15, borderRadius: 8, gap: 15 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Mail size={18} color={COLORS.primary} />
                      <Text style={{ color: '#eee' }}>{selectedPlayer.email}</Text>
                  </View>
                  {selectedPlayer.phone && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <Phone size={18} color={COLORS.primary} />
                          <Text style={{ color: '#eee' }}>{selectedPlayer.phone}</Text>
                      </View>
                  )}
              </View>

              <TouchableOpacity 
                style={styles.msgBtn}
                onPress={() => {
                    startDirectChat(selectedPlayer.email);
                    setSelectedPlayer(null);
                }}
              >
                  <MessageCircle size={20} color="white" />
                  <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 10 }}>Message Teammate</Text>
              </TouchableOpacity>
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
  sectionHeaderMain: { color: '#888', fontSize: 12, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#ccc', fontSize: 13 },
  connectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#252525', padding: 10, borderRadius: 8 },
  connLabel: { fontSize: 10, color: '#888', marginBottom: 4 },
  connValue: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  xsBtn: { backgroundColor: '#444', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  xsBtnText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  playerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e1e1e', padding: 12, borderRadius: 8, marginBottom: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#aaa', fontWeight: 'bold' },
  playerName: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  playerEmail: { color: '#888', fontSize: 12 },
  msgBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 8, marginTop: 20 }
});

export default RosterDetail;