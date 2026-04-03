/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { GoogleGenAI, Type } from "@google/genai";
import { Toaster, toast } from 'sonner';
import { 
  LayoutDashboard, 
  Package, 
  Search, 
  LogIn, 
  LogOut as LogOutIcon, 
  Clock, 
  Bell, 
  History, 
  TrendingUp, 
  Calculator, 
  FileText, 
  Settings,
  User,
  ChevronRight,
  ChevronDown,
  Box,
  Layers,
  Plus,
  Minus,
  Edit2,
  Trash2,
  CheckCircle,
  FileSpreadsheet,
  Download,
  X,
  Menu,
  Save,
  Truck,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Info,
  Maximize2,
  Maximize,
  Hash,
  Wand2,
  FilePlus,
  Eye,
  Printer,
  Trash,
  FileUp,
  ArrowUp,
  ArrowDown,
  BarChart2,
  Shield,
  Users,
  AlertCircle,
  Database,
  Activity,
  RefreshCw,
  ArrowLeft,
  Move,
  Check
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  Timestamp,
  setDoc,
  getDocs,
  where
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from './firebase';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, errorInfo: string | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: error.message };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    return this.props.children;
  }
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const sortSizes = (a: string, b: string) => {
  const parseSize = (s: string) => {
    if (s.includes('*')) {
      return s.split('*').map(v => parseFloat(v) || 0);
    }
    return [parseFloat(s) || 0, 0];
  };
  const [a1, a2] = parseSize(a);
  const [b1, b2] = parseSize(b);
  if (a1 !== b1) return a1 - b1;
  return a2 - b2;
};

// --- Mock Data ---
const movementData = [
  { name: 'JUL', value: 300 },
  { name: 'AUG', value: 300 },
  { name: 'SEP', value: 300 },
  { name: 'OCT', value: 300 },
  { name: 'NOV', value: 300 },
  { name: 'DEC', value: 450 },
];

const distributionData = [
  { name: '280 GSM', value: 44, color: '#3b82f6' },
  { name: '200 GSM', value: 21, color: '#1e293b' },
  { name: '130 GSM', value: 9, color: '#f97316' },
  { name: '140GYT GSM', value: 9, color: '#10b981' },
];

const highVelocityData = [
  { name: '54 X 280', value: 600, max: 1000 },
  { name: '56 X 280', value: 420, max: 1000 },
  { name: '60 X 200', value: 210, max: 1000 },
];

const inventoryData = [
  {
    title: "280 GSM SECTION",
    subSections: [
      {
        title: "SINGLE SIZE",
        items: [
          { size: "54", gsm: "280", stock: 1279, isLow: false, minQuantity: 100, remarks: "" },
          { size: "56", gsm: "280", stock: 243, isLow: true, minQuantity: 100, remarks: "" },
          { size: "58", gsm: "280", stock: 1604, isLow: false, minQuantity: 100, remarks: "" },
          { size: "59", gsm: "280", stock: 442, isLow: true, minQuantity: 100, remarks: "" },
          { size: "60", gsm: "280", stock: 1351, isLow: false, minQuantity: 100, remarks: "" },
          { size: "63", gsm: "280", stock: 568, isLow: false, minQuantity: 100, remarks: "" },
          { size: "65", gsm: "280", stock: 1453, isLow: false, minQuantity: 100, remarks: "" },
          { size: "68", gsm: "280", stock: 984, isLow: false, minQuantity: 100, remarks: "" },
          { size: "70", gsm: "280", stock: 714, isLow: false, minQuantity: 100, remarks: "" },
          { size: "73", gsm: "280", stock: 941, isLow: false, minQuantity: 100, remarks: "" },
          { size: "76", gsm: "280", stock: 926, isLow: false, minQuantity: 100, remarks: "" },
          { size: "78", gsm: "280", stock: 0, isLow: true, minQuantity: 100, remarks: "" },
          { size: "80", gsm: "280", stock: 2029, isLow: false, minQuantity: 100, remarks: "" },
          { size: "83", gsm: "280", stock: 1337, isLow: false },
          { size: "86", gsm: "280", stock: 298, isLow: true },
          { size: "88", gsm: "280", stock: 1953, isLow: false },
          { size: "90", gsm: "280", stock: 3384, isLow: false },
          { size: "93", gsm: "280", stock: 1262, isLow: false },
          { size: "96", gsm: "280", stock: 1315, isLow: false },
          { size: "98", gsm: "280", stock: 1330, isLow: false },
          { size: "100", gsm: "280", stock: 1999, isLow: false },
          { size: "104", gsm: "280", stock: 955, isLow: false },
          { size: "108", gsm: "280", stock: 1568, isLow: false },
        ]
      },
      {
        title: "DOUBLE SIZE",
        items: [
          { size: "47*64", gsm: "280", stock: 59, isLow: true },
          { size: "54*73.5", gsm: "280", stock: 55, isLow: true },
          { size: "54*86", gsm: "280", stock: 157, isLow: true },
          { size: "55*80", gsm: "280", stock: 0, isLow: true },
          { size: "55*82", gsm: "280", stock: 0, isLow: true },
          { size: "56*68.5", gsm: "280", stock: 33, isLow: true },
          { size: "56*75", gsm: "280", stock: 39, isLow: true },
          { size: "56*86", gsm: "280", stock: 323, isLow: true },
          { size: "57*68.5", gsm: "280", stock: 125, isLow: true },
          { size: "57.5*76", gsm: "280", stock: 71, isLow: true },
          { size: "58*78", gsm: "280", stock: 346, isLow: true },
          { size: "59*78", gsm: "280", stock: 71, isLow: true },
          { size: "59*87.5", gsm: "280", stock: 24, isLow: true },
          { size: "59*95", gsm: "280", stock: 142, isLow: true },
          { size: "60*77.5", gsm: "280", stock: 44, isLow: true },
          { size: "61*83", gsm: "280", stock: 75, isLow: true },
          { size: "62*68", gsm: "280", stock: 135, isLow: true },
          { size: "63*75", gsm: "280", stock: 161, isLow: true },
          { size: "64*67", gsm: "280", stock: 44, isLow: true },
          { size: "65*88.5", gsm: "280", stock: 66, isLow: true },
          { size: "67*75", gsm: "280", stock: 101, isLow: true },
          { size: "68*69", gsm: "280", stock: 132, isLow: true },
          { size: "68*91.5", gsm: "280", stock: 4, isLow: true },
          { size: "70*72", gsm: "280", stock: 13, isLow: true },
          { size: "70*76", gsm: "280", stock: 119, isLow: true },
          { size: "70*79", gsm: "280", stock: 80, isLow: true },
          { size: "72*91.5", gsm: "280", stock: 65, isLow: true },
          { size: "73*81", gsm: "280", stock: 144, isLow: true },
          { size: "75*108.5", gsm: "280", stock: 16, isLow: true },
          { size: "76*72", gsm: "280", stock: 240, isLow: true },
          { size: "76*111", gsm: "280", stock: 123, isLow: true },
          { size: "78*70.5", gsm: "280", stock: 94, isLow: true },
          { size: "78*107", gsm: "280", stock: 19, isLow: true },
          { size: "82*111", gsm: "280", stock: 40, isLow: true },
          { size: "88*63", gsm: "280", stock: 72, isLow: true },
          { size: "90*66", gsm: "280", stock: 108, isLow: true },
          { size: "94.5*80.3", gsm: "280", stock: 32, isLow: true },
          { size: "100*74", gsm: "280", stock: 20, isLow: true },
          { size: "108*76", gsm: "280", stock: 103, isLow: true },
        ]
      }
    ]
  },
  {
    title: "250 & 230 GSM SECTION",
    subSections: [
      {
        title: "250 DOUBLE",
        items: [
          { size: "50*64.5", gsm: "250", stock: 255, isLow: true },
        ]
      },
      {
        title: "230 DOUBLE",
        items: [
          { size: "54*78", gsm: "230", stock: 55, isLow: true },
          { size: "55*80", gsm: "230", stock: 0, isLow: true },
          { size: "55*82", gsm: "230", stock: 0, isLow: true },
          { size: "59*91", gsm: "230", stock: 42, isLow: true },
          { size: "82*98", gsm: "230", stock: 42, isLow: true },
          { size: "86*110", gsm: "230", stock: 56, isLow: true },
          { size: "100*67", gsm: "230", stock: 42, isLow: true },
        ]
      }
    ]
  },
  {
    title: "200 GSM SECTION",
    subSections: [
      {
        title: "SINGLE SIZE",
        items: [
          { size: "65", gsm: "200", stock: 0, isLow: true },
          { size: "68", gsm: "200", stock: 1082, isLow: false },
          { size: "70", gsm: "200", stock: 0, isLow: true },
          { size: "73", gsm: "200", stock: 0, isLow: true },
          { size: "75", gsm: "200", stock: 0, isLow: true },
          { size: "80", gsm: "200", stock: 277, isLow: true },
          { size: "90", gsm: "200", stock: 45, isLow: true },
        ]
      },
      {
        title: "DOUBLE SIZE",
        items: [
          { size: "41*83", gsm: "200", stock: 0, isLow: true },
          { size: "42.5*57.5", gsm: "200", stock: 215, isLow: true },
          { size: "43*73", gsm: "200", stock: 283, isLow: true },
          { size: "44.5*64", gsm: "200", stock: 114, isLow: true },
          { size: "45*76.5", gsm: "200", stock: 62, isLow: true },
          { size: "46.5*90", gsm: "200", stock: 54, isLow: true },
          { size: "47*70.5", gsm: "200", stock: 0, isLow: true },
          { size: "50*72", gsm: "200", stock: 0, isLow: true },
          { size: "50*79", gsm: "200", stock: 976, isLow: false },
          { size: "50*81", gsm: "200", stock: 337, isLow: true },
          { size: "50*83", gsm: "200", stock: 48, isLow: true },
          { size: "50*89", gsm: "200", stock: 239, isLow: true },
          { size: "51*80", gsm: "200", stock: 174, isLow: true },
          { size: "52*68.5", gsm: "200", stock: 75, isLow: true },
          { size: "52*76.5", gsm: "200", stock: 145, isLow: true },
          { size: "53*83", gsm: "200", stock: 601, isLow: false },
          { size: "54*86", gsm: "200", stock: 524, isLow: false },
          { size: "55*80", gsm: "200", stock: 0, isLow: true },
          { size: "55*82", gsm: "200", stock: 0, isLow: true },
          { size: "56*82", gsm: "200", stock: 377, isLow: true },
          { size: "56*86", gsm: "200", stock: 671, isLow: false },
          { size: "57*85.5", gsm: "200", stock: 52, isLow: true },
          { size: "57*89", gsm: "200", stock: 7, isLow: true },
          { size: "57*90", gsm: "200", stock: 311, isLow: true },
          { size: "59*91", gsm: "200", stock: 657, isLow: false },
          { size: "59.5*93", gsm: "200", stock: 270, isLow: true },
          { size: "62.5*95", gsm: "200", stock: 276, isLow: true },
          { size: "63*64", gsm: "200", stock: 326, isLow: true },
          { size: "63.5*99", gsm: "200", stock: 436, isLow: true },
          { size: "65*101", gsm: "200", stock: 0, isLow: true },
          { size: "68*69", gsm: "200", stock: 133, isLow: true },
          { size: "72*48", gsm: "200", stock: 79, isLow: true },
          { size: "73*74", gsm: "200", stock: 50, isLow: true },
        ]
      }
    ]
  },
  {
    title: "140 GYT, 130 GSM SECTION",
    subSections: [
      {
        title: "140 GYT",
        items: [
          { size: "53", gsm: "140GYT", stock: 0, isLow: true },
          { size: "57", gsm: "140GYT", stock: 792, isLow: false },
          { size: "60", gsm: "140GYT", stock: 0, isLow: true },
          { size: "65", gsm: "140GYT", stock: 173, isLow: true },
          { size: "70", gsm: "140GYT", stock: 1016, isLow: false },
          { size: "73", gsm: "140GYT", stock: 0, isLow: true },
          { size: "77", gsm: "140GYT", stock: 1805, isLow: false },
          { size: "82", gsm: "140GYT", stock: 0, isLow: true },
          { size: "85", gsm: "140GYT", stock: 0, isLow: true },
          { size: "88", gsm: "140GYT", stock: 0, isLow: true },
          { size: "90", gsm: "140GYT", stock: 956, isLow: false },
          { size: "95", gsm: "140GYT", stock: 991, isLow: false },
          { size: "100", gsm: "140GYT", stock: 942, isLow: false },
          { size: "104", gsm: "140GYT", stock: 271, isLow: true },
          { size: "108", gsm: "140GYT", stock: 0, isLow: true },
        ]
      },
      {
        title: "130",
        items: [
          { size: "54", gsm: "130", stock: 76, isLow: true },
          { size: "56", gsm: "130", stock: 0, isLow: true },
          { size: "58", gsm: "130", stock: 190, isLow: true },
          { size: "59", gsm: "130", stock: 44, isLow: true },
          { size: "61", gsm: "130", stock: 175, isLow: true },
          { size: "63", gsm: "130", stock: 0, isLow: true },
          { size: "68", gsm: "130", stock: 0, isLow: true },
          { size: "75", gsm: "130", stock: 55, isLow: true },
          { size: "86", gsm: "130", stock: 0, isLow: true },
          { size: "90", gsm: "130", stock: 99, isLow: true },
          { size: "100", gsm: "130", stock: 0, isLow: true },
          { size: "102", gsm: "130", stock: 0, isLow: true },
          { size: "106", gsm: "130", stock: 35, isLow: true },
          { size: "108", gsm: "130", stock: 0, isLow: true },
        ]
      }
    ]
  },
  {
    title: "150, 100 GSM SECTION",
    subSections: [
      {
        title: "150",
        items: [
          { size: "68", gsm: "150", stock: 387, isLow: true },
          { size: "84", gsm: "150", stock: 0, isLow: true },
          { size: "92", gsm: "150", stock: 140, isLow: true },
          { size: "104", gsm: "150", stock: 67, isLow: true },
          { size: "108", gsm: "150", stock: 85, isLow: true },
        ]
      },
      {
        title: "100",
        items: [
          { size: "60", gsm: "100", stock: 150, isLow: true },
          { size: "66", gsm: "100", stock: 116, isLow: true },
          { size: "92", gsm: "100", stock: 396, isLow: true },
          { size: "100", gsm: "100", stock: 416, isLow: true },
          { size: "106", gsm: "100", stock: 227, isLow: true },
          { size: "108", gsm: "100", stock: 167, isLow: true },
        ]
      }
    ]
  }
];

// --- Components ---

const InventoryRow = ({ 
  item, 
  sectionTitle, 
  subTitle, 
  onIncrement, 
  onDecrement, 
  onEdit, 
  onDelete,
  isAdmin
}: { 
  item: any, 
  sectionTitle: string, 
  subTitle: string,
  onIncrement: (st: string, sbt: string, sz: string) => void,
  onDecrement: (st: string, sbt: string, sz: string) => void,
  onEdit: (st: string, sbt: string, item: any) => void,
  onDelete: (st: string, sbt: string, sz: string) => void,
  isAdmin: boolean
}) => (
  <>
    <td className={cn(
      "px-4 py-2 border-l border-r border-slate-400 text-center font-black text-[10px] lg:text-sm w-16 lg:w-20",
      item.isLow && "bg-rose-50/50"
    )}>{item.size}</td>
    <td className={cn(
      "px-4 py-2 border-r border-slate-400 text-center text-slate-400 text-[10px] lg:text-sm w-12 lg:w-16",
      item.isLow && "bg-rose-50/50"
    )}>{item.gsm}</td>
    <td className={cn(
      "px-4 py-2 border-r border-slate-400 text-center text-[10px] lg:text-sm font-bold w-16 lg:w-20",
      item.isLow ? "text-rose-500 bg-rose-50/50" : "text-blue-700"
    )}>
      <div className="flex items-center justify-center gap-1">
        {item.stock} {item.isLow && <AlertCircle size={10} />}
      </div>
    </td>
    <td className={cn(
      "px-4 py-2 border-r border-slate-400 w-24 lg:w-28",
      item.isLow && "bg-rose-50/50"
    )}>
      {isAdmin ? (
        <div className="flex items-center justify-center gap-1">
          <button 
            onClick={() => onIncrement(sectionTitle, subTitle, item.size)}
            className="p-1 border border-emerald-200 text-emerald-600 rounded hover:bg-emerald-50"
          >
            <Plus size={10} />
          </button>
          <button 
            onClick={() => onDecrement(sectionTitle, subTitle, item.size)}
            className="p-1 border border-rose-200 text-rose-600 rounded hover:bg-rose-50"
          >
            <Minus size={10} />
          </button>
          <button 
            onClick={() => onEdit(sectionTitle, subTitle, item)}
            className="p-1 border border-blue-200 text-blue-600 rounded hover:bg-blue-50"
          >
            <Edit2 size={10} />
          </button>
          <button 
            onClick={() => onDelete(sectionTitle, subTitle, item.size)}
            className="p-1 border border-slate-400 text-slate-400 rounded hover:bg-slate-50"
          >
            <Trash2 size={10} />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">READ ONLY</span>
        </div>
      )}
    </td>
  </>
);

const InventoryTableSection = ({ 
  section,
  onIncrement,
  onDecrement,
  onEdit,
  onDelete,
  canEdit
}: { 
  section: any,
  onIncrement: (st: string, sbt: string, sz: string) => void,
  onDecrement: (st: string, sbt: string, sz: string) => void,
  onEdit: (st: string, sbt: string, item: any) => void,
  onDelete: (st: string, sbt: string, sz: string) => void,
  canEdit: boolean
}) => {
  const allItems: any[] = [];
  if (section.subSections) {
    section.subSections.forEach((sub: any) => {
      const excludedTitles = ["SINGLE SIZE", "150", "100"];
      if (!excludedTitles.includes(sub.title)) {
        allItems.push({ isHeader: true, title: sub.title });
      }
      sub.items.forEach((item: any) => allItems.push({ ...item, subTitle: sub.title }));
    });
  }

  const half = Math.ceil(allItems.length / 2);
  const leftCol = allItems.slice(0, half);
  const rightCol = allItems.slice(half);
  const maxRows = half;

  return (
    <div className="mb-8 bg-white rounded-3xl shadow-sm border border-slate-400 overflow-hidden">
      <div className="px-4 py-3 bg-[#0f2a43] flex items-center justify-center border-b border-white/10">
        <h3 className="text-xs md:text-sm font-bold text-white uppercase tracking-widest">{section.title}</h3>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        {/* Desktop View: Two Columns */}
        <table className="hidden lg:table w-full border-collapse text-sm font-bold uppercase tracking-wider table-fixed">
          <thead>
            <tr className="bg-slate-50/50 text-slate-500 border-b border-slate-400">
              <th className="px-4 py-3 border-l border-r border-slate-400 text-center w-20 text-[10px] tracking-widest">SIZE</th>
              <th className="px-4 py-3 border-r border-slate-400 text-center w-16 text-[10px] tracking-widest">GSM</th>
              <th className="px-4 py-3 border-r border-slate-400 text-center w-20 text-[10px] tracking-widest">STOCK</th>
              <th className="px-4 py-3 border-r border-slate-400 text-center w-28 text-[10px] tracking-widest">ACTION</th>
              
              <th className="px-4 py-3 border-r border-slate-400 text-center w-20 text-[10px] tracking-widest">SIZE</th>
              <th className="px-4 py-3 border-r border-slate-400 text-center w-16 text-[10px] tracking-widest">GSM</th>
              <th className="px-4 py-3 border-r border-slate-400 text-center w-20 text-[10px] tracking-widest">STOCK</th>
              <th className="px-4 py-3 border-r border-slate-400 text-center w-28 text-[10px] tracking-widest">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxRows }).map((_, idx) => (
              <tr key={`${section.title}-${idx}`} className="border-b border-slate-400 hover:bg-slate-50 transition-colors">
                {/* Left Column */}
                {leftCol[idx] ? (
                  leftCol[idx].isHeader ? (
                    <td colSpan={4} className="bg-[#0f2a43] py-1.5 px-4 text-center text-[10px] font-bold text-white uppercase tracking-widest border-l border-r border-slate-400">
                      {leftCol[idx].title}
                    </td>
                  ) : (
                    <InventoryRow 
                      item={leftCol[idx]} 
                      sectionTitle={section.title} 
                      subTitle={leftCol[idx].subTitle}
                      onIncrement={onIncrement}
                      onDecrement={onDecrement}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      isAdmin={canEdit}
                    />
                  )
                ) : (
                  <td colSpan={4} className="border-l border-r border-slate-400 px-4 py-2"></td>
                )}

                {/* Right Column */}
                {rightCol[idx] ? (
                  rightCol[idx].isHeader ? (
                    <td colSpan={4} className="bg-[#0f2a43] py-1.5 px-4 text-center text-[10px] font-bold text-white uppercase tracking-widest border-r border-slate-400">
                      {rightCol[idx].title}
                    </td>
                  ) : (
                    <InventoryRow 
                      item={rightCol[idx]} 
                      sectionTitle={section.title} 
                      subTitle={rightCol[idx].subTitle}
                      onIncrement={onIncrement}
                      onDecrement={onDecrement}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      isAdmin={canEdit}
                    />
                  )
                ) : (
                  <td colSpan={4} className="border-r border-slate-400 px-4 py-2"></td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile View: Single Column */}
        <table className="lg:hidden w-full border-collapse text-[10px] font-bold uppercase tracking-wider min-w-[300px]">
          <thead>
            <tr className="bg-slate-50/50 text-slate-500 border-b border-slate-400">
              <th className="px-2 py-3 border-l border-r border-slate-400 text-center w-16 text-[10px] tracking-widest">SIZE</th>
              <th className="px-2 py-3 border-r border-slate-400 text-center w-12 text-[10px] tracking-widest">GSM</th>
              <th className="px-2 py-3 border-r border-slate-400 text-center w-16 text-[10px] tracking-widest">STOCK</th>
              <th className="px-2 py-3 border-r border-slate-400 text-center w-24 text-[10px] tracking-widest">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {allItems.map((item, idx) => (
              <tr key={item.isHeader ? `${section.title}-header-${item.title}` : `${section.title}-${item.size}-${item.gsm}-${idx}`} className="border-b border-slate-400 hover:bg-slate-50 transition-colors">
                {item.isHeader ? (
                  <td colSpan={4} className="bg-[#0f2a43] py-1.5 px-4 text-center text-[10px] font-bold text-white uppercase tracking-widest border-l border-r border-slate-400">
                    {item.title}
                  </td>
                ) : (
                  <InventoryRow 
                    item={item} 
                    sectionTitle={section.title} 
                    subTitle={item.subTitle}
                    onIncrement={onIncrement}
                    onDecrement={onDecrement}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isAdmin={canEdit}
                  />
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick,
  badge
}: { 
  icon: any, 
  label: string, 
  active?: boolean, 
  onClick?: () => void,
  badge?: number
}) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors relative",
      active 
        ? "bg-blue-600/20 text-white border-l-4 border-blue-500" 
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    )}
  >
    <div className="flex items-center gap-3">
      <Icon size={18} />
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] flex items-center justify-center">
          {badge}
        </span>
      )}
    </div>
    {active && <ChevronRight size={14} />}
  </button>
);

const SectionHeader = ({ label }: { label: string }) => (
  <div className="px-4 py-2 mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
    {label}
  </div>
);

