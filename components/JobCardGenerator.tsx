import React, { useState, useRef } from 'react';
import { parseJobOrderText } from '../services/geminiService';
import { JobCardData } from '../types';
import { 
  Trash2, ArrowLeft, Loader2, 
  Info, FileText, Download, 
  PlusCircle, Wand2
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
  const labelWidth = isPrintView ? "w-[42mm]" : "w-[120px] md:w-[150px]";
  
  const rowHeight = isPrintView ? "h-[14mm]" : "h-14 md:h-16";
  const sigHeight = isPrintView ? "h-[34mm]" : "h-24 md:h-28";
  
  const labelTextSize = isPrintView ? "text-[14px]" : "text-[12px] md:text-[14px]";
  const valueTextSize = isPrintView ? "text-[19px]" : "text-lg md:text-xl";
  
  const fields = [
    { label: "JOB CARD NO:", key: "jobCardNo" as keyof JobCardData },
    { label: "DATE:", key: "date" as keyof JobCardData },
    { label: "ITEM CODE:", key: "itemCode" as keyof JobCardData },
    { label: "WORK NAME:", key: "workName" as keyof JobCardData },
    { label: "SIZE:", key: "size" as keyof JobCardData },
    { label: "GSM:", key: "gsm" as keyof JobCardData },
    { label: "TOTAL GROSS:", key: "totalGross" as keyof JobCardData },
    { label: "DELIVERY LOC:", key: "deliveryLocation" as keyof JobCardData },
    { label: "LOADING DATE:", key: "loadingDate" as keyof JobCardData },
  ];

  const locations = ["EP", "AKP", "KKP", "FP"];

  return (
    <div className={`bg-white border-[2pt] md:border-[3pt] ${borderStyle} flex flex-col box-border overflow-hidden ${cardWidth} ${cardHeight} ${isPrintView ? 'm-0 print:border-black' : 'shadow-xl mb-6 md:mb-12 mx-auto'}`}>
      <div className="flex-1 flex flex-col">
        {fields.map((f, i) => (
          <div key={i} className={`flex border-b-[1.5pt] md:border-b-[2pt] ${borderStyle} ${rowHeight} items-stretch overflow-hidden print:border-black`}>
            <div className={`${labelWidth} border-r-[1.5pt] md:border-r-[2pt] ${borderStyle} flex items-center px-2 md:px-4 shrink-0 bg-slate-50 print:bg-slate-50 print:border-black`}>
              <span className={`${labelTextSize} font-black uppercase text-black leading-none tracking-tight`}>{f.label}</span>
            </div>
            <div className="flex-1 flex items-center px-3 md:px-5 bg-white overflow-hidden">
              {isPrintView ? (
                <span className={`${valueTextSize} font-black uppercase text-black truncate leading-none`}>{card[f.key] || ''}</span>
              ) : (
                f.key === 'deliveryLocation' ? (
                  <div className="flex gap-1 w-full overflow-x-auto scrollbar-hide py-1 items-center">
                    <input 
                      className="flex-1 min-w-[60px] bg-transparent border-none outline-none font-black uppercase text-black text-lg md:text-xl placeholder:text-slate-200"
                      value={card[f.key] || ''}
                      onChange={(e) => updateCard?.(card.id, f.key, e.target.value)}
                      placeholder="---"
                    />
                    <div className="flex gap-1">
                      {locations.map(loc => (
                        <button 
                          key={loc}
                          onClick={() => updateCard?.(card.id, f.key, loc)}
                          className={`px-3 py-1 text-[10px] font-black rounded border ${card[f.key] === loc ? 'bg-black text-white border-black' : 'bg-slate-100 text-slate-500 border-slate-200'}`}
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <input 
                    className="w-full bg-transparent border-none outline-none font-black uppercase text-black text-lg md:text-xl placeholder:text-slate-200"
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
        <div className={`flex-1 border-r-[1.5pt] md:border-r-[2pt] ${borderStyle} flex flex-col print:border-black`}>
          <div className={`h-[10mm] md:h-[12mm] border-b-[1pt] md:border-b-[1.5pt] ${borderStyle} flex items-center px-2 md:px-4 bg-slate-50 print:bg-slate-50 print:border-black`}>
            <span className="text-[10px] md:text-[12px] font-black uppercase text-black">SUPERVISOR</span>
          </div>
          <div className="flex-1 bg-white"></div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className={`h-[10mm] md:h-[12mm] border-b-[1pt] md:border-b-[1.5pt] ${borderStyle} flex items-center px-2 md:px-4 bg-slate-50 print:bg-slate-50 print:border-black`}>
            <span className="text-[10px] md:text-[12px] font-black uppercase text-black">ACCOUNTANT</span>
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

  const generateNextJobCardNo = (currentCategory: 'EP' | 'FP') => {
    const fy = getFinancialYear();
    const storageKey = 'enerpack_serial_v2';
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{"fy": "", "EP": 0, "FP": 0}');
    
    if (stored.fy !== fy) { 
      stored.fy = fy; 
      stored.EP = 0; 
      stored.FP = 0; 
    }

    const num = ++stored[currentCategory];
    localStorage.setItem(storageKey, JSON.stringify(stored));
    return {
      no: `${currentCategory}/${fy}/${num.toString().padStart(3, '0')}`,
      fy
    };
  };

  const handleManualAdd = () => {
    const { no } = generateNextJobCardNo(category);
    const newCard: JobCardData = {
      id: generateId(),
      jobCardNo: no,
      date: '', 
      workName: '',
      itemCode: '',
      size: '',
      gsm: '',
      totalGross: '',
      deliveryLocation: '',
      loadingDate: '',
      supervisorSign: '',
      accountantSign: ''
    };
    setGeneratedCards([...generatedCards, newCard]);
    if (isPreviewMode) setIsPreviewMode(false);
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    try {
      const results = await parseJobOrderText(inputText);
      const newCards = results.map((r: any) => {
        const { no } = generateNextJobCardNo(category);
        return {
          id: generateId(),
          jobCardNo: no,
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
    setIsPdfGenerating(true);
    const element = bufferRef.current;
    element.style.display = 'block';
    const opt = {
      margin: 0,
      filename: `Enerpack_JobCards_${category}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape', compress: true },
      pagebreak: { mode: ['css', 'legacy'] } 
    };
    try {
      await (window as any).html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error(error);
    } finally {
      element.style.display = 'none';
      setIsPdfGenerating(false);
    }
  };

  const chunkedCards: JobCardData[][] = [];
  for (let i = 0; i < generatedCards.length; i += 2) {
    chunkedCards.push(generatedCards.slice(i, i + 2));
  }

  const updateCardField = (id: string, field: keyof JobCardData, value: string) => {
    setGeneratedCards(prev => prev.map(c => c.id === id ? {...c, [field]: value} : c));
  };

  return (
    <div className={`flex flex-col lg:flex-row h-screen overflow-hidden ${isPreviewMode ? 'bg-[#1e293b]' : 'bg-[#f1f5f9]'}`}>
      
      {!isPreviewMode && (
        <aside className="w-full lg:w-[400px] border-b lg:border-b-0 lg:border-r border-slate-200 bg-white flex flex-col relative z-20 shrink-0 shadow-xl overflow-y-auto">
          <div className="p-4 lg:p-6 border-b flex items-center justify-between bg-slate-50 sticky top-0 z-10">
             <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-500 shadow-sm border bg-white">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h1 className="text-[10px] font-black text-slate-900 tracking-[0.1em] uppercase">Creator</h1>
             </div>
             <div className="flex gap-2">
                {['EP', 'FP'].map(cat => (
                  <button key={cat} onClick={() => setCategory(cat as any)} className={`px-3 py-1 text-[10px] font-black rounded-lg ${category === cat ? 'bg-black text-white' : 'bg-slate-200 text-slate-500'}`}>{cat}</button>
                ))}
             </div>
          </div>

          <div className="p-4 lg:p-6 space-y-6">
             <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Order Details</label>
                <textarea 
                  className="w-full h-32 lg:h-64 p-4 rounded-xl border border-slate-200 resize-none outline-none text-xs font-mono bg-slate-50 focus:bg-white focus:border-blue-500 transition-all shadow-inner"
                  placeholder="Paste WhatsApp order..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
             </div>
             
             <div className="space-y-3">
               <button 
                 onClick={handleGenerate}
                 disabled={isProcessing || !inputText.trim()}
                 className="w-full bg-[#0c4a6e] hover:bg-[#075985] text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg disabled:opacity-30 transition-all"
               >
                 {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                 AI Generate
               </button>

               <div className="flex items-center gap-4 py-2">
                  <div className="flex-1 h-px bg-slate-100"></div>
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">or</span>
                  <div className="flex-1 h-px bg-slate-100"></div>
               </div>

               <button 
                 onClick={handleManualAdd}
                 className="w-full bg-white hover:bg-slate-50 text-slate-800 py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 border-2 border-slate-100 shadow-sm transition-all active:scale-95"
               >
                 <PlusCircle className="w-4 h-4 text-emerald-500" />
                 Manual Blank Card
               </button>
             </div>

             <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-blue-600/80 leading-relaxed">
                  Blank cards automatically use sequential serial numbers based on current Financial Year.
                </p>
             </div>
          </div>
        </aside>
      )}

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className={`${isPreviewMode ? 'bg-[#0f172a]' : 'bg-white'} border-b px-4 lg:px-10 py-3 lg:py-5 flex items-center justify-between shadow-sm z-30`}>
           <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPreviewMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                <FileText className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <h2 className={`text-xs font-black uppercase tracking-widest ${isPreviewMode ? 'text-white' : 'text-slate-900'}`}>Preview</h2>
              </div>
           </div>
           
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                disabled={generatedCards.length === 0}
                className="px-3 lg:px-6 py-2 lg:py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest"
              >
                 {isPreviewMode ? 'Editor' : 'Preview'}
              </button>
              <button 
                onClick={handleSavePDF}
                disabled={generatedCards.length === 0 || isPdfGenerating}
                className="px-3 lg:px-6 py-2 lg:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
              >
                 <Download className="w-3.5 h-3.5" /> Save
              </button>
           </div>
        </header>

        <div className={`flex-1 overflow-y-auto p-4 lg:p-12 scrollbar-hide ${isPreviewMode ? 'bg-[#0f172a]' : 'bg-slate-100'}`}>
          {generatedCards.length > 0 ? (
            <div className="mx-auto space-y-6 lg:space-y-12 pb-32 max-w-4xl">
              {isPreviewMode ? (
                 <div className="flex flex-col items-center gap-10">
                   {chunkedCards.map((batch, i) => (
                      <div key={i} className="bg-white p-4 shadow-2xl flex flex-col lg:flex-row justify-center items-center rounded-sm w-full lg:w-[297mm] lg:h-[210mm] border border-slate-700 gap-4 lg:gap-[7mm]">
                        {batch.map(card => (
                          <CardFace key={card.id} card={card} isPrintView={true} />
                        ))}
                      </div>
                   ))}
                 </div>
              ) : (
                generatedCards.map(card => (
                  <div key={card.id} className="relative group">
                    <button 
                      onClick={() => setGeneratedCards(prev => prev.filter(c => c.id !== card.id))} 
                      className="absolute -right-2 -top-2 p-2 bg-white border border-slate-200 rounded-full text-rose-500 shadow-lg z-10 hover:bg-rose-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <CardFace card={card} updateCard={updateCardField} />
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-40">
               <FileText className="w-12 h-12" />
               <p className="text-[9px] font-bold uppercase tracking-[0.2em]">No cards generated</p>
            </div>
          )}
        </div>
      </main>

      <div ref={bufferRef} style={{ display: 'none' }}>
          {chunkedCards.map((batch, i) => (
            <div key={i} style={{ width: '297mm', height: '210mm', padding: '15mm', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5mm', pageBreakAfter: 'always', background: 'white' }}>
              {batch.map(card => (
                <CardFace key={card.id} card={card} isPrintView={true} />
              ))}
              {batch.length === 1 && <div style={{ width: '125mm' }}></div>}
            </div>
          ))}
      </div>
    </div>
  );
};

export default JobCardGenerator;