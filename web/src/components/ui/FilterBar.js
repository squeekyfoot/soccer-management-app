import React from 'react';
import { COLORS } from '../../lib/constants';

/**
 * @param {Array} config - Definitions for inputs: [{ name: 'season', type: 'select', options: [] }]
 * @param {Object} activeFilters - Current state from the hook
 * @param {Function} onFilterChange - Setter from the hook
 */
const FilterBar = ({ config, activeFilters, onFilterChange, onReset }) => {
  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
      {config.map((field) => (
        <div key={field.name}>
          {field.type === 'select' && (
            <select 
              value={activeFilters[field.name]}
              onChange={(e) => onFilterChange(field.name, e.target.value)}
              style={styles.select}
            >
              {/* Optional "All" default */}
              <option value="">{field.placeholder || `All ${field.label}`}</option>
              {field.options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
          
          {field.type === 'toggle' && (
             <button 
                onClick={() => onFilterChange(field.name, !activeFilters[field.name])}
                style={{
                    ...styles.toggleBtn,
                    backgroundColor: activeFilters[field.name] ? COLORS.primary : '#333',
                    color: activeFilters[field.name] ? '#000' : '#fff'
                }}
             >
                 {field.label}
             </button>
          )}
        </div>
      ))}
      
      {onReset && (
          <button onClick={onReset} style={styles.resetBtn}>Reset</button>
      )}
    </div>
  );
};

const styles = {
    select: { padding: '8px', borderRadius: '5px', border: '1px solid #555', backgroundColor: '#222', color: 'white' },
    toggleBtn: { padding: '8px 12px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontWeight: 'bold' },
    resetBtn: { padding: '8px 12px', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', textDecoration: 'underline' }
};

export default FilterBar;