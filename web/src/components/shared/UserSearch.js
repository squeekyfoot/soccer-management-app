import React, { useState, useEffect } from 'react';
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

function UserSearch({ onSelectionChange }) {
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const users = querySnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        }));
        setAllUsers(users);
      } catch (error) {
        console.error("Error fetching users for search:", error);
      }
    };
    fetchAllUsers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSuggestions([]);
      return;
    }
    
    const lowerTerm = searchTerm.toLowerCase();
    
    // 1. Filter existing users
    const filtered = allUsers.filter(user => 
      (user.playerName && user.playerName.toLowerCase().includes(lowerTerm)) ||
      (user.email && user.email.toLowerCase().includes(lowerTerm))
    ).filter(user => 
      !selectedUsers.find(s => s.uid === user.uid)
    );

    // 2. Check for direct email entry
    const exactMatch = filtered.find(u => u.email.toLowerCase() === lowerTerm);
    
    let finalSuggestions = filtered.slice(0, 5);

    if (!exactMatch && lowerTerm.includes('@')) {
      // Add a "Manual Entry" option
      finalSuggestions.unshift({
        uid: 'manual-' + lowerTerm, 
        playerName: 'Invitee',
        email: searchTerm, 
        isManual: true
      });
    }

    setSuggestions(finalSuggestions);
  }, [searchTerm, allUsers, selectedUsers]);

  const addUser = (user) => {
    const newSelection = [...selectedUsers, user];
    setSelectedUsers(newSelection);
    onSelectionChange(newSelection.map(u => u.email)); 
    setSearchTerm("");
    setSuggestions([]);
  };

  const removeUser = (userToRemove) => {
    const newSelection = selectedUsers.filter(u => u.uid !== userToRemove.uid);
    setSelectedUsers(newSelection);
    onSelectionChange(newSelection.map(u => u.email));
  };

  return (
    <div style={{ marginBottom: '15px', position: 'relative' }}>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '5px' }}>
        {selectedUsers.map(user => (
          <span key={user.uid} style={{
            backgroundColor: '#0078d4', color: 'white', padding: '4px 8px',
            borderRadius: '15px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px'
          }}>
            {user.isManual ? user.email : (user.playerName || user.email)}
            <button 
              onClick={() => removeUser(user)}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </span>
        ))}
      </div>

      <input 
        type="text" 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search name or type email..."
        style={{ 
            width: '100%', 
            padding: '8px', 
            backgroundColor: '#3a3f4a', 
            border: 'none', 
            color: 'white',
            borderRadius: '4px', 
            boxSizing: 'border-box' 
        }}
      />

      {suggestions.length > 0 && (
        <div style={{
          backgroundColor: '#222', 
          border: '1px solid #444', 
          borderRadius: '4px',
          position: 'absolute', 
          width: '100%', // Match input width
          left: 0,       // Align to left edge
          zIndex: 10, 
          maxHeight: '150px', 
          overflowY: 'auto',
          boxSizing: 'border-box' // Prevent border/padding overflow
        }}>
          {suggestions.map(user => (
            <div 
              key={user.uid}
              onClick={() => addUser(user)}
              style={{ padding: '8px', borderBottom: '1px solid #333', cursor: 'pointer', color: 'white' }}
            >
              <div style={{ fontWeight: 'bold' }}>
                {user.isManual ? `Use email: "${user.email}"` : user.playerName}
              </div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>{user.email}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserSearch;