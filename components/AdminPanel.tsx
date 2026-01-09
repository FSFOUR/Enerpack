
import React, { useState } from 'react';
import { 
  ShieldCheck, ArrowLeft, 
  Users, Database, 
  LayoutDashboard, History, CheckCircle, XCircle, Clock, AlertCircle, 
  FileEdit, Trash2, ArrowRight, UserCheck, ShieldAlert, ChevronDown, ListChecks, Check
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
}

const PAGE_LIST = [
  { mode: ViewMode.DASHBOARD, label: "Dashboard" },
  { mode: ViewMode.INVENTORY, label: "Inventory" },
  { mode: ViewMode.STOCK_IN_LOGS, label: "Stock In Logs" },
  { mode: ViewMode.STOCK_OUT_LOGS, label: "Stock Out Logs" },
  { mode: ViewMode.PENDING_WORKS, label: "Pending Works" },
  { mode: ViewMode.REORDER_ALERTS, label: "Reorder Alerts" },
  { mode: ViewMode.REORDER_HISTORY, label: "Reorder History" },
  { mode: ViewMode.FORECAST, label: "Forecast" },
  { mode: ViewMode.PAPER_CALCULATOR, label: "Calculator" },
  { mode: ViewMode.JOB_CARD_GENERATOR, label: "Job Cards" },
];

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  accounts, 
  inventoryCount, 
  transactionCount, 
  auditLogs,
  changeRequests,
  onBack,
  onUpdateAccountStatus,
  onProcessChangeRequest
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'OVERVIEW' | 'REQUESTS' | 'ACTIVITY' | 'APPROVALS'>('OVERVIEW');
  const [openPageSelect, setOpenPageSelect] = useState<string | null>(null);
  
  const pendingUserRequests = accounts.filter(a => a.status === 'PENDING');
  const processedAccounts = accounts.filter(a => a.status !== 'PENDING');

  const togglePageAccess = (acc: UserAccount, page: ViewMode) => {
    const currentPages = acc.allowedPages || [];
    const newPages = currentPages.includes(page)
      ? currentPages.filter(p => p !== page)
      : [...currentPages, page];
    onUpdateAccountStatus(acc.username, acc.status as 'APPROVED' | 'DENIED', acc.role, newPages);
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

  const renderDiff = (oldData: Partial<InventoryItem>, newData: Partial<InventoryItem>) => {
    const fields: (keyof InventoryItem)[] = ['size', 'gsm', 'minStock', 'remarks'];
    return (
      <div className="grid grid-cols-1 gap-2 mt-3">
        {fields.map(field => {
          const oldVal = oldData[field];
          const newVal = newData[field];
          if (oldVal === newVal) return null;
          return (
            <div key={field} className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="text-[9px] font-black uppercase text-slate-400 w-16">{String(field)}</span>
              <span className="text-xs font-bold text-slate-500 line-through">{String(oldVal || 'None')}</span>
              <ArrowRight className="w-3 h-3 text-slate-300" />
              <span className="text-xs font-black text-blue-600">{String(newVal || 'None')}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-[#0c4a6e] p-5 px-8 flex flex-col md:flex-row justify-between items-center shrink-0 shadow-xl text-white gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button onClick={onBack} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h2 className="font-black text-xl uppercase tracking-tighter flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              Admin Command Center
            </h2>
            <p className="text-blue-200/50 text-[10px] font-bold uppercase tracking-widest leading-none mt-1">Authorized Oversight Environment</p>
          </div>
        </div>
        
        <div className="flex bg-black/20 rounded-2xl p-1 gap-1 w-full md:w-auto overflow-x-auto scrollbar-hide">
           <TabBtn active={activeSubTab === 'OVERVIEW'} onClick={() => setActiveSubTab('OVERVIEW')} icon={LayoutDashboard} label="Overview" />
           <TabBtn 
              active={activeSubTab === 'REQUESTS'} 
              onClick={() => setActiveSubTab('REQUESTS')} 
              icon={Users} 
              label="Staff" 
              badge={pendingUserRequests.length || undefined} 
           />
           <TabBtn 
              active={activeSubTab === 'APPROVALS'} 
              onClick={() => setActiveSubTab('APPROVALS')} 
              icon={AlertCircle} 
              label="Approvals" 
              badge={changeRequests.length || undefined} 
              badgeColor="bg-rose-500"
           />
           <TabBtn active={activeSubTab === 'ACTIVITY'} onClick={() => setActiveSubTab('ACTIVITY')} icon={History} label="Audit Log" />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 md:p-10 max-w-7xl mx-auto w-full">
        
        {/* OVERVIEW TAB */}
        {activeSubTab === 'OVERVIEW' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatBox icon={Users} title="Active Staff" value={accounts.filter(a => a.status === 'APPROVED').length + 1} sub="Personnel with access" color="text-blue-600" bg="bg-blue-50" />
                <StatBox 
                   icon={AlertCircle} 
                   title="Pending Approvals" 
                   value={changeRequests.length} 
                   sub="Editor Modifications" 
                   color={changeRequests.length > 0 ? "text-rose-600" : "text-slate-400"} 
                   bg={changeRequests.length > 0 ? "bg-rose-50" : "bg-slate-50"}
                   onClick={() => setActiveSubTab('APPROVALS')}
                   highlight={changeRequests.length > 0}
                />
                <StatBox icon={Database} title="Asset Inventory" value={inventoryCount} sub="Tracked SKU units" color="text-emerald-600" bg="bg-emerald-50" />
                <StatBox icon={History} title="Logged Events" value={auditLogs.length} sub="System activities" color="text-indigo-600" bg="bg-indigo-50" />
             </div>

             {(pendingUserRequests.length > 0 || changeRequests.length > 0) && (
                <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-amber-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg">
                         <AlertCircle className="w-8 h-8" />
                      </div>
                      <div className="text-center md:text-left">
                         <h3 className="text-xl font-black text-amber-900 tracking-tight">Governance Required</h3>
                         <p className="text-amber-700/70 font-medium">
                            {pendingUserRequests.length > 0 && <span className="block">• {pendingUserRequests.length} signup requests waiting verification.</span>}
                            {changeRequests.length > 0 && <span className="block">• {changeRequests.length} editor updates requiring review.</span>}
                         </p>
                      </div>
                   </div>
                   <div className="flex gap-2">
                     {pendingUserRequests.length > 0 && <button onClick={() => setActiveSubTab('REQUESTS')} className="px-6 py-2 bg-white text-amber-600 text-[10px] font-black uppercase rounded-xl tracking-widest shadow-sm border border-amber-200">Review Users</button>}
                     {changeRequests.length > 0 && <button onClick={() => setActiveSubTab('APPROVALS')} className="px-6 py-2 bg-amber-500 text-white text-[10px] font-black uppercase rounded-xl tracking-widest shadow-md">Review Changes</button>}
                   </div>
                </div>
             )}
          </div>
        )}

        {/* STAFF REQUESTS TAB */}
        {activeSubTab === 'REQUESTS' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
             <SectionHeader icon={Clock} title="Pending User Verification" sub="Approve or Deny access requests" />
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingUserRequests.length > 0 ? (
                  pendingUserRequests.map(req => (
                     <UserApprovalCard key={req.username} req={req} onUpdateStatus={onUpdateAccountStatus} />
                  ))
                ) : <EmptyState icon={ShieldCheck} text="No pending staff requests" />}
             </div>

             <SectionHeader icon={Users} title="Authorized Personnel" sub="Manage active team permissions" />
             <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-visible mb-20">
                <div className="overflow-x-auto overflow-visible">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50/50 border-b border-slate-100">
                         <tr>
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Permissions</th>
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Edit Authorization</th>
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 overflow-visible">
                         {processedAccounts.map(acc => (
                            <tr key={acc.username} className="hover:bg-slate-50/50 transition-colors">
                               <td className="px-8 py-4">
                                  <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold uppercase">{acc.name.charAt(0)}</div>
                                     <div>
                                        <span className="font-black text-slate-800 text-sm block">{acc.name}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">@{acc.username}</span>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-8 py-4 text-center">
                                  <select 
                                     className={`bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest outline-none ${acc.role === 'ADMIN' ? 'text-blue-600 font-black' : 'text-amber-600 font-black'}`}
                                     value={acc.role}
                                     onChange={(e) => onUpdateAccountStatus(acc.username, 'APPROVED', e.target.value as UserRole)}
                                  >
                                     <option value="USER">READ ONLY</option>
                                     <option value="EDITOR">EDITOR</option>
                                     <option value="ADMIN">ADMIN</option>
                                  </select>
                               </td>
                               <td className="px-8 py-4 text-center overflow-visible">
                                  {acc.role === 'ADMIN' ? (
                                    <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-widest border border-indigo-100">Unrestricted</span>
                                  ) : acc.role === 'USER' ? (
                                    <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded uppercase tracking-widest border border-slate-100 italic">Read Mode Only</span>
                                  ) : (
                                    <div className="relative inline-block w-48 text-left">
                                      <button 
                                        onClick={() => setOpenPageSelect(openPageSelect === acc.username ? null : acc.username)}
                                        className="flex items-center justify-between w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black text-slate-600 hover:border-blue-400 hover:shadow-sm transition-all uppercase tracking-tighter"
                                      >
                                        <span className="truncate">{acc.allowedPages?.length || 0} Modules Editable</span>
                                        <ChevronDown className={`w-3 h-3 transition-transform ml-2 ${openPageSelect === acc.username ? 'rotate-180' : ''}`} />
                                      </button>
                                      {openPageSelect === acc.username && (
                                        <>
                                          <div className="fixed inset-0 z-[55]" onClick={() => setOpenPageSelect(null)} />
                                          <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl z-[60] py-3 animate-in fade-in slide-in-from-top-1 duration-200 max-h-72 overflow-y-auto scrollbar-hide">
                                            <div className="px-4 pb-2 mb-2 border-b border-slate-50">
                                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Toggle Write Permission</p>
                                            </div>
                                            {PAGE_LIST.map(page => {
                                              const isChecked = acc.allowedPages?.includes(page.mode);
                                              return (
                                                <div 
                                                  key={page.mode} 
                                                  onClick={() => togglePageAccess(acc, page.mode)}
                                                  className={`flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors group`}
                                                >
                                                  <span className={`text-[10px] font-black uppercase tracking-tight ${isChecked ? 'text-blue-600' : 'text-slate-500'}`}>
                                                    {page.label}
                                                  </span>
                                                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-slate-200 group-hover:border-blue-400'}`}>
                                                    {isChecked && <Check className="w-3 h-3 text-white stroke-[4px]" />}
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
                               <td className="px-8 py-4 text-center">
                                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${acc.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                     {acc.status}
                                  </span>
                               </td>
                               <td className="px-8 py-4 text-right">
                                  <button 
                                    onClick={() => onUpdateAccountStatus(acc.username, acc.status === 'APPROVED' ? 'DENIED' : 'APPROVED')}
                                    className={`p-2 rounded-lg transition-colors ${acc.status === 'APPROVED' ? 'text-rose-500 hover:bg-rose-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                  >
                                     {acc.status === 'APPROVED' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                  </button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {/* APPROVALS TAB */}
        {activeSubTab === 'APPROVALS' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
             <SectionHeader icon={AlertCircle} title="Oversight Queue" sub="Review modifications proposed by Editors" />
             
             <div className="grid grid-cols-1 gap-6">
                {changeRequests.length > 0 ? (
                   changeRequests.map(req => (
                     <div key={req.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row items-start gap-6 group hover:shadow-md transition-all">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${req.type === 'UPDATE' ? 'bg-blue-50 text-blue-500' : req.type === 'ADD' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                           {req.type === 'UPDATE' ? <FileEdit className="w-7 h-7" /> : req.type === 'ADD' ? <Database className="w-7 h-7" /> : <Trash2 className="w-7 h-7" />}
                        </div>
                        
                        <div className="flex-1 w-full">
                           <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${req.type === 'UPDATE' ? 'bg-blue-100 text-blue-700' : req.type === 'ADD' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {req.type} PROPOSAL
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">{new Date(req.timestamp).toLocaleString()}</span>
                           </div>
                           <h4 className="font-black text-slate-800 text-lg tracking-tight">
                              {req.type === 'UPDATE' ? `Modify Metadata: ${req.oldData?.size} (${req.oldData?.gsm})` : req.type === 'ADD' ? `Add New Item: ${req.itemData.size} (${req.itemData.gsm})` : `Delete Item: ${req.itemData.size}`}
                           </h4>
                           <p className="text-slate-500 text-xs font-medium">Requested by <span className="font-black text-slate-700">@{req.requestedBy}</span> ({req.requestedByName})</p>
                           
                           {req.type === 'UPDATE' && req.oldData && renderDiff(req.oldData, req.itemData)}
                           {req.type === 'ADD' && (
                             <div className="mt-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-[11px] font-bold text-emerald-700">
                                Size: {req.itemData.size}, GSM: {req.itemData.gsm}, Min: {req.itemData.minStock}
                             </div>
                           )}
                        </div>

                        <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto shrink-0 self-center">
                           <button onClick={() => onProcessChangeRequest(req.id, true)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95">
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                           </button>
                           <button onClick={() => onProcessChangeRequest(req.id, false)} className="flex-1 bg-white hover:bg-rose-50 text-rose-500 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest border border-rose-100 flex items-center justify-center gap-2 transition-all active:scale-95">
                              <XCircle className="w-3.5 h-3.5" /> Deny
                           </button>
                        </div>
                     </div>
                   ))
                ) : <EmptyState icon={AlertCircle} text="All proposals processed" />}
             </div>
          </div>
        )}

        {/* AUDIT LOG TAB */}
        {activeSubTab === 'ACTIVITY' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
             <SectionHeader icon={History} title="System Audit Feed" sub="Full chronological record of verified activities" />
             
             <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-50">
                   {auditLogs.length > 0 ? (
                      auditLogs.map(log => (
                        <div key={log.id} className="p-5 px-8 flex items-center gap-6 hover:bg-slate-50/50 transition-colors">
                           <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                              {getActionIcon(log.action)}
                           </div>
                           <div className="flex-1">
                              <p className="text-sm font-black text-slate-800 tracking-tight">{log.details}</p>
                              <div className="flex items-center gap-3 mt-1">
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-lg">@{log.userId}</span>
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(log.timestamp).toLocaleString()}</span>
                              </div>
                           </div>
                           <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-3 py-1 rounded-lg uppercase tracking-tighter hidden md:block">
                             {log.action.replace('_', ' ')}
                           </span>
                        </div>
                      ))
                   ) : <div className="p-20 text-center text-slate-300 font-bold uppercase tracking-[0.2em] text-xs">No records available</div>}
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

const TabBtn = ({ active, onClick, icon: Icon, label, badge, badgeColor = "bg-amber-500" }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap relative ${active ? 'bg-white text-[#0c4a6e] shadow-lg scale-105' : 'text-blue-200/60 hover:text-white'}`}
  >
    <Icon className="w-4 h-4" />
    {label}
    {badge !== undefined && (
      <span className={`absolute -top-1 -right-1 ${badgeColor} text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] border-2 border-[#0c4a6e]`}>
        {badge}
      </span>
    )}
  </button>
);

const SectionHeader = ({ icon: Icon, title, sub }: any) => (
  <div className="flex items-center gap-4 px-2">
    <div className="w-12 h-12 bg-white text-slate-700 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
       <Icon className="w-6 h-6" />
    </div>
    <div>
       <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{title}</h3>
       <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-none mt-1">{sub}</p>
    </div>
  </div>
);

const StatBox = ({ icon: Icon, title, value, sub, color, bg, onClick, highlight }: any) => (
  <button 
    onClick={onClick}
    disabled={!onClick}
    className={`bg-white p-6 md:p-8 rounded-[2.5rem] border shadow-sm flex items-center gap-6 text-left transition-all ${onClick ? 'cursor-pointer hover:border-blue-200 hover:shadow-md' : 'border-slate-100 cursor-default'} ${highlight ? 'ring-2 ring-rose-500/20' : ''}`}
  >
    <div className={`w-14 h-14 shrink-0 ${bg} ${color} rounded-[1.5rem] flex items-center justify-center shadow-inner`}>
       <Icon className="w-7 h-7" />
    </div>
    <div>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{title}</p>
       <h4 className="text-3xl font-black text-slate-800 tracking-tighter leading-none tabular-nums">{value}</h4>
       <p className="text-[10px] font-bold text-slate-400 mt-1.5 leading-tight">{sub}</p>
    </div>
  </button>
);

const UserApprovalCard = ({ req, onUpdateStatus }: any) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('USER');
  const [pages, setPages] = useState<ViewMode[]>([ViewMode.DASHBOARD, ViewMode.INVENTORY]);

  const togglePage = (p: ViewMode) => {
    setPages(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  return (
    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
       <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-black">
                {req.name.charAt(0)}
             </div>
             <div>
                <h4 className="font-black text-slate-800 text-sm leading-none">{req.name}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">@{req.username}</p>
             </div>
          </div>
       </div>
       
       <div className="mb-4 space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Assign Primary Role</label>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
               <button 
                 onClick={() => setSelectedRole('USER')}
                 className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${selectedRole === 'USER' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
               >
                  Read Only
               </button>
               <button 
                 onClick={() => setSelectedRole('EDITOR')}
                 className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${selectedRole === 'EDITOR' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400'}`}
               >
                  Editor
               </button>
            </div>
          </div>

          {selectedRole === 'EDITOR' && (
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-2">
                <ListChecks className="w-3 h-3" /> Edit Authorization
              </label>
              <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto scrollbar-hide p-1 bg-slate-50 rounded-xl border border-slate-200">
                 {PAGE_LIST.map(p => (
                   <button 
                    key={p.mode}
                    onClick={() => togglePage(p.mode)}
                    className={`text-left px-2 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${pages.includes(p.mode) ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-400 border border-slate-100'}`}
                   >
                     {p.label}
                   </button>
                 ))}
              </div>
            </div>
          )}
       </div>

       <div className="flex gap-2">
          <button 
            onClick={() => onUpdateStatus(req.username, 'APPROVED', selectedRole, pages)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
             <CheckCircle className="w-3.5 h-3.5" /> Approve
          </button>
          <button 
            onClick={() => onUpdateStatus(req.username, 'DENIED')}
            className="flex-1 bg-white hover:bg-rose-50 text-rose-500 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-rose-100 active:scale-95"
          >
             <XCircle className="w-3.5 h-3.5" /> Deny
          </button>
       </div>
    </div>
  );
};

const EmptyState = ({ icon: Icon, text }: any) => (
  <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-slate-100">
    <div className="flex flex-col items-center gap-4 text-slate-300">
        <Icon className="w-12 h-12 opacity-20" />
        <p className="font-black uppercase tracking-[0.2em] text-[10px]">{text}</p>
    </div>
  </div>
);

export default AdminPanel;
