import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import Header from '../../common/Header';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Input from '../../common/Input';
import Modal from '../../common/Modal';
import { COLORS } from '../../../lib/constants';
import { ThumbsUp, MessageSquare, AlertCircle, CheckCircle, Clock, Plus, ShieldAlert, Edit3, Trash2, PlusCircle } from 'lucide-react-native';

export default function FeedbackScreen({ navigation }) {
  const { 
    subscribeToFeedback, createFeedback, voteForFeedback, 
    updateFeedback, deleteFeedback, addDeveloperNote, 
    loggedInUser, isDeveloper 
  } = useAuth();

  // --- State Hooks ---
  const [feedbackList, setFeedbackList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'detail'
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [activeFilter, setActiveFilter] = useState('Active');
  const [counts, setCounts] = useState({ Active: 0, Completed: 0, Rejected: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form State
  const [newFeedback, setNewFeedback] = useState({ title: "", type: "Suggestion", description: "" });
  
  // Developer State
  const [newNoteText, setNewNoteText] = useState("");
  const [devStatus, setDevStatus] = useState("");
  const [devOverrideMode, setDevOverrideMode] = useState(false);
  const [overrideData, setOverrideData] = useState({ title: "", type: "", description: "" });

  // --- Effects ---

  // 1. Subscribe to Data
  useEffect(() => {
    const unsubscribe = subscribeToFeedback((data) => {
      setFeedbackList(data);
      
      const active = data.filter(i => i.status !== 'Completed' && i.status !== 'Rejected').length;
      const completed = data.filter(i => i.status === 'Completed').length;
      const rejected = data.filter(i => i.status === 'Rejected').length;
      setCounts({ Active: active, Completed: completed, Rejected: rejected });

      // Live update selected item if open
      if (selectedFeedback) {
        const updated = data.find(i => i.id === selectedFeedback.id);
        if (updated) setSelectedFeedback(updated);
      }
    });
    return () => unsubscribe();
  }, [subscribeToFeedback, selectedFeedback]);

  // 2. Filter Logic
  useEffect(() => {
    let filtered = [];
    if (activeFilter === 'Active') {
      filtered = feedbackList.filter(item => item.status !== 'Completed' && item.status !== 'Rejected');
      filtered.sort((a, b) => b.votes - a.votes);
    } else {
      filtered = feedbackList.filter(item => item.status === activeFilter);
      filtered.sort((a, b) => (b.statusUpdatedAt?.toMillis?.() || 0) - (a.statusUpdatedAt?.toMillis?.() || 0));
    }
    setFilteredList(filtered);
  }, [feedbackList, activeFilter]);

  // --- Handlers ---

  const handleCardClick = (item) => {
    setSelectedFeedback(item);
    setDevStatus(item.status || 'Proposed');
    setOverrideData({
        title: item.title,
        type: item.type,
        description: item.description
    });
    setCurrentView('detail');
  };

  const handleVote = async (item) => {
    await voteForFeedback(item.id);
  };

  const handleAddSubmit = async () => {
    if (!newFeedback.title || !newFeedback.description) return;
    const success = await createFeedback(newFeedback);
    if (success) {
      setShowAddModal(false);
      setNewFeedback({ title: "", type: "Suggestion", description: "" });
    }
  };

  // --- Developer Handlers ---

  const handleDevSaveStatus = async () => {
    if (!selectedFeedback) return;
    const success = await updateFeedback(selectedFeedback.id, { status: devStatus });
    if (success) Alert.alert("Success", "Status updated.");
  };

  const handleAddNote = async () => {
    if (!selectedFeedback || !newNoteText.trim()) return;
    const success = await addDeveloperNote(selectedFeedback.id, newNoteText);
    if (success) {
      setNewNoteText("");
      Alert.alert("Success", "Note added.");
    }
  };

  const handleDevOverrideSave = async () => {
    if (!selectedFeedback) return;
    const success = await updateFeedback(selectedFeedback.id, {
        title: overrideData.title,
        type: overrideData.type,
        description: overrideData.description
    });
    if (success) {
        Alert.alert("Success", "Feedback details updated.");
        setDevOverrideMode(false);
    }
  };

  const handleDevDelete = async () => {
    if (!selectedFeedback) return;
    Alert.alert("Delete Feedback?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          const success = await deleteFeedback(selectedFeedback.id);
          if (success) {
            setSelectedFeedback(null);
            setCurrentView('list');
          }
      }}
    ]);
  };

  // --- Helper Components (Render Functions) ---

  const getTypeIcon = (type, size = 16) => {
    switch (type) {
      case 'Bug': return <AlertCircle size={size} color={COLORS.danger} />;
      case 'Suggestion': return <MessageSquare size={size} color={COLORS.primary} />;
      default: return <CheckCircle size={size} color="#888" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Accepted': return COLORS.success;
      case 'In Progress': return '#ffc107';
      case 'Completed': return '#00bcd4';
      case 'Rejected': return COLORS.danger;
      default: return '#888';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // --- Conditional Rendering Logic ---

  const renderDetailView = () => {
    if (!selectedFeedback) return null;
    
    const hasVoted = selectedFeedback.voters?.includes(loggedInUser.uid);
    const isClosed = selectedFeedback.status === 'Completed' || selectedFeedback.status === 'Rejected';
    const sortedNotes = (Array.isArray(selectedFeedback.developerNotes) ? selectedFeedback.developerNotes : [])
        .sort((a, b) => b.createdAt - a.createdAt);

    return (
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Card>
          <View style={styles.detailHeader}>
            <View style={{flex: 1, marginRight: 10}}>
              <Text style={styles.detailTitle}>{selectedFeedback.title}</Text>
              <View style={styles.tagsRow}>
                  <View style={styles.tag}>{getTypeIcon(selectedFeedback.type)}<Text style={styles.tagText}>{selectedFeedback.type}</Text></View>
                  <View style={styles.tag}><Clock size={16} color={getStatusColor(selectedFeedback.status)} /><Text style={[styles.tagText, {color: getStatusColor(selectedFeedback.status)}]}>{selectedFeedback.status}</Text></View>
              </View>
              <Text style={styles.detailDate}>Created: {formatDate(selectedFeedback.createdAt)}</Text>
            </View>
            
            <View style={styles.voteBox}>
              <Text style={styles.voteCount}>{selectedFeedback.votes}</Text>
              <TouchableOpacity 
                onPress={() => handleVote(selectedFeedback)}
                disabled={isClosed}
                style={{ opacity: isClosed ? 0.5 : 1 }}
              >
                  <ThumbsUp size={24} color={hasVoted ? COLORS.primary : '#888'} fill={hasVoted ? COLORS.primary : 'transparent'} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />
          <Text style={styles.descLabel}>Description</Text>
          <Text style={styles.description}>{selectedFeedback.description}</Text>

          {/* Developer Notes */}
          {sortedNotes.length > 0 && (
            <View style={styles.notesSection}>
              <Text style={styles.notesHeader}>Developer Notes</Text>
              {sortedNotes.map((note, idx) => (
                <View key={idx} style={styles.noteCard}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                      <Text style={styles.noteMeta}>{note.author || 'Developer'}</Text>
                      <Text style={styles.noteMeta}>{formatDateTime(note.createdAt)}</Text>
                    </View>
                    <Text style={styles.noteText}>{note.text}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.divider} />
          <Text style={styles.authorFooter}>Submitted by {selectedFeedback.authorName}</Text>
        </Card>

        {/* Developer Controls */}
        {isDeveloper() && (
            <Card style={styles.devControls}>
              <View style={styles.devHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ShieldAlert size={20} color={COLORS.primary} />
                      <Text style={styles.devTitle}>Developer Controls</Text>
                  </View>
                  <TouchableOpacity onPress={() => setDevOverrideMode(!devOverrideMode)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Edit3 size={14} color="#aaa" />
                      <Text style={{ color: '#aaa', fontSize: 12 }}>{devOverrideMode ? "Cancel" : "Override"}</Text>
                  </TouchableOpacity>
              </View>
              
              {/* Override Mode */}
              {devOverrideMode && (
                  <View style={styles.overrideSection}>
                      <Text style={styles.subHeader}>Override Details</Text>
                      <Input label="Title" value={overrideData.title} onChangeText={t => setOverrideData({...overrideData, title: t})} />
                      
                      <Text style={styles.label}>Type</Text>
                      <View style={styles.statusRow}>
                          {['Suggestion', 'Bug', 'General'].map(t => (
                              <TouchableOpacity 
                                  key={t} 
                                  style={[styles.statusOption, overrideData.type === t && styles.activeStatus]}
                                  onPress={() => setOverrideData({...overrideData, type: t})}
                              >
                                  <Text style={[styles.statusText, overrideData.type === t && styles.activeStatusText]}>{t}</Text>
                              </TouchableOpacity>
                          ))}
                      </View>

                      <Input label="Description" value={overrideData.description} onChangeText={t => setOverrideData({...overrideData, description: t})} multiline />
                      <Button onPress={handleDevOverrideSave} style={{ marginTop: 10 }}>Update Content</Button>
                  </View>
              )}

              <Text style={styles.label}>Update Status:</Text>
              <View style={[styles.statusRow, { flexWrap: 'wrap' }]}>
                  {['Proposed', 'Accepted', 'In Progress', 'Completed', 'Rejected'].map(status => (
                      <TouchableOpacity 
                          key={status}
                          style={[styles.statusOption, devStatus === status && styles.activeStatus]}
                          onPress={() => setDevStatus(status)}
                      >
                          <Text style={[styles.statusText, devStatus === status && styles.activeStatusText]}>{status}</Text>
                      </TouchableOpacity>
                  ))}
              </View>
              <Button onPress={handleDevSaveStatus} style={{ marginBottom: 20 }}>Save Status</Button>

              <Text style={styles.label}>Add Developer Note (Public):</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                      <Input 
                          value={newNoteText} 
                          onChangeText={setNewNoteText} 
                          multiline 
                          placeholder="Add a new update..."
                      />
                  </View>
                  <TouchableOpacity onPress={handleAddNote} style={styles.iconBtn}>
                      <PlusCircle size={24} color={COLORS.primary} />
                  </TouchableOpacity>
              </View>
              
              <View style={[styles.divider, { backgroundColor: '#444' }]} />
              <Button variant="secondary" style={{borderColor: COLORS.danger}} onPress={handleDevDelete}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Trash2 size={16} color={COLORS.danger} />
                      <Text style={{color: COLORS.danger}}>Delete Item</Text>
                  </View>
              </Button>
            </Card>
        )}
      </ScrollView>
    );
  };

  const renderListView = () => (
    <>
      <View style={styles.filterBar}>
         {['Active', 'Completed', 'Rejected'].map(tab => (
           <TouchableOpacity 
             key={tab} 
             style={[styles.filterTab, activeFilter === tab && styles.activeFilterTab]}
             onPress={() => setActiveFilter(tab)}
           >
             <Text style={[styles.filterText, activeFilter === tab && styles.activeFilterText]}>{tab} ({counts[tab]})</Text>
           </TouchableOpacity>
         ))}
      </View>

      <FlatList
        data={filteredList}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
           const hasVoted = item.voters?.includes(loggedInUser.uid);
           return (
             <Card onPress={() => handleCardClick(item)}>
               <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                  <View style={{flex:1, marginRight: 10}}>
                     <View style={styles.cardStatusRow}>
                        <Text style={[styles.statusBadge, { color: getStatusColor(item.status), borderColor: getStatusColor(item.status) }]}>
                           {item.status}
                        </Text>
                        <View style={{flexDirection:'row', alignItems:'center', marginLeft: 8}}>
                           {getTypeIcon(item.type, 12)}
                           <Text style={styles.typeText}>{item.type}</Text>
                        </View>
                     </View>
                     <Text style={styles.cardTitle}>{item.title}</Text>
                     <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
                     <Text numberOfLines={2} style={styles.cardDesc}>{item.description}</Text>
                     
                     <View style={styles.cardFooter}>
                        <Text style={styles.cardAuthor}>by {item.authorName}</Text>
                     </View>
                  </View>

                  <View style={styles.cardVote}>
                     <Text style={styles.voteCount}>{item.votes}</Text>
                     <TouchableOpacity onPress={() => handleVote(item)}>
                        <ThumbsUp size={20} color={hasVoted ? COLORS.primary : '#666'} fill={hasVoted ? COLORS.primary : 'transparent'} />
                     </TouchableOpacity>
                  </View>
               </View>
             </Card>
           );
        }}
      />
    </>
  );

  // --- MAIN RETURN ---
  return (
    <View style={styles.container}>
      <Header 
        title={currentView === 'detail' ? "Details" : "Feedback"} 
        actions={
          currentView === 'list' && (
            <TouchableOpacity onPress={() => setShowAddModal(true)}>
              <Plus color="#61dafb" size={24} />
            </TouchableOpacity>
          )
        }
        onBack={currentView === 'detail' ? () => setCurrentView('list') : undefined}
      />

      {currentView === 'detail' ? renderDetailView() : renderListView()}

      <Modal 
        visible={showAddModal} 
        title="Submit Feedback" 
        onClose={() => setShowAddModal(false)}
        actions={<Button onPress={handleAddSubmit}>Submit</Button>}
      >
         <Input label="Title" value={newFeedback.title} onChangeText={t => setNewFeedback({...newFeedback, title: t})} placeholder="Short summary..." />
         <Text style={styles.label}>Type</Text>
         <View style={styles.statusRow}>
            {['Suggestion', 'Bug', 'General'].map(t => (
                <TouchableOpacity 
                    key={t} 
                    style={[styles.statusOption, newFeedback.type === t && styles.activeStatus]}
                    onPress={() => setNewFeedback({...newFeedback, type: t})}
                >
                    <Text style={[styles.statusText, newFeedback.type === t && styles.activeStatusText]}>{t}</Text>
                </TouchableOpacity>
            ))}
         </View>
         <Input label="Description" value={newFeedback.description} onChangeText={t => setNewFeedback({...newFeedback, description: t})} multiline placeholder="Describe your idea..." />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  
  // Filters
  filterBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#333' },
  filterTab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeFilterTab: { borderBottomWidth: 2, borderBottomColor: '#61dafb' },
  filterText: { color: '#888', fontSize: 14 },
  activeFilterText: { color: 'white', fontWeight: 'bold' },

  // Card
  cardStatusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  statusBadge: { fontSize: 10, paddingHorizontal: 6, paddingVertical: 1, borderWidth: 1, borderRadius: 4 },
  typeText: { color: '#aaa', fontSize: 12, marginLeft: 4 },
  cardTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  cardDate: { color: '#666', fontSize: 11, marginBottom: 6 },
  cardDesc: { color: '#ccc', fontSize: 13 },
  cardFooter: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#333' },
  cardAuthor: { color: '#666', fontSize: 11 },
  cardVote: { alignItems: 'center', justifyContent: 'center', paddingLeft: 10, minWidth: 40 },
  voteCount: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },

  // Detail
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  detailTitle: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  detailDate: { color: '#888', fontSize: 12, marginTop: 8 },
  tagsRow: { flexDirection: 'row', gap: 10 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tagText: { color: '#ccc', fontSize: 14 },
  voteBox: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#222', padding: 10, borderRadius: 8 },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 15 },
  descLabel: { color: '#61dafb', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  description: { color: '#ddd', fontSize: 15, lineHeight: 22 },
  authorFooter: { color: '#666', fontSize: 12, textAlign: 'right', marginTop: 10 },

  // Notes
  notesSection: { marginTop: 20 },
  notesHeader: { color: '#61dafb', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  noteCard: { backgroundColor: 'rgba(97, 218, 251, 0.05)', padding: 10, borderRadius: 6, marginBottom: 8, borderLeftWidth: 2, borderLeftColor: '#61dafb' },
  noteMeta: { color: '#666', fontSize: 11, marginBottom: 4 },
  noteText: { color: 'white', fontSize: 14 },

  // Dev
  devControls: { marginTop: 20, borderColor: '#61dafb', borderWidth: 1 },
  devHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  devTitle: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  label: { color: '#ccc', marginBottom: 5, marginTop: 10 },
  
  // Status Selector
  statusRow: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  statusOption: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4, backgroundColor: '#333', borderWidth: 1, borderColor: '#444' },
  activeStatus: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  statusText: { color: '#ccc', fontSize: 12 },
  activeStatusText: { color: '#000', fontWeight: 'bold' },

  overrideSection: { marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#444' },
  subHeader: { color: 'white', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  iconBtn: { justifyContent: 'center', padding: 5 },
});