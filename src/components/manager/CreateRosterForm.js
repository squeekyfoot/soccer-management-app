import React, { useState } from 'react';
import Card from '../common/Card';
import Input from '../common/Input';
import Button from '../common/Button';
import { COLORS } from '../../constants';

const CreateRosterForm = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState("");
  const [season, setSeason] = useState("");
  const [capacity, setCapacity] = useState("20");
  const [isDiscoverable, setIsDiscoverable] = useState(false);
  const [addManager, setAddManager] = useState(false);
  const [createGroup, setCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupNameDirty, setGroupNameDirty] = useState(false);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!groupNameDirty) setGroupName(val);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !season) return alert("Please fill in all fields");
    
    onSubmit(
      name, season, capacity, isDiscoverable, 
      { createGroup, groupName }, 
      addManager
    );
  };

  return (
    <Card style={{ marginBottom: '20px', border: `1px solid ${COLORS.primary}` }}>
      <h4 style={{ marginTop: 0, color: 'white' }}>New Roster Details</h4>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <Input label="Roster Name" placeholder="e.g. The Gizmos" value={name} onChange={handleNameChange} />
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <Input label="Season" placeholder="e.g. Fall 2025" value={season} onChange={(e) => setSeason(e.target.value)} />
          </div>
          <div style={{ width: '100px' }}>
            <Input label="Capacity" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </div>
        </div>
        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="checkbox" id="disc" checked={isDiscoverable} onChange={(e) => setIsDiscoverable(e.target.checked)} />
            <label htmlFor="disc">Make this team <strong>Discoverable</strong></label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="checkbox" id="grp" checked={createGroup} onChange={(e) => setCreateGroup(e.target.checked)} />
            <label htmlFor="grp">Create a new <strong>Community Group</strong></label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="checkbox" id="mgr" checked={addManager} onChange={(e) => setAddManager(e.target.checked)} />
            <label htmlFor="mgr">Add <strong>Myself</strong> to this roster</label>
          </div>
        </div>
        {createGroup && (
          <div style={{ marginBottom: '20px' }}>
            <Input label="Group Name" value={groupName} onChange={(e) => { setGroupName(e.target.value); setGroupNameDirty(true); }} />
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
            <Button type="submit">Save Roster</Button>
            <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
};

export default CreateRosterForm;