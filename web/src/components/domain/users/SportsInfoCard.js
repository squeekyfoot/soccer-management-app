import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useFreeAgency } from '../../../hooks/useFreeAgency';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import { COLORS } from '../../../lib/constants';

const SportsInfoCard = () => {
  const { loggedInUser } = useAuth();
  const { updateSoccerProfile, validateProfileForFreeAgency, loading, error } = useFreeAgency();
  
  // Local State for Form
  const [formData, setFormData] = useState({
      positions: [],
      yearsPlayed: 0,
      skillLevel: 'Beginner',
      competitionLevel: 'Any',
      aboutMe: '',
      isFreeAgent: false
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Init Data
  useEffect(() => {
      if (loggedInUser?.soccerProfile) {
          setFormData({
              ...loggedInUser.soccerProfile,
              // Ensure arrays/defaults exist
              positions: loggedInUser.soccerProfile.positions || [],
              yearsPlayed: loggedInUser.soccerProfile.yearsPlayed || 0,
              skillLevel: loggedInUser.soccerProfile.skillLevel || 'Beginner',
              competitionLevel: loggedInUser.soccerProfile.competitionLevel || 'Any',
              isFreeAgent: loggedInUser.soccerProfile.isFreeAgent || false
          });
      }
  }, [loggedInUser]);

  const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePositionToggle = (pos) => {
      setFormData(prev => {
          const exists = prev.positions.includes(pos);
          return {
              ...prev,
              positions: exists 
                 ? prev.positions.filter(p => p !== pos)
                 : [...prev.positions, pos]
          };
      });
  };

  const handleSave = async () => {
      setValidationErrors([]);
      
      // If turning ON free agency, validate first
      if (formData.isFreeAgent) {
          const missing = validateProfileForFreeAgency(formData);
          if (missing.length > 0) {
              setValidationErrors(missing);
              alert(`Cannot enable Free Agency. Missing: ${missing.join(', ')}`);
              return;
          }
      }

      const success = await updateSoccerProfile(formData);
      if (success) {
          setIsEditing(false);
      }
  };

  const toggleFreeAgency = async () => {
      const newValue = !formData.isFreeAgent;
      // If turning ON, must check validation immediately
      if (newValue) {
          const missing = validateProfileForFreeAgency(formData);
          if (missing.length > 0) {
             alert(`Please fill out required fields first: ${missing.join(', ')}`);
             setIsEditing(true); // Force edit mode
             return;
          }
      }
      
      // Update local state and save
      const updated = { ...formData, isFreeAgent: newValue };
      setFormData(updated);
      await updateSoccerProfile(updated);
  };

  return (
    <Card style={{ padding: '25px', borderTop: `4px solid ${COLORS.primary}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: COLORS.primary }}>Soccer Profile</h3>
          <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? 'secondary' : 'primary'} size="small">
              {isEditing ? 'Cancel' : 'Edit Details'}
          </Button>
      </div>

      {/* FREE AGENCY TOGGLE */}
      <div style={{ 
          background: formData.isFreeAgent ? 'rgba(76, 175, 80, 0.1)' : '#333', 
          border: `1px solid ${formData.isFreeAgent ? '#4caf50' : '#555'}`,
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
      }}>
          <div>
              <div style={{ fontWeight: 'bold', color: formData.isFreeAgent ? '#4caf50' : '#aaa' }}>
                  Free Agent Status: {formData.isFreeAgent ? 'ACTIVE' : 'INACTIVE'}
              </div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                  {formData.isFreeAgent 
                    ? "Managers can see you in 'Find Players'" 
                    : "You are hidden from public searches"}
              </div>
          </div>
          <button 
             onClick={toggleFreeAgency}
             disabled={loading}
             style={{
                 background: formData.isFreeAgent ? '#4caf50' : '#555',
                 color: 'white',
                 border: 'none',
                 padding: '8px 16px',
                 borderRadius: '20px',
                 cursor: 'pointer',
                 fontWeight: 'bold'
             }}
          >
              {formData.isFreeAgent ? 'Turn OFF' : 'Turn ON'}
          </button>
      </div>

      {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              {/* POSITIONS */}
              <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#ccc' }}>Primary Positions</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {['Forward', 'Midfielder', 'Defender', 'Goalkeeper'].map(pos => (
                          <button 
                            key={pos}
                            type="button"
                            onClick={() => handlePositionToggle(pos)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '15px',
                                border: '1px solid #555',
                                background: formData.positions.includes(pos) ? COLORS.primary : 'transparent',
                                color: formData.positions.includes(pos) ? 'white' : '#aaa',
                                cursor: 'pointer'
                            }}
                          >
                              {pos}
                          </button>
                      ))}
                  </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                   <Input label="Years Played" type="number" value={formData.yearsPlayed} onChange={(e) => handleChange('yearsPlayed', parseInt(e.target.value))} />
                   
                   <div>
                       <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#ccc' }}>Skill Level</label>
                       <select 
                           value={formData.skillLevel} 
                           onChange={(e) => handleChange('skillLevel', e.target.value)}
                           style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '5px' }}
                       >
                           {['Beginner', 'Intermediate', 'Advanced', 'Professional'].map(l => <option key={l} value={l}>{l}</option>)}
                       </select>
                   </div>
              </div>

              <div>
                   <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#ccc' }}>Looking For</label>
                   <select 
                       value={formData.competitionLevel} 
                       onChange={(e) => handleChange('competitionLevel', e.target.value)}
                       style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '5px' }}
                   >
                       {['Casual', 'Competitive', 'Any'].map(l => <option key={l} value={l}>{l}</option>)}
                   </select>
              </div>

              <Input label="Public Message" multiline placeholder="Tell managers about your playstyle..." value={formData.aboutMe} onChange={(e) => handleChange('aboutMe', e.target.value)} />

              <Button onClick={handleSave} disabled={loading} style={{ marginTop: '10px' }}>Save Sports Profile</Button>
              {error && <div style={{ color: COLORS.danger, marginTop: '10px' }}>{error}</div>}

          </div>
      ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                  <div style={{ color: '#888', fontSize: '12px' }}>Positions</div>
                  <div style={{ color: 'white', fontWeight: 'bold' }}>{formData.positions.join(', ') || '-'}</div>
              </div>
              <div>
                  <div style={{ color: '#888', fontSize: '12px' }}>Experience</div>
                  <div style={{ color: 'white', fontWeight: 'bold' }}>{formData.yearsPlayed} Years</div>
              </div>
              <div>
                  <div style={{ color: '#888', fontSize: '12px' }}>Skill Level</div>
                  <div style={{ color: 'white', fontWeight: 'bold' }}>{formData.skillLevel}</div>
              </div>
              <div>
                  <div style={{ color: '#888', fontSize: '12px' }}>Type</div>
                  <div style={{ color: 'white', fontWeight: 'bold' }}>{formData.competitionLevel}</div>
              </div>
              {formData.aboutMe && (
                  <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                      <div style={{ color: '#888', fontSize: '12px' }}>Message</div>
                      <div style={{ color: '#ddd', fontStyle: 'italic' }}>"{formData.aboutMe}"</div>
                  </div>
              )}
          </div>
      )}
    </Card>
  );
};

export default SportsInfoCard;