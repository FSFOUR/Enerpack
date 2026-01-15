import React, { useMemo } from 'react';
import { InventoryItem, StockTransaction, ViewMode, User } from '../types';
import { 
  Package, 
  Layers,
  TrendingUp,
  AlertTriangle,
  Search,
  Bell,
  MoreVertical,
  ArrowUpRight,
  Lock
} from 'lucide-react';

interface DashboardProps {
  items: InventoryItem[];
  transactions: StockTransaction[];
  onNavigate: (mode: ViewMode) => void;
  user: User;
}

const StatCard = ({ title, value, icon: Icon, iconBg, trend, statusText, onClick }: any) => (
  <button 
    onClick={onClick}
    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all text-left w-full"
  >
    <div className="flex flex-col">
      <p className="text-slate-400 text-xs font-semibold mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-slate-800 tabular-nums">{value}</h3>
      {trend && (
        <p className="text-emerald-500 text-xs font-bold mt-2 flex items-center gap-1">
          <ArrowUpRight className="w-3 h-3" /> {trend}%
        </p>
      )}
      {statusText && (
        <p className="text-rose-500 text-[10px] font-bold mt-2 flex items-center gap-1 uppercase tracking-wider">
          <AlertTriangle className="w-3 h-3" /> {statusText}
        </p>
      )}
    </div>
    <div className={`p-4 rounded-2xl ${iconBg} bg-opacity-10 text-opacity-100`}>
      <Icon className="w-6 h-6" />
    </div>
  </button>
);

