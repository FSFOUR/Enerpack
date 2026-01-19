import React, { useState } from 'react';
import { 
  ShieldCheck, ArrowLeft, 
  Users, Database, 
  LayoutDashboard, History, CheckCircle, XCircle, Clock, AlertCircle, 
  FileEdit, Trash2, ArrowRight, UserCheck, ShieldAlert, ChevronDown, ListChecks, Check, Zap, Download, Upload, Share2,
  AlertTriangle
} from 'lucide-react';
import { UserAccount, UserRole, AuditEntry, ChangeRequest, InventoryItem, ViewMode } from '../types';

interface AdminPanelProps {
  accounts: UserAccount[];
  inventoryCount: number;
  transactionCount: number;
  auditLogs: AuditEntry[];
  changeRequests: ChangeRequest[];
  onBack: () => void;
  onUpdateAccountStatus: (username: string, status: 'APPROVED' | 'DENIED', role?: UserRole, allowedPages?: ViewMode[]) => void;
  onProcessChangeRequest: (requestId: string, approved: boolean) => void;
  onDeleteAuditLog: (id: string) => void;
  onClearAuditLogs: () => void;
}

const PAGE_LIST = [
  { mode: ViewMode.DASHBOARD, label: "Dashboard" },
  { mode: ViewMode.INVENTORY, label: "Inventory" },
  { mode: ViewMode.TRACKER, label: "Quick Tracker" },
  { mode: ViewMode.STOCK_IN_LOGS, label: "Stock In Logs" },
  { mode: ViewMode.STOCK_OUT_LOGS, label: "Stock Out Logs" },
  { mode: ViewMode.PENDING_WORKS, label: "Pending Works" },
  { mode: ViewMode.REORDER_ALERTS, label: "Reorder Alerts" },
  { mode: ViewMode.REORDER_HISTORY, label: "Reorder History" },
  { mode: ViewMode.FORECAST, label: "Forecast" },
  { mode: ViewMode.PAPER_CALCULATOR, label: "Calculator" },
  { mode: ViewMode.JOB_CARD_GENERATOR, label: "Job Cards" },
];

const TabBtn = ({ active, onClick, icon: Icon, label, badge, badgeColor = "bg-amber-500" }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap relative ${active ? 'bg-white text-[#0c4a6e] shadow-lg scale-105' : 'text-blue-200/60 hover:text-white hover:bg-white/5'}`}
  >
    <Icon className="w-4 h-4" />
    {label}
    {badge !== undefined && (
      <span className={`absolute -top-1.5 -right-1.5 ${badgeColor} text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] border-2 border-[#0c4a6e] animate-in zoom-in duration-300`}>
        {badge}
      </span>
    )}
  </button>
);

const SectionHeader = ({ icon: Icon, title, sub, action }: any) => (
  <div className="flex items-center justify-between gap-5 px-2">
    <div className="flex items-center gap-5">
      <div className="w-14 h-14 bg-white text-slate-700 rounded-[1.5rem] flex items-center justify-center shadow-md border border-slate-100">
         <Icon className="w-7 h-7" />
      </div>
      <div>
         <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">{title}</h3>
         <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-none mt-2">{sub}</p>
      </div>
    </div>
    {action}
  </div>
);

const StatBox = ({ icon: Icon, title, value, sub, color, bg, onClick, highlight }: any) => (
  <button 
    onClick={onClick}
    disabled={!onClick}
    className={`bg-white p-8 rounded-[2.5rem] border shadow-sm flex items-center gap-6 text-left transition-all ${onClick ? 'cursor-pointer hover:border-blue-200 hover:shadow-xl active:scale-[0.98]' : 'border-slate-100 cursor-default'} ${highlight ? 'ring-4 ring-rose-500/10 border-rose-200' : ''}`}
  >
    <div className={`w-16 h-16 shrink-0 ${bg} ${color} rounded-2xl flex items-center justify-center shadow-inner`}>
       <Icon className="w-8 h-8" />
    </div>
    <div>
       <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5">{title}</p>
       <h4 className="text-4xl font-black text-slate-800 tracking-tighter leading-none tabular-nums">{value}</h4>
       <p className="text-[10px] font-bold text-slate-400 mt-2 leading-tight uppercase tracking-widest">{sub}</p>
    </div>
  </button>
);

