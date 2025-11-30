import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import Card from '../../../common/Card';
import { Check, X } from 'lucide-react-native';
import { COLORS } from '../../../../lib/constants';

export default function IncomingRequests({ requests, onApprove, onDeny }) {
  if (!requests || requests.length === 0) return null;

  const renderRequest = ({ item }) => (
    <Card style={styles.requestCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.reqName}>{item.userName}</Text>
        <Text style={styles.reqDetail}>wants to join {item.rosterName}</Text>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity onPress={() => onApprove(item, 'approve')} style={[styles.iconBtn, { backgroundColor: COLORS.success }]}>
          <Check size={18} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDeny(item, 'deny')} style={[styles.iconBtn, { backgroundColor: COLORS.danger }]}>
          <X size={18} color="white" />
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Incoming Requests ({requests.length})</Text>
      <FlatList 
          data={requests}
          keyExtractor={item => item.id}
          renderItem={renderRequest}
          scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 25 },
  sectionTitle: { color: COLORS.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  requestCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, marginBottom: 8 },
  reqName: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  reqDetail: { color: '#ccc', fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }
});