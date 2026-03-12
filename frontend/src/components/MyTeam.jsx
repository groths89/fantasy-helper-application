import React from 'react';
import { Users, X } from 'lucide-react';

const MyTeam = ({ team, onRemove, rosterSettings = {} }) => {
  const PlayerRow = ({ player, assignedSlot }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <div className="flex flex-col">
        <span className="font-semibold text-sm text-gray-800">{player.name}</span>
        <span className="text-xs text-gray-500">{player.position} ({assignedSlot})</span>
      </div>
      {onRemove && (
        <button 
          onClick={() => onRemove(player.id)}
          className="text-gray-400 hover:text-red-500 transition-colors p-1"
          title="Remove player"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );

  const renderRosterSection = (positionType, count) => {
    const playersInSlot = team.filter(p => p.slot === positionType);
    const emptySlots = count - playersInSlot.length;

    return (
      <div key={positionType}>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          {positionType} ({playersInSlot.length} / {count})
        </h3>
        <div className="bg-gray-50 rounded-lg px-3 border border-gray-100">
          {playersInSlot.length > 0 ? (
            playersInSlot.map(p => <PlayerRow key={p.player.id} player={p.player} assignedSlot={p.slot} />)
          ) : (
            <div className="py-3 text-center text-xs text-gray-400 italic">No players drafted</div>
          )}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div key={`empty-${positionType}-${i}`} className="py-3 text-center text-xs text-gray-400 italic border-t border-gray-100 first:border-t-0">
              Empty Slot
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
          <Users className="text-blue-600" /> My Roster
        </h2>
        <span className="text-sm font-medium text-gray-500">{team.length} / {Object.values(rosterSettings).reduce((sum, count) => sum + count, 0)}</span>
      </div>

      <div className="space-y-6">
        {Object.entries(rosterSettings).map(([positionType, count]) => (
          renderRosterSection(positionType, count)
        ))}
      </div>
    </div>
  );
};

export default MyTeam;