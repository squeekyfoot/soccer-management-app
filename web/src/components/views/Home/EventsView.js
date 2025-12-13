import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

// UI Components
import Header from '../../ui/Header';
import Loading from '../../ui/Loading';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';

// Domain Components
import EventCard from '../../domain/events/EventCard';
import CreateEventForm from '../../domain/events/CreateEventForm';
import EventDetailsModal from '../../domain/events/EventDetailsModal';

// Hooks
import { useUpcomingEvents } from '../../../hooks/useUpcomingEvents';

function EventsView() {
  const navigate = useNavigate();
  
  // Data Hooks
  const { events, loading } = useUpcomingEvents();

  // Modal State
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  if (loading) return <Loading />;

  const handleBack = () => {
    navigate('/');
  };

  const handleOpenCreateEvent = () => {
    setIsCreateEventOpen(true);
  };

  return (
    <div className="view-container">
      <Header 
        title="Upcoming Events" 
        onBack={handleBack}
        style={{ maxWidth: '1100px', margin: '0 auto' }}
        actions={
          <Button 
            onClick={handleOpenCreateEvent}
            size="sm"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Plus size={16} /> New Event
          </Button>
        }
      />

      <div className="view-content">
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {events.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666', background: '#1a1a1a', borderRadius: '12px' }}>
              No upcoming events scheduled.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px', paddingBottom: '20px' }}>
              {events.map(event => (
                <div key={event.id} style={{ marginBottom: '12px' }}>
                  <EventCard event={event} onOpen={setSelectedEvent} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Event Modal */}
      {isCreateEventOpen && (
        <Modal 
          isOpen={isCreateEventOpen} 
          onClose={() => setIsCreateEventOpen(false)}
          title="Create New Event"
        >
          <CreateEventForm 
            initialData={{}}
            onSuccess={() => setIsCreateEventOpen(false)}
            onCancel={() => setIsCreateEventOpen(false)}
          />
        </Modal>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetailsModal 
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}

export default EventsView;
