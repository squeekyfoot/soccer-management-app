import React, { useEffect } from 'react';
import './styles/App.css'; // CHANGED: Point to styles folder
import { useAuth } from './context/AuthContext';

// Components
import Layout from './components/layout/Layout';
import AuthPage from './components/auth/AuthPage';
import ReauthModal from './components/auth/ReauthModal';

function App() {
  const { loggedInUser, isLoading, needsReauth } = useAuth();

  useEffect(() => {
    const handleUnload = () => {};
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="App">
        <header className="App-header">
          <h2>Loading...</h2>
        </header>
      </div>
    );
  }

  return (
    <div className="App">
      {needsReauth && <ReauthModal />}
      {loggedInUser ? <Layout /> : <AuthPage />}
    </div>
  );
}

export default App;