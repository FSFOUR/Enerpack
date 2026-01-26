import React, { useState, useEffect, useCallback, useRef } from 'react';
import InventoryTable from './components/InventoryTable';
import Dashboard from './components/Dashboard';
import TransactionHistory from './components/TransactionHistory';
import PendingWorks from './components/PendingWorks';
import ReorderPage from './components/ReorderPage';
import PaperCalculator from './components/PaperCalculator';
import ForecastPage from './components/ForecastPage';
import JobCardGenerator from './components/JobCardGenerator';
import InventoryTracker from './components/InventoryTracker';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import { InventoryItem, ViewMode, StockTransaction, User, UserAccount, UserRole, ChangeRequest, AuditEntry, AppNotification } from './types';
import { 
  Gauge, PackagePlus, PackageMinus, BellRing, 
  Calculator, Telescope, LogOut, Boxes, ChevronRight, Settings2, 
  User as UserIcon, Menu, X, Activity, History, FileStack, 
  MousePointer2, UserPlus, Bell, LogIn, ShieldAlert, Wifi, Globe
} from 'lucide-react';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
};

const opsChannel = new BroadcastChannel('enerpack_ops_network');

const PUBLIC_GUEST: User = {
  username: 'guest',
  role: 'USER',
  name: 'Public Guest',
  allowedPages: [
    ViewMode.DASHBOARD, 
    ViewMode.INVENTORY, 
    ViewMode.TRACKER, 
    ViewMode.STOCK_IN_LOGS, 
    ViewMode.STOCK_OUT_LOGS, 
    ViewMode.PENDING_WORKS, 
    ViewMode.REORDER_ALERTS, 
    ViewMode.REORDER_HISTORY, 
    ViewMode.FORECAST, 
    ViewMode.PAPER_CALCULATOR, 
    ViewMode.JOB_CARD_GENERATOR,
    ViewMode.ADMIN_PANEL
  ]
};

