import React, { useState } from 'react';
import { Zap, TrendingUp, AlertCircle, CheckCircle, Lightbulb, AlertTriangle, X, RefreshCcw } from 'lucide-react';
import AutomationLogs from './AutomationLogs';
import AntiTiltModal from './AntiTiltModal';
import { getAntiTiltMetrics } from '../services/api';
import AnalyzePlayerModal from './AnalyzePlayerModal';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const CustomRadarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const formatVal = (val) => (val !== undefined && val !== null) 
      ? Number(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) 
      : 'N/A';
    
    return (
      <div className="bg-white p-2 border border-gray-200 shadow-md rounded text-xs z-50">
        <p className="font-bold text-gray-800 mb-1">{data.subject}</p>
        <div className="space-y-1">
            <p className="text-blue-600">
                <span className="font-semibold">My Team:</span> {formatVal(data.myRaw)}
            </p>
            <p className="text-gray-500">
                <span className="font-semibold">League Avg:</span> {formatVal(data.avgRaw)}
            </p>
        </div>
      </div>
    );
  }
  return null;
};

const StrategyCenter = ({ strategy }) => {
  const [dismissed, setDismissed] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'critical', 'opportunity'
  const [tiltPlayer, setTiltPlayer] = useState(null);
  const [tiltMetrics, setTiltMetrics] = useState(null);
  const [analyzePlayer, setAnalyzePlayer] = useState(null);

  if (!strategy) return <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse h-64"></div>;

  const getIcon = (type) => {
      switch (type) {
          case 'warning': return <AlertCircle size={16} className="mt-0.5 shrink-0" />;
          case 'alert': return <AlertTriangle size={16} className="mt-0.5 shrink-0" />;
          case 'success': return <TrendingUp size={16} className="mt-0.5 shrink-0" />;
          case 'suggestion': return <Lightbulb size={16} className="mt-0.5 shrink-0" />;
          default: return <CheckCircle size={16} className="mt-0.5 shrink-0" />;
      }
  };

  const getStyles = (type) => {
      switch (type) {
          case 'warning': return 'bg-red-50 text-red-800 border-red-100';
          case 'alert': return 'bg-red-50 text-red-800 border-red-100 font-medium';
          case 'success': return 'bg-green-50 text-green-800 border-green-100';
          case 'suggestion': return 'bg-purple-50 text-purple-800 border-purple-100';
          default: return 'bg-gray-50 text-gray-800 border-gray-100';
      }
  };

  const radarData = strategy.radar_data || [];
  const recommendations = strategy.recommendations || [];

  // Filter logic
  const visibleRecommendations = recommendations
    .map((rec, idx) => ({ ...rec, id: idx })) // Add stable ID for local state
    .filter(rec => !dismissed.includes(rec.id))
    .filter(rec => {
        if (filter === 'all') return true;
        if (filter === 'critical') return ['alert', 'warning'].includes(rec.type);
        if (filter === 'opportunity') return ['suggestion', 'success'].includes(rec.type);
        return true;
    });

  const handleDismiss = (id) => {
      setDismissed(prev => [...prev, id]);
  };

  const handleShowTilt = async (rec) => {
    setTiltPlayer({ name: rec.player_name, id: rec.player_id });
    // Fetch metrics
    const metrics = await getAntiTiltMetrics(rec.player_id);
    setTiltMetrics(metrics);
  };

  const handleCloseTilt = () => {
    setTiltPlayer(null);
    setTiltMetrics(null);
  };

  const handleAnalyze = (rec) => {
    setAnalyzePlayer({ name: rec.player_name, id: rec.player_id });
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
        {/* Radar Chart Section */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex flex-col">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Category Strength (vs League)</h4>
          {radarData.length > 0 ? (
            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="My Team" dataKey="My Team" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                  <Radar name="League Avg" dataKey="League Avg" stroke="#9ca3af" fill="#9ca3af" fillOpacity={0.2} />
                  <Tooltip content={<CustomRadarTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 min-h-[160px] flex items-center justify-center text-gray-400 text-sm italic border-2 border-dashed border-gray-200 rounded bg-white">
              Not enough data for Analysis
            </div>
          )}
        </div>

        {/* Actionable Insights Section */}
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Actionable Insights</h4>
            
            {/* Filter Controls */}
            <div className="flex bg-gray-100 rounded-md p-0.5">
                <button 
                    onClick={() => setFilter('all')}
                    className={`text-[10px] px-2 py-0.5 rounded font-medium transition-all ${filter === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    All
                </button>
                <button 
                    onClick={() => setFilter('critical')}
                    className={`text-[10px] px-2 py-0.5 rounded font-medium transition-all ${filter === 'critical' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Critical
                </button>
                <button 
                    onClick={() => setFilter('opportunity')}
                    className={`text-[10px] px-2 py-0.5 rounded font-medium transition-all ${filter === 'opportunity' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Opp
                </button>
            </div>
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[250px] pr-1">
            {visibleRecommendations.map((rec) => (
                <div key={rec.id} className={`group relative flex items-start gap-3 p-3 rounded-md text-sm border transition-all hover:shadow-md ${getStyles(rec.type)}`}>
                    {getIcon(rec.type)}
                    <div className="flex-1 pr-4">
                        <p className="leading-snug font-medium">{rec.message}</p>
                        {rec.type === 'suggestion' && (
                            <div className="mt-2 flex gap-2">
                                <button 
                                    onClick={() => handleAnalyze(rec)}
                                    className="text-[10px] bg-white/50 hover:bg-white border border-transparent hover:border-purple-200 px-2 py-1 rounded font-bold text-purple-700 transition-colors"
                                >
                                    Analyze Player
                                </button>
                            </div>
                        )}
                        {rec.player_id && (
                            <div className="mt-2">
                                <button 
                                    onClick={() => handleShowTilt(rec)}
                                    className="text-[10px] flex items-center gap-1 bg-white/50 hover:bg-white border border-transparent hover:border-blue-200 px-2 py-1 rounded font-bold text-blue-700 transition-colors"
                                >
                                    <Zap size={10} /> View Anti-Tilt Data
                                </button>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={() => handleDismiss(rec.id)}
                        className="absolute top-2 right-2 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-600 transition-opacity bg-white/50 rounded-full p-0.5"
                        title="Dismiss"
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
            
            {visibleRecommendations.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
                    {dismissed.length === recommendations.length && recommendations.length > 0 ? (
                        <>
                            <CheckCircle size={32} className="mb-2 text-green-100" />
                            <p className="text-sm">All insights cleared!</p>
                            <button onClick={() => setDismissed([])} className="mt-2 flex items-center gap-1 text-xs text-blue-500 font-medium hover:text-blue-600">
                                <RefreshCcw size={12} /> Show all
                            </button>
                        </>
                    ) : (
                        <>
                            <CheckCircle size={32} className="mb-2 text-gray-200" />
                            <p className="text-sm italic">No insights found for this filter.</p>
                        </>
                    )}
                </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <AutomationLogs />
      </div>
      <AntiTiltModal
        player={tiltPlayer}
        metrics={tiltMetrics}
        onClose={handleCloseTilt}
      />
      <AnalyzePlayerModal
        player={analyzePlayer}
        onClose={() => setAnalyzePlayer(null)}
      />
    </div>
  );
};

export default StrategyCenter;
