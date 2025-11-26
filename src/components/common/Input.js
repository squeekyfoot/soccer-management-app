import React from 'react';
import { COLORS } from '../../constants';

const Input = ({ 
  label, 
  type = "text", 
  name, 
  value, 
  onChange, 
  placeholder, 
  required = false, 
  style = {} 
}) => {
  
  const inputStyle = {
    width: '100%',
    padding: '10px',
    backgroundColor: '#3a3f4a', // Slightly lighter than main bg
    border: `1px solid ${COLORS.border}`,
    borderRadius: '4px',
    color: 'white',
    fontSize: '16px', // Prevents iOS zoom
    boxSizing: 'border-box',
    outline: 'none',
    ...style
  };

  return (
    <div style={{ marginBottom: '15px', textAlign: 'left' }}>
      {label && (
        <label 
          style={{ 
            display: 'block', 
            marginBottom: '5px', 
            color: '#ccc', 
            fontSize: '14px' 
          }}
        >
          {label} {required && <span style={{ color: COLORS.danger }}>*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={inputStyle}
      />
    </div>
  );
};

export default Input;