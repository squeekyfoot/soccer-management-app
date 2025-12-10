import React from 'react';

const RSVPSelector = ({ options, selectedValue, onChange, disabled }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {options.map((option) => {
        const isSelected = selectedValue === option.value;
        
        // Styles
        const containerStyle = {
            display: 'flex', 
            alignItems: 'center', 
            padding: '12px', 
            borderRadius: '8px', 
            border: isSelected ? '1px solid #6366f1' : '1px solid #444', // Indigo vs Gray
            backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.1)' : '#252525',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'all 0.2s'
        };

        const labelStyle = {
            fontWeight: 500,
            color: isSelected ? 'white' : '#d1d5db', // White vs Gray
            fontSize: '14px'
        };

        return (
          <label 
            key={option.value}
            style={containerStyle}
            onMouseEnter={(e) => !disabled && !isSelected && (e.currentTarget.style.backgroundColor = '#333')}
            onMouseLeave={(e) => !disabled && !isSelected && (e.currentTarget.style.backgroundColor = '#252525')}
          >
            <input 
              type="radio" 
              name="rsvp_option"
              value={option.value}
              checked={isSelected}
              onChange={() => !disabled && onChange(option.value)}
              disabled={disabled}
              style={{
                  marginRight: '12px',
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  accentColor: '#6366f1' // Uses browser native color styling for radio
              }}
            />
            
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <span style={labelStyle}>
                    {option.label}
                </span>
                
                {/* System Badges */}
                {option.type === 'system_yes' && (
                    <span style={{ marginLeft: '8px', fontSize: '10px', textTransform: 'uppercase', backgroundColor: '#14532d', color: '#bbf7d0', padding: '2px 6px', borderRadius: '4px' }}>Yes</span>
                )}
                {option.type === 'system_no' && (
                    <span style={{ marginLeft: '8px', fontSize: '10px', textTransform: 'uppercase', backgroundColor: '#7f1d1d', color: '#fecaca', padding: '2px 6px', borderRadius: '4px' }}>No</span>
                )}
            </div>
          </label>
        );
      })}
    </div>
  );
};

export default RSVPSelector;