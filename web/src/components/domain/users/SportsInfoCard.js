import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext'; 
import Button from '../../ui/Button'; 
import Input from '../../ui/Input';   
import Card from '../../ui/Card';
import { COLORS } from '../../../lib/constants'; 
import { Activity, Edit2 } from 'lucide-react';

function SportsInfoCard() {
  const { soccerDetails, updateSoccerDetails } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    favoredPosition: "",
    jerseySize: "Large",
    playerNumber: 0,
    comments: "",
    currentRosters: "",
    rosterJerseysOwned: ""
  });

  // Load data when entering edit mode
  const startEditing = () => {
    if (soccerDetails) {
        setFormData({
            favoredPosition: soccerDetails.favoredPosition || "",
            jerseySize: soccerDetails.jerseySize || "Large",
            playerNumber: soccerDetails.playerNumber || 0,
            comments: soccerDetails.comments || "",
            currentRosters: Array.isArray(soccerDetails.currentRosters) ? soccerDetails.currentRosters.join(', ') : "",
            rosterJerseysOwned: Array.isArray(soccerDetails.rosterJerseysOwned) ? soccerDetails.rosterJerseysOwned.join(', ') : ""
        });
    }
    setIsEditing(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await updateSoccerDetails(formData);
    if (success) setIsEditing(false);
  };

  const styles = {
      infoRow: { marginBottom: '15px', display: 'flex', gap: '20px' },
      infoLabel: { fontWeight: 'bold', color: '#888', minWidth: '140px', fontSize: '14px' },
      infoValue: { color: 'white', flex: 1 },
      subSection: { marginTop: '25px', background: '#252525', padding: '15px', borderRadius: '8px' }
  };

  if (isEditing) {
    return (
      <Card style={{ padding: '30px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Edit Soccer Details</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                    <Input label="Favored Position" name="favoredPosition" value={formData.favoredPosition} onChange={handleChange} />
                </div>
                <div style={{ flex: 1 }}>
                    <Input label="Player Number" type="number" name="playerNumber" value={formData.playerNumber} onChange={handleChange} />
                </div>
            </div>

            <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Jersey Size</label>
                <select
                    name="jerseySize"
                    value={formData.jerseySize}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#333', border: '1px solid #555', borderRadius: '5px', color: 'white' }}
                >
                    <option value="Small">Small</option>
                    <option value="Medium">Medium</option>
                    <option value="Large">Large</option>
                    <option value="X-Large">X-Large</option>
                </select>
            </div>
            
            <Input label="Current Roster(s) (comma-separated)" name="currentRosters" value={formData.currentRosters} onChange={handleChange} />
            <Input label="Roster Jerseys Owned" name="rosterJerseysOwned" value={formData.rosterJerseysOwned} onChange={handleChange} />

            <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Comments</label>
                <textarea
                    name="comments"
                    value={formData.comments}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#333', border: '1px solid #555', borderRadius: '5px', color: 'white', minHeight: '80px', fontFamily: 'inherit' }}
                />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <Button type="submit" style={{ flex: 1 }}>Save Info</Button>
                <Button variant="secondary" onClick={() => setIsEditing(false)} style={{ flex: 1 }}>Cancel</Button>
            </div>
        </form>
      </Card>
    );
  }

  // --- VIEW MODE ---
  return (
    <Card style={{ padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #444', paddingBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={24} color={COLORS.primary} />
                <h3 style={{ margin: 0 }}>Soccer</h3>
            </div>
            <Button variant="secondary" onClick={startEditing} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={16} /> Edit
            </Button>
        </div>

        {!soccerDetails ? (
            <p style={{ color: '#888', fontStyle: 'italic' }}>No details added yet.</p>
        ) : (
            <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <div style={styles.infoRow}><span style={styles.infoLabel}>Position:</span><span style={styles.infoValue}>{soccerDetails.favoredPosition || "Any"}</span></div>
                        <div style={styles.infoRow}><span style={styles.infoLabel}>Jersey Size:</span><span style={styles.infoValue}>{soccerDetails.jerseySize || "Large"}</span></div>
                        <div style={styles.infoRow}><span style={styles.infoLabel}>Preferred #:</span><span style={styles.infoValue}>{soccerDetails.playerNumber || "N/A"}</span></div>
                    </div>
                    <div>
                        <div style={{ marginBottom: '15px' }}>
                            <div style={{...styles.infoLabel, marginBottom: '5px'}}>Current Rosters:</div>
                            <div style={{ color: '#ccc', fontSize: '14px' }}>
                                {soccerDetails.currentRosters?.join(', ') || "None"}
                            </div>
                        </div>
                        <div>
                            <div style={{...styles.infoLabel, marginBottom: '5px'}}>Jerseys Owned:</div>
                            <div style={{ color: '#ccc', fontSize: '14px' }}>
                                {soccerDetails.rosterJerseysOwned?.join(', ') || "None"}
                            </div>
                        </div>
                    </div>
                </div>
                
                {soccerDetails.comments && (
                    <div style={styles.subSection}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#ccc', fontSize: '14px' }}>Notes / Comments</h4>
                        <p style={{ margin: 0, color: '#eee', fontSize: '14px' }}>{soccerDetails.comments}</p>
                    </div>
                )}
            </>
        )}
    </Card>
  );
}

export default SportsInfoCard;