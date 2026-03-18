import React, { useState } from 'react';
import { LogIn } from 'lucide-react';

interface LoginPageProps {
  onLogin: (role: string, name: string, pages: string[]) => void;
  onRegister: (username: string, password: string) => void;
  staffs: any[];
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onRegister, staffs }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'Login' | 'Register'>('Login');
  const [showApprovalMessage, setShowApprovalMessage] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'Login') {
      const approvedUser = staffs.find(s => s.username === username && s.password === password && s.status === 'Active');
      
      if (username === 'admin' && password === 'Enerpack2022') {
        onLogin('Admin', 'Master Administrator', ['Dashboard', 'Inventory', 'Movement', 'Planning', 'Tools', 'Admin']);
      } else if (username === 'editor' && password === 'editor') {
        onLogin('Editor', 'System Editor', ['Dashboard', 'Inventory', 'Movement', 'Planning', 'Tools']);
      } else if (approvedUser) {
        onLogin(approvedUser.role, approvedUser.name, approvedUser.pages || []);
      } else if (username === 'pending' && password === 'pending') {
        setShowApprovalMessage(true);
      } else {
        alert('Invalid credentials or account pending approval');
      }
    } else {
      onRegister(username, password);
      setShowApprovalMessage(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050b18] p-4 font-sans">
      {showApprovalMessage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md text-center border border-slate-100">
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-[0.2em]">Awaiting Approval</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">Your account is currently being reviewed by the administration. You will be notified once access is granted.</p>
            <button 
              onClick={() => { setShowApprovalMessage(false); setActiveTab('Login'); }}
              className="w-full p-5 bg-[#1e69ff] text-white rounded-2xl font-black uppercase tracking-[0.15em] hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98]"
            >
              UNDERSTOOD
            </button>
          </div>
        </div>
      )}

      <div className="bg-white w-full max-w-[320px] sm:max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 bg-[#0f2a43] rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-900/20">
              EP
            </div>
            <h1 className="text-xl font-black text-[#0f2a43] tracking-tighter">ENERPACK</h1>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl mb-4 sm:mb-6">
            <button 
              onClick={() => setActiveTab('Login')}
              className={cn(
                "flex-1 py-2 sm:py-2.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'Login' ? "bg-white text-[#1e69ff] shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Login
            </button>
            <button 
              onClick={() => setActiveTab('Register')}
              className={cn(
                "flex-1 py-2 sm:py-2.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'Register' ? "bg-white text-[#1e69ff] shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3.5 sm:p-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-bold text-xs sm:text-sm"
                placeholder="Enter username"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3.5 sm:p-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-bold text-xs sm:text-sm"
                placeholder="••••••••"
                required
              />
            </div>

              <button 
                type="submit"
                className="w-full p-3.5 sm:p-4 bg-[#1e69ff] text-white rounded-xl font-black uppercase tracking-[0.15em] hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98] mt-2 text-xs sm:text-sm"
              >
              {activeTab === 'Login' ? 'ACCESS TERMINAL' : 'REQUEST ACCESS'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

