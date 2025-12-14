
import React, { useState } from 'react';
import { InventoryItem, StockTransaction } from '../types';
import { Plus, Minus, Search, Save, Download, Upload, Pencil, Printer, Lock } from 'lucide-react';
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

const SECTION_ORDER = ["280", "200", "150", "140", "GYT"];

interface InventoryRowProps {
  item: InventoryItem;
  onOpenModal: (type: 'IN' | 'OUT', item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  isAdmin: boolean;
}

const InventoryRow: React.FC<InventoryRowProps> = ({ item, onOpenModal, onEditItem, isAdmin }) => {
  const isLowStock = item.closingStock < (item.minStock || 0);

  return (
    <tr className={`border-b border-gray-200 hover:bg-yellow-50 text-sm ${isLowStock ? 'bg-red-50' : ''} print:border-gray-300`}>
      <td className="px-2 py-2 font-bold text-gray-800 border-r print:border-gray-400 whitespace-nowrap">{item.size}</td>
      <td className="px-2 py-2 text-center border-r print:border-gray-400 whitespace-nowrap">{item.gsm}</td>
      {/* Min Stock column hidden as requested */}
      <td className={`px-2 py-2 text-center font-bold border-r print:border-gray-400 whitespace-nowrap ${isLowStock ? 'text-red-600 text-base animate-pulse print:animate-none' : 'text-blue-900'}`}>
        {item.closingStock}
      </td>
      <td className="px-2 py-2 flex justify-center gap-1 border-r print:hidden items-center whitespace-nowrap">
        {isAdmin ? (
            <>
                <button 
                onClick={() => onOpenModal('IN', item)}
                className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-600 hover:text-white transition-colors"
                title="Stock In"
                >
                <Plus className="w-3.5 h-3.5" />
                </button>
                <button 
                onClick={() => onOpenModal('OUT', item)}
                className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-600 hover:text-white transition-colors"
                title="Stock Out"
                >
                <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
                <button 
                onClick={() => onEditItem(item)}
                className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-blue-600 hover:text-white transition-colors"
                title="Edit Item / Set Min Qty"
                >
                    <Pencil className="w-3.5 h-3.5" />
                </button>
            </>
        ) : (
            <Lock className="w-4 h-4 text-gray-300" />
        )}
      </td>
      <td className="px-2 py-2 text-xs text-gray-500 truncate max-w-[150px] print:max-w-none print:whitespace-normal">{item.remarks}</td>
    </tr>
  );
};

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

