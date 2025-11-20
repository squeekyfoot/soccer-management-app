import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Import the "brain"

/**
 * This component manages its own LOCAL state for the forms.
 * It calls functions from the AuthContext to do the work.
 */
function AuthPage() {
  // This state switches between Sign In and Sign Up
  const [authView, setAuthView] = useState('signIn');

  // Get the signIn and signUp functions from our "brain"
  const { signIn, signUp } = useAuth();

  // --- Sign In State ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // --- Sign Up State ---
  const [signUpForm, setSignUpForm] = useState({
    playerName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    notificationPreference: "Email",
    comments: "",
  });

  // --- Form Handlers ---
  const handleSignInSubmit = (e) => {
    e.preventDefault();
    signIn(email, password); // Call the function from the context
  };

  const handleSignUpSubmit = (e) => {
    e.preventDefault();
    signUp(signUpForm); // Call the function from the context
  };

  // This one handler manages all the sign-up form inputs
  const handleSignUpChange = (e) => {
    const { name, value } = e.target;
    setSignUpForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <header className="App-header">
      {authView === 'signUp' ? (
        /* --- SIGN-UP FORM --- */
        <form onSubmit={handleSignUpSubmit} style={{
          display: 'flex', flexDirection: 'column', gap: '15px',
          backgroundColor: '#282c34', padding: '20px',
          borderRadius: '8px', width: '350px'
        }}>
          <h2 style={{ margin: 0, marginBottom: '10px' }}>Create Your Account</h2>
          
          <label style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', gap: '5px' }}>
            Player Name:
            <input
              type="text"
              name="playerName" // 'name' prop is important
              value={signUpForm.playerName}
              onChange={handleSignUpChange}
              required
              style={{ padding: '8px' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', gap: '5px' }}>
            Email:
            <input
              type="email"
              name="email"
              value={signUpForm.email}
              onChange={handleSignUpChange}
              required
              style={{ padding: '8px' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', gap: '5px' }}>
            Password (min 6 characters):
            <input
              type="password"
              name="password"
              value={signUpForm.password}
              onChange={handleSignUpChange}
              required
              style={{ padding: '8px' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', gap: '5px' }}>
            Phone:
            <input
              type="tel"
              name="phone"
              value={signUpForm.phone}
              onChange={handleSignUpChange}
              style={{ padding: '8px' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', gap: '5px' }}>
            Address:
            <input
              type="text"
              name="address"
              value={signUpForm.address}
              onChange={handleSignUpChange}
              style={{ padding: '8px' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', gap: '5px' }}>
            Notification Preference:
            <select
              name="notificationPreference"
              value={signUpForm.notificationPreference}
              onChange={handleSignUpChange}
              style={{ padding: '8px' }}
            >
              <option value="Email">Email</option>
              <option value="Text Message">Text Message</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', gap: '5px' }}>
            Comments:
            <textarea
              name="comments"
              value={signUpForm.comments}
              onChange={handleSignUpChange}
              placeholder="Feel free to contact me anytime."
              style={{ padding: '8px', minHeight: '60px' }}
            />
          </label>
          
          <button type="submit" style={{
            padding: '10px', backgroundColor: '#61dafb', border: 'none',
            cursor: 'pointer', fontSize: '16px', fontWeight: 'bold'
          }}>
            Sign Up
          </button>
          
          <p style={{ fontSize: '14px', marginTop: '15px', marginBottom: '0' }}>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => setAuthView('signIn')}
              style={{
                background: 'none', border: 'none', color: '#61dafb',
                cursor: 'pointer', padding: 0, fontSize: '14px'
              }}
            >
              Sign In
            </button>
          </p>
        </form>

      ) : (
        /* --- SIGN-IN FORM --- */
        <form onSubmit={handleSignInSubmit} style={{
          display: 'flex', flexDirection: 'column', gap: '15px',
          backgroundColor: '#282c34', padding: '20px',
          borderRadius: '8px', width: '350px'
        }}>
          <h2 style={{ margin: 0, marginBottom: '10px' }}>Welcome Back!</h2>
          <label style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', gap: '5px' }}>
            Email:
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ padding: '8px' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', gap: '5px' }}>
            Password:
            <input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ padding: '8px' }}
            />
          </label>
          <button type="submit" style={{
            padding: '10px', backgroundColor: '#61dafb', border: 'none',
            cursor: 'pointer', fontSize: '16px', fontWeight: 'bold'
          }}>
            Sign In
          </button>
          <p style={{ fontSize: '14px', marginTop: '15px', marginBottom: '0' }}>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => setAuthView('signUp')}
              style={{
                background: 'none', border: 'none', color: '#61dafb',
                cursor: 'pointer', padding: 0, fontSize: '14px'
              }}
            >
              Sign Up
            </button>
          </p>
        </form>
      )}
    </header>
  );
}

export default AuthPage;
