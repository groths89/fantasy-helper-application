import React from 'react';
import { Zap, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import AutomationLogs from './AutomationLogs';

const StrategyCenter = ({ strategy }) => {
  if (!strategy) return <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse h-64"></div>;

  const getIcon = (type) => {
      switch (type) {
          case 'warning': return <AlertCircle size={16} className="mt-0.5 shrink-0" />;
          case 'success': return <TrendingUp size={16} className="mt-0.5 shrink-0" />;
          default: return <CheckCircle size={16} className="mt-0.5 shrink-0" />;
      }
  };

  const getStyles = (type) => {
      switch (type) {
          case 'warning': return 'bg-red-50 text-red-800 border-red-100';
          case 'success': return 'bg-blue-50 text-blue-800 border-blue-100';
          default: return 'bg-gray-50 text-gray-800 border-gray-100';
      }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
          <Zap className="text-yellow-500 fill-yellow-500" size={20} />
          Intelligence Engine
        </h3>
        <span className="text-xs font-medium text-gray-400">Last updated: Just now</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex flex-col">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Roster Balance (SGP)</h4>
          <div className="flex-1 min-h-[160px] flex items-center justify-center text-gray-400 text-sm italic border-2 border-dashed border-gray-200 rounded bg-white">
            Radar Chart Placeholder
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Anti-Tilt Monitor</h4>
          {strategy.recommendations.map((rec, idx) => (
            <div key={idx} className={`flex items-start gap-3 p-3 rounded-md text-sm border ${getStyles(rec.type)}`}>
                {getIcon(rec.type)}
                <p>{rec.message}</p>
            </div>
          ))}
          <button className="w-full py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-100 transition-colors">
                View All Recommendations
          </button>
        </div>
      </div>
      
      <div className="mt-8">
        <AutomationLogs />
      </div>
    </div>
  );
};

export default StrategyCenter;