const RAW_SKUS: {gsm: string, size: string, cat?: 'SINGLE' | 'DOUBLE', stock?: number}[] = [
  // 280 GSM SECTION
  { gsm: '280', size: '54', cat: 'SINGLE', stock: 1279 },
  { gsm: '280', size: '56', cat: 'SINGLE', stock: 243 },
  { gsm: '280', size: '58', cat: 'SINGLE', stock: 1604 },
  { gsm: '280', size: '59', cat: 'SINGLE', stock: 442 },
  { gsm: '280', size: '60', cat: 'SINGLE', stock: 1351 },
  { gsm: '280', size: '63', cat: 'SINGLE', stock: 568 },
  { gsm: '280', size: '65', cat: 'SINGLE', stock: 1453 },
  { gsm: '280', size: '68', cat: 'SINGLE', stock: 984 },
  { gsm: '280', size: '70', cat: 'SINGLE', stock: 714 },
  { gsm: '280', size: '73', cat: 'SINGLE', stock: 941 },
  { gsm: '280', size: '76', cat: 'SINGLE', stock: 926 },
  { gsm: '280', size: '78', cat: 'SINGLE', stock: 0 },
  { gsm: '280', size: '80', cat: 'SINGLE', stock: 2029 },
  { gsm: '280', size: '83', cat: 'SINGLE', stock: 1337 },
  { gsm: '280', size: '86', cat: 'SINGLE', stock: 298 },
  { gsm: '280', size: '88', cat: 'SINGLE', stock: 1953 },
  { gsm: '280', size: '90', cat: 'SINGLE', stock: 3384 },
  { gsm: '280', size: '93', cat: 'SINGLE', stock: 1262 },
  { gsm: '280', size: '96', cat: 'SINGLE', stock: 1315 },
  { gsm: '280', size: '98', cat: 'SINGLE', stock: 1330 },
  { gsm: '280', size: '100', cat: 'SINGLE', stock: 1999 },
  { gsm: '280', size: '104', cat: 'SINGLE', stock: 955 },
  { gsm: '280', size: '108', cat: 'SINGLE', stock: 1568 },
  { gsm: '280', size: '47*64', cat: 'DOUBLE', stock: 59 },
  { gsm: '280', size: '54*73.5', cat: 'DOUBLE', stock: 55 },
  { gsm: '280', size: '54*86', cat: 'DOUBLE', stock: 157 },
  { gsm: '280', size: '56*68.5', cat: 'DOUBLE', stock: 33 },
  { gsm: '280', size: '56*75', cat: 'DOUBLE', stock: 39 },
  { gsm: '280', size: '56*86', cat: 'DOUBLE', stock: 323 },
  { gsm: '280', size: '57*68.5', cat: 'DOUBLE', stock: 125 },
  { gsm: '280', size: '57.5*76', cat: 'DOUBLE', stock: 71 },
  { gsm: '280', size: '58*78', cat: 'DOUBLE', stock: 346 },
  { gsm: '280', size: '59*78', cat: 'DOUBLE', stock: 71 },
  { gsm: '280', size: '59*87.5', cat: 'DOUBLE', stock: 24 },
  { gsm: '280', size: '59*95', cat: 'DOUBLE', stock: 142 },
  { gsm: '280', size: '60*77.5', cat: 'DOUBLE', stock: 44 },
  { gsm: '280', size: '61*83', cat: 'DOUBLE', stock: 75 },
  { gsm: '280', size: '62*68', cat: 'DOUBLE', stock: 135 },
  { gsm: '280', size: '63*75', cat: 'DOUBLE', stock: 161 },
  { gsm: '280', size: '64*67', cat: 'DOUBLE', stock: 44 },
  { gsm: '280', size: '65*88.5', cat: 'DOUBLE', stock: 66 },
  { gsm: '280', size: '67*75', cat: 'DOUBLE', stock: 101 },
  { gsm: '280', size: '68*69', cat: 'DOUBLE', stock: 132 },
  { gsm: '280', size: '68*91.5', cat: 'DOUBLE', stock: 4 },
  { gsm: '280', size: '70*72', cat: 'DOUBLE', stock: 13 },
  { gsm: '280', size: '70*76', cat: 'DOUBLE', stock: 119 },
  { gsm: '280', size: '70*79', cat: 'DOUBLE', stock: 80 },
  { gsm: '280', size: '72*91.5', cat: 'DOUBLE', stock: 65 },
  { gsm: '280', size: '73*81', cat: 'DOUBLE', stock: 144 },
  { gsm: '280', size: '75*108.5', cat: 'DOUBLE', stock: 16 },
  { gsm: '280', size: '76*111', cat: 'DOUBLE', stock: 123 },
  { gsm: '280', size: '76*72', cat: 'DOUBLE', stock: 240 },
  { gsm: '280', size: '78*70.5', cat: 'DOUBLE', stock: 94 },
  { gsm: '280', size: '78*107', cat: 'DOUBLE', stock: 19 },
  { gsm: '280', size: '82*111', cat: 'DOUBLE', stock: 40 },
  { gsm: '280', size: '88*63', cat: 'DOUBLE', stock: 72 },
  { gsm: '280', size: '90*66', cat: 'DOUBLE', stock: 108 },
  { gsm: '280', size: '94.5*80.5', cat: 'DOUBLE', stock: 32 },
  { gsm: '280', size: '100*74', cat: 'DOUBLE', stock: 20 },
  { gsm: '280', size: '108*76', cat: 'DOUBLE', stock: 103 },
  
  // 250 & 230 GSM SECTION
  { gsm: '250', size: '50*64.5', cat: 'DOUBLE', stock: 255 },
  { gsm: '230', size: '86', cat: 'SINGLE', stock: 416 },
  { gsm: '230', size: '54*78', cat: 'DOUBLE', stock: 55 },
  { gsm: '230', size: '59*91', cat: 'DOUBLE', stock: 42 },
  { gsm: '230', size: '82*98', cat: 'DOUBLE', stock: 42 },
  { gsm: '230', size: '86*110', cat: 'DOUBLE', stock: 56 },
  { gsm: '230', size: '100*67', cat: 'DOUBLE', stock: 42 },
  
  // 200 GSM SECTION
  { gsm: '200', size: '65', cat: 'SINGLE', stock: 0 },
  { gsm: '200', size: '68', cat: 'SINGLE', stock: 1082 },
  { gsm: '200', size: '70', cat: 'SINGLE', stock: 0 },
  { gsm: '200', size: '73', cat: 'SINGLE', stock: 0 },
  { gsm: '200', size: '75', cat: 'SINGLE', stock: 0 },
  { gsm: '200', size: '80', cat: 'SINGLE', stock: 277 },
  { gsm: '200', size: '90', cat: 'SINGLE', stock: 45 },
  { gsm: '200', size: '41*83', cat: 'DOUBLE', stock: 0 },
  { gsm: '200', size: '42.5*57.5', cat: 'DOUBLE', stock: 215 },
  { gsm: '200', size: '43*73', cat: 'DOUBLE', stock: 283 },
  { gsm: '200', size: '44.5*64', cat: 'DOUBLE', stock: 114 },
  { gsm: '200', size: '45*76.5', cat: 'DOUBLE', stock: 62 },
  { gsm: '200', size: '46.5*90', cat: 'DOUBLE', stock: 54 },
  { gsm: '200', size: '47*70.5', cat: 'DOUBLE', stock: 0 },
  { gsm: '200', size: '50*72', cat: 'DOUBLE', stock: 0 },
  { gsm: '200', size: '50*79', cat: 'DOUBLE', stock: 976 },
  { gsm: '200', size: '50*81', cat: 'DOUBLE', stock: 337 },
  { gsm: '200', size: '50*83', cat: 'DOUBLE', stock: 48 },
  { gsm: '200', size: '50*89', cat: 'DOUBLE', stock: 239 },
  { gsm: '200', size: '51*80', cat: 'DOUBLE', stock: 174 },
  { gsm: '200', size: '52*68.5', cat: 'DOUBLE', stock: 75 },
  { gsm: '200', size: '52*76.5', cat: 'DOUBLE', stock: 145 },
  { gsm: '200', size: '53*83', cat: 'DOUBLE', stock: 601 },
  { gsm: '200', size: '54*86', cat: 'DOUBLE', stock: 524 },
  { gsm: '200', size: '56*82', cat: 'DOUBLE', stock: 377 },
  { gsm: '200', size: '56*86', cat: 'DOUBLE', stock: 671 },
  { gsm: '200', size: '57*85.5', cat: 'DOUBLE', stock: 52 },
  { gsm: '200', size: '57*89', cat: 'DOUBLE', stock: 7 },
  { gsm: '200', size: '57*90', cat: 'DOUBLE', stock: 311 },
  { gsm: '200', size: '59*91', cat: 'DOUBLE', stock: 657 },
  { gsm: '200', size: '59.5*93', cat: 'DOUBLE', stock: 270 },
  { gsm: '200', size: '62.5*95', cat: 'DOUBLE', stock: 276 },
  { gsm: '200', size: '63*64', cat: 'DOUBLE', stock: 326 },
  { gsm: '200', size: '63.5*99', cat: 'DOUBLE', stock: 436 },
  { gsm: '200', size: '65*101', cat: 'DOUBLE', stock: 0 },
  { gsm: '200', size: '68*69', cat: 'DOUBLE', stock: 133 },
  { gsm: '200', size: '72*48', cat: 'DOUBLE', stock: 79 },
  { gsm: '200', size: '73*74', cat: 'DOUBLE', stock: 50 },

  // 150, 100 GSM SECTION
  { gsm: '150', size: '68', cat: 'SINGLE', stock: 387 },
  { gsm: '150', size: '84', cat: 'SINGLE', stock: 0 },
  { gsm: '150', size: '92', cat: 'SINGLE', stock: 140 },
  { gsm: '150', size: '104', cat: 'SINGLE', stock: 67 },
  { gsm: '150', size: '108', cat: 'SINGLE', stock: 85 },
  { gsm: '100', size: '60', cat: 'SINGLE', stock: 150 },
  { gsm: '100', size: '66', cat: 'SINGLE', stock: 116 },
  { gsm: '100', size: '92', cat: 'SINGLE', stock: 396 },
  { gsm: '100', size: '100', cat: 'SINGLE', stock: 416 },
  { gsm: '100', size: '106', cat: 'SINGLE', stock: 227 },
  { gsm: '100', size: '108', cat: 'SINGLE', stock: 167 },

  // 140 GYT, 130 GSM SECTION
  { gsm: '140GYT', size: '53', cat: 'SINGLE', stock: 0 },
  { gsm: '140GYT', size: '57', cat: 'SINGLE', stock: 792 },
  { gsm: '140GYT', size: '60', cat: 'SINGLE', stock: 0 },
  { gsm: '140GYT', size: '65', cat: 'SINGLE', stock: 173 },
  { gsm: '140GYT', size: '70', cat: 'SINGLE', stock: 1016 },
  { gsm: '140GYT', size: '73', cat: 'SINGLE', stock: 0 },
  { gsm: '140GYT', size: '77', cat: 'SINGLE', stock: 1805 },
  { gsm: '140GYT', size: '82', cat: 'SINGLE', stock: 0 },
  { gsm: '140GYT', size: '85', cat: 'SINGLE', stock: 0 },
  { gsm: '140GYT', size: '88', cat: 'SINGLE', stock: 0 },
  { gsm: '140GYT', size: '90', cat: 'SINGLE', stock: 956 },
  { gsm: '140GYT', size: '95', cat: 'SINGLE', stock: 991 },
  { gsm: '140GYT', size: '100', cat: 'SINGLE', stock: 942 },
  { gsm: '140GYT', size: '104', cat: 'SINGLE', stock: 271 },
  { gsm: '140GYT', size: '108', cat: 'SINGLE', stock: 0 },
  { gsm: '130', size: '54', cat: 'SINGLE', stock: 76 },
  { gsm: '130', size: '56', cat: 'SINGLE', stock: 0 },
  { gsm: '130', size: '58', cat: 'SINGLE', stock: 190 },
  { gsm: '130', size: '59', cat: 'SINGLE', stock: 44 },
  { gsm: '130', size: '61', cat: 'SINGLE', stock: 175 },
  { gsm: '130', size: '63', cat: 'SINGLE', stock: 0 },
  { gsm: '130', size: '68', cat: 'SINGLE', stock: 0 },
  { gsm: '130', size: '75', cat: 'SINGLE', stock: 55 },
  { gsm: '130', size: '86', cat: 'SINGLE', stock: 0 },
  { gsm: '130', size: '90', cat: 'SINGLE', stock: 99 },
  { gsm: '130', size: '100', cat: 'SINGLE', stock: 0 },
  { gsm: '130', size: '102', cat: 'SINGLE', stock: 0 },
  { gsm: '130', size: '106', cat: 'SINGLE', stock: 35 },
  { gsm: '130', size: '108', cat: 'SINGLE', stock: 0 },
];

