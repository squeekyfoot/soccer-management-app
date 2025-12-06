import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../ui/Card';
import Button from '../../ui/Button';

const NotificationItem = ({ notification, onDismiss }) => {
  const navigate = useNavigate();
  const { type, payload, senderName, createdAt, read } = notification;

  // Format Date (Simple helper)
  const dateStr = createdAt?.toDate ? createdAt.toDate().toLocaleDateString() : 'Just now';

  // Render Content based on Type
  const renderContent = () => {
    switch (type) {
      case 'PLAYER_REFERRAL':
        return (
          <>
            <p><strong>{senderName}</strong> recommended a player for you.</p>
            <p style={{fontSize: '0.9rem', color: '#555'}}>"{payload.message}"</p>
            <div style={{marginTop: '10px', display: 'flex', gap: '10px'}}>
               {/* Note: We would need a route to view specific player profiles to make this fully functional */}
               <Button size="small" variant="outline" onClick={() => alert("Navigate to player: " + payload.targetPlayerName)}>
                  View Player
               </Button>
            </div>
          </>
        );
      
      case 'OFFER_ACCEPTED':
        return (
          <>
            <p><strong>{payload.teamName}</strong>: Offer Accepted!</p>
            <p style={{fontSize: '0.9rem', color: '#555'}}>{payload.message}</p>
            <div style={{marginTop: '10px'}}>
               <Button size="small" variant="primary" onClick={() => navigate('/manager')}>
                  View Roster
               </Button>
            </div>
          </>
        );

      case 'OFFER_REJECTED':
        return (
          <>
            <p><strong>{payload.teamName}</strong>: Offer Declined.</p>
            <p style={{fontSize: '0.9rem', color: '#555'}}>{payload.message}</p>
          </>
        );

      default:
        return <p>{payload.message || 'New notification'}</p>;
    }
  };

  return (
    <Card className={`notification-item ${!read ? 'unread' : ''}`} style={{ borderLeft: !read ? '4px solid #3498db' : 'none', marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>{type.replace('_', ' ')}</span>
        <span style={{ fontSize: '0.8rem', color: '#888' }}>{dateStr}</span>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        {renderContent()}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button size="small" variant="text" onClick={() => onDismiss(notification.id)}>
          Dismiss
        </Button>
      </div>
    </Card>
  );
};

export default NotificationItem;