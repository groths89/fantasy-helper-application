import React from 'react';
import Navbar from './Navbar';
import TokenExpirationTimer from './TokenExpirationTimer';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { isConnected, isLoading } = useAuth();

  return (
    <header className="flex flex-col w-full sticky top-0 z-50">
      <Navbar />
      {isConnected && !isLoading && (
        <div className="bg-white border-b border-gray-200 py-1.5 flex justify-center w-full shadow-sm">
           <TokenExpirationTimer />
        </div>
      )}
    </header>
  );
};

export default Header;