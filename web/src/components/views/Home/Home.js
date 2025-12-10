import React, { useState, useEffect } from 'react';
import Header from '../../ui/Header';
import Loading from '../../ui/Loading';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import Input from '../../ui/Input'; 
import { Plus } from 'lucide-react';

// Hooks
import { useDashboardLogic } from '../../../hooks/useDashboardLogic';
import { useNotifications } from '../../../hooks/useNotifications';
import { useAuth } from '../../../context/AuthContext';
import { useRosterManager } from '../../../hooks/useRosterManager'; 
import { useActionItems } from '../../../hooks/useActionItems';
import { useUpcomingEvents } from '../../../hooks/useUpcomingEvents';
import { useEventLogic } from '../../../hooks/useEventLogic'; // Need this to fetch event details

// Domain Components
import NotificationItem from '../../domain/notifications/NotificationItem';
import ActionItemRow from '../../domain/actionItems/ActionItemRow';
import EventCard from '../../domain/events/EventCard';
import CreateEventForm from '../../domain/events/CreateEventForm';
import EventDetailsModal from '../../domain/events/EventDetailsModal';

// --- 1. Dashboard Card ---
const DashboardCard = ({ title, count, breakdown, onClick, color, isMobile }) => (
  <div 
    onClick={onClick}
    style={{ 
      backgroundColor: '#1e1e1e', 
      padding: isMobile ? '0 16px' : '24px', 
      borderRadius: isMobile ? '8px' : '16px', 
      cursor: 'pointer',
      borderLeft: `5px solid ${color}`,
      boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      display: 'flex',
      flexDirection: isMobile ? 'row' : 'column', 
      justifyContent: 'space-between',
      alignItems: isMobile ? 'center' : 'flex-start',
      flex: isMobile ? '1' : 'unset', 
      minHeight: isMobile ? '0' : '180px', 
      marginBottom: isMobile ? '0' : '0' 
    }}
  >
    <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: isMobile ? 'center' : 'flex-start', gap: isMobile ? '15px' : '0' }}>
        <div style={{ fontSize: isMobile ? '32px' : '56px', fontWeight: '800', color: '#fff', lineHeight: '1' }}>
            {count}
        </div>
        <div>
            <h3 style={{ 
                color: color, 
                fontSize: isMobile ? '13px' : '14px', 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                margin: 0,
                fontWeight: 'bold'
            }}>
                {title}
            </h3>
            {!isMobile && <div style={{ fontSize: '14px', color: '#888', marginTop: '4px' }}>Total Items</div>}
        </div>
    </div>

    <div style={{ 
        marginTop: isMobile ? '0' : '20px', 
        paddingTop: isMobile ? '0' : '16px', 
        borderTop: isMobile ? 'none' : '1px solid #333',
        display: 'flex',
        gap: isMobile ? '15px' : '15px',
        alignItems: 'center'
    }}>
        {breakdown && Object.entries(breakdown).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-end' : 'flex-start' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#eee' }}>{val}</span>
                <span style={{ fontSize: '10px', color: '#777', textTransform: 'uppercase' }}>{key}</span>
            </div>
        ))}
    </div>
  </div>
);

