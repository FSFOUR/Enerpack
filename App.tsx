import React, { useState, useEffect, useCallback } from 'react';
import InventoryTable from './components/InventoryTable';
import Dashboard from './components/Dashboard';
import TransactionHistory from './components/TransactionHistory';
import PendingWorks from './components/PendingWorks';
import ReorderPage from './components/ReorderPage';
import PaperCalculator from './components/PaperCalculator';
import ForecastPage from './components/ForecastPage';
import JobCardGenerator from './components/JobCardGenerator';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import { InventoryItem, ViewMode, StockTransaction, User, UserAccount, UserRole, ChangeRequest, AuditEntry } from './types';
import { 
  Gauge, PackagePlus, PackageMinus, BellRing, 
  Calculator, Telescope, LogOut, Boxes, ChevronRight, Settings2, User as UserIcon, Menu, X, Activity, History, FileStack
} from 'lucide-react';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
};

const INITIAL_DATA: InventoryItem[] = [
  // 280 GSM SINGLE SIZES
  { id: '280-54', size: '54', gsm: '280', closingStock: 1379, minStock: 500, category: 'SINGLE' },
  { id: '280-56', size: '56', gsm: '280', closingStock: 243, minStock: 500, category: 'SINGLE' },
  { id: '280-58', size: '58', gsm: '280', closingStock: 1604, minStock: 500, category: 'SINGLE' },
  { id: '280-59', size: '59', gsm: '280', closingStock: 442, minStock: 400, category: 'SINGLE' },
  { id: '280-60', size: '60', gsm: '280', closingStock: 1351, minStock: 500, category: 'SINGLE' },
  { id: '280-63', size: '63', gsm: '280', closingStock: 0, minStock: 400, category: 'SINGLE' },
  { id: '280-65', size: '65', gsm: '280', closingStock: 1453, minStock: 500, category: 'SINGLE' },
  { id: '280-68', size: '68', gsm: '280', closingStock: 984, minStock: 400, category: 'SINGLE' },
  { id: '280-70', size: '70', gsm: '280', closingStock: 0, minStock: 200, category: 'SINGLE' },
  { id: '280-73', size: '73', gsm: '280', closingStock: 941, minStock: 400, category: 'SINGLE' },
  { id: '280-76', size: '76', gsm: '280', closingStock: 926, minStock: 400, category: 'SINGLE' },
  { id: '280-78', size: '78', gsm: '280', closingStock: 1334, minStock: 500, category: 'SINGLE' },
  { id: '280-80', size: '80', gsm: '280', closingStock: 2029, minStock: 500, category: 'SINGLE' },
  { id: '280-83', size: '83', gsm: '280', closingStock: 1337, minStock: 500, category: 'SINGLE' },
  { id: '280-86', size: '86', gsm: '280', closingStock: 1418, minStock: 500, category: 'SINGLE' },
  { id: '280-88', size: '88', gsm: '280', closingStock: 1953, minStock: 500, category: 'SINGLE' },
  { id: '280-90', size: '90', gsm: '280', closingStock: 3384, minStock: 500, category: 'SINGLE' },
  { id: '280-93', size: '93', gsm: '280', closingStock: 1262, minStock: 400, category: 'SINGLE' },
  { id: '280-96', size: '96', gsm: '280', closingStock: 770, minStock: 400, category: 'SINGLE' },
  { id: '280-98', size: '98', gsm: '280', closingStock: 1330, minStock: 500, category: 'SINGLE' },
  { id: '280-100', size: '100', gsm: '280', closingStock: 1999, minStock: 500, category: 'SINGLE' },
  { id: '280-104', size: '104', gsm: '280', closingStock: 955, minStock: 400, category: 'SINGLE' },
  { id: '280-108', size: '108', gsm: '280', closingStock: 1568, minStock: 500, category: 'SINGLE' },

  // 280 GSM DOUBLE SIZES
  // Fix: Added minStock: 0 to satisfy InventoryItem interface
  { id: '280-47x64', size: '47*64', gsm: '280', closingStock: 59, minStock: 0, category: 'DOUBLE' },
  { id: '280-54x73.5', size: '54*73.5', gsm: '280', closingStock: 55, minStock: 0, category: 'DOUBLE' },
  { id: '280-54x86', size: '54*86', gsm: '280', closingStock: 157, minStock: 0, category: 'DOUBLE' },
  { id: '280-56x68.5', size: '56*68.5', gsm: '280', closingStock: 33, minStock: 0, category: 'DOUBLE' },
  { id: '280-56x75', size: '56*75', gsm: '280', closingStock: 39, minStock: 0, category: 'DOUBLE' },
  { id: '280-56x86', size: '56*86', gsm: '280', closingStock: 323, minStock: 0, category: 'DOUBLE' },
  { id: '280-57.5x76', size: '57.5*76', gsm: '280', closingStock: 106, minStock: 0, category: 'DOUBLE' },
  { id: '280-57x68.5', size: '57*68.5', gsm: '280', closingStock: 125, minStock: 0, category: 'DOUBLE' },
  { id: '280-58x78', size: '58*78', gsm: '280', closingStock: 346, minStock: 0, category: 'DOUBLE' },
  { id: '280-59x78', size: '59*78', gsm: '280', closingStock: 71, minStock: 0, category: 'DOUBLE' },
  { id: '280-59x87.5', size: '59*87.5', gsm: '280', closingStock: 24, minStock: 0, category: 'DOUBLE' },
  { id: '280-59x95', size: '59*95', gsm: '280', closingStock: 142, minStock: 0, category: 'DOUBLE' },
  { id: '280-60x77.5', size: '60*77.5', gsm: '280', closingStock: 44, minStock: 0, category: 'DOUBLE' },
  { id: '280-61x83', size: '61*83', gsm: '280', closingStock: 75, minStock: 0, category: 'DOUBLE' },
  { id: '280-62x68', size: '62*68', gsm: '280', closingStock: 135, minStock: 0, category: 'DOUBLE' },
  { id: '280-63x75', size: '63*75', gsm: '280', closingStock: 161, minStock: 0, category: 'DOUBLE' },
  { id: '280-64x67', size: '64*67', gsm: '280', closingStock: 44, minStock: 0, category: 'DOUBLE' },
  { id: '280-65x88.5', size: '65*88.5', gsm: '280', closingStock: 66, minStock: 0, category: 'DOUBLE' },
  { id: '280-67x75', size: '67*75', gsm: '280', closingStock: 101, minStock: 0, category: 'DOUBLE' },
  { id: '280-68x69', size: '68*69', gsm: '280', closingStock: 132, minStock: 0, category: 'DOUBLE' },
  { id: '280-68x91.5', size: '68*91.5', gsm: '280', closingStock: 4, minStock: 0, category: 'DOUBLE' },
  { id: '280-70x72', size: '70*72', gsm: '280', closingStock: 13, minStock: 0, category: 'DOUBLE' },
  { id: '280-70x76', size: '70*76', gsm: '280', closingStock: 119, minStock: 0, category: 'DOUBLE' },
  { id: '280-70x79', size: '70*79', gsm: '280', closingStock: 80, minStock: 0, category: 'DOUBLE' },
  { id: '280-72x91.5', size: '72*91.5', gsm: '280', closingStock: 65, minStock: 0, category: 'DOUBLE' },
  { id: '280-73x81', size: '73*81', gsm: '280', closingStock: 144, minStock: 0, category: 'DOUBLE' },
  { id: '280-75x108.5', size: '75*108.5', gsm: '280', closingStock: 16, minStock: 0, category: 'DOUBLE' },
  { id: '280-76x111', size: '76*111', gsm: '280', closingStock: 123, minStock: 0, category: 'DOUBLE' },
  { id: '280-76x72', size: '76*72', gsm: '280', closingStock: 240, minStock: 0, category: 'DOUBLE' },
  { id: '280-78x70.5', size: '78*70.5', gsm: '280', closingStock: 94, minStock: 0, category: 'DOUBLE' },
  { id: '280-78x107', size: '78*107', gsm: '280', closingStock: 19, minStock: 0, category: 'DOUBLE' },
  { id: '280-82x111', size: '82*111', gsm: '280', closingStock: 40, minStock: 0, category: 'DOUBLE' },
  { id: '280-88x63', size: '88*63', gsm: '280', closingStock: 72, minStock: 0, category: 'DOUBLE' },
  { id: '280-90x66', size: '90*66', gsm: '280', closingStock: 108, minStock: 0, category: 'DOUBLE' },
  { id: '280-94.5x80.5', size: '94.5*80.5', gsm: '280', closingStock: 32, minStock: 0, category: 'DOUBLE' },
  { id: '280-100x74', size: '100*74', gsm: '280', closingStock: 20, minStock: 0, category: 'DOUBLE' },
  { id: '280-108x76', size: '108*76', gsm: '280', closingStock: 103, minStock: 0, category: 'DOUBLE' },

  // 250 & 230 GSM
  { id: '250-50x64.5', size: '50*64.5', gsm: '250', closingStock: 255, minStock: 0, category: 'DOUBLE' },
  { id: '230-86', size: '86', gsm: '230', closingStock: 416, minStock: 0, category: 'SINGLE' },
  { id: '230-54x78', size: '54*78', gsm: '230', closingStock: 55, minStock: 0, category: 'DOUBLE' },
  { id: '230-59x91', size: '59*91', gsm: '230', closingStock: 42, minStock: 0, category: 'DOUBLE' },
  { id: '230-82x98', size: '82*98', gsm: '230', closingStock: 42, minStock: 0, category: 'DOUBLE' },
  { id: '230-86x110', size: '86*110', gsm: '230', closingStock: 56, minStock: 0, category: 'DOUBLE' },
  { id: '230-100x67', size: '100*67', gsm: '230', closingStock: 42, minStock: 0, category: 'DOUBLE' },

  // 200 GSM SINGLE SIZES
  { id: '200-65', size: '65', gsm: '200', closingStock: 0, minStock: 0, category: 'SINGLE' },
  { id: '200-68', size: '68', gsm: '200', closingStock: 1082, minStock: 0, category: 'SINGLE' },
  { id: '200-70', size: '70', gsm: '200', closingStock: 0, minStock: 0, category: 'SINGLE' },
  { id: '200-73', size: '73', gsm: '200', closingStock: 0, minStock: 0, category: 'SINGLE' },
  { id: '200-75', size: '75', gsm: '200', closingStock: 0, minStock: 0, category: 'SINGLE' },
  { id: '200-80', size: '80', gsm: '200', closingStock: 277, minStock: 0, category: 'SINGLE' },
  { id: '200-90', size: '90', gsm: '200', closingStock: 45, minStock: 0, category: 'SINGLE' },

  // 200 GSM DOUBLE SIZES
  { id: '200-41x83', size: '41*83', gsm: '200', closingStock: 0, minStock: 0, category: 'DOUBLE' },
  { id: '200-42.5x57.5', size: '42.5*57.5', gsm: '200', closingStock: 215, minStock: 0, category: 'DOUBLE' },
  { id: '200-43x73', size: '43*73', gsm: '200', closingStock: 283, minStock: 0, category: 'DOUBLE' },
  { id: '200-44.5x64', size: '44.5*64', gsm: '200', closingStock: 114, minStock: 0, category: 'DOUBLE' },
  { id: '200-45x76.5', size: '45*76.5', gsm: '200', closingStock: 62, minStock: 0, category: 'DOUBLE' },
  { id: '200-46.5x90', size: '46.5*90', gsm: '200', closingStock: 54, minStock: 0, category: 'DOUBLE' },
  { id: '200-47x70.5', size: '47*70.5', gsm: '200', closingStock: 0, minStock: 0, category: 'DOUBLE' },
  { id: '200-50x72', size: '50*72', gsm: '200', closingStock: 0, minStock: 0, category: 'DOUBLE' },
  { id: '200-50x79', size: '50*79', gsm: '200', closingStock: 976, minStock: 0, category: 'DOUBLE' },
  { id: '200-50x81', size: '50*81', gsm: '200', closingStock: 337, minStock: 0, category: 'DOUBLE' },
  { id: '200-50x83', size: '50*83', gsm: '200', closingStock: 48, minStock: 0, category: 'DOUBLE' },
  { id: '200-51x80', size: '51*80', gsm: '200', closingStock: 174, minStock: 0, category: 'DOUBLE' },
  { id: '200-52x68.5', size: '52*68.5', gsm: '200', closingStock: 75, minStock: 0, category: 'DOUBLE' },
  { id: '200-52x76.5', size: '52*76.5', gsm: '200', closingStock: 145, minStock: 0, category: 'DOUBLE' },
  { id: '200-53x83', size: '53*83', gsm: '200', closingStock: 601, minStock: 0, category: 'DOUBLE' },
  { id: '200-54x86', size: '54*86', gsm: '200', closingStock: 524, minStock: 0, category: 'DOUBLE' },
  { id: '200-56x82', size: '56*82', gsm: '200', closingStock: 377, minStock: 0, category: 'DOUBLE' },
  { id: '200-56x86', size: '56*86', gsm: '200', closingStock: 671, minStock: 0, category: 'DOUBLE' },
  { id: '200-57x85.5', size: '57*85.5', gsm: '200', closingStock: 52, minStock: 0, category: 'DOUBLE' },
  { id: '200-57x89', size: '57*89', gsm: '200', closingStock: 7, minStock: 0, category: 'DOUBLE' },
  { id: '200-57x90', size: '57*90', gsm: '200', closingStock: 311, minStock: 0, category: 'DOUBLE' },
  { id: '200-59x91', size: '59*91', gsm: '200', closingStock: 657, minStock: 0, category: 'DOUBLE' },
  { id: '200-59.5x93', size: '59.5*93', gsm: '200', closingStock: 270, minStock: 0, category: 'DOUBLE' },
  { id: '200-62.5x95', size: '62.5*95', gsm: '200', closingStock: 276, minStock: 0, category: 'DOUBLE' },
  { id: '200-63x64', size: '63*64', gsm: '200', closingStock: 326, minStock: 0, category: 'DOUBLE' },
  { id: '200-63.5x99', size: '63.5*99', gsm: '200', closingStock: 436, minStock: 0, category: 'DOUBLE' },
  { id: '200-65x101', size: '65*101', gsm: '200', closingStock: 0, minStock: 0, category: 'DOUBLE' },
  { id: '200-68x69', size: '68*69', gsm: '200', closingStock: 133, minStock: 0, category: 'DOUBLE' },
  { id: '200-72x48', size: '72*48', gsm: '200', closingStock: 79, minStock: 0, category: 'DOUBLE' },
  { id: '200-73x74', size: '73*74', gsm: '200', closingStock: 50, minStock: 0, category: 'DOUBLE' },
  { id: '200-50x89', size: '50*89', gsm: '200', closingStock: 239, minStock: 0, category: 'DOUBLE' },

  // 140 GYT GSM
  { id: '140GYT-53', size: '53', gsm: '140GYT', closingStock: 0, minStock: 0, category: 'SINGLE' },
  { id: '140GYT-57', size: '57', gsm: '140GYT', closingStock: 792, minStock: 0, category: 'SINGLE' },
  { id: '140GYT-60', size: '60', gsm: '140GYT', closingStock: 0, minStock: 0, category: 'SINGLE' },
  { id: '140GYT-65', size: '65', gsm: '140GYT', closingStock: 173, minStock: 0, category: 'SINGLE' },
  { id: '140GYT-70', size: '70', gsm: '140GYT', closingStock: 1016, minStock: 0, category: 'SINGLE' },
  { id: '140GYT-73', size: '73', gsm: '140GYT', closingStock: 0, minStock: 0, category: 'SINGLE' },
  { id: '140GYT-77', size: '77', gsm: '140GYT', closingStock: 1805, minStock: 0, category: 'SINGLE' },
  { id: '140GYT-82', size: '82', gsm: '140GYT', closingStock: 0, minStock: 0, category: 'SINGLE' },
  { id: '140GYT-85', size: '85', gsm: '140GYT', closingStock: 0, minStock: 0, category: 'SINGLE' },
  { id: '140GYT-88', size: '88', gsm: '140GYT', closingStock: 0, minStock: 0, category: 'SINGLE' },
  { id: '140GYT-90', size: '90', gsm: '140GYT', closingStock: 956, minStock: 0, category: 'SINGLE' },
  { id: '140GYT-95', size: '95', gsm: '140GYT', closingStock: 991, minStock: 0, category: 'SINGLE' },
  { id: '140GYT-100', size: '100', gsm: '140GYT', closingStock: 942, minStock: 0, category: 'SINGLE' },
  { id: '140GYT-104', size: '104', gsm: '140GYT', closingStock: 271, minStock: 0, category: 'SINGLE' },
  { id: '140GYT-108', size: '108', gsm: '140GYT', closingStock: 0, minStock: 0, category: 'SINGLE' },

  // 130 GSM
  { id: '130-54', size: '54', gsm: '130', closingStock: 76, minStock: 0, category: 'SINGLE' },
  { id: '130-56', size: '56', gsm: '130', closingStock: 0, minStock: 0, category: 'SINGLE' },
  { id: '130-58', size: '58', gsm: '130', closingStock: 190, minStock: 0, category: 'SINGLE' },
  { id: '130-59', size: '59', gsm: '130', closingStock: 44, minStock: 0, category: 'SINGLE' },
  { id: '130-61', size: '61', gsm: '130', closingStock: 175, minStock: 0, category: 'SINGLE' },
  { id: '130-63', size: '63', gsm: '130', closingStock: 0, minStock: 0, category: 'SINGLE' },
  { id: '130-68', size: '68', gsm: '130', closingStock: 0, minStock: 0, category: 'SINGLE' },
  { id: '130-75', size: '75', gsm: '130', closingStock: 159, minStock: 0, category: 'SINGLE' },
  { id: '130-86', size: '86', gsm: '130', closingStock: 0, minStock: 0, category: 'SINGLE' },
  { id: '130-90', size: '90', gsm: '130', closingStock: 99, minStock: 0, category: 'SINGLE' },
  { id: '130-100', size: '100', gsm: '130', closingStock: 0, minStock: 0, category: 'SINGLE' },
  { id: '130-102', size: '102', gsm: '130', closingStock: 0, minStock: 0, category: 'SINGLE' },
  { id: '130-106', size: '106', gsm: '130', closingStock: 35, minStock: 0, category: 'SINGLE' },
  { id: '130-108', size: '108', gsm: '130', closingStock: 0, minStock: 0, category: 'SINGLE' },

  // 100 GSM
  { id: '100-60', size: '60', gsm: '100', closingStock: 150, minStock: 0, category: 'SINGLE' },
  { id: '100-66', size: '66', gsm: '100', closingStock: 116, minStock: 0, category: 'SINGLE' },
  { id: '100-92', size: '92', gsm: '100', closingStock: 396, minStock: 0, category: 'SINGLE' },
  { id: '100-100', size: '100', gsm: '100', closingStock: 416, minStock: 0, category: 'SINGLE' },
  { id: '100-106', size: '106', gsm: '100', closingStock: 227, minStock: 0, category: 'SINGLE' },
  { id: '100-108', size: '108', gsm: '100', closingStock: 167, minStock: 0, category: 'SINGLE' },

  // 150 GSM
  { id: '150-92', size: '92', gsm: '150', closingStock: 140, minStock: 0, category: 'SINGLE' },
  { id: '150-68', size: '68', gsm: '150', closingStock: 387, minStock: 0, category: 'SINGLE' },
  { id: '150-84', size: '84', gsm: '150', closingStock: 0, minStock: 0, category: 'SINGLE' },
  { id: '150-104', size: '104', gsm: '150', closingStock: 67, minStock: 0, category: 'SINGLE' },
  { id: '150-108', size: '108', gsm: '150', closingStock: 85, minStock: 0, category: 'SINGLE' },
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const s = localStorage.getItem('enerpack_user_v1');
    return s ? JSON.parse(s) : null;
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
    const s = localStorage.getItem('enerpack_transactions_v11');
    return s ? JSON.parse(s) : [];
  });

  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>(() => {
    const s = localStorage.getItem('enerpack_changes_v1');
    return s ? JSON.parse(s) : [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(() => {
    const s = localStorage.getItem('enerpack_audit_v1');
    return s ? JSON.parse(s) : [];
  });
  
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => { localStorage.setItem('enerpack_inventory_v11', JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem('enerpack_transactions_v11', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('enerpack_accounts_v1', JSON.stringify(authorizedUsers)); }, [authorizedUsers]);
  useEffect(() => { localStorage.setItem('enerpack_changes_v1', JSON.stringify(changeRequests)); }, [changeRequests]);
  useEffect(() => { localStorage.setItem('enerpack_audit_v1', JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { 
    if (currentUser) localStorage.setItem('enerpack_user_v1', JSON.stringify(currentUser));
    else localStorage.removeItem('enerpack_user_v1');
  }, [currentUser]);

  const addAuditLog = (action: AuditEntry['action'], details: string, itemId?: string) => {
    if (!currentUser) return;
    const log: AuditEntry = {
      id: generateId(),
      timestamp: Date.now(),
      userId: currentUser.username,
      userName: currentUser.name,
      action,
      details,
      itemId
    };
    setAuditLogs(prev => [log, ...prev].slice(0, 1000));
  };

  const handleUpdateStock = (id: string, delta: number) => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, closingStock: Math.max(0, Number((item.closingStock + delta).toFixed(2))) } : item));
    const item = inventory.find(i => i.id === id);
    if (item) {
      addAuditLog('UPDATE_ITEM', `Stock Adjustment: ${delta > 0 ? '+' : ''}${delta} for ${item.size} (${item.gsm})`, id);
    }
  };

  const handleRecordTransaction = (transaction: Omit<StockTransaction, 'id' | 'timestamp'>) => {
    const newTransaction: StockTransaction = {
      ...transaction,
      id: generateId(),
      timestamp: Date.now()
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const handleAddItem = (item: Omit<InventoryItem, 'id'>) => {
    if (!currentUser) return;
    const newId = generateId();
    if (currentUser.role === 'ADMIN') {
      setInventory(prev => [...prev, { ...item, id: newId }]);
      addAuditLog('ADD_ITEM', `Permanently added ${item.size} (${item.gsm}) to inventory`, newId);
    } else {
      const req: ChangeRequest = {
        id: generateId(),
        timestamp: Date.now(),
        requestedBy: currentUser.username,
        requestedByName: currentUser.name,
        type: 'ADD',
        itemData: { ...item, id: newId },
        status: 'PENDING'
      };
      setChangeRequests(prev => [...prev, req]);
    }
  };

  const handleUpdateItem = (updatedItem: InventoryItem) => {
    if (!currentUser) return;
    const oldItem = inventory.find(i => i.id === updatedItem.id);
    if (!oldItem) return;

    if (currentUser.role === 'ADMIN') {
      setInventory(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
      // Log specific field changes
      let fieldChanges = [];
      if (oldItem.size !== updatedItem.size) fieldChanges.push(`Size: ${oldItem.size}➔${updatedItem.size}`);
      if (oldItem.gsm !== updatedItem.gsm) fieldChanges.push(`GSM: ${oldItem.gsm}➔${updatedItem.gsm}`);
      if (oldItem.minStock !== updatedItem.minStock) fieldChanges.push(`Min: ${oldItem.minStock}➔${updatedItem.minStock}`);
      
      addAuditLog('UPDATE_ITEM', `Direct Metadata Edit: ${fieldChanges.join(', ')}`, updatedItem.id);
    } else {
      const req: ChangeRequest = {
        id: generateId(),
        timestamp: Date.now(),
        requestedBy: currentUser.username,
        requestedByName: currentUser.name,
        type: 'UPDATE',
        itemId: updatedItem.id,
        itemData: updatedItem,
        oldData: oldItem,
        status: 'PENDING'
      };
      setChangeRequests(prev => [...prev, req]);
      setInventory(prev => prev.map(i => i.id === updatedItem.id ? { ...i, isPendingApproval: true } : i));
    }
  };

  const handleDeleteItem = (id: string) => {
    if (!currentUser) return;
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    if (currentUser.role === 'ADMIN') {
      if (confirm(`Delete ${item.size} (${item.gsm}) permanently?`)) {
        setInventory(prev => prev.filter(i => i.id !== id));
        addAuditLog('DELETE_ITEM', `Permanently deleted SKU: ${item.size} (${item.gsm})`, id);
      }
    } else {
      const req: ChangeRequest = {
        id: generateId(),
        timestamp: Date.now(),
        requestedBy: currentUser.username,
        requestedByName: currentUser.name,
        type: 'UPDATE', // Using UPDATE to trigger approval, but logic handles actual content
        itemId: id,
        itemData: item,
        status: 'PENDING'
      };
      setChangeRequests(prev => [...prev, req]);
    }
  };

  const handleProcessChangeRequest = (requestId: string, approved: boolean) => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    const req = changeRequests.find(r => r.id === requestId);
    if (!req) return;

    if (approved) {
      if (req.type === 'ADD') {
        setInventory(prev => [...prev, req.itemData as InventoryItem]);
        addAuditLog('APPROVE_CHANGE', `Approved Addition: ${req.itemData.size} (${req.itemData.gsm}) by ${req.requestedByName}`);
      } else if (req.type === 'UPDATE' && req.itemId) {
        setInventory(prev => prev.map(i => i.id === req.itemId ? { ...req.itemData as InventoryItem, isPendingApproval: false } : i));
        
        let diffs = [];
        const old = req.oldData as any;
        const fresh = req.itemData as any;
        if (old && fresh) {
          ['size', 'gsm', 'minStock'].forEach(f => {
             if (old[f] !== fresh[f]) diffs.push(`${f}: ${old[f]}➔${fresh[f]}`);
          });
        }

        addAuditLog('APPROVE_CHANGE', `Approved Update for ${req.oldData?.size || 'Item'}: ${diffs.join(', ')} (Editor: ${req.requestedByName})`, req.itemId);
      } else if (req.type === 'DELETE' && req.itemId) {
        setInventory(prev => prev.filter(i => i.id !== req.itemId));
        addAuditLog('APPROVE_CHANGE', `Approved Deletion: ${req.itemData.size} (${req.itemData.gsm}) by ${req.requestedByName}`, req.itemId);
      }
    } else {
      if (req.type === 'UPDATE' && req.itemId) {
        setInventory(prev => prev.map(i => i.id === req.itemId ? { ...i, isPendingApproval: false } : i));
      }
      addAuditLog('DENY_CHANGE', `Denied ${req.type} request from ${req.requestedByName}`);
    }

    setChangeRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const handleNavigate = (mode: ViewMode) => {
    setViewMode(mode);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      setCurrentUser(null);
      setViewMode(ViewMode.DASHBOARD);
      setIsMobileMenuOpen(false);
    }
  };

  const handleRequestSignup = useCallback((signupData: Omit<UserAccount, 'role' | 'status' | 'createdAt'>) => {
    const newAccount: UserAccount = {
      ...signupData,
      role: 'USER',
      status: 'PENDING',
      createdAt: Date.now(),
      allowedPages: [ViewMode.DASHBOARD, ViewMode.INVENTORY] // Default pages
    };
    setAuthorizedUsers(prev => [...prev, newAccount]);
  }, []);

  const handleUpdateAccountStatus = (username: string, status: 'APPROVED' | 'DENIED', newRole?: UserRole, allowedPages?: ViewMode[]) => {
    setAuthorizedUsers(prev => prev.map(u => u.username === username ? { 
      ...u, 
      status, 
      role: newRole || u.role,
      allowedPages: allowedPages || u.allowedPages
    } : u));
    addAuditLog('USER_VERIFY', `Personnel @${username} status updated to ${status} (${newRole || 'No Role Change'})`, username);
  };

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} authorizedUsers={authorizedUsers} onRequestSignup={handleRequestSignup} />;
  }

  const isAdmin = currentUser.role === 'ADMIN';
  const isEditor = currentUser.role === 'ADMIN' || currentUser.role === 'EDITOR';
  const pendingCount = authorizedUsers.filter(a => a.status === 'PENDING').length + changeRequests.length;

  // Filter navigation by permissions
  const navItems = [
    { mode: ViewMode.DASHBOARD, icon: Gauge, label: "Dashboard", category: "Main" },
    { mode: ViewMode.INVENTORY, icon: Boxes, label: "Inventory", category: "Main" },
    { mode: ViewMode.STOCK_IN_LOGS, icon: PackagePlus, label: "Stock In Logs", category: "Transactions" },
    { mode: ViewMode.STOCK_OUT_LOGS, icon: PackageMinus, label: "Stock Out Logs", category: "Transactions" },
    { mode: ViewMode.PENDING_WORKS, icon: Activity, label: "Pending Works", category: "Transactions" },
    { mode: ViewMode.REORDER_ALERTS, icon: BellRing, label: "Reorder Alerts", category: "Planning" },
    { mode: ViewMode.REORDER_HISTORY, icon: History, label: "Reorder History", category: "Planning" },
    { mode: ViewMode.FORECAST, icon: Telescope, label: "Forecast", category: "Planning" },
    { mode: ViewMode.PAPER_CALCULATOR, icon: Calculator, label: "Paper Calculator", category: "Tools" },
    { mode: ViewMode.JOB_CARD_GENERATOR, icon: FileStack, label: "Job Cards", category: "Tools" },
  ];

  const allowedNavItems = isAdmin 
    ? navItems 
    : navItems.filter(item => currentUser.allowedPages?.includes(item.mode));

  const categorizedNav = allowedNavItems.reduce((acc: Record<string, typeof navItems>, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="h-screen w-full bg-[#f1f5f9] flex overflow-hidden font-sans print:h-auto print:overflow-visible print:block">
      
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[45] md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0c4a6e] transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 shadow-[20px_0_60px_-15px_rgba(0,0,0,0.5)]' : '-translate-x-full'} md:static flex flex-col shrink-0 border-r border-white/5 overflow-y-auto print:hidden`}>
        <div className="p-6 border-b border-white/10 mb-2 flex justify-between items-center">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20 shrink-0">
                 <Boxes className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                 <h2 className="text-white font-black text-2xl tracking-tighter uppercase leading-none">Enerpack</h2>
                 <p className="text-blue-300 text-[7px] font-bold uppercase tracking-[0.15em] mt-1 opacity-80">OPERATIONS SYSTEM</p>
              </div>
           </div>
           <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-2 text-blue-200 hover:text-white transition-colors">
             <X className="w-6 h-6" />
           </button>
        </div>

        <div className="px-6 py-4 border-b border-white/5 bg-black/10">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-400/20 flex items-center justify-center text-blue-300 border border-blue-400/30">
                 <UserIcon className="w-4 h-4" />
              </div>
              <div className="flex flex-col overflow-hidden">
                 <span className="text-white text-xs font-bold truncate">{currentUser.name}</span>
                 <span className={`text-[9px] font-black uppercase tracking-widest ${isAdmin ? 'text-emerald-400' : isEditor ? 'text-amber-400' : 'text-blue-300'}`}>
                    {isAdmin ? 'Administrator' : isEditor ? 'Editor Access' : 'Read Only'}
                 </span>
              </div>
           </div>
        </div>
        
        <div className="flex-1 px-3 space-y-1 py-4">
           {Object.entries(categorizedNav).map(([cat, items]) => (
             <div key={cat} className="mb-4">
               <h3 className="px-4 text-[10px] font-bold text-blue-200/40 uppercase tracking-[0.15em] mb-2">{cat}</h3>
               {items.map(item => (
                 <NavBtn 
                   key={item.mode}
                   icon={item.icon} 
                   label={item.label} 
                   active={viewMode === item.mode} 
                   onClick={() => handleNavigate(item.mode)} 
                 />
               ))}
             </div>
           ))}

           {isAdmin && (
             <div className="mb-4 pb-20 md:pb-0">
               <h3 className="px-4 text-[10px] font-bold text-blue-200/40 uppercase tracking-[0.15em] mb-2">System</h3>
               <NavBtn 
                icon={Settings2} 
                label="Admin Control" 
                active={viewMode === ViewMode.ADMIN_PANEL} 
                onClick={() => handleNavigate(ViewMode.ADMIN_PANEL)} 
                badge={pendingCount > 0 ? pendingCount : undefined}
                badgeColor="bg-rose-500"
               />
             </div>
           )}
        </div>

        <div className="p-4 mt-auto border-t border-white/10 bg-[#0c4a6e]/80 backdrop-blur-md sticky bottom-0">
           <button onClick={handleLogout} className="flex items-center gap-3 text-rose-300 hover:text-rose-400 transition-colors w-full px-4 py-3 rounded-2xl hover:bg-rose-400/10">
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-widest">Sign Out</span>
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden print:h-auto print:overflow-visible print:block relative">
        <header className="md:hidden bg-[#0c4a6e] px-5 py-3 flex items-center justify-between shrink-0 shadow-lg z-40">
           <div className="flex items-center gap-3">
              <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-white bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                 <Menu className="w-6 h-6" />
              </button>
              <h2 className="text-white font-black text-lg tracking-tighter uppercase leading-none">Enerpack</h2>
           </div>
        </header>

        <div className="flex-1 overflow-hidden print:overflow-visible print:h-auto print:block relative">
          {viewMode === ViewMode.DASHBOARD && <Dashboard items={inventory} transactions={transactions} onNavigate={handleNavigate} user={currentUser} />}
          {viewMode === ViewMode.INVENTORY && <InventoryTable items={inventory} transactions={transactions} onUpdateStock={handleUpdateStock} onAddItem={handleAddItem} onRecordTransaction={handleRecordTransaction} onBulkUpdate={setInventory} onUpdateItem={handleUpdateItem} onDeleteItem={handleDeleteItem} isAdmin={isEditor} />}
          {viewMode === ViewMode.JOB_CARD_GENERATOR && <JobCardGenerator onBack={() => setViewMode(ViewMode.DASHBOARD)} />}
          {viewMode === ViewMode.FORECAST && <ForecastPage items={inventory} transactions={transactions} onBack={() => setViewMode(ViewMode.DASHBOARD)} />}
          {viewMode === ViewMode.PAPER_CALCULATOR && <PaperCalculator onBack={() => setViewMode(ViewMode.DASHBOARD)} />}
          {viewMode === ViewMode.REORDER_ALERTS && <ReorderPage items={inventory} onBack={() => setViewMode(ViewMode.DASHBOARD)} onUpdateItem={handleUpdateItem} onRecordTransaction={handleRecordTransaction} isAdmin={isEditor} />}
          {viewMode === ViewMode.PENDING_WORKS && <PendingWorks transactions={transactions} onBack={() => setViewMode(ViewMode.DASHBOARD)} onUpdateTransaction={(id, upd) => setTransactions(prev => prev.map(t => t.id === id ? {...t, ...upd} : t))} onUpdatePriority={(id, p) => setTransactions(prev => prev.map(t => t.id === id ? {...t, priority: p} : t))} isAdmin={isEditor} />}
          {viewMode === ViewMode.ADMIN_PANEL && isAdmin && (
            <AdminPanel 
              accounts={authorizedUsers} 
              inventoryCount={inventory.length} 
              transactionCount={transactions.length} 
              onBack={() => setViewMode(ViewMode.DASHBOARD)} 
              onUpdateAccountStatus={handleUpdateAccountStatus} 
              changeRequests={changeRequests}
              auditLogs={auditLogs}
              onProcessChangeRequest={handleProcessChangeRequest}
            />
          )}
          {(viewMode === ViewMode.STOCK_IN_LOGS || viewMode === ViewMode.STOCK_OUT_LOGS || viewMode === ViewMode.REORDER_HISTORY) && (
            <TransactionHistory 
              type={viewMode === ViewMode.STOCK_IN_LOGS ? 'IN' : viewMode === ViewMode.STOCK_OUT_LOGS ? 'OUT' : 'REORDER'} 
              transactions={transactions} 
              onBack={() => setViewMode(ViewMode.DASHBOARD)} 
            />
          )}
        </div>

        <nav className="md:hidden bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-2 flex items-center justify-around shrink-0 z-40 shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.1)] mb-[env(safe-area-inset-bottom)]">
           <BottomNavBtn icon={Gauge} label="Home" active={viewMode === ViewMode.DASHBOARD} onClick={() => handleNavigate(ViewMode.DASHBOARD)} />
           <BottomNavBtn icon={Boxes} label="Inventory" active={viewMode === ViewMode.INVENTORY} onClick={() => handleNavigate(ViewMode.INVENTORY)} />
           <BottomNavBtn icon={FileStack} label="Jobs" active={viewMode === ViewMode.JOB_CARD_GENERATOR} onClick={() => handleNavigate(ViewMode.JOB_CARD_GENERATOR)} />
           <BottomNavBtn icon={Menu} label="Menu" active={isMobileMenuOpen} onClick={() => setIsMobileMenuOpen(true)} />
        </nav>
      </main>
    </div>
  );
};

const NavBtn = ({ icon: Icon, label, active, onClick, badge, badgeColor = "bg-blue-500" }: any) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 group ${active ? 'bg-white/10 text-white font-bold' : 'text-slate-300/70 hover:text-white hover:bg-white/5'}`}>
    <div className="flex items-center gap-3">
      <Icon className={`w-5 h-5 transition-colors ${active ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'}`} />
      <span className="text-sm tracking-tight">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {badge !== undefined && <span className={`${badgeColor} text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg`}>{badge}</span>}
      {active && <ChevronRight className="w-4 h-4 text-blue-400" />}
    </div>
  </button>
);

const BottomNavBtn = ({ icon: Icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all flex-1 ${active ? 'text-[#0c4a6e]' : 'text-slate-400'}`}>
    <div className={`p-1 rounded-xl transition-all ${active ? 'bg-blue-50 scale-110' : 'bg-transparent'}`}>
      <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
    </div>
    <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
  </button>
);

export default App;