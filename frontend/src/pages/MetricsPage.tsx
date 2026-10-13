import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  ShieldCheck,
  Users
} from 'lucide-react';
import { api } from '../services/api';
import type { DashboardMetrics, MetricDefinition } from '../types';

export const MetricsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [definitions, setDefinitions] = useState<MetricDefinition[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mRes, dRes] = await Promise.all([
        api.getDashboardMetrics(startDate || undefined, endDate || undefined),
        api.getMetricDefinitions(),
      ]);
      setMetrics(mRes);
      setDefinitions(dRes.definitions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const s = metrics?.summary;

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getDef = (id: string) => definitions.find((d) => d.id === id);

  const renderMetricCard = (
    title: string,
    value: string | number,
    subtitle: string,
    defId?: string,
    defaultFormula?: string
  ) => {
    const def = defId ? getDef(defId) : null;
    const isExpanded = defId ? expandedId === defId : false;

    return (
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <h4 className="text-[13px] font-semibold text-slate-900 dark:text-zinc-100">{title}</h4>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">{subtitle}</p>
          </div>
          <span className="text-2xl font-semibold text-slate-900 dark:text-zinc-100 tabular-nums shrink-0">
            {loading ? '—' : value}
          </span>
        </div>

        {/* Small Formula pill */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] text-[11px] font-mono text-slate-600 dark:text-zinc-400">
          <span className="truncate">{def?.formula || defaultFormula || 'Formula calculated from database'}</span>
          {def && (
            <button
              onClick={() => toggleExpand(def.id)}
              className="text-[11px] font-sans text-slate-400 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200 shrink-0 ml-2 flex items-center gap-0.5 transition-colors"
            >
              <span>{isExpanded ? 'Less' : 'Formula details'}</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* Expandable Formula Explanation */}
        {def && isExpanded && (
          <div className="dialog-enter p-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.04] text-[11px] text-slate-600 dark:text-zinc-300 space-y-1.5 border border-black/[0.04] dark:border-white/[0.06]">
            <p><strong className="text-slate-800 dark:text-zinc-100">Data Rules:</strong> {def.treatment}</p>
            <p><strong className="text-slate-800 dark:text-zinc-100">Interpretation:</strong> {def.interpretation}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-7 max-w-6xl">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-black/[0.05] dark:border-white/[0.06]">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
            Metrics
          </h1>
          <p className="text-[13px] text-slate-500 dark:text-zinc-400 mt-0.5">
            Software metrics grounded in real-time SQLite database transactions.
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-slate-600 dark:text-zinc-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none text-[12px] text-slate-800 dark:text-zinc-200 focus:outline-hidden"
            />
            <span className="text-slate-300 dark:text-zinc-600">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none text-[12px] text-slate-800 dark:text-zinc-200 focus:outline-hidden"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 1. DELIVERY SECTION */}
      <section className="space-y-3.5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
          <h2 className="text-[14px] font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-wide text-xs">
            Delivery
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Task completion rate */}
          {renderMetricCard(
            'Task completion rate',
            `${s?.completion_rate ?? 0}%`,
            'Percentage of tasks marked as completed',
            'completion_rate',
            '(completed_tasks / total_tasks) * 100'
          )}

          {/* Throughput */}
          {renderMetricCard(
            'Throughput',
            `${s?.throughput ?? 0} tasks`,
            'Count of work items successfully closed',
            'throughput',
            'COUNT(id) WHERE status = "completed"'
          )}

          {/* Average cycle time */}
          {renderMetricCard(
            'Average cycle time',
            `${s?.avg_cycle_time_hours ?? 0} hrs`,
            'Mean time from task creation to completion',
            'cycle_time',
            'AVG(completed_at - created_at) [hours]'
          )}
        </div>
      </section>

      {/* 2. QUALITY SECTION */}
      <section className="space-y-3.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
          <h2 className="text-[14px] font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-wide text-xs">
            Quality
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Defect rate */}
          {renderMetricCard(
            'Defect rate',
            `${s?.defect_rate ?? 0}%`,
            'Proportion of completed tasks requiring defect logs',
            'defect_rate',
            '(tasks_with_defects / completed_tasks) * 100'
          )}

          {/* Rework rate */}
          {renderMetricCard(
            'Rework rate',
            `${s?.rework_rate ?? 0}%`,
            'Percentage of tasks reopened after completion',
            'rework_rate',
            '(tasks_with_rework / completed_tasks) * 100'
          )}
        </div>
      </section>

      {/* 3. WORKLOAD SECTION */}
      <section className="space-y-3.5">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
          <h2 className="text-[14px] font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-wide text-xs">
            Workload
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Overdue tasks metric card */}
          {renderMetricCard(
            'Overdue tasks',
            s?.overdue_count ?? 0,
            'Tasks currently past their targeted due date',
            'overdue_count',
            'COUNT(id) WHERE status != "completed" AND due_date < NOW()'
          )}

          {/* Active tasks by team member chart & breakdown (2 cols) */}
          <div className="md:col-span-2 glass-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[13px] font-semibold text-slate-900 dark:text-zinc-100">
                  Active tasks by team member
                </h4>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                  Current work-in-progress distribution across contributors
                </p>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500 tabular-nums">
                {metrics?.workload_distribution.reduce((acc, u) => acc + u.active_tasks, 0) || 0} active total
              </span>
            </div>

            {/* Workload horizontal representation */}
            {metrics?.workload_distribution && metrics.workload_distribution.length > 0 ? (
              <div className="space-y-2.5 pt-1">
                {metrics.workload_distribution.map((user) => {
                  const maxTasks = Math.max(
                    ...metrics.workload_distribution.map((u) => u.active_tasks),
                    1
                  );
                  const widthPercent = Math.round((user.active_tasks / maxTasks) * 100);

                  return (
                    <div key={user.user_id || user.user_name} className="space-y-1">
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="font-medium text-slate-800 dark:text-zinc-200">{user.user_name}</span>
                        <span className="text-slate-500 dark:text-zinc-400 tabular-nums text-[11px]">
                          {user.active_tasks} active • {user.completed_tasks} done
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-black/[0.04] dark:bg-white/[0.08] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-900 dark:bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-[12px] text-slate-400 dark:text-zinc-500">
                No active workload records available
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
