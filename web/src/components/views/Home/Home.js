import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// UI Components
import Header from '../../ui/Header';
import Loading from '../../ui/Loading';

// Domain Components
import DashboardCard from '../../domain/dashboard/DashboardCard';

// Hooks
import { useDashboardLogic } from '../../../hooks/useDashboardLogic';
import { useNotifications } from '../../../hooks/useNotifications';
import { useActionItems } from '../../../hooks/useActionItems';
import { useUpcomingEvents } from '../../../hooks/useUpcomingEvents';

function Home() {
  const navigate = useNavigate();
  
  // Data Hooks
  const { loading: dashboardLoading, dashboardStats } = useDashboardLogic();
  const { unreadCount } = useNotifications();
  const { items: actionItems, loading: actionsLoading } = useActionItems();
  const { events, loading: eventsLoading } = useUpcomingEvents();
  
  // Responsive State
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (dashboardLoading || actionsLoading || eventsLoading) return <Loading />;

  // Calculate counts for dashboard cards
  const legacyActionsCount = dashboardStats?.actions?.total || 0;
  const newActionsCount = actionItems.length;
  
  const counts = {
    actions: legacyActionsCount + newActionsCount,
    events: events.length,
    notifications: unreadCount,
    opportunities: dashboardStats?.opportunities?.total || 0
  };

  const gridContainerStyle = isMobile ? {
    display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: '8px'
  } : {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px'
  };

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* HEADER */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Header title="Dashboard" style={{ margin: 0 }} />
      </div>

      <div className="view-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: isMobile ? '0' : '20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          
          <div className="fade-in" style={gridContainerStyle}>
            <DashboardCard 
              title="Actions Needed" 
              count={counts.actions} 
              breakdown={{ 'Pending': counts.actions }} 
              color="#ff5252" 
              onClick={() => navigate('/actions')} 
              isMobile={isMobile} 
            />
            <DashboardCard 
              title="Notifications" 
              count={counts.notifications} 
              breakdown={{ 'Unread': unreadCount }} 
              color="#ffab40" 
              onClick={() => navigate('/notifications')} 
              isMobile={isMobile} 
            />
            <DashboardCard 
              title="Upcoming Events" 
              count={counts.events} 
              breakdown={{ 'Scheduled': counts.events }} 
              color="#448aff" 
              onClick={() => navigate('/events')} 
              isMobile={isMobile} 
            />
            <DashboardCard 
              title="Opportunities" 
              count={counts.opportunities} 
              breakdown={dashboardStats?.opportunities?.breakdown} 
              color="#69f0ae" 
              onClick={() => navigate('/opportunities')} 
              isMobile={isMobile} 
            />
          </div>

        </div>
      </div>
    </div>
  );
}

export default Home;
