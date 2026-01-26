
import React, { useState, useRef } from 'react';
import { StockTransaction } from '../types';
import { ArrowLeft, Clock, Search, Truck, Download, Loader2 } from 'lucide-react';

interface PendingWorksProps {
  transactions: StockTransaction[];
  onBack: () => void;
  onUpdateTransaction: (id: string, updates: Partial<StockTransaction>) => void;
  onUpdatePriority: (id: string, newPriority: string) => void;
  isAdmin: boolean;
}

const STATUS_OPTIONS = ["Cutting", "Cutting Finished", "Out of Stock", "Order Placed", "Waiting for Reel", "Pending", "Delivered", "Other"];
const PRIORITY_OPTIONS = ["Very Urgent", "Urgent", "High", "Medium", "Low"];

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

const PendingWorks: React.FC<PendingWorksProps> = ({ transactions, onBack, onUpdateTransaction, onUpdatePriority, isAdmin }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [deliveryModal, setDeliveryModal] = useState<{id: string, vehicle: string, location: string} | null>(null);
  const pendingContainerRef = useRef<HTMLDivElement>(null);

  const pendingTransactions = transactions
    .filter(t => t.type === 'OUT' && t.status !== 'Delivered')
    .sort((a, b) => {
        const priorityOrder: Record<string, number> = { "Very Urgent": 5, "Urgent": 4, "High": 3, "Medium": 2, "Low": 1, undefined: 0 };
        const pA = priorityOrder[a.priority || 'Medium'] || 0;
        const pB = priorityOrder[b.priority || 'Medium'] || 0;
        if (pA !== pB) return pB - pA;
        return b.timestamp - a.timestamp;
    });

  const displayedTransactions = pendingTransactions.filter(t => 
    t.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.workName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.status || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.itemCode || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const confirmDelivery = () => {
      if (!deliveryModal) return;
      onUpdateTransaction(deliveryModal.id, { status: 'Delivered', vehicle: deliveryModal.vehicle, storageLocation: deliveryModal.location });
      setDeliveryModal(null);
  };

  const handleExport = () => {
    if (typeof (window as any).XLSX === 'undefined') return;
    const wb = (window as any).XLSX.utils.book_new();
    const ws = (window as any).XLSX.utils.json_to_sheet(displayedTransactions.map(t => ({
        DATE: t.date, SIZE: t.size, GSM: t.gsm, QTY: t.quantity, UNIT: t.unit, COMPANY: t.company, ITEM_CODE: t.itemCode, WORK_NAME: t.workName, CUT_SIZE: t.cuttingSize, SHEETS: t.sheets !== undefined ? t.sheets : (t.unit === 'GROSS' ? t.quantity * 144 : t.quantity), PRIORITY: t.priority, STATUS: t.status, REMARKS: t.remarks
    })));
    (window as any).XLSX.utils.book_append_sheet(wb, ws, "Pending Works");
    (window as any).XLSX.writeFile(wb, `Pending_Works_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] relative">
      {isPdfGenerating && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mb-4" /><p className="font-black uppercase tracking-widest text-sm">Generating PDF Snapshot...</p>
        </div>
      )}
      
      {deliveryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="bg-emerald-600 text-white p-6 font-black uppercase tracking-widest flex items-center gap-3"><Truck className="w-6 h-6" /> Mark Delivered</div>
                  <div className="p-8 space-y-5">
                      <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Vehicle Number</label><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none uppercase font-bold text-slate-800 transition-all" value={deliveryModal.vehicle} onChange={e => setDeliveryModal({...deliveryModal, vehicle: e.target.value})} /></div>
                      <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Delivery Location</label><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none uppercase font-bold text-slate-800 transition-all" placeholder="e.g. AKP" value={deliveryModal.location} onChange={e => setDeliveryModal({...deliveryModal, location: e.target.value})} /></div>
                      <div className="flex flex-col gap-2 pt-4">
                        <button onClick={confirmDelivery} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">Confirm Release</button>
                        <button onClick={() => setDeliveryModal(null)} className="w-full py-3 text-slate-400 hover:text-slate-600 font-bold uppercase text-[10px] tracking-widest transition-all">Dismiss</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <div className="p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm bg-white gap-3 md:gap-0 no-print">
        <div className="flex items-center gap-4 w-full md:w-auto px-4">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-800 transition-colors"><ArrowLeft className="w-5 h-5" /><span className="font-bold text-sm">Back</span></button>
            <h2 className="text-lg md:text-xl font-black text-orange-700 flex items-center gap-2 border-l border-slate-100 pl-4 ml-2 uppercase tracking-tighter"><Clock className="w-6 h-6" />PENDING WORKS</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto px-4">
             <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <input type="text" placeholder="Search operational queue..." className="pl-10 pr-4 py-2 rounded-2xl border border-slate-100 text-sm w-full md:w-72 focus:outline-none focus:ring-4 focus:ring-orange-500/10 bg-slate-50 text-center font-black" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={handleExport} className="bg-emerald-600 text-white px-5 py-2 rounded-2xl text-sm shadow-lg shadow-emerald-500/10 hover:bg-emerald-700 flex items-center gap-2 font-black uppercase tracking-widest transition-all"><Download className="w-4 h-4" /> Export</button>
        </div>
      </div>

      <div ref={pendingContainerRef} className="flex-1 overflow-auto p-6">
        <div className="overflow-x-auto rounded-[2.5rem] border border-slate-200 shadow-xl bg-white mobile-bottom-scroll">
            <div className="min-w-[1100px] p-4">
                <table className="w-full text-xs text-center border-collapse">
                    <thead className="bg-orange-600 text-white sticky top-0 z-10 rounded-t-[2rem]">
                        <tr>
                            <th className="p-3 border border-white/10 first:rounded-tl-[1.5rem] whitespace-nowrap uppercase tracking-widest">DATE</th>
                            <th className="p-3 border border-white/10 whitespace-nowrap uppercase tracking-widest">SIZE</th>
                            <th className="p-3 border border-white/10 whitespace-nowrap uppercase tracking-widest">GSM</th>
                            <th className="p-3 border border-white/10 whitespace-nowrap uppercase tracking-widest">QTY</th>
                            <th className="p-3 border border-white/10 whitespace-nowrap uppercase tracking-widest">COMPANY</th>
                            <th className="p-3 border border-white/10 whitespace-nowrap uppercase tracking-widest">ITEM CODE</th>
                            <th className="p-3 border border-white/10 whitespace-nowrap uppercase tracking-widest">WORK NAME</th>
                            <th className="p-3 border border-white/10 whitespace-nowrap uppercase tracking-widest">CUT SIZE</th>
                            <th className="p-3 border border-white/10 bg-orange-700 font-black whitespace-nowrap uppercase tracking-widest">SHEETS</th>
                            <th className="p-3 border border-white/10 whitespace-nowrap uppercase tracking-widest">PRIORITY</th>
                            <th className="p-3 border border-white/10 whitespace-nowrap uppercase tracking-widest">STATUS</th>
                            <th className="p-3 border border-white/10 last:rounded-tr-[1.5rem] whitespace-nowrap uppercase tracking-widest">REMARKS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {displayedTransactions.map(t => (
                            <tr key={t.id} className="odd:bg-white even:bg-orange-50/30 hover:bg-amber-50 transition-colors font-black">
                                <td className="p-3 border border-gray-100 text-slate-500">{t.date}</td>
                                <td className="p-3 border border-gray-100 text-slate-800">{t.size}</td>
                                <td className="p-3 border border-gray-100">{t.gsm}</td>
                                <td className="p-3 border border-gray-100 text-rose-600">{t.quantity} <span className="text-[9px] text-slate-400 font-normal uppercase">{t.unit}</span></td>
                                <td className="p-3 border border-gray-100 uppercase text-[10px] text-slate-700">{t.company}</td>
                                <td className="p-3 border border-gray-100 text-indigo-600 uppercase">{t.itemCode || '-'}</td>
                                <td className="p-3 border border-gray-100 min-w-[300px] max-w-[450px] truncate text-left px-5" title={t.workName}>{t.workName}</td>
                                <td className="p-3 border border-gray-100 text-indigo-600">{t.cuttingSize}</td>
                                <td className="p-3 border border-gray-100 text-blue-700 bg-blue-50/50">
                                    {t.sheets !== undefined ? t.sheets : (t.unit === 'GROSS' ? (t.quantity * 144).toFixed(0) : t.quantity)}
                                </td>
                                <td className="p-3 border border-gray-100 bg-white w-[110px]">
                                    <select 
                                      className={`w-full p-1.5 border-0 rounded-xl text-[9px] font-black uppercase tracking-widest text-center shadow-sm cursor-pointer transition-all ${getPriorityColor(t.priority || 'Medium')}`} 
                                      value={t.priority || 'Medium'} 
                                      onChange={(e) => onUpdatePriority(t.id, e.target.value)}
                                    >
                                      {PRIORITY_OPTIONS.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                                    </select>
                                </td>
                                <td className="p-3 border border-gray-100 bg-white w-[130px]">
                                    <select 
                                      className="w-full p-1.5 border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-center bg-slate-50 hover:bg-white cursor-pointer transition-all" 
                                      value={t.status} 
                                      onChange={(e) => { if (e.target.value === 'Delivered') setDeliveryModal({ id: t.id, vehicle: 'KL65S7466', location: '' }); else onUpdateTransaction(t.id, { status: e.target.value }); }}
                                    >
                                      {STATUS_OPTIONS.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                                    </select>
                                </td>
                                <td className="p-3 border border-gray-100 italic text-slate-400 max-w-xs truncate font-medium">{t.remarks}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PendingWorks;
