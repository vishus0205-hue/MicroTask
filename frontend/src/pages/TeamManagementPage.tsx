import React, { useState, useEffect } from 'react';
import { Users, Plus, Mail, X, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { User as UserModel, UserRole } from '../types';

export const TeamManagementPage: React.FC = () => {
  const { user: currentUser, hasRole } = useAuth();
  const [users, setUsers] = useState<UserModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create user modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('team_member');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers();
      setUsers(res.users);
    } catch (err: any) {
      setError(err.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    try {
      await api.createUser({
        username: username.trim(),
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        role,
      });
      setIsModalOpen(false);
      setUsername('');
      setEmail('');
      setPassword('');
      setFullName('');
      setRole('team_member');
      loadUsers();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create user');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeactivate = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to deactivate ${name}?`)) return;
    try {
      await api.deactivateUser(id);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate user');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-100">Administrator</span>;
      case 'project_manager':
        return <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-100">Project Manager</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Team Member</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
        <div>
          <div className="text-[13px] font-medium text-slate-400 mb-1">Access & Organization</div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Team Directory
          </h1>
          <p className="text-[13px] text-slate-500 mt-1 max-w-xl">
            Manage engineers, role authorizations, and project access credentials.
          </p>
        </div>

        {hasRole('admin') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] rounded-full shadow-xs transition-all self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl">
          {error}
        </div>
      )}

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {users.map((u) => (
          <div
            key={u.id}
            className={`glass-card rounded-3xl p-5 space-y-3 transition-all ${
              u.is_active ? '' : 'opacity-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-800 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  {u.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-slate-900">{u.full_name}</h3>
                  <p className="text-[11px] text-slate-400">@{u.username}</p>
                </div>
              </div>
              {getRoleBadge(u.role)}
            </div>

            <div className="pt-2 border-t border-black/[0.04] text-[12px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{u.email}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-400">Status</span>
                <span className={`font-medium ${u.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {u.is_active ? 'Active Account' : 'Deactivated'}
                </span>
              </div>
            </div>

            {hasRole('admin') && u.id !== currentUser?.id && u.is_active && (
              <div className="pt-2 border-t border-black/[0.04] flex justify-end">
                <button
                  onClick={() => handleDeactivate(u.id, u.full_name)}
                  className="text-[11px] font-medium text-slate-400 hover:text-red-600 transition-colors"
                >
                  Deactivate Member
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Apple-style Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-md">
          <div className="w-full max-w-md glass-dialog rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.05] bg-white/50">
              <h3 className="text-[14px] font-bold text-slate-900">Add Team Member</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-black/[0.04]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-3.5 text-xs">
              {modalError && (
                <div className="p-3 text-[11px] text-red-600 bg-red-50/70 border border-red-100 rounded-xl">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block mb-1 font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/70 border border-black/[0.08] text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-700">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. jdoe"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/70 border border-black/[0.08] text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-700">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jdoe@microtask.local"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/70 border border-black/[0.08] text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-700">Initial Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/70 border border-black/[0.08] text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-700">Role Authorization</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/70 border border-black/[0.08] text-sm focus:outline-hidden"
                >
                  <option value="team_member">Team Member</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-black/[0.05]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-[12px] font-medium text-slate-600 rounded-full hover:bg-black/[0.04]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 text-[12px] font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-full shadow-xs disabled:opacity-50"
                >
                  {modalLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
