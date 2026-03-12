import React from 'react';
import { List } from 'lucide-react';

const DraftLog = ({ draftLog = [] }) => {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 mb-4">
        <List className="text-blue-600" /> Draft Log
      </h2>
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 flex flex-col-reverse">
        {draftLog.length > 0 ? (
          draftLog.map((pick, index) => (
            <div key={`${pick.player.id}-${index}`} className="flex items-center text-sm p-2 rounded-md bg-gray-50">
              <span className="font-mono text-xs text-gray-400 w-8">{index + 1}.</span>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-800">{pick.player.name}</span>
                <span className={`text-xs ${pick.by === 'me' ? 'text-green-600' : 'text-gray-500'}`}>
                  {pick.by === 'me' ? `Drafted by You (${pick.slot})` : 'Taken by Opponent'}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-3 text-center text-xs text-gray-400 italic">No picks made yet.</div>
        )}
      </div>
    </div>
  );
};

export default DraftLog;