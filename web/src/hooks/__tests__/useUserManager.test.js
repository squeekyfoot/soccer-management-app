import { renderHook, act } from '@testing-library/react';
import { useUserManager } from '../useUserManager';
import { 
  getDocs, 
  updateDoc, 
  setDoc, 
  getDoc,
  doc // <--- Imported doc
} from 'firebase/firestore';
import { uploadBytes, getDownloadURL } from 'firebase/storage';

// 1. Mock the Firebase SDK modules
jest.mock('firebase/firestore');
jest.mock('firebase/storage');
jest.mock('../../lib/firebase', () => ({
  db: {},
  storage: {}
}));

describe('useUserManager Hook', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // FIX: Tell doc() to return a string so updateDoc receives a valid argument
    doc.mockReturnValue('mock-doc-ref'); 
  });

  test('searchUsers returns filtered list of users', async () => {
    const mockUsers = [
      { id: '1', data: () => ({ playerName: 'John Doe', email: 'john@test.com' }) },
      { id: '2', data: () => ({ playerName: 'Jane Smith', email: 'jane@test.com' }) }
    ];

    getDocs.mockResolvedValue({
      docs: mockUsers
    });

    const { result } = renderHook(() => useUserManager());

    let searchResults;
    await act(async () => {
      searchResults = await result.current.searchUsers('John');
    });

    expect(getDocs).toHaveBeenCalled(); 
    expect(searchResults).toHaveLength(1); 
    expect(searchResults[0].playerName).toBe('John Doe');
  });

  test('updateUserProfile calls Firestore correctly', async () => {
    const { result } = renderHook(() => useUserManager());

    await act(async () => {
      await result.current.updateUserProfile('user-123', { displayName: 'New Name' });
    });

    // FIX: Now expects 'mock-doc-ref' instead of expect.anything() for stricter testing
    expect(updateDoc).toHaveBeenCalledWith('mock-doc-ref', { displayName: 'New Name' });
  });

  test('fetchUserSportsDetails returns data if exists', async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ favoredPosition: 'Striker' })
    });

    const { result } = renderHook(() => useUserManager());

    let details;
    await act(async () => {
      details = await result.current.fetchUserSportsDetails('user-123', 'soccer');
    });

    expect(details).toEqual({ favoredPosition: 'Striker' });
  });

  test('uploadProfileAvatar handles file upload and URL retrieval', async () => {
    const mockFile = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });
    
    uploadBytes.mockResolvedValue({ ref: 'some-ref' });
    getDownloadURL.mockResolvedValue('http://fake-url.com/image.png');

    const { result } = renderHook(() => useUserManager());

    await act(async () => {
      await result.current.uploadProfileAvatar('user-123', mockFile);
    });

    expect(uploadBytes).toHaveBeenCalled();
    expect(getDownloadURL).toHaveBeenCalled();
    // FIX: Expects 'mock-doc-ref' here too
    expect(updateDoc).toHaveBeenCalledWith('mock-doc-ref', { photoURL: 'http://fake-url.com/image.png' });
  });
});