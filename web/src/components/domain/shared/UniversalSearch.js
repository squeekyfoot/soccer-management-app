import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { useGroupManager } from '../../../hooks/useGroupManager';
import { useRosterManager } from '../../../hooks/useRosterManager';
import { X, User, Users, Shield } from 'lucide-react';
import { COLORS } from '../../../lib/constants';

// Icons mapping helper
const TypeIcon = ({ type }) => {
    if (type === 'group') return <Users size={12} />;
    if (type === 'roster') return <Shield size={12} />;
    return <User size={12} />;
};

function UniversalSearch({ onSelectionChange, initialSelected = [], placeholder }) {
  const { loggedInUser } = useAuth();
  const { fetchUserGroups } = useGroupManager();
  const { fetchUserRosters } = useRosterManager();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState(initialSelected);
  const [suggestions, setSuggestions] = useState([]);
  
  // Local cache for "My Entities"
  const [myGroups, setMyGroups] = useState([]);
  const [myRosters, setMyRosters] = useState([]);

  // 1. Fetch User's Groups & Rosters on mount
  useEffect(() => {
      if (!loggedInUser) return;

      const loadMyEntities = async () => {
          try {
              // Fetch groups/rosters the user is a MEMBER of
              const [groups, rosters] = await Promise.all([
                  fetchUserGroups(loggedInUser.uid),
                  fetchUserRosters(loggedInUser.uid)
              ]);
              setMyGroups(groups || []);
              setMyRosters(rosters || []);
          } catch (err) {
              console.error("Error loading user entities for search:", err);
          }
      };
      loadMyEntities();
  }, [loggedInUser, fetchUserGroups, fetchUserRosters]);

  // 2. Sync state if parent updates initial props
  useEffect(() => {
      if (initialSelected.length > 0 && selectedItems.length === 0) {
          setSelectedItems(initialSelected);
      }
  }, [initialSelected]);

  // 3. Search Logic (Hybrid: Local Filter + Remote Query)
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
        const lowerTerm = searchTerm.toLowerCase();
        const results = [];

        // A. Filter My Groups (Client-Side, Case-Insensitive)
        const matchedGroups = myGroups.filter(g => 
            g.name && g.name.toLowerCase().includes(lowerTerm)
        );
        matchedGroups.forEach(g => results.push({ 
            id: g.id, type: 'group', ...g, label: g.name 
        }));

        // B. Filter My Rosters (Client-Side, Case-Insensitive)
        const matchedRosters = myRosters.filter(r => 
            r.name && r.name.toLowerCase().includes(lowerTerm)
        );
        matchedRosters.forEach(r => results.push({ 
            id: r.id, type: 'roster', ...r, label: r.name 
        }));

        // C. Search Users (Remote Firestore Query)
        try {
            const usersQ = query(
                collection(db, 'users'), 
                where('email', '>=', lowerTerm), 
                where('email', '<=', lowerTerm + '\uf8ff'),
                limit(3)
            );
            
            const userSnap = await getDocs(usersQ);
            userSnap.forEach(doc => {
                // Don't add yourself
                if (doc.id !== loggedInUser?.uid) {
                    results.push({ 
                        id: doc.id, type: 'user', ...doc.data(), 
                        label: doc.data().playerName || doc.data().email 
                    });
                }
            });
        } catch (error) {
            console.error("Error searching users:", error);
        }

        // D. Filter out already selected items
        const filtered = results.filter(r => !selectedItems.find(s => s.id === r.id));
        setSuggestions(filtered);

    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedItems, myGroups, myRosters, loggedInUser]);

  const addItem = (item) => {
    const newSelection = [...selectedItems, item];
    setSelectedItems(newSelection);
    if (onSelectionChange) onSelectionChange(newSelection);
    setSearchTerm("");
    setSuggestions([]);
  };

  const removeItem = (id) => {
    const newSelection = selectedItems.filter(i => i.id !== id);
    setSelectedItems(newSelection);
    if (onSelectionChange) onSelectionChange(newSelection);
  };

  return (
    <div style={{ marginBottom: '15px', position: 'relative' }}>
      
      {/* Selected Items (Pills) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
        {selectedItems.map(item => (
          <div key={item.id} style={{ 
              backgroundColor: '#333', 
              color: '#eee', 
              borderRadius: '16px', 
              padding: '4px 10px', 
              fontSize: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              border: `1px solid ${item.type === 'user' ? '#444' : COLORS.primary}`
          }}>
            <TypeIcon type={item.type} />
            <span style={{ fontWeight: 600 }}>{item.label}</span>
            <button 
              type="button"
              onClick={() => removeItem(item.id)}
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
        placeholder={placeholder || "Search people, groups, or teams..."}
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
          {suggestions.map(item => (
            <div 
              key={item.id}
              onClick={() => addItem(item)}
              style={{ 
                  padding: '10px', 
                  borderBottom: '1px solid #333', 
                  cursor: 'pointer', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px' 
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#252525'}
            >
              <div style={{ color: '#888' }}><TypeIcon type={item.type} /></div>
              <div>
                  <div style={{ fontWeight: 'bold' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>{item.type}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UniversalSearch;