const UserApprovalCard = ({ req, onUpdateStatus }: any) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('USER');
  const [pages, setPages] = useState<ViewMode[]>([ViewMode.DASHBOARD]);

  const togglePage = (p: ViewMode) => {
    setPages(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all animate-in zoom-in-95 duration-300">
       <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center font-black text-xl border border-indigo-100">
                {req.name.charAt(0)}
             </div>
             <div>
                <h4 className="font-black text-slate-800 text-base leading-none mb-1">{req.name}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">ID: {req.username}</p>
             </div>
          </div>
       </div>
       
       <div className="mb-8 space-y-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">Access Level</label>
            <div className="flex gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
               <button 
                 onClick={() => setSelectedRole('USER')}
                 className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${selectedRole === 'USER' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-400'}`}
               >
                  Read
               </button>
               <button 
                 onClick={() => setSelectedRole('EDITOR')}
                 className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${selectedRole === 'EDITOR' ? 'bg-white text-amber-600 shadow-md ring-1 ring-slate-200' : 'text-slate-400'}`}
               >
                  Write
               </button>
            </div>
          </div>

          {selectedRole === 'EDITOR' && (
            <div className="animate-in slide-in-from-top-4 duration-300">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1 flex items-center gap-2">
                <ListChecks className="w-3 h-3" /> Activated Modules
              </label>
              <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto scrollbar-hide p-1.5 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                 {PAGE_LIST.map(p => (
                   <button 
                    key={p.mode}
                    onClick={() => togglePage(p.mode)}
                    className={`text-left px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-between ${pages.includes(p.mode) ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100 hover:border-blue-200'}`}
                   >
                     {p.label}
                     {pages.includes(p.mode) && <Check className="w-3 h-3 stroke-[4px]" />}
                   </button>
                 ))}
              </div>
            </div>
          )}
       </div>

       <div className="flex gap-3">
          <button 
            onClick={() => onUpdateStatus(req.username, 'APPROVED', selectedRole, pages)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/30 active:scale-95"
          >
             <UserCheck className="w-4 h-4" /> Verify Account
          </button>
          <button 
            onClick={() => onUpdateStatus(req.username, 'DENIED')}
            className="w-14 bg-slate-50 hover:bg-rose-50 text-rose-500 rounded-2xl font-black transition-all border border-slate-100 flex items-center justify-center active:scale-95"
          >
             <Trash2 className="w-4 h-4" />
          </button>
       </div>
    </div>
  );
};

