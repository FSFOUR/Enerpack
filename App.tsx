
import React, { useState, useEffect, useRef } from 'react';
import InventoryTable from './components/InventoryTable';
import JobCardGenerator from './components/JobCardGenerator';
import Dashboard from './components/Dashboard';
import TransactionHistory from './components/TransactionHistory';
import PendingWorks from './components/PendingWorks';
import ReorderPage from './components/ReorderPage';
import PaperCalculator from './components/PaperCalculator';
import ForecastPage from './components/ForecastPage';
import { InventoryItem, ViewMode, StockTransaction, AppNotification } from './types';
import { ClipboardList, LayoutGrid, Archive, History, Clock, AlertTriangle, FileClock, Calculator, TrendingUp, LayoutDashboard, Menu, X, Lock, Unlock, Bell, LogOut, ChevronRight, User, Key, ShieldCheck } from 'lucide-react';

// Seed data
// ... (Seed data unchanged) ...
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

const LogoIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg" fill="none">
    {/* Colors: Using a solid blue #0056b3 from the image */}
    
    {/* Top Face (Lid) */}
    <path d="M50 15 L88 34 L50 53 L12 34 Z" fill="#0056b3" />
    
    {/* Left Face */}
    <path d="M12 39 L50 58 V92 L12 73 Z" fill="#0056b3" />

    {/* Right Face */}
    <path d="M50 58 L88 39 V73 L50 92 Z" fill="#0056b3" />

    {/* Letter E (Left Face - Slopes Down) */}
    <text 
      x="31" 
      y="76" 
      fontFamily="Arial, sans-serif" 
      fontWeight="900" 
      fontSize="36" 
      fill="white" 
      textAnchor="middle"
      style={{ transform: 'skewY(26.5deg)', transformBox: 'fill-box', transformOrigin: 'center' }}
    >
      E
    </text>

    {/* Letter P (Right Face - Slopes Up) */}
    <text 
      x="69" 
      y="60" 
      fontFamily="Arial, sans-serif" 
      fontWeight="900" 
      fontSize="36" 
      fill="white" 
      textAnchor="middle"
      style={{ transform: 'skewY(-26.5deg)', transformBox: 'fill-box', transformOrigin: 'center' }}
    >
      P
    </text>

    {/* Stack Lines (Right Face - Slopes Up) */}
    <g style={{ transform: 'skewY(-26.5deg)', transformBox: 'fill-box', transformOrigin: 'center' }}>
      <rect x="58" y="72" width="22" height="2" fill="white" />
      <rect x="58" y="78" width="22" height="2" fill="white" />
      <rect x="58" y="84" width="22" height="2" fill="white" />
    </g>
  </svg>
);