// --- 2. Detail View ---
const DetailView = ({ 
    section, 
    items,
    onBack, 
    handlers, 
    notifications, 
    onDismissNotification,
    actionItems,
    dismissActionItem,
    events,
    onOpenEvent,
    headerAction
}) => {
    
    const renderItem = (item) => {
        if (section === 'notifications') { 
            return <NotificationItem key={item.id} notification={item} onDismiss={onDismissNotification} />;
        }
        
        if (section === 'actions') {
            if (item.ownerId) {
                let customActions = null;
                
                if (item.type === 'roster_invite') {
                    customActions = (
                        <>
                            <Button 
                                onClick={() => handlers.initiateResponse({ ...item, id: item.relatedEntityId, isInvite: true }, 'approve')} 
                                size="sm"
                                style={{backgroundColor: '#4caf50', border: 'none', color: '#fff', fontSize: '12px', padding: '4px 10px'}}
                            >
                                Accept
                            </Button>
                            <Button 
                                onClick={() => handlers.initiateResponse({ ...item, id: item.relatedEntityId, isInvite: true }, 'reject')} 
                                size="sm"
                                style={{backgroundColor: '#f44336', border: 'none', color: '#fff', fontSize: '12px', padding: '4px 10px'}}
                            >
                                Deny
                            </Button>
                        </>
                    );
                } else if (item.type === 'event_invite') {
                    customActions = (
                        <Button 
                            onClick={() => handlers.handleViewEventAction(item)} 
                            size="sm"
                            style={{backgroundColor: '#448aff', border: 'none', color: '#fff', fontSize: '12px', padding: '4px 10px'}}
                        >
                            Details
                        </Button>
                    );
                }

                return (
                    <div key={item.id} style={{ marginBottom: '12px' }}>
                        <ActionItemRow 
                            item={item} 
                            onDismiss={dismissActionItem} 
                            customActions={customActions}
                        />
                    </div>
                );
            }
            
            // Legacy Items Fallback
            return (
                <div key={item.id} style={styles.itemCard}>
                    <div>
                        <div style={styles.itemTitle}>{item.title}</div>
                        <div style={styles.itemDesc}>{item.description}</div>
                    </div>
                    {item.type === 'todo' && (
                         <Button variant="secondary" size="sm" onClick={() => alert("Navigate to Profile to fix this.")}>Resolve</Button>
                    )}
                </div>
            );
        }

        if (section === 'events') {
            return (
                <div key={item.id} style={{ marginBottom: '12px' }}>
                    <EventCard event={item} onOpen={onOpenEvent} />
                </div>
            );
        }

        return (
            <div key={item.id || Math.random()} style={styles.itemCard}>
                <div>
                    <div style={styles.itemTitle}>{item.title || item.name || item.text}</div>
                    <div style={styles.itemDesc}>
                        {item.description || (item.dateTime ? new Date(item.dateTime).toLocaleString() : '')}
                    </div>
                </div>
                {section === 'opportunities' && (
                    <button onClick={() => handlers.submitJoinRequest(item.id, item.name, item.createdBy)} style={styles.btnOutline}>Request Join</button>
                )}
            </div>
        );
    };

    let displayList = [];
    if (section === 'notifications') displayList = notifications;
    else if (section === 'actions') displayList = [...actionItems, ...(items || [])];
    else if (section === 'events') displayList = events;
    else displayList = items;

    return (
        <div className="view-content fade-in" style={{ height: '100%' }}>
            <button onClick={onBack} style={{ 
                background: 'none', border: 'none', color: '#aaa', marginBottom: '10px', 
                cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' 
            }}>
                 ← Back to Dashboard
            </button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                <h2 style={{ textTransform: 'capitalize', margin: 0 }}>
                    {section === 'opportunities' ? 'New Opportunities' : `${section}`}
                </h2>
                {headerAction && (
                    <div>{headerAction}</div>
                )}
            </div>

            <div style={{ display: 'grid', gap: '12px', paddingBottom: '20px' }}>
                {!displayList || displayList.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#666', background: '#1a1a1a', borderRadius: '12px' }}>
                        No items found.
                    </div>
                ) : (
                    displayList.map(item => renderItem(item))
                )}
            </div>
        </div>
    );
};

