/**
 * Operations Research + 2D Guillotine Cutting-Stock Optimizer Engine
 * For Enerpack Inventory — Quick Tracker: Master Stock Combiner
 */

export type DimensionUnit = 'mm' | 'cm' | 'inch' | 'm';

export type OptimizationGoal = 
  | 'balanced' 
  | 'min_waste' 
  | 'max_yield' 
  | 'min_sheets' 
  | 'inventory_first';

export type WasteClassification = 
  | 'TRUE ZERO-WASTE' 
  | 'NEAR ZERO-WASTE' 
  | 'EXCELLENT' 
  | 'ACCEPTABLE' 
  | 'HIGH WASTE';

export interface StockInputItem {
  id: string;
  name?: string;
  width: number; // in unit
  length: number; // in unit
  unit: DimensionUnit;
  qtyAvailable: number;
  gsm?: string | number;
  sectionTitle?: string;
  subTitle?: string;
  location?: string;
  isInventoryItem?: boolean;
}

export interface NormalizedStock {
  id: string;
  name: string;
  originalWidth: number;
  originalLength: number;
  originalUnit: DimensionUnit;
  widthMm: number;
  lengthMm: number;
  qtyAvailable: number;
  gsm?: string | number;
  location?: string;
  sectionTitle?: string;
  subTitle?: string;
  isInventoryItem?: boolean;
}

export interface GuillotineCutStep {
  cutNumber: number;
  direction: 'Rip Cut (Horizontal)' | 'Cross Cut (Vertical)' | 'Trim Cut';
  positionMm: number;
  positionFormatted: string;
  resultingSection: string;
  purpose: string;
}

export interface PlacedPiece {
  id: number;
  x: number; // mm
  y: number; // mm
  width: number; // mm
  height: number; // mm
  rotated: boolean;
}

export interface OffcutRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  areaMm2: number;
  isReusable: boolean; // >= 100x150 mm
}

export interface SingleSheetSolution {
  stockId: string;
  stockName: string;
  stockWidthMm: number;
  stockLengthMm: number;
  originalStockWidth: number;
  originalStockLength: number;
  originalStockUnit: DimensionUnit;
  stockGsm?: string | number;
  qtyAvailable: number;

  itemWidthMm: number;
  itemHeightMm: number;
  kerfMm: number;
  edgeTrimMm: number;

  isFeasible: boolean;
  feasibilityReason?: string;

  orientation: 'Normal' | 'Rotated 90°' | 'Mixed';
  gridLayout: string; // e.g., "2 × 2" or "3 normal + 2 rotated"
  columns: number;
  rows: number;
  yieldPerSheet: number;

  usedWidthMm: number;
  usedHeightMm: number;
  remainingWidthMm: number;
  remainingHeightMm: number;

  stockAreaMm2: number;
  productAreaMm2: number;
  kerfAreaMm2: number;
  wasteAreaMm2: number;

  productEfficiencyPct: number; // (productArea / stockArea) * 100
  kerfConsumptionPct: number;   // (kerfArea / stockArea) * 100
  totalWastePct: number;         // (wasteArea / stockArea) * 100
  usableAreaPct: number;        // (productArea + reusableOffcutArea) / stockArea * 100

  classification: WasteClassification;
  estimatedCuts: number;
  cuttingSequence: GuillotineCutStep[];
  pieces: PlacedPiece[];
  offcuts: OffcutRegion[];
  reusableOffcutAreaMm2: number;
  processWasteAreaMm2: number;

  // For required quantity:
  requiredQty?: number;
  sheetsRequired: number;
  totalProductionCapacity: number;
  extraPieces: number;
  shortageSheets: number;
  recommendationReason: string;
  compositeScore: number;
}

export interface ZeroWasteTarget {
  grid: string;
  columns: number;
  rows: number;
  orientation: 'Normal' | 'Rotated 90°';
  targetWidthMm: number;
  targetHeightMm: number;
  targetWidthFormatted: string;
  targetHeightFormatted: string;
  pieces: number;
  kerfIncluded: boolean;
  edgeTrimIncluded: boolean;
  theoreticalProductWastePct: number;
}

export interface MultiStockPlanItem {
  stock: NormalizedStock;
  solution: SingleSheetSolution;
  sheetsToUse: number;
  piecesProduced: number;
  stockAreaUsedMm2: number;
  productAreaMm2: number;
  wasteAreaMm2: number;
}

export interface MultiStockCombinationResult {
  isPossible: boolean;
  plans: MultiStockPlanItem[];
  totalSheets: number;
  totalPieces: number;
  requiredQty: number;
  extraPieces: number;
  totalStockAreaMm2: number;
  totalProductAreaMm2: number;
  totalWasteAreaMm2: number;
  overallWastePct: number;
  overallEfficiencyPct: number;
  isFullySatisfiedByInventory: boolean;
  totalShortagePieces: number;
}

// ==========================================
// UNIT NORMALIZATION
// ==========================================

export function convertToMm(value: number, unit: DimensionUnit): number {
  if (isNaN(value) || value <= 0) return 0;
  switch (unit) {
    case 'mm':
      return value;
    case 'cm':
      return value * 10;
    case 'inch':
      return value * 25.4;
    case 'm':
      return value * 1000;
    default:
      return value;
  }
}

