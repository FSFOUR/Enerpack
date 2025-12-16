
import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { X, Save } from 'lucide-react';

interface ItemEditModalProps {
  item: InventoryItem;
  onClose: () => void;
  onSave: (updatedItem: InventoryItem) => void;
}

const SECTION_ORDER = ["280", "250", "230", "200", "150", "140", "140GYT", "130", "130GYT", "100", "GYT"];

const ItemEditModal: React.FC<ItemEditModalProps> = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    size: item.size,
    gsm: item.gsm,
    minStock: item.minStock || 0,
    remarks: item.remarks || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...item,
      size: formData.size,
      gsm: formData.gsm,
      minStock: Number(formData.minStock),
      remarks: formData.remarks
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-900 text-white p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold">Edit Item Details</h2>
          <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Size</label>
            <input 
              type="text" 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
              value={formData.size}
              onChange={e => setFormData({...formData, size: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">GSM / Section</label>
            <select 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                value={formData.gsm}
                onChange={e => setFormData({...formData, gsm: e.target.value})}
             >
                 {SECTION_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                 <option value="Other">Other</option>
             </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-red-700">Minimum Quantity (Low Stock Alert)</label>
            <input 
              type="number" 
              className="mt-1 block w-full rounded-md border-red-300 shadow-sm border p-2 bg-red-50"
              value={formData.minStock}
              onChange={e => setFormData({...formData, minStock: Number(e.target.value)})}
            />
            <p className="text-xs text-gray-500 mt-1">Stock below this level will be highlighted red and listed in Reorder Page.</p>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700">Remarks</label>
             <textarea 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                rows={2}
                value={formData.remarks}
                onChange={e => setFormData({...formData, remarks: e.target.value})}
             />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
             <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">Cancel</button>
             <button type="submit" className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Changes
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemEditModal;
