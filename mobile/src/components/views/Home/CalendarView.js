import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, RefreshControl, ScrollView, TouchableOpacity, Modal } from 'react-native';
// FIX: Go up 3 levels to 'src' (Home -> views -> components -> src)
import { useAuth } from '../../../context/AuthContext';
// FIX: Go up 2 levels to 'components' (Home -> views -> components) then into 'common'
import Card from '../../common/Card';
import Button from '../../common/Button';
import Input from '../../common/Input';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
// FIX: Go up 3 levels to 'src'
import { COLORS } from '../../../lib/constants';

export default function CalendarView() {
  const { loggedInUser, fetchAllUserEvents, fetchUserRosters, createEvent } = useAuth();
  
  const [events, setEvents] = useState([]);
  const [myRosters, setMyRosters] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  
  const [newEvent, setNewEvent] = useState({
    rosterId: "",
    type: "Practice",
    dateTime: "",
    location: "",
    notes: ""
  });

  const loadData = useCallback(async () => {
    if (!loggedInUser) return;
    setRefreshing(true);
    try {
      const [eventData, rosterData] = await Promise.all([
        fetchAllUserEvents(loggedInUser.uid),
        fetchUserRosters(loggedInUser.uid)
      ]);
      
      setEvents(eventData);
      setMyRosters(rosterData);
      
      if (rosterData.length > 0) {
         setNewEvent(prev => prev.rosterId ? prev : { ...prev, rosterId: rosterData[0].id });
      }
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setRefreshing(false);
    }
  }, [loggedInUser, fetchAllUserEvents, fetchUserRosters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(newDate);
  };

  const handleCreateSubmit = async () => {
    if (!newEvent.dateTime || !newEvent.location || !newEvent.rosterId) {
      alert("Date, Location, and Team are required.");
      return;
    }
    const { rosterId, ...data } = newEvent;
    const success = await createEvent(rosterId, data);
    if (success) {
      alert("Event created!");
      setShowEventModal(false);
      setNewEvent(prev => ({ ...prev, dateTime: "", location: "", notes: "" }));
      loadData();
    }
  };

  const renderCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const grid = [];
    const totalSlots = Math.ceil((daysInMonth + firstDay) / 7) * 7;

    for (let i = 0; i < totalSlots; i++) {
      const dayNum = i - firstDay + 1;
      const isValidDay = dayNum > 0 && dayNum <= daysInMonth;
      
      let dayEvents = [];
      let isToday = false;

      if (isValidDay) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        dayEvents = events.filter(e => e.dateTime.startsWith(dateStr));
        const now = new Date();
        isToday = (now.getFullYear() === year && now.getMonth() === month && now.getDate() === dayNum);
      }

      grid.push(
        <View key={i} style={[styles.dayCell, isToday && styles.todayCell]}>
          {isValidDay && (
            <>
              <Text style={[styles.dayText, isToday && styles.todayText]}>{dayNum}</Text>
              <View style={styles.dotContainer}>
                {dayEvents.slice(0, 3).map(e => (
                  <View key={e.id} style={[styles.eventDot, { backgroundColor: e.type === 'Game' ? '#ff9800' : '#2196f3' }]} />
                ))}
              </View>
            </>
          )}
        </View>
      );
    }
    return grid;
  };

  const renderEventItem = (item) => (
    <Card key={item.id} style={styles.eventCard}>
      <View style={styles.dateBox}>
        <Text style={styles.dateDay}>{new Date(item.dateTime).getDate()}</Text>
        <Text style={styles.dateMonth}>
          {new Date(item.dateTime).toLocaleDateString('en-US', { month: 'short' })}
        </Text>
      </View>
      <View style={styles.eventInfo}>
        <Text style={styles.eventName} numberOfLines={1}>{item.type}: {item.rosterName}</Text>
        <Text style={styles.eventTime}>
          {new Date(item.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={styles.eventLoc} numberOfLines={1}>@ {item.location}</Text>
      </View>
    </Card>
  );

  return (
    <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={COLORS.primary} />}
    >
        <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>My Schedule</Text>
            <Button 
                onPress={() => setShowEventModal(true)} 
                style={{ paddingVertical: 6, paddingHorizontal: 12, height: 36 }}
                textStyle={{ fontSize: 12 }}
            >
                + Add Event
            </Button>
        </View>

        <Card style={styles.calendarCard}>
            <View style={styles.calHeader}>
                <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
                    <ChevronLeft color="#aaa" size={24} />
                </TouchableOpacity>
                <Text style={styles.monthTitle}>
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
                <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
                    <ChevronRight color="#aaa" size={24} />
                </TouchableOpacity>
            </View>

            <View style={styles.gridRow}>
                {['S','M','T','W','T','F','S'].map((d, i) => (
                    <Text key={i} style={styles.dayHeader}>{d}</Text>
                ))}
            </View>

            <View style={styles.gridContainer}>
                {renderCalendarGrid()}
            </View>
        </Card>

        <View style={styles.section}>
          <Text style={styles.listHeader}>Upcoming Events</Text>
          {events.length === 0 ? (
            <Text style={styles.emptyText}>No upcoming events found.</Text>
          ) : (
            events
                .filter(e => new Date(e.dateTime) >= new Date())
                .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
                .map(item => renderEventItem(item))
          )}
        </View>

        {/* Modal Logic */}
        <Modal 
            visible={showEventModal} 
            animationType="slide" 
            transparent={true} 
            onRequestClose={() => setShowEventModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Create New Event</Text>
                        <TouchableOpacity onPress={() => setShowEventModal(false)}><X color="#aaa" size={24} /></TouchableOpacity>
                    </View>
                    <ScrollView>
                        <Text style={styles.label}>Team</Text>
                        <View style={styles.pickerContainer}>
                            {myRosters.map(r => (
                                <TouchableOpacity 
                                    key={r.id} 
                                    style={[styles.pickerItem, newEvent.rosterId === r.id && styles.activePicker]}
                                    onPress={() => setNewEvent({...newEvent, rosterId: r.id})}
                                >
                                    <Text style={{ color: 'white' }}>{r.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={styles.label}>Type</Text>
                        <View style={styles.row}>
                            {['Practice', 'Morale'].map(t => (
                                <TouchableOpacity key={t} style={[styles.typeBtn, newEvent.type === t && styles.activeType]} onPress={() => setNewEvent({...newEvent, type: t})}>
                                    <Text style={{ color: 'white' }}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Input label="Date (YYYY-MM-DDTHH:MM)" value={newEvent.dateTime} onChangeText={t => setNewEvent({...newEvent, dateTime: t})} placeholder="2025-10-25T18:00" />
                        <Input label="Location" value={newEvent.location} onChangeText={t => setNewEvent({...newEvent, location: t})} />
                        <Button onPress={handleCreateSubmit} style={{ marginTop: 20 }}>Save Event</Button>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  calendarCard: { padding: 10, marginBottom: 30 },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  monthTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  navBtn: { padding: 5 },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  dayHeader: { width: '14.28%', textAlign: 'center', color: '#888', fontWeight: 'bold' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', height: 50, borderTopWidth: 1, borderTopColor: '#333', alignItems: 'center', paddingTop: 5 },
  todayCell: { backgroundColor: '#333' },
  dayText: { color: '#ccc' },
  todayText: { color: COLORS.primary, fontWeight: 'bold' },
  dotContainer: { flexDirection: 'row', gap: 3, marginTop: 4 },
  eventDot: { width: 6, height: 6, borderRadius: 3 },
  listHeader: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginBottom: 10 },
  emptyText: { color: '#888', fontStyle: 'italic' },
  eventCard: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 10 },
  dateBox: { backgroundColor: '#2a2a2a', padding: 8, borderRadius: 8, alignItems: 'center', marginRight: 15, minWidth: 55 },
  dateDay: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  dateMonth: { fontSize: 12, color: '#61dafb', textTransform: 'uppercase', fontWeight: '700' },
  eventInfo: { flex: 1 },
  eventName: { fontSize: 16, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  eventTime: { fontSize: 14, color: '#ccc' },
  eventLoc: { fontSize: 14, color: '#888', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1c1e22', padding: 20, borderRadius: 10, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  label: { color: '#ccc', marginBottom: 8, fontWeight: 'bold' },
  pickerContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15 },
  pickerItem: { padding: 10, borderWidth: 1, borderColor: '#444', borderRadius: 5 },
  activePicker: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  row: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  typeBtn: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#444', borderRadius: 5, alignItems: 'center' },
  activeType: { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
});