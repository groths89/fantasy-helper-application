import React from 'react';

const BenchComparisonChart = ({ projections }) => {
  if (!projections) return null;

  const {
    my_starters_remaining = 0,
    my_bench_remaining = 0,
    opp_starters_remaining = 0,
    opp_bench_remaining = 0
  } = projections;

  // Calculate totals to determine bar widths
  const myTotal = my_starters_remaining + my_bench_remaining;
  const oppTotal = opp_starters_remaining + opp_bench_remaining;
  const maxTotal = Math.max(myTotal, oppTotal, 1); // Ensure no division by zero

  const getWidth = (val) => `${(val / maxTotal) * 100}%`;

  return (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-xs font-bold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
        Projected Production: Starters vs Bench
      </h3>
      
      <div className="space-y-6">
        {/* My Team */}
        <div className="group">
          <div className="flex justify-between text-xs mb-1.5 font-medium">
            <span className="text-gray-700">My Team</span>
            <div className="flex gap-3 text-[10px]">
                <span className="text-blue-600 font-bold">{my_starters_remaining.toFixed(1)} Starters</span>
                <span className="text-gray-300">|</span>
                <span className="text-blue-400 font-bold">{my_bench_remaining.toFixed(1)} Bench</span>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 flex overflow-hidden">
            <div 
              className="bg-blue-600 h-full transition-all duration-700 ease-out relative group-hover:bg-blue-500" 
              style={{ width: getWidth(my_starters_remaining) }}
              title={`Starters: ${my_starters_remaining.toFixed(1)}`}
            ></div>
            <div 
              className="bg-blue-200 h-full transition-all duration-700 ease-out relative group-hover:bg-blue-300" 
              style={{ width: getWidth(my_bench_remaining) }}
              title={`Bench: ${my_bench_remaining.toFixed(1)}`}
            ></div>
          </div>
        </div>

        {/* Opponent */}
        <div className="group">
          <div className="flex justify-between text-xs mb-1.5 font-medium">
            <span className="text-gray-700">Opponent</span>
             <div className="flex gap-3 text-[10px]">
                <span className="text-red-600 font-bold">{opp_starters_remaining.toFixed(1)} Starters</span>
                <span className="text-gray-300">|</span>
                <span className="text-red-300 font-bold">{opp_bench_remaining.toFixed(1)} Bench</span>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 flex overflow-hidden">
             <div 
              className="bg-red-600 h-full transition-all duration-700 ease-out relative group-hover:bg-red-500" 
              style={{ width: getWidth(opp_starters_remaining) }}
              title={`Starters: ${opp_starters_remaining.toFixed(1)}`}
            ></div>
            <div 
              className="bg-red-200 h-full transition-all duration-700 ease-out relative group-hover:bg-red-300" 
              style={{ width: getWidth(opp_bench_remaining) }}
              title={`Bench: ${opp_bench_remaining.toFixed(1)}`}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenchComparisonChart;