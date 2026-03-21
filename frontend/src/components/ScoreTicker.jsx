import React, { useEffect, useState } from 'react';
import { getMLBScores } from '../services/api';
import { Circle } from 'lucide-react';
import GameDetailModal from './GameDetailModal';

const ScoreTicker = () => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    const fetchScores = async () => {
      const data = await getMLBScores();
      setScores(data);
      setLoading(false);
    };

    fetchScores();
    const interval = setInterval(fetchScores, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;
  if (scores.length === 0) return null;

  return (
    <div className="w-full bg-slate-900 text-slate-300 border-b border-slate-800 overflow-hidden h-14 flex items-center shadow-inner">
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 120s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="flex animate-ticker items-center whitespace-nowrap">
        {[...scores, ...scores].map((game, index) => (
          <div 
            key={`${game.id}-${index}`} 
            className="flex items-center gap-3 text-xs font-mono shrink-0 border-r border-slate-700 px-4 py-2 hover:bg-slate-800 transition-colors cursor-pointer min-w-[170px]"
            onClick={() => setSelectedGame(game)}
          >
            <div className="flex flex-col gap-1 w-24">
               <div className="flex justify-between w-full items-center">
                 <div className="flex items-center gap-2">
                    {game.away_id && <img src={`https://www.mlbstatic.com/team-logos/team-cap-on-dark/${game.away_id}.svg`} alt="" className="w-5 h-5 object-contain" />}
                    <span className="font-bold text-white">{game.away}</span>
                 </div>
                 <span className={`font-semibold ${game.is_active ? 'text-white' : 'text-slate-400'}`}>{game.away_score}</span>
               </div>
               <div className="flex justify-between w-full items-center">
                 <div className="flex items-center gap-2">
                    {game.home_id && <img src={`https://www.mlbstatic.com/team-logos/team-cap-on-dark/${game.home_id}.svg`} alt="" className="w-5 h-5 object-contain" />}
                    <span className="font-bold text-white">{game.home}</span>
                 </div>
                 <span className={`font-semibold ${game.is_active ? 'text-white' : 'text-slate-400'}`}>{game.home_score}</span>
               </div>
            </div>
            <div className="text-[10px] text-slate-500 w-16 text-right leading-tight">
               {game.status === 'Live' ? (
                 <div className="text-red-400 font-bold flex flex-col items-end">
                    <span className="flex items-center gap-1"><Circle size={6} fill="currentColor" /> Live</span>
                    <span className="text-slate-300">{game.is_top ? 'Top' : 'Bot'} {game.inning}</span>
                 </div>
               ) : (
                 <span className={game.status === 'Final' ? 'text-slate-400 font-medium' : 'text-slate-500'}>{game.status === 'Final' ? 'F' : game.detailed_status}</span>
               )}
            </div>
          </div>
        ))}
      </div>
      <GameDetailModal game={selectedGame} onClose={() => setSelectedGame(null)} />
    </div>
  );
};

export default ScoreTicker;