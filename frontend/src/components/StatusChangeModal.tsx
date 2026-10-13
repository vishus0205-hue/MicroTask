import React, { useState } from 'react';
import { X, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import type { Task, TaskStatus } from '../types';

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task: Task | null;
  targetStatus: TaskStatus;
}

export const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  task,
  targetStatus,
}) => {
  const [comment, setComment] = useState('');
  const [actualHours, setActualHours] = useState<number>(task?.actual_hours || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.updateTaskStatus(task.id, targetStatus, comment.trim(), actualHours);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update task status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'todo': return 'To Do';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
    }
  };

  const isReopening = task.status === 'completed' && (targetStatus === 'in_progress' || targetStatus === 'todo');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-md">
      <div className="w-full max-w-md glass-dialog rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.05] bg-white/50">
          <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
            {isReopening ? 'Reopen Deliverable (Rework)' : 'Update Status'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-black/[0.04]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 text-[11px] text-red-600 bg-red-50/70 border border-red-100 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isReopening && (
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/60 text-[11px] text-amber-900 leading-relaxed">
              <strong>Academic Rework Metric Notice:</strong> Reopening a completed item will record an audit transition in the database and contribute toward the project's Rework Rate.
            </div>
          )}

          <div className="flex items-center justify-center gap-3 p-3 bg-white/70 rounded-2xl border border-black/[0.04] text-[13px] font-medium">
            <span className="px-3 py-1 bg-slate-100 rounded-full text-slate-600">
              {getStatusLabel(task.status)}
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="px-3 py-1 bg-slate-900 text-white rounded-full font-semibold shadow-xs">
              {getStatusLabel(targetStatus)}
            </span>
          </div>

          <div>
            <label className="block mb-1 font-semibold text-slate-700">
              Transition Note / Rework Justification
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Unit tests passing, verified in staging..."
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-white/70 border border-black/[0.08] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 placeholder:text-slate-400"
            />
          </div>

          {(targetStatus === 'completed' || task.status === 'in_progress') && (
            <div>
              <label className="block mb-1 font-semibold text-slate-700">
                Total Actual Hours Spent
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={actualHours}
                onChange={(e) => setActualHours(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-white/70 border border-black/[0.08] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-black/[0.05]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[12px] font-medium text-slate-600 rounded-full hover:bg-black/[0.04]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-[12px] font-medium text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] rounded-full shadow-xs disabled:opacity-50 transition-all"
            >
              {loading ? 'Confirming...' : 'Confirm Transition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
