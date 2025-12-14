
import React, { useState } from 'react';
import { Calculator, RotateCcw, ArrowLeft } from 'lucide-react';

interface PaperCalculatorProps {
  onBack: () => void;
}

const PaperCalculator: React.FC<PaperCalculatorProps> = ({ onBack }) => {
  const [gsm, setGsm] = useState<number | ''>('');
  const [width, setWidth] = useState<number | ''>('');
  const [length, setLength] = useState<number | ''>('');
  const [sheets, setSheets] = useState<number | ''>('');
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const g = Number(gsm);
    const w = Number(width);
    const l = Number(length);
    const s = Number(sheets);

    if (g && w && l && s) {
      // Formula: (Width(cm) * Length(cm) * GSM * Sheets) / 10,000,000
      const weight = (w * l * g * s) / 10000000;
      setResult(Number(weight.toFixed(2)));
    } else {
      setResult(0);
    }
  };

  const handleReset = () => {
    setGsm('');
    setWidth('');
    setLength('');
    setSheets('');
    setResult(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      calculate();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 relative overflow-hidden">
      
      {/* Top Bar */}
      <div className="p-2 md:p-4 flex justify-start bg-slate-100 shrink-0">
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold text-sm">Back to Inventory</span>
          </button>
      </div>

      {/* Main Content - Centered & Compact */}
      <div className="flex-1 flex flex-col items-center justify-start md:justify-center p-2 overflow-y-auto">
        
        <div className="w-full max-w-md border border-teal-600 rounded-xl overflow-hidden shadow-2xl bg-white flex flex-col">
          {/* Header */}
          <div className="bg-teal-600 text-white p-3 flex justify-between items-center shrink-0">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Calculator className="w-5 h-5" /> Ream Weight Calc
            </h2>
            <button 
              onClick={handleReset}
              className="text-teal-100 hover:text-white transition-colors p-1 rounded-full hover:bg-teal-700"
              title="Reset"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body - Ultra Compact for Mobile */}
          <div className="p-3 md:p-6 space-y-3 md:space-y-5">
            
            <div className="flex items-center gap-3">
              <label className="w-16 text-right text-sm text-gray-700 font-bold">GSM:</label>
              <div className="flex-1 flex shadow-sm h-10 md:h-12">
                <input 
                  type="number" 
                  placeholder="280"
                  className="flex-1 border border-gray-300 px-3 rounded-l-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white text-lg font-semibold text-gray-900"
                  value={gsm}
                  onChange={(e) => setGsm(e.target.value === '' ? '' : Number(e.target.value))}
                  onKeyDown={handleKeyDown}
                  inputMode="decimal"
                />
                <span className="bg-gray-100 border border-l-0 border-gray-300 text-gray-500 px-2 rounded-r-lg w-12 text-center text-xs font-bold flex items-center justify-center">gsm</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="w-16 text-right text-sm text-gray-700 font-bold">Width:</label>
              <div className="flex-1 flex shadow-sm h-10 md:h-12">
                <input 
                  type="number" 
                  placeholder="60"
                  className="flex-1 border border-gray-300 px-3 rounded-l-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white text-lg font-semibold text-gray-900"
                  value={width}
                  onChange={(e) => setWidth(e.target.value === '' ? '' : Number(e.target.value))}
                  onKeyDown={handleKeyDown}
                   inputMode="decimal"
                />
                <span className="bg-gray-100 border border-l-0 border-gray-300 text-gray-500 px-2 rounded-r-lg w-12 text-center text-xs font-bold flex items-center justify-center">cm</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="w-16 text-right text-sm text-gray-700 font-bold">Length:</label>
              <div className="flex-1 flex shadow-sm h-10 md:h-12">
                <input 
                  type="number" 
                  placeholder="100"
                  className="flex-1 border border-gray-300 px-3 rounded-l-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white text-lg font-semibold text-gray-900"
                  value={length}
                  onChange={(e) => setLength(e.target.value === '' ? '' : Number(e.target.value))}
                  onKeyDown={handleKeyDown}
                   inputMode="decimal"
                />
                <span className="bg-gray-100 border border-l-0 border-gray-300 text-gray-500 px-2 rounded-r-lg w-12 text-center text-xs font-bold flex items-center justify-center">cm</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="w-16 text-right text-sm text-gray-700 font-bold">Sheets:</label>
              <div className="flex-1 shadow-sm h-10 md:h-12">
                <input 
                  type="number" 
                  placeholder="1000"
                  className="w-full h-full border border-gray-300 px-3 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white text-lg font-semibold text-gray-900"
                  value={sheets}
                  onChange={(e) => setSheets(e.target.value === '' ? '' : Number(e.target.value))}
                  onKeyDown={handleKeyDown}
                   inputMode="numeric"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <label className="w-16 text-right text-sm text-gray-700 font-bold">Result:</label>
              <div className="flex-1 bg-teal-50 px-3 rounded-lg border border-teal-200 h-14 md:h-16 flex items-center shadow-inner">
                 <span className="text-3xl font-black text-teal-800">
                 {result !== null && result !== 0 ? `${result} kgs` : '---'}
                 </span>
              </div>
            </div>

            {/* Buttons Inline */}
            <div className="flex gap-3 pt-3">
              <button 
                onClick={handleReset}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 md:py-4 rounded-lg shadow-md transition-colors active:scale-95 text-sm md:text-base"
              >
                Reset
              </button>
              <button 
                onClick={calculate}
                className="flex-[2] bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 md:py-4 rounded-lg shadow-md transition-colors active:scale-95 text-lg md:text-xl flex items-center justify-center gap-2"
              >
                <Calculator className="w-5 h-5" /> Calculate
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperCalculator;
