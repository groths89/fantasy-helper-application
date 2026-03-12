import React, { useState, useEffect } from 'react';
import { getAIRecommendations } from '../services/api';
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle, Loader } from 'lucide-react';

const AIRecommendations = ({ team, lastDrafted, rosterSettings, players, allTakenPlayers }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      const draftState = {
        team,
        last_drafted: lastDrafted,
        roster_settings: rosterSettings,
        players,
        all_taken_players: allTakenPlayers,
      };
      const recs = await getAIRecommendations(draftState);
      setRecommendations(recs);
      setLoading(false);
    };

    // Only fetch if we have players data to work with
    if (players.length > 0) {
      fetchRecommendations();
    } else {
        // If there are no players yet, show an initial loading state
        setRecommendations([]);
        setLoading(true);
    }
  }, [team, lastDrafted, rosterSettings, players, allTakenPlayers]);

  const getIcon = (type) => {
      switch (type) {
          case 'warning': return <AlertTriangle size={16} className="text-orange-600 mt-0.5 shrink-0" />;
          case 'alert': return <AlertTriangle size={16} className="text-red-600 mt-0.5 shrink-0" />;
          case 'success': return <CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" />;
          case 'suggestion': return <TrendingUp size={16} className="text-blue-600 mt-0.5 shrink-0" />;
          default: return <Lightbulb size={16} className="text-yellow-500 fill-yellow-400 mt-0.5 shrink-0" />;
      }
  };

  const getBgColor = (type) => {
      switch (type) {
          case 'warning': return 'bg-orange-50 border-orange-100 text-orange-800';
          case 'alert': return 'bg-red-50 border-red-100 text-red-800';
          case 'success': return 'bg-green-50 border-green-100 text-green-800';
          case 'suggestion': return 'bg-blue-50 border-blue-100 text-blue-800';
          default: return 'bg-white border-gray-100 text-gray-700';
      }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white p-4 rounded-lg border border-indigo-100 shadow-sm">
      <h3 className="font-bold text-indigo-900 flex items-center gap-2 mb-3">
        <Lightbulb size={18} className="text-yellow-500 fill-yellow-500" />
        Draft Intelligence
      </h3>
      <div className="space-y-2 min-h-[100px]">
        {loading && recommendations.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 pt-4">
            <Loader size={18} className="animate-spin mr-2" />
            <span>Analyzing...</span>
          </div>
        ) : (
          recommendations.map((rec, idx) => (
            <div key={idx} className={`text-sm p-2 rounded border flex gap-2 items-start ${getBgColor(rec.type)}`}>
              {getIcon(rec.type)}
              <span className="leading-snug">{rec.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AIRecommendations;
