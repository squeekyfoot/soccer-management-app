import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import { COLORS } from '../../constants';

const RosterList = ({ rosters, onSelect, onDelete }) => {
  if (!rosters || rosters.length === 0) return <EmptyState message="No rosters found. Create one to get started." />;

  return (
    <div style={{ display: 'grid', gap: '15px' }}>
      {rosters.map(roster => (
        <Card key={roster.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: 0, color: COLORS.primary }}>{roster.name}</h4>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#ccc' }}>
                {roster.season} • {roster.players?.length || 0} / {roster.maxCapacity} players 
                {roster.isDiscoverable && <span style={{ marginLeft: '10px', fontSize: '10px', border: '1px solid #555', padding: '2px 4px', borderRadius: '3px' }}>Public</span>}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="secondary" onClick={() => onSelect(roster)} style={{ padding: '5px 15px', fontSize: '12px' }}>Manage</Button>
            <Button variant="danger" onClick={() => onDelete(roster.id)} style={{ padding: '5px 10px', fontSize: '12px' }}>Delete</Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default RosterList;