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
            <p style={{fontSize: '0.9rem', color: '#ccc', fontStyle: 'italic'}}>"{payload.message}"</p>
            <div style={{marginTop: '10px', display: 'flex', gap: '10px'}}>
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
            <p style={{fontSize: '0.9rem', color: '#ccc'}}>{payload.message}</p>
            <div style={{marginTop: '10px'}}>
               <Button size="small" variant="primary" onClick={() => navigate('/manager')}>
                  View Roster
               </Button>
            </div>
          </>
        );

      case 'OFFER_REJECTED':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: '1rem' }}>{payload.teamName}</strong>
                <span style={{ 
                    backgroundColor: 'rgba(244, 67, 54, 0.1)', 
                    color: '#f44336', 
                    fontSize: '0.75rem', 
                    padding: '2px 6px', 
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    border: '1px solid rgba(244, 67, 54, 0.3)'
                }}>
                    DECLINED
                </span>
            </div>
            
            <div style={{ fontSize: '0.9rem' }}>
                <span style={{ color: '#888', fontWeight: 'bold' }}>Player: </span>
                <span style={{ color: 'white' }}>{senderName}</span>
            </div>

            {payload.message && (
                <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                    <div style={{ color: '#888', fontWeight: 'bold', marginBottom: '4px' }}>Comment:</div>
                    <div style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                        borderLeft: '3px solid #f44336',
                        padding: '10px 12px', 
                        borderRadius: '0 6px 6px 0',
                        color: '#eee',
                        fontStyle: 'italic',
                        lineHeight: '1.4'
                    }}>
                        "{payload.message}"
                    </div>
                </div>
            )}
          </div>
        );

      default:
        return <p>{payload.message || 'New notification'}</p>;
    }
  };

  return (
    <Card className={`notification-item ${!read ? 'unread' : ''}`} style={{ borderLeft: !read ? '4px solid #3498db' : 'none', marginBottom: '10px', transition: 'border 0.2s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
            {type.replace('_', ' ')}
        </span>
        <span style={{ fontSize: '0.75rem', color: '#888' }}>{dateStr}</span>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        {renderContent()}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #333', paddingTop: '10px' }}>
        <Button size="small" variant="text" onClick={() => onDismiss(notification.id)}>
          Dismiss
        </Button>
      </div>
    </Card>
  );
};

export default NotificationItem;