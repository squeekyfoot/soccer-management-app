import React from 'react';
import { MapPin, Clock, Users } from 'lucide-react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { COLORS } from '../../../lib/constants';

const EventCard = ({ event, onOpen }) => {
  const { title, startDateTime, location, type, responses } = event;
  const startDate = new Date(startDateTime);

  // Helper to count RSVPs
  const attendingCount = Object.values(responses || {}).filter(r => r.response === 'yes').length;

  // Determine accent color (Case Insensitive)
  const isGame = type && type.toLowerCase() === 'game';
  const accentColor = isGame ? '#ffab40' : '#448aff'; 

  return (
    <Card 
        onClick={() => onOpen(event)} 
        hoverable 
        style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            borderLeft: `4px solid ${accentColor}` 
        }}
    >
        {/* Date Badge */}
        <div style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
            backgroundColor: '#333', padding: '10px', borderRadius: '8px', 
            minWidth: '60px', marginRight: '15px', border: `1px solid ${COLORS.border}`
        }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#aaa', textTransform: 'uppercase' }}>
            {startDate.toLocaleString('default', { month: 'short' })}
          </span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
            {startDate.getDate()}
          </span>
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ 
                fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase',
                backgroundColor: isGame ? 'rgba(255, 171, 64, 0.15)' : 'rgba(68, 138, 255, 0.15)',
                color: accentColor
            }}>
              {type}
            </span>
            <span style={{ fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={12} /> {attendingCount} Going
            </span>
          </div>
          
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold', color: 'white' }}>{title}</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#bbb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} color={COLORS.primary} />
              <span>{startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} color={COLORS.primary} />
              <span>{location}</span>
            </div>
          </div>
        </div>

        {/* Action */}
        <div style={{ alignSelf: 'center', marginLeft: '10px' }}>
          <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); onOpen(event); }}>
            View
          </Button>
        </div>
    </Card>
  );
};

export default EventCard;