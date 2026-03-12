import React from 'react';
import { Trophy } from 'lucide-react';

const Standings = ({ standings }) => {
  if (!standings) return <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse h-64"></div>;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
        <Trophy size={16} className="text-gray-400" />
        <h3 className="font-bold text-sm text-gray-700">Standings</h3>
      </div>
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-500 font-medium">
          <tr>
            <th className="px-4 py-2 font-normal w-8">#</th>
            <th className="px-4 py-2 font-normal">Team</th>
            <th className="px-4 py-2 font-normal text-right">W-L-T</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {standings.map((team) => (
            <tr key={team.rank} className={`hover:bg-gray-50 ${team.highlight ? 'bg-blue-50/30' : ''}`}>
              <td className="px-4 py-2 text-gray-500">{team.rank}</td>
              <td className={`px-4 py-2 font-medium ${team.highlight ? 'text-blue-700 font-bold' : 'text-gray-800'}`}>{team.name}</td>
              <td className="px-4 py-2 text-right text-gray-600">{team.record}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Standings;