
import React, { useState } from 'react';
import { InventoryItem, StockTransaction } from '../types';
import { Plus, Minus, Search, Save, Download, Upload, Pencil, Printer, Lock, ChevronDown, ChevronRight, List, Layers } from 'lucide-react';
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
  isAdmin: boolean;
}

const SECTION_ORDER = ["280", "250", "230", "200", "150", "140", "140GYT", "130", "130GYT", "100", "GYT"];

const InventoryTable: React.FC<InventoryTableProps> = ({ items, transactions, onUpdateStock, onAddItem, onRecordTransaction, onBulkUpdate, onUpdateItem, isAdmin }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [modalOpen, setModalOpen] = useState<{type: 'IN' | 'OUT', item: InventoryItem} | null>(null);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  
  const [newItem, setNewItem] = useState<Omit<InventoryItem, 'id'>>({
    size: '',
    gsm: '280',
    closingStock: 0,
    minStock: 0,
    remarks: ''
  });

  // --- Filtering Logic (Exact Match + Next 3 Larger Sizes) ---
  const getFilteredItems = () => {
    const term = searchTerm.trim();
    if (!term) return items;

    // Check if search term is a number (e.g., "54")
    const searchNum = parseFloat(term);
    const isNumericSearch = !isNaN(searchNum);

    if (isNumericSearch) {
        // Numeric Search: Find exact match and "next" sizes (>= search term)
        const candidates = items
            .map(item => {
                const match = item.size.match(/(\d+(\.\d+)?)/);
                const itemNum = match ? parseFloat(match[0]) : NaN;
                
                if (isNaN(itemNum)) return null;
                if (itemNum < searchNum) return null;

                const diff = itemNum - searchNum;
                const exactStr = item.size === term;
                
                return { ...item, diff, exactStr };
            })
            .filter((item): item is (InventoryItem & { diff: number, exactStr: boolean }) => item !== null);

        candidates.sort((a, b) => {
            if (a.exactStr && !b.exactStr) return -1;
            if (!a.exactStr && b.exactStr) return 1;
            return a.diff - b.diff;
        });

        return candidates.slice(0, 3);
    } 
    
    return items.filter(item => 
        item.size.toLowerCase().includes(term.toLowerCase()) ||
        item.gsm.toString().toLowerCase().includes(term.toLowerCase())
    );
  };

  const filteredItems = getFilteredItems();

  const handleAddItem = () => {
    if (!newItem.size || !newItem.gsm) return;
    onAddItem(newItem);
    setNewItem({ size: '', gsm: '280', closingStock: 0, minStock: 0, remarks: '' });
    setIsAdding(false);
  };

  const handleTransactionConfirm = (t: Omit<StockTransaction, 'id' | 'timestamp'>) => {
      onRecordTransaction(t);
      const delta = t.type === 'IN' ? t.quantity : -t.quantity;
      onUpdateStock(t.itemId, delta);
      setModalOpen(null);
  };

  const handleOpenModal = (type: 'IN' | 'OUT', item: InventoryItem) => {
    setModalOpen({ type, item });
  };

  const handleEditItem = (item: InventoryItem) => {
      setEditItem(item);
  };

  const handleSaveItem = (updatedItem: InventoryItem) => {
      onUpdateItem(updatedItem);
      setEditItem(null);
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) {
        alert("Admin Access Required to Import");
        return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    if (typeof (window as any).XLSX === 'undefined') {
        alert("Excel library not loaded. Please refresh the page.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const bstr = evt.target?.result;
            const wb = (window as any).XLSX.read(bstr, {type:'binary'});
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = (window as any).XLSX.utils.sheet_to_json(ws);
            
            if (data.length === 0) {
                alert("Excel file appears empty.");
                return;
            }

            const getVal = (row: any, keys: string[]) => {
                const foundKey = Object.keys(row).find(k => keys.includes(k.toLowerCase()));
                return foundKey ? row[foundKey] : undefined;
            };

            const parsedItems: InventoryItem[] = data.map((row: any) => {
                const size = getVal(row, ['size', 'item size']) || 'Unknown';
                const gsm = getVal(row, ['gsm', 'weight']) || '280';
                const stock = getVal(row, ['stock', 'closingstock', 'qty', 'quantity']) || 0;
                const min = getVal(row, ['min', 'minqty', 'minstock', 'alert']) || 0;
                const remarks = getVal(row, ['remarks', 'note', 'notes']) || '';

                return {
                    id: crypto.randomUUID(),
                    size: String(size),
                    gsm: String(gsm),
                    closingStock: Number(stock),
                    minStock: Number(min),
                    remarks: String(remarks)
                };
            });
            
            if (confirm(`Ready to import ${parsedItems.length} items. This will replace the current inventory list. Continue?`)) {
                onBulkUpdate(parsedItems);
                alert("Inventory imported successfully!");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to parse Excel file. Please check format.");
        }
    };
    reader.readAsBinaryString(file);
    e.target.value = ""; // reset
  };

  const handleExcelExport = () => {
      if (typeof (window as any).XLSX === 'undefined') {
        alert("Excel library not loaded. Please refresh the page.");
        return;
      }
      const wb = (window as any).XLSX.utils.book_new();
      const ws = (window as any).XLSX.utils.json_to_sheet(items.map(i => ({
          SIZE: i.size,
          GSM: i.gsm,
          STOCK: i.closingStock,
          MIN_QTY: i.minStock,
          REMARKS: i.remarks
      })));
      (window as any).XLSX.utils.book_append_sheet(wb, ws, "Inventory");
      (window as any).XLSX.writeFile(wb, `Enerpack_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Data Organization ---

  // 1. Group and Sort Data
  const organizedData: Record<string, { single: InventoryItem[], double: InventoryItem[] }> = {};
  SECTION_ORDER.forEach(sec => {
      organizedData[sec] = { single: [], double: [] };
  });

  filteredItems.forEach(item => {
      let sectionKey = item.gsm.toString();
      if (!organizedData[sectionKey]) {
          organizedData[sectionKey] = { single: [], double: [] };
      }
      const isDouble = /[*xX]/.test(item.size);
      if (isDouble) {
          organizedData[sectionKey].double.push(item);
      } else {
          organizedData[sectionKey].single.push(item);
      }
  });

  const sortSizes = (a: InventoryItem, b: InventoryItem) => {
      const numA = parseFloat(a.size.match(/\d+(\.\d+)?/)?.[0] || "0");
      const numB = parseFloat(b.size.match(/\d+(\.\d+)?/)?.[0] || "0");
      if (numA !== numB) return numA - numB;
      return a.size.localeCompare(b.size);
  };

  // Sort in place
  Object.keys(organizedData).forEach(key => {
      organizedData[key].single.sort(sortSizes);
      organizedData[key].double.sort(sortSizes);
  });

  const activeKeys = [...new Set([...SECTION_ORDER, ...Object.keys(organizedData)])]
    .filter(k => organizedData[k] && (organizedData[k].single.length > 0 || organizedData[k].double.length > 0));

  // 2. Create Balanced Data for Desktop View (Side-by-Side)
  // We clone organizedData because we modify it for visual balancing on desktop
  const desktopData: Record<string, { single: InventoryItem[], double: InventoryItem[] }> = JSON.parse(JSON.stringify(organizedData));
  
  activeKeys.forEach(gsmKey => {
      const section = desktopData[gsmKey];
      const totalItems = section.single.length + section.double.length;
      const targetPerColumn = Math.ceil(totalItems / 2);
      
      if (section.double.length > targetPerColumn) {
          const moveCount = section.double.length - targetPerColumn;
          const itemsToMove = section.double.splice(0, moveCount);
          if (itemsToMove.length > 0) {
                // Add Heading Separator for the moved items
                section.single.push({
                    id: `sep-${gsmKey}`,
                    size: 'DOUBLE SIZE',
                    gsm: gsmKey,
                    closingStock: 0,
                    minStock: 0,
                    remarks: '',
                    // @ts-ignore
                    isHeader: true
                } as any);
                section.single.push(...itemsToMove);
          }
      }
  });

  // --- Rendering Helpers ---

  const renderCells = (item: InventoryItem, isRightBorder: boolean) => {
    // Check for custom header flag (injected during render preparation)
    if ((item as any).isHeader) {
        return (
            <td colSpan={5} className={`px-2 py-1 text-center font-black bg-gray-100 text-gray-700 text-[10px] md:text-xs border-y border-gray-300 print:bg-gray-300 print:border-black print:text-black uppercase tracking-wider ${isRightBorder ? 'border-r border-gray-300' : ''}`}>
                {(item as any).size}
            </td>
        );
    }

    const isLowStock = item.closingStock < (item.minStock || 0);
    const cellClass = `px-2 py-2 print:py-0.5 print:px-1 whitespace-nowrap ${isLowStock ? 'bg-red-50' : ''} ${isRightBorder ? 'border-r border-gray-300' : ''}`;
    
    return (
        <>
            <td className={`${cellClass} font-bold text-gray-800 text-center`}>{item.size}</td>
            <td className={`${cellClass} text-center`}>{item.gsm}</td>
            <td className={`${cellClass} text-center font-bold ${isLowStock ? 'text-red-600 animate-pulse print:animate-none' : 'text-blue-900'}`}>
                {item.closingStock}
            </td>
            <td className={`${cellClass} flex justify-center gap-1 items-center print:hidden`}>
                {isAdmin ? (
                    <>
                        <button onClick={() => handleOpenModal('IN', item)} className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-600 hover:text-white transition-colors" title="Stock In">
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleOpenModal('OUT', item)} className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-600 hover:text-white transition-colors" title="Stock Out">
                            <Minus className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
                        <button onClick={() => handleEditItem(item)} className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-blue-600 hover:text-white transition-colors" title="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                    </>
                ) : (
                    <Lock className="w-4 h-4 text-gray-300" />
                )}
            </td>
            <td className={`${cellClass} text-xs text-gray-500 truncate max-w-[150px] print:max-w-none print:whitespace-normal`}>{item.remarks}</td>
        </>
    );
  };

  const renderEmptyCells = (isRightBorder: boolean) => (
      <>
          <td className={`px-2 py-2 print:py-0.5 ${isRightBorder ? 'border-r border-gray-300' : ''} print:border-none`}></td>
          <td className={`px-2 py-2 print:py-0.5 ${isRightBorder ? 'border-r border-gray-300' : ''} print:border-none`}></td>
          <td className={`px-2 py-2 print:py-0.5 ${isRightBorder ? 'border-r border-gray-300' : ''} print:border-none`}></td>
          <td className={`px-2 py-2 print:py-0.5 ${isRightBorder ? 'border-r border-gray-300' : ''} print:hidden print:border-none`}></td>
          <td className={`px-2 py-2 print:py-0.5 ${isRightBorder ? 'border-r border-gray-300' : ''} print:border-none`}></td>
      </>
  );

  // Render Mobile Specific Vertical Tables
  const renderMobileTableSection = (sectionItems: InventoryItem[], title: string, gsmKey: string) => {
    if (sectionItems.length === 0) return null;
    return (
        <div className="mb-0">
             <div className="bg-slate-100 text-slate-700 text-xs font-bold uppercase px-4 py-2 border-y border-slate-200 tracking-wider flex items-center justify-center gap-2 text-center">
                 {title === 'Single Sizes' ? <List className="w-3 h-3"/> : <Layers className="w-3 h-3"/>}
                 {title}
             </div>
             <table className="w-full text-sm">
                 <thead className="bg-white border-b border-gray-200">
                     <tr>
                         <th className="px-2 py-2 text-center text-xs text-gray-500 font-bold border-r border-gray-100">Size</th>
                         <th className="px-2 py-2 text-center text-xs text-gray-500 font-bold border-r border-gray-100 w-16">GSM</th>
                         <th className="px-2 py-2 text-center text-xs text-gray-500 font-bold">Stock</th>
                         <th className="px-2 py-2 text-center text-xs text-gray-500 font-bold w-24">Action</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-300">
                     {sectionItems.map((item, idx) => {
                         const isLowStock = item.closingStock < (item.minStock || 0);
                         return (
                             <tr key={item.id} className={isLowStock ? 'bg-red-50' : 'bg-white'}>
                                 <td className="px-2 py-3 font-bold text-gray-800 text-center border-r border-gray-100">{item.size}</td>
                                 <td className="px-2 py-3 text-center text-gray-600 border-r border-gray-100">{item.gsm}</td>
                                 <td className={`px-2 py-3 text-center font-bold ${isLowStock ? 'text-red-600' : 'text-blue-900'}`}>{item.closingStock}</td>
                                 <td className="px-2 py-3">
                                      <div className="flex justify-center gap-1 items-center">
                                          {isAdmin ? (
                                            <>
                                                <button onClick={() => handleOpenModal('IN', item)} className="p-2 bg-green-50 text-green-700 rounded-lg shadow-sm border border-green-100 active:scale-95"><Plus className="w-4 h-4"/></button>
                                                <button onClick={() => handleOpenModal('OUT', item)} className="p-2 bg-red-50 text-red-700 rounded-lg shadow-sm border border-red-100 active:scale-95"><Minus className="w-4 h-4"/></button>
                                            </>
                                          ) : <Lock className="w-4 h-4 text-gray-300 mx-auto"/>}
                                      </div>
                                 </td>
                             </tr>
                         )
                     })}
                 </tbody>
             </table>
        </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full relative print:shadow-none print:h-auto print:overflow-visible">
      {/* Modals */}
      {modalOpen && (
          <StockOperationModal 
            type={modalOpen.type} 
            item={modalOpen.item} 
            transactions={transactions}
            onClose={() => setModalOpen(null)} 
            onConfirm={handleTransactionConfirm} 
          />
      )}
      
      {editItem && (
          <ItemEditModal 
             item={editItem}
             onClose={() => setEditItem(null)}
             onSave={handleSaveItem}
          />
      )}

      {/* Header / Controls */}
      <div className="bg-enerpack-800 text-white sticky top-0 z-20 shadow-md print:hidden flex flex-col md:flex-row items-center justify-between p-3 gap-3 md:gap-0">
         
         {/* Top Row: Title + Mobile Actions */}
         <div className="flex justify-between items-center w-full md:w-auto">
            <h2 className="text-base md:text-lg font-bold tracking-wide flex items-center gap-2">
                ENERPACK INVENTORY
                {!isAdmin && <span className="text-[10px] bg-enerpack-600 px-2 py-0.5 rounded-full text-white/80">READ ONLY</span>}
            </h2>
            
            {/* Mobile Only: Add New Button Compact */}
            <div className="md:hidden flex gap-2">
                 {isAdmin && (
                    <button onClick={() => setIsAdding(!isAdding)} className="bg-green-600 p-2 rounded-lg shadow text-white">
                        <Plus className="w-5 h-5" />
                    </button>
                 )}
            </div>
         </div>

         {/* Bottom Row: Search & Tools */}
         <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto items-center">
             
             {/* Search Bar - Full Width on Mobile with Search Type */}
             <div className="relative w-full md:w-auto group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-enerpack-500" />
                <input 
                  type="search" 
                  placeholder="Search Size..." 
                  className="pl-9 pr-4 py-2 rounded-lg text-black text-sm w-full md:w-48 focus:outline-none focus:ring-2 focus:ring-enerpack-400 shadow-sm transition-all bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>

             {/* Desktop Tools Row */}
             <div className="flex gap-2 w-full md:w-auto justify-end">
                  <div className="hidden md:flex gap-1">
                      {isAdmin && (
                        <label className="cursor-pointer bg-blue-700 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-xs flex items-center gap-1 font-bold shadow-sm transition-colors">
                            <Upload className="w-3.5 h-3.5" /> Import
                            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleExcelImport} />
                        </label>
                      )}
                      <button onClick={handleExcelExport} className="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-xs flex items-center gap-1 font-bold shadow-sm transition-colors">
                          <Download className="w-3.5 h-3.5" /> Export
                      </button>
                      <button onClick={handlePrint} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs flex items-center gap-1 font-bold shadow-sm transition-colors ml-1">
                          <Printer className="w-3.5 h-3.5" /> Print
                      </button>
                   </div>
                   
                   {/* Desktop Add New */}
                   {isAdmin && (
                       <button 
                        onClick={() => setIsAdding(!isAdding)}
                        className="hidden md:block bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors whitespace-nowrap"
                       >
                         + New
                       </button>
                   )}
             </div>
         </div>
      </div>

      {/* Print Only Header */}
      <div className="hidden print:block p-2 text-center border-b border-black mb-2">
        <h1 className="text-xl font-black uppercase">Enerpack Inventory Report</h1>
        <p className="text-xs text-gray-600">{new Date().toLocaleDateString()} - Stock Summary</p>
      </div>

      {/* Add Item Form */}
      {isAdding && isAdmin && (
        <div className="bg-enerpack-50 p-3 border-b border-enerpack-200 grid grid-cols-2 md:grid-cols-6 gap-2 items-end print:hidden animate-in slide-in-from-top-2">
          <div className="col-span-1">
            <label className="text-xs font-bold text-gray-600">Size</label>
            <input type="text" className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-enerpack-500 outline-none" value={newItem.size} onChange={e => setNewItem({...newItem, size: e.target.value})} />
          </div>
          <div className="col-span-1">
            <label className="text-xs font-bold text-gray-600">GSM</label>
             <select 
                className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-enerpack-500 outline-none"
                value={newItem.gsm}
                onChange={e => setNewItem({...newItem, gsm: e.target.value})}
             >
                 {SECTION_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                 <option value="Other">Other</option>
             </select>
          </div>
          <div className="col-span-1">
            <label className="text-xs font-bold text-gray-600">Min Qty</label>
            <input type="number" className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-enerpack-500 outline-none" value={newItem.minStock} onChange={e => setNewItem({...newItem, minStock: Number(e.target.value)})} />
          </div>
          <div className="col-span-1">
            <label className="text-xs font-bold text-gray-600">Initial Stock</label>
            <input type="number" className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-enerpack-500 outline-none" value={newItem.closingStock} onChange={e => setNewItem({...newItem, closingStock: Number(e.target.value)})} />
          </div>
          <div className="col-span-2 md:col-span-1">
             <label className="text-xs font-bold text-gray-600">Remarks</label>
             <input type="text" className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-enerpack-500 outline-none" value={newItem.remarks} onChange={e => setNewItem({...newItem, remarks: e.target.value})} />
          </div>
          <button onClick={handleAddItem} className="col-span-2 md:col-span-1 bg-enerpack-600 text-white p-2 rounded h-[38px] flex items-center justify-center hover:bg-enerpack-700 text-sm font-bold shadow-sm">
            <Save className="w-4 h-4 mr-1" /> Add
          </button>
        </div>
      )}

      {/* Main Table Content */}
      <div className="flex-1 overflow-auto bg-gray-100 p-2 md:p-4 space-y-4 md:space-y-6 print:overflow-visible print:bg-white print:p-0">
        
        {activeKeys.map(gsmKey => {
            // DESKTOP DATA (Balanced)
            const section = desktopData[gsmKey];
            const hasSingle = section.single.length > 0;
            const hasDouble = section.double.length > 0;
            const maxRows = Math.max(section.single.length, section.double.length);

            // MOBILE DATA (Raw)
            const mobileSection = organizedData[gsmKey];

            return (
                <div key={gsmKey} className="bg-white border rounded-md shadow-sm overflow-hidden mb-4 md:mb-8 print:shadow-none print:border-black print:mb-2 print:break-inside-auto">
                     <div className="bg-slate-200 text-slate-800 px-3 md:px-4 py-2 font-black text-center text-sm md:text-lg border-b border-slate-300 print:bg-gray-200 print:border-black print:text-black print:py-1 print:text-sm sticky top-0 md:static z-10">
                        {gsmKey} GSM SECTION
                     </div>
                     
                     {/* --- MOBILE VIEW: VERTICAL STACKED --- */}
                     <div className="block md:hidden">
                        {renderMobileTableSection(mobileSection.single, "Single Sizes", gsmKey)}
                        {renderMobileTableSection(mobileSection.double, "Double Sizes", gsmKey)}
                        {mobileSection.single.length === 0 && mobileSection.double.length === 0 && (
                            <div className="p-4 text-center text-gray-400 text-xs italic">- Empty -</div>
                        )}
                     </div>

                     {/* --- DESKTOP VIEW: SIDE BY SIDE --- */}
                     <div className="hidden md:block overflow-x-auto print:block print:overflow-visible">
                       <table className="w-full border-collapse">
                          <thead>
                             <tr>
                               {hasSingle && (
                                 <th colSpan={5} className={`w-1/2 bg-gray-50 px-3 py-1 text-xs font-bold text-center text-gray-500 uppercase tracking-wider border-b print:bg-gray-100 print:text-black print:border-black ${hasDouble ? 'border-r border-gray-300' : ''}`}>Single Sizes</th>
                               )}
                               {hasDouble && (
                                 <th colSpan={5} className="w-1/2 bg-gray-50 px-3 py-1 text-xs font-bold text-center text-gray-500 uppercase tracking-wider border-b print:bg-gray-100 print:text-black print:border-black">Double Sizes</th>
                               )}
                             </tr>
                             <tr className="bg-gray-100 text-xs text-gray-500 border-b print:bg-gray-50 print:text-black print:border-black">
                                {hasSingle && (
                                  <>
                                    <th className="px-2 py-1 text-center whitespace-nowrap print:px-1">Size</th>
                                    <th className="px-2 py-1 text-center whitespace-nowrap print:px-1">GSM</th>
                                    <th className="px-2 py-1 text-center whitespace-nowrap print:px-1">Stock</th>
                                    <th className="px-2 py-1 text-center whitespace-nowrap print:hidden">Action</th>
                                    <th className={`px-2 py-1 whitespace-nowrap print:px-1 ${hasDouble ? 'border-r border-gray-300' : ''}`}>Remarks</th>
                                  </>
                                )}
                                {hasDouble && (
                                  <>
                                    <th className="px-2 py-1 text-center whitespace-nowrap print:px-1">Size</th>
                                    <th className="px-2 py-1 text-center whitespace-nowrap print:px-1">GSM</th>
                                    <th className="px-2 py-1 text-center whitespace-nowrap print:px-1">Stock</th>
                                    <th className="px-2 py-1 text-center whitespace-nowrap print:hidden">Action</th>
                                    <th className="px-2 py-1 whitespace-nowrap print:px-1">Remarks</th>
                                  </>
                                )}
                             </tr>
                          </thead>
                          <tbody className="text-sm print:text-[10px] print:leading-tight">
                             {Array.from({ length: maxRows }).map((_, idx) => {
                                 const sItem = section.single[idx];
                                 const dItem = section.double[idx];
                                 return (
                                     <tr key={idx} className="hover:bg-yellow-50 border-b print:border-gray-300">
                                         {hasSingle && (
                                             sItem ? renderCells(sItem, hasDouble) : renderEmptyCells(hasDouble)
                                         )}
                                         {hasDouble && (
                                             dItem ? renderCells(dItem, false) : renderEmptyCells(false)
                                         )}
                                     </tr>
                                 )
                             })}
                             {maxRows === 0 && <tr><td colSpan={10} className="p-4 text-center text-gray-400 text-xs">- Empty -</td></tr>}
                          </tbody>
                       </table>
                     </div>
                </div>
            );
        })}
      </div>
      
      <div className="bg-gray-800 p-1 text-xs text-center text-gray-400 border-t print:hidden">
        Total Items: {items.length} 
      </div>
    </div>
  );
};

export default InventoryTable;