const INITIAL_DATA: InventoryItem[] = RAW_SKUS.map(sku => ({
  id: `${sku.gsm}-${sku.size.replace('*','-')}`,
  size: sku.size,
  gsm: sku.gsm,
  closingStock: sku.stock || 0,
  minStock: 500,
  category: (sku.cat || (sku.size.includes('*') ? 'DOUBLE' : 'SINGLE')) as any
}));

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const s = localStorage.getItem('enerpack_user_v1');
    return s ? JSON.parse(s) : PUBLIC_GUEST;
  });

  const [authorizedUsers, setAuthorizedUsers] = useState<UserAccount[]>(() => {
    const s = localStorage.getItem('enerpack_accounts_v1');
    return s ? JSON.parse(s) : [];
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const s = localStorage.getItem('enerpack_inventory_v11');
    return s ? JSON.parse(s) : INITIAL_DATA;
  });

  const [transactions, setTransactions] = useState<StockTransaction[]>(() => {
    const s = localStorage.getItem('enerpack_transactions_v1');
    return s ? JSON.parse(s) : [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(() => {
    const s = localStorage.getItem('enerpack_audit_v1');
    return s ? JSON.parse(s) : [];
  });

  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>(() => {
    const s = localStorage.getItem('enerpack_changes_v1');
    return s ? JSON.parse(s) : [];
  });

  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [adminSubTab, setAdminSubTab] = useState<'OVERVIEW' | 'STAFFS' | 'APPROVAL' | 'AUDIT_LOG' | 'SYNC'>('OVERVIEW');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  const prevPendingUserIds = useRef<string[]>([]);
  const prevChangeRequestIds = useRef<string[]>([]);

  const syncAllData = useCallback(() => {
    try {
      const accs = JSON.parse(localStorage.getItem('enerpack_accounts_v1') || '[]');
      const inv = JSON.parse(localStorage.getItem('enerpack_inventory_v11') || '[]');
      const trans = JSON.parse(localStorage.getItem('enerpack_transactions_v1') || '[]');
      const changes = JSON.parse(localStorage.getItem('enerpack_changes_v1') || '[]');
      const audit = JSON.parse(localStorage.getItem('enerpack_audit_v1') || '[]');
      
      setAuthorizedUsers(accs);
      setInventory(inv);
      setTransactions(trans);
      setChangeRequests(changes);
      setAuditLogs(audit);
    } catch(e) {}
  }, []);

  useEffect(() => {
    const handleBroadcast = (event: MessageEvent) => {
      const { type, payload } = event.data;
      if (type === 'USER_REGISTERED') {
        setAuthorizedUsers(prev => {
          if (prev.some(u => u.username === payload.username)) return prev;
          const updated = [...prev, payload];
          localStorage.setItem('enerpack_accounts_v1', JSON.stringify(updated));
          return updated;
        });
      }
      if (type === 'DATA_MODIFIED') {
        syncAllData();
      }
    };
    opsChannel.addEventListener('message', handleBroadcast);
    return () => opsChannel.removeEventListener('message', handleBroadcast);
  }, [syncAllData]);

  useEffect(() => {
    window.addEventListener('storage', (e) => { if (e.newValue) syncAllData(); });
    const interval = setInterval(syncAllData, 3000); 
    return () => { window.removeEventListener('storage', syncAllData); clearInterval(interval); };
  }, [syncAllData]);

  useEffect(() => { localStorage.setItem('enerpack_inventory_v11', JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem('enerpack_transactions_v1', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('enerpack_accounts_v1', JSON.stringify(authorizedUsers)); }, [authorizedUsers]);
  useEffect(() => { localStorage.setItem('enerpack_changes_v1', JSON.stringify(changeRequests)); }, [changeRequests]);
  useEffect(() => { localStorage.setItem('enerpack_audit_v1', JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { if (currentUser) localStorage.setItem('enerpack_user_v1', JSON.stringify(currentUser)); }, [currentUser]);

  useEffect(() => {
    if (currentUser.role !== 'ADMIN') return;
    const currentPendingUsers = authorizedUsers.filter(a => a.status === 'PENDING');
    const newPendingUsers = currentPendingUsers.filter(u => !prevPendingUserIds.current.includes(u.username));
    if (newPendingUsers.length > 0) {
      newPendingUsers.forEach(user => {
        setNotifications(prev => [...prev, { id: generateId(), type: 'USER', message: `Personnel Link Request: @${user.username}`, subTab: 'STAFFS' }]);
      });
      prevPendingUserIds.current = currentPendingUsers.map(u => u.username);
    }
    const currentChangeIds = changeRequests.map(r => r.id);
    const newChanges = changeRequests.filter(r => !prevChangeRequestIds.current.includes(r.id));
    if (newChanges.length > 0) {
      newChanges.forEach(req => {
        setNotifications(prev => [...prev, { id: generateId(), type: 'CHANGE', message: `Modification Pending: ${req.itemData.size || 'Record'}`, subTab: 'APPROVAL' }]);
      });
      prevChangeRequestIds.current = currentChangeIds;
    }
  }, [authorizedUsers, changeRequests, currentUser.role]);

  const addAuditLog = useCallback((action: AuditEntry['action'], details: string, itemId?: string) => {
    const log: AuditEntry = { id: generateId(), timestamp: Date.now(), userId: currentUser.username, userName: currentUser.name, action, details, itemId };
    setAuditLogs(prev => [log, ...prev].slice(0, 1000));
    opsChannel.postMessage({ type: 'DATA_MODIFIED' });
  }, [currentUser]);

  const handleUpdateStock = useCallback((id: string, delta: number) => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, closingStock: Math.max(0, Number((item.closingStock + delta).toFixed(2))) } : item));
    const item = inventory.find(i => i.id === id);
    if (item) addAuditLog('UPDATE_ITEM', `Stock Adjustment: ${delta > 0 ? '+' : ''}${delta} for ${item.size}`, id);
  }, [addAuditLog, inventory]);

  const handleRecordTransaction = useCallback((transaction: Omit<StockTransaction, 'id' | 'timestamp'>) => {
    const newTransaction: StockTransaction = { ...transaction, id: generateId(), timestamp: Date.now() };
    setTransactions(prev => [newTransaction, ...prev]);
  }, []);

  const handleAddItem = useCallback((item: Omit<InventoryItem, 'id'>) => {
    const newId = generateId();
    if (currentUser.role === 'ADMIN') {
      setInventory(prev => [...prev, { ...item, id: newId }]);
      addAuditLog('ADD_ITEM', `Added ${item.size}`, newId);
    } else {
      setChangeRequests(prev => [...prev, { id: generateId(), timestamp: Date.now(), requestedBy: currentUser.username, requestedByName: currentUser.name, type: 'ADD', itemData: { ...item, id: newId }, status: 'PENDING' }]);
    }
  }, [currentUser, addAuditLog]);

  const handleUpdateItem = useCallback((updatedItem: InventoryItem) => {
    const oldItem = inventory.find(i => i.id === updatedItem.id);
    if (!oldItem) return;
    if (currentUser.role === 'ADMIN') {
      setInventory(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
      addAuditLog('UPDATE_ITEM', `Modified ${updatedItem.size}`, updatedItem.id);
    } else {
      setChangeRequests(prev => [...prev, { id: generateId(), timestamp: Date.now(), requestedBy: currentUser.username, requestedByName: currentUser.name, type: 'UPDATE', itemId: updatedItem.id, itemData: updatedItem, oldData: oldItem, status: 'PENDING' }]);
      setInventory(prev => prev.map(i => i.id === updatedItem.id ? { ...i, isPendingApproval: true } : i));
    }
  }, [currentUser, addAuditLog, inventory]);

  const handleDeleteItem = useCallback((item: InventoryItem) => {
    if (!item) return;
    if (window.confirm("Delete item?")) {
      if (currentUser.role === 'ADMIN') {
        setInventory(prev => prev.filter(i => i.id !== item.id));
        addAuditLog('DELETE_ITEM', `Deleted SKU: ${item.size}`, item.id);
      } else {
        setChangeRequests(prev => [{ id: generateId(), timestamp: Date.now(), requestedBy: currentUser.username, requestedByName: currentUser.name, type: 'DELETE', itemId: item.id, itemData: item, status: 'PENDING' }, ...prev]);
        setInventory(prev => prev.map(i => i.id === item.id ? { ...i, isPendingApproval: true } : i));
      }
    }
  }, [currentUser, addAuditLog]);

  const handleProcessChangeRequest = useCallback((requestId: string, approved: boolean) => {
    if (currentUser.role !== 'ADMIN') return;
    const req = changeRequests.find(r => r.id === requestId);
    if (!req) return;
    if (approved) {
      if (req.type === 'ADD') setInventory(prev => [...prev, req.itemData as InventoryItem]);
      else if (req.type === 'UPDATE' && req.itemId) setInventory(prev => prev.map(i => i.id === req.itemId ? { ...req.itemData as InventoryItem, isPendingApproval: false } : i));
      else if (req.type === 'DELETE' && req.itemId) setInventory(prev => prev.filter(i => i.id !== req.itemId));
      addAuditLog('APPROVE_CHANGE', `Approved ${req.type} for ${req.itemData.size}`, req.itemId || req.itemData.id);
    } else {
      if (req.itemId) setInventory(prev => prev.map(i => i.id === req.itemId ? { ...i, isPendingApproval: false } : i));
      addAuditLog('DENY_CHANGE', `Denied ${req.type} for ${req.itemData.size}`, req.itemId);
    }
    setChangeRequests(prev => prev.filter(r => r.id !== requestId));
  }, [currentUser, addAuditLog, changeRequests]);

  const handleRequestSignup = useCallback((signupData: Omit<UserAccount, 'role' | 'status' | 'createdAt'>) => {
    const newAccount: UserAccount = { ...signupData, role: 'USER', status: 'PENDING', createdAt: Date.now(), allowedPages: [ViewMode.DASHBOARD] };
    setAuthorizedUsers(prev => {
      const updated = [...prev, newAccount];
      localStorage.setItem('enerpack_accounts_v1', JSON.stringify(updated));
      return updated;
    });
    opsChannel.postMessage({ type: 'USER_REGISTERED', payload: newAccount });
  }, []);

  const handleUpdateAccountStatus = useCallback((username: string, status: UserAccount['status'], role?: UserRole, allowedPages?: ViewMode[]) => {
    const updated = authorizedUsers.map(u => u.username === username ? { ...u, status, role: role || u.role, allowedPages: allowedPages || u.allowedPages } : u);
    setAuthorizedUsers(updated);
    localStorage.setItem('enerpack_accounts_v1', JSON.stringify(updated));
    addAuditLog('USER_VERIFY', `User @${username} set to ${status}`, username);
  }, [addAuditLog, authorizedUsers]);

  const handleLogout = () => { if (window.confirm('Log out?')) { setCurrentUser(PUBLIC_GUEST); setViewMode(ViewMode.DASHBOARD); } };

  const navigateToAdminSubTab = (subTab: AppNotification['subTab']) => {
    setViewMode(ViewMode.ADMIN_PANEL);
    setAdminSubTab(subTab);
  };

  const isAdmin = currentUser.role === 'ADMIN';
  const isGuest = currentUser.username === 'guest';
  const canEditCurrentPage = !isGuest && (isAdmin || (currentUser.role === 'EDITOR' && currentUser.allowedPages?.includes(viewMode)));
  
  const pendingUserCount = authorizedUsers.filter(a => a.status === 'PENDING').length;
  const pendingChangeCount = changeRequests.length;
  const totalAdminAlerts = pendingUserCount + pendingChangeCount;

  const navItems = [
    { mode: ViewMode.DASHBOARD, icon: Gauge, label: "Dashboard", category: "General" },
    { mode: ViewMode.INVENTORY, icon: Boxes, label: "Full Inventory", category: "Inventory" },
    { mode: ViewMode.TRACKER, icon: MousePointer2, label: "Quick Tracker", category: "Inventory" },
    { mode: ViewMode.STOCK_IN_LOGS, icon: PackagePlus, label: "Stock In Logs", category: "Movement" },
    { mode: ViewMode.STOCK_OUT_LOGS, icon: PackageMinus, label: "Stock Out Logs", category: "Movement" },
    { mode: ViewMode.PENDING_WORKS, icon: Activity, label: "Pending Works", category: "Movement" },
    { mode: ViewMode.REORDER_ALERTS, icon: BellRing, label: "Reorder Alerts", category: "Planning" },
    { mode: ViewMode.REORDER_HISTORY, icon: History, label: "Reorder History", category: "Planning" },
    { mode: ViewMode.FORECAST, icon: Telescope, label: "Demand Forecast", category: "Planning" },
    { mode: ViewMode.PAPER_CALCULATOR, icon: Calculator, label: "Calculator", category: "Tools" },
    { mode: ViewMode.JOB_CARD_GENERATOR, icon: FileStack, label: "Job Card Generator", category: "Tools" },
  ];

  const categorizedNav = navItems.reduce((acc: Record<string, typeof navItems>, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const renderContent = () => {
    switch (viewMode) {
      case ViewMode.DASHBOARD: return <Dashboard items={inventory} transactions={transactions} onNavigate={setViewMode} user={currentUser} pendingUserRequests={authorizedUsers.filter(u => u.status === 'PENDING')} />;
      case ViewMode.INVENTORY: return <InventoryTable items={inventory} transactions={transactions} onUpdateStock={handleUpdateStock} onAddItem={handleAddItem} onRecordTransaction={handleRecordTransaction} onBulkUpdate={setInventory} onUpdateItem={handleUpdateItem} onDeleteItem={handleDeleteItem} isAdmin={canEditCurrentPage} />;
      case ViewMode.TRACKER: return <InventoryTracker items={inventory} transactions={transactions} onBack={() => setViewMode(ViewMode.DASHBOARD)} onRecordTransaction={handleRecordTransaction} onUpdateStock={handleUpdateStock} isAdmin={canEditCurrentPage} />;
      case ViewMode.STOCK_IN_LOGS: return <TransactionHistory type="IN" transactions={transactions} onBack={() => setViewMode(ViewMode.DASHBOARD)} />;
      case ViewMode.STOCK_OUT_LOGS: return <TransactionHistory type="OUT" transactions={transactions} onBack={() => setViewMode(ViewMode.DASHBOARD)} />;
      case ViewMode.REORDER_HISTORY: return <TransactionHistory type="REORDER" transactions={transactions} onBack={() => setViewMode(ViewMode.DASHBOARD)} />;
      case ViewMode.PENDING_WORKS: return <PendingWorks transactions={transactions} onBack={() => setViewMode(ViewMode.DASHBOARD)} onUpdateTransaction={(id, upd) => setTransactions(prev => prev.map(t => t.id === id ? {...t, ...upd} : t))} onUpdatePriority={(id, p) => setTransactions(prev => prev.map(t => t.id === id ? {...t, priority: p} : t))} isAdmin={canEditCurrentPage} />;
      case ViewMode.REORDER_ALERTS: return <ReorderPage items={inventory} onBack={() => setViewMode(ViewMode.DASHBOARD)} onUpdateItem={handleUpdateItem} onRecordTransaction={handleRecordTransaction} isAdmin={canEditCurrentPage} />;
      case ViewMode.FORECAST: return <ForecastPage items={inventory} transactions={transactions} onBack={() => setViewMode(ViewMode.DASHBOARD)} />;
      case ViewMode.PAPER_CALCULATOR: return <PaperCalculator onBack={() => setViewMode(ViewMode.DASHBOARD)} />;
      case ViewMode.JOB_CARD_GENERATOR: return <JobCardGenerator onBack={() => setViewMode(ViewMode.DASHBOARD)} />;
      case ViewMode.ADMIN_PANEL: return <AdminPanel accounts={authorizedUsers} inventoryCount={inventory.length} transactionCount={transactions.length} auditLogs={auditLogs} changeRequests={changeRequests} onBack={() => setViewMode(ViewMode.DASHBOARD)} onUpdateAccountStatus={handleUpdateAccountStatus} onProcessChangeRequest={handleProcessChangeRequest} onDeleteAuditLog={id => setAuditLogs(prev => prev.filter(l => l.id !== id))} onClearAuditLogs={() => setAuditLogs([])} activeSubTab={adminSubTab} onSubTabChange={setAdminSubTab} isAdmin={isAdmin} />;
      case ViewMode.LOGIN: return <Login onLogin={u => { setCurrentUser(u); setViewMode(ViewMode.DASHBOARD); }} authorizedUsers={authorizedUsers} onRequestSignup={handleRequestSignup} />;
      default: return <Dashboard items={inventory} transactions={transactions} onNavigate={setViewMode} user={currentUser} />;
    }
  };

  return (
    <div className="h-screen w-full bg-[#0c4a6e] flex overflow-hidden font-sans print:h-auto">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0c4a6e] transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} md:static flex flex-col shrink-0 overflow-y-auto print:hidden border-r border-white/5 scrollbar-hide`}>
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg"><span className="font-black text-[#0c4a6e] text-sm brand-font">EP</span></div>
            <h2 className="text-white font-bold text-xl tracking-tight uppercase brand-font">ENERPACK</h2>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-white/60"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-5 py-3 border-b border-white/5 flex items-center gap-3 shrink-0">
          <div className={`w-7 h-7 rounded-full bg-white/10 text-white/40 flex items-center justify-center`}><UserIcon className="w-3.5 h-3.5" /></div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-white text-[11px] font-bold truncate">{currentUser.name}</span>
            <span className={`text-[8px] font-black uppercase tracking-widest ${isAdmin ? 'text-emerald-400' : 'text-blue-300'}`}>{currentUser.role}</span>
          </div>
        </div>
        <div className="flex-1 px-3 space-y-0.5 py-4 overflow-y-auto scrollbar-hide">
           {Object.entries(categorizedNav).map(([cat, items]) => (
             <div key={cat} className="mb-4 last:mb-0">
               <h3 className="px-3 text-[9px] font-black text-blue-200/30 uppercase tracking-[0.2em] mb-2">{cat}</h3>
               {items.map(item => (<NavBtn key={item.mode} icon={item.icon} label={item.label} active={viewMode === item.mode} onClick={() => { setViewMode(item.mode); setIsMobileMenuOpen(false); }} />))}
             </div>
           ))}
           <div className="mt-6 pt-4 border-t border-white/5 mb-4">
             <h3 className="px-3 text-[9px] font-black text-blue-200/30 uppercase tracking-[0.2em] mb-2">System</h3>
             <NavBtn icon={Settings2} label="Admin Control" active={viewMode === ViewMode.ADMIN_PANEL} onClick={() => { setViewMode(ViewMode.ADMIN_PANEL); setIsMobileMenuOpen(false); }} badge={isAdmin && totalAdminAlerts > 0 ? totalAdminAlerts : undefined} badgeColor="bg-rose-500" shake={isAdmin && totalAdminAlerts > 0} />
           </div>
        </div>
        <div className="p-4 border-t border-white/5 bg-black/10 shrink-0">
           {isGuest ? (
             <button onClick={() => setViewMode(ViewMode.LOGIN)} className="flex items-center gap-2.5 text-blue-300 hover:text-white transition-colors w-full px-3 py-2.5 rounded-xl hover:bg-white/5">
                <LogIn className="w-4 h-4" /><span className="text-[11px] font-bold uppercase tracking-widest">Personnel Login</span>
             </button>
           ) : (
             <button onClick={handleLogout} className="flex items-center gap-2.5 text-rose-300 hover:text-rose-400 transition-colors w-full px-3 py-2.5 rounded-xl hover:bg-rose-400/10">
                <LogOut className="w-4 h-4" /><span className="text-[11px] font-bold uppercase tracking-widest">Log Out</span>
             </button>
           )}
        </div>
      </aside>
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="md:hidden bg-[#0c4a6e] px-4 py-3 flex items-center justify-between shrink-0 z-40">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-1.5 text-white/80 bg-white/10 rounded-lg"><Menu className="w-5 h-5" /></button>
          <div className="flex items-center gap-2"><div className="w-6 h-6 bg-white rounded-md flex items-center justify-center font-black text-[#0c4a6e] text-[10px]">EP</div><h2 className="text-white font-bold text-base brand-font">ENERPACK</h2></div>
          <div className="w-8 h-8 relative flex items-center justify-center"><Wifi className="w-4 h-4 text-emerald-400" /></div>
        </header>
        <div className="flex-1 overflow-hidden relative bg-[#f1f5f9] shadow-[inset_0_2px_15px_rgba(0,0,0,0.1)]">
          {renderContent()}
          <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-xs pointer-events-none">
            {notifications.map(note => (
              <div key={note.id} className="pointer-events-auto bg-white border-2 border-slate-100 rounded-3xl p-4 shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-8 duration-500 hover:scale-105 transition-transform cursor-pointer group" onClick={() => { navigateToAdminSubTab(note.subTab); setNotifications(prev => prev.filter(n => n.id !== note.id)); }}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${note.type === 'USER' ? 'bg-emerald-50 text-white' : 'bg-rose-50 text-white'}`}>{note.type === 'USER' ? <UserPlus className="w-6 h-6" /> : <Activity className="w-6 h-6" />}</div>
                <div className="flex-1 min-w-0"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">Operational Alert</p><p className="text-xs font-bold text-slate-800 leading-tight">{note.message}</p></div>
                <div className="bg-slate-50 p-2 rounded-xl group-hover:bg-blue-50 transition-colors" onClick={(e) => { e.stopPropagation(); setNotifications(prev => prev.filter(n => n.id !== note.id)); }}><X className="w-4 h-4 text-slate-300 hover:text-rose-500" /></div>
              </div>
            ))}
          </div>
        </div>
      </main>
      {isMobileMenuOpen && <div className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />}
    </div>
  );
};

const NavBtn = ({ icon: Icon, label, active, onClick, badge, badgeColor = "bg-blue-500", shake = false }: any) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group ${active ? 'bg-white/10 text-white font-bold' : 'text-slate-300/60 hover:text-white hover:bg-white/5'}`}>
    <div className="flex items-center gap-2.5"><div className={`${shake && !active ? 'animate-bounce' : ''}`}><Icon className={`w-4 h-4 transition-colors ${active ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'}`} /></div><span className="text-[11px] tracking-tight">{label}</span></div>
    <div className="flex items-center gap-1.5">{badge !== undefined && <span className={`${badgeColor} text-white text-[8px] font-black px-1.5 py-0.5 rounded-full`}>{badge}</span>}{active && <ChevronRight className="w-3.5 h-3.5 text-blue-400" />}</div>
  </button>
);

export default App;