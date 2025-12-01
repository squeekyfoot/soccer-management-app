import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Header from '../../common/Header';
import Loading from '../../common/Loading';
import { useDashboardLogic } from '../../../hooks/useDashboardLogic';
import { useAuth } from '../../../context/AuthContext';
import { ChevronRight } from 'lucide-react-native';

// --- SUB-COMPONENT: Dashboard Card ---
const DashboardCard = ({ title, count, breakdown, onClick, color }) => (
  <TouchableOpacity 
    onPress={onClick}
    activeOpacity={0.7}
    style={[styles.card, { borderLeftColor: color }]}
  >
    {/* Left Side (Title + Big Number) */}
    <View style={styles.cardHeader}>
        <Text style={styles.countText}>{count}</Text>
        <View style={styles.cardTitleContainer}>
            <Text style={[styles.cardTitle, { color: color }]}>{title}</Text>
        </View>
    </View>

    {/* Right Side (Breakdown stats) */}
    <View style={styles.breakdownContainer}>
        {Object.entries(breakdown).map(([key, val]) => (
            <View key={key} style={styles.statGroup}>
                <Text style={styles.statVal}>{val}</Text>
                <Text style={styles.statLabel}>{key}</Text>
            </View>
        ))}
        <ChevronRight color="#444" size={20} style={{ marginLeft: 10 }} />
    </View>
  </TouchableOpacity>
);

