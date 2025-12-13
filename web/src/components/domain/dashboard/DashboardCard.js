import React from 'react';

const DashboardCard = ({ title, count, breakdown, onClick, color, isMobile }) => (
  <div 
    onClick={onClick}
    style={{ 
      backgroundColor: '#1e1e1e', 
      padding: isMobile ? '0 16px' : '24px', 
      borderRadius: isMobile ? '8px' : '16px', 
      cursor: 'pointer',
      borderLeft: `5px solid ${color}`,
      boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      display: 'flex',
      flexDirection: isMobile ? 'row' : 'column', 
      justifyContent: 'space-between',
      alignItems: isMobile ? 'center' : 'flex-start',
      flex: isMobile ? '1' : 'unset', 
      minHeight: isMobile ? '0' : '180px'
    }}
  >
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

    <div style={{ 
        marginTop: isMobile ? '0' : '20px', 
        paddingTop: isMobile ? '0' : '16px', 
        borderTop: isMobile ? 'none' : '1px solid #333',
        display: 'flex',
        gap: isMobile ? '15px' : '15px',
        alignItems: 'center'
    }}>
        {breakdown && Object.entries(breakdown).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-end' : 'flex-start' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#eee' }}>{val}</span>
                <span style={{ fontSize: '10px', color: '#777', textTransform: 'uppercase' }}>{key}</span>
            </div>
        ))}
    </div>
  </div>
);

export default DashboardCard;
