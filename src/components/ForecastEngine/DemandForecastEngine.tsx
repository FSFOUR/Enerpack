/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { 
  ChevronRight, 
  FileText, 
  FileSpreadsheet, 
  ArrowUp, 
  ArrowDown, 
  Minus, 
  TrendingUp, 
  BarChart2, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

export const FORECAST_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export interface ConsumptionRow {
  rank: number;
  size: string;
  gsm: string;
  totalOut: number;
  prevOut: number;
  changePct: number | null; // null if previous was 0 and current > 0
  trend: 'up' | 'down' | 'flat';
}

export interface ForecastRow {
  rank: number;
  size: string;
  gsm: string;
  currentStock: number;
  monthlyConsumption: number;
  suggestedRestock: number;
  status: 'Critical' | 'Low Stock' | 'Adequate';
}

export interface ForecastAnalyticsResult {
  prevMonthName: string;
  prevYearStr: string;
  sectionA: ConsumptionRow[];
  sectionB: ConsumptionRow[];
  sectionC: ForecastRow[];
  sectionD: ForecastRow[];
  totalOut280: number;
  totalPrevOut280: number;
  changePct280: number | null;
  totalOut200: number;
  totalPrevOut200: number;
  changePct200: number | null;
  totalRestock280: number;
  totalRestock200: number;
}

export function getPreviousPeriod(forecastMonth: string, forecastYear: string) {
  if (forecastMonth === 'All') {
    const numericYear = parseInt(forecastYear, 10);
    return {
      prevMonthName: 'All',
      prevYearStr: isNaN(numericYear) ? 'All' : (numericYear - 1).toString()
    };
  }
  const monthIdx = FORECAST_MONTH_NAMES.indexOf(forecastMonth);
  if (monthIdx === -1) {
    return { prevMonthName: 'Previous', prevYearStr: forecastYear };
  }
  const prevIdx = (monthIdx - 1 + 12) % 12;
  const prevM = FORECAST_MONTH_NAMES[prevIdx];
  const prevY = monthIdx === 0 
    ? (parseInt(forecastYear, 10) - 1).toString() 
    : forecastYear;
  return { prevMonthName: prevM, prevYearStr: prevY };
}

export function calculateForecastAnalytics(
  stockOutLogs: any[],
  inventory: any[],
  forecastMonth: string,
  forecastYear: string
): ForecastAnalyticsResult {
  const { prevMonthName, prevYearStr } = getPreviousPeriod(forecastMonth, forecastYear);

  // Authoritative warehouse stock map: `${gsm}__${size}` -> { stock, minQuantity }
  const warehouseStockMap = new Map<string, { stock: number; minQuantity: number }>();
  if (Array.isArray(inventory)) {
    inventory.forEach(section => {
      if (!section?.subSections) return;
      section.subSections.forEach((sub: any) => {
        if (!sub?.items) return;
        sub.items.forEach((item: any) => {
          const gsm = String(item.gsm || '').trim();
          const size = String(item.size || '').trim();
          if (!gsm || !size) return;
          const key = `${gsm}__${size}`;
          const current = warehouseStockMap.get(key) || { stock: 0, minQuantity: 0 };
          warehouseStockMap.set(key, {
            stock: current.stock + (Number(item.stock) || 0),
            minQuantity: Math.max(current.minQuantity, Number(item.minQuantity) || 0)
          });
        });
      });
    });
  }

  const current280Map: Record<string, number> = {};
  const prev280Map: Record<string, number> = {};
  const current200Map: Record<string, number> = {};
  const prev200Map: Record<string, number> = {};

  const allTime280Map: Record<string, { total: number; months: Set<string> }> = {};
  const allTime200Map: Record<string, { total: number; months: Set<string> }> = {};

  if (Array.isArray(stockOutLogs)) {
    stockOutLogs.forEach(log => {
      if (!log) return;
      const outQty = Number(log.out) || 0;
      if (outQty <= 0) return;

      const statusUpper = String(log.status || '').toUpperCase();
      if (statusUpper === 'CANCELLED' || statusUpper === 'VOID' || statusUpper === 'REVERSED') {
        return;
      }
      if (log.isDeleted) return;

      let logDate: Date | null = null;
      if (log.date) {
        logDate = new Date(log.date);
      } else if (log.deliveryDate) {
        logDate = new Date(log.deliveryDate);
      } else if (log.timestamp?.toDate) {
        logDate = log.timestamp.toDate();
      } else if (log.timestamp?.seconds) {
        logDate = new Date(log.timestamp.seconds * 1000);
      }

      if (!logDate || isNaN(logDate.getTime())) return;

      const logYear = logDate.getFullYear().toString();
      const logMonth = logDate.toLocaleString('en-US', { month: 'long' });
      const monthYearKey = `${logMonth}_${logYear}`;

      const rawGsm = String(log.gsm || '').trim();
      const rawSize = String(log.size || '').trim();
      if (!rawSize) return;

      if (rawGsm === '280') {
        if (!allTime280Map[rawSize]) allTime280Map[rawSize] = { total: 0, months: new Set() };
        allTime280Map[rawSize].total += outQty;
        allTime280Map[rawSize].months.add(monthYearKey);
      } else if (rawGsm === '200') {
        if (!allTime200Map[rawSize]) allTime200Map[rawSize] = { total: 0, months: new Set() };
        allTime200Map[rawSize].total += outQty;
        allTime200Map[rawSize].months.add(monthYearKey);
      }

      const isCurrentMonthMatch = forecastMonth === 'All' || logMonth.toLowerCase() === forecastMonth.toLowerCase();
      const isCurrentYearMatch = forecastYear === 'All' || logYear === forecastYear;

      if (isCurrentMonthMatch && isCurrentYearMatch) {
        if (rawGsm === '280') {
          current280Map[rawSize] = (current280Map[rawSize] || 0) + outQty;
        } else if (rawGsm === '200') {
          current200Map[rawSize] = (current200Map[rawSize] || 0) + outQty;
        }
      }

      const isPrevMonthMatch = prevMonthName === 'All' || logMonth.toLowerCase() === prevMonthName.toLowerCase();
      const isPrevYearMatch = prevYearStr === 'All' || logYear === prevYearStr;

      if (isPrevMonthMatch && isPrevYearMatch) {
        if (rawGsm === '280') {
          prev280Map[rawSize] = (prev280Map[rawSize] || 0) + outQty;
        } else if (rawGsm === '200') {
          prev200Map[rawSize] = (prev200Map[rawSize] || 0) + outQty;
        }
      }
    });
  }

  const buildConsumptionRows = (
    currentMap: Record<string, number>,
    prevMap: Record<string, number>,
    gsm: string
  ): ConsumptionRow[] => {
    const sizesWithConsumption = Object.keys(currentMap).filter(size => (currentMap[size] || 0) > 0);
    const sortedSizes = sizesWithConsumption.sort((a, b) => currentMap[b] - currentMap[a]);
    const top10 = sortedSizes.slice(0, 10);

    return top10.map((size, idx) => {
      const totalOut = currentMap[size];
      const prevOut = prevMap[size] || 0;
      let changePct: number | null = null;
      let trend: 'up' | 'down' | 'flat' = 'flat';

      if (prevOut > 0) {
        changePct = Number((((totalOut - prevOut) / prevOut) * 100).toFixed(1));
        if (changePct > 0) trend = 'up';
        else if (changePct < 0) trend = 'down';
        else trend = 'flat';
      } else if (totalOut > 0) {
        changePct = null;
        trend = 'up';
      }

      return {
        rank: idx + 1,
        size,
        gsm,
        totalOut,
        prevOut,
        changePct,
        trend
      };
    });
  };

  const buildForecastRows = (
    currentConsumptionMap: Record<string, number>,
    allTimeMap: Record<string, { total: number; months: Set<string> }>,
    gsm: string
  ): ForecastRow[] => {
    const candidateSizes = new Set<string>();
    Object.keys(currentConsumptionMap).forEach(s => candidateSizes.add(s));
    Object.keys(allTimeMap).forEach(s => candidateSizes.add(s));

    warehouseStockMap.forEach((_, key) => {
      const [itemGsm, itemSize] = key.split('__');
      if (itemGsm === gsm && itemSize) candidateSizes.add(itemSize);
    });

    const forecastCandidates: ForecastRow[] = [];

    candidateSizes.forEach(size => {
      const stockData = warehouseStockMap.get(`${gsm}__${size}`) || { stock: 0, minQuantity: 0 };
      const currentStock = stockData.stock;

      const currentMonthOut = currentConsumptionMap[size] || 0;
      const allTimeData = allTimeMap[size];
      const avgMonthlyOut = allTimeData && allTimeData.months.size > 0
        ? Math.round(allTimeData.total / Math.max(1, allTimeData.months.size))
        : currentMonthOut;

      const effectiveMonthlyDemand = currentMonthOut > 0 ? currentMonthOut : avgMonthlyOut;
      if (effectiveMonthlyDemand <= 0 && currentStock > 0) {
        return;
      }

      const targetSafetyStock = Math.max(
        Math.ceil(effectiveMonthlyDemand * 1.25),
        stockData.minQuantity
      );

      const suggestedRestock = Math.max(0, targetSafetyStock - currentStock);

      let status: 'Critical' | 'Low Stock' | 'Adequate' = 'Adequate';
      if (currentStock === 0 || currentStock < effectiveMonthlyDemand * 0.3) {
        status = 'Critical';
      } else if (currentStock < effectiveMonthlyDemand) {
        status = 'Low Stock';
      } else {
        status = 'Adequate';
      }

      forecastCandidates.push({
        rank: 0,
        size,
        gsm,
        currentStock,
        monthlyConsumption: effectiveMonthlyDemand,
        suggestedRestock,
        status
      });
    });

    forecastCandidates.sort((a, b) => {
      if (b.suggestedRestock !== a.suggestedRestock) {
        return b.suggestedRestock - a.suggestedRestock;
      }
      return a.currentStock - b.currentStock;
    });

    return forecastCandidates.slice(0, 5).map((row, idx) => ({
      ...row,
      rank: idx + 1
    }));
  };

  const sectionA = buildConsumptionRows(current280Map, prev280Map, '280');
  const sectionB = buildConsumptionRows(current200Map, prev200Map, '200');
  const sectionC = buildForecastRows(current280Map, allTime280Map, '280');
  const sectionD = buildForecastRows(current200Map, allTime200Map, '200');

  const totalOut280 = sectionA.reduce((acc, r) => acc + r.totalOut, 0);
  const totalPrevOut280 = sectionA.reduce((acc, r) => acc + r.prevOut, 0);
  const changePct280 = totalPrevOut280 > 0
    ? Number((((totalOut280 - totalPrevOut280) / totalPrevOut280) * 100).toFixed(1))
    : null;

  const totalOut200 = sectionB.reduce((acc, r) => acc + r.totalOut, 0);
  const totalPrevOut200 = sectionB.reduce((acc, r) => acc + r.prevOut, 0);
  const changePct200 = totalPrevOut200 > 0
    ? Number((((totalOut200 - totalPrevOut200) / totalPrevOut200) * 100).toFixed(1))
    : null;

  const totalRestock280 = sectionC.reduce((acc, r) => acc + r.suggestedRestock, 0);
  const totalRestock200 = sectionD.reduce((acc, r) => acc + r.suggestedRestock, 0);

  return {
    prevMonthName,
    prevYearStr,
    sectionA,
    sectionB,
    sectionC,
    sectionD,
    totalOut280,
    totalPrevOut280,
    changePct280,
    totalOut200,
    totalPrevOut200,
    changePct200,
    totalRestock280,
    totalRestock200,
  };
}

export function exportForecastEngineToXLSX(
  stockOutLogs: any[],
  inventory: any[],
  forecastMonth: string,
  forecastYear: string
) {
  try {
    const analytics = calculateForecastAnalytics(stockOutLogs, inventory, forecastMonth, forecastYear);
    const wb = XLSX.utils.book_new();

    const summaryData = [
      ['ENERPACK INVENTORY — CONSUMPTION-BASED FORECAST ENGINE'],
      [`PERIOD: ${forecastMonth} ${forecastYear}`],
      [`PREVIOUS PERIOD: ${analytics.prevMonthName} ${analytics.prevYearStr}`],
      [`GENERATED AT: ${new Date().toLocaleString()}`],
      [''],
      ['METRIC', 'VALUE', 'UNIT'],
      ['GSM 280 Total Consumption (Top 10)', analytics.totalOut280, 'Sheets / Units'],
      ['GSM 200 Total Consumption (Top 10)', analytics.totalOut200, 'Sheets / Units'],
      ['GSM 280 Forecast Requirement (Top 5)', analytics.totalRestock280, 'Sheets / Units'],
      ['GSM 200 Forecast Requirement (Top 5)', analytics.totalRestock200, 'Sheets / Units']
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'KPI Summary');

    const aData = analytics.sectionA.map(row => ({
      'RANK': row.rank,
      'SIZE': row.size,
      'GSM': row.gsm,
      [`TOTAL CONSUMPTION (${forecastMonth})`]: row.totalOut,
      [`PREVIOUS MONTH (${analytics.prevMonthName})`]: row.prevOut,
      'CHANGE %': row.changePct !== null ? `${row.changePct}%` : 'NEW',
      'TREND': row.trend.toUpperCase()
    }));
    const wsA = XLSX.utils.json_to_sheet(aData.length > 0 ? aData : [{ 'STATUS': 'No records for period' }]);
    XLSX.utils.book_append_sheet(wb, wsA, 'Consumption GSM 280');

    const bData = analytics.sectionB.map(row => ({
      'RANK': row.rank,
      'SIZE': row.size,
      'GSM': row.gsm,
      [`TOTAL CONSUMPTION (${forecastMonth})`]: row.totalOut,
      [`PREVIOUS MONTH (${analytics.prevMonthName})`]: row.prevOut,
      'CHANGE %': row.changePct !== null ? `${row.changePct}%` : 'NEW',
      'TREND': row.trend.toUpperCase()
    }));
    const wsB = XLSX.utils.json_to_sheet(bData.length > 0 ? bData : [{ 'STATUS': 'No records for period' }]);
    XLSX.utils.book_append_sheet(wb, wsB, 'Consumption GSM 200');

    const cData = analytics.sectionC.map(row => ({
      'RANK': row.rank,
      'SIZE': row.size,
      'GSM': row.gsm,
      'CURRENT WAREHOUSE STOCK': row.currentStock,
      'MONTHLY RUN RATE': row.monthlyConsumption,
      'SUGGESTED RESTOCK REQUIREMENT': row.suggestedRestock,
      'STATUS': row.status
    }));
    const wsC = XLSX.utils.json_to_sheet(cData.length > 0 ? cData : [{ 'STATUS': 'No records for period' }]);
    XLSX.utils.book_append_sheet(wb, wsC, 'Forecast Req GSM 280');

    const dData = analytics.sectionD.map(row => ({
      'RANK': row.rank,
      'SIZE': row.size,
      'GSM': row.gsm,
      'CURRENT WAREHOUSE STOCK': row.currentStock,
      'MONTHLY RUN RATE': row.monthlyConsumption,
      'SUGGESTED RESTOCK REQUIREMENT': row.suggestedRestock,
      'STATUS': row.status
    }));
    const wsD = XLSX.utils.json_to_sheet(dData.length > 0 ? dData : [{ 'STATUS': 'No records for period' }]);
    XLSX.utils.book_append_sheet(wb, wsD, 'Forecast Req GSM 200');

    XLSX.writeFile(wb, `Enerpack_Forecast_Engine_${forecastMonth}_${forecastYear}.xlsx`);
    toast.success('Forecast Engine Excel workbook exported successfully!');
  } catch (err: any) {
    console.error('Failed to export Excel:', err);
    toast.error('Failed to export Excel spreadsheet.');
  }
}

export function exportForecastEngineToPDF(
  stockOutLogs: any[],
  inventory: any[],
  forecastMonth: string,
  forecastYear: string
) {
  try {
    const analytics = calculateForecastAnalytics(stockOutLogs, inventory, forecastMonth, forecastYear);
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageTitle = 'ENERPACK INVENTORY — DEMAND FORECAST & CONSUMPTION ENGINE';

    doc.setFillColor(10, 61, 98);
    doc.rect(0, 0, 210, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(pageTitle, 14, 12);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Period: ${forecastMonth} ${forecastYear} | Compared with: ${analytics.prevMonthName} ${analytics.prevYearStr} | Date: ${new Date().toLocaleDateString()}`, 14, 19);

    let currentY = 32;

    autoTable(doc, {
      startY: currentY,
      head: [['METRIC SUMMARY', 'GSM 280', 'GSM 200', 'TOTAL']],
      body: [
        [
          'Total Consumption (Units)', 
          `${analytics.totalOut280} Units`, 
          `${analytics.totalOut200} Units`, 
          `${analytics.totalOut280 + analytics.totalOut200} Units`
        ],
        [
          'Suggested Inbound Restock Req (Units)', 
          `${analytics.totalRestock280} Units`, 
          `${analytics.totalRestock200} Units`, 
          `${analytics.totalRestock280 + analytics.totalRestock200} Units`
        ]
      ],
      theme: 'grid',
      styles: { fontSize: 8, font: 'helvetica' },
      headStyles: { fillColor: [14, 165, 233], textColor: 255, fontStyle: 'bold' }
    });

    // @ts-ignore
    currentY = (doc as any).lastAutoTable.finalY + 8;

    doc.setTextColor(10, 61, 98);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.text('SECTION A: CONSUMPTION — GSM 280 (TOP 10 HIGH-MOVING SIZES)', 14, currentY);

    const tableABody = analytics.sectionA.map(r => [
      r.rank,
      r.size,
      r.gsm,
      `${r.totalOut} Units`,
      `${r.prevOut} Units`,
      r.changePct !== null ? `${r.changePct > 0 ? '+' : ''}${r.changePct}%` : 'NEW',
      r.trend === 'up' ? '▲ UP' : r.trend === 'down' ? '▼ DOWN' : '— FLAT'
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [['Rank', 'Size', 'GSM', 'Total Consumption', 'Prev Month', 'Change %', 'Trend']],
      body: tableABody.length > 0 ? tableABody : [['—', 'No consumption records found for this period', '—', '—', '—', '—', '—']],
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [225, 29, 72], textColor: 255 }
    });

    // @ts-ignore
    currentY = (doc as any).lastAutoTable.finalY + 8;

    doc.setTextColor(10, 61, 98);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.text('SECTION B: CONSUMPTION — GSM 200 (TOP 10 HIGH-MOVING SIZES)', 14, currentY);

    const tableBBody = analytics.sectionB.map(r => [
      r.rank,
      r.size,
      r.gsm,
      `${r.totalOut} Units`,
      `${r.prevOut} Units`,
      r.changePct !== null ? `${r.changePct > 0 ? '+' : ''}${r.changePct}%` : 'NEW',
      r.trend === 'up' ? '▲ UP' : r.trend === 'down' ? '▼ DOWN' : '— FLAT'
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [['Rank', 'Size', 'GSM', 'Total Consumption', 'Prev Month', 'Change %', 'Trend']],
      body: tableBBody.length > 0 ? tableBBody : [['—', 'No consumption records found for this period', '—', '—', '—', '—', '—']],
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [225, 29, 72], textColor: 255 }
    });

    doc.addPage();
    currentY = 18;

    doc.setTextColor(10, 61, 98);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.text('SECTION C: FORECAST REQUIREMENTS — GSM 280 (TOP 5 SIZES)', 14, currentY);

    const tableCBody = analytics.sectionC.map(r => [
      r.rank,
      r.size,
      r.gsm,
      `${r.currentStock} Units`,
      `${r.monthlyConsumption} Units`,
      `${r.suggestedRestock} Units`,
      r.status.toUpperCase()
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [['Rank', 'Size', 'GSM', 'Current Stock', 'Monthly Run Rate', 'Required Refill', 'Stock Status']],
      body: tableCBody.length > 0 ? tableCBody : [['—', 'No forecast requirement records available', '—', '—', '—', '—', '—']],
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [2, 132, 199], textColor: 255 }
    });

    // @ts-ignore
    currentY = (doc as any).lastAutoTable.finalY + 8;

    doc.setTextColor(10, 61, 98);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.text('SECTION D: FORECAST REQUIREMENTS — GSM 200 (TOP 5 SIZES)', 14, currentY);

    const tableDBody = analytics.sectionD.map(r => [
      r.rank,
      r.size,
      r.gsm,
      `${r.currentStock} Units`,
      `${r.monthlyConsumption} Units`,
      `${r.suggestedRestock} Units`,
      r.status.toUpperCase()
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [['Rank', 'Size', 'GSM', 'Current Stock', 'Monthly Run Rate', 'Required Refill', 'Stock Status']],
      body: tableDBody.length > 0 ? tableDBody : [['—', 'No forecast requirement records available', '—', '—', '—', '—', '—']],
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [2, 132, 199], textColor: 255 }
    });

    doc.save(`Enerpack_Forecast_Engine_${forecastMonth}_${forecastYear}.pdf`);
    toast.success('Forecast Engine PDF report exported successfully!');
  } catch (err: any) {
    console.error('Failed to export PDF:', err);
    toast.error('Failed to export PDF document.');
  }
}

export interface DemandForecastEngineProps {
  stockOutLogs: any[];
  inventory: any[];
  setActiveTab: (tab: string) => void;
  forecastMonth: string;
  setForecastMonth: (month: string) => void;
  forecastYear: string;
  setForecastYear: (year: string) => void;
}

export const DemandForecastEngine: React.FC<DemandForecastEngineProps> = ({
  stockOutLogs,
  inventory,
  setActiveTab,
  forecastMonth,
  setForecastMonth,
  forecastYear,
  setForecastYear,
}) => {
  const processedAnalytics = useMemo(() => {
    return calculateForecastAnalytics(stockOutLogs, inventory, forecastMonth, forecastYear);
  }, [stockOutLogs, inventory, forecastMonth, forecastYear]);

  return (
    <div className="space-y-8 pb-12 font-sans bg-slate-50/40">
      {/* Top Toolbar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveTab('Dashboard')}
            className="p-2.5 hover:bg-slate-100 rounded-2xl border border-slate-200/80 transition-colors text-slate-700"
            title="Back to Dashboard"
          >
            <ChevronRight className="rotate-180" size={22} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              FORECAST ENGINE
            </h1>
            <p className="text-xs font-bold text-[#0ea5e9] uppercase tracking-widest">
              ANALYTICS & REQUIREMENTS
            </p>
          </div>
        </div>

        {/* Filters and Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-slate-400" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Month:</span>
              <select 
                value={forecastMonth} 
                onChange={(e) => setForecastMonth(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#0ea5e9]/30"
              >
                <option value="All">All Months</option>
                {FORECAST_MONTH_NAMES.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="h-4 w-px bg-slate-300" />

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Year:</span>
              <select 
                value={forecastYear} 
                onChange={(e) => setForecastYear(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#0ea5e9]/30"
              >
                <option value="All">All Years</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => exportForecastEngineToPDF(stockOutLogs, inventory, forecastMonth, forecastYear)}
              className="flex items-center gap-2 bg-rose-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-sm active:scale-95"
            >
              <FileText size={16} /> PDF
            </button>
            <button 
              onClick={() => exportForecastEngineToXLSX(stockOutLogs, inventory, forecastMonth, forecastYear)}
              className="flex items-center gap-2 bg-[#0ea5e9] text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#0284c7] transition-all shadow-sm active:scale-95"
            >
              <FileSpreadsheet size={16} /> EXCEL
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Consumption GSM 280 */}
        <div className="bg-[#fff5f5] p-6 rounded-3xl border border-rose-100 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
                Outbound • GSM 280
              </span>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                {processedAnalytics.totalOut280.toLocaleString()}
                <span className="text-xs font-bold text-slate-500 ml-1">pcs</span>
              </h3>
            </div>
            <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-rose-200">
              <ArrowUp size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-rose-200/50 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500 text-[11px]">Prev ({processedAnalytics.prevMonthName}): {processedAnalytics.totalPrevOut280.toLocaleString()}</span>
            {processedAnalytics.changePct280 !== null && (
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                processedAnalytics.changePct280 > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'
              }`}>
                {processedAnalytics.changePct280 > 0 ? `+${processedAnalytics.changePct280}%` : `${processedAnalytics.changePct280}%`}
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Consumption GSM 200 */}
        <div className="bg-[#fff5f5] p-6 rounded-3xl border border-rose-100 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
                Outbound • GSM 200
              </span>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                {processedAnalytics.totalOut200.toLocaleString()}
                <span className="text-xs font-bold text-slate-500 ml-1">pcs</span>
              </h3>
            </div>
            <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-rose-200">
              <ArrowUp size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-rose-200/50 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500 text-[11px]">Prev ({processedAnalytics.prevMonthName}): {processedAnalytics.totalPrevOut200.toLocaleString()}</span>
            {processedAnalytics.changePct200 !== null && (
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                processedAnalytics.changePct200 > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'
              }`}>
                {processedAnalytics.changePct200 > 0 ? `+${processedAnalytics.changePct200}%` : `${processedAnalytics.changePct200}%`}
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Forecast Requirement GSM 280 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-[#0ea5e9] uppercase tracking-widest">
                Forecast Refill • GSM 280
              </span>
              <h3 className="text-3xl font-black text-[#0284c7] tracking-tight">
                {processedAnalytics.totalRestock280.toLocaleString()}
                <span className="text-xs font-bold text-slate-500 ml-1">pcs</span>
              </h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl flex items-center justify-center shadow-xs">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500 text-[11px]">Top 5 Shortfall Need</span>
            <span className="text-blue-600 text-[11px] font-black">Inbound Target</span>
          </div>
        </div>

        {/* Card 4: Forecast Requirement GSM 200 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-[#0ea5e9] uppercase tracking-widest">
                Forecast Refill • GSM 200
              </span>
              <h3 className="text-3xl font-black text-[#0284c7] tracking-tight">
                {processedAnalytics.totalRestock200.toLocaleString()}
                <span className="text-xs font-bold text-slate-500 ml-1">pcs</span>
              </h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl flex items-center justify-center shadow-xs">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500 text-[11px]">Top 5 Shortfall Need</span>
            <span className="text-blue-600 text-[11px] font-black">Inbound Target</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 1: HISTORICAL CONSUMPTION — GSM 280 (LEFT) & GSM 200 (RIGHT) */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">
            HISTORICAL CONSUMPTION (OUTBOUND VELOCITY)
          </h2>
          <span className="text-xs text-slate-400 font-bold">• GSM 280 (Left) & GSM 200 (Right)</span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
          {/* ------------------------------------------------------------------------- */}
          {/* SECTION A — HISTORICAL CONSUMPTION, GSM 280 (LEFT) */}
          {/* ------------------------------------------------------------------------- */}
          <div className="bg-white p-6 lg:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black shrink-0">
                    A
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                        CONSUMPTION — GSM 280
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700">
                        TOP 10 HIGH-MOVING
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-400">
                      Authoritative outbound records for GSM 280 in {forecastMonth} {forecastYear}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-400 shrink-0">
                  {processedAnalytics.sectionA.length} sizes
                </span>
              </div>

              {/* Section A Visual Chart */}
              {processedAnalytics.sectionA.length > 0 && (
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
                      <BarChart2 size={15} className="text-rose-500" />
                      Consumption Distribution
                    </span>
                    <span className="text-[10px] font-bold text-rose-600">
                      Units Outbound
                    </span>
                  </div>
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={processedAnalytics.sectionA} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="size" 
                          tick={{ fontSize: 9.5, fontWeight: 700, fill: '#64748b' }} 
                          angle={-25} 
                          textAnchor="end" 
                          interval={0}
                        />
                        <YAxis tick={{ fontSize: 9.5, fontWeight: 700, fill: '#64748b' }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '1rem', border: '1px solid #fecdd3', backgroundColor: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                          formatter={(val: any) => [`${Number(val).toLocaleString()} Units`, 'Consumption']}
                        />
                        <Bar dataKey="totalOut" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Section A Data Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-3 text-center w-12">RANK</th>
                      <th className="py-3 px-3">SIZE</th>
                      <th className="py-3 px-2">GSM</th>
                      <th className="py-3 px-3 text-right">TOTAL OUT</th>
                      <th className="py-3 px-3 text-right">PREV ({processedAnalytics.prevMonthName})</th>
                      <th className="py-3 px-3 text-right">CHANGE %</th>
                      <th className="py-3 px-2 text-center">TREND</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {processedAnalytics.sectionA.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <div className="max-w-xs mx-auto space-y-2">
                            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-400 flex items-center justify-center mx-auto">
                              <Layers size={20} />
                            </div>
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">No Consumption Records</p>
                            <p className="text-[11px] text-slate-400">
                              No valid outbound consumption records found for GSM 280 in {forecastMonth} {forecastYear}.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      processedAnalytics.sectionA.map((row) => (
                        <tr key={row.size} className="hover:bg-rose-50/30 transition-colors">
                          <td className="py-3 px-3 text-center font-black">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black ${
                              row.rank === 1 
                                ? 'bg-rose-500 text-white shadow-xs' 
                                : row.rank <= 3 
                                ? 'bg-rose-100 text-rose-700' 
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {row.rank}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-black text-slate-900 text-xs">{row.size}</td>
                          <td className="py-3 px-2 font-bold text-slate-500">{row.gsm}</td>
                          <td className="py-3 px-3 text-right font-black text-rose-600 text-xs">
                            {row.totalOut.toLocaleString()} <span className="text-[9px] font-bold text-slate-400">pcs</span>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-600 text-xs">
                            {row.prevOut.toLocaleString()} <span className="text-[9px] text-slate-400">pcs</span>
                          </td>
                          <td className="py-3 px-3 text-right font-black">
                            {row.changePct !== null ? (
                              <span className={`px-1.5 py-0.5 rounded-lg text-[10px] ${
                                row.changePct > 0 
                                  ? 'bg-rose-100 text-rose-700' 
                                  : row.changePct < 0 
                                  ? 'bg-slate-100 text-slate-700' 
                                  : 'text-slate-500'
                              }`}>
                                {row.changePct > 0 ? `+${row.changePct}%` : `${row.changePct}%`}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-lg text-[9px] bg-amber-100 text-amber-700 font-bold">
                                NEW
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {row.trend === 'up' && (
                              <span className="inline-flex items-center justify-center text-rose-600" title="Increased Outbound">
                                <ArrowUp size={15} strokeWidth={2.5} />
                              </span>
                            )}
                            {row.trend === 'down' && (
                              <span className="inline-flex items-center justify-center text-slate-400" title="Decreased Outbound">
                                <ArrowDown size={15} strokeWidth={2.5} />
                              </span>
                            )}
                            {row.trend === 'flat' && (
                              <span className="inline-flex items-center justify-center text-slate-300" title="Stable">
                                <Minus size={15} strokeWidth={2.5} />
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------------- */}
          {/* SECTION B — HISTORICAL CONSUMPTION, GSM 200 (RIGHT) */}
          {/* ------------------------------------------------------------------------- */}
          <div className="bg-white p-6 lg:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black shrink-0">
                    B
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                        CONSUMPTION — GSM 200
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700">
                        TOP 10 HIGH-MOVING
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-400">
                      Authoritative outbound records for GSM 200 in {forecastMonth} {forecastYear}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-400 shrink-0">
                  {processedAnalytics.sectionB.length} sizes
                </span>
              </div>

              {/* Section B Visual Chart */}
              {processedAnalytics.sectionB.length > 0 && (
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
                      <BarChart2 size={15} className="text-rose-500" />
                      Consumption Distribution
                    </span>
                    <span className="text-[10px] font-bold text-rose-600">
                      Units Outbound
                    </span>
                  </div>
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={processedAnalytics.sectionB} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="size" 
                          tick={{ fontSize: 9.5, fontWeight: 700, fill: '#64748b' }} 
                          angle={-25} 
                          textAnchor="end" 
                          interval={0}
                        />
                        <YAxis tick={{ fontSize: 9.5, fontWeight: 700, fill: '#64748b' }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '1rem', border: '1px solid #fecdd3', backgroundColor: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                          formatter={(val: any) => [`${Number(val).toLocaleString()} Units`, 'Consumption']}
                        />
                        <Bar dataKey="totalOut" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Section B Data Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-3 text-center w-12">RANK</th>
                      <th className="py-3 px-3">SIZE</th>
                      <th className="py-3 px-2">GSM</th>
                      <th className="py-3 px-3 text-right">TOTAL OUT</th>
                      <th className="py-3 px-3 text-right">PREV ({processedAnalytics.prevMonthName})</th>
                      <th className="py-3 px-3 text-right">CHANGE %</th>
                      <th className="py-3 px-2 text-center">TREND</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {processedAnalytics.sectionB.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <div className="max-w-xs mx-auto space-y-2">
                            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-400 flex items-center justify-center mx-auto">
                              <Layers size={20} />
                            </div>
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">No Consumption Records</p>
                            <p className="text-[11px] text-slate-400">
                              No valid outbound consumption records found for GSM 200 in {forecastMonth} {forecastYear}.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      processedAnalytics.sectionB.map((row) => (
                        <tr key={row.size} className="hover:bg-rose-50/30 transition-colors">
                          <td className="py-3 px-3 text-center font-black">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black ${
                              row.rank === 1 
                                ? 'bg-rose-500 text-white shadow-xs' 
                                : row.rank <= 3 
                                ? 'bg-rose-100 text-rose-700' 
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {row.rank}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-black text-slate-900 text-xs">{row.size}</td>
                          <td className="py-3 px-2 font-bold text-slate-500">{row.gsm}</td>
                          <td className="py-3 px-3 text-right font-black text-rose-600 text-xs">
                            {row.totalOut.toLocaleString()} <span className="text-[9px] font-bold text-slate-400">pcs</span>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-600 text-xs">
                            {row.prevOut.toLocaleString()} <span className="text-[9px] text-slate-400">pcs</span>
                          </td>
                          <td className="py-3 px-3 text-right font-black">
                            {row.changePct !== null ? (
                              <span className={`px-1.5 py-0.5 rounded-lg text-[10px] ${
                                row.changePct > 0 
                                  ? 'bg-rose-100 text-rose-700' 
                                  : row.changePct < 0 
                                  ? 'bg-slate-100 text-slate-700' 
                                  : 'text-slate-500'
                              }`}>
                                {row.changePct > 0 ? `+${row.changePct}%` : `${row.changePct}%`}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-lg text-[9px] bg-amber-100 text-amber-700 font-bold">
                                NEW
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {row.trend === 'up' && (
                              <span className="inline-flex items-center justify-center text-rose-600" title="Increased Outbound">
                                <ArrowUp size={15} strokeWidth={2.5} />
                              </span>
                            )}
                            {row.trend === 'down' && (
                              <span className="inline-flex items-center justify-center text-slate-400" title="Decreased Outbound">
                                <ArrowDown size={15} strokeWidth={2.5} />
                              </span>
                            )}
                            {row.trend === 'flat' && (
                              <span className="inline-flex items-center justify-center text-slate-300" title="Stable">
                                <Minus size={15} strokeWidth={2.5} />
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 2: FORECAST REQUIREMENTS — GSM 280 (LEFT) & GSM 200 (RIGHT) */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]" />
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">
            FORECAST REQUIREMENTS (INBOUND REPLENISHMENT)
          </h2>
          <span className="text-xs text-slate-400 font-bold">• GSM 280 (Left) & GSM 200 (Right)</span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
          {/* ------------------------------------------------------------------------- */}
          {/* SECTION C — FORECAST REQUIREMENTS, GSM 280 (LEFT) */}
          {/* ------------------------------------------------------------------------- */}
          <div className="bg-white p-6 lg:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black shrink-0">
                    C
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                        FORECAST REQUIREMENTS — GSM 280
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
                        TOP 5 REQUIRED
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-400">
                      Replenishment targets based on consumption run-rate vs live inventory
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-blue-600 shrink-0">
                  By refill need
                </span>
              </div>

              {/* Section C Visual Comparison Chart */}
              {processedAnalytics.sectionC.length > 0 && (
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp size={15} className="text-blue-500" />
                      Current Stock vs Required Refill
                    </span>
                    <div className="flex items-center gap-3 text-[10px] font-bold">
                      <span className="flex items-center gap-1 text-slate-600">
                        <span className="w-2 h-2 rounded bg-slate-400" /> Stock
                      </span>
                      <span className="flex items-center gap-1 text-blue-600">
                        <span className="w-2 h-2 rounded bg-[#0284c7]" /> Refill
                      </span>
                    </div>
                  </div>
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={processedAnalytics.sectionC} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="size" tick={{ fontSize: 9.5, fontWeight: 700, fill: '#64748b' }} />
                        <YAxis tick={{ fontSize: 9.5, fontWeight: 700, fill: '#64748b' }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '1rem', border: '1px solid #bfdbfe', backgroundColor: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="currentStock" name="Current Stock" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="suggestedRestock" name="Required Refill" fill="#0284c7" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Section C Data Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-3 text-center w-12">RANK</th>
                      <th className="py-3 px-3">SIZE</th>
                      <th className="py-3 px-2">GSM</th>
                      <th className="py-3 px-3 text-right">IN STOCK</th>
                      <th className="py-3 px-3 text-right">RUN RATE</th>
                      <th className="py-3 px-3 text-right">REQUIRED REFILL</th>
                      <th className="py-3 px-3 text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {processedAnalytics.sectionC.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <div className="max-w-xs mx-auto space-y-2">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-400 flex items-center justify-center mx-auto">
                              <CheckCircle2 size={20} />
                            </div>
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">No Forecast Requirements</p>
                            <p className="text-[11px] text-slate-400">
                              Warehouse stock levels are adequate for current consumption trends.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      processedAnalytics.sectionC.map((row) => (
                        <tr key={row.size} className="hover:bg-blue-50/20 transition-colors">
                          <td className="py-3 px-3 text-center font-black">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black ${
                              row.rank === 1 
                                ? 'bg-blue-600 text-white shadow-xs' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {row.rank}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-black text-slate-900 text-xs">{row.size}</td>
                          <td className="py-3 px-2 font-bold text-slate-500">{row.gsm}</td>
                          <td className="py-3 px-3 text-right font-black text-slate-700 text-xs">
                            {row.currentStock.toLocaleString()} <span className="text-[9px] text-slate-400">pcs</span>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-600 text-xs">
                            {row.monthlyConsumption.toLocaleString()} <span className="text-[9px] text-slate-400">pcs</span>
                          </td>
                          <td className="py-3 px-3 text-right font-black text-[#0284c7] text-xs">
                            {row.suggestedRestock.toLocaleString()} <span className="text-[9px] font-bold text-blue-400">pcs</span>
                          </td>
                          <td className="py-3 px-3 text-center font-black">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] inline-flex items-center gap-1 ${
                              row.status === 'Critical' 
                                ? 'bg-rose-100 text-rose-700' 
                                : row.status === 'Low Stock' 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {row.status === 'Critical' && <AlertTriangle size={11} />}
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------------- */}
          {/* SECTION D — FORECAST REQUIREMENTS, GSM 200 (RIGHT) */}
          {/* ------------------------------------------------------------------------- */}
          <div className="bg-white p-6 lg:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black shrink-0">
                    D
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                        FORECAST REQUIREMENTS — GSM 200
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
                        TOP 5 REQUIRED
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-400">
                      Replenishment targets based on consumption run-rate vs live inventory
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-blue-600 shrink-0">
                  By refill need
                </span>
              </div>

              {/* Section D Visual Comparison Chart */}
              {processedAnalytics.sectionD.length > 0 && (
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp size={15} className="text-blue-500" />
                      Current Stock vs Required Refill
                    </span>
                    <div className="flex items-center gap-3 text-[10px] font-bold">
                      <span className="flex items-center gap-1 text-slate-600">
                        <span className="w-2 h-2 rounded bg-slate-400" /> Stock
                      </span>
                      <span className="flex items-center gap-1 text-blue-600">
                        <span className="w-2 h-2 rounded bg-[#0284c7]" /> Refill
                      </span>
                    </div>
                  </div>
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={processedAnalytics.sectionD} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="size" tick={{ fontSize: 9.5, fontWeight: 700, fill: '#64748b' }} />
                        <YAxis tick={{ fontSize: 9.5, fontWeight: 700, fill: '#64748b' }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '1rem', border: '1px solid #bfdbfe', backgroundColor: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="currentStock" name="Current Stock" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="suggestedRestock" name="Required Refill" fill="#0284c7" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Section D Data Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-3 text-center w-12">RANK</th>
                      <th className="py-3 px-3">SIZE</th>
                      <th className="py-3 px-2">GSM</th>
                      <th className="py-3 px-3 text-right">IN STOCK</th>
                      <th className="py-3 px-3 text-right">RUN RATE</th>
                      <th className="py-3 px-3 text-right">REQUIRED REFILL</th>
                      <th className="py-3 px-3 text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {processedAnalytics.sectionD.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <div className="max-w-xs mx-auto space-y-2">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-400 flex items-center justify-center mx-auto">
                              <CheckCircle2 size={20} />
                            </div>
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">No Forecast Requirements</p>
                            <p className="text-[11px] text-slate-400">
                              Warehouse stock levels are adequate for current consumption trends.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      processedAnalytics.sectionD.map((row) => (
                        <tr key={row.size} className="hover:bg-blue-50/20 transition-colors">
                          <td className="py-3 px-3 text-center font-black">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black ${
                              row.rank === 1 
                                ? 'bg-blue-600 text-white shadow-xs' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {row.rank}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-black text-slate-900 text-xs">{row.size}</td>
                          <td className="py-3 px-2 font-bold text-slate-500">{row.gsm}</td>
                          <td className="py-3 px-3 text-right font-black text-slate-700 text-xs">
                            {row.currentStock.toLocaleString()} <span className="text-[9px] text-slate-400">pcs</span>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-600 text-xs">
                            {row.monthlyConsumption.toLocaleString()} <span className="text-[9px] text-slate-400">pcs</span>
                          </td>
                          <td className="py-3 px-3 text-right font-black text-[#0284c7] text-xs">
                            {row.suggestedRestock.toLocaleString()} <span className="text-[9px] font-bold text-blue-400">pcs</span>
                          </td>
                          <td className="py-3 px-3 text-center font-black">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] inline-flex items-center gap-1 ${
                              row.status === 'Critical' 
                                ? 'bg-rose-100 text-rose-700' 
                                : row.status === 'Low Stock' 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {row.status === 'Critical' && <AlertTriangle size={11} />}
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
