import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';

function CalendarView() {
  const { fetchAllUserEvents, fetchUserRosters, createEvent, loggedInUser } = useAuth();
  
  // Data State
  const [events, setEvents] = useState([]);
  const [myRosters, setMyRosters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Calendar Visual State
  const [currentDate, setCurrentDate] = useState(new Date());

  // Create Event Form State
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    rosterId: "", // Which team is this for?
    type: "Practice",
    dateTime: "",
    location: "",
    notes: ""
  });

  useEffect(() => {
    if (loggedInUser) {
      loadData();
    }
  }, [loggedInUser]);

  const loadData = async () => {
    setIsLoading(true);
    // Parallel fetch: Get events AND the user's teams (for the dropdown)
    const [eventData, rosterData] = await Promise.all([
      fetchAllUserEvents(loggedInUser.uid),
      fetchUserRosters(loggedInUser.uid)
    ]);
    
    setEvents(eventData);
    setMyRosters(rosterData);
    
    // Set default roster selection if available
    if (rosterData.length > 0) {
      setNewEvent(prev => ({ ...prev, rosterId: rosterData[0].id }));
    }
    
    setIsLoading(false);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.dateTime || !newEvent.location || !newEvent.rosterId) {
      alert("Date, Location, and Team are required.");
      return;
    }

    // We separate rosterId from the event data itself
    const { rosterId, ...eventData } = newEvent;

    const success = await createEvent(rosterId, eventData);
    if (success) {
      alert("Event created!");
      setShowEventForm(false);
      // Reset form
      setNewEvent({ ...newEvent, dateTime: "", location: "", notes: "" });
      // Refresh calendar
      const updatedEvents = await fetchAllUserEvents(loggedInUser.uid);
      setEvents(updatedEvents);
    }
  };

  // --- Calendar Logic ---
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay(); // 0 = Sunday
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(newDate);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty slots
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} style={{ border: '1px solid #444', minHeight: '80px' }}></div>);
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const daysEvents = events.filter(e => e.dateTime.startsWith(dateString));
      const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

      days.push(
        <div key={day} style={{ 
          border: '1px solid #444', minHeight: '80px', padding: '5px',
          backgroundColor: isToday ? '#333' : 'transparent',
          borderColor: isToday ? '#61dafb' : '#444'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{day}</div>
          {daysEvents.map(event => (
            <div key={event.id} style={{ 
              backgroundColor: event.type === 'Game' ? '#ff9800' : '#2196f3', // Orange for Game, Blue for Practice
              fontSize: '10px', padding: '2px 4px', borderRadius: '3px',
              marginBottom: '2px', color: 'white', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'
            }}>
              {event.type.charAt(0)}: {event.rosterName}
            </div>
          ))}
        </div>
      );
    }
    return days;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div style={{ textAlign: 'left', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>My Schedule</h2>
        <button 
          onClick={() => setShowEventForm(!showEventForm)}
          style={{ padding: '10px 15px', backgroundColor: '#61dafb', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '5px' }}
        >
          {showEventForm ? "Cancel" : "+ Add Event"}
        </button>
      </div>

      {/* --- Add Event Form --- */}
      {showEventForm && (
        <div style={{ backgroundColor: '#3a3f4a', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #61dafb' }}>
          <h3 style={{ marginTop: 0 }}>Create New Event</h3>
          <form onSubmit={handleCreateEvent} style={{ display: 'grid', gap: '15px' }}>
            
            {/* Team Selector */}
            <label>
              <span style={{ display: 'block', marginBottom: '5px' }}>Team:</span>
              <select 
                value={newEvent.rosterId}
                onChange={(e) => setNewEvent({...newEvent, rosterId: e.target.value})}
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="" disabled>Select a team</option>
                {myRosters.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <label>
                <span style={{ display: 'block', marginBottom: '5px' }}>Type:</span>
                <select 
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value="Practice">Practice</option>
                  <option value="Morale">Morale</option>
                </select>
              </label>

              <label>
                <span style={{ display: 'block', marginBottom: '5px' }}>Date & Time:</span>
                <input 
                  type="datetime-local" 
                  value={newEvent.dateTime}
                  onChange={(e) => setNewEvent({...newEvent, dateTime: e.target.value})}
                  style={{ width: '100%', padding: '8px' }}
                />
              </label>
            </div>

            <label>
              <span style={{ display: 'block', marginBottom: '5px' }}>Location:</span>
              <input 
                type="text" 
                placeholder="e.g. Field 4 or Pizza Hut"
                value={newEvent.location}
                onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                style={{ width: '100%', padding: '8px' }}
              />
            </label>

            <button type="submit" style={{ padding: '10px', backgroundColor: '#61dafb', border: 'none', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
              Save Event
            </button>
          </form>
        </div>
      )}

      {/* --- Calendar Grid --- */}
      <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
        <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: '1px solid #aaa', color: '#aaa', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>&lt; Prev</button>
        <h3 style={{ margin: 0, minWidth: '150px', textAlign: 'center' }}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <button onClick={() => changeMonth(1)} style={{ background: 'none', border: '1px solid #aaa', color: '#aaa', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>Next &gt;</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0', backgroundColor: '#222' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#1c1e22', borderBottom: '1px solid #444' }}>
            {day}
          </div>
        ))}
        {renderCalendar()}
      </div>

      {/* List View of Upcoming Events */}
      <div style={{ marginTop: '40px' }}>
        <h3>Upcoming Events</h3>
        {isLoading ? <p>Loading...</p> : events.length === 0 ? <p style={{color: '#888'}}>No upcoming events found.</p> : (
          <div style={{ display: 'grid', gap: '10px' }}>
             {events.filter(e => new Date(e.dateTime) >= new Date()).map(event => (
               <div key={event.id} style={{ backgroundColor: '#282c34', padding: '15px', borderRadius: '8px', border: '1px solid #444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                       {new Date(event.dateTime).toLocaleDateString()} @ {new Date(event.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div style={{ color: '#ccc' }}>
                      {event.type} with <strong>{event.rosterName}</strong> at {event.location}
                    </div>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default CalendarView;