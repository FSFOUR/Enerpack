import React, { useState, useMemo } from 'react';
import { InventoryItem, StockTransaction } from '../types';
import { 
  ArrowLeft, Search, Plus, Minus, TrendingUp, Calendar, 
  History, AlertCircle, Save, Package, ChevronRight, BarChart2,
  Clock, ArrowUpCircle, ArrowDownCircle
} from 'lucide-react';

interface InventoryTrackerProps {
  items: InventoryItem[];
  transactions: StockTransaction[];
  onBack: () => void;
  onRecordTransaction: (transaction: Omit<StockTransaction, 'id' | 'timestamp'>) => void;
  onUpdateStock: (id: string, delta: number) => void;
  isAdmin: boolean;
}

const InventoryTracker: React.FC<InventoryTrackerProps> = ({ 
  items, transactions, onBack, onRecordTransaction, onUpdateStock, isAdmin 
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [qty, setQty] = useState<number>(0);
  const [opType, setOpType] = useState<'IN' | 'OUT'>('OUT');

  const selectedItem = useMemo(() => items.find(i => i.id === selectedItemId), [items, selectedItemId]);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return [];
    return items.filter(i => 
      `${i.size} ${i.gsm}`.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);
  }, [items, searchQuery]);

  const recentTransactions = useMemo(() => {
    return transactions
      .filter(t => t.itemId === selectedItemId)
      .slice(0, 5);
  }, [transactions, selectedItemId]);

  // Forecast Logic
  const forecast = useMemo(() => {
    if (!selectedItemId) return null;
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const relevantOuts = transactions.filter(t => 
      t.itemId === selectedItemId && t.type === 'OUT' && new Date(t.date) >= thirtyDaysAgo
    );

    const totalUsed = relevantOuts.reduce((sum, t) => sum + t.quantity, 0);
    const avgDailyUsage = totalUsed / 30;
    
    if (avgDailyUsage <= 0) return { daysLeft: 'N/A', predictedDate: 'Insufficient data' };

    const daysLeft = Math.floor((selectedItem?.closingStock || 0) / avgDailyUsage);
    const predictedDate = new Date();
    predictedDate.setDate(now.getDate() + daysLeft);

    return {
      daysLeft,
      predictedDate: predictedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      usageRate: avgDailyUsage.toFixed(1)
    };
  }, [selectedItemId, transactions, selectedItem]);

  const handleQuickLog = (type: 'IN' | 'OUT') => {
    if (!selectedItem || qty <= 0 || !isAdmin) return;

    const today = new Date();
    onRecordTransaction({
      type,
      date: today.toISOString().split('T')[0],
      month: today.toLocaleString('default', { month: 'long' }),
      itemId: selectedItem.id,
      size: selectedItem.size,
      gsm: selectedItem.gsm,
      quantity: qty,
      company: type === 'IN' ? 'Quick Restock' : 'Direct Exit',
      remarks: `Mobile Tracker`
    });

    onUpdateStock(selectedItem.id, type === 'IN' ? qty : -qty);
    setQty(0);
  };

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] overflow-hidden">
      <div className="bg-[#0c4a6e] p-3 px-6 flex justify-between items-center shrink-0 shadow-lg text-white">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 bg-white/10 rounded-xl transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col">
            <h2 className="font-black text-sm uppercase tracking-tighter flex items-center gap-1.5">
              <Package className="w-4 h-4 text-blue-400" />
              Quick Tracker
            </h2>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row p-2 md:p-6 gap-3 md:gap-6 overflow-hidden">
        
        <div className="w-full lg:w-1/3 flex flex-col gap-3 md:gap-6 overflow-y-auto scrollbar-hide shrink-0">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                type="text" 
                placeholder="Search Item..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-slate-800 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {filteredItems.length > 0 && (
              <div className="space-y-1.5 mt-3">
                {filteredItems.map(item => (
                  <button 
                    key={item.id}
                    onClick={() => { setSelectedItemId(item.id); setSearchQuery(''); }}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${selectedItemId === item.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-100'}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-black text-xs text-slate-800">{item.size}</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{item.gsm} GSM</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${selectedItemId === item.id ? 'text-blue-500' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedItem && (
            <div className="bg-[#0c4a6e] p-4 rounded-2xl shadow-xl text-white relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <BarChart2 className="w-12 h-12" />
              </div>
              <p className="text-[8px] font-black uppercase tracking-widest text-blue-300">Stock Available</p>
              <div className="flex items-baseline gap-1.5">
                <h4 className="text-3xl font-black tracking-tighter tabular-nums">{selectedItem.closingStock}</h4>
                <span className="text-blue-400 font-bold uppercase text-[9px]">Units</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-white/10 p-2 rounded-lg border border-white/5">
                  <p className="text-[7px] font-black uppercase text-blue-200">Status</p>
                  <p className={`text-[10px] font-bold ${selectedItem.closingStock < selectedItem.minStock ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {selectedItem.closingStock < selectedItem.minStock ? 'LOW' : 'OK'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3">
          {selectedItem ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-3">
              
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button 
                        onClick={() => setOpType('OUT')}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${opType === 'OUT' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400'}`}
                      >
                        <ArrowUpCircle className="w-3 h-3" /> Out
                      </button>
                      <button 
                        onClick={() => setOpType('IN')}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${opType === 'IN' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400'}`}
                      >
                        <ArrowDownCircle className="w-3 h-3" /> In
                      </button>
                    </div>
                    
                    <div className="relative group">
                      <input 
                        type="number" 
                        placeholder="Qty..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xl font-black text-slate-800 outline-none transition-all text-center tabular-nums"
                        value={qty || ''}
                        onChange={(e) => setQty(Number(e.target.value))}
                      />
                    </div>

                    <button 
                      onClick={() => handleQuickLog(opType)}
                      disabled={!isAdmin || qty <= 0}
                      className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-30 ${opType === 'OUT' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white`}
                    >
                      Confirm
                    </button>
                  </div>

                  <div className="w-full sm:w-48 bg-slate-50 rounded-2xl p-3 border border-slate-100">
                    <div className="text-center">
                      <p className="text-[7px] font-black uppercase text-slate-400">Ends In</p>
                      <h5 className={`text-xl font-black ${typeof forecast?.daysLeft === 'number' && forecast.daysLeft < 7 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {forecast?.daysLeft} Days
                      </h5>
                      <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Rate: {forecast?.usageRate}/d</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                   <Clock className="w-3.5 h-3.5 text-slate-400" /> History
                </h3>
                <div className="space-y-2">
                   {recentTransactions.length > 0 ? recentTransactions.map(t => (
                     <div key={t.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                           <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${t.type === 'IN' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                              {t.type === 'IN' ? <ArrowDownCircle className="w-3.5 h-3.5" /> : <ArrowUpCircle className="w-3.5 h-3.5" />}
                           </div>
                           <div>
                              <p className="text-[9px] font-black text-slate-800 uppercase leading-none">{t.type === 'IN' ? 'In' : 'Out'}</p>
                              <p className="text-[7px] font-bold text-slate-400 uppercase">{t.date}</p>
                           </div>
                        </div>
                        <span className={`text-sm font-black tabular-nums ${t.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                           {t.type === 'IN' ? '+' : '-'}{t.quantity}
                        </span>
                     </div>
                   )) : (
                     <p className="text-center py-2 text-slate-400 text-[9px] font-bold uppercase">No records</p>
                   )}
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2 opacity-40">
               <Package className="w-12 h-12" />
               <p className="font-black text-slate-400 text-[9px] uppercase tracking-widest">Select Item</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryTracker;