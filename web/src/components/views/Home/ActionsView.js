import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// UI Components
import Header from '../../ui/Header';
import Loading from '../../ui/Loading';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import Input from '../../ui/Input';

// Domain Components
import ActionItemRow from '../../domain/actionItems/ActionItemRow';

// Hooks
import { useActionItems } from '../../../hooks/useActionItems';
import { useRosterManager } from '../../../hooks/useRosterManager';
import { useEventLogic } from '../../../hooks/useEventLogic';
import { useSystemNotification } from '../../../hooks/useSystemNotification';

// Modals
import EventDetailsModal from '../../domain/events/EventDetailsModal';

function ActionsView() {
  const navigate = useNavigate();
  const { showNotification } = useSystemNotification();
  
  // Data Hooks
  const { items: actionItems, loading, dismissItem: dismissActionItem } = useActionItems();
  const { respondToInvite } = useRosterManager();
  const { getEvent } = useEventLogic();

  // Modal State
  const [actionModal, setActionModal] = useState({ isOpen: false, item: null, action: null });
  const [rejectReason, setRejectReason] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);

  if (loading) return <Loading />;

  // --- Handlers ---
  const handleBack = () => {
    navigate('/');
  };

  const initiateResponse = (item, action) => {
    setRejectReason("");
    setActionModal({ isOpen: true, item: item, action: action });
  };

  const confirmResponse = async () => {
    const { item, action } = actionModal;
    if (!item) return;

    if (item.isInvite) {
      await respondToInvite(item.id, action === 'approve', rejectReason);
    }
    
    setActionModal({ isOpen: false, item: null, action: null });
  };

  const handleViewEventAction = async (actionItem) => {
    if (actionItem.relatedEntityId) {
      const eventData = await getEvent(actionItem.relatedEntityId);
      if (eventData) {
        setSelectedEvent(eventData);
      } else {
        showNotification('error', "Event not found (it may have been cancelled).");
      }
    }
  };

  // --- Render Item ---
  const renderActionItem = (item) => {
    let customActions = null;
    
    if (item.type === 'roster_invite') {
      customActions = (
        <>
          <Button 
            onClick={() => initiateResponse({ ...item, id: item.relatedEntityId, isInvite: true }, 'approve')} 
            size="sm"
            style={{backgroundColor: '#4caf50', border: 'none', color: '#fff', fontSize: '12px', padding: '4px 10px'}}
          >
            Accept
          </Button>
          <Button 
            onClick={() => initiateResponse({ ...item, id: item.relatedEntityId, isInvite: true }, 'reject')} 
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
          onClick={() => handleViewEventAction(item)} 
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
    <div className="view-container">
      <Header 
        title="Actions Needed" 
        onBack={handleBack}
        style={{ maxWidth: '1100px', margin: '0 auto' }}
      />

      <div className="view-content">
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {actionItems.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666', background: '#1a1a1a', borderRadius: '12px' }}>
              No actions needed at this time.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px', paddingBottom: '20px' }}>
              {actionItems.map(item => renderActionItem(item))}
            </div>
          )}
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetailsModal 
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {/* Action Response Modal */}
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

export default ActionsView;
