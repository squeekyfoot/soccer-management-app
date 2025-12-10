import React, { useState, useEffect } from 'react';
import { useUserManager } from '../../../hooks/useUserManager';
import { X } from 'lucide-react';

function UserSearch({ onSelectionChange, initialSelectedUsers = [], placeholder }) {
  const { searchUsers } = useUserManager();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState(initialSelectedUsers);
  const [suggestions, setSuggestions] = useState([]);
  const [cachedUsers, setCachedUsers] = useState([]);

  useEffect(() => {
    const loadUsers = async () => {
      const users = await searchUsers(""); 
      setCachedUsers(users);
    };
    loadUsers();
  }, [searchUsers]);

  // Sync state if parent updates initial props
  useEffect(() => {
      if (initialSelectedUsers.length > 0 && selectedUsers.length === 0) {
          setSelectedUsers(initialSelectedUsers);
      }
  }, [initialSelectedUsers]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSuggestions([]);
      return;
    }
    
    const lowerTerm = searchTerm.toLowerCase();
    
    const filtered = cachedUsers.filter(user => 
      (user.playerName && user.playerName.toLowerCase().includes(lowerTerm)) ||
      (user.email && user.email.toLowerCase().includes(lowerTerm))
    ).filter(user => 
      !selectedUsers.find(s => s.uid === user.uid)
    );

    const exactMatch = filtered.find(u => u.email.toLowerCase() === lowerTerm);
    let finalSuggestions = filtered.slice(0, 5);

    if (!exactMatch && lowerTerm.includes('@')) {
      finalSuggestions.unshift({
        uid: 'manual-' + lowerTerm, 
        playerName: 'Invitee',
        email: searchTerm, 
        isManual: true
      });
    }

    setSuggestions(finalSuggestions);
  }, [searchTerm, cachedUsers, selectedUsers]);

  const notifyParent = (newSelection) => {
      if (onSelectionChange && typeof onSelectionChange === 'function') {
          onSelectionChange(newSelection);
      }
  };

  const addUser = (user) => {
    const newSelection = [...selectedUsers, user];
    setSelectedUsers(newSelection);
    notifyParent(newSelection);
    setSearchTerm("");
    setSuggestions([]);
  };

  const removeUser = (userToRemove) => {
    const newSelection = selectedUsers.filter(u => u.uid !== userToRemove.uid);
    setSelectedUsers(newSelection);
    notifyParent(newSelection);
  };

  return (
    <div style={{ marginBottom: '15px', position: 'relative' }}>
      
      {/* Selected Users (Dark Mode Pills) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
        {selectedUsers.map(user => (
          <div key={user.uid} style={{ 
              backgroundColor: '#333', 
              color: '#eee', 
              borderRadius: '16px', 
              padding: '4px 10px', 
              fontSize: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              border: '1px solid #444'
          }}>
            <span style={{ fontWeight: 600 }}>
                {user.isManual ? user.email : (user.playerName || user.email)}
            </span>
            <button 
              type="button"
              onClick={() => removeUser(user)}
              style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', display: 'flex' }}
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      <input 
        type="text" 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder || "Search name or type email..."}
        style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: '#252525', 
            border: '1px solid #444', 
            color: 'white',
            borderRadius: '6px', 
            boxSizing: 'border-box',
            outline: 'none'
        }}
      />

      {suggestions.length > 0 && (
        <div style={{
          backgroundColor: '#252525', 
          border: '1px solid #444', 
          borderRadius: '4px',
          position: 'absolute', 
          width: '100%', 
          top: '100%',
          left: 0,
          zIndex: 50, 
          maxHeight: '200px', 
          overflowY: 'auto',
          boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
        }}>
          {suggestions.map(user => (
            <div 
              key={user.uid}
              onClick={() => addUser(user)}
              style={{ 
                  padding: '10px', 
                  borderBottom: '1px solid #333', 
                  cursor: 'pointer', 
                  color: 'white' 
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#252525'}
            >
              <div style={{ fontWeight: 'bold' }}>
                {user.isManual ? `Invite via email: "${user.email}"` : user.playerName}
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