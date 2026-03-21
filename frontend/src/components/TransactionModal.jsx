import React from 'react';
import { X, Calendar, Shield, Activity, FileText } from 'lucide-react';

const TransactionModal = ({ transaction, onClose }) => {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold text-gray-800">Transaction Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-50 p-3 rounded-full text-blue-600 shrink-0">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Team</h3>
              <p className="text-lg font-medium text-gray-900">{transaction.team}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full shrink-0 ${
              transaction.action === 'add' ? 'bg-green-100 text-green-700' : 
              transaction.action === 'drop' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'
            }`}>
              <Activity size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Action</h3>
              <p className="text-lg font-medium text-gray-900 capitalize">{transaction.action}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-gray-100 p-3 rounded-full text-gray-600 shrink-0">
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Date</h3>
              <p className="text-gray-700">{transaction.time}</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2 text-gray-600">
              <FileText size={16} />
              <span className="text-sm font-bold uppercase">Details</span>
            </div>
            <p className="text-gray-800 text-sm leading-relaxed">
              {transaction.details}
            </p>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;
