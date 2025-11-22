import React, { useEffect } from 'react';
import './App.css';
// NEW: Import our custom hook
import { useAuth } from './context/AuthContext';

// NEW: Import our new components
import Layout from './components/Layout';
import AuthPage from './components/AuthPage';
import ReauthModal from './components/ReauthModal';

/**
 * This is our new App component.
 * It's now a simple "router" that only decides which
 * high-level page to show.
 */
function App() {
  // Get all the global state from our "brain" (AuthContext)
  const { loggedInUser, isLoading, needsReauth } = useAuth();

useEffect(() => {
  const handleUnload = () => {
    // This doesn't delete the app, but it can serve as a 
    // placeholder to forcefully detach listeners if needed.
    // In modern Firebase SDKs, simply letting the page unload
    // is usually sufficient, despite the console error.
  };
  
  window.addEventListener('beforeunload', handleUnload);
  
  return () => {
    window.removeEventListener('beforeunload', handleUnload);
  };
}, []);

  // 1. Show a loading screen while we check for a user
  if (isLoading) {
    return (
      <div className="App">
        <header className="App-header">
          <h2>Loading...</h2>
        </header>
      </div>
    );
  }

  // 2. Render the app
  return (
    <div className="App">
      {/* This is a global modal. If `needsReauth` ever
        becomes true, this modal will appear on top of everything.
      */}
      {needsReauth && <ReauthModal />}

      {/*
        This is our main routing logic:
        - If `loggedInUser` exists, show the main <Layout />.
        - Otherwise, show the <AuthPage />.
      */}
      {loggedInUser ? <Layout /> : <AuthPage />}
    </div>
  );
}

export default App;
