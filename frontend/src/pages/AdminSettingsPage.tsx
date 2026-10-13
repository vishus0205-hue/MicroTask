import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Database,
  RefreshCw,
  HardDrive,
  Save,
  Check,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import type { SystemInfo } from '../types';

export const AdminSettingsPage: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [settings, setSettings] = useState<Record<string, { value: string; description: string; updated_at: string }>>({});
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [sysRes, setRes] = await Promise.all([
        api.getSystemInfo(),
        api.getSettings(),
      ]);
      setSystemInfo(sysRes.system);
      setSettings(setRes.settings);
      const initialVals: Record<string, string> = {};
      Object.entries(setRes.settings).forEach(([k, v]) => {
        initialVals[k] = v.value;
      });
      setFormValues(initialVals);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await api.updateSettings(formValues);
      setSuccessMsg('Project settings saved successfully.');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save settings');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleResetSeed = async () => {
    if (!window.confirm('Reset and re-seed the SQLite database with demonstration records?')) return;
    setSeedLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await api.triggerSeed();
      setSuccessMsg('Database re-seeded successfully with fresh demonstration data.');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to re-seed database');
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
        <div>
          <div className="text-[13px] font-medium text-slate-400 mb-1">System Administration</div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Settings & Diagnostics
          </h1>
          <p className="text-[13px] text-slate-500 mt-1 max-w-xl">
            Configure project parameters, inspect SQLite storage health, and manage demo data.
          </p>
        </div>

        <button
          onClick={handleResetSeed}
          disabled={seedLoading}
          className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-medium text-slate-800 glass-card hover:bg-white active:scale-[0.98] rounded-full shadow-2xs transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${seedLoading ? 'animate-spin' : ''}`} />
          <span>{seedLoading ? 'Re-seeding...' : 'Reset Demo Data'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 text-[12px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 text-[12px] text-red-700 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Diagnostics Panel */}
      <div className="glass-card rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">Database Architecture Diagnostics</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-white/70 rounded-2xl border border-black/[0.04]">
            <span className="block text-slate-400 text-[10px] uppercase font-semibold">Engine</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{systemInfo?.database_engine || 'SQLite 3'}</span>
          </div>

          <div className="p-3.5 bg-white/70 rounded-2xl border border-black/[0.04]">
            <span className="block text-slate-400 text-[10px] uppercase font-semibold">Storage Size</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block tabular-nums">
              {systemInfo?.database_size_bytes ? `${(systemInfo.database_size_bytes / 1024).toFixed(1)} KB` : 'In Memory'}
            </span>
          </div>

          <div className="p-3.5 bg-white/70 rounded-2xl border border-black/[0.04]">
            <span className="block text-slate-400 text-[10px] uppercase font-semibold">Foreign Keys</span>
            <span className="font-bold text-emerald-600 text-sm mt-0.5 block">PRAGMA Active</span>
          </div>

          <div className="p-3.5 bg-white/70 rounded-2xl border border-black/[0.04]">
            <span className="block text-slate-400 text-[10px] uppercase font-semibold">Server Clock</span>
            <span className="font-bold text-slate-900 text-xs mt-1 block truncate tabular-nums">
              {systemInfo?.server_time_utc ? new Date(systemInfo.server_time_utc).toLocaleTimeString() : '—'}
            </span>
          </div>
        </div>

        {/* Row Counts */}
        <div className="pt-2">
          <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Relational Table Record Quantities
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            {systemInfo?.table_counts &&
              Object.entries(systemInfo.table_counts).map(([tbl, count]) => (
                <div key={tbl} className="p-2.5 bg-white/60 rounded-xl border border-black/[0.04] flex items-center justify-between">
                  <span className="font-mono text-[11px] text-slate-500">{tbl}</span>
                  <span className="font-bold text-slate-900 tabular-nums">{count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div className="glass-card rounded-3xl p-6 space-y-4">
        <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">Project Configuration Parameters</h3>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(settings).map(([key, item]) => (
              <div key={key} className="space-y-1">
                <label className="block font-semibold text-slate-700 capitalize">
                  {key.replace(/_/g, ' ')}
                </label>
                <input
                  type="text"
                  value={formValues[key] || ''}
                  onChange={(e) => setFormValues({ ...formValues, [key]: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-white/70 border border-black/[0.08] focus:outline-hidden focus:ring-2 focus:ring-slate-900/10"
                />
                {item.description && (
                  <p className="text-[11px] text-slate-400">{item.description}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-3 border-t border-black/[0.04]">
            <button
              type="submit"
              disabled={saveLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 font-medium text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] rounded-full shadow-xs disabled:opacity-50 text-[12px] transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saveLoading ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
