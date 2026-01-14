import React, { useState } from 'react';
import { InventoryItem, StockTransaction } from '../types';
import { X, Save, Calculator } from 'lucide-react';

interface StockOperationModalProps {
  type: 'IN' | 'OUT';
  item: InventoryItem;
  transactions: StockTransaction[];
  onClose: () => void;
  onConfirm: (transaction: Omit<StockTransaction, 'id' | 'timestamp'>) => void;
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

const StockOperationModal: React.FC<StockOperationModalProps> = ({ type, item, transactions, onClose, onConfirm }) => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const monthStr = today.toLocaleString('default', { month: 'long' });

  const [formData, setFormData] = useState({
    date: dateStr,
    month: monthStr,
    quantity: 0,
    sheets: '' as string | number, // Manual sheet count
    company: 'SREEPATHI',
    invoice: '',
    storageLocation: '',
    remarks: '',
    itemCode: '',
    workName: '',
    unit: 'GROSS',
    cuttingSize: '',
    status: type === 'OUT' ? 'Cutting' : '',
    priority: type === 'OUT' ? 'Medium' : '',
    vehicle: '' 
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.quantity <= 0) return;
    onConfirm({
      type,
      itemId: item.id,
      size: item.size,
      gsm: item.gsm,
      ...formData,
      sheets: formData.sheets !== '' ? Number(formData.sheets) : undefined
    });
  };

  const handleItemCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.toUpperCase();
    const previousTransaction = transactions.find(t => t.itemCode === code && t.type === 'OUT');
    setFormData(prev => ({
      ...prev,
      itemCode: code,
      ...(previousTransaction ? {
        workName: previousTransaction.workName || prev.workName,
        company: previousTransaction.company || prev.company,
        unit: previousTransaction.unit || prev.unit,
        cuttingSize: previousTransaction.cuttingSize || prev.cuttingSize,
      } : {})
    }));
  };

  const handleWorkNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const capitalized = val.length > 0 ? val.charAt(0).toUpperCase() + val.slice(1) : val;
    setFormData(prev => ({ ...prev, workName: capitalized }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className={`p-4 px-6 flex justify-between items-center text-white ${type === 'IN' ? 'bg-green-600' : 'bg-red-600'}`}>
          <h2 className="text-lg md:text-xl font-bold">{type === 'IN' ? 'STOCK IN' : 'STOCK OUT'} - {item.size} ({item.gsm})</h2>
          <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-8 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 ml-1">Date</label>
              <input type="date" required className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm border p-2.5 bg-white focus:ring-2 focus:ring-blue-400 outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 ml-1">Month</label>
              <input type="text" readOnly className="mt-1 block w-full rounded-2xl bg-gray-50 border-gray-200 shadow-sm border p-2.5 outline-none" value={formData.month} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 ml-1">Company (CAPS)</label>
              <input type="text" className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm border p-2.5 bg-white uppercase focus:ring-2 focus:ring-blue-400 outline-none" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value.toUpperCase()})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 ml-1">Quantity ({type === 'IN' ? 'In' : 'Out'})</label>
              <input type="number" min="0.001" step="any" required className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm border p-2.5 font-bold text-lg bg-white focus:ring-2 focus:ring-blue-400 outline-none" value={formData.quantity || ''} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} />
            </div>
          </div>

          {type === 'IN' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 ml-1">Invoice No</label>
                <input type="text" className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm border p-2.5 bg-white focus:ring-2 focus:ring-blue-400 outline-none" value={formData.invoice} onChange={e => setFormData({...formData, invoice: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 ml-1">Storage Location (CAPS)</label>
                <input type="text" className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm border p-2.5 bg-white uppercase focus:ring-2 focus:ring-blue-400 outline-none" value={formData.storageLocation} onChange={e => setFormData({...formData, storageLocation: e.target.value.toUpperCase()})} />
              </div>
            </div>
          )}

          {type === 'OUT' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 ml-1">Item Code (CAPS)</label>
                  <input type="text" className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm border p-2.5 bg-white uppercase focus:ring-2 focus:ring-blue-400 outline-none" value={formData.itemCode} onChange={handleItemCodeChange} placeholder="ENTER CODE TO AUTO-FILL" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 ml-1">Work Name</label>
                  <input type="text" className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm border p-2.5 bg-white focus:ring-2 focus:ring-blue-400 outline-none" value={formData.workName} onChange={handleWorkNameChange} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 ml-1">Unit</label>
                  <select className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm border p-2.5 bg-white outline-none cursor-pointer" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                    <option value="GROSS">GROSS</option>
                    <option value="CUTTING">CUTTING</option>
                    <option value="BOX">BOX</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 ml-1">Cutting Size</label>
                  <input type="text" className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm border p-2.5 bg-white focus:ring-2 focus:ring-blue-400 outline-none" value={formData.cuttingSize} onChange={e => setFormData({...formData, cuttingSize: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-600 ml-1 flex items-center gap-1"><Calculator className="w-3 h-3" /> Sheets (Manual)</label>
                  <input 
                    type="number" 
                    step="any"
                    className="mt-1 block w-full rounded-2xl bg-blue-50 border-blue-200 shadow-sm border p-2.5 outline-none font-black text-blue-700 focus:ring-2 focus:ring-blue-400" 
                    value={formData.sheets} 
                    onChange={e => setFormData({...formData, sheets: e.target.value})}
                    placeholder="Enter sheets..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 ml-1">Status</label>
                  <select className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm border p-2.5 bg-white outline-none cursor-pointer" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    {STATUS_OPTIONS.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 ml-1">Priority</label>
                  <select className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm border p-2.5 bg-white outline-none cursor-pointer" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                    {PRIORITY_OPTIONS.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 ml-1">Remarks</label>
            <textarea className="mt-1 block w-full rounded-2xl border-gray-300 shadow-sm border p-2.5 bg-white focus:ring-2 focus:ring-blue-400 outline-none" rows={2} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} />
          </div>
        </form>

        <div className="p-4 md:p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 text-gray-700 hover:bg-gray-200 rounded-2xl text-sm font-bold transition-colors">Cancel</button>
          <button onClick={handleSubmit} className={`px-8 py-2.5 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg text-sm md:text-base transition-all active:scale-95 ${type === 'IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
            <Save className="w-4 h-4" /> Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockOperationModal;