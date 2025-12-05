import { renderHook, act } from '@testing-library/react';
import { useRosterManager } from '../useRosterManager';
import { 
  getDocs, 
  addDoc, 
  updateDoc, 
  onSnapshot,
  // 1. Import these so we can mock their return values
  collection, 
  doc,
  arrayUnion
} from 'firebase/firestore';

// Mock External Hooks
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    loggedInUser: { uid: 'manager-123', playerName: 'Boss', email: 'boss@test.com' }
  })
}));

jest.mock('../useGroupManager', () => ({
  useGroupManager: () => ({
    createGroup: jest.fn().mockResolvedValue('group-123')
  })
}));

// Mock Firebase
jest.mock('firebase/firestore');
jest.mock('../../lib/firebase', () => ({ db: {} }));

describe('useRosterManager Hook', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 2. CRITICAL FIX: Make ref generators return values, not undefined.
    // 'expect.anything()' fails if these return undefined.
    collection.mockReturnValue('mock-collection-ref'); 
    doc.mockReturnValue('mock-doc-ref'); 

    // 3. Mock arrayUnion to return a checkable object
    arrayUnion.mockImplementation((val) => ({ method: 'arrayUnion', val }));

    // 4. Ensure addDoc returns a promise resolving to an ID (for createRoster return value)
    addDoc.mockResolvedValue({ id: 'new-roster-id' });
  });

  test('fetchRosters returns mapped data', async () => {
    const mockRosters = [
      { id: 'r1', data: () => ({ name: 'Team A' }) },
      { id: 'r2', data: () => ({ name: 'Team B' }) }
    ];
    getDocs.mockResolvedValue({ docs: mockRosters });

    const { result } = renderHook(() => useRosterManager());
    
    let rosters;
    await act(async () => {
      rosters = await result.current.fetchRosters();
    });

    expect(rosters).toHaveLength(2);
    expect(rosters[0].name).toBe('Team A');
  });

  test('createRoster creates roster, chat, and optional group', async () => {
    const { result } = renderHook(() => useRosterManager());

    const rosterData = { name: 'New Team', season: '2025', maxCapacity: 20 };
    const groupData = { createGroup: true, groupName: 'New Team Group' };

    await act(async () => {
      await result.current.createRoster(rosterData, groupData, true);
    });

    // Check Roster Creation
    // Now expectation will pass because first arg is 'mock-collection-ref' (not undefined)
    expect(addDoc).toHaveBeenCalledWith(
      'mock-collection-ref', 
      expect.objectContaining({
        name: 'New Team',
        managerName: 'Boss',
        playerIDs: ['manager-123']
      })
    );

    // Check Chat Creation
    expect(addDoc).toHaveBeenCalledWith(
        'mock-collection-ref',
        expect.objectContaining({ type: 'roster', name: 'New Team (2025)' })
    );
  });

  test('subscribeToRoster handles real-time updates', () => {
    const { result } = renderHook(() => useRosterManager());
    const mockCallback = jest.fn();
    
    // Mock onSnapshot implementation
    onSnapshot.mockImplementation((ref, callback) => {
      callback({
        exists: () => true,
        id: 'r1',
        data: () => ({ name: 'Realtime Team' })
      });
      return () => {}; // Unsubscribe function
    });

    act(() => {
      result.current.subscribeToRoster('r1', mockCallback);
    });

    expect(mockCallback).toHaveBeenCalledWith({ id: 'r1', name: 'Realtime Team' });
  });

  test('addPlayerToRoster finds user and updates roster', async () => {
      // Mock User Search
      getDocs.mockResolvedValueOnce({
          empty: false,
          docs: [{ id: 'player-99', data: () => ({ playerName: 'Striker', email: 'striker@test.com' }) }]
      });
      
      // Mock Chat Search (for syncing)
      getDocs.mockResolvedValueOnce({
          empty: false,
          docs: [{ ref: 'chat-ref' }]
      });

      const { result } = renderHook(() => useRosterManager());

      await act(async () => {
          await result.current.addPlayerToRoster('roster-1', 'striker@test.com');
      });

      // Expect Update on Roster
      // We check that playerIDs matches the object returned by our arrayUnion mock
      expect(updateDoc).toHaveBeenCalledWith(
          'mock-doc-ref',
          expect.objectContaining({
              playerIDs: { method: 'arrayUnion', val: 'player-99' }
          })
      );
  });
});