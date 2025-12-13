import { useNavigate } from 'react-router-dom';

// UI Components
import Header from '../../ui/Header';
import Loading from '../../ui/Loading';

// Domain Components
import NotificationItem from '../../domain/notifications/NotificationItem';

// Hooks
import { useNotifications } from '../../../hooks/useNotifications';

function NotificationsView() {
  const navigate = useNavigate();
  
  // Data Hooks
  const { notifications, loading, dismissNotification } = useNotifications();

  if (loading) return <Loading />;

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="view-container">
      <Header 
        title="Notifications" 
        onBack={handleBack}
        style={{ maxWidth: '1100px', margin: '0 auto' }}
      />

      <div className="view-content">
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666', background: '#1a1a1a', borderRadius: '12px' }}>
              No notifications at this time.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px', paddingBottom: '20px' }}>
              {notifications.map(notification => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification} 
                  onDismiss={dismissNotification} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationsView;
