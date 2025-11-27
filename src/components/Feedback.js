import React from 'react';
import Header from './common/Header';

function Feedback() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'left', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Header title="Feedback" />
      <div style={{ textAlign: 'center', padding: '50px', color: '#888', flex: 1 }}>
        <p>We value your input!</p>
        <p>This feedback form is coming soon.</p>
      </div>
    </div>
  );
}

export default Feedback;