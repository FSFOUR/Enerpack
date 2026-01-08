import React, { useState } from 'react';
import { Package, Lock, User, Eye, EyeOff, ShieldCheck, LogIn, UserPlus, CheckCircle2 } from 'lucide-react';
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      // 1. Check master admin with NEW CREDENTIALS
      if (username === 'admin' && password === 'enerpack2022') {
        onLogin({ username: 'admin', role: 'ADMIN', name: 'Master Administrator' });
      } else {
        // 2. Check authorized dynamic users
        const user = authorizedUsers.find(u => u.username === username && u.password === password);
        if (user) {
          if (user.status === 'APPROVED') {
            onLogin({ username: user.username, role: user.role, name: user.name });
          } else if (user.status === 'PENDING') {
            setError('Your account is pending administrator approval.');
          } else {
            setError('Access denied by administrator.');
          }
        } else {
          setError('Invalid username or password.');
        }
      }
      setIsLoading(false);
    }, 800);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (username.length < 3) {
      setError('Username must be at least 3 characters.');
      setIsLoading(false);
      return;
    }

    if (authorizedUsers.some(u => u.username === username) || username === 'admin') {
      setError('Username already exists.');
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      onRequestSignup({
        name: fullName,
        username,
        password
      });
      setSuccess('Registration request submitted! Wait for Admin approval.');
      setMode('LOGIN');
      setUsername('');
      setPassword('');
      setFullName('');
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen w-full bg-[#0c4a6e] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-blue-500 rounded-2xl items-center justify-center shadow-2xl border-2 border-white/20 mb-4 rotate-3 transform transition-transform hover:rotate-0">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-white text-4xl font-black uppercase tracking-tighter leading-none mb-2">Enerpack</h1>
          <p className="text-blue-300 text-xs font-bold uppercase tracking-[0.2em] opacity-80">Operational Intelligence</p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 relative">
          <div className="flex bg-slate-50 border-b border-slate-100 p-2">
            <button 
              onClick={() => { setMode('LOGIN'); setError(''); setSuccess(''); }}
              className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'LOGIN' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setMode('REGISTER'); setError(''); setSuccess(''); }}
              className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'REGISTER' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Join Team
            </button>
          </div>

          <div className="p-8 md:p-10">
            <div className="mb-8 text-center md:text-left">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{mode === 'LOGIN' ? 'Welcome Back' : 'Get Access'}</h2>
              <p className="text-slate-400 text-sm font-medium">
                {mode === 'LOGIN' ? 'Enter credentials to manage inventory.' : 'Register and wait for admin verification.'}
              </p>
            </div>

            {success && (
              <div className="mb-6 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-600 animate-in slide-in-from-top-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <p className="text-xs font-bold uppercase tracking-tight leading-tight">{success}</p>
              </div>
            )}

            <form onSubmit={mode === 'LOGIN' ? handleLogin : handleRegister} className="space-y-5">
              {mode === 'REGISTER' && (
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <input 
                      type="text"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                      placeholder="e.g. John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Username</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <input 
                    type="text"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-12 text-sm font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-3 text-rose-600 animate-in slide-in-from-top-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
                </div>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0c4a6e] hover:bg-[#075985] text-white py-4 rounded-2xl font-black uppercase tracking-[0.1em] text-sm transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    {mode === 'LOGIN' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {mode === 'LOGIN' ? 'Secure Login' : 'Submit Request'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 text-center">
           <p className="text-blue-200/30 text-[9px] font-black uppercase tracking-[0.3em]">Master Secure Environment</p>
        </div>
      </div>
    </div>
  );
};

export default Login;