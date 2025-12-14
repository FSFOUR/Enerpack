
import React, { useState } from 'react';
import { StockTransaction } from '../types';
import { Download, ArrowLeft, Search, Filter } from 'lucide-react';

interface TransactionHistoryProps {
  type: 'IN' | 'OUT' | 'REORDER';
  transactions: StockTransaction[];
  onBack: () => void;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ type, transactions, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Filter based on type and status
  const filteredByType = transactions
    .filter(t => {
        if (type === 'IN') return t.type === 'IN';
        if (type === 'REORDER') return t.type === 'REORDER';
        
        // For OUT, show ALL by default, unless filtered
        if (type === 'OUT') {
           if (t.type !== 'OUT') return false;
           if (statusFilter === 'All') return true;
           if (statusFilter === 'Delivered') return t.status === 'Delivered';
           if (statusFilter === 'Pending') return t.status !== 'Delivered';
           return true;
        }
        return false;
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  // Apply Search Filter
  const displayedTransactions = filteredByType.filter(t => 
    t.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.workName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.invoice || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.remarks || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.storageLocation || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTitle = () => {
      switch(type) {
          case 'IN': return 'STOCK IN LOGS';
          case 'OUT': return 'STOCK OUT LOGS';
          case 'REORDER': return 'REORDER HISTORY';
          default: return 'LOGS';
      }
  };

  const getHeaderColor = () => {
      switch(type) {
          case 'IN': return 'bg-blue-800 border-blue-700';
          case 'OUT': return 'bg-red-800 border-red-700';
          case 'REORDER': return 'bg-purple-800 border-purple-700';
          default: return 'bg-gray-800 border-gray-700';
      }
  };
  
  const getTitleColor = () => {
      switch(type) {
          case 'IN': return 'text-green-700 border-green-200';
          case 'OUT': return 'text-red-700 border-red-200';
          case 'REORDER': return 'text-purple-700 border-purple-200';
          default: return 'text-gray-700 border-gray-200';
      }
  };

  const handleExport = () => {
    // Defensive check for XLSX availability
     if (typeof (window as any).XLSX === 'undefined') {
        alert("Excel library not loaded. Please refresh the page or check internet connection.");
        return;
    }
    const wb = (window as any).XLSX.utils.book_new();
    const ws = (window as any).XLSX.utils.json_to_sheet(displayedTransactions.map(t => {
        if (type === 'IN') {
            return {
                DATE: t.date,
                MONTH: t.month,
                SIZE: t.size,
                GSM: t.gsm,
                IN: t.quantity,
                COMPANY: t.company,
                INVOICE: t.invoice,
                LOCATION: t.storageLocation,
                REMARKS: t.remarks
            };
        } else if (type === 'OUT') {
            return {
                DATE: t.date,
                MONTH: t.month,
                SIZE: t.size,
                GSM: t.gsm,
                OUT: t.quantity,
                COMPANY: t.company,
                ITEM_CODE: t.itemCode,
                WORK_NAME: t.workName,
                UNIT: t.unit,
                CUT_SIZE: t.cuttingSize,
                STATUS: t.status,
                VEHICLE: t.vehicle,
                LOCATION: t.storageLocation,
                REMARKS: t.remarks
            };
        } else {
            // REORDER
            return {
                ORDER_DATE: t.date,
                MONTH: t.month,
                SIZE: t.size,
                GSM: t.gsm,
                QUANTITY: t.quantity,
                COMPANY: t.company,
                EXPECTED_DELIVERY: t.expectedDeliveryDate,
                STATUS: t.status,
                REMARKS: t.remarks
            };
        }
    }));
    (window as any).XLSX.utils.book_append_sheet(wb, ws, `History ${type}`);
    (window as any).XLSX.writeFile(wb, `History_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm gap-3 md:gap-0">
        <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
                onClick={onBack} 
                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
                title="Back to Inventory"
            >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-bold text-sm">Back to Inventory</span>
            </button>
            <h2 className={`text-lg md:text-xl font-bold pl-4 ml-2 border-l-2 ${getTitleColor()}`}>
                {getTitle()}
            </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            
            {type === 'OUT' && (
                <div className="relative flex items-center">
                    <Filter className="absolute left-2 h-3 w-3 text-gray-500" />
                    <select 
                        className="pl-7 pr-2 py-1.5 rounded-md border border-gray-300 text-xs focus:ring-2 focus:ring-blue-500 bg-gray-50 font-bold text-gray-700"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option value="Delivered">Delivered Only</option>
                        <option value="Pending">Pending/Other</option>
                    </select>
                </div>
            )}

            <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search logs..." 
                    className="pl-8 pr-4 py-1.5 rounded-full border border-gray-300 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-center"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button onClick={handleExport} className="bg-green-600 text-white px-3 py-1.5 rounded text-sm shadow hover:bg-green-700 flex items-center gap-2 font-medium">
                <Download className="w-4 h-4" /> Export
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="overflow-x-auto rounded-lg border border-gray-300">
            <div className="min-w-max">
                <table className="w-full text-xs text-center border-collapse">
                    <thead className={`${getHeaderColor()} text-white sticky top-0`}>
                        {type === 'IN' && (
                            <tr>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">DATE</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">MONTH</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">SIZE</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">GSM</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">IN</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">COMPANY</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">INVOICE</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">STORAGE LOC</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">REMARKS</th>
                            </tr>
                        )}
                        {type === 'OUT' && (
                            <tr>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">DATE</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">MONTH</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">SIZE</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">GSM</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">OUT</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">COMPANY</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">ITEM CODE</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">WORK NAME</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">UNIT</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">CUT SIZE</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">STATUS</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">VEHICLE</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">LOCATION</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">REMARKS</th>
                            </tr>
                        )}
                        {type === 'REORDER' && (
                            <tr>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">ORDER DATE</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">MONTH</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">SIZE</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">GSM</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">QUANTITY</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">COMPANY</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">EXP DELIVERY</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">STATUS</th>
                                <th className="p-2 border border-white/20 text-center whitespace-nowrap">REMARKS</th>
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {displayedTransactions.map(t => (
                            <tr key={t.id} className="odd:bg-white even:bg-gray-50 hover:bg-yellow-50">
                                {type === 'IN' && (
                                    <>
                                        <td className="p-2 border border-gray-300 whitespace-nowrap">{t.date}</td>
                                        <td className="p-2 border border-gray-300 whitespace-nowrap">{t.month}</td>
                                        <td className="p-2 border border-gray-300 font-bold whitespace-nowrap">{t.size}</td>
                                        <td className="p-2 border border-gray-300 whitespace-nowrap">{t.gsm}</td>
                                        <td className="p-2 border border-gray-300 font-bold text-green-700 whitespace-nowrap">{t.quantity}</td>
                                        <td className="p-2 border border-gray-300 whitespace-nowrap">{t.company}</td>
                                        <td className="p-2 border border-gray-300 whitespace-nowrap">{t.invoice}</td>
                                        <td className="p-2 border border-gray-300 whitespace-nowrap">{t.storageLocation}</td>
                                        <td className="p-2 border border-gray-300 whitespace-nowrap max-w-xs truncate hover:overflow-visible hover:whitespace-normal" title={t.remarks}>{t.remarks}</td>
                                    </>
                                )}
                                {type === 'OUT' && (
                                    <>
                                        <td className="p-2 border border-gray-300 whitespace-nowrap">{t.date}</td>
                                        <td className="p-2 border border-gray-300 whitespace-nowrap">{t.month}</td>
                                        <td className="p-2 border border-gray-300 font-bold whitespace-nowrap">{t.size}</td>
                                        <td className="p-2 border border-gray-300 whitespace-nowrap">{t.gsm}</td>
                                        <td className="p-2 border border-gray-300 font-bold text-red-700 whitespace-nowrap">{t.quantity}</td>
                                        <td className="p-2 border border-gray-300 whitespace-nowrap">{t.company}</td>
                                        <td className="p-2 border border-gray-300 whitespace-nowrap">{t.itemCode}</td>
                                        <td className="p-2 border border-gray-300 whitespace-nowrap max-w-xs truncate hover:overflow-visible hover:whitespace-normal" title={t.workName}>{t.workName}</td>
                                        <td className="p-2 border border-gray-300 whitespace-nowrap">{t.unit}</td>
                                        <td className="p-2 border border-gray-300 whitespace-nowrap">{t.cuttingSize}</td>
                                        <td className={`p-2 border border-gray-300 font-bold whitespace-nowrap ${t.status === 'Delivered' ? 'text-green-600' : 'text-orange-600'}`}>{t.status}</td>
                                        <td className="p-2 border border-gray-300 whitespace-nowrap">{t.vehicle}</td>
                                        <td className="p-2 border border-gray-300 whitespace-nowrap">{t.storageLocation}</td>
                                        <td className="p-2 border border-gray-300 whitespace-nowrap max-w-xs truncate hover:overflow-visible hover:whitespace-normal" title={t.remarks}>{t.remarks}</td>
                                    </>
                                )}
                                {type === 'REORDER' && (
                                    <>
                                        <td className="p-2 border border-gray-300 font-medium whitespace-nowrap">{t.date}</td>
                                        <td className="p-2 border border-gray-300 whitespace-nowrap">{t.month}</td>
                                        <td className="p-2 border border-gray-300 font-bold whitespace-nowrap">{t.size}</td>
                                        <td className="p-2 border border-gray-300 whitespace-nowrap">{t.gsm}</td>
                                        <td className="p-2 border border-gray-300 font-bold text-purple-700 whitespace-nowrap">{t.quantity}</td>
                                        <td className="p-2 border border-gray-300 whitespace-nowrap">{t.company}</td>
                                        <td className="p-2 border border-gray-300 whitespace-nowrap">{t.expectedDeliveryDate}</td>
                                        <td className="p-2 border border-gray-300 whitespace-nowrap">{t.status}</td>
                                        <td className="p-2 border border-gray-300 whitespace-nowrap max-w-xs truncate hover:overflow-visible hover:whitespace-normal" title={t.remarks}>{t.remarks}</td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        {displayedTransactions.length === 0 && <div className="p-8 text-center text-gray-500">No records found.</div>}
      </div>
    </div>
  );
};

export default TransactionHistory;
