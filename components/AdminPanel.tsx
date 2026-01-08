import React, { useState } from 'react';
import { 
  ShieldCheck, ArrowLeft, 
  Users, Database, 
  LayoutDashboard, History, CheckCircle, XCircle, Clock, AlertCircle
} from 'lucide-react';
import { UserAccount } from '../types';

interface AdminPanelProps {
  accounts: UserAccount[];
  inventoryCount: number;
  transactionCount: number;
  onBack: () => void;
  onUpdateAccountStatus: (username: string, status: 'APPROVED' | 'DENIED') => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  accounts, 
  inventoryCount, 
  transactionCount, 
  onBack,
  onUpdateAccountStatus
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'OVERVIEW' | 'REQUESTS'>('OVERVIEW');
  
  const pendingRequests = accounts.filter(a => a.status === 'PENDING');
  const processedAccounts = accounts.filter(a => a.status !== 'PENDING');

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* Dynamic Header */}
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
            <p className="text-blue-200/50 text-[10px] font-bold uppercase tracking-widest leading-none mt-1">Authorized Access Only</p>
          </div>
        </div>
        
        <div className="flex bg-black/20 rounded-2xl p-1 gap-1 w-full md:w-auto">
           <button 
             onClick={() => setActiveSubTab('OVERVIEW')}
             className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${activeSubTab === 'OVERVIEW' ? 'bg-white text-[#0c4a6e] shadow-lg scale-105' : 'text-blue-200/60 hover:text-white'}`}
           >
              <LayoutDashboard className="w-4 h-4" />
              Overview
           </button>
           <button 
             onClick={() => setActiveSubTab('REQUESTS')}
             className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all relative ${activeSubTab === 'REQUESTS' ? 'bg-white text-[#0c4a6e] shadow-lg scale-105' : 'text-blue-200/60 hover:text-white'}`}
           >
              <Users className="w-4 h-4" />
              Staff Requests
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] border-2 border-[#0c4a6e] animate-pulse">
                  {pendingRequests.length}
                </span>
              )}
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 md:p-10 max-w-7xl mx-auto w-full">
        
        {activeSubTab === 'OVERVIEW' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatBox icon={Users} title="Active Staff" value={accounts.filter(a => a.status === 'APPROVED').length + 1} sub="Personnel with access" color="text-blue-600" bg="bg-blue-50" />
                <StatBox 
                   icon={Clock} 
                   title="Pending Verification" 
                   value={pendingRequests.length} 
                   sub="Awaiting Approval" 
                   color={pendingRequests.length > 0 ? "text-amber-600" : "text-slate-400"} 
                   bg={pendingRequests.length > 0 ? "bg-amber-50" : "bg-slate-50"}
                   onClick={() => setActiveSubTab('REQUESTS')}
                   highlight={pendingRequests.length > 0}
                />
                <StatBox icon={Database} title="Asset Inventory" value={inventoryCount} sub="Tracked SKU units" color="text-emerald-600" bg="bg-emerald-50" />
                <StatBox icon={History} title="Logged Events" value={transactionCount} sub="System activities" color="text-indigo-600" bg="bg-indigo-50" />
             </div>

             {pendingRequests.length > 0 && (
                <div 
                  onClick={() => setActiveSubTab('REQUESTS')}
                  className="bg-amber-50 rounded-[2rem] p-8 border border-amber-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer hover:bg-amber-100/50 transition-all group"
                >
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-amber-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                         <AlertCircle className="w-8 h-8" />
                      </div>
                      <div className="text-center md:text-left">
                         <h3 className="text-xl font-black text-amber-900 tracking-tight">New Signup Requests Detected</h3>
                         <p className="text-amber-700/70 font-medium">There are <span className="font-black underline">{pendingRequests.length} personnel</span> waiting for access verification. Review them in the Requests tab.</p>
                      </div>
                   </div>
                   <div className="px-6 py-2 bg-amber-500 text-white text-[10px] font-black uppercase rounded-xl tracking-widest shadow-md">
                      Action Required
                   </div>
                </div>
             )}

             <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                   <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center shadow-inner">
                      <ShieldCheck className="w-10 h-10" />
                   </div>
                   <div className="text-center md:text-left">
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">System Operational</h3>
                      <p className="text-slate-400 font-medium max-w-md">Role-based access control (RBAC) is currently active. Monitoring system health and movement analytics.</p>
                   </div>
                </div>
                <div className="px-8 py-3 bg-emerald-50 text-emerald-700 text-xs font-black uppercase rounded-2xl tracking-widest border border-emerald-100 shadow-sm">
                   Security Layer Active
                </div>
             </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
             {/* Pending Requests Section */}
             <div className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                   <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm">
                      <Clock className="w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Pending Approval</h3>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-none mt-1">Personnel awaiting verification</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {pendingRequests.length > 0 ? (
                     pendingRequests.map(req => (
                        <div key={req.username} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
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
                           <div className="text-xs text-slate-500 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <p className="font-medium">Requested on {new Date(req.createdAt).toLocaleDateString()}</p>
                           </div>
                           <div className="flex gap-2">
                              <button 
                                onClick={() => onUpdateAccountStatus(req.username, 'APPROVED')}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                              >
                                 <CheckCircle className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button 
                                onClick={() => onUpdateAccountStatus(req.username, 'DENIED')}
                                className="flex-1 bg-white hover:bg-rose-50 text-rose-500 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-rose-100 active:scale-95"
                              >
                                 <XCircle className="w-3.5 h-3.5" /> Deny
                              </button>
                           </div>
                        </div>
                     ))
                   ) : (
                     <div className="col-span-full py-12 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                        <div className="flex flex-col items-center gap-3 text-slate-300">
                           <ShieldCheck className="w-12 h-12 opacity-20" />
                           <p className="font-black uppercase tracking-[0.2em] text-xs">No pending requests at this time</p>
                        </div>
                     </div>
                   )}
                </div>
             </div>

             {/* Managed Accounts Section */}
             <div className="space-y-6 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-4 px-2">
                   <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                      <Users className="w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Access History</h3>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-none mt-1">Processed personnel accounts</p>
                   </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                   <div className="overflow-x-auto">
                      <table className="w-full text-left">
                         <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                               <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                               <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</th>
                               <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                               <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                               <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                            {processedAccounts.map(acc => (
                               <tr key={acc.username} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-8 py-4">
                                     <span className="font-black text-slate-800 text-sm">{acc.name}</span>
                                  </td>
                                  <td className="px-8 py-4">
                                     <span className="text-xs font-bold text-slate-400">@{acc.username}</span>
                                  </td>
                                  <td className="px-8 py-4">
                                     <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${acc.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                        {acc.status}
                                     </span>
                                  </td>
                                  <td className="px-8 py-4">
                                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff User</span>
                                  </td>
                                  <td className="px-8 py-4 text-right">
                                     <div className="flex items-center justify-end gap-2">
                                        {acc.status === 'DENIED' && (
                                           <button 
                                             onClick={() => onUpdateAccountStatus(acc.username, 'APPROVED')}
                                             className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                                             title="Approve Now"
                                           >
                                              <CheckCircle className="w-4 h-4" />
                                           </button>
                                        )}
                                        {acc.status === 'APPROVED' && (
                                           <button 
                                             onClick={() => onUpdateAccountStatus(acc.username, 'DENIED')}
                                             className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                             title="Revoke Access"
                                           >
                                              <XCircle className="w-4 h-4" />
                                           </button>
                                        )}
                                     </div>
                                  </td>
                               </tr>
                            ))}
                            {processedAccounts.length === 0 && (
                               <tr>
                                  <td colSpan={5} className="px-8 py-10 text-center text-slate-300 font-bold uppercase text-[10px]">No account history found</td>
                               </tr>
                            )}
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

const StatBox = ({ icon: Icon, title, value, sub, color, bg, onClick, highlight }: any) => (
  <div 
    onClick={onClick}
    className={`bg-white p-8 rounded-[2.5rem] border shadow-sm flex items-center gap-6 hover:shadow-md transition-all ${onClick ? 'cursor-pointer hover:border-blue-200' : 'border-slate-100'} ${highlight ? 'ring-2 ring-amber-500/20' : ''}`}
  >
    <div className={`w-16 h-16 ${bg} ${color} rounded-[1.75rem] flex items-center justify-center shadow-inner`}>
       <Icon className="w-8 h-8" />
    </div>
    <div>
       <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{title}</p>
       <h4 className="text-4xl font-black text-slate-800 tracking-tighter leading-none tabular-nums">{value}</h4>
       <p className="text-[11px] font-bold text-slate-400 mt-2">{sub}</p>
    </div>
  </div>
);

export default AdminPanel;