const StatCard = ({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  status,
  iconBg
}: { 
  label: string, 
  value: string | number, 
  icon: any, 
  trend?: string,
  status?: string,
  iconBg: string
}) => (
  <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-400 flex items-center justify-between">
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">{label}</p>
      <h3 className="text-2xl md:text-3xl font-bold text-slate-800 truncate">{value}</h3>
      {trend && <p className="text-xs font-medium text-emerald-500 mt-1 flex items-center gap-1">
        <TrendingUp size={12} /> {trend}
      </p>}
      {status && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider truncate">
        ⚠ {status}
      </p>}
    </div>
    <div className={cn("p-2.5 md:p-4 rounded-2xl shrink-0 ml-4", iconBg)}>
      <Icon className="text-slate-600 w-4 h-4 md:w-5 md:h-5" />
    </div>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [adminTab, setAdminTab] = useState('Overview');
  const [inventory, setInventory] = useState(inventoryData);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [userRole, setUserRole] = useState<string | null>('Admin');
  const [userPages, setUserPages] = useState<string[]>(['Dashboard', 'Inventory', 'Movement', 'Planning', 'Tools', 'Admin']);
  const [userName, setUserName] = useState('Admin User');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(true);

  useEffect(() => {
    setIsAuthenticated(true);
    setUserName('Guest User');
    setActiveTab('Dashboard');
    setUserRole('Viewer');
    setUserPages(['Dashboard', 'Inventory', 'Movement', 'Planning', 'Tools']);
    setIsAuthReady(true);
  }, []);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Login Error:", error);
      toast.error("Failed to login with Google. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setUserRole(null);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };
  const [roles, setRoles] = useState([
    { id: 'admin', name: 'Administrator', permissions: ['dashboard', 'inventory', 'movement', 'planning', 'tools', 'admin'] },
    { id: 'editor', name: 'Editor', permissions: ['dashboard', 'inventory', 'movement', 'planning', 'tools'] },
    { id: 'viewer', name: 'Viewer', permissions: ['dashboard', 'inventory', 'movement', 'planning', 'tools'] }
  ]);

  const hasPermission = (permission: string) => {
    if (!userRole) return false;
    
    // Admin has all permissions
    if (userRole.toLowerCase() === 'admin') return true;

    // Check if the permission (page) is in the user's allowed pages
    // Map permissions to page names
    const permissionMap: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'inventory': 'Inventory',
      'movement': 'Movement',
      'planning': 'Planning',
      'tools': 'Tools',
      'admin': 'Admin'
    };

    const pageName = permissionMap[permission];
    if (pageName && userPages.includes(pageName)) return true;
    
    const role = roles.find(r => r.id.toLowerCase() === userRole.toLowerCase());
    return role?.permissions.includes(permission) || false;
  };

  const isAdmin = userRole?.toLowerCase() === 'admin';
  const canEdit = isAdmin || userRole?.toLowerCase() === 'editor';
  const isViewer = userRole?.toLowerCase() === 'viewer';
  const [showNewSkuForm, setShowNewSkuForm] = useState(false);
  const [newSkuSize, setNewSkuSize] = useState('');
  const [newSkuGsm, setNewSkuGsm] = useState('280');
  const [newSkuStock, setNewSkuStock] = useState('0');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [editingItem, setEditingItem] = useState<{ sectionTitle: string, subTitle: string, item: any } | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ sectionTitle: string, subTitle: string, size: string } | null>(null);
  const [stockInItem, setStockInItem] = useState<{ sectionTitle: string, subTitle: string, item: any, formData: any } | null>(null);
  const [stockOutItem, setStockOutItem] = useState<{ sectionTitle: string, subTitle: string, item: any, formData: any } | null>(null);

  // Quick Tracker State
  const [quickTrackerSearch, setQuickTrackerSearch] = useState('');
  const [selectedQuickTrackerItem, setSelectedQuickTrackerItem] = useState<{ sectionTitle: string, subTitle: string, item: any } | null>(null);
  const [quickTrackerMode, setQuickTrackerMode] = useState<'IN' | 'OUT'>('OUT');
  const [quickTrackerQty, setQuickTrackerQty] = useState('');
  const [quickTrackerHistory, setQuickTrackerHistory] = useState<any[]>([]);

  // Stock In Logs State
  const [stockInLogs, setStockInLogs] = useState<any[]>([
    {
      id: 1,
      date: '2026-03-12',
      month: 'March',
      size: '56',
      gsm: '280',
      quantity: 1000,
      company: 'SREEPATHI',
      invoice: 'JB/25-26/1536',
      storageLoc: '',
      remarks: ''
    }
  ]);
  const [searchLogQuery, setSearchLogQuery] = useState('');
  const [editingLog, setEditingLog] = useState<any | null>(null);

  // Stock Out Logs State
  const [stockOutLogs, setStockOutLogs] = useState<any[]>([
    { id: 1, date: '2026-01-10', size: '60', gsm: '280', out: 450, unit: 'GROSS', itemCode: 'FW10057', workName: 'VKC Casual', cutSize: '55', sheets: 4500, status: 'DELIVERED', vehicle: 'KL 10 AT 1234', location: 'AKP', remarks: '' },
    { id: 2, date: '2026-01-15', size: '54', gsm: '280', out: 300, unit: 'GROSS', itemCode: 'FW10058', workName: 'Walkaroo', cutSize: '50', sheets: 3000, status: 'DELIVERED', vehicle: 'KL 10 AT 1234', location: 'AKP', remarks: '' },
    { id: 3, date: '2026-02-05', size: '60', gsm: '280', out: 500, unit: 'GROSS', itemCode: 'FW10057', workName: 'VKC Casual', cutSize: '55', sheets: 5000, status: 'DELIVERED', vehicle: 'KL 10 AT 1234', location: 'AKP', remarks: '' },
    { id: 4, date: '2026-02-20', size: '56', gsm: '280', out: 200, unit: 'GROSS', itemCode: 'FW10059', workName: 'Paragon', cutSize: '52', sheets: 2000, status: 'DELIVERED', vehicle: 'KL 10 AT 1234', location: 'AKP', remarks: '' },
    { id: 5, date: '2026-03-01', size: '60', gsm: '280', out: 350, unit: 'GROSS', itemCode: 'FW10057', workName: 'VKC Casual', cutSize: '55', sheets: 3500, status: 'DELIVERED', vehicle: 'KL 10 AT 1234', location: 'AKP', remarks: '' },
    { id: 6, date: '2026-03-10', size: '54', gsm: '280', out: 400, unit: 'GROSS', itemCode: 'FW10058', workName: 'Walkaroo', cutSize: '50', sheets: 4000, status: 'DELIVERED', vehicle: 'KL 10 AT 1234', location: 'AKP', remarks: '' },
    { id: 7, date: '2026-03-12', size: '60', gsm: '280', out: 100, unit: 'GROSS', itemCode: 'FW10057', workName: 'VKC Casual', cutSize: '55', sheets: 1000, status: 'DELIVERED', vehicle: 'KL 10 AT 1234', location: 'AKP', remarks: '' }
  ]);
  const [searchStockOutLogQuery, setSearchStockOutLogQuery] = useState('');
  const [searchAlertsQuery, setSearchAlertsQuery] = useState('');
  const [reorderTracking, setReorderTracking] = useState<Record<string, any>>({});
  const [reorderHistory, setReorderHistory] = useState<any[]>([]);
  const [searchReorderHistoryQuery, setSearchReorderHistoryQuery] = useState('');
  const [searchForecastQuery, setSearchForecastQuery] = useState('');
  const [calcInputs, setCalcInputs] = useState({
    gsm: '280',
    width: '60',
    length: '100',
    quantity: '1000'
  });

  // Job Card Generator State
  const [whatsappOrder, setWhatsappOrder] = useState('');
  const [jobCards, setJobCards] = useState<any[]>([]);
  const [cardPrefix, setCardPrefix] = useState<'EP' | 'FP'>('EP');
  const [isGenerating, setIsGenerating] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Pending Works State
  const [pendingWorks, setPendingWorks] = useState<any[]>([
    {
      id: 1,
      date: '2026-03-12',
      size: '60',
      gsm: '280',
      qty: 100,
      unit: 'CUTTING',
      company: 'SREEPATHI',
      itemCode: 'FW10057',
      workName: 'VKC Casual',
      cutSize: '55',
      sheets: 1000,
      priority: 'MEDIUM',
      status: 'CUTTING',
      remarks: ''
    }
  ]);
  const [searchPendingQuery, setSearchPendingQuery] = useState('');
  const [editingPendingWork, setEditingPendingWork] = useState<any | null>(null);
  const [deliveringWork, setDeliveringWork] = useState<any | null>(null);
  const [deliveryFormData, setDeliveryFormData] = useState({ 
    vehicleNumber: 'KL65S7466', 
    deliveryLocation: '',
    deliveryDate: new Date().toISOString().split('T')[0]
  });

  // Admin Panel State
  const [staffs, setStaffs] = useState<any[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [openApprovalDropdownId, setOpenApprovalDropdownId] = useState<number | null>(null);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<{ id: number, message: string, type: 'info' | 'success' | 'warning', persistent?: boolean }[]>([]);
  const lastRegistrationId = React.useRef<string | null>(localStorage.getItem('lastRegId'));

  const addNotification = (message: string, type: 'info' | 'success' | 'warning' = 'info', persistent: boolean = false) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type, persistent }]);
    if (!persistent) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 8000);
    }
    
    // Play notification sound
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {}); // Ignore errors if browser blocks autoplay
    } catch (e) {}
  };

  useEffect(() => {
    if (hasPermission('admin') && activeTab === 'Admin Panel') {
      const pendingRegistrations = approvals.filter(a => a.type === 'User Registration' && a.status === 'Pending');
      if (pendingRegistrations.length > 0) {
        const latestReg = pendingRegistrations[0];
        if (latestReg.id !== lastRegistrationId.current) {
          addNotification(`New registration request from "${latestReg.username}"!`, 'warning', true);
          lastRegistrationId.current = latestReg.id;
          localStorage.setItem('lastRegId', latestReg.id);
        }
      }
    }
  }, [approvals, activeTab]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Firebase Real-time Listeners
  const reconstructInventory = (flatList: any[]) => {
    const sections: any[] = [];
    flatList.forEach(item => {
      let section = sections.find(s => s.title === item.sectionTitle);
      if (!section) {
        section = { title: item.sectionTitle, subSections: [] };
        sections.push(section);
      }
      let subSection = section.subSections.find((ss: any) => ss.title === item.subSectionTitle);
      if (!subSection) {
        subSection = { title: item.subSectionTitle, items: [] };
        section.subSections.push(subSection);
      }
      subSection.items.push(item);
    });
    
    // Remove duplicates within subsections
    sections.forEach(s => {
      s.subSections.forEach((ss: any) => {
        const seenSizes = new Set();
        ss.items = ss.items.filter((item: any) => {
          if (seenSizes.has(item.size)) return false;
          seenSizes.add(item.size);
          return true;
        });
      });
    });
    
    // Sort items within subsections
    sections.forEach(s => {
      s.subSections.forEach((ss: any) => {
        ss.items.sort((a: any, b: any) => sortSizes(a.size, b.size));
      });
    });

    // Sort sections: 280 GSM SECTION first, then 250 & 230 GSM SECTION, then others
    sections.sort((a, b) => {
      if (a.title === "280 GSM SECTION") return -1;
      if (b.title === "280 GSM SECTION") return 1;
      if (a.title === "250 & 230 GSM SECTION") return -1;
      if (b.title === "250 & 230 GSM SECTION") return 1;
      return 0;
    });

    return sections;
  };

  useEffect(() => {
    if (!isAuthReady || !isAuthenticated) return;

    const checkAndSeedInventory = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'inventory'));
        if (snapshot.empty) {
          console.log("Seeding inventory...");
          for (const section of inventoryData) {
            for (const subSection of section.subSections) {
              for (const item of subSection.items) {
                await addDoc(collection(db, 'inventory'), {
                  ...item,
                  sectionTitle: section.title,
                  subSectionTitle: subSection.title,
                  timestamp: Timestamp.now()
                });
              }
            }
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'inventory');
      }
    };
    checkAndSeedInventory();

    const staffsQuery = query(collection(db, 'staffs'), orderBy('name'));
    const unsubscribeStaffs = onSnapshot(staffsQuery, (snapshot) => {
      const staffList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStaffs(staffList);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'staffs'));

    const fetchApprovals = async () => {
      try {
        const snapshot = await getDocs(query(collection(db, 'registrations'), orderBy('timestamp', 'desc')));
        const approvalList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setApprovals(approvalList);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'registrations');
      }
    };
    fetchApprovals();

    const auditLogsQuery = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'));
    const unsubscribeAuditLogs = onSnapshot(auditLogsQuery, (snapshot) => {
      const logsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAuditLogs(logsList);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'auditLogs'));

    const inventoryQuery = query(collection(db, 'inventory'));
    const unsubscribeInventory = onSnapshot(inventoryQuery, (snapshot) => {
      const inventoryList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const structuredInventory = reconstructInventory(inventoryList);
      if (structuredInventory.length > 0) {
        setInventory(structuredInventory);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'inventory'));

    const stockInQuery = query(collection(db, 'stockInLogs'), orderBy('timestamp', 'desc'));
    const unsubscribeStockIn = onSnapshot(stockInQuery, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStockInLogs(logs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'stockInLogs'));

    const stockOutQuery = query(collection(db, 'stockOutLogs'), orderBy('timestamp', 'desc'));
    const unsubscribeStockOut = onSnapshot(stockOutQuery, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStockOutLogs(logs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'stockOutLogs'));

    const pendingWorksQuery = query(collection(db, 'pendingWorks'), orderBy('timestamp', 'desc'));
    const unsubscribePendingWorks = onSnapshot(pendingWorksQuery, (snapshot) => {
      const works = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingWorks(works);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'pendingWorks'));

    return () => {
      unsubscribeStaffs();
      unsubscribeAuditLogs();
      unsubscribeInventory();
      unsubscribeStockIn();
      unsubscribeStockOut();
      unsubscribePendingWorks();
    };
  }, [isAuthenticated]);

  const notifyAdmin = async (type: string, details: string) => {
    // In Firebase version, we can just log it or send a specific notification if needed
    // For now, we'll rely on the audit logs and registration requests
  };

  const logAction = async (action: string) => {
    try {
      await addDoc(collection(db, 'auditLogs'), {
        action,
        user: userName,
        timestamp: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'auditLogs');
    }
  };

  const handleResetInventory = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Inventory',
      message: 'Are you sure you want to reset the entire inventory to default? This will overwrite all current stock levels.',
      onConfirm: async () => {
        try {
          const snapshot = await getDocs(collection(db, 'inventory'));
          const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deletePromises);
          
          console.log("Re-seeding inventory...");
          for (const section of inventoryData) {
            for (const subSection of section.subSections) {
              for (const item of subSection.items) {
                await addDoc(collection(db, 'inventory'), {
                  ...item,
                  sectionTitle: section.title,
                  subSectionTitle: subSection.title,
                  timestamp: Timestamp.now()
                });
              }
            }
          }
          
          await addDoc(collection(db, 'auditLogs'), {
            action: 'RESET_INVENTORY',
            details: 'Inventory reset to default values',
            timestamp: Timestamp.now(),
            user: userName || 'Admin'
          });
          
          toast.success("Inventory has been reset successfully.");
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'inventory');
        }
      }
    });
  };

  const handleSaveReorder = (key: string, item: any) => {
    const tracking = reorderTracking[key];
    if (!tracking || !tracking.company || tracking.ordQty === '0') {
      toast.error('Please enter supplier and order quantity');
      return;
    }

    const newHistoryEntry = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      size: item.size,
      gsm: item.gsm,
      min: item.minQuantity || 500,
      curr: item.stock,
      short: (item.minQuantity || 500) - item.stock,
      company: tracking.company,
      ordQty: tracking.ordQty,
      ordDate: tracking.ordDate,
      expDelivery: tracking.expDelivery,
      status: tracking.status,
      remarks: tracking.remarks
    };

    setReorderHistory(prev => [newHistoryEntry, ...prev]);
    logAction(`Reordered ${item.size}x${item.gsm} from ${tracking.company}`);
    toast.success('Reorder log saved successfully!');
  };

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState<'xlsx' | 'pdf'>('xlsx');
  const [exportSource, setExportSource] = useState<'inventory' | 'stockIn' | 'stockOut' | 'pendingWorks' | 'demandForecast' | 'reorderAlerts'>('inventory');
  const [exportPeriod, setExportPeriod] = useState<'current' | 'period'>('current');
  const [exportStartDate, setExportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [exportEndDate, setExportEndDate] = useState(new Date().toISOString().split('T')[0]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    return `${day}-${month}-${year}`;
  };

  const handleInitiateExport = (type: 'xlsx' | 'pdf', source: 'inventory' | 'stockIn' | 'stockOut' | 'pendingWorks' | 'demandForecast' | 'reorderAlerts' = 'inventory') => {
    setExportType(type);
    setExportSource(source);
    setShowExportModal(true);
  };

  const handleFinalExport = () => {
    if (exportSource === 'inventory') {
      if (exportType === 'xlsx') handleExportXLSX();
      else handleExportPDF();
    } else if (exportSource === 'stockIn') {
      if (exportType === 'xlsx') handleExportStockInXLSX();
      else handleExportStockInPDF();
    } else if (exportSource === 'stockOut') {
      if (exportType === 'xlsx') handleExportStockOutXLSX();
      else handleExportStockOutPDF();
    } else if (exportSource === 'pendingWorks') {
      if (exportType === 'xlsx') handleExportPendingWorksXLSX();
      else handleExportPendingWorksPDF();
    } else if (exportSource === 'demandForecast') {
      if (exportType === 'xlsx') handleExportDemandForecastXLSX();
      else handleExportDemandForecastPDF();
    } else if (exportSource === 'reorderAlerts') {
      if (exportType === 'xlsx') handleExportReorderAlertXLSX();
      else handleExportReorderAlertPDF();
    }
    setShowExportModal(false);
  };

  const handleSaveToPdf = async () => {
    if (jobCards.length === 0) {
      toast.error('No job cards to export.');
      return;
    }

    setIsGenerating(true);
    try {
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const gap = 10;
      const cardWidth = (pageWidth - (margin * 2) - gap) / 2;
      
      // Process cards in pairs
      for (let i = 0; i < jobCards.length; i += 2) {
        if (i > 0) pdf.addPage();
        
        const cardsOnPage = jobCards.slice(i, i + 2);
        
        cardsOnPage.forEach((card, index) => {
          const xPos = margin + (index * (cardWidth + gap));
          
          autoTable(pdf, {
            startY: margin,
            margin: { left: xPos },
            tableWidth: cardWidth,
            theme: 'grid',
            styles: {
              fontSize: 10,
              cellPadding: 4,
              lineColor: [0, 0, 0],
              lineWidth: 0.5,
              textColor: [0, 0, 0],
              font: 'helvetica',
              valign: 'middle',
              overflow: 'linebreak',
            },
            columnStyles: {
              0: { 
                cellWidth: cardWidth * 0.4, 
                fontStyle: 'bold',
                fillColor: [255, 255, 255],
              },
              1: { 
                cellWidth: cardWidth * 0.6,
                fontStyle: 'bold',
                fillColor: [255, 255, 255],
              },
            },
            body: [
              ['JOB CARD NO:', card.jobCardNo || ''],
              ['DATE:', formatDate(card.date) || ''],
              ['WORK NAME:', card.workName || ''],
              ['SIZE:', card.size || ''],
              ['GSM:', card.gsm || ''],
              ['TOTAL GROSS:', card.totalGross || ''],
              ['DELIVERY LOCATION:', card.deliveryLoc || ''],
              ['LOADING DATE:', formatDate(card.loadingDate) || ''],
              ['SUPERVISOR SIGN:', ''],
              ['ACCOUNTANT SIGN:', ''],
            ],
            didParseCell: (data) => {
              // Extra height for signature rows
              if (data.row.index >= 8) {
                data.cell.styles.minCellHeight = 22;
              }
            },
            // Ensure borders are drawn correctly on all cells
            tableLineColor: [0, 0, 0],
            tableLineWidth: 0.5,
          });
        });
      }
      
      pdf.save(`JobCards_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error: any) {
      console.error('PDF Generation Error:', error);
      toast.error('Failed to generate PDF. Error: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const getFinancialYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    if (month >= 3) { // April is month 3
      return `${year.toString().slice(-2)}-${(year + 1).toString().slice(-2)}`;
    } else {
      return `${(year - 1).toString().slice(-2)}-${year.toString().slice(-2)}`;
    }
  };

  const generateJobCardNo = (prefix: string, index: number) => {
    const fy = getFinancialYear();
    const serial = (index + 1).toString().padStart(3, '0');
    return `${prefix}/${fy}/${serial}`;
  };

  const handleAiGenerate = async () => {
    if (!whatsappOrder.trim()) {
      toast.error('Please paste a WhatsApp order first.');
      return;
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Parse the following WhatsApp order and extract job card details. 
        Return an array of objects with these fields: date (YYYY-MM-DD), workName, size, gsm, totalGross, deliveryLoc, loadingDate (YYYY-MM-DD).
        If multiple items are in the order, return multiple objects.
        Order: ${whatsappOrder}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                workName: { type: Type.STRING },
                size: { type: Type.STRING },
                gsm: { type: Type.STRING },
                totalGross: { type: Type.STRING },
                deliveryLoc: { type: Type.STRING },
                loadingDate: { type: Type.STRING },
              },
              required: ["workName", "size", "gsm"]
            }
          }
        }
      });

      const parsedCards = JSON.parse(response.text);
      const newCards = parsedCards.map((card: any, index: number) => ({
        ...card,
        id: Date.now() + index,
        jobCardNo: generateJobCardNo(cardPrefix, jobCards.length + index),
        loadingDate: '' // Keep loading date empty as requested
      }));

      setJobCards(prev => [...prev, ...newCards]);
    } catch (error) {
      console.error('AI Generation Error:', error);
      toast.error('Failed to parse order. Please try again or use manual entry.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualBlankCard = () => {
    const newCard = {
      id: Date.now(),
      jobCardNo: generateJobCardNo(cardPrefix, jobCards.length),
      date: '',
      workName: '',
      size: '',
      gsm: '',
      totalGross: '',
      deliveryLoc: '',
      loadingDate: ''
    };
    setJobCards(prev => [...prev, newCard]);
  };

  const handleIncrement = (sectionTitle: string, subTitle: string, size: string) => {
    const section = inventory.find(s => s.title === sectionTitle);
    const sub = section?.subSections.find(ss => ss.title === subTitle);
    const item = sub?.items.find(i => i.size === size);
    
    if (item) {
      const now = new Date();
      setStockInItem({
        sectionTitle,
        subTitle,
        item,
        formData: {
          date: now.toISOString().split('T')[0],
          month: now.toLocaleString('default', { month: 'long' }),
          company: '',
          quantity: '',
          invoiceNo: '',
          storageLocation: '',
          remarks: ''
        }
      });
    }
  };

  const handleConfirmStockIn = async () => {
    if (!stockInItem || !stockInItem.formData.quantity) return;
    
    const quantity = parseInt(stockInItem.formData.quantity) || 0;
    await updateStock(stockInItem.sectionTitle, stockInItem.subTitle, stockInItem.item.size, quantity);
    
    try {
      await addDoc(collection(db, 'stockInLogs'), {
        date: stockInItem.formData.date,
        month: stockInItem.formData.month,
        size: stockInItem.item.size,
        gsm: stockInItem.item.gsm,
        quantity: quantity,
        company: stockInItem.formData.company,
        invoice: stockInItem.formData.invoiceNo,
        storageLoc: stockInItem.formData.storageLocation,
        remarks: stockInItem.formData.remarks,
        timestamp: Timestamp.now()
      });
      logAction(`Stock In: ${quantity} units of ${stockInItem.item.size}x${stockInItem.item.gsm} for ${stockInItem.formData.company}`);
      setStockInItem(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'stockInLogs');
    }
  };

  const handleDecrement = (sectionTitle: string, subTitle: string, size: string) => {
    const section = inventory.find(s => s.title === sectionTitle);
    const sub = section?.subSections.find(ss => ss.title === subTitle);
    const item = sub?.items.find(i => i.size === size);
    
    if (item) {
      const now = new Date();
      setStockOutItem({
        sectionTitle,
        subTitle,
        item,
        formData: {
          date: now.toISOString().split('T')[0],
          month: now.toLocaleString('default', { month: 'long' }),
          company: '',
          quantity: '',
          itemCode: '',
          workName: '',
          unit: 'GROSS',
          cuttingSize: '',
          sheets: '',
          status: 'Cutting',
          priority: 'Medium',
          remarks: ''
        }
      });
    }
  };

  const handleConfirmStockOut = async () => {
    if (!stockOutItem || !stockOutItem.formData.quantity) return;
    
    const quantity = parseInt(stockOutItem.formData.quantity) || 0;
    await updateStock(stockOutItem.sectionTitle, stockOutItem.subTitle, stockOutItem.item.size, -quantity);
    
    try {
      await addDoc(collection(db, 'pendingWorks'), {
        date: stockOutItem.formData.date,
        size: stockOutItem.item.size,
        gsm: stockOutItem.item.gsm,
        qty: quantity,
        unit: stockOutItem.formData.unit,
        company: stockOutItem.formData.company,
        itemCode: stockOutItem.formData.itemCode,
        workName: stockOutItem.formData.workName,
        cutSize: stockOutItem.formData.cuttingSize,
        sheets: parseInt(stockOutItem.formData.sheets) || 0,
        priority: stockOutItem.formData.priority.toUpperCase(),
        status: stockOutItem.formData.status.toUpperCase(),
        remarks: stockOutItem.formData.remarks,
        timestamp: Timestamp.now()
      });
      logAction(`Added new pending work: ${stockOutItem.formData.workName}`);
      setStockOutItem(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'pendingWorks');
    }
  };

  const updateStock = async (sectionTitle: string, subTitle: string, size: string, delta: number) => {
    try {
      const q = query(
        collection(db, 'inventory'), 
        where('sectionTitle', '==', sectionTitle),
        where('subSectionTitle', '==', subTitle),
        where('size', '==', size)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        const currentData = snapshot.docs[0].data();
        const newStock = Math.max(0, (currentData.stock || 0) + delta);
        await updateDoc(docRef, {
          stock: newStock,
          isLow: newStock < (currentData.minQuantity || 100)
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'inventory');
    }
  };

  const handleDelete = (sectionTitle: string, subTitle: string, size: string) => {
    setDeletingItem({ sectionTitle, subTitle, size });
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    const { sectionTitle, subTitle, size } = deletingItem;
    
    try {
      const q = query(
        collection(db, 'inventory'), 
        where('sectionTitle', '==', sectionTitle),
        where('subSectionTitle', '==', subTitle),
        where('size', '==', size)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        await deleteDoc(snapshot.docs[0].ref);
        logAction(`Deleted inventory item: ${size}`);
      }
      setDeletingItem(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'inventory');
    }
  };

  const handleEdit = (sectionTitle: string, subTitle: string, item: any) => {
    setEditingItem({ 
      sectionTitle, 
      subTitle, 
      item: { 
        ...item,
        minQuantity: item.minQuantity || 100,
        remarks: item.remarks || ""
      } 
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    const { sectionTitle, subTitle, item } = editingItem;
    
    try {
      const q = query(
        collection(db, 'inventory'), 
        where('sectionTitle', '==', sectionTitle),
        where('subSectionTitle', '==', subTitle),
        where('size', '==', item.size)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        await updateDoc(snapshot.docs[0].ref, {
          ...item,
          isLow: item.stock < (item.minQuantity || 100)
        });
        logAction(`Updated inventory item: ${item.size}x${item.gsm}`);
      }
      setEditingItem(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'inventory');
    }
  };

  const handleAddSku = async () => {
    if (!newSkuSize) return;
    
    const newItem = {
      size: newSkuSize,
      gsm: newSkuGsm,
      stock: parseInt(newSkuStock) || 0,
      isLow: (parseInt(newSkuStock) || 0) < 100,
      minQuantity: 100,
      remarks: ""
    };

    let targetSection = "OTHER SECTION";
    const section = inventoryData.find(s => s.title.includes(newSkuGsm));
    if (section) {
      targetSection = section.title;
    }

    let targetSubSection = "SINGLE SIZE";
    if (newSkuSize.includes('*')) {
      targetSubSection = "DOUBLE SIZE";
    }

    try {
      await addDoc(collection(db, 'inventory'), {
        ...newItem,
        sectionTitle: targetSection,
        subSectionTitle: targetSubSection,
        timestamp: Timestamp.now()
      });
      logAction(`Added new SKU: ${newSkuSize}x${newSkuGsm}`);
      setShowNewSkuForm(false);
      setNewSkuSize('');
      setNewSkuStock('0');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'inventory');
    }
  };

  const getStockAtDate = (itemSize: string, itemGsm: string, targetDate: string) => {
    // Find current stock
    let currentStock = 0;
    for (const section of inventory) {
      for (const sub of section.subSections) {
        for (const item of sub.items) {
          if (item.size === itemSize && item.gsm === itemGsm) {
            currentStock = item.stock;
            break;
          }
        }
      }
    }

    // Adjust for movements after targetDate (inclusive)
    const afterIn = stockInLogs
      .filter(log => log.size === itemSize && log.gsm === itemGsm && log.date >= targetDate)
      .reduce((sum, log) => sum + (log.quantity || 0), 0);
    
    const afterOut = stockOutLogs
      .filter(log => log.size === itemSize && log.gsm === itemGsm && log.date >= targetDate)
      .reduce((sum, log) => sum + (log.out || 0), 0);

    return currentStock - afterIn + afterOut;
  };

  const handleExportXLSX = () => {
    let data = [];
    if (exportPeriod === 'current') {
      data = inventory.flatMap(section => 
        section.subSections.flatMap(sub => 
          sub.items.map(item => ({
            'Section': section.title,
            'Subsection': sub.title,
            'Size': item.size,
            'GSM': item.gsm,
            'Stock': item.stock,
            'Status': item.isLow ? 'Low Stock' : 'In Stock'
          }))
        )
      );
    } else {
      // Period Export
      data = inventory.flatMap(section => 
        section.subSections.flatMap(sub => 
          sub.items.map(item => {
            const opening = getStockAtDate(item.size, item.gsm, exportStartDate);
            const totalIn = stockInLogs
              .filter(log => log.size === item.size && log.gsm === item.gsm && log.date >= exportStartDate && log.date <= exportEndDate)
              .reduce((sum, log) => sum + (log.quantity || 0), 0);
            const totalOut = stockOutLogs
              .filter(log => log.size === item.size && log.gsm === item.gsm && log.date >= exportStartDate && log.date <= exportEndDate)
              .reduce((sum, log) => sum + (log.out || 0), 0);
            const closing = opening + totalIn - totalOut;

            return {
              'Section': section.title,
              'Subsection': sub.title,
              'Size': item.size,
              'GSM': item.gsm,
              'Opening Stock': opening,
              'Total In': totalIn,
              'Total Out': totalOut,
              'Closing Stock': closing
            };
          })
        )
      );
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    const fileName = exportPeriod === 'current' 
      ? "EnerPack_Inventory_Current.xlsx" 
      : `EnerPack_Inventory_${exportStartDate}_to_${exportEndDate}.xlsx`;
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, fileName);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    const renderHeader = (pageTitle: string) => {
      doc.setFontSize(16);
      doc.setTextColor(15, 42, 67);
      doc.text("ENER PACK INVENTORY", 14, 15);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("CENTRAL WAREHOUSE TERMINAL", 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(15, 42, 67);
      doc.text(pageTitle, pageWidth - 14, 15, { align: 'right' });
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 25, pageWidth - 14, 25);
    };

    if (exportPeriod === 'current') {
      const renderSection = (section: any, startY: number) => {
      const allItems: any[] = [];
      section.subSections.forEach((sub: any) => {
        const excludedTitles = ["SINGLE SIZE", "150", "100"];
        if (!excludedTitles.includes(sub.title)) {
          allItems.push({ isHeader: true, title: sub.title });
        }
        sub.items.forEach((item: any) => allItems.push(item));
      });

      const half = Math.ceil(allItems.length / 2);
      const leftCol = allItems.slice(0, half);
      const rightCol = allItems.slice(half);
      
      const tableRows = [];
      for (let i = 0; i < half; i++) {
        const left = leftCol[i];
        const right = rightCol[i];
        
        const row: any[] = [];
        // Left part
        if (left) {
          if (left.isHeader) {
            row.push({ content: left.title, colSpan: 3, styles: { fillColor: [15, 42, 67], textColor: [255, 255, 255], halign: 'center', fontSize: 7, fontStyle: 'bold' } });
          } else {
            row.push(left.size, left.gsm, left.stock.toString());
          }
        } else {
          row.push('', '', '');
        }
        
        // Right part
        if (right) {
          if (right.isHeader) {
            row.push({ content: right.title, colSpan: 3, styles: { fillColor: [15, 42, 67], textColor: [255, 255, 255], halign: 'center', fontSize: 7, fontStyle: 'bold' } });
          } else {
            row.push(right.size, right.gsm, right.stock.toString());
          }
        } else {
          row.push('', '', '');
        }
        tableRows.push(row);
      }

      autoTable(doc, {
        startY: startY,
        head: [[{ content: section.title, colSpan: 6, styles: { fillColor: [15, 42, 67], textColor: [255, 255, 255], halign: 'center', fontStyle: 'bold', fontSize: 9 } }],
               ['SIZE', 'GSM', 'STOCK', 'SIZE', 'GSM', 'STOCK']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [248, 250, 252], textColor: [100, 116, 139], fontSize: 7, halign: 'center', fontStyle: 'bold' },
        columnStyles: {
          0: { halign: 'center', fontStyle: 'bold', cellWidth: 35 },
          1: { halign: 'center', textColor: [148, 163, 184], cellWidth: 21 },
          2: { halign: 'center', fontStyle: 'bold', cellWidth: 35 },
          3: { halign: 'center', fontStyle: 'bold', cellWidth: 35 },
          4: { halign: 'center', textColor: [148, 163, 184], cellWidth: 21 },
          5: { halign: 'center', fontStyle: 'bold', cellWidth: 35 },
        },
        styles: { fontSize: 7.5, cellPadding: 1.2, lineColor: [203, 213, 225], lineWidth: 0.1 },
        margin: { left: 14, right: 14 },
        didParseCell: (data) => {
          if (data.section === 'body') {
            const rowIndex = data.row.index;
            const colIndex = data.column.index;
            
            if (colIndex < 3 && leftCol[rowIndex] && !leftCol[rowIndex].isHeader && leftCol[rowIndex].isLow) {
                if (colIndex === 2) data.cell.styles.textColor = [244, 63, 94];
                data.cell.styles.fillColor = [255, 241, 242];
            }
            if (colIndex >= 3 && rightCol[rowIndex] && !rightCol[rowIndex].isHeader && rightCol[rowIndex].isLow) {
                if (colIndex === 5) data.cell.styles.textColor = [244, 63, 94];
                data.cell.styles.fillColor = [255, 241, 242];
            }
          }
        }
      });
      
      return (doc as any).lastAutoTable.finalY;
    };

    // Page 1: 280 and 250 Sections
    renderHeader("Page 1/2");
    let currentY1 = 30;
    
    const section280 = inventory.find(s => s.title.includes('280'));
    if (section280) {
      currentY1 = renderSection(section280, currentY1);
    }
    
    const section250 = inventory.find(s => s.title.includes('250'));
    if (section250) {
      currentY1 = renderSection(section250, currentY1 + 6);
    }

    // Page 2: All other sections
    doc.addPage();
    renderHeader("Page 2/2");
    let currentY2 = 30;
    
    const otherSections = inventory.filter(s => !s.title.includes('280') && !s.title.includes('250'));
    otherSections.forEach((section, idx) => {
      currentY2 = renderSection(section, currentY2 + (idx === 0 ? 0 : 6));
    });
    } else {
      // Period Export PDF
      renderHeader(`INVENTORY MOVEMENT REPORT (${formatDate(exportStartDate)} to ${formatDate(exportEndDate)})`);
      let currentY = 35;

      const data = inventory.flatMap(section => 
        section.subSections.flatMap(sub => 
          sub.items.map(item => {
            const opening = getStockAtDate(item.size, item.gsm, exportStartDate);
            const totalIn = stockInLogs
              .filter(log => log.size === item.size && log.gsm === item.gsm && log.date >= exportStartDate && log.date <= exportEndDate)
              .reduce((sum, log) => sum + (log.quantity || 0), 0);
            const totalOut = stockOutLogs
              .filter(log => log.size === item.size && log.gsm === item.gsm && log.date >= exportStartDate && log.date <= exportEndDate)
              .reduce((sum, log) => sum + (log.out || 0), 0);
            const closing = opening + totalIn - totalOut;

            return [
              item.size,
              item.gsm,
              opening.toString(),
              totalIn.toString(),
              totalOut.toString(),
              closing.toString()
            ];
          })
        )
      );

      autoTable(doc, {
        startY: currentY,
        head: [['SIZE', 'GSM', 'OPENING', 'TOTAL IN', 'TOTAL OUT', 'CLOSING']],
        body: data,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [15, 42, 67], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
          2: { halign: 'center', fontStyle: 'bold' },
          3: { halign: 'center', textColor: [16, 185, 129] },
          4: { halign: 'center', textColor: [239, 68, 68] },
          5: { halign: 'center', fontStyle: 'bold' }
        }
      });
    }

    const fileName = exportPeriod === 'current' 
      ? "EnerPack_Inventory_Current.pdf" 
      : `EnerPack_Inventory_${exportStartDate}_to_${exportEndDate}.pdf`;
    doc.save(fileName);
  };

  const totalSkus = inventory.reduce((acc, section) => 
    acc + section.subSections.reduce((sacc, sub) => sacc + sub.items.length, 0), 0
  );
  
  const lowStockCount = inventory.reduce((acc, section) => 
    acc + section.subSections.reduce((sacc, sub) => 
      sacc + sub.items.filter(item => item.isLow).length, 0
    ), 0
  );

  const totalStock = inventory.reduce((acc, section) => 
    acc + section.subSections.reduce((sacc, sub) => 
      sacc + sub.items.reduce((isacc, item) => isacc + item.stock, 0), 0
    ), 0
  );

  const filteredLogs = stockInLogs.filter(log => 
    log.size.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
    log.company.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
    log.invoice.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
    log.month.toLowerCase().includes(searchLogQuery.toLowerCase())
  );

  const filteredPendingWorks = pendingWorks.filter(work => 
    work.workName.toLowerCase().includes(searchPendingQuery.toLowerCase()) ||
    work.company.toLowerCase().includes(searchPendingQuery.toLowerCase()) ||
    work.itemCode.toLowerCase().includes(searchPendingQuery.toLowerCase()) ||
    work.size.toLowerCase().includes(searchPendingQuery.toLowerCase())
  );

  const handleExportStockInXLSX = () => {
    const today = new Date().toISOString().split('T')[0];
    const sourceData = exportPeriod === 'current' 
      ? stockInLogs.filter(log => log.date === today)
      : stockInLogs.filter(log => log.date >= exportStartDate && log.date <= exportEndDate);

    const data = sourceData.map(log => ({
      'DATE': log.date,
      'MONTH': log.month,
      'SIZE': log.size,
      'GSM': log.gsm,
      'IN': log.quantity,
      'COMPANY': log.company,
      'INVOICE': log.invoice,
      'STORAGE LOC': log.storageLoc,
      'REMARKS': log.remarks
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    const fileName = exportPeriod === 'current' 
      ? `Stock_In_Logs_${today}.xlsx` 
      : `Stock_In_Logs_${exportStartDate}_to_${exportEndDate}.xlsx`;
    XLSX.utils.book_append_sheet(wb, ws, "Stock In Logs");
    XLSX.writeFile(wb, fileName);
  };

  const handleExportStockInPDF = () => {
    const today = new Date().toISOString().split('T')[0];
    const sourceData = exportPeriod === 'current' 
      ? stockInLogs.filter(log => log.date === today)
      : stockInLogs.filter(log => log.date >= exportStartDate && log.date <= exportEndDate);

    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(18);
    const title = exportPeriod === 'current' 
      ? `STOCK IN LOGS (${formatDate(today)})` 
      : `STOCK IN LOGS (${formatDate(exportStartDate)} to ${formatDate(exportEndDate)})`;
    doc.text(title, 14, 15);
    
    const tableData = sourceData.map(log => [
      log.date,
      log.month,
      log.size,
      log.gsm,
      log.quantity,
      log.company,
      log.invoice,
      log.storageLoc,
      log.remarks
    ]);

    autoTable(doc, {
      head: [['DATE', 'MONTH', 'SIZE', 'GSM', 'IN', 'COMPANY', 'INVOICE', 'STORAGE LOC', 'REMARKS']],
      body: tableData,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 64, 175] }
    });

    const fileName = exportPeriod === 'current' 
      ? `Stock_In_Logs_${today}.pdf` 
      : `Stock_In_Logs_${exportStartDate}_to_${exportEndDate}.pdf`;
    doc.save(fileName);
  };

  const handleExportStockOutXLSX = () => {
    const today = new Date().toISOString().split('T')[0];
    const sourceData = exportPeriod === 'current' 
      ? stockOutLogs.filter(log => log.date === today)
      : stockOutLogs.filter(log => log.date >= exportStartDate && log.date <= exportEndDate);

    const data = sourceData.map(log => ({
      'DATE': log.date,
      'SIZE': log.size,
      'GSM': log.gsm,
      'OUT': log.out,
      'UNIT': log.unit,
      'ITEM CODE': log.itemCode,
      'WORK NAME': log.workName,
      'CUT SIZE': log.cutSize,
      'SHEETS': log.sheets,
      'STATUS': log.status,
      'DELIVERY DATE': log.deliveryDate,
      'VEHICLE': log.vehicle,
      'LOCATION': log.location,
      'REMARKS': log.remarks
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    const fileName = exportPeriod === 'current' 
      ? `Stock_Out_Logs_${today}.xlsx` 
      : `Stock_Out_Logs_${exportStartDate}_to_${exportEndDate}.xlsx`;
    XLSX.utils.book_append_sheet(wb, ws, "Stock Out Logs");
    XLSX.writeFile(wb, fileName);
  };

  const handleExportStockOutPDF = () => {
    const today = new Date().toISOString().split('T')[0];
    const sourceData = exportPeriod === 'current' 
      ? stockOutLogs.filter(log => log.date === today)
      : stockOutLogs.filter(log => log.date >= exportStartDate && log.date <= exportEndDate);

    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(18);
    const title = exportPeriod === 'current' 
      ? `STOCK OUT LOGS (${formatDate(today)})` 
      : `STOCK OUT LOGS (${formatDate(exportStartDate)} to ${formatDate(exportEndDate)})`;
    doc.text(title, 14, 15);
    
    const tableData = sourceData.map(log => [
      log.date,
      log.size,
      log.gsm,
      log.out,
      log.unit,
      log.itemCode,
      log.workName,
      log.cutSize,
      log.sheets,
      log.status,
      log.deliveryDate,
      log.vehicle,
      log.location,
      log.remarks
    ]);

    autoTable(doc, {
      head: [['DATE', 'SIZE', 'GSM', 'OUT', 'UNIT', 'ITEM CODE', 'WORK NAME', 'CUT SIZE', 'SHEETS', 'STATUS', 'DELIVERY DATE', 'VEHICLE', 'LOCATION', 'REMARKS']],
      body: tableData,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 7 },
      headStyles: { fillColor: [139, 26, 26] }
    });

    const fileName = exportPeriod === 'current' 
      ? `Stock_Out_Logs_${today}.pdf` 
      : `Stock_Out_Logs_${exportStartDate}_to_${exportEndDate}.pdf`;
    doc.save(fileName);
  };

  const handleExportPendingWorksXLSX = () => {
    const today = new Date().toISOString().split('T')[0];
    const sourceData = exportPeriod === 'current' 
      ? pendingWorks.filter(work => work.date === today)
      : pendingWorks.filter(work => work.date >= exportStartDate && work.date <= exportEndDate);

    const data = sourceData.map(work => ({
      'DATE': work.date,
      'SIZE': work.size,
      'GSM': work.gsm,
      'QTY': work.qty,
      'COMPANY': work.company,
      'ITEM CODE': work.itemCode,
      'WORK NAME': work.workName,
      'CUT SIZE': work.cutSize,
      'SHEETS': work.sheets,
      'PRIORITY': work.priority,
      'STATUS': work.status,
      'REMARKS': work.remarks
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    const fileName = exportPeriod === 'current' 
      ? `Pending_Works_${today}.xlsx` 
      : `Pending_Works_${exportStartDate}_to_${exportEndDate}.xlsx`;
    XLSX.utils.book_append_sheet(wb, ws, "Pending Works");
    XLSX.writeFile(wb, fileName);
  };

  const handleExportPendingWorksPDF = () => {
    const today = new Date().toISOString().split('T')[0];
    const sourceData = exportPeriod === 'current' 
      ? pendingWorks.filter(work => work.date === today)
      : pendingWorks.filter(work => work.date >= exportStartDate && work.date <= exportEndDate);

    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(18);
    const title = exportPeriod === 'current' 
      ? `PENDING WORKS (${formatDate(today)})` 
      : `PENDING WORKS (${formatDate(exportStartDate)} to ${formatDate(exportEndDate)})`;
    doc.text(title, 14, 15);
    
    const tableData = sourceData.map(work => [
      work.date,
      work.size,
      work.gsm,
      work.qty,
      work.company,
      work.itemCode,
      work.workName,
      work.cutSize,
      work.sheets,
      work.priority,
      work.status,
      work.remarks
    ]);

    autoTable(doc, {
      head: [['DATE', 'SIZE', 'GSM', 'QTY', 'COMPANY', 'ITEM CODE', 'WORK NAME', 'CUT SIZE', 'SHEETS', 'PRIORITY', 'STATUS', 'REMARKS']],
      body: tableData,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [242, 101, 34] }
    });

    const fileName = exportPeriod === 'current' 
      ? `Pending_Works_${today}.pdf` 
      : `Pending_Works_${exportStartDate}_to_${exportEndDate}.pdf`;
    doc.save(fileName);
  };

  const handleExportReorderAlertXLSX = () => {
    const alertsData = inventory.flatMap(section => 
      section.subSections.flatMap(sub => 
        sub.items.filter(item => 
          item.isLow && (
            item.size.toLowerCase().includes(searchAlertsQuery.toLowerCase()) ||
            item.gsm.toLowerCase().includes(searchAlertsQuery.toLowerCase())
          )
        ).map(item => {
          const key = `${item.size}-${item.gsm}`;
          const tracking = reorderTracking[key] || {};
          return {
            'SIZE': item.size,
            'GSM': item.gsm,
            'MIN': item.minQuantity || 500,
            'CURR': item.stock,
            'SHORT': (item.minQuantity || 500) - item.stock,
            'COMPANY': tracking.company || '',
            'ORD QTY': tracking.ordQty || '',
            'ORD DATE': tracking.ordDate || '',
            'EXP DELIVERY': tracking.expDelivery || '',
            'STATUS': tracking.status || 'Pending',
            'REMARKS': tracking.remarks || ''
          };
        })
      )
    );

    if (alertsData.length === 0) {
      toast.error("No reorder alerts to export.");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(alertsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reorder Alerts");
    XLSX.writeFile(wb, "Reorder_Alerts.xlsx");
  };

  const handleExportReorderAlertPDF = () => {
    const alertsData = inventory.flatMap(section => 
      section.subSections.flatMap(sub => 
        sub.items.filter(item => 
          item.isLow && (
            item.size.toLowerCase().includes(searchAlertsQuery.toLowerCase()) ||
            item.gsm.toLowerCase().includes(searchAlertsQuery.toLowerCase())
          )
        ).map(item => {
          const key = `${item.size}-${item.gsm}`;
          const tracking = reorderTracking[key] || {};
          return [
            item.size,
            item.gsm,
            item.minQuantity || 500,
            item.stock,
            (item.minQuantity || 500) - item.stock,
            tracking.company || '',
            tracking.ordQty || '',
            tracking.ordDate || '',
            tracking.expDelivery || '',
            tracking.status || 'Pending',
            tracking.remarks || ''
          ];
        })
      )
    );

    if (alertsData.length === 0) {
      toast.error("No reorder alerts to export.");
      return;
    }

    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(18);
    doc.text("REORDER ALERTS", 14, 15);

    autoTable(doc, {
      head: [['SIZE', 'GSM', 'MIN', 'CURR', 'SHORT', 'COMPANY', 'ORD QTY', 'ORD DATE', 'EXP DELIVERY', 'STATUS', 'REMARKS']],
      body: alertsData,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 7 },
      headStyles: { fillColor: [211, 47, 47] }
    });

    doc.save("Reorder_Alerts.pdf");
  };

  const handleExportDemandForecastXLSX = () => {
    // Simple aggregation of stockOutLogs for forecast
    const consumptionMap: Record<string, { size: string, gsm: string, totalOut: number, itemCode: string }> = {};
    
    stockOutLogs.forEach(log => {
      const key = `${log.size}-${log.gsm}-${log.itemCode}`;
      if (!consumptionMap[key]) {
        consumptionMap[key] = { size: log.size, gsm: log.gsm, totalOut: 0, itemCode: log.itemCode };
      }
      consumptionMap[key].totalOut += log.out;
    });

    const forecastData = Object.values(consumptionMap)
      .sort((a, b) => b.totalOut - a.totalOut)
      .map((item, index) => ({
        'RANK': index + 1,
        'ITEM CODE': item.itemCode,
        'SIZE': item.size,
        'GSM': item.gsm,
        'TOTAL CONSUMPTION': item.totalOut,
        'AVG MONTHLY': (item.totalOut / 3).toFixed(2) // Simple average over 3 months
      }));

    if (forecastData.length === 0) {
      toast.error("No consumption data for forecast.");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(forecastData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Demand Forecast");
    XLSX.writeFile(wb, "Demand_Forecast.xlsx");
  };

  const handleExportDemandForecastPDF = () => {
    const consumptionMap: Record<string, { size: string, gsm: string, totalOut: number, itemCode: string }> = {};
    
    stockOutLogs.forEach(log => {
      const key = `${log.size}-${log.gsm}-${log.itemCode}`;
      if (!consumptionMap[key]) {
        consumptionMap[key] = { size: log.size, gsm: log.gsm, totalOut: 0, itemCode: log.itemCode };
      }
      consumptionMap[key].totalOut += log.out;
    });

    const forecastData = Object.values(consumptionMap)
      .sort((a, b) => b.totalOut - a.totalOut)
      .map((item, index) => [
        index + 1,
        item.itemCode,
        `${item.size} / ${item.gsm}`,
        item.totalOut,
        (item.totalOut / 3).toFixed(2)
      ]);

    if (forecastData.length === 0) {
      toast.error("No consumption data for forecast.");
      return;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFontSize(18);
    doc.text("DEMAND FORECAST (CONSUMPTION RANKING)", 14, 15);

    autoTable(doc, {
      head: [['RANK', 'ITEM CODE', 'SPEC (SIZE/GSM)', 'TOTAL VOL', 'AVG MONTHLY']],
      body: forecastData,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [14, 165, 233] }
    });

    doc.save("Demand_Forecast.pdf");
  };

  const currentSelectedEntry = selectedQuickTrackerItem ? (() => {
    const section = inventory.find(s => s.title === selectedQuickTrackerItem.sectionTitle);
    const sub = section?.subSections.find(ss => ss.title === selectedQuickTrackerItem.subTitle);
    const item = sub?.items.find(i => i.size === selectedQuickTrackerItem.item.size && i.gsm === selectedQuickTrackerItem.item.gsm);
    return item ? { ...selectedQuickTrackerItem, item } : null;
  })() : null;

  return (
    <ErrorBoundary>
      {/* Notifications Toast - Restricted to Admin Panel */}
      {activeTab === 'Admin Panel' && (
        <div className="fixed bottom-6 right-6 z-[100] space-y-3 pointer-events-none">
          <AnimatePresence>
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                onClick={() => {
                  if (notification.message.includes('registration')) {
                    setActiveTab('Admin Panel');
                    setAdminTab('Approval');
                  }
                }}
                className={cn(
                  "pointer-events-auto px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[300px] border backdrop-blur-md cursor-pointer",
                  notification.type === 'info' ? "bg-blue-600/90 text-white border-blue-400" :
                  notification.type === 'success' ? "bg-emerald-600/90 text-white border-emerald-400" :
                  "bg-amber-600/90 text-white border-amber-400"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Bell size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold tracking-tight">{notification.message}</p>
                  <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">System Alert</p>
                </div>
                <button 
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Toaster position="top-right" richColors />
      
      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
            >
              <div className="p-8">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
                  <AlertTriangle className="text-amber-500" size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">{confirmModal.title}</h3>
                <p className="text-slate-500 leading-relaxed mb-8">{confirmModal.message}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 p-4 bg-slate-100 text-slate-600 rounded-xl font-black uppercase tracking-wider hover:bg-slate-200 transition-all"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={() => {
                      confirmModal.onConfirm();
                      setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    }}
                    className="flex-1 p-4 bg-rose-600 text-white rounded-xl font-black uppercase tracking-wider hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/25"
                  >
                    CONFIRM
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {!isAuthenticated ? (
      <LoginPage
        onLogin={(role: string, name: string = 'System User', pages: string[] = []) => { 
          setIsAuthenticated(true); 
          setUserRole('Viewer'); 
          setUserName('Guest User');
          setUserPages(['Dashboard', 'Inventory', 'Movement', 'Planning', 'Tools']);
          setActiveTab('Dashboard');
        }}
        onRegister={async (username, password) => {
          try {
            await addDoc(collection(db, 'registrations'), {
              username,
              password,
              status: 'Pending',
              type: 'User Registration',
              details: `New user registration: ${username}`,
              timestamp: Timestamp.now(),
              pageAccess: roles[0]?.name || 'All'
            });
            logAction(`New user registration request: ${username}`);
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'registrations');
          }
        }}
        staffs={staffs}
      />
    ) : (
      <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-900 overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-[#0f2a43] flex flex-col shrink-0 z-50 transition-transform duration-300 lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[#0f2a43] font-bold">
              EP
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">ENERPACK</h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 py-4 flex items-center gap-3 border-b border-slate-700/50 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white">
            <User size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{userName}</p>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
              {roles.find(r => r.id.toLowerCase() === userRole?.toLowerCase())?.name || userRole}
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar">
          {hasPermission('dashboard') && (
            <>
              <SectionHeader label="General" />
              <SidebarItem 
                icon={LayoutDashboard} 
                label="Dashboard" 
                active={activeTab === 'Dashboard'} 
                onClick={() => { setActiveTab('Dashboard'); setIsSidebarOpen(false); }} 
              />
            </>
          )}

          {hasPermission('inventory') && (
            <>
              <SectionHeader label="Inventory" />
              <SidebarItem 
                icon={Package} 
                label="Full Inventory" 
                active={activeTab === 'Full Inventory'} 
                onClick={() => { setActiveTab('Full Inventory'); setIsSidebarOpen(false); }} 
              />
              <SidebarItem 
                icon={Search} 
                label="Quick Tracker" 
                active={activeTab === 'Quick Tracker'} 
                onClick={() => { setActiveTab('Quick Tracker'); setIsSidebarOpen(false); }} 
              />
            </>
          )}

          {hasPermission('movement') && (
            <>
              <SectionHeader label="Movement" />
              <SidebarItem 
                icon={LogIn} 
                label="Stock In Logs" 
                active={activeTab === 'Stock In Logs'} 
                onClick={() => { setActiveTab('Stock In Logs'); setIsSidebarOpen(false); }} 
              />
              <SidebarItem 
                icon={LogOutIcon} 
                label="Stock Out Logs" 
                active={activeTab === 'Stock Out Logs'}
                onClick={() => { setActiveTab('Stock Out Logs'); setIsSidebarOpen(false); }}
              />
              <SidebarItem 
                icon={Clock} 
                label="Pending Works" 
                active={activeTab === 'Pending Works'} 
                onClick={() => { setActiveTab('Pending Works'); setIsSidebarOpen(false); }} 
              />
            </>
          )}

          {hasPermission('planning') && (
            <>
              <SectionHeader label="Planning" />
              <SidebarItem 
                icon={Bell} 
                label="Reorder Alerts" 
                active={activeTab === 'Reorder Alerts'} 
                onClick={() => { setActiveTab('Reorder Alerts'); setIsSidebarOpen(false); }} 
              />
              <SidebarItem 
                icon={History} 
                label="Reorder History" 
                active={activeTab === 'Reorder History'}
                onClick={() => { setActiveTab('Reorder History'); setIsSidebarOpen(false); }}
              />
              <SidebarItem 
                icon={TrendingUp} 
                label="Demand Forecast" 
                active={activeTab === 'Demand Forecast'}
                onClick={() => { setActiveTab('Demand Forecast'); setIsSidebarOpen(false); }}
              />
            </>
          )}

          {hasPermission('tools') && (
            <>
              <SectionHeader label="Tools" />
              <SidebarItem 
                icon={Calculator} 
                label="Calculator" 
                active={activeTab === 'Calculator'}
                onClick={() => { setActiveTab('Calculator'); setIsSidebarOpen(false); }}
              />
              <SidebarItem 
                icon={FileText} 
                label="Job Card Generator" 
                active={activeTab === 'Job Card Generator'}
                onClick={() => { setActiveTab('Job Card Generator'); setIsSidebarOpen(false); }}
              />
            </>
          )}

          {hasPermission('admin') && (
            <>
              <SectionHeader label="System" />
              <SidebarItem 
                icon={Settings} 
                label="Admin Control" 
                active={activeTab === 'Admin Panel'}
                onClick={() => { setActiveTab('Admin Panel'); setIsSidebarOpen(false); }}
                badge={approvals.filter(a => a.type === 'User Registration' && a.status === 'Pending').length}
              />
            </>
          )}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-700/50">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 text-rose-400 hover:text-rose-300 transition-colors text-sm font-bold uppercase tracking-widest"
          >
            <LogOutIcon size={18} />
            LOG OUT
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#0f2a43] rounded flex items-center justify-center text-white font-bold text-xs">
                EP
              </div>
              <span className="font-bold text-slate-800 tracking-tight">ENERPACK</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <User size={16} />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'Dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Dashboard Header */}
              <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-400 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-slate-800 font-bold text-base md:text-lg tracking-tight uppercase">WELCOME {userName}</h2>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  {hasPermission('admin') && (
                    <button 
                      onClick={() => {
                        setActiveTab('Admin Panel');
                        setAdminTab('Approval');
                      }}
                      className="relative p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-slate-200"
                      title="Pending Approvals"
                    >
                      <Bell size={20} />
                      {approvals.filter(a => a.type === 'User Registration' && a.status === 'Pending').length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                          {approvals.filter(a => a.type === 'User Registration' && a.status === 'Pending').length}
                        </span>
                      )}
                    </button>
                  )}
                  <div className="px-3 py-1.5 md:px-4 md:py-2 bg-slate-50 rounded-xl border border-slate-400 flex items-center gap-2">
                    <Clock size={14} className="text-slate-400" />
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-600 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              {/* Pending Approvals Alert */}
              {hasPermission('admin') && approvals.filter(a => a.type === 'User Registration' && a.status === 'Pending').length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 border border-blue-200 p-6 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                      <User size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-blue-900 tracking-tight uppercase">New Registration Requests</h3>
                      <p className="text-sm text-blue-700 font-medium">There are {approvals.filter(a => a.type === 'User Registration' && a.status === 'Pending').length} new user registration requests waiting for your approval.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setActiveTab('Admin Panel');
                      setAdminTab('Approval');
                    }}
                    className="w-full md:w-auto bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                  >
                    Review Now
                  </button>
                </motion.div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  label="Active SKUs" 
                  value={totalSkus.toLocaleString()} 
                  icon={Box} 
                  iconBg="bg-emerald-50" 
                />
                <StatCard 
                  label="Total Assets" 
                  value={totalStock.toLocaleString()} 
                  icon={Layers} 
                  iconBg="bg-blue-50" 
                />
                <StatCard 
                  label="Volume (MTD)" 
                  value="0" 
                  trend="5.2%" 
                  icon={Activity} 
                  iconBg="bg-indigo-50" 
                />
                <StatCard 
                  label="Low Stock" 
                  value={lowStockCount.toLocaleString()} 
                  status={lowStockCount > 0 ? "Action Needed" : "All Good"} 
                  icon={AlertCircle} 
                  iconBg="bg-rose-50" 
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-400">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Global Movement Patterns</h3>
                    <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      H2 Analytics
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={movementData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                          dy={10}
                        />
                        <YAxis hide />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#3b82f6" 
                          strokeWidth={3} 
                          dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-400">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Distribution</h3>
                    <button className="text-slate-400 hover:text-slate-600">
                      <Settings size={16} />
                    </button>
                  </div>
                  <div className="h-[200px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {distributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold text-slate-800">145</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categories</span>
                    </div>
                  </div>
                  <div className="mt-8 space-y-3">
                    {distributionData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.name}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-800">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Section */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-400">
                <div className="flex items-center gap-2 mb-8">
                  <TrendingUp className="text-blue-500" size={18} />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">High Velocity Inventory</h3>
                </div>
                <div className="space-y-8">
                  {highVelocityData.map((item) => (
                    <div key={item.name}>
                      <div className="flex justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">{item.name}</span>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{item.value} Units</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.value / item.max) * 100}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-blue-500 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Calculator' && (
            <motion.div
              key="calculator"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-5xl mx-auto mt-2 lg:mt-12"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 lg:gap-4 mb-2 lg:mb-8">
                <div className="flex items-center gap-3 lg:gap-4">
                  <button onClick={() => setActiveTab('Dashboard')} className="p-1.5 lg:p-2 bg-white rounded-xl border border-slate-200">
                    <ArrowLeft size={18} />
                  </button>
                  <h2 className="text-lg lg:text-xl font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <Calculator size={18} /> CALCULATOR
                  </h2>
                </div>
                <button onClick={() => setCalcInputs({ gsm: '280', width: '60', length: '100', quantity: '1000' })} className="w-full sm:w-auto px-4 lg:px-6 py-1.5 lg:py-2 bg-slate-800 text-white rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 text-xs lg:text-sm">
                  <RotateCcw size={14} /> RESET
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-8">
                {/* Inputs Panel */}
                <div className="bg-white p-3 lg:p-8 rounded-2xl lg:rounded-3xl shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-2 lg:mb-8">
                    <h3 className="text-sm lg:text-lg font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Move size={18} className="text-blue-500" /> INPUTS
                    </h3>
                    <Info size={16} className="text-slate-400" />
                  </div>
                  
                  <div className="space-y-2 lg:space-y-6">
                    {/* GSM */}
                    <div>
                      <label className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 lg:mb-2 block">GSM</label>
                      <div className="relative">
                        <input type="number" value={calcInputs.gsm} onChange={(e) => setCalcInputs({...calcInputs, gsm: e.target.value})} className="w-full p-2 lg:p-4 bg-slate-50 rounded-xl lg:rounded-2xl border border-slate-200 font-bold text-base lg:text-lg" />
                        <span className="absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 text-[9px] lg:text-[10px] font-bold text-slate-400 bg-white px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-lg border border-slate-200">GSM</span>
                      </div>
                    </div>
                    
                    {/* Width & Length */}
                    <div className="grid grid-cols-2 gap-2 lg:gap-4">
                      <div>
                        <label className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 lg:mb-2 block">WIDTH</label>
                        <div className="relative">
                          <input type="number" value={calcInputs.width} onChange={(e) => setCalcInputs({...calcInputs, width: e.target.value})} className="w-full p-2 lg:p-4 bg-slate-50 rounded-xl lg:rounded-2xl border border-slate-200 font-bold text-base lg:text-lg" />
                          <span className="absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 text-[9px] lg:text-[10px] font-bold text-slate-400 bg-white px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-lg border border-slate-200">CM</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 lg:mb-2 block">LENGTH</label>
                        <div className="relative">
                          <input type="number" value={calcInputs.length} onChange={(e) => setCalcInputs({...calcInputs, length: e.target.value})} className="w-full p-2 lg:p-4 bg-slate-50 rounded-xl lg:rounded-2xl border border-slate-200 font-bold text-base lg:text-lg" />
                          <span className="absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 text-[9px] lg:text-[10px] font-bold text-slate-400 bg-white px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-lg border border-slate-200">CM</span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 lg:mb-2 block">QUANTITY</label>
                      <div className="relative">
                        <input type="number" value={calcInputs.quantity} onChange={(e) => setCalcInputs({...calcInputs, quantity: e.target.value})} className="w-full p-2 lg:p-4 bg-slate-50 rounded-xl lg:rounded-2xl border border-slate-200 font-bold text-base lg:text-lg" />
                        <span className="absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 text-[9px] lg:text-[10px] font-bold text-slate-400 bg-white px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-lg border border-slate-200">PCS</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Final Weight Panel */}
                <div className="bg-[#0f4c75] p-3 lg:p-8 rounded-2xl lg:rounded-3xl shadow-sm text-white flex flex-col">
                  <div className="text-center mb-2 lg:mb-8">
                    <p className="text-[9px] lg:text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1 lg:mb-2">FINAL WEIGHT</p>
                    <h1 className="text-3xl lg:text-7xl font-black">{((parseFloat(calcInputs.gsm) * parseFloat(calcInputs.width) * parseFloat(calcInputs.length) * parseFloat(calcInputs.quantity)) / 10000000).toLocaleString()} <span className="text-xl lg:text-4xl text-blue-300">KG</span></h1>
                  </div>
                  
                  <div className="h-1 lg:h-2 bg-blue-900 rounded-full mb-2 lg:mb-8 overflow-hidden">
                    <div className="h-full bg-blue-400 w-full"></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 lg:gap-4 mt-auto">
                    <div className="bg-[#1b6ca8] p-2 lg:p-4 rounded-xl lg:rounded-2xl text-center">
                      <p className="text-[9px] lg:text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-0.5 lg:mb-1">SHEETS</p>
                      <p className="text-lg lg:text-2xl font-bold">{calcInputs.quantity}</p>
                    </div>
                    <div className="bg-[#1b6ca8] p-2 lg:p-4 rounded-xl lg:rounded-2xl text-center">
                      <p className="text-[9px] lg:text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-0.5 lg:mb-1">AREA</p>
                      <p className="text-lg lg:text-2xl font-bold">{((parseFloat(calcInputs.width) * parseFloat(calcInputs.length)) / 10000).toFixed(2)} m²</p>
                    </div>
                  </div>
                  
                  <div className="mt-2 lg:mt-8 pt-2 lg:pt-6 border-t border-blue-900 flex justify-between items-center text-[8px] lg:text-[10px] font-bold text-blue-300 uppercase tracking-widest">
                    <span>VERIFIED OPERATIONS</span>
                    <span>V1.24.0</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Full Inventory' && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full"
            >
              {/* Inventory Header */}
              <div className="hidden lg:flex bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-400 mb-8 flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                  <h2 className="text-slate-800 font-bold text-base md:text-lg tracking-tight uppercase">ENER PACK INVENTORY</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Central Warehouse Terminal</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 w-full lg:max-w-2xl">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search SKU..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-400 rounded-xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleInitiateExport('xlsx')}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors"
                    >
                      <FileSpreadsheet size={14} /> XLSX
                    </button>
                    <button 
                      onClick={() => handleInitiateExport('pdf')}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors"
                    >
                      <FileText size={14} /> PDF
                    </button>
                  </div>

                  {isAdmin && (
                    <button 
                      onClick={() => setShowNewSkuForm(!showNewSkuForm)}
                      className={cn(
                        "hidden lg:flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap",
                        showNewSkuForm ? "bg-slate-800 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
                      )}
                    >
                      {showNewSkuForm ? <Minus size={14} /> : <Plus size={14} />} {showNewSkuForm ? "CANCEL" : "NEW SKU"}
                    </button>
                  )}
                </div>
              </div>

              {/* New SKU Form (As per snap) */}
              <AnimatePresence>
                {showNewSkuForm && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="hidden lg:block overflow-hidden"
                  >
                    <div className="bg-white p-4 lg:p-6 rounded-3xl shadow-sm border border-slate-400 mb-8">
                      <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-6">
                        <div className="flex-1 space-y-2 w-full">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SIZE</label>
                          <input 
                            type="text" 
                            value={newSkuSize}
                            onChange={(e) => setNewSkuSize(e.target.value)}
                            placeholder="Enter size..."
                            className="w-full bg-slate-50 border border-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                        <div className="w-full lg:w-48 space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GSM</label>
                          <div className="relative">
                            <select 
                              value={newSkuGsm}
                              onChange={(e) => setNewSkuGsm(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none font-bold"
                            >
                              <option value="280">280</option>
                              <option value="250">250</option>
                              <option value="230">230</option>
                              <option value="200">200</option>
                              <option value="150">150</option>
                              <option value="100">100</option>
                              <option value="140GYT">140GYT</option>
                              <option value="130">130</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                              <ChevronRight className="rotate-90 text-slate-400" size={14} />
                            </div>
                          </div>
                        </div>
                        <div className="w-full lg:w-48 space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">INITIAL STOCK</label>
                          <input 
                            type="number" 
                            value={newSkuStock}
                            onChange={(e) => setNewSkuStock(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                          />
                        </div>
                        <button 
                          onClick={handleAddSku}
                          className="w-full lg:w-auto bg-blue-600 text-white px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                        >
                          ADD ITEM
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Inventory Grid Table */}
              <div className="overflow-auto custom-scrollbar flex-1">
                {inventory.map((section, idx) => {
                  const filteredSubSections = section.subSections.map(sub => ({
                    ...sub,
                    items: sub.items.filter(item => 
                      item.size.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.gsm.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                  })).filter(sub => sub.items.length > 0);

                  if (filteredSubSections.length === 0) return null;

                  return (
                    <React.Fragment key={section.title}>
                      <InventoryTableSection 
                        section={{ ...section, subSections: filteredSubSections }} 
                        onIncrement={handleIncrement}
                        onDecrement={handleDecrement}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        canEdit={canEdit}
                      />
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Edit Modal */}
              <AnimatePresence>
                {editingItem && (
                  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                    >
                      <div className="px-6 py-4 bg-[#1e3a8a] flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white">Edit Item Details</h3>
                        <button onClick={() => setEditingItem(null)} className="text-white/80 hover:text-white">
                          <X size={20} />
                        </button>
                      </div>
                      <div className="p-6 space-y-5">
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-slate-700">Size</label>
                          <input 
                            type="text" 
                            value={editingItem.item.size}
                            onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, size: e.target.value } })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-slate-700">GSM / Section</label>
                          <select 
                            value={editingItem.item.gsm}
                            onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, gsm: e.target.value } })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          >
                            <option value="280">280</option>
                            <option value="250">250</option>
                            <option value="230">230</option>
                            <option value="200">200</option>
                            <option value="150">150</option>
                            <option value="130">130</option>
                            <option value="100">100</option>
                            <option value="140GYT">140GYT</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-bold text-rose-600">Minimum Quantity (Low Stock Alert)</label>
                          <input 
                            type="number" 
                            value={editingItem.item.minQuantity}
                            onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, minQuantity: parseInt(e.target.value) || 0 } })}
                            className="w-full bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-bold"
                          />
                          <p className="text-[10px] text-slate-400">Stock below this level will be highlighted red and listed in Reorder Page.</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-slate-700">Remarks</label>
                          <textarea 
                            rows={3}
                            value={editingItem.item.remarks}
                            onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, remarks: e.target.value } })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                          />
                        </div>
                        <div className="flex items-center justify-end gap-4 pt-2">
                          <button 
                            onClick={() => setEditingItem(null)}
                            className="px-6 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={handleSaveEdit}
                            className="flex items-center gap-2 bg-[#1e3a8a] text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-900 transition-all shadow-lg shadow-blue-500/20"
                          >
                            <Save size={18} />
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Stock In Modal */}
              <AnimatePresence>
                {stockInItem && (
                  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden"
                    >
                      <div className="px-8 py-5 bg-[#22c55e] flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white tracking-tight">
                          STOCK IN - {stockInItem.item.size} ({stockInItem.item.gsm})
                        </h3>
                        <button onClick={() => setStockInItem(null)} className="text-white/80 hover:text-white transition-colors">
                          <X size={24} />
                        </button>
                      </div>
                      
                      <div className="p-4 lg:p-8 space-y-4 lg:space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600">Date</label>
                            <input 
                              type="date" 
                              value={stockInItem.formData.date}
                              onChange={(e) => {
                                const date = new Date(e.target.value);
                                setStockInItem({
                                  ...stockInItem,
                                  formData: {
                                    ...stockInItem.formData,
                                    date: e.target.value,
                                    month: date.toLocaleString('default', { month: 'long' })
                                  }
                                });
                              }}
                              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600">Month</label>
                            <input 
                              type="text" 
                              value={stockInItem.formData.month}
                              readOnly
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600">Company (CAPS)</label>
                            <input 
                              type="text" 
                              placeholder="SREEPATHI"
                              value={stockInItem.formData.company}
                              onChange={(e) => setStockInItem({
                                ...stockInItem,
                                formData: { ...stockInItem.formData, company: e.target.value.toUpperCase() }
                              })}
                              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600">Quantity (In)</label>
                            <input 
                              type="number" 
                              value={stockInItem.formData.quantity}
                              onChange={(e) => setStockInItem({
                                ...stockInItem,
                                formData: { ...stockInItem.formData, quantity: e.target.value }
                              })}
                              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600">Invoice No</label>
                            <input 
                              type="text" 
                              value={stockInItem.formData.invoiceNo}
                              onChange={(e) => setStockInItem({
                                ...stockInItem,
                                formData: { ...stockInItem.formData, invoiceNo: e.target.value }
                              })}
                              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600">Storage Location (CAPS)</label>
                            <input 
                              type="text" 
                              value={stockInItem.formData.storageLocation}
                              onChange={(e) => setStockInItem({
                                ...stockInItem,
                                formData: { ...stockInItem.formData, storageLocation: e.target.value.toUpperCase() }
                              })}
                              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-600">Remarks</label>
                          <textarea 
                            rows={3}
                            value={stockInItem.formData.remarks}
                            onChange={(e) => setStockInItem({
                              ...stockInItem,
                              formData: { ...stockInItem.formData, remarks: e.target.value }
                            })}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100">
                          <button 
                            onClick={() => setStockInItem(null)}
                            className="px-8 py-3 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={handleConfirmStockIn}
                            className="flex items-center gap-2 bg-[#22c55e] text-white px-10 py-3 rounded-2xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                          >
                            <Save size={18} />
                            Confirm
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Stock Out Modal */}
              <AnimatePresence>
                {stockOutItem && (
                  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden"
                    >
                      <div className="px-8 py-5 bg-[#dc2626] flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white tracking-tight">
                          STOCK OUT - {stockOutItem.item.size} ({stockOutItem.item.gsm})
                        </h3>
                        <button onClick={() => setStockOutItem(null)} className="text-white/80 hover:text-white transition-colors">
                          <X size={24} />
                        </button>
                      </div>
                      
                      <div className="p-4 lg:p-8 space-y-4 lg:space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-600">Date</label>
                            <div className="relative">
                              <input 
                                type="date" 
                                value={stockOutItem.formData.date}
                                onChange={(e) => {
                                  const date = new Date(e.target.value);
                                  setStockOutItem({
                                    ...stockOutItem,
                                    formData: {
                                      ...stockOutItem.formData,
                                      date: e.target.value,
                                      month: date.toLocaleString('default', { month: 'long' })
                                    }
                                  });
                                }}
                                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all pr-12"
                              />
                              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-600">Month</label>
                            <input 
                              type="text" 
                              value={stockOutItem.formData.month}
                              readOnly
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-600">Company (CAPS)</label>
                            <input 
                              type="text" 
                              placeholder="SREEPATHI"
                              value={stockOutItem.formData.company}
                              onChange={(e) => setStockOutItem({
                                ...stockOutItem,
                                formData: { ...stockOutItem.formData, company: e.target.value.toUpperCase() }
                              })}
                              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-600">Quantity (Out)</label>
                            <input 
                              type="number" 
                              value={stockOutItem.formData.quantity}
                              onChange={(e) => setStockOutItem({
                                ...stockOutItem,
                                formData: { ...stockOutItem.formData, quantity: e.target.value }
                              })}
                              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-bold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-600">Item Code (CAPS)</label>
                            <input 
                              type="text" 
                              placeholder="ENTER CODE TO AUTO-FILL"
                              value={stockOutItem.formData.itemCode}
                              onChange={(e) => {
                                const newCode = e.target.value.toUpperCase();
                                const lastLog = stockOutLogs.find(log => log.itemCode === newCode);
                                if (lastLog) {
                                  setStockOutItem({
                                    ...stockOutItem,
                                    formData: {
                                      ...stockOutItem.formData,
                                      itemCode: newCode,
                                      company: lastLog.company || stockOutItem.formData.company,
                                      workName: lastLog.workName || stockOutItem.formData.workName,
                                      unit: lastLog.unit || stockOutItem.formData.unit,
                                      cuttingSize: lastLog.cutSize || stockOutItem.formData.cuttingSize,
                                      status: lastLog.status || stockOutItem.formData.status,
                                      priority: lastLog.priority || stockOutItem.formData.priority,
                                      remarks: lastLog.remarks || stockOutItem.formData.remarks
                                    }
                                  });
                                } else {
                                  setStockOutItem({
                                    ...stockOutItem,
                                    formData: { ...stockOutItem.formData, itemCode: newCode }
                                  });
                                }
                              }}
                              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-600">Work Name</label>
                            <input 
                              type="text" 
                              value={stockOutItem.formData.workName}
                              onChange={(e) => setStockOutItem({
                                ...stockOutItem,
                                formData: { ...stockOutItem.formData, workName: e.target.value }
                              })}
                              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5">
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-600">Unit</label>
                            <select 
                              value={stockOutItem.formData.unit}
                              onChange={(e) => setStockOutItem({
                                ...stockOutItem,
                                formData: { ...stockOutItem.formData, unit: e.target.value }
                              })}
                              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                            >
                              <option value="GROSS">GROSS</option>
                              <option value="NET">NET</option>
                              <option value="Cutting">Cutting</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-600">Cutting Size</label>
                            <input 
                              type="text" 
                              value={stockOutItem.formData.cuttingSize}
                              onChange={(e) => setStockOutItem({
                                ...stockOutItem,
                                formData: { ...stockOutItem.formData, cuttingSize: e.target.value }
                              })}
                              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
                              <FileSpreadsheet size={14} className="text-blue-500" /> Sheets (Manual)
                            </label>
                            <input 
                              type="text" 
                              placeholder="Enter sheets..."
                              value={stockOutItem.formData.sheets}
                              onChange={(e) => setStockOutItem({
                                ...stockOutItem,
                                formData: { ...stockOutItem.formData, sheets: e.target.value }
                              })}
                              className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-600">Status</label>
                            <select 
                              value={stockOutItem.formData.status}
                              onChange={(e) => setStockOutItem({
                                ...stockOutItem,
                                formData: { ...stockOutItem.formData, status: e.target.value }
                              })}
                              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                            >
                              <option value="Cutting">Cutting</option>
                              <option value="Printing">Printing</option>
                              <option value="Packing">Packing</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-600">Priority</label>
                            <select 
                              value={stockOutItem.formData.priority}
                              onChange={(e) => setStockOutItem({
                                ...stockOutItem,
                                formData: { ...stockOutItem.formData, priority: e.target.value }
                              })}
                              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                            >
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                              <option value="Urgent">Urgent</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-slate-600">Remarks</label>
                          <textarea 
                            rows={2}
                            value={stockOutItem.formData.remarks}
                            onChange={(e) => setStockOutItem({
                              ...stockOutItem,
                              formData: { ...stockOutItem.formData, remarks: e.target.value }
                            })}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100">
                          <button 
                            onClick={() => setStockOutItem(null)}
                            className="px-8 py-3 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={handleConfirmStockOut}
                            className="flex items-center gap-2 bg-[#dc2626] text-white px-10 py-3 rounded-2xl text-sm font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20"
                          >
                            <Save size={18} />
                            Confirm
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Delete Confirmation Modal */}
              <AnimatePresence>
                {deletingItem && (
                  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
                    >
                      <div className="p-8 text-center space-y-6">
                        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
                          <Trash2 size={40} className="text-rose-500" />
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-slate-900">Delete SKU?</h3>
                          <p className="text-slate-500 text-sm leading-relaxed">
                            Are you sure you want to delete SKU <span className="font-bold text-slate-900">{deletingItem.size}</span>? This action cannot be undone.
                          </p>
                        </div>

                        <div className="flex flex-col gap-3 pt-2">
                          <button 
                            onClick={handleConfirmDelete}
                            className="w-full bg-rose-500 text-white py-4 rounded-2xl font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                          >
                            Yes, Delete SKU
                          </button>
                          <button 
                            onClick={() => setDeletingItem(null)}
                            className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                          >
                            No, Keep it
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'Quick Tracker' && (
            <motion.div
              key="quick-tracker"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="h-full flex flex-col"
            >
              {/* Header */}
              <div className="bg-[#0f2a43] -m-4 md:-m-8 mb-8 p-4 flex items-center gap-4 shadow-lg">
                <button 
                  onClick={() => setActiveTab('Dashboard')}
                  className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
                >
                  <ChevronRight className="rotate-180" size={24} />
                </button>
                <div className="flex items-center gap-3">
                  <Box className="text-blue-400" size={24} />
                  <h2 className="text-sm md:text-lg font-bold text-white tracking-widest uppercase">QUICK TRACKER</h2>
                </div>
              </div>

              <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 flex-1 min-h-0">
                {/* Left Column: Search & Selection */}
                <div className="lg:col-span-4 flex flex-col gap-6 min-h-0">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col min-h-0">
                    <div className="relative mb-6">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Search Size or GSM..."
                        value={quickTrackerSearch}
                        onChange={(e) => setQuickTrackerSearch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                      {inventory.flatMap(section => 
                        section.subSections.flatMap(sub => 
                          sub.items.map(item => ({ sectionTitle: section.title, subTitle: sub.title, item }))
                        )
                      ).filter(entry => 
                        entry.item.size.toLowerCase().includes(quickTrackerSearch.toLowerCase()) ||
                        entry.item.gsm.toLowerCase().includes(quickTrackerSearch.toLowerCase())
                      ).map((entry, idx) => (
                        <button
                          key={`${entry.item.size}-${entry.item.gsm}-${idx}`}
                          onClick={() => setSelectedQuickTrackerItem(entry)}
                          className={cn(
                            "w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                            selectedQuickTrackerItem?.item.size === entry.item.size && selectedQuickTrackerItem?.item.gsm === entry.item.gsm
                              ? "bg-blue-50 border-blue-500 shadow-sm"
                              : "bg-white border-slate-100 hover:border-slate-300"
                          )}
                        >
                          <div>
                            <p className="font-bold text-slate-900">{entry.item.size}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{entry.item.gsm} GSM</p>
                          </div>
                          <ChevronRight size={16} className={selectedQuickTrackerItem?.item.size === entry.item.size ? "text-blue-500" : "text-slate-300"} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stock Available Card */}
                  {currentSelectedEntry && (
                    <div className="bg-[#0f2a43] p-8 rounded-3xl shadow-xl relative overflow-hidden">
                      <div className="relative z-10">
                        <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-2">STOCK AVAILABLE</p>
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-5xl font-bold text-white">{currentSelectedEntry.item.stock}</h3>
                          <span className="text-xs font-bold text-blue-300 uppercase">UNITS</span>
                        </div>
                        
                        <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 w-32">
                          <p className="text-[8px] font-bold text-blue-300 uppercase tracking-widest mb-1">STATUS</p>
                          <p className={cn(
                            "text-xs font-bold uppercase",
                            currentSelectedEntry.item.isLow ? "text-rose-400" : "text-emerald-400"
                          )}>
                            {currentSelectedEntry.item.isLow ? "LOW STOCK" : "OK"}
                          </p>
                        </div>
                      </div>
                      <Activity className="absolute right-8 top-8 text-white/5" size={80} />
                    </div>
                  )}
                </div>

                {/* Right Column: Actions & History */}
                <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Action Card */}
                    <div className="md:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
                      <div className="flex p-1 bg-slate-100 rounded-2xl">
                        <button 
                          onClick={() => setQuickTrackerMode('OUT')}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all",
                            quickTrackerMode === 'OUT' ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          <Minus size={14} /> OUT
                        </button>
                        <button 
                          onClick={() => setQuickTrackerMode('IN')}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all",
                            quickTrackerMode === 'IN' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          <Plus size={14} /> IN
                        </button>
                      </div>

                      <div className="relative">
                        <input 
                          type="number" 
                          placeholder="Qty..."
                          value={quickTrackerQty}
                          onChange={(e) => setQuickTrackerQty(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 py-6 text-4xl font-bold text-center text-slate-800 placeholder:text-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                        />
                      </div>

                      {isAdmin ? (
                        <button 
                          onClick={() => {
                            if (!currentSelectedEntry || !quickTrackerQty) return;
                            const qty = parseInt(quickTrackerQty) || 0;
                            const delta = quickTrackerMode === 'IN' ? qty : -qty;
                            updateStock(currentSelectedEntry.sectionTitle, currentSelectedEntry.subTitle, currentSelectedEntry.item.size, delta);
                            
                            const newEntry = {
                              id: Date.now(),
                              size: currentSelectedEntry.item.size,
                              gsm: currentSelectedEntry.item.gsm,
                              type: quickTrackerMode,
                              qty: qty,
                              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            };
                            setQuickTrackerHistory([newEntry, ...quickTrackerHistory]);
                            setQuickTrackerQty('');
                          }}
                          disabled={!currentSelectedEntry || !quickTrackerQty}
                          className={cn(
                            "w-full py-5 rounded-3xl font-bold text-sm uppercase tracking-widest transition-all shadow-lg",
                            !currentSelectedEntry || !quickTrackerQty
                              ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                              : quickTrackerMode === 'OUT' 
                                ? "bg-rose-100 text-rose-500 hover:bg-rose-200 shadow-rose-500/10" 
                                : "bg-emerald-100 text-emerald-500 hover:bg-emerald-200 shadow-emerald-500/10"
                          )}
                        >
                          CONFIRM
                        </button>
                      ) : (
                        <div className="w-full py-5 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100">
                          <span className="text-xs font-black text-slate-300 uppercase tracking-widest">READ ONLY MODE</span>
                        </div>
                      )}
                    </div>

                    {/* Stats Card */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ENDS IN</p>
                      <h4 className="text-3xl font-bold text-slate-800">N/A Days</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2 border-t border-slate-100 w-full">RATE: /D</p>
                    </div>
                  </div>

                  {/* History Card */}
                  <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col min-h-0 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                      <Clock className="text-slate-400" size={18} />
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">HISTORY</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                      {quickTrackerHistory.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-300 font-bold text-xs uppercase tracking-widest">
                          NO RECORDS
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {quickTrackerHistory.map(entry => (
                            <div key={entry.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center",
                                  entry.type === 'IN' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                                )}>
                                  {entry.type === 'IN' ? <Plus size={18} /> : <Minus size={18} />}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{entry.size} <span className="text-slate-400 text-xs">({entry.gsm} GSM)</span></p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{entry.time}</p>
                                </div>
                              </div>
                              <div className={cn(
                                "text-lg font-bold",
                                entry.type === 'IN' ? "text-emerald-500" : "text-rose-500"
                              )}>
                                {entry.type === 'IN' ? '+' : '-'}{entry.qty}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Stock In Logs' && (
            <motion.div
              key="stock-in"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Stock In Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 mb-8">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <button 
                    onClick={() => setActiveTab('Dashboard')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold uppercase tracking-widest text-xs"
                  >
                    <ChevronRight className="rotate-180" size={16} />
                    BACK
                  </button>
                  <div className="h-8 w-px bg-emerald-500 hidden md:block"></div>
                  <h2 className="text-lg md:text-xl font-bold text-emerald-700 tracking-tight uppercase">STOCK IN LOGS</h2>
                </div>
                
                <div className="w-full md:ml-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search logs..."
                      value={searchLogQuery}
                      onChange={(e) => setSearchLogQuery(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <button 
                    onClick={() => handleInitiateExport('pdf', 'stockIn')}
                    className="flex items-center gap-2 bg-rose-600 text-white px-6 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20"
                  >
                    <FileText size={16} /> PDF
                  </button>
                  <button 
                    onClick={() => handleInitiateExport('xlsx', 'stockIn')}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <FileSpreadsheet size={16} /> EXCEL
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr className="bg-[#1e40af] text-white">
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">DATE</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">MONTH</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">SIZE</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">GSM</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">IN</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">COMPANY</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">INVOICE</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">STORAGE LOC</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">REMARKS</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-6 py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">No logs found</td>
                        </tr>
                      ) : (
                        filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50 transition-colors" style={{ height: '10mm' }}>
                            <td className="px-4 py-1 text-xs font-bold text-slate-500 border-r border-slate-100">{formatDate(log.date)}</td>
                            <td className="px-4 py-1 text-xs font-bold text-slate-900 border-r border-slate-100">{log.month}</td>
                            <td className="px-4 py-1 text-xs font-bold text-slate-900 border-r border-slate-100">{log.size}</td>
                            <td className="px-4 py-1 text-xs font-bold text-slate-900 border-r border-slate-100">{log.gsm}</td>
                            <td className="px-4 py-1 text-sm font-black text-emerald-600 border-r border-slate-100">{log.quantity}</td>
                            <td className="px-4 py-1 text-[10px] font-black text-slate-900 uppercase border-r border-slate-100">{log.company}</td>
                            <td className="px-4 py-1 text-[10px] font-black text-slate-900 uppercase border-r border-slate-100">{log.invoice}</td>
                            <td className="px-4 py-1 text-xs text-slate-500 border-r border-slate-100">{log.storageLoc}</td>
                            <td className="px-4 py-1 text-xs text-slate-500 border-r border-slate-100">{log.remarks}</td>
                            <td className="px-4 py-1">
                              {isAdmin ? (
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => setEditingLog(log)}
                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button 
                                    onClick={async () => {
                                      if (window.confirm('Delete this log?')) {
                                        try {
                                          await deleteDoc(doc(db, 'stockInLogs', log.id));
                                          logAction(`Deleted stock in log: ${log.size}x${log.gsm}`);
                                        } catch (error) {
                                          handleFirestoreError(error, OperationType.DELETE, `stockInLogs/${log.id}`);
                                        }
                                      }
                                    }}
                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center">
                                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">READ ONLY</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden divide-y divide-slate-100">
                  {filteredLogs.length === 0 ? (
                    <div className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No logs found</div>
                  ) : (
                    filteredLogs.map((log) => (
                      <div key={log.id} className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-slate-500">{formatDate(log.date)}</div>
                          <div className="text-sm font-black text-emerald-600">+{log.quantity}</div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-bold text-slate-900">{log.size}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.gsm} GSM</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-black text-slate-900 uppercase">{log.company}</div>
                            <div className="text-[10px] font-medium text-slate-500 uppercase">INV: {log.invoice}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="text-[10px] font-medium text-slate-500">LOC: {log.storageLoc}</div>
                          <div className="flex items-center gap-2">
                            {isAdmin ? (
                              <>
                                <button 
                                  onClick={() => setEditingLog(log)}
                                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button 
                                  onClick={async () => {
                                    if (window.confirm('Delete this log?')) {
                                      try {
                                        await deleteDoc(doc(db, 'stockInLogs', log.id));
                                      } catch (error) {
                                        handleFirestoreError(error, OperationType.DELETE, `stockInLogs/${log.id}`);
                                      }
                                    }
                                  }}
                                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-rose-100"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            ) : (
                              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">READ ONLY</span>
                            )}
                          </div>
                        </div>

                        {log.remarks && (
                          <div className="p-3 bg-slate-50 rounded-xl text-[10px] text-slate-500 italic">
                            {log.remarks}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Edit Log Modal */}
              <AnimatePresence>
                {editingLog && (
                  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden"
                    >
                      <div className="p-8 space-y-8">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                              <Edit2 size={20} />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Edit Stock In Log</h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Modify existing entry details</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setEditingLog(null)}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</label>
                            <input 
                              type="date" 
                              value={editingLog.date}
                              onChange={(e) => setEditingLog({ ...editingLog, date: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quantity</label>
                            <input 
                              type="number" 
                              value={editingLog.quantity}
                              onChange={(e) => setEditingLog({ ...editingLog, quantity: parseInt(e.target.value) || 0 })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Company</label>
                            <input 
                              type="text" 
                              value={editingLog.company}
                              onChange={(e) => setEditingLog({ ...editingLog, company: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoice</label>
                            <input 
                              type="text" 
                              value={editingLog.invoice}
                              onChange={(e) => setEditingLog({ ...editingLog, invoice: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Storage Location</label>
                            <input 
                              type="text" 
                              value={editingLog.storageLoc}
                              onChange={(e) => setEditingLog({ ...editingLog, storageLoc: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remarks</label>
                            <input 
                              type="text" 
                              value={editingLog.remarks}
                              onChange={(e) => setEditingLog({ ...editingLog, remarks: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
                          <button 
                            onClick={() => setEditingLog(null)}
                            className="px-8 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'stockInLogs', editingLog.id), editingLog);
                                logAction(`Updated stock in log: ${editingLog.size}x${editingLog.gsm}`);
                                setEditingLog(null);
                              } catch (error) {
                                handleFirestoreError(error, OperationType.UPDATE, `stockInLogs/${editingLog.id}`);
                              }
                            }}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-10 py-3 rounded-2xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                          >
                            <Save size={18} />
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'Stock Out Logs' && (
            <motion.div
              key="stock-out-logs"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 mb-8">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <button 
                    onClick={() => setActiveTab('Dashboard')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold uppercase tracking-widest text-xs"
                  >
                    <ChevronRight className="rotate-180" size={16} />
                    BACK
                  </button>
                  <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                  <h2 className="text-lg md:text-xl font-bold text-rose-800 tracking-tight uppercase">STOCK OUT LOGS (DELIVERED)</h2>
                </div>
                
                <div className="w-full md:ml-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search logs..."
                      value={searchStockOutLogQuery}
                      onChange={(e) => setSearchStockOutLogQuery(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleInitiateExport('pdf', 'stockOut')}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-rose-600 text-white px-4 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20"
                    >
                      <FileText size={16} /> PDF
                    </button>
                    <button 
                      onClick={() => handleInitiateExport('xlsx', 'stockOut')}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <FileSpreadsheet size={16} /> EXCEL
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr className="bg-[#8b1a1a] text-white">
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10 first:rounded-tl-[40px]">DATE</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">SIZE</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">GSM</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">OUT</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">UNIT</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">ITEM CODE</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10" style={{ width: '50mm', minWidth: '50mm' }}>WORK NAME</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">CUT SIZE</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">SHEETS</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">STATUS</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">DELIVERY DATE</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">VEHICLE</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">LOCATION</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest last:rounded-tr-[40px]">REMARKS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stockOutLogs.filter(log => 
                        log.workName.toLowerCase().includes(searchStockOutLogQuery.toLowerCase()) ||
                        log.company?.toLowerCase().includes(searchStockOutLogQuery.toLowerCase()) ||
                        log.itemCode.toLowerCase().includes(searchStockOutLogQuery.toLowerCase())
                      ).length === 0 ? (
                        <tr>
                          <td colSpan={14} className="px-6 py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">No logs found</td>
                        </tr>
                      ) : (
                        stockOutLogs.filter(log => 
                          log.workName.toLowerCase().includes(searchStockOutLogQuery.toLowerCase()) ||
                          log.company?.toLowerCase().includes(searchStockOutLogQuery.toLowerCase()) ||
                          log.itemCode.toLowerCase().includes(searchStockOutLogQuery.toLowerCase())
                        ).map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50 transition-colors" style={{ height: '10mm' }}>
                            <td className="px-4 py-1 text-xs font-bold text-slate-900 border-r border-slate-100">{formatDate(log.date)}</td>
                            <td className="px-4 py-1 text-xs font-bold text-slate-900 border-r border-slate-100">{log.size}</td>
                            <td className="px-4 py-1 text-xs font-bold text-slate-900 border-r border-slate-100">{log.gsm}</td>
                            <td className="px-4 py-1 text-xs font-bold text-rose-600 border-r border-slate-100">{log.out}</td>
                            <td className="px-4 py-1 text-[10px] font-bold text-slate-500 border-r border-slate-100">{log.unit}</td>
                            <td className="px-4 py-1 text-[10px] font-black text-blue-600 uppercase border-r border-slate-100">{log.itemCode}</td>
                            <td className="px-4 py-1 text-xs font-bold text-slate-900 border-r border-slate-100 text-left" style={{ width: '50mm', minWidth: '50mm' }}>{log.workName}</td>
                            <td className="px-4 py-1 text-xs font-bold text-blue-600 border-r border-slate-100">{log.cutSize}</td>
                            <td className="px-4 py-1 text-xs font-bold text-blue-600 border-r border-slate-100">{log.sheets}</td>
                            <td className="px-4 py-1 border-r border-slate-100">
                              <span className="text-[10px] font-bold uppercase px-3 py-1 rounded-lg bg-emerald-100 text-emerald-600">
                                {log.status}
                              </span>
                            </td>
                            <td className="px-4 py-1 text-xs font-bold text-emerald-600 border-r border-slate-100">{formatDate(log.deliveryDate || log.date)}</td>
                            <td className="px-4 py-1 text-[10px] font-bold text-slate-900 border-r border-slate-100">{log.vehicle}</td>
                            <td className="px-4 py-1 text-[10px] font-bold text-slate-900 border-r border-slate-100">{log.location}</td>
                            <td className="px-4 py-1 text-xs text-slate-500">{log.remarks}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden divide-y divide-slate-100">
                  {stockOutLogs.filter(log => 
                    log.workName.toLowerCase().includes(searchStockOutLogQuery.toLowerCase()) ||
                    log.company?.toLowerCase().includes(searchStockOutLogQuery.toLowerCase()) ||
                    log.itemCode.toLowerCase().includes(searchStockOutLogQuery.toLowerCase())
                  ).length === 0 ? (
                    <div className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No logs found</div>
                  ) : (
                    stockOutLogs.filter(log => 
                      log.workName.toLowerCase().includes(searchStockOutLogQuery.toLowerCase()) ||
                      log.company?.toLowerCase().includes(searchStockOutLogQuery.toLowerCase()) ||
                      log.itemCode.toLowerCase().includes(searchStockOutLogQuery.toLowerCase())
                    ).map((log) => (
                      <div key={log.id} className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-slate-500">{formatDate(log.date)}</div>
                          <div className="text-sm font-black text-rose-600">-{log.out} <span className="text-[8px] uppercase">{log.unit}</span></div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-bold text-slate-900">{log.workName}</div>
                          <div className="text-[10px] font-black text-blue-600 uppercase">{log.itemCode}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Size / GSM</div>
                            <div className="text-xs font-bold text-slate-800">{log.size} / {log.gsm}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Delivery Date</div>
                            <div className="text-xs font-bold text-emerald-600">{formatDate(log.deliveryDate || log.date)}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Vehicle</div>
                            <div className="text-xs font-bold text-slate-800 uppercase">{log.vehicle}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Location</div>
                            <div className="text-xs font-bold text-slate-800 uppercase">{log.location}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                            {log.status}
                          </span>
                          <div className="text-[10px] font-medium text-slate-500">
                            CS: {log.cutSize} | SH: {log.sheets}
                          </div>
                        </div>

                        {log.remarks && (
                          <div className="p-3 bg-slate-50 rounded-xl text-[10px] text-slate-500 italic">
                            {log.remarks}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Pending Works' && (
            <motion.div
              key="pending-works"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 mb-8">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <button 
                    onClick={() => setActiveTab('Dashboard')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold uppercase tracking-widest text-xs"
                  >
                    <ChevronRight className="rotate-180" size={16} />
                    BACK
                  </button>
                  <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                  <div className="flex items-center gap-3">
                    <Clock className="text-orange-500" size={24} />
                    <h2 className="text-lg md:text-xl font-bold text-[#0f2a43] tracking-tight uppercase">PENDING WORKS</h2>
                  </div>
                </div>
                
                <div className="w-full md:ml-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search operational queue..."
                      value={searchPendingQuery}
                      onChange={(e) => setSearchPendingQuery(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleInitiateExport('pdf', 'pendingWorks')}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-rose-600 text-white px-4 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20"
                    >
                      <FileText size={16} /> PDF
                    </button>
                    <button 
                      onClick={() => handleInitiateExport('xlsx', 'pendingWorks')}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <FileSpreadsheet size={16} /> EXCEL
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr className="bg-[#f26522] text-white">
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">DATE</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">SIZE</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">GSM</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">QTY</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">COMPANY</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">ITEM CODE</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10" style={{ width: '50mm', minWidth: '50mm' }}>WORK NAME</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">CUT SIZE</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">SHEETS</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">PRIORITY</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">STATUS</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-r border-white/10">REMARKS</th>
                        <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPendingWorks.length === 0 ? (
                        <tr>
                          <td colSpan={13} className="px-6 py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">No pending works found</td>
                        </tr>
                      ) : (
                        filteredPendingWorks.map((work) => (
                          <tr key={work.id} className="hover:bg-slate-50 transition-colors" style={{ height: '10mm' }}>
                            <td className="px-4 py-1 text-xs font-bold text-slate-900 border-r border-slate-100">{formatDate(work.date)}</td>
                            <td className="px-4 py-1 text-xs font-bold text-slate-900 border-r border-slate-100">{work.size}</td>
                            <td className="px-4 py-1 text-xs font-bold text-slate-900 border-r border-slate-100">{work.gsm}</td>
                            <td className="px-4 py-1 text-xs font-bold border-r border-slate-100">
                              <span className="text-rose-500">{work.qty}</span>
                              <span className="text-[8px] text-slate-400 ml-1 uppercase">{work.unit}</span>
                            </td>
                            <td className="px-4 py-1 text-[10px] font-black text-slate-900 uppercase border-r border-slate-100">{work.company}</td>
                            <td className="px-4 py-1 text-[10px] font-black text-blue-600 uppercase border-r border-slate-100">{work.itemCode}</td>
                            <td className="px-4 py-1 text-xs font-bold text-slate-900 border-r border-slate-100 text-left" style={{ width: '50mm', minWidth: '50mm' }}>{work.workName}</td>
                            <td className="px-4 py-1 text-xs font-bold text-blue-600 border-r border-slate-100">{work.cutSize}</td>
                            <td className="px-4 py-1 text-xs font-bold text-blue-600 border-r border-slate-100">{work.sheets}</td>
                            <td className="px-4 py-1 border-r border-slate-100">
                              <select 
                                value={work.priority}
                                disabled={!canEdit}
                                onChange={async (e) => {
                                  if (canEdit) {
                                    try {
                                      await updateDoc(doc(db, 'pendingWorks', work.id), { priority: e.target.value });
                                      logAction(`Updated priority for work ${work.workName}`);
                                    } catch (error) {
                                      handleFirestoreError(error, OperationType.UPDATE, `pendingWorks/${work.id}`);
                                    }
                                  }
                                }}
                                className={cn(
                                  "text-[10px] font-bold uppercase px-3 py-1 rounded-lg focus:outline-none border-none",
                                  !canEdit ? "cursor-not-allowed opacity-80" : "cursor-pointer",
                                  work.priority === 'HIGH' ? "bg-rose-100 text-rose-600" : 
                                  work.priority === 'MEDIUM' ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600"
                                )}
                              >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                              </select>
                            </td>
                            <td className="px-4 py-1 border-r border-slate-100">
                              <select 
                                value={work.status}
                                disabled={!canEdit}
                                onChange={async (e) => {
                                  if (canEdit) {
                                    const newStatus = e.target.value;
                                    if (newStatus === 'DELIVERED') {
                                      setDeliveringWork(work);
                                    } else {
                                      try {
                                        await updateDoc(doc(db, 'pendingWorks', work.id), { status: newStatus });
                                        logAction(`Updated status for work ${work.workName} to ${newStatus}`);
                                      } catch (error) {
                                        handleFirestoreError(error, OperationType.UPDATE, `pendingWorks/${work.id}`);
                                      }
                                    }
                                  }
                                }}
                                className={cn(
                                  "text-[10px] font-bold uppercase px-3 py-1 rounded-lg bg-slate-50 text-slate-600 focus:outline-none border-none",
                                  !canEdit ? "cursor-not-allowed opacity-80" : "cursor-pointer"
                                )}
                              >
                                <option value="CUTTING">Cutting</option>
                                <option value="CUTTING FINISHED">Cutting Finished</option>
                                <option value="OUT OF STOCK">Out of Stock</option>
                                <option value="ORDER PLACED">Order Placed</option>
                                <option value="WAITING FOR REEL">Waiting for Reel</option>
                                <option value="PENDING">Pending</option>
                                <option value="DELIVERED">Delivered</option>
                                <option value="CANCELLED">Cancelled</option>
                                <option value="OTHER">Other</option>
                              </select>
                            </td>
                            <td className="px-4 py-1 text-xs text-slate-500 border-r border-slate-100">{work.remarks}</td>
                            <td className="px-4 py-1">
                              {canEdit ? (
                                <button 
                                  onClick={() => setEditingPendingWork({ ...work })}
                                  className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                                >
                                  <Edit2 size={14} />
                                </button>
                              ) : (
                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">READ ONLY</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden divide-y divide-slate-100">
                  {filteredPendingWorks.length === 0 ? (
                    <div className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No pending works found</div>
                  ) : (
                    filteredPendingWorks.map((work) => (
                      <div key={work.id} className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] font-black text-blue-600 uppercase">{work.itemCode}</div>
                          <div className="text-xs font-bold text-slate-400">{formatDate(work.date)}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-bold text-slate-900">{work.workName}</div>
                          <div className="text-[10px] font-black text-slate-500 uppercase">{work.company}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Size / GSM</div>
                            <div className="text-xs font-bold text-slate-800">{work.size} / {work.gsm}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Qty</div>
                            <div className="text-xs font-bold text-rose-500">{work.qty} <span className="text-[8px] text-slate-400 uppercase">{work.unit}</span></div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Cut Size</div>
                            <div className="text-xs font-bold text-blue-600">{work.cutSize}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Sheets</div>
                            <div className="text-xs font-bold text-blue-600">{work.sheets}</div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                          <div className="flex-1">
                            <select 
                              value={work.priority}
                              disabled={!canEdit}
                              onChange={async (e) => {
                                if (canEdit) {
                                  try {
                                    await updateDoc(doc(db, 'pendingWorks', work.id), { priority: e.target.value });
                                  } catch (error) {
                                    handleFirestoreError(error, OperationType.UPDATE, `pendingWorks/${work.id}`);
                                  }
                                }
                              }}
                              className={cn(
                                "w-full text-[10px] font-bold uppercase px-3 py-2 rounded-xl focus:outline-none border border-slate-100",
                                !canEdit ? "cursor-not-allowed opacity-80" : "cursor-pointer",
                                work.priority === 'HIGH' ? "bg-rose-50 text-rose-600" : 
                                work.priority === 'MEDIUM' ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-600"
                              )}
                            >
                              <option value="LOW">Low Priority</option>
                              <option value="MEDIUM">Medium Priority</option>
                              <option value="HIGH">High Priority</option>
                            </select>
                          </div>
                          <div className="flex-1">
                            <select 
                              value={work.status}
                              disabled={!canEdit}
                              onChange={async (e) => {
                                if (canEdit) {
                                  const newStatus = e.target.value;
                                  if (newStatus === 'DELIVERED') {
                                    setDeliveringWork(work);
                                  } else {
                                    try {
                                      await updateDoc(doc(db, 'pendingWorks', work.id), { status: newStatus });
                                    } catch (error) {
                                      handleFirestoreError(error, OperationType.UPDATE, `pendingWorks/${work.id}`);
                                    }
                                  }
                                }
                              }}
                              className={cn(
                                "w-full text-[10px] font-bold uppercase px-3 py-2 rounded-xl bg-slate-50 text-slate-600 focus:outline-none border border-slate-100",
                                !canEdit ? "cursor-not-allowed opacity-80" : "cursor-pointer"
                              )}
                            >
                              <option value="CUTTING">Cutting</option>
                              <option value="CUTTING FINISHED">Cutting Finished</option>
                              <option value="OUT OF STOCK">Out of Stock</option>
                              <option value="ORDER PLACED">Order Placed</option>
                              <option value="WAITING FOR REEL">Waiting for Reel</option>
                              <option value="PENDING">Pending</option>
                              <option value="DELIVERED">Delivered</option>
                              <option value="CANCELLED">Cancelled</option>
                              <option value="OTHER">Other</option>
                            </select>
                          </div>
                        </div>

                        {work.remarks && (
                          <div className="p-3 bg-slate-50 rounded-xl text-[10px] text-slate-500 italic">
                            {work.remarks}
                          </div>
                        )}

                        <div className="flex justify-end pt-2">
                          {canEdit ? (
                            <button 
                              onClick={() => setEditingPendingWork({ ...work })}
                              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 text-[10px] font-bold uppercase tracking-widest"
                            >
                              <Edit2 size={14} /> EDIT WORK
                            </button>
                          ) : (
                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">READ ONLY</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Mark Delivered Modal */}
              <AnimatePresence>
                {deliveringWork && (
                  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-[40px] shadow-2xl w-full max-w-sm overflow-hidden"
                    >
                      <div className="bg-emerald-600 p-6 flex items-center gap-3 text-white">
                        <Truck size={24} />
                        <h3 className="text-lg font-bold uppercase tracking-widest">MARK DELIVERED</h3>
                      </div>
                      <div className="p-8 space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Delivery Date</label>
                          <div className="relative">
                            <input 
                              type="date" 
                              value={deliveryFormData.deliveryDate}
                              onChange={(e) => setDeliveryFormData({ ...deliveryFormData, deliveryDate: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all pr-14"
                            />
                            <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vehicle Number</label>
                          <input 
                            type="text" 
                            value={deliveryFormData.vehicleNumber}
                            onChange={(e) => setDeliveryFormData({ ...deliveryFormData, vehicleNumber: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Delivery Location</label>
                          <input 
                            type="text" 
                            placeholder="E.G. AKP"
                            value={deliveryFormData.deliveryLocation}
                            onChange={(e) => setDeliveryFormData({ ...deliveryFormData, deliveryLocation: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          />
                        </div>

                        <div className="space-y-4 pt-4">
                          <button 
                            onClick={async () => {
                              try {
                                const newLog = {
                                  date: deliveringWork.date, // Keep original stock out date
                                  deliveryDate: deliveryFormData.deliveryDate, // Add specific delivery date
                                  size: deliveringWork.size,
                                  gsm: deliveringWork.gsm,
                                  out: deliveringWork.qty,
                                  unit: deliveringWork.unit,
                                  itemCode: deliveringWork.itemCode,
                                  workName: deliveringWork.workName,
                                  cutSize: deliveringWork.cutSize,
                                  sheets: deliveringWork.sheets,
                                  status: 'DELIVERED',
                                  vehicle: deliveryFormData.vehicleNumber,
                                  location: deliveryFormData.deliveryLocation,
                                  remarks: deliveringWork.remarks,
                                  timestamp: Timestamp.now()
                                };
                                await addDoc(collection(db, 'stockOutLogs'), newLog);
                                await deleteDoc(doc(db, 'pendingWorks', deliveringWork.id));
                                logAction(`Delivered work: ${deliveringWork.workName}`);
                                setDeliveringWork(null);
                                setDeliveryFormData({ 
                                  vehicleNumber: 'KL65S7466', 
                                  deliveryLocation: '',
                                  deliveryDate: new Date().toISOString().split('T')[0]
                                });
                              } catch (error) {
                                handleFirestoreError(error, OperationType.WRITE, 'pendingWorks/stockOutLogs');
                              }
                            }}
                            className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-bold text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                          >
                            CONFIRM RELEASE
                          </button>
                          <button 
                            onClick={() => setDeliveringWork(null)}
                            className="w-full text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Edit Pending Work Modal */}
              <AnimatePresence>
                {editingPendingWork && (
                  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-[40px] shadow-2xl w-full max-w-3xl overflow-hidden"
                    >
                      <div className="bg-[#0f2a43] p-6 flex items-center justify-between text-white">
                        <div className="flex items-center gap-3">
                          <Edit2 size={20} />
                          <h3 className="text-lg font-bold uppercase tracking-widest">EDIT PENDING WORK</h3>
                        </div>
                        <button 
                          onClick={() => setEditingPendingWork(null)}
                          className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <div className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</label>
                            <input 
                              type="text" 
                              value={editingPendingWork.date}
                              onChange={(e) => setEditingPendingWork({ ...editingPendingWork, date: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Company</label>
                            <input 
                              type="text" 
                              value={editingPendingWork.company}
                              onChange={(e) => setEditingPendingWork({ ...editingPendingWork, company: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Size</label>
                            <input 
                              type="text" 
                              value={editingPendingWork.size}
                              onChange={(e) => setEditingPendingWork({ ...editingPendingWork, size: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GSM</label>
                            <input 
                              type="text" 
                              value={editingPendingWork.gsm}
                              onChange={(e) => setEditingPendingWork({ ...editingPendingWork, gsm: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item Code</label>
                            <input 
                              type="text" 
                              value={editingPendingWork.itemCode}
                              onChange={(e) => setEditingPendingWork({ ...editingPendingWork, itemCode: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quantity</label>
                            <input 
                              type="number" 
                              value={editingPendingWork.qty}
                              onChange={(e) => setEditingPendingWork({ ...editingPendingWork, qty: parseInt(e.target.value) || 0 })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unit</label>
                            <select 
                              value={editingPendingWork.unit}
                              onChange={(e) => setEditingPendingWork({ ...editingPendingWork, unit: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            >
                              <option value="CUTTING">Cutting</option>
                              <option value="PRINTING">Printing</option>
                              <option value="PACKING">Packing</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sheets (Override)</label>
                            <input 
                              type="number" 
                              value={editingPendingWork.sheets}
                              onChange={(e) => setEditingPendingWork({ ...editingPendingWork, sheets: parseInt(e.target.value) || 0 })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Work Name</label>
                          <input 
                            type="text" 
                            value={editingPendingWork.workName}
                            onChange={(e) => setEditingPendingWork({ ...editingPendingWork, workName: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cut Size</label>
                            <input 
                              type="text" 
                              value={editingPendingWork.cutSize}
                              onChange={(e) => setEditingPendingWork({ ...editingPendingWork, cutSize: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remarks</label>
                            <input 
                              type="text" 
                              value={editingPendingWork.remarks}
                              onChange={(e) => setEditingPendingWork({ ...editingPendingWork, remarks: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                          <button 
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'pendingWorks', editingPendingWork.id), editingPendingWork);
                                logAction(`Updated pending work: ${editingPendingWork.workName}`);
                                setEditingPendingWork(null);
                              } catch (error) {
                                handleFirestoreError(error, OperationType.UPDATE, `pendingWorks/${editingPendingWork.id}`);
                              }
                            }}
                            className="bg-[#0f2a43] text-white px-12 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-blue-900/20"
                          >
                            Update Record
                          </button>
                          <button 
                            onClick={() => setEditingPendingWork(null)}
                            className="text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'Reorder Alerts' && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Alerts Header */}
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setActiveTab('Dashboard')}
                    className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors font-bold text-sm"
                  >
                    <ChevronRight className="rotate-180" size={20} />
                    Back
                  </button>
                  <div className="flex items-center gap-2 ml-2 lg:ml-4">
                    <AlertTriangle className="text-[#d32f2f]" size={24} />
                    <h2 className="text-lg lg:text-xl font-black text-[#d32f2f] tracking-tight uppercase">REORDER ALERTS</h2>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:ml-auto w-full lg:w-auto">
                  <div className="relative flex-1 lg:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search alerts..."
                      value={searchAlertsQuery}
                      onChange={(e) => setSearchAlertsQuery(e.target.value)}
                      className="bg-white border border-slate-200 rounded-full pl-10 pr-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleInitiateExport('pdf', 'reorderAlerts')}
                      className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-rose-600 text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-rose-700 transition-all shadow-md"
                    >
                      <FileText size={16} /> PDF
                    </button>
                    <button 
                      onClick={() => handleInitiateExport('xlsx', 'reorderAlerts')}
                      className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-[#2e7d32] text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#1b5e20] transition-all shadow-md"
                    >
                      <FileSpreadsheet size={16} /> EXCEL
                    </button>
                    <div className="bg-[#fff5f5] text-[#d32f2f] px-4 py-2 rounded-lg text-xs font-bold border border-red-100 shadow-sm whitespace-nowrap">
                      Items: {inventory.flatMap(s => s.subSections.flatMap(ss => ss.items.filter(i => i.isLow))).length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr className="bg-[#d32f2f] text-white">
                        <th className="px-2 py-3 text-[10px] font-black uppercase tracking-wider border-r border-white/20">SIZE</th>
                        <th className="px-2 py-3 text-[10px] font-black uppercase tracking-wider border-r border-white/20">GSM</th>
                        <th className="px-2 py-3 text-[10px] font-black uppercase tracking-wider border-r border-white/20">MIN</th>
                        <th className="px-2 py-3 text-[10px] font-black uppercase tracking-wider border-r border-white/20">CURR</th>
                        <th className="px-2 py-3 text-[10px] font-black uppercase tracking-wider border-r border-white/20">SHORT</th>
                        <th className="px-2 py-3 text-[10px] font-black uppercase tracking-wider border-r border-white/20" style={{ width: '180px' }}>COMPANY</th>
                        <th className="px-2 py-3 text-[10px] font-black uppercase tracking-wider border-r border-white/20" style={{ width: '100px' }}>ORD QTY</th>
                        <th className="px-2 py-3 text-[10px] font-black uppercase tracking-wider border-r border-white/20" style={{ width: '150px' }}>ORD DATE</th>
                        <th className="px-2 py-3 text-[10px] font-black uppercase tracking-wider border-r border-white/20" style={{ width: '150px' }}>EXP DELIVERY</th>
                        <th className="px-2 py-3 text-[10px] font-black uppercase tracking-wider border-r border-white/20" style={{ width: '130px' }}>STATUS</th>
                        <th className="px-2 py-3 text-[10px] font-black uppercase tracking-wider border-r border-white/20" style={{ width: '180px' }}>REMARKS</th>
                        <th className="px-2 py-3 text-[10px] font-black uppercase tracking-wider">LOG</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {inventory.flatMap(section => 
                        section.subSections.flatMap(sub => 
                          sub.items.filter(item => 
                            item.isLow && (
                              item.size.toLowerCase().includes(searchAlertsQuery.toLowerCase()) ||
                              item.gsm.toLowerCase().includes(searchAlertsQuery.toLowerCase())
                            )
                          ).map(item => ({
                            sectionTitle: section.title,
                            subTitle: sub.title,
                            item,
                            key: `${item.size}-${item.gsm}`
                          }))
                        )
                      ).length === 0 ? (
                        <tr>
                          <td colSpan={12} className="px-6 py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">No reorder alerts found</td>
                        </tr>
                      ) : (
                        inventory.flatMap(section => 
                          section.subSections.flatMap(sub => 
                            sub.items.filter(item => 
                              item.isLow && (
                                item.size.toLowerCase().includes(searchAlertsQuery.toLowerCase()) ||
                                item.gsm.toLowerCase().includes(searchAlertsQuery.toLowerCase())
                              )
                            ).map(item => ({
                              sectionTitle: section.title,
                              subTitle: sub.title,
                              item,
                              key: `${item.size}-${item.gsm}`
                            }))
                          )
                        ).map((entry, idx) => {
                          const tracking = reorderTracking[entry.key] || {
                            company: '',
                            ordQty: '0',
                            ordDate: '',
                            expDelivery: '',
                            status: 'Pending',
                            remarks: ''
                          };
                          
                          const updateField = (field: string, value: any) => {
                            setReorderTracking(prev => ({
                              ...prev,
                              [entry.key]: {
                                ...tracking,
                                [field]: value
                              }
                            }));
                          };

                          return (
                            <tr key={entry.key} className={cn("transition-colors", idx % 2 === 1 ? "bg-[#fffde7]" : "bg-white")}>
                              <td className="px-2 py-2 text-xs font-black text-slate-900 border-r border-slate-200">{entry.item.size}</td>
                              <td className="px-2 py-2 text-xs font-bold text-slate-800 border-r border-slate-200">{entry.item.gsm}</td>
                              <td className="px-2 py-2 text-xs font-bold text-slate-500 border-r border-slate-200">{entry.item.minQuantity || 500}</td>
                              <td className="px-2 py-2 text-xs font-black text-red-600 border-r border-slate-200">{entry.item.stock}</td>
                              <td className="px-2 py-2 text-xs font-black text-red-600 border-r border-slate-200">{(entry.item.minQuantity || 500) - entry.item.stock}</td>
                              <td className="px-2 py-2 border-r border-slate-200">
                                <input 
                                  type="text"
                                  value={tracking.company}
                                  onChange={(e) => updateField('company', e.target.value)}
                                  placeholder="Supplier..."
                                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-red-500"
                                />
                              </td>
                              <td className="px-2 py-2 border-r border-slate-200">
                                <input 
                                  type="text"
                                  value={tracking.ordQty}
                                  onChange={(e) => updateField('ordQty', e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[11px] text-center focus:outline-none focus:border-red-500"
                                />
                              </td>
                              <td className="px-2 py-2 border-r border-slate-200">
                                <div className="relative">
                                  <input 
                                    type="date"
                                    value={tracking.ordDate}
                                    onChange={(e) => updateField('ordDate', e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-red-500 appearance-none"
                                  />
                                  <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                                </div>
                              </td>
                              <td className="px-2 py-2 border-r border-slate-200">
                                <div className="relative">
                                  <input 
                                    type="date"
                                    value={tracking.expDelivery}
                                    onChange={(e) => updateField('expDelivery', e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-red-500 appearance-none"
                                  />
                                  <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                                </div>
                              </td>
                              <td className="px-2 py-2 border-r border-slate-200">
                                <select 
                                  value={tracking.status}
                                  onChange={(e) => updateField('status', e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[11px] font-bold focus:outline-none focus:border-red-500"
                                >
                                  <option>Pending</option>
                                  <option>Ordered</option>
                                  <option>Shipped</option>
                                  <option>Delivered</option>
                                </select>
                              </td>
                              <td className="px-2 py-2 border-r border-slate-200">
                                <input 
                                  type="text"
                                  value={tracking.remarks}
                                  onChange={(e) => updateField('remarks', e.target.value)}
                                  placeholder="Notes..."
                                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-red-500"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <button 
                                  onClick={() => handleSaveReorder(entry.key, entry.item)}
                                  className="p-1.5 bg-[#7b1fa2] text-white rounded hover:bg-[#6a1b9a] transition-colors shadow-sm"
                                >
                                  <Save size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {inventory.flatMap(section => 
                  section.subSections.flatMap(sub => 
                    sub.items.filter(item => 
                      item.isLow && (
                        item.size.toLowerCase().includes(searchAlertsQuery.toLowerCase()) ||
                        item.gsm.toLowerCase().includes(searchAlertsQuery.toLowerCase())
                      )
                    ).map(item => ({
                      sectionTitle: section.title,
                      subTitle: sub.title,
                      item,
                      key: `${item.size}-${item.gsm}`
                    }))
                  )
                ).length === 0 ? (
                  <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No reorder alerts found</p>
                  </div>
                ) : (
                  inventory.flatMap(section => 
                    section.subSections.flatMap(sub => 
                      sub.items.filter(item => 
                        item.isLow && (
                          item.size.toLowerCase().includes(searchAlertsQuery.toLowerCase()) ||
                          item.gsm.toLowerCase().includes(searchAlertsQuery.toLowerCase())
                        )
                      ).map(item => ({
                        sectionTitle: section.title,
                        subTitle: sub.title,
                        item,
                        key: `${item.size}-${item.gsm}`
                      }))
                    )
                  ).map((entry) => {
                    const tracking = reorderTracking[entry.key] || {
                      company: '',
                      ordQty: '0',
                      ordDate: '',
                      expDelivery: '',
                      status: 'Pending',
                      remarks: ''
                    };
                    
                    const updateField = (field: string, value: any) => {
                      setReorderTracking(prev => ({
                        ...prev,
                        [entry.key]: {
                          ...tracking,
                          [field]: value
                        }
                      }));
                    };

                    return (
                      <div key={entry.key} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-[#d32f2f] px-4 py-3 flex justify-between items-center">
                          <div>
                            <span className="text-white font-black text-sm">{entry.item.size}</span>
                            <span className="text-white/70 text-[10px] font-bold ml-2 uppercase tracking-widest">{entry.item.gsm} GSM</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-white/70 text-[10px] font-bold uppercase">Stock:</span>
                            <span className="text-white font-black text-sm">{entry.item.stock}</span>
                          </div>
                        </div>
                        
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Min Quantity</p>
                              <p className="text-sm font-bold text-slate-700">{entry.item.minQuantity || 500}</p>
                            </div>
                            <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
                              <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest mb-1">Shortage</p>
                              <p className="text-sm font-black text-rose-600">{(entry.item.minQuantity || 500) - entry.item.stock}</p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Supplier / Company</label>
                              <input 
                                type="text"
                                value={tracking.company}
                                onChange={(e) => updateField('company', e.target.value)}
                                placeholder="Enter supplier name..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Order Qty</label>
                                <input 
                                  type="text"
                                  value={tracking.ordQty}
                                  onChange={(e) => updateField('ordQty', e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</label>
                                <select 
                                  value={tracking.status}
                                  onChange={(e) => updateField('status', e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                >
                                  <option>Pending</option>
                                  <option>Ordered</option>
                                  <option>Shipped</option>
                                  <option>Delivered</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Order Date</label>
                                <div className="relative">
                                  <input 
                                    type="date"
                                    value={tracking.ordDate}
                                    onChange={(e) => updateField('ordDate', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Exp Delivery</label>
                                <div className="relative">
                                  <input 
                                    type="date"
                                    value={tracking.expDelivery}
                                    onChange={(e) => updateField('expDelivery', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Remarks</label>
                              <textarea 
                                rows={2}
                                value={tracking.remarks}
                                onChange={(e) => updateField('remarks', e.target.value)}
                                placeholder="Add notes..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                              />
                            </div>
                          </div>

                          <button 
                            onClick={() => handleSaveReorder(entry.key, entry.item)}
                            className="w-full py-3 bg-[#7b1fa2] text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#6a1b9a] transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
                          >
                            <Save size={16} /> Save Tracking Info
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'Reorder History' && (
            <motion.div
              key="reorder-history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4 mb-2">
                <button 
                  onClick={() => setActiveTab('Dashboard')}
                  className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors font-bold text-sm"
                >
                  <ChevronRight className="rotate-180" size={20} />
                  Back
                </button>
                <div className="flex items-center gap-2 ml-4">
                  <History className="text-[#7b1fa2]" size={24} />
                  <h2 className="text-xl font-black text-[#7b1fa2] tracking-tight uppercase">REORDER HISTORY</h2>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="bg-[#7b1fa2] text-white">
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider">DATE</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider">SIZE</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider">GSM</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider">COMPANY</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider">ORD QTY</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {reorderHistory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">No reorder history found</td>
                      </tr>
                    ) : (
                      reorderHistory.map((entry, idx) => (
                        <tr key={entry.id} className={idx % 2 === 1 ? "bg-slate-50" : "bg-white"}>
                          <td className="px-4 py-3 text-xs font-bold text-slate-700">{formatDate(entry.date)}</td>
                          <td className="px-4 py-3 text-xs font-black text-slate-900">{entry.size}</td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-700">{entry.gsm}</td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-700">{entry.company}</td>
                          <td className="px-4 py-3 text-xs font-black text-slate-900">{entry.ordQty}</td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-700">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${entry.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {entry.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'Demand Forecast' && (
            <motion.div
              key="demand-forecast"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setActiveTab('Dashboard')}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="rotate-180" size={24} />
                  </button>
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">FORECAST ENGINE</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ANALYTICS & REQUIREMENTS</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex bg-slate-100 rounded-full p-1">
                    <button className="px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest bg-white shadow-sm text-indigo-900">Historical</button>
                    <button className="px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest text-slate-500">Predictive</button>
                  </div>
                  <div className="flex bg-slate-100 rounded-full p-1">
                    <button className="px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest text-slate-500">30 Days</button>
                    <button className="px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest bg-white shadow-sm text-indigo-900">90 Days</button>
                    <button className="px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest text-slate-500">All</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleInitiateExport('pdf', 'demandForecast')}
                      className="flex items-center gap-2 bg-rose-600 text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-md"
                    >
                      <FileText size={16} /> PDF
                    </button>
                    <button 
                      onClick={() => handleInitiateExport('xlsx', 'demandForecast')}
                      className="flex items-center gap-2 bg-[#0ea5e9] text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-[#0284c7] transition-all shadow-md"
                    >
                      <FileSpreadsheet size={16} /> EXCEL
                    </button>
                  </div>
                </div>
              </div>

              {/* Top Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[#fff5f5] p-8 rounded-3xl border border-rose-100 shadow-sm flex items-center gap-6">
                  <div className="w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                    <ArrowUp size={32} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Outbound Flow</p>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Consumption</h2>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                    <ArrowDown size={32} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inbound Flow</p>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Restock</h2>
                  </div>
                </div>
              </div>

              {/* Bottom Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <BarChart2 className="text-slate-400" size={24} />
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Top Distribution</h3>
                    </div>
                    <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Volume Base</span>
                  </div>
                  <div className="h-[300px] flex flex-col items-center justify-center text-slate-300 gap-4">
                    <RotateCcw size={48} className="opacity-20" />
                    <p className="text-sm font-bold uppercase tracking-widest">No movement recorded</p>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Ranking Table</h3>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total: 0 Units</span>
                  </div>
                  <table className="w-full mt-8">
                    <thead>
                      <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                        <th className="pb-4 text-left">Rank</th>
                        <th className="pb-4 text-left">Item</th>
                        <th className="pb-4 text-left">Volume</th>
                        <th className="pb-4 text-left">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={4} className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-sm">No records found</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Admin Panel' && (
            <motion.div
              key="admin-panel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="bg-[#0a3d62] text-white p-4 lg:p-6 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-4 lg:gap-6">
                  <button 
                    onClick={() => setActiveTab('Dashboard')}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ChevronRight className="rotate-180" size={20} />
                  </button>
                  <div className="flex items-center gap-3">
                    <Shield size={24} />
                    <h1 className="text-xl lg:text-2xl font-black tracking-tight uppercase">ADMIN PANEL</h1>
                  </div>
                </div>
                <div className="flex bg-[#072a44] rounded-xl lg:rounded-full p-1 w-full lg:w-auto overflow-x-auto no-scrollbar">
                  {[
                    { name: 'Overview', icon: LayoutDashboard },
                    { name: 'Staffs', icon: Users },
                    { name: 'Approval', icon: AlertCircle, badge: approvals.filter(a => (a.type === 'User Registration' || a.type === 'Editor Update') && (a.status === 'Pending' || a.status === 'Unread')).length },
                    { name: 'Audit Log', icon: History },
                  ].map((tab) => (
                    <button 
                      key={tab.name}
                      onClick={() => setAdminTab(tab.name)}
                      className={`flex items-center gap-2 px-4 lg:px-6 py-2 lg:py-3 rounded-lg lg:rounded-full text-[10px] lg:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap relative ${
                        adminTab === tab.name 
                          ? 'bg-white text-[#0a3d62] shadow-sm' 
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      <tab.icon size={14} /> 
                      {tab.name}
                      {tab.badge !== undefined && tab.badge > 0 && (
                        <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full min-w-[14px] flex items-center justify-center border border-white">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Area */}
              {adminTab === 'Overview' && (
                <div className="space-y-6">
                  {approvals.filter(a => a.type === 'User Registration' && a.status === 'Pending').length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-rose-50 border border-rose-200 p-4 lg:p-6 rounded-2xl lg:rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 lg:w-16 lg:h-16 bg-rose-100 rounded-xl lg:rounded-2xl flex items-center justify-center text-rose-600 shrink-0">
                          <AlertCircle size={24} />
                        </div>
                        <div>
                          <h3 className="text-sm lg:text-base font-black text-rose-900 uppercase tracking-widest">New Registration Requests</h3>
                          <p className="text-[10px] lg:text-xs text-rose-600 font-bold uppercase tracking-widest">There are {approvals.filter(a => a.type === 'User Registration' && a.status === 'Pending').length} users awaiting approval</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setAdminTab('Approval')}
                        className="w-full sm:w-auto px-6 py-3 bg-rose-600 text-white text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] rounded-xl lg:rounded-2xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 active:scale-95"
                      >
                        REVIEW NOW
                      </button>
                    </motion.div>
                  )}

                  {approvals.filter(a => a.type === 'Editor Update' && a.status === 'Unread').length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-blue-50 border border-blue-200 p-4 lg:p-6 rounded-2xl lg:rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 lg:w-16 lg:h-16 bg-blue-100 rounded-xl lg:rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                          <Bell size={24} />
                        </div>
                        <div>
                          <h3 className="text-sm lg:text-base font-black text-blue-900 uppercase tracking-widest">New Editor Updates</h3>
                          <p className="text-[10px] lg:text-xs text-blue-600 font-bold uppercase tracking-widest">There are {approvals.filter(a => a.type === 'Editor Update' && a.status === 'Unread').length} new changes from editors</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setAdminTab('Approval')}
                        className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] rounded-xl lg:rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                      >
                        VIEW UPDATES
                      </button>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {[
                      { icon: Users, title: 'SYSTEM STAFF', value: staffs.length.toString(), sub: 'AUTHENTICATED', color: 'text-blue-600', bg: 'bg-blue-50' },
                      { icon: AlertCircle, title: 'PENDING IDENTITY', value: approvals.filter(a => a.status === 'Pending').length.toString(), sub: 'AWAITING VERIFICATION', color: 'text-amber-600', bg: 'bg-amber-50' },
                      { icon: Database, title: 'ASSET SKUS', value: '145', sub: 'LIVE RECORDS', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                      { icon: Activity, title: 'OPERATIONS', value: auditLogs.length.toString(), sub: 'TOTAL LOGS', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    ].map((stat) => (
                      <div key={stat.title} className="bg-white p-6 lg:p-8 rounded-2xl lg:rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 lg:gap-6">
                        <div className={`w-12 h-12 lg:w-16 lg:h-16 ${stat.bg} ${stat.color} rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0`}>
                          <stat.icon size={24} />
                        </div>
                        <div>
                          <p className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.title}</p>
                          <h2 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tight">{stat.value}</h2>
                          <p className="text-[8px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {adminTab === 'Staffs' && (
                <div className="bg-white p-4 lg:p-8 rounded-2xl lg:rounded-3xl border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-black text-slate-800 uppercase mb-6">Staff Management</h3>
                  
                  {/* Desktop Table */}
                  <div className="hidden lg:block">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-400 uppercase tracking-widest">
                          <th className="pb-4">Name</th>
                          <th className="pb-4">Role</th>
                          <th className="pb-4">Pages</th>
                          <th className="pb-4">Status</th>
                          <th className="pb-4">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffs.map(staff => (
                          <tr key={staff.id} className="border-t border-slate-100">
                            <td className="py-4 font-bold">{staff.name}</td>
                            <td className="py-4">
                              <select 
                                value={staff.role}
                                disabled={!isAdmin}
                                onChange={async (e) => {
                                  if (isAdmin) {
                                    try {
                                      await updateDoc(doc(db, 'staffs', staff.id), { role: e.target.value });
                                      logAction(`Updated staff role for ${staff.name}`);
                                    } catch (error) {
                                      handleFirestoreError(error, OperationType.UPDATE, `staffs/${staff.id}`);
                                    }
                                  }
                                }}
                                className={cn(
                                  "bg-transparent font-bold text-slate-800 outline-none transition-colors",
                                  isAdmin ? "cursor-pointer hover:text-blue-600" : "cursor-not-allowed opacity-80"
                                )}
                              >
                                {roles.map(role => (
                                  <option key={role.id} value={role.name}>{role.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-4">
                              <div className="relative group">
                                <button 
                                  disabled={!isAdmin}
                                  className={cn(
                                    "text-[10px] font-bold text-slate-600 border border-slate-200 px-2 py-1 rounded-lg flex items-center gap-1",
                                    isAdmin ? "hover:border-blue-300 hover:text-blue-600" : "opacity-50 cursor-not-allowed"
                                  )}
                                >
                                  {staff.pages?.length || 0} Pages <ChevronDown size={10} />
                                </button>
                                {isAdmin && (
                                  <div className="absolute left-0 top-full mt-1 w-max bg-white border border-slate-100 shadow-xl rounded-xl p-2 z-50 hidden group-hover:block">
                                    {['Dashboard', 'Inventory', 'Movement', 'Planning', 'Tools', 'Admin'].map(page => (
                                      <label key={page} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-[10px] font-bold text-slate-600">
                                        <input 
                                          type="checkbox"
                                          checked={staff.pages?.includes(page)}
                                          onChange={async (e) => {
                                            const newPages = e.target.checked 
                                              ? [...(staff.pages || []), page]
                                              : (staff.pages || []).filter(p => p !== page);
                                            try {
                                              await updateDoc(doc(db, 'staffs', staff.id), { pages: newPages });
                                              logAction(`Updated staff pages for ${staff.name}`);
                                            } catch (error) {
                                              handleFirestoreError(error, OperationType.UPDATE, `staffs/${staff.id}`);
                                            }
                                          }}
                                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        {page}
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-4">{staff.status}</td>
                            <td className="py-4">
                              {isAdmin ? (
                                <button onClick={async () => {
                                  try {
                                    await deleteDoc(doc(db, 'staffs', staff.id));
                                    logAction(`Removed staff member ${staff.name}`);
                                  } catch (error) {
                                    handleFirestoreError(error, OperationType.DELETE, `staffs/${staff.id}`);
                                  }
                                }} className="text-rose-500 hover:text-rose-700">
                                  <Trash2 size={16} />
                                </button>
                              ) : (
                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">READ ONLY</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-4">
                    {staffs.map(staff => (
                      <div key={staff.id} className="p-4 border border-slate-100 rounded-xl space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-900">{staff.name}</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{staff.status}</p>
                          </div>
                          {isAdmin && (
                            <button onClick={async () => {
                              try {
                                await deleteDoc(doc(db, 'staffs', staff.id));
                                logAction(`Removed staff member ${staff.name}`);
                              } catch (error) {
                                handleFirestoreError(error, OperationType.DELETE, `staffs/${staff.id}`);
                              }
                            }} className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg transition-colors">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">ROLE</p>
                            <select 
                              value={staff.role}
                              disabled={!isAdmin}
                              onChange={async (e) => {
                                if (isAdmin) {
                                  try {
                                    await updateDoc(doc(db, 'staffs', staff.id), { role: e.target.value });
                                    logAction(`Updated staff role for ${staff.name}`);
                                  } catch (error) {
                                    handleFirestoreError(error, OperationType.UPDATE, `staffs/${staff.id}`);
                                  }
                                }
                              }}
                              className="w-full bg-slate-50 p-2 rounded-lg font-bold text-xs text-slate-800 outline-none"
                            >
                              {roles.map(role => (
                                <option key={role.id} value={role.name}>{role.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">PAGES</p>
                            <div className="relative group">
                              <button 
                                disabled={!isAdmin}
                                className="w-full bg-slate-50 p-2 rounded-lg font-bold text-xs text-slate-800 flex items-center justify-between"
                              >
                                {staff.pages?.length || 0} Pages <ChevronDown size={10} />
                              </button>
                              {isAdmin && (
                                <div className="absolute right-0 bottom-full mb-1 w-48 bg-white border border-slate-100 shadow-xl rounded-xl p-2 z-50 hidden group-hover:block">
                                  {['Dashboard', 'Inventory', 'Movement', 'Planning', 'Tools', 'Admin'].map(page => (
                                    <label key={page} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-[10px] font-bold text-slate-600">
                                      <input 
                                        type="checkbox"
                                        checked={staff.pages?.includes(page)}
                                        onChange={async (e) => {
                                          const newPages = e.target.checked 
                                            ? [...(staff.pages || []), page]
                                            : (staff.pages || []).filter(p => p !== page);
                                          try {
                                            await updateDoc(doc(db, 'staffs', staff.id), { pages: newPages });
                                            logAction(`Updated staff pages for ${staff.name}`);
                                          } catch (error) {
                                            handleFirestoreError(error, OperationType.UPDATE, `staffs/${staff.id}`);
                                          }
                                        }}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      {page}
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {adminTab === 'Approval' && (
                <div className="space-y-8">
                  <div className="bg-white p-4 lg:p-8 rounded-2xl lg:rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-800 uppercase mb-6">Pending Registrations</h3>
                    
                    {/* Desktop Table */}
                    <div className="hidden lg:block">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-slate-400 uppercase tracking-widest">
                            <th className="pb-4">NAME</th>
                            <th className="pb-4">ROLE</th>
                            <th className="pb-4">PAGES</th>
                            <th className="pb-4">STATUS</th>
                            <th className="pb-4">ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {approvals.filter(a => a.type === 'User Registration').map(approval => (
                            <tr key={approval.id} className="border-t border-slate-100">
                              <td className="py-4 font-bold">{approval.username}</td>
                              <td className="py-4">
                                <select 
                                  value={approval.role || roles[0]?.name || 'User'} 
                                  onChange={async (e) => {
                                    try {
                                      await updateDoc(doc(db, 'registrations', approval.id), { role: e.target.value });
                                    } catch (error) {
                                      handleFirestoreError(error, OperationType.UPDATE, `registrations/${approval.id}`);
                                    }
                                  }}
                                  className="p-2 rounded-lg border border-slate-200"
                                >
                                  {roles.map(role => (
                                    <option key={role.id} value={role.name}>{role.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-4">
                                <div className="relative">
                                  <button 
                                    onClick={() => setOpenApprovalDropdownId(openApprovalDropdownId === approval.id ? null : approval.id)}
                                    className="text-[10px] font-bold text-slate-600 border border-slate-200 px-2 py-1 rounded-lg flex items-center gap-1 hover:border-blue-300 hover:text-blue-600"
                                  >
                                    {approval.pageAccess?.length || 0} Pages <ChevronDown size={10} />
                                  </button>
                                  {openApprovalDropdownId === approval.id && (
                                    <div className="absolute left-0 top-full mt-1 w-max bg-white border border-slate-100 shadow-xl rounded-xl p-2 z-50">
                                      {['Dashboard', 'Inventory', 'Movement', 'Planning', 'Tools', 'Admin'].map(page => (
                                        <label key={page} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-[10px] font-bold text-slate-600">
                                          <input 
                                            type="checkbox" 
                                            checked={approval.pageAccess?.includes(page)}
                                            onChange={async (e) => {
                                              const newPages = e.target.checked 
                                                ? [...(approval.pageAccess || []), page]
                                                : (approval.pageAccess || []).filter((p: string) => p !== page);
                                              try {
                                                await updateDoc(doc(db, 'registrations', approval.id), { pageAccess: newPages });
                                              } catch (error) {
                                                handleFirestoreError(error, OperationType.UPDATE, `registrations/${approval.id}`);
                                              }
                                            }}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                          />
                                          {page}
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-4">{approval.status}</td>
                              <td className="py-4 flex gap-2">
                                {approval.status === 'Pending' && (
                                  <>
                                    <button 
                                      onClick={async () => {
                                        try {
                                          await updateDoc(doc(db, 'registrations', approval.id), { status: 'Approved' });
                                          await addDoc(collection(db, 'staffs'), {
                                            uid: approval.id, // Using registration ID as temporary UID
                                            name: approval.username,
                                            username: approval.username,
                                            password: approval.password,
                                            role: approval.role || roles[0]?.name || 'User',
                                            status: 'Active',
                                            pages: approval.pageAccess || ['Dashboard'],
                                            createdAt: Timestamp.now()
                                          });
                                          logAction(`Approved registration for ${approval.username}`);
                                        } catch (error) {
                                          handleFirestoreError(error, OperationType.WRITE, 'registrations/staffs');
                                        }
                                      }} 
                                      className="text-emerald-500 hover:text-emerald-700"
                                    >
                                      <CheckCircle size={16} />
                                    </button>
                                    <button onClick={async () => {
                                      try {
                                        await updateDoc(doc(db, 'registrations', approval.id), { status: 'Rejected' });
                                        logAction(`Rejected registration for ${approval.username}`);
                                      } catch (error) {
                                        handleFirestoreError(error, OperationType.UPDATE, `registrations/${approval.id}`);
                                      }
                                    }} className="text-rose-500 hover:text-rose-700">
                                      <Trash2 size={16} />
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="lg:hidden space-y-4">
                      {approvals.filter(a => a.type === 'User Registration').map(approval => (
                        <div key={approval.id} className="p-4 border border-slate-100 rounded-xl space-y-3">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-slate-900">{approval.username}</h4>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{approval.status}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">ROLE</p>
                              <select 
                                value={approval.role || roles[0]?.name || 'User'} 
                                onChange={async (e) => {
                                  try {
                                    await updateDoc(doc(db, 'registrations', approval.id), { role: e.target.value });
                                  } catch (error) {
                                    handleFirestoreError(error, OperationType.UPDATE, `registrations/${approval.id}`);
                                  }
                                }}
                                className="w-full bg-slate-50 p-2 rounded-lg font-bold text-xs text-slate-800 outline-none"
                              >
                                {roles.map(role => (
                                  <option key={role.id} value={role.name}>{role.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">PAGES</p>
                              <button className="w-full bg-slate-50 p-2 rounded-lg font-bold text-xs text-slate-800 flex items-center justify-between">
                                {approval.pageAccess ? '1 Page' : '0 Pages'} <ChevronDown size={10} />
                              </button>
                            </div>
                          </div>
                              {approval.status === 'Pending' && (
                                <div className="flex gap-2 pt-2">
                                  <button 
                                    onClick={async () => {
                                      try {
                                        await updateDoc(doc(db, 'registrations', approval.id), { status: 'Approved' });
                                        await addDoc(collection(db, 'staffs'), {
                                          uid: approval.id,
                                          name: approval.username,
                                          username: approval.username,
                                          password: approval.password,
                                          role: approval.role || roles[0]?.name || 'User',
                                          status: 'Active',
                                          pages: approval.pageAccess || ['Dashboard'],
                                          createdAt: Timestamp.now()
                                        });
                                        logAction(`Approved registration for ${approval.username}`);
                                      } catch (error) {
                                        handleFirestoreError(error, OperationType.WRITE, 'registrations/staffs');
                                      }
                                    }} 
                                    className="flex-1 bg-emerald-50 text-emerald-600 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                                  >
                                    <CheckCircle size={14} /> APPROVE
                                  </button>
                                  <button 
                                    onClick={async () => {
                                      try {
                                        await updateDoc(doc(db, 'registrations', approval.id), { status: 'Rejected' });
                                        logAction(`Rejected registration for ${approval.username}`);
                                      } catch (error) {
                                        handleFirestoreError(error, OperationType.UPDATE, `registrations/${approval.id}`);
                                      }
                                    }} 
                                    className="flex-1 bg-rose-50 text-rose-600 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2"
                                  >
                                    <Trash2 size={14} /> REJECT
                                  </button>
                                </div>
                              )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-4 lg:p-8 rounded-2xl lg:rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-black text-slate-800 uppercase">Editor Updates</h3>
                      <button 
                        onClick={() => setApprovals(prev => prev.map(a => a.type === 'Editor Update' ? { ...a, status: 'Read' } : a))}
                        className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline"
                      >
                        Mark all as read
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {approvals.filter(a => a.type === 'Editor Update').length === 0 ? (
                        <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-xs">No editor updates found</div>
                      ) : (
                        approvals.filter(a => a.type === 'Editor Update').map(update => (
                          <div key={update.id} className={cn(
                            "p-4 rounded-2xl border transition-all",
                            update.status === 'Unread' ? "bg-blue-50/50 border-blue-100 shadow-sm" : "bg-white border-slate-100"
                          )}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                  update.status === 'Unread' ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"
                                )}>
                                  <History size={16} />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-900">{update.details}</p>
                                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{new Date(update.timestamp).toLocaleString()}</p>
                                </div>
                              </div>
                              {update.status === 'Unread' && (
                                <button 
                                  onClick={() => setApprovals(prev => prev.map(a => a.id === update.id ? { ...a, status: 'Read' } : a))}
                                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                >
                                  <CheckCircle size={16} />
                                </button>
                              )}
                              <button 
                                onClick={() => setApprovals(prev => prev.filter(a => a.id !== update.id))}
                                className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {adminTab === 'Audit Log' && (
                <div className="bg-white p-4 lg:p-8 rounded-2xl lg:rounded-3xl border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-black text-slate-800 uppercase mb-6">Audit Logs</h3>
                  
                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-400 uppercase tracking-widest">
                          <th className="pb-4">Timestamp</th>
                          <th className="pb-4">User</th>
                          <th className="pb-4">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map(log => (
                          <tr key={log.id} className="border-t border-slate-100">
                            <td className="py-4 text-slate-500">{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : log.timestamp}</td>
                            <td className="py-4 font-bold">{log.user}</td>
                            <td className="py-4">{log.action}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-4">
                    {auditLogs.map(log => (
                      <div key={log.id} className="p-4 border border-slate-100 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : log.timestamp}</span>
                          <span className="font-bold text-slate-900 text-xs">{log.user}</span>
                        </div>
                        <p className="text-xs text-slate-600">{log.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'Job Card Generator' && (
            <motion.div
              key="job-card-generator"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-[calc(100vh-120px)] h-auto lg:h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-6"
            >
              {/* Left Panel: Creator */}
              <div className="w-full lg:w-80 flex flex-col gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 lg:p-6 flex flex-col gap-6 h-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setActiveTab('Dashboard')}
                        className="p-1 hover:bg-slate-100 rounded transition-colors"
                      >
                        <ChevronRight className="rotate-180" size={16} />
                      </button>
                      <h3 className="text-[10px] lg:text-xs font-black text-slate-800 uppercase tracking-widest">CREATOR</h3>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button 
                        onClick={() => setCardPrefix('EP')}
                        className={cn(
                          "px-3 py-1 text-[10px] font-black rounded-md transition-all",
                          cardPrefix === 'EP' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        EP
                      </button>
                      <button 
                        onClick={() => setCardPrefix('FP')}
                        className={cn(
                          "px-3 py-1 text-[10px] font-black rounded-md transition-all",
                          cardPrefix === 'FP' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        FP
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col gap-2 min-h-[200px] lg:min-h-0">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ORDER DETAILS</label>
                    <textarea 
                      placeholder="Paste WhatsApp order..."
                      value={whatsappOrder}
                      onChange={(e) => setWhatsappOrder(e.target.value)}
                      className="flex-1 w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none min-h-[150px] lg:min-h-0"
                    />
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={handleAiGenerate}
                      disabled={isGenerating}
                      className="w-full flex items-center justify-center gap-2 bg-[#b0bec5] text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#90a4ae] transition-all shadow-md disabled:opacity-50"
                    >
                      {isGenerating ? <Activity className="animate-spin" size={16} /> : <Wand2 size={16} />}
                      AI GENERATE
                    </button>
                    
                    <div className="relative flex items-center justify-center py-2">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                      <span className="relative px-2 bg-white text-[8px] font-black text-slate-300 uppercase">OR</span>
                    </div>

                    <button 
                      onClick={handleManualBlankCard}
                      className="w-full flex items-center justify-center gap-2 bg-white border-2 border-slate-100 text-slate-800 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                      <FilePlus size={16} className="text-emerald-500" />
                      MANUAL BLANK CARD
                    </button>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                    <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[9px] font-bold text-blue-700 leading-relaxed">
                      Blank cards automatically use sequential serial numbers based on current Financial Year.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Panel: Preview */}
              <div className="flex-1 flex flex-col gap-6 min-h-[500px] lg:min-h-0">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 lg:p-6 flex flex-col h-full overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <FileText size={20} />
                      </div>
                      <h3 className="text-[10px] lg:text-xs font-black text-slate-800 uppercase tracking-widest">PREVIEW</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                      <button 
                        onClick={() => setJobCards([])}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-rose-50 text-rose-600 px-3 lg:px-4 py-2 rounded-lg text-[9px] lg:text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
                      >
                        <Trash size={14} /> CLEAR
                      </button>
                      <button 
                        onClick={() => window.print()}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 px-3 lg:px-4 py-2 rounded-lg text-[9px] lg:text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all"
                      >
                        <FileText size={14} /> PRINT
                      </button>
                      <button 
                        onClick={handleSaveToPdf}
                        disabled={isGenerating}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-4 lg:px-6 py-2 rounded-lg text-[9px] lg:text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md disabled:opacity-50"
                      >
                        {isGenerating ? <Activity className="animate-spin" size={14} /> : <Save size={14} />}
                        {isGenerating ? 'SAVING...' : 'SAVE'}
                      </button>
                    </div>
                  </div>

                  <div 
                    id="job-cards-print-area"
                    className="flex-1 bg-slate-50 rounded-2xl border border-slate-100 overflow-y-auto p-4 lg:p-8 flex flex-wrap gap-4 lg:gap-8 justify-center print:bg-white print:p-0 print:overflow-visible print:grid print:grid-cols-2 print:gap-4 print:w-full"
                    style={{ backgroundColor: '#f8fafc' }}
                  >
                    {jobCards.length === 0 ? (
                      <div className="flex flex-col items-center justify-center min-h-[300px] lg:h-full text-slate-300 gap-4">
                        <FileText size={64} strokeWidth={1} />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">NO CARDS GENERATED</p>
                      </div>
                    ) : (
                      jobCards.map((card, idx) => (
                        <div key={card.id} className="relative group print:break-inside-avoid w-full flex justify-center lg:w-auto">
                          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 print:hidden">
                            <button 
                              onClick={() => setJobCards(prev => prev.filter(c => c.id !== card.id))}
                              className="p-1.5 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-colors"
                            >
                              <Trash size={12} />
                            </button>
                          </div>
                          <div 
                            className="w-full max-w-[450px] bg-white border-2 border-black p-0 flex flex-col gap-0 shadow-xl print:shadow-none print:m-0 print:border-2 print:w-[120mm] print:max-w-[120mm]"
                            style={{ 
                              fontFamily: 'Arial, sans-serif', 
                              fontSize: '11pt', 
                              lineHeight: '1.4',
                              backgroundColor: '#ffffff',
                              borderColor: '#000000',
                              color: '#000000'
                            }}
                          >
                            <div className="grid grid-cols-[140px_1fr] border-b-2 border-black" style={{ borderColor: '#000000' }}>
                              <div className="p-2 font-bold uppercase border-r-2 border-black flex items-center" style={{ borderColor: '#000000' }}>JOB CARD NO:</div>
                              <div className="p-2 font-bold">{card.jobCardNo}</div>
                            </div>
                            <div className="grid grid-cols-[140px_1fr] border-b-2 border-black" style={{ borderColor: '#000000' }}>
                              <div className="p-2 font-bold uppercase border-r-2 border-black flex items-center" style={{ borderColor: '#000000' }}>DATE:</div>
                              <div className="p-0 relative">
                                <input 
                                  type="date" 
                                  value={card.date} 
                                  onChange={(e) => {
                                    const newCards = [...jobCards];
                                    newCards[idx].date = e.target.value;
                                    setJobCards(newCards);
                                  }}
                                  className="w-full border-none focus:ring-0 p-2 bg-transparent h-full font-bold print:hidden"
                                  style={{ fontSize: '11pt', color: '#000000' }}
                                />
                                <div className="hidden print:block p-2 font-bold">
                                  {formatDate(card.date)}
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-[140px_1fr] border-b-2 border-black" style={{ borderColor: '#000000' }}>
                              <div className="p-2 font-bold uppercase border-r-2 border-black flex items-center" style={{ borderColor: '#000000' }}>WORK NAME</div>
                              <div className="p-0">
                                <input 
                                  type="text" 
                                  value={card.workName} 
                                  onChange={(e) => {
                                    const newCards = [...jobCards];
                                    newCards[idx].workName = e.target.value;
                                    setJobCards(newCards);
                                  }}
                                  className="w-full border-none focus:ring-0 p-2 bg-transparent font-bold h-full"
                                  style={{ fontSize: '11pt', color: '#000000' }}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-[140px_1fr] border-b-2 border-black" style={{ borderColor: '#000000' }}>
                              <div className="p-2 font-bold uppercase border-r-2 border-black flex items-center" style={{ borderColor: '#000000' }}>SIZE</div>
                              <div className="p-0">
                                <input 
                                  type="text" 
                                  value={card.size} 
                                  onChange={(e) => {
                                    const newCards = [...jobCards];
                                    newCards[idx].size = e.target.value;
                                    setJobCards(newCards);
                                  }}
                                  className="w-full border-none focus:ring-0 p-2 bg-transparent h-full font-bold"
                                  style={{ fontSize: '11pt', color: '#000000' }}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-[140px_1fr] border-b-2 border-black" style={{ borderColor: '#000000' }}>
                              <div className="p-2 font-bold uppercase border-r-2 border-black flex items-center" style={{ borderColor: '#000000' }}>GSM</div>
                              <div className="p-0">
                                <input 
                                  type="text" 
                                  value={card.gsm} 
                                  onChange={(e) => {
                                    const newCards = [...jobCards];
                                    newCards[idx].gsm = e.target.value;
                                    setJobCards(newCards);
                                  }}
                                  className="w-full border-none focus:ring-0 p-2 bg-transparent h-full font-bold"
                                  style={{ fontSize: '11pt', color: '#000000' }}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-[140px_1fr] border-b-2 border-black" style={{ borderColor: '#000000' }}>
                              <div className="p-2 font-bold uppercase border-r-2 border-black flex items-center" style={{ borderColor: '#000000' }}>TOTAL GROSS</div>
                              <div className="p-0">
                                <input 
                                  type="text" 
                                  value={card.totalGross} 
                                  onChange={(e) => {
                                    const newCards = [...jobCards];
                                    newCards[idx].totalGross = e.target.value;
                                    setJobCards(newCards);
                                  }}
                                  className="w-full border-none focus:ring-0 p-2 bg-transparent h-full font-bold"
                                  style={{ fontSize: '11pt', color: '#000000' }}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-[140px_1fr] border-b-2 border-black" style={{ borderColor: '#000000' }}>
                              <div className="p-2 font-bold uppercase border-r-2 border-black flex items-center" style={{ borderColor: '#000000' }}>DELIVERY LOCATION</div>
                              <div className="p-0">
                                <select 
                                  value={card.deliveryLoc} 
                                  onChange={(e) => {
                                    const newCards = [...jobCards];
                                    newCards[idx].deliveryLoc = e.target.value;
                                    setJobCards(newCards);
                                  }}
                                  className="w-full border-none focus:ring-0 p-2 bg-transparent h-full appearance-none font-bold"
                                  style={{ fontSize: '11pt', color: '#000000' }}
                                >
                                  <option value="">Select Location</option>
                                  <option value="AKP">AKP</option>
                                  <option value="KKP">KKP</option>
                                  <option value="FP">FP</option>
                                  <option value="EP">EP</option>
                                  <option value="OTHER">OTHER</option>
                                </select>
                              </div>
                            </div>
                            <div className="grid grid-cols-[140px_1fr] border-b-2 border-black" style={{ borderColor: '#000000' }}>
                              <div className="p-2 font-bold uppercase border-r-2 border-black flex items-center" style={{ borderColor: '#000000' }}>LOADING DATE</div>
                              <div className="p-0 relative">
                                <input 
                                  type="date" 
                                  value={card.loadingDate} 
                                  onChange={(e) => {
                                    const newCards = [...jobCards];
                                    newCards[idx].loadingDate = e.target.value;
                                    setJobCards(newCards);
                                  }}
                                  className="w-full border-none focus:ring-0 p-2 bg-transparent h-full font-bold print:hidden"
                                  style={{ fontSize: '11pt', color: '#000000' }}
                                />
                                <div className="hidden print:block p-2 font-bold">
                                  {formatDate(card.loadingDate)}
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-[140px_1fr] border-b-2 border-black" style={{ borderColor: '#000000' }}>
                              <div className="p-2 font-bold uppercase border-r-2 border-black flex items-center" style={{ borderColor: '#000000' }}>SUPERVISOR SIGN</div>
                              <div className="p-2 min-h-[40px]"></div>
                            </div>
                            <div className="grid grid-cols-[140px_1fr]" style={{ borderColor: '#000000' }}>
                              <div className="p-2 font-bold uppercase border-r-2 border-black flex items-center" style={{ borderColor: '#000000' }}>ACCOUNTANT SIGN</div>
                              <div className="p-2 min-h-[40px]"></div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Export Modal */}
        <AnimatePresence>
          {showExportModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              >
                <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">
                      Export {
                        exportSource === 'inventory' ? 'Inventory' : 
                        exportSource === 'stockIn' ? 'Stock In Logs' : 
                        exportSource === 'stockOut' ? 'Stock Out Logs' : 
                        exportSource === 'pendingWorks' ? 'Pending Works' :
                        exportSource === 'demandForecast' ? 'Demand Forecast' :
                        'Reorder Alerts'
                      }
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">Select export parameters</p>
                  </div>
                  <div className="p-2 bg-white/10 rounded-lg">
                    {exportType === 'xlsx' ? <FileSpreadsheet className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Export Period</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setExportPeriod('current')}
                        className={cn(
                          "p-3 rounded-xl border-2 transition-all text-sm font-medium",
                          exportPeriod === 'current' 
                            ? "border-slate-900 bg-slate-900 text-white" 
                            : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200"
                        )}
                      >
                        {exportSource === 'inventory' ? 'Current Stock' : 
                         exportSource === 'demandForecast' || exportSource === 'reorderAlerts' ? 'Current View' : 'Current Date'}
                      </button>
                      <button 
                        onClick={() => setExportPeriod('period')}
                        className={cn(
                          "p-3 rounded-xl border-2 transition-all text-sm font-medium",
                          exportPeriod === 'period' 
                            ? "border-slate-900 bg-slate-900 text-white" 
                            : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200"
                        )}
                      >
                        Historical Report
                      </button>
                    </div>
                  </div>

                  {exportPeriod === 'period' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="space-y-4 pt-2"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">Start Date</label>
                          <input 
                            type="date" 
                            value={exportStartDate}
                            onChange={(e) => setExportStartDate(e.target.value)}
                            className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-slate-900 focus:ring-0 transition-all text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">End Date</label>
                          <input 
                            type="date" 
                            value={exportEndDate}
                            onChange={(e) => setExportEndDate(e.target.value)}
                            className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-slate-900 focus:ring-0 transition-all text-sm"
                          />
                        </div>
                      </div>
                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                        <p className="text-xs text-amber-800 leading-relaxed">
                          Historical reports calculate stock levels by processing all movements from the target period. Large date ranges may take a moment.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={() => setShowExportModal(false)}
                      className="flex-1 p-4 rounded-xl border-2 border-slate-100 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                    >
                      CANCEL
                    </button>
                    <button 
                      onClick={handleFinalExport}
                      className="flex-1 p-4 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                    >
                      GENERATE {exportType.toUpperCase()}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          #job-cards-print-area, #job-cards-print-area * {
            visibility: visible;
          }
          #job-cards-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 10mm !important;
            padding: 10mm !important;
            margin: 0 !important;
            border: none !important;
            background: white !important;
          }
          .print-break-inside-avoid {
            break-inside: avoid;
          }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}} />
        </div>
      </div>
    )}
    </ErrorBoundary>
  );
}
