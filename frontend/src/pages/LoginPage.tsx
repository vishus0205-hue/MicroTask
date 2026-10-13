import React, { useState } from 'react';
import { Command, LogIn, AlertCircle, Shield, Briefcase, User, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please provide username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (uname: string) => {
    setUsername(uname);
    setPassword('Demo@12345');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#f5f5f7] dark:bg-[#121214] text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      {/* Top right Theme Switch */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-xl bg-white/70 dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 shadow-2xs transition-all cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 rotate-0 transition-transform duration-200" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 rotate-0 transition-transform duration-200" />
          )}
        </button>
      </div>

      {/* Soft Ambient Light Gradient Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-200/40 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-200/35 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm glass-dialog rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Brand Mark */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-950 dark:from-zinc-700 dark:to-zinc-900 text-white shadow-md shadow-slate-900/10 mb-1">
            <Command className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            MicroTask Workspace
          </h1>
          <p className="text-[12px] text-slate-400 dark:text-zinc-500">
            Sign in to access engineering metrics telemetry
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-[12px] text-red-600 dark:text-red-400 bg-red-50/70 dark:bg-red-950/50 border border-red-100 dark:border-red-900/60 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block mb-1 text-[11px] font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
              Account Handle
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin or dev_priya"
              className="w-full px-3.5 py-2.5 text-[13px] bg-white/70 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] text-slate-900 dark:text-zinc-100 rounded-xl focus:bg-white dark:focus:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-500 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>

          <div>
            <label className="block mb-1 text-[11px] font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 text-[13px] bg-white/70 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] text-slate-900 dark:text-zinc-100 rounded-xl focus:bg-white dark:focus:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-500 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center w-full gap-2 px-4 py-2.5 text-[13px] font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 active:scale-[0.98] rounded-xl shadow-xs disabled:opacity-50 transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Demo Access Pills */}
        <div className="pt-4 border-t border-black/[0.05] dark:border-white/[0.08] space-y-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 text-center">
            Quick Demonstration Access
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="p-2 text-center rounded-xl bg-black/[0.03] hover:bg-black/[0.06] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.06] transition-all cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 mx-auto text-purple-600 dark:text-purple-400 mb-0.5" />
              <span className="text-[11px] font-semibold text-slate-800 dark:text-zinc-200 block">Admin</span>
              <span className="text-[9px] text-slate-400 dark:text-zinc-500 block truncate">Dr. Sarah</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('pm_alex')}
              className="p-2 text-center rounded-xl bg-black/[0.03] hover:bg-black/[0.06] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.06] transition-all cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5 mx-auto text-blue-600 dark:text-blue-400 mb-0.5" />
              <span className="text-[11px] font-semibold text-slate-800 dark:text-zinc-200 block">Manager</span>
              <span className="text-[9px] text-slate-400 dark:text-zinc-500 block truncate">Alex M.</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('dev_priya')}
              className="p-2 text-center rounded-xl bg-black/[0.03] hover:bg-black/[0.06] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.06] transition-all cursor-pointer"
            >
              <User className="w-3.5 h-3.5 mx-auto text-emerald-600 dark:text-emerald-400 mb-0.5" />
              <span className="text-[11px] font-semibold text-slate-800 dark:text-zinc-200 block">Engineer</span>
              <span className="text-[9px] text-slate-400 dark:text-zinc-500 block truncate">Priya S.</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 text-center font-mono">
            Default: Demo@12345
          </p>
        </div>
      </div>
    </div>
  );
};
