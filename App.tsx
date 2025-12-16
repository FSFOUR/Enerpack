
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
  // --- 280 GSM Single Sizes ---
  { id: '1', size: '54', gsm: '280', closingStock: 1459, minStock: 0, remarks: '' },
  { id: '2', size: '56', gsm: '280', closingStock: 1463, minStock: 0, remarks: '' },
  { id: '3', size: '58', gsm: '280', closingStock: 1142, minStock: 0, remarks: '' },
  { id: '4', size: '59', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '5', size: '60', gsm: '280', closingStock: 2374, minStock: 0, remarks: '' },
  { id: '6', size: '63', gsm: '280', closingStock: 146, minStock: 0, remarks: '' },
  { id: '7', size: '65', gsm: '280', closingStock: 688, minStock: 0, remarks: '' },
  { id: '8', size: '66', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '9', size: '68', gsm: '280', closingStock: 729, minStock: 0, remarks: '' },
  { id: '10', size: '70', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '11', size: '72', gsm: '280', closingStock: 312, minStock: 0, remarks: '' },
  { id: '12', size: '73', gsm: '280', closingStock: 1150, minStock: 0, remarks: '' },
  { id: '13', size: '76', gsm: '280', closingStock: 1526, minStock: 0, remarks: '' },
  { id: '14', size: '78', gsm: '280', closingStock: 2084, minStock: 0, remarks: '' },
  { id: '15', size: '80', gsm: '280', closingStock: 298, minStock: 0, remarks: '' },
  { id: '16', size: '82', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '17', size: '83', gsm: '280', closingStock: 875, minStock: 0, remarks: '' },
  { id: '18', size: '86', gsm: '280', closingStock: 1628, minStock: 0, remarks: '' },
  { id: '19', size: '88', gsm: '280', closingStock: 696, minStock: 0, remarks: '' },
  { id: '20', size: '90', gsm: '280', closingStock: 1117, minStock: 0, remarks: '' },
  { id: '21', size: '92', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '22', size: '93', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '23', size: '95', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '24', size: '96', gsm: '280', closingStock: 1208, minStock: 0, remarks: '' },
  { id: '25', size: '97', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '26', size: '98', gsm: '280', closingStock: 945, minStock: 0, remarks: '' },
  { id: '27', size: '100', gsm: '280', closingStock: 2004, minStock: 0, remarks: '' },
  { id: '28', size: '104', gsm: '280', closingStock: 2007, minStock: 0, remarks: '' },
  { id: '29', size: '108', gsm: '280', closingStock: 767, minStock: 0, remarks: '' },

  // --- 280 GSM Double/Other Sizes ---
  { id: '30', size: '47*64', gsm: '280', closingStock: 67, minStock: 0, remarks: '' },
  { id: '31', size: '54*73.5', gsm: '280', closingStock: 56.5, minStock: 0, remarks: '' },
  { id: '32', size: '54*86', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '33', size: '56*68.5', gsm: '280', closingStock: 61.5, minStock: 0, remarks: '' },
  { id: '34', size: '56*75', gsm: '280', closingStock: 142, minStock: 0, remarks: '' },
  { id: '35', size: '56*86', gsm: '280', closingStock: 76.5, minStock: 0, remarks: '' },
  { id: '36', size: '57.5*76', gsm: '280', closingStock: 88, minStock: 0, remarks: '' },
  { id: '37', size: '57*68.5', gsm: '280', closingStock: 124.5, minStock: 0, remarks: '' },
  { id: '38', size: '58*78', gsm: '280', closingStock: 359, minStock: 0, remarks: '' },
  { id: '39', size: '59*74', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '40', size: '59*78', gsm: '280', closingStock: 71, minStock: 0, remarks: '' },
  { id: '41', size: '59*95', gsm: '280', closingStock: 141.5, minStock: 0, remarks: '' },
  { id: '42', size: '60*77.5', gsm: '280', closingStock: 112.5, minStock: 0, remarks: '' },
  { id: '43', size: '60.5*82.5', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '44', size: '61*83', gsm: '280', closingStock: 112, minStock: 0, remarks: '' },
  { id: '45', size: '62*68', gsm: '280', closingStock: 135, minStock: 0, remarks: '' },
  { id: '46', size: '63*75', gsm: '280', closingStock: 168, minStock: 0, remarks: '' },
  { id: '47', size: '64*67', gsm: '280', closingStock: 44.5, minStock: 0, remarks: '' },
  { id: '48', size: '65*72', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '49', size: '65*88.5', gsm: '280', closingStock: 80.5, minStock: 0, remarks: '' },
  { id: '50', size: '67*75', gsm: '280', closingStock: 167, minStock: 0, remarks: '' },
  { id: '51', size: '68*69', gsm: '280', closingStock: 32, minStock: 0, remarks: '' },
  { id: '52', size: '68*91.5', gsm: '280', closingStock: 43.5, minStock: 0, remarks: '' },
  { id: '53', size: '70*63', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '54', size: '70*72', gsm: '280', closingStock: 51, minStock: 0, remarks: '' },
  { id: '55', size: '70*76', gsm: '280', closingStock: 110.5, minStock: 0, remarks: '' },
  { id: '56', size: '70*79', gsm: '280', closingStock: 105, minStock: 0, remarks: '' },
  { id: '57', size: '71*90', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '58', size: '72*72', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '59', size: '72*91.5', gsm: '280', closingStock: 69.5, minStock: 0, remarks: '' },
  { id: '60', size: '73*70', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '61', size: '73*81', gsm: '280', closingStock: 144, minStock: 0, remarks: '' },
  { id: '62', size: '75*69', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '63', size: '75*108.5', gsm: '280', closingStock: 118.5, minStock: 0, remarks: '' },
  { id: '64', size: '76*111', gsm: '280', closingStock: 123.5, minStock: 0, remarks: '' },
  { id: '65', size: '76*72', gsm: '280', closingStock: 69, minStock: 0, remarks: '' },
  { id: '66', size: '77*58', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '67', size: '77*98', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '68', size: '78*107', gsm: '280', closingStock: 49.5, minStock: 0, remarks: '' },
  { id: '69', size: '78*70.5', gsm: '280', closingStock: 94.5, minStock: 0, remarks: '' },
  { id: '70', size: '82*111', gsm: '280', closingStock: 61, minStock: 0, remarks: '' },
  { id: '71', size: '84*58', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '72', size: '88*60', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '73', size: '88*63', gsm: '280', closingStock: 72, minStock: 0, remarks: '' },
  { id: '74', size: '88*66', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '75', size: '89*63.5', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '76', size: '90*64', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '77', size: '90*66.5', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '78', size: '90*66', gsm: '280', closingStock: 123, minStock: 0, remarks: '' },
  { id: '79', size: '90*76', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '80', size: '92*66', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '81', size: '92*90', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '82', size: '94.5*80.5', gsm: '280', closingStock: 75, minStock: 0, remarks: '' },
  { id: '83', size: '97*65', gsm: '280', closingStock: 0, minStock: 0, remarks: '' },
  { id: '84', size: '100*74', gsm: '280', closingStock: 30, minStock: 0, remarks: '' },
  { id: '85', size: '108*76', gsm: '280', closingStock: 118, minStock: 0, remarks: '' },

  // --- 250 GSM ---
  { id: '86', size: '50*64.5', gsm: '250', closingStock: 290, minStock: 0, remarks: '' },

  // --- 230 GSM ---
  { id: '87', size: '100*67', gsm: '230', closingStock: 42, minStock: 0, remarks: '' },
  { id: '88', size: '59*91', gsm: '230', closingStock: 42.5, minStock: 0, remarks: '' },
  { id: '89', size: '54*78', gsm: '230', closingStock: 55, minStock: 0, remarks: '' },
  { id: '90', size: '80*99', gsm: '230', closingStock: 1, minStock: 0, remarks: '' },
  { id: '91', size: '86*110', gsm: '230', closingStock: 56, minStock: 0, remarks: '' },
  { id: '92', size: '86.5', gsm: '230', closingStock: 416, minStock: 0, remarks: '' },
  { id: '93', size: '82*98', gsm: '230', closingStock: 77.5, minStock: 0, remarks: '' },

  // --- 200 GSM ---
  { id: '94', size: '43*73', gsm: '200', closingStock: 87, minStock: 0, remarks: '' },
  { id: '95', size: '44.5*64', gsm: '200', closingStock: 205, minStock: 0, remarks: '' },
  { id: '96', size: '47*70.5', gsm: '200', closingStock: 0, minStock: 0, remarks: '' },
  { id: '97', size: '50*68', gsm: '200', closingStock: 0, minStock: 0, remarks: '' },
  { id: '98', size: '50*72', gsm: '200', closingStock: 164.5, minStock: 0, remarks: '' },
  { id: '99', size: '50*79', gsm: '200', closingStock: 345, minStock: 0, remarks: '' },
  { id: '100', size: '50*81', gsm: '200', closingStock: 617, minStock: 0, remarks: '' },
  { id: '101', size: '50*83', gsm: '200', closingStock: 51, minStock: 0, remarks: '' },
  { id: '102', size: '51*80', gsm: '200', closingStock: 266.5, minStock: 0, remarks: '' },
  { id: '103', size: '53*83', gsm: '200', closingStock: 413, minStock: 0, remarks: '' },
  { id: '104', size: '56*83', gsm: '200', closingStock: 382, minStock: 0, remarks: '' },
  { id: '105', size: '56*86', gsm: '200', closingStock: 583.5, minStock: 0, remarks: '' },
  { id: '106', size: '57*89', gsm: '200', closingStock: 86, minStock: 0, remarks: '' },
  { id: '107', size: '57*90', gsm: '200', closingStock: 246, minStock: 0, remarks: '' },
  { id: '108', size: '62.5*95', gsm: '200', closingStock: 227.5, minStock: 0, remarks: '' },
  { id: '109', size: '68*69', gsm: '200', closingStock: 133.5, minStock: 0, remarks: '' },
  { id: '110', size: '73*74', gsm: '200', closingStock: 71, minStock: 0, remarks: '' },
  { id: '111', size: '48*72', gsm: '200', closingStock: 11, minStock: 0, remarks: '' },
  { id: '112', size: '46.5*90', gsm: '200', closingStock: 53.5, minStock: 0, remarks: '' },
  { id: '113', size: '42.5*57.5', gsm: '200', closingStock: 49, minStock: 0, remarks: '' },
  { id: '114', size: '63*64', gsm: '200', closingStock: 326.5, minStock: 0, remarks: '' },
  { id: '115', size: '54*86', gsm: '200', closingStock: 482.5, minStock: 0, remarks: '' },
  { id: '116', size: '57*85.5', gsm: '200', closingStock: 0, minStock: 0, remarks: '' },
  { id: '117', size: '59*91', gsm: '200', closingStock: 372.5, minStock: 0, remarks: '' },
  { id: '118', size: '59.5*93', gsm: '200', closingStock: 270.5, minStock: 0, remarks: '' },
  { id: '119', size: '63.5*99', gsm: '200', closingStock: 395, minStock: 0, remarks: '' },
  { id: '120', size: '65*101', gsm: '200', closingStock: 104.5, minStock: 0, remarks: '' },
  { id: '121', size: '45*76.5', gsm: '200', closingStock: 62, minStock: 0, remarks: '' },
  { id: '122', size: '52*76.5', gsm: '200', closingStock: 106.5, minStock: 0, remarks: '' },
  { id: '123', size: '54*83', gsm: '200', closingStock: 0, minStock: 0, remarks: '' },
  { id: '124', size: '72*48', gsm: '200', closingStock: 79, minStock: 0, remarks: '' },
  { id: '125', size: '75', gsm: '200', closingStock: 0, minStock: 0, remarks: '' },
  { id: '126', size: '65', gsm: '200', closingStock: 928, minStock: 0, remarks: '' },
  { id: '127', size: '73', gsm: '200', closingStock: 0, minStock: 0, remarks: '' },
  { id: '128', size: '80', gsm: '200', closingStock: 1117, minStock: 0, remarks: '' },
  { id: '129', size: '90', gsm: '200', closingStock: 0, minStock: 0, remarks: '' },
  { id: '130', size: '68', gsm: '200', closingStock: 1092, minStock: 0, remarks: '' },
  { id: '131', size: '105', gsm: '200', closingStock: 0, minStock: 0, remarks: '' },
  { id: '132', size: '108', gsm: '200', closingStock: 0, minStock: 0, remarks: '' },
  { id: '133', size: '88', gsm: '200', closingStock: 134, minStock: 0, remarks: '' },

  // --- 150 GSM ---
  { id: '134', size: '62', gsm: '150', closingStock: 0, minStock: 0, remarks: '' },
  { id: '135', size: '68', gsm: '150', closingStock: 387, minStock: 0, remarks: '' },
  { id: '136', size: '84', gsm: '150', closingStock: 91, minStock: 0, remarks: '' },
  { id: '137', size: '104', gsm: '150', closingStock: 67, minStock: 0, remarks: '' },
  { id: '138', size: '108', gsm: '150', closingStock: 99, minStock: 0, remarks: '' },

  // --- 140GYT ---
  { id: '139', size: '52', gsm: '140GYT', closingStock: 0, minStock: 0, remarks: '' },
  { id: '140', size: '53', gsm: '140GYT', closingStock: 0, minStock: 0, remarks: '' },
  { id: '141', size: '57', gsm: '140GYT', closingStock: 862, minStock: 0, remarks: '' },
  { id: '142', size: '60', gsm: '140GYT', closingStock: 0, minStock: 0, remarks: '' },
  { id: '143', size: '61', gsm: '140GYT', closingStock: 768, minStock: 0, remarks: '' },
  { id: '144', size: '65', gsm: '140GYT', closingStock: 563, minStock: 0, remarks: '' },
  { id: '145', size: '70', gsm: '140GYT', closingStock: 1016, minStock: 0, remarks: '' },
  { id: '146', size: '73', gsm: '140GYT', closingStock: 175, minStock: 0, remarks: '' },
  { id: '147', size: '77', gsm: '140GYT', closingStock: 1805, minStock: 0, remarks: '' },
  { id: '148', size: '82', gsm: '140GYT', closingStock: 280, minStock: 0, remarks: '' },
  { id: '149', size: '88', gsm: '140GYT', closingStock: 0, minStock: 0, remarks: '' },
  { id: '150', size: '90', gsm: '140GYT', closingStock: 956, minStock: 0, remarks: '' },
  { id: '151', size: '92', gsm: '140GYT', closingStock: 0, minStock: 0, remarks: '' },
  { id: '152', size: '95', gsm: '140GYT', closingStock: 991, minStock: 0, remarks: '' },
  { id: '153', size: '100', gsm: '140GYT', closingStock: 942, minStock: 0, remarks: '' },
  { id: '154', size: '104', gsm: '140GYT', closingStock: 491, minStock: 0, remarks: '' },
  { id: '155', size: '108', gsm: '140GYT', closingStock: 0, minStock: 0, remarks: '' },

  // --- 130 GSM ---
  { id: '156', size: '54', gsm: '130', closingStock: 0, minStock: 0, remarks: '' },
  { id: '157', size: '56', gsm: '130', closingStock: 0, minStock: 0, remarks: '' },
  { id: '158', size: '57', gsm: '130', closingStock: 56, minStock: 0, remarks: '' },
  { id: '159', size: '58', gsm: '130', closingStock: 260, minStock: 0, remarks: '' },
  { id: '160', size: '59', gsm: '130', closingStock: 0, minStock: 0, remarks: '' },
  { id: '161', size: '61', gsm: '130', closingStock: 0, minStock: 0, remarks: '' },
  { id: '162', size: '63', gsm: '130', closingStock: 0, minStock: 0, remarks: '' },
  { id: '163', size: '68', gsm: '130', closingStock: 0, minStock: 0, remarks: '' },
  { id: '164', size: '75', gsm: '130', closingStock: 299, minStock: 0, remarks: '' },
  { id: '165', size: '86', gsm: '130', closingStock: 0, minStock: 0, remarks: '' },
  { id: '166', size: '90', gsm: '130', closingStock: 0, minStock: 0, remarks: '' },
  { id: '167', size: '92', gsm: '130', closingStock: 0, minStock: 0, remarks: '' },
  { id: '168', size: '100', gsm: '130', closingStock: 279, minStock: 0, remarks: '' },
  { id: '169', size: '102', gsm: '130', closingStock: 0, minStock: 0, remarks: '' },
  { id: '170', size: '106', gsm: '130', closingStock: 35, minStock: 0, remarks: '' },
  { id: '171', size: '108', gsm: '130', closingStock: 79, minStock: 0, remarks: '' },
  { id: '172', size: '112', gsm: '130', closingStock: 0, minStock: 0, remarks: '' },

  // --- 130GYT ---
  { id: '173', size: '85', gsm: '130GYT', closingStock: 784, minStock: 0, remarks: '' },
  { id: '174', size: '57', gsm: '130GYT', closingStock: 0, minStock: 0, remarks: '' },
  { id: '175', size: '60', gsm: '130GYT', closingStock: 167, minStock: 0, remarks: '' },
  { id: '176', size: '65', gsm: '130GYT', closingStock: 0, minStock: 0, remarks: '' },
  { id: '177', size: '75', gsm: '130GYT', closingStock: 190, minStock: 0, remarks: '' },
  { id: '178', size: '85', gsm: '130GYT', closingStock: 138, minStock: 0, remarks: '' },
  { id: '179', size: '90', gsm: '130GYT', closingStock: 436, minStock: 0, remarks: '' },
  { id: '180', size: '92', gsm: '130GYT', closingStock: 0, minStock: 0, remarks: '' },

  // --- 100 GSM ---
  { id: '181', size: '54', gsm: '100', closingStock: 0, minStock: 0, remarks: '' },
  { id: '182', size: '60', gsm: '100', closingStock: 150, minStock: 0, remarks: '' },
  { id: '183', size: '63', gsm: '100', closingStock: 0, minStock: 0, remarks: '' },
  { id: '184', size: '66', gsm: '100', closingStock: 116, minStock: 0, remarks: '' },
  { id: '185', size: '73', gsm: '100', closingStock: 62, minStock: 0, remarks: '' },
  { id: '186', size: '81', gsm: '100', closingStock: 174, minStock: 0, remarks: '' },
  { id: '187', size: '86', gsm: '100', closingStock: 0, minStock: 0, remarks: '' },
  { id: '188', size: '92', gsm: '100', closingStock: 396, minStock: 0, remarks: '' },
  { id: '189', size: '100', gsm: '100', closingStock: 416, minStock: 0, remarks: '' },
  { id: '190', size: '106', gsm: '100', closingStock: 377, minStock: 0, remarks: '' },
  { id: '191', size: '108', gsm: '100', closingStock: 167, minStock: 0, remarks: '' },
  { id: '192', size: '114', gsm: '100', closingStock: 0, minStock: 0, remarks: '' },
];

