import React, { useState, useEffect } from 'react';
import { useEventLogic } from '../../../hooks/useEventLogic';
import { useAuth } from '../../../context/AuthContext';
import { useRosterManager } from '../../../hooks/useRosterManager'; 
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import UniversalSearch from '../shared/UniversalSearch'; 
import { Plus, Trash2, Settings, Users } from 'lucide-react';
import { COLORS } from '../../../lib/constants';

const CreateEventForm = ({ onSuccess, onCancel, initialData = {} }) => {
  const { loggedInUser } = useAuth();
  const { createEvent, loading } = useEventLogic();
  const { fetchManagedRosters } = useRosterManager();

  const [managedRosters, setManagedRosters] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newOptionLabel, setNewOptionLabel] = useState("");

  // Determine if user can create games (Manager, Developer, or owns a roster)
  const isManagerRole = loggedInUser?.role === 'manager' || loggedInUser?.role === 'developer';
  const hasRosters = managedRosters.length > 0;
  const canCreateGame = isManagerRole || hasRosters;

  // --- STATE ---
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDateTime: '',
    type: initialData.type || 'social', 
    invitedEntities: [], 
    invitees: [],
    rosterId: '', 
    allowInviteOthers: false, 
    responseDeadline: '', 
    rsvpOptions: [
        { label: 'Going', value: 'yes', type: 'system_yes' },
        { label: 'Not Going', value: 'no', type: 'system_no' }
    ],
    ...initialData 
  });

  // Load rosters for EVERYONE to check if they are an "Implicit Manager"
  useEffect(() => {
      if (loggedInUser) {
          fetchManagedRosters(loggedInUser.uid).then(setManagedRosters);
      }
  }, [loggedInUser, fetchManagedRosters]);

  // If user gains "Game" ability (e.g. rosters loaded) and type is unset, update if needed.
  // Also ensures if passed 'game' in initialData, we respect it.
  useEffect(() => {
      if (canCreateGame && !initialData.type && formData.type === 'social') {
          // Optional: We could auto-switch to game here, but sticking to 'social' default is safer
      }
  }, [canCreateGame, initialData, formData.type]);

  // --- HANDLERS ---

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEntitySelection = (selectedEntities) => {
      setFormData(prev => ({ ...prev, invitedEntities: selectedEntities }));
  };

  const handleOptionLabelChange = (index, newLabel) => {
      const updatedOptions = [...formData.rsvpOptions];
      updatedOptions[index].label = newLabel;
      setFormData(prev => ({ ...prev, rsvpOptions: updatedOptions }));
  };

  const addOption = () => {
      if (!newOptionLabel.trim()) return;
      setFormData(prev => ({
          ...prev,
          rsvpOptions: [
              ...prev.rsvpOptions, 
              { label: newOptionLabel, value: newOptionLabel.toLowerCase().replace(/\s/g, '_'), type: 'custom' }
          ]
      }));
      setNewOptionLabel("");
  };

  const removeOption = (value) => {
      setFormData(prev => ({
          ...prev,
          rsvpOptions: prev.rsvpOptions.filter(opt => opt.value !== value)
      }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.startDateTime || !formData.location) return;

    // Security check: If a non-manager somehow selected 'game', revert to 'social'
    let finalType = formData.type;
    if (finalType === 'game' && !canCreateGame) finalType = 'social';

    const payload = {
        ...formData,
        type: finalType,
        startDateTime: new Date(formData.startDateTime).toISOString(),
        responseDeadline: formData.responseDeadline ? new Date(formData.responseDeadline).toISOString() : null,
        rosterId: finalType === 'game' ? formData.rosterId : null,
    };

    await createEvent(payload);
    onSuccess?.();
  };

  // --- STYLES ---
  const sectionStyle = {
      padding: '15px',
      backgroundColor: '#252525', 
      borderRadius: '8px', 
      border: `1px solid ${COLORS.border}`,
      marginBottom: '15px'
  };

  const labelStyle = {
      display: 'block',
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#888',
      textTransform: 'uppercase',
      marginBottom: '8px'
  };

  const inputStyle = {
      width: '100%', 
      padding: '10px', 
      backgroundColor: '#333', 
      border: `1px solid ${COLORS.border}`, 
      borderRadius: '6px', 
      color: 'white', 
      outline: 'none'
  };

  return (
    <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
      
      {/* 1. Event Type Dropdown (Game option visible if Manager/Dev OR has rosters) */}
      <div style={{ marginBottom: '15px' }}>
        <label style={labelStyle}>Event Type</label>
        <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            style={inputStyle}
        >
            <option value="social">Social Event</option>
            {canCreateGame && <option value="game">Game</option>}
        </select>
      </div>

      {/* 2. Core Details */}
      <div style={{ marginBottom: '15px' }}>
        <Input
            label="Event Title" name="title"
            value={formData.title} onChange={handleChange}
            placeholder={formData.type === 'game' ? "e.g. vs. Rockets FC" : "e.g. Team Dinner"}
            required
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <Input
          label="Date & Time" name="startDateTime" type="datetime-local"
          value={formData.startDateTime} onChange={handleChange} required
        />
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <Input
          label="Location" name="location"
          value={formData.location} onChange={handleChange} placeholder="e.g. The Pub" required
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Description</label>
        <textarea
          name="description" rows="3"
          style={{ ...inputStyle, resize: 'vertical' }}
          value={formData.description} onChange={handleChange}
        />
      </div>

      {/* 3. Invitees */}
      <div style={sectionStyle}>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={14} /> Invitees
        </label>

        {/* Roster Selection (Only if Game + Can Create Game) */}
        {formData.type === 'game' && canCreateGame && (
            <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px', display: 'block' }}>Select Team (Optional)</label>
                <select 
                    name="rosterId" 
                    value={formData.rosterId} 
                    onChange={handleChange}
                    style={inputStyle}
                >
                    <option value="">-- Invite Individual Users Only --</option>
                    {managedRosters.map(r => (
                        <option key={r.id} value={r.id}>{r.name} ({r.season})</option>
                    ))}
                </select>
            </div>
        )}

        <UniversalSearch 
            onSelectionChange={handleEntitySelection} 
            placeholder="Search people, groups, or teams..."
        />

        {formData.type === 'social' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', cursor: 'pointer' }}>
                <input 
                    type="checkbox" 
                    name="allowInviteOthers" 
                    checked={formData.allowInviteOthers} 
                    onChange={handleChange}
                />
                <span style={{ fontSize: '13px', color: '#ccc' }}>Allow guests to invite others</span>
            </label>
        )}
      </div>

      {/* 4. Advanced Settings Toggle */}
      <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: '15px' }}>
          <button 
            type="button" 
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{ 
                background: 'none', border: 'none', color: COLORS.primary, 
                fontWeight: 'bold', fontSize: '13px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
              <Settings size={14} /> {showAdvanced ? 'Hide Options' : 'Configure Response Options & Deadlines'}
          </button>

          {showAdvanced && (
              <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#252525', borderRadius: '8px', border: `1px solid ${COLORS.border}` }}>
                  
                  {/* A. Response Options (FIRST) */}
                  <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: `1px solid ${COLORS.border}` }}>
                      <label style={labelStyle}>Response Options</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                          {formData.rsvpOptions.map((opt, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#333', padding: '8px 12px', borderRadius: '4px' }}>
                                  
                                  {/* Editable Input */}
                                  <input 
                                      type="text"
                                      value={opt.label}
                                      onChange={(e) => handleOptionLabelChange(idx, e.target.value)}
                                      style={{
                                          background: 'transparent',
                                          border: 'none',
                                          borderBottom: '1px solid #555',
                                          color: 'white',
                                          fontSize: '13px',
                                          flex: 1,
                                          marginRight: '10px',
                                          outline: 'none'
                                      }}
                                  />

                                  {opt.type.includes('system') && (
                                      <span style={{ color: '#666', fontSize: '11px', whiteSpace: 'nowrap' }}>
                                          ({opt.type === 'system_yes' ? 'YES' : 'NO'})
                                      </span>
                                  )}
                                  
                                  {opt.type === 'custom' && (
                                      <button type="button" onClick={() => removeOption(opt.value)} style={{ background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer', marginLeft: '10px' }}>
                                          <Trash2 size={14} />
                                      </button>
                                  )}
                              </div>
                          ))}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '10px' }}>
                          <input 
                              type="text" 
                              placeholder="Add new option (e.g. Maybe)" 
                              style={{ flex: 1, padding: '8px', backgroundColor: '#333', border: `1px solid ${COLORS.border}`, borderRadius: '4px', color: 'white' }}
                              value={newOptionLabel}
                              onChange={(e) => setNewOptionLabel(e.target.value)}
                          />
                          <Button type="button" size="sm" variant="secondary" onClick={addOption}>
                              <Plus size={16} />
                          </Button>
                      </div>
                  </div>

                  {/* B. Lock Deadline (SECOND) */}
                  <div>
                      <Input
                        label="Lock Responses By (Optional)" 
                        name="responseDeadline" 
                        type="datetime-local"
                        value={formData.responseDeadline} 
                        onChange={handleChange} 
                      />
                      <p style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Players cannot change their response after this time.</p>
                  </div>

              </div>
          )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '20px', borderTop: `1px solid ${COLORS.border}`, marginTop: '10px' }}>
        <Button type="submit" isLoading={loading} style={{ width: '100%' }}>
            {formData.type === 'game' ? 'Schedule Game' : 'Create Event'}
        </Button>
      </div>
    </form>
  );
};

export default CreateEventForm;