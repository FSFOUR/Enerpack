import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, LogIn, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
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

    // Simulate validation and state sync
    setTimeout(() => {
      const lowerUser = username.toLowerCase().trim();
      
      // Master admin check
      if (lowerUser === 'admin' && password === 'enerpack2022') {
        onLogin({ username: 'admin', role: 'ADMIN', name: 'Master Administrator' });
        setIsLoading(false);
        return;
      }

      // Dynamic user check
      const account = authorizedUsers.find(u => u.username.toLowerCase() === lowerUser);
      
      if (!account) {
        setError('Account not found. Please register first.');
      } else if (account.password !== password) {
        setError('Incorrect password. Please try again.');
      } else {
        if (account.status === 'APPROVED') {
          onLogin({ 
            username: account.username, 
            role: account.role, 
            name: account.name,
            allowedPages: account.allowedPages 
          });
        } else if (account.status === 'PENDING') {
          setError('Access Pending: Administrator approval required.');
        } else {
          setError('Access Denied: Account request declined.');
        }
      }
      setIsLoading(false);
    }, 600);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const cleanUsername = username.toLowerCase().trim();

    if (cleanUsername.length < 3) {
      setError('Username must be at least 3 characters.');
      setIsLoading(false);
      return;
    }

    if (authorizedUsers.some(u => u.username.toLowerCase() === cleanUsername) || cleanUsername === 'admin') {
      setError('Username already registered.');
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      onRequestSignup({
        name: fullName.trim(),
        username: cleanUsername,
        password: password
      });
      
      setSuccess('Request Submitted! Contact Admin for approval.');
      setMode('LOGIN');
      setPassword('');
      setFullName('');
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen w-full bg-[#0c4a6e] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-white rounded-[1.5rem] items-center justify-center shadow-2xl mb-6">
            <span className="font-black text-2xl text-[#0c4a6e] brand-font">EP</span>
          </div>
          <h1 className="text-white text-4xl tracking-tighter mb-1 uppercase brand-font">Ener Pack</h1>
          <p className="text-blue-300 text-[9px] font-black uppercase tracking-[0.4em] opacity-80">Operational Intelligence</p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-white/10">
          <div className="flex bg-slate-50 border-b border-slate-100 p-2">
            <button 
              onClick={() => { setMode('LOGIN'); setError(''); setSuccess(''); }}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'LOGIN' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setMode('REGISTER'); setError(''); setSuccess(''); }}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'REGISTER' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
            >
              Register
            </button>
          </div>

          <div className="p-8">
            {success && (
              <div className="mb-6 bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3 text-emerald-600 animate-in slide-in-from-top-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <p className="text-xs font-bold uppercase tracking-tight">{success}</p>
              </div>
            )}

            {error && (
              <div className="mb-6 bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-start gap-3 text-rose-600 animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
              </div>
            )}

            <form onSubmit={mode === 'LOGIN' ? handleLogin : handleRegister} className="space-y-4">
              {mode === 'REGISTER' && (
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><User className="w-5 h-5" /></div>
                    <input 
                      type="text" required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-6 text-sm font-bold text-slate-800 focus:bg-white outline-none transition-all"
                      placeholder="e.g. John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">Username</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><User className="w-5 h-5" /></div>
                  <input 
                    type="text" required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-6 text-sm font-bold text-slate-800 focus:bg-white outline-none transition-all"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 ml-1">Password</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><Lock className="w-5 h-5" /></div>
                  <input 
                    type={showPassword ? "text" : "password"} required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-12 text-sm font-bold text-slate-800 focus:bg-white outline-none transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" disabled={isLoading}
                className="w-full bg-[#0c4a6e] hover:bg-[#075985] text-white py-4 rounded-xl font-black uppercase tracking-[0.1em] text-sm transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    {mode === 'LOGIN' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {mode === 'LOGIN' ? 'Login' : 'Submit Registration'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 text-center">
           <p className="text-blue-200/30 text-[9px] font-black uppercase tracking-[0.5em]">Secure Terminal</p>
        </div>
      </div>
    </div>
  );
};

export default Login;