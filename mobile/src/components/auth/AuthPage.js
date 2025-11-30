import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Input from '../common/Input';
import Button from '../common/Button';
import Card from '../common/Card';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp({ email, password, firstName, lastName, role: 'player' });
      }
    } catch (error) {
      Alert.alert("Authentication Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Soccer Manager</Text>
          <Text style={styles.subtitle}>{isLogin ? "Welcome Back" : "Create Account"}</Text>
        </View>
        <Card>
          {!isLogin && (
            <>
              <Input label="First Name" value={firstName} onChangeText={setFirstName} placeholder="John" />
              <Input label="Last Name" value={lastName} onChangeText={setLastName} placeholder="Doe" />
            </>
          )}
          <Input label="Email" value={email} onChangeText={setEmail} placeholder="john@example.com" autoCapitalize="none" />
          <Input label="Password" value={password} onChangeText={setPassword} placeholder="******" secureTextEntry />
          <Button onPress={handleSubmit} isLoading={loading}>{isLogin ? "Sign In" : "Sign Up"}</Button>
        </Card>
        <Button variant="secondary" onPress={() => setIsLogin(!isLogin)}>
          {isLogin ? "Need an account? Sign Up" : "Have an account? Log In"}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scrollContent: { padding: 20, justifyContent: 'center', flexGrow: 1 },
  header: { marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#61dafb', marginBottom: 8 },
  subtitle: { fontSize: 18, color: '#888' },
});