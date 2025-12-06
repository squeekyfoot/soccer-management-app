import { renderHook, act } from '@testing-library/react';
import { useLeagueManager } from '../useLeagueManager';
import { 
  addDoc, getDocs, deleteDoc, updateDoc, 
  collection, doc // Mock these for return values
} from 'firebase/firestore';

// Mock Dependencies
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    loggedInUser: { uid: 'admin-user' }
  })
}));

jest.mock('firebase/firestore');
jest.mock('../../lib/firebase', () => ({ db: {} }));

describe('useLeagueManager Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Return mock refs so calls don't fail with undefined
    collection.mockReturnValue('mock-collection-ref');
    doc.mockReturnValue('mock-doc-ref');
  });

  test('createLeague adds document with timestamp', async () => {
    const { result } = renderHook(() => useLeagueManager());

    await act(async () => {
      await result.current.createLeague({ name: 'Premier League' });
    });

    expect(addDoc).toHaveBeenCalledWith(
      'mock-collection-ref',
      expect.objectContaining({
        name: 'Premier League',
        createdBy: 'admin-user'
      })
    );
  });

  test('deleteLeague calls deleteDoc', async () => {
    // Mock window.confirm
    window.confirm = jest.fn(() => true);

    const { result } = renderHook(() => useLeagueManager());

    await act(async () => {
      await result.current.deleteLeague('league-123');
    });

    expect(deleteDoc).toHaveBeenCalledWith('mock-doc-ref');
  });

  test('fetchLeagues returns mapped data', async () => {
    const mockData = [
      { id: '1', data: () => ({ name: 'League A' }) },
      { id: '2', data: () => ({ name: 'League B' }) }
    ];
    getDocs.mockResolvedValue({ docs: mockData });

    const { result } = renderHook(() => useLeagueManager());
    
    let leagues;
    await act(async () => {
      leagues = await result.current.fetchLeagues();
    });

    expect(leagues).toHaveLength(2);
    expect(leagues[0].name).toBe('League A');
  });
});