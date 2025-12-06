import React, { useState, useEffect } from 'react';
import Header from '../../ui/Header';
import Loading from '../../ui/Loading';
import Modal from '../../ui/Modal'; // Import Modal
import Button from '../../ui/Button'; // Import Button
import Input from '../../ui/Input'; // Import Input
import { useDashboardLogic } from '../../../hooks/useDashboardLogic';
import { useNotifications } from '../../../hooks/useNotifications';
import { useAuth } from '../../../context/AuthContext';
import { useRosterManager } from '../../../hooks/useRosterManager'; 
import NotificationItem from '../../domain/notifications/NotificationItem';

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

const DetailView = ({ section, items, onBack, handlers, notifications, onDismissNotification }) => {
    
    const renderItem = (item) => {
        // --- Handle Notification Items ---
        if (section === 'notifications' && item.type) { 
            if (item.recipientId && item.senderId) {
                return <NotificationItem key={item.id} notification={item} onDismiss={onDismissNotification} />;
            }
        }

        if (section === 'actions' && item.type === 'request') {
            return (
                <div key={item.id} style={styles.itemCard}>
                    <div>
                        <div style={styles.itemTitle}>{item.title}</div>
                        <div style={styles.itemDesc}>{item.description}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => handlers.initiateResponse(item, 'approve')} style={{...styles.btn, backgroundColor: '#4caf50'}}>Accept</button>
                        <button onClick={() => handlers.initiateResponse(item, 'reject')} style={{...styles.btn, backgroundColor: '#f44336'}}>Deny</button>
                    </div>
                </div>
            );
        }

        if (section === 'actions' && item.type === 'todo') {
             return (
                <div key={item.id} style={styles.itemCard}>
                    <div>
                        <div style={styles.itemTitle}>{item.title}</div>
                        <div style={styles.itemDesc}>{item.description}</div>
                    </div>
                    <button style={styles.btnOutline} onClick={() => alert("Navigate to Profile to fix this.")}>Resolve</button>
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

    const displayList = section === 'notifications' ? notifications : items;

    return (
        <div className="view-content fade-in" style={{ height: '100%' }}>
            <button onClick={onBack} style={{ 
                background: 'none', border: 'none', color: '#aaa', marginBottom: '10px', 
                cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' 
            }}>
                 ← Back to Dashboard
            </button>
            <h2 style={{ textTransform: 'capitalize', marginBottom: '15px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                {section === 'opportunities' ? 'New Opportunities' : `${section}`}
            </h2>
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

function Home() {
  const { loading, dashboardStats } = useDashboardLogic();
  const { notifications, unreadCount, dismissNotification } = useNotifications();
  const { respondToRequest, submitJoinRequest } = useAuth();
  const { respondToInvite } = useRosterManager(); 
  
  const [activeSection, setActiveSection] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // --- Modal State ---
  const [actionModal, setActionModal] = useState({ isOpen: false, item: null, action: null });
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading || !dashboardStats) return <Loading />;

  // 1. Triggered by clicking button (Opens UI)
  const initiateResponse = (item, action) => {
      setRejectReason(""); // Reset form
      setActionModal({ isOpen: true, item: item, action: action });
  };

  // 2. Triggered by confirming in Modal (Executes Logic)
  const confirmResponse = async () => {
      const { item, action } = actionModal;
      if (!item) return;

      if (item.isInvite) {
          // New Invite Logic
          if (action === 'approve') {
              await respondToInvite(item.id, true);
          } else {
              await respondToInvite(item.id, false, rejectReason);
          }
      } else {
          // Old Request Logic
          await respondToRequest(item, action);
      }
      
      // Cleanup
      setActionModal({ isOpen: false, item: null, action: null });
  };

  // 3. Simple passthrough for Opportunities
  const handleSubmitJoinRequest = async (rosterId, rosterName, managerId) => {
      await submitJoinRequest(rosterId, rosterName, managerId);
      alert("Request sent!");
  };

  const handlers = {
      initiateResponse,
      submitJoinRequest: handleSubmitJoinRequest
  };

  const gridContainerStyle = isMobile ? {
      display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: '8px'
  } : {
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px'
  };

  // Helper to determine Modal Title/Body
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
      <Header title="Dashboard" style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }} />
      <div className="view-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: isMobile ? '0' : '20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {!activeSection && (
                <div className="fade-in" style={gridContainerStyle}>
                    <DashboardCard title="Actions Needed" count={dashboardStats.actions.total} breakdown={dashboardStats.actions.breakdown} color="#ff5252" onClick={() => setActiveSection('actions')} isMobile={isMobile} />
                    
                    <DashboardCard 
                        title="Notifications" 
                        count={unreadCount} 
                        breakdown={{ 'Unread': unreadCount }} 
                        color="#ffab40" 
                        onClick={() => setActiveSection('notifications')} 
                        isMobile={isMobile} 
                    />

                    <DashboardCard title="Upcoming Events" count={dashboardStats.events.total} breakdown={dashboardStats.events.breakdown} color="#448aff" onClick={() => setActiveSection('events')} isMobile={isMobile} />
                    <DashboardCard title="Opportunities" count={dashboardStats.opportunities.total} breakdown={dashboardStats.opportunities.breakdown} color="#69f0ae" onClick={() => setActiveSection('opportunities')} isMobile={isMobile} />
                </div>
            )}
            {activeSection && (
                <DetailView 
                    section={activeSection} 
                    items={dashboardStats[activeSection]?.items || []} 
                    notifications={notifications} 
                    onDismissNotification={dismissNotification}
                    onBack={() => setActiveSection(null)} 
                    handlers={handlers}
                />
            )}
        </div>
      </div>

      {/* ACTION CONFIRMATION MODAL */}
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
    itemCard: { background: '#252525', padding: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #333' },
    itemTitle: { fontWeight: 'bold', fontSize: '16px', color: '#fff', marginBottom: '4px' },
    itemDesc: { color: '#aaa', fontSize: '13px' },
    btn: { border: 'none', padding: '8px 16px', borderRadius: '6px', color: 'white', fontWeight: 'bold', cursor: 'pointer' },
    btnOutline: { background: 'transparent', border: '1px solid #666', color: '#eee', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }
};

export default Home;