export function convertFromMm(valueMm: number, targetUnit: DimensionUnit): number {
  switch (targetUnit) {
    case 'mm':
      return valueMm;
    case 'cm':
      return valueMm / 10;
    case 'inch':
      return valueMm / 25.4;
    case 'm':
      return valueMm / 1000;
    default:
      return valueMm;
  }
}

export function formatDimension(valueMm: number, targetUnit: DimensionUnit = 'mm', decimals = 2): string {
  const converted = convertFromMm(valueMm, targetUnit);
  return `${converted.toFixed(decimals).replace(/\.00$/, '')} ${targetUnit}`;
}

export function formatArea(areaMm2: number): string {
  if (areaMm2 >= 1000000) {
    return `${(areaMm2 / 1000000).toFixed(3)} m²`;
  }
  return `${(areaMm2 / 100).toFixed(1)} cm²`;
}

// Parse string sizes like "47*64", "54*73.5", "80 x 110", "31x43"
export function parseSizeString(raw: string, defaultUnit: DimensionUnit = 'cm'): { width: number; length: number; unit: DimensionUnit } | null {
  if (!raw || typeof raw !== 'string') return null;
  const clean = raw.trim().toLowerCase();
  
  let unit: DimensionUnit = defaultUnit;
  if (clean.includes('"') || clean.includes('inch')) unit = 'inch';
  else if (clean.includes('mm')) unit = 'mm';
  else if (clean.includes('cm')) unit = 'cm';
  else if (clean.includes('meter') || clean.includes(' m')) unit = 'm';

  const numbers = clean.replace(/[^0-9.*x]/g, ' ').trim();
  const parts = numbers.split(/[*x\s]+/).filter(Boolean).map(v => parseFloat(v));

  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[0] > 0 && parts[1] > 0) {
    return {
      width: Math.min(parts[0], parts[1]),
      length: Math.max(parts[0], parts[1]),
      unit
    };
  } else if (parts.length === 1 && !isNaN(parts[0]) && parts[0] > 0) {
    // Single reel width or square
    return {
      width: parts[0],
      length: parts[0],
      unit
    };
  }
  return null;
}

// ==========================================
// WASTE CLASSIFICATION
// ==========================================

export function classifyWaste(wastePct: number, maxAcceptableWastePct = 3.0): WasteClassification {
  if (wastePct <= 0.0001) {
    return 'TRUE ZERO-WASTE';
  } else if (wastePct <= 1.0) {
    return 'NEAR ZERO-WASTE';
  } else if (wastePct <= 3.0) {
    return 'EXCELLENT';
  } else if (wastePct <= maxAcceptableWastePct) {
    return 'ACCEPTABLE';
  } else {
    return 'HIGH WASTE';
  }
}

// ==========================================
// ZERO-WASTE TARGET GENERATOR
// ==========================================

export function calculateZeroWasteTargets(
  itemWidthMm: number,
  itemHeightMm: number,
  kerfMm: number,
  edgeTrimMm: number,
  allowRotation = true,
  displayUnit: DimensionUnit = 'mm'
): ZeroWasteTarget[] {
  if (itemWidthMm <= 0 || itemHeightMm <= 0) return [];

  const baseGrids = [
    { cols: 1, rows: 1, label: '1 × 1' },
    { cols: 2, rows: 1, label: '2 × 1' },
    { cols: 1, rows: 2, label: '1 × 2' },
    { cols: 2, rows: 2, label: '2 × 2' },
    { cols: 3, rows: 2, label: '3 × 2' },
    { cols: 2, rows: 3, label: '2 × 3' },
    { cols: 3, rows: 3, label: '3 × 3' },
    { cols: 4, rows: 2, label: '4 × 2' },
    { cols: 2, rows: 4, label: '2 × 4' },
    { cols: 4, rows: 3, label: '4 × 3' },
    { cols: 3, rows: 4, label: '3 × 4' },
    { cols: 4, rows: 4, label: '4 × 4' },
  ];

  const targets: ZeroWasteTarget[] = [];

  for (const g of baseGrids) {
    // Normal Orientation: m * Wi + (m - 1) * t + edgeTrim
    const targetWidthNormal = g.cols * itemWidthMm + (g.cols - 1) * kerfMm + edgeTrimMm;
    const targetHeightNormal = g.rows * itemHeightMm + (g.rows - 1) * kerfMm + edgeTrimMm;

    targets.push({
      grid: g.label,
      columns: g.cols,
      rows: g.rows,
      orientation: 'Normal',
      targetWidthMm: targetWidthNormal,
      targetHeightMm: targetHeightNormal,
      targetWidthFormatted: formatDimension(targetWidthNormal, displayUnit),
      targetHeightFormatted: formatDimension(targetHeightNormal, displayUnit),
      pieces: g.cols * g.rows,
      kerfIncluded: kerfMm > 0,
      edgeTrimIncluded: edgeTrimMm > 0,
      theoreticalProductWastePct: 0.0
    });

    if (allowRotation && itemWidthMm !== itemHeightMm) {
      // Rotated Orientation: m * Hi + (m - 1) * t + edgeTrim
      const targetWidthRot = g.cols * itemHeightMm + (g.cols - 1) * kerfMm + edgeTrimMm;
      const targetHeightRot = g.rows * itemWidthMm + (g.rows - 1) * kerfMm + edgeTrimMm;

      targets.push({
        grid: `${g.label} (Rot)`,
        columns: g.cols,
        rows: g.rows,
        orientation: 'Rotated 90°',
        targetWidthMm: targetWidthRot,
        targetHeightMm: targetHeightRot,
        targetWidthFormatted: formatDimension(targetWidthRot, displayUnit),
        targetHeightFormatted: formatDimension(targetHeightRot, displayUnit),
        pieces: g.cols * g.rows,
        kerfIncluded: kerfMm > 0,
        edgeTrimIncluded: edgeTrimMm > 0,
        theoreticalProductWastePct: 0.0
      });
    }
  }

  return targets;
}

