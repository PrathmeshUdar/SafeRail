
import React from 'react';
import { SafetyAlert, AlertSeverity } from '../types';

interface AlertsPanelProps {
  alerts: SafetyAlert[];
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts }) => {
  const getSeverityStyles = (severity: AlertSeverity) => {
    switch (severity) {
      case AlertSeverity.CRITICAL: return 'bg-rose-900/20 text-rose-400 border-rose-800';
      case AlertSeverity.HIGH: return 'bg-orange-900/20 text-orange-400 border-orange-800';
      case AlertSeverity.MEDIUM: return 'bg-yellow-900/20 text-yellow-400 border-yellow-800';
      default: return 'bg-blue-900/20 text-blue-400 border-blue-800';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <i className="fas fa-bell text-rose-500"></i>
          Live Alerts
        </h2>
        <span className="bg-slate-700 px-2 py-1 rounded text-xs text-slate-300">
          {alerts.length} Total
        </span>
      </div>
      <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
        {alerts.length === 0 ? (
          <div className="text-slate-500 text-center py-8 bg-slate-800/20 rounded-lg border border-dashed border-slate-700">
            No active alerts detected
          </div>
        ) : (
          alerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`p-3 rounded-lg border transition-all ${getSeverityStyles(alert.severity)}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-sm">{alert.type}</span>
                <span className="text-[10px] opacity-70">{alert.timestamp}</span>
              </div>
              <p className="text-xs mb-1">{alert.message}</p>
              <div className="text-[10px] uppercase font-semibold tracking-tighter opacity-80 flex items-center gap-1">
                <i className="fas fa-location-arrow"></i>
                {alert.location}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;
