import React, { useState, useRef } from 'react';
import { InventoryItem, StockTransaction } from '../types';
import { 
  Plus, 
  Minus, 
  Search, 
  FileDown, 
  Search as SearchIcon, 
  Pencil, 
  X, 
  Save,
  Upload,
  FileText,
  Loader2,
  Lock,
  Clock,
  Trash2
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

const COL_WIDTHS = {
  size: 'w-[15%] size-column',
  gsm: 'w-[10%] gsm-column',
  stock: 'w-[15%] stock-column',
  action: 'w-[22%] action-column',
  remarks: 'w-[38%] remarks-column'
};

const InventoryTable: React.FC<InventoryTableProps> = ({ 
  items, 
  transactions, 
  onUpdateStock, 
  onAddItem, 
  onRecordTransaction, 
  onBulkUpdate,
  onUpdateItem, 
  onDeleteItem,
  isAdmin = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [modalOpen, setModalOpen] = useState<{type: 'IN' | 'OUT', item: InventoryItem} | null>(null);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  const [newItem, setNewItem] = useState<Omit<InventoryItem, 'id'>>({
    size: '', gsm: '280', closingStock: 0, minStock: 0, company: '', remarks: '', category: 'SINGLE'
  });

  const filteredItems = items.filter(item => 
    item.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.gsm.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.company || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = () => {
    if (!newItem.size || !newItem.gsm) return;
    const isDouble = newItem.size.includes('*') || newItem.size.toLowerCase().includes('x');
    const itemToSubmit = {
        ...newItem,
        category: (isDouble ? 'DOUBLE' : 'SINGLE') as any
    };
    onAddItem(itemToSubmit);
    setNewItem({ size: '', gsm: '280', closingStock: 0, minStock: 0, company: '', remarks: '', category: 'SINGLE' });
    setIsAdding(false);
  };

  const handleTransactionConfirm = (t: Omit<StockTransaction, 'id' | 'timestamp'>) => {
      onRecordTransaction(t);
      const delta = t.type === 'IN' ? t.quantity : -t.quantity;
      if (onUpdateStock) onUpdateStock(t.itemId, delta);
      setModalOpen(null);
  };

  const handleExport = () => {
    const wb = (window as any).XLSX.utils.book_new();
    const ws = (window as any).XLSX.utils.json_to_sheet(items.map(i => ({
        SIZE: i.size, GSM: i.gsm, STOCK: i.closingStock, COMPANY: i.company, MIN_QTY: i.minStock, REMARKS: i.remarks
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
      filename: `Ener_Pack_Stock_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 4, 
        useCORS: true, 
        logging: false,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    try {
      await (window as any).html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Table might be too large.");
    } finally {
      element.classList.remove('pdf-export-mode');
      setIsPdfGenerating(false);
    }
  };

  const organizeByGSMGroup = (group: { label: string, values: string[] }) => {
    const sectionItems = filteredItems.filter(i => group.values.includes(i.gsm));
    const sizeSort = (a: InventoryItem, b: InventoryItem) => {
        const valA = parseFloat(a.size);
        const valB = parseFloat(b.size);
        if (isNaN(valA) || isNaN(valB)) return a.size.localeCompare(b.size);
        return valA - valB;
    };

    const findSplit = (arr: InventoryItem[]) => {
      for (let i = 1; i < arr.length; i++) {
        if (arr[i-1].category === 'SINGLE' && arr[i].category !== 'SINGLE') return i;
      }
      return undefined;
    };

    let config = {
      left: [] as InventoryItem[],
      right: [] as InventoryItem[],
      leftHeader: "SINGLE SIZE",
      rightHeader: "DOUBLE SIZE",
      leftSubLabel: "" as string,
      leftSubIndex: undefined as number | undefined,
      rightSubLabel: "" as string,
      rightSubIndex: undefined as number | undefined
    };

    if (group.label === "280" || group.label === "200") {
        const sortedAll = [...sectionItems].sort((a, b) => {
            if (a.category === 'SINGLE' && b.category !== 'SINGLE') return -1;
            if (a.category !== 'SINGLE' && b.category === 'SINGLE') return 1;
            return sizeSort(a, b);
        });
        const mid = Math.ceil(sortedAll.length / 2);
        config.left = sortedAll.slice(0, mid);
        config.right = sortedAll.slice(mid);
        
        config.leftSubIndex = findSplit(config.left);
        config.rightSubIndex = findSplit(config.right);
        config.leftSubLabel = "DOUBLE SIZE";
        config.rightSubLabel = "DOUBLE SIZE";
    } 
    else if (group.label === "250 & 230") {
        const items250 = sectionItems.filter(i => i.gsm === "250").sort(sizeSort);
        const items230Single = sectionItems.filter(i => i.gsm === "230" && i.category === 'SINGLE').sort(sizeSort);
        config.left = [...items250, ...items230Single];
        
        if (items250.length > 0 && items230Single.length > 0) {
            config.leftSubIndex = items250.length;
            config.leftSubLabel = "230 SINGLE";
        }
        config.right = sectionItems.filter(i => i.gsm === "230" && i.category !== 'SINGLE').sort(sizeSort);
    } 
    else if (group.label === "140 GYT, 130") {
        config.left = sectionItems.filter(i => i.gsm === "140GYT").sort((a, b) => {
            if (a.category === 'SINGLE' && b.category !== 'SINGLE') return -1;
            if (a.category !== 'SINGLE' && b.category === 'SINGLE') return 1;
            return sizeSort(a, b);
        });
        config.leftHeader = "140 GYT";
        config.leftSubIndex = findSplit(config.left);
        config.leftSubLabel = "DOUBLE SIZE";

        config.right = sectionItems.filter(i => i.gsm === "130").sort((a, b) => {
            if (a.category === 'SINGLE' && b.category !== 'SINGLE') return -1;
            if (a.category !== 'SINGLE' && b.category === 'SINGLE') return 1;
            return sizeSort(a, b);
        });
        config.rightHeader = "130";
        config.rightSubIndex = findSplit(config.right);
        config.rightSubLabel = "DOUBLE SIZE";
    }
    else if (group.label === "150, 100") {
        config.left = sectionItems.filter(i => i.gsm === "150").sort((a, b) => {
            if (a.category === 'SINGLE' && b.category !== 'SINGLE') return -1;
            if (a.category !== 'SINGLE' && b.category === 'SINGLE') return 1;
            return sizeSort(a, b);
        });
        config.leftHeader = "150";
        config.leftSubIndex = findSplit(config.left);
        config.leftSubLabel = "DOUBLE SIZE";

        config.right = sectionItems.filter(i => i.gsm === "100").sort((a, b) => {
            if (a.category === 'SINGLE' && b.category !== 'SINGLE') return -1;
            if (a.category !== 'SINGLE' && b.category === 'SINGLE') return 1;
            return sizeSort(a, b);
        });
        config.rightHeader = "100";
        config.rightSubIndex = findSplit(config.right);
        config.rightSubLabel = "DOUBLE SIZE";
    }
    else {
        config.left = sectionItems.filter(i => i.category === 'SINGLE').sort(sizeSort);
        config.right = sectionItems.filter(i => i.category !== 'SINGLE').sort(sizeSort);
    }

    return config;
  };

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] print:bg-white relative overflow-hidden print:overflow-visible">
      {modalOpen && <StockOperationModal type={modalOpen.type} item={modalOpen.item} transactions={transactions} onClose={() => setModalOpen(null)} onConfirm={handleTransactionConfirm} />}
      {editItem && <ItemEditModal item={editItem} onClose={() => setEditItem(null)} onSave={(upd) => { onUpdateItem(upd); setEditItem(null); }} />}
      
      {isPdfGenerating && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mb-4" />
          <p className="font-black uppercase tracking-widest text-sm text-center px-6 italic">Aligning Report Columns & Headers...</p>
        </div>
      )}

      <div className="bg-[#0c4a6e] text-white p-3 px-6 flex flex-col md:flex-row justify-between items-center shrink-0 shadow-lg z-30 print:hidden gap-3">
        <h2 className="uppercase tracking-[0.2em] text-lg brand-font text-center md:text-left">ENER PACK INVENTORY</h2>
        <div className="flex flex-wrap items-center justify-center gap-2">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input type="text" placeholder="Search..." className="bg-white text-slate-800 text-xs py-1.5 pl-9 pr-4 rounded-lg w-40 md:w-64 focus:ring-2 focus:ring-blue-400 outline-none font-medium" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
           </div>
           <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-[11px] font-bold uppercase transition-all">
             <FileDown className="w-3.5 h-3.5" /> Export
           </button>
           <button onClick={handleSavePDF} className="flex items-center gap-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 rounded-lg text-white text-[11px] font-bold uppercase transition-all">
             <FileText className="w-3.5 h-3.5" /> PDF
           </button>
           {isAdmin && (
             <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all">
               <Plus className="w-3.5 h-3.5" /> New
             </button>
           )}
        </div>
      </div>

      {isAdding && isAdmin && (
        <div className="bg-[#f0f9ff] p-4 px-6 border-b flex flex-wrap md:flex-nowrap gap-4 items-end animate-in slide-in-from-top-4 duration-300 shadow-inner print:hidden">
           <div className="flex-1 min-w-[140px]">
             <label className="block text-[11px] font-semibold text-slate-600 mb-1 ml-1">Size</label>
             <input className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-400 outline-none shadow-sm" value={newItem.size} onChange={e => setNewItem({...newItem, size: e.target.value})} placeholder="" />
           </div>
           <div className="w-40">
             <label className="block text-[11px] font-semibold text-slate-600 mb-1 ml-1">GSM</label>
             <select className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-sm font-medium outline-none shadow-sm cursor-pointer" value={newItem.gsm} onChange={e => setNewItem({...newItem, gsm: e.target.value})}>
               {["280", "250", "230", "200", "150", "140GYT", "130", "100"].map(g => <option key={g} value={g}>{g}</option>)}
             </select>
           </div>
           <div className="w-32">
             <label className="block text-[11px] font-semibold text-slate-600 mb-1 ml-1">Min Qty</label>
             <input type="number" className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-400 outline-none shadow-sm" value={newItem.minStock} onChange={e => setNewItem({...newItem, minStock: Number(e.target.value)})} />
           </div>
           <div className="w-32">
             <label className="block text-[11px] font-semibold text-slate-600 mb-1 ml-1">Initial Stock</label>
             <input type="number" className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-400 outline-none shadow-sm" value={newItem.closingStock} onChange={e => setNewItem({...newItem, closingStock: Number(e.target.value)})} />
           </div>
           <div className="flex items-center gap-2 pt-4">
             <button type="button" onClick={handleAddItem} className="bg-[#0284c7] hover:bg-[#0369a1] text-white h-[44px] px-10 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2">
               <Plus className="w-4 h-4" /> Add
             </button>
             <button type="button" onClick={() => setIsAdding(false)} className="bg-slate-200/50 h-[44px] w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 transition-all border border-slate-200">
               <X className="w-5 h-5" />
             </button>
           </div>
        </div>
      )}

      <div ref={tableContainerRef} className="flex-1 overflow-auto p-4 space-y-0 bg-[#f1f5f9] scrollbar-hide print:p-0 print:space-y-0 print:overflow-visible">
        {/* PDF Only Header */}
        <div className="hidden print:block report-header-container border-b-[1.5pt] border-black mb-6">
           <div className="date-time-tab">
              {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
           </div>
           <div className="text-center pb-4">
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-widest brand-font">Ener Pack Stock Report</h1>
           </div>
        </div>

        {GSM_GROUPS.map((group, index) => {
          const config = organizeByGSMGroup(group);
          if (config.left.length === 0 && config.right.length === 0) return null;
          
          const leftVisualRows = config.left.length + (config.leftSubIndex !== undefined ? 1 : 0);
          const rightVisualRows = config.right.length + (config.rightSubIndex !== undefined ? 1 : 0);
          const maxRows = Math.max(leftVisualRows, rightVisualRows);

          let style: React.CSSProperties = {};
          if (group.label === "280") style = { breakAfter: 'page' };
          else if (group.label === "200") style = { breakAfter: 'page' };

          return (
            <div 
              key={group.label} 
              className="bg-white gsm-section-container shadow-sm border border-slate-300 print:shadow-none print:border-none print:overflow-visible mb-6 print:mb-0 overflow-hidden"
              style={style}
            >
              <div className="bg-[#f1f5f9] border-b border-slate-300 h-10 flex items-center justify-center text-center text-slate-800 font-extrabold uppercase tracking-[0.2em] text-[11px] print:bg-slate-200 print:border-slate-400 gsm-header">
                 {group.label} GSM SECTION
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-300 print:grid-cols-2 print:divide-x-0 grid-container">
                <div className="flex flex-col overflow-x-auto mobile-bottom-scroll">
                  <div className="bg-[#f8fafc] h-10 flex items-center justify-center text-center text-[8px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-300 print:bg-slate-50 print:border-slate-400 sub-table-header min-w-[500px] lg:min-w-0">
                    {config.leftHeader}
                  </div>
                  <InventorySubTable 
                    items={config.left} 
                    splitIndex={config.leftSubIndex}
                    splitLabel={config.leftSubLabel}
                    targetCount={maxRows}
                    onModal={setModalOpen} 
                    onEdit={setEditItem} 
                    onDelete={onDeleteItem}
                    isAdmin={isAdmin} 
                  />
                </div>

                <div className="flex flex-col overflow-x-auto mobile-bottom-scroll">
                  <div className="bg-[#f8fafc] h-10 flex items-center justify-center text-center text-[8px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-300 print:bg-slate-50 print:border-slate-400 sub-table-header min-w-[500px] lg:min-w-0">
                    {config.rightHeader}
                  </div>
                  <InventorySubTable 
                    items={config.right} 
                    splitIndex={config.rightSubIndex}
                    splitLabel={config.rightSubLabel}
                    targetCount={maxRows}
                    onModal={setModalOpen} 
                    onEdit={setEditItem} 
                    onDelete={onDeleteItem}
                    isAdmin={isAdmin} 
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="bg-[#0c4a6e] text-white p-1 text-[10px] font-bold text-center shrink-0 uppercase tracking-widest opacity-80 print:hidden">
        Ener Pack Operation Intelligence
      </div>
    </div>
  );
};

const InventorySubTable = ({ items, splitIndex, splitLabel, targetCount, onModal, onEdit, onDelete, isAdmin }: any) => {
  const borderColor = "border-slate-300 print:border-black";
  
  const renderedRows: React.ReactNode[] = [];
  items.forEach((item: InventoryItem, idx: number) => {
    if (splitIndex !== undefined && idx === splitIndex) {
      renderedRows.push(
        <tr key={`subheading-split-${idx}`} className="bg-slate-100 print:bg-slate-200 h-[24px] subheading-row">
          <td colSpan={5} className={`p-0 border-b ${borderColor} text-center h-[24px]`}>
            <div className="text-[8px] font-black uppercase text-slate-600 tracking-[0.2em] leading-[24px] h-[24px] flex items-center justify-center">
              {splitLabel}
            </div>
          </td>
        </tr>
      );
    }
    renderedRows.push(
      <tr key={item.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-blue-50/50 transition-colors h-[24px] ${item.isPendingApproval ? 'bg-amber-50/50' : ''}`}>
        <td className={`p-0 border-r ${borderColor} border-b ${borderColor} font-bold text-slate-900 text-[11px] print:text-[10px] ${COL_WIDTHS.size} h-[24px]`}>
          <div className="h-[24px] flex items-center justify-center px-1 relative">
            {item.size}
            {item.isPendingApproval && <span className="absolute left-1 top-1"><Clock className="w-2.5 h-2.5 text-amber-500" /></span>}
          </div>
        </td>
        <td className={`p-0 border-r ${borderColor} border-b ${borderColor} text-slate-500 font-medium text-[10px] print:text-[9px] ${COL_WIDTHS.gsm} h-[24px]`}>
          <div className="h-[24px] flex items-center justify-center px-1">{item.gsm}</div>
        </td>
        <td className={`p-0 border-r ${borderColor} border-b ${borderColor} font-extrabold text-[12px] text-[#1e40af] tabular-nums print:text-[11px] ${COL_WIDTHS.stock} h-[24px]`}>
          <div className="h-[24px] flex items-center justify-center px-1">{item.closingStock}</div>
        </td>
        <td className={`p-0 border-r ${borderColor} border-b ${borderColor} print:p-0 ${COL_WIDTHS.action} h-[24px]`}>
          <div className="h-[24px] flex items-center justify-center px-1 gap-1.5 print:hidden">
            {isAdmin ? (
              <>
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onModal({type: 'IN', item}); }} 
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-colors disabled:opacity-30 shadow-sm active:scale-90" 
                  title="Stock In"
                  disabled={item.isPendingApproval}
                ><Plus className="w-3.5 h-3.5 pointer-events-none" /></button>
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onModal({type: 'OUT', item}); }} 
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-100 transition-colors disabled:opacity-30 shadow-sm active:scale-90" 
                  title="Stock Out"
                  disabled={item.isPendingApproval}
                ><Minus className="w-3.5 h-3.5 pointer-events-none" /></button>
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(item); }} 
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors disabled:opacity-30 shadow-sm active:scale-90" 
                  title="Edit Item"
                  disabled={item.isPendingApproval}
                ><Pencil className="w-3.5 h-3.5 pointer-events-none" /></button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(item); }}
                  className="p-1 bg-white border border-slate-200 rounded-full text-rose-500 shadow-md z-10 hover:bg-rose-50 transition-all disabled:opacity-30 active:scale-90"
                  title="Delete"
                  disabled={item.isPendingApproval}
                >
                  <Trash2 className="w-4 h-4 pointer-events-none" />
                </button>
              </>
            ) : (
              <Lock className="w-3.5 h-3.5 text-slate-300" />
            )}
          </div>
        </td>
        <td className={`p-0 border-b ${borderColor} text-[9px] text-slate-400 font-medium text-left truncate px-2 italic leading-tight ${COL_WIDTHS.remarks} h-[24px]`}>
          <div className="h-[24px] flex items-center truncate italic">{item.remarks || ""}</div>
        </td>
      </tr>
    );
  });

  const paddingNeeded = targetCount - renderedRows.length;
  for (let p = 0; p < paddingNeeded; p++) {
    renderedRows.push(
      <tr key={`padding-row-${p}`} className="h-[24px] bg-white">
        <td className={`p-0 border-r ${borderColor} border-b ${borderColor} ${COL_WIDTHS.size} h-[24px]`}></td>
        <td className={`p-0 border-r ${borderColor} border-b ${borderColor} ${COL_WIDTHS.gsm} h-[24px]`}></td>
        <td className={`p-0 border-r ${borderColor} border-b ${borderColor} ${COL_WIDTHS.stock} h-[24px]`}></td>
        <td className={`p-0 border-r ${borderColor} border-b ${borderColor} ${COL_WIDTHS.action} h-[24px]`}></td>
        <td className={`p-0 border-b ${borderColor} ${COL_WIDTHS.remarks} h-[24px]`}></td>
      </tr>
    );
  }

  return (
    <table className="w-full text-xs text-center border-collapse table-fixed min-w-[500px] lg:min-w-0">
      <thead className="bg-[#f1f5f9] text-slate-500 font-bold uppercase text-[7px] border-b border-slate-300 print:bg-slate-50 print:border-black">
        <tr className="h-[24px]">
          <th className={`p-0 border-r ${borderColor} ${COL_WIDTHS.size} h-[24px]`}><div className="h-[24px] flex items-center justify-center">Size</div></th>
          <th className={`p-0 border-r ${borderColor} ${COL_WIDTHS.gsm} h-[24px]`}><div className="h-[24px] flex items-center justify-center">GSM</div></th>
          <th className={`p-0 border-r ${borderColor} ${COL_WIDTHS.stock} h-[24px]`}><div className="h-[24px] flex items-center justify-center">Stock</div></th>
          <th className={`p-0 border-r ${borderColor} ${COL_WIDTHS.action} h-[24px]`}><div className="h-[24px] flex items-center justify-center">Action</div></th>
          <th className={`p-0 ${COL_WIDTHS.remarks} h-[24px]`}><div className="h-[24px] flex items-center justify-center">Remarks</div></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-300 print:divide-black">
        {renderedRows}
      </tbody>
    </table>
  );
};

export default InventoryTable;