import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '../useNotifications';
import { useAuth } from '../../context/AuthContext';
import { collection, doc, addDoc, updateDoc, onSnapshot } from 'firebase/firestore';

jest.mock('../../context/AuthContext');
jest.mock('../../lib/firebase', () => ({ db: {} }));

jest.mock('firebase/firestore', () => ({
  __esModule: true,
  collection: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  serverTimestamp: jest.fn()
}));

describe('useNotifications', () => {
  const mockUser = { uid: 'u1', playerName: 'Test User' };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ loggedInUser: mockUser });

    // Enforce Return Values
    collection.mockReturnValue('mock-collection');
    doc.mockReturnValue('mock-doc-ref');
    // Ensure onSnapshot returns a cleanup function (preventing the crash)
    onSnapshot.mockReturnValue(jest.fn()); 
  });

  test('sendReferral creates correct document', async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.sendReferral('manager1', 'player2', 'Star Player');
    });

    expect(addDoc).toHaveBeenCalledWith(
      'mock-collection',
      expect.objectContaining({
        recipientId: 'manager1',
        senderId: 'u1',
        type: 'PLAYER_REFERRAL'
      })
    );
  });

  test('markAsRead updates the document', async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.markAsRead('notif123');
    });

    expect(updateDoc).toHaveBeenCalledWith(
        'mock-doc-ref', 
        expect.objectContaining({ read: true })
    );
  });
});