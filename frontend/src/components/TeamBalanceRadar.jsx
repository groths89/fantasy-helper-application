import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend, Tooltip, PolarRadiusAxis } from 'recharts';

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', 
  '#00C49F', '#FFBB28', '#FF8042', '#A4DE6C', '#D0ED57',
  '#8dd1e1', '#83a6ed', '#8e44ad', '#e74c3c', '#f1c40f'
];

const TeamBalanceRadar = ({ team }) => {
  const categories = [
    // Hitters
    { key: 'R', name: 'R', type: 'hitter', scale: (v) => Math.min(100, v * 1.2) },
    { key: 'HR', name: 'HR', type: 'hitter', scale: (v) => Math.min(100, v * 3) },
    { key: 'RBI', name: 'RBI', type: 'hitter', scale: (v) => Math.min(100, v * 1.2) },
    { key: 'SB', name: 'SB', type: 'hitter', scale: (v) => Math.min(100, v * 5) },
    { key: 'AVG', name: 'AVG', type: 'hitter', scale: (v) => Math.min(100, Math.max(0, (v - 0.200) / (0.300 - 0.200) * 100)) },
    // Pitchers
    { key: 'W', name: 'W', type: 'pitcher', scale: (v) => Math.min(100, v * 8) },
    { key: 'SV', name: 'SV', type: 'pitcher', scale: (v) => Math.min(100, v * 3) },
    { key: 'SO', name: 'K', type: 'pitcher', scale: (v) => Math.min(100, v / 1.5) },
    { key: 'ERA', name: 'ERA', type: 'pitcher', scale: (v) => Math.min(100, Math.max(0, (5.0 - v) / (5.0 - 2.5) * 100)) },
    { key: 'WHIP', name: 'WHIP', type: 'pitcher', scale: (v) => Math.min(100, Math.max(0, (1.5 - v) / (1.5 - 0.9) * 100)) },
  ];

  const chartData = categories.map(cat => {
    const entry = { subject: cat.name, fullMark: 100 };

    team.forEach((player, index) => {
      const isPitcher = ['SP', 'RP', 'P'].some(pos => (player.position || '').includes(pos));
      
      let score = 0;
      if ((cat.type === 'hitter' && !isPitcher) || (cat.type === 'pitcher' && isPitcher)) {
        const playerStat = Number(player[cat.key]) || 0;
        score = Math.max(0, Math.min(100, cat.scale(playerStat)));
      }
      entry[`p-${index}`] = score;
    });
    
    return entry;
  });

  return (
    <div className="h-[500px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="40%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc', borderRadius: '5px' }} itemStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ paddingTop: '20px', maxHeight: '140px', overflowY: 'auto' }} />
          {team.map((player, index) => (
            <Radar
              key={`radar-${index}`}
              name={player.name}
              dataKey={`p-${index}`}
              stroke={COLORS[index % COLORS.length]}
              fill={COLORS[index % COLORS.length]}
              fillOpacity={0.2}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TeamBalanceRadar;