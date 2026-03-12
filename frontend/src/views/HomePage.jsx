import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, BarChart, Zap } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const authPath = import.meta.env.PROD ? '/auth/yahoo' : '/auth/yahoo/mock';
const authUrl = `${API_BASE_URL}${authPath}`;

const HomePage = () => {
  return (
    <main className="container mx-auto px-4 py-8 text-center">
      <div className="max-w-3xl mx-auto">
        <Trophy className="mx-auto h-16 w-16 text-yellow-500" />
        <h1 className="mt-4 text-4xl font-black tracking-tighter text-gray-900 sm:text-5xl">
          Your Ultimate Fantasy Baseball Companion
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Gain a competitive edge with advanced analytics, player projections, and AI-powered draft advice. Stop guessing, start winning.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <a
            href={authUrl}
            className="rounded-md bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            Connect with Yahoo to Get Started
          </a>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 gap-y-10 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-0">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
            <BarChart size={24} />
          </div>
          <h3 className="mt-4 font-semibold text-gray-900">Data-Driven Rankings</h3>
          <p className="mt-2 text-sm text-gray-600">Go beyond standard rankings with SGP and VORP values tailored to your league.</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
            <Zap size={24} />
          </div>
          <h3 className="mt-4 font-semibold text-gray-900">AI Draft Assistant</h3>
          <p className="mt-2 text-sm text-gray-600">Get live, intelligent pick recommendations based on your team's needs and player availability.</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
            <Trophy size={24} />
          </div>
          <h3 className="mt-4 font-semibold text-gray-900">Season-Long Dominance</h3>
          <p className="mt-2 text-sm text-gray-600">Track matchups, monitor league activity, and get strategic advice all season long.</p>
        </div>
      </div>
    </main>
  );
};

export default HomePage;