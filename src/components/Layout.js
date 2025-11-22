import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; 
import Home from './Home';
import MyProfile from './MyProfile'; 
import ManagerDashboard from './ManagerDashboard'; 
import TeamChat from './TeamChat';
// NEW: Import Groups
import Groups from './Groups';

function Layout() {
  const { isManager } = useAuth();
  const [activeView, setActiveView] = useState('home');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderActiveView = () => {
    switch (activeView) {
      case 'home':
        return <Home />;
      // NEW: Add Groups case
      case 'groups':
        return <Groups />;
      case 'messaging':
        return <TeamChat />;
      case 'profile':
        return <MyProfile />; 
      case 'manager':
        return <ManagerDashboard />;
      default:
        return <Home />;
    }
  };

  return (
    <div
      style={{
        display: 'flex', width: '100vw', height: '100vh',
        backgroundColor: '#282c34',
        flexDirection: isMobile ? 'column' : 'row'
      }}
    >
      {isMobile && (
        <header className="mobile-header">
          <h1>Team App</h1>
        </header>
      )}

      <nav className={isMobile ? 'tab-bar' : 'sidebar'}>
        {!isMobile && <h3 style={{ marginTop: 0 }}>Team App</h3>}
        
        <button onClick={() => { setActiveView('home'); }}
          className={activeView === 'home' ? 'active' : ''}>
          Home
        </button>

        {/* NEW: Groups Button */}
        <button onClick={() => { setActiveView('groups'); }}
          className={activeView === 'groups' ? 'active' : ''}>
          Groups
        </button>

        <button onClick={() => { setActiveView('messaging'); }}
          className={activeView === 'messaging' ? 'active' : ''}>
          Messaging
        </button>

        <button onClick={() => { setActiveView('profile'); }}
          className={activeView === 'profile' ? 'active' : ''}>
          Profile
        </button>
        
        {isManager() && (
          <button onClick={() => { setActiveView('manager'); }}
            className={activeView === 'manager' ? 'active' : ''}>
            Manager Dashboard
          </button>
        )}
      </nav>

      <main className={isMobile ? 'main-content mobile' : 'main-content'}>
        {renderActiveView()}
      </main>

    </div>
  );
}

export default Layout;