const Dashboard: React.FC<DashboardProps> = ({ items, transactions, onNavigate, user }) => {
  
  const metrics = useMemo(() => {
    const totalProducts = items.length;
    const totalStock = items.reduce((sum, i) => sum + i.closingStock, 0);
    const lowStockItems = items.filter(i => i.closingStock < (i.minStock || 0)).length;
    
    const now = new Date();
    const monthlyOut = transactions
      .filter(t => t.type === 'OUT' && new Date(t.date).getMonth() === now.getMonth())
      .reduce((sum, t) => sum + t.quantity, 0);

    const gsmGroups = items.reduce((acc: Record<string, number>, item) => {
      const g = item.gsm;
      acc[g] = (acc[g] || 0) + 1;
      return acc;
    }, {});

    return { 
      totalProducts, 
      totalStock, 
      lowStockItems, 
      monthlyOut,
      gsmGroups
    };
  }, [items, transactions]);

  const trendPoints = [
    { x: 0, y: 150 },
    { x: 160, y: 150 },
    { x: 320, y: 150 },
    { x: 480, y: 150 },
    { x: 640, y: 150 },
    { x: 800, y: 40 },
  ];

  const polylinePoints = trendPoints.map(p => `${p.x},${p.y}`).join(' ');
  const areaPoints = `0,200 ${polylinePoints} 800,200`;

  const isReadOnly = user.role === 'USER';

  return (
    <div className="h-full bg-[#f8fafc] overflow-y-auto px-6 py-6 font-sans relative">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Bar */}
        <div className="flex justify-between items-center mb-4">
           <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase brand-font">Welcome {user.name}</h1>
                {isReadOnly && (
                  <div className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-slate-200">
                    <Lock className="w-3 h-3" /> Read Only
                  </div>
                )}
              </div>
              <p className="text-slate-400 text-sm font-medium">Verified by {user.name} — Current Status</p>
           </div>
           <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search Analytics..." 
                  className="bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
              <button className="bg-white border border-slate-200 p-2 rounded-2xl text-slate-400 hover:text-slate-800">
                <Bell className="w-5 h-5" />
              </button>
           </div>
        </div>

        {/* Primary Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Products" 
            value={metrics.totalProducts} 
            icon={Package} 
            iconBg="bg-emerald-500 text-emerald-500"
            onClick={() => onNavigate(ViewMode.INVENTORY)}
          />
          <StatCard 
            title="Total Stock" 
            value={metrics.totalStock.toLocaleString()} 
            icon={Layers} 
            iconBg="bg-blue-500 text-blue-500"
            onClick={() => onNavigate(ViewMode.INVENTORY)}
          />
          <StatCard 
            title="Monthly Out" 
            value={metrics.monthlyOut.toLocaleString()} 
            icon={TrendingUp} 
            iconBg="bg-indigo-500 text-indigo-500"
            trend="5.2"
            onClick={() => onNavigate(ViewMode.STOCK_OUT_LOGS)}
          />
          <StatCard 
            title="Out of Stock" 
            value={metrics.lowStockItems} 
            icon={AlertTriangle} 
            iconBg="bg-rose-500 text-rose-500"
            statusText={metrics.lowStockItems > 0 ? "Action Needed" : ""}
            onClick={() => onNavigate(ViewMode.REORDER_ALERTS)}
          />
        </div>

        {/* Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Movement Trends Panel */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-slate-800">Movement Trends</h3>
              <button className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">Last 6 Months</button>
            </div>
            
            <div className="relative h-[250px] w-full">
              <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
                {[0, 1, 2, 3].map(i => <div key={i} className="w-full h-px border-b border-dashed border-slate-100"></div>)}
              </div>
              
              <svg className="w-full h-[200px]" viewBox="0 0 800 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points={areaPoints} fill="url(#areaGradient)" />
                <polyline points={polylinePoints} fill="none" stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                {trendPoints.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke="#0ea5e9" strokeWidth="2" />
                ))}
              </svg>
              
              <div className="flex justify-between text-[10px] font-bold text-slate-300 mt-4 px-2">
                {['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => <span key={m}>{m}</span>)}
              </div>
            </div>
          </div>

          {/* Inventory Split Panel */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-slate-800">Inventory Split</h3>
              <button className="text-slate-400 hover:text-slate-800"><MoreVertical className="w-4 h-4" /></button>
            </div>
            
            <div className="flex flex-col items-center">
               <div className="relative w-48 h-48 mb-8">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#0ea5e9" strokeWidth="8" strokeDasharray="110 251.2" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#475569" strokeWidth="8" strokeDasharray="50 251.2" strokeDashoffset="-110" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="8" strokeDasharray="25 251.2" strokeDashoffset="-160" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="8" strokeDasharray="25 251.2" strokeDashoffset="-185" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-slate-800">{metrics.totalProducts}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Items</span>
                  </div>
               </div>
               
               <div className="w-full space-y-3 px-2">
                  <LegendItem color="bg-blue-500" label="280 GSM" value="44%" />
                  <LegendItem color="bg-slate-600" label="200 GSM" value="21%" />
                  <LegendItem color="bg-orange-400" label="130 GSM" value="9%" />
                  <LegendItem color="bg-emerald-500" label="140GYT GSM" value="9%" />
               </div>
            </div>
          </div>
        </div>

        {/* Bottom Panel */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
           <h3 className="font-bold text-slate-800 mb-6">Top Items by Sales (Out)</h3>
           <div className="space-y-6">
              <TopItemRow label="54" value="600" percentage={95} />
              <TopItemRow label="56" value="420" percentage={70} />
              <TopItemRow label="60" value="210" percentage={35} />
           </div>
        </div>
      </div>
    </div>
  );
};

const LegendItem = ({ color, label, value }: any) => (
  <div className="flex justify-between items-center text-xs">
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
      <span className="font-semibold text-slate-600">{label}</span>
    </div>
    <span className="font-black text-slate-800">{value}</span>
  </div>
);

const TopItemRow = ({ label, value, percentage }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center text-xs font-bold">
      <span className="text-slate-800">{label}</span>
      <span className="text-slate-800">{value}</span>
    </div>
    <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
      <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
    </div>
  </div>
);

export default Dashboard;