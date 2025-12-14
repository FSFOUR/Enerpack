import React, { useState, useRef } from 'react';
import { parseJobOrderText } from '../services/geminiService';
import { JobCardData } from '../types';
import { Printer, Wand2, Trash2, FileText, X, Eye, Download, Save, ArrowLeft } from 'lucide-react';

interface JobCardGeneratorProps {
  onBack: () => void;
}

const JobCardGenerator: React.FC<JobCardGeneratorProps> = ({ onBack }) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<JobCardData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<'EP' | 'FP'>('EP');
  const [showPreview, setShowPreview] = useState(false);
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
    const element = printContentRef.current;
    
    // Check if html2pdf is available
    if (typeof (window as any).html2pdf === 'undefined') {
        alert("PDF generator library not loaded. Please refresh the page.");
        return;
    }

    // Temporarily remove spacing for capture if needed, or rely on options
    // Using html2pdf defaults mostly
    const opt = {
      margin: 0,
      filename: `JobCards_${category}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    // @ts-ignore
    (window as any).html2pdf().set(opt).from(element).save();
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
        // Use a flag to indicate this is a placeholder
        isBlank: true 
      } as any);
    }
    chunkedCards.push(paddedChunk);
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <style>{`
        @media print {
          @page { size: landscape; margin: 0mm; }
          body { -webkit-print-color-adjust: exact; font-family: 'Calibri', sans-serif; }
          input, textarea, select { font-family: 'Calibri', sans-serif; }
          /* Ensure no extra blank pages */
          .page-break { page-break-after: always; }
          .no-page-break { page-break-after: auto; }
        }
        /* Custom font size class for 18pt approx */
        .text-calibri-18 {
           font-size: 18pt;
           line-height: 1.2;
        }
      `}</style>
      {/* Screen Only Controls */}
      <div className={`print:hidden p-4 space-y-4 bg-white border-b shadow-sm z-20 ${showPreview ? 'hidden' : 'block'}`}>
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-bold text-sm">Back to Inventory</span>
                </button>
                <h2 className="text-xl font-bold text-enerpack-800 border-l pl-4 border-gray-300">Job Card Generator</h2>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="text-sm font-semibold text-gray-700">Paste Work Orders (WhatsApp Style)</label>
            
            {/* Category Selection */}
            <div className="flex items-center space-x-6 p-3 bg-gray-50 rounded border">
                <span className="text-sm font-bold text-gray-700">Select Category:</span>
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                        type="radio" 
                        name="category"
                        value="EP" 
                        checked={category === 'EP'} 
                        onChange={() => setCategory('EP')}
                        className="w-4 h-4 text-enerpack-600 focus:ring-enerpack-500 border-gray-300"
                    />
                    <span className="font-bold text-gray-800">EP</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                        type="radio" 
                        name="category"
                        value="FP" 
                        checked={category === 'FP'} 
                        onChange={() => setCategory('FP')}
                        className="w-4 h-4 text-enerpack-600 focus:ring-enerpack-500 border-gray-300"
                    />
                    <span className="font-bold text-gray-800">FP</span>
                </label>
            </div>

            <textarea
              className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-enerpack-500 resize-none text-sm font-mono"
              placeholder={`Fw10057 Vkc pl3 50x81-200 gsm 70 gross ( Ener ) Reprint...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="flex gap-2">
              <button 
                onClick={handleGenerate}
                disabled={isProcessing || !inputText.trim()}
                className={`flex-1 flex items-center justify-center gap-2 py-3 md:py-2 rounded-lg font-bold text-white transition-all
                  ${isProcessing || !inputText.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-enerpack-600 hover:bg-enerpack-700 shadow-md'}`}
              >
                {isProcessing ? 'Processing...' : <><Wand2 className="w-4 h-4" /> AI Generate Cards ({category})</>}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div className="flex flex-col justify-end items-start p-4 bg-blue-50 rounded-lg border border-blue-100">
             <h3 className="font-semibold text-blue-900 mb-2">Instructions</h3>
             <ul className="text-sm text-blue-800 space-y-1 list-disc pl-4 mb-4">
                <li>Select Category <strong>EP</strong> or <strong>FP</strong>.</li>
                <li>Paste unstructured order text.</li>
                <li>AI will extract details and assign Serial Numbers.</li>
                <li><strong>Layout:</strong> Fits 2 cards per A4 Landscape sheet (Side-by-Side).</li>
             </ul>
             
             <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto">
                <button 
                  onClick={() => setShowPreview(true)}
                  disabled={generatedCards.length === 0}
                  className="bg-white border border-gray-300 text-gray-700 py-3 md:py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 disabled:opacity-50 font-bold shadow-sm"
                >
                  <Eye className="w-4 h-4" /> Preview
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  disabled={generatedCards.length === 0}
                  className="bg-enerpack-600 text-white py-3 md:py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-enerpack-700 disabled:opacity-50 font-bold shadow-sm"
                >
                  <Save className="w-4 h-4" /> Save PDF
                </button>
                <button 
                  onClick={handlePrint}
                  disabled={generatedCards.length === 0}
                  className="sm:col-span-2 bg-gray-800 text-white py-3 md:py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-900 disabled:opacity-50 font-bold shadow-md"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Preview Header (Visible only in preview mode) */}
      {showPreview && (
        <div className="bg-gray-800 text-white p-4 flex flex-col md:flex-row justify-between items-center sticky top-0 z-30 print:hidden shadow-lg gap-4 md:gap-0">
          <span className="font-bold flex items-center gap-2 text-sm md:text-base"><FileText className="w-5 h-5"/> PDF Preview Mode - {chunkedCards.length} Pages</span>
          <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
            <button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded font-bold flex items-center gap-2 text-sm">
              <Download className="w-4 h-4" /> PDF
            </button>
            <button onClick={handlePrint} className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded font-bold flex items-center gap-2 text-sm">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={() => setShowPreview(false)} className="bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded flex items-center gap-2 text-sm">
              <X className="w-4 h-4" /> Close
            </button>
          </div>
        </div>
      )}

      {/* Printable Area / Canvas */}
      <div className={`flex-1 overflow-auto p-4 md:p-8 print:p-0 print:overflow-visible transition-colors duration-300 ${showPreview ? 'bg-gray-700' : 'bg-gray-100'}`}>
        
        {generatedCards.length === 0 && !showPreview && (
          <div className="text-center py-20 text-gray-400 print:hidden">
            <p>No job cards generated yet.</p>
          </div>
        )}

        <div ref={printContentRef} className="max-w-[297mm] mx-auto print:w-full print:max-w-none">
          {chunkedCards.map((pageBatch, pageIndex) => {
            const isLastPage = pageIndex === chunkedCards.length - 1;
            return (
              /* A4 Page Container (Landscape) - Optimized for 2 Cards with Gap */
              /* Removed space-y-8 from container, added margin-bottom to pages instead */
              <div 
                key={pageIndex} 
                className={`bg-white shadow-xl print:shadow-none w-[297mm] h-[210mm] mx-auto p-[20mm] print:p-[20mm] relative grid grid-cols-2 gap-[20mm] overflow-hidden box-border mb-8 print:mb-0 ${isLastPage ? 'no-page-break' : 'page-break'}`}
                style={{ pageBreakAfter: isLastPage ? 'auto' : 'always' }}
              >
                {pageBatch.map((card) => {
                    const isBlank = (card as any).isBlank;
                    return (
                    <div 
                      key={card.id} 
                      className={`relative group w-full h-full border border-black box-border flex flex-col p-0.5`}
                    >
                      {/* Delete Button - Only for real cards */}
                      {!isBlank && (
                        <div data-html2canvas-ignore="true" className="absolute right-1 top-1 z-10 print:hidden">
                          <button 
                            onClick={() => removeCard(card.id)}
                            className="bg-red-500 text-white p-1 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
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

                        {/* Row 4: Work Name - 18% (Largest) - Font Increased & Centered Vertically */}
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
                              {LOCATIONS.map(loc => (
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
                  )})}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default JobCardGenerator;