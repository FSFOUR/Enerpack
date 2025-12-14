
import React, { useState } from 'react';
import { InventoryItem, StockTransaction } from '../types';
import { ArrowLeft, AlertTriangle, Search, Save, Lock } from 'lucide-react';

interface ReorderPageProps {
  items: InventoryItem[];
  onBack: () => void;
  onUpdateItem: (item: InventoryItem) => void;
  onRecordTransaction: (transaction: Omit<StockTransaction, 'id' | 'timestamp'>) => void;
  isAdmin: boolean;
}

const REORDER_STATUS_OPTIONS = ["Pending", "Order Placed", "Other"];

const ReorderPage: React.FC<ReorderPageProps> = ({ items, onBack, onUpdateItem, onRecordTransaction, isAdmin }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter items where stock is less than minStock
  const lowStockItems = items.filter(item => item.closingStock < (item.minStock || 0));

  // Apply search filter
  const filteredItems = lowStockItems.filter(item => 
    item.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.gsm.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.reorderCompany || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.reorderStatus || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.reorderRemarks || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdate = (item: InventoryItem, field: keyof InventoryItem, value: any) => {
      onUpdateItem({
          ...item,
          [field]: value
      });
  };

  const handleLogOrder = (item: InventoryItem) => {
      if (!item.reorderQty || item.reorderQty <= 0) {
          alert("Please enter a valid Reorder Quantity.");
          return;
      }
      if (!item.reorderDate) {
          alert("Please enter a Reorder Date.");
          return;
      }
      if (confirm(`Record order for ${item.size} (${item.gsm}) to history?`)) {
          onRecordTransaction({
              type: 'REORDER',
              date: item.reorderDate,
              month: new Date(item.reorderDate).toLocaleString('default', { month: 'long' }),
              itemId: item.id,
              size: item.size,
              gsm: item.gsm,
              quantity: item.reorderQty,
              company: item.reorderCompany || 'Unknown',
              remarks: item.reorderRemarks,
              expectedDeliveryDate: item.expectedDeliveryDate,
              status: item.reorderStatus || 'Order Placed'
          });
          alert("Order recorded to history!");
      }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm bg-red-50 gap-3 md:gap-0">
        <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
                onClick={onBack} 
                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
                title="Back to Inventory"
            >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-bold text-sm">Back to Inventory</span>
            </button>
            <h2 className="text-lg md:text-xl font-bold text-red-700 flex items-center gap-2 border-l border-red-200 pl-4 ml-2">
                <AlertTriangle className="w-6 h-6" />
                REORDER ALERTS
            </h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search alerts..." 
                    className="pl-8 pr-4 py-1.5 rounded-full border border-red-200 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-center"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="text-sm text-red-800 font-semibold bg-red-100 px-3 py-1 rounded-full whitespace-nowrap">
            Items: {filteredItems.length}
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-md">
            <div className="min-w-max">
                <table className="w-full text-xs text-center border-collapse">
                    <thead className="bg-red-600 text-white sticky top-0 z-10">
                        <tr>
                            <th className="p-2 border border-red-500 text-center whitespace-nowrap">SIZE</th>
                            <th className="p-2 border border-red-500 text-center whitespace-nowrap">GSM</th>
                            <th className="p-2 border border-red-500 text-center whitespace-nowrap">MIN</th>
                            <th className="p-2 border border-red-500 text-center whitespace-nowrap">CURR</th>
                            <th className="p-2 border border-red-500 text-center whitespace-nowrap">SHORT</th>
                            <th className="p-2 border border-red-500 text-center whitespace-nowrap">STATUS</th>
                            <th className="p-2 border border-red-500 text-center whitespace-nowrap">COMPANY</th>
                            <th className="p-2 border border-red-500 text-center whitespace-nowrap">ORD QTY</th>
                            <th className="p-2 border border-red-500 text-center whitespace-nowrap">ORD DATE</th>
                            <th className="p-2 border border-red-500 text-center whitespace-nowrap">EXP DELIVERY</th>
                            <th className="p-2 border border-red-500 text-center whitespace-nowrap">REMARKS</th>
                            <th className="p-2 border border-red-500 text-center whitespace-nowrap">LOG</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map(item => (
                            <tr key={item.id} className="odd:bg-white even:bg-red-50 hover:bg-yellow-50">
                                <td className="p-2 border border-gray-300 font-bold whitespace-nowrap">{item.size}</td>
                                <td className="p-2 border border-gray-300 font-medium whitespace-nowrap">{item.gsm}</td>
                                <td className="p-2 border border-gray-300 text-gray-600 whitespace-nowrap">{item.minStock}</td>
                                <td className="p-2 border border-gray-300 font-bold text-red-600 whitespace-nowrap">{item.closingStock}</td>
                                <td className="p-2 border border-gray-300 font-bold text-red-800 whitespace-nowrap">
                                    {((item.minStock || 0) - item.closingStock).toFixed(1)}
                                </td>
                                
                                {/* REORDER STATUS */}
                                <td className="p-2 border border-gray-300 bg-white whitespace-nowrap min-w-[120px]">
                                    <select 
                                        disabled={!isAdmin}
                                        className={`w-full p-1 border rounded text-xs text-center ${!isAdmin ? 'bg-gray-100' : ''}`}
                                        value={item.reorderStatus || 'Pending'}
                                        onChange={(e) => handleUpdate(item, 'reorderStatus', e.target.value)}
                                    >
                                        {REORDER_STATUS_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </td>

                                {/* COMPANY */}
                                <td className="p-2 border border-gray-300 bg-white whitespace-nowrap min-w-[120px]">
                                    <input 
                                        type="text"
                                        readOnly={!isAdmin}
                                        className={`w-full p-1 border rounded text-xs text-center ${!isAdmin ? 'bg-gray-100' : ''}`}
                                        placeholder="Supplier..."
                                        value={item.reorderCompany || ''}
                                        onChange={(e) => handleUpdate(item, 'reorderCompany', e.target.value)}
                                    />
                                </td>

                                {/* REORDER QTY */}
                                <td className="p-2 border border-gray-300 bg-white whitespace-nowrap min-w-[80px]">
                                    <input 
                                        type="number"
                                        readOnly={!isAdmin}
                                        className={`w-full p-1 border rounded text-xs text-center ${!isAdmin ? 'bg-gray-100' : ''}`}
                                        placeholder="0"
                                        value={item.reorderQty || ''}
                                        onChange={(e) => handleUpdate(item, 'reorderQty', Number(e.target.value))}
                                    />
                                </td>

                                {/* REORDER DATE */}
                                <td className="p-2 border border-gray-300 bg-white whitespace-nowrap min-w-[120px]">
                                    <input 
                                        type="date"
                                        readOnly={!isAdmin}
                                        className={`w-full p-1 border rounded text-xs text-center ${!isAdmin ? 'bg-gray-100' : ''}`}
                                        value={item.reorderDate || ''}
                                        onChange={(e) => handleUpdate(item, 'reorderDate', e.target.value)}
                                    />
                                </td>

                                {/* EXPECTED DELIVERY DATE */}
                                <td className="p-2 border border-gray-300 bg-white whitespace-nowrap min-w-[120px]">
                                    <input 
                                        type="date"
                                        readOnly={!isAdmin}
                                        className={`w-full p-1 border rounded text-xs text-center ${!isAdmin ? 'bg-gray-100' : ''}`}
                                        value={item.expectedDeliveryDate || ''}
                                        onChange={(e) => handleUpdate(item, 'expectedDeliveryDate', e.target.value)}
                                    />
                                </td>

                                {/* REMARKS */}
                                <td className="p-2 border border-gray-300 bg-white whitespace-nowrap min-w-[150px]">
                                    <input 
                                        type="text"
                                        readOnly={!isAdmin}
                                        className={`w-full p-1 border rounded text-xs text-center ${!isAdmin ? 'bg-gray-100' : ''}`}
                                        placeholder="Notes..."
                                        value={item.reorderRemarks || ''}
                                        onChange={(e) => handleUpdate(item, 'reorderRemarks', e.target.value)}
                                    />
                                </td>

                                {/* ACTION */}
                                <td className="p-2 border border-gray-300 bg-white text-center whitespace-nowrap">
                                    {isAdmin ? (
                                        <button 
                                            onClick={() => handleLogOrder(item)}
                                            className="p-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                                            title="Save to History Log"
                                        >
                                            <Save className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <Lock className="w-4 h-4 text-gray-300 mx-auto" />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        {filteredItems.length === 0 && (
            <div className="p-10 text-center text-gray-400 flex flex-col items-center">
                <div className="bg-green-100 p-4 rounded-full mb-4">
                     <AlertTriangle className="w-8 h-8 text-green-600" />
                </div>
                {searchTerm ? (
                    <p className="text-lg font-medium text-gray-600">No matching items found.</p>
                ) : (
                    <>
                        <p className="text-lg font-medium text-green-700">All Good!</p>
                        <p>No items are below minimum stock level.</p>
                    </>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default ReorderPage;
