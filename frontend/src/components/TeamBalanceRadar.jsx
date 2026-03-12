import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend, Tooltip, LabelList } from 'recharts';

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
    const entry = { subject: cat.name };
    team.forEach(player => {
      const isPitcher = ['SP', 'RP', 'P'].includes(player.position);
      let score = 0;
      if ((cat.type === 'hitter' && !isPitcher) || (cat.type === 'pitcher' && isPitcher)) {
        const playerStat = player[cat.key] || 0;
        score = Math.round(cat.scale(playerStat)); // Round to integer for cleaner display
      }
      entry[String(player.id)] = score;
    });
    return entry;
  });

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 12 }} />
          <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', border: '1px solid #ccc', borderRadius: '5px' }} />
          <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
          {team.map((player, index) => (
            <Radar
              key={player.id}
              name={player.name}
              dataKey={String(player.id)}
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