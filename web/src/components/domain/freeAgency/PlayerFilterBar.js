import React from 'react';
import Card from '../../ui/Card';
import Input from '../../ui/Input';

const PlayerFilterBar = ({ filters, onFilterChange }) => {
  const handleChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value });
  };

  return (
    <Card className="filter-bar" style={{ marginBottom: '1rem', padding: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        
        <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 600}}>Position</label>
            <select 
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                value={filters.position}
                onChange={(e) => handleChange('position', e.target.value)}
            >
                <option value="Any">Any Position</option>
                <option value="Forward">Forward</option>
                <option value="Midfielder">Midfielder</option>
                <option value="Defender">Defender</option>
                <option value="Goalkeeper">Goalkeeper</option>
            </select>
        </div>

        <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 600}}>Skill Level</label>
            <select 
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                value={filters.skillLevel}
                onChange={(e) => handleChange('skillLevel', e.target.value)}
            >
                <option value="Any">Any Level</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Professional">Professional</option>
            </select>
        </div>

      </div>
    </Card>
  );
};

export default PlayerFilterBar;