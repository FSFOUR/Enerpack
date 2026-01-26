import React, { useState, useRef } from 'react';
import { InventoryItem, StockTransaction } from '../types';
import { 
  Plus, 
  Minus, 
  Search, 
  FileDown, 
  Pencil, 
  X, 
  FileText,
  Loader2,
  Lock,
  Clock,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import StockOperationModal from './StockOperationModal';
import ItemEditModal from './ItemEditModal';

interface InventoryTableProps {
  items: InventoryItem[];
  transactions: StockTransaction[];
  onUpdateStock: (id: string, delta: number) => void;
  onAddItem: (item: Omit<InventoryItem, 'id'>) => void;
  onRecordTransaction: (transaction: Omit<StockTransaction, 'id' | 'timestamp'>) => void;
  onBulkUpdate: (items: InventoryItem[]) => void;
  onUpdateItem: (item: InventoryItem) => void;
  onDeleteItem: (item: InventoryItem) => void;
  isAdmin?: boolean;
}

const GSM_GROUPS = [
  { label: "280", values: ["280"] },
  { label: "250 & 230", values: ["250", "230"] },
  { label: "200", values: ["200"] },
  { label: "150, 100", values: ["150", "100"] },
  { label: "140 GYT, 130", values: ["140GYT", "130"] }
];

// Strictly defined widths to ensure "Equally Aligned" columns across all sections
const COL_WIDTHS = {
  size: 'w-[15%]',
  gsm: 'w-[10%]',
  stock: 'w-[15%]',
  action: 'w-[20%]',
  remarks: 'w-[40%]'
};

const InventoryTable: React.FC<InventoryTableProps> = ({ 
  items, transactions, onUpdateStock, onAddItem, onRecordTransaction, onUpdateItem, onDeleteItem, isAdmin = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [modalOpen, setModalOpen] = useState<{type: 'IN' | 'OUT', item: InventoryItem} | null>(null);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  const [newItem, setNewItem] = useState<Omit<InventoryItem, 'id'>>({
    size: '', gsm: '280', closingStock: 0, minStock: 0, category: 'SINGLE'
  });

  const filteredItems = items.filter(item => 
    item.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.gsm.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = () => {
    if (!newItem.size || !newItem.gsm) return;
    onAddItem({ ...newItem, category: (newItem.size.includes('*') ? 'DOUBLE' : 'SINGLE') as any });
    setNewItem({ size: '', gsm: '280', closingStock: 0, minStock: 0, category: 'SINGLE' });
    setIsAdding(false);
  };

  const handleExport = () => {
    if (typeof (window as any).XLSX === 'undefined') return;
    const wb = (window as any).XLSX.utils.book_new();
    const ws = (window as any).XLSX.utils.json_to_sheet(items.map(i => ({
        SIZE: i.size, GSM: i.gsm, STOCK: i.closingStock, MIN_QTY: i.minStock, REMARKS: i.remarks
    })));
    (window as any).XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    (window as any).XLSX.writeFile(wb, `Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleSavePDF = async () => {
    if (!tableContainerRef.current) return;
    setIsPdfGenerating(true);
    const element = tableContainerRef.current;
    element.classList.add('pdf-export-mode');
    const opt = { 
      margin: 8, 
      filename: `Enerpack_Stock_Report.pdf`, 
      image: { type: 'jpeg', quality: 1.0 }, 
      html2canvas: { scale: 4, useCORS: true, backgroundColor: '#ffffff' }, 
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true } 
    };
    try { 
      await (window as any).html2pdf().set(opt).from(element).save(); 
    } catch (err) { 
      alert("Failed to generate PDF."); 
    } finally { 
      element.classList.remove('pdf-export-mode'); 
      setIsPdfGenerating(false); 
    }
  };

  const sizeSort = (a: InventoryItem, b: InventoryItem) => {
    const valA = parseFloat(a.size.split('*')[0]);
    const valB = parseFloat(b.size.split('*')[0]);
    if (isNaN(valA) || isNaN(valB)) return a.size.localeCompare(b.size);
    return valA - valB;
  };

  const getSubTableConfig = (group: { label: string, values: string[] }) => {
    const groupItems = filteredItems.filter(i => group.values.includes(i.gsm));
    let left: { label: string, items: InventoryItem[] }[] = [];
    let right: { label: string, items: InventoryItem[] }[] = [];

    if (group.label === "280") {
      const single = groupItems.filter(i => !i.size.includes('*')).sort(sizeSort);
      const double = groupItems.filter(i => i.size.includes('*')).sort(sizeSort);
      left = [{ label: "SINGLE SIZE", items: single }, { label: "DOUBLE SIZE", items: double.slice(0, 7) }];
      right = [{ label: "DOUBLE SIZE", items: double.slice(7) }];
    } else if (group.label === "250 & 230") {
      // Removed 250 SINGLE and 230 SINGLE. Left with only DOUBLE sizes.
      left = [
        { label: "250 DOUBLE", items: groupItems.filter(i => i.gsm === "250" && i.size.includes('*')).sort(sizeSort) }
      ];
      right = [
        { label: "230 DOUBLE", items: groupItems.filter(i => i.gsm === "230" && i.size.includes('*')).sort(sizeSort) }
      ];
    } else if (group.label === "200") {
      const single = groupItems.filter(i => !i.size.includes('*')).sort(sizeSort);
      const double = groupItems.filter(i => i.size.includes('*')).sort(sizeSort);
      left = [{ label: "SINGLE SIZE", items: single }, { label: "DOUBLE SIZE", items: double.slice(0, 11) }];
      right = [{ label: "DOUBLE SIZE", items: double.slice(11) }];
    } else if (group.label === "150, 100") {
      left = [{ label: "150", items: groupItems.filter(i => i.gsm === "150").sort(sizeSort) }];
      right = [{ label: "100", items: groupItems.filter(i => i.gsm === "100").sort(sizeSort) }];
    } else if (group.label === "140 GYT, 130") {
      left = [{ label: "140 GYT", items: groupItems.filter(i => i.gsm === "140GYT").sort(sizeSort) }];
      right = [{ label: "130", items: groupItems.filter(i => i.gsm === "130").sort(sizeSort) }];
    }

    return { left, right };
  };

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] print:bg-white relative overflow-hidden print:overflow-visible">
      {modalOpen && <StockOperationModal type={modalOpen.type} item={modalOpen.item} transactions={transactions} onClose={() => setModalOpen(null)} onConfirm={(t) => { onRecordTransaction(t); onUpdateStock(t.itemId, t.type === 'IN' ? t.quantity : -t.quantity); setModalOpen(null); }} />}
      {editItem && <ItemEditModal item={editItem} onClose={() => setEditItem(null)} onSave={(upd) => { onUpdateItem(upd); setEditItem(null); }} />}
      {isPdfGenerating && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mb-4" /><p className="font-black uppercase tracking-widest text-sm">Aligning Matrix...</p>
        </div>
      )}

      <div className="bg-[#0c4a6e] text-white p-3 px-6 flex flex-col md:flex-row justify-between items-center shrink-0 shadow-lg z-30 print:hidden gap-3">
        <h2 className="uppercase tracking-[0.2em] text-lg font-black brand-font">ENER PACK INVENTORY</h2>
        <div className="flex flex-wrap items-center justify-center gap-2">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input type="text" placeholder="Search SKU..." className="bg-white text-slate-800 text-xs py-1.5 pl-9 pr-4 rounded-lg w-40 md:w-64 outline-none font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
           </div>
           <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-[11px] font-black uppercase transition-all"><FileDown className="w-3.5 h-3.5" /> XLSX</button>
           <button onClick={handleSavePDF} className="flex items-center gap-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 rounded-lg text-[11px] font-black uppercase transition-all"><FileText className="w-3.5 h-3.5" /> PDF</button>
           {isAdmin && (
             <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-black bg-emerald-600 hover:bg-emerald-700 text-white transition-all"><Plus className="w-3.5 h-3.5" /> NEW SKU</button>
           )}
        </div>
      </div>

      {isAdding && isAdmin && (
        <div className="bg-[#f0f9ff] p-4 px-6 border-b flex flex-wrap gap-4 items-end animate-in slide-in-from-top-4 duration-300 shadow-inner print:hidden">
           <div><label className="block text-[11px] font-black text-slate-500 uppercase mb-1">Size</label><input className="bg-white border p-2 rounded-xl text-sm font-bold w-40" value={newItem.size} onChange={e => setNewItem({...newItem, size: e.target.value})} /></div>
           <div><label className="block text-[11px] font-black text-slate-500 uppercase mb-1">GSM</label>
             <select className="bg-white border p-2 rounded-xl text-sm font-bold w-32" value={newItem.gsm} onChange={e => setNewItem({...newItem, gsm: e.target.value})}>
               {["280", "250", "230", "200", "150", "140GYT", "130", "100"].map(g => <option key={g} value={g}>{g}</option>)}
             </select>
           </div>
           <div><label className="block text-[11px] font-black text-slate-500 uppercase mb-1">Initial Stock</label><input type="number" className="bg-white border p-2 rounded-xl text-sm font-bold w-32" value={newItem.closingStock} onChange={e => setNewItem({...newItem, closingStock: Number(e.target.value)})} /></div>
           <button onClick={handleAddItem} className="bg-[#0284c7] hover:bg-[#0369a1] text-white h-[40px] px-8 rounded-xl font-black text-xs uppercase shadow-lg flex items-center gap-2">Add Item</button>
        </div>
      )}

      <div ref={tableContainerRef} className="flex-1 overflow-auto p-4 space-y-6 bg-[#f1f5f9] scrollbar-hide print:p-0 print:space-y-0 print:overflow-visible">
        {GSM_GROUPS.map((group) => {
          const { left, right } = getSubTableConfig(group);
          // Calculate total visual rows (items + section label rows)
          const leftRowTotal = left.reduce((acc, s) => acc + s.items.length + 1, 0);
          const rightRowTotal = right.reduce((acc, s) => acc + s.items.length + 1, 0);
          const maxRows = Math.max(leftRowTotal, rightRowTotal);

          return (
            <div key={group.label} className="bg-white border border-slate-300 shadow-sm print:border-black overflow-hidden gsm-section-container mb-6 print:mb-0">
              <div className="bg-[#f1f5f9] border-b border-slate-300 h-10 flex items-center justify-center text-center text-slate-800 font-black uppercase tracking-[0.2em] text-[11px] print:bg-slate-200 print:border-black shrink-0">
                 {group.label} GSM SECTION
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-300 print:grid-cols-2 print:divide-x print:divide-black">
                <InventorySubTable sections={left} targetCount={maxRows} onModal={setModalOpen} onEdit={setEditItem} onDelete={onDeleteItem} isAdmin={isAdmin} />
                <InventorySubTable sections={right} targetCount={maxRows} onModal={setModalOpen} onEdit={setEditItem} onDelete={onDeleteItem} isAdmin={isAdmin} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const InventorySubTable = ({ sections, targetCount, onModal, onEdit, onDelete, isAdmin }: any) => {
  let rowCount = 0;
  return (
    <div className="overflow-x-auto mobile-bottom-scroll">
      <table className="w-full text-center border-collapse table-fixed min-w-[500px] lg:min-w-0">
        <thead className="bg-[#f8fafc] text-slate-500 font-black uppercase text-[8px] border-b border-slate-300 print:border-black shrink-0">
          <tr className="h-8">
            <th className={`${COL_WIDTHS.size} border-r border-slate-300 print:border-black`}>SIZE</th>
            <th className={`${COL_WIDTHS.gsm} border-r border-slate-300 print:border-black`}>GSM</th>
            <th className={`${COL_WIDTHS.stock} border-r border-slate-300 print:border-black`}>STOCK</th>
            <th className={`${COL_WIDTHS.action} border-r border-slate-300 print:border-black print:hidden`}>ACTION</th>
            <th className={`${COL_WIDTHS.remarks}`}>REMARKS</th>
          </tr>
        </thead>
        <tbody>
          {sections.map((sec: any, sIdx: number) => {
            const fragment = [];
            
            // Sub-header Row - Merged and Center Aligned
            rowCount++;
            fragment.push(
              <tr key={`header-${sec.label}-${sIdx}`} className="bg-slate-50 border-b border-slate-300 print:border-black h-8">
                <td colSpan={5} className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center align-middle">
                   {sec.label}
                </td>
              </tr>
            );

            // Data Rows
            sec.items.forEach((item: InventoryItem) => {
              rowCount++;
              const isLow = item.closingStock < (item.minStock || 0);
              fragment.push(
                <tr key={item.id} className={`h-8 border-b border-slate-300 print:border-black font-black hover:bg-blue-50/50 ${isLow ? 'bg-rose-50' : ''}`}>
                  <td className="border-r border-slate-300 print:border-black text-[11px] text-slate-900">{item.size}</td>
                  <td className="border-r border-slate-300 print:border-black text-[10px] text-slate-400">{item.gsm}</td>
                  <td className={`border-r border-slate-300 print:border-black text-[12px] tabular-nums ${isLow ? 'text-rose-600' : 'text-[#1e40af]'}`}>
                    <div className="flex items-center justify-center gap-1">
                      {item.closingStock}
                      {isLow && <AlertTriangle className="w-3 h-3 text-rose-500 animate-pulse" />}
                    </div>
                  </td>
                  <td className="border-r border-slate-300 print:border-black px-1 print:hidden">
                    <div className="flex justify-center gap-1">
                      {isAdmin ? (
                        <>
                          <button onClick={() => onModal({type: 'IN', item})} className="w-6 h-6 flex items-center justify-center rounded bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all"><Plus className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onModal({type: 'OUT', item})} className="w-6 h-6 flex items-center justify-center rounded bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white transition-all"><Minus className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onEdit(item)} className="w-6 h-6 flex items-center justify-center rounded bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onDelete(item)} className="w-6 h-6 flex items-center justify-center rounded bg-slate-50 text-slate-400 border border-slate-200 hover:bg-rose-600 hover:text-white transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                        </>
                      ) : <Lock className="w-3.5 h-3.5 text-slate-200" />}
                    </div>
                  </td>
                  <td className="text-[9px] text-slate-400 px-2 text-left italic truncate">{item.remarks}</td>
                </tr>
              );
            });
            
            return fragment;
          })}

          {/* Alignment Padding Rows to ensure Left and Right tables have equal height */}
          {Array.from({ length: Math.max(0, targetCount - rowCount) }).map((_, i) => (
            <tr key={`fill-${i}`} className="h-8 border-b border-slate-300 print:border-black">
              <td className="border-r border-slate-300 print:border-black"></td>
              <td className="border-r border-slate-300 print:border-black"></td>
              <td className="border-r border-slate-300 print:border-black"></td>
              <td className="border-r border-slate-300 print:border-black print:hidden"></td>
              <td></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;