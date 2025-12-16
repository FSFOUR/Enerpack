
import React, { useState, useRef } from 'react';
import { parseJobOrderText } from '../services/geminiService';
import { JobCardData } from '../types';
import { Printer, Wand2, Trash2, FileText, X, Eye, Download, ArrowLeft, Info, Loader2 } from 'lucide-react';

interface JobCardGeneratorProps {
  onBack: () => void;
}

// --- Reusable Card Component ---
const CardFace = ({ card, isBlank, updateCard, LOCATIONS, getGsmColor, onDelete }: any) => {
  return (
    <div className={`relative group w-full h-full border border-black box-border flex flex-col p-0.5`}>
      {/* Delete Button - Only for real cards */}
      {!isBlank && onDelete && (
        <div data-html2canvas-ignore="true" className="absolute right-1 top-1 z-10 print:hidden">
          <button 
            onClick={onDelete}
            className="bg-red-500 text-white p-1 rounded-full shadow opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            title="Delete Card"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Card Content - Maximized Area, Font Family Calibri */}
      <div className={`flex-1 flex flex-col text-black h-full text-calibri-18`} style={{ fontFamily: 'Calibri, sans-serif' }}>
        
        {/* Row 1: Job Card No - 8% */}
        <div className="flex border-b border-black h-[8%]">
          <div className="w-[30%] px-2 font-black bg-gray-100 print:bg-transparent border-r border-black flex items-center justify-start text-[14pt] print:text-[18pt]">JOB CARD NO</div>
          <div className="w-[70%]">
            <input 
              className="w-full h-full font-black bg-transparent outline-none text-center placeholder-gray-300 text-[18pt]" 
              value={card.jobCardNo}
              onChange={(e) => !isBlank && updateCard(card.id, 'jobCardNo', e.target.value)}
              readOnly={isBlank}
            />
          </div>
        </div>
        
        {/* Row 2: Date - 8% */}
        <div className="flex border-b border-black h-[8%]">
          <div className="w-[30%] px-2 font-black bg-gray-100 print:bg-transparent border-r border-black flex items-center justify-start text-[14pt] print:text-[18pt]">DATE</div>
          <div className="w-[70%]">
            <input 
              type={isBlank ? "text" : "date"}
              className="w-full h-full font-black bg-transparent outline-none text-center uppercase text-[18pt]" 
              value={card.date}
              onChange={(e) => !isBlank && updateCard(card.id, 'date', e.target.value)}
              readOnly={isBlank}
            />
          </div>
        </div>
        
        {/* Row 3: Item Code - 8% */}
        <div className="flex border-b border-black h-[8%]">
          <div className="w-[30%] px-2 font-black bg-gray-100 print:bg-transparent border-r border-black flex items-center justify-start text-[14pt] print:text-[18pt]">ITEM CODE</div>
          <div className="w-[70%]">
            <input 
              className="w-full h-full font-black bg-transparent outline-none text-center uppercase text-[18pt]" 
              value={card.itemCode || ''}
              onChange={(e) => !isBlank && updateCard(card.id, 'itemCode', e.target.value.toUpperCase())}
              readOnly={isBlank}
            />
          </div>
        </div>

        {/* Row 4: Work Name - 18% (Largest) */}
        <div className="flex border-b border-black h-[18%]">
          <div className="w-[30%] px-2 font-black bg-gray-100 print:bg-transparent border-r border-black flex items-center justify-start text-[14pt] print:text-[18pt]">WORK NAME</div>
          <div className="w-[70%] h-full flex items-center justify-center p-1">
            <textarea 
              className="w-full bg-transparent outline-none text-center leading-tight uppercase whitespace-pre-wrap text-[18pt] resize-none overflow-hidden"
              value={card.workName}
              onChange={(e) => !isBlank && updateCard(card.id, 'workName', e.target.value)}
              readOnly={isBlank}
              rows={3}
            />
          </div>
        </div>

        {/* Row 5: Size - 8.2% */}
        <div className="flex border-b border-black h-[8.2%]">
          <div className="w-[30%] px-2 font-black bg-gray-100 print:bg-transparent border-r border-black flex items-center justify-start text-[14pt] print:text-[18pt]">SIZE</div>
          <div className="w-[70%]">
            <input 
              className="w-full h-full font-black bg-transparent outline-none text-center uppercase text-[18pt]" 
              value={card.size}
              onChange={(e) => !isBlank && updateCard(card.id, 'size', e.target.value)}
              readOnly={isBlank}
            />
          </div>
        </div>

        {/* Row 6: GSM - 8.2% - HIGHLIGHTED */}
        <div className={`flex border-b border-black h-[8.2%] ${getGsmColor(card.gsm)}`}>
          <div className="w-[30%] px-2 font-black border-r border-black flex items-center justify-start text-[14pt] print:text-[18pt] bg-inherit">GSM</div>
          <div className="w-[70%]">
            <input 
              className="w-full h-full font-black bg-transparent outline-none text-center uppercase text-[18pt]" 
              value={card.gsm}
              onChange={(e) => !isBlank && updateCard(card.id, 'gsm', e.target.value)}
              readOnly={isBlank}
            />
          </div>
        </div>

        {/* Row 7: Total Gross - 8.2% */}
        <div className="flex border-b border-black h-[8.2%]">
          <div className="w-[30%] px-2 font-black bg-gray-100 print:bg-transparent border-r border-black flex items-center justify-start text-[14pt] print:text-[18pt]">TOTAL GROSS</div>
          <div className="w-[70%]">
            <input 
              className="w-full h-full font-black bg-transparent outline-none text-center uppercase text-[18pt]" 
              value={card.totalGross}
              onChange={(e) => !isBlank && updateCard(card.id, 'totalGross', e.target.value)}
              readOnly={isBlank}
            />
          </div>
        </div>

        {/* Row 8: Delivery Location - 8.2% */}
        <div className="flex border-b border-black h-[8.2%]">
          <div className="w-[30%] px-2 font-black bg-gray-100 print:bg-transparent border-r border-black flex items-center justify-start text-[14pt] print:text-[18pt]">DELIVERY LOCATION</div>
          <div className="w-[70%] relative">
            <input 
              list={isBlank ? undefined : `locations-${card.id}`}
              className="w-full h-full font-black bg-transparent outline-none text-center uppercase text-[18pt]" 
              value={card.deliveryLocation}
              onChange={(e) => !isBlank && updateCard(card.id, 'deliveryLocation', e.target.value)}
              placeholder=""
              readOnly={isBlank}
            />
            {!isBlank && (
            <datalist id={`locations-${card.id}`}>
              {LOCATIONS.map((loc: string) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
            )}
          </div>
        </div>

        {/* Row 9: Loading Date - 8.2% */}
        <div className="flex border-b border-black h-[8.2%]">
          <div className="w-[30%] px-2 font-black bg-gray-100 print:bg-transparent border-r border-black flex items-center justify-start text-[14pt] print:text-[18pt]">LOADING DATE</div>
          <div className="w-[70%]">
            <input 
              type="text"
              className="w-full h-full font-black bg-transparent outline-none text-center uppercase text-[18pt]" 
              value={card.loadingDate}
              onChange={(e) => !isBlank && updateCard(card.id, 'loadingDate', e.target.value)}
              readOnly={isBlank}
            />
          </div>
        </div>

        {/* Row 10: Signatures - 17% */}
        <div className="flex h-[17%]">
            <div className="w-1/2 border-r border-black flex flex-col">
              <div className="bg-gray-100 print:bg-transparent border-b border-black font-black text-center p-1 text-[12pt] print:text-[14pt]">SUPERVISOR</div>
              <div className="flex-1"></div>
            </div>
            <div className="w-1/2 flex flex-col">
              <div className="bg-gray-100 print:bg-transparent border-b border-black font-black text-center p-1 text-[12pt] print:text-[14pt]">ACCOUNTANT</div>
              <div className="flex-1"></div>
            </div>
        </div>

      </div>
    </div>
  );
};


const JobCardGenerator: React.FC<JobCardGeneratorProps> = ({ onBack }) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<JobCardData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<'EP' | 'FP'>('EP');
  const [showPreview, setShowPreview] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const printContentRef = useRef<HTMLDivElement>(null);

  const LOCATIONS = ["EP", "AKP", "KKP", "FP", "Other"];

  // Helper to calculate Financial Year (e.g., "24-25")
  const getFinancialYear = () => {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const year = now.getFullYear();
    let startYear = year;
    // Financial year starts in April (Month 3)
    if (month < 3) {
        startYear = year - 1;
    }
    const endYear = startYear + 1;
    return `${startYear.toString().slice(-2)}-${endYear.toString().slice(-2)}`;
  };

  const getNextSerialNumbers = (count: number, cat: 'EP' | 'FP') => {
    const fy = getFinancialYear();
    const storageKey = 'enerpack_serial_counters_v1';
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{"fy": "", "EP": 0, "FP": 0}');
    
    // Reset if Financial Year changed
    if (stored.fy !== fy) {
      stored.fy = fy;
      stored.EP = 0;
      stored.FP = 0;
    }

    const startSerial = stored[cat] + 1;
    const serials: string[] = [];
    
    for (let i = 0; i < count; i++) {
       const current = startSerial + i;
       // Format: EP/24-25/001
       serials.push(`${cat}/${fy}/${current.toString().padStart(3, '0')}`);
    }

    // Update storage
    stored[cat] = startSerial + count - 1;
    localStorage.setItem(storageKey, JSON.stringify(stored));

    return serials;
  };

  const getGsmColor = (gsm: string) => {
      const g = gsm.trim();
      if (g.includes('280')) return 'bg-blue-100 print:bg-blue-100'; // Light Blue
      if (g.includes('200')) return 'bg-yellow-100 print:bg-yellow-100'; // Light Yellow
      if (g.includes('150')) return 'bg-green-100 print:bg-green-100'; // Light Green
      if (g.includes('140')) return 'bg-pink-100 print:bg-pink-100'; // Light Pink
      if (g.includes('GYT')) return 'bg-gray-200 print:bg-gray-200'; // Gray
      return 'bg-transparent';
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    setError(null);
    try {
      const results = await parseJobOrderText(inputText);
      
      // Get serials for this batch
      const serials = getNextSerialNumbers(results.length, category);

      const newCards = results.map((r, index) => ({
        id: crypto.randomUUID(),
        jobCardNo: serials[index],
        date: r.date || new Date().toISOString().split('T')[0],
        workName: r.workName || '',
        itemCode: r.itemCode || '',
        size: r.size || '',
        gsm: r.gsm || '',
        totalGross: r.totalGross || '',
        deliveryLocation: r.deliveryLocation || '',
        loadingDate: '',
        supervisorSign: '',
        accountantSign: ''
      }));
      setGeneratedCards([...generatedCards, ...newCards]);
      setInputText('');
    } catch (err) {
      setError("Failed to process text. Please ensure your API Key is valid and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const updateCard = (id: string, field: keyof JobCardData, value: string) => {
    setGeneratedCards(prev => prev.map(card => 
      card.id === id ? { ...card, [field]: value } : card
    ));
  };

  const removeCard = (id: string) => {
    setGeneratedCards(prev => prev.filter(c => c.id !== id));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!printContentRef.current) return;
    if (generatedCards.length === 0) return;

    if (typeof (window as any).html2pdf === 'undefined') {
        alert("PDF generator library not loaded. Please refresh the page.");
        return;
    }

    setIsPdfGenerating(true);

    // Use timeout to allow UI to show spinner before freezing for generation
    setTimeout(async () => {
        try {
            const element = printContentRef.current;
            const opt = {
              margin: 0,
              filename: `JobCards_${category}_${new Date().toISOString().split('T')[0]}.pdf`,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
            };

            await (window as any).html2pdf().set(opt).from(element).save();
        } catch (err) {
            console.error(err);
            alert("Failed to generate PDF.");
        } finally {
            setIsPdfGenerating(false);
        }
    }, 100);
  };

  // Chunk cards into groups of 2 for A4 pages (Landscape now)
  const chunkedCards = [];
  for (let i = 0; i < generatedCards.length; i += 2) {
    const chunk = generatedCards.slice(i, i + 2);
    // Pad with blank cards if less than 2
    const paddedChunk = [...chunk];
    while (paddedChunk.length < 2) {
      paddedChunk.push({
        id: `blank-${i}-${paddedChunk.length}`,
        jobCardNo: '',
        date: '',
        workName: '',
        itemCode: '',
        size: '',
        gsm: '',
        totalGross: '',
        deliveryLocation: '',
        loadingDate: '',
        supervisorSign: '',
        accountantSign: '',
        isBlank: true 
      } as any);
    }
    chunkedCards.push(paddedChunk);
  }

  return (
    <div className="flex flex-col md:flex-row h-full bg-gray-50">
      <style>{`
        @media print {
          @page { size: landscape; margin: 0mm; }
          body { -webkit-print-color-adjust: exact; font-family: 'Calibri', sans-serif; }
          input, textarea, select { font-family: 'Calibri', sans-serif; }
          .page-break { page-break-after: always; }
          .no-page-break { page-break-after: auto; }
        }
        .text-calibri-18 {
           font-size: 18pt;
           line-height: 1.2;
        }
      `}</style>
      
      {/* ----------------- INPUT INTERFACE ----------------- */}
      <div className={`flex flex-col h-full w-full md:w-[450px] shrink-0 border-r border-gray-200 bg-white transition-all
          ${showPreview ? 'hidden md:flex' : 'flex'} print:hidden z-10`}>
          
          {/* Header */}
          <div className="bg-white p-3 border-b flex justify-between items-center shadow-sm shrink-0">
              <div className="flex items-center gap-3">
                  <button onClick={onBack} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors">
                      <ArrowLeft className="w-5 h-5 text-gray-700"/>
                  </button>
                  <h2 className="text-lg font-bold text-gray-800">Job Card Generator</h2>
              </div>
              <button 
                onClick={() => setShowInstructions(!showInstructions)} 
                className={`p-2 rounded-full transition-colors ${showInstructions ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                  <Info className="w-5 h-5" />
              </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col p-3 gap-3 overflow-hidden">
              
              {/* Instructions Panel */}
              {showInstructions && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs text-blue-900 shrink-0 animate-in slide-in-from-top-2">
                     <p className="font-bold mb-1">How to use:</p>
                     <ul className="list-disc pl-4 space-y-0.5">
                        <li>Select Category <strong>EP</strong> or <strong>FP</strong>.</li>
                        <li>Paste WhatsApp work orders text.</li>
                        <li>Click Generate.</li>
                     </ul>
                  </div>
              )}

              {/* Input Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden relative">
                   {/* Category Selector Bar */}
                   <div className="flex items-center justify-between p-2 px-3 border-b bg-gray-50/50 shrink-0">
                       <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Category</span>
                       <div className="flex bg-white rounded-lg border border-gray-200 p-0.5">
                          {['EP', 'FP'].map(c => (
                              <button
                                  key={c}
                                  onClick={() => setCategory(c as any)}
                                  className={`px-4 py-1 rounded-md text-xs font-bold transition-all ${category === c ? 'bg-enerpack-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                              >
                                  {c}
                              </button>
                          ))}
                       </div>
                   </div>

                   <textarea 
                      className="flex-1 w-full p-3 resize-none outline-none text-sm font-mono placeholder-gray-400 focus:bg-blue-50/10 transition-colors"
                      placeholder="Paste orders here (e.g. Fw10057 Vkc pl3 50x81-200 gsm 70 gross...)"
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                   />
                   
                   {error && (
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-red-50 text-red-600 text-xs text-center border-t border-red-100 font-medium">
                        {error}
                      </div>
                   )}
              </div>

              {/* Action Bar */}
              <div className="shrink-0 space-y-3 pt-1">
                   <button 
                      onClick={handleGenerate}
                      disabled={isProcessing || !inputText.trim()}
                      className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95
                        ${isProcessing || !inputText.trim() ? 'bg-slate-300 cursor-not-allowed text-slate-500' : 'bg-enerpack-600 hover:bg-enerpack-700'}`}
                   >
                       {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                       {isProcessing ? 'Processing...' : 'Generate Cards'}
                   </button>

                   {/* Desktop: Actions in Preview Header. Mobile: Grid here. */}
                   <div className="grid grid-cols-3 gap-3 md:hidden">
                       <button 
                          onClick={() => setShowPreview(true)}
                          disabled={generatedCards.length === 0}
                          className="flex flex-col items-center justify-center py-2 px-1 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 active:bg-gray-100"
                       >
                          <Eye className="w-5 h-5 text-indigo-600 mb-1" />
                          <span className="text-[10px] font-bold text-gray-600">Preview ({generatedCards.length})</span>
                       </button>
                       <button 
                          onClick={handleDownloadPDF}
                          disabled={generatedCards.length === 0 || isPdfGenerating}
                          className="flex flex-col items-center justify-center py-2 px-1 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 active:bg-gray-100"
                       >
                          {isPdfGenerating ? <Loader2 className="w-5 h-5 text-blue-600 mb-1 animate-spin" /> : <Download className="w-5 h-5 text-blue-600 mb-1" />}
                          <span className="text-[10px] font-bold text-gray-600">{isPdfGenerating ? 'Saving...' : 'Save PDF'}</span>
                       </button>
                       <button 
                          onClick={handlePrint}
                          disabled={generatedCards.length === 0}
                          className="flex flex-col items-center justify-center py-2 px-1 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 active:bg-gray-100"
                       >
                          <Printer className="w-5 h-5 text-slate-700 mb-1" />
                          <span className="text-[10px] font-bold text-gray-600">Print</span>
                       </button>
                   </div>
              </div>
          </div>
      </div>

      {/* ----------------- PREVIEW AREA (Split on Desktop, Modal on Mobile) ----------------- */}
      <div className={`flex-1 flex flex-col h-full bg-gray-100 overflow-hidden relative
           ${!showPreview ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Desktop Toolbar */}
        <div className="hidden md:flex bg-white border-b p-3 justify-between items-center shadow-sm z-10">
             <span className="font-bold text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4" /> 
                {generatedCards.length > 0 ? `Live Preview (${chunkedCards.length} Pages)` : 'Live Preview'}
             </span>
             <div className="flex gap-2">
                 <button 
                    onClick={handleDownloadPDF} 
                    disabled={generatedCards.length === 0 || isPdfGenerating}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded flex items-center gap-2 text-sm font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    {isPdfGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Save PDF
                 </button>
                 <button 
                    onClick={handlePrint}
                    disabled={generatedCards.length === 0}
                    className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded flex items-center gap-2 text-sm font-bold shadow-sm disabled:opacity-50"
                 >
                    <Printer className="w-4 h-4" /> Print
                 </button>
             </div>
        </div>

        {/* Mobile Preview Header */}
        <div className="md:hidden bg-gray-800 text-white p-3 flex flex-row justify-between items-center sticky top-0 z-30 print:hidden shadow-lg">
          <span className="font-bold flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4"/> 
            Preview
          </span>
          <div className="flex gap-2">
             {/* Mobile Actions */}
             <button onClick={() => setShowPreview(false)} className="bg-gray-600 p-2 rounded hover:bg-gray-500 flex items-center gap-1 font-bold text-xs px-3">
              <X className="w-4 h-4" /> Close
            </button>
          </div>
        </div>

        {/* Scroll Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 print:p-0 print:overflow-visible">
            
            {/* Empty State */}
            {generatedCards.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                  <FileText className="w-12 h-12 opacity-20" />
                  <p>Generated job cards will appear here.</p>
               </div>
            )}

            {/* Mobile Stack View (Only visible on Mobile when preview is open) */}
            {showPreview && generatedCards.length > 0 && (
                <div className="md:hidden flex flex-col gap-6 pb-20">
                    {generatedCards.map((card, i) => (
                        <div key={card.id} className="w-full flex flex-col items-center">
                            <div className="text-gray-400 text-xs font-bold mb-2">Card {i + 1} of {generatedCards.length}</div>
                            <div 
                                className="bg-white shadow-xl origin-top"
                                style={{ 
                                    width: '560px', 
                                    height: '794px', 
                                    transform: 'scale(0.55)', 
                                    marginBottom: '-350px'
                                }}
                            >
                                <CardFace 
                                    card={card}
                                    isBlank={false}
                                    updateCard={updateCard}
                                    LOCATIONS={LOCATIONS}
                                    getGsmColor={getGsmColor}
                                    onDelete={() => removeCard(card.id)}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Desktop/Print A4 View (Always in DOM for PDF, visible on Desktop) */}
            <div ref={printContentRef} className={`max-w-[297mm] mx-auto print:w-full print:max-w-none transition-opacity duration-300
                ${showPreview ? 'hidden md:block' : 'hidden md:block fixed left-[-10000px] md:static'}`}>
                
                {chunkedCards.map((pageBatch, pageIndex) => {
                    const isLastPage = pageIndex === chunkedCards.length - 1;
                    return (
                    <div 
                        key={pageIndex} 
                        className={`bg-white shadow-xl print:shadow-none w-[297mm] h-[210mm] mx-auto p-[20mm] print:p-[20mm] relative grid grid-cols-2 gap-[20mm] overflow-hidden box-border mb-8 print:mb-0 ${isLastPage ? 'no-page-break' : 'page-break'}`}
                        style={{ pageBreakAfter: isLastPage ? 'auto' : 'always' }}
                    >
                        {pageBatch.map((card) => {
                            const isBlank = (card as any).isBlank;
                            return (
                                <CardFace 
                                    key={card.id}
                                    card={card}
                                    isBlank={isBlank}
                                    updateCard={updateCard}
                                    LOCATIONS={LOCATIONS}
                                    getGsmColor={getGsmColor}
                                    onDelete={() => removeCard(card.id)}
                                />
                            )
                        })}
                    </div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default JobCardGenerator;
