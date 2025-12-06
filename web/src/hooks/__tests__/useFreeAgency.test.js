import { renderHook, act } from '@testing-library/react';
import { useFreeAgency } from '../useFreeAgency';
import { useAuth } from '../../context/AuthContext';
// Import the actual functions so we can control their mock behavior
import { collection, doc, updateDoc, getDocs } from 'firebase/firestore';

jest.mock('../../context/AuthContext');
jest.mock('../../lib/firebase', () => ({ db: {} }));

// Define the shape of the mock, but leave implementation empty here
jest.mock('firebase/firestore', () => ({
  __esModule: true,
  collection: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

describe('useFreeAgency', () => {
  const mockUser = {
    uid: 'user123',
    soccerProfile: {
      isFreeAgent: false,
      positions: ['Forward'],
      yearsPlayed: 5,
      skillLevel: 'Intermediate',
      competitionLevel: 'Casual'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ loggedInUser: mockUser });

    // Enforce return values here to survive auto-resets
    collection.mockReturnValue('mock-collection');
    doc.mockReturnValue('mock-doc-ref');
    updateDoc.mockResolvedValue(true);
  });

  test('validateProfileForFreeAgency returns missing fields', () => {
    const { result } = renderHook(() => useFreeAgency());
    const incompleteProfile = { positions: [] };
    const missing = result.current.validateProfileForFreeAgency(incompleteProfile);
    expect(missing).toContain('yearsPlayed');
  });

  test('toggleFreeAgency updates doc when valid', async () => {
    const { result } = renderHook(() => useFreeAgency());

    await act(async () => {
      await result.current.toggleFreeAgency(false, mockUser.soccerProfile);
    });

    // Now strict equality works because doc() returns 'mock-doc-ref'
    expect(updateDoc).toHaveBeenCalledWith(
      'mock-doc-ref',
      expect.objectContaining({
        soccerProfile: expect.objectContaining({ isFreeAgent: true })
      })
    );
  });

  test('toggleFreeAgency throws error when missing required fields', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const invalidProfile = { ...mockUser.soccerProfile, positions: [] };
    const { result } = renderHook(() => useFreeAgency());

    await act(async () => {
      await result.current.toggleFreeAgency(false, invalidProfile);
    });

    expect(updateDoc).not.toHaveBeenCalled();
    expect(result.current.error).toContain('Missing required fields');
    
    consoleSpy.mockRestore();
  });

  test('fetchFreeAgents filters data', async () => {
    const mockPlayers = [
      { id: '1', data: () => ({ soccerProfile: { skillLevel: 'Advanced', positions: ['Forward'] } }) },
      { id: '2', data: () => ({ soccerProfile: { skillLevel: 'Beginner', positions: ['Goalie'] } }) }
    ];
    getDocs.mockResolvedValue({ docs: mockPlayers });
    
    const { result } = renderHook(() => useFreeAgency());
    let players;
    
    await act(async () => {
      players = await result.current.fetchFreeAgents({ skillLevel: 'Advanced' });
    });

    expect(players).toHaveLength(1);
    expect(players[0].soccerProfile.skillLevel).toEqual('Advanced');
  });
});