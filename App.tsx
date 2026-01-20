
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
import { InventoryItem, ViewMode, StockTransaction, User, UserAccount, UserRole, ChangeRequest, AuditEntry } from './types';
import { 
  Gauge, PackagePlus, PackageMinus, BellRing, 
  Calculator, Telescope, LogOut, Boxes, ChevronRight, Settings2, 
  User as UserIcon, Menu, X, Activity, History, FileStack, 
  MousePointer2, UserPlus, Bell
} from 'lucide-react';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
};

interface AppNotification {
  id: string;
  type: 'USER' | 'CHANGE';
  message: string;
  subTab: 'STAFFS' | 'APPROVAL';
}

// COMPREHENSIVE INITIAL INVENTORY DATA
const INITIAL_DATA: InventoryItem[] = [
  // 280 GSM SINGLE SIZE
  { id: '280-54', size: '54', gsm: '280', closingStock: 1019, minStock: 500, category: 'SINGLE' },
  { id: '280-56', size: '56', gsm: '280', closingStock: 100, minStock: 500, category: 'SINGLE' },
  { id: '280-58', size: '58', gsm: '280', closingStock: 1284, minStock: 500, category: 'SINGLE' },
  { id: '280-59', size: '59', gsm: '280', closingStock: 0, minStock: 400, category: 'SINGLE' },
  { id: '280-60', size: '60', gsm: '280', closingStock: 0, minStock: 500, category: 'SINGLE' },
  { id: '280-63', size: '63', gsm: '280', closingStock: 0, minStock: 400, category: 'SINGLE' },
  { id: '280-65', size: '65', gsm: '280', closingStock: 393, minStock: 500, category: 'SINGLE' },
  { id: '280-68', size: '68', gsm: '280', closingStock: 0, minStock: 400, category: 'SINGLE' },
  { id: '280-70', size: '70', gsm: '280', closingStock: 0, minStock: 200, category: 'SINGLE' },
  { id: '280-73', size: '73', gsm: '280', closingStock: 0, minStock: 400, category: 'SINGLE' },
  { id: '280-76', size: '76', gsm: '280', closingStock: 0, minStock: 400, category: 'SINGLE' },
  { id: '280-78', size: '78', gsm: '280', closingStock: 154, minStock: 500, category: 'SINGLE' },
  { id: '280-80', size: '80', gsm: '280', closingStock: 1569, minStock: 500, category: 'SINGLE' },
  { id: '280-83', size: '83', gsm: '280', closingStock: 1337, minStock: 500, category: 'SINGLE' },
  { id: '280-86', size: '86', gsm: '280', closingStock: 828, minStock: 500, category: 'SINGLE' },
  { id: '280-88', size: '88', gsm: '280', closingStock: 1573, minStock: 500, category: 'SINGLE' },
  { id: '280-90', size: '90', gsm: '280', closingStock: 2524, minStock: 500, category: 'SINGLE' },
  { id: '280-93', size: '93', gsm: '280', closingStock: 837, minStock: 400, category: 'SINGLE' },
  { id: '280-96', size: '96', gsm: '280', closingStock: 470, minStock: 400, category: 'SINGLE' },
  { id: '280-98', size: '98', gsm: '280', closingStock: 760, minStock: 500, category: 'SINGLE' },
  { id: '280-100', size: '100', gsm: '280', closingStock: 1439, minStock: 500, category: 'SINGLE' },
  { id: '280-104', size: '104', gsm: '280', closingStock: 815, minStock: 400, category: 'SINGLE' },
  { id: '280-108', size: '108', gsm: '280', closingStock: 1308, minStock: 500, category: 'SINGLE' },

  // 280 GSM DOUBLE SIZE
  { id: '280-47x64', size: '47*64', gsm: '280', closingStock: 48, minStock: 20, category: 'DOUBLE' },
  { id: '280-54x73.5', size: '54*73.5', gsm: '280', closingStock: 33, minStock: 20, category: 'DOUBLE' },
  { id: '280-54x86', size: '54*86', gsm: '280', closingStock: 87, minStock: 20, category: 'DOUBLE' },
  { id: '280-56x68.5', size: '56*68.5', gsm: '280', closingStock: 33, minStock: 20, category: 'DOUBLE' },
  { id: '280-56x75', size: '56*75', gsm: '280', closingStock: 4, minStock: 20, category: 'DOUBLE' },
  { id: '280-56x86', size: '56*86', gsm: '280', closingStock: 323, minStock: 50, category: 'DOUBLE' },
  { id: '280-57.5x76', size: '57.5*76', gsm: '280', closingStock: 71, minStock: 20, category: 'DOUBLE' },
  { id: '280-57x68.5', size: '57*68.5', gsm: '280', closingStock: 125, minStock: 20, category: 'DOUBLE' },
  { id: '280-58x78', size: '58*78', gsm: '280', closingStock: 346, minStock: 50, category: 'DOUBLE' },
  { id: '280-59x78', size: '59*78', gsm: '280', closingStock: 71, minStock: 20, category: 'DOUBLE' },
  { id: '280-59x87.5', size: '59*87.5', gsm: '280', closingStock: 0, minStock: 20, category: 'DOUBLE' },
  { id: '280-59x95', size: '59*95', gsm: '280', closingStock: 134, minStock: 20, category: 'DOUBLE' },
  { id: '280-60x77.5', size: '60*77.5', gsm: '280', closingStock: 44, minStock: 20, category: 'DOUBLE' },
  { id: '280-61x83', size: '61*83', gsm: '280', closingStock: 44, minStock: 20, category: 'DOUBLE' },
  { id: '280-62x68', size: '62*68', gsm: '280', closingStock: 102, minStock: 20, category: 'DOUBLE' },
  { id: '280-63x75', size: '63*75', gsm: '280', closingStock: 154, minStock: 20, category: 'DOUBLE' },
  { id: '280-64x67', size: '64*67', gsm: '280', closingStock: 44, minStock: 20, category: 'DOUBLE' },
  { id: '280-65x88.5', size: '65*88.5', gsm: '280', closingStock: 56, minStock: 20, category: 'DOUBLE' },
  { id: '280-67x75', size: '67*75', gsm: '280', closingStock: 0, minStock: 20, category: 'DOUBLE' },
  { id: '280-68x69', size: '68*69', gsm: '280', closingStock: 132, minStock: 20, category: 'DOUBLE' },
  { id: '280-68x91.5', size: '68*91.5', gsm: '280', closingStock: 0, minStock: 20, category: 'DOUBLE' },
  { id: '280-70x72', size: '70*72', gsm: '280', closingStock: 0, minStock: 20, category: 'DOUBLE' },
  { id: '280-70x76', size: '70*76', gsm: '280', closingStock: 37, minStock: 20, category: 'DOUBLE' },
  { id: '280-70x79', size: '70*79', gsm: '280', closingStock: 0, minStock: 20, category: 'DOUBLE' },
  { id: '280-72x91.5', size: '72*91.5', gsm: '280', closingStock: 50, minStock: 20, category: 'DOUBLE' },
  { id: '280-73x81', size: '73*81', gsm: '280', closingStock: 119, minStock: 20, category: 'DOUBLE' },
  { id: '280-75x108.5', size: '75*108.5', gsm: '280', closingStock: 16, minStock: 10, category: 'DOUBLE' },
  { id: '280-76x111', size: '76*111', gsm: '280', closingStock: 123, minStock: 20, category: 'DOUBLE' },
  { id: '280-76x72', size: '76*72', gsm: '280', closingStock: 231, minStock: 20, category: 'DOUBLE' },
  { id: '280-78x70.5', size: '78*70.5', gsm: '280', closingStock: 29, minStock: 10, category: 'DOUBLE' },
  { id: '280-78x107', size: '78*107', gsm: '280', closingStock: 19, minStock: 10, category: 'DOUBLE' },
  { id: '280-82x111', size: '82*111', gsm: '280', closingStock: 40, minStock: 10, category: 'DOUBLE' },
  { id: '280-88x63', size: '88*63', gsm: '280', closingStock: 72, minStock: 20, category: 'DOUBLE' },
  { id: '280-90x66', size: '90*66', gsm: '280', closingStock: 86, minStock: 20, category: 'DOUBLE' },
  { id: '280-94.5x80.5', size: '94.5*80.5', gsm: '280', closingStock: 32, minStock: 10, category: 'DOUBLE' },
  { id: '280-100x74', size: '100*74', gsm: '280', closingStock: 20, minStock: 10, category: 'DOUBLE' },
  { id: '280-108x76', size: '108*76', gsm: '280', closingStock: 103, minStock: 20, category: 'DOUBLE' },
  { id: '280-61.5x92', size: '61.5*92', gsm: '280', closingStock: 0, minStock: 20, category: 'DOUBLE' },

  // 250 & 230 GSM
  { id: '250-50x64.5', size: '50*64.5', gsm: '250', closingStock: 213, minStock: 50, category: 'DOUBLE' },
  { id: '230-54x78', size: '54*78', gsm: '230', closingStock: 55, minStock: 20, category: 'DOUBLE' },
  { id: '230-59x91', size: '59*91', gsm: '230', closingStock: 42, minStock: 20, category: 'DOUBLE' },
  { id: '230-82x98', size: '82*98', gsm: '230', closingStock: 14, minStock: 10, category: 'DOUBLE' },
  { id: '230-86', size: '86', gsm: '230', closingStock: 416, minStock: 100, category: 'SINGLE' },
  { id: '230-86x110', size: '86*110', gsm: '230', closingStock: 56, minStock: 20, category: 'DOUBLE' },
  { id: '230-100x67', size: '100*67', gsm: '230', closingStock: 42, minStock: 20, category: 'DOUBLE' },

  // 200 GSM SINGLE SIZE
  { id: '200-65', size: '65', gsm: '200', closingStock: 0, minStock: 200, category: 'SINGLE' },
  { id: '200-68', size: '68', gsm: '200', closingStock: 1082, minStock: 400, category: 'SINGLE' },
  { id: '200-70', size: '70', gsm: '200', closingStock: 0, minStock: 200, category: 'SINGLE' },
  { id: '200-73', size: '73', gsm: '200', closingStock: 0, minStock: 200, category: 'SINGLE' },
  { id: '200-75', size: '75', gsm: '200', closingStock: 0, minStock: 200, category: 'SINGLE' },
  { id: '200-80', size: '80', gsm: '200', closingStock: 277, minStock: 300, category: 'SINGLE' },
  { id: '200-90', size: '90', gsm: '200', closingStock: 45, minStock: 200, category: 'SINGLE' },

  // 200 GSM DOUBLE SIZE
  { id: '200-41x83', size: '41*83', gsm: '200', closingStock: 80, minStock: 30, category: 'DOUBLE' },
  { id: '200-42.5x57.5', size: '42.5*57.5', gsm: '200', closingStock: 215, minStock: 50, category: 'DOUBLE' },
  { id: '200-43x73', size: '43*73', gsm: '200', closingStock: 283, minStock: 50, category: 'DOUBLE' },
  { id: '200-44.5x64', size: '44.5*64', gsm: '200', closingStock: 114, minStock: 30, category: 'DOUBLE' },
  { id: '200-45x76.5', size: '45*76.5', gsm: '200', closingStock: 44, minStock: 20, category: 'DOUBLE' },
  { id: '200-46.5x90', size: '46.5*90', gsm: '200', closingStock: 11, minStock: 10, category: 'DOUBLE' },
  { id: '200-47x70.5', size: '47*70.5', gsm: '200', closingStock: 188, minStock: 40, category: 'DOUBLE' },
  { id: '200-50x72', size: '50*72', gsm: '200', closingStock: 67, minStock: 20, category: 'DOUBLE' },
  { id: '200-50x79', size: '50*79', gsm: '200', closingStock: 701, minStock: 100, category: 'DOUBLE' },
  { id: '200-50x81', size: '50*81', gsm: '200', closingStock: 151, minStock: 40, category: 'DOUBLE' },
  { id: '200-50x83', size: '50*83', gsm: '200', closingStock: 130, minStock: 30, category: 'DOUBLE' },
  { id: '200-51x80', size: '51*80', gsm: '200', closingStock: 153, minStock: 40, category: 'DOUBLE' },
  { id: '200-52x68.5', size: '52*68.5', gsm: '200', closingStock: 75, minStock: 20, category: 'DOUBLE' },
  { id: '200-52x76.5', size: '52*76.5', gsm: '200', closingStock: 145, minStock: 40, category: 'DOUBLE' },
  { id: '200-53x83', size: '53*83', gsm: '200', closingStock: 674, minStock: 100, category: 'DOUBLE' },
  { id: '200-54x86', size: '54*86', gsm: '200', closingStock: 489, minStock: 100, category: 'DOUBLE' },
  { id: '200-56x82', size: '56*82', gsm: '200', closingStock: 356, minStock: 80, category: 'DOUBLE' },
  { id: '200-56x86', size: '56*86', gsm: '200', closingStock: 380, minStock: 80, category: 'DOUBLE' },
  { id: '200-57x85.5', size: '57*85.5', gsm: '200', closingStock: 153, minStock: 40, category: 'DOUBLE' },
  { id: '200-57x89', size: '57*89', gsm: '200', closingStock: 136, minStock: 30, category: 'DOUBLE' },
  { id: '200-57x90', size: '57*90', gsm: '200', closingStock: 241, minStock: 50, category: 'DOUBLE' },
  { id: '200-59x91', size: '59*91', gsm: '200', closingStock: 620, minStock: 100, category: 'DOUBLE' },
  { id: '200-59.5x93', size: '59.5*93', gsm: '200', closingStock: 270, minStock: 50, category: 'DOUBLE' },
  { id: '200-62.5x95', size: '62.5*95', gsm: '200', closingStock: 276, minStock: 50, category: 'DOUBLE' },
  { id: '200-63x64', size: '63*64', gsm: '200', closingStock: 326, minStock: 60, category: 'DOUBLE' },
  { id: '200-63.5x99', size: '63.5*99', gsm: '200', closingStock: 436, minStock: 80, category: 'DOUBLE' },
  { id: '200-65x101', size: '65*101', gsm: '200', closingStock: 75, minStock: 20, category: 'DOUBLE' },
  { id: '200-68x69', size: '68*69', gsm: '200', closingStock: 133, minStock: 30, category: 'DOUBLE' },
  { id: '200-72x48', size: '72*48', gsm: '200', closingStock: 79, minStock: 20, category: 'DOUBLE' },
  { id: '200-73x74', size: '73*74', gsm: '200', closingStock: 179, minStock: 40, category: 'DOUBLE' },
  { id: '200-50x89', size: '50*89', gsm: '200', closingStock: 239, minStock: 40, category: 'DOUBLE' },

  // 140GYT GSM
  { id: '140GYT-53', size: '53', gsm: '140GYT', closingStock: 0, minStock: 100, category: 'SINGLE' },
  { id: '140GYT-57', size: '57', gsm: '140GYT', closingStock: 612, minStock: 200, category: 'SINGLE' },
  { id: '140GYT-60', size: '60', gsm: '140GYT', closingStock: 0, minStock: 200, category: 'SINGLE' },
  { id: '140GYT-65', size: '65', gsm: '140GYT', closingStock: 0, minStock: 200, category: 'SINGLE' },
  { id: '140GYT-70', size: '70', gsm: '140GYT', closingStock: 866, minStock: 300, category: 'SINGLE' },
  { id: '140GYT-73', size: '73', gsm: '140GYT', closingStock: 0, minStock: 200, category: 'SINGLE' },
  { id: '140GYT-77', size: '77', gsm: '140GYT', closingStock: 1805, minStock: 400, category: 'SINGLE' },
  { id: '140GYT-82', size: '82', gsm: '140GYT', closingStock: 0, minStock: 200, category: 'SINGLE' },
  { id: '140GYT-85', size: '85', gsm: '140GYT', closingStock: 0, minStock: 200, category: 'SINGLE' },
  { id: '140GYT-88', size: '88', gsm: '140GYT', closingStock: 0, minStock: 200, category: 'SINGLE' },
  { id: '140GYT-90', size: '90', gsm: '140GYT', closingStock: 956, minStock: 300, category: 'SINGLE' },
  { id: '140GYT-95', size: '95', gsm: '140GYT', closingStock: 941, minStock: 300, category: 'SINGLE' },
  { id: '140GYT-100', size: '100', gsm: '140GYT', closingStock: 942, minStock: 300, category: 'SINGLE' },
  { id: '140GYT-104', size: '104', gsm: '140GYT', closingStock: 271, minStock: 200, category: 'SINGLE' },
  { id: '140GYT-108', size: '108', gsm: '140GYT', closingStock: 0, minStock: 200, category: 'SINGLE' },

  // 130 GSM
  { id: '130-54', size: '54', gsm: '130', closingStock: 218, minStock: 100, category: 'SINGLE' },
  { id: '130-56', size: '56', gsm: '130', closingStock: 0, minStock: 100, category: 'SINGLE' },
  { id: '130-58', size: '58', gsm: '130', closingStock: 190, minStock: 100, category: 'SINGLE' },
  { id: '130-59', size: '59', gsm: '130', closingStock: 44, minStock: 50, category: 'SINGLE' },
  { id: '130-61', size: '61', gsm: '130', closingStock: 286, minStock: 100, category: 'SINGLE' },
  { id: '130-63', size: '63', gsm: '130', closingStock: 0, minStock: 100, category: 'SINGLE' },
  { id: '130-68', size: '68', gsm: '130', closingStock: 0, minStock: 100, category: 'SINGLE' },
  { id: '130-75', size: '75', gsm: '130', closingStock: 59, minStock: 50, category: 'SINGLE' },
  { id: '130-86', size: '86', gsm: '130', closingStock: 0, minStock: 100, category: 'SINGLE' },
  { id: '130-90', size: '90', gsm: '130', closingStock: 0, minStock: 100, category: 'SINGLE' },
  { id: '130-100', size: '100', gsm: '130', closingStock: 0, minStock: 100, category: 'SINGLE' },
  { id: '130-102', size: '102', gsm: '130', closingStock: 0, minStock: 100, category: 'SINGLE' },
  { id: '130-106', size: '106', gsm: '130', closingStock: 35, minStock: 50, category: 'SINGLE' },
  { id: '130-108', size: '108', gsm: '130', closingStock: 0, minStock: 100, category: 'SINGLE' },

  // 100 & 150 GSM
  { id: '100-60', size: '60', gsm: '100', closingStock: 150, minStock: 50, category: 'SINGLE' },
  { id: '100-66', size: '66', gsm: '100', closingStock: 116, minStock: 50, category: 'SINGLE' },
  { id: '100-92', size: '92', gsm: '100', closingStock: 396, minStock: 100, category: 'SINGLE' },
  { id: '100-100', size: '100', gsm: '100', closingStock: 416, minStock: 100, category: 'SINGLE' },
  { id: '100-106', size: '106', gsm: '100', closingStock: 227, minStock: 100, category: 'SINGLE' },
  { id: '100-108', size: '108', gsm: '100', closingStock: 167, minStock: 100, category: 'SINGLE' },
  
  { id: '150-92', size: '92', gsm: '150', closingStock: 140, minStock: 50, category: 'SINGLE' },
  { id: '150-68', size: '68', gsm: '150', closingStock: 387, minStock: 100, category: 'SINGLE' },
  { id: '150-84', size: '84', gsm: '150', closingStock: 0, minStock: 50, category: 'SINGLE' },
  { id: '150-104', size: '104', gsm: '150', closingStock: 67, minStock: 50, category: 'SINGLE' },
  { id: '150-108', size: '108', gsm: '150', closingStock: 85, minStock: 50, category: 'SINGLE' },
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

  // Explicitly default to Dashboard on every fresh load/refresh
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [adminSubTab, setAdminSubTab] = useState<'OVERVIEW' | 'STAFFS' | 'APPROVAL' | 'AUDIT_LOG' | 'SYNC'>('OVERVIEW');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Notification State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const prevPendingUserCount = useRef(authorizedUsers.filter(a => a.status === 'PENDING').length);
  const prevPendingChangeCount = useRef(changeRequests.length);

  // Sync state to LocalStorage
  useEffect(() => { localStorage.setItem('enerpack_inventory_v11', JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem('enerpack_transactions_v1', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('enerpack_accounts_v1', JSON.stringify(authorizedUsers)); }, [authorizedUsers]);
  useEffect(() => { localStorage.setItem('enerpack_changes_v1', JSON.stringify(changeRequests)); }, [changeRequests]);
  useEffect(() => { localStorage.setItem('enerpack_audit_v1', JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { 
    if (currentUser) localStorage.setItem('enerpack_user_v1', JSON.stringify(currentUser));
    else localStorage.removeItem('enerpack_user_v1');
  }, [currentUser]);

  // Real-time Notification Monitor
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;

    const currentPendingUsers = authorizedUsers.filter(a => a.status === 'PENDING').length;
    const currentPendingChanges = changeRequests.length;

    // Detect new user registration
    if (currentPendingUsers > prevPendingUserCount.current) {
      const newNotification: AppNotification = {
        id: generateId(),
        type: 'USER',
        message: `New User Registration Request Detected!`,
        subTab: 'STAFFS'
      };
      setNotifications(prev => [...prev, newNotification]);
      // Auto dismiss after 6s
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== newNotification.id)), 6000);
    }

    // Detect new change request
    if (currentPendingChanges > prevPendingChangeCount.current) {
      const newNotification: AppNotification = {
        id: generateId(),
        type: 'CHANGE',
        message: `New Editor Change Proposal Arrival!`,
        subTab: 'APPROVAL'
      };
      setNotifications(prev => [...prev, newNotification]);
      // Auto dismiss after 6s
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== newNotification.id)), 6000);
    }

    prevPendingUserCount.current = currentPendingUsers;
    prevPendingChangeCount.current = currentPendingChanges;
  }, [authorizedUsers, changeRequests, currentUser]);

  const addAuditLog = useCallback((action: AuditEntry['action'], details: string, itemId?: string) => {
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
  }, [currentUser]);

  const handleUpdateStock = useCallback((id: string, delta: number) => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, closingStock: Math.max(0, Number((item.closingStock + delta).toFixed(2))) } : item));
    const item = inventory.find(i => i.id === id);
    if (item) {
      addAuditLog('UPDATE_ITEM', `Stock Adjustment: ${delta > 0 ? '+' : ''}${delta} for ${item.size} (${item.gsm})`, id);
    }
  }, [addAuditLog, inventory]);

  const handleRecordTransaction = useCallback((transaction: Omit<StockTransaction, 'id' | 'timestamp'>) => {
    const newTransaction: StockTransaction = { ...transaction, id: generateId(), timestamp: Date.now() };
    setTransactions(prev => [newTransaction, ...prev]);
  }, []);

  const handleAddItem = useCallback((item: Omit<InventoryItem, 'id'>) => {
    if (!currentUser) return;
    const newId = generateId();
    if (currentUser.role === 'ADMIN') {
      setInventory(prev => [...prev, { ...item, id: newId }]);
      addAuditLog('ADD_ITEM', `Permanently added ${item.size} (${item.gsm})`, newId);
    } else {
      const req: ChangeRequest = { id: generateId(), timestamp: Date.now(), requestedBy: currentUser.username, requestedByName: currentUser.name, type: 'ADD', itemData: { ...item, id: newId }, status: 'PENDING' };
      setChangeRequests(prev => [...prev, req]);
    }
  }, [currentUser, addAuditLog]);

  const handleUpdateItem = useCallback((updatedItem: InventoryItem) => {
    if (!currentUser) return;
    const oldItem = inventory.find(i => i.id === updatedItem.id);
    if (!oldItem) return;

    if (currentUser.role === 'ADMIN') {
      setInventory(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
      addAuditLog('UPDATE_ITEM', `Metadata Edit for ${updatedItem.size}`, updatedItem.id);
    } else {
      const req: ChangeRequest = { id: generateId(), timestamp: Date.now(), requestedBy: currentUser.username, requestedByName: currentUser.name, type: 'UPDATE', itemId: updatedItem.id, itemData: updatedItem, oldData: oldItem, status: 'PENDING' };
      setChangeRequests(prev => [...prev, req]);
      setInventory(prev => prev.map(i => i.id === updatedItem.id ? { ...i, isPendingApproval: true } : i));
    }
  }, [currentUser, addAuditLog, inventory]);

  const handleDeleteItem = useCallback((item: InventoryItem) => {
    if (!currentUser || !item) return;
    const id = item.id;

    if (window.confirm("Do you want to delete this item?")) {
      if (currentUser.role === 'ADMIN') {
        setInventory(prev => prev.filter(i => i.id !== id));
        addAuditLog('DELETE_ITEM', `Permanently deleted SKU: ${item.size}`, id);
      } else {
        const req: ChangeRequest = { 
          id: generateId(), 
          timestamp: Date.now(), 
          requestedBy: currentUser.username, 
          requestedByName: currentUser.name, 
          type: 'DELETE', 
          itemId: id, 
          itemData: item, 
          status: 'PENDING' 
        };
        setChangeRequests(prev => [req, ...prev]);
        setInventory(prev => prev.map(i => i.id === id ? { ...i, isPendingApproval: true } : i));
      }
    }
  }, [currentUser, addAuditLog]);

  const handleProcessChangeRequest = useCallback((requestId: string, approved: boolean) => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    const req = changeRequests.find(r => r.id === requestId);
    if (!req) return;
    
    if (approved) {
      if (req.type === 'ADD') {
        setInventory(prev => [...prev, req.itemData as InventoryItem]);
        addAuditLog('APPROVE_CHANGE', `Approved ADD for ${req.itemData.size}`, req.itemData.id);
      } else if (req.type === 'UPDATE' && req.itemId) {
        setInventory(prev => prev.map(i => i.id === req.itemId ? { ...req.itemData as InventoryItem, isPendingApproval: false } : i));
        addAuditLog('APPROVE_CHANGE', `Approved UPDATE for ${req.itemData.size}`, req.itemId);
      } else if (req.type === 'DELETE' && req.itemId) {
        setInventory(prev => prev.filter(i => i.id !== req.itemId));
        addAuditLog('APPROVE_CHANGE', `Approved DELETE for ${req.itemData.size}`, req.itemId);
      }
    } else {
      if ((req.type === 'UPDATE' || req.type === 'DELETE') && req.itemId) {
        setInventory(prev => prev.map(i => i.id === req.itemId ? { ...i, isPendingApproval: false } : i));
        addAuditLog('DENY_CHANGE', `Denied ${req.type} for ${req.itemData.size}`, req.itemId);
      }
    }
    setChangeRequests(prev => prev.filter(r => r.id !== requestId));
  }, [currentUser, addAuditLog, changeRequests]);

  const handleLogout = () => { if (window.confirm('Log out?')) { setCurrentUser(null); setViewMode(ViewMode.DASHBOARD); } };

  const handleRequestSignup = useCallback((signupData: Omit<UserAccount, 'role' | 'status' | 'createdAt'>) => {
    const newAccount: UserAccount = { ...signupData, role: 'USER', status: 'PENDING', createdAt: Date.now(), allowedPages: [ViewMode.DASHBOARD] };
    setAuthorizedUsers(prev => [...prev, newAccount]);
  }, []);

  const handleUpdateAccountStatus = useCallback((username: string, status: UserAccount['status'], role?: UserRole, allowedPages?: ViewMode[]) => {
    // Fixed: changed undefined 'newRole' to the function parameter 'role'
    setAuthorizedUsers(prev => prev.map(u => u.username === username ? { ...u, status, role: role || u.role, allowedPages: allowedPages || u.allowedPages } : u));
    addAuditLog('USER_VERIFY', `Personnel @${username} updated to ${status}`, username);
  }, [addAuditLog]);

  const handleDeleteAuditLog = (id: string) => {
    setAuditLogs(prev => prev.filter(log => log.id !== id));
  };

  const handleClearAuditLogs = () => {
    if (window.confirm("Are you absolutely sure you want to PERMANENTLY delete all audit logs? This cannot be undone.")) {
      setAuditLogs([]);
    }
  };

  const navigateToAdminSubTab = (subTab: typeof adminSubTab) => {
    setViewMode(ViewMode.ADMIN_PANEL);
    setAdminSubTab(subTab);
  };

  if (!currentUser) return <Login onLogin={setCurrentUser} authorizedUsers={authorizedUsers} onRequestSignup={handleRequestSignup} />;

  const isAdmin = currentUser.role === 'ADMIN';
  const canEditCurrentPage = isAdmin || (currentUser.role === 'EDITOR' && currentUser.allowedPages?.includes(viewMode));
  const pendingUserCount = authorizedUsers.filter(a => a.status === 'PENDING').length;
  const pendingChangeCount = changeRequests.length;
  const totalAdminAlerts = pendingUserCount + pendingChangeCount;

  const navItems = [
    { mode: ViewMode.DASHBOARD, icon: Gauge, label: "Dashboard", category: "Main" },
    { mode: ViewMode.INVENTORY, icon: Boxes, label: "Inventory", category: "Main" },
    { mode: ViewMode.TRACKER, icon: MousePointer2, label: "Quick Tracker", category: "Main" },
    { mode: ViewMode.STOCK_IN_LOGS, icon: PackagePlus, label: "Stock In", category: "History" },
    { mode: ViewMode.STOCK_OUT_LOGS, icon: PackageMinus, label: "Stock Out", category: "History" },
    { mode: ViewMode.PENDING_WORKS, icon: Activity, label: "Pending", category: "History" },
    { mode: ViewMode.REORDER_ALERTS, icon: BellRing, label: "Alerts", category: "Planning" },
    { mode: ViewMode.REORDER_HISTORY, icon: History, label: "Reorders", category: "Planning" },
    { mode: ViewMode.FORECAST, icon: Telescope, label: "Forecast", category: "Planning" },
    { mode: ViewMode.PAPER_CALCULATOR, icon: Calculator, label: "Calculator", category: "Tools" },
    { mode: ViewMode.JOB_CARD_GENERATOR, icon: FileStack, label: "Job Cards", category: "Tools" },
  ];

  const categorizedNav = navItems.reduce((acc: Record<string, typeof navItems>, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const renderContent = () => {
    switch (viewMode) {
      case ViewMode.DASHBOARD:
        return <Dashboard items={inventory} transactions={transactions} onNavigate={setViewMode} user={currentUser} pendingUserRequests={authorizedUsers.filter(u => u.status === 'PENDING')} />;
      case ViewMode.INVENTORY:
        return <InventoryTable items={inventory} transactions={transactions} onUpdateStock={handleUpdateStock} onAddItem={handleAddItem} onRecordTransaction={handleRecordTransaction} onBulkUpdate={setInventory} onUpdateItem={handleUpdateItem} onDeleteItem={handleDeleteItem} isAdmin={canEditCurrentPage} />;
      case ViewMode.TRACKER:
        return <InventoryTracker items={inventory} transactions={transactions} onBack={() => setViewMode(ViewMode.DASHBOARD)} onRecordTransaction={handleRecordTransaction} onUpdateStock={handleUpdateStock} isAdmin={canEditCurrentPage} />;
      case ViewMode.STOCK_IN_LOGS:
        return <TransactionHistory type="IN" transactions={transactions} onBack={() => setViewMode(ViewMode.DASHBOARD)} />;
      case ViewMode.STOCK_OUT_LOGS:
        return <TransactionHistory type="OUT" transactions={transactions} onBack={() => setViewMode(ViewMode.DASHBOARD)} />;
      case ViewMode.REORDER_HISTORY:
        return <TransactionHistory type="REORDER" transactions={transactions} onBack={() => setViewMode(ViewMode.DASHBOARD)} />;
      case ViewMode.PENDING_WORKS:
        return <PendingWorks transactions={transactions} onBack={() => setViewMode(ViewMode.DASHBOARD)} onUpdateTransaction={(id, upd) => setTransactions(prev => prev.map(t => t.id === id ? {...t, ...upd} : t))} onUpdatePriority={(id, p) => setTransactions(prev => prev.map(t => t.id === id ? {...t, priority: p} : t))} isAdmin={canEditCurrentPage} />;
      case ViewMode.REORDER_ALERTS:
        return <ReorderPage items={inventory} onBack={() => setViewMode(ViewMode.DASHBOARD)} onUpdateItem={handleUpdateItem} onRecordTransaction={handleRecordTransaction} isAdmin={canEditCurrentPage} />;
      case ViewMode.FORECAST:
        return <ForecastPage items={inventory} transactions={transactions} onBack={() => setViewMode(ViewMode.DASHBOARD)} />;
      case ViewMode.PAPER_CALCULATOR:
        return <PaperCalculator onBack={() => setViewMode(ViewMode.DASHBOARD)} />;
      case ViewMode.JOB_CARD_GENERATOR:
        return <JobCardGenerator onBack={() => setViewMode(ViewMode.DASHBOARD)} />;
      case ViewMode.ADMIN_PANEL:
        return <AdminPanel accounts={authorizedUsers} inventoryCount={inventory.length} transactionCount={transactions.length} auditLogs={auditLogs} changeRequests={changeRequests} onBack={() => setViewMode(ViewMode.DASHBOARD)} onUpdateAccountStatus={handleUpdateAccountStatus} onProcessChangeRequest={handleProcessChangeRequest} onDeleteAuditLog={handleDeleteAuditLog} onClearAuditLogs={handleClearAuditLogs} activeSubTab={adminSubTab} onSubTabChange={setAdminSubTab} />;
      default:
        return <Dashboard items={inventory} transactions={transactions} onNavigate={setViewMode} user={currentUser} pendingUserRequests={authorizedUsers.filter(u => u.status === 'PENDING')} />;
    }
  };

  return (
    <div className="h-screen w-full bg-[#0c4a6e] flex overflow-hidden font-sans print:h-auto">
      {/* Sidebar - Sharp edges, strict overlay on mobile */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0c4a6e] transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} md:static flex flex-col shrink-0 overflow-y-auto print:hidden border-r border-white/5`}>
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg">
              <span className="font-black text-[#0c4a6e] text-sm brand-font">EP</span>
            </div>
            <div><h2 className="text-white font-bold text-xl tracking-tight uppercase leading-none brand-font">Ener Pack</h2></div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-5 py-3 border-b border-white/5 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-blue-400/20 flex items-center justify-center text-blue-300"><UserIcon className="w-3.5 h-3.5" /></div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-white text-[11px] font-bold truncate leading-tight">{currentUser.name}</span>
            <span className={`text-[8px] font-black uppercase tracking-widest ${isAdmin ? 'text-emerald-400' : currentUser.role === 'EDITOR' ? 'text-amber-400' : 'text-blue-300'}`}>{currentUser.role}</span>
          </div>
        </div>

        <div className="flex-1 px-3 space-y-0.5 py-4 overflow-y-auto scrollbar-hide">
           {Object.entries(categorizedNav).map(([cat, items]) => (
             <div key={cat} className="mb-3">
               <h3 className="px-3 text-[9px] font-black text-blue-200/30 uppercase tracking-[0.15em] mb-1.5">{cat}</h3>
               {items.map(item => (<NavBtn key={item.mode} icon={item.icon} label={item.label} active={viewMode === item.mode} onClick={() => { setViewMode(item.mode); setIsMobileMenuOpen(false); }} />))}
             </div>
           ))}
           {isAdmin && (
             <div className="mb-3">
               <h3 className="px-3 text-[9px] font-black text-blue-200/30 uppercase tracking-[0.15em] mb-1.5">Infrastructure</h3>
               <NavBtn 
                 icon={Settings2} 
                 label="Admin Panel" 
                 active={viewMode === ViewMode.ADMIN_PANEL} 
                 onClick={() => { setViewMode(ViewMode.ADMIN_PANEL); setIsMobileMenuOpen(false); }} 
                 badge={totalAdminAlerts > 0 ? totalAdminAlerts : undefined} 
                 badgeColor="bg-rose-500" 
                 shake={totalAdminAlerts > 0}
               />
             </div>
           )}
        </div>

        <div className="p-4 border-t border-white/5 bg-black/10">
           <button onClick={handleLogout} className="flex items-center gap-2.5 text-rose-300 hover:text-rose-400 transition-colors w-full px-3 py-2.5 rounded-xl hover:bg-rose-400/10">
              <LogOut className="w-4 h-4" /><span className="text-[11px] font-bold uppercase tracking-widest">Sign Out</span>
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#0c4a6e]">
        <header className="md:hidden bg-[#0c4a6e] px-4 py-3 flex items-center justify-between shrink-0 z-40">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-1.5 text-white/80 bg-white/10 rounded-lg hover:bg-white/20"><Menu className="w-5 h-5" /></button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center"><span className="text-[#0c4a6e] font-black text-[10px] brand-font">EP</span></div>
            <h2 className="text-white font-bold text-base uppercase tracking-tight brand-font">Ener Pack</h2>
          </div>
          <div className="w-8 h-8 relative flex items-center justify-center">
            {isAdmin && totalAdminAlerts > 0 && (
              <div className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full border-2 border-[#0c4a6e] animate-pulse"></div>
            )}
            <Settings2 onClick={() => isAdmin && setViewMode(ViewMode.ADMIN_PANEL)} className="w-5 h-5 text-white/60" />
          </div>
        </header>

        {/* Workspace Container */}
        <div className="flex-1 overflow-hidden relative bg-[#f1f5f9] shadow-[inset_0_2px_15px_rgba(0,0,0,0.1)]">
          {renderContent()}
          
          {/* Real-time Administrative Notifications */}
          <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-xs md:max-w-sm pointer-events-none print:hidden">
            {notifications.map(note => (
              <div 
                key={note.id} 
                className="pointer-events-auto bg-white border-2 border-slate-100 rounded-3xl p-4 shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-8 duration-500 hover:scale-105 transition-transform cursor-pointer group"
                onClick={() => {
                  navigateToAdminSubTab(note.subTab);
                  setNotifications(prev => prev.filter(n => n.id !== note.id));
                }}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${note.type === 'USER' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                  {note.type === 'USER' ? <UserPlus className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">Operational Alert</p>
                  <p className="text-xs font-bold text-slate-800 leading-tight">{note.message}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl group-hover:bg-blue-50 transition-colors">
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                </div>
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
    <div className="flex items-center gap-2.5">
      <div className={`${shake && !active ? 'animate-bounce' : ''}`}>
        <Icon className={`w-4 h-4 transition-colors ${active ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'}`} />
      </div>
      <span className="text-[11px] tracking-tight">{label}</span>
    </div>
    <div className="flex items-center gap-1.5">{badge !== undefined && <span className={`${badgeColor} text-white text-[8px] font-black px-1.5 py-0.5 rounded-full`}>{badge}</span>}{active && <ChevronRight className="w-3.5 h-3.5 text-blue-400" />}</div>
  </button>
);

export default App;
