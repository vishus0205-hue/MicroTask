import React, { useState, useEffect } from 'react';
import {
  Compass,
  Clock,
  TrendingUp,
  AlertTriangle,
  Bug,
  RotateCcw,
  Calendar,
  CheckCircle2,
  ArrowUpRight,
  ArrowRight,
  Layers,
  Sparkles,
  RefreshCw,
  ListTodo
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
import type { DashboardMetrics, Task } from '../types';

interface DashboardPageProps {
  onSelectTask: (id: number) => void;
  onNavigateToTasks: (filter?: string) => void;
}

const AppleChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-dialog px-3.5 py-2.5 rounded-xl text-[12px] shadow-md border border-white/90">
        {label && <p className="font-semibold text-slate-900 mb-1">{label}</p>}
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-slate-600">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span className="text-slate-500">{entry.name}:</span>
            <span className="font-semibold text-slate-900 tabular-nums">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectTask, onNavigateToTasks }) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateFilterPreset, setDateFilterPreset] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [metricsRes, tasksRes, overdueRes] = await Promise.all([
        api.getDashboardMetrics(startDate || undefined, endDate || undefined),
        api.getTasks({ limit: 5, sort_by: 'created_at', order: 'desc' }),
        api.getTasks({ overdue: true, limit: 4 }),
      ]);
      setMetrics(metricsRes);
      setRecentTasks(tasksRes.tasks);
      setOverdueTasks(overdueRes.tasks);
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const s = metrics?.summary;
  const completionRate = s?.completion_rate || 0;
  const activeCount = (s?.in_progress_tasks || 0) + (s?.todo_tasks || 0);

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Top Header & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
        <div>
          <div className="text-[13px] font-medium text-slate-400 mb-1">
            {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Engineer'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Project Overview
          </h1>
          <p className="text-[13px] text-slate-500 mt-1 max-w-xl">
            Live telemetry and software metrics derived from SQLite production records.
          </p>
        </div>

        {/* Date Filter Segmented Pill Control */}
        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 rounded-full glass-card border border-black/[0.04] text-[12px] font-medium shadow-2xs">
            <button
              onClick={() => handlePresetChange('all')}
              className={`px-3 py-1 rounded-full transition-all duration-150 ${
                dateFilterPreset === 'all'
                  ? 'bg-slate-900 text-white shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => handlePresetChange('30days')}
              className={`px-3 py-1 rounded-full transition-all duration-150 ${
                dateFilterPreset === '30days'
                  ? 'bg-slate-900 text-white shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => handlePresetChange('7days')}
              className={`px-3 py-1 rounded-full transition-all duration-150 ${
                dateFilterPreset === '7days'
                  ? 'bg-slate-900 text-white shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Last 7 Days
            </button>
          </div>

          <button
            onClick={loadData}
            title="Refresh Data"
            className="p-2 rounded-full glass-card hover:bg-black/[0.03] text-slate-400 hover:text-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* HERO SECTION: Project Summary & Completion Ring */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100/60 text-blue-700 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              Active Sprint Iteration • Sprint 14
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-snug">
              {completionRate >= 70
                ? 'Sprint cadence is on track with steady deliverable throughput.'
                : 'Sprint delivery in progress with active work items ongoing.'}
            </h2>

            <p className="text-[13px] text-slate-500 leading-relaxed max-w-2xl">
              {s?.completed_tasks || 0} of {s?.eligible_tasks || 0} eligible tasks completed. Average team cycle time stands at{' '}
              <strong className="text-slate-800">{s?.avg_cycle_time_hours || 0} hours</strong> with{' '}
              <strong className="text-slate-800">{s?.throughput || 0} units</strong> verified.
            </p>

            {/* Apple-style Multi-segment Progress Bar */}
            <div className="space-y-2 pt-2 max-w-xl">
              <div className="flex justify-between text-[12px] font-medium text-slate-500">
                <span>Completion Status</span>
                <span className="font-semibold text-slate-900 tabular-nums">{completionRate}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-black/[0.04]">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, completionRate))}%` }}
                />
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" /> {s?.completed_tasks || 0} Completed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300" /> {activeCount} In Flight
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400" /> {s?.overdue_count || 0} Behind Schedule
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stat Pill Grid */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-3">
            <div className="glass-card-subtle p-4 rounded-2xl space-y-1">
              <span className="text-[11px] font-medium text-slate-400 block">Active Backlog</span>
              <span className="text-2xl font-bold text-slate-900 tabular-nums block">{activeCount}</span>
              <span className="text-[11px] text-slate-500 block">Tasks in progress</span>
            </div>

            <div className="glass-card-subtle p-4 rounded-2xl space-y-1">
              <span className="text-[11px] font-medium text-slate-400 block">Cycle Velocity</span>
              <span className="text-2xl font-bold text-slate-900 tabular-nums block">{s?.avg_cycle_time_hours || 0}h</span>
              <span className="text-[11px] text-slate-500 block">Avg turnaround</span>
            </div>

            <div className="glass-card-subtle p-4 rounded-2xl space-y-1">
              <span className="text-[11px] font-medium text-slate-400 block">Quality Defect</span>
              <span className="text-2xl font-bold text-slate-900 tabular-nums block">{s?.defect_rate || 0}%</span>
              <span className="text-[11px] text-slate-500 block">On completed</span>
            </div>

            <div className="glass-card-subtle p-4 rounded-2xl space-y-1">
              <span className="text-[11px] font-medium text-slate-400 block">Rework Rate</span>
              <span className="text-2xl font-bold text-slate-900 tabular-nums block">{s?.rework_rate || 0}%</span>
              <span className="text-[11px] text-slate-500 block">Reopened tasks</span>
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS ROW: Weekly Throughput & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Throughput (8 cols) */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">Delivery Throughput</h3>
              <p className="text-[12px] text-slate-400 mt-0.5">Verified engineering deliverables by ISO week</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              {s?.throughput || 0} Total Units
            </span>
          </div>

          <div className="h-64 pt-2">
            {metrics?.weekly_throughput && metrics.weekly_throughput.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.weekly_throughput} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#e5e5ea" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#8e8e93' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#8e8e93' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<AppleChartTooltip />} />
                  <Bar dataKey="completed_tasks" name="Delivered Tasks" fill="#0071e3" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                No completion throughput records in selected date range.
              </div>
            )}
          </div>
        </div>

        {/* Task Status Distribution (5 cols) */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-6 space-y-4">
          <div>
            <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">Task Distribution</h3>
            <p className="text-[12px] text-slate-400 mt-0.5">Proportion across lifecycle states</p>
          </div>

          <div className="h-64 flex items-center justify-center">
            {metrics?.status_distribution && metrics.status_distribution.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.status_distribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {metrics.status_distribution.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={
                          entry.key === 'completed'
                            ? '#34c759'
                            : entry.key === 'in_progress'
                            ? '#0071e3'
                            : entry.key === 'cancelled'
                            ? '#ff3b30'
                            : '#8e8e93'
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<AppleChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No task status data available</div>
            )}
          </div>

          {/* Clean minimal legend below donut */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-black/[0.04] text-[11px]">
            {metrics?.status_distribution.map((item) => (
              <div key={item.key} className="flex items-center justify-between text-slate-600 px-2 py-1">
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        item.key === 'completed'
                          ? '#34c759'
                          : item.key === 'in_progress'
                          ? '#0071e3'
                          : item.key === 'cancelled'
                          ? '#ff3b30'
                          : '#8e8e93',
                    }}
                  />
                  <span>{item.status}</span>
                </span>
                <span className="font-semibold text-slate-900 tabular-nums">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LOWER SECTION: Workload & Cycle Time */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Workload Allocation per Member */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">Active Workload by Engineer</h3>
              <p className="text-[12px] text-slate-400 mt-0.5">Tasks currently assigned (In Progress + To Do)</p>
            </div>
          </div>

          <div className="h-64">
            {metrics?.workload_distribution && metrics.workload_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics.workload_distribution}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 25, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="2 4" horizontal={false} stroke="#e5e5ea" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#8e8e93' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="user_name" width={115} tick={{ fontSize: 11, fill: '#1d1d1f' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<AppleChartTooltip />} />
                  <Bar dataKey="in_progress_tasks" name="In Progress" stackId="a" fill="#0071e3" />
                  <Bar dataKey="todo_tasks" name="To Do" stackId="a" fill="#c7c7cc" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                No active workload records.
              </div>
            )}
          </div>
        </div>

        {/* Cycle Time Histogram */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-6 space-y-4">
          <div>
            <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">Cycle Time Dispersion</h3>
            <p className="text-[12px] text-slate-400 mt-0.5">Distribution of completed task turnaround durations</p>
          </div>

          <div className="h-64">
            {metrics?.cycle_time_distribution && metrics.cycle_time_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.cycle_time_distribution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#e5e5ea" />
                  <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#8e8e93' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#8e8e93' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<AppleChartTooltip />} />
                  <Bar dataKey="count" name="Tasks" fill="#30b0c7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                No cycle time data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SUPPORTING SECTIONS: Overdue Attention & Recent Task Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Overdue Watchlist */}
        <div className="lg:col-span-6 glass-card rounded-3xl p-6 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">Overdue Attention Items</h3>
            </div>
            <button
              onClick={() => onNavigateToTasks('overdue')}
              className="text-[12px] font-medium text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {overdueTasks.length === 0 ? (
              <div className="py-8 text-center text-[12px] text-slate-400">
                No overdue tasks. All deadlines are on track.
              </div>
            ) : (
              overdueTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onSelectTask(t.id)}
                  className="p-3.5 rounded-2xl bg-white/70 hover:bg-white border border-black/[0.04] transition-all cursor-pointer flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-3">
                    <p className="font-semibold text-slate-900 truncate">{t.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Assignee: {t.assigned_to_name || 'Unassigned'} • Due: {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'None'}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-red-600 bg-red-50 rounded-full border border-red-100 shrink-0">
                    Overdue
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Task Activity */}
        <div className="lg:col-span-6 glass-card rounded-3xl p-6 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">Recent Activity Stream</h3>
            <button
              onClick={() => onNavigateToTasks()}
              className="text-[12px] font-medium text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1"
            >
              All tasks <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {recentTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => onSelectTask(t.id)}
                className="p-3.5 rounded-2xl bg-white/70 hover:bg-white border border-black/[0.04] transition-all cursor-pointer flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-3">
                  <p className="font-semibold text-slate-900 truncate">{t.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {t.assigned_to_name || 'Unassigned'} • {t.priority.toUpperCase()} priority
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] font-medium rounded-full shrink-0 ${
                    t.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : t.status === 'in_progress'
                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                      : t.status === 'cancelled'
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-slate-50 text-slate-600 border border-slate-200'
                  }`}
                >
                  {t.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