const App: React.FC = () => {
  // ... state declarations ...
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const savedMode = localStorage.getItem('enerpack_view_mode');
    return (savedMode as ViewMode) || ViewMode.DASHBOARD;
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => {
    // Check local storage for persistent login
    return localStorage.getItem('enerpack_is_admin') === 'true';
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Login & Change Password States
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isChangePasswordMode, setIsChangePasswordMode] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newUsernameInput, setNewUsernameInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');

  const [adminCredentials, setAdminCredentials] = useState(() => {
    try {
        const saved = localStorage.getItem('enerpack_admin_creds');
        return saved ? JSON.parse(saved) : { username: 'admin', password: 'admin' };
    } catch {
        return { username: 'admin', password: 'admin' };
    }
  });

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // ... (Data loading and sync logic remains same) ...
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('enerpack_inventory_v6'); 
      if (saved) return JSON.parse(saved);
      return INITIAL_DATA;
    } catch (e) {
      console.error("Failed to load inventory from storage", e);
      return INITIAL_DATA;
    }
  });

  const [transactions, setTransactions] = useState<StockTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('enerpack_transactions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load transactions", e);
      return [];
    }
  });

  useEffect(() => {
    channelRef.current = new BroadcastChannel('enerpack_updates');
    channelRef.current.onmessage = (event) => {
      const { type, message } = event.data;
      if (type === 'REFRESH_DATA') {
        const savedInv = localStorage.getItem('enerpack_inventory_v6');
        if (savedInv) setInventory(JSON.parse(savedInv));
        const savedTrans = localStorage.getItem('enerpack_transactions');
        if (savedTrans) setTransactions(JSON.parse(savedTrans));
        if (message) addNotification(message, 'info');
      }
    };
    return () => { channelRef.current?.close(); };
  }, []);

  useEffect(() => {
    localStorage.setItem('enerpack_inventory_v6', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('enerpack_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // ... helper functions ...
  const notifyPeers = (message: string) => {
    channelRef.current?.postMessage({ type: 'REFRESH_DATA', message });
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
    if (usernameInput === adminCredentials.username && passwordInput === adminCredentials.password) {
      setIsAdmin(true);
      // Persist login
      localStorage.setItem('enerpack_is_admin', 'true');
      setShowLoginModal(false);
      setPasswordInput('');
      setUsernameInput('');
      addNotification("Logged in as Admin", 'success');
    } else {
      alert("Invalid username or password");
    }
  };

  const handleChangeCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPasswordInput !== adminCredentials.password) {
        alert("Current password is incorrect.");
        return;
    }
    if (!newUsernameInput.trim() || !newPasswordInput.trim()) {
        alert("Username and Password cannot be empty.");
        return;
    }
    
    const newCreds = { username: newUsernameInput, password: newPasswordInput };
    setAdminCredentials(newCreds);
    localStorage.setItem('enerpack_admin_creds', JSON.stringify(newCreds));
    
    addNotification("Credentials updated successfully", 'success');
    setIsChangePasswordMode(false);
    setCurrentPasswordInput('');
    setNewUsernameInput('');
    setNewPasswordInput('');
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('enerpack_is_admin');
    addNotification("Logged out", 'info');
    setIsMobileMenuOpen(false); // Close menu on logout
  };

  const handleShowLogin = () => {
    setShowLoginModal(true);
    setIsMobileMenuOpen(false); // Close menu on open modal
  };

  // ... Transaction Handlers ...
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

  const handleDeleteItem = (id: string) => {
    const itemToDelete = inventory.find(i => i.id === id);
    if (!itemToDelete) return;
    if (confirm(`Delete item "${itemToDelete.size} (${itemToDelete.gsm})"? This cannot be undone.`)) {
      setInventory(prev => {
        const newData = prev.filter(item => item.id !== id);
        localStorage.setItem('enerpack_inventory_v6', JSON.stringify(newData));
        return newData;
      });
      setTimeout(() => notifyPeers(`Item deleted`), 50);
    }
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

  const handleUpdateTransaction = (id: string, updates: Partial<StockTransaction>) => {
    setTransactions(prev => {
      const newData = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      localStorage.setItem('enerpack_transactions', JSON.stringify(newData));
      return newData;
    });
    setTimeout(() => notifyPeers("Work details updated"), 50);
  };

  const handleUpdateTransactionPriority = (id: string, newPriority: string) => {
    handleUpdateTransaction(id, { priority: newPriority });
  };

  const handleNavigate = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('enerpack_view_mode', mode);
    setIsMobileMenuOpen(false);
  };

  const alertCount = inventory.filter(i => i.closingStock < (i.minStock || 0)).length;

  const NavButton = ({ mode, icon: Icon, label, alertCount }: { mode: ViewMode, icon: any, label: string, alertCount?: number }) => (
    <button 
      onClick={() => handleNavigate(mode)}
      className={`flex items-center w-full p-3 rounded-xl transition-all duration-200 gap-3 group
        ${viewMode === mode 
          ? 'bg-white/10 text-white shadow-md' 
          : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
      title={label}
    >
      <div className="relative">
        <Icon className={`w-5 h-5 ${viewMode === mode ? 'text-enerpack-500' : 'text-slate-400 group-hover:text-white'}`} />
        {alertCount !== undefined && alertCount > 0 && (
           <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center border border-enerpack-900">
             {alertCount}
           </span>
        )}
      </div>
      <span className={`text-sm font-medium ${viewMode === mode ? 'text-white' : ''}`}>
        {label}
      </span>
      {viewMode === mode && <ChevronRight className="w-4 h-4 ml-auto text-enerpack-500" />}
    </button>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-enerpack-900 border-r border-white/5">
        <div className="p-6 flex items-center gap-3 border-b border-white/10 shrink-0">
          <div className="w-10 h-10 bg-white/10 rounded-xl p-1 flex items-center justify-center shadow-lg">
             <LogoIcon className="w-full h-full" />
          </div>
          <div>
             <h1 className="text-white font-bold text-lg tracking-wide leading-none">Ener Pack</h1>
             <p className="text-slate-400 text-xs font-medium mt-1">Operation System</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-2">Main Menu</p>
          <NavButton mode={ViewMode.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
          <NavButton mode={ViewMode.INVENTORY} icon={LayoutGrid} label="Inventory" />
          
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-6">Transactions</p>
          <NavButton mode={ViewMode.STOCK_IN_LOGS} icon={Archive} label="Stock In Logs" />
          <NavButton mode={ViewMode.STOCK_OUT_LOGS} icon={History} label="Stock Out Logs" />
          <NavButton mode={ViewMode.PENDING_WORKS} icon={Clock} label="Pending Works" />

          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-6">Planning</p>
          <NavButton mode={ViewMode.REORDER_ALERTS} icon={AlertTriangle} label="Reorder Alerts" alertCount={alertCount} />
          <NavButton mode={ViewMode.REORDER_LOGS} icon={FileClock} label="Reorder History" />
          <NavButton mode={ViewMode.FORECAST} icon={TrendingUp} label="Forecast" />

          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-6">Tools</p>
          <NavButton mode={ViewMode.JOB_CARDS} icon={ClipboardList} label="Job Cards" />
          <NavButton mode={ViewMode.PAPER_CALCULATOR} icon={Calculator} label="Paper Calculator" />
        </div>

        <div className="p-4 border-t border-white/10 shrink-0">
          <button 
            onClick={() => isAdmin ? handleLogout() : handleShowLogin()}
            className={`w-full p-3 rounded-xl flex items-center justify-between transition-colors
              ${isAdmin ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
             <div className="flex items-center gap-3">
               {isAdmin ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
               <span className="text-sm font-bold">{isAdmin ? 'Logout' : 'Admin Login'}</span>
             </div>
             {isAdmin && <LogOut className="w-4 h-4" />}
          </button>
        </div>
    </div>
  );

  return (
    <div className="h-screen w-full bg-slate-50 flex overflow-hidden font-sans text-slate-800 print:block print:h-auto">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
          {notifications.map(n => (
              <div 
                key={n.id} 
                className={`px-4 py-3 rounded-2xl shadow-lg text-sm font-bold animate-in slide-in-from-right fade-in duration-300 pointer-events-auto flex items-center gap-3 border
                  ${n.type === 'success' ? 'bg-white border-green-200 text-green-700' : 
                    n.type === 'warning' ? 'bg-white border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-700'}`}
              >
                  {n.type === 'success' && <div className="p-1 bg-green-100 rounded-full"><CheckCircle2 className="w-4 h-4" /></div>}
                  {n.type === 'warning' && <div className="p-1 bg-amber-100 rounded-full"><AlertTriangle className="w-4 h-4" /></div>}
                  {n.type === 'info' && <div className="p-1 bg-slate-100 rounded-full"><Bell className="w-4 h-4" /></div>}
                  {n.message}
              </div>
          ))}
      </div>

      {/* Admin Login / Change Password Modal - MOVED TO ROOT LEVEL AND FIXED */}
      {showLoginModal && (
          <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm animate-in zoom-in-95 duration-200">
               
               {!isChangePasswordMode ? (
                 <>
                   <div className="flex justify-center mb-6">
                      <div className="w-16 h-16 bg-enerpack-50 rounded-full flex items-center justify-center shadow-inner">
                          <Lock className="w-8 h-8 text-enerpack-600" />
                      </div>
                   </div>
                   <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">Admin Access</h2>
                   <p className="text-slate-500 text-sm text-center mb-6">Enter your credentials to manage inventory.</p>
                   
                   <form onSubmit={handleLogin}>
                     <div className="space-y-3 mb-6">
                       <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input 
                            type="text" 
                            autoFocus
                            placeholder="Username" 
                            className="w-full border border-slate-300 rounded-2xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-enerpack-500 focus:border-enerpack-500 outline-none transition-all shadow-sm"
                            value={usernameInput}
                            onChange={e => setUsernameInput(e.target.value)}
                          />
                       </div>
                       <div className="relative">
                          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input 
                            type="password" 
                            placeholder="Password" 
                            className="w-full border border-slate-300 rounded-2xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-enerpack-500 focus:border-enerpack-500 outline-none transition-all shadow-sm"
                            value={passwordInput}
                            onChange={e => setPasswordInput(e.target.value)}
                          />
                       </div>
                     </div>
                     
                     <div className="flex flex-col gap-3">
                       <button 
                        type="submit" 
                        className="w-full py-3 bg-enerpack-600 text-white rounded-2xl font-bold hover:bg-enerpack-700 shadow-lg shadow-enerpack-200 transition-all active:scale-95"
                       >
                         Login
                       </button>
                       <button 
                        type="button" 
                        onClick={() => setShowLoginModal(false)} 
                        className="w-full py-3 text-slate-500 hover:text-slate-700 font-medium"
                       >
                         Cancel
                       </button>
                     </div>
                   </form>
                   
                   <div className="mt-6 text-center border-t pt-4">
                      <button 
                        onClick={() => setIsChangePasswordMode(true)}
                        className="text-xs font-bold text-enerpack-600 hover:underline"
                      >
                        Change Password
                      </button>
                   </div>
                 </>
               ) : (
                 <>
                   <div className="flex justify-center mb-6">
                      <div className="w-16 h-16 bg-enerpack-50 rounded-full flex items-center justify-center shadow-inner">
                          <ShieldCheck className="w-8 h-8 text-enerpack-600" />
                      </div>
                   </div>
                   <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">Change Credentials</h2>
                   <p className="text-slate-500 text-xs text-center mb-6">Update your admin username and password.</p>
                   
                   <form onSubmit={handleChangeCredentials}>
                     <div className="space-y-3 mb-6">
                       <div>
                          <label className="text-xs font-bold text-slate-500 ml-1">Current Password</label>
                          <input 
                            type="password" 
                            autoFocus
                            placeholder="Verify Current Password" 
                            className="w-full border border-slate-300 rounded-2xl px-4 py-2 mt-1 focus:ring-2 focus:ring-enerpack-500 outline-none shadow-sm"
                            value={currentPasswordInput}
                            onChange={e => setCurrentPasswordInput(e.target.value)}
                          />
                       </div>
                       <div className="border-t border-slate-100 my-2 pt-2">
                          <label className="text-xs font-bold text-slate-500 ml-1">New Username</label>
                          <input 
                            type="text" 
                            placeholder="New Username" 
                            className="w-full border border-slate-300 rounded-2xl px-4 py-2 mt-1 focus:ring-2 focus:ring-enerpack-500 outline-none shadow-sm"
                            value={newUsernameInput}
                            onChange={e => setNewUsernameInput(e.target.value)}
                          />
                       </div>
                       <div>
                          <label className="text-xs font-bold text-slate-500 ml-1">New Password</label>
                          <input 
                            type="password" 
                            placeholder="New Password" 
                            className="w-full border border-slate-300 rounded-2xl px-4 py-2 mt-1 focus:ring-2 focus:ring-enerpack-500 outline-none shadow-sm"
                            value={newPasswordInput}
                            onChange={e => setNewPasswordInput(e.target.value)}
                          />
                       </div>
                     </div>
                     
                     <div className="flex flex-col gap-3">
                       <button 
                        type="submit" 
                        className="w-full py-3 bg-enerpack-600 text-white rounded-2xl font-bold hover:bg-enerpack-700 shadow-lg shadow-enerpack-200 transition-all active:scale-95"
                       >
                         Update Credentials
                       </button>
                       <button 
                        type="button" 
                        onClick={() => {
                            setIsChangePasswordMode(false);
                            setCurrentPasswordInput('');
                            setNewUsernameInput('');
                            setNewPasswordInput('');
                        }} 
                        className="w-full py-3 text-slate-500 hover:text-slate-700 font-medium"
                       >
                         Back to Login
                       </button>
                     </div>
                   </form>
                 </>
               )}

            </div>
          </div>
        )}

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-enerpack-900 text-white p-3 flex justify-between items-center shadow-md z-50 print:hidden">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-full p-1 flex items-center justify-center">
               <LogoIcon className="w-full h-full" />
            </div>
            <span className="font-bold tracking-wide">Ener Pack</span>
         </div>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded hover:bg-white/10">
           {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
         </button>
      </div>

      {/* Responsive Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-enerpack-900 shadow-2xl transform transition-transform duration-300 ease-in-out print:hidden
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:shadow-none shrink-0
      `}>
          <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50 pt-14 md:pt-0 print:pt-0">
        
        {/* View Router */}
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
            onDeleteItem={handleDeleteItem}
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

      </main>
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </div>
  );
};

const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default App;
