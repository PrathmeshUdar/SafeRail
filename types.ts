
export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface SafetyAlert {
  id: string;
  timestamp: string;
  type: 'Intrusion' | 'Track Fault' | 'Fog';
  message: string;
  severity: AlertSeverity;
  location: string;
}

export interface TrackStats {
  intrusionDetected: boolean;
  trackHealth: number;
  fogLevel: number;
  visibility: number;
  speed: number;
}

export interface HistoryData {
  time: string;
  incidents: number;
  health: number;
}
