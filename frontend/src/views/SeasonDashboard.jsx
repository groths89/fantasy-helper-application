import React, { useEffect, useState } from 'react';
import { getDashboardData } from '../services/api';
import MatchupCard from '../components/MatchupCard';
import StrategyCenter from '../components/StrategyCenter';
import LeagueActivity from '../components/LeagueActivity';
import Standings from '../components/Standings';
import { Loader } from 'lucide-react';

const SeasonDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.search.includes('login=success')) {
      navigate('/dashboard', { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboardData = await getDashboardData();
        setData(dashboardData);
        setError(null);
      } catch (error) {
        console.error("Failed to load dashboard", error);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  if (!data) return <div className="p-8 text-center text-red-500">Failed to load dashboard data.</div>;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (Main) */}
        <div className="lg:col-span-8 space-y-6">
          <MatchupCard matchup={data.matchup} />
          <StrategyCenter strategy={data.strategy} />
        </div>

        {/* Right Column (Sidebar) */}
        <div className="lg:col-span-4 space-y-6">
          <LeagueActivity activity={data.activity} />
          <Standings standings={data.standings} />
        </div>
      </div>
    </main>
  );
};

export default SeasonDashboard;