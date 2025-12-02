import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; 
import { useChat } from '../../context/ChatContext'; 
import { House, Users, MessageSquare, User, Settings, Dribbble, Lightbulb } from 'lucide-react'; 
import { MOBILE_BREAKPOINT, COLORS } from '../../lib/constants';

function Layout() {
  const { isManager, loggedInUser } = useAuth();
  const { myChats } = useChat(); 
  
  const navigate = useNavigate();
  const location = useLocation();
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

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const NavButton = ({ path, label, icon: Icon, showBadge }) => (
    <button 
      onClick={() => navigate(path)}
      className={`nav-btn ${isActive(path) ? 'active' : ''}`}
      style={{ position: 'relative' }}
    >
      <div style={{ position: 'relative' }}>
        <Icon size={20} />
        {isMobile && showBadge && !isActive('/messages') && unreadTotal > 0 && (
          <div style={{
            position: 'absolute', top: -2, right: -4, width: '8px', height: '8px',
            borderRadius: '50%', backgroundColor: COLORS.primary 
          }} />
        )}
      </div>
      
      <span>{label}</span>
      
      {!isMobile && showBadge && !isActive('/messages') && unreadTotal > 0 && (
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
        <NavButton path="/" label="Home" icon={House} />
        <NavButton path="/community" label="Community" icon={Users} />
        <NavButton path="/myteams" label="My Teams" icon={Dribbble} />
        <NavButton path="/messages" label="Messaging" icon={MessageSquare} showBadge={true} />
        <NavButton path="/profile" label="Profile" icon={User} />
        <NavButton path="/feedback" label="Feedback" icon={Lightbulb} />
        
        {isManager() && (
          <NavButton path="/manager" label="Manager" icon={Settings} />
        )}
      </nav>

      <main className={`main-content ${isMobile ? 'mobile' : ''}`}>
        <Outlet /> 
      </main>
    </div>
  );
}

export default Layout;