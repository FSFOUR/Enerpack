
import React, { useMemo, useState } from 'react';
import { StockTransaction, InventoryItem } from '../types';
import { TrendingUp, BarChart3, Calendar, ArrowLeft, Download, RefreshCw, AlertTriangle, CheckCircle, Layers } from 'lucide-react';

interface ForecastPageProps {
  items: InventoryItem[];
  transactions: StockTransaction[];
  onBack: () => void;
}

const SECTION_ORDER = ["280", "250", "230", "200", "150", "140", "140GYT", "130", "130GYT", "100", "GYT"];

const ForecastPage: React.FC<ForecastPageProps> = ({ items, transactions, onBack }) => {
  const [activeTab, setActiveTab] = useState<'HISTORY' | 'PREDICTION'>('HISTORY');
  const [timeRange, setTimeRange] = useState<'ALL' | '30_DAYS' | '90_DAYS'>('ALL');

  // --- HISTORY ANALYTICS ---
  const { chartData, totalOut } = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();
    
    if (timeRange === '30_DAYS') cutoffDate.setDate(now.getDate() - 30);
    if (timeRange === '90_DAYS') cutoffDate.setDate(now.getDate() - 90);
    if (timeRange === 'ALL') cutoffDate.setFullYear(2000); // Way back

    const relevantTransactions = transactions.filter(t => {
      if (t.type !== 'OUT') return false;
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

    return { chartData: sortedData, totalOut: grandTotal };
  }, [transactions, timeRange]);

  const maxValue = chartData.length > 0 ? chartData[0].value : 0;

  // --- PREDICTION LOGIC (Based on last 90 days movement) ---
  const predictions = useMemo(() => {
    // 1. Calculate Average Daily Usage over last 90 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    const recentUsage: Record<string, number> = {};
    transactions.forEach(t => {
        if (t.type === 'OUT' && new Date(t.date) >= cutoff) {
             // Use Item ID if possible, otherwise rely on size+gsm matches
             if (t.itemId) {
                 recentUsage[t.itemId] = (recentUsage[t.itemId] || 0) + t.quantity;
             }
        }
    });

    // 2. Map inventory to prediction model
    return items.map(item => {
        const totalUsed90Days = recentUsage[item.id] || 0;
        const avgDaily = totalUsed90Days / 90;
        const predicted30Days = Math.ceil(avgDaily * 30);
        
        return {
            ...item,
            avgDaily: avgDaily.toFixed(2),
            predicted30Days,
            gap: item.closingStock - predicted30Days
        };
    })
    .filter(i => i.predicted30Days > 0) // Only show items that move
    .sort((a, b) => a.gap - b.gap); // Sort by biggest shortage first

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
    
    if (activeTab === 'HISTORY') {
        const ws = (window as any).XLSX.utils.json_to_sheet(chartData.map((d, i) => ({
            RANK: i + 1,
            ITEM_SIZE: d.name,
            TOTAL_OUT_QTY: d.value,
            USAGE_SHARE: totalOut > 0 ? ((d.value / totalOut) * 100).toFixed(1) + '%' : '0%'
        })));
        (window as any).XLSX.utils.book_append_sheet(wb, ws, "Movement History");
    } else {
        const ws = (window as any).XLSX.utils.json_to_sheet(predictions.map(p => ({
            SIZE: p.size,
            GSM: p.gsm,
            CURRENT_STOCK: p.closingStock,
            PREDICTED_30_DAY_NEED: p.predicted30Days,
            STATUS: p.gap < 0 ? 'SHORTAGE' : 'SAFE',
            GAP: p.gap
        })));
        (window as any).XLSX.utils.book_append_sheet(wb, ws, "Future Requirement");
    }
    
    (window as any).XLSX.writeFile(wb, `Forecast_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm bg-indigo-50 gap-4 md:gap-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
            title="Back to Inventory"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold text-sm hidden md:inline">Back</span>
          </button>
          <h2 className="text-xl font-bold text-indigo-800 flex items-center gap-2 border-l border-indigo-200 pl-4 ml-2">
            <TrendingUp className="w-6 h-6" />
            FORECAST
          </h2>
          
          {/* Tab Switcher */}
          <div className="flex bg-white rounded-lg p-1 border ml-4 shadow-sm">
             <button 
                onClick={() => setActiveTab('HISTORY')}
                className={`px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${activeTab === 'HISTORY' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
             >
                History Analysis
             </button>
             <button 
                onClick={() => setActiveTab('PREDICTION')}
                className={`px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${activeTab === 'PREDICTION' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
             >
                Future Requirement
             </button>
          </div>
        </div>

        {/* Filters & Export */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {activeTab === 'HISTORY' && (
              <div className="flex gap-1 bg-white p-1 rounded-lg border shadow-sm">
                <button 
                    onClick={() => setTimeRange('30_DAYS')}
                    className={`px-2 md:px-3 py-1 text-xs font-bold rounded ${timeRange === '30_DAYS' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    30D
                </button>
                <button 
                    onClick={() => setTimeRange('90_DAYS')}
                    className={`px-2 md:px-3 py-1 text-xs font-bold rounded ${timeRange === '90_DAYS' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    90D
                </button>
                <button 
                    onClick={() => setTimeRange('ALL')}
                    className={`px-2 md:px-3 py-1 text-xs font-bold rounded ${timeRange === 'ALL' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    All
                </button>
              </div>
          )}
          <button 
            onClick={handleExport}
            className="px-3 py-1.5 text-sm font-bold rounded bg-green-600 text-white hover:bg-green-700 flex items-center gap-1 shadow-sm"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
        
        {/* === HISTORY VIEW === */}
        {activeTab === 'HISTORY' && (
            <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
                            <BarChart3 className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Movement (Qty)</p>
                            <p className="text-2xl font-black text-gray-800">{totalOut.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-full">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Top Mover</p>
                            <p className="text-xl font-black text-gray-800 truncate max-w-[150px] md:max-w-[200px]" title={chartData[0]?.name}>
                                {chartData[0]?.name || '-'}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                            <Calendar className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Analysis Period</p>
                            <p className="text-xl font-black text-gray-800">
                                {timeRange === 'ALL' ? 'All History' : timeRange === '30_DAYS' ? 'Last 30 Days' : 'Last 90 Days'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-indigo-600" />
                        Top 10 Fast Moving Sizes
                    </h3>
                    
                    {chartData.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border-dashed border-2">
                            No transaction data available for this period
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {chartData.slice(0, 10).map((item, index) => {
                                const percent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                                return (
                                    <div key={item.name} className="relative">
                                        <div className="flex justify-between text-sm font-semibold mb-1 text-gray-700">
                                            <span className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-gray-100 text-xs flex items-center justify-center text-gray-500 border">
                                                    {index + 1}
                                                </span>
                                                {item.name}
                                            </span>
                                            <span>{item.value}</span>
                                        </div>
                                        <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${percent}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="bg-white border rounded-xl shadow-lg overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b">
                        <h3 className="font-bold text-gray-700">Detailed Movement Report</h3>
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 text-gray-600 font-semibold border-b">
                            <tr>
                                <th className="px-6 py-3 whitespace-nowrap">Rank</th>
                                <th className="px-6 py-3 whitespace-nowrap">Item Size (GSM)</th>
                                <th className="px-6 py-3 text-right whitespace-nowrap">Total Out Qty</th>
                                <th className="px-6 py-3 text-right whitespace-nowrap">Usage Share</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {chartData.map((item, index) => (
                                <tr key={item.name} className="hover:bg-indigo-50">
                                    <td className="px-6 py-3 text-gray-500 font-mono w-20 whitespace-nowrap">#{index + 1}</td>
                                    <td className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">{item.name}</td>
                                    <td className="px-6 py-3 text-right font-bold text-indigo-700 whitespace-nowrap">{item.value}</td>
                                    <td className="px-6 py-3 text-right text-gray-500 whitespace-nowrap">
                                        {totalOut > 0 ? ((item.value / totalOut) * 100).toFixed(1) : 0}%
                                    </td>
                                </tr>
                            ))}
                            {chartData.length === 0 && (
                                <tr><td colSpan={4} className="p-6 text-center text-gray-400">No data found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </>
        )}

        {/* === PREDICTION VIEW === */}
        {activeTab === 'PREDICTION' && (
             <>
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3 mb-6">
                    <RefreshCw className="w-5 h-5 text-indigo-600 mt-0.5" />
                    <div className="text-sm text-indigo-900">
                        <p className="font-bold">How is this calculated?</p>
                        <p className="opacity-80">This forecast analyzes your stock-out movement over the <strong>last 90 days</strong> to calculate an average daily usage. It then projects this usage forward for the next <strong>30 days</strong> and compares it with your current closing stock.</p>
                    </div>
                </div>

                {/* Iterate over sections */}
                {activeSections.length > 0 ? (
                  activeSections.map(gsmKey => (
                     <div key={gsmKey} className="bg-white border rounded-xl shadow-lg overflow-hidden mb-8">
                         <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
                             <Layers className="w-4 h-4 text-slate-500" />
                             <h3 className="font-black text-slate-700 text-lg uppercase">{gsmKey === 'Other' ? 'Other' : `${gsmKey} GSM`} Section</h3>
                         </div>
                         <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
                                <tr>
                                    <th className="px-4 py-3 whitespace-nowrap">Item Details</th>
                                    <th className="px-4 py-3 text-center whitespace-nowrap">Current Stock</th>
                                    <th className="px-4 py-3 text-center whitespace-nowrap">Est. 30 Day Need</th>
                                    <th className="px-4 py-3 text-center whitespace-nowrap">Balance</th>
                                    <th className="px-4 py-3 text-center whitespace-nowrap">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {groupedPredictions[gsmKey].map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-gray-800">{item.size}</div>
                                            <div className="text-xs text-gray-500">{item.gsm} GSM</div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="font-mono font-bold text-gray-700">{item.closingStock}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center bg-gray-50">
                                            <span className="font-mono font-bold text-indigo-600">{item.predicted30Days}</span>
                                            <div className="text-[10px] text-gray-400">~{item.avgDaily}/day</div>
                                        </td>
                                        <td className={`px-4 py-3 text-center font-bold ${item.gap < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {item.gap > 0 ? '+' : ''}{item.gap}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {item.gap < 0 ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold">
                                                    <AlertTriangle className="w-3 h-3" /> Shortage
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold">
                                                    <CheckCircle className="w-3 h-3" /> Safe
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                  ))
                ) : (
                   <div className="p-8 text-center text-gray-400 bg-white rounded-xl border border-dashed">
                      Not enough data from the last 90 days to generate a forecast for any section.
                   </div>
                )}
             </>
        )}

      </div>
    </div>
  );
};

export default ForecastPage;
