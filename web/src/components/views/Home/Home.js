import React, { useState, useEffect } from 'react';
import Header from '../../ui/Header';
import Loading from '../../ui/Loading';
import { useDashboardLogic } from '../../../hooks/useDashboardLogic';
import { useAuth } from '../../../context/AuthContext';

// --- SUB-COMPONENT: Dashboard Card ---
const DashboardCard = ({ title, count, breakdown, onClick, color, isMobile }) => (
  <div 
    onClick={onClick}
    style={{ 
      backgroundColor: '#1e1e1e', 
      padding: isMobile ? '0 16px' : '24px', // Reduced vertical padding on mobile to prioritize content fit
      borderRadius: isMobile ? '8px' : '16px', 
      cursor: 'pointer',
      borderLeft: `5px solid ${color}`,
      boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      display: 'flex',
      flexDirection: isMobile ? 'row' : 'column', 
      justifyContent: 'space-between',
      alignItems: isMobile ? 'center' : 'flex-start',
      // MOBILE KEY: 'flex: 1' makes it expand to fill share of vertical space
      flex: isMobile ? '1' : 'unset', 
      minHeight: isMobile ? '0' : '180px', // CRITICAL: Allows flex child to shrink below content size if needed
      marginBottom: isMobile ? '0' : '0' // Remove margins to let gap handle spacing
    }}
  >
    {/* Left Side (Title + Big Number) */}
    <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: isMobile ? 'center' : 'flex-start', gap: isMobile ? '15px' : '0' }}>
        <div style={{ fontSize: isMobile ? '32px' : '56px', fontWeight: '800', color: '#fff', lineHeight: '1' }}>
            {count}
        </div>
        <div>
            <h3 style={{ 
                color: color, 
                fontSize: isMobile ? '13px' : '14px', 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                margin: 0,
                fontWeight: 'bold'
            }}>
                {title}
            </h3>
            {!isMobile && <div style={{ fontSize: '14px', color: '#888', marginTop: '4px' }}>Total Items</div>}
        </div>
    </div>

    {/* Right Side (Breakdown stats) */}
    <div style={{ 
        marginTop: isMobile ? '0' : '20px', 
        paddingTop: isMobile ? '0' : '16px', 
        borderTop: isMobile ? 'none' : '1px solid #333',
        display: 'flex',
        gap: isMobile ? '15px' : '15px',
        alignItems: 'center'
    }}>
        {Object.entries(breakdown).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-end' : 'flex-start' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#eee' }}>{val}</span>
                <span style={{ fontSize: '10px', color: '#777', textTransform: 'uppercase' }}>{key}</span>
            </div>
        ))}
    </div>
  </div>
);

