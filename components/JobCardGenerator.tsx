import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { parseJobOrderText } from '../services/geminiService';
import { JobCardData } from '../types';
import { 
  Printer, Wand2, Trash2, ArrowLeft, Loader2, 
  Info, FileText, Download, ShieldCheck, Eye, EyeOff, Layout
} from 'lucide-react';

const formatToDDMMYYYY = (dateStr: string) => {
  if (!dateStr) return new Date().toLocaleDateString('en-IN').replace(/\//g, '-');
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
};

const CardFace: React.FC<{ 
  card: JobCardData, 
  updateCard?: (id: string, field: keyof JobCardData, value: string) => void, 
  isPrintView?: boolean
}> = ({ card, updateCard, isPrintView = false }) => {
  const borderStyle = "border-black";
  
  const cardWidth = isPrintView ? "w-[125mm]" : "w-full max-w-lg";
  const cardHeight = isPrintView ? "h-[160mm]" : "h-auto";
  const labelWidth = isPrintView ? "w-[42mm]" : "w-[140px]";
  
  const rowHeight = isPrintView ? "h-[14mm]" : "h-14";
  const sigHeight = isPrintView ? "h-[34mm]" : "h-24";
  const labelTextSize = isPrintView ? "text-[10px]" : "text-[11px]";
  const valueTextSize = isPrintView ? "text-[13px]" : "text-[15px]";
  
  const fields = [
    { label: "JOB CARD NO:", key: "jobCardNo" as keyof JobCardData },
    { label: "DATE:", key: "date" as keyof JobCardData },
    { label: "ITEM CODE:", key: "itemCode" as keyof JobCardData },
    { label: "WORK NAME:", key: "workName" as keyof JobCardData },
    { label: "SIZE:", key: "size" as keyof JobCardData },
    { label: "GSM:", key: "gsm" as keyof JobCardData },
    { label: "TOTAL GROSS:", key: "totalGross" as keyof JobCardData },
    { label: "DELIVERY LOCATION:", key: "deliveryLocation" as keyof JobCardData },
    { label: "LOADING DATE:", key: "loadingDate" as keyof JobCardData },
  ];

  const locations = ["EP", "AKP", "KKP", "FP", "Other"];

  return (
    <div className={`bg-white border-[3pt] ${borderStyle} flex flex-col box-border overflow-hidden ${cardWidth} ${cardHeight} ${isPrintView ? 'm-0 print:border-black' : 'shadow-xl mb-12 mx-auto transition-transform hover:scale-[1.01]'}`}>
      <div className="flex-1 flex flex-col">
        {fields.map((f, i) => (
          <div key={i} className={`flex border-b-[2pt] ${borderStyle} ${rowHeight} items-stretch overflow-hidden print:border-black`}>
            <div className={`${labelWidth} border-r-[2pt] ${borderStyle} flex items-center px-4 shrink-0 bg-slate-50 print:bg-slate-50 print:border-black`}>
              <span className={`${labelTextSize} font-black uppercase text-black leading-none tracking-tight`}>{f.label}</span>
            </div>
            <div className="flex-1 flex items-center px-5 bg-white overflow-hidden">
              {isPrintView ? (
                <span className={`${valueTextSize} font-black uppercase text-black truncate leading-none`}>{card[f.key] || ''}</span>
              ) : (
                f.key === 'deliveryLocation' ? (
                  <div className="flex gap-1 w-full overflow-x-auto scrollbar-hide py-1">
                    <input 
                      className="flex-1 min-w-[80px] bg-transparent border-none outline-none font-black uppercase text-black text-base placeholder:text-slate-200"
                      value={card[f.key] || ''}
                      onChange={(e) => updateCard?.(card.id, f.key, e.target.value)}
                      placeholder="---"
                    />
                    <div className="flex gap-1">
                      {locations.map(loc => (
                        <button 
                          key={loc}
                          onClick={() => updateCard?.(card.id, f.key, loc)}
                          className={`px-3 py-1 text-[10px] font-black rounded border-2 ${card[f.key] === loc ? 'bg-black text-white border-black' : 'bg-slate-100 text-slate-500 border-slate-200'} transition-all`}
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <input 
                    className="w-full bg-transparent border-none outline-none font-black uppercase text-black text-base placeholder:text-slate-200"
                    value={card[f.key] || ''}
                    onChange={(e) => updateCard?.(card.id, f.key, e.target.value)}
                    placeholder="---"
                  />
                )
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className={`flex ${sigHeight} items-stretch overflow-hidden`}>
        <div className={`flex-1 border-r-[2pt] ${borderStyle} flex flex-col print:border-black`}>
          <div className={`h-[10mm] border-b-[1.5pt] ${borderStyle} flex items-center px-4 bg-slate-50 print:bg-slate-50 print:border-black`}>
            <span className={`${isPrintView ? 'text-[9px]' : 'text-[9px]'} font-black uppercase text-black`}>SUPERVISOR SIGN</span>
          </div>
          <div className="flex-1 bg-white"></div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className={`h-[10mm] border-b-[1.5pt] ${borderStyle} flex items-center px-4 bg-slate-50 print:bg-slate-50 print:border-black`}>
            <span className={`${isPrintView ? 'text-[9px]' : 'text-[9px]'} font-black uppercase text-black`}>ACCOUNTANT SIGN</span>
          </div>
          <div className="flex-1 bg-white"></div>
        </div>
      </div>
    </div>
  );
};

const JobCardGenerator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<JobCardData[]>([]);
  const [category, setCategory] = useState<'EP' | 'FP'>('EP');
  
  const bufferRef = useRef<HTMLDivElement>(null);

  const getFinancialYear = () => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    let startYear = month < 3 ? year - 1 : year;
    return `${startYear.toString().slice(-2)}-${(startYear + 1).toString().slice(-2)}`;
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    try {
      const results = await parseJobOrderText(inputText);
      const fy = getFinancialYear();
      const storageKey = 'enerpack_serial_v2';
      const stored = JSON.parse(localStorage.getItem(storageKey) || '{"fy": "", "EP": 0, "FP": 0}');
      
      if (stored.fy !== fy) { 
        stored.fy = fy; 
        stored.EP = 0; 
        stored.FP = 0; 
      }

      const newCards = results.map((r: any) => {
        const num = ++stored[category];
        return {
          id: generateId(),
          jobCardNo: `${category}/${fy}/${num.toString().padStart(3, '0')}`,
          date: formatToDDMMYYYY(r.date || ''),
          workName: r.workName || '',
          itemCode: r.itemCode || '',
          size: r.size || '',
          gsm: r.gsm || '',
          totalGross: r.totalGross || '',
          deliveryLocation: r.deliveryLocation || '',
          loadingDate: '',
          supervisorSign: '',
          accountantSign: ''
        };
      });

      localStorage.setItem(storageKey, JSON.stringify(stored));
      setGeneratedCards([...generatedCards, ...newCards]);
      setInputText('');
    } catch (err) {
      alert("Interpretation failed. Check API key.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSavePDF = async () => {
    if (!bufferRef.current || generatedCards.length === 0) return;
    
    const html2pdf = (window as any).html2pdf;
    if (!html2pdf) {
      alert("PDF library not loaded.");
      return;
    }

    setIsPdfGenerating(true);
    
    const element = bufferRef.current;
    
    // Ensure fonts are loaded before starting PDF generation
    try {
      if ((document as any).fonts && (document as any).fonts.ready) {
        await (document as any).fonts.ready;
      }
    } catch (e) {
      console.warn("Font loading check failed, proceeding anyway.");
    }

    // Preparation for High Resolution Snapshot
    // Temporarily bring the element into the viewport to ensure accurate calculation
    const originalStyles = {
      position: element.style.position,
      left: element.style.left,
      visibility: element.style.visibility,
      zIndex: element.style.zIndex,
      display: element.style.display,
      opacity: element.style.opacity
    };

    element.style.position = 'fixed';
    element.style.left = '0';
    element.style.top = '0';
    element.style.visibility = 'visible';
    element.style.opacity = '1';
    element.style.zIndex = '9999999';
    element.style.display = 'block';

    // Wait for layout calculation and font rendering
    await new Promise(resolve => setTimeout(resolve, 1000));

    const opt = {
      margin: 0,
      filename: `Enerpack_JobCards_${category}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        logging: false,
        width: 1122, // Approx 297mm at 96 DPI
        windowWidth: 1122,
        removeContainer: true
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape', compress: true },
      pagebreak: { mode: ['css', 'legacy'], after: '.pdf-page-wrapper' } 
    };

    try {
      // Use the .from().toPdf().get() pattern if simple save() doesn't suffice
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF download failed:", error);
      alert("Download failed. Please check your data or try 'System Print'.");
    } finally {
      // Revert styles to hide buffer
      Object.assign(element.style, originalStyles);
      setIsPdfGenerating(false);
    }
  };

  const handleSystemPrint = () => {
    if (generatedCards.length === 0) return;
    window.print();
  };

  const chunkedCards: JobCardData[][] = [];
  for (let i = 0; i < generatedCards.length; i += 2) {
    chunkedCards.push(generatedCards.slice(i, i + 2));
  }

  const updateCardField = (id: string, field: keyof JobCardData, value: string) => {
    setGeneratedCards(prev => prev.map(c => c.id === id ? {...c, [field]: value} : c));
  };

  return (
    <div className={`flex h-screen overflow-hidden ${isPreviewMode ? 'bg-[#1e293b]' : 'bg-[#f1f5f9]'}`}>
      
      {isPdfGenerating && (
        <div className="fixed inset-0 z-[11000000] bg-slate-900/95 backdrop-blur-2xl flex flex-col items-center justify-center text-white">
          <div className="relative mb-12">
            <Loader2 className="w-20 h-20 animate-spin text-blue-500" />
            <ShieldCheck className="absolute inset-0 m-auto w-8 h-8 text-white" />
          </div>
          <div className="text-center space-y-5">
            <h2 className="text-2xl font-black uppercase tracking-[0.5em] text-white">Exporting to PDF</h2>
            <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest opacity-80 italic">Capturing High-Resolution Snapshot (2x Scale)...</p>
          </div>
        </div>
      )}

      {!isPreviewMode && (
        <aside className="w-[400px] border-r border-slate-200 bg-white flex flex-col relative z-20 shrink-0 shadow-2xl print:hidden animate-in slide-in-from-left duration-300">
          <div className="p-6 border-b flex items-center justify-between bg-slate-50">
             <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2.5 hover:bg-slate-200 rounded-2xl transition-all text-slate-500 shadow-sm border bg-white">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xs font-black text-slate-900 tracking-[0.1em] uppercase">Job Card System</h1>
             </div>
             <Info className="w-5 h-5 text-blue-500" />
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
             <div className="bg-[#0c4a6e] p-6 rounded-[2rem] text-white shadow-xl">
                <h4 className="font-black uppercase mb-3 flex items-center gap-3 text-blue-300">
                  <ShieldCheck className="w-5 h-5" /> Workflow
                </h4>
                <ul className="space-y-3 text-[11px] font-bold uppercase tracking-widest leading-relaxed">
                   <li className="flex gap-2"><span className="text-blue-400">01.</span> Select Series Category</li>
                   <li className="flex gap-2"><span className="text-blue-400">02.</span> Paste Raw WhatsApp Order</li>
                   <li className="flex gap-2"><span className="text-blue-400">03.</span> AI Extraction & Serializing</li>
                   <li className="flex gap-2"><span className="text-blue-400">04.</span> Review, Edit & Export</li>
                </ul>
             </div>

             <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Series Prefix</label>
                  <div className="flex bg-slate-100 p-2 rounded-[1.5rem] border border-slate-200 gap-1 shadow-inner">
                     {['EP', 'FP'].map(cat => (
                       <button 
                        key={cat}
                        onClick={() => setCategory(cat as any)} 
                        className={`flex-1 py-3 text-xs font-black uppercase rounded-2xl transition-all ${category === cat ? 'bg-white text-blue-600 shadow-md ring-2 ring-blue-500/10' : 'text-slate-400 hover:text-slate-600'}`}
                       >
                         {cat} Series
                       </button>
                     ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Raw Order Text</label>
                  <textarea 
                    className="w-full h-80 p-5 rounded-[2rem] border border-slate-200 resize-none outline-none text-[13px] font-mono bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner"
                    placeholder="Paste work order here..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                </div>
             </div>
          </div>

          <div className="p-6 border-t bg-slate-50">
             <button 
               onClick={handleGenerate}
               disabled={isProcessing || !inputText.trim()}
               className="w-full bg-[#0c4a6e] hover:bg-[#075985] text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl disabled:opacity-30 active:scale-[0.98] transition-all"
             >
               {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5 text-blue-400" />}
               AI Interpret
             </button>
          </div>
        </aside>
      )}

      <main className="flex-1 flex flex-col overflow-hidden print:hidden relative">
        <header className={`${isPreviewMode ? 'bg-[#0f172a] border-[#334155]' : 'bg-white border-slate-200'} border-b px-10 py-5 flex items-center justify-between shadow-sm z-30 transition-colors`}>
           <div className="flex items-center gap-5">
              <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center shadow-inner ${isPreviewMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                {isPreviewMode ? <Layout className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
              </div>
              <div className="flex flex-col">
                <h2 className={`text-sm font-black uppercase tracking-widest ${isPreviewMode ? 'text-white' : 'text-slate-900'}`}>
                  {isPreviewMode ? 'Print Preview Mode' : 'Document Editor'}
                </h2>
                <p className={`text-[10px] font-bold uppercase tracking-widest leading-none mt-1 ${isPreviewMode ? 'text-blue-400/60' : 'text-slate-400'}`}>
                  {isPreviewMode ? 'A4 Landscape Layout' : 'Live Job Card Preview'}
                </p>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                disabled={generatedCards.length === 0}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-lg active:scale-95 transition-all disabled:opacity-30 ${isPreviewMode ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
              >
                 {isPreviewMode ? <><EyeOff className="w-4 h-4" /> Exit Preview</> : <><Eye className="w-4 h-4" /> Print Preview</>}
              </button>
              <button 
                onClick={handleSavePDF}
                disabled={generatedCards.length === 0 || isPdfGenerating}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-lg active:scale-95 transition-all disabled:opacity-30"
              >
                 {isPdfGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
                 Save PDF
              </button>
              <button 
                onClick={handleSystemPrint}
                disabled={generatedCards.length === 0}
                className="px-6 py-3 bg-slate-800 hover:bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-lg active:scale-95 transition-all disabled:opacity-30"
              >
                 <Printer className="w-4 h-4" /> System Print
              </button>
           </div>
        </header>

        <div className={`flex-1 overflow-y-auto p-12 scrollbar-hide transition-colors ${isPreviewMode ? 'bg-[#0f172a]' : 'bg-slate-100'}`}>
          {generatedCards.length > 0 ? (
            <div className={`mx-auto space-y-12 pb-32 transition-all ${isPreviewMode ? 'max-w-7xl' : 'max-w-4xl'}`}>
              {isPreviewMode ? (
                 <div className="flex flex-col items-center gap-20">
                   {chunkedCards.map((batch, i) => (
                      <div key={`preview-p-${i}`} className="bg-white p-[20mm] shadow-2xl flex justify-center items-center rounded-sm w-[297mm] h-[210mm] border border-slate-700 gap-[7mm] box-border">
                        {batch.map(card => (
                          <CardFace key={`pc-view-${card.id}`} card={card} isPrintView={true} />
                        ))}
                        {batch.length === 1 && <div className="w-[125mm]"></div>}
                      </div>
                   ))}
                 </div>
              ) : (
                generatedCards.map(card => (
                  <div key={card.id} className="relative group">
                    <div className="absolute -left-20 top-0 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                      <button 
                        onClick={() => setGeneratedCards(prev => prev.filter(c => c.id !== card.id))} 
                        className="p-5 bg-white border-2 border-slate-200 rounded-[2rem] text-rose-500 hover:bg-rose-50 hover:border-rose-200 shadow-2xl transition-all"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                    <CardFace 
                      card={card} 
                      updateCard={updateCardField}
                    />
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-8 opacity-40">
               <div className="w-40 h-40 bg-white rounded-[3rem] shadow-sm flex items-center justify-center border-4 border-dashed border-slate-200">
                 <FileText className="w-16 h-16" />
               </div>
               <div className="text-center">
                 <p className="font-black text-slate-500 text-base uppercase tracking-[0.3em]">Workspace Ready</p>
                 <p className="text-xs font-bold uppercase mt-2 tracking-widest">Interpret an order to begin</p>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* RENDER & PRINT BUFFER - Corrected sizing and styling for System Print */}
      {createPortal(
        <div 
          ref={bufferRef} 
          id="job-card-pdf-render-buffer"
          className="job-card-print-system-container"
          style={{ 
            position: 'absolute', 
            left: '-20000mm', 
            top: '0', 
            width: '297mm', 
            background: '#ffffff',
            zIndex: -1,
            pointerEvents: 'none',
            display: 'block'
          }}
        >
          {chunkedCards.map((batch, i) => (
            <div 
              key={`pdf-page-${i}`} 
              className="pdf-page-wrapper"
              style={{ 
                width: '297mm', 
                height: '210mm', 
                padding: '20mm',
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: '7mm', 
                boxSizing: 'border-box', 
                background: '#ffffff',
                pageBreakAfter: 'always',
                breakAfter: 'page',
                overflow: 'hidden'
              }}
            >
              {batch.map(card => (
                <CardFace 
                  key={`pc-pdf-batch-${card.id}`}
                  card={card} 
                  isPrintView={true} 
                />
              ))}
              {batch.length === 1 && <div style={{ width: '125mm' }}></div>}
            </div>
          ))}

          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              /* Hide everything else */
              body > *:not(.job-card-print-system-container) {
                display: none !important;
                height: 0 !important;
                overflow: hidden !important;
              }

              @page {
                size: landscape;
                margin: 0;
              }

              html, body {
                width: 297mm !important;
                height: 210mm !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
                background: white !important;
              }

              .job-card-print-system-container {
                display: block !important;
                position: relative !important;
                left: 0 !important;
                top: 0 !important;
                width: 297mm !important;
                height: auto !important;
                visibility: visible !important;
                opacity: 1 !important;
                z-index: 9999999 !important;
                pointer-events: auto !important;
                background-color: #ffffff !important;
              }

              .pdf-page-wrapper {
                display: flex !important;
                page-break-after: always !important;
                break-after: page !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
                height: 210mm !important;
                width: 297mm !important;
                margin: 0 !important;
                padding: 20mm !important;
              }
            }
          `}} />
        </div>,
        document.body
      )}
    </div>
  );
};

export default JobCardGenerator;