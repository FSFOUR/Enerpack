
import React, { useState } from 'react';
import { StockTransaction } from '../types';
import { ArrowLeft, Clock, Search, Lock } from 'lucide-react';

interface PendingWorksProps {
  transactions: StockTransaction[];
  onBack: () => void;
  onUpdateStatus: (id: string, newStatus: string) => void;
  onUpdatePriority: (id: string, newPriority: string) => void;
  isAdmin: boolean;
}

const STATUS_OPTIONS = [
  "Cutting",
  "Cutting Finished",
  "Out of Stock",
  "Order Placed",
  "Waiting for Reel",
  "Pending",
  "Delivered",
  "Other"
];

const PRIORITY_OPTIONS = [
  "Very Urgent",
  "Urgent",
  "High",
  "Medium",
  "Low"
];

const getPriorityColor = (priority?: string) => {
    switch(priority) {
        case 'Very Urgent': return 'text-red-700 bg-red-100 border-red-200';
        case 'Urgent': return 'text-orange-700 bg-orange-100 border-orange-200';
        case 'High': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
        case 'Medium': return 'text-blue-700 bg-blue-100 border-blue-200';
        case 'Low': return 'text-gray-700 bg-gray-100 border-gray-200';
        default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
};

const PendingWorks: React.FC<PendingWorksProps> = ({ transactions, onBack, onUpdateStatus, onUpdatePriority, isAdmin }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter for Stock OUT items that are NOT "Delivered"
  const pendingTransactions = transactions
    .filter(t => t.type === 'OUT' && t.status !== 'Delivered')
    .sort((a, b) => {
        // Sort by Priority first (custom order), then date
        const priorityOrder: Record<string, number> = { "Very Urgent": 5, "Urgent": 4, "High": 3, "Medium": 2, "Low": 1, undefined: 0 };
        const pA = priorityOrder[a.priority || 'Medium'] || 0;
        const pB = priorityOrder[b.priority || 'Medium'] || 0;
        if (pA !== pB) return pB - pA; // Higher priority first
        return b.timestamp - a.timestamp;
    });

  // Apply Search Filter
  const displayedTransactions = pendingTransactions.filter(t => 
    t.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.workName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.vehicle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.status || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.remarks || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm bg-orange-50 gap-3 md:gap-0">
        <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
                onClick={onBack} 
                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
                title="Back to Inventory"
            >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-bold text-sm">Back to Inventory</span>
            </button>
            <h2 className="text-lg md:text-xl font-bold text-orange-700 flex items-center gap-2 border-l border-orange-200 pl-4 ml-2">
                <Clock className="w-6 h-6" />
                PENDING WORKS
            </h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search pending..." 
                    className="pl-8 pr-4 py-1.5 rounded-full border border-orange-200 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-center"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="text-sm text-orange-800 font-semibold bg-orange-100 px-3 py-1 rounded-full whitespace-nowrap">
            Count: {displayedTransactions.length}
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-md">
            <div className="min-w-max">
                <table className="w-full text-xs text-center border-collapse">
                    <thead className="bg-orange-600 text-white sticky top-0 z-10">
                        <tr>
                            <th className="p-2 border border-orange-500 text-center whitespace-nowrap">DATE</th>
                            <th className="p-2 border border-orange-500 text-center whitespace-nowrap">SIZE</th>
                            <th className="p-2 border border-orange-500 text-center whitespace-nowrap">GSM</th>
                            <th className="p-2 border border-orange-500 text-center whitespace-nowrap">QTY</th>
                            <th className="p-2 border border-orange-500 text-center whitespace-nowrap">COMPANY</th>
                            <th className="p-2 border border-orange-500 text-center whitespace-nowrap">WORK NAME</th>
                            <th className="p-2 border border-orange-500 text-center whitespace-nowrap">CUT SIZE</th>
                            <th className="p-2 border border-orange-500 text-center whitespace-nowrap">CURRENT STATUS</th>
                            <th className="p-2 border border-orange-500 text-center whitespace-nowrap">PRIORITY</th>
                            <th className="p-2 border border-orange-500 text-center whitespace-nowrap">VEHICLE</th>
                            <th className="p-2 border border-orange-500 text-center whitespace-nowrap">REMARKS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedTransactions.map(t => (
                            <tr key={t.id} className="odd:bg-white even:bg-orange-50 hover:bg-yellow-50">
                                <td className="p-2 border border-gray-300 whitespace-nowrap">{t.date}</td>
                                <td className="p-2 border border-gray-300 font-bold whitespace-nowrap">{t.size}</td>
                                <td className="p-2 border border-gray-300 whitespace-nowrap">{t.gsm}</td>
                                <td className="p-2 border border-gray-300 font-bold text-red-700 whitespace-nowrap">{t.quantity}</td>
                                <td className="p-2 border border-gray-300 whitespace-nowrap font-bold uppercase">{t.company}</td>
                                <td className="p-2 border border-gray-300 max-w-[200px] truncate whitespace-nowrap" title={t.workName}>{t.workName}</td>
                                <td className="p-2 border border-gray-300 whitespace-nowrap">{t.cuttingSize}</td>
                                <td className="p-2 border border-gray-300 bg-white whitespace-nowrap min-w-[150px]">
                                    <select 
                                        disabled={!isAdmin}
                                        className={`w-full p-1 border rounded text-xs font-bold text-center ${
                                            t.status === 'Out of Stock' ? 'text-red-600 bg-red-50' : 
                                            t.status === 'Cutting' ? 'text-blue-600 bg-blue-50' : 'text-gray-800'
                                        } ${!isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        value={t.status}
                                        onChange={(e) => onUpdateStatus(t.id, e.target.value)}
                                    >
                                        {STATUS_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="p-2 border border-gray-300 bg-white whitespace-nowrap min-w-[120px]">
                                    <select 
                                        disabled={!isAdmin}
                                        className={`w-full p-1 border rounded text-xs font-bold text-center ${getPriorityColor(t.priority || 'Medium')} ${!isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        value={t.priority || 'Medium'}
                                        onChange={(e) => onUpdatePriority(t.id, e.target.value)}
                                    >
                                        {PRIORITY_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="p-2 border border-gray-300 whitespace-nowrap">{t.vehicle}</td>
                                <td className="p-2 border border-gray-300 whitespace-nowrap max-w-xs truncate">{t.remarks}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        {displayedTransactions.length === 0 && (
            <div className="p-10 text-center text-gray-400 flex flex-col items-center">
                <Clock className="w-12 h-12 mb-2 opacity-20" />
                <p>No matching pending works.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default PendingWorks;
