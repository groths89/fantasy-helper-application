import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const AutomationLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      // Points to your FastAPI router endpoint, dynamically using the environment base URL
      const response = await axios.get(`${API_BASE_URL}/bot/logs?limit=50`);
      setLogs(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching bot logs:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Poll every 30 seconds
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const getLevelColor = (level) => {
    switch (level.toUpperCase()) {
      case 'SUCCESS': return 'text-green-500';
      case 'ERROR': return 'text-red-500';
      case 'WARNING': return 'text-yellow-500';
      default: return 'text-blue-400';
    }
  };

  const handleManualRun = async () => {
    setLoading(true);
    try {
      // This calls a new POST endpoint we will add to your FastAPI
      await axios.post('https://api.gregsfantasyhelper.solutions/bot/run');
      fetchLogs(); // Refresh logs after run
    } catch (error) {
      alert("Manual run failed. Check container logs.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4 text-gray-400">Loading automation stream...</div>;

  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-xl border border-gray-800">
      <h2 className="text-xl font-bold mb-4 text-white flex items-center">
        <span className="relative flex h-3 w-3 mr-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
        Daily Bot Automation Logs
      </h2>
      <button 
        onClick={handleManualRun}
        className="mb-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-xs font-bold transition-colors"
      >
        FORCE DAILY CHECK NOW
      </button>
      <div className="overflow-y-auto max-h-96 space-y-2 font-mono text-sm">
        {logs.map((log, index) => (
          <div key={index} className="border-b border-gray-800 pb-2">
            <span className="text-gray-500 mr-2">
              [{new Date(log.timestamp).toLocaleTimeString()}]
            </span>
            <span className={`font-bold mr-2 ${getLevelColor(log.level)}`}>
              {log.level}:
            </span>
            <span className="text-gray-300">{log.message}</span>
            {log.details && log.details.replacement_key && (
              <div className="text-xs text-gray-600 mt-1 ml-24">
                Transferred to: {log.details.replacement_key}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AutomationLogs;