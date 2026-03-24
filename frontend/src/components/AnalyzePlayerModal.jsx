import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Activity, Loader, ExternalLink } from 'lucide-react';
import { getAntiTiltMetrics } from '../services/api';

const LuckIndicator = ({ analysis }) => {
  if (!analysis) return null;
  const { patience_score, luck_delta, recommendation, is_pitcher } = analysis;
  
  // Determine color based on score (High score = Unlucky/Buy = Green)
  let color = "bg-yellow-500";
  let textColor = "text-yellow-700";
  if (patience_score >= 60) { color = "bg-green-500"; textColor = "text-green-700"; }
  else if (patience_score <= 40) { color = "bg-red-500"; textColor = "text-red-700"; }

  return (
    <div className="w-full bg-gray-50 p-4 rounded-lg border border-gray-100">
        <div className="flex justify-between text-xs font-bold uppercase mb-2 items-center">
            <span className={textColor}>{recommendation}</span>
            <span className="text-gray-500">{patience_score}/100</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${patience_score}%` }}></div>
        </div>
        <div className="text-[10px] text-gray-400 text-right">
            Luck Δ ({is_pitcher ? 'wOBA - xwOBA' : 'xwOBA - wOBA'}): {luck_delta > 0 ? '+' : ''}{luck_delta.toFixed(3)}
        </div>
    </div>
  );
};

const AnalyzePlayerModal = ({ player, onClose }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (player && player.id) {
      setLoading(true);
      getAntiTiltMetrics(player.id)
        .then(data => {
          setMetrics(data);
        })
        .catch(err => {
          console.error("Failed to fetch analysis", err);
          setMetrics(null);
        })
        .finally(() => setLoading(false));
    }
  }, [player]);

  if (!player) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl p-0 w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-purple-600 px-6 py-4 flex justify-between items-center text-white">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Activity size={20} /> Player Analysis
          </h2>
          <button onClick={onClose} className="text-purple-200 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-2xl font-black text-gray-800 mb-1">{player.name}</h3>
            <div className="flex gap-2">
                <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded uppercase">Waiver Target</span>
                <span className="text-xs text-gray-500 flex items-center gap-1">ID: {player.id}</span>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 space-y-3">
              <Loader className="animate-spin text-purple-600" size={32} />
              <span className="text-sm text-gray-500 font-medium">Crunching Statcast Data...</span>
            </div>
          ) : metrics ? (
            <div className="space-y-4">
              <LuckIndicator analysis={metrics} />
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-100">
                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Expected Luck</div>
                    <div className={`text-2xl font-black ${metrics.luck_delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {metrics.luck_delta > 0 ? '+' : ''}{metrics.luck_delta.toFixed(3)}
                    </div>
                    <div className="text-[10px] text-gray-400">xBA - AVG Diff</div>
                 </div>
                 <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-100">
                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Patience Score</div>
                    <div className="text-2xl font-black text-blue-600">{metrics.patience_score}</div>
                    <div className="text-[10px] text-gray-400">Plate Discipline (0-100)</div>
                 </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <p>No advanced analysis available for this player.</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Close</button>
            <a 
                href={`https://sports.yahoo.com/mlb/players/${player.id}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
                View on Yahoo <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyzePlayerModal;