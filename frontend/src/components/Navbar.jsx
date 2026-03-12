import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Settings, User, ChevronDown, Trophy, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const authPath = import.meta.env.PROD ? '/auth/yahoo' : '/auth/yahoo/mock';
const authUrl = `${API_BASE_URL}${authPath}`;

const Navbar = () => {
  const { isConnected, isLoading, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
  };

  return (
    <nav className="bg-primary-900 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 font-black text-xl tracking-tighter italic">
              <Trophy className="text-yellow-400" size={20} />
              <span>FANTASY<span className="text-primary-400">HELPER</span></span>
            </Link>
            <div className="hidden md:flex space-x-6 text-sm font-medium text-gray-300 h-full items-center">
              {isConnected && (
                <>
                  <Link to="/" className="hover:text-white transition-colors">Daily Dashboard</Link>
                  <Link to="/draft" className="hover:text-white transition-colors">Draft War Room</Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-gray-300">
            {isLoading ? (
              <div className="w-7 h-7 bg-primary-700 rounded-full animate-pulse"></div>
            ) : isConnected ? (
              <div className="relative" ref={dropdownRef}>
                <div onClick={() => setIsDropdownOpen(prev => !prev)} className="flex items-center gap-2 cursor-pointer hover:text-white">
                  <div className="w-7 h-7 bg-primary-700 rounded-full flex items-center justify-center text-xs font-bold border border-primary-500">
                    GR
                  </div>
                  <span className="text-sm font-semibold hidden sm:block">Gregory</span>
                  <ChevronDown size={14} />
                </div>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 text-gray-800 border border-gray-200">
                    <Link
                      to="/settings"
                      className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Settings size={14} />
                      <span>Settings</span>
                    </Link>
                    <div className="my-1 h-px bg-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <LogOut size={14} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <a href={authUrl} className="flex items-center gap-2 cursor-pointer hover:text-white" title="Login">
                <div className="w-7 h-7 bg-primary-700 rounded-full flex items-center justify-center text-xs font-bold border border-primary-500">
                  <User size={14} />
                </div>
                <span className="text-sm font-semibold hidden sm:block">Login</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;