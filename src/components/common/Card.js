import React from 'react';
import { COLORS } from '../../constants';

const Card = ({ children, onClick, style, hoverable = false }) => {
  return (
    <div 
      onClick={onClick}
      style={{
        backgroundColor: COLORS.sidebar, // Standardized background
        padding: '15px', 
        borderRadius: '8px', 
        border: `1px solid ${COLORS.border}`,
        marginBottom: '10px',
        cursor: (onClick || hoverable) ? 'pointer' : 'default',
        transition: 'transform 0.1s, background-color 0.1s',
        ...style
      }}
      onMouseEnter={(e) => {
        if(hoverable || onClick) e.currentTarget.style.backgroundColor = '#2a323d'; // Slightly lighter on hover
      }}
      onMouseLeave={(e) => {
        if(hoverable || onClick) e.currentTarget.style.backgroundColor = COLORS.sidebar;
      }}
    >
      {children}
    </div>
  );
};

export default Card;