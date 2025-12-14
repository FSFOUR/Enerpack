import React, { useMemo } from 'react';
import { InventoryItem, StockTransaction, ViewMode } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Package, 
  ArrowRight, 
  Clock, 
  Layers, 
  ShoppingCart,
  Activity,
  Calendar
} from 'lucide-react';

interface DashboardProps {
  items: InventoryItem[];
  transactions: StockTransaction[];
  onNavigate: (mode: ViewMode) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ items, transactions, onNavigate }) => {
  
  // --- CALCULATIONS ---

  const metrics = useMemo(() => {
    const totalItems = items.length;
    const lowStockCount = items.filter(i => i.closingStock < (i.minStock || 0)).length;
    
    // Current Month calculations
    const now = new Date();
    const currentMonth = now.toLocaleString('default', { month: 'long' });
    const currentYear = now.getFullYear();

    const thisMonthTrans = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === currentYear;
    });

    const monthlyIn = thisMonthTrans
        .filter(t => t.type === 'IN')
        .reduce((sum, t) => sum + t.quantity, 0);

    const monthlyOut = thisMonthTrans
        .filter(t => t.type === 'OUT')
        .reduce((sum, t) => sum + t.quantity, 0);

    // Calculate Stock Value (Total Sheets estimate)
    const totalStockQty = items.reduce((sum, i) => sum + i.closingStock, 0);

    return { totalItems, lowStockCount, monthlyIn, monthlyOut, totalStockQty };
  }, [items, transactions]);

  // --- CHART DATA GENERATION (Last 14 Days) ---
  const chartData = useMemo(() => {
    const days = 14;
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = d.getDate().toString();

        const dailyTrans = transactions.filter(t => t.date === dateStr);
        const inQty = dailyTrans.filter(t => t.type === 'IN').reduce((sum, t) => sum + t.quantity, 0);
        const outQty = dailyTrans.filter(t => t.type === 'OUT').reduce((sum, t) => sum + t.quantity, 0);

        data.push({ label: dayLabel, in: inQty, out: outQty });
    }
    return data;
  }, [transactions]);

  // SVG Chart Helper
  const maxVal = Math.max(...chartData.map(d => Math.max(d.in, d.out)), 10); // Minimum scale 10
  const chartHeight = 150;
  const chartWidth = 500; // arbitrary viewbox width
  const xStep = chartWidth / (chartData.length - 1);
  
  const createPath = (key: 'in' | 'out') => {
      return chartData.map((d, i) => {
          const x = i * xStep;
          const y = chartHeight - ((d[key] / maxVal) * chartHeight);
          return `${x},${y}`;
      }).join(' ');
  };

  const createAreaPath = (key: 'in' | 'out') => {
      const line = createPath(key);
      return `${line} ${chartWidth},${chartHeight} 0,${chartHeight}`;
  };

  // --- DONUT DATA (By GSM) ---
  const donutData = useMemo(() => {
      const gsmMap: Record<string, number> = {};
      items.forEach(i => {
          const key = i.gsm;
          if (!gsmMap[key]) gsmMap[key] = 0;
          gsmMap[key] += i.closingStock;
      });

      const total = Object.values(gsmMap).reduce((a, b) => a + b, 0);
      const sorted = Object.entries(gsmMap).sort((a, b) => b[1] - a[1]);
      
      let cumulativePercent = 0;
      const gradientParts: string[] = [];
      const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#94a3b8']; // Indigo, Pink, Amber, Emerald, Blue, Slate

      const legendData = sorted.map((entry, index) => {
          const percent = total > 0 ? (entry[1] / total) * 100 : 0;
          const color = colors[index % colors.length];
          const start = cumulativePercent;
          cumulativePercent += percent;
          gradientParts.push(`${color} ${start}% ${cumulativePercent}%`);
          
          return { label: entry[0], value: entry[1], color, percent };
      });

      const gradientString = gradientParts.length > 0 
        ? `conic-gradient(${gradientParts.join(', ')})` 
        : `conic-gradient(#e2e8f0 0% 100%)`; // Empty state

      return { gradientString, legendData };
  }, [items]);

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
        {/* Header Section - More Compact */}
        <div className="bg-white p-3 md:p-4 pb-12 md:pb-20 border-b border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-48 h-48 bg-pink-50 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/4 opacity-50 pointer-events-none"></div>
            
            <div className="relative z-10 flex justify-end items-center">
                <div className="text-right">
                    <p className="text-[10px] md:text-sm font-bold text-indigo-900 bg-white px-2 py-1 md:px-4 md:py-2 rounded-xl shadow-sm border border-indigo-100 flex items-center gap-2">
                         <Calendar className="w-3 h-3 md:w-4 md:h-4 text-indigo-500" />
                         {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                </div>
            </div>
        </div>

        {/* Negative Margin Layout for Cards - Adjusted spacing */}
        <div className="px-3 -mt-8 md:px-8 md:-mt-10 relative z-20">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
                
                {/* Card 1: Total Stock */}
                <div className="bg-white p-3 md:p-6 rounded-lg md:rounded-2xl shadow-lg border border-slate-100 flex flex-col justify-between h-24 md:h-36 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                    <div className="absolute right-0 top-0 p-2 md:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Layers className="w-12 h-12 md:w-24 md:h-24 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-[9px] md:text-sm font-bold text-slate-400 uppercase tracking-wider">Total Items</p>
                        <h3 className="text-xl md:text-3xl font-black text-slate-800 mt-0.5 md:mt-1">{metrics.totalItems}</h3>
                    </div>
                    <div className="flex items-center text-[9px] md:text-xs font-bold text-indigo-600 bg-indigo-50 w-fit px-1.5 py-0.5 md:px-2 md:py-1 rounded">
                        <Package className="w-3 h-3 mr-1" />
                        SKUs
                    </div>
                </div>

                {/* Card 2: Stock OUT */}
                <div className="bg-white p-3 md:p-6 rounded-lg md:rounded-2xl shadow-lg border border-slate-100 flex flex-col justify-between h-24 md:h-36 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                     <div className="absolute right-0 top-0 p-2 md:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-12 h-12 md:w-24 md:h-24 text-pink-600" />
                    </div>
                    <div>
                        <p className="text-[9px] md:text-sm font-bold text-slate-400 uppercase tracking-wider">Month Out</p>
                        <h3 className="text-xl md:text-3xl font-black text-slate-800 mt-0.5 md:mt-1">{metrics.monthlyOut.toLocaleString()}</h3>
                    </div>
                    <div className="flex items-center text-[9px] md:text-xs font-bold text-pink-600 bg-pink-50 w-fit px-1.5 py-0.5 md:px-2 md:py-1 rounded">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Sheets
                    </div>
                </div>

                {/* Card 3: Stock IN */}
                <div className="bg-white p-3 md:p-6 rounded-lg md:rounded-2xl shadow-lg border border-slate-100 flex flex-col justify-between h-24 md:h-36 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                    <div className="absolute right-0 top-0 p-2 md:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShoppingCart className="w-12 h-12 md:w-24 md:h-24 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-[9px] md:text-sm font-bold text-slate-400 uppercase tracking-wider">Month In</p>
                        <h3 className="text-xl md:text-3xl font-black text-slate-800 mt-0.5 md:mt-1">{metrics.monthlyIn.toLocaleString()}</h3>
                    </div>
                    <div className="flex items-center text-[9px] md:text-xs font-bold text-emerald-600 bg-emerald-50 w-fit px-1.5 py-0.5 md:px-2 md:py-1 rounded">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        Sheets
                    </div>
                </div>

                {/* Card 4: Alerts */}
                <div 
                    onClick={() => onNavigate(ViewMode.REORDER_ALERTS)}
                    className="bg-white p-3 md:p-6 rounded-lg md:rounded-2xl shadow-lg border border-slate-100 flex flex-col justify-between h-24 md:h-36 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
                >
                    <div className="absolute right-0 top-0 p-2 md:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AlertTriangle className="w-12 h-12 md:w-24 md:h-24 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-[9px] md:text-sm font-bold text-slate-400 uppercase tracking-wider">Alerts</p>
                        <h3 className={`text-xl md:text-3xl font-black mt-0.5 md:mt-1 ${metrics.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>{metrics.lowStockCount}</h3>
                    </div>
                    <div className={`flex items-center text-[9px] md:text-xs font-bold w-fit px-1.5 py-0.5 md:px-2 md:py-1 rounded ${metrics.lowStockCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {metrics.lowStockCount > 0 ? 'Action Reqd' : 'OK'}
                    </div>
                </div>

            </div>
        </div>

        {/* Charts Section */}
        <div className="px-3 mt-3 md:px-8 md:mt-8 grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
            
            {/* Main Movement Chart (Takes 2 columns) */}
            <div className="bg-white rounded-lg md:rounded-2xl shadow-lg border border-slate-100 p-3 md:p-6 lg:col-span-2">
                <div className="flex justify-between items-center mb-2 md:mb-6">
                    <h3 className="text-xs md:text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Activity className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" /> 14-Day Trends
                    </h3>
                    <div className="flex gap-2 md:gap-4 text-[9px] md:text-xs font-bold">
                        <span className="flex items-center gap-1 text-pink-500"><span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-pink-500"></span> Out</span>
                        <span className="flex items-center gap-1 text-emerald-500"><span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500"></span> In</span>
                    </div>
                </div>
                
                {/* SVG Chart - Reduced height for mobile */}
                <div className="h-32 md:h-64 w-full relative">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                        {/* Gradient Defs */}
                        <defs>
                            <linearGradient id="gradOut" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#ec4899" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                            </linearGradient>
                            <linearGradient id="gradIn" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                            </linearGradient>
                        </defs>

                        {/* Grid Lines */}
                        <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#e2e8f0" strokeWidth="1" />
                        <line x1="0" y1={chartHeight/2} x2={chartWidth} y2={chartHeight/2} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
                        <line x1="0" y1="0" x2={chartWidth} y2="0" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />

                        {/* Areas */}
                        <polygon points={createAreaPath('in')} fill="url(#gradIn)" />
                        <polygon points={createAreaPath('out')} fill="url(#gradOut)" />

                        {/* Lines */}
                        <polyline 
                            points={createPath('in')} 
                            fill="none" 
                            stroke="#10b981" 
                            strokeWidth="3" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                        />
                        <polyline 
                            points={createPath('out')} 
                            fill="none" 
                            stroke="#ec4899" 
                            strokeWidth="3" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                        />
                    </svg>
                    
                    {/* X-Axis Labels */}
                    <div className="flex justify-between mt-2 text-[9px] md:text-xs text-slate-400 font-medium">
                        {chartData.map((d, i) => (
                            // Show only some labels to prevent overcrowding
                            <span key={i} className={i % 3 === 0 ? 'opacity-100' : 'opacity-0'}>{d.label}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Donut Chart (Stock Breakdown) */}
            <div className="bg-white rounded-lg md:rounded-2xl shadow-lg border border-slate-100 p-3 md:p-6 flex flex-col">
                <h3 className="text-xs md:text-lg font-bold text-slate-800 mb-2 md:mb-6">Stock Distribution</h3>
                
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div 
                        className="w-24 h-24 md:w-48 md:h-48 rounded-full shadow-inner relative"
                        style={{ background: donutData.gradientString }}
                    >
                         {/* Inner White Circle */}
                         <div className="absolute inset-3 md:inset-4 bg-white rounded-full flex items-center justify-center flex-col">
                            <span className="text-[9px] md:text-xs text-slate-400 font-bold uppercase">Total</span>
                            <span className="text-sm md:text-2xl font-black text-slate-800">{metrics.totalStockQty.toLocaleString()}</span>
                         </div>
                    </div>

                    <div className="mt-3 md:mt-6 w-full space-y-1 md:space-y-2 max-h-24 md:max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {donutData.legendData.map((d, i) => (
                            <div key={i} className="flex justify-between items-center text-[10px] md:text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 md:w-3 md:h-3 rounded-full" style={{ backgroundColor: d.color }}></span>
                                    <span className="font-medium text-slate-600">{d.label} GSM</span>
                                </div>
                                <span className="font-bold text-slate-800">{d.percent.toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="px-3 mt-3 md:px-8 md:mt-8 pb-4 md:pb-12 grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
            
            {/* Recent Table */}
            <div className="bg-white rounded-lg md:rounded-2xl shadow-lg border border-slate-100 overflow-hidden lg:col-span-2">
                <div className="p-3 md:p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xs md:text-lg font-bold text-slate-800">Recent Transactions</h3>
                    <button onClick={() => onNavigate(ViewMode.STOCK_OUT_LOGS)} className="text-[10px] md:text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                        View All <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-[10px] md:text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-semibold">
                            <tr>
                                <th className="px-3 py-2 md:px-6 md:py-4">Type</th>
                                <th className="px-3 py-2 md:px-6 md:py-4">Size</th>
                                <th className="px-3 py-2 md:px-6 md:py-4">Qty</th>
                                <th className="px-3 py-2 md:px-6 md:py-4">Details</th>
                                <th className="px-3 py-2 md:px-6 md:py-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {transactions.slice(0, 5).map(t => (
                                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-3 py-2 md:px-6 md:py-4">
                                        <span className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded-md text-[9px] md:text-xs font-bold 
                                            ${t.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : 
                                              t.type === 'OUT' ? 'bg-pink-100 text-pink-700' : 
                                              'bg-amber-100 text-amber-700'}`}>
                                            {t.type}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 md:px-6 md:py-4 font-bold text-slate-700">{t.size} <span className="text-slate-400 font-normal block md:inline text-[9px] md:text-xs">({t.gsm})</span></td>
                                    <td className="px-3 py-2 md:px-6 md:py-4 font-mono font-bold text-slate-600">{t.quantity}</td>
                                    <td className="px-3 py-2 md:px-6 md:py-4 text-slate-500 truncate max-w-[80px] md:max-w-[150px]">{t.company || t.workName || '-'}</td>
                                    <td className="px-3 py-2 md:px-6 md:py-4 text-slate-400 text-[9px] md:text-xs">{t.date}</td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">No recent activity</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg md:rounded-2xl shadow-lg p-3 md:p-6 text-white flex flex-col justify-between">
                <div>
                    <h3 className="text-sm md:text-xl font-bold mb-1 md:mb-2">Quick Access</h3>
                    <p className="text-slate-400 text-[10px] md:text-sm mb-3 md:mb-6">Common tasks and tools.</p>
                    
                    <div className="space-y-2 md:space-y-3">
                        <button 
                            onClick={() => onNavigate(ViewMode.INVENTORY)}
                            className="w-full bg-white/10 hover:bg-white/20 p-2 md:p-3 rounded-md md:rounded-xl flex items-center gap-3 transition-colors backdrop-blur-sm"
                        >
                            <div className="p-1 md:p-2 bg-indigo-500 rounded-md md:rounded-lg"><Layers className="w-3 h-3 md:w-5 md:h-5 text-white" /></div>
                            <span className="font-bold text-xs md:text-base">Inventory</span>
                        </button>

                        <button 
                             onClick={() => onNavigate(ViewMode.JOB_CARDS)}
                             className="w-full bg-white/10 hover:bg-white/20 p-2 md:p-3 rounded-md md:rounded-xl flex items-center gap-3 transition-colors backdrop-blur-sm"
                        >
                            <div className="p-1 md:p-2 bg-pink-500 rounded-md md:rounded-lg"><Package className="w-3 h-3 md:w-5 md:h-5 text-white" /></div>
                            <span className="font-bold text-xs md:text-base">Job Card</span>
                        </button>

                         <button 
                             onClick={() => onNavigate(ViewMode.FORECAST)}
                             className="w-full bg-white/10 hover:bg-white/20 p-2 md:p-3 rounded-md md:rounded-xl flex items-center gap-3 transition-colors backdrop-blur-sm"
                        >
                            <div className="p-1 md:p-2 bg-emerald-500 rounded-md md:rounded-lg"><TrendingUp className="w-3 h-3 md:w-5 md:h-5 text-white" /></div>
                            <span className="font-bold text-xs md:text-base">Forecast</span>
                        </button>
                    </div>
                </div>
                
                <div className="mt-4 md:mt-8 pt-3 md:pt-6 border-t border-white/10">
                     <p className="text-[9px] md:text-xs text-slate-500">System Status</p>
                     <div className="flex items-center gap-2 mt-1 md:mt-2">
                         <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                         <span className="text-[10px] md:text-sm font-bold text-emerald-400">Operational</span>
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;