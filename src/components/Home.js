import React from 'react';
import MyTeams from './MyTeams';
import CalendarView from './CalendarView';

function Home() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
      <h2 style={{ marginBottom: '30px' }}>Dashboard</h2>
      
      {/* Section 1: Schedule (Priority) */}
      <section style={{ marginBottom: '40px' }}>
        <CalendarView />
      </section>

      {/* Section 2: My Teams */}
      <section>
        <h3 style={{ borderBottom: '1px solid #444', paddingBottom: '10px' }}>My Rosters</h3>
        <MyTeams />
      </section>
    </div>
  );
}

export default Home;