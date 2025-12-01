/**
 * Calculates a list of missing profile items (To-Dos).
 * @param {Object} user - The user profile object
 * @returns {Array} Array of todo objects
 */
export const calculateProfileTodos = (user) => {
    if (!user) return [];
    
    const todos = [];

    if (!user.photoURL) {
        todos.push({ 
            id: 'photo_missing', 
            type: 'todo', 
            title: 'Add Profile Picture', 
            description: 'Help teammates recognize you.' 
        });
    }

    if (!user.emergencyContact || !user.emergencyContact.phone) {
        todos.push({ 
            id: 'emergency_missing', 
            type: 'todo', 
            title: 'Add Emergency Contact', 
            description: 'Critical for safety requirements.' 
        });
    }

    return todos;
};

/**
 * Filters events occurring between now and X days in the future.
 * @param {Array} events - List of event objects
 * @param {number} days - Number of days to look ahead (default 7)
 * @returns {Array} Filtered list of events
 */
export const filterUpcomingEvents = (events, days = 7) => {
    if (!events || events.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    const futureLimit = new Date(today);
    futureLimit.setDate(today.getDate() + days);
    
    return events.filter(event => {
        const eventDate = new Date(event.dateTime);
        return eventDate >= today && eventDate <= futureLimit;
    });
};

/**
 * Filters opportunities (rosters) to exclude ones the user is already in or owns.
 * @param {Array} rosters - List of discoverable rosters
 * @param {string} userId - The current user's UID
 * @returns {Array} Filtered list of opportunities
 */
export const filterOpportunities = (rosters, userId) => {
    if (!rosters || !userId) return [];

    return rosters.filter(roster => 
        (!roster.playerIDs || !roster.playerIDs.includes(userId)) && 
        roster.createdBy !== userId
    ).map(r => ({
        ...r,
        type: 'team',
        title: r.name,
        description: `${r.season} • ${r.players?.length || 0} Players`
    }));
};

/**
 * Formats incoming roster requests into dashboard items.
 * @param {Array} requests - Raw request objects
 * @returns {Array} Formatted request items
 */
export const formatIncomingRequests = (requests) => {
    if (!requests) return [];
    return requests.map(r => ({
        ...r,
        type: 'request',
        title: `Request: ${r.userName}`,
        description: `Wants to join ${r.rosterName}`
    }));
};

/**
 * Formats user's resolved requests into update items.
 * @param {Array} requests - Raw request objects
 * @returns {Array} Formatted update items
 */
export const formatRecentUpdates = (requests) => {
    if (!requests) return [];
    
    return requests
        .filter(req => req.status !== 'pending')
        .map(r => ({
            ...r,
            type: 'response',
            title: `Request ${r.status}`,
            description: `Your request to join ${r.rosterName} was ${r.status}.`
        }));
};