// ==========================================
// STEP-BY-STEP GUILLOTINE CUT PLAN GENERATOR
// ==========================================

export function generateGuillotineCutPlan(
  stockWidthMm: number,
  stockLengthMm: number,
  pieceWidthMm: number,
  pieceHeightMm: number,
  columns: number,
  rows: number,
  kerfMm: number,
  edgeTrimMm: number,
  orientation: 'Normal' | 'Rotated 90°' | 'Mixed',
  displayUnit: DimensionUnit = 'mm'
): GuillotineCutStep[] {
  const steps: GuillotineCutStep[] = [];
  let cutNum = 1;

  const usedWidth = columns * pieceWidthMm + (columns - 1) * kerfMm;
  const usedLength = rows * pieceHeightMm + (rows - 1) * kerfMm;
  const rightTrim = stockWidthMm - usedWidth - edgeTrimMm;
  const bottomTrim = stockLengthMm - usedLength - edgeTrimMm;

  if (edgeTrimMm > 0) {
    steps.push({
      cutNumber: cutNum++,
      direction: 'Trim Cut',
      positionMm: edgeTrimMm,
      positionFormatted: formatDimension(edgeTrimMm, displayUnit),
      resultingSection: `Perimeter reference edge`,
      purpose: `Square and trim stock sheet edges by ${formatDimension(edgeTrimMm, displayUnit)}`
    });
  }

  // Step A: Primary cross-cut or rip-cut to separate offcut waste if significant
  if (bottomTrim >= 20) {
    const cutPos = usedLength + edgeTrimMm;
    steps.push({
      cutNumber: cutNum++,
      direction: 'Rip Cut (Horizontal)',
      positionMm: cutPos,
      positionFormatted: formatDimension(cutPos, displayUnit),
      resultingSection: `${formatDimension(stockWidthMm, displayUnit)} × ${formatDimension(usedLength, displayUnit)} active cutting block & ${formatDimension(stockWidthMm, displayUnit)} × ${formatDimension(bottomTrim, displayUnit)} offcut`,
      purpose: bottomTrim >= 150 ? `Separate reusable bottom offcut strip` : `Trim off bottom process waste strip`
    });
  }

  if (rightTrim >= 20) {
    const cutPos = usedWidth + edgeTrimMm;
    steps.push({
      cutNumber: cutNum++,
      direction: 'Cross Cut (Vertical)',
      positionMm: cutPos,
      positionFormatted: formatDimension(cutPos, displayUnit),
      resultingSection: `${formatDimension(usedWidth, displayUnit)} × ${formatDimension(usedLength, displayUnit)} grid block`,
      purpose: rightTrim >= 100 ? `Separate reusable side offcut strip` : `Trim off side process waste strip`
    });
  }

  // Step B: Rip cuts into strips along columns
  for (let c = 1; c < columns; c++) {
    const stripPos = c * pieceWidthMm + (c - 1) * kerfMm;
    steps.push({
      cutNumber: cutNum++,
      direction: 'Cross Cut (Vertical)',
      positionMm: stripPos,
      positionFormatted: formatDimension(stripPos, displayUnit),
      resultingSection: `Vertical strip ${c} (${formatDimension(pieceWidthMm, displayUnit)} wide)`,
      purpose: `Rip sheet into column strip ${c} of ${columns} (kerf: ${formatDimension(kerfMm, displayUnit)})`
    });
  }

  // Step C: Cross-cuts across rows for each strip
  for (let r = 1; r < rows; r++) {
    const piecePos = r * pieceHeightMm + (r - 1) * kerfMm;
    steps.push({
      cutNumber: cutNum++,
      direction: 'Rip Cut (Horizontal)',
      positionMm: piecePos,
      positionFormatted: formatDimension(piecePos, displayUnit),
      resultingSection: `${columns} finished pieces (${formatDimension(pieceWidthMm, displayUnit)} × ${formatDimension(pieceHeightMm, displayUnit)})`,
      purpose: `Cross-cut column strips across row ${r} to yield individual finished pieces`
    });
  }

  return steps;
}

// ==========================================
// SINGLE STOCK EVALUATOR
// ==========================================

