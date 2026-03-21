import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock } from 'lucide-react';

const TokenExpirationTimer = () => {
  const { expiresAt, isConnected } = useAuth();
  const [timeLeft, setTimeLeft] = useState('');
  const [timerStyle, setTimerStyle] = useState('text-gray-500 bg-gray-100');

  useEffect(() => {
    if (!expiresAt || !isConnected) {
      setTimeLeft('');
      return;
    }

    const calculateTimeLeft = () => {
      const expirationTime = expiresAt * 1000; // Convert unix timestamp to milliseconds
      const now = new Date().getTime();
      const distance = expirationTime - now;

      if (distance < 0) {
        setTimeLeft('Expired');
        setTimerStyle('text-red-800 bg-red-200 font-bold');
        // Optionally, you could trigger a logout or refresh here
        return;
      }

      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

      // Determine color based on time left
      if (distance < 60 * 1000) { // Less than 1 minute
        setTimerStyle('text-red-700 bg-red-100 font-bold animate-pulse');
      } else if (distance < 5 * 60 * 1000) { // Less than 5 minutes
        setTimerStyle('text-yellow-700 bg-yellow-100 font-semibold');
      } else {
        setTimerStyle('text-gray-500 bg-gray-100');
      }
    };

    calculateTimeLeft(); // Initial calculation
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, isConnected]);

  if (!timeLeft || !isConnected) {
    return null;
  }

  return (
    <div 
      className={`flex items-center gap-2 text-sm px-3 py-1 rounded-full transition-colors cursor-help ${timerStyle}`}
      title="Your Yahoo session will expire when the timer ends. You will be automatically logged out."
    >
      <Clock size={14} />
      <span>Session expires in: {timeLeft}</span>
    </div>
  );
};

export default TokenExpirationTimer;