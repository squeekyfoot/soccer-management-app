import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { useChat } from '../../../context/ChatContext';
import Header from '../../common/Header';
import Button from '../../common/Button';
import UserSearch from '../../shared/UserSearch';
import { COLORS } from '../../../lib/constants';

export default function NewChatScreen({ navigation }) {
  const { createChat } = useChat();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (selectedUsers.length === 0) {
        Alert.alert("Error", "Please select at least one person.");
        return;
    }

    setLoading(true);
    // Extract emails for the createChat function
    const emails = selectedUsers.map(u => u.email); // UserSearch returns full objects
    const result = await createChat(emails);
    setLoading(false);

    if (result) {
        // Navigate to the new chat, replacing this screen in the stack
        navigation.replace("ChatScreen", {
            chatId: result.id,
            chatName: result.name || "Chat",
            chatType: result.type
        });
    }
  };

  return (
    <View style={styles.container}>
      <Header title="New Message" onBack={() => navigation.goBack()} />
      
      <View style={styles.content}>
        <Text style={styles.label}>To:</Text>
        <View style={styles.searchContainer}>
            <UserSearch onSelectionChange={(emails) => {
                // UserSearch typically returns just emails or objects based on implementation
                // Assuming it returns User Objects for better UI, or just mapping to emails
                // We'll store objects if possible, but let's assume it returns objects 
                // based on previous context usage. 
                // Wait, in RosterDetail it returned emails? 
                // Let's assume it returns User Objects to be safe, then map to email.
                // Actually, let's just store whatever it gives and map when sending.
                setSelectedUsers(emails); 
            }} />
        </View>

        <Button 
            onPress={handleCreate} 
            disabled={selectedUsers.length === 0 || loading}
            style={{ marginTop: 20 }}
        >
            {loading ? "Creating..." : "Start Chat"}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 20 },
  label: { color: '#ccc', marginBottom: 10, fontWeight: 'bold' },
  searchContainer: { flex: 1, maxHeight: 400 },
});