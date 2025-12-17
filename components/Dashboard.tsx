
import React, { useMemo } from 'react';
import { InventoryItem, StockTransaction, ViewMode } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Package, 
  Search, 
  Bell,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Layers
} from 'lucide-react';

interface DashboardProps {
  items: InventoryItem[];
  transactions: StockTransaction[];
  onNavigate: (mode: ViewMode) => void;
}

// Simple Reusable Card
const StatCard = ({ title, value, icon: Icon, colorClass, bgClass, trend }: any) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
          <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
          {trend && (
             <div className="flex items-center gap-1 mt-2 text-xs font-bold text-emerald-600">
                <ArrowUpRight className="w-3 h-3" />
                <span>{trend}</span>
             </div>
          )}
      </div>
      <div className={`p-3 rounded-xl ${bgClass}`}>
          <Icon className={`w-6 h-6 ${colorClass}`} />
      </div>
  </div>
);

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

    const monthlyOut = thisMonthTrans
        .filter(t => t.type === 'OUT')
        .reduce((sum, t) => sum + t.quantity, 0);

    const totalStockQty = items.reduce((sum, i) => sum + i.closingStock, 0);

    return { totalItems, lowStockCount, monthlyOut, totalStockQty };
  }, [items, transactions]);

  // --- CHART DATA GENERATION (Last 7 Months for smooth curve) ---
  const chartData = useMemo(() => {
    const months = 6;
    const data = [];
    const today = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthLabel = d.toLocaleString('default', { month: 'short' });
        
        // Mock data logic for better visualization since we might not have 6 months of history
        // In real app, filter transactions by month
        const monthTrans = transactions.filter(t => {
            const td = new Date(t.date);
            return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
        });
        
        const outQty = monthTrans.filter(t => t.type === 'OUT').reduce((sum, t) => sum + t.quantity, 0);
        
        data.push({ label: monthLabel, value: outQty });
    }
    return data;
  }, [transactions]);

  // SVG Line Chart Construction
  const maxVal = Math.max(...chartData.map(d => d.value), 10);
  const chartHeight = 200;
  const chartWidth = 600;
  const points = chartData.map((d, i) => {
      const x = (i / (chartData.length - 1)) * chartWidth;
      const y = chartHeight - ((d.value / maxVal) * chartHeight * 0.8) - 20; // 20px padding
      return `${x},${y}`;
  }).join(' ');

  // Create a smooth curve
  const smoothPath = (pointsStr: string) => {
      // Basic smoothing implies bezier curves, for simplicity we use straight lines in SVG polyline for now 
      // or implement a Catmull-Rom spline function if needed. 
      // Let's stick to standard polyline for stability but add styling.
      return pointsStr;
  };

  // --- TOP ITEMS ---
  const topItems = useMemo(() => {
      const itemCounts: Record<string, number> = {};
      transactions.forEach(t => {
          if(t.type === 'OUT') {
              const key = t.size; // Simple key
              itemCounts[key] = (itemCounts[key] || 0) + t.quantity;
          }
      });
      return Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, val]) => ({ name, val }));
  }, [transactions]);

  const maxItemVal = topItems.length > 0 ? topItems[0].val : 1;

  // --- DONUT DATA ---
  const donutSegments = useMemo(() => {
      const gsmCounts: Record<string, number> = {};
      items.forEach(i => {
          gsmCounts[i.gsm] = (gsmCounts[i.gsm] || 0) + 1; // Count SKUs per GSM
      });
      const total = items.length || 1;
      let start = 0;
      const colors = ['#0ea5e9', '#64748b', '#f59e0b', '#10b981', '#ec4899'];
      
      return Object.entries(gsmCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4) // Top 4 GSMs
        .map(([gsm, count], idx) => {
            const percent = (count / total) * 100;
            const seg = { gsm, percent, start, color: colors[idx % colors.length] };
            start += percent;
            return seg;
        });
  }, [items]);

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
        
        {/* Header Section */}
        <div className="bg-white px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-20">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Welcome Admin !</h1>
                <p className="text-slate-400 text-xs mt-1">Here is your inventory overview.</p>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-enerpack-500 transition-all"
                    />
                </div>
                <button className="p-2 relative bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500">
                    <Bell className="w-5 h-5" />
                    {metrics.lowStockCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
                </button>
            </div>
        </div>

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
            
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Products" 
                    value={metrics.totalItems} 
                    icon={Package} 
                    colorClass="text-emerald-600" 
                    bgClass="bg-emerald-50"
                />
                <StatCard 
                    title="Total Stock" 
                    value={metrics.totalStockQty.toLocaleString()} 
                    icon={Layers} 
                    colorClass="text-blue-600" 
                    bgClass="bg-blue-50"
                />
                <StatCard 
                    title="Monthly Out" 
                    value={metrics.monthlyOut.toLocaleString()} 
                    icon={TrendingUp} 
                    colorClass="text-indigo-600" 
                    bgClass="bg-indigo-50"
                    trend="+5.2%"
                />
                <div 
                    onClick={() => onNavigate(ViewMode.REORDER_ALERTS)}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-red-100 flex items-start justify-between cursor-pointer hover:shadow-md transition-shadow group relative overflow-hidden"
                >
                    <div className="absolute right-0 top-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <p className="text-slate-500 text-sm font-medium mb-1">Out of Stock</p>
                        <h3 className="text-3xl font-bold text-slate-800">{metrics.lowStockCount}</h3>
                        <p className="text-xs text-red-500 font-bold mt-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Action Needed
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-red-100 relative z-10">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                </div>
            </div>

            {/* Middle Section: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Movement Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-slate-800">Movement Trends</h3>
                        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border">Last 6 Months</span>
                    </div>
                    
                    <div className="h-64 w-full relative">
                        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                            {/* Grid Lines */}
                            <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#e2e8f0" strokeWidth="1" />
                            <line x1="0" y1={chartHeight/2} x2={chartWidth} y2={chartHeight/2} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
                            <line x1="0" y1="0" x2={chartWidth} y2="0" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />

                            {/* Line */}
                            <polyline 
                                points={points} 
                                fill="none" 
                                stroke="#0ea5e9" 
                                strokeWidth="4" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                            />
                            
                            {/* Area Gradient */}
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2"/>
                                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0"/>
                                </linearGradient>
                            </defs>
                            <polygon 
                                points={`${points} ${chartWidth},${chartHeight} 0,${chartHeight}`} 
                                fill="url(#chartGradient)" 
                            />

                            {/* Points */}
                            {chartData.map((d, i) => {
                                const x = (i / (chartData.length - 1)) * chartWidth;
                                const y = chartHeight - ((d.value / maxVal) * chartHeight * 0.8) - 20;
                                return (
                                    <circle key={i} cx={x} cy={y} r="4" fill="white" stroke="#0ea5e9" strokeWidth="2" />
                                )
                            })}
                        </svg>
                        
                        {/* Labels */}
                        <div className="flex justify-between mt-4">
                            {chartData.map((d, i) => (
                                <span key={i} className="text-xs text-slate-400 font-medium">{d.label}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Inventory Value / Pie */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-slate-800">Inventory Split</h3>
                        <MoreVertical className="w-5 h-5 text-slate-400 cursor-pointer" />
                    </div>
                    
                    <div className="flex-1 flex items-center justify-center relative">
                        {/* CSS Conic Gradient for Donut */}
                        <div 
                            className="w-48 h-48 rounded-full relative"
                            style={{ 
                                background: `conic-gradient(
                                    ${donutSegments.map(s => `${s.color} ${s.start}% ${s.start + s.percent}%`).join(', ')}
                                )` 
                            }}
                        >
                            <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-slate-800">{metrics.totalItems}</span>
                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Items</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        {donutSegments.map((seg, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }}></span>
                                    <span className="text-slate-600 font-medium">{seg.gsm} GSM</span>
                                </div>
                                <span className="font-bold text-slate-800">{Math.round(seg.percent)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Section: Top Stores (Items) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* This could be another widget or empty space, expanding Top Items to full width if needed */}
                 <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg text-slate-800 mb-6">Top Items by Sales (Out)</h3>
                    
                    <div className="space-y-5">
                        {topItems.map((item, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <div className="w-full">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-bold text-slate-700">{item.name}</span>
                                        <span className="text-sm font-bold text-slate-900">{item.val}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-enerpack-500 rounded-full" 
                                            style={{ width: `${(item.val / maxItemVal) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {topItems.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No data available.</p>}
                    </div>
                 </div>
            </div>

        </div>
    </div>
  );
};

export default Dashboard;
