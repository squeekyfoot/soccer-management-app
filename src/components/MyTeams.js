import React from 'react';
import Header from './common/Header';

function MyTeams({ embedded }) {
  if (embedded) {
     return (
       <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
          <p>This page is under construction.</p>
          <p>Here you will see all the teams you are a part of.</p>
       </div>
     );
  }

  return (
    <div className="view-container">
      <Header title="My Teams" style={{ maxWidth: '1000px', margin: '0 auto' }} />
      <div className="view-content">
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center', color: '#888' }}>
            <p>This page is under construction.</p>
            <p>Here you will see all the teams you are a part of.</p>
        </div>
      </div>
    </div>
  );
}

export default MyTeams;