export function evaluateStockSheet(
  stock: NormalizedStock,
  itemWidthMm: number,
  itemHeightMm: number,
  kerfMm: number,
  edgeTrimMm: number,
  allowRotation: boolean,
  allowMixed: boolean,
  maxAcceptableWastePct: number,
  requiredQty?: number,
  goal: OptimizationGoal = 'balanced',
  displayUnit: DimensionUnit = 'mm'
): SingleSheetSolution {
  const stockWidth = stock.widthMm;
  const stockLength = stock.lengthMm;
  const stockArea = stockWidth * stockLength;
  const itemArea = itemWidthMm * itemHeightMm;

  // Basic check: is item larger than stock in both directions?
  const fitsNormalBasic = (itemWidthMm + edgeTrimMm <= stockWidth) && (itemHeightMm + edgeTrimMm <= stockLength);
  const fitsRotatedBasic = (itemHeightMm + edgeTrimMm <= stockWidth) && (itemWidthMm + edgeTrimMm <= stockLength);

  if (!fitsNormalBasic && !fitsRotatedBasic) {
    return {
      stockId: stock.id,
      stockName: stock.name,
      stockWidthMm: stockWidth,
      stockLengthMm: stockLength,
      originalStockWidth: stock.originalWidth,
      originalStockLength: stock.originalLength,
      originalStockUnit: stock.originalUnit,
      stockGsm: stock.gsm,
      qtyAvailable: stock.qtyAvailable,
      itemWidthMm,
      itemHeightMm,
      kerfMm,
      edgeTrimMm,
      isFeasible: false,
      feasibilityReason: `Item (${formatDimension(itemWidthMm, displayUnit)} × ${formatDimension(itemHeightMm, displayUnit)}) is larger than stock sheet (${formatDimension(stockWidth, displayUnit)} × ${formatDimension(stockLength, displayUnit)}) even with 90° rotation.`,
      orientation: 'Normal',
      gridLayout: '0 × 0',
      columns: 0,
      rows: 0,
      yieldPerSheet: 0,
      usedWidthMm: 0,
      usedHeightMm: 0,
      remainingWidthMm: stockWidth,
      remainingHeightMm: stockLength,
      stockAreaMm2: stockArea,
      productAreaMm2: 0,
      kerfAreaMm2: 0,
      wasteAreaMm2: stockArea,
      productEfficiencyPct: 0,
      kerfConsumptionPct: 0,
      totalWastePct: 100,
      usableAreaPct: 0,
      classification: 'HIGH WASTE',
      estimatedCuts: 0,
      cuttingSequence: [],
      pieces: [],
      offcuts: [{
        x: 0,
        y: 0,
        width: stockWidth,
        height: stockLength,
        areaMm2: stockArea,
        isReusable: false
      }],
      reusableOffcutAreaMm2: 0,
      processWasteAreaMm2: stockArea,
      sheetsRequired: 0,
      totalProductionCapacity: 0,
      extraPieces: 0,
      shortageSheets: 0,
      recommendationReason: 'Not feasible: stock dimensions smaller than item.',
      compositeScore: -9999
    };
  }

  interface CandidateLayout {
    orientation: 'Normal' | 'Rotated 90°' | 'Mixed';
    cols: number;
    rows: number;
    pw: number;
    ph: number;
    pieces: PlacedPiece[];
    yield: number;
    usedW: number;
    usedL: number;
  }

  const candidates: CandidateLayout[] = [];

  // 1. Standard Orientation (Normal)
  const availableW = stockWidth - edgeTrimMm;
  const availableL = stockLength - edgeTrimMm;

  if (availableW >= itemWidthMm && availableL >= itemHeightMm) {
    const maxCols = Math.max(1, Math.floor((availableW + kerfMm) / (itemWidthMm + kerfMm)));
    const maxRows = Math.max(1, Math.floor((availableL + kerfMm) / (itemHeightMm + kerfMm)));

    for (let c = 1; c <= maxCols; c++) {
      for (let r = 1; r <= maxRows; r++) {
        const uW = c * itemWidthMm + (c - 1) * kerfMm;
        const uL = r * itemHeightMm + (r - 1) * kerfMm;
        if (uW <= availableW && uL <= availableL) {
          const pieces: PlacedPiece[] = [];
          let pId = 1;
          for (let rowIdx = 0; rowIdx < r; rowIdx++) {
            for (let colIdx = 0; colIdx < c; colIdx++) {
              pieces.push({
                id: pId++,
                x: colIdx * (itemWidthMm + kerfMm) + edgeTrimMm / 2,
                y: rowIdx * (itemHeightMm + kerfMm) + edgeTrimMm / 2,
                width: itemWidthMm,
                height: itemHeightMm,
                rotated: false
              });
            }
          }
          candidates.push({
            orientation: 'Normal',
            cols: c,
            rows: r,
            pw: itemWidthMm,
            ph: itemHeightMm,
            pieces,
            yield: c * r,
            usedW: uW,
            usedL: uL
          });
        }
      }
    }
  }

  // 2. 90° Rotated Orientation
  if (allowRotation && availableW >= itemHeightMm && availableL >= itemWidthMm) {
    const maxColsRot = Math.max(1, Math.floor((availableW + kerfMm) / (itemHeightMm + kerfMm)));
    const maxRowsRot = Math.max(1, Math.floor((availableL + kerfMm) / (itemWidthMm + kerfMm)));

    for (let c = 1; c <= maxColsRot; c++) {
      for (let r = 1; r <= maxRowsRot; r++) {
        const uW = c * itemHeightMm + (c - 1) * kerfMm;
        const uL = r * itemWidthMm + (r - 1) * kerfMm;
        if (uW <= availableW && uL <= availableL) {
          const pieces: PlacedPiece[] = [];
          let pId = 1;
          for (let rowIdx = 0; rowIdx < r; rowIdx++) {
            for (let colIdx = 0; colIdx < c; colIdx++) {
              pieces.push({
                id: pId++,
                x: colIdx * (itemHeightMm + kerfMm) + edgeTrimMm / 2,
                y: rowIdx * (itemWidthMm + kerfMm) + edgeTrimMm / 2,
                width: itemHeightMm,
                height: itemWidthMm,
                rotated: true
              });
            }
          }
          candidates.push({
            orientation: 'Rotated 90°',
            cols: c,
            rows: r,
            pw: itemHeightMm,
            ph: itemWidthMm,
            pieces,
            yield: c * r,
            usedW: uW,
            usedL: uL
          });
        }
      }
    }
  }

  // 3. Mixed Orientation (Guillotine separable)
  if (allowMixed && allowRotation) {
    // Check if right leftover strip or bottom leftover strip can fit rotated pieces
    // Approach A: Normal main block + Rotated pieces in right strip
    const baseC = Math.floor((availableW + kerfMm) / (itemWidthMm + kerfMm));
    const baseR = Math.floor((availableL + kerfMm) / (itemHeightMm + kerfMm));
    if (baseC >= 1 && baseR >= 1) {
      const mainUsedW = baseC * itemWidthMm + (baseC - 1) * kerfMm;
      const rightRemainW = availableW - mainUsedW - kerfMm;
      if (rightRemainW >= itemHeightMm) {
        const rotColsInRight = Math.floor((rightRemainW + kerfMm) / (itemHeightMm + kerfMm));
        const rotRowsInRight = Math.floor((availableL + kerfMm) / (itemWidthMm + kerfMm));
        if (rotColsInRight >= 1 && rotRowsInRight >= 1) {
          const pieces: PlacedPiece[] = [];
          let pId = 1;
          // Main block
          for (let r = 0; r < baseR; r++) {
            for (let c = 0; c < baseC; c++) {
              pieces.push({
                id: pId++,
                x: c * (itemWidthMm + kerfMm) + edgeTrimMm / 2,
                y: r * (itemHeightMm + kerfMm) + edgeTrimMm / 2,
                width: itemWidthMm,
                height: itemHeightMm,
                rotated: false
              });
            }
          }
          // Right block
          const startX = mainUsedW + kerfMm + edgeTrimMm / 2;
          for (let r = 0; r < rotRowsInRight; r++) {
            for (let c = 0; c < rotColsInRight; c++) {
              pieces.push({
                id: pId++,
                x: startX + c * (itemHeightMm + kerfMm),
                y: r * (itemWidthMm + kerfMm) + edgeTrimMm / 2,
                width: itemHeightMm,
                height: itemWidthMm,
                rotated: true
              });
            }
          }
          const totalYield = pieces.length;
          const totalUsedW = mainUsedW + kerfMm + rotColsInRight * itemHeightMm + (rotColsInRight - 1) * kerfMm;
          const totalUsedL = Math.max(
            baseR * itemHeightMm + (baseR - 1) * kerfMm,
            rotRowsInRight * itemWidthMm + (rotRowsInRight - 1) * kerfMm
          );
          candidates.push({
            orientation: 'Mixed',
            cols: baseC,
            rows: baseR,
            pw: itemWidthMm,
            ph: itemHeightMm,
            pieces,
            yield: totalYield,
            usedW: totalUsedW,
            usedL: totalUsedL
          });
        }
      }

      // Approach B: Normal main block + Rotated pieces in bottom strip
      const mainUsedL = baseR * itemHeightMm + (baseR - 1) * kerfMm;
      const bottomRemainL = availableL - mainUsedL - kerfMm;
      if (bottomRemainL >= itemWidthMm) {
        const rotColsInBottom = Math.floor((availableW + kerfMm) / (itemHeightMm + kerfMm));
        const rotRowsInBottom = Math.floor((bottomRemainL + kerfMm) / (itemWidthMm + kerfMm));
        if (rotColsInBottom >= 1 && rotRowsInBottom >= 1) {
          const pieces: PlacedPiece[] = [];
          let pId = 1;
          for (let r = 0; r < baseR; r++) {
            for (let c = 0; c < baseC; c++) {
              pieces.push({
                id: pId++,
                x: c * (itemWidthMm + kerfMm) + edgeTrimMm / 2,
                y: r * (itemHeightMm + kerfMm) + edgeTrimMm / 2,
                width: itemWidthMm,
                height: itemHeightMm,
                rotated: false
              });
            }
          }
          const startY = mainUsedL + kerfMm + edgeTrimMm / 2;
          for (let r = 0; r < rotRowsInBottom; r++) {
            for (let c = 0; c < rotColsInBottom; c++) {
              pieces.push({
                id: pId++,
                x: c * (itemHeightMm + kerfMm) + edgeTrimMm / 2,
                y: startY + r * (itemWidthMm + kerfMm),
                width: itemHeightMm,
                height: itemWidthMm,
                rotated: true
              });
            }
          }
          const totalYield = pieces.length;
          const totalUsedW = Math.max(
            baseC * itemWidthMm + (baseC - 1) * kerfMm,
            rotColsInBottom * itemHeightMm + (rotColsInBottom - 1) * kerfMm
          );
          const totalUsedL = mainUsedL + kerfMm + rotRowsInBottom * itemWidthMm + (rotRowsInBottom - 1) * kerfMm;
          candidates.push({
            orientation: 'Mixed',
            cols: baseC,
            rows: baseR,
            pw: itemWidthMm,
            ph: itemHeightMm,
            pieces,
            yield: totalYield,
            usedW: totalUsedW,
            usedL: totalUsedL
          });
        }
      }
    }
  }

  if (candidates.length === 0) {
    return {
      stockId: stock.id,
      stockName: stock.name,
      stockWidthMm: stockWidth,
      stockLengthMm: stockLength,
      originalStockWidth: stock.originalWidth,
      originalStockLength: stock.originalLength,
      originalStockUnit: stock.originalUnit,
      stockGsm: stock.gsm,
      qtyAvailable: stock.qtyAvailable,
      itemWidthMm,
      itemHeightMm,
      kerfMm,
      edgeTrimMm,
      isFeasible: false,
      feasibilityReason: kerfMm > 0 ? 'Item fits without kerf but exceeds stock sheet once kerf/trim margins are added.' : 'Cannot fit item on stock sheet.',
      orientation: 'Normal',
      gridLayout: '0 × 0',
      columns: 0,
      rows: 0,
      yieldPerSheet: 0,
      usedWidthMm: 0,
      usedHeightMm: 0,
      remainingWidthMm: stockWidth,
      remainingHeightMm: stockLength,
      stockAreaMm2: stockArea,
      productAreaMm2: 0,
      kerfAreaMm2: 0,
      wasteAreaMm2: stockArea,
      productEfficiencyPct: 0,
      kerfConsumptionPct: 0,
      totalWastePct: 100,
      usableAreaPct: 0,
      classification: 'HIGH WASTE',
      estimatedCuts: 0,
      cuttingSequence: [],
      pieces: [],
      offcuts: [],
      reusableOffcutAreaMm2: 0,
      processWasteAreaMm2: stockArea,
      sheetsRequired: 0,
      totalProductionCapacity: 0,
      extraPieces: 0,
      shortageSheets: 0,
      recommendationReason: 'Not feasible with current cutting margins.',
      compositeScore: -9999
    };
  }

  // Find the optimal candidate layout for this stock sheet
  let bestCandidate = candidates[0];
  let bestScore = -Infinity;

  for (const cand of candidates) {
    const totalProdArea = cand.yield * itemArea;
    const wasteArea = Math.max(0, stockArea - totalProdArea);
    const wastePct = (wasteArea / stockArea) * 100;
    const estCuts = (cand.cols - 1) + (cand.rows - 1) + (edgeTrimMm > 0 ? 1 : 0);

    let score = 0;
    switch (goal) {
      case 'min_waste':
        score = -wastePct * 10 + cand.yield - estCuts * 0.1;
        break;
      case 'max_yield':
        score = cand.yield * 100 - wastePct - estCuts * 0.5;
        break;
      case 'min_sheets':
        score = cand.yield * 1000 - wastePct;
        break;
      case 'inventory_first':
        score = (stock.qtyAvailable > 0 ? 500 : 0) + cand.yield * 50 - wastePct - estCuts * 0.2;
        break;
      case 'balanced':
      default:
        // Yield is high, waste is low, cut count is low, inventory availability gives bonus
        score = cand.yield * 80 - wastePct * 2 - estCuts * 0.5 + (stock.qtyAvailable > 0 ? 50 : 0);
        break;
    }

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = cand;
    }
  }

  const yieldPerSheet = bestCandidate.yield;
  const productArea = yieldPerSheet * itemArea;
  const productEfficiencyPct = (productArea / stockArea) * 100;
  const rawWasteArea = Math.max(0, stockArea - productArea);
  const totalWastePct = (rawWasteArea / stockArea) * 100;

  // Calculate Kerf & Offcuts
  const kerfArea = Math.max(0, (bestCandidate.usedW * bestCandidate.usedL) - productArea);
  const kerfConsumptionPct = (kerfArea / stockArea) * 100;

  const remainingW = Math.max(0, stockWidth - bestCandidate.usedW);
  const remainingL = Math.max(0, stockLength - bestCandidate.usedL);

  const offcuts: OffcutRegion[] = [];
  let reusableOffcutArea = 0;

  // Side strip offcut
  if (remainingW > 0) {
    const offcutW = remainingW;
    const offcutL = stockLength;
    const isRe = offcutW >= 100 && offcutL >= 150;
    const area = offcutW * offcutL;
    offcuts.push({
      x: bestCandidate.usedW,
      y: 0,
      width: offcutW,
      height: offcutL,
      areaMm2: area,
      isReusable: isRe
    });
    if (isRe) reusableOffcutArea += area;
  }

  // Bottom strip offcut
  if (remainingL > 0) {
    const offcutW = bestCandidate.usedW;
    const offcutL = remainingL;
    const isRe = offcutW >= 150 && offcutL >= 100;
    const area = offcutW * offcutL;
    offcuts.push({
      x: 0,
      y: bestCandidate.usedL,
      width: offcutW,
      height: offcutL,
      areaMm2: area,
      isReusable: isRe
    });
    if (isRe) reusableOffcutArea += area;
  }

  const processWasteArea = Math.max(0, rawWasteArea - reusableOffcutArea);
  const usableAreaPct = ((productArea + reusableOffcutArea) / stockArea) * 100;
  const classification = classifyWaste(totalWastePct, maxAcceptableWastePct);

  // Sheets required for quantity
  const sheetsReq = requiredQty && requiredQty > 0 ? Math.ceil(requiredQty / yieldPerSheet) : 1;
  const totalCap = sheetsReq * yieldPerSheet;
  const extraPcs = requiredQty && requiredQty > 0 ? totalCap - requiredQty : 0;
  const shortage = Math.max(0, sheetsReq - stock.qtyAvailable);

  // Guillotine cut plan
  const cuttingSequence = generateGuillotineCutPlan(
    stockWidth,
    stockLength,
    bestCandidate.pw,
    bestCandidate.ph,
    bestCandidate.cols,
    bestCandidate.rows,
    kerfMm,
    edgeTrimMm,
    bestCandidate.orientation,
    displayUnit
  );

  // Explanation logic
  let reason = '';
  if (totalWastePct <= 0.0001) {
    reason = `True zero-waste match: exact fit produces ${yieldPerSheet} pcs with 100.00% material utilization.`;
  } else if (totalWastePct <= 1.0) {
    reason = `Near zero-waste: outstanding ${productEfficiencyPct.toFixed(2)}% product yield with only ${totalWastePct.toFixed(2)}% trim waste.`;
  } else if (bestCandidate.orientation === 'Rotated 90°') {
    reason = `90° rotated orientation yields ${yieldPerSheet} pcs, maximizing sheet area better than standard alignment.`;
  } else if (bestCandidate.orientation === 'Mixed') {
    reason = `Mixed orientation utilizes leftover perimeter strips to produce ${yieldPerSheet} pcs (${productEfficiencyPct.toFixed(2)}% efficiency).`;
  } else {
    reason = `Standard ${bestCandidate.cols} × ${bestCandidate.rows} grid produces ${yieldPerSheet} pcs with straightforward guillotine cuts (${productEfficiencyPct.toFixed(2)}% efficiency).`;
  }

  const gridLabel = bestCandidate.orientation === 'Mixed'
    ? `${yieldPerSheet} pcs (Mixed: ${bestCandidate.cols}×${bestCandidate.rows} + Rotated)`
    : `${bestCandidate.cols} × ${bestCandidate.rows}`;

  return {
    stockId: stock.id,
    stockName: stock.name,
    stockWidthMm: stockWidth,
    stockLengthMm: stockLength,
    originalStockWidth: stock.originalWidth,
    originalStockLength: stock.originalLength,
    originalStockUnit: stock.originalUnit,
    stockGsm: stock.gsm,
    qtyAvailable: stock.qtyAvailable,
    itemWidthMm,
    itemHeightMm,
    kerfMm,
    edgeTrimMm,
    isFeasible: true,
    orientation: bestCandidate.orientation,
    gridLayout: gridLabel,
    columns: bestCandidate.cols,
    rows: bestCandidate.rows,
    yieldPerSheet,
    usedWidthMm: bestCandidate.usedW,
    usedHeightMm: bestCandidate.usedL,
    remainingWidthMm: remainingW,
    remainingHeightMm: remainingL,
    stockAreaMm2: stockArea,
    productAreaMm2: productArea,
    kerfAreaMm2: kerfArea,
    wasteAreaMm2: rawWasteArea,
    productEfficiencyPct,
    kerfConsumptionPct,
    totalWastePct,
    usableAreaPct,
    classification,
    estimatedCuts: cuttingSequence.length,
    cuttingSequence,
    pieces: bestCandidate.pieces,
    offcuts,
    reusableOffcutAreaMm2: reusableOffcutArea,
    processWasteAreaMm2: processWasteArea,
    requiredQty,
    sheetsRequired: sheetsReq,
    totalProductionCapacity: totalCap,
    extraPieces: extraPcs,
    shortageSheets: shortage,
    recommendationReason: reason,
    compositeScore: bestScore
  };
}

