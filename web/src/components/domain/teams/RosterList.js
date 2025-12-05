import React from 'react';
import TeamCard from './TeamCard';
import Button from '../../ui/Button';
import EmptyState from '../../ui/EmptyState';

const RosterList = ({ rosters, onSelect, onDelete }) => {
  if (!rosters || rosters.length === 0) {
    return <EmptyState message="No rosters found. Create one to get started." />;
  }

  return (
    <div style={{ display: 'grid', gap: '15px' }}>
      {rosters.map(roster => (
        <TeamCard 
          key={roster.id} 
          roster={roster}
          actions={
            <>
              <Button 
                variant="secondary" 
                onClick={() => onSelect(roster)} 
                style={{ padding: '5px 15px', fontSize: '12px' }}
              >
                Manage
              </Button>
              <Button 
                variant="danger" 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(roster.id);
                }} 
                style={{ padding: '5px 10px', fontSize: '12px' }}
              >
                Delete
              </Button>
            </>
          }
        />
      ))}
    </div>
  );
};

export default RosterList;