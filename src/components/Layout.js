import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; 
import MyProfile from './MyProfile'; 
import SportsInfo from './SportsInfo'; 
import ManagerDashboard from './ManagerDashboard'; 
import MyTeams from './MyTeams';
import CalendarView from './CalendarView';
// NEW: Import TeamChat
import TeamChat from './TeamChat';

function Layout() {
  const { signOutUser, isManager } = useAuth();

  const [activeView, setActiveView] = useState('profile');
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
      case 'profile':
        return <MyProfile />; 
      case 'sports':
        return <SportsInfo />; 
      case 'teams':
        return <MyTeams />;
      case 'calendar':
        return <CalendarView />;
      // NEW: Add chat case
      case 'chat':
        return <TeamChat />;
      case 'manager':
        return <ManagerDashboard />;
      default:
        return <MyProfile />;
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
        
        <button onClick={() => { setActiveView('profile'); }}
          className={activeView === 'profile' ? 'active' : ''}>
          My Profile
        </button>

        {/* NEW: Chat Button */}
        <button onClick={() => { setActiveView('chat'); }}
          className={activeView === 'chat' ? 'active' : ''}>
          Chat
        </button>

        <button onClick={() => { setActiveView('calendar'); }}
          className={activeView === 'calendar' ? 'active' : ''}>
          My Schedule
        </button>

        <button onClick={() => { setActiveView('teams'); }}
          className={activeView === 'teams' ? 'active' : ''}>
          My Teams
        </button>

        <button onClick={() => { setActiveView('sports'); }}
          className={activeView === 'sports' ? 'active' : ''}>
          Sports Info
        </button>
        
        {isManager() && (
          <button onClick={() => { setActiveView('manager'); }}
            className={activeView === 'manager' ? 'active' : ''}>
            Manager Dashboard
          </button>
        )}
        
        <button onClick={signOutUser} className="sign-out-button">
          Sign Out
        </button>
      </nav>

      <main className={isMobile ? 'main-content mobile' : 'main-content'}>
        {renderActiveView()}
      </main>

    </div>
  );
}

export default Layout;