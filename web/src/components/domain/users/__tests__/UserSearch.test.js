import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserSearch from '../UserSearch'; 
import { useUserManager } from '../../../../hooks/useUserManager';

jest.mock('../../../../hooks/useUserManager');

describe('UserSearch Component', () => {
  const mockSearchUsers = jest.fn();

  beforeEach(() => {
    mockSearchUsers.mockClear();
    
    useUserManager.mockReturnValue({
      searchUsers: mockSearchUsers,
      isLoading: false
    });
  });

  test('renders input field', async () => {
    // We must await the initial useEffect to avoid "act" warnings
    mockSearchUsers.mockResolvedValue([]); 
    
    render(<UserSearch onSelectionChange={() => {}} />);
    
    // FIX: Wait for the initial effect to run before finishing the test
    await waitFor(() => {
        expect(mockSearchUsers).toHaveBeenCalled();
    });

    expect(screen.getByPlaceholderText(/search name/i)).toBeInTheDocument();
  });

  test('calls searchUsers on mount', async () => {
    mockSearchUsers.mockResolvedValue([]);
    render(<UserSearch onSelectionChange={() => {}} />);
    
    await waitFor(() => {
        expect(mockSearchUsers).toHaveBeenCalled();
    });
  });

  test('filters suggestions when user types', async () => {
    const fakeUsers = [
      { uid: '1', playerName: 'Messi', email: 'leo@goat.com' },
      { uid: '2', playerName: 'Ronaldo', email: 'cr7@siu.com' }
    ];
    mockSearchUsers.mockResolvedValue(fakeUsers);

    render(<UserSearch onSelectionChange={() => {}} />);

    // Wait for load
    await waitFor(() => expect(mockSearchUsers).toHaveBeenCalled());

    // Type "Messi"
    const input = screen.getByPlaceholderText(/search name/i);
    fireEvent.change(input, { target: { value: 'Messi' } });

    await waitFor(() => {
      expect(screen.getByText('Messi')).toBeInTheDocument();
    });
    
    expect(screen.queryByText('Ronaldo')).not.toBeInTheDocument();
  });

  test('adds a user pill when clicked', async () => {
    const fakeUsers = [{ uid: '1', playerName: 'Messi', email: 'leo@goat.com' }];
    mockSearchUsers.mockResolvedValue(fakeUsers);
    
    const mockOnSelection = jest.fn();
    render(<UserSearch onSelectionChange={mockOnSelection} />);

    // Wait for load
    await waitFor(() => expect(mockSearchUsers).toHaveBeenCalled());

    const input = screen.getByPlaceholderText(/search name/i);
    fireEvent.change(input, { target: { value: 'Messi' } });
    
    const userOption = await screen.findByText('Messi');
    fireEvent.click(userOption);

    expect(screen.getByText('Messi')).toHaveStyle({ backgroundColor: '#0078d4' });
    expect(mockOnSelection).toHaveBeenCalledWith(['leo@goat.com']);
  });
});