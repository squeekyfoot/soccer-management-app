import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; 
import Home from './Home';
import MyProfile from './MyProfile'; 
import ManagerDashboard from './ManagerDashboard'; 
import TeamChat from './TeamChat';
import Groups from './Groups';

import { House, Users, MessageSquare, User, Settings, LogOut } from 'lucide-react';

function Layout() {
  const { isManager, signOutUser } = useAuth();
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
      case 'home': return <Home />;
      case 'groups': return <Groups />;
      case 'messaging': return <TeamChat />;
      case 'profile': return <MyProfile />; 
      case 'manager': return <ManagerDashboard />;
      default: return <Home />;
    }
  };

  const NavButton = ({ view, label, icon: Icon }) => (
    <button 
      onClick={() => setActiveView(view)}
      className={`nav-btn ${activeView === view ? 'active' : ''}`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  // NEW: Determine if the current view needs a fixed height (no page scroll)
  // Only 'messaging' needs to be fixed so the chat bars stay anchored.
  const isFixedView = activeView === 'messaging';

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
        {!isMobile && <h3 style={{ marginTop: 0, marginBottom: '20px', paddingLeft: '10px' }}>Team App</h3>}
        
        <NavButton view="home" label="Home" icon={House} />
        <NavButton view="groups" label="Groups" icon={Users} />
        <NavButton view="messaging" label="Messaging" icon={MessageSquare} />
        <NavButton view="profile" label="Profile" icon={User} />
        
        {isManager() && (
          <NavButton view="manager" label="Manager" icon={Settings} />
        )}
        
        <button onClick={signOutUser} className="nav-btn sign-out-btn">
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </nav>

      {/* NEW: Apply 'fixed-height' class conditionally */}
      <main className={`main-content ${isMobile ? 'mobile' : ''} ${isFixedView ? 'fixed-height' : 'scrollable'}`}>
        {renderActiveView()}
      </main>

    </div>
  );
}

export default Layout;