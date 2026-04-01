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
  const [showApprovalMessage, setShowApprovalMessage] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (isRegistering) {
      onRegister(username, password);
      setShowApprovalMessage(true);
      setIsRegistering(false);
      setUsername('');
      setPassword('');
      return;
    }

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
      setError('Invalid credentials or account pending approval');
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
              onClick={() => { setShowApprovalMessage(false); }}
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

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[10px] font-bold uppercase tracking-wider text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">USERNAME</label>
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
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">PASSWORD</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3.5 sm:p-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-bold text-xs sm:text-sm"
                placeholder="........"
                required
              />
            </div>

            <button 
              type="submit"
                className="w-full p-3.5 sm:p-4 bg-[#1e69ff] text-white rounded-xl font-black uppercase tracking-[0.15em] hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98] mt-2 text-xs sm:text-sm"
              >
              {isRegistering ? 'REQUEST ACCESS' : 'LOG IN'}
            </button>

            <button 
              type="button"
              onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
              className="w-full p-3.5 sm:p-4 bg-slate-100 text-slate-600 rounded-xl font-black uppercase tracking-[0.15em] hover:bg-slate-200 transition-all active:scale-[0.98] mt-2 text-xs sm:text-sm"
            >
              {isRegistering ? 'BACK TO LOGIN' : 'REGISTER NEW ACCOUNT'}
            </button>
            {!isRegistering && (
              <button 
                type="button"
                onClick={() => onLogin('Viewer', 'Guest User', ['Dashboard', 'Inventory', 'Movement', 'Planning', 'Tools'])}
                className="w-full p-3.5 sm:p-4 bg-slate-800 text-white rounded-xl font-black uppercase tracking-[0.15em] hover:bg-slate-700 transition-all active:scale-[0.98] mt-2 text-xs sm:text-sm"
              >
                GUEST ACCESS (READ-ONLY)
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

