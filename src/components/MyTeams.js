import React from 'react';
import Header from './common/Header';

function MyTeams({ embedded }) {
  if (embedded) {
     // If embedded in Home, just show content
     return (
       <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
          <p>This page is under construction.</p>
          <p>Here you will see all the teams you are a part of.</p>
       </div>
     );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'left', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Header title="My Teams" />
      <div style={{ textAlign: 'center', padding: '50px', color: '#888', flex: 1 }}>
        <p>This page is under construction.</p>
        <p>Here you will see all the teams you are a part of.</p>
      </div>
    </div>
  );
}

export default MyTeams;