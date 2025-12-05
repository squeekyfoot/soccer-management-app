import React from 'react';
import Card from '../../ui/Card';
import { COLORS } from '../../../lib/constants';

const TeamCard = ({ roster, actions, onClick }) => {
  return (
    <Card 
      hoverable 
      onClick={onClick}
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
    >
      <div>
        <h3 style={{ margin: '0 0 5px 0', color: COLORS.primary }}>{roster.name}</h3>
        <p style={{ margin: 0, color: '#ccc', fontSize: '14px' }}>
            {roster.season} • {roster.players?.length || 0} / {roster.maxCapacity || 20} Players
            {roster.isDiscoverable && (
              <span style={{ 
                marginLeft: '10px', fontSize: '10px', border: '1px solid #555', 
                padding: '2px 4px', borderRadius: '3px', color: '#888' 
              }}>
                Public
              </span>
            )}
        </p>
      </div>
      
      {/* Dynamic Buttons (Manage, View, Delete, etc) */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {actions}
      </div>
    </Card>
  );
};

export default TeamCard;