// --- SUB-COMPONENT: Item List Detail ---
const DetailView = ({ section, items, onBack, handlers }) => {
    
    const renderItem = (item) => {
        if (section === 'actions' && item.type === 'request') {
            return (
                <div key={item.id} style={styles.itemCard}>
                    <div>
                        <div style={styles.itemTitle}>{item.title}</div>
                        <div style={styles.itemDesc}>{item.description}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => handlers.respondToRequest(item, 'approve')} style={{...styles.btn, backgroundColor: '#4caf50'}}>Accept</button>
                        <button onClick={() => handlers.respondToRequest(item, 'reject')} style={{...styles.btn, backgroundColor: '#f44336'}}>Deny</button>
                    </div>
                </div>
            );
        }

        if (section === 'actions' && item.type === 'todo') {
             return (
                <div key={item.id} style={styles.itemCard}>
                    <div>
                        <div style={styles.itemTitle}>{item.title}</div>
                        <div style={styles.itemDesc}>{item.description}</div>
                    </div>
                    <button style={styles.btnOutline} onClick={() => alert("Navigate to Profile to fix this.")}>Resolve</button>
                </div>
            );
        }

        if (section === 'opportunities') {
             return (
                <div key={item.id} style={styles.itemCard}>
                    <div>
                        <div style={styles.itemTitle}>{item.title}</div>
                        <div style={styles.itemDesc}>{item.description}</div>
                    </div>
                    <button onClick={() => handlers.submitJoinRequest(item.id, item.name, item.createdBy)} style={styles.btnOutline}>Request Join</button>
                </div>
            );
        }

        return (
            <div key={item.id || Math.random()} style={styles.itemCard}>
                <div>
                    <div style={styles.itemTitle}>{item.title || item.name || item.text}</div>
                    <div style={styles.itemDesc}>
                        {item.description || (item.dateTime ? new Date(item.dateTime).toLocaleString() : '')}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="view-content fade-in" style={{ height: '100%' }}>
            <button onClick={onBack} style={{ 
                background: 'none', 
                border: 'none', 
                color: '#aaa', 
                marginBottom: '10px', 
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                 ← Back to Dashboard
            </button>
            
            <h2 style={{ textTransform: 'capitalize', marginBottom: '15px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                {section === 'opportunities' ? 'New Opportunities' : `${section}`}
            </h2>
            
            <div style={{ display: 'grid', gap: '12px', paddingBottom: '20px' }}>
                {items.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#666', background: '#1a1a1a', borderRadius: '12px' }}>
                        No items found in this category.
                    </div>
                ) : (
                    items.map(item => renderItem(item))
                )}
            </div>
        </div>
    );
};

// --- MAIN HOME COMPONENT ---
function Home() {
  const { loading, dashboardStats } = useDashboardLogic();
  const { respondToRequest, submitJoinRequest } = useAuth();
  const [activeSection, setActiveSection] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading || !dashboardStats) return <Loading />;

  const actionHandlers = {
      respondToRequest: async (request, action) => {
          if(window.confirm(`Are you sure you want to ${action} this request?`)) {
              await respondToRequest(request, action);
          }
      },
      submitJoinRequest: async (rosterId, rosterName, managerId) => {
          await submitJoinRequest(rosterId, rosterName, managerId);
          alert("Request sent!");
      }
  };

  // Dynamic Styles for the Grid Container
  const gridContainerStyle = isMobile ? {
      display: 'flex',
      flexDirection: 'column',
      flex: 1, // FILL REMAINING SPACE
      minHeight: 0, // Allow shrinking
      gap: '8px'
  } : {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '24px'
  };

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header should naturally sit at the top */}
      <Header title="Dashboard" style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }} />
      
      {/* Content wrapper takes all remaining space */}
      <div className="view-content" style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden', // Prevent scroll to force fit
          paddingBottom: isMobile ? '0' : '20px' 
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            
            {/* DASHBOARD VIEW */}
            {!activeSection && (
                <div className="fade-in" style={gridContainerStyle}>
                    
                    <DashboardCard 
                        title="Actions Needed" 
                        count={dashboardStats.actions.total} 
                        breakdown={dashboardStats.actions.breakdown}
                        color="#ff5252"
                        onClick={() => setActiveSection('actions')}
                        isMobile={isMobile}
                    />

                    <DashboardCard 
                        title="Updates Missed" 
                        count={dashboardStats.updates.total} 
                        breakdown={dashboardStats.updates.breakdown}
                        color="#ffab40"
                        onClick={() => setActiveSection('updates')}
                        isMobile={isMobile}
                    />

                    <DashboardCard 
                        title="Upcoming Events" 
                        count={dashboardStats.events.total} 
                        breakdown={dashboardStats.events.breakdown}
                        color="#448aff"
                        onClick={() => setActiveSection('events')}
                        isMobile={isMobile}
                    />

                    <DashboardCard 
                        title="Opportunities" 
                        count={dashboardStats.opportunities.total} 
                        breakdown={dashboardStats.opportunities.breakdown}
                        color="#69f0ae"
                        onClick={() => setActiveSection('opportunities')}
                        isMobile={isMobile}
                    />
                </div>
            )}

            {/* DETAIL VIEW */}
            {activeSection && (
                <DetailView 
                    section={activeSection} 
                    items={dashboardStats[activeSection].items} 
                    onBack={() => setActiveSection(null)} 
                    handlers={actionHandlers}
                />
            )}

        </div>
      </div>
    </div>
  );
}

const styles = {
    itemCard: {
        background: '#252525',
        padding: '20px',
        borderRadius: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: '1px solid #333'
    },
    itemTitle: {
        fontWeight: 'bold',
        fontSize: '16px',
        color: '#fff',
        marginBottom: '4px'
    },
    itemDesc: {
        color: '#aaa',
        fontSize: '13px'
    },
    btn: {
        border: 'none',
        padding: '8px 16px',
        borderRadius: '6px',
        color: 'white',
        fontWeight: 'bold',
        cursor: 'pointer'
    },
    btnOutline: {
        background: 'transparent',
        border: '1px solid #666',
        color: '#eee',
        padding: '8px 16px',
        borderRadius: '6px',
        cursor: 'pointer'
    }
};

export default Home;