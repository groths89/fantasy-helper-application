import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check auth status when the component mounts
    fetch('http://localhost:8000/auth/status')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setIsConnected(data.is_connected);
      })
      .catch(error => {
        console.error('Error checking auth status:', error);
        setIsConnected(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const logout = async () => {
    try {
      await fetch('http://localhost:8000/auth/logout');
      setIsConnected(false);
      window.location.href = '/'; // Redirect to home and let it reload
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const value = { isConnected, isLoading, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};