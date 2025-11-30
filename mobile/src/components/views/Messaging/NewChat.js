import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { useChat } from '../../../context/ChatContext';
import Header from '../../common/Header';
import Button from '../../common/Button';
import UserSearch from '../../shared/UserSearch';
import { COLORS } from '../../../../lib/constants';

export default function NewChat({ navigation }) {
  const { createChat } = useChat();
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (selectedEmails.length === 0) {
        Alert.alert("Error", "Please select at least one person.");
        return;
    }

    setLoading(true);
    // FIX: UserSearch returns an array of email strings, not objects.
    // Passed directly to createChat.
    const result = await createChat(selectedEmails);
    setLoading(false);

    if (result) {
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
            <UserSearch onSelectionChange={setSelectedEmails} />
        </View>

        <Button 
            onPress={handleCreate} 
            disabled={selectedEmails.length === 0 || loading}
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