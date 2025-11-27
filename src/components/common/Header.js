import React from 'react';
import { COLORS } from '../../constants';

const Header = ({ title, actions, style, className }) => {
  return (
    <div 
      className={`view-header ${className || ''}`}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        width: '100%', 
        boxSizing: 'border-box',
        ...style 
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingBottom: '10px',
        minHeight: '40px'
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