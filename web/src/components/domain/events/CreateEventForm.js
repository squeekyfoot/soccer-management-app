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

  const isManager = loggedInUser?.role === 'manager';

  // --- STATE ---
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDateTime: '',
    type: isManager ? 'game' : 'social',
    invitedEntities: [], // Stores {id, type, label} objects from UniversalSearch
    invitees: [], // Manual individual UIDs if needed
    rosterId: '', 
    allowInviteOthers: false, 
    responseDeadline: '', 
    rsvpOptions: [
        { label: 'Going', value: 'yes', type: 'system_yes' },
        { label: 'Not Going', value: 'no', type: 'system_no' }
    ],
    ...initialData 
  });

  const [managedRosters, setManagedRosters] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newOptionLabel, setNewOptionLabel] = useState("");

  useEffect(() => {
      if (isManager) {
          fetchManagedRosters(loggedInUser.uid).then(setManagedRosters);
      }
  }, [isManager, loggedInUser, fetchManagedRosters]);

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

    const payload = {
        ...formData,
        startDateTime: new Date(formData.startDateTime).toISOString(),
        responseDeadline: formData.responseDeadline ? new Date(formData.responseDeadline).toISOString() : null,
        // For game types, rosterId can still be manually set via dropdown if legacy behavior used,
        // but UniversalSearch supercedes it. 
        rosterId: formData.rosterId, 
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

  return (
    <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
      
      {/* 1. Event Type Selector */}
      {isManager && (
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', padding: '10px', backgroundColor: '#333', borderRadius: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input 
              type="radio" name="type" value="social" 
              checked={formData.type === 'social'} 
              onChange={handleChange}
              style={{ accentColor: COLORS.primary }}
            />
            <span style={{ color: 'white', fontWeight: 500 }}>Social Event</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input 
              type="radio" name="type" value="game" 
              checked={formData.type === 'game'} 
              onChange={handleChange}
              style={{ accentColor: COLORS.primary }}
            />
            <span style={{ color: 'white', fontWeight: 500 }}>Game</span>
          </label>
        </div>
      )}

      {/* 2. Core Details */}
      <div style={{ marginBottom: '15px' }}>
        <Input
            label="Event Title" name="title"
            value={formData.title} onChange={handleChange}
            placeholder={formData.type === 'game' ? "e.g. vs. Rockets FC" : "e.g. Team Dinner"}
            required
        />
      </div>

      {/* Date & Time Row */}
      <div style={{ marginBottom: '15px' }}>
        <Input
          label="Date & Time" name="startDateTime" type="datetime-local"
          value={formData.startDateTime} onChange={handleChange} required
        />
      </div>
      
      {/* Location Row (Moved down for better visibility) */}
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
          style={{
              width: '100%', padding: '10px', backgroundColor: '#333', 
              border: `1px solid ${COLORS.border}`, borderRadius: '6px', 
              color: 'white', outline: 'none', resize: 'vertical'
          }}
          value={formData.description} onChange={handleChange}
        />
      </div>

      {/* 3. Invitees Section */}
      <div style={sectionStyle}>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={14} /> Invitees
        </label>

        {/* Universal Search for Users / Groups / Rosters */}
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