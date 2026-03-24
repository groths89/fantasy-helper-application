import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { User, Activity, Zap, TrendingUp, Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react';
import TeamBalanceRadar from '../components/TeamBalanceRadar';
import AnalyzePlayerModal from '../components/AnalyzePlayerModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const LuckIndicator = ({ analysis }) => {
  if (!analysis) return null;
  const { patience_score, luck_delta, recommendation, is_pitcher } = analysis;
  
  // Determine color based on score (High score = Unlucky/Buy = Green)
  let color = "bg-yellow-500";
  let textColor = "text-yellow-700";
  if (patience_score >= 60) { color = "bg-green-500"; textColor = "text-green-700"; }
  else if (patience_score <= 40) { color = "bg-red-500"; textColor = "text-red-700"; }

  return (
    <div className="w-36">
        <div className="flex justify-between text-[10px] font-bold uppercase mb-1 items-center">
            <span className={textColor}>{recommendation}</span>
            <span className="text-gray-400 text-[9px]">{patience_score}/100</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
            <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${patience_score}%` }}></div>
        </div>
        <div className="text-[9px] text-gray-400 text-right">
            Luck Δ: {luck_delta > 0 ? '+' : ''}{luck_delta.toFixed(3)}
        </div>
    </div>
  );
};

export default function TeamAnalysis() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzePlayer, setAnalyzePlayer] = useState(null);
  const [dashboardRecs, setDashboardRecs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch both team data and dashboard recommendations in parallel
        const [teamRes, dashRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/v1/team`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/v1/dashboard`, { withCredentials: true })
        ]);

        setPlayers(teamRes.data);

        if (dashRes.data.strategy && dashRes.data.strategy.recommendations) {
            const dailyRecs = dashRes.data.strategy.recommendations.filter(r =>
                r.message.toLowerCase().includes('start') ||
                r.message.toLowerCase().includes('sit') ||
                r.message.toLowerCase().includes('matchup') ||
                r.message.toLowerCase().includes('stream')
            );
            setDashboardRecs(dailyRecs);
        }
      } catch (err) {
        console.error("Failed to load team data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getIcon = (type) => {
      switch (type) {
          case 'warning': return <AlertTriangle size={16} className="text-orange-600 mt-0.5 shrink-0" />;
          case 'alert': return <AlertTriangle size={16} className="text-red-600 mt-0.5 shrink-0" />;
          case 'success': return <CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" />;
          case 'info': return <Lightbulb size={16} className="text-blue-600 mt-0.5 shrink-0" />;
          default: return <Lightbulb size={16} className="text-yellow-500 fill-yellow-400 mt-0.5 shrink-0" />;
      }
  };

  const getBgColor = (type) => {
      switch (type) {
          case 'warning': return 'bg-orange-50 border-orange-100 text-orange-800';
          case 'alert': return 'bg-red-50 border-red-100 text-red-800';
          case 'success': return 'bg-green-50 border-green-100 text-green-800';
          case 'info': return 'bg-blue-50 border-blue-100 text-blue-800';
          default: return 'bg-white border-gray-100 text-gray-700';
      }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your roster...</div>;

  // Separate Hitters and Pitchers for the table
  const hitters = players.filter(p => !['SP', 'RP', 'P'].some(pos => p.position.includes(pos)));
  const pitchers = players.filter(p => ['SP', 'RP', 'P'].some(pos => p.position.includes(pos)));

  // Generate dynamic insights for Manager's Note
  const getManagerInsights = () => {
    const analyzed = players.filter(p => p.analysis);
    
    if (analyzed.length === 0) {
        return (
            <p>
                Use the table below to compare your players' actual season performance against their pre-season projections. 
                Click the <Zap size={12} className="inline text-purple-600" /> icon to run a real-time Statcast analysis ("Anti-Tilt").
            </p>
        );
    }

    // High Patience Score (>60) means Unlucky -> Buy
    // Low Patience Score (<40) means Lucky -> Sell
    const buys = analyzed.filter(p => p.analysis.patience_score >= 60).sort((a,b) => b.analysis.patience_score - a.analysis.patience_score);
    const sells = analyzed.filter(p => p.analysis.patience_score <= 40);
    const topBuy = buys[0];

    return (
        <div className="space-y-2">
            <p>
                <strong>Roster Intelligence:</strong> AI Analysis identified <span className="font-bold text-green-700">{buys.length} "Buy/Hold"</span> candidates 
                and <span className="font-bold text-red-600">{sells.length} "Sell/Fade"</span> candidates on your roster.
            </p>
            {topBuy && (
                <div className="bg-white/60 p-2 rounded border border-blue-100 text-xs md:text-sm">
                    <span className="font-bold text-green-700">💎 Diamond Hands:</span> <strong>{topBuy.name}</strong> has a Patience Score of {topBuy.analysis.patience_score}/100. 
                    {topBuy.analysis.is_pitcher 
                        ? ` His actual wOBA is significantly higher than his expected wOBA (+${topBuy.analysis.luck_delta}). Better days are ahead.`
                        : ` His expected stats suggest he is getting unlucky (+${topBuy.analysis.luck_delta} delta). Keep him in the lineup.`
                    }
                </div>
            )}
        </div>
    );
  };

  const StatCell = ({ label, val, proj }) => (
    <td className="px-4 py-3 text-center">
      <div className="text-sm font-bold text-gray-800">{val !== undefined ? val : '-'}</div>
      {proj !== undefined && (
        <div className="text-[10px] text-gray-400" title={`Projected `}>
          Proj: {typeof proj === 'number' ? proj.toFixed(label === 'AVG' || label === 'ERA' || label === 'WHIP' ? 2 : 0) : proj}
        </div>
      )}
    </td>
  );

  const getRowStyle = (player) => {
    if (!player.analysis) return "hover:bg-blue-50/30 transition-colors group";
    
    // Score > 60 means Unlucky (Green/Buy)
    if (player.analysis.patience_score >= 60) {
        return "bg-green-50 hover:bg-green-100 transition-colors group border-l-4 border-green-500";
    }
    // Score < 40 means Lucky (Red/Sell)
    if (player.analysis.patience_score <= 40) {
        return "bg-red-50 hover:bg-red-100 transition-colors group border-l-4 border-red-500";
    }
    return "hover:bg-blue-50/30 transition-colors group";
  };

  const PlayerTable = ({ title, data, stats }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 font-bold text-gray-700 uppercase text-xs tracking-wider flex justify-between items-center">
        <span>{title}</span>
        <span className="text-gray-400 font-normal">{data.length} Players</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 border-b border-gray-200">
              <th className="px-6 py-2 text-left">Player</th>
              {stats.map(s => <th key={s} className="px-4 py-2 text-center">{s}</th>)}
              <th className="px-4 py-2 text-center w-48">Statcast Analysis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(p => (
              <tr key={p.id} className={getRowStyle(p)}>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200 flex-shrink-0">
                      {p.headshot ? <img src={p.headshot} alt={p.name} className="w-full h-full object-cover" /> : <User size={20} className="m-2 text-gray-400" />}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{p.name}</div>
                      <div className="text-xs text-gray-500 flex gap-2">
                        <span className="font-semibold text-blue-600">{p.position}</span>
                        <span>{p.team}</span>
                        {p.status && p.status !== 'OK' && <span className="text-red-500 font-bold">{p.status}</span>}
                      </div>
                    </div>
                  </div>
                </td>
                {stats.map(s => (
                    <StatCell key={s} label={s} val={p[s]} proj={p[`proj_`]} />
                ))}
                <td className="px-4 py-3 text-center">
                    {p.analysis ? (
                        <LuckIndicator analysis={p.analysis} />
                    ) : (
                        <button 
                            onClick={() => setAnalyzePlayer(p)}
                            className="text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 p-2 rounded-full transition-colors"
                            title="Run Anti-Tilt Analysis"
                        >
                            <Zap size={16} />
                        </button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <TrendingUp className="text-blue-600" /> Team Analysis
            </h1>
            <p className="text-gray-500 text-sm mt-1">Deep dive into your roster performance and projections.</p>
        </div>
      </div>

      {dashboardRecs.length > 0 && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Lightbulb size={18} className="text-yellow-500 fill-yellow-500" /> Daily Start/Sit Briefing
            </h3>
            <div className="space-y-2">
                {dashboardRecs.map((rec, idx) => (
                    <div key={idx} className={`text-sm p-3 rounded-md border flex gap-3 items-start ${getBgColor(rec.type)}`}>
                        {getIcon(rec.type)}
                        <span className="leading-snug">{rec.message}</span>
                    </div>
                ))}
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Radar Chart */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Activity size={18} className="text-blue-500" /> Category Balance
            </h3>
            <div className="h-[500px]">
                <TeamBalanceRadar team={players} />
            </div>
            <p className="text-xs text-center text-gray-400 mt-4 italic">Based on current roster stats</p>
        </div>
        
        {/* Stats Summary or Insights could go here */}
        <div className="lg:col-span-2 bg-blue-50 rounded-lg p-6 border border-blue-100 flex flex-col justify-center">
            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                <Zap size={18} className="text-yellow-500 fill-yellow-500" /> Manager's Note
            </h3>
            <div className="text-blue-800 text-sm leading-relaxed">
                {getManagerInsights()}
            </div>
        </div>
      </div>

      <PlayerTable title="Hitters" data={hitters} stats={['R', 'HR', 'RBI', 'SB', 'AVG']} />
      <PlayerTable title="Pitchers" data={pitchers} stats={['W', 'SV', 'K', 'ERA', 'WHIP']} />

      <AnalyzePlayerModal player={analyzePlayer} onClose={() => setAnalyzePlayer(null)} />
    </div>
  );
}
