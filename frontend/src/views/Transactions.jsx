import React, { useEffect, useState } from 'react';
import { getLeagueTransactions } from '../services/api';
import { ChevronDown, Loader } from 'lucide-react';
import TransactionModal from '../components/TransactionModal';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [hasMore, setHasMore] = useState(true);
  const BATCH_SIZE = 50;
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const data = await getLeagueTransactions(BATCH_SIZE, 0);
        setTransactions(data);
        setHasMore(data.length >= BATCH_SIZE);
      } catch (err) {
        setError('Failed to load transactions.');
      } finally {
        setLoading(false);
      }
    }
    fetchTransactions();
  }, []);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const currentCount = transactions.length;
      const data = await getLeagueTransactions(BATCH_SIZE, currentCount);
      setTransactions(prev => [...prev, ...data]);
      setHasMore(data.length >= BATCH_SIZE);
    } catch (err) {
      setError('Failed to load more transactions.');
    } finally {
      setLoadingMore(false);
    }
  };

  const getActionBadge = (action) => {
    const styles = {
      add: 'bg-green-100 text-green-800',
      drop: 'bg-red-100 text-red-800',
      trade: 'bg-purple-100 text-purple-800',
    };
    const defaultStyle = 'bg-gray-100 text-gray-800';

    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${styles[action] || defaultStyle}`}>
        {action}
      </span>
    );
  };

  const filteredTransactions = transactions.filter(tx => 
    filter === 'all' ? true : tx.action === filter
  );

  if (loading) return <div className="p-8 text-center">Loading transactions...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">League Transactions</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="tx-filter" className="text-sm font-medium text-gray-700">Filter:</label>
          <select
            id="tx-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white border border-gray-300 text-gray-700 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-2"
          >
            <option value="all">All Types</option>
            <option value="add">Adds</option>
            <option value="drop">Drops</option>
            <option value="trade">Trades</option>
          </select>
        </div>
      </div>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTransactions.map((tx) => (
              <tr 
                key={tx.id} 
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedTransaction(tx)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{tx.time}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tx.team}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {getActionBadge(tx.action)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{tx.details}</td>
              </tr>
            ))}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No transactions found matching "{filter}".</td>
              </tr>
            )}
          </tbody>
        </table>
        
        {transactions.length > 0 && hasMore && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 rounded-md transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <>
                  <Loader size={16} className="animate-spin" /> Loading...
                </>
              ) : (
                <>
                  <ChevronDown size={16} /> Load More
                </>
              )}
            </button>
          </div>
        )}
      </div>
      <TransactionModal 
        transaction={selectedTransaction} 
        onClose={() => setSelectedTransaction(null)} 
      />
    </div>
  );
}