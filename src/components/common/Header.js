import React from 'react';
import { COLORS } from '../../constants';

const Header = ({ title, actions, style }) => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      width: '100%', 
      marginBottom: '20px',
      ...style 
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingBottom: '10px',
        minHeight: '40px' // Ensure consistent height even without actions
      }}>
        <h2 style={{ margin: 0, color: 'white', fontSize: '24px' }}>{title}</h2>
        
        {actions && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {actions}
          </div>
        )}
      </div>
      
      <div style={{ 
        height: '1px', 
        width: '100%', 
        backgroundColor: COLORS.border 
      }} />
    </div>
  );
};

export default Header;