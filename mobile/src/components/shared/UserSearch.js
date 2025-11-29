import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import Input from '../common/Input';
import { X } from 'lucide-react-native';

export default function UserSearch({ onSelectionChange }) {
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
        console.error("Error fetching users:", error);
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
    <View style={styles.container}>
      {/* Selected Chips */}
      <View style={styles.chipContainer}>
        {selectedUsers.map(user => (
          <View key={user.uid} style={styles.chip}>
            <Text style={styles.chipText}>
              {user.isManual ? user.email : (user.playerName || user.email)}
            </Text>
            <TouchableOpacity onPress={() => removeUser(user)}>
              <X size={14} color="white" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <Input 
        placeholder="Search name or email..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        autoCapitalize="none"
      />

      {/* Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <View style={styles.dropdown}>
          {suggestions.map(user => (
            <TouchableOpacity 
              key={user.uid} 
              style={styles.suggestionItem}
              onPress={() => addUser(user)}
            >
              <Text style={styles.suggestionName}>
                {user.isManual ? `Use email: "${user.email}"` : user.playerName}
              </Text>
              <Text style={styles.suggestionEmail}>{user.email}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { zIndex: 10 }, // Ensure dropdown floats on top if needed
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0078d4',
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, gap: 6
  },
  chipText: { color: 'white', fontSize: 12, fontWeight: '600' },
  
  dropdown: {
    backgroundColor: '#222', borderWidth: 1, borderColor: '#444', borderRadius: 4,
    marginTop: -10, marginBottom: 10
  },
  suggestionItem: {
    padding: 12, borderBottomWidth: 1, borderBottomColor: '#333'
  },
  suggestionName: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  suggestionEmail: { color: '#aaa', fontSize: 12 }
});