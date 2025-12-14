
import React, { useState, useEffect, useRef } from 'react';
import InventoryTable from './components/InventoryTable';
import JobCardGenerator from './components/JobCardGenerator';
import TransactionHistory from './components/TransactionHistory';
import PendingWorks from './components/PendingWorks';
import ReorderPage from './components/ReorderPage';
import PaperCalculator from './components/PaperCalculator';
import ForecastPage from './components/ForecastPage';
import Dashboard from './components/Dashboard';
import { InventoryItem, ViewMode, StockTransaction, AppNotification } from './types';
import { ClipboardList, LayoutGrid, Archive, History, Clock, AlertTriangle, FileClock, Calculator, TrendingUp, LayoutDashboard, Menu, X, Lock, Unlock, Bell } from 'lucide-react';

// Seed data
const INITIAL_DATA: InventoryItem[] = [
  { id: '1', size: '54', gsm: '280', closingStock: 1459, minStock: 100, remarks: '' },
  { id: '2', size: '56', gsm: '280', closingStock: 1463, minStock: 100, remarks: '' },
  { id: '3', size: '58', gsm: '280', closingStock: 2467, minStock: 100, remarks: '' },
  { id: '4', size: '64*67', gsm: '280', closingStock: 44.5, minStock: 50, remarks: '' },
  { id: '5', size: '65*72', gsm: '280', closingStock: 0, minStock: 50, remarks: '' },
  { id: '6', size: '54', gsm: '200', closingStock: 1356, minStock: 100, remarks: '' },
  { id: '7', size: '56', gsm: '200', closingStock: 2588, minStock: 100, remarks: '' },
  { id: '8', size: '65*88.5', gsm: '150', closingStock: 88, minStock: 50, remarks: '' },
  { id: '9', size: '56*83', gsm: 'GYT', closingStock: 83, minStock: 50, remarks: 'Sreepathi' },
];

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Admin Logic
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Real-time Sync Channel
  const channelRef = useRef<BroadcastChannel | null>(null);

  // State for Inventory
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('enerpack_inventory_v3'); 
    if (saved) return JSON.parse(saved);
    const savedV2 = localStorage.getItem('enerpack_inventory_v2');
    if (savedV2) {
      const parsedV2 = JSON.parse(savedV2);
      return parsedV2.map((item: any) => ({ ...item, minStock: 0 }));
    }
    return INITIAL_DATA;
  });

  // State for Transactions
  const [transactions, setTransactions] = useState<StockTransaction[]>(() => {
    const saved = localStorage.getItem('enerpack_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Persistence & Sync ---

  useEffect(() => {
    // Initialize Broadcast Channel
    channelRef.current = new BroadcastChannel('enerpack_updates');
    
    channelRef.current.onmessage = (event) => {
      const { type, message } = event.data;
      
      if (type === 'REFRESH_DATA') {
        // Reload data from local storage
        const savedInv = localStorage.getItem('enerpack_inventory_v3');
        if (savedInv) setInventory(JSON.parse(savedInv));

        const savedTrans = localStorage.getItem('enerpack_transactions');
        if (savedTrans) setTransactions(JSON.parse(savedTrans));

        if (message) addNotification(message, 'info');
      }
    };

    return () => {
      channelRef.current?.close();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('enerpack_inventory_v3', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('enerpack_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // --- Helper Functions ---

  const notifyPeers = (message: string) => {
    channelRef.current?.postMessage({
      type: 'REFRESH_DATA',
      message
    });
    addNotification(message, 'success');
  };

  const addNotification = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const id = crypto.randomUUID();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'admin') {
      setIsAdmin(true);
      setShowLoginModal(false);
      setPasswordInput('');
      addNotification("Logged in as Admin", 'success');
    } else {
      alert("Incorrect password");
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    addNotification("Logged out", 'info');
  };

  // --- Data Handlers ---

  const handleUpdateStock = (id: string, delta: number) => {
    setInventory(prev => {
      const newData = prev.map(item => {
        if (item.id === id) {
          return { ...item, closingStock: Math.max(0, item.closingStock + delta) };
        }
        return item;
      });
      localStorage.setItem('enerpack_inventory_v3', JSON.stringify(newData));
      return newData;
    });
    setTimeout(() => notifyPeers(`Stock updated`), 50);
  };

  const handleUpdateItem = (updatedItem: InventoryItem) => {
    setInventory(prev => {
      const newData = prev.map(item => item.id === updatedItem.id ? updatedItem : item);
      localStorage.setItem('enerpack_inventory_v3', JSON.stringify(newData));
      return newData;
    });
    setTimeout(() => notifyPeers(`Item ${updatedItem.size} updated`), 50);
  };

  const handleAddItem = (newItem: Omit<InventoryItem, 'id'>) => {
    const item: InventoryItem = { ...newItem, id: crypto.randomUUID() };
    setInventory(prev => {
      const newData = [item, ...prev];
      localStorage.setItem('enerpack_inventory_v3', JSON.stringify(newData));
      return newData;
    });
    setTimeout(() => notifyPeers(`New item added: ${newItem.size}`), 50);
  };

  const handleBulkUpdate = (items: InventoryItem[]) => {
      setInventory(items);
      localStorage.setItem('enerpack_inventory_v3', JSON.stringify(items));
      notifyPeers("Bulk inventory imported");
  };

  const handleRecordTransaction = (t: Omit<StockTransaction, 'id' | 'timestamp'>) => {
    const newTransaction: StockTransaction = { ...t, id: crypto.randomUUID(), timestamp: Date.now() };
    setTransactions(prev => {
      const newData = [newTransaction, ...prev];
      localStorage.setItem('enerpack_transactions', JSON.stringify(newData));
      return newData;
    });
  };

  const handleUpdateTransactionStatus = (id: string, newStatus: string) => {
    setTransactions(prev => {
      const newData = prev.map(t => t.id === id ? { ...t, status: newStatus } : t);
      localStorage.setItem('enerpack_transactions', JSON.stringify(newData));
      return newData;
    });
    setTimeout(() => notifyPeers("Work status updated"), 50);
  };

  const handleUpdateTransactionPriority = (id: string, newPriority: string) => {
    setTransactions(prev => {
      const newData = prev.map(t => t.id === id ? { ...t, priority: newPriority } : t);
      localStorage.setItem('enerpack_transactions', JSON.stringify(newData));
      return newData;
    });
    setTimeout(() => notifyPeers("Work priority updated"), 50);
  };

  const handleNavigate = (mode: ViewMode) => {
    setViewMode(mode);
    setIsMobileMenuOpen(false);
  };

  // Count alerts
  const alertCount = inventory.filter(i => i.closingStock < (i.minStock || 0)).length;

  const NavButton = ({ mode, icon: Icon, label, alertCount }: { mode: ViewMode, icon: any, label: string, alertCount?: number }) => (
    <button 
      onClick={() => handleNavigate(mode)}
      className={`p-3 rounded-xl transition-all duration-300 group relative flex items-center justify-center md:block w-full md:w-auto
        ${viewMode === mode 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 scale-105' 
          : 'text-slate-400 hover:text-white hover:bg-enerpack-800'}`}
      title={label}
    >
      <div className="relative">
        <Icon className="w-6 h-6" />
        {alertCount !== undefined && alertCount > 0 && (
           <span className="absolute -top-2 -right-2 bg-white text-red-600 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-red-500 shadow-sm">
             {alertCount}
           </span>
        )}
      </div>
      <span className="ml-3 md:ml-0 md:absolute md:left-16 md:bg-slate-900 md:text-white md:text-xs md:px-2 md:py-1 md:rounded md:opacity-0 md:group-hover:opacity-100 md:transition-opacity md:pointer-events-none md:whitespace-nowrap md:z-50 md:shadow-md font-bold md:font-normal block md:hidden">
        {label}
      </span>
    </button>
  );

  const SidebarContent = () => (
    <div className="flex flex-col items-center gap-2 md:gap-6 w-full">
        <div className="text-white font-black text-xl md:text-xs text-center leading-tight mb-6 md:mb-4 tracking-wider py-4 md:py-0 border-b border-white/10 md:border-none w-full md:w-auto">
          ENER<br className="hidden md:block"/>PACK
        </div>
        
        <div className="flex flex-col gap-2 w-full px-4 md:px-0">
          <NavButton mode={ViewMode.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
          <NavButton mode={ViewMode.INVENTORY} icon={LayoutGrid} label="Inventory" />
          <NavButton mode={ViewMode.STOCK_IN_LOGS} icon={Archive} label="Stock In Logs" />
          <NavButton mode={ViewMode.STOCK_OUT_LOGS} icon={History} label="Stock Out Logs" />

          <div className="h-px bg-white/10 my-1 w-full"></div>

          <NavButton mode={ViewMode.PENDING_WORKS} icon={Clock} label="Pending Works" />
          <NavButton mode={ViewMode.REORDER_ALERTS} icon={AlertTriangle} label="Reorder Alerts" alertCount={alertCount} />
          <NavButton mode={ViewMode.REORDER_LOGS} icon={FileClock} label="Reorder History" />
          <NavButton mode={ViewMode.FORECAST} icon={TrendingUp} label="Forecast" />

          <div className="h-px bg-white/10 my-1 w-full"></div>

          <NavButton mode={ViewMode.JOB_CARDS} icon={ClipboardList} label="Job Cards" />
          <NavButton mode={ViewMode.PAPER_CALCULATOR} icon={Calculator} label="Paper Calculator" />
          
          <div className="h-px bg-white/10 my-1 w-full"></div>
          
          <button 
            onClick={() => isAdmin ? handleLogout() : setShowLoginModal(true)}
            className={`p-3 rounded-xl transition-all duration-300 w-full md:w-auto flex items-center justify-center
              ${isAdmin ? 'text-green-400 hover:text-green-300' : 'text-slate-500 hover:text-white'}`}
            title={isAdmin ? "Logout Admin" : "Admin Login"}
          >
             {isAdmin ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
             <span className="ml-3 md:hidden font-bold">{isAdmin ? 'Logout' : 'Admin'}</span>
          </button>
        </div>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-slate-100 flex flex-col md:flex-row overflow-hidden font-sans print:overflow-visible print:h-auto print:block relative">
      
      {/* Toast Notifications Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className={`pointer-events-auto px-4 py-3 rounded shadow-lg text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-right-5 duration-300
            ${n.type === 'success' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
             <Bell className="w-4 h-4 fill-current" />
             {n.message}
          </div>
        ))}
      </div>

      {/* Admin Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleLogin} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-200">
             <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
               <Lock className="w-5 h-5 text-indigo-600" /> Admin Access
             </h3>
             <input 
               type="password" 
               autoFocus
               placeholder="Enter Password"
               className="w-full p-3 border rounded-lg mb-4 outline-none focus:ring-2 focus:ring-indigo-500"
               value={passwordInput}
               onChange={e => setPasswordInput(e.target.value)}
             />
             <div className="flex gap-2 justify-end">
               <button type="button" onClick={() => setShowLoginModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
               <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">Login</button>
             </div>
          </form>
        </div>
      )}

      {/* Mobile Top Bar */}
      <div className="md:hidden bg-enerpack-900 text-white p-4 flex justify-between items-center z-40 shadow-md print:hidden">
         <div className="font-black text-lg tracking-wider">ENERPACK</div>
         <button onClick={() => setIsMobileMenuOpen(true)} className="p-1">
            <Menu className="w-6 h-6" />
         </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex print:hidden">
          <div className="bg-enerpack-900 w-64 h-full shadow-2xl overflow-y-auto relative">
             <button 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
             >
                <X className="w-6 h-6" />
             </button>
             <SidebarContent />
          </div>
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
        </div>
      )}

      {/* Desktop Sidebar Navigation */}
      <div className="hidden md:flex w-20 bg-enerpack-900 flex-col items-center py-6 gap-6 shadow-2xl z-30 overflow-y-auto border-r border-white/5 print:hidden">
        <SidebarContent />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative print:overflow-visible print:h-auto">
        {viewMode === ViewMode.DASHBOARD && (
            <main className="flex-1 h-full overflow-hidden print:overflow-visible print:h-auto">
                <Dashboard 
                    items={inventory} 
                    transactions={transactions} 
                    onNavigate={handleNavigate} 
                />
            </main>
        )}

        {viewMode === ViewMode.INVENTORY && (
           <main className="flex-1 p-2 md:p-6 h-full overflow-hidden print:overflow-visible print:h-auto print:p-0">
             <InventoryTable 
               items={inventory} 
               transactions={transactions}
               onUpdateStock={handleUpdateStock} 
               onAddItem={handleAddItem}
               onRecordTransaction={handleRecordTransaction}
               onBulkUpdate={handleBulkUpdate}
               onUpdateItem={handleUpdateItem}
               isAdmin={isAdmin}
             />
           </main>
        )}

        {viewMode === ViewMode.JOB_CARDS && (
          <main className="flex-1 h-full overflow-hidden bg-white print:overflow-visible print:h-auto">
            <JobCardGenerator onBack={() => handleNavigate(ViewMode.INVENTORY)} />
          </main>
        )}

        {viewMode === ViewMode.PENDING_WORKS && (
           <main className="flex-1 h-full overflow-hidden bg-white p-2 md:p-6 print:overflow-visible print:h-auto">
             <PendingWorks 
                transactions={transactions} 
                onBack={() => handleNavigate(ViewMode.INVENTORY)}
                onUpdateStatus={handleUpdateTransactionStatus}
                onUpdatePriority={handleUpdateTransactionPriority}
                isAdmin={isAdmin}
             />
           </main>
        )}

        {viewMode === ViewMode.REORDER_ALERTS && (
           <main className="flex-1 h-full overflow-hidden bg-white p-2 md:p-6 print:overflow-visible print:h-auto">
             <ReorderPage 
                items={inventory} 
                onBack={() => handleNavigate(ViewMode.INVENTORY)}
                onUpdateItem={handleUpdateItem}
                onRecordTransaction={handleRecordTransaction}
                isAdmin={isAdmin}
             />
           </main>
        )}

        {viewMode === ViewMode.REORDER_LOGS && (
            <main className="flex-1 h-full overflow-hidden bg-white p-2 md:p-6 print:overflow-visible print:h-auto">
                <TransactionHistory type="REORDER" transactions={transactions} onBack={() => handleNavigate(ViewMode.INVENTORY)} />
            </main>
        )}

        {viewMode === ViewMode.FORECAST && (
            <main className="flex-1 h-full overflow-hidden bg-white print:overflow-visible print:h-auto">
                <ForecastPage transactions={transactions} onBack={() => handleNavigate(ViewMode.INVENTORY)} />
            </main>
        )}

        {viewMode === ViewMode.PAPER_CALCULATOR && (
            <main className="flex-1 h-full overflow-hidden bg-white print:overflow-visible print:h-auto">
                <PaperCalculator onBack={() => handleNavigate(ViewMode.INVENTORY)} />
            </main>
        )}

        {viewMode === ViewMode.STOCK_IN_LOGS && (
            <main className="flex-1 h-full overflow-hidden bg-white p-2 md:p-6 print:overflow-visible print:h-auto">
                <TransactionHistory type="IN" transactions={transactions} onBack={() => handleNavigate(ViewMode.INVENTORY)} />
            </main>
        )}

        {viewMode === ViewMode.STOCK_OUT_LOGS && (
            <main className="flex-1 h-full overflow-hidden bg-white p-2 md:p-6 print:overflow-visible print:h-auto">
                <TransactionHistory type="OUT" transactions={transactions} onBack={() => handleNavigate(ViewMode.INVENTORY)} />
            </main>
        )}
      </div>
    </div>
  );
};

export default App;