  const filteredItems = items.filter(item => 
    item.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.gsm.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        const bstr = evt.target?.result;
        const wb = (window as any).XLSX.read(bstr, {type:'binary'});
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = (window as any).XLSX.utils.sheet_to_json(ws);
        
        // Assume format: SIZE, GSM, STOCK, REMARKS, MIN_QTY
        const parsedItems: InventoryItem[] = data.map((row: any) => ({
            id: crypto.randomUUID(),
            size: row.SIZE || row.Size || row.size || 'Unknown',
            gsm: (row.GSM || row.Gsm || row.gsm || '0').toString(),
            closingStock: Number(row.STOCK || row.Stock || row.ClosingStock || 0),
            minStock: Number(row.MIN_QTY || row.MinQty || row.minStock || 0),
            remarks: row.REMARKS || row.Remarks || ''
        }));
        
        if (confirm(`Import ${parsedItems.length} items? This will replace current inventory.`)) {
            onBulkUpdate(parsedItems);
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

  // Organize Data into Sections and Split Layout
  const organizedData: Record<string, { single: InventoryItem[], double: InventoryItem[] }> = {};
  
  // Initialize standard sections
  SECTION_ORDER.forEach(sec => {
      organizedData[sec] = { single: [], double: [] };
  });

  // Group items
  filteredItems.forEach(item => {
      let sectionKey = item.gsm.toString();
      if (!organizedData[sectionKey]) {
          organizedData[sectionKey] = { single: [], double: [] };
      }

      // Detect Single vs Double (Double contains '*' or 'x' or 'X')
      const isDouble = /[*xX]/.test(item.size);
      if (isDouble) {
          organizedData[sectionKey].double.push(item);
      } else {
          organizedData[sectionKey].single.push(item);
      }
  });

  // Sort function for sizes
  const sortSizes = (a: InventoryItem, b: InventoryItem) => {
      // Try to extract first number
      const numA = parseFloat(a.size.match(/\d+(\.\d+)?/)?.[0] || "0");
      const numB = parseFloat(b.size.match(/\d+(\.\d+)?/)?.[0] || "0");
      if (numA !== numB) return numA - numB;
      return a.size.localeCompare(b.size);
  };

  const activeKeys = [...new Set([...SECTION_ORDER, ...Object.keys(organizedData)])]
    .filter(k => organizedData[k] && (organizedData[k].single.length > 0 || organizedData[k].double.length > 0));

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
      <div className="p-3 bg-enerpack-800 text-white flex flex-col md:flex-row justify-between items-start md:items-center sticky top-0 z-20 shadow-md gap-3 md:gap-0 print:hidden">
        <h2 className="text-base md:text-lg font-bold tracking-wide flex items-center gap-2">
            ENERPACK INVENTORY
            {!isAdmin && <span className="text-[10px] bg-enerpack-600 px-2 py-0.5 rounded-full text-white/80">READ ONLY</span>}
        </h2>
        
        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
           {/* File Ops */}
           <div className="flex gap-1 mr-0 md:mr-4">
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

           <div className="relative flex-1 md:flex-none">
             <Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
             <input 
              type="text" 
              placeholder="Search..." 
              className="pl-7 pr-4 py-1.5 rounded text-black text-xs w-full md:w-40 focus:outline-none focus:ring-2 focus:ring-enerpack-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           
           {isAdmin ? (
               <button 
                onClick={() => setIsAdding(!isAdding)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors whitespace-nowrap"
               >
                 + New
               </button>
           ) : (
                <button 
                 onClick={() => alert("Admin access required to add items.")}
                 className="bg-gray-600 text-gray-300 px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap cursor-not-allowed flex items-center gap-1"
                >
                 <Lock className="w-3 h-3" /> New
                </button>
           )}
        </div>
      </div>

      {/* Print Only Header */}
      <div className="hidden print:block p-4 text-center border-b-2 border-black mb-4">
        <h1 className="text-2xl font-black uppercase">Enerpack Inventory Report</h1>
        <p className="text-sm text-gray-600">{new Date().toLocaleDateString()}</p>
      </div>

      {/* Add Item Form - Responsive Grid */}
      {isAdding && isAdmin && (
        <div className="bg-enerpack-50 p-3 border-b border-enerpack-200 grid grid-cols-2 md:grid-cols-6 gap-2 items-end print:hidden">
          <div className="col-span-1">
            <label className="text-xs font-bold text-gray-600">Size</label>
            <input type="text" className="w-full p-1.5 border rounded text-sm" value={newItem.size} onChange={e => setNewItem({...newItem, size: e.target.value})} />
          </div>
          <div className="col-span-1">
            <label className="text-xs font-bold text-gray-600">GSM</label>
             <select 
                className="w-full p-1.5 border rounded text-sm"
                value={newItem.gsm}
                onChange={e => setNewItem({...newItem, gsm: e.target.value})}
             >
                 {SECTION_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                 <option value="Other">Other</option>
             </select>
          </div>
          <div className="col-span-1">
            <label className="text-xs font-bold text-gray-600">Min Qty</label>
            <input type="number" className="w-full p-1.5 border rounded text-sm" value={newItem.minStock} onChange={e => setNewItem({...newItem, minStock: Number(e.target.value)})} />
          </div>
          <div className="col-span-1">
            <label className="text-xs font-bold text-gray-600">Initial Stock</label>
            <input type="number" className="w-full p-1.5 border rounded text-sm" value={newItem.closingStock} onChange={e => setNewItem({...newItem, closingStock: Number(e.target.value)})} />
          </div>
          <div className="col-span-2 md:col-span-1">
             <label className="text-xs font-bold text-gray-600">Remarks</label>
             <input type="text" className="w-full p-1.5 border rounded text-sm" value={newItem.remarks} onChange={e => setNewItem({...newItem, remarks: e.target.value})} />
          </div>
          <button onClick={handleAddItem} className="col-span-2 md:col-span-1 bg-enerpack-600 text-white p-1.5 rounded h-9 flex items-center justify-center hover:bg-enerpack-700 text-xs font-bold">
            <Save className="w-3 h-3 mr-1" /> Add
          </button>
        </div>
      )}

      {/* Main Table Content - Sections */}
      <div className="flex-1 overflow-auto bg-gray-100 p-2 md:p-4 space-y-4 md:space-y-6 print:overflow-visible print:bg-white print:p-0">
        
        {activeKeys.map(gsmKey => {
            const section = organizedData[gsmKey];
            section.single.sort(sortSizes);
            section.double.sort(sortSizes);

            return (
                <div key={gsmKey} className="bg-white border rounded-md shadow-sm overflow-hidden mb-4 md:mb-8 print:shadow-none print:border-black print:mb-6 print:break-inside-avoid">
                     <div className="bg-slate-200 text-slate-800 px-3 md:px-4 py-2 font-black text-sm md:text-lg border-b border-slate-300 print:bg-gray-200 print:border-black print:text-black">
                        {gsmKey} GSM SECTION
                     </div>
                     
                     <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-300 print:flex-row print:divide-x print:divide-black">
                        {/* LEFT COLUMN: Single Sizes */}
                        <div className="flex-1 overflow-x-auto print:overflow-visible">
                            <div className="bg-gray-50 px-3 py-1 text-xs font-bold text-center text-gray-500 uppercase tracking-wider border-b min-w-full print:bg-gray-100 print:text-black print:border-black">Single Sizes</div>
                            <div className="min-w-max print:min-w-0">
                              <table className="w-full text-left">
                                  <thead className="bg-gray-100 text-xs text-gray-500 border-b print:bg-gray-50 print:text-black print:border-black">
                                      <tr>
                                          <th className="px-2 py-1 whitespace-nowrap">Size</th>
                                          <th className="px-2 py-1 text-center whitespace-nowrap">GSM</th>
                                          <th className="px-2 py-1 text-center whitespace-nowrap">Stock</th>
                                          <th className="px-2 py-1 text-center whitespace-nowrap print:hidden">Action</th>
                                          <th className="px-2 py-1 whitespace-nowrap">Remarks</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {section.single.map(item => <InventoryRow key={item.id} item={item} onOpenModal={handleOpenModal} onEditItem={handleEditItem} isAdmin={isAdmin} />)}
                                      {section.single.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-400 text-xs">- Empty -</td></tr>}
                                  </tbody>
                              </table>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Double Sizes */}
                        <div className="flex-1 overflow-x-auto print:overflow-visible">
                             <div className="bg-gray-50 px-3 py-1 text-xs font-bold text-center text-gray-500 uppercase tracking-wider border-b min-w-full print:bg-gray-100 print:text-black print:border-black">Double Sizes</div>
                             <div className="min-w-max print:min-w-0">
                               <table className="w-full text-left">
                                  <thead className="bg-gray-100 text-xs text-gray-500 border-b print:bg-gray-50 print:text-black print:border-black">
                                      <tr>
                                          <th className="px-2 py-1 whitespace-nowrap">Size</th>
                                          <th className="px-2 py-1 text-center whitespace-nowrap">GSM</th>
                                          <th className="px-2 py-1 text-center whitespace-nowrap">Stock</th>
                                          <th className="px-2 py-1 text-center whitespace-nowrap print:hidden">Action</th>
                                          <th className="px-2 py-1 whitespace-nowrap">Remarks</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {section.double.map(item => <InventoryRow key={item.id} item={item} onOpenModal={handleOpenModal} onEditItem={handleEditItem} isAdmin={isAdmin} />)}
                                      {section.double.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-400 text-xs">- Empty -</td></tr>}
                                  </tbody>
                              </table>
                            </div>
                        </div>
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
