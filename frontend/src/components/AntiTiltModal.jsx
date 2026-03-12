import React from 'react';
import { X, TrendingUp, TrendingDown, ShieldCheck, Loader } from 'lucide-react';

const AntiTiltModal = ({ player, metrics, onClose }) => {
  if (!player) return null;

  const luckColor = metrics && metrics.luck_delta > 0 ? 'text-green-600' : 'text-red-600';
  const LuckIcon = metrics && metrics.luck_delta > 0 ? TrendingUp : TrendingDown;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h2 className="text-xl font-bold text-gray-800">{player.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        {!metrics ? (
          <div className="flex items-center justify-center h-32">
            <Loader className="animate-spin text-blue-500" size={32} />
            <span className="ml-3 text-gray-500">Fetching Statcast Data...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Anti-Tilt Analysis</h3>
              <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                {metrics.recommendation}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                <h4 className="text-xs font-bold text-gray-500 uppercase">Luck Delta</h4>
                <div className={`flex items-center justify-center gap-2 mt-2 ${luckColor}`}>
                  <LuckIcon size={20} />
                  <span className="text-2xl font-black">{metrics.luck_delta > 0 ? `+${metrics.luck_delta.toFixed(3)}` : metrics.luck_delta.toFixed(3)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">xBA vs BA</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                <h4 className="text-xs font-bold text-gray-500 uppercase">Patience Score</h4>
                <div className="flex items-center justify-center gap-2 mt-2 text-blue-600">
                  <ShieldCheck size={20} />
                  <span className="text-2xl font-black">{metrics.patience_score}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Chase % vs League Avg</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AntiTiltModal;