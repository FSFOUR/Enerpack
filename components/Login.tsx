import React, { useState, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, LogIn, UserPlus, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { User as UserType, UserAccount } from '../types';

interface LoginProps {
  onLogin: (user: UserType) => void;
  authorizedUsers: UserAccount[];
  onRequestSignup: (signup: Omit<UserAccount, 'role' | 'status' | 'createdAt'>) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, authorizedUsers, onRequestSignup }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 8000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const lowerUser = username.toLowerCase().trim();
    
    setTimeout(() => {
      if (lowerUser === 'admin' && password === 'enerpack2022') {
        onLogin({ username: 'admin', role: 'ADMIN', name: 'Master Administrator' });
        setIsLoading(false);
        return;
      }

      const account = authorizedUsers.find(u => u.username.toLowerCase().trim() === lowerUser);
      
      if (!account) {
        setError('Identification failed. Username not recognized.');
      } else if (account.password !== password) {
        setError('Security mismatch. Incorrect password.');
      } else {
        if (account.status === 'APPROVED') {
          onLogin({ 
            username: account.username, 
            role: account.role, 
            name: account.name,
            allowedPages: account.allowedPages 
          });
        } else if (account.status === 'PENDING') {
          setError('Authorization Pending. Contact Admin for activation.');
        } else {
          setError('Access Revoked.');
        }
      }
      setIsLoading(false);
    }, 500);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const cleanUsername = username.toLowerCase().trim();
    const cleanFullName = fullName.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

    if (cleanUsername.length < 3) {
      setError('Username too short.');
      setIsLoading(false);
      return;
    }

    if (password.length < 4) {
      setError('Password too weak.');
      setIsLoading(false);
      return;
    }

    if (authorizedUsers.some(u => u.username.toLowerCase().trim() === cleanUsername) || cleanUsername === 'admin') {
      setError('Username already exists.');
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      onRequestSignup({
        name: cleanFullName,
        username: cleanUsername,
        password: password
      });
      
      setSuccess('Request Submitted. Notify Admin to approve your terminal.');
      setMode('LOGIN');
      setFullName('');
      setIsLoading(false);
    }, 700);
  };

  return (
    <div className="min-h-screen w-full bg-[#0c4a6e] flex items-center justify-center p-4 relative overflow-hidden font-sans text-slate-800">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[150px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-sky-500/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center">
          <div className="inline-flex w-24 h-24 bg-white rounded-[2.5rem] items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] mb-6 transform hover:scale-105 transition-transform">
            <span className="font-black text-4xl text-[#0c4a6e] brand-font">EP</span>
          </div>
          <h1 className="text-white text-5xl font-black tracking-[0.1em] mb-1 uppercase brand-font">ENERPACK</h1>
          <p className="text-blue-300/80 text-sm font-bold uppercase tracking-[0.4em] mb-8">OPERATIONS</p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">
          <div className="flex bg-slate-50/80 border-b border-slate-100 p-2">
            <button 
              onClick={() => { setMode('LOGIN'); setError(''); setSuccess(''); }}
              className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${mode === 'LOGIN' ? 'bg-white text-[#0c4a6e] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LogIn className="w-3.5 h-3.5" /> Sign in
            </button>
            <button 
              onClick={() => { setMode('REGISTER'); setError(''); setSuccess(''); }}
              className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${mode === 'REGISTER' ? 'bg-white text-[#0c4a6e] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Register
            </button>
          </div>

          <div className="p-8 md:p-10">
            {success && (
              <div className="mb-6 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 animate-in zoom-in-95 duration-300">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <p className="text-[10px] font-bold uppercase leading-tight">{success}</p>
              </div>
            )}

            {error && (
              <div className="mb-6 bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-3 text-rose-700 animate-in shake duration-500">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold uppercase leading-tight">{error}</p>
              </div>
            )}

            <form onSubmit={mode === 'LOGIN' ? handleLogin : handleRegister} className="space-y-5">
              {mode === 'REGISTER' && (
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Display Name</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"><User className="w-5 h-5" /></div>
                    <input 
                      type="text" required
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-slate-800 focus:bg-white focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                      placeholder="e.g. John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">System ID (Username)</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"><User className="w-5 h-5" /></div>
                  <input 
                    type="text" required
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-slate-800 focus:bg-white focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                    placeholder="Enter ID"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Secure Passcode</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"><Lock className="w-5 h-5" /></div>
                  <input 
                    type={showPassword ? "text" : "password"} required
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-12 text-sm font-bold text-slate-800 focus:bg-white focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" disabled={isLoading}
                className="w-full bg-[#0c4a6e] hover:bg-[#075985] text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-[0_15px_30px_rgba(12,74,110,0.3)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    {mode === 'LOGIN' ? 'Login' : 'Register'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;