import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import type { Task, User as UserModel } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task?: Task | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSuccess, task }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [assignedToId, setAssignedToId] = useState<string>('');
  const [estimatedHours, setEstimatedHours] = useState<number>(4.0);
  const [actualHours, setActualHours] = useState<number>(0.0);
  const [dueDate, setDueDate] = useState<string>('');
  const [users, setUsers] = useState<UserModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.getUsers({ active: true }).then((res) => setUsers(res.users)).catch(() => {});
      if (task) {
        setTitle(task.title);
        setDescription(task.description || '');
        setPriority(task.priority);
        setAssignedToId(task.assigned_to_id ? String(task.assigned_to_id) : '');
        setEstimatedHours(task.estimated_hours || 0);
        setActualHours(task.actual_hours || 0);
        setDueDate(task.due_date ? task.due_date.slice(0, 16) : '');
      } else {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setAssignedToId('');
        setEstimatedHours(4.0);
        setActualHours(0.0);
        const defaultDue = new Date();
        defaultDue.setDate(defaultDue.getDate() + 3);
        setDueDate(defaultDue.toISOString().slice(0, 16));
      }
      setError('');
    }
  }, [isOpen, task]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        priority,
        assigned_to_id: assignedToId ? parseInt(assignedToId, 10) : null,
        estimated_hours: Number(estimatedHours),
        actual_hours: Number(actualHours),
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      };

      if (task) {
        await api.updateTask(task.id, payload);
      } else {
        await api.createTask(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 dark:bg-black/60 backdrop-blur-xs transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-enter w-full max-w-lg glass-dialog overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/[0.05] dark:border-white/[0.08] bg-white/50 dark:bg-zinc-900/50">
          <h3 className="text-[14px] font-semibold text-slate-900 dark:text-zinc-100 tracking-tight">
            {task ? 'Edit Task' : 'Create Task'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 text-[11px] text-red-600 dark:text-red-400 bg-red-50/70 dark:bg-red-950/50 border border-red-100 dark:border-red-900/60 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block mb-1 font-semibold text-slate-700 dark:text-zinc-300">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement OAuth token refresh handler"
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-white/70 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] text-slate-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold text-slate-700 dark:text-zinc-300">Specifications / Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context, acceptance criteria, or technical details..."
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-white/70 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] text-slate-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-semibold text-slate-700 dark:text-zinc-300">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-white/70 dark:bg-zinc-800 border border-black/[0.08] dark:border-white/[0.08] text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical Priority</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-semibold text-slate-700 dark:text-zinc-300">Assigned Engineer</label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-white/70 dark:bg-zinc-800 border border-black/[0.08] dark:border-white/[0.08] text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-semibold text-slate-700 dark:text-zinc-300">Estimated Effort (Hours)</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-white/70 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold text-slate-700 dark:text-zinc-300">Target Deadline</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-white/70 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
              />
            </div>
          </div>

          {task && (
            <div>
              <label className="block mb-1 font-semibold text-slate-700 dark:text-zinc-300">Actual Effort Logged (Hours)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={actualHours}
                onChange={(e) => setActualHours(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-white/70 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-black/[0.05] dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[12px] font-medium text-slate-600 dark:text-zinc-400 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-[12px] font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 active:scale-[0.98] rounded-full shadow-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
