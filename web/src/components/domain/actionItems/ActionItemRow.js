import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, X, ArrowRight, UserPlus } from 'lucide-react';
import styles from './ActionItemRow.module.css';
import Button from '../../ui/Button';

const ActionItemRow = ({ item, onDismiss, customActions }) => {
  const navigate = useNavigate();
  
  // Destructure common fields
  const { type, data, isDismissable } = item;
  
  // Determine Icon & Route based on Type
  const getConfig = () => {
    switch (type) {
      case 'event_invite':
        return {
          icon: <Calendar size={20} className={styles.iconBlue} />,
          label: 'Event Invite',
          path: null, 
          borderClass: styles.blueBorder
        };
      case 'roster_invite':
        return {
          icon: <UserPlus size={20} className={styles.iconGreen} />,
          label: 'Team Invite',
          path: null,
          borderClass: styles.greenBorder
        };
      case 'roster_request':
        return {
          icon: <Users size={20} className={styles.iconGreen} />,
          label: 'Team Request',
          path: `/manager`,
          borderClass: styles.greenBorder
        };
      default:
        return {
          icon: <Users size={20} className={styles.iconGray} />,
          label: 'Notification',
          path: '#',
          borderClass: styles.grayBorder
        };
    }
  };

  const config = getConfig();

  const handleAction = () => {
    if (config.path) {
      navigate(config.path);
    }
  };

  return (
    <div className={`${styles.container} ${config.borderClass}`}>
      <div className={styles.leftSection}>
        {/* Icon Badge */}
        <div className={styles.iconBadge}>
          {config.icon}
        </div>

        {/* Text Content */}
        <div className={styles.textContent}>
          <span className={styles.label}>
            {config.label}
          </span>
          <span className={styles.title}>
            {data?.title || 'New Item'}
          </span>
          {data?.message && (
            <span className={styles.message}>
              {data.message}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {/* 1. Custom Injected Actions (e.g. Accept/Deny Buttons) */}
        {customActions && (
            <div style={{ display: 'flex', gap: '8px', marginRight: '8px' }}>
                {customActions}
            </div>
        )}

        {/* 2. Default "View" Button (if path exists) */}
        {!customActions && config.path && (
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleAction}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
          >
            View <ArrowRight size={14} />
          </Button>
        )}

        {/* 3. Dismiss X */}
        {isDismissable && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(item.id);
            }}
            className={styles.dismissBtn}
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ActionItemRow;