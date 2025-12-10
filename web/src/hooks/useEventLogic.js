import { useState } from 'react';
import { 
  collection, 
  doc, 
  writeBatch, 
  serverTimestamp, 
  query, 
  where, 
  getDocs,
  getDoc,
  deleteDoc,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useSystemNotification } from './useSystemNotification';

export const useEventLogic = () => {
  const { loggedInUser } = useAuth();
  const { showNotification } = useSystemNotification();
  const [loading, setLoading] = useState(false);

  /**
   * Helper to fetch members from Groups/Rosters to add them as individual invitees.
   */
  const expandEntities = async (entities) => {
      const memberIds = new Set();
      
      for (const entity of entities) {
          if (entity.type === 'user') {
              memberIds.add(entity.id);
          } else if (entity.type === 'group') {
              const snap = await getDoc(doc(db, 'groups', entity.id));
              if (snap.exists() && snap.data().members) {
                  snap.data().members.forEach(uid => memberIds.add(uid));
              }
          } else if (entity.type === 'roster') {
              const snap = await getDoc(doc(db, 'rosters', entity.id));
              if (snap.exists() && snap.data().playerIDs) {
                  snap.data().playerIDs.forEach(uid => memberIds.add(uid));
              }
          }
      }
      return Array.from(memberIds);
  };

  /**
   * Creates a new Event.
   * - Expands groups/rosters into invitees.
   * - Adds creator as "Yes".
   * - Sends Action Items.
   */
  const createEvent = async (eventData) => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const creatorId = loggedInUser.uid;

      // 1. Expand Groups/Rosters into individual UIDs
      const entityMemberIds = await expandEntities(eventData.invitedEntities || []);
      
      // 2. Merge with individual invitees and Creator
      const finalInvitees = [...new Set([...(eventData.invitees || []), ...entityMemberIds, creatorId])];

      // 3. Create Event Document
      const eventRef = doc(collection(db, 'events'));
      batch.set(eventRef, {
        ...eventData,
        invitees: finalInvitees,
        // Store linked entities for display
        linkedGroups: (eventData.invitedEntities || []).filter(e => e.type !== 'user'),
        authorId: creatorId,
        createdAt: serverTimestamp(),
        responses: {
            [creatorId]: {
                response: 'yes',
                note: 'Event Organizer',
                timestamp: new Date().toISOString(),
                userAvatar: loggedInUser.photoURL || null,
                userName: loggedInUser.displayName || loggedInUser.playerName || 'Organizer'
            }
        }, 
        updatedAt: serverTimestamp()
      });

      // 4. Create Action Items (Skip Creator)
      if (finalInvitees.length > 0) {
        finalInvitees.forEach((userId) => {
          if (userId === creatorId) return; 

          const actionRef = doc(collection(db, 'actionItems'));
          batch.set(actionRef, {
            type: 'event_invite',
            ownerId: userId,
            relatedEntityId: eventRef.id,
            data: {
              title: `Event Invite: ${eventData.title}`,
              message: `${eventData.type === 'game' ? 'Game' : 'Event'} on ${new Date(eventData.startDateTime).toLocaleDateString()}`
            },
            status: 'pending',
            isDismissable: true,
            createdAt: serverTimestamp()
          });
        });
      }

      await batch.commit();
      showNotification('Event created successfully', 'success');
      return eventRef.id;

    } catch (error) {
      console.error('Error creating event:', error);
      showNotification('Failed to create event', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Adds new users to an existing event.
   */
  const inviteUsersToEvent = async (eventId, eventTitle, newInvitees = []) => {
      if (!newInvitees.length) return;
      setLoading(true);
      try {
          const batch = writeBatch(db);
          
          // 1. Update Event
          const eventRef = doc(db, 'events', eventId);
          batch.update(eventRef, {
              invitees: arrayUnion(...newInvitees)
          });

          // 2. Create Action Items
          newInvitees.forEach((userId) => {
              const actionRef = doc(collection(db, 'actionItems'));
              batch.set(actionRef, {
                  type: 'event_invite',
                  ownerId: userId,
                  relatedEntityId: eventId,
                  data: {
                      title: `Event Invite: ${eventTitle}`,
                      message: `${loggedInUser.playerName} invited you to this event.`
                  },
                  status: 'pending',
                  isDismissable: true,
                  createdAt: serverTimestamp()
              });
          });

          await batch.commit();
          showNotification(`Invited ${newInvitees.length} people!`, 'success');

      } catch (error) {
          console.error("Error inviting users:", error);
          showNotification('Failed to send invites', 'error');
      } finally {
          setLoading(false);
      }
  };

  const updateEvent = async (eventId, currentEventData, updates) => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const eventRef = doc(db, 'events', eventId);

      const isCriticalChange = 
        (updates.startDateTime && updates.startDateTime !== currentEventData.startDateTime) ||
        (updates.location && updates.location !== currentEventData.location);

      const finalUpdates = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      if (isCriticalChange) {
        finalUpdates.responses = {}; 
        
        if (currentEventData.invitees && currentEventData.invitees.length > 0) {
          currentEventData.invitees.forEach((userId) => {
            if (userId === loggedInUser.uid) return;

            const actionRef = doc(collection(db, 'actionItems'));
            batch.set(actionRef, {
              type: 'event_invite',
              ownerId: userId,
              relatedEntityId: eventId,
              data: {
                title: 'Event Update: Details Changed',
                message: `New time/location for ${currentEventData.title}. Please RSVP again.`
              },
              status: 'pending',
              isDismissable: true,
              createdAt: serverTimestamp()
            });
          });
        }
        showNotification('Event updated. RSVPs have been reset.', 'info');
      }

      batch.update(eventRef, finalUpdates);
      await batch.commit();
      if (!isCriticalChange) showNotification('Event updated successfully', 'success');

    } catch (error) {
      console.error('Error updating event:', error);
      showNotification('Failed to update event', 'error');
    } finally {
      setLoading(false);
    }
  };

  const submitRSVP = async (eventId, response, note = '') => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      const eventRef = doc(db, 'events', eventId);
      const responseField = `responses.${loggedInUser.uid}`;
      
      batch.update(eventRef, {
        [responseField]: {
          response, 
          note,
          timestamp: new Date().toISOString(),
          userAvatar: loggedInUser.photoURL || null,
          userName: loggedInUser.displayName || loggedInUser.playerName || 'Unknown'
        }
      });

      // Cleanup Action Item
      const q = query(
        collection(db, 'actionItems'),
        where('ownerId', '==', loggedInUser.uid),
        where('relatedEntityId', '==', eventId),
        where('status', '==', 'pending')
      );

      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((docSnap) => {
        batch.update(docSnap.ref, { 
          status: 'completed',
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
      showNotification('Response sent!', 'success');

    } catch (error) {
      console.error('Error submitting RSVP:', error);
      showNotification('Failed to submit response', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This cannot be undone.')) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'events', eventId));
      showNotification('Event cancelled', 'success');
    } catch (error) {
      console.error('Error deleting event:', error);
      showNotification('Failed to delete event', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getEvent = async (eventId) => {
      try {
          const snap = await getDoc(doc(db, 'events', eventId));
          if (snap.exists()) return { id: snap.id, ...snap.data() };
          return null;
      } catch (err) {
          console.error("Error fetching event:", err);
          return null;
      }
  };

  return {
    createEvent,
    inviteUsersToEvent,
    updateEvent,
    submitRSVP,
    deleteEvent,
    getEvent,
    loading
  };
};