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
  multiline = false, // New Prop
  rows = 3,          // New Prop
  style = {} 
}) => {
  
  const baseStyle = {
    width: '100%',
    padding: '10px',
    backgroundColor: '#3a3f4a', 
    border: `1px solid ${COLORS.border}`,
    borderRadius: '4px',
    color: 'white',
    fontSize: '16px',
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical', // Allow vertical resizing for textareas
    ...style
  };

  return (
    <div style={{ marginBottom: '15px', textAlign: 'left' }}>
      {label && (
        <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '14px' }}>
          {label} {required && <span style={{ color: COLORS.danger }}>*</span>}
        </label>
      )}
      
      {multiline ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          rows={rows}
          style={{ ...baseStyle, minHeight: '80px' }}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          style={baseStyle}
        />
      )}
    </div>
  );
};

export default Input;