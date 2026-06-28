import React from 'react';

export default function Stats({ stats, practiceMode, activeSession }) {
  if (practiceMode) {
    return (
      <div id="statsContainer">
        <div id="practiceStats" className="statCard">
          <div className="statLabel">Practice Mode</div>
          <div className="statValue">Enabled</div>
        </div>
      </div>
    );
  }

  return (
    <div id="statsContainer">
      <div id="normalStats">
        <div className="statCard">
          <div className="statLabel">Session {activeSession}</div>
          <div className="statValue" style={{ fontSize: '0.9rem', paddingTop: '0.2rem' }}>Total Solves: {stats.totalSolves}</div>
        </div>
        <div className="statCard">
          <div className="statLabel">Success Rate</div>
          <div className="statValue">{stats.successRate}%</div>
        </div>
        <div className="statCard">
          <div className="statLabel">Current Streak</div>
          <div className="statValue">{stats.currentStreak}</div>
        </div>
      </div>
    </div>
  );
}
