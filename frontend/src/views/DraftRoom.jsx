import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { getRankings, getAntiTiltMetrics } from '../services/api';
import DraftTable from '../components/DraftTable';
import TeamBalanceRadar from '../components/TeamBalanceRadar';
import MyTeamComponent from '../components/MyTeam';
import WatchlistComponent from '../components/Watchlist';
import AIRecommendations from '../components/AIRecommendations';
import DraftLog from '../components/DraftLog';
import AntiTiltModal from '../components/AntiTiltModal';
import { Swords, Info, Search, ChevronDown, RefreshCw } from 'lucide-react';

const ROSTER_SETTINGS = {
  C: 1,
  '1B': 1,
  '2B': 1,
  'SS': 1,
  '3B': 1,
  OF: 3,
  UTIL: 2,
  SP: 4,
  RP: 2,
  P: 1,
  Bench: 6,
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const DraftRoom = () => {
  const [players, setPlayers] = useState([]);
  const [page, setPage] = useState(0);
  const [scoringSystem, setScoringSystem] = useState('h2h');
  const [draftLog, setDraftLog] = useState([]); // Stores { player, by: 'me' | 'opponent', slot? }
  const [lastDrafted, setLastDrafted] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL'); // 'ALL', 'H', 'P', 'C', '1B', etc.
  const [previewPlayer, setPreviewPlayer] = useState(null);
  const [tiltPlayer, setTiltPlayer] = useState(null);
  const [tiltMetrics, setTiltMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiveSync, setIsLiveSync] = useState(false);

  // --- Derived State from Draft Log ---
  const myTeam = useMemo(() => draftLog.filter(p => p.by === 'me'), [draftLog]);
  const allTakenPlayers = useMemo(() => draftLog.map(p => p.player), [draftLog]);
  const allTakenPlayerIds = useMemo(() => new Set(allTakenPlayers.map(p => p.id)), [allTakenPlayers]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setPage(0);
      try {
        const data = await getRankings(scoringSystem, { pageParam: 0, limit: 50 });
        setPlayers(data);
      } catch (err) {
        console.error("API Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [scoringSystem]);

  // --- Live Draft Sync ---
  useEffect(() => {
    let interval;
    if (isLiveSync) {
      const syncDraft = async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/v1/draft/live`, { withCredentials: true });
          const livePicks = res.data;
          
          setDraftLog(prevLog => {
            const newLog = [...prevLog];
            const existingIds = new Set(newLog.map(l => l.player.id));
            
            // Get current 'me' team from log to calculate slots for incoming 'me' picks
            const currentMyTeam = newLog.filter(l => l.by === 'me');
            let logChanged = false;
            
            livePicks.forEach(pick => {
               if (!existingIds.has(pick.player.id)) {
                   logChanged = true;
                   if (pick.by === 'opponent') {
                       newLog.push({ player: pick.player, by: 'opponent', pick: pick.pick });
                   } else {
                       // Logic to assign slot for "me" picks coming from API
                       const assignedSlot = findAvailableSlot(pick.player, currentMyTeam);
                       const entry = { 
                           player: pick.player, 
                           slot: assignedSlot || 'Bench', 
                           by: 'me', 
                           pick: pick.pick 
                       };
                       newLog.push(entry);
                       currentMyTeam.push(entry);
                   }
               }
            });
            return logChanged ? newLog.sort((a,b) => (a.pick || 0) - (b.pick || 0)) : prevLog;
          });
        } catch (e) { console.error("Sync error", e); }
      };
      syncDraft(); // Run once immediately
      interval = setInterval(syncDraft, 10000); // Poll every 10s
    }
    return () => clearInterval(interval);
  }, [isLiveSync]);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoading(true);
    try {
      const data = await getRankings(scoringSystem, { pageParam: nextPage, limit: 50 });
      setPlayers(prev => [...prev, ...data]);
      setPage(nextPage);
    } catch (err) {
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const findAvailableSlot = (player, currentTeam) => {
    const eligiblePositions = player.position ? player.position.split(',').map(p => p.trim()) : [];

    // Determine if the player is primarily a hitter or pitcher for general slots
    const isPitcherEligible = eligiblePositions.some(pos => ['SP', 'RP', 'P'].includes(pos));
    const isHitterEligible = eligiblePositions.some(pos => ['C', '1B', '2B', 'SS', '3B', 'OF'].includes(pos));

    const filledSlotsCount = currentTeam.reduce((acc, p) => {
      acc[p.slot] = (acc[p.slot] || 0) + 1;
      return acc;
    }, {});

    // 1. Try to fill exact primary position matches (ordered by common fantasy priority)
    const primaryPositionsOrder = ['C', '1B', '2B', 'SS', '3B', 'OF', 'SP', 'RP'];
    for (const primaryPos of primaryPositionsOrder) {
      if (eligiblePositions.includes(primaryPos) && ROSTER_SETTINGS[primaryPos] && (filledSlotsCount[primaryPos] || 0) < ROSTER_SETTINGS[primaryPos]) {
        return primaryPos;
      }
    }

    // 1.5. Try to fill generic P slot for any pitcher (SP, RP, or P)
    if (isPitcherEligible && ROSTER_SETTINGS['P'] && (filledSlotsCount['P'] || 0) < ROSTER_SETTINGS['P']) {
      return 'P';
    }

    // 2. Try to fill UTIL slots for hitters
    if (isHitterEligible && (filledSlotsCount['UTIL'] || 0) < ROSTER_SETTINGS['UTIL']) {
      return 'UTIL';
    }

    // 3. Try to fill Bench slots for any player
    if ((filledSlotsCount['Bench'] || 0) < ROSTER_SETTINGS['Bench']) {
      return 'Bench';
    }

    return null; // No available slot
  };

  const addToTeam = (player) => {
    if (allTakenPlayerIds.has(player.id)) {
      return; // Player already on team
    }

    const assignedSlot = findAvailableSlot(player, myTeam);

    if (assignedSlot) {
      setDraftLog(prevLog => [...prevLog, { player, slot: assignedSlot, by: 'me' }]);
      setLastDrafted(player);
      setPreviewPlayer(null);
    } else {
      alert("No available roster spots for this player!"); // Or some other UI feedback
    }
  };

  const markAsTaken = (player) => {
    if (allTakenPlayerIds.has(player.id)) {
      return; // Player already drafted
    }
    setDraftLog(prevLog => [...prevLog, { player, by: 'opponent' }]);
    setPreviewPlayer(null);
  };

  const removeFromTeam = (playerId) => {
    setDraftLog(prevLog => prevLog.filter(p => !(p.by === 'me' && p.player.id === playerId)));
    if (lastDrafted && lastDrafted.id === playerId) {
      setLastDrafted(null);
    }
  };

  const handleShowTilt = async (player) => {
    setTiltPlayer(player);
    // Fetch metrics after opening modal to show loading state
    const metrics = await getAntiTiltMetrics(player.id);
    setTiltMetrics(metrics);
  };

  const handleCloseTilt = () => {
    setTiltPlayer(null);
    setTiltMetrics(null);
  };

  const toggleWatchlist = (player) => {
    setWatchlist(prev => {
      if (prev.some(p => p.id === player.id)) {
        return prev.filter(p => p.id !== player.id);
      }
      // Add and sort by value
      return [...prev, player].sort((a, b) => (b.vorp || b.sgp_value || 0) - (a.vorp || a.sgp_value || 0));
    });
  };

  const filteredPlayers = players.filter(player => {
    // Check if player is on my team or taken by another team
    if (allTakenPlayerIds.has(player.id)) return false;

    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    const playerPositions = player.position ? player.position.split(',').map(p => p.trim()) : [];

    if (positionFilter === 'ALL') {
      return true;
    }

    const pitcherPositions = ['SP', 'RP', 'P'];
    
    if (positionFilter === 'H') {
      // A player is a hitter if they have at least one non-pitcher position.
      return playerPositions.some(p => !pitcherPositions.includes(p) && p !== 'Util');
    }
    if (positionFilter === 'P') {
      // A player is a pitcher if they have at least one pitcher position.
      return playerPositions.some(p => pitcherPositions.includes(p));
    }
    
    return playerPositions.includes(positionFilter);
  });

  const teamForRadar = useMemo(() => {
    const baseTeamPlayers = myTeam.map(p => p.player); // Radar only needs player objects
    if (!previewPlayer) return baseTeamPlayers;

    const isPlayerInTeam = baseTeamPlayers.some(p => p.id === previewPlayer.id);

    if (isPlayerInTeam) {
      return baseTeamPlayers.filter(p => p.id !== previewPlayer.id);
    } else {
      return [...baseTeamPlayers, previewPlayer];
    }
  }, [myTeam, previewPlayer]);

  const currentView = ['P', 'SP', 'RP'].includes(positionFilter) ? 'pitchers' : 'hitters';

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar: Live Team Analysis */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <AIRecommendations
              team={myTeam.map(p => p.player)}
              lastDrafted={lastDrafted} 
              rosterSettings={ROSTER_SETTINGS} 
              players={players}
              allTakenPlayers={allTakenPlayers}
            />
            <div className="h-4"></div>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-800">
              <Swords className="text-blue-600" /> Team Balance
            </h2>
            <TeamBalanceRadar team={teamForRadar} /> {/* Pass only player objects to radar */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 flex items-center gap-2">
                <Info size={14} /> 9-Team leagues require elite category coverage.
                Avoid "punting" too early.
              </p>
            </div>
          </div>

          <WatchlistComponent players={watchlist} onRemove={toggleWatchlist} />

          <DraftLog draftLog={draftLog} />

          <MyTeamComponent team={myTeam} onRemove={removeFromTeam} rosterSettings={ROSTER_SETTINGS} />
        </div>

        {/* Main: Draft Board */}
        <div className="lg:col-span-8 bg-white p-6 rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-black tracking-tight text-gray-800">2026 WAR ROOM</h1>
            <button 
                onClick={() => setIsLiveSync(!isLiveSync)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-bold border transition-colors ${isLiveSync ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                title="Poll Yahoo for live draft results"
            >
                <RefreshCw size={14} className={isLiveSync ? 'animate-spin' : ''} />
                {isLiveSync ? 'Live Sync On' : 'Sync Draft'}
            </button>
            <div className="flex items-center gap-4">
              {loading && <span className="text-blue-500 animate-pulse text-sm">Loading Rankings...</span>}
              <div className="flex items-center">
                <label htmlFor="position-filter" className="text-xs font-medium text-gray-500 mr-2">Position:</label>
                <select
                  id="position-filter"
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-300 rounded-md p-1 text-sm focus:border-blue-500 outline-none"
                >
                  <option value="ALL">All Players</option>
                  <option value="H">All Hitters</option>
                  <option value="P">All Pitchers</option>
                  <optgroup label="Hitters">
                    <option value="C">C</option>
                    <option value="1B">1B</option>
                    <option value="2B">2B</option>
                    <option value="SS">SS</option>
                    <option value="3B">3B</option>
                    <option value="OF">OF</option>
                  </optgroup>
                  <optgroup label="Pitchers">
                    <option value="SP">SP</option>
                    <option value="RP">RP</option>
                  </optgroup>
                </select>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-50 border border-gray-300 rounded-md py-1 pl-8 pr-2 text-sm focus:border-blue-500 outline-none w-40"
                />
              </div>
              <div className="flex items-center">
                <label htmlFor="scoring-system" className="text-xs font-medium text-gray-500 mr-2">Scoring:</label>
                <select
                  id="scoring-system"
                  value={scoringSystem}
                  onChange={(e) => setScoringSystem(e.target.value)}
                  className="bg-gray-50 border border-gray-300 rounded-md p-1 text-sm focus:border-blue-500 outline-none"
                >
                  <option value="h2h">H2H Points (VORP)</option>
                  <option value="sgp">5x5 Roto (SGP)</option>
                </select>
              </div>
            </div>
          </div>

          <DraftTable
            players={filteredPlayers}
            onDraft={addToTeam}
            onTaken={markAsTaken}
            onShowTilt={handleShowTilt}
            watchlist={watchlist}
            onToggleWatchlist={toggleWatchlist}
            scoringSystem={scoringSystem}
            view={currentView}
            onPreviewPlayer={setPreviewPlayer}
            onClearPreview={() => setPreviewPlayer(null)}
          />

          <div className="mt-4 flex justify-center pb-2">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : (
                <>
                  <ChevronDown size={16} />
                  Load More Players
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <AntiTiltModal
        player={tiltPlayer}
        metrics={tiltMetrics}
        onClose={handleCloseTilt}
      />
    </main>
  );
};

export default DraftRoom;