import { renderHook, act } from '@testing-library/react';
import { useRosterManager } from '../useRosterManager';
import { useAuth } from '../../context/AuthContext';
import { collection, doc, addDoc, updateDoc, getDocs, onSnapshot } from 'firebase/firestore';

jest.mock('../../context/AuthContext');
jest.mock('../../lib/firebase', () => ({ db: {} }));
jest.mock('../useGroupManager', () => ({
  useGroupManager: () => ({ createGroup: jest.fn() })
}));
jest.mock('../useNotifications', () => ({
    useNotifications: () => ({ sendResponseNotification: jest.fn() })
}));

jest.mock('firebase/firestore', () => ({
  __esModule: true,
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  arrayUnion: jest.fn(),
  arrayRemove: jest.fn(),
  deleteField: jest.fn(),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(),
  onSnapshot: jest.fn(), 
}));

describe('useRosterManager Hook', () => {
  const mockUser = { uid: '123', email: 'test@test.com', playerName: 'Coach' };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ loggedInUser: mockUser });

    // Enforce Return Values
    collection.mockReturnValue('mock-collection');
    doc.mockReturnValue('mock-doc-ref');
    onSnapshot.mockReturnValue(jest.fn()); // Returns unsubscribe function
    addDoc.mockResolvedValue({ id: 'new-roster-id' }); // Important for createRoster
    updateDoc.mockResolvedValue(true);
  });

  test('fetchRosters returns mapped data', async () => {
    const mockRosters = [
      { id: 'r1', data: () => ({ name: 'Team A' }) },
      { id: 'r2', data: () => ({ name: 'Team B' }) },
    ];
    getDocs.mockResolvedValue({ docs: mockRosters });

    const { result } = renderHook(() => useRosterManager());
    const rosters = await result.current.fetchRosters();

    expect(rosters).toHaveLength(2);
    expect(rosters[0].name).toEqual('Team A');
  });

  test('createRoster creates roster, chat, and optional group', async () => {
    const { result } = renderHook(() => useRosterManager());

    await act(async () => {
      await result.current.createRoster(
        { name: 'New Team', maxCapacity: 20 },
        { createGroup: true, groupName: 'Team Group' },
        true
      );
    });

    expect(addDoc).toHaveBeenCalledWith(
        'mock-collection', 
        expect.objectContaining({ name: 'New Team' })
    );
  });

  test('addPlayerToRoster finds user and updates roster', async () => {
     getDocs.mockResolvedValueOnce({ 
         empty: false, 
         docs: [{ id: 'player1', data: () => ({ playerName: 'Player One', email: 'p1@test.com' }) }] 
     });
     getDocs.mockResolvedValueOnce({ empty: true }); // Chat query

     const { result } = renderHook(() => useRosterManager());

     await act(async () => {
         await result.current.addPlayerToRoster('roster1', 'p1@test.com');
     });

     expect(updateDoc).toHaveBeenCalled();
  });

  test('subscribeToRoster handles real-time updates', () => {
      const { result } = renderHook(() => useRosterManager());
      const callback = jest.fn();
      
      const unsubscribe = result.current.subscribeToRoster('r1', callback);
      
      expect(typeof unsubscribe).toBe('function');
  });
});