import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SeasonDashboard from './views/SeasonDashboard';
import Transactions from './views/Transactions';
import DraftRoom from './views/DraftRoom';
import Matchup from './views/Matchup';
import Settings from './views/Settings';
import Header from './components/Header';
import { useAuth } from './context/AuthContext';
import HomePage from './views/HomePage';
import { Loader } from 'lucide-react';

function App() {
  const { isConnected, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Header />
      <Routes>
        <Route path="/" element={isConnected ? <SeasonDashboard /> : <HomePage />} /> {/* Home page is conditional */}
        <Route path="/dashboard" element={isConnected ? <SeasonDashboard /> : <Navigate to="/" replace />} /> {/* Protected route */}
        <Route path="/matchup" element={isConnected ? <Matchup /> : <Navigate to="/" replace />} /> {/* Protected route */}
        <Route path="/transactions" element={isConnected ? <Transactions />: <Navigate to="/" replace />} /> {/* Protected route - Transactions page */}
        <Route path="/draft" element={isConnected ? <DraftRoom /> : <Navigate to="/" replace />} /> {/* Protected route */}
        <Route path="/settings" element={isConnected ? <Settings /> : <Navigate to="/" replace />} /> {/* Protected route */}
      </Routes>
    </div>
  );
}

export default App;
