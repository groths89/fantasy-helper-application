import React, { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const authPath = import.meta.env.PROD ? '/auth/yahoo' : '/auth/yahoo/mock';
const authUrl = `${API_BASE_URL}${authPath}`;

const AuthButton = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check auth status when the component mounts
    fetch(`${API_BASE_URL}/auth/status`)
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
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []); // The empty dependency array ensures this effect runs only once on mount

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`);
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      await response.json();
      setIsConnected(false);
      // To fully reset the app state, you might want to reload the page.
      window.location.reload();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (isLoading) {
    return <div>...</div>;
  }

  return (
    <div className="auth-links">
      {isConnected ? (
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      ) : (
        <a href={authUrl} className="login-button">
          Login with Yahoo
        </a>
      )}
    </div>
  );
};

export default AuthButton;