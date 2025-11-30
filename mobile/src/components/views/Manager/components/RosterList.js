import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Card from '../../../common/Card';
import Button from '../../../common/Button';
import { Trash2, Users } from 'lucide-react-native';
import { COLORS } from '../../../../lib/constants';

export default function RosterList({ rosters, onManage, onDelete, onCreate }) {
  
  const renderRoster = ({ item }) => (
    <Card style={styles.rosterCard}>
      <View style={styles.rosterHeader}>
        <View>
          <Text style={styles.rosterName}>{item.name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.rosterSeason}>
              {item.season} • {item.players?.length || 0} / {item.maxCapacity} players
            </Text>
            {item.isDiscoverable && (
              <View style={styles.publicBadge}>
                <Text style={styles.publicText}>Public</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.cardActions}>
        <Button 
          variant="secondary" 
          style={styles.manageBtn} 
          textStyle={{ fontSize: 12 }}
          onPress={() => onManage(item.id)}
        >
          Manage
        </Button>
        <Button 
          variant="danger" 
          style={styles.deleteBtn} 
          textStyle={{ fontSize: 12 }}
          onPress={() => onDelete(item.id)}
        >
          Delete
        </Button>
      </View>
    </Card>
  );

  return (
    <View>
      <Text style={styles.sectionTitle}>Current Rosters</Text>
      <FlatList
        data={rosters}
        keyExtractor={item => item.id}
        renderItem={renderRoster}
        scrollEnabled={false} // Parent handles scrolling
        ListEmptyComponent={
            <View style={styles.empty}>
                <Users size={48} color="#444" />
                <Text style={styles.emptyText}>You haven't created any teams yet.</Text>
                <Button style={{ marginTop: 20 }} onPress={onCreate}>
                    Create Your First Team
                </Button>
            </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { color: COLORS.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  rosterCard: { padding: 16, marginBottom: 15 },
  rosterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  rosterName: { color: COLORS.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  rosterSeason: { color: '#ccc', fontSize: 14, marginRight: 10 },
  publicBadge: { borderWidth: 1, borderColor: '#555', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 },
  publicText: { color: '#ccc', fontSize: 10 },
  cardActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  manageBtn: { paddingVertical: 6, paddingHorizontal: 15, minWidth: 80 },
  deleteBtn: { paddingVertical: 6, paddingHorizontal: 15, minWidth: 80 },
  empty: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#888', marginTop: 10 }
});