// ==========================================
// MASTER STOCK COMBINER (MULTI-STOCK)
// ==========================================

export function optimizeMultiStockCombination(
  stockSolutions: SingleSheetSolution[],
  normalizedStocks: NormalizedStock[],
  requiredQty: number,
  goal: OptimizationGoal = 'balanced'
): MultiStockCombinationResult {
  if (!requiredQty || requiredQty <= 0 || stockSolutions.length === 0) {
    return {
      isPossible: false,
      plans: [],
      totalSheets: 0,
      totalPieces: 0,
      requiredQty: requiredQty || 0,
      extraPieces: 0,
      totalStockAreaMm2: 0,
      totalProductAreaMm2: 0,
      totalWasteAreaMm2: 0,
      overallWastePct: 0,
      overallEfficiencyPct: 0,
      isFullySatisfiedByInventory: false,
      totalShortagePieces: requiredQty || 0
    };
  }

  // Filter feasible solutions that have in-stock quantity or can be sourced
  const validSolutions = stockSolutions.filter(s => s.isFeasible && s.yieldPerSheet > 0);
  if (validSolutions.length === 0) {
    return {
      isPossible: false,
      plans: [],
      totalSheets: 0,
      totalPieces: 0,
      requiredQty,
      extraPieces: 0,
      totalStockAreaMm2: 0,
      totalProductAreaMm2: 0,
      totalWasteAreaMm2: 0,
      overallWastePct: 0,
      overallEfficiencyPct: 0,
      isFullySatisfiedByInventory: false,
      totalShortagePieces: requiredQty
    };
  }

  // Sort available solutions by efficiency & availability
  const sorted = [...validSolutions].sort((a, b) => {
    if (goal === 'inventory_first') {
      const aAvail = a.qtyAvailable > 0 ? 1 : 0;
      const bAvail = b.qtyAvailable > 0 ? 1 : 0;
      if (aAvail !== bAvail) return bAvail - aAvail;
    }
    // Lowest waste first
    if (Math.abs(a.totalWastePct - b.totalWastePct) > 0.5) {
      return a.totalWastePct - b.totalWastePct;
    }
    // Then highest yield
    return b.yieldPerSheet - a.yieldPerSheet;
  });

  // Knapsack / Greedy assignment
  let remainingPcs = requiredQty;
  const plans: MultiStockPlanItem[] = [];

  for (const sol of sorted) {
    if (remainingPcs <= 0) break;

    const normStock = normalizedStocks.find(ns => ns.id === sol.stockId);
    if (!normStock) continue;

    // How many sheets can we use from this stock?
    const maxAvailable = normStock.qtyAvailable > 0 ? normStock.qtyAvailable : Infinity;
    const sheetsNeeded = Math.ceil(remainingPcs / sol.yieldPerSheet);
    const sheetsToTake = Math.min(sheetsNeeded, maxAvailable);

    if (sheetsToTake > 0 && sheetsToTake !== Infinity) {
      const pcsProduced = sheetsToTake * sol.yieldPerSheet;
      const stockArea = sheetsToTake * sol.stockAreaMm2;
      const prodArea = Math.min(pcsProduced, remainingPcs) * sol.productAreaMm2 / sol.yieldPerSheet;
      const wasteArea = Math.max(0, stockArea - (pcsProduced * (sol.productAreaMm2 / sol.yieldPerSheet)));

      plans.push({
        stock: normStock,
        solution: sol,
        sheetsToUse: sheetsToTake,
        piecesProduced: pcsProduced,
        stockAreaUsedMm2: stockArea,
        productAreaMm2: prodArea,
        wasteAreaMm2: wasteArea
      });

      remainingPcs -= pcsProduced;
    }
  }

  // If still pieces remaining and all in-stock sheets exhausted, pick the best single stock to fulfill the shortage
  if (remainingPcs > 0) {
    const bestStockSol = sorted[0];
    const normStock = normalizedStocks.find(ns => ns.id === bestStockSol.stockId);
    if (normStock) {
      const extraSheets = Math.ceil(remainingPcs / bestStockSol.yieldPerSheet);
      const existingPlan = plans.find(p => p.stock.id === bestStockSol.stockId);
      if (existingPlan) {
        existingPlan.sheetsToUse += extraSheets;
        existingPlan.piecesProduced += extraSheets * bestStockSol.yieldPerSheet;
        existingPlan.stockAreaUsedMm2 += extraSheets * bestStockSol.stockAreaMm2;
        existingPlan.wasteAreaMm2 += extraSheets * (bestStockSol.wasteAreaMm2);
      } else {
        plans.push({
          stock: normStock,
          solution: bestStockSol,
          sheetsToUse: extraSheets,
          piecesProduced: extraSheets * bestStockSol.yieldPerSheet,
          stockAreaUsedMm2: extraSheets * bestStockSol.stockAreaMm2,
          productAreaMm2: extraSheets * bestStockSol.productAreaMm2,
          wasteAreaMm2: extraSheets * bestStockSol.wasteAreaMm2
        });
      }
      remainingPcs -= extraSheets * bestStockSol.yieldPerSheet;
    }
  }

  let totalSheets = 0;
  let totalPieces = 0;
  let totalStockArea = 0;
  let totalProductArea = 0;
  let totalWasteArea = 0;

  for (const p of plans) {
    totalSheets += p.sheetsToUse;
    totalPieces += p.piecesProduced;
    totalStockArea += p.stockAreaUsedMm2;
    totalProductArea += (p.piecesProduced * (p.solution.productAreaMm2 / p.solution.yieldPerSheet));
    totalWasteArea += p.wasteAreaMm2;
  }

  const overallWastePct = totalStockArea > 0 ? (totalWasteArea / totalStockArea) * 100 : 0;
  const overallEfficiencyPct = totalStockArea > 0 ? ((totalStockArea - totalWasteArea) / totalStockArea) * 100 : 0;
  const extraPieces = Math.max(0, totalPieces - requiredQty);

  // Check if fully satisfied by available stock
  const isFullySatisfied = plans.every(p => p.sheetsToUse <= p.stock.qtyAvailable);

  return {
    isPossible: true,
    plans,
    totalSheets,
    totalPieces,
    requiredQty,
    extraPieces,
    totalStockAreaMm2: totalStockArea,
    totalProductAreaMm2: totalProductArea,
    totalWasteAreaMm2: totalWasteArea,
    overallWastePct,
    overallEfficiencyPct,
    isFullySatisfiedByInventory: isFullySatisfied,
    totalShortagePieces: isFullySatisfied ? 0 : Math.max(0, requiredQty - plans.reduce((acc, p) => acc + Math.min(p.sheetsToUse, p.stock.qtyAvailable) * p.solution.yieldPerSheet, 0))
  };
}
