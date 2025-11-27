import React from 'react';
import Header from './common/Header';

function Feedback() {
  return (
    <div className="view-container">
      <Header title="Feedback" style={{ maxWidth: '1000px', margin: '0 auto' }} />
      <div className="view-content">
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center', color: '#888' }}>
            <p>We value your input!</p>
            <p>This feedback form is coming soon.</p>
        </div>
      </div>
    </div>
  );
}

export default Feedback;