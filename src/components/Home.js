import React from 'react';
import MyTeams from './MyTeams';
import CalendarView from './CalendarView';
import Header from './common/Header';

function Home() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'left', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Header title="Dashboard" />
      
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Section 1: Schedule (Priority) */}
        <section style={{ marginBottom: '40px' }}>
          <CalendarView />
        </section>

        {/* Section 2: My Teams */}
        <section>
          <h3 style={{ borderBottom: '1px solid #444', paddingBottom: '10px' }}>My Rosters</h3>
          <MyTeams embedded={true} />
        </section>
      </div>
    </div>
  );
}

export default Home;