import React from 'react';

const MatchupCard = ({ matchup }) => {
  if (!matchup) return <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse h-40"></div>;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Week 1 Matchup</span>
        <span className="text-xs font-medium text-blue-600 hover:underline cursor-pointer">Full Scoreboard &rarr;</span>
      </div>
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-2xl border-2 border-gray-200">💣</div>
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
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-2xl border-2 border-blue-100">🦈</div>
        </div>
      </div>
    </div>
  );
};

export default MatchupCard;