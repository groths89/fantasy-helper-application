import React, { useEffect, useState, useRef } from 'react';
import { getMatchupDetails, getAntiTiltMetrics } from '../services/api';
import { Swords, TrendingUp, TrendingDown, User, Shield, MessageSquare, Share2, Loader, PlayCircle, Calendar, ArrowUpCircle, ArrowDownCircle, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AntiTiltModal from '../components/AntiTiltModal';

export default function Matchup() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statView, setStatView] = useState('matchup'); // 'matchup', 'season', 'projected'
  const [isSharing, setIsSharing] = useState(false);
  const componentRef = useRef(null);
  const [scoreMode, setScoreMode] = useState('live'); // 'live', 'projected'
  const [winProbAnimation, setWinProbAnimation] = useState(0);
  const [tiltPlayer, setTiltPlayer] = useState(null);
  const [tiltMetrics, setTiltMetrics] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getMatchupDetails();
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Determine winProb early for the effect (safe access)
  const winProb = data?.projections?.win_probability || 50;

  // Animate win probability on load
  useEffect(() => {
    // Small delay to ensure the DOM is ready for transition
    const timer = setTimeout(() => setWinProbAnimation(winProb), 100);
    return () => clearTimeout(timer);
  }, [winProb]);

  if (loading) return <div className="p-8 text-center">Loading matchup...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Failed to load matchup data.</div>;

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      if (componentRef.current) {
        const canvas = await html2canvas(componentRef.current, {
          useCORS: true,
          scale: 2, // High resolution
          backgroundColor: '#f9fafb' // Match app background
        });
        const link = document.createElement('a');
        link.download = `Matchup-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (error) {
      console.error("Share failed:", error);
      alert("Failed to capture image. Please ensure 'html2canvas' is installed: npm install html2canvas");
    } finally {
      setIsSharing(false);
    }
  };

  const { my_team, opponent } = data;
  const projections = data.projections || {};

  // Determine scores to display based on mode
  const myDisplayScore = scoreMode === 'live' ? my_team.score : (projections.my_total || 0).toFixed(1);
  const oppDisplayScore = scoreMode === 'live' ? opponent.score : (projections.opp_total || 0).toFixed(1);
  
  // Determine which stats to show based on selection
  const getStats = (team, view) => {
    if (view === 'season') return team.season_stats;
    if (view === 'projected') return team.projected_stats;
    return team.stats;
  };

  const myStats = getStats(my_team, statView) || {};
  const oppStats = getStats(opponent, statView) || {};

  const myName = my_team.name || 'My Team';
  const oppName = opponent.name || 'Opponent';

  const getTeamLogo = (team) => {
    if (team?.team_logos?.[0]?.team_logo?.url) {
      return team.team_logos[0].team_logo.url;
    }
    return null;
  };

  // Generate chart data from the selected stats
  // Use myStats keys as the base, fallback to empty
  const chartData = Object.keys(myStats).length > 0 ? Object.keys(myStats).map(key => ({
    name: key,
    [myName]: myStats[key],
    [oppName]: oppStats[key] || 0,
  })) : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload;
      const myVal = Number(dataItem[myName] || 0);
      const oppVal = Number(dataItem[oppName] || 0);
      const diff = myVal - oppVal;

      const isInverse = ['ERA', 'WHIP', 'L'].includes(label);
      let diffColor = 'text-gray-500';
      
      if (diff !== 0) {
        // Leading means: Higher is better (diff > 0) OR Lower is better (diff < 0)
        const isLeading = isInverse ? diff < 0 : diff > 0;
        diffColor = isLeading ? 'text-green-600' : 'text-red-600';
      }

      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-sm z-50">
          <p className="font-bold text-gray-800 mb-2 border-b pb-1">{label}</p>
          <div className="space-y-1">
            <div className="flex justify-between gap-6">
              <span className="text-blue-600 font-semibold">{myName}:</span>
              <span>{myVal.toLocaleString(undefined, { maximumFractionDigits: 3 })}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-red-600 font-semibold">{oppName}:</span>
              <span>{oppVal.toLocaleString(undefined, { maximumFractionDigits: 3 })}</span>
            </div>
            <div className="flex justify-between gap-6 pt-1 border-t border-gray-100 font-bold">
              <span className="text-gray-600">Diff:</span>
              <span className={diffColor}>
                {diff > 0 ? '+' : ''}{diff.toLocaleString(undefined, { maximumFractionDigits: 3 })}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleShowTilt = async (player) => {
    if (!player.id) return;
    setTiltPlayer(player);
    const metrics = await getAntiTiltMetrics(player.id);
    setTiltMetrics(metrics);
  };

  const handleCloseTilt = () => {
    setTiltPlayer(null);
    setTiltMetrics(null);
  };

  const DailyScheduleList = ({ teamName, roster, isMyTeam }) => {
    // Create local state for roster to allow optimistic UI updates
    const [localRoster, setLocalRoster] = useState(roster || []);

    const handleToggleStatus = (index) => {
        const newRoster = [...localRoster];
        const player = newRoster[index];
        // Simple toggle logic for simulation
        if (player.current_slot === 'BN') {
            player.current_slot = player.position.split(',')[0]; // Move to primary position
        } else {
            player.current_slot = 'BN';
        }
        setLocalRoster(newRoster);
    };

    // Roster might be undefined if API structure changed or empty
    const activePlayers = localRoster.filter(p => p.game);
    
    return (
        <div className="flex-1">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 text-center">{teamName}</h4>
            {activePlayers.length === 0 ? (
                <div className="text-gray-400 text-sm italic text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">No active players today</div>
            ) : (
                <div className="space-y-2">
                    {activePlayers.map((player, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-md border border-gray-100 hover:shadow-sm transition-shadow">
                            <div className="w-8 h-8 bg-white rounded-full border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                                {player.headshot ? <img src={player.headshot} alt={player.name} className="w-full h-full object-cover" /> : <User size={16} className="text-gray-300" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-gray-800 text-xs truncate">{player.name}</div>
                                <div className="text-[10px] text-gray-500">{player.position}</div>
                            </div>
                            <div className="text-right shrink-0 text-xs">
                                <div className="font-semibold text-gray-700">{player.game.is_home ? 'vs' : '@'} {player.game.opponent}</div>
                                <div className={`text-[10px] ${player.game.status === 'Live' ? 'text-red-600 font-bold animate-pulse' : 'text-gray-400'}`}>
                                    {player.game.status === 'Live' ? 'LIVE' : new Date(player.game.time).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={handleShare}
          disabled={isSharing}
          className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
        >
          {isSharing ? <Loader size={16} className="animate-spin" /> : <Share2 size={16} />}
          {isSharing ? 'Capturing...' : 'Share Matchup'}
        </button>
      </div>

      <div ref={componentRef} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div className="text-center flex-1 flex flex-col items-center">
            {getTeamLogo(my_team) ? (
              <img src={getTeamLogo(my_team)} alt={my_team.name} className="w-16 h-16 rounded-full border-4 border-gray-100 object-cover mb-2 shadow-sm" />
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 border-4 border-gray-50 mb-2 shadow-sm">
                <User size={32} />
              </div>
            )}
            <h2 className="text-lg md:text-xl font-bold leading-tight">{my_team.name}</h2>
            <p className="text-3xl md:text-4xl font-black text-blue-600">{myDisplayScore}</p>
          </div>
          
          <div className="flex flex-col items-center px-4">
            <div className="text-gray-400 font-bold italic mb-2">VS</div>
            <div className="bg-gray-100 p-1 rounded-lg flex items-center shadow-inner">
                <button 
                    onClick={() => setScoreMode('live')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${scoreMode === 'live' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    LIVE
                </button>
                <button 
                    onClick={() => setScoreMode('projected')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${scoreMode === 'projected' ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-600 hover:bg-indigo-50'}`}
                >
                    <PlayCircle size={12} /> SIM
                </button>
            </div>
          </div>

          <div className="text-center flex-1 flex flex-col items-center">
            {getTeamLogo(opponent) ? (
              <img src={getTeamLogo(opponent)} alt={opponent.name} className="w-16 h-16 rounded-full border-4 border-red-50 object-cover mb-2 shadow-sm" />
            ) : (
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-400 border-4 border-red-50 mb-2 shadow-sm">
                <Shield size={32} />
              </div>
            )}
            <h2 className="text-lg md:text-xl font-bold leading-tight">{opponent.name}</h2>
            <p className="text-3xl md:text-4xl font-black text-red-600">{oppDisplayScore}</p>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                <span>Win Probability</span>
                <span>{winProb.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-[1500ms] ease-out ${winProb >= 50 ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${winProbAnimation}%` }}></div>
            </div>
        </div>
      </div>
      
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Matchup Insights</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            {data.insights?.map((insight, i) => (
              <li key={i} className="flex items-start gap-2">
                <TrendingUp size={14} className="mt-1 text-green-500" />
                <span>{insight}</span>
              </li>
            )) || <li>No specific insights available for this matchup.</li>}
          </ul>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="font-bold text-gray-700">Stats Comparison</h3>
              <select 
                value={statView} 
                onChange={(e) => setStatView(e.target.value)}
                className="text-xs bg-gray-50 border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-500"
              >
                <option value="matchup">Matchup (Live)</option>
                <option value="season">Season Totals</option>
                <option value="projected">Rest of Season (Proj)</option>
              </select>
            </div>
            
            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{fontSize: 12}} />
                    <YAxis tick={{fontSize: 12}} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                    <Legend wrapperStyle={{fontSize: '12px'}} />
                    <Bar dataKey={myName} fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey={oppName} fill="#dc2626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 italic bg-gray-50 border border-dashed border-gray-200 rounded">
                  Stats data unavailable
                </div>
              )}
            </div>
        </div>
        </div>
        
        {/* Daily Schedule Section */}
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4 border-b pb-2">
                <Calendar className="text-blue-600" size={20} />
                <h3 className="font-bold text-gray-800 text-lg">Daily Schedule</h3>
            </div>
            <div className="flex flex-col md:flex-row gap-8">
                <DailyScheduleList teamName={my_team.name} roster={my_team.roster} isMyTeam={true} />
                <div className="hidden md:block w-px bg-gray-200"></div>
                <DailyScheduleList teamName={opponent.name} roster={opponent.roster} isMyTeam={false} />
            </div>
        </div>
      </div>
      <AntiTiltModal
        player={tiltPlayer}
        metrics={tiltMetrics}
        onClose={handleCloseTilt}
      />
    </div>
  );
}