const App: React.FC = () => {
  // Initialize ViewMode from local storage or default to DASHBOARD
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const savedMode = localStorage.getItem('enerpack_view_mode');
    return (savedMode as ViewMode) || ViewMode.DASHBOARD;
  });

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
    try {
      const saved = localStorage.getItem('enerpack_inventory_v6'); 
      if (saved) return JSON.parse(saved);
      
      // Migration from older versions
      const savedV5 = localStorage.getItem('enerpack_inventory_v5');
      if (savedV5) {
         // We force update to V6 this time
      }
      
      // Default to Demo/Initial Data if storage is empty
      return INITIAL_DATA;
    } catch (e) {
      console.error("Failed to load inventory from storage", e);
      return INITIAL_DATA;
    }
  });

  // State for Transactions
  const [transactions, setTransactions] = useState<StockTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('enerpack_transactions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load transactions", e);
      return [];
    }
  });

  // --- Persistence & Sync ---

  useEffect(() => {
    // Initialize Broadcast Channel
    channelRef.current = new BroadcastChannel('enerpack_updates');
    
    channelRef.current.onmessage = (event) => {
      const { type, message } = event.data;
      
      if (type === 'REFRESH_DATA') {
        // Reload data from local storage
        const savedInv = localStorage.getItem('enerpack_inventory_v6');
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
    localStorage.setItem('enerpack_inventory_v6', JSON.stringify(inventory));
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
      localStorage.setItem('enerpack_inventory_v6', JSON.stringify(newData));
      return newData;
    });
    setTimeout(() => notifyPeers(`Stock updated`), 50);
  };

  const handleUpdateItem = (updatedItem: InventoryItem) => {
    setInventory(prev => {
      const newData = prev.map(item => item.id === updatedItem.id ? updatedItem : item);
      localStorage.setItem('enerpack_inventory_v6', JSON.stringify(newData));
      return newData;
    });
    setTimeout(() => notifyPeers(`Item ${updatedItem.size} updated`), 50);
  };

  const handleAddItem = (newItem: Omit<InventoryItem, 'id'>) => {
    const item: InventoryItem = { ...newItem, id: crypto.randomUUID() };
    setInventory(prev => {
      const newData = [item, ...prev];
      localStorage.setItem('enerpack_inventory_v6', JSON.stringify(newData));
      return newData;
    });
    setTimeout(() => notifyPeers(`New item added: ${newItem.size}`), 50);
  };

  const handleBulkUpdate = (items: InventoryItem[]) => {
      setInventory(items);
      localStorage.setItem('enerpack_inventory_v6', JSON.stringify(items));
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

  // Generalized update function to handle status, vehicle, location etc.
  const handleUpdateTransaction = (id: string, updates: Partial<StockTransaction>) => {
    setTransactions(prev => {
      const newData = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      localStorage.setItem('enerpack_transactions', JSON.stringify(newData));
      return newData;
    });
    setTimeout(() => notifyPeers("Work details updated"), 50);
  };

  // Kept for backward compatibility if needed, but redirects to general handler
  const handleUpdateTransactionStatus = (id: string, newStatus: string) => {
    handleUpdateTransaction(id, { status: newStatus });
  };

  const handleUpdateTransactionPriority = (id: string, newPriority: string) => {
    handleUpdateTransaction(id, { priority: newPriority });
  };

  const handleNavigate = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('enerpack_view_mode', mode); // Persist view mode
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
              <div 
                key={n.id} 
                className={`px-4 py-3 rounded shadow-lg text-sm font-bold animate-in slide-in-from-right fade-in duration-300 pointer-events-auto flex items-center gap-2
                  ${n.type === 'success' ? 'bg-green-600 text-white' : 
                    n.type === 'warning' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-white'}`}
              >
                  {n.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                  {n.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                  {n.type === 'info' && <Bell className="w-4 h-4" />}
                  {n.message}
              </div>
          ))}
      </div>

      {/* Mobile Header */}
      <div className="md:hidden bg-enerpack-900 text-white p-3 flex justify-between items-center shadow-md z-50 print:hidden">
         <div className="font-black tracking-wider">ENERPACK</div>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
           {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
         </button>
      </div>

      {/* Sidebar Navigation */}
      <div className={`
        fixed inset-0 z-40 bg-enerpack-900/95 backdrop-blur-sm transition-transform duration-300 md:translate-x-0 md:relative md:inset-auto md:w-20 md:hover:w-20 md:bg-enerpack-900 md:shadow-xl flex flex-col py-6 md:py-8 overflow-y-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        print:hidden
      `}>
          <SidebarContent />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative print:overflow-visible">
        
        {/* Admin Login Modal */}
        {showLoginModal && (
          <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
               <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                 <Lock className="w-5 h-5 text-indigo-600" /> Admin Access
               </h2>
               <form onSubmit={handleLogin}>
                 <input 
                   type="password" 
                   autoFocus
                   placeholder="Enter Password" 
                   className="w-full border rounded p-2 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                   value={passwordInput}
                   onChange={e => setPasswordInput(e.target.value)}
                 />
                 <div className="flex justify-end gap-2">
                   <button 
                    type="button" 
                    onClick={() => setShowLoginModal(false)} 
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
                   >
                     Cancel
                   </button>
                   <button 
                    type="submit" 
                    className="px-4 py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700"
                   >
                     Login
                   </button>
                 </div>
               </form>
            </div>
          </div>
        )}

        {viewMode === ViewMode.DASHBOARD && (
            <Dashboard 
                items={inventory} 
                transactions={transactions} 
                onNavigate={handleNavigate}
            />
        )}

        {viewMode === ViewMode.INVENTORY && (
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
        )}

        {(viewMode === ViewMode.STOCK_IN_LOGS || viewMode === ViewMode.STOCK_OUT_LOGS) && (
          <TransactionHistory 
            type={viewMode === ViewMode.STOCK_IN_LOGS ? 'IN' : 'OUT'}
            transactions={transactions}
            onBack={() => handleNavigate(ViewMode.INVENTORY)}
          />
        )}

        {viewMode === ViewMode.PENDING_WORKS && (
            <PendingWorks 
                transactions={transactions}
                onBack={() => handleNavigate(ViewMode.INVENTORY)}
                onUpdateTransaction={handleUpdateTransaction}
                onUpdatePriority={handleUpdateTransactionPriority}
                isAdmin={isAdmin}
            />
        )}

        {viewMode === ViewMode.REORDER_ALERTS && (
            <ReorderPage 
                items={inventory}
                onBack={() => handleNavigate(ViewMode.INVENTORY)}
                onUpdateItem={handleUpdateItem}
                onRecordTransaction={handleRecordTransaction}
                isAdmin={isAdmin}
            />
        )}

        {viewMode === ViewMode.REORDER_LOGS && (
            <TransactionHistory 
                type="REORDER"
                transactions={transactions}
                onBack={() => handleNavigate(ViewMode.REORDER_ALERTS)}
            />
        )}

        {viewMode === ViewMode.JOB_CARDS && (
            <JobCardGenerator onBack={() => handleNavigate(ViewMode.DASHBOARD)} />
        )}

        {viewMode === ViewMode.PAPER_CALCULATOR && (
            <PaperCalculator onBack={() => handleNavigate(ViewMode.DASHBOARD)} />
        )}

        {viewMode === ViewMode.FORECAST && (
            <ForecastPage 
                items={inventory}
                transactions={transactions}
                onBack={() => handleNavigate(ViewMode.DASHBOARD)}
            />
        )}

      </div>
    </div>
  );
};

// Simple Icon for notifications
const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default App;
