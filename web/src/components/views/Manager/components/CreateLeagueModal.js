import React, { useState } from 'react';
import Modal from '../../../common/Modal';
import Button from '../../../common/Button';
import { useAuth } from '../../../../context/AuthContext';

const CreateLeagueModal = ({ onClose }) => {
    const { createLeague } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        seasonStart: '',
        seasonEnd: '',
        gameFrequency: 'Weekly',
        gameDays: [], // ['Sunday', 'Monday']
        earliestGameTime: '08:00',
        latestGameTime: '22:00',
        registrationDeadline: ''
    });

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleDay = (day) => {
        setFormData(prev => {
            const days = prev.gameDays.includes(day)
                ? prev.gameDays.filter(d => d !== day)
                : [...prev.gameDays, day];
            return { ...prev, gameDays: days };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await createLeague(formData);
        if (success) onClose();
    };

    return (
        <Modal title="Create New League" onClose={onClose} actions={null}>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px', textAlign: 'left' }}>
                
                {/* Basic Info */}
                <div>
                    <label style={styles.label}>League Name</label>
                    <input 
                        type="text" required 
                        value={formData.name} onChange={e => handleChange('name', e.target.value)} 
                        style={styles.input} 
                    />
                </div>
                <div>
                    <label style={styles.label}>Description</label>
                    <textarea 
                        value={formData.description} onChange={e => handleChange('description', e.target.value)} 
                        style={{...styles.input, height: '80px'}} 
                    />
                </div>

                {/* Season Dates */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                        <label style={styles.label}>Season Start</label>
                        <input 
                            type="date" required 
                            value={formData.seasonStart} onChange={e => handleChange('seasonStart', e.target.value)} 
                            style={styles.input} 
                        />
                    </div>
                    <div>
                        <label style={styles.label}>Season End</label>
                        <input 
                            type="date" required 
                            value={formData.seasonEnd} onChange={e => handleChange('seasonEnd', e.target.value)} 
                            style={styles.input} 
                        />
                    </div>
                </div>

                {/* Registration */}
                <div>
                    <label style={styles.label}>Registration Deadline</label>
                    <input 
                        type="date" required 
                        value={formData.registrationDeadline} onChange={e => handleChange('registrationDeadline', e.target.value)} 
                        style={styles.input} 
                    />
                </div>

                {/* Schedule Config */}
                <div>
                    <label style={styles.label}>Game Frequency</label>
                    <select 
                        value={formData.gameFrequency} onChange={e => handleChange('gameFrequency', e.target.value)} 
                        style={styles.input}
                    >
                        <option>Weekly</option>
                        <option>Bi-Weekly</option>
                        <option>Monthly</option>
                    </select>
                </div>

                <div>
                    <label style={styles.label}>Game Days</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {daysOfWeek.map(day => (
                            <button 
                                key={day} 
                                type="button"
                                onClick={() => toggleDay(day)}
                                style={{
                                    padding: '5px 10px',
                                    borderRadius: '15px',
                                    border: 'none',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    backgroundColor: formData.gameDays.includes(day) ? '#4caf50' : '#444',
                                    color: 'white'
                                }}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                        <label style={styles.label}>Earliest Time</label>
                        <input 
                            type="time" 
                            value={formData.earliestGameTime} onChange={e => handleChange('earliestGameTime', e.target.value)} 
                            style={styles.input} 
                        />
                    </div>
                    <div>
                        <label style={styles.label}>Latest Time</label>
                        <input 
                            type="time" 
                            value={formData.latestGameTime} onChange={e => handleChange('latestGameTime', e.target.value)} 
                            style={styles.input} 
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Create League</Button>
                </div>
            </form>
        </Modal>
    );
};

const styles = {
    label: { display: 'block', color: '#888', marginBottom: '5px', fontSize: '12px' },
    input: { width: '100%', padding: '10px', background: '#333', border: '1px solid #555', borderRadius: '6px', color: 'white', boxSizing: 'border-box' }
};

export default CreateLeagueModal;