import React, { useMemo } from 'react';
import Card from '../../ui/Card';
import Avatar from '../../ui/Avatar';
import Button from '../../ui/Button';
import { COLORS } from '../../../lib/constants';

const PublicPlayerCard = ({ 
    player, 
    isManager, 
    pendingInvites = [], 
    hasAvailableTeams = true, // Default to true if not passed
    onInvite, 
    onViewPending 
}) => {
  const { personalInfo, soccerProfile, playerName, photoURL } = player;

  // Calculate Age from Timestamp
  const age = useMemo(() => {
    if (!personalInfo?.birthDate) return 'N/A';
    // Support both Firestore Timestamp and string date (from new signups)
    const dateVal = personalInfo.birthDate.toDate 
        ? personalInfo.birthDate.toDate() 
        : new Date(personalInfo.birthDate);
        
    const diff = Date.now() - dateVal.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }, [personalInfo?.birthDate]);

  const hasPending = pendingInvites.length > 0;

  return (
    <Card className="player-card">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
        <Avatar src={photoURL} alt={playerName} size={80} />
        <h3 style={{ margin: '0.5rem 0 0' }}>{playerName}</h3>
        <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
          {age} years old • {personalInfo?.sex || 'Athlete'}
        </p>
      </div>

      <div className="player-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9rem', marginBottom: '1rem' }}>
        <div>
            <strong>Positions:</strong>
            <div style={{color: '#555'}}>{soccerProfile?.positions?.join(', ') || '-'}</div>
        </div>
        <div>
            <strong>Level:</strong>
            <div style={{color: '#555'}}>{soccerProfile?.skillLevel || '-'}</div>
        </div>
        <div>
            <strong>Exp:</strong>
            <div style={{color: '#555'}}>{soccerProfile?.yearsPlayed} years</div>
        </div>
        <div>
            <strong>Looking For:</strong>
            <div style={{color: '#555'}}>{soccerProfile?.competitionLevel || 'Any'}</div>
        </div>
      </div>

      {soccerProfile?.aboutMe && (
        <div style={{ backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', fontStyle: 'italic', marginBottom: '1rem' }}>
          "{soccerProfile.aboutMe}"
        </div>
      )}

      {isManager && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* 1. Button to View Existing Invites */}
            {hasPending && (
                <Button 
                    fullWidth 
                    variant="secondary"
                    style={{ border: `1px solid ${COLORS.primary}`, color: COLORS.primary }}
                    onClick={() => onViewPending(player)}
                >
                    Invites Pending ({pendingInvites.length})
                </Button>
            )}

            {/* 2. Button to Send NEW Invite OR Disabled State */}
            {hasAvailableTeams ? (
                <Button 
                    fullWidth 
                    variant="primary" 
                    onClick={() => onInvite(player)}
                >
                    Invite to Team
                </Button>
            ) : (
                <Button 
                    fullWidth 
                    disabled
                    style={{ backgroundColor: '#444', color: '#888', cursor: 'not-allowed', border: '1px solid #555' }}
                >
                    No available teams
                </Button>
            )}
        </div>
      )}
    </Card>
  );
};

export default PublicPlayerCard;