import React, { useState, useMemo } from 'react';
import { Calculator, RotateCcw, ArrowLeft, Info, Layers, Maximize, Move } from 'lucide-react';

interface PaperCalculatorProps {
  onBack: () => void;
}

const PaperCalculator: React.FC<PaperCalculatorProps> = ({ onBack }) => {
  const [gsm, setGsm] = useState<number | ''>(280);
  const [width, setWidth] = useState<number | ''>(60);
  const [length, setLength] = useState<number | ''>(100);
  const [sheets, setSheets] = useState<number | ''>(1000);

  const result = useMemo(() => {
    const g = Number(gsm);
    const w = Number(width);
    const l = Number(length);
    const s = Number(sheets);

    if (g && w && l && s) {
      return Number(((w * l * g * s) / 10000000).toFixed(2));
    }
    return 0;
  }, [gsm, width, length, sheets]);

  const handleReset = () => {
    setGsm('');
    setWidth('');
    setLength('');
    setSheets('');
  };

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] overflow-hidden">
      {/* Compact Header */}
      <div className="bg-[#0c4a6e] px-4 md:px-8 py-2 md:py-3 flex justify-between items-center shadow-lg shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={onBack} 
            className="p-1.5 md:p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all"
            title="Back to Operations"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <div className="flex flex-col">
            <h2 className="text-white font-bold text-xs md:text-lg leading-tight uppercase tracking-tight flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400" />
              Calculator
            </h2>
          </div>
        </div>
        <button 
          onClick={handleReset}
          className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-white text-[9px] md:text-xs font-bold uppercase tracking-widest transition-all border border-white/10"
        >
          <RotateCcw className="w-2.5 h-2.5" />
          Reset
        </button>
      </div>

      {/* Optimized Content Area - Reduced Padding */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 md:p-8 lg:p-12 flex flex-col items-center">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-8 items-stretch">
          
          {/* Input Panel - Tighter gaps for mobile */}
          <div className="bg-white rounded-xl md:rounded-3xl shadow-lg border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-3 md:p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Move className="w-3.5 h-3.5 md:w-5 md:h-5" />
                </div>
                <h3 className="font-bold text-xs md:text-base text-slate-800 uppercase tracking-tight">Inputs</h3>
              </div>
              <Info className="w-3.5 h-3.5 text-slate-300 hidden sm:block" />
            </div>

            <div className="p-3 md:p-8 space-y-3 md:space-y-6">
              <CalcInput 
                label="GSM" 
                value={gsm} 
                onChange={setGsm} 
                unit="gsm" 
                placeholder="280" 
                icon={Layers}
              />
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                <CalcInput 
                  label="Width" 
                  value={width} 
                  onChange={setWidth} 
                  unit="cm" 
                  placeholder="60" 
                  icon={Maximize}
                />
                <CalcInput 
                  label="Length" 
                  value={length} 
                  onChange={setLength} 
                  unit="cm" 
                  placeholder="100" 
                  icon={Maximize}
                />
              </div>
              <CalcInput 
                label="Quantity" 
                value={sheets} 
                onChange={setSheets} 
                unit="pcs" 
                placeholder="1000" 
                icon={Calculator}
              />
            </div>
          </div>

          {/* Result Panel - Smaller height on mobile */}
          <div className="bg-[#0c4a6e] rounded-xl md:rounded-3xl shadow-xl overflow-hidden flex flex-col text-white">
            <div className="p-4 md:p-12 flex-1 flex flex-col justify-center items-center text-center space-y-3 md:space-y-8">
              <div className="space-y-0.5">
                <p className="text-blue-300 text-[8px] md:text-xs font-black uppercase tracking-[0.2em] opacity-80">Final Weight</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl md:text-[100px] font-black leading-none tabular-nums tracking-tighter">
                    {result}
                  </span>
                  <span className="text-xl md:text-4xl font-bold ml-1 md:ml-2 text-blue-400 uppercase">kg</span>
                </div>
              </div>

              {/* Progress Visualization - Slimmer for mobile */}
              <div className="w-full max-w-[200px] md:max-w-none space-y-1.5 md:space-y-3">
                <div className="h-1 md:h-2 w-full bg-white/10 rounded-full overflow-hidden">
                   <div 
                    className="h-full bg-blue-400 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    style={{ width: `${Math.min(100, (result / 200) * 100)}%` }}
                   ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 w-full">
                <div className="bg-white/5 p-2 md:p-4 rounded-lg md:rounded-2xl border border-white/5 text-left">
                  <p className="text-[7px] md:text-[9px] font-bold text-blue-300 uppercase tracking-widest">Sheets</p>
                  <p className="text-sm md:text-lg font-black">{sheets || 0}</p>
                </div>
                <div className="bg-white/5 p-2 md:p-4 rounded-lg md:rounded-2xl border border-white/5 text-left">
                  <p className="text-[7px] md:text-[9px] font-bold text-blue-300 uppercase tracking-widest">Area</p>
                  <p className="text-sm md:text-lg font-black">
                    {width && length ? ((Number(width) * Number(length)) / 10000).toFixed(2) : 0} m²
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-600 p-2 md:p-6 flex items-center justify-between shrink-0">
              <p className="text-[7px] md:text-xs font-bold uppercase tracking-tight">Verified Operations</p>
              <p className="text-[7px] md:text-[10px] font-black text-white/30 tracking-widest">V1.24.0</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const CalcInput = ({ label, value, onChange, unit, placeholder, icon: Icon }: any) => (
  <div className="space-y-0.5 md:space-y-2 group">
    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative">
      <div className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
        <Icon className="w-3.5 h-3.5 md:w-5 md:h-5" />
      </div>
      <input 
        type="number" 
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        className="w-full bg-slate-50 border border-slate-200 rounded-lg md:rounded-2xl py-2 md:py-4 pl-9 md:pl-12 pr-10 md:pr-16 text-sm md:text-xl font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-200"
        placeholder={placeholder}
      />
      <div className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 px-1 py-0.5 bg-slate-200 rounded text-[7px] md:text-[10px] font-black text-slate-500 uppercase">
        {unit}
      </div>
    </div>
  </div>
);

export default PaperCalculator;