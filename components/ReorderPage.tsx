import React, { useState } from 'react';
import { InventoryItem, StockTransaction } from '../types';
import { ArrowLeft, AlertTriangle, Search, Save, CheckCircle2, Download, Lock } from 'lucide-react';

interface ReorderPageProps {
  items: InventoryItem[];
  onBack: () => void;
  onUpdateItem: (item: InventoryItem) => void;
  onRecordTransaction: (transaction: Omit<StockTransaction, 'id' | 'timestamp'>) => void;
  isAdmin: boolean;
}

const REORDER_STATUS_OPTIONS = ["Pending", "Order Placed", "Received", "Other"];

const ReorderPage: React.FC<ReorderPageProps> = ({ items, onBack, onUpdateItem, onRecordTransaction, isAdmin }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const [receivingItem, setReceivingItem] = useState<InventoryItem | null>(null);
  const [receiveData, setReceiveData] = useState({ date: new Date().toISOString().split('T')[0], qty: 0 });

  const lowStockItems = items.filter(item => item.closingStock < (item.minStock || 0));

  const filteredItems = lowStockItems.filter(item => 
    item.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.gsm.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.reorderCompany || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.reorderStatus || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.reorderRemarks || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdate = (item: InventoryItem, field: keyof InventoryItem, value: any) => {
      if (!isAdmin) return;
      onUpdateItem({
          ...item,
          [field]: value
      });
  };

  const handleLogOrder = (item: InventoryItem) => {
      if (!isAdmin) return;
      if (item.reorderStatus === 'Received') {
          setReceivingItem(item);
          setReceiveData({
              date: new Date().toISOString().split('T')[0],
              qty: item.reorderQty || 0
          });
          return;
      }

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

  const handleConfirmReceive = () => {
      if (!receivingItem || !isAdmin) return;
      
      onRecordTransaction({
          type: 'REORDER',
          date: receivingItem.reorderDate || receiveData.date, 
          month: new Date(receiveData.date).toLocaleString('default', { month: 'long' }),
          itemId: receivingItem.id,
          size: receivingItem.size,
          gsm: receivingItem.gsm,
          quantity: receiveData.qty, 
          company: receivingItem.reorderCompany || 'Unknown',
          remarks: receivingItem.reorderRemarks,
          expectedDeliveryDate: receivingItem.expectedDeliveryDate,
          status: 'Received',
          receivedDate: receiveData.date,
          receivedQty: receiveData.qty
      });
      
      alert("Order Received logged to history!");
      setReceivingItem(null);
  };

  const handleExport = () => {
    if (typeof (window as any).XLSX === 'undefined') {
       alert("Excel library not loaded.");
       return;
    }
    const wb = (window as any).XLSX.utils.book_new();
    const ws = (window as any).XLSX.utils.json_to_sheet(filteredItems.map(item => ({
        SIZE: item.size,
        GSM: item.gsm,
        MIN_STOCK: item.minStock,
        CURRENT_STOCK: item.closingStock,
        SHORTAGE: ((item.minStock || 0) - item.closingStock).toFixed(1),
        SUPPLIER: item.reorderCompany,
        REORDER_QTY: item.reorderQty,
        ORDER_DATE: item.reorderDate,
        EXP_DELIVERY: item.expectedDeliveryDate,
        STATUS: item.reorderStatus,
        REMARKS: item.reorderRemarks
    })));
    (window as any).XLSX.utils.book_append_sheet(wb, ws, "Reorder Alerts");
    (window as any).XLSX.writeFile(wb, `Reorder_Alerts_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      
      {receivingItem && isAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-green-200">
                  <div className="bg-green-600 text-white p-4 font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> Confirm Receipt
                  </div>
                  <div className="p-6 space-y-4">
                      <p className="text-sm text-gray-600 font-medium border-b pb-2">
                          Item: <span className="text-black font-bold">{receivingItem.size} ({receivingItem.gsm})</span>
                      </p>
                      
                      <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Received Date</label>
                          <input 
                              type="date" 
                              className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500 outline-none"
                              value={receiveData.date}
                              onChange={e => setReceiveData({...receiveData, date: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Received Quantity</label>
                          <input 
                              type="number" 
                              className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500 outline-none font-bold text-lg"
                              value={receiveData.qty}
                              onChange={e => setReceiveData({...receiveData, qty: Number(e.target.value)})}
                          />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                          <button 
                            onClick={() => setReceivingItem(null)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm font-medium"
                          >
                              Cancel
                          </button>
                          <button 
                            onClick={handleConfirmReceive}
                            className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded text-sm font-bold shadow-md"
                          >
                              Confirm & Log
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <div className="p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm bg-red-50 gap-3 md:gap-0">
        <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
                onClick={onBack} 
                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
                title="Back to Operations"
            >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-bold text-sm">Back to Operations</span>
            </button>
            <h2 className="text-lg md:text-xl font-bold text-red-700 flex items-center gap-2 border-l border-red-200 pl-4 ml-2">
                <AlertTriangle className="w-6 h-6" />
                REORDER ALERTS {!isAdmin && <span className="text-[10px] font-black text-red-400 bg-white/50 px-2 py-0.5 rounded ml-2 uppercase tracking-[0.15em] border border-red-200 flex items-center gap-1"><Lock className="w-3 h-3" /> Locked</span>}
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
            <button onClick={handleExport} className="bg-green-600 text-white px-3 py-1.5 rounded-full text-sm shadow hover:bg-green-700 flex items-center gap-2 font-bold whitespace-nowrap">
                <Download className="w-4 h-4" /> Export
            </button>
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
                            <th className="p-2 border border-red-500 text-center whitespace-nowrap">COMPANY</th>
                            <th className="p-2 border border-red-500 text-center whitespace-nowrap">ORD QTY</th>
                            <th className="p-2 border border-red-500 text-center whitespace-nowrap">ORD DATE</th>
                            <th className="p-2 border border-red-500 text-center whitespace-nowrap">EXP DELIVERY</th>
                            <th className="p-2 border border-red-500 text-center whitespace-nowrap">STATUS</th>
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
                                
                                <td className="p-2 border border-gray-300 bg-white whitespace-nowrap min-w-[120px]">
                                    <input 
                                        type="text"
                                        className="w-full p-1 border rounded text-xs text-center disabled:bg-slate-50 disabled:text-slate-400"
                                        placeholder={isAdmin ? "Supplier..." : "-"}
                                        value={item.reorderCompany || ''}
                                        onChange={(e) => handleUpdate(item, 'reorderCompany', e.target.value)}
                                        disabled={!isAdmin}
                                    />
                                </td>

                                <td className="p-2 border border-gray-300 bg-white whitespace-nowrap min-w-[80px]">
                                    <input 
                                        type="number"
                                        className="w-full p-1 border rounded text-xs text-center disabled:bg-slate-50 disabled:text-slate-400"
                                        placeholder="0"
                                        value={item.reorderQty || ''}
                                        onChange={(e) => handleUpdate(item, 'reorderQty', Number(e.target.value))}
                                        disabled={!isAdmin}
                                    />
                                </td>

                                <td className="p-2 border border-gray-300 bg-white whitespace-nowrap min-w-[120px]">
                                    <input 
                                        type="date"
                                        className="w-full p-1 border rounded text-xs text-center disabled:bg-slate-50 disabled:text-slate-400"
                                        value={item.reorderDate || ''}
                                        onChange={(e) => handleUpdate(item, 'reorderDate', e.target.value)}
                                        disabled={!isAdmin}
                                    />
                                </td>

                                <td className="p-2 border border-gray-300 bg-white whitespace-nowrap min-w-[120px]">
                                    <input 
                                        type="date"
                                        className="w-full p-1 border rounded text-xs text-center disabled:bg-slate-50 disabled:text-slate-400"
                                        value={item.expectedDeliveryDate || ''}
                                        onChange={(e) => handleUpdate(item, 'expectedDeliveryDate', e.target.value)}
                                        disabled={!isAdmin}
                                    />
                                </td>

                                <td className="p-2 border border-gray-300 bg-white whitespace-nowrap min-w-[120px]">
                                    <select 
                                        className={`w-full p-1 border rounded text-xs text-center font-bold disabled:bg-slate-50 disabled:text-slate-400
                                            ${item.reorderStatus === 'Received' ? 'text-green-700 bg-green-50' : 
                                              item.reorderStatus === 'Order Placed' ? 'text-blue-700 bg-blue-50' : 
                                              'bg-white text-gray-700'}`}
                                        value={item.reorderStatus || 'Pending'}
                                        onChange={(e) => handleUpdate(item, 'reorderStatus', e.target.value)}
                                        disabled={!isAdmin}
                                    >
                                        {REORDER_STATUS_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </td>

                                <td className="p-2 border border-gray-300 bg-white whitespace-nowrap min-w-[150px]">
                                    <input 
                                        type="text"
                                        className="w-full p-1 border rounded text-xs text-center disabled:bg-slate-50 disabled:text-slate-400"
                                        placeholder={isAdmin ? "Notes..." : "-"}
                                        value={item.reorderRemarks || ''}
                                        onChange={(e) => handleUpdate(item, 'reorderRemarks', e.target.value)}
                                        disabled={!isAdmin}
                                    />
                                </td>

                                <td className="p-2 border border-gray-300 bg-white text-center whitespace-nowrap">
                                    {isAdmin ? (
                                      <button 
                                          onClick={() => handleLogOrder(item)}
                                          className={`p-1.5 text-white rounded transition-colors shadow-sm
                                              ${item.reorderStatus === 'Received' ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                                          title={item.reorderStatus === 'Received' ? "Receive Order" : "Save to History Log"}
                                      >
                                          <Save className="w-4 h-4" />
                                      </button>
                                    ) : (
                                      <Lock className="w-4 h-4 text-slate-300 mx-auto" />
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