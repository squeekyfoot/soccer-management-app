import { useContext } from 'react';
import { NotificationContext } from '../context/NotificationContext';

export const useSystemNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useSystemNotification must be used within a NotificationProvider');
  }
  return context;
};