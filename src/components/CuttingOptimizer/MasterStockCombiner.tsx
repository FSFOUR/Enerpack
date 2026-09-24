import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  DimensionUnit, 
  OptimizationGoal, 
  StockInputItem, 
  NormalizedStock, 
  SingleSheetSolution, 
  ZeroWasteTarget, 
  MultiStockCombinationResult,
  convertToMm, 
  convertFromMm, 
  formatDimension, 
  formatArea, 
  parseSizeString, 
  calculateZeroWasteTargets, 
  evaluateStockSheet, 
  optimizeMultiStockCombination 
} from '../../utils/cuttingOptimizer';
import { CuttingDiagram } from './CuttingDiagram';
import { 
  Zap, 
  Layers, 
  Scissors, 
  Target, 
  Save, 
  Printer, 
  FileSpreadsheet, 
  FileText, 
  Copy, 
  Plus, 
  Trash2, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronRight, 
  Info, 
  ArrowRight, 
  Box, 
  TrendingDown, 
  TrendingUp, 
  Package, 
  RefreshCw,
  Check,
  Building2,
  Calendar,
  Star,
  Award,
  Search,
  ArrowDownUp,
  Filter,
  Warehouse,
  Database,
  ArrowUpRight,
  SlidersHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';

interface MasterStockCombinerProps {
  inventory: { title: string; subSections: { title: string; items: any[] }[] }[];
  onReserveStock?: (stockId: string, size: string, gsm: string, sheets: number) => Promise<boolean>;
  isAdmin?: boolean;
  onNavigateToInventory?: () => void;
}

export interface FiveStockInput {
  id: number;
  width: string;
  height: string;
}

export const DEFAULT_FIVE_STOCKS: FiveStockInput[] = [
  { id: 1, width: '47', height: '64' },
  { id: 2, width: '57', height: '96' },
  { id: 3, width: '83', height: '56' },
  { id: 4, width: '22', height: '65' },
  { id: 5, width: '65', height: '97.5' },
  { id: 6, width: '70', height: '100' },
];

export const MasterStockCombiner: React.FC<MasterStockCombinerProps> = ({
  inventory,
  onReserveStock,
  isAdmin = false,
  onNavigateToInventory
}) => {
  // --- Inputs State ---
  const [itemWidth, setItemWidth] = useState<string>('23');
  const [itemHeight, setItemHeight] = useState<string>('32');
  const [itemUnit, setItemUnit] = useState<DimensionUnit>('cm');
  const [fiveStocks, setFiveStocks] = useState<FiveStockInput[]>(DEFAULT_FIVE_STOCKS);
  const [requiredQty, setRequiredQty] = useState<string>('1000');
  const [kerf, setKerf] = useState<string>('0');
  const [kerfUnit, setKerfUnit] = useState<DimensionUnit>('cm');
  const [edgeTrim, setEdgeTrim] = useState<string>('0');
  const [edgeTrimUnit, setEdgeTrimUnit] = useState<DimensionUnit>('mm');

  // Optimization Settings
  const [maxWastePct, setMaxWastePct] = useState<number>(3.0);
  const [goal, setGoal] = useState<OptimizationGoal>('balanced');
  const [allowRotation, setAllowRotation] = useState<boolean>(true);
  const [allowMixed, setAllowMixed] = useState<boolean>(true);
  const [includeKerf, setIncludeKerf] = useState<boolean>(false);
  const [includeEdgeTrim, setIncludeEdgeTrim] = useState<boolean>(false);
  const [generateTargets, setGenerateTargets] = useState<boolean>(true);

  // Target GSM for optimization (e.g. '280', '250', or 'all')
  const [targetGsm, setTargetGsm] = useState<string>('280');
  const [strictGsmFilter, setStrictGsmFilter] = useState<boolean>(false);

  // Stock View mode: 'top6' (default - top 6 best matching sizes ranked higher to low) vs 'all' (all sheets table)
  const [stockViewMode, setStockViewMode] = useState<'top6' | 'top5' | 'all'>('top6');
  const [queryGsmFilter, setQueryGsmFilter] = useState<string>('all');
  const [querySearchText, setQuerySearchText] = useState<string>('');

  // Available Stock Sheets list
  const [stockList, setStockList] = useState<StockInputItem[]>([
    { id: 'STK-001', name: '90*66 (280 GSM)', width: 66, length: 90, unit: 'cm', qtyAvailable: 98, gsm: '280', sectionTitle: '280 GSM SECTION', isInventoryItem: true },
    { id: 'STK-002', name: '92*66 (280 GSM)', width: 66, length: 92, unit: 'cm', qtyAvailable: 93, gsm: '280', sectionTitle: '280 GSM SECTION', isInventoryItem: true },
    { id: 'STK-003', name: 'Standard Board 80×110', width: 80, length: 110, unit: 'cm', qtyAvailable: 50, gsm: '250', sectionTitle: '250 GSM', isInventoryItem: false },
    { id: 'STK-004', name: 'Master Sheet 100×120', width: 100, length: 120, unit: 'cm', qtyAvailable: 30, gsm: '280', sectionTitle: '280 GSM', isInventoryItem: false },
    { id: 'STK-005', name: 'Sheet 90×120', width: 90, length: 120, unit: 'cm', qtyAvailable: 45, gsm: '300', sectionTitle: '300 GSM', isInventoryItem: false },
  ]);

  // Optimization Execution State
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [optimizationProgress, setOptimizationProgress] = useState<string>('');
  const [solutions, setSolutions] = useState<SingleSheetSolution[]>([]);
  const [selectedSolutionIndex, setSelectedSolutionIndex] = useState<number>(0);
  const [multiStockResult, setMultiStockResult] = useState<MultiStockCombinationResult | null>(null);
  const [zeroWasteTargets, setZeroWasteTargets] = useState<ZeroWasteTarget[]>([]);
  const [expandedDetailsId, setExpandedDetailsId] = useState<string | null>(null);
  const [resultDetailLevel, setResultDetailLevel] = useState<'minimal' | 'detailed'>('minimal');
  const [activeTabSection, setActiveTabSection] = useState<'summary' | 'grid' | 'plan' | 'targets' | 'combiner' | 'realInventory'>('summary');

  // Real inventory evaluation state
  const [realInventorySolutions, setRealInventorySolutions] = useState<SingleSheetSolution[]>([]);
  const [realInvSearch, setRealInvSearch] = useState<string>('');
  const [realInvGsmFilter, setRealInvGsmFilter] = useState<string>('all');
  const [realInvSortBy, setRealInvSortBy] = useState<'waste' | 'yield' | 'stock'>('waste');

  // Modal / Action states
  const [isSavingJob, setIsSavingJob] = useState(false);
  const [jobCustomer, setJobCustomer] = useState('');
  const [jobProductName, setJobProductName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [reservingStockItem, setReservingStockItem] = useState<{ sol: SingleSheetSolution; sheets: number } | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Helper to extract real inventory stock sheets from Enerpack DB
  const extractStockFromInventory = useCallback((inv: typeof inventory): StockInputItem[] => {
    const extracted: StockInputItem[] = [];
    let counter = 1;

    if (!inv || !Array.isArray(inv)) return extracted;

    inv.forEach(sec => {
      sec.subSections?.forEach(sub => {
        sub.items?.forEach(item => {
          if (!item.size) return;
          // Paper warehouse stock dimensions are in centimeters (cm) unless specified with " or mm
          const isInch = item.size.includes('"') || item.size.toLowerCase().includes('inch');
          const isMm = item.size.toLowerCase().includes('mm');
          const defaultUnit: DimensionUnit = isInch ? 'inch' : (isMm ? 'mm' : 'cm');

          const parsed = parseSizeString(item.size, defaultUnit);
          if (parsed) {
            extracted.push({
              id: `INV-${String(counter++).padStart(3, '0')}`,
              name: `${item.size} (${item.gsm || '280'} GSM)`,
              width: parsed.width,
              length: parsed.length,
              unit: parsed.unit,
              qtyAvailable: Number(item.stock) || 0,
              gsm: String(item.gsm || '').trim(),
              sectionTitle: sec.title,
              subTitle: sub.title,
              isInventoryItem: true
            });
          }
        });
      });
    });

    return extracted;
  }, []);

  // Auto-import real inventory stock sheets from Enerpack DB
  const handleLoadFromInventory = () => {
    const extracted = extractStockFromInventory(inventory);
    if (extracted.length === 0) {
      toast.info('No valid items found in current inventory database.');
      return;
    }

    setStockList(extracted);
    // Populate the available stock slots with top inventory sizes
    const updatedFive = DEFAULT_FIVE_STOCKS.map((slot, idx) => {
      if (extracted[idx]) {
        return {
          id: slot.id,
          width: String(extracted[idx].width),
          height: String(extracted[idx].length)
        };
      }
      return slot;
    });
    setFiveStocks(updatedFive);
    handleOptimize(undefined, undefined, updatedFive);
    toast.success(`Imported & loaded ${extracted.length} real stock sizes from inventory!`);
  };

  const handleUpdateFiveStock = (id: number, field: 'width' | 'height', value: string) => {
    setFiveStocks(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleAddStockRow = () => {
    setFiveStocks(prev => {
      const nextId = prev.length > 0 ? Math.max(...prev.map(p => p.id)) + 1 : 1;
      return [...prev, { id: nextId, width: '', height: '' }];
    });
  };

  const handleRemoveStockRow = (id: number) => {
    setFiveStocks(prev => {
      if (prev.length <= 1) {
        toast.info('At least one available stock option is required.');
        return prev;
      }
      const filtered = prev.filter(s => s.id !== id);
      handleOptimize(undefined, undefined, filtered);
      return filtered;
    });
  };

  const handleResetToTestStocks = () => {
    setFiveStocks(DEFAULT_FIVE_STOCKS);
    setItemWidth('23');
    setItemHeight('32');
    setItemUnit('cm');
    setKerf('0');
    handleOptimize(undefined, undefined, DEFAULT_FIVE_STOCKS, '23', '32', 'cm', '0');
    toast.success('Reset to standard available stock test values (23×32 target)');
  };

  const handleAddCustomStock = () => {
    const newId = `STK-${String(stockList.length + 1).padStart(3, '0')}`;
    setStockList(prev => [
      ...prev,
      {
        id: newId,
        name: `Custom Stock ${newId}`,
        width: 100,
        length: 120,
        unit: 'cm',
        qtyAvailable: 50,
        gsm: '280',
        isInventoryItem: false
      }
    ]);
  };

  const handleRemoveStock = (index: number) => {
    setStockList(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateStockField = (index: number, field: keyof StockInputItem, value: any) => {
    setStockList(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Main Optimization Procedure with 4-Point Priority Hierarchy
  const handleOptimize = (
    stocksToUse?: StockInputItem[],
    gsmParam?: string,
    fiveStocksOverride?: FiveStockInput[],
    overrideW?: string,
    overrideH?: string,
    overrideUnit?: DimensionUnit,
    overrideKerf?: string
  ) => {
    const currentFive = fiveStocksOverride || fiveStocks;
    const currentUnit = overrideUnit || itemUnit;
    const wi = parseFloat(overrideW !== undefined ? overrideW : itemWidth);
    const hi = parseFloat(overrideH !== undefined ? overrideH : itemHeight);
    const kerfVal = overrideKerf !== undefined ? overrideKerf : kerf;
    const k = includeKerf ? (parseFloat(kerfVal) || 0) : 0;
    const et = includeEdgeTrim ? (parseFloat(edgeTrim) || 0) : 0;
    const reqQ = parseInt(requiredQty) || 0;

    const currentGsm = gsmParam !== undefined ? gsmParam : targetGsm;
    const cleanTargetGsm = currentGsm !== 'all' ? currentGsm.replace(/[^0-9]/g, '').trim() : '';

    if (isNaN(wi) || wi <= 0 || isNaN(hi) || hi <= 0) {
      toast.error('Please enter a valid positive item width and height.');
      return;
    }

    // Default to the 5 Available Stocks
    const activeStocks: StockInputItem[] = stocksToUse && stocksToUse.length > 0
      ? stocksToUse
      : currentFive.map(s => {
          const w = parseFloat(s.width) || 0;
          const h = parseFloat(s.height) || 0;
          return {
            id: `Stock ${s.id}`,
            name: `Stock ${s.id} (${s.width} × ${s.height})`,
            width: w,
            length: h,
            unit: currentUnit,
            qtyAvailable: 100,
            isInventoryItem: false,
            sectionTitle: `Available Stock ${s.id}`
          };
        });

    if (activeStocks.length === 0) {
      toast.error('Please add or enter at least one available stock size.');
      return;
    }

    setIsOptimizing(true);
    setOptimizationProgress(
      cleanTargetGsm 
        ? `Evaluating stock sheets for ${cleanTargetGsm} GSM against target piece...`
        : 'Evaluating stock sheets against query dimensions...'
    );

    setTimeout(() => {
      // 1. Filter stocks if strict GSM filtering is enabled
      let candidateStocks = activeStocks;
      if (cleanTargetGsm && strictGsmFilter) {
        const gsmMatched = activeStocks.filter(stk => {
          const stkGsm = String(stk.gsm || '').replace(/[^0-9]/g, '').trim();
          return stkGsm === cleanTargetGsm;
        });
        if (gsmMatched.length > 0) {
          candidateStocks = gsmMatched;
        } else {
          toast.info(`No sheets found matching strictly ${cleanTargetGsm} GSM. Evaluating all available stock sheets.`);
        }
      }

      // 2. Normalize all inputs to mm
      const itemWMm = convertToMm(wi, currentUnit);
      const itemHMm = convertToMm(hi, currentUnit);
      const kerfMm = convertToMm(k, kerfUnit);
      const edgeTrimMm = convertToMm(et, edgeTrimUnit);

      setOptimizationProgress('Analyzing stock sizes & testing orientations...');

      const normalizedStocks: NormalizedStock[] = candidateStocks.map(stk => ({
        id: stk.id,
        name: stk.name || `${stk.width}×${stk.length} ${stk.unit}`,
        originalWidth: stk.width,
        originalLength: stk.length,
        originalUnit: stk.unit,
        widthMm: convertToMm(stk.width, stk.unit),
        lengthMm: convertToMm(stk.length, stk.unit),
        qtyAvailable: stk.qtyAvailable || 0,
        gsm: stk.gsm || (cleanTargetGsm ? cleanTargetGsm : undefined),
        sectionTitle: stk.sectionTitle,
        subTitle: stk.subTitle,
        isInventoryItem: stk.isInventoryItem
      }));

      // 3. Evaluate each stock sheet
      const evaluatedSolutions = normalizedStocks.map(stock => {
        return evaluateStockSheet(
          stock,
          itemWMm,
          itemHMm,
          kerfMm,
          edgeTrimMm,
          allowRotation,
          allowMixed,
          maxWastePct,
          reqQ,
          goal,
          currentUnit
        );
      });

      // Rank solutions using exact Priority Hierarchy:
      // Priority 1: 100% Zero Waste / Exact Match (Waste <= 0.001% or ZERO WASTE)
      // Priority 2: Lowest waste percentage (ascending order)
      // Priority 3: Highest yield (descending order)
      // Priority 4: Best stock-size utilization (higher efficiency, then smaller stock area)
      // Feasible first, Not Feasible last
      const rankedSolutions = [...evaluatedSolutions].sort((a, b) => {
        if (a.isFeasible !== b.isFeasible) {
          return a.isFeasible ? -1 : 1;
        }
        if (!a.isFeasible && !b.isFeasible) return 0;

        // PRIORITY 1: 100% Zero Waste / Exact Match (Waste <= 0.001%)
        const aIsZero = a.totalWastePct <= 0.001 || a.classification === 'ZERO WASTE' || a.classification === 'TRUE ZERO-WASTE';
        const bIsZero = b.totalWastePct <= 0.001 || b.classification === 'ZERO WASTE' || b.classification === 'TRUE ZERO-WASTE';
        if (aIsZero !== bIsZero) {
          return aIsZero ? -1 : 1;
        }
        if (aIsZero && bIsZero) {
          if (b.yieldPerSheet !== a.yieldPerSheet) return b.yieldPerSheet - a.yieldPerSheet;
          return a.stockAreaMm2 - b.stockAreaMm2;
        }

        // PRIORITY 2: Lowest waste percentage (ascending)
        if (Math.abs(a.totalWastePct - b.totalWastePct) > 0.0001) {
          return a.totalWastePct - b.totalWastePct;
        }

        // PRIORITY 3: Highest yield (descending)
        if (b.yieldPerSheet !== a.yieldPerSheet) {
          return b.yieldPerSheet - a.yieldPerSheet;
        }

        // PRIORITY 4: Best stock-size utilization (higher efficiency, then smaller stock area)
        if (Math.abs(b.productEfficiencyPct - a.productEfficiencyPct) > 0.0001) {
          return b.productEfficiencyPct - a.productEfficiencyPct;
        }
        return a.stockAreaMm2 - b.stockAreaMm2;
      });

      // Log Debug Trace for Verification
      console.log('[OPTIMIZER QUERY]', { 
        itemWidth: wi, 
        itemHeight: hi, 
        itemUnit, 
        targetGsm: cleanTargetGsm || 'all', 
        requiredQty: reqQ 
      });
      console.log('[RECORDS LOADED]', activeStocks.length);
      console.log('[CANDIDATES EVALUATED]', evaluatedSolutions.length);
      console.log('[TOP RANKED MATCHES]', rankedSolutions.slice(0, 6).map((s, idx) => ({
        rank: `#${idx + 1}`,
        name: s.stockName,
        size: `${s.originalStockWidth}×${s.originalStockLength} ${s.originalStockUnit}`,
        gsm: s.stockGsm,
        waste: `${s.totalWastePct.toFixed(2)}%`,
        yield: `${s.yieldPerSheet} pcs`,
        classification: s.classification,
        inStock: s.qtyAvailable,
        sheetsReq: s.sheetsRequired,
        shortage: s.shortageSheets
      })));

      setSolutions(rankedSolutions);
      setSelectedSolutionIndex(0);

      // Sync the right column GSM filter
      if (cleanTargetGsm) {
        setQueryGsmFilter(cleanTargetGsm);
      } else {
        setQueryGsmFilter('all');
      }

      // 3. Calculate Zero-Waste Target Sizes
      if (generateTargets) {
        setOptimizationProgress('Calculating theoretical zero-waste targets...');
        const targets = calculateZeroWasteTargets(
          itemWMm,
          itemHMm,
          kerfMm,
          edgeTrimMm,
          allowRotation,
          itemUnit
        );
        setZeroWasteTargets(targets);
      }

      // 4. Calculate Multi-Stock Combination
      if (reqQ > 0) {
        setOptimizationProgress('Generating master multi-stock combination...');
        const multi = optimizeMultiStockCombination(
          rankedSolutions,
          normalizedStocks,
          reqQ,
          goal
        );
        setMultiStockResult(multi);
      } else {
        setMultiStockResult(null);
      }

      // 5. Evaluate Full Real Inventory Stock Sheets from Enerpack Warehouse
      const extractedRealStocks = extractStockFromInventory(inventory);
      const fallbackRealStocks: StockInputItem[] = [
        { id: 'INV-001', name: '70*100 (280 GSM)', width: 70, length: 100, unit: 'cm', qtyAvailable: 1999, gsm: '280', sectionTitle: '280 GSM SECTION', subTitle: '280 REELS & SHEETS', isInventoryItem: true },
        { id: 'INV-002', name: '65*97.5 (280 GSM)', width: 65, length: 97.5, unit: 'cm', qtyAvailable: 340, gsm: '280', sectionTitle: '280 GSM SECTION', subTitle: '280 REELS & SHEETS', isInventoryItem: true },
        { id: 'INV-003', name: '94.5*80.3 (280 GSM)', width: 80.3, length: 94.5, unit: 'cm', qtyAvailable: 32, gsm: '280', sectionTitle: '280 GSM SECTION', subTitle: '280 REELS & SHEETS', isInventoryItem: true },
        { id: 'INV-004', name: '100*74 (280 GSM)', width: 74, length: 100, unit: 'cm', qtyAvailable: 20, gsm: '280', sectionTitle: '280 GSM SECTION', subTitle: '280 REELS & SHEETS', isInventoryItem: true },
        { id: 'INV-005', name: '108*76 (280 GSM)', width: 76, length: 108, unit: 'cm', qtyAvailable: 103, gsm: '280', sectionTitle: '280 GSM SECTION', subTitle: '280 REELS & SHEETS', isInventoryItem: true },
        { id: 'INV-006', name: '50*64.5 (250 GSM)', width: 50, length: 64.5, unit: 'cm', qtyAvailable: 255, gsm: '250', sectionTitle: '250 & 230 GSM SECTION', subTitle: '250 DOUBLE', isInventoryItem: true },
        { id: 'INV-007', name: '54*78 (230 GSM)', width: 54, length: 78, unit: 'cm', qtyAvailable: 55, gsm: '230', sectionTitle: '250 & 230 GSM SECTION', subTitle: '230 DOUBLE', isInventoryItem: true },
        { id: 'INV-008', name: '59*91 (230 GSM)', width: 59, length: 91, unit: 'cm', qtyAvailable: 42, gsm: '230', sectionTitle: '250 & 230 GSM SECTION', subTitle: '230 DOUBLE', isInventoryItem: true },
        { id: 'INV-009', name: '82*98 (230 GSM)', width: 82, length: 98, unit: 'cm', qtyAvailable: 110, gsm: '230', sectionTitle: '250 & 230 GSM SECTION', subTitle: '230 DOUBLE', isInventoryItem: true },
        { id: 'INV-010', name: '55*80 (230 GSM)', width: 55, length: 80, unit: 'cm', qtyAvailable: 60, gsm: '230', sectionTitle: '250 & 230 GSM SECTION', subTitle: '230 DOUBLE', isInventoryItem: true },
      ];

      const allRealStocksToEval: StockInputItem[] = [...extractedRealStocks];
      if (allRealStocksToEval.length < 5) {
        fallbackRealStocks.forEach(fb => {
          if (!allRealStocksToEval.some(e => e.name === fb.name || (e.width === fb.width && e.length === fb.length))) {
            allRealStocksToEval.push(fb);
          }
        });
      }

      const normalizedRealStocks: NormalizedStock[] = allRealStocksToEval.map(stk => ({
        id: stk.id,
        name: stk.name || `${stk.width}×${stk.length} ${stk.unit}`,
        originalWidth: stk.width,
        originalLength: stk.length,
        originalUnit: stk.unit,
        widthMm: convertToMm(stk.width, stk.unit),
        lengthMm: convertToMm(stk.length, stk.unit),
        qtyAvailable: stk.qtyAvailable || 0,
        gsm: stk.gsm || (cleanTargetGsm ? cleanTargetGsm : undefined),
        sectionTitle: stk.sectionTitle,
        subTitle: stk.subTitle,
        isInventoryItem: true
      }));

      const evaluatedRealSolutions = normalizedRealStocks.map(stock => {
        return evaluateStockSheet(
          stock,
          itemWMm,
          itemHMm,
          kerfMm,
          edgeTrimMm,
          allowRotation,
          allowMixed,
          maxWastePct,
          reqQ,
          goal,
          currentUnit
        );
      });

      const rankedRealSolutions = [...evaluatedRealSolutions].sort((a, b) => {
        if (a.isFeasible !== b.isFeasible) {
          return a.isFeasible ? -1 : 1;
        }
        if (!a.isFeasible && !b.isFeasible) return 0;

        const aIsZero = a.totalWastePct <= 0.001 || a.classification === 'ZERO WASTE' || a.classification === 'TRUE ZERO-WASTE';
        const bIsZero = b.totalWastePct <= 0.001 || b.classification === 'ZERO WASTE' || b.classification === 'TRUE ZERO-WASTE';
        if (aIsZero !== bIsZero) {
          return aIsZero ? -1 : 1;
        }
        if (aIsZero && bIsZero) {
          if (b.yieldPerSheet !== a.yieldPerSheet) return b.yieldPerSheet - a.yieldPerSheet;
          return a.stockAreaMm2 - b.stockAreaMm2;
        }

        if (Math.abs(a.totalWastePct - b.totalWastePct) > 0.0001) {
          return a.totalWastePct - b.totalWastePct;
        }

        if (b.yieldPerSheet !== a.yieldPerSheet) {
          return b.yieldPerSheet - a.yieldPerSheet;
        }

        if (Math.abs(b.productEfficiencyPct - a.productEfficiencyPct) > 0.0001) {
          return b.productEfficiencyPct - a.productEfficiencyPct;
        }
        return a.stockAreaMm2 - b.stockAreaMm2;
      });

      setRealInventorySolutions(rankedRealSolutions);

      setIsOptimizing(false);
      setOptimizationProgress('');
      toast.success('Stock optimization completed successfully!');

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }, 250);
  };

  // Initialize on mount with default 5 test stocks (23×32 target)
  useEffect(() => {
    handleOptimize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeSolution = solutions[selectedSolutionIndex] || solutions.find(s => s.isFeasible) || solutions[0];

  // Available GSM categories from main inventory
  const availableGsms = useMemo(() => {
    const gsms = new Set<string>();
    if (inventory && Array.isArray(inventory)) {
      inventory.forEach(sec => {
        sec.subSections?.forEach(sub => {
          sub.items?.forEach(item => {
            if (item.gsm) gsms.add(String(item.gsm).trim());
          });
        });
      });
    }
    return Array.from(gsms).sort();
  }, [inventory]);

  // Evaluated stock solutions strictly ranked by Priority (all evaluated available stocks)
  const topSolutions = useMemo(() => {
    return solutions;
  }, [solutions]);

  // Top 10 solutions for Section 3 table (strictly top 10 feasible matches ranked higher to low out of main results)
  const top10SectionSolutions = useMemo(() => {
    const feasible = solutions.filter(s => s.isFeasible);
    if (feasible.length >= 10) {
      return feasible.slice(0, 10);
    }
    return solutions.slice(0, 10);
  }, [solutions]);

  // Top Best Matching Sizes from Available Stocks: Zero Wastages first, followed by Low Wastages
  const top6MatchingSizes = useMemo(() => {
    let list = solutions.filter(s => s.isFeasible);
    if (queryGsmFilter !== 'all') {
      list = list.filter(s => String(s.stockGsm || '').trim() === queryGsmFilter.trim());
    }
    if (querySearchText.trim()) {
      const q = querySearchText.toLowerCase();
      list = list.filter(s => 
        s.stockName.toLowerCase().includes(q) || 
        String(s.stockGsm || '').toLowerCase().includes(q) ||
        s.stockId.toLowerCase().includes(q) ||
        (s.sectionTitle && s.sectionTitle.toLowerCase().includes(q))
      );
    }

    // Sort: 4-Point Priority Hierarchy (Zero-Waste, lowest waste %, higher yield, efficiency)
    list = [...list].sort((a, b) => {
      // 1. Zero Waste Matches First (<= 0.001% or ZERO WASTE)
      const aIsZero = a.totalWastePct <= 0.001 || a.classification === 'ZERO WASTE' || a.classification === 'TRUE ZERO-WASTE';
      const bIsZero = b.totalWastePct <= 0.001 || b.classification === 'ZERO WASTE' || b.classification === 'TRUE ZERO-WASTE';
      if (aIsZero !== bIsZero) return aIsZero ? -1 : 1;
      if (aIsZero && bIsZero) {
        if (b.yieldPerSheet !== a.yieldPerSheet) return b.yieldPerSheet - a.yieldPerSheet;
        return a.stockAreaMm2 - b.stockAreaMm2;
      }

      // 2. Lowest Total Waste % first (ascending)
      if (Math.abs(a.totalWastePct - b.totalWastePct) > 0.0001) {
        return a.totalWastePct - b.totalWastePct;
      }

      // 3. Higher Yield per Sheet (descending)
      if (b.yieldPerSheet !== a.yieldPerSheet) {
        return b.yieldPerSheet - a.yieldPerSheet;
      }

      // 4. Higher Product Efficiency % (descending)
      if (Math.abs(b.productEfficiencyPct - a.productEfficiencyPct) > 0.0001) {
        return b.productEfficiencyPct - a.productEfficiencyPct;
      }

      return a.stockAreaMm2 - b.stockAreaMm2;
    });

    return list.slice(0, 6);
  }, [solutions, queryGsmFilter, querySearchText]);

  // Best available stock match (#1 ranked)
  const bestAvailableMatch = solutions.length > 0 ? solutions[0] : null;

  // Exact Zero-Waste Target corresponding to the best available match grid & orientation
  const numWi = parseFloat(itemWidth) || 0;
  const numHi = parseFloat(itemHeight) || 0;
  const numKerf = includeKerf ? (parseFloat(kerf) || 0) : 0;

  const targetCols = bestAvailableMatch && bestAvailableMatch.isFeasible ? bestAvailableMatch.columns : 2;
  const targetRows = bestAvailableMatch && bestAvailableMatch.isFeasible ? bestAvailableMatch.rows : 2;
  const isRotatedBest = bestAvailableMatch && bestAvailableMatch.isFeasible && bestAvailableMatch.orientation === 'Rotated 90°';

  const exactTargetWidth = isRotatedBest
    ? targetCols * numHi + (targetCols - 1) * numKerf
    : targetCols * numWi + (targetCols - 1) * numKerf;

  const exactTargetHeight = isRotatedBest
    ? targetRows * numWi + (targetRows - 1) * numKerf
    : targetRows * numHi + (targetRows - 1) * numKerf;

  const exactTargetPieces = targetCols * targetRows;
  const exactTargetGrid = `${targetCols} × ${targetRows}`;

  // Difference calculation: Available Stock - Exact Target
  const availW = bestAvailableMatch && bestAvailableMatch.isFeasible ? bestAvailableMatch.originalStockWidth : 0;
  const availH = bestAvailableMatch && bestAvailableMatch.isFeasible ? bestAvailableMatch.originalStockLength : 0;
  const diffW = availW - exactTargetWidth;
  const diffH = availH - exactTargetHeight;

  const formatDiffVal = (val: number) => {
    const r = Math.round(val * 100) / 100;
    if (r === 0) return '0';
    if (r > 0) return `+${r}`;
    return `${r}`;
  };
  const diffString = `${formatDiffVal(diffW)} × ${formatDiffVal(diffH)}`;

  const handleAddTargetAsStock = () => {
    const targetW = String(exactTargetWidth);
    const targetH = String(exactTargetHeight);
    const newStocks = [...fiveStocks];
    if (newStocks.length < 6) {
      newStocks.push({ id: newStocks.length + 1, width: targetW, height: targetH });
    } else {
      newStocks[newStocks.length - 1] = { ...newStocks[newStocks.length - 1], width: targetW, height: targetH };
    }
    setFiveStocks(newStocks);
    handleOptimize(undefined, undefined, newStocks);
    toast.success(`Added Zero-Waste Target (${targetW} × ${targetH} ${itemUnit}) to Available Stocks!`);
  };

  // Top 5 best matching results from real inventory (full warehouse evaluation)
  const top5RealInventorySolutions = useMemo(() => {
    const feasible = realInventorySolutions.filter(s => s.isFeasible);
    return feasible.slice(0, 5);
  }, [realInventorySolutions]);

  const filteredRealInventorySolutions = useMemo(() => {
    let list = [...realInventorySolutions];
    if (realInvGsmFilter !== 'all') {
      const cleanGsm = realInvGsmFilter.replace(/[^0-9]/g, '').trim();
      list = list.filter(s => {
        const stkGsm = String(s.stockGsm || '').replace(/[^0-9]/g, '').trim();
        return stkGsm === cleanGsm;
      });
    }
    if (realInvSearch.trim()) {
      const q = realInvSearch.toLowerCase();
      list = list.filter(s => 
        s.stockName.toLowerCase().includes(q) ||
        (s.sectionTitle && s.sectionTitle.toLowerCase().includes(q)) ||
        `${s.originalStockWidth}x${s.originalStockLength}`.includes(q) ||
        `${s.originalStockWidth}*${s.originalStockLength}`.includes(q)
      );
    }
    if (realInvSortBy === 'yield') {
      list.sort((a, b) => b.yieldPerSheet - a.yieldPerSheet);
    } else if (realInvSortBy === 'stock') {
      list.sort((a, b) => b.qtyAvailable - a.qtyAvailable);
    }
    return list;
  }, [realInventorySolutions, realInvGsmFilter, realInvSearch, realInvSortBy]);

  const handleInspectRealStock = (sol: SingleSheetSolution) => {
    const existingIdx = solutions.findIndex(s => s.stockId === sol.stockId);
    if (existingIdx >= 0) {
      setSelectedSolutionIndex(existingIdx);
    } else {
      setSolutions(prev => [sol, ...prev]);
      setSelectedSolutionIndex(0);
    }
    setActiveTabSection('grid');
    toast.success(`Loaded ${sol.stockName} into 2D Cutting Diagram`);
  };

  const handleExportRealInventoryExcel = () => {
    if (realInventorySolutions.length === 0) {
      toast.error('No real inventory solutions to export');
      return;
    }
    const data = realInventorySolutions.map((s, idx) => ({
      'Rank': `#${idx + 1}`,
      'Stock ID': s.stockId,
      'Stock Name': s.stockName,
      'Warehouse Section': s.sectionTitle || 'General Inventory',
      'Stock Dimensions': `${s.originalStockWidth} × ${s.originalStockLength} ${s.originalStockUnit}`,
      'GSM': s.stockGsm || 'N/A',
      'In Stock (Sheets)': s.qtyAvailable,
      'Feasible': s.isFeasible ? 'YES' : 'NO',
      'Best Orientation': s.orientation,
      'Grid Layout': s.gridLayout,
      'Yield (pcs/sheet)': s.yieldPerSheet,
      'Product Efficiency %': s.productEfficiencyPct.toFixed(2),
      'Kerf Consumption %': s.kerfConsumptionPct.toFixed(2),
      'Total Waste %': s.totalWastePct.toFixed(2),
      'Classification': s.classification,
      'Sheets Required': s.sheetsRequired,
      'Estimated Cuts': s.estimatedCuts
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Real Inventory Matches');
    XLSX.writeFile(wb, `Enerpack_Real_Inventory_Matches_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Exported Real Inventory Matches to Excel');
  };

  const handleGoToFullInventoryPage = () => {
    if (onNavigateToInventory) {
      onNavigateToInventory();
    } else {
      window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: 'Full Inventory' }));
    }
    toast.success('Redirecting to Full Inventory page...');
  };

  // Export functions
  const handleExportExcel = () => {
    if (solutions.length === 0) return;

    const data = solutions.map(s => ({
      'Stock ID': s.stockId,
      'Stock Name': s.stockName,
      'Stock Dimensions': `${s.originalStockWidth} × ${s.originalStockLength} ${s.originalStockUnit}`,
      'Feasible': s.isFeasible ? 'YES' : 'NO',
      'Best Orientation': s.orientation,
      'Grid Layout': s.gridLayout,
      'Yield (pcs/sheet)': s.yieldPerSheet,
      'Product Efficiency %': s.productEfficiencyPct.toFixed(2),
      'Kerf Consumption %': s.kerfConsumptionPct.toFixed(2),
      'Total Waste %': s.totalWastePct.toFixed(2),
      'Classification': s.classification,
      'Sheets Required': s.sheetsRequired,
      'Available In Stock': s.qtyAvailable,
      'Shortage': s.shortageSheets,
      'Estimated Cuts': s.estimatedCuts
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Optimization');
    XLSX.writeFile(wb, `Enerpack_Stock_Optimization_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Exported Excel report');
  };

  const handleExportPDF = () => {
    if (!activeSolution) return;

    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.setTextColor(15, 42, 67);
      doc.text('ENERPACK INVENTORY — QUICK TRACKER', 14, 18);
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      doc.text('2D Cutting-Stock Optimization & Guillotine Plan Report', 14, 25);
      doc.text(`Date: ${new Date().toLocaleDateString()} | Item: ${itemWidth} × ${itemHeight} ${itemUnit} | Kerf: ${kerf} ${kerfUnit}`, 14, 32);

      autoTable(doc, {
        startY: 38,
        head: [['Metric', 'Optimal Solution Value']],
        body: [
          ['Best Stock Sheet', `${activeSolution.stockName} (${activeSolution.originalStockWidth} × ${activeSolution.originalStockLength} ${activeSolution.originalStockUnit})`],
          ['Orientation', activeSolution.orientation],
          ['Grid Layout', activeSolution.gridLayout],
          ['Yield per Sheet', `${activeSolution.yieldPerSheet} pcs`],
          ['Product Area Efficiency', `${activeSolution.productEfficiencyPct.toFixed(2)}%`],
          ['Total Waste %', `${activeSolution.totalWastePct.toFixed(2)}%`],
          ['Classification', activeSolution.classification],
          ['Required Quantity', `${requiredQty} pcs`],
          ['Sheets Required', `${activeSolution.sheetsRequired} sheets`],
          ['In-Stock Sheets', `${activeSolution.qtyAvailable} sheets`],
          ['Stock Shortage', `${activeSolution.shortageSheets} sheets`],
          ['Estimated Guillotine Cuts', `${activeSolution.estimatedCuts} cuts`]
        ],
        theme: 'striped',
        headStyles: { fillColor: [15, 42, 67] }
      });

      // Cutting Sequence Table
      if (activeSolution.cuttingSequence.length > 0) {
        const lastY = (doc as any).lastAutoTable.finalY || 130;
        doc.setFontSize(13);
        doc.setTextColor(15, 42, 67);
        doc.text('Guillotine Cutting Plan Sequence', 14, lastY + 12);

        const cutRows = activeSolution.cuttingSequence.map(c => [
          `Cut #${c.cutNumber}`,
          c.direction,
          c.positionFormatted,
          c.resultingSection,
          c.purpose
        ]);

        autoTable(doc, {
          startY: lastY + 16,
          head: [['Step', 'Direction', 'Position', 'Resulting Section', 'Purpose']],
          body: cutRows,
          theme: 'grid',
          headStyles: { fillColor: [37, 99, 235] }
        });
      }

      doc.save(`Enerpack_Cutting_Plan_${activeSolution.stockId}.pdf`);
      toast.success('Generated PDF report');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate PDF');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCuttingPlan = () => {
    if (!activeSolution) return;
    const text = [
      `ENERPACK 2D GUILLOTINE CUTTING PLAN`,
      `==================================`,
      `Stock Sheet: ${activeSolution.stockName} (${activeSolution.originalStockWidth} × ${activeSolution.originalStockLength} ${activeSolution.originalStockUnit})`,
      `Product Size: ${itemWidth} × ${itemHeight} ${itemUnit}`,
      `Orientation: ${activeSolution.orientation} | Layout: ${activeSolution.gridLayout}`,
      `Yield: ${activeSolution.yieldPerSheet} pcs/sheet | Waste: ${activeSolution.totalWastePct.toFixed(2)}%`,
      `Kerf Allowance: ${kerf} ${kerfUnit}`,
      ``,
      `CUTTING SEQUENCE:`,
      ...activeSolution.cuttingSequence.map(c => 
        `CUT ${c.cutNumber}: ${c.direction} at ${c.positionFormatted} -> ${c.resultingSection} [${c.purpose}]`
      )
    ].join('\n');

    navigator.clipboard.writeText(text);
    toast.success('Cutting plan copied to clipboard!');
  };

  const handleSaveOptimizationJob = async () => {
    if (!activeSolution) return;
    setIsSavingJob(true);
    try {
      const jobData = {
        jobId: `OPT-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().split('T')[0],
        timestamp: Timestamp.now(),
        customer: jobCustomer || 'General Production',
        productName: jobProductName || 'Cardboard Cut Piece',
        itemWidth: parseFloat(itemWidth),
        itemHeight: parseFloat(itemHeight),
        itemUnit,
        kerf: parseFloat(kerf) || 0,
        requiredQty: parseInt(requiredQty) || 0,
        selectedStock: {
          id: activeSolution.stockId,
          name: activeSolution.stockName,
          dimensions: `${activeSolution.originalStockWidth} × ${activeSolution.originalStockLength} ${activeSolution.originalStockUnit}`,
          gsm: activeSolution.stockGsm || 'N/A'
        },
        layout: activeSolution.gridLayout,
        orientation: activeSolution.orientation,
        yieldPerSheet: activeSolution.yieldPerSheet,
        efficiencyPct: activeSolution.productEfficiencyPct,
        wastePct: activeSolution.totalWastePct,
        sheetsRequired: activeSolution.sheetsRequired,
        shortageSheets: activeSolution.shortageSheets,
        status: 'Optimized'
      };

      await addDoc(collection(db, 'cuttingOptimizationJobs'), jobData);
      toast.success(`Saved optimization job #${jobData.jobId}`);
      setShowSaveModal(false);
      setJobCustomer('');
      setJobProductName('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'cuttingOptimizationJobs');
    } finally {
      setIsSavingJob(false);
    }
  };

  const handleConfirmReservation = async () => {
    if (!reservingStockItem || !onReserveStock) return;
    const { sol, sheets } = reservingStockItem;
    const success = await onReserveStock(
      sol.stockId,
      `${sol.originalStockWidth}*${sol.originalStockLength}`,
      String(sol.stockGsm || '280'),
      sheets
    );
    if (success) {
      toast.success(`Reserved ${sheets} sheets of ${sol.stockName} in inventory`);
      setShowReserveModal(false);
      setReservingStockItem(null);
    }
  };

  // Live calculated metrics for Target GSM
  const itemWMmForCalc = convertToMm(parseFloat(itemWidth) || 0, itemUnit);
  const itemHMmForCalc = convertToMm(parseFloat(itemHeight) || 0, itemUnit);
  const activeGsmNumber = parseFloat(targetGsm.replace(/[^0-9.]/g, '')) || 0;
  const livePieceWeightG = (itemWMmForCalc > 0 && itemHMmForCalc > 0 && activeGsmNumber > 0)
    ? ((itemWMmForCalc * itemHMmForCalc) / 1_000_000) * activeGsmNumber
    : null;
  const liveOrderWeightKg = (livePieceWeightG && parseInt(requiredQty) > 0)
    ? (livePieceWeightG * parseInt(requiredQty)) / 1000
    : null;

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-[#0f2a43] p-6 md:p-8 rounded-3xl shadow-xl text-white mb-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="bg-blue-500/20 text-blue-400 p-2 rounded-xl border border-blue-400/30">
                <Box size={22} />
              </span>
              <h2 className="text-xl md:text-2xl font-black tracking-wider uppercase">
                QUICK TRACKER
              </h2>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-400/30 tracking-widest uppercase">
                MASTER STOCK COMBINER
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-300 mt-2 font-medium">
              2D Guillotine Cutting • Stock Matching • Yield Optimization • Zero-Waste Targeting
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleLoadFromInventory}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-white/10"
              title="Pull current real sheets from Enerpack inventory database"
            >
              <RefreshCw size={14} />
              Load Real Inventory
            </button>
            <button
              onClick={() => handleOptimize()}
              disabled={isOptimizing}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase shadow-lg shadow-blue-500/25 transition-all active:scale-95"
            >
              <Zap size={16} />
              ⚡ OPTIMIZE STOCK
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Inputs (Left) & Controls (Right) - Equally Aligned */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Input Form (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col">
          {/* Card A: Finished Item / Product */}
          <div id="card-required-item-finished-piece" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between h-full space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Target className="text-blue-600" size={18} />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Required Size
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  {targetGsm && targetGsm !== 'all' ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      {targetGsm} GSM
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      All GSMs
                    </span>
                  )}
                </div>
              </div>

              {/* Required Size: Width, Height, Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Required Width
                  </label>
                  <div className="flex rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                    <input
                      id="input-required-width"
                      type="number"
                      step="any"
                      value={itemWidth}
                      onChange={(e) => setItemWidth(e.target.value)}
                      placeholder="23"
                      className="w-full px-3 py-2 text-sm font-bold bg-transparent outline-none"
                    />
                    <select
                      id="select-item-unit"
                      value={itemUnit}
                      onChange={(e) => setItemUnit(e.target.value as DimensionUnit)}
                      className="bg-slate-100 text-xs font-bold px-2.5 py-2 border-l border-slate-200 outline-none cursor-pointer"
                    >
                      <option value="cm">cm</option>
                      <option value="mm">mm</option>
                      <option value="inch">inch</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Required Height
                  </label>
                  <div className="flex rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                    <input
                      id="input-required-height"
                      type="number"
                      step="any"
                      value={itemHeight}
                      onChange={(e) => setItemHeight(e.target.value)}
                      placeholder="32"
                      className="w-full px-3 py-2 text-sm font-bold bg-transparent outline-none"
                    />
                    <span className="bg-slate-100 text-xs font-bold px-3 py-2 border-l border-slate-200 text-slate-600 flex items-center">
                      {itemUnit}
                    </span>
                  </div>
                </div>
              </div>

              {/* AVAILABLE STOCK INPUT OPTIONS */}
              <div className="space-y-2.5 pt-2 pb-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Layers className="text-blue-600" size={14} />
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                      Available Stock Options ({fiveStocks.length} Sizes)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddStockRow}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer flex items-center gap-0.5"
                      title="Add another stock size row"
                    >
                      <Plus size={11} /> Add Stock
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={handleResetToTestStocks}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      title="Reset to test stocks"
                    >
                      Reset Test Values
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={handleLoadFromInventory}
                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 hover:underline cursor-pointer"
                      title="Load sizes from inventory"
                    >
                      Load Inventory
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {fiveStocks.map((stk, sIdx) => (
                    <div
                      key={stk.id}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors"
                    >
                      <span className="w-28 text-[11px] font-bold text-slate-700 shrink-0">
                        Available Stock {sIdx + 1}
                      </span>
                      <div className="flex-1 flex items-center gap-1.5">
                        <input
                          type="number"
                          step="any"
                          value={stk.width}
                          onChange={(e) => handleUpdateFiveStock(stk.id, 'width', e.target.value)}
                          placeholder="Width"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-center"
                        />
                        <span className="text-slate-400 font-bold text-xs shrink-0">×</span>
                        <input
                          type="number"
                          step="any"
                          value={stk.height}
                          onChange={(e) => handleUpdateFiveStock(stk.id, 'height', e.target.value)}
                          placeholder="Height"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-center"
                        />
                        <span className="text-[10px] font-bold text-slate-400 shrink-0 w-6 text-right">
                          {itemUnit}
                        </span>
                        {fiveStocks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStockRow(stk.id)}
                            className="text-slate-400 hover:text-rose-500 p-0.5 rounded cursor-pointer transition-colors"
                            title="Remove stock option"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Required Qty & Target GSM in 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Required Production (pcs)
                  </label>
                  <input
                    id="input-required-production-qty"
                    type="number"
                    value={requiredQty}
                    onChange={(e) => setRequiredQty(e.target.value)}
                    placeholder="e.g. 1000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Target Board GSM
                    </label>
                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                      Weight
                    </span>
                  </div>
                  <div className="flex rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                    <input
                      id="input-target-gsm"
                      type="text"
                      value={targetGsm === 'all' ? '' : targetGsm}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTargetGsm(val === '' ? 'all' : val);
                      }}
                      placeholder="All GSMs"
                      className="w-full px-3 py-2.5 text-sm font-bold bg-transparent outline-none"
                    />
                    <select
                      id="select-target-gsm-inventory"
                      value={targetGsm}
                      onChange={(e) => setTargetGsm(e.target.value)}
                      className="bg-slate-100 text-xs font-bold px-2 py-2 border-l border-slate-200 outline-none cursor-pointer max-w-[105px] text-slate-700"
                      title="Select GSM from inventory"
                    >
                      <option value="all">All GSMs</option>
                      {availableGsms.map(gsm => (
                        <option key={gsm} value={gsm}>{gsm} GSM</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Quick GSM Presets & Strict Mode */}
              <div className="space-y-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    GSM Presets:
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-semibold text-slate-600 hover:text-slate-900 select-none">
                    <input
                      id="checkbox-strict-gsm-match"
                      type="checkbox"
                      checked={strictGsmFilter}
                      onChange={(e) => setStrictGsmFilter(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500/30 cursor-pointer"
                    />
                    <span>Strict GSM only</span>
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTargetGsm('all')}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                      targetGsm === 'all' || !targetGsm
                        ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All GSMs
                  </button>
                  {availableGsms.length > 0 ? (
                    availableGsms.map(gsm => {
                      const cleanG = gsm.replace(/[^0-9]/g, '');
                      const isSelected = targetGsm.replace(/[^0-9]/g, '') === cleanG && targetGsm !== 'all';
                      return (
                        <button
                          key={gsm}
                          type="button"
                          onClick={() => setTargetGsm(gsm)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {gsm} GSM
                        </button>
                      );
                    })
                  ) : (
                    ['230', '250', '280', '300', '350', '400'].map(gsm => {
                      const isSelected = targetGsm.replace(/[^0-9]/g, '') === gsm && targetGsm !== 'all';
                      return (
                        <button
                          key={gsm}
                          type="button"
                          onClick={() => setTargetGsm(gsm)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {gsm} GSM
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Live Weight Calculation Banner if GSM is active */}
                {livePieceWeightG && (
                  <div className="flex items-center justify-between text-[11px] bg-blue-50/70 border border-blue-100 rounded-xl px-3 py-1.5 text-blue-900 mt-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Est. Piece Weight: <strong>{livePieceWeightG.toFixed(2)} g</strong>
                    </span>
                    {liveOrderWeightKg && (
                      <span className="font-semibold text-blue-800">
                        Job Paper: <strong>{liveOrderWeightKg >= 1000 ? `${(liveOrderWeightKg / 1000).toFixed(3)} tonnes` : `${liveOrderWeightKg.toFixed(2)} kg`}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Optimize & Check Matching Stock Button */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <button
                id="btn-optimize-check-matching-stock"
                type="button"
                onClick={() => handleOptimize()}
                disabled={isOptimizing}
                className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white py-3.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
                title="Calculate 2D guillotine cutting plan and find best matching stock sheets"
              >
                <Zap size={16} className={isOptimizing ? "animate-spin text-amber-300" : "text-amber-300"} />
                {isOptimizing 
                  ? "Evaluating Stock Sheets..." 
                  : `⚡ Optimize for ${targetGsm !== 'all' && targetGsm.trim() ? targetGsm.replace(/[^0-9]/g, '') + ' GSM' : 'All Stock Sheets'}`}
              </button>

              {solutions.length > 0 && (
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/70">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span><strong>{solutions.filter(s => s.isFeasible).length}</strong> matching stock sheets</span>
                  </span>
                  {activeSolution && activeSolution.isFeasible && (
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                      Yield: {activeSolution.yieldPerSheet} pcs ({activeSolution.productEfficiencyPct.toFixed(1)}%)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Result Visualization & Best Matching Engine (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <div id="card-result-visualization" className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between h-full space-y-3">
            {/* Header with Active Match Badge & Mode Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="text-blue-600" size={18} />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    2D Cutting Result & Visual Layout
                  </h3>
                  {activeSolution && activeSolution.isFeasible && (
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      activeSolution.totalWastePct <= 0.05 || activeSolution.classification === 'TRUE ZERO-WASTE'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : activeSolution.totalWastePct <= 2.0 || activeSolution.classification === 'NEAR ZERO-WASTE'
                        ? 'bg-teal-100 text-teal-800 border border-teal-300'
                        : activeSolution.totalWastePct <= 5.0
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {activeSolution.totalWastePct <= 0.05
                        ? '0% Waste (True Zero-Waste)'
                        : `${activeSolution.totalWastePct.toFixed(1)}% Waste (${activeSolution.classification})`}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {activeSolution && activeSolution.isFeasible
                    ? `Optimal Sheet: ${activeSolution.stockName} (${activeSolution.originalStockWidth} × ${activeSolution.originalStockLength} ${activeSolution.originalStockUnit}) • ${activeSolution.yieldPerSheet} pcs/sheet (${activeSolution.productEfficiencyPct.toFixed(1)}% Eff)`
                    : `Evaluated against inventory for query ${itemWidth} × ${itemHeight} ${itemUnit}`}
                </p>
              </div>

              {/* View Switcher: 2D Diagram | Top Matches | All Sheets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setStockViewMode('top6')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      stockViewMode === 'top6' || stockViewMode === 'top5'
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    2D Visual Diagram
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockViewMode('list' as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      (stockViewMode as string) === 'list'
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Match List
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockViewMode('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      stockViewMode === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All Sheets ({stockList.length})
                  </button>
                </div>

                <button
                  onClick={handleLoadFromInventory}
                  className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                  title="Re-sync with latest Enerpack inventory database"
                >
                  <RefreshCw size={11} />
                  <span>Sync DB</span>
                </button>
              </div>
            </div>

            {/* Quick Top Matches Horizontal Selector Strip */}
            {top6MatchingSizes.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 pt-0.5">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider shrink-0 mr-0.5">
                  Matches:
                </span>
                {top6MatchingSizes.map((sol, idx) => {
                  const isSelected = activeSolution?.stockId === sol.stockId;
                  const rank = idx + 1;
                  const isZeroWaste = sol.totalWastePct <= 0.05 || sol.classification === 'TRUE ZERO-WASTE';

                  return (
                    <button
                      key={sol.stockId}
                      type="button"
                      onClick={() => {
                        const targetIdx = solutions.findIndex(s => s.stockId === sol.stockId);
                        if (targetIdx >= 0) setSelectedSolutionIndex(targetIdx);
                        if ((stockViewMode as string) === 'all') setStockViewMode('top6');
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-500/25'
                          : isZeroWaste
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                        isSelected ? 'bg-white text-blue-600' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {rank}
                      </span>
                      <span>{sol.originalStockWidth}×{sol.originalStockLength} {sol.originalStockUnit}</span>
                      {sol.stockGsm && (
                        <span className={`text-[9px] px-1 rounded ${isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-200/70 text-slate-600'}`}>
                          {sol.stockGsm}
                        </span>
                      )}
                      <span className={`text-[10px] font-extrabold ${
                        isSelected ? 'text-emerald-200' : isZeroWaste ? 'text-emerald-700' : 'text-slate-500'
                      }`}>
                        {sol.yieldPerSheet} pcs ({isZeroWaste ? '0% waste' : `${sol.totalWastePct.toFixed(1)}%`})
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Main Interactive Visual Canvas & Layout */}
            <div className="flex-1 flex flex-col justify-between min-h-[320px]">
              {(stockViewMode === 'top6' || stockViewMode === 'top5') && activeSolution && activeSolution.isFeasible ? (
                /* LIVE 2D CUTTING DIAGRAM VISUALIZATION */
                <div className="space-y-3 flex-1 flex flex-col justify-between">
                  <div className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-2 sm:p-3 overflow-hidden flex items-center justify-center flex-1 min-h-[260px] max-h-[330px]">
                    <CuttingDiagram 
                      solution={activeSolution} 
                      displayUnit={itemUnit} 
                      embedded={true} 
                      compact={true} 
                      hideHeader={false}
                      hideLegend={true}
                      maxDisplayHeight={250}
                    />
                  </div>

                  {/* 4-Column Key Metrics Bento (Zero wasted space) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        Yield & Layout
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-base font-black text-emerald-600">{activeSolution.yieldPerSheet}</span>
                        <span className="text-[10px] font-semibold text-slate-600">pcs/sheet</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 block truncate">
                        {activeSolution.gridLayout} • {activeSolution.orientation}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        Efficiency & Waste
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-base font-black text-slate-900">{activeSolution.productEfficiencyPct.toFixed(1)}%</span>
                        <span className="text-[10px] font-semibold text-emerald-600">Eff</span>
                      </div>
                      <span className={`text-[9px] font-bold block truncate ${
                        activeSolution.totalWastePct <= 0.05 ? 'text-emerald-700 font-extrabold' : 'text-amber-600'
                      }`}>
                        {activeSolution.totalWastePct.toFixed(1)}% Trim Waste
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        Sheets Required
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-base font-black text-slate-900">{activeSolution.sheetsRequired}</span>
                        <span className="text-[10px] font-semibold text-slate-600">sheets</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 block truncate">
                        For {requiredQty || 1000} pcs target
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        Inventory Balance
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-base font-black text-slate-900">{activeSolution.qtyAvailable}</span>
                        <span className="text-[10px] font-semibold text-slate-600">in stock</span>
                      </div>
                      <span className={`text-[9px] font-bold block truncate ${
                        activeSolution.shortageSheets > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {activeSolution.shortageSheets > 0 ? `⚠️ ${activeSolution.shortageSheets} short` : '✅ Fully Covered'}
                      </span>
                    </div>
                  </div>

                  {/* Material Utilization Progress Bar */}
                  <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded bg-emerald-500" />
                        <span>Product Area: <strong>{activeSolution.productEfficiencyPct.toFixed(1)}%</strong></span>
                      </span>
                      {activeSolution.kerfConsumptionPct > 0 && (
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <span className="w-2 h-2 rounded bg-rose-400" />
                          <span>Kerf: <strong>{activeSolution.kerfConsumptionPct.toFixed(1)}%</strong></span>
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <span className="w-2 h-2 rounded bg-amber-400" />
                        <span>Offcut Scrap: <strong>{activeSolution.totalWastePct.toFixed(1)}%</strong></span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(100, activeSolution.productEfficiencyPct)}%` }} />
                      {activeSolution.kerfConsumptionPct > 0 && (
                        <div className="bg-rose-400 h-full" style={{ width: `${Math.min(100, activeSolution.kerfConsumptionPct)}%` }} />
                      )}
                      {activeSolution.totalWastePct > 0 && (
                        <div className="bg-amber-400 h-full" style={{ width: `${Math.min(100, activeSolution.totalWastePct)}%` }} />
                      )}
                    </div>
                  </div>
                </div>
              ) : (stockViewMode as string) === 'list' ? (
                /* MATCH LIST VIEW */
                <div className="space-y-2 overflow-y-auto max-h-[360px] custom-scrollbar p-1">
                  {top6MatchingSizes.map((sol, idx) => {
                    const isSelected = activeSolution?.stockId === sol.stockId;
                    const rank = idx + 1;
                    const isZeroWaste = sol.totalWastePct <= 0.05 || sol.classification === 'TRUE ZERO-WASTE';

                    return (
                      <div
                        key={sol.stockId}
                        onClick={() => {
                          const targetIdx = solutions.findIndex(s => s.stockId === sol.stockId);
                          if (targetIdx >= 0) setSelectedSolutionIndex(targetIdx);
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-500 shadow-2xs ring-1 ring-blue-500/30'
                            : isZeroWaste
                            ? 'bg-emerald-50/30 border-emerald-200 hover:border-emerald-300'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                            isZeroWaste ? 'bg-emerald-600 text-white' : rank === 1 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white'
                          }`}>
                            #{rank}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-black text-slate-900">
                                {sol.originalStockWidth} × {sol.originalStockLength} {sol.originalStockUnit}
                              </span>
                              {sol.stockGsm && (
                                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                  {sol.stockGsm} GSM
                                </span>
                              )}
                              <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                                isZeroWaste ? 'text-emerald-700 bg-emerald-100' : 'text-amber-700 bg-amber-100'
                              }`}>
                                {isZeroWaste ? '0% Waste' : `${sol.totalWastePct.toFixed(1)}% Waste`}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {sol.qtyAvailable} in stock • {sol.sheetsRequired} sheets req. • Layout: {sol.gridLayout} ({sol.orientation})
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-base font-black text-emerald-600">{sol.yieldPerSheet} pcs</div>
                            <div className="text-[10px] font-bold text-slate-400">{sol.productEfficiencyPct.toFixed(1)}% Eff</div>
                          </div>
                          {isSelected ? (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-lg">Active</span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const targetIdx = solutions.findIndex(s => s.stockId === sol.stockId);
                                if (targetIdx >= 0) setSelectedSolutionIndex(targetIdx);
                              }}
                              className="text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                              Select
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : stockViewMode === 'all' ? (
                /* ALL STOCK SHEETS TABLE */
                <table className="w-full text-left text-xs bg-white rounded-xl overflow-hidden">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Stock ID</th>
                        <th className="py-2.5 px-3">Width</th>
                        <th className="py-2.5 px-3">Length</th>
                        <th className="py-2.5 px-2">Unit</th>
                        <th className="py-2.5 px-3 text-right">In Stock</th>
                        <th className="py-2.5 px-3">GSM</th>
                        <th className="py-2.5 px-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stockList.map((stk, idx) => (
                        <tr key={stk.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2 px-3 font-bold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              {stk.isInventoryItem ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Live Inventory Item" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Custom Stock" />
                              )}
                              <span>{stk.id}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              step="any"
                              value={stk.width}
                              onChange={(e) => handleUpdateStockField(idx, 'width', parseFloat(e.target.value) || 0)}
                              className="w-16 bg-slate-100/80 px-2 py-1 rounded-lg font-bold border border-slate-200 text-xs"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              step="any"
                              value={stk.length}
                              onChange={(e) => handleUpdateStockField(idx, 'length', parseFloat(e.target.value) || 0)}
                              className="w-16 bg-slate-100/80 px-2 py-1 rounded-lg font-bold border border-slate-200 text-xs"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={stk.unit}
                              onChange={(e) => handleUpdateStockField(idx, 'unit', e.target.value as DimensionUnit)}
                              className="bg-transparent font-semibold text-[11px] cursor-pointer"
                            >
                              <option value="cm">cm</option>
                              <option value="mm">mm</option>
                              <option value="inch">in</option>
                              <option value="m">m</option>
                            </select>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              value={stk.qtyAvailable}
                              onChange={(e) => handleUpdateStockField(idx, 'qtyAvailable', parseInt(e.target.value) || 0)}
                              className="w-14 text-right bg-slate-100/80 px-2 py-1 rounded-lg font-bold border border-slate-200 text-xs"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={stk.gsm || ''}
                              onChange={(e) => handleUpdateStockField(idx, 'gsm', e.target.value)}
                              placeholder="280"
                              className="w-14 bg-slate-100/80 px-2 py-1 rounded-lg font-medium border border-slate-200 text-xs"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              onClick={() => handleRemoveStock(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Remove Stock Sheet"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}
            </div>

            {/* Quick Action Bar */}
            <div className="pt-4 mt-auto flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium">
                {isOptimizing
                  ? optimizationProgress
                  : `Showing Top 6 best matching sizes ranked from Higher to Low for query item ${itemWidth}×${itemHeight} ${itemUnit}.`}
              </span>
              <button
                onClick={() => handleOptimize()}
                disabled={isOptimizing}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0f2a43] hover:bg-slate-800 text-white px-8 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-slate-900/20 transition-all active:scale-95"
              >
                <Zap size={14} className="text-blue-400" />
                {isOptimizing ? 'Analyzing...' : '⚡ OPTIMIZE STOCK'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RESULTS DISPLAY SECTION */}
      <div ref={resultsRef} className="space-y-8 pt-4">
        {/* Navigation Tabs for Master Output Sections */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-200 pb-2">
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar no-scrollbar py-0.5 max-w-full">
            <button
              onClick={() => setActiveTabSection('summary')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-tight whitespace-nowrap transition-all cursor-pointer ${
                activeTabSection === 'summary'
                  ? 'bg-[#0f2a43] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              1. Overview & Top Solutions
            </button>
            <button
              onClick={() => setActiveTabSection('grid')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-tight whitespace-nowrap transition-all cursor-pointer ${
                activeTabSection === 'grid'
                  ? 'bg-[#0f2a43] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              2. 2D Visual Grid
            </button>
            <button
              onClick={() => setActiveTabSection('plan')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-tight whitespace-nowrap transition-all cursor-pointer ${
                activeTabSection === 'plan'
                  ? 'bg-[#0f2a43] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              3. Cutting Plan
            </button>
            <button
              onClick={() => setActiveTabSection('targets')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-tight whitespace-nowrap transition-all cursor-pointer ${
                activeTabSection === 'targets'
                  ? 'bg-[#0f2a43] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              4. Zero-Waste Targets
            </button>
            {multiStockResult && (
              <button
                onClick={() => setActiveTabSection('combiner')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-tight whitespace-nowrap transition-all cursor-pointer ${
                  activeTabSection === 'combiner'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                5. Multi-Stock Combiner
              </button>
            )}
            <button
              onClick={() => setActiveTabSection('realInventory')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-tight whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTabSection === 'realInventory'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <Warehouse size={12} className={activeTabSection === 'realInventory' ? 'text-white' : 'text-blue-600'} />
              <span>Real Inventory</span>
              <span className={`text-[9px] px-1 py-0.2 rounded-full font-black ${
                activeTabSection === 'realInventory' ? 'bg-white/20 text-white' : 'bg-blue-200 text-blue-800'
              }`}>
                Top 5
              </span>
            </button>
          </div>

          {/* Action & Export Buttons */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-1 text-[11px] font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer"
              title="Save this plan as an official cutting job"
            >
              <Save size={13} className="text-blue-600" />
              <span>Save</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1 text-[11px] font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer"
              title="Export PDF Report"
            >
              <FileText size={13} className="text-rose-600" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1 text-[11px] font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer"
              title="Export Excel Report"
            >
              <FileSpreadsheet size={13} className="text-emerald-600" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 text-[11px] font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer"
              title="Print Cutting Plan"
            >
              <Printer size={13} className="text-slate-600" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        {/* SECTION 1 — OPTIMIZATION SUMMARY */}
        {activeSolution && activeSolution.isFeasible ? (
          <div className="bg-gradient-to-br from-[#0f2a43] to-[#1e3a5f] rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/20 text-emerald-300 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-400/30">
                    BEST STOCK MATCH • #{activeSolution.stockId}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    activeSolution.classification === 'TRUE ZERO-WASTE' ? 'bg-emerald-500 text-white' :
                    activeSolution.classification === 'NEAR ZERO-WASTE' ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30' :
                    activeSolution.classification === 'EXCELLENT' ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' :
                    'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  }`}>
                    {activeSolution.classification}
                  </span>
                </div>

                <h3 className="text-2xl md:text-3xl font-black tracking-tight">
                  {activeSolution.stockName}
                </h3>
                <p className="text-xs text-blue-200 font-medium">
                  {activeSolution.recommendationReason}
                </p>
              </div>

              {/* Quick Key Metrics Bento */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center">
                  <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Yield / Sheet</p>
                  <p className="text-2xl font-black text-white">{activeSolution.yieldPerSheet} <span className="text-xs font-normal">pcs</span></p>
                  <p className="text-[9px] text-blue-200 font-bold uppercase">{activeSolution.gridLayout}</p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center">
                  <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Efficiency</p>
                  <p className="text-2xl font-black text-emerald-300">{activeSolution.productEfficiencyPct.toFixed(2)}%</p>
                  <p className="text-[9px] text-emerald-200 font-medium">Product Area</p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center">
                  <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Waste</p>
                  <p className="text-2xl font-black text-rose-300">{activeSolution.totalWastePct.toFixed(2)}%</p>
                  <p className="text-[9px] text-rose-200 font-medium">{formatArea(activeSolution.wasteAreaMm2)}</p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center">
                  <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Sheets Req.</p>
                  <p className="text-2xl font-black text-white">{activeSolution.sheetsRequired}</p>
                  <p className="text-[9px] text-slate-300 font-medium">
                    {activeSolution.shortageSheets > 0 ? (
                      <span className="text-rose-300 font-bold">Short: {activeSolution.shortageSheets}</span>
                    ) : (
                      <span className="text-emerald-300 font-bold">In Stock ({activeSolution.qtyAvailable})</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Inventory Requirement & Reservation bar */}
            <div className="relative z-10 mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6 text-xs">
                <div>
                  <span className="text-blue-200">Orientation: </span>
                  <span className="font-bold text-white">{activeSolution.orientation}</span>
                </div>
                <div>
                  <span className="text-blue-200">Guillotine Cuts: </span>
                  <span className="font-bold text-white">{activeSolution.estimatedCuts} steps</span>
                </div>
                <div>
                  <span className="text-blue-200">Production Capacity: </span>
                  <span className="font-bold text-white">{activeSolution.totalProductionCapacity} pcs ({activeSolution.extraPieces} extra)</span>
                </div>
              </div>

              {onReserveStock && activeSolution.qtyAvailable > 0 && (
                <button
                  onClick={() => {
                    setReservingStockItem({
                      sol: activeSolution,
                      sheets: Math.min(activeSolution.sheetsRequired, activeSolution.qtyAvailable)
                    });
                    setShowReserveModal(true);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2"
                >
                  <Box size={14} />
                  Reserve Stock in Inventory
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center text-rose-800 space-y-2">
            <AlertCircle className="mx-auto text-rose-600" size={36} />
            <h3 className="text-lg font-bold">NO FEASIBLE STOCK SHEETS FOUND</h3>
            <p className="text-xs text-rose-600 max-w-lg mx-auto">
              None of the available stock sizes can accommodate item {itemWidth} × {itemHeight} {itemUnit} with {kerf} {kerfUnit} blade kerf. Add larger stock sheets or adjust dimensions.
            </p>
          </div>
        )}

        {/* TAB CONTENT: 1. OVERVIEW & TOP SOLUTIONS */}
        {activeTabSection === 'summary' && (
          <div className="space-y-8">
            {/* ZERO-WASTE TARGET vs AVAILABLE STOCK MATCH BENTO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ZERO-WASTE TARGET CARD */}
              <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-[#0f2a43] text-white p-5 sm:p-6 rounded-3xl border border-indigo-500/30 shadow-lg relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-indigo-400/20">
                    <div className="flex items-center gap-2">
                      <Target className="text-indigo-400" size={18} />
                      <span className="text-xs font-black uppercase tracking-widest text-indigo-200">
                        ZERO-WASTE TARGET
                      </span>
                    </div>
                    <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                      100% Target
                    </span>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-indigo-200 font-medium">Required Size:</span>
                      <span className="font-bold text-white text-sm">{itemWidth} × {itemHeight} {itemUnit}</span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-indigo-200 font-medium">Exact Target Size:</span>
                      <span className="font-black text-indigo-300 text-base">
                        {exactTargetWidth} × {exactTargetHeight} {itemUnit}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-4 mt-3 border-t border-indigo-400/20 text-center">
                  <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                    <p className="text-[9px] text-indigo-300 font-bold uppercase">Grid</p>
                    <p className="text-xs font-black text-white">{exactTargetGrid}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                    <p className="text-[9px] text-indigo-300 font-bold uppercase">Yield</p>
                    <p className="text-xs font-black text-white">{exactTargetPieces} pcs</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                    <p className="text-[9px] text-emerald-300 font-bold uppercase">Efficiency</p>
                    <p className="text-xs font-black text-emerald-400">100.00%</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                    <p className="text-[9px] text-indigo-300 font-bold uppercase">Waste</p>
                    <p className="text-xs font-black text-emerald-400">0.00%</p>
                  </div>
                </div>
              </div>

              {/* AVAILABLE STOCK MATCH CARD */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-lg relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Layers className="text-blue-600" size={18} />
                      <span className="text-xs font-black uppercase tracking-widest text-slate-800">
                        AVAILABLE STOCK MATCH
                      </span>
                    </div>
                    {bestAvailableMatch && (
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                        bestAvailableMatch.totalWastePct <= 0.001
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : bestAvailableMatch.totalWastePct <= 3.0
                          ? 'bg-teal-50 text-teal-800 border-teal-300'
                          : bestAvailableMatch.totalWastePct <= 10.0
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : bestAvailableMatch.isFeasible
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300'
                      }`}>
                        {bestAvailableMatch.totalWastePct <= 0.001 ? 'EXACT ZERO-WASTE MATCH' : bestAvailableMatch.classification}
                      </span>
                    )}
                  </div>

                  {bestAvailableMatch && bestAvailableMatch.isFeasible ? (
                    <div className="mt-4 space-y-2.5">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-slate-500 font-medium">Closest Available:</span>
                        <span className="font-bold text-slate-900 text-base">
                          {bestAvailableMatch.originalStockWidth} × {bestAvailableMatch.originalStockLength} {bestAvailableMatch.originalStockUnit}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-slate-500 font-medium">Difference from Target:</span>
                        <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                          {diffString}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-rose-600 font-bold">
                      No feasible stock match found.
                    </div>
                  )}
                </div>

                {bestAvailableMatch && bestAvailableMatch.isFeasible && (
                  <div className="grid grid-cols-4 gap-2 pt-4 mt-3 border-t border-slate-100 text-center">
                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Orientation</p>
                      <p className="text-xs font-black text-slate-800">{bestAvailableMatch.orientation}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Yield</p>
                      <p className="text-xs font-black text-slate-800">{bestAvailableMatch.yieldPerSheet} pcs</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Efficiency</p>
                      <p className="text-xs font-black text-emerald-600">{bestAvailableMatch.productEfficiencyPct.toFixed(2)}%</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Waste</p>
                      <p className={`text-xs font-black ${bestAvailableMatch.totalWastePct <= 0.001 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {bestAvailableMatch.totalWastePct.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AVAILABLE STOCK MATCHES (All evaluated stock sheets sorted by priority) */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Award className="text-amber-500" size={18} />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    AVAILABLE STOCK MATCHES (Ranked: Lowest Waste → Highest Waste)
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {topSolutions.length === 5 ? '6 Results Evaluated (5 Stocks + 1 Target)' : `${topSolutions.length} Available Stocks Evaluated`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topSolutions.map((sol, idx) => {
                  const isSelected = selectedSolutionIndex === idx;
                  const rank = idx + 1;
                  const isHighest = rank === 1;

                  return (
                    <div
                      key={sol.stockId || idx}
                      onClick={() => setSelectedSolutionIndex(idx)}
                      className={`cursor-pointer p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-blue-50/70 border-blue-500 shadow-md ring-2 ring-blue-500/20' 
                          : isHighest
                          ? 'bg-emerald-50/20 border-emerald-300 hover:border-emerald-400 hover:shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md flex items-center gap-1 ${
                            isHighest
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : rank === 2
                              ? 'bg-blue-600 text-white'
                              : rank === 3
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-700 text-white'
                          }`}>
                            {isHighest && <Star size={10} className="fill-amber-300 text-amber-300" />}
                            #{rank} Match
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            sol.classification === 'NOT FEASIBLE'
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : sol.totalWastePct <= 0.001
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : sol.classification === 'NEAR ZERO-WASTE'
                              ? 'bg-teal-100 text-teal-800 border-teal-300'
                              : sol.classification === 'LOW WASTE'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : sol.classification === 'MODERATE WASTE'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}>
                            {sol.totalWastePct <= 0.001 ? 'ZERO WASTE' : sol.classification}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">
                              {sol.originalStockWidth} × {sol.originalStockLength} {itemUnit}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {sol.stockName}
                          </p>
                        </div>

                        {/* Visual Result Details */}
                        <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-bold uppercase text-[10px]">Stock:</span>
                            <span className="font-bold text-slate-900">{sol.originalStockWidth} × {sol.originalStockLength} {itemUnit}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-bold uppercase text-[10px]">Required:</span>
                            <span className="font-bold text-slate-700">{itemWidth} × {itemHeight} {itemUnit}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-bold uppercase text-[10px]">Orientation:</span>
                            <span className={`font-bold ${sol.orientation === 'Rotated 90°' ? 'text-amber-700' : 'text-slate-800'}`}>
                              {sol.isFeasible ? sol.orientation : 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-bold uppercase text-[10px]">Grid:</span>
                            <span className="font-bold text-slate-800">{sol.isFeasible ? sol.gridLayout : 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-bold uppercase text-[10px]">Yield:</span>
                            <span className={`font-black ${sol.isFeasible ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {sol.yieldPerSheet} pcs
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-bold uppercase text-[10px]">Efficiency:</span>
                            <span className="font-bold text-slate-800">{sol.productEfficiencyPct.toFixed(2)}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-bold uppercase text-[10px]">Waste:</span>
                            <span className={`font-bold ${sol.totalWastePct <= 0.001 ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {sol.totalWastePct.toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                            <span className="text-slate-400 font-bold uppercase text-[10px]">Status:</span>
                            <span className="font-black text-[11px] text-slate-900">
                              {sol.totalWastePct <= 0.001 ? 'ZERO WASTE' : sol.classification}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-snug">
                          {sol.recommendationReason}
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500 text-[11px]">
                          {sol.isFeasible ? `${sol.yieldPerSheet} pcs/sheet` : 'Cannot cut piece'}
                        </span>
                        <span className={`font-bold text-[11px] flex items-center gap-1 ${
                          isSelected ? 'text-blue-600' : 'text-slate-400'
                        }`}>
                          {isSelected ? 'Active 2D Layout' : 'View 2D Layout'}
                          <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* 6TH RESULT CARD TO FILL THE EMPTY SPACE WHEN 5 STOCKS ARE EVALUATED */}
                {topSolutions.length === 5 && (
                  <div
                    onClick={handleAddTargetAsStock}
                    className="cursor-pointer p-5 rounded-3xl border border-indigo-200 hover:border-indigo-400 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                    title="Click to add this Zero-Waste Target to your Available Stocks"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm">
                          <Star size={10} className="fill-amber-300 text-amber-300" />
                          #6 Match
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-300">
                          ZERO WASTE
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">
                            {exactTargetWidth} × {exactTargetHeight} {itemUnit}
                          </h4>
                          <span className="text-[9px] font-extrabold uppercase text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                            Zero-Waste Target
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Calculated Ideal Target Stock
                        </p>
                      </div>

                      {/* Visual Result Details */}
                      <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Stock:</span>
                          <span className="font-bold text-indigo-900">{exactTargetWidth} × {exactTargetHeight} {itemUnit}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Required:</span>
                          <span className="font-bold text-slate-700">{itemWidth} × {itemHeight} {itemUnit}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Orientation:</span>
                          <span className={`font-bold ${isRotatedBest ? 'text-amber-700' : 'text-slate-800'}`}>
                            {isRotatedBest ? 'Rotated 90°' : 'Normal'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Grid:</span>
                          <span className="font-bold text-slate-800">{exactTargetGrid}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Yield:</span>
                          <span className="font-black text-emerald-600">
                            {exactTargetPieces} pcs
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Efficiency:</span>
                          <span className="font-bold text-emerald-600">100.00%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Waste:</span>
                          <span className="font-bold text-emerald-600">0.00%</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Status:</span>
                          <span className="font-black text-[11px] text-emerald-700">
                            ZERO WASTE (100% UTILIZATION)
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-snug">
                        Exact sheet size calculated for 100% material utilization without cutting waste.
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-indigo-600 font-bold text-[11px] flex items-center gap-1">
                        <Plus size={13} />
                        Add as Stock 6
                      </span>
                      <span className="font-bold text-[11px] text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        Use Target
                        <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 3 — STOCK MATCHING & YIELD ANALYSIS TABLE (RESPONSIVE WITH COLLAPSIBLE PANELS) */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="text-blue-600" size={18} />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    SECTION 3 — Stock Matching & Yield Analysis (Top 10 Results)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-medium">
                    Showing Top {top10SectionSolutions.length} evaluated sheet sizes (out of {solutions.length} total)
                  </span>
                  <span className="hidden sm:inline-block text-[10px] text-slate-400 font-medium">
                    • Tap row for full calculations
                  </span>
                </div>
              </div>

              {/* DESKTOP / TABLET VIEW (md and up) */}
              <div className="hidden md:block overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3">Stock Size</th>
                      <th className="py-3 px-3">Best Orientation</th>
                      <th className="py-3 px-3">Grid Layout</th>
                      <th className="py-3 px-3 text-right">Yield</th>
                      <th className="py-3 px-3 text-right">Product Eff. %</th>
                      <th className="py-3 px-3 text-right">Waste %</th>
                      <th className="py-3 px-3 text-center">Classification</th>
                      <th className="py-3 px-3 text-center">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {top10SectionSolutions.map((s, idx) => {
                      const isExpanded = expandedDetailsId === s.stockId;
                      return (
                        <React.Fragment key={s.stockId}>
                          <tr 
                            onClick={() => setExpandedDetailsId(isExpanded ? null : s.stockId)}
                            className={`cursor-pointer hover:bg-slate-50/80 transition-colors ${
                              isExpanded ? 'bg-blue-50/40' : ''
                            } ${!s.isFeasible ? 'opacity-60 bg-rose-50/20' : ''}`}
                          >
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black text-slate-400">#{idx + 1}</span>
                                <span className="font-bold text-slate-900">{s.stockName}</span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {s.originalStockWidth} × {s.originalStockLength} {s.originalStockUnit}
                                {s.stockGsm && ` • ${s.stockGsm} GSM`}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              {s.isFeasible ? (
                                <span className="font-semibold text-slate-700">{s.orientation}</span>
                              ) : (
                                <span className="text-rose-500 font-bold">N/A</span>
                              )}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-800">
                              {s.isFeasible ? s.gridLayout : '—'}
                            </td>
                            <td className="py-3 px-3 text-right font-black text-slate-900">
                              {s.isFeasible ? `${s.yieldPerSheet} pcs` : '0'}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-emerald-600">
                              {s.isFeasible ? `${s.productEfficiencyPct.toFixed(2)}%` : '0.00%'}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-rose-500">
                              {s.isFeasible ? `${s.totalWastePct.toFixed(2)}%` : '100.00%'}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                                s.classification === 'TRUE ZERO-WASTE' ? 'bg-emerald-100 text-emerald-800' :
                                s.classification === 'NEAR ZERO-WASTE' ? 'bg-teal-100 text-teal-800' :
                                s.classification === 'EXCELLENT' ? 'bg-blue-100 text-blue-800' :
                                s.classification === 'ACCEPTABLE' ? 'bg-amber-100 text-amber-800' :
                                'bg-rose-100 text-rose-800'
                              }`}>
                                {s.classification}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedDetailsId(isExpanded ? null : s.stockId);
                                }}
                                className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                                title="Toggle Comprehensive Calculations"
                              >
                                <ChevronDown size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-blue-600' : ''}`} />
                              </button>
                            </td>
                          </tr>

                          {/* Expandable Details Drawer for Desktop */}
                          {isExpanded && (
                            <tr className="bg-slate-50/90">
                              <td colSpan={8} className="p-4 border-b border-slate-200">
                                <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-black uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                        Calculation Breakdown
                                      </span>
                                      <span className="text-xs font-bold text-slate-800">
                                        {s.stockName} ({s.originalStockWidth} × {s.originalStockLength} {s.originalStockUnit})
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => {
                                        const solIndex = solutions.findIndex(item => item.stockId === s.stockId);
                                        if (solIndex >= 0) setSelectedSolutionIndex(solIndex);
                                        setActiveTabSection('grid');
                                      }}
                                      className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                      <span>Open in 2D Diagram</span>
                                      <ArrowRight size={12} />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
                                    <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                                      <span className="text-slate-400 block uppercase font-bold text-[9px]">Used Dimensions</span>
                                      <span className="font-bold text-slate-800">
                                        {formatDimension(s.usedWidthMm, itemUnit)} × {formatDimension(s.usedHeightMm, itemUnit)}
                                      </span>
                                    </div>
                                    <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                                      <span className="text-slate-400 block uppercase font-bold text-[9px]">Remaining Strips</span>
                                      <span className="font-bold text-slate-800">
                                        {formatDimension(s.remainingWidthMm, itemUnit)} (W) × {formatDimension(s.remainingHeightMm, itemUnit)} (L)
                                      </span>
                                    </div>
                                    <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                                      <span className="text-slate-400 block uppercase font-bold text-[9px]">Total Area Used</span>
                                      <span className="font-bold text-emerald-600">{formatArea(s.productAreaMm2)}</span>
                                    </div>
                                    <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                                      <span className="text-slate-400 block uppercase font-bold text-[9px]">Kerf Consumption</span>
                                      <span className="font-bold text-rose-500">{s.kerfConsumptionPct.toFixed(2)}% ({formatArea(s.kerfAreaMm2)})</span>
                                    </div>
                                    <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                                      <span className="text-slate-400 block uppercase font-bold text-[9px]">Reusable Offcut Area</span>
                                      <span className="font-bold text-teal-600">{formatArea(s.reusableOffcutAreaMm2)}</span>
                                    </div>
                                    <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                                      <span className="text-slate-400 block uppercase font-bold text-[9px]">Estimated Guillotine Cuts</span>
                                      <span className="font-bold text-slate-800">{s.estimatedCuts} straight cuts</span>
                                    </div>
                                    <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                                      <span className="text-slate-400 block uppercase font-bold text-[9px]">Calculated GSM Weights</span>
                                      <span className="font-bold text-slate-800">
                                        {s.sheetWeightKg !== undefined ? `${s.sheetWeightKg.toFixed(2)} kg/sheet` : '—'}
                                        {s.pieceWeightGrams !== undefined ? ` • ${s.pieceWeightGrams.toFixed(1)}g/pc` : ''}
                                      </span>
                                    </div>
                                    <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                                      <span className="text-slate-400 block uppercase font-bold text-[9px]">Order Tonnage / Scrap</span>
                                      <span className="font-bold text-slate-800">
                                        {s.totalWeightKg !== undefined && s.totalWeightKg > 0 
                                          ? `${s.totalWeightKg >= 1000 ? (s.totalWeightKg / 1000).toFixed(2) + ' t' : s.totalWeightKg.toFixed(1) + ' kg'}`
                                          : '—'}
                                        {s.wasteWeightKg !== undefined && s.wasteWeightKg > 0 ? ` (${s.wasteWeightKg.toFixed(1)}kg scrap)` : ''}
                                      </span>
                                    </div>
                                    <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                                      <span className="text-slate-400 block uppercase font-bold text-[9px]">In-Stock Quantity</span>
                                      <span className="font-bold text-slate-800">{s.qtyAvailable} sheets</span>
                                    </div>
                                    <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                                      <span className="text-slate-400 block uppercase font-bold text-[9px]">Shortage for {requiredQty} pcs</span>
                                      <span className={`font-bold ${s.shortageSheets > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {s.shortageSheets > 0 ? `${s.shortageSheets} sheets shortage` : 'Fully in stock'}
                                      </span>
                                    </div>
                                    <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                                      <span className="text-slate-400 block uppercase font-bold text-[9px]">Sheets Required</span>
                                      <span className="font-bold text-slate-800">{s.sheetsRequired} sheets for order</span>
                                    </div>
                                    <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                                      <span className="text-slate-400 block uppercase font-bold text-[9px]">Total Produced</span>
                                      <span className="font-bold text-slate-800">
                                        {s.yieldPerSheet * s.sheetsRequired} pcs ({Math.max(0, (s.yieldPerSheet * s.sheetsRequired) - (parseInt(requiredQty) || 0))} excess)
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE RESPONSIVE ACCORDION VIEW (under md) */}
              <div className="block md:hidden space-y-3">
                {top10SectionSolutions.map((s, idx) => {
                  const isExpanded = expandedDetailsId === s.stockId;
                  const rank = idx + 1;
                  const isZeroWaste = s.totalWastePct <= 0.05 || s.classification === 'TRUE ZERO-WASTE';

                  return (
                    <div
                      key={`mob-${s.stockId}`}
                      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                        isExpanded
                          ? 'bg-blue-50/30 border-blue-400 shadow-sm ring-1 ring-blue-500/20'
                          : isZeroWaste
                          ? 'bg-emerald-50/20 border-emerald-200 hover:border-emerald-300'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Mobile Row Summary Header (Tap to expand/collapse) */}
                      <div
                        onClick={() => setExpandedDetailsId(isExpanded ? null : s.stockId)}
                        className="p-3.5 cursor-pointer flex items-center justify-between gap-3 select-none"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                              isZeroWaste
                                ? 'bg-emerald-600 text-white'
                                : rank === 1
                                ? 'bg-blue-600 text-white'
                                : rank === 2
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-700 text-white'
                            }`}
                          >
                            #{rank}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 truncate">{s.stockName}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                                s.classification === 'TRUE ZERO-WASTE' ? 'bg-emerald-100 text-emerald-800' :
                                s.classification === 'NEAR ZERO-WASTE' ? 'bg-teal-100 text-teal-800' :
                                s.classification === 'EXCELLENT' ? 'bg-blue-100 text-blue-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {s.classification}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                              <span>{s.originalStockWidth} × {s.originalStockLength} {s.originalStockUnit}</span>
                              {s.stockGsm && <span>• {s.stockGsm} GSM</span>}
                              <span>• {s.orientation} ({s.gridLayout})</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Key metric pills + Chevron */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <div className="text-xs font-black text-slate-900">{s.yieldPerSheet} pcs</div>
                            <div className="text-[10px] font-bold text-emerald-600">{s.productEfficiencyPct.toFixed(1)}% eff</div>
                          </div>
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors">
                            <ChevronDown size={15} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-blue-600' : ''}`} />
                          </div>
                        </div>
                      </div>

                      {/* Mobile Collapsible Panel with Full Calculation Details */}
                      {isExpanded && (
                        <div className="p-3.5 bg-white border-t border-slate-100 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              Complete Calculation Details
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const solIndex = solutions.findIndex(item => item.stockId === s.stockId);
                                if (solIndex >= 0) setSelectedSolutionIndex(solIndex);
                                setActiveTabSection('grid');
                              }}
                              className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <span>2D Diagram</span>
                              <ArrowRight size={12} />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <span className="text-slate-400 block uppercase font-bold text-[9px]">Used Area / Eff.</span>
                              <span className="font-bold text-emerald-600">{s.productEfficiencyPct.toFixed(2)}% ({formatArea(s.productAreaMm2)})</span>
                            </div>

                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <span className="text-slate-400 block uppercase font-bold text-[9px]">Waste %</span>
                              <span className="font-bold text-rose-500">{s.totalWastePct.toFixed(2)}% waste</span>
                            </div>

                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <span className="text-slate-400 block uppercase font-bold text-[9px]">Used Dimensions</span>
                              <span className="font-bold text-slate-800">
                                {formatDimension(s.usedWidthMm, itemUnit)} × {formatDimension(s.usedHeightMm, itemUnit)}
                              </span>
                            </div>

                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <span className="text-slate-400 block uppercase font-bold text-[9px]">Remaining Offcut</span>
                              <span className="font-bold text-slate-800">
                                {formatDimension(s.remainingWidthMm, itemUnit)} × {formatDimension(s.remainingHeightMm, itemUnit)}
                              </span>
                            </div>

                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <span className="text-slate-400 block uppercase font-bold text-[9px]">Kerf Consumption</span>
                              <span className="font-bold text-slate-800">{s.kerfConsumptionPct.toFixed(2)}% ({formatArea(s.kerfAreaMm2)})</span>
                            </div>

                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <span className="text-slate-400 block uppercase font-bold text-[9px]">Guillotine Cuts</span>
                              <span className="font-bold text-slate-800">{s.estimatedCuts} straight cuts</span>
                            </div>

                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <span className="text-slate-400 block uppercase font-bold text-[9px]">GSM Weights</span>
                              <span className="font-bold text-slate-800">
                                {s.sheetWeightKg !== undefined ? `${s.sheetWeightKg.toFixed(2)}kg/sheet` : '—'}
                                {s.pieceWeightGrams !== undefined ? ` • ${s.pieceWeightGrams.toFixed(1)}g/pc` : ''}
                              </span>
                            </div>

                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <span className="text-slate-400 block uppercase font-bold text-[9px]">Batch Tonnage</span>
                              <span className="font-bold text-slate-800">
                                {s.totalWeightKg !== undefined && s.totalWeightKg > 0 
                                  ? `${s.totalWeightKg >= 1000 ? (s.totalWeightKg / 1000).toFixed(2) + ' t' : s.totalWeightKg.toFixed(1) + ' kg'}`
                                  : '—'}
                              </span>
                            </div>

                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <span className="text-slate-400 block uppercase font-bold text-[9px]">In Stock</span>
                              <span className="font-bold text-slate-800">{s.qtyAvailable} sheets available</span>
                            </div>

                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <span className="text-slate-400 block uppercase font-bold text-[9px]">Required / Balance</span>
                              <span className={`font-bold ${s.shortageSheets > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {s.sheetsRequired} sheets ({s.shortageSheets > 0 ? `${s.shortageSheets} short` : 'Covered'})
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Link to 2D Diagram & Plan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setActiveTabSection('grid')}
                className="p-5 bg-white rounded-3xl border border-slate-200 hover:border-blue-400 transition-all text-left flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Layers size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-800">Inspect 2D Diagram</h4>
                    <p className="text-[11px] text-slate-400">View proportional layout, kerf gaps & dimension lines</p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => setActiveTabSection('plan')}
                className="p-5 bg-white rounded-3xl border border-slate-200 hover:border-emerald-400 transition-all text-left flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Scissors size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-800">Guillotine Cutting Plan</h4>
                    <p className="text-[11px] text-slate-400">Step-by-step measurable cuts & blade sequence</p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        )}

        {/* TAB CONTENT: 2. 2D VISUAL GRID */}
        {activeTabSection === 'grid' && activeSolution && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="text-blue-600" size={18} />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  SECTION 5 — 2D Proportional Guillotine Cutting Diagram
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Viewing stock:</span>
                <select
                  value={selectedSolutionIndex}
                  onChange={(e) => setSelectedSolutionIndex(parseInt(e.target.value))}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 outline-none"
                >
                  {solutions.filter(s => s.isFeasible).map((s, idx) => (
                    <option key={s.stockId} value={idx}>
                      #{idx + 1}: {s.stockName} ({s.yieldPerSheet} pcs, {s.totalWastePct.toFixed(1)}% waste)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <CuttingDiagram solution={activeSolution} displayUnit={itemUnit} />
          </div>
        )}

        {/* TAB CONTENT: 3. CUTTING PLAN */}
        {activeTabSection === 'plan' && activeSolution && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Scissors className="text-rose-500" size={18} />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  SECTION 6 — Step-by-Step Guillotine Cutting Plan ({activeSolution.cuttingSequence.length} Steps)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCuttingPlan}
                  className="flex items-center gap-1.5 text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl transition-all shadow-sm"
                >
                  <Copy size={13} />
                  Copy Cutting Plan
                </button>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">STOCK SHEET</span>
                  <span className="font-bold text-slate-800">
                    {activeSolution.stockName} ({formatDimension(activeSolution.stockWidthMm, itemUnit)} × {formatDimension(activeSolution.stockLengthMm, itemUnit)})
                    {activeSolution.stockGsm && ` • ${activeSolution.stockGsm} GSM`}
                    {activeSolution.sheetWeightKg !== undefined && ` (~${activeSolution.sheetWeightKg.toFixed(2)} kg)`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">PRODUCT PIECE</span>
                  <span className="font-bold text-slate-800">
                    {itemWidth} × {itemHeight} {itemUnit}
                    {activeSolution.pieceWeightGrams !== undefined && ` (${activeSolution.pieceWeightGrams.toFixed(1)} g/pc)`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">BLADE KERF</span>
                  <span className="font-bold text-rose-600">{kerf} {kerfUnit}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">TOTAL FINISHED PIECES</span>
                  <span className="font-bold text-emerald-600">{activeSolution.yieldPerSheet} pcs / sheet</span>
                </div>
                {activeSolution.totalWeightKg !== undefined && activeSolution.totalWeightKg > 0 && (
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">ORDER PAPER WEIGHT</span>
                    <span className="font-bold text-blue-700">
                      {activeSolution.totalWeightKg >= 1000 ? `${(activeSolution.totalWeightKg / 1000).toFixed(3)} t` : `${activeSolution.totalWeightKg.toFixed(1)} kg`}
                      {activeSolution.wasteWeightKg !== undefined && ` (${activeSolution.wasteWeightKg.toFixed(1)} kg scrap)`}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2">
                {activeSolution.cuttingSequence.map((step) => (
                  <div 
                    key={step.cutNumber}
                    className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/40 hover:border-blue-200 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#0f2a43] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {step.cutNumber}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 uppercase">
                          {step.direction} at <span className="text-blue-600 font-black">{step.positionFormatted}</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          STEP {step.cutNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700">
                        <strong>Resulting section:</strong> {step.resultingSection}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {step.purpose}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: 4. ZERO-WASTE TARGETS */}
        {activeTabSection === 'targets' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="text-indigo-600" size={18} />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  SECTION 2 — Exact Zero-Waste / Minimum-Waste Stock Targets
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Procurement & Mill Purchase Targets for Finish Piece: {itemWidth} × {itemHeight} {itemUnit}
              </span>
            </div>

            {/* Zero-waste targets table as specified in Section 27 */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="bg-indigo-50/60 border border-indigo-200/60 p-4 rounded-2xl text-xs text-indigo-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Target size={15} />
                  Mill Purchase Target Generator:
                </p>
                <p className="text-[11px] text-indigo-700 leading-relaxed">
                  If current warehouse sheets result in high waste, order sheets matching any of these exact calculated dimensions. Each target satisfies 100% material utilization with your {kerf} {kerfUnit} blade kerf allowance included.
                </p>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3">Grid</th>
                      <th className="py-3 px-3">Orientation</th>
                      <th className="py-3 px-3 text-right">Target Width</th>
                      <th className="py-3 px-3 text-right">Target Height</th>
                      <th className="py-3 px-3 text-right">Pieces</th>
                      <th className="py-3 px-3 text-center">Kerf Included</th>
                      <th className="py-3 px-3 text-right">Product Waste</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold">
                    {zeroWasteTargets.map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{t.grid}</td>
                        <td className="py-2.5 px-3 text-slate-600">{t.orientation}</td>
                        <td className="py-2.5 px-3 text-right font-black text-indigo-600">{t.targetWidthFormatted}</td>
                        <td className="py-2.5 px-3 text-right font-black text-indigo-600">{t.targetHeightFormatted}</td>
                        <td className="py-2.5 px-3 text-right text-slate-800">{t.pieces} pcs</td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{t.kerfIncluded ? 'Yes' : 'No'}</td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-600">0.00%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: 5. MASTER MULTI-STOCK COMBINER */}
        {activeTabSection === 'combiner' && multiStockResult && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="text-emerald-600" size={18} />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  SECTION 7 — Master Stock Combiner (Multi-Stock Allocation)
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Target: {requiredQty} finished pieces
              </span>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Sheets Used</p>
                  <p className="text-2xl font-black text-slate-900">{multiStockResult.totalSheets}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Production</p>
                  <p className="text-2xl font-black text-blue-600">{multiStockResult.totalPieces} <span className="text-xs font-normal">pcs</span></p>
                  <p className="text-[9px] text-slate-400">+{multiStockResult.extraPieces} extra</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Combined Efficiency</p>
                  <p className="text-2xl font-black text-emerald-600">{multiStockResult.overallEfficiencyPct.toFixed(2)}%</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Combined Waste</p>
                  <p className="text-2xl font-black text-rose-500">{multiStockResult.overallWastePct.toFixed(2)}%</p>
                </div>
              </div>

              {/* Allocation per stock size */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Recommended Multi-Sheet Breakdown:
                </h4>
                <div className="space-y-3">
                  {multiStockResult.plans.map((plan, idx) => (
                    <div 
                      key={idx}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50/50"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <h5 className="text-sm font-bold text-slate-900">{plan.stock.name}</h5>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            ({plan.stock.originalWidth} × {plan.stock.originalLength} {plan.stock.originalUnit})
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Yield: {plan.solution.yieldPerSheet} pcs/sheet • Efficiency: {plan.solution.productEfficiencyPct.toFixed(1)}% • Waste: {plan.solution.totalWastePct.toFixed(1)}%
                        </p>
                      </div>

                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Sheets to Use</span>
                          <span className="text-lg font-black text-slate-900">{plan.sheetsToUse} sheets</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Pcs Produced</span>
                          <span className="text-lg font-black text-blue-600">{plan.piecesProduced} pcs</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: 6. REAL INVENTORY MATCHES */}
        {activeTabSection === 'realInventory' && (
          <div className="space-y-8">
            {/* Header Banner */}
            <div className="bg-gradient-to-br from-[#0f2a43] via-[#1a3a5a] to-[#254d74] text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-blue-500/20 text-blue-300 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider border border-blue-400/30 flex items-center gap-1.5">
                      <Warehouse size={12} />
                      LIVE ENERPACK WAREHOUSE SCAN
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-300 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase border border-emerald-400/30">
                      {top5RealInventorySolutions.length} Top Matches Ranked
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight">
                    Real Inventory Optimization (Full Warehouse)
                  </h3>
                  <p className="text-xs text-blue-200 font-medium">
                    Exhaustive 2D guillotine cut evaluation across all warehouse stock sheets for finished piece <span className="text-white font-bold">{itemWidth} × {itemHeight} {itemUnit}</span> (Blade Kerf: <span className="text-white font-bold">{kerf} {kerfUnit}</span>).
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center">
                    <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Sizes Scanned</p>
                    <p className="text-2xl font-black text-white">{realInventorySolutions.length}</p>
                    <p className="text-[9px] text-blue-300">Entire Warehouse</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center">
                    <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Feasible Sheets</p>
                    <p className="text-2xl font-black text-emerald-300">
                      {realInventorySolutions.filter(s => s.isFeasible).length}
                    </p>
                    <p className="text-[9px] text-emerald-200">Fits Finished Piece</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center col-span-2 sm:col-span-1">
                    <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Best Waste %</p>
                    <p className="text-2xl font-black text-amber-300">
                      {top5RealInventorySolutions[0] ? `${top5RealInventorySolutions[0].totalWastePct.toFixed(2)}%` : 'N/A'}
                    </p>
                    <p className="text-[9px] text-amber-200">#1 Warehouse Match</p>
                  </div>
                </div>
              </div>
            </div>

            {/* TOP 5 BEST MATCHING RESULTS FROM REAL INVENTORY */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Award className="text-amber-500" size={20} />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Five Best Matching Results from Real Inventory
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Top 5 sheets with minimum waste percentage and highest yield, directly available in Enerpack warehouse stock.
                    </p>
                  </div>
                </div>
                <div className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
                  Priority 1 to 4 Hierarchy Applied
                </div>
              </div>

              {top5RealInventorySolutions.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <Package className="mx-auto text-slate-400 mb-2" size={32} />
                  <p className="text-sm font-bold text-slate-600">No feasible real inventory sheets found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    The requested piece ({itemWidth} × {itemHeight} {itemUnit}) is larger than warehouse sheets or exceeded maximum waste limit.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                  {top5RealInventorySolutions.map((sol, idx) => {
                    const isRank1 = idx === 0;
                    return (
                      <div
                        key={sol.stockId}
                        className={`rounded-3xl border p-5 flex flex-col justify-between transition-all relative overflow-hidden bg-white shadow-sm hover:shadow-md ${
                          isRank1 
                            ? 'border-emerald-300 ring-2 ring-emerald-500/20 bg-gradient-to-b from-emerald-50/30 to-white' 
                            : 'border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {/* Top Rank Badge & Classification */}
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                              isRank1 
                                ? 'bg-emerald-600 text-white shadow-sm' 
                                : 'bg-slate-900 text-white'
                            }`}>
                              {isRank1 && <Star size={10} className="fill-amber-300 text-amber-300" />}
                              #{idx + 1} MATCH
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase border ${
                              sol.totalWastePct <= 0.001
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : sol.totalWastePct <= 3.0
                                ? 'bg-teal-50 text-teal-800 border-teal-300'
                                : sol.totalWastePct <= 10.0
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}>
                              {sol.totalWastePct <= 0.001 ? 'ZERO WASTE' : sol.classification}
                            </span>
                          </div>

                          {/* Dimensions & Name */}
                          <div className="space-y-1">
                            <h4 className="text-lg font-black text-slate-900">
                              {sol.originalStockWidth} × {sol.originalStockLength} {sol.originalStockUnit}
                            </h4>
                            <p className="text-[11px] font-bold text-blue-700 truncate" title={sol.stockName}>
                              {sol.stockName}
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold truncate">
                              {sol.sectionTitle || 'Warehouse Inventory'}
                            </p>
                          </div>

                          {/* In-stock status */}
                          <div className="mt-3 py-1.5 px-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">In Stock:</span>
                            <span className={`font-black ${sol.qtyAvailable > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                              {sol.qtyAvailable.toLocaleString()} sheets
                            </span>
                          </div>

                          {/* Key Performance Metrics */}
                          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
                            <div className="bg-slate-50 p-2 rounded-xl">
                              <span className="text-[9px] font-bold text-slate-400 block uppercase">Yield / Sheet</span>
                              <span className="text-base font-black text-slate-900">{sol.yieldPerSheet} pcs</span>
                              <span className="text-[9px] text-slate-500 font-bold block">{sol.gridLayout}</span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-xl">
                              <span className="text-[9px] font-bold text-slate-400 block uppercase">Waste %</span>
                              <span className={`text-base font-black ${
                                sol.totalWastePct <= 3 ? 'text-emerald-600' : sol.totalWastePct <= 10 ? 'text-blue-600' : 'text-amber-600'
                              }`}>
                                {sol.totalWastePct.toFixed(2)}%
                              </span>
                              <span className="text-[9px] text-slate-500 block">Eff: {sol.productEfficiencyPct.toFixed(1)}%</span>
                            </div>
                          </div>

                          <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between px-1">
                            <span>Orientation:</span>
                            <span className="font-bold text-slate-700">{sol.orientation}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                          <button
                            onClick={() => handleInspectRealStock(sol)}
                            className="w-full flex items-center justify-center gap-1.5 bg-[#0f2a43] hover:bg-slate-800 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all shadow-sm"
                          >
                            <Scissors size={13} />
                            <span>Inspect 2D Diagram</span>
                          </button>
                          {sol.qtyAvailable > 0 && (
                            <button
                              onClick={() => {
                                setReservingStockItem({ sol, sheets: sol.sheetsRequired || 1 });
                                setShowReserveModal(true);
                              }}
                              className="w-full flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs py-1.5 px-3 rounded-xl transition-all border border-emerald-200"
                            >
                              <Package size={13} />
                              <span>Reserve Stock</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* FULL INVENTORY EVALUATION RESULTS TABLE */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Database className="text-blue-600" size={20} />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Full Warehouse Inventory Results ({filteredRealInventorySolutions.length} sizes)
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      All scanned sheets from Enerpack central warehouse ranked by guillotine cut optimization
                    </p>
                  </div>
                </div>

                {/* Filters & Export */}
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search size, GSM..."
                      value={realInvSearch}
                      onChange={(e) => setRealInvSearch(e.target.value)}
                      className="w-full sm:w-44 bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <select
                    value={realInvGsmFilter}
                    onChange={(e) => setRealInvGsmFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="all">All GSMs</option>
                    {availableGsms.map(g => (
                      <option key={g} value={g}>{g} GSM</option>
                    ))}
                  </select>

                  <select
                    value={realInvSortBy}
                    onChange={(e) => setRealInvSortBy(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="waste">Sort: Lowest Waste</option>
                    <option value="yield">Sort: Highest Yield</option>
                    <option value="stock">Sort: Most In-Stock</option>
                  </select>

                  <button
                    onClick={handleExportRealInventoryExcel}
                    className="flex items-center gap-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all shadow-sm"
                  >
                    <FileSpreadsheet size={14} />
                    <span>Export XLSX</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/50">
                      <th className="py-3 px-3">Rank</th>
                      <th className="py-3 px-3">Stock Sheet Size</th>
                      <th className="py-3 px-3">GSM & Warehouse Section</th>
                      <th className="py-3 px-3 text-center">In Stock</th>
                      <th className="py-3 px-3 text-center">Feasible</th>
                      <th className="py-3 px-3 text-center">Orientation</th>
                      <th className="py-3 px-3 text-center">Grid</th>
                      <th className="py-3 px-3 text-right">Yield</th>
                      <th className="py-3 px-3 text-right">Efficiency %</th>
                      <th className="py-3 px-3 text-right">Waste %</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRealInventorySolutions.map((sol, idx) => (
                      <tr 
                        key={sol.stockId}
                        className={`hover:bg-blue-50/40 transition-colors ${
                          idx < 5 && sol.isFeasible ? 'bg-emerald-50/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-black text-slate-800">
                          #{idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">
                            {sol.originalStockWidth} × {sol.originalStockLength} {sol.originalStockUnit}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {sol.stockId}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-700 block">
                            {sol.stockGsm ? `${sol.stockGsm} GSM` : 'Standard'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {sol.sectionTitle || 'General Stock'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700">
                          {sol.qtyAvailable.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {sol.isFeasible ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 size={10} /> YES
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <AlertCircle size={10} /> NO
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center text-[11px] font-semibold text-slate-600">
                          {sol.isFeasible ? sol.orientation : '—'}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                          {sol.isFeasible ? sol.gridLayout : '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-slate-900 text-sm">
                          {sol.isFeasible ? `${sol.yieldPerSheet} pcs` : '0'}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-700">
                          {sol.isFeasible ? `${sol.productEfficiencyPct.toFixed(2)}%` : '0.00%'}
                        </td>
                        <td className="py-3 px-3 text-right font-black">
                          {sol.isFeasible ? (
                            <span className={
                              sol.totalWastePct <= 3 ? 'text-emerald-600' : sol.totalWastePct <= 10 ? 'text-blue-600' : 'text-amber-600'
                            }>
                              {sol.totalWastePct.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-slate-400">100.00%</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase border ${
                            sol.totalWastePct <= 0.001
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : sol.totalWastePct <= 3.0
                              ? 'bg-teal-50 text-teal-800 border-teal-300'
                              : sol.totalWastePct <= 10.0
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : sol.isFeasible
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}>
                            {sol.totalWastePct <= 0.001 ? 'ZERO WASTE' : sol.classification}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {sol.isFeasible ? (
                            <button
                              onClick={() => handleInspectRealStock(sol)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-lg text-[10px] font-bold transition-all inline-flex items-center gap-1 text-slate-700"
                              title="Inspect this stock in 2D diagram"
                            >
                              <Scissors size={11} /> 2D View
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 8 — CALCULATION DETAILS & AUDITABILITY */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Info className="text-slate-500" size={18} />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                SECTION 8 — Mathematical Audit & Calculation Details
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Standard 2D Guillotine Model
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calculation Method</p>
              <p className="font-bold text-slate-800">2D Rectangular Guillotine Optimization</p>
              <p className="text-[10px] text-slate-400">Exhaustive grid enumeration + 90° rotation</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Normalized Units</p>
              <p className="font-bold text-slate-800">Millimetres (mm)</p>
              <p className="text-[10px] text-slate-400">Zero floating-point rounding during search</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kerf / Trim Spacing</p>
              <p className="font-bold text-rose-600">{kerf} {kerfUnit} per guillotine cut</p>
              <p className="text-[10px] text-slate-400">Required: m×Wi + (m-1)×t</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Physical Constraints</p>
              <p className="font-bold text-emerald-600">Guillotine Separable Cuts Only</p>
              <p className="text-[10px] text-slate-400">Guaranteed practical sheet cutter feasibility</p>
            </div>
          </div>
        </div>

        {/* SECTION 9 — FIVE BEST MATCHING RESULTS FROM REAL INVENTORY */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-200">
                <Warehouse size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    SECTION 9 — FIVE BEST MATCHING RESULTS FROM REAL INVENTORY
                  </h3>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    Full Inventory Scan
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Direct warehouse inventory matches evaluated against {itemWidth} × {itemHeight} {itemUnit} finished piece
                </p>
              </div>
            </div>

            <button
              onClick={handleGoToFullInventoryPage}
              className="group flex items-center gap-2 text-xs font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white px-4 py-2.5 rounded-2xl transition-all duration-200 shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0 border border-blue-400/30 cursor-pointer"
              title="Open full warehouse inventory management page"
            >
              <Package size={15} className="text-blue-200 transition-transform duration-200 group-hover:scale-110" />
              <span>Go to Full Inventory Page</span>
              <ArrowUpRight size={15} className="text-blue-200 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>

          {top5RealInventorySolutions.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Package className="mx-auto text-slate-400 mb-2" size={28} />
              <p className="text-xs font-bold text-slate-600">No feasible real inventory sheets found for this size.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {top5RealInventorySolutions.map((sol, idx) => {
                const isFirst = idx === 0;
                return (
                  <div
                    key={sol.stockId}
                    className={`rounded-2xl border p-4 flex flex-col justify-between transition-all bg-white relative ${
                      isFirst 
                        ? 'border-emerald-300 ring-2 ring-emerald-500/20 bg-gradient-to-b from-emerald-50/40 to-white' 
                        : 'border-slate-200 hover:border-blue-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                          isFirst ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white'
                        }`}>
                          {isFirst && <Star size={9} className="fill-amber-300 text-amber-300" />}
                          #{idx + 1} Real Match
                        </span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase border ${
                          sol.totalWastePct <= 0.001
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : sol.totalWastePct <= 3.0
                            ? 'bg-teal-50 text-teal-800 border-teal-300'
                            : 'bg-blue-50 text-blue-800 border-blue-300'
                        }`}>
                          {sol.totalWastePct <= 0.001 ? 'ZERO WASTE' : sol.classification}
                        </span>
                      </div>

                      <h4 className="text-base font-black text-slate-900 mt-1">
                        {sol.originalStockWidth} × {sol.originalStockLength} {sol.originalStockUnit}
                      </h4>
                      <p className="text-[10px] font-bold text-blue-700 truncate" title={sol.stockName}>
                        {sol.stockName}
                      </p>
                      <p className="text-[9px] text-slate-400 truncate">
                        {sol.sectionTitle || 'Warehouse'}
                      </p>

                      <div className="mt-2 py-1 px-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">In Stock:</span>
                        <span className="font-bold text-emerald-700">{sol.qtyAvailable.toLocaleString()} sheets</span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 mt-2.5 pt-2 border-t border-slate-100 text-center">
                        <div className="bg-slate-50 p-1.5 rounded-lg">
                          <span className="text-[8px] font-bold text-slate-400 block uppercase">Yield</span>
                          <span className="text-xs font-black text-slate-900">{sol.yieldPerSheet} pcs</span>
                          <span className="text-[8px] text-slate-500 font-bold block">{sol.gridLayout}</span>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded-lg">
                          <span className="text-[8px] font-bold text-slate-400 block uppercase">Waste %</span>
                          <span className={`text-xs font-black ${
                            sol.totalWastePct <= 3 ? 'text-emerald-600' : 'text-blue-600'
                          }`}>
                            {sol.totalWastePct.toFixed(2)}%
                          </span>
                          <span className="text-[8px] text-slate-500 block">Eff: {sol.productEfficiencyPct.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <button
                        onClick={() => handleInspectRealStock(sol)}
                        className="w-full flex items-center justify-center gap-1 bg-[#0f2a43] hover:bg-slate-800 text-white font-bold text-[11px] py-1.5 px-2 rounded-xl transition-all cursor-pointer"
                      >
                        <Scissors size={12} />
                        <span>Inspect 2D Diagram</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SAVE OPTIMIZATION MODAL */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Save size={18} className="text-blue-600" />
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Save Optimization Job</h4>
              </div>
              <button 
                onClick={() => setShowSaveModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer / Order Ref</label>
                <input
                  type="text"
                  value={jobCustomer}
                  onChange={(e) => setJobCustomer(e.target.value)}
                  placeholder="e.g. Apex Packaging / PO-9821"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product Name / Box Item</label>
                <input
                  type="text"
                  value={jobProductName}
                  onChange={(e) => setJobProductName(e.target.value)}
                  placeholder="e.g. 5-Ply Top Flap Blank"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold outline-none focus:border-blue-500"
                />
              </div>

              {activeSolution && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-[11px] text-slate-600">
                  <p><strong>Stock Sheet:</strong> {activeSolution.stockName}</p>
                  <p><strong>Layout:</strong> {activeSolution.gridLayout} ({activeSolution.yieldPerSheet} pcs/sheet)</p>
                  <p><strong>Required Quantity:</strong> {requiredQty} pcs ({activeSolution.sheetsRequired} sheets)</p>
                  <p><strong>Efficiency:</strong> {activeSolution.productEfficiencyPct.toFixed(2)}% (Waste: {activeSolution.totalWastePct.toFixed(2)}%)</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-slate-500 text-xs font-bold uppercase tracking-wider px-3 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOptimizationJob}
                disabled={isSavingJob}
                className="bg-[#0f2a43] hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-md"
              >
                {isSavingJob ? 'Saving...' : 'Confirm Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESERVE STOCK CONFIRMATION MODAL */}
      {showReserveModal && reservingStockItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Box size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Reserve Warehouse Stock?</h4>
                <p className="text-[11px] text-slate-400">Confirm deduction for production run</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              Reserve <strong>{reservingStockItem.sheets} sheets</strong> of <strong>{reservingStockItem.sol.stockName}</strong> ({reservingStockItem.sol.stockGsm} GSM) from Enerpack inventory?
              <br /><br />
              This will allocate stock and adjust warehouse quantity.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowReserveModal(false)}
                className="text-slate-500 text-xs font-bold uppercase tracking-wider px-3 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReservation}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-md"
              >
                Confirm Reservation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
