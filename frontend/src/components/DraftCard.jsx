import React, { useState, useEffect } from 'react';
import { getPlayerValue } from '../services/api';
import { TrendingUp, Activity } from 'lucide-react';

const DraftCard = () => {
  const [stats, setStats] = useState({ 
    hr: 25, 
    rbi: 80, 
    r: 85, 
    sb: 15, 
    bb: 60, 
    k: 140,
    hits: 150 
  });
  const [sgp, setSgp] = useState(0);

  useEffect(() => {
    const fetchValue = async () => {
      const data = await getPlayerValue(stats);
      setSgp(data.sgp_value);
    };
    fetchValue();
  }, [stats]);

  const handleChange = (e) => {
    setStats({ ...stats, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 max-w-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
          <Activity className="text-blue-600" /> Player Evaluator
        </h3>
        <span className={`text-2xl font-black ${sgp >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {sgp} SGP
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {Object.keys(stats).map((key) => (
          <div key={key} className="flex flex-col">
            <label className="text-xs uppercase text-gray-500 mb-1">{key}</label>
            <input
              type="number"
              step={key === 'avg' ? '0.001' : '1'}
              name={key}
              value={stats[key]}
              onChange={handleChange}
              className="bg-gray-50 border border-gray-300 rounded-lg p-2 focus:border-blue-500 outline-none"
            />
          </div>
        ))}
      </div>
      
      <p className="mt-4 text-xs text-gray-500 italic">
        *Calculated for 9-team replacement levels.
      </p>
    </div>
  );
};

export default DraftCard;