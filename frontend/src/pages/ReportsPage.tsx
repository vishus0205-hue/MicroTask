import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  Clock,
  Bug,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import type { ReportSummary, Task, User as UserModel } from '../types';

export const ReportsPage: React.FC = () => {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  const [users, setUsers] = useState<UserModel[]>([]);

  useEffect(() => {
    api.getUsers().then((res) => setUsers(res.users)).catch(() => {});
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const filterParams = {
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        status: status || undefined,
        priority: priority || undefined,
        assigned_to_id: assigneeId || undefined,
      };

      const [sumRes, tasksRes] = await Promise.all([
        api.getReportSummary(filterParams),
        api.getReportTasks(filterParams),
      ]);
      setSummary(sumRes.summary);
      setTasks(tasksRes.tasks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [dateFrom, dateTo, status, priority, assigneeId]);

  const handleExportCsv = () => {
    const filterParams = {
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      status: status || undefined,
      priority: priority || undefined,
      assigned_to_id: assigneeId || undefined,
    };
    const exportUrl = api.getCsvExportUrl(filterParams);
    window.open(exportUrl, '_blank');
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Banner and Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-black/[0.05]">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
            Reports
          </h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Filtered summaries and CSV export.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="btn-press inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter Parameters Surface */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter Parameters</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 text-[11px] mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-white/70 border border-black/[0.06] text-slate-700"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-white/70 border border-black/[0.06] text-slate-700"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-white/70 border border-black/[0.06] text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-white/70 border border-black/[0.06] text-slate-700"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1">Assignee</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-white/70 border border-black/[0.06] text-slate-700"
            >
              <option value="">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards for Filter */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-medium text-slate-400 block">Filtered Tasks</span>
          <span className="text-2xl font-bold text-slate-900 tabular-nums block">{summary?.total_tasks || 0}</span>
          <span className="text-[11px] text-slate-500 block">{summary?.completed_tasks || 0} completed</span>
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-medium text-slate-400 block">Logged Hours</span>
          <span className="text-2xl font-bold text-slate-900 tabular-nums block">{summary?.total_actual_hours || 0}h</span>
          <span className="text-[11px] text-slate-500 block">vs {summary?.total_estimated_hours || 0}h est.</span>
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-medium text-slate-400 block">Overdue in Filter</span>
          <span className={`text-2xl font-bold tabular-nums block ${(summary?.overdue_tasks || 0) > 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {summary?.overdue_tasks || 0}
          </span>
          <span className="text-[11px] text-slate-500 block">Behind deadline</span>
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-medium text-slate-400 block">Associated Defects</span>
          <span className="text-2xl font-bold text-slate-900 tabular-nums block">{summary?.total_defects || 0}</span>
          <span className="text-[11px] text-slate-500 block">Quality issues</span>
        </div>
      </div>

      {/* Preview Table */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-black/[0.04] flex items-center justify-between">
          <span className="text-[12px] font-semibold text-slate-700">
            Export Preview ({tasks.length} rows)
          </span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-black/[0.04] text-[11px] text-slate-400 font-semibold uppercase">
              <tr>
                <th className="py-2.5 px-4">ID</th>
                <th className="py-2.5 px-3">Title</th>
                <th className="py-2.5 px-3">Assignee</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Logged</th>
                <th className="py-2.5 px-3">Defects</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.03]">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No tasks match the active filters.
                  </td>
                </tr>
              ) : (
                tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-black/[0.015]">
                    <td className="py-2.5 px-4 font-mono text-slate-400">#{t.id}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{t.title}</td>
                    <td className="py-2.5 px-3 text-slate-600">{t.assigned_to_name || 'Unassigned'}</td>
                    <td className="py-2.5 px-3 uppercase text-[10px] font-medium">{t.priority}</td>
                    <td className="py-2.5 px-3 text-slate-700">{t.status.replace('_', ' ')}</td>
                    <td className="py-2.5 px-3 tabular-nums">{t.actual_hours}h</td>
                    <td className="py-2.5 px-3 tabular-nums">{t.defect_count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
