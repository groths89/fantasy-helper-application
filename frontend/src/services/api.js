import axios from 'axios';

const API_BASE_URL = 'https://api.gregsfantasyhelper.solutions/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getRankings = async (scoring = 'h2h', { pageParam = 0, limit = 100 } = {}) => {
  try {
    const response = await apiClient.get('/draft/rankings', { 
      params: { scoring, skip: pageParam * limit, limit } 
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching rankings:', error);
    throw error;
  }
};

export const getPlayerValue = async (stats) => {
  try {
    const response = await apiClient.get('/draft/player-value', { params: stats });
    return response.data;
  } catch (error) {
    console.error('Error fetching player value:', error);
    throw error;
  }
};

export const uploadProjections = async (file, playerType) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    // The URL now includes the playerType parameter and is relative to the apiClient baseURL
    const response = await apiClient.post(`/projections/upload/${playerType}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading projections:', error);
    throw error;
  }
};

export const getAntiTiltMetrics = async (playerId) => {
  try {
    const response = await apiClient.get(`/players/${playerId}/anti-tilt`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching anti-tilt metrics for player ${playerId}:`, error);
    // Return a specific object for 404s so the UI can handle it gracefully
    if (error.response && error.response.status === 404) {
      return {
        player_id: playerId,
        patience_score: 0,
        luck_delta: 0.0,
        recommendation: 'Statcast data not available for this player (404).'
      };
    }
    throw error;
  }
};

export const getAIRecommendations = async (draftState) => {
  try {
    const response = await apiClient.post('/draft/recommendations', draftState);
    return response.data;
  } catch (error) {
    console.error('Error fetching AI recommendations:', error);
    // Return a default error message so the UI doesn't break
    return [{ type: 'alert', message: 'Could not fetch AI recommendations from the server.' }];
  }
};

export const getDashboardData = async () => {
  try {
    const response = await apiClient.get('/dashboard');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};