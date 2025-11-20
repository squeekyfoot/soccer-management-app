import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function CalendarView() {
  const { fetchAllUserEvents, loggedInUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (loggedInUser) {
      loadEvents();
    }
  }, [loggedInUser]);

  const loadEvents = async () => {
    setIsLoading(true);
    const data = await fetchAllUserEvents(loggedInUser.uid);
    setEvents(data);
    setIsLoading(false);
  };

  // --- Calendar Logic ---
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    // Create date for last day of month
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(newDate);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty slots for days before the 1st of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} style={{ border: '1px solid #444', minHeight: '80px' }}></div>);
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      // Check for events on this day
      const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const daysEvents = events.filter(e => e.dateTime.startsWith(dateString));

      // Highlight today
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
              backgroundColor: event.type === 'Game' ? '#4caf50' : '#2196f3',
              fontSize: '10px', padding: '2px 4px', borderRadius: '3px',
              marginBottom: '2px', color: 'white', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'
            }}>
              {event.type}: {event.rosterName}
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
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: '1px solid #61dafb', color: '#61dafb', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>
            &lt; Prev
          </button>
          <h3 style={{ margin: 0, width: '150px', textAlign: 'center' }}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button onClick={() => changeMonth(1)} style={{ background: 'none', border: '1px solid #61dafb', color: '#61dafb', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>
            Next &gt;
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
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