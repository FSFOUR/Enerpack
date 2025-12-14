import React, { useState } from 'react';
import { InventoryItem, StockTransaction } from '../types';
import { X, Save } from 'lucide-react';

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
    company: 'SREEPATHI', // Default
    invoice: '',
    storageLocation: '',
    remarks: '',
    // OUT fields
    itemCode: '',
    workName: '',
    unit: 'GROSS',
    cuttingSize: '',
    status: type === 'OUT' ? 'Cutting' : '', // Default status for OUT
    priority: type === 'OUT' ? 'Medium' : '', // Default priority for OUT
    vehicle: 'KL65S7466' // Default based on sample
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.quantity <= 0) return;

    onConfirm({
      type,
      itemId: item.id,
      size: item.size,
      gsm: item.gsm,
      ...formData
    });
  };

  const handleItemCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.toUpperCase();
    
    // Auto-fill logic based on previous history
    // Find the most recent transaction with this item code
    const previousTransaction = transactions.find(t => 
      t.itemCode === code && t.type === 'OUT'
    );

    setFormData(prev => ({
      ...prev,
      itemCode: code,
      // If found, auto-fill details, otherwise keep current
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
    // Capitalize first letter
    const capitalized = val.length > 0 
      ? val.charAt(0).toUpperCase() + val.slice(1) 
      : val;
    setFormData(prev => ({ ...prev, workName: capitalized }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className={`p-4 flex justify-between items-center text-white ${type === 'IN' ? 'bg-green-600' : 'bg-red-600'}`}>
          <h2 className="text-lg md:text-xl font-bold">{type === 'IN' ? 'STOCK IN' : 'STOCK OUT'} - {item.size} ({item.gsm})</h2>
          <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input 
                type="date" 
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-white"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Month</label>
              <input 
                type="text" 
                readOnly
                className="mt-1 block w-full rounded-md bg-gray-100 border-gray-300 shadow-sm border p-2"
                value={formData.month}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company (CAPS)</label>
              <input 
                type="text" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-white uppercase"
                value={formData.company}
                onChange={e => setFormData({...formData, company: e.target.value.toUpperCase()})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900">Quantity ({type === 'IN' ? 'In' : 'Out'})</label>
              <input 
                type="number" 
                min="1"
                step="any"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 font-bold text-lg bg-white"
                value={formData.quantity || ''}
                onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
              />
            </div>
          </div>

          {/* STOCK IN SPECIFIC FIELDS */}
          {type === 'IN' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Invoice No</label>
                    <input 
                        type="text" 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-white"
                        value={formData.invoice}
                        onChange={e => setFormData({...formData, invoice: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Storage Location (CAPS)</label>
                    <input 
                        type="text" 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-white uppercase"
                        value={formData.storageLocation}
                        onChange={e => setFormData({...formData, storageLocation: e.target.value.toUpperCase()})}
                    />
                </div>
              </div>
            </>
          )}

          {/* STOCK OUT SPECIFIC FIELDS */}
          {type === 'OUT' && (
            <>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Item Code (CAPS)</label>
                    <input 
                        type="text" 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-white uppercase"
                        value={formData.itemCode}
                        onChange={handleItemCodeChange}
                        placeholder="Enter Code to Auto-fill"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Work Name</label>
                    <input 
                        type="text" 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-white"
                        value={formData.workName}
                        onChange={handleWorkNameChange}
                    />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Unit</label>
                    <select 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-white"
                        value={formData.unit}
                        onChange={e => setFormData({...formData, unit: e.target.value})}
                    >
                        <option value="GROSS">GROSS</option>
                        <option value="CUTTING">CUTTING</option>
                        <option value="BOX">BOX</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Cutting Size</label>
                    <input 
                        type="text" 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-white"
                        value={formData.cuttingSize}
                        onChange={e => setFormData({...formData, cuttingSize: e.target.value})}
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-white"
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value})}
                    >
                        {STATUS_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700">Priority</label>
                   <select 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-white"
                        value={formData.priority}
                        onChange={e => setFormData({...formData, priority: e.target.value})}
                    >
                        {PRIORITY_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Vehicle</label>
                    <input 
                        type="text" 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-white"
                        value={formData.vehicle}
                        onChange={e => setFormData({...formData, vehicle: e.target.value})}
                    />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Destination/Loc (CAPS)</label>
                    <input 
                        type="text" 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-white uppercase"
                        value={formData.storageLocation} // Reusing field name for Location
                        onChange={e => setFormData({...formData, storageLocation: e.target.value.toUpperCase()})}
                    />
                </div>
              </div>
            </>
          )}

          <div>
             <label className="block text-sm font-medium text-gray-700">Remarks</label>
             <textarea 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-white"
                rows={2}
                value={formData.remarks}
                onChange={e => setFormData({...formData, remarks: e.target.value})}
             />
          </div>

        </form>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded text-sm md:text-base">Cancel</button>
            <button 
                onClick={handleSubmit}
                className={`px-4 py-2 text-white rounded font-bold flex items-center gap-2 shadow-lg text-sm md:text-base
                    ${type === 'IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
                <Save className="w-4 h-4" />
                Confirm
            </button>
        </div>
      </div>
    </div>
  );
};

export default StockOperationModal;