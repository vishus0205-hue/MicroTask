import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  User,
  Calendar,
  CheckCircle2,
  Bug,
  History,
  RotateCcw,
  Plus,
  Check,
  Edit2,
  PlayCircle,
  FileCode2
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Task, TaskStatus } from '../types';

interface TaskDetailsPageProps {
  taskId: number;
  onBack: () => void;
  onOpenEdit: (task: Task) => void;
  onOpenStatusChange: (task: Task, targetStatus: TaskStatus) => void;
  onOpenReportDefect: (taskId: number) => void;
}

export const TaskDetailsPage: React.FC<TaskDetailsPageProps> = ({
  taskId,
  onBack,
  onOpenEdit,
  onOpenStatusChange,
  onOpenReportDefect,
}) => {
  const { hasRole } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTask = async () => {
    setLoading(true);
    try {
      const res = await api.getTask(taskId);
      setTask(res.task);
    } catch (err: any) {
      setError(err.message || 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const handleResolveDefect = async (defectId: number) => {
    try {
      await api.updateDefect(defectId, { status: 'resolved' });
      loadTask();
    } catch (err: any) {
      alert(err.message || 'Failed to update defect');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="p-8 glass-card rounded-3xl text-center space-y-3">
        <p className="text-sm text-red-600">{error || 'Task not found'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-full"
        >
          Return to Tasks
        </button>
      </div>
    );
  }

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'critical':
        return <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-red-50 text-red-700 border border-red-100">Critical Priority</span>;
      case 'high':
        return <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-orange-50 text-orange-700 border border-orange-100">High Priority</span>;
      case 'medium':
        return <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-100">Medium Priority</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-700">Low Priority</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back button & Action controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Tasks</span>
        </button>

        <div className="flex items-center gap-2">
          {hasRole('admin', 'project_manager') && (
            <button
              onClick={() => onOpenEdit(task)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-slate-700 glass-card hover:bg-white active:scale-[0.98] rounded-full transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          )}

          {/* Quick status button */}
          {task.status === 'todo' && (
            <button
              onClick={() => onOpenStatusChange(task, 'in_progress')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-full shadow-xs transition-all"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Start Work</span>
            </button>
          )}

          {task.status === 'in_progress' && (
            <button
              onClick={() => onOpenStatusChange(task, 'completed')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-full shadow-xs transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Done</span>
            </button>
          )}

          {task.status === 'completed' && (
            <button
              onClick={() => onOpenStatusChange(task, 'in_progress')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 active:scale-[0.98] rounded-full transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reopen Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Task Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-mono text-slate-400 font-medium">TASK #{task.id}</span>
            {getPriorityBadge(task.priority)}
            {task.is_overdue && (
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-50 text-red-600 border border-red-100">
                Overdue
              </span>
            )}
          </div>

          <span className="px-3 py-1 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider">
            {task.status.replace('_', ' ')}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-snug">
          {task.title}
        </h1>

        <p className="text-[13px] text-slate-600 whitespace-pre-wrap leading-relaxed max-w-3xl">
          {task.description || <em className="text-slate-400">No specifications provided.</em>}
        </p>

        {/* Spec Attributes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 border-t border-black/[0.04] text-[12px]">
          <div>
            <span className="text-slate-400 block text-[11px] mb-1">Assignee</span>
            <div className="flex items-center gap-1.5 font-medium text-slate-800">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{task.assigned_to_name || 'Unassigned'}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] mb-1">Due Date</span>
            <div className={`flex items-center gap-1.5 font-medium ${task.is_overdue ? 'text-red-600' : 'text-slate-800'}`}>
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'None set'}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] mb-1">Effort Tracking</span>
            <div className="flex items-center gap-1.5 font-medium text-slate-800 tabular-nums">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Est: {task.estimated_hours}h / Act: {task.actual_hours}h</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] mb-1">Created By</span>
            <span className="font-medium text-slate-800 block">
              {task.created_by_name || 'System Admin'}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Quality Defects & Status History Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Defects Panel (6 cols) */}
        <div className="lg:col-span-6 glass-card rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-orange-500" />
              <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
                Defects ({task.defects?.length || 0})
              </h3>
            </div>
            <button
              onClick={() => onOpenReportDefect(task.id)}
              className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-full transition-colors"
            >
              <Plus className="w-3 h-3" /> Report Defect
            </button>
          </div>

          {task.defects && task.defects.length > 0 ? (
            <div className="space-y-2.5">
              {task.defects.map((d) => (
                <div
                  key={d.id}
                  className="p-3.5 rounded-2xl bg-white/70 border border-black/[0.04] text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{d.title}</span>
                    <span
                      className={`px-2 py-0.5 text-[9px] font-semibold rounded-full ${
                        d.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-orange-50 text-orange-700 border border-orange-100'
                      }`}
                    >
                      {d.status.toUpperCase()} [{d.severity.toUpperCase()}]
                    </span>
                  </div>
                  {d.description && <p className="text-slate-500 text-[11px]">{d.description}</p>}
                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                    <span>Logged by {d.reported_by_name || 'QA'}</span>
                    {d.status !== 'resolved' && (
                      <button
                        onClick={() => handleResolveDefect(d.id)}
                        className="text-[11px] font-medium text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-[12px] text-slate-400">
              No defects recorded on this deliverable.
            </div>
          )}
        </div>

        {/* Audit Trail (6 cols) */}
        <div className="lg:col-span-6 glass-card rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-blue-500" />
              <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">Status History Audit</h3>
            </div>
            <span className="text-[11px] text-slate-400">Feeds Rework Calculation</span>
          </div>

          {task.history && task.history.length > 0 ? (
            <div className="relative pl-5 space-y-3.5 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {task.history.map((h, idx) => (
                <div key={h.id || idx} className="relative text-[12px] space-y-0.5">
                  <div className="absolute -left-5 top-1 w-2 h-2 rounded-full bg-slate-900 ring-4 ring-white" />
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span>
                      {h.old_status ? `${h.old_status.toUpperCase()} → ` : ''}
                      <span className="text-blue-600">{h.new_status.toUpperCase()}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {new Date(h.changed_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">By {h.changed_by_name || 'System'}</p>
                  {h.comment && (
                    <p className="p-2 bg-white/70 rounded-xl border border-black/[0.04] text-slate-600 text-[11px] italic mt-1">
                      "{h.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-[12px] text-slate-400">
              No historical transitions logged.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
