import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { doc, getDoc, collection, query, orderBy, onSnapshot } from "firebase/firestore"; 
import { db } from "../../../lib/firebase";
import Header from '../../common/Header';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Input from '../../common/Input';
import Modal from '../../common/Modal';
import UserSearch from '../../shared/UserSearch';
import { COLORS } from '../../../lib/constants';
import { MoreVertical } from 'lucide-react-native';

export default function GroupDetailScreen({ route, navigation }) {
  const { groupId } = route.params;
  const { 
    createGroupPost, addGroupMembers, loggedInUser,
    updateGroupMemberRole, removeGroupMember, transferGroupOwnership 
  } = useAuth();

  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts'); // posts, about, members
  
  // Post State
  const [newPostText, setNewPostText] = useState("");
  
  // Member State
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState([]);
  
  // Member Menu State
  const [selectedMember, setSelectedMember] = useState(null); // For showing action sheet

  // 1. Fetch Group Details
  const fetchGroup = async () => {
    const docRef = doc(db, "groups", groupId);
    const snap = await getDoc(docRef);
    if (snap.exists()) setGroup({ id: snap.id, ...snap.data() });
  };

  useEffect(() => {
    fetchGroup();
  }, [groupId]);

  // 2. Subscribe to Posts
  useEffect(() => {
    const postsRef = collection(db, "groups", groupId, "posts");
    const q = query(postsRef, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
        setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [groupId]);

  // --- Handlers ---

  const handlePost = async () => {
      if (!newPostText.trim()) return;
      await createGroupPost(groupId, newPostText);
      setNewPostText("");
  };

  const handleAddMembers = async () => {
      if (selectedEmails.length === 0) return;
      const success = await addGroupMembers(groupId, selectedEmails);
      if (success) {
          Alert.alert("Success", "Members added.");
          setShowAddMember(false);
          fetchGroup(); // Refresh member list
      }
  };

  const getMyRole = () => {
      const me = group?.memberDetails?.find(m => m.uid === loggedInUser.uid);
      return me ? me.role || 'member' : 'member';
  };

  const handleMemberAction = (member, action) => {
      setSelectedMember(null);
      Alert.alert("Confirm", `Are you sure you want to ${action} ${member.name}?`, [
          { text: "Cancel", style: "cancel" },
          { text: "Yes", style: "destructive", onPress: async () => {
              let success = false;
              if (action === 'Remove') success = await removeGroupMember(groupId, member.uid, group.memberDetails, group.members);
              if (action === 'Promote') success = await updateGroupMemberRole(groupId, member.uid, 'admin', group.memberDetails);
              if (action === 'Demote') success = await updateGroupMemberRole(groupId, member.uid, 'member', group.memberDetails);
              if (action === 'Transfer Ownership') success = await transferGroupOwnership(groupId, member.uid, group.memberDetails);
              
              if (success) fetchGroup();
          }}
      ]);
  };

  if (!group) return <View style={styles.center}><Text style={styles.text}>Loading...</Text></View>;

  const myRole = getMyRole();

  // --- RENDER TABS ---

  const renderPosts = () => (
      <View>
          <View style={styles.postInputContainer}>
              <Input 
                placeholder="Share something..." 
                value={newPostText} 
                onChangeText={setNewPostText} 
                style={{ marginBottom: 10 }}
              />
              <Button onPress={handlePost} disabled={!newPostText.trim()}>Post</Button>
          </View>
          
          {posts.map(post => (
              <Card key={post.id} style={styles.postCard}>
                  <View style={styles.postHeader}>
                      <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarInitial}>{post.authorName?.charAt(0)}</Text>
                      </View>
                      <View>
                          <Text style={styles.authorName}>{post.authorName}</Text>
                          <Text style={styles.postDate}>
                              {post.createdAt?.toDate().toLocaleDateString()} {post.createdAt?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </Text>
                      </View>
                  </View>
                  <Text style={styles.postText}>{post.text}</Text>
              </Card>
          ))}
          {posts.length === 0 && <Text style={styles.emptyText}>No posts yet.</Text>}
      </View>
  );

  const renderAbout = () => (
      <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>About this Group</Text>
          <Text style={styles.text}>{group.description || "No description provided."}</Text>
      </View>
  );

  const renderMembers = () => {
      const owners = group.memberDetails?.filter(m => m.role === 'owner') || [];
      const admins = group.memberDetails?.filter(m => m.role === 'admin') || [];
      const members = group.memberDetails?.filter(m => (!m.role || m.role === 'member')) || [];

      const renderList = (title, list) => {
          if (list.length === 0) return null;
          return (
              <View style={{ marginBottom: 20 }}>
                  <Text style={styles.roleTitle}>{title}</Text>
                  {list.map(m => (
                      <View key={m.uid} style={styles.memberRow}>
                          <View style={styles.memberInfo}>
                              <View style={[styles.avatarPlaceholder, { width: 32, height: 32, marginRight: 10 }]}>
                                  <Text style={[styles.avatarInitial, { fontSize: 14 }]}>{m.name?.charAt(0)}</Text>
                              </View>
                              <View>
                                  <Text style={styles.memberName}>{m.name}</Text>
                                  <Text style={styles.memberEmail}>{m.email}</Text>
                              </View>
                          </View>
                          
                          {/* Admin Actions */}
                          {((myRole === 'owner' && m.uid !== loggedInUser.uid) || (myRole === 'admin' && m.role !== 'owner' && m.role !== 'admin' && m.uid !== loggedInUser.uid)) && (
                              <TouchableOpacity onPress={() => setSelectedMember(m)}>
                                  <MoreVertical color="#888" size={20} />
                              </TouchableOpacity>
                          )}
                      </View>
                  ))}
              </View>
          );
      };

      return (
          <View style={styles.tabContent}>
              <View style={styles.memberHeader}>
                  <Text style={styles.sectionTitle}>Members ({group.memberDetails?.length})</Text>
                  {(myRole === 'owner' || myRole === 'admin') && (
                      <Button 
                        style={{ paddingVertical: 5, paddingHorizontal: 10 }} 
                        textStyle={{ fontSize: 12 }} 
                        onPress={() => setShowAddMember(true)}
                      >
                          + Add
                      </Button>
                  )}
              </View>
              {renderList('Owner', owners)}
              {renderList('Admins', admins)}
              {renderList('Members', members)}
          </View>
      );
  };

  return (
    <View style={styles.container}>
        <Header title={group.name} onBack={() => navigation.goBack()} />
        
        {/* Tabs */}
        <View style={styles.tabBar}>
            {['posts', 'about', 'members'].map(tab => (
                <TouchableOpacity 
                    key={tab} 
                    style={[styles.tabItem, activeTab === tab && styles.activeTab]} 
                    onPress={() => setActiveTab(tab)}
                >
                    <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>

        <ScrollView contentContainerStyle={styles.content}>
            {activeTab === 'posts' && renderPosts()}
            {activeTab === 'about' && renderAbout()}
            {activeTab === 'members' && renderMembers()}
        </ScrollView>

        {/* Add Member Modal */}
        <Modal 
            visible={showAddMember} 
            title="Add Members" 
            onClose={() => setShowAddMember(false)}
            actions={<Button onPress={handleAddMembers}>Add Selected</Button>}
        >
            <View style={{ height: 250 }}>
                <UserSearch onSelectionChange={setSelectedEmails} />
            </View>
        </Modal>

        {/* Member Action Sheet (Simulated with Modal for now) */}
        {selectedMember && (
            <Modal visible={true} title={`Manage ${selectedMember.name}`} onClose={() => setSelectedMember(null)}>
                <View style={{ gap: 10 }}>
                    {myRole === 'owner' && selectedMember.role !== 'admin' && (
                        <Button variant="secondary" onPress={() => handleMemberAction(selectedMember, 'Promote')}>Promote to Admin</Button>
                    )}
                    {myRole === 'owner' && selectedMember.role === 'admin' && (
                        <Button variant="secondary" onPress={() => handleMemberAction(selectedMember, 'Demote')}>Demote to Member</Button>
                    )}
                    {myRole === 'owner' && (
                        <Button variant="danger" onPress={() => handleMemberAction(selectedMember, 'Transfer Ownership')}>Transfer Ownership</Button>
                    )}
                    <Button variant="danger" onPress={() => handleMemberAction(selectedMember, 'Remove')}>Remove Member</Button>
                </View>
            </Modal>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  content: { padding: 16 },
  text: { color: 'white' },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 20 },

  // Tabs
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#333' },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { color: '#888', fontSize: 14 },
  activeTabText: { color: COLORS.primary, fontWeight: 'bold' },

  // Posts
  postInputContainer: { marginBottom: 20 },
  postCard: { padding: 15, marginBottom: 15 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  authorName: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  postDate: { color: '#888', fontSize: 11 },
  postText: { color: '#ddd', fontSize: 15, lineHeight: 22 },
  
  avatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: '#555' },
  avatarInitial: { color: 'white', fontWeight: 'bold' },

  // Members
  memberHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  roleTitle: { color: COLORS.primary, fontSize: 12, textTransform: 'uppercase', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 5 },
  memberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#222' },
  memberInfo: { flexDirection: 'row', alignItems: 'center' },
  memberName: { color: 'white', fontSize: 16 },
  memberEmail: { color: '#888', fontSize: 12 },
  
  tabContent: { marginTop: 10 }
});