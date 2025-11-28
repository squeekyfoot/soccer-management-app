import React, { useState, useEffect } from 'react';
// FIX: Move up 2 levels to reach 'src'
import { useAuth } from '../../context/AuthContext'; 
import { useChat } from '../../context/ChatContext'; 
import { House, Users, MessageSquare, User, Settings, Dribbble, Lightbulb } from 'lucide-react'; 
import { MOBILE_BREAKPOINT, COLORS } from '../../config/constants';

// FIX: Update imports to point to new 'views' structure
import Home from '../views/Home/Home';
import Community from '../views/Community/Community'; // Renamed from Groups
import MyTeams from '../views/MyTeams/MyTeams'; 
import TeamChat from '../views/Messaging/TeamChat';
import MyProfile from '../views/Profile/MyProfile'; 
import Feedback from '../views/Feedback/Feedback'; 
import ManagerDashboard from '../views/Manager/ManagerDashboard'; 

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

  const unreadTotal = myChats.reduce((sum, chat) => {
    if (chat.unreadCounts && loggedInUser && chat.unreadCounts[loggedInUser.uid]) {
      return sum + chat.unreadCounts[loggedInUser.uid];
    }
    return sum;
  }, 0);

  const renderActiveView = () => {
    switch (activeView) {
      case 'home': return <Home />;
      case 'community': return <Community />; // Updated to Community
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
        {isMobile && showBadge && activeView !== 'messaging' && unreadTotal > 0 && (
          <div style={{
            position: 'absolute', top: -2, right: -4, width: '8px', height: '8px',
            borderRadius: '50%', backgroundColor: COLORS.primary 
          }} />
        )}
      </div>
      
      <span>{label}</span>
      
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
      <nav className={isMobile ? 'tab-bar' : 'sidebar'}>
        <NavButton view="home" label="Home" icon={House} />
        <NavButton view="community" label="Community" icon={Users} />
        <NavButton view="myteams" label="My Teams" icon={Dribbble} />
        <NavButton view="messaging" label="Messaging" icon={MessageSquare} showBadge={true} />
        <NavButton view="profile" label="Profile" icon={User} />
        <NavButton view="feedback" label="Feedback" icon={Lightbulb} />
        
        {isManager() && (
          <NavButton view="manager" label="Manager" icon={Settings} />
        )}
      </nav>

      <main className={`main-content ${isMobile ? 'mobile' : ''}`}>
        {renderActiveView()}
      </main>
    </div>
  );
}

export default Layout;