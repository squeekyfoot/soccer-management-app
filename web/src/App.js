import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './styles/App.css';
import { useAuth } from './context/AuthContext';

import Layout from './components/layout/Layout';
import AuthPage from './components/auth/AuthPage';
import ReauthModal from './components/auth/ReauthModal';

// View Imports
import Home from './components/views/Home/Home';
import Community from './components/views/Community/Community';
import MyTeams from './components/views/MyTeams/MyTeams';
import Messaging from './components/views/Messaging/Messaging';
import MyProfile from './components/views/Profile/MyProfile';
import Feedback from './components/views/Feedback/Feedback';
import ManagerDashboard from './components/views/Manager/ManagerDashboard';

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
      
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={!loggedInUser ? <AuthPage /> : <Navigate to="/" />} />

        {/* Protected Routes */}
        {loggedInUser ? (
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            
            {/* Community Routes */}
            <Route path="community" element={<Community />} />
            <Route path="community/:groupId" element={<Community />} />

            {/* My Teams Routes */}
            <Route path="myteams" element={<MyTeams />} />
            <Route path="myteams/:rosterId" element={<MyTeams />} />
            
            {/* Messaging Routes */}
            <Route path="messages" element={<Messaging />} />
            <Route path="messages/:chatId" element={<Messaging />} /> 

            <Route path="profile" element={<MyProfile />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="manager" element={<ManagerDashboard />} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </div>
  );
}

export default App;