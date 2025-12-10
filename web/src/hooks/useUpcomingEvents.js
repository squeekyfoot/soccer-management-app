import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  limit 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export const useUpcomingEvents = () => {
  const { loggedInUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loggedInUser) {
      setEvents([]);
      setLoading(false);
      return;
    }

    // Query: Events where I am invited, starting in the future
    // NOTE: This query requires a Firestore Composite Index.
    // Check your browser console; Firebase will provide a link to create it automatically.
    // Collection: 'events'
    // Fields: invitees (Arrays) + startDateTime (Ascending)
    
    const now = new Date().toISOString();
    
    const q = query(
      collection(db, 'events'),
      where('invitees', 'array-contains', loggedInUser.uid),
      where('startDateTime', '>=', now),
      orderBy('startDateTime', 'asc'),
      limit(10) 
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const fetchedEvents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEvents(fetchedEvents);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching upcoming events:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [loggedInUser]);

  return { events, loading, error };
};