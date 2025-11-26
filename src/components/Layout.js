import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; 
import { useChat } from '../context/ChatContext'; // NEW
import Home from './Home';
import MyProfile from './MyProfile'; 
import ManagerDashboard from './ManagerDashboard'; 
import TeamChat from './TeamChat';
import Groups from './Groups';
import { House, Users, MessageSquare, User, Settings, LogOut } from 'lucide-react';

// NEW: Import Constants
import { MOBILE_BREAKPOINT, COLORS } from '../constants';

function Layout() {
  const { isManager, signOutUser, loggedInUser } = useAuth();
  const { myChats } = useChat(); // NEW: Get chat state from ChatContext
  const [activeView, setActiveView] = useState('home');
  
  // USE CONSTANT
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);

  useEffect(() => {
    const handleResize = () => {
      // USE CONSTANT
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate total unread messages
  const unreadTotal = myChats.reduce((sum, chat) => {
    if (chat.unreadCounts && loggedInUser && chat.unreadCounts[loggedInUser.uid]) {
      return sum + chat.unreadCounts[loggedInUser.uid];
    }
    return sum;
  }, 0);

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

  const NavButton = ({ view, label, icon: Icon, showBadge }) => (
    <button 
      onClick={() => setActiveView(view)}
      className={`nav-btn ${activeView === view ? 'active' : ''}`}
      style={{ position: 'relative' }}
    >
      <div style={{ position: 'relative' }}>
        <Icon size={20} />
        {/* Mobile Badge */}
        {isMobile && showBadge && activeView !== 'messaging' && unreadTotal > 0 && (
          <div style={{
            position: 'absolute',
            top: -2,
            right: -4,
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: COLORS.primary // USE CONSTANT
          }} />
        )}
      </div>
      
      <span>{label}</span>
      
      {/* Desktop Badge */}
      {!isMobile && showBadge && activeView !== 'messaging' && unreadTotal > 0 && (
        <div style={{
          marginLeft: 'auto',
          marginRight: '10px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: COLORS.primary // USE CONSTANT
        }} />
      )}
    </button>
  );

  const isFixedView = activeView === 'messaging';

  return (
    <div
      style={{
        display: 'flex', width: '100vw', height: '100vh',
        backgroundColor: COLORS.background, // USE CONSTANT
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
        <NavButton view="messaging" label="Messaging" icon={MessageSquare} showBadge={true} />
        <NavButton view="profile" label="Profile" icon={User} />
        
        {isManager() && (
          <NavButton view="manager" label="Manager" icon={Settings} />
        )}
        
        <button onClick={signOutUser} className="nav-btn sign-out-btn">
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </nav>

      <main className={`main-content ${isMobile ? 'mobile' : ''} ${isFixedView ? 'fixed-height' : 'scrollable'}`}>
        {renderActiveView()}
      </main>

    </div>
  );
}

export default Layout;