import React, { useState } from 'react';
import { SingleSheetSolution, formatDimension, DimensionUnit } from '../../utils/cuttingOptimizer';
import { Maximize2, ZoomIn, ZoomOut, RotateCcw, Info, Layers } from 'lucide-react';

interface CuttingDiagramProps {
  solution: SingleSheetSolution;
  displayUnit?: DimensionUnit;
}

export const CuttingDiagram: React.FC<CuttingDiagramProps> = ({ solution, displayUnit = 'mm' }) => {
  const [zoom, setZoom] = useState(1);
  const [showCutLines, setShowCutLines] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [activePiece, setActivePiece] = useState<number | null>(null);

  if (!solution.isFeasible || solution.pieces.length === 0) {
    return (
      <div className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <Info size={24} />
          </div>
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Layout Not Feasible</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            {solution.feasibilityReason || 'The required item cannot physically fit on this stock sheet.'}
          </p>
        </div>
      </div>
    );
  }

  // Calculate SVG ViewBox with margins for dimension arrows
  const margin = 80;
  const stockW = solution.stockWidthMm;
  const stockL = solution.stockLengthMm;
  const viewBoxWidth = stockW + margin * 2;
  const viewBoxHeight = stockL + margin * 2;

  // Aspect ratio scaling for container
  const maxDisplayHeight = 460;
  const maxDisplayWidth = 720;
  const scaleRatio = Math.min(maxDisplayWidth / viewBoxWidth, maxDisplayHeight / viewBoxHeight);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
      {/* Controls header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Layers className="text-blue-600" size={18} />
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              2D Guillotine Cutting Layout — {solution.gridLayout}
            </h4>
            <p className="text-[10px] text-slate-400 font-medium">
              Sheet: {formatDimension(stockW, displayUnit)} × {formatDimension(stockL, displayUnit)} • {solution.yieldPerSheet} Finished Pieces
            </p>
          </div>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCutLines(!showCutLines)}
            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all ${
              showCutLines ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-slate-100 text-slate-500'
            }`}
          >
            Cut Lines
          </button>
          <button
            onClick={() => setShowDimensions(!showDimensions)}
            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all ${
              showDimensions ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-slate-100 text-slate-500'
            }`}
          >
            Dimensions
          </button>
          <div className="h-4 w-px bg-slate-200 mx-1"></div>
          <button
            onClick={() => setZoom(prev => Math.min(2.0, prev + 0.15))}
            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(0.6, prev - 0.15))}
            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full bg-slate-50/70 border border-slate-200/80 rounded-2xl overflow-hidden flex items-center justify-center p-4 min-h-[360px]">
        <div 
          className="transition-transform duration-200 ease-out origin-center"
          style={{ transform: `scale(${zoom})` }}
        >
          <svg
            width={viewBoxWidth * scaleRatio}
            height={viewBoxHeight * scaleRatio}
            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
            className="select-none filter drop-shadow-md"
          >
            <defs>
              {/* Pattern for Kerf gap */}
              <pattern id="kerfHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#f43f5e" strokeWidth="1.5" strokeOpacity="0.4" />
              </pattern>
              {/* Pattern for Process Waste */}
              <pattern id="wasteHatch" width="12" height="12" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="12" stroke="#94a3b8" strokeWidth="1.5" strokeOpacity="0.35" />
              </pattern>
              {/* Pattern for Reusable Offcut */}
              <pattern id="reusableHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="10" stroke="#10b981" strokeWidth="1" strokeOpacity="0.3" />
              </pattern>
              {/* Arrow markers */}
              <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#475569" />
              </marker>
            </defs>

            {/* Translation group to center stock within margin */}
            <g transform={`translate(${margin}, ${margin})`}>
              {/* 1. Base Stock Background (Represents total raw stock sheet) */}
              <rect
                x="0"
                y="0"
                width={stockW}
                height={stockL}
                fill="#f8fafc"
                stroke="#0f2a43"
                strokeWidth="3.5"
                rx="3"
              />

              {/* 2. Offcut regions */}
              {solution.offcuts.map((off, idx) => (
                <g key={`offcut-${idx}`}>
                  <rect
                    x={off.x}
                    y={off.y}
                    width={off.width}
                    height={off.height}
                    fill={off.isReusable ? 'url(#reusableHatch)' : 'url(#wasteHatch)'}
                    stroke={off.isReusable ? '#059669' : '#cbd5e1'}
                    strokeWidth="1.5"
                    strokeDasharray={off.isReusable ? '4 2' : undefined}
                  />
                  {/* Label for large offcuts */}
                  {off.width > 70 && off.height > 60 && (
                    <text
                      x={off.x + off.width / 2}
                      y={off.y + off.height / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[12px] font-bold"
                      fill={off.isReusable ? '#047857' : '#64748b'}
                    >
                      {off.isReusable ? 'REUSABLE OFFCUT' : 'TRIM WASTE'}
                    </text>
                  )}
                </g>
              ))}

              {/* 3. Finished Pieces */}
              {solution.pieces.map((piece) => {
                const isHovered = activePiece === piece.id;
                return (
                  <g 
                    key={`piece-${piece.id}`}
                    onMouseEnter={() => setActivePiece(piece.id)}
                    onMouseLeave={() => setActivePiece(null)}
                    className="cursor-pointer transition-all duration-150"
                  >
                    <rect
                      x={piece.x}
                      y={piece.y}
                      width={piece.width}
                      height={piece.height}
                      fill={isHovered ? '#3b82f6' : '#2563eb'}
                      fillOpacity={isHovered ? 0.95 : 0.85}
                      stroke="#1e3a8a"
                      strokeWidth="2"
                      rx="2"
                    />
                    {/* Centered Piece Number */}
                    <text
                      x={piece.x + piece.width / 2}
                      y={piece.y + piece.height / 2 - (piece.height > 80 ? 8 : 0)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#ffffff"
                      fontSize={Math.max(12, Math.min(22, piece.width / 8))}
                      fontWeight="bold"
                    >
                      P{piece.id}
                    </text>
                    {/* Dimension subtext inside piece if space permits */}
                    {piece.height > 80 && piece.width > 90 && (
                      <text
                        x={piece.x + piece.width / 2}
                        y={piece.y + piece.height / 2 + 12}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#dbeafe"
                        fontSize={Math.max(9, Math.min(13, piece.width / 14))}
                        fontWeight="600"
                      >
                        {formatDimension(piece.width, displayUnit)} × {formatDimension(piece.height, displayUnit)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* 4. Guillotine Cut Lines (Dashed amber/rose lines) */}
              {showCutLines && (
                <g>
                  {/* Vertical cuts */}
                  {solution.columns > 1 && Array.from({ length: solution.columns - 1 }).map((_, cIdx) => {
                    const cutX = (cIdx + 1) * solution.pieces[0].width + cIdx * solution.kerfMm + solution.edgeTrimMm / 2;
                    return (
                      <g key={`cut-v-${cIdx}`}>
                        <line
                          x1={cutX}
                          y1={0}
                          x2={cutX}
                          y2={solution.usedHeightMm + solution.edgeTrimMm}
                          stroke="#ef4444"
                          strokeWidth="2"
                          strokeDasharray="6 4"
                        />
                      </g>
                    );
                  })}
                  {/* Horizontal cuts */}
                  {solution.rows > 1 && Array.from({ length: solution.rows - 1 }).map((_, rIdx) => {
                    const cutY = (rIdx + 1) * solution.pieces[0].height + rIdx * solution.kerfMm + solution.edgeTrimMm / 2;
                    return (
                      <g key={`cut-h-${rIdx}`}>
                        <line
                          x1={0}
                          y1={cutY}
                          x2={solution.usedWidthMm + solution.edgeTrimMm}
                          y2={cutY}
                          stroke="#ef4444"
                          strokeWidth="2"
                          strokeDasharray="6 4"
                        />
                      </g>
                    );
                  })}
                  {/* Primary offcut rip cuts */}
                  {solution.remainingWidthMm >= 20 && (
                    <line
                      x1={solution.usedWidthMm}
                      y1={0}
                      x2={solution.usedWidthMm}
                      y2={stockL}
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeDasharray="8 4"
                    />
                  )}
                  {solution.remainingHeightMm >= 20 && (
                    <line
                      x1={0}
                      y1={solution.usedHeightMm}
                      x2={stockW}
                      y2={solution.usedHeightMm}
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeDasharray="8 4"
                    />
                  )}
                </g>
              )}

              {/* 5. External Dimension Arrows & Callouts */}
              {showDimensions && (
                <g>
                  {/* Top Arrow: Total Stock Width */}
                  <line
                    x1="0"
                    y1="-24"
                    x2={stockW}
                    y2="-24"
                    stroke="#475569"
                    strokeWidth="1.5"
                    markerStart="url(#arrow)"
                    markerEnd="url(#arrow)"
                  />
                  <line x1="0" y1="-32" x2="0" y2="-8" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1={stockW} y1="-32" x2={stockW} y2="-8" stroke="#cbd5e1" strokeWidth="1" />
                  <text
                    x={stockW / 2}
                    y="-32"
                    textAnchor="middle"
                    className="text-[12px] font-bold"
                    fill="#334155"
                  >
                    Stock Width: {formatDimension(stockW, displayUnit)}
                  </text>

                  {/* Left Arrow: Total Stock Length */}
                  <line
                    x1="-24"
                    y1="0"
                    x2="-24"
                    y2={stockL}
                    stroke="#475569"
                    strokeWidth="1.5"
                    markerStart="url(#arrow)"
                    markerEnd="url(#arrow)"
                  />
                  <line x1="-32" y1="0" x2="-8" y2="0" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="-32" y1={stockL} x2="-8" y2={stockL} stroke="#cbd5e1" strokeWidth="1" />
                  <text
                    x="-32"
                    y={stockL / 2}
                    textAnchor="middle"
                    transform={`rotate(-90, -32, ${stockL / 2})`}
                    className="text-[12px] font-bold"
                    fill="#334155"
                  >
                    Stock Length: {formatDimension(stockL, displayUnit)}
                  </text>

                  {/* Active Used Area Callout (bottom) */}
                  <line
                    x1="0"
                    y1={stockL + 24}
                    x2={solution.usedWidthMm}
                    y2={stockL + 24}
                    stroke="#2563eb"
                    strokeWidth="1.5"
                    markerStart="url(#arrow)"
                    markerEnd="url(#arrow)"
                  />
                  <line x1="0" y1={stockL + 12} x2="0" y2={stockL + 32} stroke="#bfdbfe" strokeWidth="1" />
                  <line x1={solution.usedWidthMm} y1={stockL + 12} x2={solution.usedWidthMm} y2={stockL + 32} stroke="#bfdbfe" strokeWidth="1" />
                  <text
                    x={solution.usedWidthMm / 2}
                    y={stockL + 40}
                    textAnchor="middle"
                    className="text-[11px] font-bold"
                    fill="#1d4ed8"
                  >
                    Used Width: {formatDimension(solution.usedWidthMm, displayUnit)}
                  </text>
                </g>
              )}
            </g>
          </svg>
        </div>
      </div>

      {/* Legend & Summary Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 text-xs border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-blue-600"></span>
            <span className="text-slate-600 font-medium">Finished Product ({solution.yieldPerSheet} pcs)</span>
          </div>
          {solution.kerfMm > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded border border-rose-300 bg-rose-50"></span>
              <span className="text-slate-600 font-medium">Blade Kerf ({formatDimension(solution.kerfMm, displayUnit)})</span>
            </div>
          )}
          {solution.reusableOffcutAreaMm2 > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded border border-emerald-400 bg-emerald-50"></span>
              <span className="text-emerald-700 font-medium">Reusable Offcut Strip</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded border border-slate-300 bg-slate-100"></span>
            <span className="text-slate-500 font-medium">Process Waste / Trim</span>
          </div>
        </div>

        <div className="text-slate-500 font-medium">
          Orientation: <span className="font-bold text-slate-800">{solution.orientation}</span>
        </div>
      </div>
    </div>
  );
};
