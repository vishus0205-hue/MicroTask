import React, { useState, useEffect } from 'react';
import { User, KeyRound, Check, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Task } from '../types';

export const ProfilePage: React.FC<{ onSelectTask: (id: number) => void }> = ({ onSelectTask }) => {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    if (user) {
      api.getTasks({ assigned_to_id: user.id, limit: 8 }).then((res) => {
        setAssignedTasks(res.tasks);
        setLoadingTasks(false);
      }).catch(() => setLoadingTasks(false));
    }
  }, [user]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.changePassword(oldPassword, newPassword);
      setPasswordMessage('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Profile Surface */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-800 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{user?.full_name}</h1>
            <p className="text-[12px] text-slate-400">@{user?.username} • {user?.email}</p>
            <div className="mt-2">
              <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider">
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-400">
          Account Active Since: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Password Card */}
        <div className="glass-card rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-slate-600" />
            <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">Security & Credentials</h3>
          </div>

          {passwordMessage && (
            <div className="p-3 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
              <Check className="w-3.5 h-3.5" />
              <span>{passwordMessage}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 text-[11px] text-red-700 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
            <div>
              <label className="block mb-1 font-semibold text-slate-700">Current Password</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-[13px] bg-white/70 border border-black/[0.08] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold text-slate-700">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-[13px] bg-white/70 border border-black/[0.08] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold text-slate-700">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-[13px] bg-white/70 border border-black/[0.08] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full py-2.5 text-[12px] font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-full shadow-xs disabled:opacity-50 transition-all mt-2"
            >
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* My Tasks Summary */}
        <div className="glass-card rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">Assigned Deliverables</h3>
            <span className="text-[11px] text-slate-400 font-medium">{assignedTasks.length} tasks</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {loadingTasks ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading assignments...</div>
            ) : assignedTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                You have no active tasks currently assigned.
              </div>
            ) : (
              assignedTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onSelectTask(t.id)}
                  className="p-3 rounded-2xl bg-white/70 hover:bg-white border border-black/[0.04] transition-all cursor-pointer flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-900 truncate">{t.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {t.priority.toUpperCase()} • Due: {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'None'}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-700 shrink-0">
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
