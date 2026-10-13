import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface DefectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  taskId: number;
}

export const DefectModal: React.FC<DefectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  taskId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
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
      setError('Defect title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.reportDefect({
        task_id: taskId,
        title: title.trim(),
        description: description.trim(),
        severity,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to report defect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-xs transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-enter w-full max-w-md glass-dialog overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/[0.05] bg-white/50">
          <h3 className="text-[14px] font-semibold text-slate-900 tracking-tight">Log Software Defect</h3>
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

          <div>
            <label className="block mb-1 font-semibold text-slate-700">
              Defect Summary <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unhandled null pointer on empty dataset"
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-white/70 border border-black/[0.08] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold text-slate-700">Severity Level</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-white/70 border border-black/[0.08] focus:outline-hidden focus:ring-2 focus:ring-slate-900/10"
            >
              <option value="low">Low (Minor cosmetic issue)</option>
              <option value="medium">Medium (Impaired non-blocking feature)</option>
              <option value="high">High (Major failure with workaround)</option>
              <option value="critical">Critical (Blocking crash or regression)</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 font-semibold text-slate-700">
              Reproduction Steps / Diagnostic Logs
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe steps to reproduce, parameters, or stack trace..."
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-white/70 border border-black/[0.08] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 placeholder:text-slate-400"
            />
          </div>

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
              className="px-4 py-2 text-[12px] font-medium text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] rounded-full shadow-xs disabled:opacity-50 transition-all"
            >
              {loading ? 'Submitting...' : 'Log Defect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
