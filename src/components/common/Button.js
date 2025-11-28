import React from 'react';
import { COLORS } from '../../lib/constants';

const Button = ({ 
  children, 
  onClick, 
  type = "button", 
  variant = "primary", // primary, secondary, danger
  disabled = false, 
  style = {} 
}) => {
  
  let backgroundColor = COLORS.primary;
  let color = '#000'; // Default text color for primary
  let border = 'none';

  switch (variant) {
    case 'secondary':
      backgroundColor = '#555';
      color = 'white';
      break;
    case 'danger':
      backgroundColor = COLORS.danger;
      color = 'white';
      break;
    case 'outline':
      backgroundColor = 'transparent';
      color = COLORS.primary;
      border = `1px solid ${COLORS.primary}`;
      break;
    default: // primary
      backgroundColor = COLORS.primary;
      color = '#000';
      break;
  }

  if (disabled) {
    backgroundColor = '#444';
    color = '#888';
  }

  const baseStyle = {
    padding: '10px 20px',
    borderRadius: '8px',
    border: border,
    backgroundColor: backgroundColor,
    color: color,
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'opacity 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    ...style // Allow overriding styles if absolutely necessary
  };

  return (
    <button 
      type={type} 
      onClick={onClick} 
      disabled={disabled} 
      style={baseStyle}
    >
      {children}
    </button>
  );
};

export default Button;