import { render, screen } from '@testing-library/react';
import App from './App';
import { useAuth } from './context/AuthContext';

// 1. Mock AuthContext
jest.mock('./context/AuthContext');

// 2. Mock React Router with { virtual: true }
// This bypasses the resolution error by telling Jest not to look for the real file.
jest.mock('react-router-dom', () => ({
  Routes: ({ children }) => <div data-testid="routes">{children}</div>,
  Route: () => <div data-testid="route" />,
  Navigate: () => <div data-testid="navigate">Redirected</div>,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' })
}), { virtual: true }); // <--- CRITICAL FIX

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders Loading state when initializing', () => {
    // Simulate loading
    useAuth.mockReturnValue({ isLoading: true, loggedInUser: null });
    
    render(<App />);
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  test('renders Routes when loading is complete', () => {
    // Simulate finished loading
    useAuth.mockReturnValue({ isLoading: false, loggedInUser: null });
    
    render(<App />);
    // Should render the <Routes> container (mocked above)
    expect(screen.getByTestId('routes')).toBeInTheDocument();
  });
});