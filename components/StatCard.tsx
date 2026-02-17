
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  colorClass?: string;
  isAlert?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  label, value, unit, icon, trend, colorClass = "text-blue-400", isAlert = false 
}) => {
  return (
    <div className={`bg-slate-800/50 border ${isAlert ? 'border-red-500 animate-pulse-red' : 'border-slate-700'} rounded-xl p-4 transition-all hover:bg-slate-800`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{label}</p>
          <h3 className="text-2xl font-bold mt-1">
            {value}
            <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>
          </h3>
        </div>
        <div className={`text-xl p-3 rounded-lg bg-slate-900/50 ${colorClass}`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          {trend === 'up' && <span className="text-emerald-400"><i className="fas fa-caret-up"></i> Improved</span>}
          {trend === 'down' && <span className="text-rose-400"><i className="fas fa-caret-down"></i> Warning</span>}
          {trend === 'neutral' && <span className="text-slate-400">Stable</span>}
        </div>
      )}
    </div>
  );
};

export default StatCard;
