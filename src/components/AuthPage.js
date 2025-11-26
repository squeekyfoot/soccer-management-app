import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './common/Button'; // NEW
import Input from './common/Input';   // NEW
import { COLORS } from '../constants'; // NEW

function AuthPage() {
  const [authView, setAuthView] = useState('signIn');
  const { signIn, signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [signUpForm, setSignUpForm] = useState({
    playerName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    notificationPreference: "Email",
    comments: "",
  });

  const handleSignInSubmit = (e) => {
    e.preventDefault();
    signIn(email, password);
  };

  const handleSignUpSubmit = (e) => {
    e.preventDefault();
    signUp(signUpForm);
  };

  const handleSignUpChange = (e) => {
    const { name, value } = e.target;
    setSignUpForm(prev => ({ ...prev, [name]: value }));
  };

  // Container style for the card
  const cardStyle = {
    display: 'flex', flexDirection: 'column', gap: '10px',
    backgroundColor: COLORS.sidebar, padding: '30px',
    borderRadius: '12px', width: '100%', maxWidth: '400px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    boxSizing: 'border-box'
  };

  return (
    <header className="App-header">
      {authView === 'signUp' ? (
        <form onSubmit={handleSignUpSubmit} style={cardStyle}>
          <h2 style={{ margin: '0 0 20px 0' }}>Create Account</h2>
          
          <Input label="Player Name" name="playerName" value={signUpForm.playerName} onChange={handleSignUpChange} required />
          <Input label="Email" type="email" name="email" value={signUpForm.email} onChange={handleSignUpChange} required />
          <Input label="Password" type="password" name="password" value={signUpForm.password} onChange={handleSignUpChange} required />
          <Input label="Phone" type="tel" name="phone" value={signUpForm.phone} onChange={handleSignUpChange} />
          <Input label="Address" name="address" value={signUpForm.address} onChange={handleSignUpChange} />
          
          {/* Select is slightly different, keeping manual for now or could create Select component later */}
          <div style={{ marginBottom: '15px', textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '14px' }}>Notification Preference</label>
            <select
              name="notificationPreference"
              value={signUpForm.notificationPreference}
              onChange={handleSignUpChange}
              style={{ 
                width: '100%', padding: '10px', backgroundColor: '#3a3f4a', 
                border: `1px solid ${COLORS.border}`, borderRadius: '4px', color: 'white', fontSize: '16px' 
              }}
            >
              <option value="Email">Email</option>
              <option value="Text Message">Text Message</option>
            </select>
          </div>

          <Button type="submit" variant="primary">Sign Up</Button>
          
          <div style={{ marginTop: '10px', fontSize: '14px' }}>
            Already have an account?{' '}
            <span 
              onClick={() => setAuthView('signIn')}
              style={{ color: COLORS.primary, cursor: 'pointer', fontWeight: 'bold' }}
            >
              Sign In
            </span>
          </div>
        </form>

      ) : (
        <form onSubmit={handleSignInSubmit} style={cardStyle}>
          <h2 style={{ margin: '0 0 20px 0' }}>Welcome Back!</h2>
          
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          
          <Button type="submit" variant="primary">Sign In</Button>
          
          <div style={{ marginTop: '10px', fontSize: '14px' }}>
            Don't have an account?{' '}
            <span 
              onClick={() => setAuthView('signUp')}
              style={{ color: COLORS.primary, cursor: 'pointer', fontWeight: 'bold' }}
            >
              Sign Up
            </span>
          </div>
        </form>
      )}
    </header>
  );
}

export default AuthPage;