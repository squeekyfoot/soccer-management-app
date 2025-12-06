import React, { useEffect, useState } from 'react';
import { CheckCircle, Info, AlertCircle } from 'lucide-react';

const ICONS = {
  success: CheckCircle,
  info: Info,
  error: AlertCircle
};

const THEMES = {
  success: { bg: 'rgba(76, 175, 80, 0.95)', border: '#4caf50' },
  info: { bg: 'rgba(33, 150, 243, 0.95)', border: '#2196f3' },
  error: { bg: 'rgba(244, 67, 54, 0.95)', border: '#f44336' }
};

const SystemNotification = ({ notification, onClose }) => {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (notification) {
      // 1. Reset state to ensure instant appearance for new messages
      setIsFading(false);

      // 2. Wait 4 seconds, then trigger the fade-out state
      const fadeTimer = setTimeout(() => {
        setIsFading(true);
      }, 4000);

      // 3. Wait 2 more seconds (6s total) for the animation to finish, then close
      const removeTimer = setTimeout(() => {
        onClose();
      }, 6000);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const { type, message } = notification;
  const Icon = ICONS[type] || ICONS.info;
  const theme = THEMES[type] || THEMES.info;

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        backgroundColor: theme.bg,
        borderLeft: `5px solid ${theme.border}`,
        borderRadius: '8px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        cursor: 'pointer',
        color: 'white',
        minWidth: '280px',
        maxWidth: '400px',
        backdropFilter: 'blur(4px)',
        
        // --- ANIMATION LOGIC ---
        // Opacity 1 (Show) -> Opacity 0 (Hide)
        opacity: isFading ? 0 : 1,
        // Only animate the transition when fading out. 
        // When appearing (isFading=false), transition is 'none' so it's instant.
        transition: isFading ? 'opacity 2s ease-in-out' : 'none'
      }}
    >
      <Icon size={24} color="white" />
      <div>
        <div style={{ fontWeight: 'bold', textTransform: 'capitalize', marginBottom: '2px' }}>
            {type === 'error' ? 'Error' : type}
        </div>
        <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
            {message}
        </div>
      </div>
    </div>
  );
};

export default SystemNotification;