const EmptyState = ({ icon: Icon, text }: any) => (
  <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-inner">
    <div className="flex flex-col items-center gap-5 text-slate-200">
        <Icon className="w-16 h-16" />
        <p className="font-black uppercase tracking-[0.3em] text-xs text-slate-300">{text}</p>
    </div>
  </div>
);

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  accounts, 
  inventoryCount, 
  transactionCount, 
  auditLogs,
  changeRequests,
  onBack,
  onUpdateAccountStatus,
  onProcessChangeRequest,
  onDeleteAuditLog,
  onClearAuditLogs
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'OVERVIEW' | 'STAFFS' | 'APPROVAL' | 'AUDIT_LOG' | 'SYNC'>('OVERVIEW');
  const [openPageSelect, setOpenPageSelect] = useState<string | null>(null);
  
  const pendingUserRequests = [...accounts]
    .filter(a => a.status === 'PENDING')
    .sort((a, b) => b.createdAt - a.createdAt);

  const processedAccounts = [...accounts]
    .filter(a => a.status !== 'PENDING')
    .sort((a, b) => a.name.localeCompare(b.name));

  const togglePageAccess = (acc: UserAccount, page: ViewMode) => {
    const currentPages = acc.allowedPages || [];
    const newPages = currentPages.includes(page)
      ? currentPages.filter(p => p !== page)
      : [...currentPages, page];
    onUpdateAccountStatus(acc.username, acc.status as 'APPROVED' | 'DENIED', acc.role, newPages);
  };

  const handleApproveAll = () => {
    if (confirm(`Instantly grant READ-ONLY access to all ${pendingUserRequests.length} pending users?`)) {
      pendingUserRequests.forEach(req => {
        onUpdateAccountStatus(req.username, 'APPROVED', 'USER', [ViewMode.DASHBOARD]);
      });
    }
  };

  const exportSystemData = () => {
    const data = {
      accounts: JSON.parse(localStorage.getItem('enerpack_accounts_v1') || '[]'),
      inventory: JSON.parse(localStorage.getItem('enerpack_inventory_v11') || '[]'),
      transactions: JSON.parse(localStorage.getItem('enerpack_transactions_v1') || '[]'),
      timestamp: Date.now()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Enerpack_Migration_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSystemData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (confirm("Warning: This will overwrite ALL data on this device with the imported system state. Proceed?")) {
          localStorage.setItem('enerpack_accounts_v1', JSON.stringify(data.accounts || []));
          localStorage.setItem('enerpack_inventory_v11', JSON.stringify(data.inventory || []));
          localStorage.setItem('enerpack_transactions_v1', JSON.stringify(data.transactions || []));
          alert("Import Successful. The application will reload.");
          window.location.reload();
        }
      } catch (err) {
        alert("Invalid migration file format.");
      }
    };
    reader.readAsText(file);
  };

  const getActionIcon = (action: AuditEntry['action']) => {
    switch(action) {
      case 'ADD_ITEM': return <Database className="w-4 h-4 text-emerald-500" />;
      case 'UPDATE_ITEM': return <FileEdit className="w-4 h-4 text-blue-500" />;
      case 'DELETE_ITEM': return <Trash2 className="w-4 h-4 text-rose-500" />;
      case 'APPROVE_CHANGE': return <UserCheck className="w-4 h-4 text-emerald-500" />;
      case 'DENY_CHANGE': return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'USER_VERIFY': return <ShieldCheck className="w-4 h-4 text-indigo-500" />;
      default: return <History className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-[#0c4a6e] p-5 px-8 flex flex-col md:flex-row justify-between items-center shrink-0 shadow-xl text-white gap-4 z-20">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button onClick={onBack} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h2 className="font-black text-xl uppercase tracking-tighter flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              Terminal Admin
            </h2>
            <p className="text-blue-200/50 text-[10px] font-bold uppercase tracking-widest leading-none mt-1">Access & Identity Center</p>
          </div>
        </div>
        
        <div className="flex bg-black/20 rounded-2xl p-1 gap-1 w-full md:w-auto overflow-x-auto scrollbar-hide">
           <TabBtn active={activeSubTab === 'OVERVIEW'} onClick={() => setActiveSubTab('OVERVIEW')} icon={LayoutDashboard} label="Overview" />
           <TabBtn 
              active={activeSubTab === 'STAFFS'} 
              onClick={() => setActiveSubTab('STAFFS')} 
              icon={Users} 
              label="Staffs" 
              badge={pendingUserRequests.length || undefined} 
           />
           <TabBtn 
              active={activeSubTab === 'APPROVAL'} 
              onClick={() => setActiveSubTab('APPROVAL')} 
              icon={AlertCircle} 
              label="Approval" 
              badge={changeRequests.length || undefined} 
              badgeColor="bg-rose-500"
           />
           <TabBtn 
              active={activeSubTab === 'AUDIT_LOG'} 
              onClick={() => setActiveSubTab('AUDIT_LOG')} 
              icon={History} 
              label="Audit Log" 
           />
           <TabBtn active={activeSubTab === 'SYNC'} onClick={() => setActiveSubTab('SYNC')} icon={Share2} label="Sync" />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-10 max-w-7xl mx-auto w-full">
        
        {activeSubTab === 'OVERVIEW' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatBox icon={Users} title="System Staff" value={accounts.filter(a => a.status === 'APPROVED').length + 1} sub="Authenticated" color="text-blue-600" bg="bg-blue-50" />
                <StatBox 
                   icon={AlertCircle} 
                   title="Pending Identity" 
                   value={pendingUserRequests.length} 
                   sub="Awaiting Verification" 
                   color={pendingUserRequests.length > 0 ? "text-rose-600" : "text-slate-400"} 
                   bg={pendingUserRequests.length > 0 ? "bg-rose-50" : "bg-slate-50"}
                   onClick={() => setActiveSubTab('STAFFS')}
                   highlight={pendingUserRequests.length > 0}
                />
                <StatBox icon={Database} title="Asset SKUs" value={inventoryCount} sub="Live Records" color="text-emerald-600" bg="bg-emerald-50" />
                <StatBox icon={Share2} title="Linked Devices" value="1" sub="Instance Count" color="text-indigo-600" bg="bg-indigo-50" onClick={() => setActiveSubTab('SYNC')} />
             </div>

             {pendingUserRequests.length > 0 && (
                <div className="bg-indigo-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                   <div className="absolute right-0 top-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-500"><UserCheck className="w-48 h-48" /></div>
                   <div className="relative z-10">
                      <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Unverified Personnel Detected</h3>
                      <p className="text-indigo-200 text-sm max-w-md mb-6">Security check required for {pendingUserRequests.length} new access requests. Granting permission will enable device login.</p>
                      <div className="flex flex-wrap gap-4">
                         <button onClick={() => setActiveSubTab('STAFFS')} className="px-8 py-3 bg-white text-indigo-900 rounded-xl font-black uppercase text-[10px] tracking-[0.1em] shadow-lg active:scale-95 transition-all">Review & Verify</button>
                         <button onClick={handleApproveAll} className="px-8 py-3 bg-indigo-500/30 border border-white/20 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.1em] hover:bg-indigo-500/50 transition-all flex items-center gap-2"><Zap className="w-3.5 h-3.5" /> Instant Approve All</button>
                      </div>
                   </div>
                </div>
             )}
          </div>
        )}

        {activeSubTab === 'SYNC' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
            <SectionHeader icon={Share2} title="System Migration" sub="Access data on any device with the same credentials" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><Download className="w-6 h-6" /></div>
                    <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Export Data Pool</h4>
                    <p className="text-slate-500 text-xs leading-relaxed mb-8">Generate a migration file to transfer all users, inventory, and history to a new phone, laptop, or tablet. Use this to enable cross-device access.</p>
                  </div>
                  <button onClick={exportSystemData} className="w-full py-4 bg-[#0c4a6e] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3 active:scale-95 transition-all">
                     <Download className="w-4 h-4" /> Download Migration File
                  </button>
               </div>

               <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><Upload className="w-6 h-6" /></div>
                    <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Import Data Pool</h4>
                    <p className="text-slate-500 text-xs leading-relaxed mb-8">Load a migration file from another device. This will sync all username and password data, allowing authorized users to log in instantly.</p>
                  </div>
                  <label className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-3 cursor-pointer active:scale-95 transition-all">
                     <Upload className="w-4 h-4" /> Select Migration File
                     <input type="file" className="hidden" accept=".json" onChange={importSystemData} />
                  </label>
               </div>
            </div>

            <div className="bg-amber-50 border-2 border-amber-100 rounded-[2rem] p-6 flex gap-6 items-center">
               <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-amber-500 shrink-0 shadow-sm"><AlertTriangle className="w-7 h-7" /></div>
               <div className="flex-1">
                  <h5 className="font-black text-amber-800 uppercase text-xs tracking-widest mb-1">Local Identity Protocol</h5>
                  <p className="text-amber-700/70 text-xs font-medium">To maintain security without a central cloud server, each new device must be synchronized via the Migration File. Once imported, all staff can log in with their existing credentials.</p>
               </div>
            </div>
          </div>
        )}

        {activeSubTab === 'STAFFS' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
             <div className="flex justify-between items-center px-2 flex-wrap gap-4">
                <SectionHeader icon={Clock} title="Awaiting Verification" sub="Review and grant identity permissions" />
                {pendingUserRequests.length > 1 && (
                  <button onClick={handleApproveAll} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 flex items-center gap-2 hover:bg-emerald-700 transition-all active:scale-95"><Zap className="w-3.5 h-3.5" /> Quick Grant All</button>
                )}
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingUserRequests.length > 0 ? (
                  pendingUserRequests.map(req => (
                     <UserApprovalCard key={req.username} req={req} onUpdateStatus={onUpdateAccountStatus} />
                  ))
                ) : <EmptyState icon={ShieldCheck} text="Security log: All personnel verified" />}
             </div>

             <SectionHeader icon={Users} title="User Authorization Grid" sub="Manage security levels and access tiers" />
             {/* Changed to overflow-visible to fix dropdown menu visibility issues */}
             <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-visible mb-20 relative">
                <div className="overflow-x-auto overflow-visible">
                   <table className="w-full text-left table-fixed min-w-[900px]">
                      <thead className="bg-slate-50/50 border-b border-slate-100">
                         <tr>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[30%]">Personnel</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-[15%]">Tier</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-[25%]">Modules</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-[15%]">Status</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-[15%]">Actions</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 overflow-visible">
                         {processedAccounts.map(acc => (
                            <tr key={acc.username} className="hover:bg-slate-50/30 transition-colors overflow-visible">
                               <td className="px-8 py-5">
                                  <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black uppercase text-sm border border-slate-200">{acc.name.charAt(0)}</div>
                                     <div className="overflow-hidden">
                                        <span className="font-black text-slate-800 text-sm block leading-none mb-1 truncate">{acc.name}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate block">ID: {acc.username}</span>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-8 py-5 text-center">
                                  <select 
                                     className={`bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-400 transition-all ${acc.role === 'ADMIN' ? 'text-indigo-600' : acc.role === 'EDITOR' ? 'text-amber-600' : 'text-slate-600'}`}
                                     value={acc.role}
                                     onChange={(e) => onUpdateAccountStatus(acc.username, 'APPROVED', e.target.value as UserRole)}
                                  >
                                     <option value="USER">READ</option>
                                     <option value="EDITOR">EDIT</option>
                                     <option value="ADMIN">ADMIN</option>
                                  </select>
                               </td>
                               <td className="px-8 py-5 text-center overflow-visible">
                                  {acc.role === 'ADMIN' ? (
                                    <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-100">Full Access</span>
                                  ) : acc.role === 'USER' ? (
                                    <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-widest border border-slate-100 italic">Restricted</span>
                                  ) : (
                                    <div className="relative inline-block w-full text-left">
                                      <button 
                                        onClick={() => setOpenPageSelect(openPageSelect === acc.username ? null : acc.username)}
                                        className="flex items-center justify-between w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-2 text-[10px] font-black text-slate-600 hover:border-blue-400 hover:shadow-md transition-all uppercase tracking-tighter"
                                      >
                                        <span className="truncate">{acc.allowedPages?.length || 0} Enabled</span>
                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ml-2 shrink-0 ${openPageSelect === acc.username ? 'rotate-180' : ''}`} />
                                      </button>
                                      {openPageSelect === acc.username && (
                                        <>
                                          <div className="fixed inset-0 z-[55]" onClick={() => setOpenPageSelect(null)} />
                                          <div className="absolute left-0 right-0 top-full mt-3 bg-white border border-slate-200 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.25)] z-[60] py-4 animate-in fade-in slide-in-from-top-2 duration-300 max-h-80 overflow-y-auto scrollbar-hide">
                                            <div className="px-6 pb-3 mb-3 border-b border-slate-50">
                                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Permissions</p>
                                            </div>
                                            {PAGE_LIST.map(page => {
                                              const isChecked = acc.allowedPages?.includes(page.mode);
                                              return (
                                                <div 
                                                  key={page.mode} 
                                                  onClick={() => togglePageAccess(acc, page.mode)}
                                                  className={`flex items-center justify-between px-6 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors group`}
                                                >
                                                  <span className={`text-[10px] font-black uppercase tracking-tight ${isChecked ? 'text-blue-600' : 'text-slate-400'}`}>
                                                    {page.label}
                                                  </span>
                                                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${isChecked ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-500/20' : 'border-slate-100 group-hover:border-blue-400'}`}>
                                                    {isChecked && <Check className="w-3.5 h-3.5 text-white stroke-[4px]" />}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  )}
                               </td>
                               <td className="px-8 py-5 text-center">
                                  <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${acc.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                                     {acc.status}
                                  </span>
                               </td>
                               <td className="px-8 py-5 text-right">
                                  <div className="flex justify-end gap-2">
                                     <button 
                                      onClick={() => onUpdateAccountStatus(acc.username, acc.status === 'APPROVED' ? 'DENIED' : 'APPROVED')}
                                      className={`p-2.5 rounded-xl transition-all shadow-sm ${acc.status === 'APPROVED' ? 'bg-rose-50 text-rose-500 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100'}`}
                                      title={acc.status === 'APPROVED' ? 'Revoke Access' : 'Restore Access'}
                                     >
                                        {acc.status === 'APPROVED' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                     </button>
                                  </div>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {activeSubTab === 'APPROVAL' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
             <SectionHeader icon={AlertCircle} title="Modifications Queue" sub="Review item data change proposals" />
             <div className="grid grid-cols-1 gap-6">
                {changeRequests.length > 0 ? (
                   changeRequests.map(req => (
                     <div key={req.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col md:flex-row items-center gap-8 group hover:shadow-md transition-all">
                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-inner ${req.type === 'UPDATE' ? 'bg-blue-50 text-blue-500' : req.type === 'ADD' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                           {req.type === 'UPDATE' ? <FileEdit className="w-8 h-8" /> : req.type === 'ADD' ? <Database className="w-8 h-8" /> : <Trash2 className="w-8 h-8" />}
                        </div>
                        <div className="flex-1 w-full text-center md:text-left">
                           <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] ${req.type === 'UPDATE' ? 'bg-blue-100 text-blue-700' : req.type === 'ADD' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {req.type} REQUEST
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">ID: {req.id.slice(0, 8)}</span>
                           </div>
                           <h4 className="font-black text-slate-800 text-xl tracking-tight mb-1">{req.itemData.size} ({req.itemData.gsm})</h4>
                           <p className="text-slate-400 text-xs font-medium">Requested by <span className="text-slate-600 font-bold">@{req.requestedBy}</span> — {new Date(req.timestamp).toLocaleTimeString()}</p>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                           <button onClick={() => onProcessChangeRequest(req.id, true)} className="flex-1 md:w-40 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">Approve</button>
                           <button onClick={() => onProcessChangeRequest(req.id, false)} className="flex-1 md:w-40 bg-slate-100 hover:bg-slate-200 text-slate-500 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all">Decline</button>
                        </div>
                     </div>
                   ))
                ) : <EmptyState icon={LayoutDashboard} text="Queue clear: All changes processed" />}
             </div>
          </div>
        )}

        {activeSubTab === 'AUDIT_LOG' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
             <SectionHeader 
                icon={History} 
                title="Operational Audit" 
                sub="Timeline of verified system modifications" 
                action={
                  auditLogs.length > 0 && (
                    <button 
                      onClick={onClearAuditLogs}
                      className="bg-rose-50 text-rose-600 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-rose-500 hover:text-white transition-all flex items-center gap-2 border border-rose-100"
                    >
                      <Trash2 className="w-4 h-4" /> Clear All Logs
                    </button>
                  )
                }
             />
             <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-50">
                   {auditLogs.length > 0 ? (
                      auditLogs.map(log => (
                        <div key={log.id} className="p-5 px-8 flex items-center gap-6 hover:bg-slate-50/50 transition-colors group">
                           <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm group-hover:bg-white transition-all">
                              {getActionIcon(log.action)}
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-slate-800 tracking-tight truncate">{log.details}</p>
                              <div className="flex items-center gap-3 mt-1">
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-lg">@{log.userId}</span>
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(log.timestamp).toLocaleString()}</span>
                              </div>
                           </div>
                           <button 
                             onClick={() => onDeleteAuditLog(log.id)}
                             className="opacity-0 group-hover:opacity-100 p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                             title="Delete Entry"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      ))
                   ) : <EmptyState icon={History} text="Timeline Clear: No historical records found" />}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;