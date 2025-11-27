import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; 
import { useChat } from '../context/ChatContext'; 
import Home from './Home';
import MyProfile from './MyProfile'; 
import ManagerDashboard from './ManagerDashboard'; 
import TeamChat from './TeamChat';
import Groups from './Groups';
import MyTeams from './MyTeams'; 
import Feedback from './Feedback'; 
import { House, Users, MessageSquare, User, Settings, Dribbble, Lightbulb } from 'lucide-react'; 

import { MOBILE_BREAKPOINT, COLORS } from '../constants';

function Layout() {
  const { isManager, loggedInUser } = useAuth();
  const { myChats } = useChat(); 
  const [activeView, setActiveView] = useState('home');
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);

  useEffect(() => {
    const handleResize = () => {
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
      case 'myteams': return <MyTeams />; 
      case 'messaging': return <TeamChat />;
      case 'profile': return <MyProfile />; 
      case 'feedback': return <Feedback />; 
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
            position: 'absolute', top: -2, right: -4, width: '8px', height: '8px',
            borderRadius: '50%', backgroundColor: COLORS.primary 
          }} />
        )}
      </div>
      
      <span>{label}</span>
      
      {/* Desktop Badge */}
      {!isMobile && showBadge && activeView !== 'messaging' && unreadTotal > 0 && (
        <div style={{
          marginLeft: 'auto', marginRight: '10px', width: '8px', height: '8px',
          borderRadius: '50%', backgroundColor: COLORS.primary 
        }} />
      )}
    </button>
  );

  return (
    <div className="App">
      {/* Sidebar / Tab Bar */}
      <nav className={isMobile ? 'tab-bar' : 'sidebar'}>
        <NavButton view="home" label="Home" icon={House} />
        <NavButton view="groups" label="Community" icon={Users} />
        <NavButton view="myteams" label="My Teams" icon={Dribbble} />
        
        <NavButton view="messaging" label="Messaging" icon={MessageSquare} showBadge={true} />
        
        <NavButton view="profile" label="Profile" icon={User} />
        <NavButton view="feedback" label="Feedback" icon={Lightbulb} />
        
        {isManager() && (
          <NavButton view="manager" label="Manager" icon={Settings} />
        )}
      </nav>

      {/* Main Content Area */}
      <main className={`main-content ${isMobile ? 'mobile' : ''}`}>
        {renderActiveView()}
      </main>
    </div>
  );
}

export default Layout;