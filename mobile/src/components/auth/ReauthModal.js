import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';

export default function ReauthModal() {
  const { needsReauth, setNeedsReauth, reauthenticate, loggedInUser } = useAuth();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!needsReauth) return null;

  const handleSubmit = async () => {
    if (!password) return;
    setLoading(true);
    // In Mobile, we might just reauth, but web context expects (password, newEmail)
    // If the Context logic stores the 'pending' email inside itself, this works.
    // However, looking at your AuthContext, reauthenticate takes (password, newEmail).
    // BUT the 'updateProfile' logic on web sets 'needsReauth' if it fails.
    // We'll pass the current email as a fallback if the context doesn't track the pending one,
    // essentially just verifying identity.
    const success = await reauthenticate(password, loggedInUser.email);
    setLoading(false);
    if (success) {
        setNeedsReauth(false);
        setPassword("");
    }
  };

  return (
    <Modal 
        visible={needsReauth} 
        title="Security Verification" 
        onClose={() => setNeedsReauth(false)}
        actions={
            <Button onPress={handleSubmit} disabled={loading}>
                {loading ? "Verifying..." : "Confirm Password"}
            </Button>
        }
    >
      <View>
          <Text style={styles.desc}>
              For your security, please confirm your password to continue with this update.
          </Text>
          <Input 
            label="Password" 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
            placeholder="Enter your password"
          />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  desc: { color: '#ccc', marginBottom: 20, lineHeight: 20 }
});