// --- 3. Main Home Component ---
function Home() {
  const { loading: dashboardLoading, dashboardStats } = useDashboardLogic();
  const { notifications, unreadCount, dismissNotification } = useNotifications();
  const { items: actionItems, loading: actionsLoading, dismissItem: dismissActionItem } = useActionItems();
  const { events, loading: eventsLoading } = useUpcomingEvents();
  const { getEvent } = useEventLogic(); // New Hook for single fetch
  
  const { submitJoinRequest, respondToRequest } = useAuth();
  const { respondToInvite } = useRosterManager();
  
  const [activeSection, setActiveSection] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [actionModal, setActionModal] = useState({ isOpen: false, item: null, action: null });
  const [rejectReason, setRejectReason] = useState("");
  
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [createEventInitialData, setCreateEventInitialData] = useState({}); 
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (dashboardLoading || actionsLoading || eventsLoading) return <Loading />;

  // --- Handlers ---
  const initiateResponse = (item, action) => {
      setRejectReason(""); 
      setActionModal({ isOpen: true, item: item, action: action });
  };

  const confirmResponse = async () => {
      const { item, action } = actionModal;
      if (!item) return;

      if (item.isInvite) {
          await respondToInvite(item.id, action === 'approve', rejectReason);
      } else {
          await respondToRequest(item, action);
      }
      
      setActionModal({ isOpen: false, item: null, action: null });
  };

  const handleSubmitJoinRequest = async (rosterId, rosterName, managerId) => {
      await submitJoinRequest(rosterId, rosterName, managerId);
      alert("Request sent!");
  };

  // New: Handle clicking "Details" on an event invite in Action Items
  const handleViewEventAction = async (actionItem) => {
      if (actionItem.relatedEntityId) {
          // Fetch the full event object fresh
          const eventData = await getEvent(actionItem.relatedEntityId);
          if (eventData) {
              setSelectedEvent(eventData);
          } else {
              alert("Event not found (it may have been cancelled).");
              // Optionally cleanup the dead action item here
          }
      }
  };

  const handlers = {
      initiateResponse,
      submitJoinRequest: handleSubmitJoinRequest,
      handleViewEventAction // passed down to DetailView
  };

  const legacyActionsCount = dashboardStats?.actions?.total || 0;
  const newActionsCount = actionItems.length;
  
  const getCounts = () => {
      return {
          actions: legacyActionsCount + newActionsCount,
          events: events.length,
          notifications: unreadCount,
          opportunities: dashboardStats?.opportunities?.total || 0
      };
  };
  const counts = getCounts();

  const handleOpenCreateEvent = () => {
      setCreateEventInitialData({});
      setIsCreateEventOpen(true);
  };

  const gridContainerStyle = isMobile ? {
      display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: '8px'
  } : {
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px'
  };

  const getModalContent = () => {
      if (!actionModal.item) return {};
      const isReject = actionModal.action === 'reject';
      return {
          title: isReject ? "Decline Request" : "Accept Request",
          description: isReject 
            ? "Are you sure you want to decline this request?" 
            : "Are you sure you want to accept this request?",
          buttonText: isReject ? "Decline" : "Accept",
          buttonColor: isReject ? "danger" : "primary"
      };
  };
  const modalContent = getModalContent();

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* HEADER */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Header title="Dashboard" style={{ margin: 0 }} />
      </div>

      <div className="view-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: isMobile ? '0' : '20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            
            {!activeSection && (
                <div className="fade-in" style={gridContainerStyle}>
                    <DashboardCard 
                        title="Actions Needed" 
                        count={counts.actions} 
                        breakdown={{ 'Pending': counts.actions }} 
                        color="#ff5252" 
                        onClick={() => setActiveSection('actions')} 
                        isMobile={isMobile} 
                    />
                    <DashboardCard 
                        title="Notifications" 
                        count={counts.notifications} 
                        breakdown={{ 'Unread': unreadCount }} 
                        color="#ffab40" 
                        onClick={() => setActiveSection('notifications')} 
                        isMobile={isMobile} 
                    />
                    <DashboardCard 
                        title="Upcoming Events" 
                        count={counts.events} 
                        breakdown={{ 'Scheduled': counts.events }} 
                        color="#448aff" 
                        onClick={() => setActiveSection('events')} 
                        isMobile={isMobile} 
                    />
                    <DashboardCard 
                        title="Opportunities" 
                        count={counts.opportunities} 
                        breakdown={dashboardStats?.opportunities?.breakdown} 
                        color="#69f0ae" 
                        onClick={() => setActiveSection('opportunities')} 
                        isMobile={isMobile} 
                    />
                </div>
            )}

            {activeSection && (
                <DetailView 
                    section={activeSection} 
                    items={dashboardStats[activeSection]?.items || []} 
                    notifications={notifications} 
                    onDismissNotification={dismissNotification}
                    actionItems={actionItems}
                    dismissActionItem={dismissActionItem}
                    events={events}
                    onOpenEvent={setSelectedEvent}
                    onBack={() => setActiveSection(null)} 
                    handlers={handlers}
                    
                    headerAction={activeSection === 'events' ? (
                        <Button 
                            onClick={handleOpenCreateEvent}
                            size="sm"
                            className="flex items-center gap-1"
                        >
                            <Plus size={16} /> New Event
                        </Button>
                    ) : null}
                />
            )}
        </div>
      </div>

      {/* --- MODALS --- */}
      {isCreateEventOpen && (
        <Modal 
            isOpen={isCreateEventOpen} 
            onClose={() => setIsCreateEventOpen(false)}
            title="Create New Event"
        >
            <CreateEventForm 
                initialData={createEventInitialData}
                onSuccess={() => setIsCreateEventOpen(false)}
                onCancel={() => setIsCreateEventOpen(false)}
            />
        </Modal>
      )}

      {selectedEvent && (
        <EventDetailsModal 
            event={selectedEvent}
            isOpen={!!selectedEvent}
            onClose={() => setSelectedEvent(null)}
        />
      )}

      {actionModal.isOpen && (
          <Modal
            title={modalContent.title}
            onClose={() => setActionModal({ isOpen: false, item: null, action: null })}
            actions={
                <Button 
                    variant={modalContent.buttonColor} 
                    onClick={confirmResponse}
                >
                    {modalContent.buttonText}
                </Button>
            }
          >
              <p style={{ color: '#ccc', marginBottom: '20px' }}>
                  {modalContent.description}
              </p>

              {/* Show Input ONLY if it is an Invite Rejection */}
              {actionModal.action === 'reject' && actionModal.item?.isInvite && (
                  <Input 
                    label="Reason (Optional)"
                    multiline
                    placeholder="Share a reason with the manager..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
              )}
          </Modal>
      )}
    </div>
  );
}

const styles = {
    itemCard: { background: '#252525', padding: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #333', marginBottom: '12px' },
    itemTitle: { fontWeight: 'bold', fontSize: '16px', color: '#fff', marginBottom: '4px' },
    itemDesc: { color: '#aaa', fontSize: '13px' },
    btn: { border: 'none', padding: '8px 16px', borderRadius: '6px', color: 'white', fontWeight: 'bold', cursor: 'pointer' },
    btnOutline: { background: 'transparent', border: '1px solid #666', color: '#eee', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }
};

export default Home;