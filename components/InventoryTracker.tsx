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
    
    if (avgDailyUsage <= 0) return { daysLeft: 'N/A', predictedDate: 'Insufficient usage data' };

    const daysLeft = Math.floor((selectedItem?.closingStock || 0) / avgDailyUsage);
    const predictedDate = new Date();
    predictedDate.setDate(now.getDate() + daysLeft);

    return {
      daysLeft,
      predictedDate: predictedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
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
      company: type === 'IN' ? 'Restock Operation' : 'Direct Exit',
      remarks: `Tracked via Mobile Interface`
    });

    onUpdateStock(selectedItem.id, type === 'IN' ? qty : -qty);
    setQty(0);
  };

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] overflow-hidden">
      <div className="bg-[#0c4a6e] p-4 px-8 flex justify-between items-center shrink-0 shadow-lg text-white">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h2 className="font-black text-xl uppercase tracking-tighter flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-400" />
              Inventory Tracker
            </h2>
            <p className="text-blue-200/50 text-[10px] font-bold uppercase tracking-widest leading-none mt-1">Movement & Forecasting</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row p-4 md:p-6 gap-6 overflow-hidden">
        
        <div className="w-full lg:w-1/3 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-hide">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Quick Search</h3>
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input 
                type="text" 
                placeholder="Item dimensions..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {filteredItems.length > 0 && (
              <div className="space-y-2">
                {filteredItems.map(item => (
                  <button 
                    key={item.id}
                    onClick={() => { setSelectedItemId(item.id); setSearchQuery(''); }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${selectedItemId === item.id ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500/10' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800">{item.size}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.gsm} GSM</span>
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-transform ${selectedItemId === item.id ? 'text-blue-500 translate-x-1' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedItem && (
            <div className="bg-[#0c4a6e] p-6 rounded-[2rem] shadow-xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <BarChart2 className="w-24 h-24" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-1">Current Availability</p>
              <div className="flex items-baseline gap-2 mb-4">
                <h4 className="text-5xl font-black tracking-tighter tabular-nums">{selectedItem.closingStock}</h4>
                <span className="text-blue-400 font-bold uppercase text-xs">Units</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                  <p className="text-[8px] font-black uppercase tracking-widest text-blue-200 mb-1">Min Level</p>
                  <p className="font-bold">{selectedItem.minStock}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                  <p className="text-[8px] font-black uppercase tracking-widest text-blue-200 mb-1">Status</p>
                  <p className={`font-bold ${selectedItem.closingStock < selectedItem.minStock ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {selectedItem.closingStock < selectedItem.minStock ? 'LOW' : 'OK'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-6">
          {selectedItem ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              
              <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1 space-y-6">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                      <History className="w-5 h-5 text-indigo-500" /> Stock Operation
                    </h3>
                    <div className="space-y-4">
                      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                        <button 
                          onClick={() => setOpType('OUT')}
                          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${opType === 'OUT' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400'}`}
                        >
                          <ArrowUpCircle className="w-4 h-4" /> Stock Out
                        </button>
                        <button 
                          onClick={() => setOpType('IN')}
                          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${opType === 'IN' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}
                        >
                          <ArrowDownCircle className="w-4 h-4" /> Stock In
                        </button>
                      </div>
                      
                      <div className="relative group">
                        <input 
                          type="number" 
                          placeholder="Enter quantity..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-6 px-8 text-3xl font-black text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all tabular-nums text-center"
                          value={qty || ''}
                          onChange={(e) => setQty(Number(e.target.value))}
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest">Units</div>
                      </div>

                      <button 
                        onClick={() => handleQuickLog(opType)}
                        disabled={!isAdmin || qty <= 0}
                        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-30 ${opType === 'OUT' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white`}
                      >
                        <Save className="w-4 h-4" /> Confirm Movement
                      </button>
                    </div>
                  </div>

                  <div className="w-full md:w-80 space-y-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-500" /> Forecast
                    </h3>
                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 space-y-6">
                      <div className="text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Stock Exhausts In</p>
                        <h5 className={`text-4xl font-black tracking-tighter tabular-nums ${typeof forecast?.daysLeft === 'number' && forecast.daysLeft < 7 ? 'text-rose-600' : 'text-slate-800'}`}>
                          {forecast?.daysLeft}
                        </h5>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Estimated Days</p>
                      </div>
                      <div className="space-y-3 pt-3 border-t border-slate-200">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Reorder</span>
                           <span className="text-[11px] font-black text-slate-700">{forecast?.predictedDate}</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Usage Rate</span>
                           <span className="text-[11px] font-black text-slate-700">{forecast?.usageRate} / Day</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 mb-6">
                   <Clock className="w-5 h-5 text-slate-400" /> Immediate History
                </h3>
                <div className="space-y-3">
                   {recentTransactions.length > 0 ? recentTransactions.map(t => (
                     <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'IN' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                              {t.type === 'IN' ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
                           </div>
                           <div>
                              <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{t.type === 'IN' ? 'Restocked' : 'Dispatched'}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.date}</p>
                           </div>
                        </div>
                        <span className={`text-lg font-black tabular-nums ${t.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                           {t.type === 'IN' ? '+' : '-'}{t.quantity}
                        </span>
                     </div>
                   )) : (
                     <p className="text-center py-6 text-slate-400 text-xs font-bold uppercase tracking-widest">No recent movements</p>
                   )}
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-6 opacity-40">
               <Package className="w-20 h-20" />
               <p className="font-black text-slate-400 text-sm uppercase tracking-[0.2em] text-center max-w-xs leading-relaxed">
                 Select an asset from the sidebar to start tracking movements.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryTracker;