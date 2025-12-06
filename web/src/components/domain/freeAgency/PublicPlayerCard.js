import React, { useMemo } from 'react';
import Card from '../../ui/Card';
import Avatar from '../../ui/Avatar';
import Button from '../../ui/Button';

const PublicPlayerCard = ({ player, isManager, onInvite }) => {
  const { personalInfo, soccerProfile, playerName, photoURL } = player;

  // Calculate Age from Timestamp
  const age = useMemo(() => {
    if (!personalInfo?.birthDate) return 'N/A';
    const birthDate = personalInfo.birthDate.toDate ? personalInfo.birthDate.toDate() : new Date(personalInfo.birthDate);
    const diff = Date.now() - birthDate.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }, [personalInfo?.birthDate]);

  return (
    <Card className="player-card">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
        {/* FIX: Passed numeric size instead of string "large" */}
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

      {/* FIX: Use passed prop instead of internal role check */}
      {isManager && (
        <Button 
          fullWidth 
          variant="primary" 
          onClick={() => onInvite(player)}
        >
          Invite to Team
        </Button>
      )}
    </Card>
  );
};

export default PublicPlayerCard;