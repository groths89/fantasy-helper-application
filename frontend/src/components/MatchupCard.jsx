import React from 'react';
import { TrendingUp, User, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const MatchupCard = ({ matchup }) => {
  if (!matchup) return <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse h-40"></div>;
  const navigate = useNavigate();

  return (
    <div onClick={() => navigate('/matchup')} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Week 1 Matchup</span>
        <span className="text-xs font-medium text-blue-600 hover:underline">Full Scoreboard &rarr;</span>
      </div>
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {matchup.team_logo ? (
            <img src={matchup.team_logo} alt={matchup.team_name} className="w-14 h-14 rounded-full border-2 border-gray-200 object-cover" />
          ) : (
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 border-2 border-gray-200"><User /></div>
          )}
          <div>
            <div className="font-bold text-lg leading-none text-gray-900">{matchup.team_name}</div>
            <div className="text-sm text-gray-500 mt-1">{matchup.team_owner} ({matchup.team_record})</div>
          </div>
        </div>
        <div className="flex flex-col items-center px-4">
            <div className="text-3xl font-black text-gray-800 tracking-tight">
            {matchup.team_score} - {matchup.opponent_score}
            </div>
            {matchup.winning ? (
                <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded mt-1">Winning</div>
            ) : (
                <div className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded mt-1">Losing</div>
            )}
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <div className="font-bold text-lg leading-none text-gray-900">{matchup.opponent_name}</div>
            <div className="text-sm text-gray-500 mt-1">{matchup.opponent_owner} ({matchup.opponent_record})</div>
          </div>
          {matchup.opponent_logo ? (
            <img src={matchup.opponent_logo} alt={matchup.opponent_name} className="w-14 h-14 rounded-full border-2 border-blue-100 object-cover" />
          ) : (
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-400 border-2 border-blue-100"><Shield /></div>
          )}
        </div>
      </div>
      {matchup.win_probability !== undefined && (
        <div className="px-6 pb-4">
          <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
            <span>Win Probability</span>
            <span className={matchup.win_probability >= 50 ? 'text-blue-600' : 'text-red-500'}>
              {matchup.win_probability.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-2.5 rounded-full ${matchup.win_probability >= 50 ? 'bg-blue-600' : 'bg-red-500'}`} 
              style={{ width: `${matchup.win_probability}%` }}
            ></div>
          </div>
          <div className="mt-2 text-center text-xs text-gray-400 italic">
            Projected Winner: {matchup.win_probability >= 50 ? 'You' : 'Opponent'}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchupCard;