
import React from 'react';

export const INITIAL_TRACK_STATS = {
  intrusionDetected: false,
  trackHealth: 98.4,
  fogLevel: 12,
  visibility: 85,
  speed: 120
};

export const MOCK_HISTORY = [
  { time: '08:00', incidents: 0, health: 99 },
  { time: '09:00', incidents: 1, health: 98 },
  { time: '10:00', incidents: 0, health: 98.5 },
  { time: '11:00', incidents: 2, health: 97 },
  { time: '12:00', incidents: 0, health: 98 },
  { time: '13:00', incidents: 0, health: 98.2 },
  { time: '14:00', incidents: 1, health: 97.5 },
];

export const ICONS = {
  Train: <i className="fas fa-train"></i>,
  Warning: <i className="fas fa-exclamation-triangle"></i>,
  Shield: <i className="fas fa-shield-alt"></i>,
  Cloud: <i className="fas fa-smog"></i>,
  Users: <i className="fas fa-users"></i>,
  Tools: <i className="fas fa-tools"></i>,
  Camera: <i className="fas fa-video"></i>,
  Pulse: <i className="fas fa-heartbeat"></i>,
};
