import React, { createContext, useState, useCallback } from 'react';
import SystemNotification from '../components/ui/SystemNotification';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  /**
   * Show a system notification
   * @param {'success' | 'info' | 'error'} type 
   * @param {string} message 
   */
  const showNotification = useCallback((type, message) => {
    setNotification({ type, message, id: Date.now() });
  }, []);

  const closeNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {/* Render the Body here so it's always available */}
      <SystemNotification 
        notification={notification} 
        onClose={closeNotification} 
      />
    </NotificationContext.Provider>
  );
};