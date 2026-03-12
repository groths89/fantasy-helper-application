import React from 'react';
import { User } from 'lucide-react';

const TeamHeader = () => {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4">
         <div className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-3">
               <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-2xl shadow-inner">
                  💣
               </div>
               <div>
                  <h1 className="text-2xl font-bold text-gray-800 leading-none">
                      The Bronx Bombers
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-100">9-Team League</span>
                      <span className="text-xs text-gray-500">• 2nd Place</span>
                  </div>
               </div>
            </div>
            <div className="flex gap-3">
               <button className="text-sm px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 font-semibold transition-colors shadow-sm">Edit Team</button>
               <button className="bg-primary-600 hover:bg-primary-700 text-white text-sm px-4 py-2 rounded-md font-bold shadow-sm transition-colors flex items-center gap-2">
                  <User size={16} /> Add Player
               </button>
            </div>
         </div>
         
         <div className="flex gap-8 mt-2 overflow-x-auto no-scrollbar border-t border-gray-100 pt-1">
            {['Overview', 'Roster', 'Matchups', 'Trading Block', 'Draft Results', 'Settings'].map((tab, i) => (
                <button key={tab} className={`py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${i === 0 ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                    {tab}
                </button>
            ))}
         </div>
      </div>
    </div>
  );
};

export default TeamHeader;