import React, { useState, useRef } from 'react';
import { StockTransaction } from '../types';
import { Download, ArrowLeft, Search, FileText, Loader2 } from 'lucide-react';

interface TransactionHistoryProps {
  type: 'IN' | 'OUT' | 'REORDER';
  transactions: StockTransaction[];
  onBack: () => void;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ type, transactions, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const filteredByType = transactions
    .filter(t => {
        if (type === 'IN') return t.type === 'IN';
        if (type === 'REORDER') return t.type === 'REORDER';
        if (type === 'OUT') return t.type === 'OUT' && t.status === 'Delivered';
        return false;
    })
    .sort((a, b) => b.timestamp - a.timestamp);

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
          case 'OUT': return 'STOCK OUT LOGS (DELIVERED)';
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
    if (typeof (window as any).XLSX === 'undefined') return;
    const wb = (window as any).XLSX.utils.book_new();
    const ws = (window as any).XLSX.utils.json_to_sheet(displayedTransactions.map(t => {
        if (type === 'IN') {
            return { DATE: t.date, MONTH: t.month, SIZE: t.size, GSM: t.gsm, IN: t.quantity, COMPANY: t.company, INVOICE: t.invoice, LOCATION: t.storageLocation, REMARKS: t.remarks };
        } else if (type === 'OUT') {
            const sheetsValue = t.sheets !== undefined ? t.sheets : (t.unit === 'GROSS' ? t.quantity * 144 : t.quantity);
            return { DATE: t.date, MONTH: t.month, SIZE: t.size, GSM: t.gsm, OUT: t.quantity, UNIT: t.unit, COMPANY: t.company, ITEM_CODE: t.itemCode, WORK_NAME: t.workName, CUT_SIZE: t.cuttingSize, SHEETS: sheetsValue, STATUS: t.status, VEHICLE: t.vehicle, LOCATION: t.storageLocation, REMARKS: t.remarks };
        } else {
            return { ORDER_DATE: t.date, MONTH: t.month, SIZE: t.size, GSM: t.gsm, QUANTITY: t.quantity, COMPANY: t.company, RECEIVED_DATE: t.receivedDate || '-', RECEIVED_QTY: t.receivedQty || 0, REMARKS: t.remarks };
        }
    }));
    (window as any).XLSX.utils.book_append_sheet(wb, ws, `History ${type}`);
    (window as any).XLSX.writeFile(wb, `History_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDownloadPDF = async () => {
    if (!logContainerRef.current) return;
    setIsPdfGenerating(true);
    const element = logContainerRef.current;
    const opt = { margin: 5, filename: `Enerpack_Logs_${type}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } };
    try { await (window as any).html2pdf().set(opt).from(element).save(); } catch (err) { console.error(err); } finally { setIsPdfGenerating(false); }
  };

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] relative">
      {isPdfGenerating && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mb-4" />
          <p className="font-black uppercase tracking-widest text-sm">Generating PDF Log...</p>
        </div>
      )}

      <div className="p-4 border-b bg-white flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm gap-3 md:gap-0 no-print">
        <div className="flex items-center gap-4 w-full md:w-auto px-4">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"><ArrowLeft className="w-5 h-5" /><span className="font-black text-sm uppercase">Back</span></button>
            <h2 className={`text-lg md:text-xl font-black pl-4 ml-2 border-l-2 uppercase tracking-tighter ${getTitleColor()}`}>{getTitle()}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto px-4">
            <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Search logs..." className="pl-9 pr-4 py-2 rounded-2xl border border-gray-200 text-sm w-full md:w-64 focus:outline-none bg-slate-50 text-center font-black" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={handleDownloadPDF} className="bg-rose-600 text-white px-4 py-2 rounded-2xl text-sm shadow-lg hover:bg-rose-700 flex items-center gap-2 font-black uppercase transition-all"><FileText className="w-4 h-4" /> PDF</button>
            <button onClick={handleExport} className="bg-emerald-600 text-white px-4 py-2 rounded-2xl text-sm shadow-lg hover:bg-emerald-700 flex items-center gap-2 font-black uppercase transition-all"><Download className="w-4 h-4" /> Excel</button>
        </div>
      </div>

      <div ref={logContainerRef} className="flex-1 overflow-auto p-6 bg-[#f1f5f9]">
        <div className="overflow-x-auto rounded-[2.5rem] border border-gray-200 bg-white shadow-xl mobile-bottom-scroll">
            <div className="min-w-[800px] p-4">
                <table className="w-full text-xs text-center border-collapse">
                    <thead className={`${getHeaderColor()} text-white sticky top-0 z-10 rounded-t-[2rem]`}>
                        {type === 'IN' && (
                            <tr>
                                <th className="p-3 border border-white/10 first:rounded-tl-[1.5rem] uppercase tracking-widest">DATE</th>
                                <th className="p-3 border border-white/10 uppercase tracking-widest">MONTH</th>
                                <th className="p-3 border border-white/10 uppercase tracking-widest">SIZE</th>
                                <th className="p-3 border border-white/10 uppercase tracking-widest">GSM</th>
                                <th className="p-3 border border-white/10 uppercase tracking-widest">IN</th>
                                <th className="p-3 border border-white/10 uppercase tracking-widest">COMPANY</th>
                                <th className="p-3 border border-white/10 uppercase tracking-widest">INVOICE</th>
                                <th className="p-3 border border-white/10 uppercase tracking-widest">STORAGE LOC</th>
                                <th className="p-3 border border-white/10 last:rounded-tr-[1.5rem] uppercase tracking-widest">REMARKS</th>
                            </tr>
                        )}
                        {type === 'OUT' && (
                            <tr>
                                <th className="p-3 border border-white/10 first:rounded-tl-[1.5rem] uppercase tracking-widest">DATE</th>
                                <th className="p-3 border border-white/10 uppercase tracking-widest">SIZE</th>
                                <th className="p-3 border border-white/10 uppercase tracking-widest">GSM</th>
                                <th className="p-3 border border-white/10 uppercase tracking-widest">OUT</th>
                                <th className="p-3 border border-white/10 uppercase tracking-widest">UNIT</th>
                                <th className="p-3 border border-white/10 uppercase tracking-widest w-[100px]">ITEM CODE</th>
                                <th className="p-3 border border-white/10 uppercase tracking-widest min-w-[300px]">WORK NAME</th>
                                <th className="p-3 border border-white/10 uppercase tracking-widest">CUT SIZE</th>
                                <th className="p-3 border border-white/10 bg-red-900 font-black uppercase tracking-widest">SHEETS</th>
                                <th className="p-3 border border-white/10 uppercase tracking-widest">STATUS</th>
                                <th className="p-3 border border-white/10 uppercase tracking-widest">VEHICLE</th>
                                <th className="p-3 border border-white/10 uppercase tracking-widest">LOCATION</th>
                                <th className="p-3 border border-white/10 last:rounded-tr-[1.5rem] uppercase tracking-widest">REMARKS</th>
                            </tr>
                        )}
                        {type === 'REORDER' && (
                            <tr>
                                <th className="p-3 border border-white/10 first:rounded-tl-[1.5rem] uppercase tracking-widest">ORDER DATE</th>
                                <th className="p-3 border border-white/10 uppercase tracking-widest">SIZE</th>
                                <th className="p-3 border border-white/10 uppercase tracking-widest">GSM</th>
                                <th className="p-3 border border-white/10 uppercase tracking-widest">QUANTITY</th>
                                <th className="p-3 border border-white/10 uppercase tracking-widest">COMPANY</th>
                                <th className="p-3 border border-white/10 uppercase tracking-widest">RECEIVED</th>
                                <th className="p-3 border border-white/10 uppercase tracking-widest">REC QTY</th>
                                <th className="p-3 border border-white/10 last:rounded-tr-[1.5rem] uppercase tracking-widest">REMARKS</th>
                            </tr>
                        )}
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {displayedTransactions.map(t => (
                            <tr key={t.id} className="odd:bg-white even:bg-slate-50/50 hover:bg-amber-50 transition-colors font-black">
                                {type === 'IN' && (
                                    <>
                                        <td className="p-3 border border-gray-100 text-slate-500">{t.date}</td>
                                        <td className="p-3 border border-gray-100">{t.month}</td>
                                        <td className="p-3 border border-gray-100 text-slate-800">{t.size}</td>
                                        <td className="p-3 border border-gray-100">{t.gsm}</td>
                                        <td className="p-3 border border-gray-100 text-emerald-600">{t.quantity}</td>
                                        <td className="p-3 border border-gray-100 uppercase text-[10px]">{t.company}</td>
                                        <td className="p-3 border border-gray-100">{t.invoice}</td>
                                        <td className="p-3 border border-gray-100">{t.storageLocation}</td>
                                        <td className="p-3 border border-gray-100 italic text-slate-400 max-w-xs truncate font-medium">{t.remarks}</td>
                                    </>
                                )}
                                {type === 'OUT' && (
                                    <>
                                        <td className="p-3 border border-gray-100 text-slate-500">{t.date}</td>
                                        <td className="p-3 border border-gray-100 text-slate-800">{t.size}</td>
                                        <td className="p-3 border border-gray-100">{t.gsm}</td>
                                        <td className="p-3 border border-gray-100 text-rose-600">{t.quantity}</td>
                                        <td className="p-3 border border-gray-100 text-slate-400">{t.unit}</td>
                                        <td className="p-3 border border-gray-100 text-indigo-600">{t.itemCode}</td>
                                        <td className="p-3 border border-gray-100 min-w-[300px] max-w-md truncate text-left px-5">{t.workName}</td>
                                        <td className="p-3 border border-gray-100 text-slate-600">{t.cuttingSize}</td>
                                        <td className="p-3 border border-gray-100 text-blue-700 bg-blue-50/30">
                                            {t.sheets !== undefined ? t.sheets : (t.unit === 'GROSS' ? (t.quantity * 144).toFixed(0) : t.quantity)}
                                        </td>
                                        <td className={`p-3 border border-gray-100`}>
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${t.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="p-3 border border-gray-100 uppercase text-[10px] text-slate-400">{t.vehicle}</td>
                                        <td className="p-3 border border-gray-100 uppercase text-[10px] text-slate-400">{t.storageLocation}</td>
                                        <td className="p-3 border border-gray-100 italic text-slate-400 max-w-xs truncate font-medium">{t.remarks}</td>
                                    </>
                                )}
                                {type === 'REORDER' && (
                                    <>
                                        <td className="p-3 border border-gray-100 text-slate-500">{t.date}</td>
                                        <td className="p-3 border border-gray-100 text-slate-800">{t.size}</td>
                                        <td className="p-3 border border-gray-100">{t.gsm}</td>
                                        <td className="p-3 border border-gray-100 text-purple-600">{t.quantity}</td>
                                        <td className="p-3 border border-gray-100 uppercase">{t.company}</td>
                                        <td className="p-3 border border-gray-100 text-emerald-600">{t.receivedDate || '-'}</td>
                                        <td className="p-3 border border-gray-100">{t.receivedQty || '-'}</td>
                                        <td className="p-3 border border-gray-100 italic text-slate-400 max-w-xs truncate font-medium">{t.remarks}</td>
                                    </>
                                )}
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

export default TransactionHistory;