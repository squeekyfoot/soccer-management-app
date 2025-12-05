import React, { useState } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import { useLeagueManager } from '../../../hooks/useLeagueManager';

const CreateLeagueModal = ({ onClose }) => {
  const { createLeague } = useLeagueManager();
  
  const [name, setName] = useState("");
  const [seasonStart, setSeasonStart] = useState("");
  const [seasonEnd, setSeasonEnd] = useState("");
  const [description, setDescription] = useState("");
  const [gameFrequency, setGameFrequency] = useState("Weekly");
  const [gameDays, setGameDays] = useState([]);
  const [deadline, setDeadline] = useState("");

  const daysOptions = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const toggleDay = (day) => {
    if (gameDays.includes(day)) setGameDays(prev => prev.filter(d => d !== day));
    else setGameDays(prev => [...prev, day]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !seasonStart) return alert("Name and Season Start are required.");

    const leagueData = {
        name,
        seasonStart,
        seasonEnd,
        description,
        gameFrequency,
        gameDays,
        registrationDeadline: deadline,
        earliestGameTime: "18:00",
        latestGameTime: "22:00"
    };

    const success = await createLeague(leagueData);
    if (success) {
        alert("League Created!");
        onClose();
    }
  };

  return (
    <Modal title="Create New League" onClose={onClose} actions={<Button onClick={handleSubmit}>Create League</Button>}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
            <Input label="League Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Metro City Sunday League" />
            
            <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                    <Input label="Season Start" type="date" value={seasonStart} onChange={(e) => setSeasonStart(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                    <Input label="Season End" type="date" value={seasonEnd} onChange={(e) => setSeasonEnd(e.target.value)} />
                </div>
            </div>

            <Input label="Description" multiline value={description} onChange={(e) => setDescription(e.target.value)} />

            <div>
                <label style={{ display: 'block', color: '#ccc', marginBottom: '5px', fontSize: '14px' }}>Game Days</label>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {daysOptions.map(day => (
                        <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            style={{
                                padding: '5px 10px',
                                borderRadius: '4px',
                                border: '1px solid #555',
                                cursor: 'pointer',
                                backgroundColor: gameDays.includes(day) ? '#61dafb' : '#333',
                                color: gameDays.includes(day) ? '#000' : '#fff'
                            }}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            <Input label="Registration Deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </form>
    </Modal>
  );
};

export default CreateLeagueModal;