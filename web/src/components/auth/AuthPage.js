import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button'; 
import Input from '../ui/Input';   
import { COLORS } from '../../lib/constants'; 

function AuthPage() {
  const [authView, setAuthView] = useState('signIn');
  const { signIn, signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [signUpForm, setSignUpForm] = useState({
    firstName: "",
    lastName: "",
    preferredName: "",
    email: "",
    password: "",
    phone: "",
    sex: "", 
    birthDate: "",
    notificationPreference: "Email",
    emergencyContactFirstName: "",
    emergencyContactLastName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: ""
  });

  const handleSignInSubmit = (e) => {
    e.preventDefault();
    signIn(email, password);
  };

  const handleSignUpSubmit = (e) => {
    e.preventDefault();
    // Validate Sex selection
    if (!signUpForm.sex) {
        alert("Please select a Sex.");
        return;
    }
    if (!signUpForm.birthDate) {
        alert("Date of Birth is required");
        return;
    }
    signUp(signUpForm);
  };

  const handleSignUpChange = (e) => {
    const { name, value } = e.target;
    setSignUpForm(prev => ({ ...prev, [name]: value }));
  };

  const pageStyle = {
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: COLORS.background, 
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',       
    justifyContent: 'flex-start', 
    paddingTop: '60px',         
    paddingBottom: '60px',      
    paddingLeft: '20px',
    paddingRight: '20px',
    boxSizing: 'border-box',
    overflowY: 'auto'           
  };

  const cardStyle = {
    display: 'flex', 
    flexDirection: 'column', 
    gap: '10px',
    backgroundColor: COLORS.sidebar, 
    padding: '30px',
    borderRadius: '12px', 
    width: '100%', 
    maxWidth: '400px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    boxSizing: 'border-box'
  };

  const selectStyle = {
    width: '100%', padding: '10px', backgroundColor: '#3a3f4a', 
    border: `1px solid ${COLORS.border}`, borderRadius: '4px', color: 'white', fontSize: '16px',
    boxSizing: 'border-box'
  };

  return (
    <div style={pageStyle}>
      <h1 style={{ color: COLORS.primary, marginBottom: '30px', marginTop: 0 }}>Soccer Manager</h1>
      
      {authView === 'signUp' ? (
        <form onSubmit={handleSignUpSubmit} style={cardStyle}>
          <h2 style={{ margin: '0 0 20px 0', color: 'white' }}>Create Account</h2>
          
          <div style={{ display: 'flex', gap: '10px' }}>
             <div style={{ flex: 1 }}><Input label="First Name" name="firstName" value={signUpForm.firstName} onChange={handleSignUpChange} required /></div>
             <div style={{ flex: 1 }}><Input label="Last Name" name="lastName" value={signUpForm.lastName} onChange={handleSignUpChange} required /></div>
          </div>
          <Input label="Preferred Name" name="preferredName" value={signUpForm.preferredName} onChange={handleSignUpChange} />
          
          <Input label="Email" type="email" name="email" value={signUpForm.email} onChange={handleSignUpChange} required />
          <Input label="Password" type="password" name="password" value={signUpForm.password} onChange={handleSignUpChange} required />
          
          <div style={{ display: 'flex', gap: '10px' }}>
             <div style={{ flex: 1, textAlign: 'left' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '14px' }}>
                    Sex <span style={{ color: COLORS.danger }}>*</span>
                </label>
                <select name="sex" value={signUpForm.sex} onChange={handleSignUpChange} style={selectStyle} required>
                    <option value="" disabled>Please select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select>
             </div>
             <div style={{ flex: 1 }}>
                <Input label="Date of Birth" type="date" name="birthDate" value={signUpForm.birthDate} onChange={handleSignUpChange} required />
             </div>
          </div>

          <Input label="Phone" type="tel" name="phone" value={signUpForm.phone} onChange={handleSignUpChange} />
          
          <div style={{ marginBottom: '15px', textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '14px' }}>System Notification Preference</label>
            <select name="notificationPreference" value={signUpForm.notificationPreference} onChange={handleSignUpChange} style={selectStyle}>
              <option value="Email">Email</option>
              <option value="Text Message">Text Message</option>
            </select>
          </div>

          <h4 style={{ margin: '15px 0 5px 0', color: COLORS.primary, textAlign: 'left', borderBottom: '1px solid #444', paddingBottom: '5px' }}>Emergency Contact</h4>
          <div style={{ display: 'flex', gap: '10px' }}>
             <div style={{ flex: 1 }}><Input label="First Name" name="emergencyContactFirstName" value={signUpForm.emergencyContactFirstName} onChange={handleSignUpChange} /></div>
             <div style={{ flex: 1 }}><Input label="Last Name" name="emergencyContactLastName" value={signUpForm.emergencyContactLastName} onChange={handleSignUpChange} /></div>
          </div>
          <Input label="Phone Number" type="tel" name="emergencyContactPhone" value={signUpForm.emergencyContactPhone} onChange={handleSignUpChange} />
          <Input label="Relationship" name="emergencyContactRelationship" value={signUpForm.emergencyContactRelationship} onChange={handleSignUpChange} />

          <div style={{ marginTop: '20px' }}>
            <Button type="submit" variant="primary" style={{ width: '100%' }}>Sign Up</Button>
          </div>
          
          <div style={{ marginTop: '15px', fontSize: '14px', color: '#ccc' }}>
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
          <h2 style={{ margin: '0 0 20px 0', color: 'white' }}>Welcome Back!</h2>
          
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          
          <div style={{ marginTop: '20px' }}>
            <Button type="submit" variant="primary" style={{ width: '100%' }}>Sign In</Button>
          </div>
          
          <div style={{ marginTop: '15px', fontSize: '14px', color: '#ccc' }}>
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
    </div>
  );
}

export default AuthPage;