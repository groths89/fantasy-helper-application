import React from 'react';
import { Star, X } from 'lucide-react';

const Watchlist = ({ players, onRemove }) => {
  const PlayerRow = ({ player }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <div className="flex flex-col">
        <span className="font-semibold text-sm text-gray-800">{player.name}</span>
        <span className="text-xs text-gray-500">{player.position}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono font-bold text-sm text-blue-600">
          {/* Display VORP for H2H or SGP for Roto */}
          {player.vorp != null ? player.vorp.toFixed(1) : (player.sgp_value != null ? player.sgp_value.toFixed(1) : '')}
        </span>
        {onRemove && (
          <button
            onClick={() => onRemove(player)}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
            title="Remove from watchlist"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
          <Star className="text-yellow-500 fill-yellow-400" /> My Queue
        </h2>
        <span className="text-sm font-medium text-gray-500">{players.length} players</span>
      </div>

      <div className="space-y-2">
        {players.length > 0 ? (
          players.map(p => <PlayerRow key={p.id} player={p} />)
        ) : (
          <div className="py-3 text-center text-xs text-gray-400 italic">No players in your queue. Click the star icon in the table to add players.</div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;