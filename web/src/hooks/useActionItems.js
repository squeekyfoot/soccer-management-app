import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useSystemNotification } from './useSystemNotification';

export const useActionItems = () => {
  const { loggedInUser } = useAuth();
  const { showNotification } = useSystemNotification();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loggedInUser) {
      setItems([]);
      setLoading(false);
      return;
    }

    // Listener: Fetch all 'pending' items for this user, newest first
    const q = query(
      collection(db, 'actionItems'),
      where('ownerId', '==', loggedInUser.uid),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const fetchedItems = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setItems(fetchedItems);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching action items:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [loggedInUser]);

  /**
   * Dismisses an item by setting status to 'dismissed'.
   * This removes it from the active view but keeps the record.
   */
  const dismissItem = async (itemId) => {
    try {
      const itemRef = doc(db, 'actionItems', itemId);
      await updateDoc(itemRef, {
        status: 'dismissed',
        updatedAt: serverTimestamp()
      });
      showNotification('Item dismissed', 'success');
    } catch (err) {
      console.error("Error dismissing item:", err);
      showNotification('Failed to dismiss item', 'error');
    }
  };

  /**
   * Marks an item as completed (e.g., after accepting an invite).
   */
  const completeItem = async (itemId) => {
    try {
      const itemRef = doc(db, 'actionItems', itemId);
      await updateDoc(itemRef, {
        status: 'completed',
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error completing item:", err);
    }
  };

  return {
    items,
    loading,
    error,
    dismissItem,
    completeItem
  };
};