import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Import the "brain"
import MyProfile from './MyProfile'; // Import the child component
import SportsInfo from './SportsInfo'; // Import the child component

/**
 * This component holds the main "logged in" layout,
 * including the navigation and the content area.
 */
function Layout() {
  // Get the signOut function from our "brain"
  const { signOutUser } = useAuth();

  // This state is now LOCAL to the Layout component,
  // because no other component needs to know about it.
  const [activeView, setActiveView] = useState('profile');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // This effect for resizing is also local to this component.
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // This function decides which child component to render
  const renderActiveView = () => {
    switch (activeView) {
      case 'profile':
        return <MyProfile />; // Show the Profile component
      case 'sports':
        return <SportsInfo />; // Show the Sports component
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

      {/* --- Mobile-Only Header --- */}
      {isMobile && (
        <header className="mobile-header">
          <h1>Team App</h1>
        </header>
      )}

      {/* --- Navigation Sidebar / Tab Bar --- */}
      <nav className={isMobile ? 'tab-bar' : 'sidebar'}>
        {!isMobile && <h3 style={{ marginTop: 0 }}>Team App</h3>}
        
        <button onClick={() => { setActiveView('profile'); }}
          className={activeView === 'profile' ? 'active' : ''}>
          My Profile
        </button>

        <button onClick={() => { setActiveView('sports'); }}
          className={activeView === 'sports' ? 'active' : ''}>
          Sports Info
        </button>
        
        {/* We get signOutUser from the useAuth() hook */}
        <button onClick={signOutUser} className="sign-out-button">
          Sign Out
        </button>
      </nav>

      {/* --- Main Content Area --- */}
      <main className={isMobile ? 'main-content mobile' : 'main-content'}>
        {renderActiveView()}
      </main>

    </div>
  );
}

export default Layout;
