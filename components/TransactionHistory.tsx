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
    <div className="flex flex-col h-full bg-white relative">
      {isPdfGenerating && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mb-4" />
          <p className="font-black uppercase tracking-widest text-sm">Generating PDF Log...</p>
        </div>
      )}

      <div className="p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm gap-3 md:gap-0 no-print">
        <div className="flex items-center gap-4 w-full md:w-auto">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"><ArrowLeft className="w-5 h-5" /><span className="font-bold text-sm">Back</span></button>
            <h2 className={`text-lg md:text-xl font-bold pl-4 ml-2 border-l-2 ${getTitleColor()}`}>{getTitle()}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Search logs..." className="pl-8 pr-4 py-1.5 rounded-full border border-gray-300 text-sm w-full md:w-64 focus:outline-none bg-gray-50 text-center" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={handleDownloadPDF} className="bg-rose-600 text-white px-3 py-1.5 rounded text-sm shadow hover:bg-rose-700 flex items-center gap-2 font-medium"><FileText className="w-4 h-4" /> PDF</button>
            <button onClick={handleExport} className="bg-green-600 text-white px-3 py-1.5 rounded text-sm shadow hover:bg-green-700 flex items-center gap-2 font-medium"><Download className="w-4 h-4" /> Excel</button>
        </div>
      </div>

      <div ref={logContainerRef} className="flex-1 overflow-auto p-4 bg-white">
        <div className="overflow-x-auto rounded-lg border border-gray-300">
            <div className="min-w-max">
                <table className="w-full text-xs text-center border-collapse">
                    <thead className={`${getHeaderColor()} text-white sticky top-0`}>
                        {type === 'IN' && (
                            <tr>
                                <th className="p-2 border border-white/20">DATE</th>
                                <th className="p-2 border border-white/20">MONTH</th>
                                <th className="p-2 border border-white/20">SIZE</th>
                                <th className="p-2 border border-white/20">GSM</th>
                                <th className="p-2 border border-white/20">IN</th>
                                <th className="p-2 border border-white/20">COMPANY</th>
                                <th className="p-2 border border-white/20">INVOICE</th>
                                <th className="p-2 border border-white/20">STORAGE LOC</th>
                                <th className="p-2 border border-white/20">REMARKS</th>
                            </tr>
                        )}
                        {type === 'OUT' && (
                            <tr>
                                <th className="p-2 border border-white/20">DATE</th>
                                <th className="p-2 border border-white/20">SIZE</th>
                                <th className="p-2 border border-white/20">GSM</th>
                                <th className="p-2 border border-white/20">OUT</th>
                                <th className="p-2 border border-white/20">UNIT</th>
                                <th className="p-2 border border-white/20">ITEM CODE</th>
                                <th className="p-2 border border-white/20">WORK NAME</th>
                                <th className="p-2 border border-white/20">CUT SIZE</th>
                                <th className="p-2 border border-white/20 bg-red-900">SHEETS</th>
                                <th className="p-2 border border-white/20">STATUS</th>
                                <th className="p-2 border border-white/20">VEHICLE</th>
                                <th className="p-2 border border-white/20">LOCATION</th>
                                <th className="p-2 border border-white/20">REMARKS</th>
                            </tr>
                        )}
                        {type === 'REORDER' && (
                            <tr>
                                <th className="p-2 border border-white/20">ORDER DATE</th>
                                <th className="p-2 border border-white/20">SIZE</th>
                                <th className="p-2 border border-white/20">GSM</th>
                                <th className="p-2 border border-white/20">QUANTITY</th>
                                <th className="p-2 border border-white/20">COMPANY</th>
                                <th className="p-2 border border-white/20">RECEIVED</th>
                                <th className="p-2 border border-white/20">REC QTY</th>
                                <th className="p-2 border border-white/20">REMARKS</th>
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {displayedTransactions.map(t => (
                            <tr key={t.id} className="odd:bg-white even:bg-gray-50 hover:bg-yellow-50">
                                {type === 'IN' && (
                                    <>
                                        <td className="p-2 border border-gray-300">{t.date}</td>
                                        <td className="p-2 border border-gray-300">{t.month}</td>
                                        <td className="p-2 border border-gray-300 font-bold">{t.size}</td>
                                        <td className="p-2 border border-gray-300">{t.gsm}</td>
                                        <td className="p-2 border border-gray-300 font-bold text-green-700">{t.quantity}</td>
                                        <td className="p-2 border border-gray-300">{t.company}</td>
                                        <td className="p-2 border border-gray-300">{t.invoice}</td>
                                        <td className="p-2 border border-gray-300">{t.storageLocation}</td>
                                        <td className="p-2 border border-gray-300 truncate max-w-xs">{t.remarks}</td>
                                    </>
                                )}
                                {type === 'OUT' && (
                                    <>
                                        <td className="p-2 border border-gray-300">{t.date}</td>
                                        <td className="p-2 border border-gray-300 font-bold">{t.size}</td>
                                        <td className="p-2 border border-gray-300">{t.gsm}</td>
                                        <td className="p-2 border border-gray-300 font-bold text-red-700">{t.quantity}</td>
                                        <td className="p-2 border border-gray-300 text-slate-500 font-bold">{t.unit}</td>
                                        <td className="p-2 border border-gray-300">{t.itemCode}</td>
                                        <td className="p-2 border border-gray-300 max-w-xs truncate">{t.workName}</td>
                                        <td className="p-2 border border-gray-300 font-bold text-slate-700">{t.cuttingSize}</td>
                                        <td className="p-2 border border-gray-300 font-black text-blue-700 bg-blue-50/50">
                                            {t.sheets !== undefined ? t.sheets : (t.unit === 'GROSS' ? (t.quantity * 144).toFixed(0) : t.quantity)}
                                        </td>
                                        <td className={`p-2 border border-gray-300 font-bold ${t.status === 'Delivered' ? 'text-green-600' : 'text-orange-600'}`}>{t.status}</td>
                                        <td className="p-2 border border-gray-300 uppercase">{t.vehicle}</td>
                                        <td className="p-2 border border-gray-300 uppercase">{t.storageLocation}</td>
                                        <td className="p-2 border border-gray-300 truncate max-w-xs">{t.remarks}</td>
                                    </>
                                )}
                                {type === 'REORDER' && (
                                    <>
                                        <td className="p-2 border border-gray-300">{t.date}</td>
                                        <td className="p-2 border border-gray-300 font-bold">{t.size}</td>
                                        <td className="p-2 border border-gray-300">{t.gsm}</td>
                                        <td className="p-2 border border-gray-300 font-bold text-purple-700">{t.quantity}</td>
                                        <td className="p-2 border border-gray-300">{t.company}</td>
                                        <td className="p-2 border border-gray-300 font-bold text-green-700">{t.receivedDate || '-'}</td>
                                        <td className="p-2 border border-gray-300">{t.receivedQty || '-'}</td>
                                        <td className="p-2 border border-gray-300 truncate max-w-xs">{t.remarks}</td>
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