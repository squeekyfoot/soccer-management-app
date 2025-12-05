import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { COLORS } from '../../../lib/constants';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Card from '../../ui/Card';

function Calendar() {
  const { fetchAllUserEvents, fetchUserRosters, createEvent, loggedInUser } = useAuth();
  
  const [events, setEvents] = useState([]);
  const [myRosters, setMyRosters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    rosterId: "", type: "Practice", dateTime: "", location: "", notes: ""
  });

  useEffect(() => {
    if (loggedInUser) loadData();
  }, [loggedInUser]);

  const loadData = async () => {
    setIsLoading(true);
    const [eventData, rosterData] = await Promise.all([
      fetchAllUserEvents(loggedInUser.uid),
      fetchUserRosters(loggedInUser.uid)
    ]);
    setEvents(eventData);
    setMyRosters(rosterData);
    if (rosterData.length > 0) setNewEvent(prev => ({ ...prev, rosterId: rosterData[0].id }));
    setIsLoading(false);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    const { rosterId, ...eventData } = newEvent;
    if (!eventData.dateTime || !eventData.location || !rosterId) return alert("Required fields missing.");

    const success = await createEvent(rosterId, eventData);
    if (success) {
      alert("Event created!");
      setShowEventForm(false);
      setNewEvent({ ...newEvent, dateTime: "", location: "", notes: "" });
      setEvents(await fetchAllUserEvents(loggedInUser.uid));
    }
  };

  // Calendar Helpers
  const getDaysInMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();
  const changeMonth = (offset) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));

  const renderCalendarGrid = () => {
    const totalDays = getDaysInMonth(currentDate);
    const startDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells
    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`empty-${i}`} style={{ border: '1px solid #444', minHeight: '80px' }} />);
    }

    // Date cells
    for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const dayEvents = events.filter(e => e.dateTime.startsWith(dateStr));
        const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

        days.push(
            <div key={day} style={{ border: '1px solid #444', minHeight: '80px', padding: '5px', backgroundColor: isToday ? '#333' : 'transparent', position: 'relative' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px', color: isToday ? COLORS.primary : '#ccc' }}>{day}</div>
                {dayEvents.map(ev => (
                    <div key={ev.id} style={{ 
                        backgroundColor: ev.type === 'Game' ? '#ff9800' : '#2196f3',
                        fontSize: '10px', padding: '2px 4px', borderRadius: '3px', marginBottom: '2px', color: 'white',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
                    }}>
                        {ev.type.charAt(0)}: {ev.rosterName}
                    </div>
                ))}
            </div>
        );
    }
    return days;
  };

  return (
    <div style={{ textAlign: 'left', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>My Schedule</h2>
        <Button onClick={() => setShowEventForm(!showEventForm)}>
          {showEventForm ? "Close Form" : "+ Add Event"}
        </Button>
      </div>

      {showEventForm && (
        <Card style={{ marginBottom: '30px', padding: '20px', border: `1px solid ${COLORS.primary}` }}>
          <h3 style={{ marginTop: 0 }}>Create New Event</h3>
          <form onSubmit={handleCreateEvent} style={{ display: 'grid', gap: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#ccc' }}>Team</label>
                    <select value={newEvent.rosterId} onChange={e => setNewEvent({...newEvent, rosterId: e.target.value})} style={styles.select}>
                        <option value="" disabled>Select Team</option>
                        {myRosters.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#ccc' }}>Type</label>
                    <select value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})} style={styles.select}>
                        <option value="Practice">Practice</option>
                        <option value="Game">Game</option>
                        <option value="Morale">Morale</option>
                    </select>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <Input label="Date & Time" type="datetime-local" value={newEvent.dateTime} onChange={e => setNewEvent({...newEvent, dateTime: e.target.value})} />
                <Input label="Location" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} placeholder="Field 4" />
            </div>
            <Button type="submit">Save Event</Button>
          </form>
        </Card>
      )}

      {/* Controls */}
      <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
        <button onClick={() => changeMonth(-1)} style={styles.navBtn}>&lt; Prev</button>
        <h3 style={{ margin: 0, minWidth: '200px', textAlign: 'center' }}>
          {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
        </h3>
        <button onClick={() => changeMonth(1)} style={styles.navBtn}>Next &gt;</button>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#222' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#1c1e22', borderBottom: '1px solid #444' }}>{d}</div>
        ))}
        {renderCalendarGrid()}
      </div>
    </div>
  );
}

const styles = {
    select: { width: '100%', padding: '10px', backgroundColor: '#333', border: '1px solid #555', borderRadius: '5px', color: 'white' },
    navBtn: { background: 'none', border: '1px solid #aaa', color: '#aaa', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }
};

export default Calendar;