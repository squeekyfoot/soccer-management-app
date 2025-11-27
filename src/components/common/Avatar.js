import React from 'react';
import { COLORS } from '../../constants';

const Avatar = ({ src, alt, text, size = 40, style }) => {
  return (
    <div style={{ 
      width: size, 
      height: size, 
      borderRadius: '50%', 
      backgroundColor: '#444', 
      overflow: 'hidden', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      border: `1px solid ${COLORS.border}`,
      flexShrink: 0,
      color: '#ccc',
      fontWeight: 'bold',
      fontSize: size * 0.4, // Responsive font size
      ...style 
    }}>
      {src ? (
        <img src={src} alt={alt || "User"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span>{text ? text.charAt(0).toUpperCase() : "?"}</span>
      )}
    </div>
  );
};

export default Avatar;