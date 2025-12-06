import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRosterManager } from './useRosterManager';
import { 
    calculateProfileTodos, 
    filterUpcomingEvents, 
    filterOpportunities, 
    formatIncomingRequests, 
    formatRecentUpdates 
} from '../utils/dashboardLogic';

export const useDashboardLogic = () => {
  const { loggedInUser } = useAuth();
  
  const { 
      subscribeToIncomingRequests, 
      subscribeToUserRequests,
      subscribeToMyPendingInvites,
      subscribeToDiscoverableRosters,
      fetchAllUserEvents 
  } = useRosterManager();

  const [incomingRequests, setIncomingRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [myInvites, setMyInvites] = useState([]); 
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Data Acquisition
  useEffect(() => {
    if (!loggedInUser) {
        setLoading(false);
        return;
    }

    setLoading(true);

    const unsubIncoming = subscribeToIncomingRequests(setIncomingRequests);
    const unsubMyRequests = subscribeToUserRequests(setMyRequests);
    const unsubMyInvites = subscribeToMyPendingInvites(setMyInvites); 
    const unsubOpportunities = subscribeToDiscoverableRosters(setOpportunities);

    const loadEvents = async () => {
        try {
            if (fetchAllUserEvents) {
                const events = await fetchAllUserEvents(loggedInUser.uid);
                setUpcomingEvents(events);
            }
        } catch (error) {
            console.error("Failed to load events", error);
        }
    };
    
    loadEvents();

    return () => {
      if (unsubIncoming) unsubIncoming();
      if (unsubMyRequests) unsubMyRequests();
      if (unsubMyInvites) unsubMyInvites();
      if (unsubOpportunities) unsubOpportunities();
    };
  }, [loggedInUser, subscribeToIncomingRequests, subscribeToUserRequests, subscribeToMyPendingInvites, subscribeToDiscoverableRosters, fetchAllUserEvents]);

  // 2. Data Transformation
  const dashboardStats = useMemo(() => {
    if (!loggedInUser) return null;

    // --- Actions ---
    const todoList = calculateProfileTodos(loggedInUser);
    const formattedRequests = formatIncomingRequests(incomingRequests);
    
    const formattedInvites = myInvites.map(invite => ({
        id: invite.id,
        title: `Team Invite: ${invite.rosterName}`,
        description: `Manager ${invite.managerName} invited you. "${invite.message || ''}"`,
        type: 'request',
        isInvite: true, 
        date: invite.createdAt
    }));

    const actionItems = [...formattedInvites, ...formattedRequests, ...todoList];

    // --- Updates ---
    const recentUpdates = formatRecentUpdates(myRequests);

    // --- Events ---
    const eventsNext7Days = filterUpcomingEvents(upcomingEvents, 7);
    const gameCount = eventsNext7Days.filter(e => e.type === 'game').length;

    // --- Opportunities ---
    const newOpportunities = filterOpportunities(opportunities, loggedInUser.uid);

    return {
        actions: {
            total: actionItems.length,
            items: actionItems,
            breakdown: {
                invites: formattedInvites.length,
                requests: formattedRequests.length,
                todos: todoList.length
            }
        },
        // RENAMED: updates -> notifications
        notifications: {
            total: recentUpdates.length,
            items: recentUpdates,
            breakdown: {
                responses: recentUpdates.length,
                alerts: 0 
            }
        },
        events: {
            total: eventsNext7Days.length,
            items: eventsNext7Days,
            breakdown: {
                games: gameCount,
                other: eventsNext7Days.length - gameCount
            }
        },
        opportunities: {
            total: newOpportunities.length,
            items: newOpportunities,
            breakdown: {
                teams: newOpportunities.length,
                groups: 0 
            }
        }
    };
  }, [loggedInUser, incomingRequests, myRequests, myInvites, upcomingEvents, opportunities]);

  return { 
      loading: loading && !dashboardStats, 
      dashboardStats 
  };
};