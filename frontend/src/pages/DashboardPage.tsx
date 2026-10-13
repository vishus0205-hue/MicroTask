import React, { useState, useEffect } from 'react';
import {
  Plus,
  ChevronRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { DashboardMetrics, Task, TaskPriority, TaskStatus } from '../types';

interface DashboardPageProps {
  onSelectTask: (id: number) => void;
  onNavigateToTasks: (filter?: string) => void;
  onOpenCreateTask?: () => void;
}

const MinimalTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-dropdown px-3 py-2 text-[12px] shadow-sm">
        {label && <p className="font-semibold text-slate-900 dark:text-zinc-100 mb-1">{label}</p>}
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-slate-600 dark:text-zinc-300">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span className="text-slate-500 dark:text-zinc-400">{entry.name}:</span>
            <span className="font-semibold text-slate-900 dark:text-zinc-100 tabular-nums">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onSelectTask,
  onNavigateToTasks,
  onOpenCreateTask,
}) => {
  const { hasRole } = useAuth();
  const { theme } = useTheme();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateFilterPreset, setDateFilterPreset] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const isDark = theme === 'dark';

  const loadData = async () => {
    setLoading(true);
    try {
      const [metricsRes, tasksRes] = await Promise.all([
        api.getDashboardMetrics(startDate || undefined, endDate || undefined),
        api.getTasks({ limit: 5, sort_by: 'created_at', order: 'desc' }),
      ]);
      setMetrics(metricsRes);
      setRecentTasks(tasksRes.tasks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const handlePresetChange = (preset: string) => {
    setDateFilterPreset(preset);
    const now = new Date();
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === '30days') {
      const past = new Date();
      past.setDate(now.getDate() - 30);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    }
  };

  const s = metrics?.summary;
  const activeTasks = (s?.todo_tasks || 0) + (s?.in_progress_tasks || 0);
  const completedTasks = s?.completed_tasks || 0;
  const avgCycleTime = s?.avg_cycle_time_hours ?? 0;
  const overdueTasks = s?.overdue_count || 0;

  // Status breakdown data for compact visualization
  const statusDistribution = [
    { name: 'To Do', value: s?.todo_tasks || 0, color: isDark ? '#71717a' : '#94a3b8' },
    { name: 'In Progress', value: s?.in_progress_tasks || 0, color: '#3b82f6' },
    { name: 'Completed', value: s?.completed_tasks || 0, color: '#10b981' },
    { name: 'Cancelled', value: s?.cancelled_tasks || 0, color: isDark ? '#3f3f46' : '#cbd5e1' },
  ].filter((item) => item.value > 0);

  const getPriorityDot = (p: TaskPriority) => {
    switch (p) {
      case 'critical':
        return <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" title="Critical" />;
      case 'high':
        return <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" title="High" />;
      case 'medium':
        return <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Medium" />;
      default:
        return <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-zinc-500 shrink-0" title="Low" />;
    }
  };

  const getStatusBadge = (st: TaskStatus) => {
    switch (st) {
      case 'completed':
        return (
          <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
            In Progress
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
            To Do
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* 1. First visible section: restrained heading, short description, date filter, 1 primary action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-black/[0.05] dark:border-white/[0.06]">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
            Overview
          </h1>
          <p className="text-[13px] text-slate-500 dark:text-zinc-400 mt-0.5">
            Essential software development velocity and task delivery metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Compact date-range filter */}
          <div className="inline-flex p-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-[12px] font-medium text-slate-600 dark:text-zinc-400">
            <button
              onClick={() => handlePresetChange('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                dateFilterPreset === 'all'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-2xs font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              All time
            </button>
            <button
              onClick={() => handlePresetChange('30days')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                dateFilterPreset === '30days'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-2xs font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              30 days
            </button>
            <button
              onClick={() => handlePresetChange('7days')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                dateFilterPreset === '7days'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-2xs font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              7 days
            </button>
          </div>

          {/* One primary action: New task */}
          {hasRole('admin', 'project_manager') && onOpenCreateTask && (
            <button
              onClick={onOpenCreateTask}
              className="btn-press inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New task</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Exactly four primary KPI indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Active tasks */}
        <div
          onClick={() => onNavigateToTasks('active')}
          className="glass-card-interactive p-4 cursor-pointer"
        >
          <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
            Active tasks
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-zinc-100 tabular-nums">
              {loading ? '—' : activeTasks}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-normal">To do & in progress</span>
          </div>
        </div>

        {/* Completed tasks */}
        <div
          onClick={() => onNavigateToTasks('completed')}
          className="glass-card-interactive p-4 cursor-pointer"
        >
          <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
            Completed tasks
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-zinc-100 tabular-nums">
              {loading ? '—' : completedTasks}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-normal">Finished</span>
          </div>
        </div>

        {/* Average cycle time */}
        <div className="glass-card p-4">
          <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
            Average cycle time
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-zinc-100 tabular-nums">
              {loading ? '—' : `${avgCycleTime}h`}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-normal">From creation to done</span>
          </div>
        </div>

        {/* Overdue tasks */}
        <div
          onClick={() => onNavigateToTasks('overdue')}
          className="glass-card-interactive p-4 cursor-pointer"
        >
          <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
            Overdue tasks
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl sm:text-3xl font-semibold tabular-nums ${overdueTasks > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-zinc-100'}`}>
              {loading ? '—' : overdueTasks}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-normal">Past due date</span>
          </div>
        </div>
      </div>

      {/* 3. Below KPIs: One primary throughput chart + One compact status visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Primary Chart: Weekly Task Throughput (2 cols) */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[14px] font-semibold text-slate-900 dark:text-zinc-100">
                Weekly task throughput
              </h2>
              <p className="text-[12px] text-slate-400 dark:text-zinc-500 mt-0.5">
                Completed work items per calendar week
              </p>
            </div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 tabular-nums">
              {metrics?.summary?.throughput || 0} completed
            </span>
          </div>

          <div className="h-56 w-full">
            {metrics?.weekly_throughput && metrics.weekly_throughput.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics.weekly_throughput}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                  />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 11, fill: isDark ? '#a1a1aa' : '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: isDark ? '#a1a1aa' : '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<MinimalTooltip />} />
                  <Bar
                    dataKey="completed_tasks"
                    name="Completed tasks"
                    fill={isDark ? '#3b82f6' : '#1d1d1f'}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[12px] text-slate-400 dark:text-zinc-500">
                No throughput data recorded for this period
              </div>
            )}
          </div>
        </div>

        {/* Compact Task-Status Visualization (1 col) */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-[14px] font-semibold text-slate-900 dark:text-zinc-100">
              Task status breakdown
            </h2>
            <p className="text-[12px] text-slate-400 dark:text-zinc-500 mt-0.5">
              Current state across all items
            </p>
          </div>

          <div className="h-36 my-2 flex items-center justify-center">
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    innerRadius={36}
                    outerRadius={56}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<MinimalTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-[12px] text-slate-400 dark:text-zinc-500">No active tasks</span>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
            {statusDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-zinc-300">{item.name}</span>
                </div>
                <span className="font-medium text-slate-900 dark:text-zinc-100 tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Short list of recent or upcoming tasks */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[14px] font-semibold text-slate-900 dark:text-zinc-100">
              Recent tasks
            </h2>
            <p className="text-[12px] text-slate-400 dark:text-zinc-500 mt-0.5">
              Latest items updated or assigned in the workspace
            </p>
          </div>
          <button
            onClick={() => onNavigateToTasks()}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTasks.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-slate-400 dark:text-zinc-500">
            No recent tasks found.
          </div>
        ) : (
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
            {recentTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onSelectTask(task.id)}
                className="py-2.5 flex items-center justify-between gap-3 hover:bg-black/[0.015] dark:hover:bg-white/[0.03] px-2 -mx-2 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {getPriorityDot(task.priority)}
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-slate-900 dark:text-zinc-100 truncate">
                      {task.title}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">
                      #{task.id} • Assigned to {task.assigned_to_name || 'Unassigned'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {getStatusBadge(task.status)}
                  {task.due_date && (
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500 hidden sm:inline tabular-nums">
                      Due {new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
