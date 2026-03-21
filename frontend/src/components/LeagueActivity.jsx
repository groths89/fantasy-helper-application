import React from 'react';
import { Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';

const LeagueActivity = ({ activity }) => {
  if (!activity) return <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse h-64"></div>;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Newspaper size={16} className="text-gray-400" />
            <h3 className="font-bold text-sm text-gray-700">League Activity</h3>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {activity.map((item) => (
          <div key={item.id} className="p-3 hover:bg-gray-50 transition-colors cursor-pointer group">
            <div className="text-xs text-gray-400 mb-1 flex justify-between">
              <span>{item.time}</span>
              <span className="group-hover:text-blue-600">Details &rarr;</span>
            </div>
            <p className="text-sm text-gray-800 leading-snug">
              <span className="font-bold text-gray-900">{item.team}</span> 
              {item.action === 'dropped' && (
                  <> dropped <span className="text-red-600">{item.player}</span> and added <span className="text-green-600">{item.added}</span>.</>
              )}
              {item.action === 'added' && (
                  <> added <span className="text-green-600">{item.player}</span> ({item.type}).</>
              )}
              {item.action === 'traded' && (
                  <> {item.details}</>
              )}
            </p>
          </div>
        ))}
      </div>
      <div className="p-2 text-center border-t border-gray-100">
        <Link to="/transactions" className="block w-full py-2 text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wide">
          View All Activity
        </Link>
      </div>
    </div>
  );
};

export default LeagueActivity;