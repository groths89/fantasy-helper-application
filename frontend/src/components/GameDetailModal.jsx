import React from 'react';
import { X } from 'lucide-react';

const GameDetailModal = ({ game, onClose }) => {
  if (!game) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl p-0 w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-800">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            Game Details
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scoreboard */}
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            {/* Away Team */}
            <div className="flex flex-col items-center gap-2 w-1/3">
               {game.away_id ? (
                 <img src={`https://www.mlbstatic.com/team-logos/team-cap-on-light/${game.away_id}.svg`} alt={game.away} className="w-20 h-20 object-contain drop-shadow-md" />
               ) : (
                 <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold">{game.away}</div>
               )}
               <span className="font-black text-2xl text-gray-800">{game.away}</span>
               <span className="text-4xl font-black text-slate-900">{game.away_score}</span>
            </div>

            {/* VS / Status */}
            <div className="flex flex-col items-center justify-center w-1/3 text-center">
               <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">VS</div>
               {game.status === 'Live' ? (
                 <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                    {game.is_top ? 'TOP' : 'BOT'} {game.inning}
                 </div>
               ) : (
                 <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                    {game.status === 'Final' ? 'FINAL' : game.detailed_status}
                 </div>
               )}
            </div>

            {/* Home Team */}
            <div className="flex flex-col items-center gap-2 w-1/3">
               {game.home_id ? (
                 <img src={`https://www.mlbstatic.com/team-logos/team-cap-on-light/${game.home_id}.svg`} alt={game.home} className="w-20 h-20 object-contain drop-shadow-md" />
               ) : (
                 <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold">{game.home}</div>
               )}
               <span className="font-black text-2xl text-gray-800">{game.home}</span>
               <span className="text-4xl font-black text-slate-900">{game.home_score}</span>
            </div>
          </div>
          
          <div className="text-center">
             <a 
               href={`https://www.mlb.com/gameday/${game.id}`} 
               target="_blank" 
               rel="noopener noreferrer"
               className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition-colors"
             >
               View Full Box Score on MLB.com
             </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetailModal;