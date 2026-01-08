import React, { useMemo, useState } from 'react';
import { StockTransaction, InventoryItem } from '../types';
import { TrendingUp, BarChart3, Calendar, ArrowLeft, Download, RefreshCw, AlertTriangle, CheckCircle, Layers, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface ForecastPageProps {
  items: InventoryItem[];
  transactions: StockTransaction[];
  onBack: () => void;
}

const SECTION_ORDER = ["280", "250", "230", "200", "150", "140", "140GYT", "130", "130GYT", "100", "GYT"];

const ForecastPage: React.FC<ForecastPageProps> = ({ items, transactions, onBack }) => {
  const [activeTab, setActiveTab] = useState<'HISTORY' | 'PREDICTION'>('HISTORY');
  const [historyMode, setHistoryMode] = useState<'IN' | 'OUT'>('OUT');
  const [timeRange, setTimeRange] = useState<'ALL' | '30_DAYS' | '90_DAYS'>('90_DAYS');

  // --- ANALYTICS ENGINE ---
  const { chartData, totalVolume } = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();
    
    if (timeRange === '30_DAYS') cutoffDate.setDate(now.getDate() - 30);
    else if (timeRange === '90_DAYS') cutoffDate.setDate(now.getDate() - 90);
    else cutoffDate.setFullYear(2000);

    const relevantTransactions = transactions.filter(t => {
      if (t.type !== historyMode) return false;
      const tDate = new Date(t.date);
      return tDate >= cutoffDate;
    });

    const aggregation: Record<string, number> = {};
    let grandTotal = 0;

    relevantTransactions.forEach(t => {
      const key = `${t.size} (${t.gsm})`;
      const qty = Number(t.quantity) || 0;
      if (!aggregation[key]) aggregation[key] = 0;
      aggregation[key] += qty;
      grandTotal += qty;
    });

    const sortedData = Object.entries(aggregation)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { chartData: sortedData, totalVolume: grandTotal };
  }, [transactions, timeRange, historyMode]);

  const maxValue = chartData.length > 0 ? chartData[0].value : 0;

  // --- SMART PREDICTION LOGIC ---
  const predictions = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    const recentOuts = transactions.filter(t => t.type === 'OUT' && new Date(t.date) >= cutoff);
    
    if (recentOuts.length === 0) return [];

    const oldestDate = recentOuts.reduce((min, t) => {
        const d = new Date(t.date);
        return d < min ? d : min;
    }, now);

    const usageDays = Math.max(1, Math.ceil((now.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24)));
    const usageMap: Record<string, number> = {};
    
    recentOuts.forEach(t => {
        const idKey = t.itemId || `${t.size}|${t.gsm}`;
        usageMap[idKey] = (usageMap[idKey] || 0) + (Number(t.quantity) || 0);
    });

    return items.map(item => {
        const compositeKey = `${item.size}|${item.gsm}`;
        const totalUsed = (usageMap[item.id] || 0) + (usageMap[compositeKey] || 0);
        
        const avgDaily = totalUsed / usageDays;
        const predicted30Days = Math.ceil(avgDaily * 30);
        
        return {
            ...item,
            avgDaily: avgDaily.toFixed(2),
            predicted30Days,
            gap: item.closingStock - predicted30Days
        };
    })
    .filter(i => i.predicted30Days > 0)
    .sort((a, b) => a.gap - b.gap);

  }, [transactions, items]);

  const groupedPredictions = useMemo(() => {
      const groups: Record<string, typeof predictions> = {};
      SECTION_ORDER.forEach(k => groups[k] = []);
      groups['Other'] = [];

      predictions.forEach(p => {
          const key = SECTION_ORDER.includes(p.gsm) ? p.gsm : 'Other';
          groups[key].push(p);
      });
      return groups;
  }, [predictions]);

  const activeSections = [...SECTION_ORDER, 'Other'].filter(k => groupedPredictions[k].length > 0);

  const handleExport = () => {
    if (typeof (window as any).XLSX === 'undefined') {
       alert("Excel library not loaded.");
       return;
    }
    const wb = (window as any).XLSX.utils.book_new();
    const filename = `Enerpack_Forecast_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    if (activeTab === 'HISTORY') {
        const ws = (window as any).XLSX.utils.json_to_sheet(chartData.map((d, i) => ({
            RANK: i + 1,
            ITEM: d.name,
            VOLUME: d.value,
            TYPE: historyMode,
            SHARE: totalVolume > 0 ? ((d.value / totalVolume) * 100).toFixed(1) + '%' : '0%'
        })));
        (window as any).XLSX.utils.book_append_sheet(wb, ws, `${historyMode} Analysis`);
    } else {
        const ws = (window as any).XLSX.utils.json_to_sheet(predictions.map(p => ({
            SIZE: p.size,
            GSM: p.gsm,
            CURRENT_STOCK: p.closingStock,
            PREDICTED_30_DAY_NEED: p.predicted30Days,
            AVG_DAILY_USE: p.avgDaily,
            SURPLUS_DEFICIT: p.gap
        })));
        (window as any).XLSX.utils.book_append_sheet(wb, ws, "Predictions");
    }
    
    (window as any).XLSX.writeFile(wb, filename);
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      {/* Responsive Header */}
      <div className="bg-white border-b px-4 md:px-6 py-4 flex flex-col lg:flex-row justify-between items-start lg:items-center shadow-sm gap-4">
        <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full lg:w-auto">
          <button 
            onClick={onBack} 
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h2 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
              FORECAST <span className="hidden sm:inline">ENGINE</span>
            </h2>
            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Analytics & Requirements</p>
          </div>
          
          <div className="flex bg-slate-100 rounded-xl p-1 border">
             <button 
                onClick={() => setActiveTab('HISTORY')}
                className={`px-3 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'HISTORY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
             >
                Historical
             </button>
             <button 
                onClick={() => setActiveTab('PREDICTION')}
                className={`px-3 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'PREDICTION' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
             >
                Predictive
             </button>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 w-full lg:w-auto justify-between lg:justify-end">
          {activeTab === 'HISTORY' && (
              <div className="flex gap-0.5 md:gap-1 bg-slate-100 p-1 rounded-xl border">
                {['30_DAYS', '90_DAYS', 'ALL'].map(range => (
                  <button 
                      key={range}
                      onClick={() => setTimeRange(range as any)}
                      className={`px-2 md:px-3 py-1 text-[9px] md:text-[10px] font-black rounded-lg uppercase tracking-tighter ${timeRange === range ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                      {range.replace('_', ' ')}
                  </button>
                ))}
              </div>
          )}
          <button 
            onClick={handleExport}
            className="px-3 md:px-4 py-2 text-[10px] md:text-xs font-black rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2 shadow-lg transition-all active:scale-95 uppercase tracking-widest whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 md:w-4 md:h-4" /> Export
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-8 space-y-6 md:space-y-8">
        
        {/* === HISTORY VIEW === */}
        {activeTab === 'HISTORY' && (
            <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Movement Toggle - Responsive Grid */}
                <div className="flex flex-col sm:flex-row gap-4">
                   <button 
                    onClick={() => setHistoryMode('OUT')}
                    className={`flex-1 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border transition-all flex items-center gap-4 ${historyMode === 'OUT' ? 'bg-rose-50 border-rose-100 shadow-md ring-2 ring-rose-500/20' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                   >
                      <div className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl ${historyMode === 'OUT' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-slate-100 text-slate-400'}`}>
                        <ArrowUpCircle className="w-6 h-6 md:w-8 md:h-8" />
                      </div>
                      <div className="text-left">
                         <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${historyMode === 'OUT' ? 'text-rose-600' : 'text-slate-400'}`}>Outbound Flow</p>
                         <p className="text-lg md:text-2xl font-black text-slate-800 tracking-tighter">Consumption</p>
                      </div>
                   </button>
                   <button 
                    onClick={() => setHistoryMode('IN')}
                    className={`flex-1 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border transition-all flex items-center gap-4 ${historyMode === 'IN' ? 'bg-emerald-50 border-emerald-100 shadow-md ring-2 ring-emerald-500/20' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                   >
                      <div className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl ${historyMode === 'IN' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-100 text-slate-400'}`}>
                        <ArrowDownCircle className="w-6 h-6 md:w-8 md:h-8" />
                      </div>
                      <div className="text-left">
                         <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${historyMode === 'IN' ? 'text-emerald-600' : 'text-slate-400'}`}>Inbound Flow</p>
                         <p className="text-lg md:text-2xl font-black text-slate-800 tracking-tighter">Restock</p>
                      </div>
                   </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                    {/* Visual Chart Card */}
                    <div className="bg-white border border-slate-100 rounded-2xl md:rounded-[2.5rem] shadow-sm p-5 md:p-8 flex flex-col">
                        <div className="flex items-center justify-between mb-6 md:mb-8">
                            <h3 className="text-sm md:text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                                <BarChart3 className={`w-4 h-4 md:w-5 md:h-5 ${historyMode === 'OUT' ? 'text-rose-500' : 'text-emerald-500'}`} />
                                Top Distribution
                            </h3>
                            <span className="text-[9px] font-black bg-slate-50 text-slate-400 px-2 py-0.5 rounded uppercase">Volume Base</span>
                        </div>
                        
                        {chartData.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-2 min-h-[250px]">
                                <RefreshCw className="w-10 h-10 opacity-20" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">No movement recorded</p>
                            </div>
                        ) : (
                            <div className="space-y-4 md:space-y-6">
                                {chartData.slice(0, 8).map((item, index) => {
                                    const percent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                                    return (
                                        <div key={item.name} className="space-y-1.5 md:space-y-2">
                                            <div className="flex justify-between items-center px-1">
                                                <div className="flex items-center gap-2 md:gap-3">
                                                   <span className="w-5 h-5 md:w-6 md:h-6 rounded-md md:rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-[9px] md:text-[10px] font-black text-slate-400">{index + 1}</span>
                                                   <span className="text-[11px] md:text-sm font-black text-slate-700 truncate max-w-[120px] md:max-w-none">{item.name}</span>
                                                </div>
                                                <span className={`text-[11px] md:text-xs font-black ${historyMode === 'OUT' ? 'text-rose-600' : 'text-emerald-600'}`}>{item.value.toLocaleString()}</span>
                                            </div>
                                            <div className="h-2 md:h-3 w-full bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${historyMode === 'OUT' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${percent}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Table View Card - Optimized for scroll */}
                    <div className="bg-white border border-slate-100 rounded-2xl md:rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 md:p-8 pb-3 md:pb-4">
                           <h3 className="text-sm md:text-lg font-black text-slate-800 uppercase tracking-tight">Ranking Table</h3>
                           <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Total: {totalVolume.toLocaleString()} units</p>
                        </div>
                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-left min-w-[450px]">
                                <thead className="bg-slate-50/50 border-y border-slate-100">
                                    <tr>
                                        <th className="px-5 md:px-8 py-3 md:py-4 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Rank</th>
                                        <th className="px-5 md:px-8 py-3 md:py-4 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                                        <th className="px-5 md:px-8 py-3 md:py-4 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Volume</th>
                                        <th className="px-5 md:px-8 py-3 md:py-4 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Share</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {chartData.map((item, index) => (
                                        <tr key={item.name} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-5 md:px-8 py-4 text-[10px] md:text-xs font-black text-slate-300 group-hover:text-indigo-400">#{index + 1}</td>
                                            <td className="px-5 md:px-8 py-4">
                                                <span className="text-[11px] md:text-sm font-black text-slate-700">{item.name}</span>
                                            </td>
                                            <td className={`px-5 md:px-8 py-4 text-right font-black text-[11px] md:text-sm ${historyMode === 'OUT' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {item.value.toLocaleString()}
                                            </td>
                                            <td className="px-5 md:px-8 py-4 text-right">
                                                <span className="text-[9px] md:text-[10px] font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                                                    {totalVolume > 0 ? ((item.value / totalVolume) * 100).toFixed(1) : 0}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {chartData.length === 0 && (
                                        <tr><td colSpan={4} className="p-10 text-center text-slate-300 font-bold uppercase text-[10px]">No records found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* === PREDICTION VIEW === */}
        {activeTab === 'PREDICTION' && (
             <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-indigo-600 rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 mb-6 md:mb-10 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                       <div className="flex items-center gap-4 md:gap-8">
                          <div className="p-4 md:p-6 bg-white/10 backdrop-blur-md rounded-2xl md:rounded-[2rem] border border-white/20">
                             <TrendingUp className="w-8 h-8 md:w-12 md:h-12" />
                          </div>
                          <div>
                             <h3 className="text-xl md:text-3xl font-black uppercase tracking-tight leading-tight">Demand Forecast</h3>
                             <p className="text-indigo-100 font-medium max-w-md mt-1 md:mt-2 text-xs md:text-sm opacity-80 leading-relaxed">
                                Projected inventory requirements for the next month based on recent 90-day activity.
                             </p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4 bg-black/20 p-3 md:p-4 rounded-2xl md:rounded-3xl border border-white/10 w-full md:w-auto">
                          <div className="text-right flex-1 md:flex-none">
                             <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-indigo-300">Target SKUs</p>
                             <p className="text-lg md:text-2xl font-black">{predictions.length}</p>
                          </div>
                          <div className="w-px h-8 md:h-10 bg-white/10"></div>
                          <div className="text-right flex-1 md:flex-none">
                             <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-rose-300">Shortages</p>
                             <p className="text-lg md:text-2xl font-black text-rose-400">{predictions.filter(p => p.gap < 0).length}</p>
                          </div>
                       </div>
                    </div>
                </div>

                {activeSections.length > 0 ? (
                  activeSections.map(gsmKey => (
                     <div key={gsmKey} className="bg-white border border-slate-100 rounded-2xl md:rounded-[2.5rem] shadow-sm overflow-hidden mb-8 md:mb-12">
                         <div className="bg-slate-50/50 border-b border-slate-100 px-6 md:px-10 py-4 md:py-6 flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-white border border-slate-200 rounded-xl md:rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm">
                                   <Layers className="w-4 h-4 md:w-5 md:h-5" />
                                </div>
                                <div>
                                   <h3 className="font-black text-slate-800 text-base md:text-xl uppercase tracking-tight">{gsmKey === 'Other' ? 'Other' : `${gsmKey} GSM`}</h3>
                                   <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Automated Projections</p>
                                </div>
                             </div>
                             <div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[8px] md:text-[10px] font-black uppercase rounded-full tracking-widest border border-indigo-100">
                                {groupedPredictions[gsmKey].length} Items
                             </div>
                         </div>
                         <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[650px]">
                                <thead className="bg-slate-50/20 border-b border-slate-50">
                                    <tr>
                                        <th className="px-6 md:px-10 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Specs</th>
                                        <th className="px-6 md:px-10 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Stock</th>
                                        <th className="px-6 md:px-10 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">30-Day Demand</th>
                                        <th className="px-6 md:px-10 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Balance</th>
                                        <th className="px-6 md:px-10 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {groupedPredictions[gsmKey].map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 md:px-10 py-4 md:py-6">
                                                <div className="font-black text-slate-800 text-sm md:text-lg tracking-tight">{item.size}</div>
                                                <div className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{item.gsm} GSM</div>
                                            </td>
                                            <td className="px-6 md:px-10 py-4 md:py-6 text-center">
                                                <span className="font-black text-slate-700 text-sm md:text-base">{item.closingStock.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 md:px-10 py-4 md:py-6 text-center bg-slate-50/30">
                                                <div className="font-black text-indigo-600 text-sm md:text-base">{item.predicted30Days.toLocaleString()}</div>
                                                <div className="text-[8px] md:text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">Avg {item.avgDaily}/Day</div>
                                            </td>
                                            <td className={`px-6 md:px-10 py-4 md:py-6 text-center font-black text-sm md:text-base ${item.gap < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {item.gap > 0 ? '+' : ''}{item.gap.toLocaleString()}
                                            </td>
                                            <td className="px-6 md:px-10 py-4 md:py-6 text-right">
                                                {item.gap < 0 ? (
                                                    <span className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl bg-rose-50 text-rose-600 text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-rose-100 shadow-sm">
                                                        <AlertTriangle className="w-3 h-3 md:w-3.5 md:h-3.5" /> Shortage
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl bg-emerald-50 text-emerald-600 text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                                                        <CheckCircle className="w-3 h-3 md:w-3.5 md:h-3.5" /> Optimal
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                      </div>
                  ))
                ) : (
                   <div className="p-10 md:p-20 text-center bg-white rounded-2xl md:rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center gap-6">
                      <div className="p-6 md:p-8 bg-slate-50 text-slate-200 rounded-full"><RefreshCw className="w-12 h-12 md:w-16 md:h-16 animate-spin-slow" /></div>
                      <div className="max-w-md">
                         <h4 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight">Gathering Intelligence</h4>
                         <p className="text-slate-400 text-xs md:text-sm font-medium mt-2 leading-relaxed">Not enough outbound movement has been recorded in the last 90 days to generate high-confidence predictions. Continue logging stock operations.</p>
                      </div>
                   </div>
                )}
             </div>
        )}

      </div>
    </div>
  );
};

export default ForecastPage;