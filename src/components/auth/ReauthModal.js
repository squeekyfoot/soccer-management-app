import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Import the "brain"

/**
 * This component ONLY worries about the Re-Auth Modal.
 * It has its own local state for the password.
 */
function ReauthModal() {
  // Get what we need from the "brain"
  // We need `reauthenticate` to do the work,
  // `setNeedsReauth` to close the modal,
  // and `loggedInUser` to get the email (which we'll need soon)
  const { loggedInUser, reauthenticate, setNeedsReauth } = useAuth();

  // This state is LOCAL to the modal
  const [reauthPassword, setReauthPassword] = useState("");
  
  // This is a local state just to get the *new* email to pass
  // to the reauthenticate function. This is a bit of a workaround
  // for the fact that the profile form state is in another component.
  // A more advanced solution might use a global state for this.
  const [newEmail, setNewEmail] = useState(loggedInUser.email);

  const handleReauthSubmit = async (e) => {
    e.preventDefault();
    // We pass the password AND the new email to our context function
    const success = await reauthenticate(reauthPassword, newEmail);
    if (success) {
      setNeedsReauth(false); // Close modal on success
      setReauthPassword("");
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <form
        onSubmit={handleReauthSubmit}
        style={{
          display: 'flex', flexDirection: 'column', gap: '15px',
          backgroundColor: '#282c34', padding: '30px', borderRadius: '8px',
          border: '1px solid #61dafb'
        }}
      >
        <h3 style={{ color: 'white', marginTop: 0 }}>Please Confirm Your Identity</h3>
        <p style={{ color: 'white', margin: 0 }}>To change your email, please enter your password.</p>
        
        {/* This is a bit of a hack. The modal doesn't know what the new email is.
          We add a field here to re-enter the new email.
          A better long-term fix would be to pass the new email to the context
          when `setNeedsReauth(true)` is called.
        */}
        <label style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', gap: '5px', color: 'white' }}>
          New Email:
          <input
            type="email"
            placeholder="Enter the NEW email again"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            style={{ padding: '8px' }}
            required
          />
        </label>
        
        <label style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', gap: '5px', color: 'white' }}>
          Password:
          <input
            type="password"
            placeholder="Enter your CURRENT password"
            value={reauthPassword}
            onChange={(e) => setReauthPassword(e.target.value)}
            style={{ padding: '8px' }}
            required
          />
        </label>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" style={{
            padding: '10px 20px', backgroundColor: '#61dafb', border: 'none',
            cursor: 'pointer', fontSize: '16px', flex: 1
          }}>
            Confirm
          </button>
          <button
            type="button"
            onClick={() => {
              setNeedsReauth(false); // Just close the modal
              setReauthPassword("");
            }}
            style={{
              padding: '10px 20px', backgroundColor: '#555', border: 'none',
              color: 'white', cursor: 'pointer', fontSize: '16px', flex: 1
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default ReauthModal;
