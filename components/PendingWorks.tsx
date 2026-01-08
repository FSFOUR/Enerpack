import React, { useState, useRef } from 'react';
import { StockTransaction } from '../types';
import { ArrowLeft, Clock, Search, Truck, Download, Lock, FileText, Loader2 } from 'lucide-react';

interface PendingWorksProps {
  transactions: StockTransaction[];
  onBack: () => void;
  onUpdateTransaction: (id: string, updates: Partial<StockTransaction>) => void;
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
    (t.vehicle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.status || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.remarks || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = (t: StockTransaction, newStatus: string) => {
      if (!isAdmin) return;
      if (newStatus === 'Delivered') {
          setDeliveryModal({ id: t.id, vehicle: 'KL65S7466', location: '' });
      } else {
          onUpdateTransaction(t.id, { status: newStatus });
      }
  };

  const confirmDelivery = () => {
      if (!deliveryModal || !isAdmin) return;
      onUpdateTransaction(deliveryModal.id, { 
          status: 'Delivered', 
          vehicle: deliveryModal.vehicle, 
          storageLocation: deliveryModal.location 
      });
      setDeliveryModal(null);
  };

  const handleExport = () => {
    if (typeof (window as any).XLSX === 'undefined') {
       alert("Excel library not loaded.");
       return;
    }
    const wb = (window as any).XLSX.utils.book_new();
    const ws = (window as any).XLSX.utils.json_to_sheet(displayedTransactions.map(t => ({
        DATE: t.date,
        SIZE: t.size,
        GSM: t.gsm,
        QTY: t.quantity,
        COMPANY: t.company,
        WORK_NAME: t.workName,
        CUT_SIZE: t.cuttingSize,
        PRIORITY: t.priority,
        STATUS: t.status,
        REMARKS: t.remarks
    })));
    (window as any).XLSX.utils.book_append_sheet(wb, ws, "Pending Works");
    (window as any).XLSX.writeFile(wb, `Pending_Works_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDownloadPDF = async () => {
    if (!pendingContainerRef.current) return;
    setIsPdfGenerating(true);
    
    const element = pendingContainerRef.current;
    const opt = {
      margin: 10,
      filename: `Pending_Works_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    try {
      await (window as any).html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Failed to generate PDF.");
    } finally {
      setIsPdfGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {isPdfGenerating && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mb-4" />
          <p className="font-black uppercase tracking-widest text-sm">Generating PDF Snapshot...</p>
        </div>
      )}
      
      {deliveryModal && isAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="bg-green-600 text-white p-4 font-bold flex items-center gap-2">
                      <Truck className="w-5 h-5" /> Mark as Delivered
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Vehicle Number</label>
                          <input 
                              type="text" 
                              className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500 outline-none uppercase"
                              value={deliveryModal.vehicle}
                              onChange={e => setDeliveryModal({...deliveryModal, vehicle: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Delivery Location</label>
                          <input 
                              type="text" 
                              className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500 outline-none uppercase"
                              placeholder="e.g. AKP"
                              value={deliveryModal.location}
                              onChange={e => setDeliveryModal({...deliveryModal, location: e.target.value})}
                          />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                          <button onClick={() => setDeliveryModal(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm font-medium">Cancel</button>
                          <button onClick={confirmDelivery} className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded text-sm font-bold shadow-md">Complete Delivery</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <div className="p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm bg-orange-50 gap-3 md:gap-0 no-print">
        <div className="flex items-center gap-4 w-full md:w-auto">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-bold text-sm">Back</span>
            </button>
            <h2 className="text-lg md:text-xl font-bold text-orange-700 flex items-center gap-2 border-l border-orange-200 pl-4 ml-2">
                <Clock className="w-6 h-6" />
                PENDING WORKS {!isAdmin && <span className="text-[10px] font-black text-orange-400 bg-white/50 px-2 py-0.5 rounded ml-2 uppercase tracking-[0.15em] border border-orange-200 flex items-center gap-1"><Lock className="w-3 h-3" /> Locked</span>}
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
            <button onClick={handleDownloadPDF} className="bg-rose-600 text-white px-3 py-1.5 rounded-full text-sm shadow hover:bg-rose-700 flex items-center gap-2 font-bold whitespace-nowrap">
                <FileText className="w-4 h-4" /> PDF
            </button>
            <button onClick={handleExport} className="bg-green-600 text-white px-3 py-1.5 rounded-full text-sm shadow hover:bg-green-700 flex items-center gap-2 font-bold whitespace-nowrap">
                <Download className="w-4 h-4" /> Export
            </button>
        </div>
      </div>

      <div ref={pendingContainerRef} className="flex-1 overflow-auto p-4 bg-white">
        <div className="hidden print:block mb-4 text-center">
            <h1 className="text-xl font-black uppercase text-orange-700">Pending Operations Report</h1>
            <p className="text-xs font-bold text-slate-400 mt-1">Outstanding Cutting & Delivery Status - {new Date().toLocaleDateString()}</p>
        </div>

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
                            <th className="p-2 border border-orange-500 text-center whitespace-nowrap">PRIORITY</th>
                            <th className="p-2 border border-orange-500 text-center whitespace-nowrap">CURRENT STATUS</th>
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
                                <td className="p-2 border border-gray-300 bg-white whitespace-nowrap min-w-[120px]">
                                    <select 
                                        className={`w-full p-1 border rounded text-xs font-bold text-center disabled:opacity-50 ${getPriorityColor(t.priority || 'Medium')}`}
                                        value={t.priority || 'Medium'}
                                        onChange={(e) => onUpdatePriority(t.id, e.target.value)}
                                        disabled={!isAdmin}
                                    >
                                        {PRIORITY_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="p-2 border border-gray-300 bg-white whitespace-nowrap min-w-[150px]">
                                    {isAdmin ? (
                                      <select 
                                          className={`w-full p-1 border rounded text-xs font-bold text-center disabled:opacity-50 ${
                                              t.status === 'Out of Stock' ? 'text-red-600 bg-red-50' : 
                                              t.status === 'Cutting' ? 'text-blue-600 bg-blue-50' : 'text-gray-800'
                                          }`}
                                          value={t.status}
                                          onChange={(e) => handleStatusChange(t, e.target.value)}
                                          disabled={!isAdmin}
                                      >
                                          {STATUS_OPTIONS.map(opt => (
                                              <option key={opt} value={opt}>{opt}</option>
                                          ))}
                                      </select>
                                    ) : (
                                      <div className="flex items-center justify-center gap-2 text-slate-400 font-bold py-1">
                                        <Lock className="w-3 h-3" /> {t.status}
                                      </div>
                                    )}
                                </td>
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