// --- SUB-COMPONENT: Item List Detail ---
const DetailView = ({ section, items, onBack, handlers }) => {
    
    const renderItem = (item) => {
        if (section === 'actions' && item.type === 'request') {
            return (
                <View key={item.id} style={styles.itemCard}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        <Text style={styles.itemDesc}>{item.description}</Text>
                    </View>
                    <View style={styles.actionRow}>
                        <TouchableOpacity onPress={() => handlers.respondToRequest(item, 'approve')} style={[styles.btn, { backgroundColor: '#4caf50' }]}>
                            <Text style={styles.btnText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handlers.respondToRequest(item, 'reject')} style={[styles.btn, { backgroundColor: '#f44336' }]}>
                            <Text style={styles.btnText}>Deny</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        if (section === 'actions' && item.type === 'todo') {
             return (
                <View key={item.id} style={styles.itemCard}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        <Text style={styles.itemDesc}>{item.description}</Text>
                    </View>
                    <TouchableOpacity style={styles.btnOutline} onPress={() => Alert.alert("Navigate", "Go to Profile tab to fix this.")}>
                        <Text style={styles.btnOutlineText}>Resolve</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (section === 'opportunities') {
             return (
                <View key={item.id} style={styles.itemCard}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        <Text style={styles.itemDesc}>{item.description}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handlers.submitJoinRequest(item.id, item.name, item.createdBy)} style={styles.btnOutline}>
                        <Text style={styles.btnOutlineText}>Request Join</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View key={item.id || Math.random()} style={styles.itemCard}>
                <View>
                    <Text style={styles.itemTitle}>{item.title || item.name || item.text}</Text>
                    <Text style={styles.itemDesc}>
                        {item.description || (item.dateTime ? new Date(item.dateTime).toLocaleString() : '')}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.detailContainer}>
             {/* Sub-Header for Detail View */}
             <View style={styles.detailHeader}>
                <TouchableOpacity onPress={onBack}>
                     <Text style={styles.backLink}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.detailTitle}>{section === 'opportunities' ? 'New Opportunities' : section}</Text>
             </View>
            
            <ScrollView contentContainerStyle={styles.listContainer}>
                {items.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No items found in this category.</Text>
                    </View>
                ) : (
                    items.map(item => renderItem(item))
                )}
            </ScrollView>
        </View>
    );
};

// --- MAIN HOME COMPONENT ---
export default function Home() {
  const { loading, dashboardStats } = useDashboardLogic();
  const { respondToRequest, submitJoinRequest } = useAuth();
  const [activeSection, setActiveSection] = useState(null);

  if (loading || !dashboardStats) return <Loading />;

  const actionHandlers = {
      respondToRequest: (request, action) => {
          Alert.alert(
              "Confirm Action",
              `Are you sure you want to ${action} this request?`,
              [
                  { text: "Cancel", style: "cancel" },
                  { text: "Confirm", onPress: () => respondToRequest(request, action) }
              ]
          );
      },
      submitJoinRequest: async (rosterId, rosterName, managerId) => {
          await submitJoinRequest(rosterId, rosterName, managerId);
          Alert.alert("Success", "Request sent!");
      }
  };

  return (
    <View style={styles.container}>
      <Header title="Dashboard" />
      
      {/* Main Layout Logic:
        Using flex: 1 on the container allows it to take up all remaining space 
        between Header and Bottom Tabs.
      */}
      <View style={styles.contentContainer}>
          
          {/* DASHBOARD VIEW */}
          {!activeSection && (
              <View style={styles.cardContainer}>
                  <DashboardCard 
                      title="Actions Needed" 
                      count={dashboardStats.actions.total} 
                      breakdown={dashboardStats.actions.breakdown}
                      color="#ff5252"
                      onClick={() => setActiveSection('actions')}
                  />

                  <DashboardCard 
                      title="Updates Missed" 
                      count={dashboardStats.updates.total} 
                      breakdown={dashboardStats.updates.breakdown}
                      color="#ffab40"
                      onClick={() => setActiveSection('updates')}
                  />

                  <DashboardCard 
                      title="Upcoming Events" 
                      count={dashboardStats.events.total} 
                      breakdown={dashboardStats.events.breakdown}
                      color="#448aff"
                      onClick={() => setActiveSection('events')}
                  />

                  <DashboardCard 
                      title="Opportunities" 
                      count={dashboardStats.opportunities.total} 
                      breakdown={dashboardStats.opportunities.breakdown}
                      color="#69f0ae"
                      onClick={() => setActiveSection('opportunities')}
                  />
              </View>
          )}

          {/* DETAIL VIEW */}
          {activeSection && (
              <DetailView 
                  section={activeSection} 
                  items={dashboardStats[activeSection].items} 
                  onBack={() => setActiveSection(null)} 
                  handlers={actionHandlers}
              />
          )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  contentContainer: {
    flex: 1, // Occupies full space between header and tabs
    padding: 12,
  },
  cardContainer: {
    flex: 1, // Container for the 4 cards
    gap: 12, // Gap between cards
  },
  // CARD STYLES
  card: {
    flex: 1, // EACH CARD TAKES EQUAL VERTICAL SPACE
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    borderLeftWidth: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  countText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  cardTitleContainer: {
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  breakdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  statGroup: {
    alignItems: 'flex-end',
  },
  statVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#eee',
  },
  statLabel: {
    fontSize: 10,
    color: '#777',
    textTransform: 'uppercase',
  },
  // DETAIL STYLES
  detailContainer: {
    flex: 1,
  },
  detailHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#333',
      paddingBottom: 10,
  },
  backLink: {
      color: '#aaa',
      fontSize: 16,
      marginRight: 16,
  },
  detailTitle: {
      color: 'white',
      fontSize: 20,
      fontWeight: 'bold',
      textTransform: 'capitalize',
  },
  listContainer: {
      paddingBottom: 20,
      gap: 12,
  },
  itemCard: {
      backgroundColor: '#252525',
      padding: 16,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#333',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      marginBottom: 10
  },
  itemTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 4,
  },
  itemDesc: {
      fontSize: 12,
      color: '#aaa',
  },
  actionRow: {
      flexDirection: 'row',
      gap: 8,
  },
  btn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
  },
  btnText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 12,
  },
  btnOutline: {
      borderWidth: 1,
      borderColor: '#666',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
  },
  btnOutlineText: {
      color: '#eee',
      fontSize: 12,
  },
  emptyState: {
      padding: 30,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
  },
  emptyStateText: {
      color: '#666',
      fontSize: 14,
  }
});